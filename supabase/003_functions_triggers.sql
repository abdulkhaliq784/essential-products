-- =============================================================================
-- 003_functions_triggers.sql : database functions and triggers
-- -----------------------------------------------------------------------------
-- Run this THIRD (after 002_rls_policies.sql). Safe to re-run.
--
--   1. handle_new_user()       - creates a profiles row whenever someone signs up
--   2. prevent_role_change()   - stops non-admins from making themselves admin
--   3. restrict_order_update() - admins may only change an order's STATUS
--   4. generate_order_number() - human-friendly order numbers (EP-YYYYMMDD-XXXXXX)
--   5. mark_order_paid()       - atomically marks an order paid and reduces stock
--   6. search_products()       - simple product search
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Auto-create a profile when a new auth user signs up.
--    full_name / phone come from the metadata sent by the sign-up form.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (
    new.id,
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'phone', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill profiles for any users that signed up before this trigger existed.
insert into public.profiles (id, full_name)
select u.id, u.raw_user_meta_data ->> 'full_name'
from auth.users u
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- 2. Only admins (or you, in the SQL Editor) can change a user's role.
--    In the SQL Editor auth.uid() is NULL, so promoting yourself there works.
-- ---------------------------------------------------------------------------
create or replace function public.prevent_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role
     and auth.uid() is not null
     and not public.is_admin() then
    raise exception 'You are not allowed to change user roles';
  end if;
  return new;
end;
$$;

drop trigger if exists prevent_role_change on public.profiles;
create trigger prevent_role_change
  before update on public.profiles
  for each row execute function public.prevent_role_change();

-- ---------------------------------------------------------------------------
-- 3. When an admin updates an order from the website, only "status" may
--    change. Amounts, address, payment info etc. are kept as they were.
--    (The server's service-role updates have auth.uid() = NULL and are unaffected.)
-- ---------------------------------------------------------------------------
create or replace function public.restrict_order_update()
returns trigger
language plpgsql
as $$
begin
  if auth.uid() is not null then
    new.order_number      := old.order_number;
    new.user_id           := old.user_id;
    new.subtotal_paise    := old.subtotal_paise;
    new.shipping_paise    := old.shipping_paise;
    new.total_paise       := old.total_paise;
    new.shipping_address  := old.shipping_address;
    new.razorpay_order_id := old.razorpay_order_id;
    new.stock_short       := old.stock_short;
    new.paid_at           := old.paid_at;
    new.created_at        := old.created_at;
  end if;
  return new;
end;
$$;

drop trigger if exists restrict_order_update on public.orders;
create trigger restrict_order_update
  before update on public.orders
  for each row execute function public.restrict_order_update();

-- ---------------------------------------------------------------------------
-- 4. Order numbers like EP-20261014-4F7K2Q (date in Indian time).
-- ---------------------------------------------------------------------------
create or replace function public.generate_order_number()
returns text
language sql
volatile
as $$
  select 'EP-'
      || to_char(now() at time zone 'Asia/Kolkata', 'YYYYMMDD')
      || '-'
      || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
$$;

alter table public.orders
  alter column order_number set default public.generate_order_number();

-- ---------------------------------------------------------------------------
-- 5. mark_order_paid: called by the server after the Razorpay signature has
--    been verified (from both the /verify API and the webhook).
--
--    * Locks the order row so two simultaneous calls can't both run.
--    * Idempotent: if the order is already paid, it does nothing.
--    * Checks that the amount paid equals the order total.
--    * Records the payment, marks the order paid, reduces stock, and clears
--      the purchased items from the customer's cart.
--    * If stock ran out in the meantime, stock is clamped at 0 and the order
--      is flagged stock_short = true so the admin can follow up / refund.
--
--    Only the service role (the server) may call it.
-- ---------------------------------------------------------------------------
create or replace function public.mark_order_paid(
  p_razorpay_order_id   text,
  p_razorpay_payment_id text,
  p_amount_paise        int,
  p_payment_status      text,
  p_method              text,
  p_raw                 jsonb
)
returns table (order_id uuid, already_paid boolean)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  v_order  public.orders%rowtype;
  v_item   record;
  v_short  boolean := false;
begin
  select * into v_order
  from public.orders o
  where o.razorpay_order_id = p_razorpay_order_id
  for update;

  if not found then
    raise exception 'Order not found for razorpay_order_id %', p_razorpay_order_id;
  end if;

  if v_order.status in ('paid', 'processing', 'shipped', 'delivered') then
    order_id := v_order.id; already_paid := true;
    return next; return;
  end if;

  if p_amount_paise <> v_order.total_paise then
    raise exception 'Amount mismatch: paid %, expected %', p_amount_paise, v_order.total_paise;
  end if;

  insert into public.payments (order_id, razorpay_payment_id, razorpay_order_id,
                               amount_paise, status, method, raw)
  values (v_order.id, p_razorpay_payment_id, p_razorpay_order_id,
          p_amount_paise, p_payment_status, p_method, p_raw)
  on conflict (razorpay_payment_id) do nothing;

  -- Reduce stock (lock product rows in a stable order to avoid deadlocks)
  for v_item in
    select oi.product_id, oi.quantity, p.stock
    from public.order_items oi
    join public.products p on p.id = oi.product_id
    where oi.order_id = v_order.id
    order by oi.product_id
    for update of p
  loop
    if v_item.stock < v_item.quantity then
      v_short := true;
    end if;
    update public.products
       set stock = greatest(stock - v_item.quantity, 0)
     where id = v_item.product_id;
  end loop;

  update public.orders
     set status = 'paid', paid_at = now(), stock_short = v_short
   where id = v_order.id;

  delete from public.cart_items c
   where c.user_id = v_order.user_id
     and c.product_id in (select oi.product_id from public.order_items oi where oi.order_id = v_order.id);

  order_id := v_order.id; already_paid := false;
  return next;
end;
$$;

revoke all on function public.mark_order_paid(text, text, int, text, text, jsonb) from public, anon, authenticated;
grant execute on function public.mark_order_paid(text, text, int, text, text, jsonb) to service_role;

-- ---------------------------------------------------------------------------
-- 6. search_products: case-insensitive search on name and description.
--    SECURITY INVOKER (default) so RLS still applies: only active products.
-- ---------------------------------------------------------------------------
create or replace function public.search_products(q text)
returns setof public.products
language sql
stable
as $$
  select *
  from public.products p
  where p.is_active
    and (
      p.name ilike '%' || replace(replace(q, '%', '\%'), '_', '\_') || '%'
      or p.description ilike '%' || replace(replace(q, '%', '\%'), '_', '\_') || '%'
    )
  order by p.name
  limit 50;
$$;

grant execute on function public.search_products(text) to anon, authenticated;
