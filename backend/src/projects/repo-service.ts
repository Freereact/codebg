import fs from 'node:fs/promises'
import path from 'node:path'
import { config } from '../config.js'
import { prisma } from '../db.js'
import type { TemplateSlug, BusinessInfo } from './site-config-schema.js'
import { getTemplateThemeCss } from './template-registry.js'
import { initRepo, commitFiles } from './git-service.js'

export class ProjectNotFoundError extends Error {
  constructor(projectId: string) {
    super(`Project not found: ${projectId}`)
    this.name = 'ProjectNotFoundError'
  }
}

/**
 * Verify ownership and return the repo path. Single point of truth for
 * all file/git operations. Uses the DB-returned ID, never the input.
 */
export async function getVerifiedRepoPath(projectId: string, userId: string): Promise<string> {
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId, deletedAt: null },
    select: { id: true },
  })

  if (!project) throw new ProjectNotFoundError(projectId)

  const repoPath = path.join(config.projectsDir, project.id)
  const resolved = path.resolve(repoPath)

  // Defense-in-depth: ensure path is within projectsDir
  if (!resolved.startsWith(path.resolve(config.projectsDir))) {
    throw new Error('Path traversal detected')
  }

  return resolved
}

interface InitRepoParams {
  projectId: string
  templateSlug: TemplateSlug
  subdomain: string
  businessInfo: BusinessInfo
}

/**
 * Scaffold a full standalone Vite/React project as a git repo.
 * The repo contains all source code, components, and config.
 * User data goes ONLY in overrides.json (pure JSON, never in code).
 */
export async function initProjectRepo(params: InitRepoParams): Promise<{ repoPath: string; commitHash: string }> {
  const { projectId, templateSlug, subdomain, businessInfo } = params
  const repoPath = path.join(config.projectsDir, projectId)

  // Create directory structure
  await fs.mkdir(path.join(repoPath, 'src', 'site', 'assets'), { recursive: true })
  await fs.mkdir(path.join(repoPath, 'src', 'components'), { recursive: true })

  // 1. Copy shared components from sample-apps
  await copySharedSources(repoPath)

  // 2. Generate root-level project files
  await Promise.all([
    fs.writeFile(path.join(repoPath, 'package.json'), generatePackageJson(subdomain)),
    fs.writeFile(path.join(repoPath, 'vite.config.ts'), generateViteConfig()),
    fs.writeFile(path.join(repoPath, 'tsconfig.json'), generateTsConfig()),
    fs.writeFile(path.join(repoPath, 'index.html'), generateIndexHtml(businessInfo.name)),
    fs.writeFile(path.join(repoPath, '.gitignore'), generateGitignore()),
    fs.writeFile(path.join(repoPath, 'README.md'), generateReadme(businessInfo.name)),
  ])

  // 3. Generate standalone main.tsx (imports from ./site/, not @customer)
  await fs.writeFile(path.join(repoPath, 'src', 'main.tsx'), generateMainTsx())

  // 4. Generate site-specific files
  const templateConfigSource = await readTemplateConfig(templateSlug)
  await Promise.all([
    fs.writeFile(
      path.join(repoPath, 'src', 'site', 'overrides.json'),
      JSON.stringify(buildOverrides(subdomain, businessInfo), null, 2),
    ),
    fs.writeFile(path.join(repoPath, 'src', 'site', 'config.ts'), transformConfigForStandalone(templateConfigSource)),
    fs.writeFile(path.join(repoPath, 'src', 'site', 'theme.css'), getTemplateThemeCss(templateSlug)),
  ])

  // 5. Copy template assets
  await copyTemplateAssets(templateSlug, path.join(repoPath, 'src', 'site', 'assets'))

  // 6. Create symlink to shared node_modules (for CodeBG-hosted builds)
  await ensureNodeModulesSymlink(repoPath)

  // 7. Git init + first commit
  const commitHash = await initRepo(repoPath, `Create ${businessInfo.name} from ${templateSlug} template`)

  return { repoPath, commitHash }
}

/**
 * Update overrides.json and create a git commit.
 */
export async function updateOverrides(
  projectId: string,
  userId: string,
  businessInfo: BusinessInfo,
): Promise<{ commitHash: string }> {
  const repoPath = await getVerifiedRepoPath(projectId, userId)
  const overridesPath = path.join(repoPath, 'src', 'site', 'overrides.json')

  // Read existing overrides, merge, write
  const existing = await fs.readFile(overridesPath, 'utf-8').catch(() => '{}')
  const current = JSON.parse(existing) as Record<string, unknown>
  const merged = { ...current, ...buildOverrides((current.slug as string) ?? projectId, businessInfo) }
  await fs.writeFile(overridesPath, JSON.stringify(merged, null, 2))

  const commitHash = await commitFiles(repoPath, ['src/site/overrides.json'], 'Update business info')
  return { commitHash }
}

/**
 * Ensure node_modules symlink exists for CodeBG-hosted builds.
 */
