create table ai_sessions (
  id text primary key default gen_random_uuid()::text,
  user_id text not null references users (id) on delete cascade,
  messages jsonb not null,
  turns jsonb not null,
  article_type text not null default 'feature',
  angle text not null default '',
  created_at timestamptz not null default now()
);

create index ai_sessions_user_created_idx on ai_sessions (user_id, created_at desc);

create table ai_drafts (
  id text primary key default gen_random_uuid()::text,
  session_id text not null references ai_sessions (id) on delete cascade,
  user_id text not null references users (id) on delete cascade,
  content jsonb not null,
  used_facts text[] not null default '{}',
  new_facts jsonb not null default '[]',
  created_at timestamptz not null default now()
);

create index ai_drafts_session_idx on ai_drafts (session_id);
