---
name: codebg_do_infrastructure
description: DigitalOcean infrastructure details for CodeBG — droplet, managed Postgres, Spaces, costs
type: project
---

**Why:** Infrastructure is fixed and all future backend/deploy decisions must work within these constraints.

**How to apply:** Always reference these when recommending instance sizes, connection limits, or cost estimates.

Droplet: codebg-host
- ID: 558003516
- Size: s-2vcpu-4gb-amd (2 vCPU, 4GB RAM, 80GB disk)
- IP: 138.197.143.137 (public), 10.137.0.3 (private)
- Region: tor1 (Toronto)
- VPC: 394569a5-dc7f-11e8-b1a9-3cfdfea9ee58
- Cost: ~$28/mo

Managed Postgres: codebg-db
- ID: 18c785da-9ef8-47f1-ada6-cf3683b3f2c7
- Engine: PostgreSQL 17
- Size: db-s-1vcpu-1gb (1 vCPU, 1GB RAM, 10GB storage)
- Region: tor1 (same VPC as droplet)
- Private host: private-codebg-db-do-user-1751133-0.h.db.ondigitalocean.com:25060
- DB to use: `codebg` (not `defaultdb`)
- SSL: required (sslmode=require)
- Firewall: droplet 558003516 only
- max_connections: ~25 (DO default for this tier) — use pool max: 5
- Cost: $15/mo

DO Spaces: codebg-space
- Endpoint: https://codebg-space.tor1.digitaloceanspaces.com
- S3 endpoint: https://tor1.digitaloceanspaces.com (bucket: codebg-space)
- CDN: not enabled yet
- Access: separate Spaces access keys (not DO API token)
- Use @aws-sdk/client-s3 with S3-compatible endpoint
- Cost: $5/mo

Total fixed DO cost for codebg project: $48/mo (at budget ceiling)

Scale trigger for DB: when pg_stat_activity count approaches 25, upgrade to db-s-1vcpu-2gb ($30/mo).
