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

export interface FillUser {
  name: string
  gender: keyof typeof GENDER
  facts: { k: string; v: string }[]
  previous: string
}

export function fill(tpl: string, user: FillUser, st: { articleType?: string; angle?: string } = {}) {
  const values: Record<string, string> = {
    '{{name}}': user.name,
    '{{gender}}': GENDER[user.gender],
    '{{facts}}': user.facts.map((f) => `${f.k}: ${f.v}`).join('\n') || '(none)',
    '{{previous}}': user.previous || '(none)',
    '{{articleType}}': st.articleType || 'feature',
    '{{angle}}': st.angle || '(none)',
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
