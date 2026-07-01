import { spawn, execSync } from 'child_process'
import { existsSync, readFileSync, statSync } from 'fs'
import { resolve, dirname, extname, join } from 'path'
import { fileURLToPath } from 'url'
import { createServer as createHttpServer } from 'http'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PORT = process.env.PORT || 3000
const isProduction = process.env.NODE_ENV === 'production'

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
}

function log(tag, msg) {
  process.stdout.write(`[${tag}] ${msg}\n`)
}

function serveStatic(req, res) {
  const distDir = resolve(__dirname, 'dist')
  let filePath = join(distDir, req.url === '/' ? 'index.html' : req.url)

  try {
    const stat = statSync(filePath)
    if (!stat.isFile()) throw new Error('not a file')
  } catch {
    // SPA fallback — serve index.html for all non-file routes
    filePath = join(distDir, 'index.html')
  }

  try {
    const ext = extname(filePath)
    const mime = MIME_TYPES[ext] || 'application/octet-stream'
    const content = readFileSync(filePath)

    if (ext === '.html') {
      res.writeHead(200, { 'Content-Type': mime })
    } else {
      const maxAge = /\.(js|css|svg|png|jpg|ico)$/.test(ext) ? '31536000' : '0'
      res.writeHead(200, {
        'Content-Type': mime,
        'Cache-Control': `public, max-age=${maxAge}, immutable`,
      })
    }
    res.end(content)
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'text/plain' })
    res.end('Internal Server Error')
  }
}

function startProduction() {
  log('', `Starting FramerX production server on port ${PORT}...`)

  if (!existsSync(resolve(__dirname, 'dist'))) {
    log('build', 'dist/ not found — running build...')
    execSync('npm run build', { cwd: __dirname, stdio: 'inherit' })
  }

  const server = createHttpServer(serveStatic)

  server.listen(PORT, '0.0.0.0', () => {
    log('ready', `http://0.0.0.0:${PORT}`)
  })
}

async function startDev() {
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

if (isProduction) {
  startProduction()
} else {
  startDev()
}
