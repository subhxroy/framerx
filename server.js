import { spawn, execSync } from 'child_process'
import { existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

function log(tag, msg) {
  process.stdout.write(`[${tag}] ${msg}\n`)
}

async function main() {
  log('', 'Starting FramerX development environment...\n')

  // Install dependencies if needed
  if (!existsSync(resolve(__dirname, 'node_modules'))) {
    log('install', 'Installing dependencies...')
    execSync('npm install', { cwd: __dirname, stdio: 'inherit' })
  }

  // Start Vite dev server
  const vite = spawn('npx', ['vite', '--host'], {
    cwd: __dirname,
    stdio: 'inherit',
    shell: true,
  })

  vite.on('error', (err) => {
    log('vite', `Failed to start: ${err.message}`)
    process.exit(1)
  })

  vite.on('exit', (code) => {
    if (code !== null && code !== 0) {
      log('vite', `Exited with code ${code}`)
    }
  })

  // Attempt to start Supabase if Docker is available
  let supabase = null
  try {
    execSync('docker info', { stdio: 'ignore' })
    log('supabase', 'Starting local Supabase...')
    supabase = spawn('npx', ['supabase', 'start'], {
      cwd: __dirname,
      stdio: 'inherit',
      shell: true,
    })
    supabase.on('error', () => {
      log('supabase', 'Supabase unavailable — skipping.')
      supabase = null
    })
  } catch {
    log('supabase', 'Docker not found — skipping Supabase (not required for editor).')
  }

  // Graceful shutdown
  const shutdown = () => {
    log('', '\nShutting down...')
    vite.kill()
    if (supabase) supabase.kill()
    process.exit(0)
  }
  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
}

main()
