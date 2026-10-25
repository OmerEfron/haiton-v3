import type { z } from 'zod'
import { HttpError } from './errors.ts'

export function parse<T>(schema: z.ZodType<T>, data: unknown): T {
  const r = schema.safeParse(data ?? {})
  if (!r.success) throw new HttpError(400, r.error.issues[0]?.message ?? 'invalid')
  return r.data
}
