import crypto from 'node:crypto'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { Octokit } from '@octokit/rest'
import { createAppAuth } from '@octokit/auth-app'
import { config } from '../config.js'

const execFileAsync = promisify(execFile)

let octokitInstance: Octokit | null = null

function getOctokit(): Octokit {
  if (octokitInstance) return octokitInstance

  if (!config.ghAppId || !config.ghAppPrivateKey || !config.ghAppInstallationId) {
    throw new Error('GitHub App credentials not configured')
  }

  octokitInstance = new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId: config.ghAppId,
      privateKey: config.ghAppPrivateKey,
      installationId: config.ghAppInstallationId,
    },
  })

  return octokitInstance
}

/**
 * Create a GitHub repo in the configured org. Returns the clone URL.
 */
export async function createGitHubRepo(
  name: string,
  description: string,
): Promise<{ cloneUrl: string; htmlUrl: string }> {
  const octokit = getOctokit()

  // Try org first, fall back to user account
  let data: { clone_url: string; html_url: string }
  try {
    const res = await octokit.repos.createInOrg({
      org: config.ghOrg,
      name,
      description,
      auto_init: false,
      private: true,
    })
    data = res.data
  } catch {
    const res = await octokit.repos.createForAuthenticatedUser({
      name,
      description,
      auto_init: false,
      private: true,
    })
    data = res.data
  }

  return {
    cloneUrl: data.clone_url,
    htmlUrl: data.html_url,
  }
}

/**
 * Push a local git repo to a GitHub remote using token-based HTTPS auth.
 */
export async function pushToGitHub(localRepoPath: string, cloneUrl: string): Promise<void> {
  const octokit = getOctokit()

  // Get installation token for HTTPS auth
  const { data: tokenData } = await (
    octokit as Octokit & { auth: () => Promise<{ token: string }> }
  ).rest.apps.createInstallationAccessToken({
    installation_id: config.ghAppInstallationId,
  })
  const token = tokenData.token

  // Construct authenticated URL: https://x-access-token:TOKEN@github.com/org/repo.git
  const authedUrl = cloneUrl.replace('https://', `https://x-access-token:${token}@`)

  await execFileAsync('git', ['remote', 'add', 'github', authedUrl], {
    cwd: localRepoPath,
    timeout: 10_000,
  }).catch(() => {
    // Remote might already exist — update it
    return execFileAsync('git', ['remote', 'set-url', 'github', authedUrl], {
      cwd: localRepoPath,
      timeout: 10_000,
    })
  })

  // Push current branch (could be master or main depending on git config)
  const { stdout: branch } = await execFileAsync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], {
    cwd: localRepoPath,
    timeout: 5_000,
  })
  await execFileAsync('git', ['push', 'github', branch.trim(), '--force'], {
    cwd: localRepoPath,
    timeout: 60_000,
  })
}

/**
 * Pull latest from GitHub remote into the local repo.
 */
export async function pullFromGitHub(localRepoPath: string): Promise<void> {
  const octokit = getOctokit()

  const { data: tokenData } = await (
    octokit as Octokit & { auth: () => Promise<{ token: string }> }
  ).rest.apps.createInstallationAccessToken({
    installation_id: config.ghAppInstallationId,
  })
  const token = tokenData.token

  // Update remote URL with fresh token
  const remoteUrl = await execFileAsync('git', ['remote', 'get-url', 'github'], {
    cwd: localRepoPath,
    timeout: 5_000,
  })
    .then((r) => r.stdout.trim())
    .catch(() => '')

  if (remoteUrl) {
    const baseUrl = remoteUrl.replace(/https:\/\/[^@]*@/, 'https://')
    const authedUrl = baseUrl.replace('https://', `https://x-access-token:${token}@`)
    await execFileAsync('git', ['remote', 'set-url', 'github', authedUrl], {
      cwd: localRepoPath,
      timeout: 5_000,
    })
  }

  const { stdout: branch } = await execFileAsync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], {
    cwd: localRepoPath,
    timeout: 5_000,
  })
  await execFileAsync('git', ['pull', 'github', branch.trim(), '--ff-only'], {
    cwd: localRepoPath,
    timeout: 60_000,
  })
}

/**
 * Verify a GitHub webhook signature.
 */
export function verifyWebhookSignature(payload: string, signature: string): boolean {
  if (!config.ghWebhookSecret) return false

  const expected = 'sha256=' + crypto.createHmac('sha256', config.ghWebhookSecret).update(payload).digest('hex')

  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
}
