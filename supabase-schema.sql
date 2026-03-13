-- Run this once in Supabase → SQL Editor

create table if not exists solar_sessions (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  user_agent text,
  referrer   text
);

create table if not exists solar_predictions (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid references solar_sessions(id) on delete set null,
  created_at  timestamptz default now(),
  sample_idx  integer not null,
  abs_row     integer not null,
  timestamp   text,
  pred_class  smallint not null,
  true_class  smallint not null,
  correct     boolean  not null,
  p_noramp    real not null,
  p_moderate  real not null,
  p_severe    real not null,
  pred_pv     real,
  true_pv     real,
  drop_pct    real,
  theta       real not null default 0.30
);

create index if not exists idx_pred_created on solar_predictions(created_at desc);
create index if not exists idx_pred_class   on solar_predictions(pred_class);
create index if not exists idx_pred_correct on solar_predictions(correct);

create or replace view solar_stats as
select
  count(*)                                                           as total,
  count(*) filter (where pred_class=2)                              as total_severe,
  count(*) filter (where pred_class=1)                              as total_moderate,
  count(*) filter (where pred_class=0)                              as total_noramp,
  round(avg((correct)::int)*100,1)                                  as accuracy_pct,
  max(drop_pct)                                                     as max_drop,
  count(distinct session_id)                                        as sessions
from solar_predictions;
