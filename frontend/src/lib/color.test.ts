import { describe, expect, it } from 'vitest'
import { colorOf, firstName } from './color'

describe('colorOf', () => {
  it('is stable and a hex color', () => {
    expect(colorOf('abc')).toBe(colorOf('abc'))
    expect(colorOf('abc')).toMatch(/^#[0-9a-f]{6}$/)
  })
})

describe('firstName', () => {
  it('keeps the first word', () => {
    expect(firstName('מאיה כהן')).toBe('מאיה')
    expect(firstName('מאיה')).toBe('מאיה')
  })
})
