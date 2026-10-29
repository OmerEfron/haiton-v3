import cookieParser from 'cookie-parser'
import express from 'express'
import { cookieSecret } from './auth.ts'
import { errorHandler } from './errors.ts'
import { perIp } from './limits.ts'
import { httpLog } from './log.ts'
import { articlesRouter } from './routes/articles.ts'
import { authRouter } from './routes/auth.ts'
import { meRouter } from './routes/me.ts'
import { peopleRouter } from './routes/people.ts'
import { socialRouter } from './routes/social.ts'

export function createApp() {
  const app = express()
  if (process.env.TRUST_PROXY) app.set('trust proxy', 1)
  app.use(express.json({ limit: '1mb' }))
  app.use(cookieParser(cookieSecret()))
  app.use(httpLog)
  app.get('/api/health', (_req, res) => {
    res.json({ ok: true })
  })
  app.use('/api', perIp(300, 60_000))
  app.post('/api/auth/google', perIp(10, 60_000))
  app.use('/api', authRouter)
  app.use('/api', meRouter)
  app.use('/api', articlesRouter)
  app.use('/api', peopleRouter)
  app.use('/api', socialRouter)
  app.use(errorHandler)
  return app
}
