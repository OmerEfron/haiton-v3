// Minimal OpenAI chat-completions client with strict structured output. Key comes from env (node --env-file=.env).
// Model names verified against the OpenAI docs (Context7): gpt-6-astra, gpt-6.1-sol, gpt-6-luna; reasoning_effort supported.
const KEY = process.env.OPENAI_API_KEY
export const str = { type: 'string' }
export const arr = (items) => ({ type: 'array', items })
export const obj = (properties) => ({ type: 'object', properties, required: Object.keys(properties), additionalProperties: false })
export const enm = (...v) => ({ type: 'string', enum: v })

export async function chat(model, messages, name, props, attempt = 0) {
  if (!KEY) throw new Error('OPENAI_API_KEY missing: run with node --env-file=.env')
  const body = { model, messages, reasoning_effort: 'low', response_format: { type: 'json_schema', json_schema: { name, strict: true, schema: obj(props) } } }
  const r = await fetch('https://api.openai.com/v1/chat/completions', { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${KEY}` }, body: JSON.stringify(body) })
  if (!r.ok) {
    const t = await r.text()
    if (attempt < 1 && (r.status === 429 || r.status >= 500)) { await new Promise((s) => setTimeout(s, 3000)); return chat(model, messages, name, props, 1) }
    throw new Error(`${model} ${r.status}: ${t.slice(0, 300)}`)
  }
  return JSON.parse((await r.json()).choices[0].message.content)
}

/** run async jobs with at most n in flight; failed jobs resolve to {error} */
export async function pool(jobs, n) {
  const res = []
  let i = 0
  await Promise.all(Array.from({ length: n }, async () => {
    while (i < jobs.length) { const k = i++; try { res[k] = await jobs[k]() } catch (e) { console.error('FAIL', e.message); res[k] = { error: e.message } } }
  }))
  return res
}
