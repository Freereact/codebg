#!/usr/bin/env node

/**
 * Generates samples.json from meta.json files + built hero images.
 * Output format: { "samples": [ { slug, title, description, tags, thumbnail? } ] }
 * Run after build-all.sh: node generate-samples-json.mjs > /path/to/samples.json
 */

import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname, basename } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const customersDir = resolve(__dirname, 'src', 'customers')
const distDir = resolve(__dirname, 'dist')

const samples = []

for (const customer of readdirSync(customersDir, { withFileTypes: true })) {
  if (!customer.isDirectory()) continue

  const metaPath = resolve(customersDir, customer.name, 'meta.json')
  let meta
  try {
    meta = JSON.parse(readFileSync(metaPath, 'utf-8'))
  } catch {
    continue
  }

  // Scan built assets for hero image
  const assetsDir = resolve(distDir, meta.slug, 'assets')
  try {
    const files = readdirSync(assetsDir)
    const hero = files.find(f => f.includes('-hero-') && /\.(jpg|jpeg|png|webp)$/.test(f))
    if (hero) {
      const sampleBase = process.env.VITE_SAMPLE_APPS_URL || 'https://sample-apps.codebg.com'
      meta.thumbnail = `${sampleBase}/${meta.slug}/assets/${hero}`
    }
  } catch {
    // no built assets yet — skip thumbnail
  }

  samples.push(meta)
}

// Sort alphabetically by slug for stable output
samples.sort((a, b) => a.slug.localeCompare(b.slug))

const output = JSON.stringify({ samples }, null, 2)

const dest = process.argv[2]
if (dest) {
  writeFileSync(dest, output, 'utf-8')
  console.log(`samples.json written to ${dest} (${samples.length} samples)`)
} else {
  process.stdout.write(output)
}
