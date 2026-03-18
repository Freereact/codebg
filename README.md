# CodeBG

[![CI](https://github.com/Freereact/codebg/actions/workflows/deploy-test-ci.yml/badge.svg?branch=test-ci)](https://github.com/Freereact/codebg/actions/workflows/deploy-test-ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![Node](https://img.shields.io/badge/Node-22-green.svg)](https://nodejs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-7-2D3748.svg)](https://www.prisma.io/)

Affordable AI-powered website platform for small businesses. Customers sign up, pick a template, pay, and get a site built.

## Stack

**Frontend:** React 18, TypeScript, Vite, TailwindCSS, React Router 7

**Backend:** Node.js 22, Express 4, Prisma 7 (PostgreSQL), JWT auth, Resend email

**Infrastructure:** DigitalOcean Droplet, Managed Postgres 17, Docker Compose, GitHub Actions CI/CD

## Project Structure

```
codebg/
  src/                  # React frontend (Vite)
  backend/
    src/
      auth/             # Magic-link auth module
      config.ts         # Environment config
      db.ts             # Prisma client
      server.ts         # Express server
    prisma/             # Prisma schema + config
    migrations/         # SQL migrations
    scripts/            # DB setup scripts
    test/               # Vitest test suite
  sample-apps/          # Customer template builds
  .github/workflows/    # CI/CD pipelines
```

## Development

```bash
# Frontend
npm ci
npm run dev

# Backend
cd backend
npm ci
npx prisma generate
npm run dev
```

## Code Quality

```bash
# Frontend
npm run lint              # ESLint (strict TS + React hooks)
npx prettier --check 'src/**/*.{ts,tsx}'

# Backend
cd backend
npm run lint              # ESLint (strict TS)
npm run format:check      # Prettier
npm test                  # Vitest (39 tests)
```

## Build

```bash
# Frontend (includes sitemap generation + prerendering)
npm run build

# Backend
cd backend && npm run build
```

## Database Setup

```bash
# Apply schema to a fresh database
cd backend
./scripts/setup-db.sh
```

Requires `psql` and `DATABASE_URL` in `.env` or environment.

## CI/CD

Push to `test-ci` branch triggers the full pipeline:

1. **Quality check:** lint, format, typecheck, tests, build (frontend + backend)
2. **Deploy:** SSH to VM, scp .env, Docker Compose rebuild

### Required GitHub Secrets (environment: `test-ci`)

| Secret | Description |
|--------|-------------|
| `VM_HOST` | Deployment server IP |
| `VM_USER` | SSH user |
| `VM_SSH_KEY` | SSH private key |
| `TURNSTILE_SITE_KEY` | Cloudflare Turnstile (frontend) |
| `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile (backend) |
| `RESEND_API_KEY` | Resend email service |
| `MAIL_FROM` | Sender email address |
| `MAIL_TO` | Admin notification recipient |
| `DATABASE_URL` | Full PostgreSQL connection URI |
| `JWT_SECRET` | JWT signing key (min 32 chars) |
| `FRONTEND_URL` | Public frontend URL |

## Auth Flow

Magic-link authentication (no passwords):

1. User enters email on `/login`
2. Backend creates SHA-256 hashed token in DB, sends raw token via Resend
3. User clicks link -> `/verify?token=...`
4. Backend atomically consumes token, issues JWT in httpOnly cookie
5. Frontend `AuthContext` manages session state

## License

[MIT](./LICENSE)
