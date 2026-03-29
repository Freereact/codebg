---
name: Infrastructure State
description: Current CodeBG infrastructure on DigitalOcean as of 2026-03-18. Droplet, Postgres, Spaces, costs.
type: project
---

**Droplet:** codebg-host, s-2vcpu-4gb-amd, Ubuntu 24.04, tor1, IP 138.197.143.137, ~$28/mo. Runs Nginx + Docker Compose (API on port 8787). Serves codebg.com and sample-apps.codebg.com as static files via Nginx.

**Postgres:** codebg-db, PG 17, db-s-1vcpu-1gb, tor1, $15/mo. Private VPC connection. Firewall: droplet only. Schema designed (Drizzle), not yet deployed. max_connections ~25.

**Spaces:** codebg-space, tor1, $5/mo. Empty. No access keys generated yet. CDN not enabled.

**Total CodeBG infra:** ~$48/mo. Budget ceiling $100/mo.

**External services:** Resend (free, 100/day), Cloudflare Turnstile (free), GA4 (free), GitHub Actions (free), Let's Encrypt (free).

**CI/CD:** GitHub Actions on push to test-ci branch. Quality check then SSH deploy. Repo: Freereact/codebg (deploy remote -- never push to origin).

**Why:** Budget constraint drives all architecture decisions. No managed K8s, no Redis/ElastiCache, no Elasticsearch.

**How to apply:** Any infrastructure proposal must fit within the $100/mo ceiling. Suggest Postgres-based alternatives to specialized services.
