import { execSync, spawn, type ChildProcess } from 'node:child_process'
import { createServer } from 'node:net'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

function freePort() {
  return new Promise<number>((resolve, reject) => {
    const s = createServer()
    s.listen(0, '127.0.0.1', () => {
      const addr = s.address()
      const port = typeof addr === 'object' && addr ? addr.port : 0
      s.close((err) => (err ? reject(err) : resolve(port)))
    })
  })
}

async function waitHealth(port: number) {
  for (let i = 0; i < 50; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/api/health`)
      if (res.ok) return
    } catch {
      /* still booting */
    }
    await new Promise((r) => setTimeout(r, 100))
  }
  throw new Error('api did not become healthy')
}

export default async function setup() {
  const root = join(dirname(fileURLToPath(import.meta.url)), '../../../..')
  execSync('supabase db reset --yes', { cwd: root, stdio: 'inherit' })
  const port = await freePort()
  const backend = join(root, 'backend')
  const child: ChildProcess = spawn(process.execPath, ['--experimental-strip-types', 'src/server.ts'], {
    cwd: backend,
    env: {
      ...process.env,
      PORT: String(port),
      DATABASE_URL: process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@127.0.0.1:54322/postgres',
      COOKIE_SECRET: process.env.COOKIE_SECRET ?? 'dev-cookie-secret',
    },
    stdio: 'inherit',
  })
  await waitHealth(port)
  process.env.HAITON_API_PORT = String(port)
  return () =>
    new Promise<void>((resolve) => {
      child.once('exit', () => resolve())
      child.kill()
    })
}
