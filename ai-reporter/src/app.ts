import cookieParser from 'cookie-parser'
import express from 'express'
import { errorHandler } from './errors.ts'
import { editorRouter } from './routes/editor.ts'
import { reporterRouter } from './routes/reporter.ts'

export function createApp() {
  const app = express()
  app.use(express.json({ limit: '1mb' }))
  app.use(cookieParser(process.env.COOKIE_SECRET ?? 'dev-cookie-secret'))
  app.get('/ai/health', (_req, res) => {
    res.json({ ok: true })
  })
  app.use('/ai', reporterRouter)
  app.use('/ai', editorRouter)
  app.use(errorHandler)
  return app
}
