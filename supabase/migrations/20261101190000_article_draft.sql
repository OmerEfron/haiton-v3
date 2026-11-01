alter table articles
  add column draft_id text references ai_drafts (id) on delete set null;
