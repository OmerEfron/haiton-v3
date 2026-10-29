import { createApp } from './app.ts'
import { logger } from './log.ts'

const port = Number(process.env.PORT ?? 4100)
createApp().listen(port, () => {
  logger.info({ port }, 'ai reporter listening')
})
