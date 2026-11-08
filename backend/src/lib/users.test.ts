import { describe, expect, it } from 'vitest'
import { photoUrl, toMe, type UserRow } from './users.ts'

const row: UserRow = {
  id: 'u1',
  email: 'a@b.c',
  name: 'מאיה',
  photo: null,
  photo_type: null,
  photo_updated_at: null,
  onboarding: true,
  gender: 'female',
  birth_year: 1990,
  pref_articles: true,
  pref_joins: true,
  pref_reactions: true,
}

describe('user shape', () => {
  it('omits the photo url until one is stored', () => {
    expect(photoUrl({ id: 'u1', photo_updated_at: null })).toBeNull()
    const at = new Date('2026-01-02T00:00:00Z')
    expect(photoUrl({ id: 'u1', photo_updated_at: at })).toBe(`/api/users/u1/photo?v=${at.getTime()}`)
  })

  it('maps a row to the profile the client sees', () => {
    expect(toMe(row)).toEqual({
      id: 'u1',
      name: 'מאיה',
      email: 'a@b.c',
      photoUrl: null,
      onboarding: true,
      gender: 'female',
      birthYear: 1990,
    })
  })
})
