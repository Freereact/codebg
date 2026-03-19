import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import path from 'node:path'
import { config } from '../config.js'
import { getWorkspacePath } from './workspace-service.js'

const execFileAsync = promisify(execFile)

export interface BuildResult {
  readonly status: 'success' | 'error'
  readonly message?: string
  readonly durationMs?: number
}

// Simple in-process mutex to serialize builds
let buildLock: Promise<void> = Promise.resolve()

export async function buildProject(projectId: string, subdomain: string): Promise<BuildResult> {
  const workspacePath = getWorkspacePath(projectId)
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

    const viteBin = path.join(config.sampleAppsDir, 'node_modules', '.bin', 'vite')
    await execFileAsync(viteBin, ['build', `--base=/sites/${subdomain}/`, `--outDir=${outputPath}`, '--emptyOutDir'], {
      cwd: config.sampleAppsDir,
      env: { ...process.env, VITE_CUSTOMER: workspacePath },
      timeout: 60_000,
    })

    return { status: 'success', durationMs: Date.now() - start }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Build failed'
    console.error(`[build] project ${projectId} failed:`, message)
    return { status: 'error', message }
  } finally {
    resolve()
  }
}
