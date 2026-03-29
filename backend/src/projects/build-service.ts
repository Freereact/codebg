import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import path from 'node:path'
import { config } from '../config.js'
import { ensureNodeModulesSymlink } from './repo-service.js'

const execFileAsync = promisify(execFile)

export interface BuildResult {
  readonly status: 'success' | 'error'
  readonly message?: string
  readonly durationMs?: number
}

// Simple in-process mutex to serialize builds
let buildLock: Promise<void> = Promise.resolve()

export async function buildProject(repoPath: string, subdomain: string): Promise<BuildResult> {
  const outputPath = path.join(config.sitesDir, subdomain)

  // Serialize builds — wait for any in-progress build
  const currentLock = buildLock
  let resolve: () => void = () => {}
  buildLock = new Promise<void>((r) => {
    resolve = r
  })

  try {
    await currentLock
    const start = Date.now()

    // Ensure node_modules symlink exists for the build
    await ensureNodeModulesSymlink(repoPath)

    const viteBin = path.join(repoPath, 'node_modules', '.bin', 'vite')
    await execFileAsync(viteBin, ['build', `--base=/sites/${subdomain}/`, `--outDir=${outputPath}`, '--emptyOutDir'], {
      cwd: repoPath,
      env: { ...process.env },
      timeout: 60_000,
    })

    return { status: 'success', durationMs: Date.now() - start }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Build failed'
    console.error(`[build] project failed:`, message)
    return { status: 'error', message }
  } finally {
    resolve()
  }
}
