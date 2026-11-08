import { execSync, spawn, type ChildProcess } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

async function waitHealth() {
  for (let i = 0; i < 50; i++) {
    try {
      const res = await fetch('http://127.0.0.1:4099/health')
      if (res.ok) return
    } catch {
      /* still booting */
    }
    await new Promise((r) => setTimeout(r, 100))
  }
  throw new Error('openai stub did not become healthy')
}

export default async function setup() {
  const root = join(dirname(fileURLToPath(import.meta.url)), '../..')
  execSync('supabase db reset --yes', { cwd: root, stdio: 'inherit' })
  const child: ChildProcess = spawn(process.execPath, ['--experimental-strip-types', 'test/openai-stub.ts'], {
    cwd: join(root, 'ai-reporter'),
    stdio: 'inherit',
    env: { ...process.env, STUB_PORT: '4099' },
  })
  try {
    await waitHealth()
  } catch (err) {
    child.kill()
    throw err
  }
  return () =>
    new Promise<void>((resolve) => {
      if (child.exitCode !== null || child.signalCode !== null) {
        resolve()
        return
      }
      child.once('exit', () => resolve())
      child.kill()
    })
}
