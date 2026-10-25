import type { ErrorRequestHandler } from 'express'
import { ZodError } from 'zod'

export class HttpError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof HttpError) {
    res.status(err.status).json({ message: err.message })
    return
  }
  if (err instanceof ZodError) {
    res.status(400).json({ message: err.issues[0]?.message ?? 'invalid' })
    return
  }
  if (err && typeof err === 'object' && 'code' in err && err.code === 'LIMIT_FILE_SIZE') {
    res.status(400).json({ message: 'photo too large' })
    return
  }
  console.error(err)
  res.status(500).json({ message: 'internal error' })
}
