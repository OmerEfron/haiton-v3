# Two services share one Postgres, with split table ownership

`backend` (core API) and `ai-reporter` read and write the same Supabase Postgres instead of calling each other's APIs. `ai-reporter` owns `ai_sessions`, `ai_drafts`, `ai_intros` and `ai_usage`, and reads `articles`, `users` and `facts` read-only. `backend` owns everything else and reads `ai_drafts` once, to check draft ownership on publish. We chose this over service-to-service calls to avoid a network hop and a second auth path for a handful of reads; the cost is that the schema is an implicit contract, so changing a table means checking both services.

The small duplicated plumbing in both services (`parse.ts`, `log.ts`, auth, errors, limits) is deliberate for now: no shared package until a third service appears.
