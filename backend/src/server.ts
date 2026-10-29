import { createApp } from './app.ts'
import { logger } from './log.ts'

const port = Number(process.env.PORT ?? 4000)
createApp().listen(port, () => {
  logger.info({ port }, 'api listening')
})
