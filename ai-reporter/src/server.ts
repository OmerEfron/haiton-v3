import { createApp } from './app.ts'

const port = Number(process.env.PORT ?? 4100)
createApp().listen(port, () => {
  console.log(`ai reporter on http://127.0.0.1:${port}`)
})
