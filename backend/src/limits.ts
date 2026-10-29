import type { Request } from 'express'
import { rateLimit, type Options } from 'express-rate-limit'

const base: Partial<Options> = {
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'too many requests' },
}

// ponytail: in-memory store, per-process; swap to a shared store (Postgres/Redis) when running >1 instance.
export function perIp(limit: number, windowMs: number) {
  return rateLimit({ ...base, limit, windowMs })
}

export function perUser(limit: number, windowMs: number) {
  return rateLimit({
    ...base,
    limit,
    windowMs,
    keyGenerator: (req: Request) => req.userId || 'anon',
    validate: { keyGeneratorIpFallback: false },
  })
}

export const writeLimit = perUser(30, 60_000)
