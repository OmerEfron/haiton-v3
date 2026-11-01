import cookieParser from 'cookie-parser'
import express from 'express'
import { cookieSecret } from './auth.ts'
import { errorHandler } from './errors.ts'
import { perIp } from './limits.ts'
import { httpLog } from './log.ts'
import { editorRouter } from './routes/editor.ts'
import { introRouter } from './routes/intro.ts'
import { reporterRouter } from './routes/reporter.ts'

export function createApp() {
  const app = express()
  if (process.env.TRUST_PROXY) app.set('trust proxy', Number(process.env.TRUST_PROXY))
  app.use(express.json({ limit: '1mb' }))
  app.use(cookieParser(cookieSecret()))
  app.use(httpLog)
  app.get('/ai/health', (_req, res) => {
    res.json({ ok: true })
  })
  app.use('/ai', perIp(120, 60_000))
  app.use('/ai', reporterRouter)
  app.use('/ai', editorRouter)
  app.use('/ai', introRouter)
  app.use(errorHandler)
  return app
}
