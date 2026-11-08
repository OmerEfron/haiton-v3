import { describe, expect, it } from 'vitest'
import { isFresh, relTime, shortDate, todayLabel } from './time'

const now = Date.parse('2026-06-15T12:00:00')
const at = (iso: string) => relTime(iso, now)

describe('shortDate', () => {
  it('formats a local calendar date', () => {
    expect(shortDate('2026-05-01T12:00:00')).toBe('1.5.2026')
  })
})

describe('relTime', () => {
  it('describes how long ago a moment was', () => {
    expect(at('2026-06-15T11:55:00')).toBe('עכשיו')
    expect(at('2026-06-15T11:40:00')).toBe('לפני 20 דקות')
    expect(at('2026-06-15T11:00:00')).toBe('לפני שעה')
    expect(at('2026-06-15T10:00:00')).toBe('לפני שעתיים')
    expect(at('2026-06-15T08:00:00')).toBe('לפני 4 שעות')
    expect(at('2026-06-14T12:00:00')).toBe('אתמול')
    expect(at('2026-06-13T12:00:00')).toBe('לפני יומיים')
    expect(at('2026-06-10T12:00:00')).toBe('לפני 5 ימים')
    expect(at('2026-06-05T12:00:00')).toBe('לפני שבוע')
    expect(at('2026-05-28T12:00:00')).toBe('לפני שבועיים')
    expect(at('2026-05-01T12:00:00')).toBe(shortDate('2026-05-01T12:00:00'))
  })
})

describe('isFresh', () => {
  it('is true only for the last few minutes', () => {
    expect(isFresh(new Date().toISOString())).toBe(true)
    expect(isFresh(new Date(Date.now() - 60 * 60_000).toISOString())).toBe(false)
  })
})

describe('todayLabel', () => {
  it('includes today\'s date', () => {
    expect(todayLabel()).toContain(shortDate(new Date()))
  })
})
