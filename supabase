-- ============================================================
-- TESLA EV RENTAL APP — INITIAL SCHEMA
-- ============================================================

-- Enable UUID extension
create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- 1. USERS
-- ------------------------------------------------------------
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null unique,
  password_hash text not null,
  balance numeric(14,2) not null default 0,
  total_deposited numeric(14,2) not null default 0,
  bound_phone text,
  bound_full_name text,
  is_bound boolean not null default false,
  referral_code text unique not null,
  referred_by uuid references public.users(id) on delete set null,
  welcome_bonus_credited boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_users_phone on public.users(phone);
create index if not exists idx_users_referral_code on public.users(referral_code);
create index if not exists idx_users_referred_by on public.users(referred_by);

-- ------------------------------------------------------------
-- 2. TESLA PRODUCTS
-- ------------------------------------------------------------
create table if not exists public.tesla_products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  subtitle text default 'Everyday electric performance',
  price numeric(14,2) not null,
  daily_profit numeric(14,2) not null,
  duration_days int not null default 100,
  image_url text,
  tag text default '100 days',
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 3. TESLA RENTALS
-- ------------------------------------------------------------
create table if not exists public.tesla_rentals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  product_id uuid not null references public.tesla_products(id) on delete restrict,
  price_paid numeric(14,2) not null,
  daily_profit numeric(14,2) not null,
  duration_days int not null,
  days_remaining int not null,
  total_earned numeric(14,2) not null default 0,
  start_at timestamptz not null default now(),
  last_credit_at timestamptz not null default now(),
  status text not null default 'active', -- active | completed
  created_at timestamptz not null default now()
);

create index if not exists idx_rentals_user on public.tesla_rentals(user_id);
create index if not exists idx_rentals_status on public.tesla_rentals(status);
create index if not exists idx_rentals_last_credit on public.tesla_rentals(last_credit_at);

-- ------------------------------------------------------------
-- 4. TRANSACTIONS (unified ledger)
-- ------------------------------------------------------------
create table if not exists public.tesla_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  type text not null, -- deposit | withdrawal | rental | daily | ref_bonus | checkin | welcome
  amount numeric(14,2) not null,
  status text not null default 'completed', -- pending | completed | rejected
  meta jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_tx_user on public.tesla_transactions(user_id);
create index if not exists idx_tx_type on public.tesla_transactions(type);

-- ------------------------------------------------------------
-- 5. DEPOSITS
-- ------------------------------------------------------------
create table if not exists public.tesla_deposits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  amount numeric(14,2) not null,
  status text not null default 'pending', -- pending | approved | rejected
  reference text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create index if not exists idx_dep_user on public.tesla_deposits(user_id);
create index if not exists idx_dep_status on public.tesla_deposits(status);

-- ------------------------------------------------------------
-- 6. WITHDRAWALS
-- ------------------------------------------------------------
create table if not exists public.tesla_withdrawals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  amount numeric(14,2) not null,
  status text not null default 'pending', -- pending | approved | rejected
  phone text,
  full_name text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create index if not exists idx_wd_user on public.tesla_withdrawals(user_id);
create index if not exists idx_wd_status on public.tesla_withdrawals(status);

-- ------------------------------------------------------------
-- 7. REFERRALS
-- ------------------------------------------------------------
create table if not exists public.tesla_referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references public.users(id) on delete cascade,
  referred_id uuid not null references public.users(id) on delete cascade,
  level int not null, -- 1 | 2 | 3
  earnings numeric(14,2) not null default 0,
  created_at timestamptz not null default now(),
  unique(referrer_id, referred_id, level)
);

create index if not exists idx_ref_referrer on public.tesla_referrals(referrer_id);
create index if not exists idx_ref_referred on public.tesla_referrals(referred_id);

-- ------------------------------------------------------------
-- 8. DAILY CHECK-INS
-- ------------------------------------------------------------
create table if not exists public.tesla_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  amount numeric(14,2) not null default 100,
  claimed_at timestamptz not null default now()
);

create index if not exists idx_checkin_user on public.tesla_checkins(user_id);
create index if not exists idx_checkin_date on public.tesla_checkins(claimed_at);

