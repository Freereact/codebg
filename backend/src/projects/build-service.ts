import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import path from 'node:path'
import fs from 'node:fs/promises'
import { config } from '../config.js'
import { ensureNodeModulesSymlink } from './repo-service.js'

const execFileAsync = promisify(execFile)

export interface BuildResult {
  readonly status: 'success' | 'error'
  readonly message?: string
  readonly durationMs?: number
}

// ============================================================================
// Build Queue — serialized with depth limit and deduplication
// ============================================================================

interface QueueEntry {
  repoPath: string
  subdomain: string
  base?: string
  resolve: (result: BuildResult) => void
}

const queue: QueueEntry[] = []
let running = false

const MAX_QUEUE_DEPTH = Number(process.env.BUILD_MAX_QUEUE_DEPTH ?? '20')

/**
 * Build a project with Vite. Builds are queued and executed one at a time.
 * If the same subdomain+base is already queued, the older entry is replaced (latest edit wins).
 */
export async function buildProject(repoPath: string, subdomain: string, base?: string): Promise<BuildResult> {
  // Check queue depth
  if (queue.length >= MAX_QUEUE_DEPTH) {
    console.warn(`[build] queue full (${queue.length}/${MAX_QUEUE_DEPTH}), rejecting build for ${subdomain}`)
    return { status: 'error', message: 'Build queue is full. Please try again in a moment.' }
  }

  return new Promise<BuildResult>((resolve) => {
    const key = `${subdomain}:${base ?? 'default'}`

    // Deduplication: replace existing entry for same project+base
    const existingIdx = queue.findIndex((e) => `${e.subdomain}:${e.base ?? 'default'}` === key)
    if (existingIdx !== -1) {
      const old = queue[existingIdx]
      old.resolve({ status: 'success', message: 'Superseded by newer build' })
      queue.splice(existingIdx, 1)
      console.log(`[build] deduplicated queued build for ${subdomain}`)
    }

    queue.push({ repoPath, subdomain, base, resolve })
    console.log(`[build] queued ${subdomain} (position ${queue.length}, base=${base ?? '/sites/...'})`)
    processQueue()
  })
}

async function processQueue(): Promise<void> {
  if (running || queue.length === 0) return
  running = true

  const entry = queue.shift()
  if (!entry) return
  const { repoPath, subdomain, base, resolve } = entry

  try {
    const result = await executeBuild(repoPath, subdomain, base)
    resolve(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Build failed'
    resolve({ status: 'error', message })
  } finally {
    running = false
    // Process next in queue
    if (queue.length > 0) {
      void processQueue()
    }
  }
}

async function executeBuild(repoPath: string, subdomain: string, base?: string): Promise<BuildResult> {
  const isCustomDomainBuild = base === '/'
  const outputSuffix = isCustomDomainBuild ? '-custom' : ''
  const outputPath = path.join(config.sitesDir, subdomain + outputSuffix)
  const baseArg = base ?? `/sites/${subdomain}/`

  const start = Date.now()

  // Sync shared components from sample-apps (keeps AccessGate etc. up to date)
  await syncSharedComponents(repoPath)

  // Ensure node_modules symlink exists for the build
  await ensureNodeModulesSymlink(repoPath)

  const viteBin = path.join(repoPath, 'node_modules', '.bin', 'vite')
  await execFileAsync(viteBin, ['build', `--base=${baseArg}`, `--outDir=${outputPath}`, '--emptyOutDir'], {
    cwd: repoPath,
    env: {
      PATH: process.env.PATH,
      HOME: process.env.HOME,
      NODE_ENV: 'production',
    },
    timeout: 60_000,
    maxBuffer: 10 * 1024 * 1024, // 10MB stdout/stderr limit
  })

  const durationMs = Date.now() - start
  console.log(`[build] ${subdomain}${outputSuffix} completed in ${durationMs}ms`)
  return { status: 'success', durationMs }
}

/** Sync shared components (AccessGate, Footer, etc.) from sample-apps before each build */
async function syncSharedComponents(repoPath: string): Promise<void> {
  const sampleComponents = path.join(config.sampleAppsDir, 'src', 'components')
  const destComponents = path.join(repoPath, 'src', 'components')
  try {
    await fs.cp(sampleComponents, destComponents, { recursive: true })
  } catch {
    // Non-fatal — project may have custom components
  }
}

/** Get current queue depth (for monitoring/status endpoints) */
export function getBuildQueueStatus(): { queueDepth: number; maxDepth: number; isBuilding: boolean } {
  return { queueDepth: queue.length, maxDepth: MAX_QUEUE_DEPTH, isBuilding: running }
}
