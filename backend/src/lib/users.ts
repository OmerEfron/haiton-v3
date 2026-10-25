import { pool } from '../db.ts'

export interface UserRow {
  id: string
  email: string
  name: string
  photo: Buffer | null
  photo_type: string | null
  photo_updated_at: Date | null
  onboarding: boolean
  gender: 'male' | 'female' | 'other' | null
  birth_year: number | null
  pref_articles: boolean
  pref_joins: boolean
  pref_reactions: boolean
}

export function photoUrl(u: Pick<UserRow, 'id' | 'photo_updated_at'>) {
  // ponytail: bytea in Postgres; move to Supabase Storage when going to cloud
  return u.photo_updated_at ? `/api/users/${u.id}/photo?v=${u.photo_updated_at.getTime()}` : null
}

export function toMe(u: UserRow) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    photoUrl: photoUrl(u),
    onboarding: u.onboarding,
    gender: u.gender,
    birthYear: u.birth_year,
  }
}

export async function getUser(id: string) {
  const { rows } = await pool.query<UserRow>('select * from users where id = $1', [id])
  return rows[0] ?? null
}
