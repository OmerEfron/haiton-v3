// Deterministic stand-in for POST /v1/chat/completions. Headline changes when the call is a revision.
import { createServer, type IncomingMessage } from 'node:http'

const port = Number(process.env.STUB_PORT ?? 4099)

const reporter = {
  known: 'user described an event',
  angle: 'a small finished task',
  target: 'what happened next',
  articleType: 'feature',
  reply: 'רגע, ומה קרה אחר כך?',
  canDraft: true,
}

function draft(user: string) {
  const revised = user.includes('REVISION INSTRUCTION')
  return {
    headline: revised ? 'אחרי השיחה: כותרת מתוקנת לבדיקה' : 'אחרי השיחה: כותרת ראשונה לבדיקה',
    sub: 'תת כותרת שמוסיפה פרט שהכותרת עצמה לא אמרה.',
    summary: 'סיכום עובדתי קצר של מה שסופר בשיחה.',
    body: ['המשתמש סיפר מה קרה באותו יום.', 'הכתב שאל מה קרה אחר כך.'],
    flash: 'פלאש: סופר סיפור קצר לבדיקת העורך.',
    push: 'פוש: הסיפור הקצר לבדיקה',
    usedFacts: [] as string[],
    newFacts: [{ k: 'עיר', v: 'תל אביב' }],
  }
}

function readBody(req: IncomingMessage) {
  return new Promise<string>((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (c: Buffer) => chunks.push(c))
    req.on('end', () => resolve(Buffer.concat(chunks).toString()))
    req.on('error', reject)
  })
}

createServer(async (req, res) => {
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'content-type': 'application/json' })
    res.end(JSON.stringify({ ok: true }))
    return
  }
  if (req.method !== 'POST' || req.url !== '/v1/chat/completions') {
    res.writeHead(404)
    res.end()
    return
  }
  const body = JSON.parse(await readBody(req)) as {
    response_format?: { json_schema?: { name?: string } }
    messages?: { content?: string }[]
  }
  const name = body.response_format?.json_schema?.name
  const user = body.messages?.at(-1)?.content ?? ''
  const payload = name === 'draft' ? draft(user) : reporter
  res.writeHead(200, { 'content-type': 'application/json' })
  res.end(JSON.stringify({ choices: [{ message: { content: JSON.stringify(payload) } }] }))
}).listen(port, '127.0.0.1', () => {
  console.log(`openai stub on http://127.0.0.1:${port}`)
})