-- ============================================================
-- SEED PRODUCTS (9 Tesla vehicles)
-- ============================================================
insert into public.tesla_products (name, price, daily_profit, duration_days, tag, sort_order) values
  ('Cybercab',           15000,  3000, 100, '100 days', 1),
  ('Model 3',            30000,  6000, 100, '100 days', 2),
  ('Model Y',            50000, 12000, 100, '100 days', 3),
  ('Roadster (1st Gen)', 70000, 15000, 100, '100 days', 4),
  ('Cybertruck',        100000, 24000, 100, '100 days', 5),
  ('Model S',           150000, 36000, 100, '100 days', 6),
  ('Model X',           200000, 48000, 100, '100 days', 7),
  ('Next-Gen Roadster', 300000, 60000, 100, '100 days', 8),
  ('Tesla Semi',        400000, 70000, 100, '100 days', 9)
on conflict do nothing;

-- ============================================================
-- TRIGGER: Referral commission on rental purchase
-- Levels: 1 = 20%, 2 = 2%, 3 = 1%
-- ============================================================
create or replace function public.handle_referral_commission()
returns trigger as $$
declare
  lvl1 uuid;
  lvl2 uuid;
  lvl3 uuid;
  comm1 numeric(14,2);
  comm2 numeric(14,2);
  comm3 numeric(14,2);
begin
  -- find referrer chain
  select referred_by into lvl1 from public.users where id = new.user_id;

  if lvl1 is not null then
    comm1 := round(new.price_paid * 0.20, 2);

    update public.users set balance = balance + comm1 where id = lvl1;
    insert into public.tesla_transactions(user_id, type, amount, status, meta)
      values (lvl1, 'ref_bonus', comm1, 'completed',
              jsonb_build_object('from_user', new.user_id, 'level', 1));
    insert into public.tesla_referrals(referrer_id, referred_id, level, earnings)
      values (lvl1, new.user_id, 1, comm1)
      on conflict (referrer_id, referred_id, level)
      do update set earnings = public.tesla_referrals.earnings + excluded.earnings;

    select referred_by into lvl2 from public.users where id = lvl1;

    if lvl2 is not null then
      comm2 := round(new.price_paid * 0.02, 2);

      update public.users set balance = balance + comm2 where id = lvl2;
      insert into public.tesla_transactions(user_id, type, amount, status, meta)
        values (lvl2, 'ref_bonus', comm2, 'completed',
                jsonb_build_object('from_user', new.user_id, 'level', 2));
      insert into public.tesla_referrals(referrer_id, referred_id, level, earnings)
        values (lvl2, new.user_id, 2, comm2)
        on conflict (referrer_id, referred_id, level)
        do update set earnings = public.tesla_referrals.earnings + excluded.earnings;

      select referred_by into lvl3 from public.users where id = lvl2;

      if lvl3 is not null then
        comm3 := round(new.price_paid * 0.01, 2);

        update public.users set balance = balance + comm3 where id = lvl3;
        insert into public.tesla_transactions(user_id, type, amount, status, meta)
          values (lvl3, 'ref_bonus', comm3, 'completed',
                  jsonb_build_object('from_user', new.user_id, 'level', 3));
        insert into public.tesla_referrals(referrer_id, referred_id, level, earnings)
          values (lvl3, new.user_id, 3, comm3)
          on conflict (referrer_id, referred_id, level)
          do update set earnings = public.tesla_referrals.earnings + excluded.earnings;
      end if;
    end if;
  end if;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_referral_commission on public.tesla_rentals;
create trigger trg_referral_commission
after insert on public.tesla_rentals
for each row execute function public.handle_referral_commission();

-- ============================================================
-- FUNCTION: First-purchase check
-- Returns TRUE if user is allowed to purchase at given price
-- ============================================================
create or replace function public.can_purchase(p_user_id uuid, p_price numeric)
returns boolean as $$
declare
  rental_count int;
  approved_deposits numeric(14,2);
begin
  select count(*) into rental_count
  from public.tesla_rentals
  where user_id = p_user_id;

  -- first purchase rule
  if rental_count = 0 then
    select coalesce(sum(amount), 0) into approved_deposits
    from public.tesla_deposits
    where user_id = p_user_id and status = 'approved';

    return approved_deposits >= p_price;
  end if;

  -- subsequent purchases: just need balance
  return (select balance from public.users where id = p_user_id) >= p_price;
end;
$$ language plpgsql security definer;
