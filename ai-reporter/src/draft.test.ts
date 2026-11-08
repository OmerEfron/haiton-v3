import { describe, expect, it } from 'vitest'
import type { StoryContext } from './context.ts'
import { asDraft, asIntro, asNewFacts, asReporter, contentOf, toDraft } from './draft.ts'

const reporter = {
  known: 'k',
  angle: 'a',
  target: 't',
  articleType: 'feature',
  reply: null,
  canDraft: false,
}

const draft = {
  headline: 'כותרת',
  sub: 'תת',
  summary: 'סיכום',
  body: ['פסקה'],
  flash: 'פלאש',
  push: 'פוש',
  usedFacts: ['עיר'],
  newFacts: [] as { k: string; v: string }[],
}

describe('model output', () => {
  it('accepts a reporter turn and rejects a bad one', () => {
    expect(asReporter(reporter)).toMatchObject(reporter)
    expect(asReporter({ ...reporter, known: 'א'.repeat(600) }).known).toHaveLength(500)
    expect(() => asReporter(null)).toThrow(/bad reporter json/)
    expect(() => asReporter({ ...reporter, articleType: 'nope' })).toThrow(/bad reporter json/)
    expect(() => asReporter({ ...reporter, canDraft: 'yes' })).toThrow(/bad reporter json/)
  })

  it('keeps at most ten facts and trims them', () => {
    const many = Array.from({ length: 12 }, (_, i) => ({ k: `k${i}`, v: 'v' }))
    expect(asNewFacts(many)).toHaveLength(10)
    expect(asNewFacts([{ k: 'א'.repeat(50), v: 'ב'.repeat(250) }])).toEqual([{ k: 'א'.repeat(40), v: 'ב'.repeat(200) }])
    expect(() => asNewFacts({})).toThrow(/bad draft facts/)
    expect(() => asNewFacts([{ k: '', v: 'x' }])).toThrow(/bad draft facts/)
    expect(() => asNewFacts([{ k: 1, v: 'x' }])).toThrow(/bad draft facts/)
  })

  it('accepts an intro reply and a draft, and rejects a thin draft', () => {
    expect(asIntro({ reply: 'שלום', newFacts: [] })).toEqual({ reply: 'שלום', newFacts: [] })
    expect(asIntro({ reply: null, newFacts: [] }).reply).toBeNull()
    expect(() => asIntro(null)).toThrow(/bad intro json/)
    expect(() => asIntro({ reply: 1, newFacts: [] })).toThrow(/bad intro json/)

    expect(asDraft(draft).headline).toBe('כותרת')
    expect(() => asDraft({ ...draft, headline: '  ' })).toThrow(/bad draft headline/)
    expect(() => asDraft({ ...draft, body: [] })).toThrow(/bad draft body/)
    expect(() => asDraft({ ...draft, body: [1] })).toThrow(/bad draft body/)
    expect(() => asDraft({ ...draft, usedFacts: [1] })).toThrow(/bad draft facts/)
  })

  it('keeps only facts the model used and drops ones already known', () => {
    const content = contentOf({ ...draft, newFacts: [{ k: 'כלב', v: 'לוקה' }] })
    expect(content).not.toHaveProperty('usedFacts')
    const ctx: StoryContext = {
      name: 'מאיה',
      gender: 'female',
      facts: [{ id: '1', k: 'עיר', v: 'חיפה', src: 'x', isNew: false }],
      previous: '',
      prevArticle: null,
    }
    const out = toDraft('d1', 's1', content, ['עיר', 'אין'], [{ k: 'עיר', v: 'חיפה' }, { k: 'כלב', v: 'לוקה' }], ctx)
    expect(out.id).toBe('d1')
    expect(out.sessionId).toBe('s1')
    expect(out.basis.facts.map((f) => f.k)).toEqual(['עיר'])
    expect(out.newFacts).toEqual([{ k: 'כלב', v: 'לוקה' }])
  })
})
