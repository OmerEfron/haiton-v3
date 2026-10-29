import type { ErrorRequestHandler } from 'express'
import { ZodError } from 'zod'

export class HttpError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

/** OpenAI failed or returned something we cannot store. The client sees a generic 502. */
export class UpstreamError extends Error {}

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  if (err instanceof HttpError) {
    res.status(err.status).json({ message: err.message })
    return
  }
  if (err instanceof UpstreamError) {
    req.log.error({ err })
    res.status(502).json({ message: 'reporter unavailable' })
    return
  }
  if (err instanceof ZodError) {
    res.status(400).json({ message: err.issues[0]?.message ?? 'invalid' })
    return
  }
  req.log.error({ err })
  res.status(500).json({ message: 'internal error' })
}
