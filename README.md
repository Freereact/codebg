# CodeBG

[![CI](https://github.com/codebg-team/codebg/actions/workflows/deploy-test-ci.yml/badge.svg?branch=test-ci)](https://github.com/codebg-team/codebg/actions/workflows/deploy-test-ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![Node](https://img.shields.io/badge/Node-22-green.svg)](https://nodejs.org/)
[![Tests](https://img.shields.io/badge/Tests-132-brightgreen.svg)]()

Open-source website platform for small businesses. Users pick a template, fill in their business info, and get a live site in seconds. Each project is a real git repo — own your code, deploy anywhere.

## How It Works

```
Pick template → Fill business info → Site built (~2s) → Preview live
     ↓                                                       ↓
  6 templates                                    Click-to-comment feedback
  (bakery, auto shop,                                        ↓
   dental, cafe, etc.)                           Admin reviews + responds
                                                             ↓
                                                 Push to GitHub → auto-rebuild
                                                             ↓
                                                 User emailed: "preview ready"
```

## Features

**For users:**
- Magic-link auth (no passwords)
- Pick from 6 industry templates
- Site built and deployed in ~2 seconds
- Live preview at `/sites/<subdomain>/`
- Click-to-comment visual feedback on any section
- Download project as standalone ZIP
- Email notifications on updates

**For operators (admin):**
- Dashboard: projects, users, feedback stats
- Respond to feedback inline (auto-emails user)
- Change project status through pipeline
- Rebuild projects, add internal notes
- Push changes via GitHub → auto-rebuild

**For developers:**
- Each project is a git repo on GitHub (private)
- Clone → edit → push → auto-rebuild
- Downloaded ZIP: `npm install && npm run build` works anywhere
- Commit `Fix #<feedback-id>` auto-completes feedback

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, TailwindCSS, React Router 7 |
| Backend | Node.js 22, Express 4, Prisma 7, Zod validation |
| Database | PostgreSQL 17 (DigitalOcean Managed) |
| Auth | Magic-link via Resend (JWT httpOnly cookies) |
| Email | Resend API |
| Git | GitHub App (auto-create repos, webhook rebuilds) |
| Infrastructure | DigitalOcean Droplet, Docker Compose, nginx |
| CI/CD | GitHub Actions |

## Project Structure

```
codebg/
  src/                          # React frontend (Vite SPA)
    pages/                      # Route pages (home, login, portal, admin)
    components/                 # UI components (layout, portal, auth, admin)
    contexts/                   # React contexts (auth, theme)
    hooks/                      # Custom hooks (useProjects, etc.)
    lib/                        # API clients (auth, projects, admin, feedback)
    types/                      # Shared TypeScript types
  backend/
    src/
      auth/                     # Magic-link auth (service, middleware, routes)
      projects/                 # Project CRUD, build pipeline, feedback
      admin/                    # Admin dashboard API, notifications
      github/                   # GitHub App integration, webhooks
      config.ts                 # Environment configuration
      db.ts                     # Prisma client (pg adapter)
      server.ts                 # Express server
    prisma/                     # Prisma schema + config
    migrations/                 # SQL migrations
    scripts/                    # DB setup, utilities
    test/                       # Vitest test suite (132 tests)
  sample-apps/                  # Template sites (6 industry templates)
    src/customers/              # Template configs + assets
    src/components/             # Shared section components
  infra/nginx/                  # Nginx configuration
  .github/workflows/            # CI/CD pipeline
  dev_info/                     # Architecture docs, deployment logs (gitignored)
```

## Quick Start (Development)

### Prerequisites

- Node.js 22+
- PostgreSQL 17
- Git

### 1. Clone and install

```bash
git clone https://github.com/codebg-team/codebg.git
cd codebg

# Frontend
npm ci

# Backend
cd backend
npm ci
npx prisma generate
```

### 2. Set up the database

```bash
# Create a PostgreSQL database, then:
cp .env.example .env
# Edit .env with your DATABASE_URL, JWT_SECRET, etc.

# Apply schema
./scripts/setup-db.sh
```

### 3. Run development servers

```bash
# Terminal 1: Frontend
npm run dev

# Terminal 2: Backend
cd backend
npm run dev
```

Frontend runs at `http://localhost:5173`, backend at `http://localhost:8787`.

### 4. Set up an admin account

After creating your first account via the login page:

```sql
UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
```

This is intentionally a manual SQL step — admin access is a one-time security decision, not an automated flow.

## Environment Variables

### Backend (`.env`)

```bash
# Server
PORT=8787
ALLOWED_ORIGINS=https://your-domain.com

# Database
DATABASE_URL=postgresql://user:pass@host:port/db?sslmode=require

# Auth
JWT_SECRET=<openssl rand -hex 32>
FRONTEND_URL=https://your-domain.com
MAGIC_LINK_EXPIRY_MINUTES=15

# Email (Resend)
RESEND_API_KEY=re_...
MAIL_FROM=YourApp <noreply@your-domain.com>
MAIL_TO=admin@your-domain.com

# GitHub App (optional — for auto repo creation)
GH_APP_ID=<app-id>
GH_APP_PRIVATE_KEY=<base64-encoded-pem>
GH_APP_INSTALLATION_ID=<installation-id>
GH_WEBHOOK_SECRET=<webhook-secret>
GH_ORG=<github-org-name>

# Build pipeline
PROJECTS_DIR=/var/www/projects
SITES_DIR=/var/www/sites
SAMPLE_APPS_DIR=/path/to/sample-apps

# Legacy (contact form — can be removed in future)
REDIS_URL=redis://redis:6379
RABBITMQ_URL=amqp://rabbitmq:5672
TURNSTILE_SECRET_KEY=<cloudflare-turnstile-secret>
```

### Frontend (`.env` or Vite env)

```bash
VITE_TURNSTILE_SITE_KEY=<cloudflare-turnstile-site-key>
VITE_API_URL=                # Empty for same-origin, or http://localhost:8787 for dev
```

## Code Quality

```bash
# Frontend
npm run lint                              # ESLint (strict TS + React)
npx prettier --check 'src/**/*.{ts,tsx}'  # Prettier

# Backend
cd backend
npm run lint                              # ESLint (strict TS)
npm run format:check                      # Prettier
npm test                                  # Vitest (132 tests)
npm run build                             # TypeScript build
```

## Testing

132 tests across 12 test suites:

| Suite | Tests | What it covers |
|-------|-------|---------------|
| auth-validation | 13 | Magic-link + token schemas |
| auth-jwt | 14 | JWT sign/verify, algorithm enforcement |
| auth-middleware | 10 | jwtMiddleware, requireAuth, requireAdmin |
| projects-validation | 10 | Query params, project ID |
| projects-service | 11 | List, find, create, delete (mocked Prisma) |
| site-config-schema | 11 | Template + business info validation |
| subdomain | 10 | Slugify, uniqueness, edge cases |
| git-service | 10 | Init, commit, archive, history |
| repo-service | 14 | Scaffold, verified paths, overrides, injection safety |
| feedback-validation | 10 | Create + update feedback schemas |
| admin-validation | 17 | All admin query + input schemas |
| validation | 2 | Contact form schema |

Run all: `cd backend && npm test`

## Deployment

### CI/CD (GitHub Actions)

Push to `test-ci` branch triggers:

1. **Quality check:** frontend lint + format + build, backend lint + format + tests + build
2. **Deploy:** SSH to VM, write .env, create directories, Docker Compose rebuild, health verify

### Required GitHub Secrets

| Secret | Description |
|--------|-------------|
| `VM_HOST` | Server IP address |
| `VM_USER` | SSH user (typically `root`) |
| `VM_SSH_KEY` | SSH private key |
| `DATABASE_URL` | PostgreSQL connection URI |
| `JWT_SECRET` | JWT signing key (`openssl rand -hex 32`) |
| `FRONTEND_URL` | Public URL (e.g., `https://codebg.com`) |
| `RESEND_API_KEY` | Resend email service key |
| `MAIL_FROM` | Sender address |
| `MAIL_TO` | Admin notification recipient |
| `TURNSTILE_SITE_KEY` | Cloudflare Turnstile (frontend) |
| `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile (backend) |
| `GH_APP_ID` | GitHub App ID |
| `GH_APP_PRIVATE_KEY` | GitHub App private key (base64) |
| `GH_APP_INSTALLATION_ID` | GitHub App installation ID |
| `GH_WEBHOOK_SECRET` | GitHub webhook HMAC secret |

### Manual Setup (one-time)

After first deploy:

```bash
# 1. Apply database schema
ssh root@your-server
cd ~/projects/codebg/backend
./scripts/setup-db.sh

# 2. Set admin role
DB_URL=$(grep DATABASE_URL .env | cut -d= -f2-)
psql "$DB_URL" -c "UPDATE users SET role = 'admin' WHERE email = 'your@email.com';"
```

### GitHub App Setup (optional)

For automatic repo creation + webhook rebuilds:

1. Create a GitHub App in your org settings
2. Permissions: Contents (R/W), Administration (R/W), Metadata (R)
3. Subscribe to: Push events
4. Set webhook URL: `https://your-domain.com/api/hooks/github`
5. Install the App on your org
6. Add the credentials as GitHub secrets

## Architecture

### Auth Flow
```
Email → Magic link → SHA-256 token in DB → JWT cookie (httpOnly, secure)
```

### Project Creation Flow
```
Pick template → Business info → Scaffold git repo → Vite build (~2s)
→ Deploy to /sites/<subdomain>/ → Create GitHub repo → Push
```

### Feedback Flow
```
User clicks section in preview → Comment stored → Admin emailed
→ Admin responds → User emailed → Admin pushes fix to GitHub
→ Webhook → Pull → Rebuild → User emailed "preview ready"
```

### User Isolation
- All file paths constructed from DB-verified UUIDs (never user input)
- `getVerifiedRepoPath()` — single point of truth for file operations
- Git operations use `execFile` (no shell injection)
- User data in `overrides.json` (JSON) — never in compiled code

## Templates

6 industry templates in `sample-apps/src/customers/`:

| Template | Industry | Sections |
|----------|----------|----------|
| autoshop | Auto repair | Services, testimonials, location |
| bakery | Bakery/cafe | Menu, story, testimonials, location |
| dental | Dental clinic | Services, trust points, booking |
| massage | Wellness/spa | Services, pricing, gallery |
| skaha-cafe | Cafe/restaurant | Menu, gallery, story, location |
| winery | Winery/vineyard | Wine list, gallery, tasting, visits |

Each template uses the `CustomerConfig` interface with composable sections (hero, services, gallery, pricing, testimonials, location, CTA, steps, benefits).

## Contributing

1. Fork the repo
2. Create a feature branch
3. Write tests first (TDD)
4. Run `npm run lint && npm run format:check && npm test` before committing
5. Submit a PR

Code style: Prettier (semi: false, singleQuote, trailingComma: all, printWidth: 120) + ESLint (strict TypeScript, no-any).

## License

[MIT](./LICENSE)
