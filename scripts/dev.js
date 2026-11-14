import { spawn } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')

console.log('\x1b[32m%s\x1b[0m', '==================================================')
console.log('\x1b[32m%s\x1b[0m', '  KOSTARA PWA - Mode Pengembangan (Development)   ')
console.log('\x1b[32m%s\x1b[0m', '  Backend : http://localhost:4000                ')
console.log('\x1b[32m%s\x1b[0m', '  Frontend: http://localhost:5173                ')
console.log('\x1b[32m%s\x1b[0m', '  Tekan Ctrl + C untuk menghentikan server        ')
console.log('\x1b[32m%s\x1b[0m', '==================================================\n')

const isWin = process.platform === 'win32'
const npxCmd = isWin ? 'npx.cmd' : 'npx'

const backend = spawn('node', ['--watch', 'api/index.js'], {
  cwd: rootDir,
  stdio: 'inherit',
  shell: true
})

const frontend = spawn(npxCmd, ['vite'], {
  cwd: rootDir,
  stdio: 'inherit',
  shell: true
})

let isShuttingDown = false
const cleanExit = () => {
  if (isShuttingDown) return
  isShuttingDown = true
  console.log('\n\x1b[33m%s\x1b[0m', 'Menghentikan server Kostara...')
  if (isWin) {
    if (backend.pid) spawn('taskkill', ['/pid', backend.pid, '/f', '/t'], { stdio: 'ignore' })
    if (frontend.pid) spawn('taskkill', ['/pid', frontend.pid, '/f', '/t'], { stdio: 'ignore' })
  } else {
    backend.kill('SIGINT')
    frontend.kill('SIGINT')
  }
  process.exit(0)
}

process.on('SIGINT', cleanExit)
process.on('SIGTERM', cleanExit)
process.on('exit', cleanExit)
