import { createApp } from './app.ts'

const port = Number(process.env.PORT ?? 4000)
createApp().listen(port, () => {
  console.log(`api on http://127.0.0.1:${port}`)
})
