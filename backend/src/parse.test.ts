import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { HttpError } from './errors.ts'
import { parse } from './parse.ts'

const schema = z.object({ name: z.string().min(1, 'name required') })

describe('parse', () => {
  it('returns the parsed value', () => {
    expect(parse(schema, { name: 'מאיה' })).toEqual({ name: 'מאיה' })
  })

  it('rejects an invalid body with the first issue', () => {
    expect(() => parse(schema, { name: '' })).toThrow(HttpError)
    try {
      parse(schema, { name: '' })
    } catch (err) {
      expect(err).toMatchObject({ status: 400, message: 'name required' })
    }
  })

  it('treats a missing body as empty', () => {
    expect(() => parse(schema, null)).toThrow(HttpError)
    try {
      parse(schema, null)
    } catch (err) {
      expect((err as HttpError).status).toBe(400)
    }
  })
})