export async function ensureNodeModulesSymlink(repoPath: string): Promise<void> {
  const target = path.join(config.sampleAppsDir, 'node_modules')
  const link = path.join(repoPath, 'node_modules')
  try {
    await fs.access(link)
  } catch {
    await fs.symlink(target, link, 'dir')
  }
}

// ============================================================================
// Internal helpers — generate project files
// ============================================================================

function buildOverrides(slug: string, info: BusinessInfo): Record<string, string> {
  const overrides: Record<string, string> = {
    name: info.name,
    slug,
    phone: info.phone,
    address: info.address,
    hours: info.hours,
  }
  if (info.email) overrides.email = info.email
  if (info.tagline) overrides.tagline = info.tagline
  return overrides
}

async function readTemplateConfig(slug: TemplateSlug): Promise<string> {
  const configPath = path.join(config.sampleAppsDir, 'src', 'customers', slug, 'config.ts')
  return fs.readFile(configPath, 'utf-8')
}

/**
 * Transform a template config.ts for the standalone repo:
 * 1. Fix type import path (../../types → ../types)
 * 2. Rename export const config → const templateDefaults
 * 3. Append overrides merge
 */
function transformConfigForStandalone(source: string): string {
  let result = source
    // Fix type import path
    .replace(/from ['"]\.\.\/\.\.\/types['"]/g, "from '../types'")
    // Rename export: export const config → const templateDefaults
    .replace('export const config', 'const templateDefaults')

  // Append overrides merge (user data from JSON, not from code)
  result += `
import overrides from './overrides.json'

export const config: CustomerConfig = {
  ...templateDefaults,
  ...overrides,
  hero: {
    ...templateDefaults.hero,
    // Images come from template assets, text overrides from JSON
  },
}
`
  return result
}

async function copySharedSources(destDir: string): Promise<void> {
  const sampleSrc = path.join(config.sampleAppsDir, 'src')

  // Copy shared files
  const sharedFiles = ['App.tsx', 'types.ts', 'base.css']
  await Promise.all(sharedFiles.map((f) => fs.cp(path.join(sampleSrc, f), path.join(destDir, 'src', f))))

  // Copy all components
  await fs.cp(path.join(sampleSrc, 'components'), path.join(destDir, 'src', 'components'), {
    recursive: true,
  })
}

async function copyTemplateAssets(slug: TemplateSlug, destDir: string): Promise<void> {
  const assetsDir = path.join(config.sampleAppsDir, 'src', 'customers', slug, 'assets')
  try {
    await fs.cp(assetsDir, destDir, { recursive: true })
  } catch {
    // Template may have no assets directory
  }
}

function generatePackageJson(name: string): string {
  return JSON.stringify(
    {
      name: name.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      private: true,
      type: 'module',
      scripts: {
        dev: 'vite',
        build: 'vite build',
        preview: 'vite preview',
      },
      dependencies: {
        react: '^18.3.1',
        'react-dom': '^18.3.1',
      },
      devDependencies: {
        '@vitejs/plugin-react': '^4.3.4',
        vite: '^5.4.11',
        typescript: '^5.6.3',
        '@types/react': '^18.3.12',
        '@types/react-dom': '^18.3.1',
      },
    },
    null,
    2,
  )
}

function generateViteConfig(): string {
  return `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})
`
}

function generateTsConfig(): string {
  return JSON.stringify(
    {
      compilerOptions: {
        target: 'ES2020',
        module: 'ESNext',
        moduleResolution: 'Bundler',
        jsx: 'react-jsx',
        strict: true,
        resolveJsonModule: true,
        esModuleInterop: true,
        skipLibCheck: true,
        noEmit: true,
      },
      include: ['src'],
    },
    null,
    2,
  )
}

function generateIndexHtml(title: string): string {
  // Title is safe here — it's embedded in HTML, not in script
  const safeTitle = title.replace(/</g, '&lt;').replace(/>/g, '&gt;')
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet" />
    <title>${safeTitle}</title>
    <script type="module" src="/src/main.tsx"></script>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
`
}

function generateGitignore(): string {
  return `node_modules/
dist/
.DS_Store
`
}

function generateReadme(projectName: string): string {
  return `# ${projectName}

Built with [CodeBG](https://codebg.com) — open-source website platform.

## Development

\`\`\`bash
npm install
npm run dev
\`\`\`

## Build

\`\`\`bash
npm run build
\`\`\`

Output is in \`dist/\`. Deploy to any static hosting (Netlify, Vercel, Cloudflare Pages, etc.).

## Customization

- **Business info:** Edit \`src/site/overrides.json\`
- **Colors:** Edit \`src/site/theme.css\`
- **Images:** Replace files in \`src/site/assets/\`
- **Sections:** Edit \`src/site/config.ts\`
`
}

function generateMainTsx(): string {
  return `import './site/theme.css'
import './base.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { config } from './site/config'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App config={config} />
  </StrictMode>
)
`
}
