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

async function waitHealth(url: string) {
  for (let i = 0; i < 50; i++) {
    try {
      const res = await fetch(url)
      if (res.ok) return
    } catch {
      /* still booting */
    }
    await new Promise((r) => setTimeout(r, 100))
  }
  throw new Error(`${url} did not become healthy`)
}

function stop(child: ChildProcess) {
  return new Promise<void>((resolve) => {
    if (child.exitCode !== null || child.signalCode !== null) {
      resolve()
      return
    }
    child.once('exit', () => resolve())
    child.kill()
  })
}

export default async function setup() {
  const root = join(dirname(fileURLToPath(import.meta.url)), '../../../..')
  execSync('supabase db reset --yes', { cwd: root, stdio: 'inherit' })
  const db = process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'
  const secret = process.env.COOKIE_SECRET ?? 'dev-cookie-secret'
  const stubPort = await freePort()
  const apiPort = await freePort()
  const aiPort = await freePort()
  const children: ChildProcess[] = []
  const spawnAt = (cwd: string, args: string[], env: Record<string, string>) => {
    const child = spawn(process.execPath, args, { cwd, env: { ...process.env, ...env }, stdio: 'inherit' })
    children.push(child)
    return child
  }
  try {
    spawnAt(join(root, 'ai-reporter'), ['--experimental-strip-types', 'test/openai-stub.ts'], { STUB_PORT: String(stubPort) })
    await waitHealth(`http://127.0.0.1:${stubPort}/health`)
    spawnAt(join(root, 'backend'), ['--experimental-strip-types', 'src/server.ts'], {
      PORT: String(apiPort),
      DATABASE_URL: db,
      COOKIE_SECRET: secret,
    })
    await waitHealth(`http://127.0.0.1:${apiPort}/api/health`)
    spawnAt(join(root, 'ai-reporter'), ['--experimental-strip-types', 'src/server.ts'], {
      PORT: String(aiPort),
      DATABASE_URL: db,
      COOKIE_SECRET: secret,
      OPENAI_BASE_URL: `http://127.0.0.1:${stubPort}`,
      OPENAI_API_KEY: 'test',
    })
    await waitHealth(`http://127.0.0.1:${aiPort}/ai/health`)
  } catch (err) {
    await Promise.all(children.map(stop))
    throw err
  }
  process.env.HAITON_API_PORT = String(apiPort)
  process.env.HAITON_AI_PORT = String(aiPort)
  return () => Promise.all(children.map(stop)).then(() => undefined)
}
