---
name: CodeBG codebase architecture
description: Key technical details about CodeBG repo structure -- frontend (React/Vite/Tailwind), backend (Express/Redis/RabbitMQ), sample-apps system
type: project
---

CodeBG is a web development agency site with a sample-apps showcase system.

**Why:** Understanding the existing architecture prevents duplicate work and ensures new features integrate cleanly.

**How to apply:**
- Frontend: React + Vite + Tailwind at `/src`, uses react-router with `RootLayout` as shell
- Backend: Express + Redis + RabbitMQ + Resend at `/backend/src`, currently handles contact form emails only
- Sample apps: separate Vite app at `/sample-apps/src`, uses `CustomerConfig` type with sections-based rendering
- Six customer configs exist: autoshop, bakery, dental, massage, skaha-cafe, winery
- `CustomerConfig` type supports sections: services, gallery, benefits, steps, pricing, testimonials, location, cta
- Contact form uses Turnstile captcha with modal flow
- Current pricing page shows "From $49" single-page sites; no tiered plans yet
- Process: Brief -> Draft -> Build -> Launch (4 steps)
- No database yet -- just Redis for email job tracking. Will need Postgres for accounts/projects.
