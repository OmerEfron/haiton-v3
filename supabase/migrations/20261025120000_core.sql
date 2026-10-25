create table users (
  id text primary key default gen_random_uuid()::text,
  email text not null unique,
  name text not null,
  photo bytea,
  photo_type text,
  photo_updated_at timestamptz,
  onboarding boolean not null default true,
  pref_articles boolean not null default true,
  pref_joins boolean not null default true,
  pref_reactions boolean not null default true
);

create table connections (
  user_id text not null references users (id) on delete cascade,
  other_id text not null references users (id) on delete cascade,
  muted boolean not null default false,
  primary key (user_id, other_id),
  check (user_id <> other_id)
);

create table groups (
  id text primary key default gen_random_uuid()::text,
  owner_id text not null references users (id) on delete cascade,
  name text not null,
  unique (owner_id, name)
);

create table group_members (
  group_id text not null references groups (id) on delete cascade,
  user_id text not null references users (id) on delete cascade,
  primary key (group_id, user_id)
);

create table articles (
  id text primary key default gen_random_uuid()::text,
  author_id text not null references users (id) on delete cascade,
  created_at timestamptz not null default now(),
  image_url text,
  headline text not null,
  sub text not null default '',
  flash text not null default '',
  push text,
  body text[] not null,
  prev_id text references articles (id) on delete set null
);

create index articles_author_created_idx on articles (author_id, created_at desc);

create table article_audience (
  article_id text not null references articles (id) on delete cascade,
  user_id text not null references users (id) on delete cascade,
  primary key (article_id, user_id)
);

create table reactions (
  article_id text not null references articles (id) on delete cascade,
  user_id text not null references users (id) on delete cascade,
  label text not null,
  primary key (article_id, user_id)
);

create table hidden (
  article_id text not null references articles (id) on delete cascade,
  user_id text not null references users (id) on delete cascade,
  primary key (article_id, user_id)
);

create table reports (
  article_id text not null references articles (id) on delete cascade,
  user_id text not null references users (id) on delete cascade,
  reason text not null,
  note text not null default '',
  created_at timestamptz not null default now(),
  primary key (article_id, user_id)
);

create table facts (
  id text primary key default gen_random_uuid()::text,
  user_id text not null references users (id) on delete cascade,
  k text not null,
  v text not null,
  src text not null default '',
  is_new boolean not null default false
);

create table invites (
  code text primary key,
  inviter_id text not null references users (id) on delete cascade,
  article_id text references articles (id) on delete set null
);

create table notifications (
  id text primary key default gen_random_uuid()::text,
  user_id text not null references users (id) on delete cascade,
  kind text not null check (kind in ('join', 'react')),
  text text not null,
  sub text not null default '',
  created_at timestamptz not null default now(),
  unread boolean not null default true,
  person_id text references users (id) on delete set null,
  article_id text references articles (id) on delete cascade
);

create index notifications_user_created_idx on notifications (user_id, created_at desc);
