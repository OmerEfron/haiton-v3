import pg from 'pg'

const url = process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'

export const pool = new pg.Pool({ connectionString: url })
