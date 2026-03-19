import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

interface ExecResult {
  stdout: string | Buffer
  stderr: string
}

async function git(repoPath: string, args: string[], opts?: { maxBuffer?: number }): Promise<ExecResult> {
  return execFileAsync('git', args, {
    cwd: repoPath,
    maxBuffer: opts?.maxBuffer ?? 10 * 1024 * 1024,
  }) as Promise<ExecResult>
}

export interface CommitInfo {
  hash: string
  date: string
  message: string
}

/**
 * Initialize a new git repo, stage all files, and create the initial commit.
 * Returns the commit hash.
 */
export async function initRepo(repoPath: string, message: string): Promise<string> {
  await git(repoPath, ['init'])
  await git(repoPath, ['add', '.'])
  await git(repoPath, ['commit', '-m', message, '--allow-empty'])
  const { stdout: hash } = await git(repoPath, ['rev-parse', 'HEAD'])
  return hash.toString().trim()
}

/**
 * Stage specific files and create a commit. Returns the commit hash.
 */
export async function commitFiles(repoPath: string, files: string[], message: string): Promise<string> {
  await git(repoPath, ['add', ...files])
  await git(repoPath, ['commit', '-m', message])
  const { stdout } = await git(repoPath, ['rev-parse', 'HEAD'])
  return stdout.toString().trim()
}

/**
 * Create a ZIP archive of the repo's HEAD (no .git, no node_modules).
 * Returns a Buffer containing the ZIP data.
 */
export async function createArchive(repoPath: string): Promise<Buffer> {
  const { stdout } = (await execFileAsync('git', ['archive', '--format=zip', 'HEAD'], {
    cwd: repoPath,
    maxBuffer: 50 * 1024 * 1024, // 50MB max for ZIP
    encoding: 'buffer',
  })) as unknown as { stdout: Buffer; stderr: string }
  return stdout
}

/**
 * Get commit history. Returns structured commit objects.
 */
export async function getHistory(repoPath: string, limit: number): Promise<CommitInfo[]> {
  const { stdout } = await git(repoPath, ['log', `--max-count=${limit}`, '--format=%H|%aI|%s'])
  const output = stdout.toString().trim()
  if (!output) return []

  return output.split('\n').map((line) => {
    const [hash, date, ...msgParts] = line.split('|')
    return { hash, date, message: msgParts.join('|') }
  })
}
