// Loads the eval prompts from docs and fills the same placeholders as pipeline.mjs (variant "full").
import { readFileSync } from 'node:fs'
import { HttpError } from './errors.ts'

const dir = new URL('../../docs/ai-reporter/prompts/', import.meta.url)
const read = (name: string) => readFileSync(new URL(name, dir), 'utf8')

export const prompts = {
  reporter: read('reporter.md'),
  editor: read('editor.md'),
  revise: read('revise.md'),
}

const GENDER = { male: 'male (זכר)', female: 'female (נקבה)', unknown: 'unknown' }
const CTRL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g

export interface FillUser {
  name: string
  gender: keyof typeof GENDER
  facts: { k: string; v: string }[]
  previous: string
}

function clean(s: string, max: number, multiline = false) {
  const flat = (multiline ? s : s.replace(/[\r\n\u2028\u2029]+/g, ' '))
    .replace(CTRL, '')
    .replaceAll('</facts>', '')
    .replaceAll('</previous_story>', '')
    .replaceAll('{{', '')
    .replaceAll('}}', '')
  return flat.slice(0, max).trim()
}

function tagged(tag: 'facts' | 'previous_story', body: string) {
  return `<${tag}>\n${body || '(none)'}\n</${tag}>`
}

export function fill(tpl: string, user: FillUser, st: { articleType?: string; angle?: string; asked?: number } = {}) {
  const factLines = user.facts
    .slice(0, 50)
    .map((f) => `${clean(f.k, 40)}: ${clean(f.v, 200)}`)
    .filter((line) => line !== ':')
    .join('\n')
  const values: Record<string, string> = {
    '{{name}}': clean(user.name, 60),
    '{{gender}}': GENDER[user.gender],
    '{{facts}}': tagged('facts', clean(factLines, 4000, true)),
    '{{previous}}': tagged('previous_story', clean(user.previous, 4000, true)),
    '{{articleType}}': clean(st.articleType || 'feature', 40),
    '{{angle}}': clean(st.angle || '(none)', 300),
    '{{asked}}': String(st.asked ?? 0),
  }
  // Replacer function so a name containing "$&" is not treated as a replacement pattern.
  return Object.entries(values).reduce((out, [key, value]) => out.replaceAll(key, () => value), tpl)
}

export function reviseSystem(editorPrompt: string) {
  const head = prompts.revise.split(/^## kind: /m)[0]
  return head + '\n' + editorPrompt.split('## EXAMPLES')[0]
}

export function reviseBlock(kind: string) {
  const block = prompts.revise
    .split(/^## kind: /m)
    .slice(1)
    .find((b) => b.startsWith(kind + '\n'))
  if (!block) throw new HttpError(400, 'unknown revision')
  return block
}
