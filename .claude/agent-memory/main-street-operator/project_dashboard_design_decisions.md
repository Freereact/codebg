---
name: Customer dashboard design decisions
description: Dashboard content strategy, status label translations, copy guidelines, and implementation priorities for the customer portal (Phase 2)
type: project
---

Phase 2 customer portal (dashboard) design decisions made 2026-03-18.

**Why:** After login, users currently land on the marketing homepage. Need a dedicated `/dashboard` route as the post-auth landing page.

**How to apply:**

Key decisions:
- Dashboard has THREE states: empty (no project), active (project in progress), live (site launched)
- Empty state = single "Start my project" CTA, NOT a redirect to pricing page
- Status labels must be human language, never raw DB values (e.g. `building` -> "We're building your site")
- Four-step progress tracker: Info -> Building -> Review -> Live (maps multiple internal statuses to fewer customer-visible steps)
- Post-launch dashboard is minimal: site URL, request-an-update form, update counter, recent changes, billing link
- Never say: "magic link", "deploy", "template", "config", "brief", "ticket", "tier"
- Always say: "sign-in link", "your site", "your info", "project details", verbs not nouns

Implementation priorities:
1. Create /dashboard route wrapped in RequireAuth
2. Build GET /api/projects endpoint for user's projects
3. Fix verify-page.tsx to redirect to /dashboard not /
4. Fix login page "Send magic link" -> "Send sign-in link"
5. Fix header Dashboard link to go to /dashboard

Flour-hands test for post-launch: "Can she request a menu price change from her phone in under 30 seconds?"
