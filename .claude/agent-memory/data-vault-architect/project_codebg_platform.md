---
name: CodeBG Platform Transition
description: CodeBG is transitioning from a contact-form-only marketing site to a self-service platform with accounts, projects, payments, and CRM
type: project
---

CodeBG is pivoting from a static marketing site with a contact form to a full self-service web development platform targeting small businesses.

**Why:** Current model is $49/site one-time with zero recurring revenue. Goal is $49 setup + $19-39/mo hosting tiers (starter/professional/custom).

**How to apply:** All schema and backend work should support: user accounts (magic link auth), project pipeline tracking (8 stages), Stripe subscriptions, email job queue (replacing RabbitMQ+Redis), client portal, and admin CRM. Infrastructure is constrained — 1GB managed Postgres on DigitalOcean at $15/mo.
