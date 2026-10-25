import cookieParser from 'cookie-parser'
import express from 'express'
import { errorHandler } from './errors.ts'
import { articlesRouter } from './routes/articles.ts'
import { authRouter } from './routes/auth.ts'
import { meRouter } from './routes/me.ts'
import { peopleRouter } from './routes/people.ts'
import { socialRouter } from './routes/social.ts'

export function createApp() {
  const app = express()
  app.use(express.json({ limit: '1mb' }))
  app.use(cookieParser(process.env.COOKIE_SECRET ?? 'dev-cookie-secret'))
  app.get('/api/health', (_req, res) => {
    res.json({ ok: true })
  })
  app.use('/api', authRouter)
  app.use('/api', meRouter)
  app.use('/api', articlesRouter)
  app.use('/api', peopleRouter)
  app.use('/api', socialRouter)
  app.use(errorHandler)
  return app
}
