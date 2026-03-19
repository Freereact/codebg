---
name: MVP Architecture Decisions
description: Key technical and business decisions for the CodeBG MVP launch (2026-03-18). Auth strategy, Stripe model, schema choice, kill list.
type: project
---

CodeBG MVP targets first paying customer by 2026-04-01 (2-week build).

**Auth:** Magic links via Resend + JWT in httpOnly cookie. No passwords, no OAuth. Auth is NOT required before payment -- account created as side effect of Stripe checkout.

**Stripe model:** Subscription mode with setup fee via `add_invoice_items`. One charge on first invoice (setup + first month), then recurring monthly. Products: Starter ($49+$19/mo), Professional ($149+$29/mo), Custom (manual invoice).

**Schema:** Use the Drizzle ORM schema in backend/src/db/schema.ts (8 tables). NOT the raw SQL in backend-expansion-plan.md. Need to add `business_name` text column to projects table.

**Stack changes:** Remove RabbitMQ + Redis. Direct Resend calls + Postgres email_jobs table. Frees ~328MB RAM on the droplet. New deps: stripe, jose, express-rate-limit.

**Killed:** RLS (not multi-tenant), file uploads (Month 2), content requests (Month 2), blog (Month 2-3), annual billing (Month 2), OAuth, analytics dashboard, A/B testing, i18n, chat system.

**Why:** Every hour spent on non-revenue features delays the first dollar. The existing site has $0 MRR and no payment mechanism.

**How to apply:** All feature requests should be filtered through the MVP kill list before implementation. If it is not in Weeks 1-2 of the plan, push back.
