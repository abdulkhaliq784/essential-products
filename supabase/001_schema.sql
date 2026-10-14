-- =============================================================================
-- 001_schema.sql : Essential Products - tables, types, indexes
-- -----------------------------------------------------------------------------
-- Run this FIRST in the Supabase SQL Editor on a fresh project.
-- It is written to be safe to re-run (uses IF NOT EXISTS where possible).
--
-- Conventions:
--   * All money is stored as INTEGER PAISE (1 rupee = 100 paise).
--     e.g. Rs 299.00 is stored as 29900. This avoids rounding errors and is
--     exactly what Razorpay expects.
--   * Every table has created_at; mutable tables also have updated_at, kept
--     current by the set_updated_at() trigger defined at the bottom.
-- =============================================================================

create extension if not exists pgcrypto;  -- gen_random_uuid()
create extension if not exists pg_trgm;   -- fast ILIKE search on product names

-- ---------------------------------------------------------------------------
-- Enum types
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.user_role as enum ('customer', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.order_status as enum (
    'pending',         -- order created, waiting for payment
    'paid',            -- payment verified
    'processing',      -- being packed
    'shipped',
    'delivered',
    'cancelled',
    'payment_failed'
  );
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- profiles: one row per auth user (created automatically by a trigger in 003)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text,
  phone       text,
  role        public.user_role not null default 'customer',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- categories
-- ---------------------------------------------------------------------------
create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,
  description text,
  image_url   text,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- products
-- ---------------------------------------------------------------------------
create table if not exists public.products (
  id           uuid primary key default gen_random_uuid(),
  category_id  uuid not null references public.categories (id) on delete restrict,
  slug         text not null unique,
  name         text not null,
  description  text not null default '',
  price_paise  int  not null check (price_paise > 0),
  mrp_paise    int  check (mrp_paise is null or mrp_paise >= price_paise), -- optional "was" price
  stock        int  not null default 0 check (stock >= 0),
  images       text[] not null default '{}',  -- image paths (/images/...) or Supabase Storage URLs
  is_active    boolean not null default true,   -- inactive products are hidden from customers
  is_featured  boolean not null default false,  -- shown on the home page
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists products_category_id_idx on public.products (category_id);
create index if not exists products_featured_idx    on public.products (is_featured) where is_active;
create index if not exists products_name_trgm_idx   on public.products using gin (name gin_trgm_ops);

-- ---------------------------------------------------------------------------
-- addresses: saved Indian shipping addresses
-- ---------------------------------------------------------------------------
create table if not exists public.addresses (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  full_name   text not null,
  phone       text not null check (phone ~ '^[6-9][0-9]{9}$'),    -- 10-digit Indian mobile
  line1       text not null,
  line2       text,
  landmark    text,
  city        text not null,
  state       text not null,
  pincode     text not null check (pincode ~ '^[1-9][0-9]{5}$'),  -- 6-digit PIN code
  is_default  boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists addresses_user_id_idx on public.addresses (user_id);

-- ---------------------------------------------------------------------------
-- cart_items: the logged-in user's cart (guests keep their cart in the browser)
-- ---------------------------------------------------------------------------
create table if not exists public.cart_items (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  product_id  uuid not null references public.products (id) on delete cascade,
  quantity    int  not null check (quantity > 0 and quantity <= 99),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, product_id)
);

create index if not exists cart_items_product_id_idx on public.cart_items (product_id);

-- ---------------------------------------------------------------------------
-- orders
-- ---------------------------------------------------------------------------
create table if not exists public.orders (
  id                 uuid primary key default gen_random_uuid(),
  order_number       text not null unique,       -- human-friendly, e.g. EP-20261014-4F7K2Q
  user_id            uuid not null references auth.users (id) on delete restrict,
  status             public.order_status not null default 'pending',
  subtotal_paise     int not null check (subtotal_paise >= 0),
  shipping_paise     int not null check (shipping_paise >= 0),
  total_paise        int not null check (total_paise > 0),
  shipping_address   jsonb not null,             -- snapshot of the address at order time
  razorpay_order_id  text unique,
  stock_short        boolean not null default false, -- true if stock ran out before payment completed
  paid_at            timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists orders_user_id_created_idx on public.orders (user_id, created_at desc);
create index if not exists orders_status_idx          on public.orders (status);

-- ---------------------------------------------------------------------------
-- order_items: product name and price are COPIED here at purchase time,
-- so later price changes never affect past orders.
-- ---------------------------------------------------------------------------
create table if not exists public.order_items (
  id                uuid primary key default gen_random_uuid(),
  order_id          uuid not null references public.orders (id) on delete cascade,
  product_id        uuid references public.products (id) on delete set null,
  product_name      text not null,
  product_image     text,
  unit_price_paise  int not null check (unit_price_paise > 0),
  quantity          int not null check (quantity > 0),
  line_total_paise  int not null check (line_total_paise > 0),
  created_at        timestamptz not null default now()
);

create index if not exists order_items_order_id_idx   on public.order_items (order_id);
create index if not exists order_items_product_id_idx on public.order_items (product_id);

-- ---------------------------------------------------------------------------
-- payments: one row per successful Razorpay payment (written by the server)
-- ---------------------------------------------------------------------------
create table if not exists public.payments (
  id                   uuid primary key default gen_random_uuid(),
  order_id             uuid not null references public.orders (id) on delete cascade,
  razorpay_payment_id  text not null unique,
  razorpay_order_id    text not null,
  amount_paise         int not null,
  status               text not null,          -- e.g. 'captured'
  method               text,                   -- e.g. 'upi', 'card'
  raw                  jsonb,                  -- full payment payload for reference
  created_at           timestamptz not null default now()
);

create index if not exists payments_order_id_idx on public.payments (order_id);

-- ---------------------------------------------------------------------------
-- updated_at trigger (shared by all tables that have updated_at)
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare t text;
begin
  foreach t in array array['profiles','categories','products','addresses','cart_items','orders']
  loop
    execute format('drop trigger if exists set_updated_at on public.%I', t);
    execute format(
      'create trigger set_updated_at before update on public.%I
         for each row execute function public.set_updated_at()', t);
  end loop;
end $$;
