// Summary table, blind comparison and real-or-AI test written to out/.
import { writeFileSync, readFileSync } from 'node:fs'

const avg = (a) => (a.length ? (a.reduce((x, y) => x + y, 0) / a.length).toFixed(2) : '-')
const shuffle = (a) => a.map((x) => [Math.random(), x]).sort((p, q) => p[0] - q[0]).map((p) => p[1])

export function summarize(results, cfgs) {
  let md = '| model | variant | n | israeli | human | hebrew | gender | type fit | interview | story fidelity | buried fact | type in expected | questions avg | draft checks pass | reporter checks pass |\n|' + '---|'.repeat(15) + '\n'
  for (const [m, v] of cfgs) {
    const r = results.filter((x) => x.model === m && x.variant === v)
    const c = (k) => avg(r.map((x) => x.judge[k]))
    const pct = (f) => `${Math.round((100 * r.filter(f).length) / (r.length || 1))}%`
    const qs = avg(r.map((x) => x.chatLog.filter((t) => t.role === 'reporter').length - 1))
    md += `| ${m} | ${v} | ${r.length} | ${c('israeli_feel')} | ${c('human_feel')} | ${c('hebrew_correctness')} | ${c('gender_agreement')} | ${c('type_fit')} | ${c('interview_quality')} | ${pct((x) => x.judge.story_fidelity)} | ${pct((x) => x.judge.buried_fact_surfaced)} | ${pct((x) => x.typeOk)} | ${qs} | ${pct((x) => !x.checks.draft.length)} | ${pct((x) => !x.checks.reporter.length)} |\n`
  }
  return md
}

export function writeBlind(OUT, scenarios, results) {
  const key = {}
  let md = '# Blind comparison (judge: you). Rate each version 1-5 for Israeli feel and human feel. Chats are with a simulated user.\n\n'
  for (const s of scenarios) {
    const rs = shuffle(results.filter((x) => x.id === s.id))
    if (!rs.length) continue
    md += `## ${s.id} (${s.name}, ${s.gender})\n\nKey: angle "${s.bestAngle}", buried fact "${s.buriedFact}"\n\n`
    rs.forEach((x, i) => {
      const L = 'ABCDEFGH'[i]
      key[`${s.id}/${L}`] = `${x.model}/${x.variant}`
      md += `### ${L} (type: ${x.articleType})\n${x.chatLog.map((m) => `${m.role === 'user' ? 'U' : 'R'}: ${m.text}`).join('\n')}\n\n**${x.draft.headline}**\n${x.draft.sub}\n\n${x.draft.body.join('\n\n')}\n\nflash: ${x.draft.flash}\npush: ${x.draft.push}\n\n`
    })
  }
  writeFileSync(new URL('blind.md', OUT), md)
  writeFileSync(new URL('blind-key.json', OUT), JSON.stringify(key, null, 1))
}

/** 10 real pushes mixed with 10 generated ones from the best-scoring config */
export function writeRealOrAi(OUT, dir, results, cfgs) {
  const score = (r) => r.judge.israeli_feel + r.judge.human_feel
  const best = cfgs.map(([m, v]) => [m, v, results.filter((x) => x.model === m && x.variant === v)]).sort((a, b) => avg(b[2].map(score)) - avg(a[2].map(score)))[0]
  const real = readFileSync(new URL('../corpus/pushes.csv', dir), 'utf8').split('\n').slice(1).map((l) => l.match(/^\d+,\w+,[^,]*,[\d:]+,(.*)$/)?.[1]?.replace(/^"|"$/g, '').replace(/""/g, '"')).filter(Boolean)
  const mix = shuffle([...shuffle(real).slice(0, 10).map((t) => ({ t, ai: false })), ...shuffle(best[2]).slice(0, 10).map((x) => ({ t: x.draft.push, ai: true }))])
  writeFileSync(new URL('real-or-ai.md', OUT), '# Real or AI? Mark each push, then compare with real-or-ai-key.json\n\n' + mix.map((x, i) => `${i + 1}. ${x.t}`).join('\n') + '\n')
  writeFileSync(new URL('real-or-ai-key.json', OUT), JSON.stringify(mix.map((x, i) => ({ n: i + 1, ai: x.ai, config: x.ai ? `${best[0]}/${best[1]}` : 'real' })), null, 1))
  return best
}
