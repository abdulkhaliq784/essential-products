-- =============================================================================
-- 002_rls_policies.sql : Row Level Security
-- -----------------------------------------------------------------------------
-- Run this SECOND (after 001_schema.sql).
--
-- Row Level Security (RLS) means that every query from the website runs as
-- the logged-in user, and Postgres itself only returns or changes the rows
-- that the policies below allow. The rules are:
--
--   * Everyone (even logged-out visitors) can read categories and ACTIVE products.
--   * Customers can only see and change their own profile, addresses and cart.
--   * Customers can only READ their own orders, order items and payments.
--     They can never create or modify orders directly; the server does that
--     with the service role key (which bypasses RLS) after checking prices.
--   * Admins can manage products and categories, and view and update all orders.
--
-- Safe to re-run: every policy is dropped first and then created again.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Helper: is the current user an admin?
-- SECURITY DEFINER lets it read profiles without triggering profiles' own RLS
-- (which would otherwise cause infinite recursion).
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

grant execute on function public.is_admin() to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Enable RLS on every table
-- ---------------------------------------------------------------------------
alter table public.profiles    enable row level security;
alter table public.categories  enable row level security;
alter table public.products    enable row level security;
alter table public.addresses   enable row level security;
alter table public.cart_items  enable row level security;
alter table public.orders      enable row level security;
alter table public.order_items enable row level security;
alter table public.payments    enable row level security;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
drop policy if exists "profiles: read own"        on public.profiles;
drop policy if exists "profiles: update own"      on public.profiles;
drop policy if exists "profiles: admin read all"  on public.profiles;

create policy "profiles: read own" on public.profiles
  for select to authenticated using (id = auth.uid());

-- Users may edit their name/phone. Changing "role" is blocked by a trigger in 003.
create policy "profiles: update own" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy "profiles: admin read all" on public.profiles
  for select to authenticated using (public.is_admin());

-- (No insert policy: rows are created by the handle_new_user trigger.)

-- ---------------------------------------------------------------------------
-- categories
-- ---------------------------------------------------------------------------
drop policy if exists "categories: public read"  on public.categories;
drop policy if exists "categories: admin write"  on public.categories;

create policy "categories: public read" on public.categories
  for select to anon, authenticated using (true);

create policy "categories: admin write" on public.categories
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- products
-- ---------------------------------------------------------------------------
drop policy if exists "products: public read active" on public.products;
drop policy if exists "products: admin read all"     on public.products;
drop policy if exists "products: admin write"        on public.products;

create policy "products: public read active" on public.products
  for select to anon, authenticated using (is_active);

create policy "products: admin read all" on public.products
  for select to authenticated using (public.is_admin());

create policy "products: admin write" on public.products
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- addresses (owner only)
-- ---------------------------------------------------------------------------
drop policy if exists "addresses: owner all"      on public.addresses;
drop policy if exists "addresses: admin read all" on public.addresses;

create policy "addresses: owner all" on public.addresses
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "addresses: admin read all" on public.addresses
  for select to authenticated using (public.is_admin());

-- ---------------------------------------------------------------------------
-- cart_items (owner only)
-- ---------------------------------------------------------------------------
drop policy if exists "cart: owner all" on public.cart_items;

create policy "cart: owner all" on public.cart_items
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- orders: customers read own; admins read all and update (status changes).
-- Inserts and payment updates are done by the server with the service role.
-- ---------------------------------------------------------------------------
drop policy if exists "orders: owner read"   on public.orders;
drop policy if exists "orders: admin read"   on public.orders;
drop policy if exists "orders: admin update" on public.orders;

create policy "orders: owner read" on public.orders
  for select to authenticated using (user_id = auth.uid());

create policy "orders: admin read" on public.orders
  for select to authenticated using (public.is_admin());

create policy "orders: admin update" on public.orders
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- order_items: readable if you can read the parent order
-- ---------------------------------------------------------------------------
drop policy if exists "order_items: owner read" on public.order_items;
drop policy if exists "order_items: admin read" on public.order_items;

create policy "order_items: owner read" on public.order_items
  for select to authenticated using (
    exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
  );

create policy "order_items: admin read" on public.order_items
  for select to authenticated using (public.is_admin());

-- ---------------------------------------------------------------------------
-- payments: readable if you own the order; admins read all
-- ---------------------------------------------------------------------------
drop policy if exists "payments: owner read" on public.payments;
drop policy if exists "payments: admin read" on public.payments;

create policy "payments: owner read" on public.payments
  for select to authenticated using (
    exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
  );

create policy "payments: admin read" on public.payments
  for select to authenticated using (public.is_admin());
