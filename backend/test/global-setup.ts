import { execSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

export default function setup() {
  const root = join(dirname(fileURLToPath(import.meta.url)), '../..')
  execSync('supabase db reset --yes', { cwd: root, stdio: 'inherit' })
}
