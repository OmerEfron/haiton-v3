import type { RequestHandler } from 'express'
import { HttpError } from './errors.ts'

declare global {
  namespace Express {
    interface Request {
      userId?: string
    }
  }
}

export const COOKIE = 'sid'

export function cookieOpts() {
  return { httpOnly: true, signed: true, sameSite: 'lax' as const, path: '/' }
}

export function param(req: { params: Record<string, unknown> }, name: string) {
  const v = req.params[name]
  return Array.isArray(v) ? String(v[0]) : String(v)
}

export const requireAuth: RequestHandler = (req, _res, next) => {
  const id = req.signedCookies?.[COOKIE]
  if (typeof id !== 'string' || !id) return next(new HttpError(401, 'unauthorized'))
  req.userId = id
  next()
}
