// Runs the Hebrew eval set: reporter <-> simulated user, editor, revisions, judge. Writes out/.
// Usage (from repo root, the key is loaded by node, never read by us):
//   node --env-file=.env docs/ai-reporter/evals/run.mjs [--models gpt-6.1-sol] [--variants full,noshot]
//        [--only maya_tahini,gym_squat] [--limit 3] [--reviseN 3] [--judge gpt-6-astra] [--sim gpt-6-luna] [--out out-v3]
// ponytail: pool of 4 concurrent scenarios, one retry per API call.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { pool } from './lib/openai.mjs'
import { runOne } from './lib/pipeline.mjs'
import { summarize, writeBlind, writeRealOrAi } from './lib/report.mjs'

const dir = new URL('./', import.meta.url)
const rd = (p) => readFileSync(new URL(p, dir), 'utf8')
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d }
const MODELS = arg('models', 'gpt-6.1-sol').split(',')
const VARIANTS = arg('variants', 'full').split(',')
const only = arg('only', '')

let scenarios = JSON.parse(rd('scenarios.json'))
if (only) scenarios = scenarios.filter((s) => only.split(',').includes(s.id))
scenarios = scenarios.slice(0, +arg('limit', 99))
const ctx = {
  prompts: { reporter: rd('../prompts/reporter.md'), editor: rd('../prompts/editor.md'), revise: rd('../prompts/revise.md'), rubric: rd('rubric.md') },
  judge: arg('judge', 'gpt-6-astra'), simModel: arg('sim', 'gpt-6-luna'),
  reviseIdx: new Set(scenarios.slice(0, +arg('reviseN', 3)).map((s) => s.id)),
}

const jobs = scenarios.flatMap((s) => MODELS.flatMap((m) => VARIANTS.map((v) => () => { console.log('run', s.id, m, v); return runOne(s, m, v, ctx) })))
const results = (await pool(jobs, 4)).filter((r) => !r.error)
const outName = arg('out', 'out').replace(/\/?$/, '/')
const OUT = new URL(outName, dir)
mkdirSync(OUT, { recursive: true })
writeFileSync(new URL('results.json', OUT), JSON.stringify(results, null, 1))

const cfgs = MODELS.flatMap((m) => VARIANTS.map((v) => [m, v]))
const summary = summarize(results, cfgs)
writeFileSync(new URL('summary.md', OUT), summary)
writeBlind(OUT, scenarios, results)
const best = writeRealOrAi(OUT, dir, results, cfgs)
console.log('\n' + summary + '\nbest config by judge:', best[0], best[1], `\nwritten to docs/ai-reporter/evals/${outName}`)
