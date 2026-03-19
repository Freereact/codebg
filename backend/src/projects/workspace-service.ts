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
    fs.writeFile(path.join(wsDir, 'config.ts'), generateConfigTs(input)),
    fs.writeFile(path.join(wsDir, 'theme.css'), getTemplateThemeCss(input.templateSlug)),
    fs.writeFile(
      path.join(wsDir, 'meta.json'),
      JSON.stringify({ slug: input.subdomain, title: input.businessInfo.name, projectId: input.projectId }, null, 2),
    ),
  ])
}

export async function updateWorkspaceConfig(projectId: string, input: CreateWorkspaceInput): Promise<void> {
  const wsDir = getWorkspacePath(projectId)
  await fs.writeFile(path.join(wsDir, 'config.ts'), generateConfigTs(input))
  await fs.writeFile(
    path.join(wsDir, 'meta.json'),
    JSON.stringify({ slug: input.subdomain, title: input.businessInfo.name, projectId }, null, 2),
  )
}

function escapeTs(str: string): string {
  return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n')
}

function generateConfigTs(input: CreateWorkspaceInput): string {
  const { businessInfo, subdomain, templateSlug } = input
  const templateImport = `../../src/customers/${templateSlug}/config`

  return `import { config as templateConfig } from '${templateImport}'
import type { CustomerConfig } from '../../src/types'

export const config: CustomerConfig = {
  ...templateConfig,
  name: '${escapeTs(businessInfo.name)}',
  slug: '${escapeTs(subdomain)}',
  phone: '${escapeTs(businessInfo.phone)}',
  address: '${escapeTs(businessInfo.address)}',
  hours: '${escapeTs(businessInfo.hours)}',${businessInfo.email ? `\n  email: '${escapeTs(businessInfo.email)}',` : ''}${businessInfo.tagline ? `\n  tagline: '${escapeTs(businessInfo.tagline)}',` : ''}
}
`
}
