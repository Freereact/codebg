#!/usr/bin/env node

// Generates src/data/samples.ts from sample-apps meta.json files.
// Fallback data used when the dynamic samples.json fetch fails.
// No thumbnail hashes — those come from the dynamic fetch at runtime.
// Run: node scripts/generate-fallback-samples.mjs

import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const customersDir = resolve(__dirname, '..', 'sample-apps', 'src', 'customers')
const outPath = resolve(__dirname, '..', 'src', 'data', 'samples.ts')

const samples = readdirSync(customersDir, { withFileTypes: true })
  .filter(d => d.isDirectory())
  .map(d => {
    try {
      return JSON.parse(readFileSync(resolve(customersDir, d.name, 'meta.json'), 'utf-8'))
    } catch { return null }
  })
  .filter(Boolean)
  .sort((a, b) => a.slug.localeCompare(b.slug))

const lines = samples.map(s => {
  const tags = s.tags ? `[${s.tags.map(t => `'${t}'`).join(',')}]` : '[]'
  return `  { slug: '${s.slug}', title: '${s.title}', description: '${s.description}', tags: ${tags} },`
})

const ts = `// Auto-generated from sample-apps/src/customers/*/meta.json
// Run: node scripts/generate-fallback-samples.mjs
import type { SampleEntry } from '../types'

export const fallbackSamples: SampleEntry[] = [
${lines.join('\n')}
]
`

writeFileSync(outPath, ts, 'utf-8')
console.log(`Fallback samples written to ${outPath} (${samples.length} entries)`)
