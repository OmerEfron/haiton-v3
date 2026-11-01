create table ai_intros (
  id text primary key default gen_random_uuid()::text,
  user_id text not null references users (id) on delete cascade,
  messages jsonb not null,
  created_at timestamptz not null default now()
);
