create table ai_usage (
  id text primary key default gen_random_uuid()::text,
  user_id text not null references users (id) on delete cascade,
  kind text not null,
  created_at timestamptz not null default now()
);

create index ai_usage_user_created_idx on ai_usage (user_id, created_at desc);
