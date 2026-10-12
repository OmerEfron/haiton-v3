import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const src = fileURLToPath(new URL('.', import.meta.url))
const prefix = /(?:^|[\s"'`])(?:sm|md|lg|xl|2xl):/

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    return statSync(path).isDirectory() ? walk(path) : [path]
  })
}

describe('mobile and desktop stay separate', () => {
  const tsx = walk(src).filter((path) => path.endsWith('.tsx'))

  it('has no responsive Tailwind prefixes', () => {
    const hits = tsx.flatMap((path) =>
      readFileSync(path, 'utf8')
        .split('\n')
        .flatMap((line, i) => (prefix.test(line) ? [`${path}:${i + 1}`] : [])),
    )
    expect(hits).toEqual([])
  })

  it('pairs every mobile view with a desktop view', () => {
    const mobile = tsx.filter((path) => path.endsWith('.mobile.tsx'))
    const desktop = tsx.filter((path) => path.endsWith('.desktop.tsx'))
    const missing = [
      ...mobile.filter((path) => !desktop.includes(path.replace('.mobile.tsx', '.desktop.tsx'))),
      ...desktop.filter((path) => !mobile.includes(path.replace('.desktop.tsx', '.mobile.tsx'))),
    ]
    expect(missing).toEqual([])
  })
})
