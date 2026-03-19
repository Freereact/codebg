import fs from 'node:fs/promises'
import path from 'node:path'
import { config } from '../config.js'
import type { TemplateSlug } from './site-config-schema.js'
import type { BusinessInfo } from './site-config-schema.js'
import { getTemplateThemeCss } from './template-registry.js'

export function getWorkspacePath(projectId: string): string {
  return path.join(config.projectsDir, projectId)
}

interface CreateWorkspaceInput {
  projectId: string
  templateSlug: TemplateSlug
  subdomain: string
  businessInfo: BusinessInfo
}

export async function createWorkspace(input: CreateWorkspaceInput): Promise<void> {
  const wsDir = getWorkspacePath(input.projectId)

  await fs.mkdir(wsDir, { recursive: true })
  await fs.mkdir(path.join(wsDir, 'assets'), { recursive: true })

  await Promise.all([
    // Pure JSON data file — no user input in executable code
    fs.writeFile(path.join(wsDir, 'overrides.json'), generateOverridesJson(input)),
    // Safe config.ts — imports JSON, no string interpolation of user data
    fs.writeFile(path.join(wsDir, 'config.ts'), generateSafeConfigTs(input.templateSlug)),
    fs.writeFile(path.join(wsDir, 'theme.css'), getTemplateThemeCss(input.templateSlug)),
    fs.writeFile(
      path.join(wsDir, 'meta.json'),
      JSON.stringify({ slug: input.subdomain, title: input.businessInfo.name, projectId: input.projectId }, null, 2),
    ),
  ])
}

function generateOverridesJson(input: CreateWorkspaceInput): string {
  const overrides: Record<string, string> = {
    name: input.businessInfo.name,
    slug: input.subdomain,
    phone: input.businessInfo.phone,
    address: input.businessInfo.address,
    hours: input.businessInfo.hours,
  }
  if (input.businessInfo.email) overrides.email = input.businessInfo.email
  if (input.businessInfo.tagline) overrides.tagline = input.businessInfo.tagline
  return JSON.stringify(overrides, null, 2)
}

function generateSafeConfigTs(templateSlug: TemplateSlug): string {
  // Only trusted values (template slug, absolute paths) go into the TS source.
  // User-provided business info is in overrides.json (pure data, never compiled).
  const sampleAppsDir = config.sampleAppsDir
  return `import { config as templateConfig } from '${sampleAppsDir}/src/customers/${templateSlug}/config'
import type { CustomerConfig } from '${sampleAppsDir}/src/types'
import overrides from './overrides.json'

export const config: CustomerConfig = {
  ...templateConfig,
  ...overrides,
}
`
}
