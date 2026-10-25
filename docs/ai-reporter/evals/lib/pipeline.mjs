// One scenario end to end: reporter <-> simulated user, then editor, revisions and judge.
// ponytail: the simulated user is one cheap model call per turn; it can still leak or stonewall, so read blind.md before trusting a score.
import { chat } from './openai.mjs'
import { SCHEMA } from './schemas.mjs'
import { checkDraft, checkReporter } from '../checks.mjs'

export const KINDS = ['funnier', 'dramatic', 'restrained', 'concise', 'headline', 'alternate']
const MAX_TURNS = 6
const FIXED_OPENER = 'מה קרה?'
const AUDIENCE = { male: 'male (זכר)', female: 'female (נקבה)', unknown: 'unknown' }

export const transcript = (t) => t.map((m) => `${m.role}: ${m.text}`).join('\n')
const generatedTranscript = (t) => t.filter((m) => m.role !== 'reporter' || m.generated !== false).map((m) => `${m.role}: ${m.text}`).join('\n')

export function fill(tpl, s, variant, st = {}) {
  const t = variant === 'noshot' ? tpl.split('## EXAMPLES')[0] : tpl
  return t.replace('{{name}}', s.name).replace('{{gender}}', AUDIENCE[s.gender])
    .replace('{{facts}}', s.facts.map((f) => `${f.k}: ${f.v}`).join('\n') || '(none)').replace('{{previous}}', s.previous || '(none)')
    .replace('{{articleType}}', st.articleType || 'feature').replace('{{angle}}', st.angle || '(none)')
}

function simPrompt(s) {
  const g = s.gender === 'unknown' ? 'Avoid gendered first-person verb forms where Hebrew allows.' : `You are ${s.gender}; use matching Hebrew forms.`
  const scene = (s.truth || []).map((u) => `- ${u}`).join('\n')
  return `You play ${s.name}, an ordinary Israeli person chatting in the Haiton app with a news reporter about something that happened to you. ${g}
Write casual spoken Hebrew like WhatsApp: one short sentence, two at most. Answer only what was asked. Never volunteer extra facts, never summarize, never ask the reporter anything.

WHAT REALLY HAPPENED:
${s.user.map((u) => `- ${u}`).join('\n')}

SCENE YOU REMEMBER (use this when the question is about the place, who was there, the timing, what happened just before or after, or a small physical detail. One fact only):
${scene || '(none)'}

HIDDEN DETAIL (say it only if the question clearly points at it. Otherwise never mention it, not even a hint):
${s.buriedFact}

If the question touches your memory, answer it with that fact. If you don't have the exact quote or number, give the closest fact you do remember instead of refusing. Say "לא ממש" only when nothing in your memory is related, and do not invent a name, a number or a quote. A generic prompt ("ספר עוד", "מה הסיפור") gets a flat few words. No em dash.`
}

async function simulate(s, simModel, chatLog) {
  const msgs = [{ role: 'system', content: simPrompt(s) }]
  for (const m of chatLog) msgs.push({ role: m.role === 'user' ? 'assistant' : 'user', content: m.text })
  return (await chat(simModel, msgs, 'sim', SCHEMA.sim)).text
}

async function converse(s, model, variant, ctx) {
  const sys = fill(ctx.prompts.reporter, s, variant)
  const opener = { known: 'nothing yet', angle: '', target: 'what happened', articleType: 'feature', reply: FIXED_OPENER, canDraft: false }
  const chatLog = [{ role: 'reporter', text: opener.reply, generated: false }, { role: 'user', text: s.user[0] }]
  const msgs = [{ role: 'system', content: sys }, { role: 'assistant', content: JSON.stringify(opener) }, { role: 'user', content: s.user[0] }]
  const replies = [], trail = []
  for (let i = 0; i < MAX_TURNS; i++) {
    const t = await chat(model, msgs, 'reporter', SCHEMA.reporter)
    msgs.push({ role: 'assistant', content: JSON.stringify(t) }); replies.push(t.reply); trail.push({ angle: t.angle, articleType: t.articleType })
    if (!t.reply || i === MAX_TURNS - 1) break
    chatLog.push({ role: 'reporter', text: t.reply, generated: true })
    const ans = await simulate(s, ctx.simModel, chatLog)
    chatLog.push({ role: 'user', text: ans }); msgs.push({ role: 'user', content: ans })
  }
  return { chatLog, replies, trail }
}

export async function runOne(s, model, variant, ctx) {
  const { chatLog, replies, trail } = await converse(s, model, variant, ctx)
  const last = trail[trail.length - 1]
  const userMsgs = chatLog.filter((m) => m.role === 'user').map((m) => m.text)
  const userText = userMsgs.join('\n') + '\n' + s.facts.map((f) => f.v).join(' ') + '\n' + s.previous
  const qs = replies.filter(Boolean)
  const esys = fill(ctx.prompts.editor, s, variant, last)
  const edit = (content) => chat(model, [{ role: 'system', content: esys }, { role: 'user', content }], 'draft', SCHEMA.draft)
  const draft = await edit('CHAT:\n' + transcript(chatLog))
  const out = {
    id: s.id, model, variant, chatLog, trail, articleType: last.articleType, angle: last.angle, draft,
    typeOk: s.expectedTypes.includes(last.articleType),
    checks: { reporter: checkReporter(replies, userMsgs), draft: checkDraft(draft, userText, last.articleType, qs) }, revisions: {},
  }
  if (ctx.reviseIdx.has(s.id)) {
    const [head, ...blocks] = ctx.prompts.revise.split(/^## kind: /m)
    const sysR = head + '\n' + esys.split('## EXAMPLES')[0]
    const target = ['column', 'quirky', 'feature'].find((t) => t !== last.articleType)
    for (const kind of [...KINDS, 'type']) {
      const block = blocks.find((b) => b.startsWith(kind === 'type' ? 'type:<name>' : kind + '\n'))
      const extra = kind === 'type' ? `\nTARGET TYPE: ${target}` : ''
      const rev = await chat(model, [{ role: 'system', content: sysR }, { role: 'user', content: `CHAT:\n${transcript(chatLog)}\n\nCURRENT DRAFT:\n${JSON.stringify(draft)}\n\nREVISION INSTRUCTION (${kind}):\n${block}${extra}` }], 'draft', SCHEMA.draft)
      out.revisions[kind] = { draft: rev, checks: checkDraft(rev, userText, kind === 'type' ? target : last.articleType, qs) }
    }
  }
  const verdict = await chat(ctx.judge, [{ role: 'system', content: ctx.prompts.rubric }, {
    role: 'user',
    content: `SCENARIO: user ${s.name}, gender ${s.gender}\nBEST ANGLE (answer key): ${s.bestAngle}\nBURIED FACT (answer key): ${s.buriedFact}\nEXPECTED TYPES: ${s.expectedTypes.join(', ')}\nCHOSEN TYPE: ${last.articleType}\nREPORTER'S FINAL ANGLE: ${last.angle}\nKNOWN FACTS: ${JSON.stringify(s.facts)}\nPREVIOUS STORY: ${s.previous || '(none)'}\nSYSTEM OPENER (not generated by the reporter model): ${FIXED_OPENER}\n\nCHAT FOR JUDGING (fixed system opener omitted; reporter lines are model-generated, user answers were simulated):\n${generatedTranscript(chatLog)}\n\nMODEL-GENERATED REPORTER FOLLOW-UPS:\n${qs.join('\n') || '(none)'}\n\nSTORY:\n${JSON.stringify(draft, null, 1)}`,
  }], 'judge', SCHEMA.judge)
  return { ...out, judge: verdict }
}
