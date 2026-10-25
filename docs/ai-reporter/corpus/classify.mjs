// Phase 1: label every body in bodies.json with an OPEN-ENDED type + structure (no fixed type list given to the model).
// Phase 2: cluster the labels into ~8 article types, then compute a structural profile per type from the members.
// Run: node --env-file=.env docs/ai-reporter/corpus/classify.mjs   -> classified.json, types.json
import { readFileSync, writeFileSync } from 'node:fs'
import { chat, pool, str, arr, enm } from '../evals/lib/openai.mjs'

const MODEL = 'gpt-6.1-sol'
const rd = (f) => JSON.parse(readFileSync(new URL(f, import.meta.url), 'utf8'))
const bodies = rd('./bodies.json')

const LABEL = {
  type_free: str, // free-text article type, English, 1-4 words, invent whatever fits
  purpose: str, // one line: what the piece does for the reader
  lede_type: enm('scene', 'hard_fact', 'quote', 'number', 'question', 'anecdote', 'other'),
  paragraph_roles: arr(str), // ordered roles of the paragraphs, e.g. lede, context, quote, background, reaction, kicker
  quote_share_pct: { type: 'integer' },
  quote_positions: arr(enm('lede', 'early', 'middle', 'late', 'closing')),
  headline_pattern: str, // e.g. "X: Y", "quote-led", "question", "plain statement", "label | detail"
  kicker_type: enm('none', 'quote', 'next_step', 'twist', 'reflection', 'call_to_action', 'fact'),
  voice: enm('third_person', 'first_person', 'second_person', 'q_and_a', 'mixed'),
  haiton_fit: { type: 'integer' }, // 1-5: how well this structure could carry a small personal life event told in news style
}
const SYS = `You are a senior Israeli news editor analysing the structure of Hebrew articles. For the article you get, describe it with the schema. Do NOT pick from a predefined list: invent the most accurate short English type label (type_free) for what kind of piece it is (for example a breaking item, a profile, a column, a service guide, a fiction serial, an Q&A interview, a match report: whatever it really is). paragraph_roles must list the role of each paragraph in order (merge consecutive same-role paragraphs). haiton_fit: 5 = structure is a good fit for a short warm story about one private person's small life event written like a news item (a few paragraphs, a quote, one anecdote); 1 = not usable (hard politics, long explainer, fiction).`

const show = (b) => {
  const P = b.paragraphs
  const text = P.length > 14 ? [...P.slice(0, 12), '[...]', ...P.slice(-2)].join('\n') : P.join('\n')
  return `PATH: ${b.path}\nHEADLINE: ${b.title}\nSUB: ${b.sub}\nPARAGRAPHS: ${P.length}\nCHARS: ${P.join('').length}\n\n${text.slice(0, 5000)}`
}

const labels = await pool(bodies.map((b, i) => async () => {
  const l = await chat(MODEL, [{ role: 'system', content: SYS }, { role: 'user', content: show(b) }], 'label', LABEL)
  if (i % 20 === 0) console.log('labelled', i)
  return { i, url: b.url, path: b.path, title: b.title, paragraphs: b.paragraphs.length, chars: b.paragraphs.join('').length, ...l }
}), 4)
const ok = labels.filter((l) => !l.error)
writeFileSync(new URL('./classified.json', import.meta.url), JSON.stringify(ok, null, 1))
console.log('labelled', ok.length, '/', bodies.length)

// ---- phase 2: cluster
const compact = ok.map((l) => `${l.i}|${l.path}|${l.type_free}|${l.lede_type}|${l.voice}|${l.kicker_type}|fit${l.haiton_fit}|${l.headline_pattern}|${l.title.slice(0, 50)}`).join('\n')
const CL = { types: arr({ type: 'object', properties: { id: str, name_he: str, name_en: str, description: str, members: arr({ type: 'integer' }) }, required: ['id', 'name_he', 'name_en', 'description', 'members'], additionalProperties: false }) }
const clusters = await chat(MODEL, [
  { role: 'system', content: 'Cluster these labelled Hebrew news articles into 7-9 article types that a newsroom would recognise as distinct STRUCTURES (not topics). Every index must be in exactly one type; put unusable pieces (fiction, pure listicles) in a type called "other". Prefer types that differ in lede, paragraph roles, quote use, kicker and voice. id = short snake_case English; name_he = the Hebrew newsroom term. members = the article indexes (first field of each line).' },
  { role: 'user', content: compact },
], 'cluster', CL)

const med = (a) => { a = [...a].sort((x, y) => x - y); return a[a.length >> 1] ?? 0 }
const count = (a) => a.reduce((m, x) => ((m[x] = (m[x] || 0) + 1), m), {})
const byI = Object.fromEntries(ok.map((l) => [l.i, l]))
const types = clusters.types.map((t) => {
  const m = t.members.map((i) => byI[i]).filter(Boolean)
  return {
    id: t.id, name_he: t.name_he, name_en: t.name_en, description: t.description, n: m.length,
    median_paragraphs: med(m.map((x) => x.paragraphs)), median_chars: med(m.map((x) => x.chars)), median_quote_pct: med(m.map((x) => x.quote_share_pct)),
    lede: count(m.map((x) => x.lede_type)), kicker: count(m.map((x) => x.kicker_type)), voice: count(m.map((x) => x.voice)),
    headline_patterns: count(m.map((x) => x.headline_pattern)), quote_positions: count(m.flatMap((x) => x.quote_positions)),
    avg_haiton_fit: +(m.reduce((s, x) => s + x.haiton_fit, 0) / (m.length || 1)).toFixed(2),
    roles: m.slice(0, 6).map((x) => x.paragraph_roles.join(' > ')),
    examples: m.slice().sort((a, b) => b.haiton_fit - a.haiton_fit).slice(0, 4).map((x) => ({ i: x.i, title: x.title, url: x.url })),
  }
})
writeFileSync(new URL('./types.json', import.meta.url), JSON.stringify(types, null, 1))
console.log(types.map((t) => `${t.id} (${t.n}) fit ${t.avg_haiton_fit} paras ${t.median_paragraphs} chars ${t.median_chars}`).join('\n'))
