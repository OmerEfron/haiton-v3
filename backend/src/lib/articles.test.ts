import { describe, expect, it } from 'vitest'
import { summary, type ArticleRow } from './articles.ts'

const row: ArticleRow = {
  id: 'a1',
  author_id: 'u1',
  author: 'מאיה',
  created_at: new Date('2026-01-02T00:00:00Z'),
  image_url: null,
  headline: 'כותרת',
  sub: 'תת',
  flash: 'מבזק',
  push: null,
  body: ['פסקה'],
  prev_id: null,
  has_prev: false,
}

describe('article summary', () => {
  it('shows the viewer their own name and everyone else the author', () => {
    expect(summary(row, 'u1', 'אני').author).toBe('אני')
    const other = summary(row, 'u2', 'אני')
    expect(other.author).toBe('מאיה')
    expect(other.createdAt).toBe(row.created_at.toISOString())
    expect(other).toMatchObject({ id: 'a1', headline: 'כותרת', hasPrev: false, imageUrl: null })
  })
})
