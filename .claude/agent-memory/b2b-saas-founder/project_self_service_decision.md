---
name: Self-Service Strategy Decision
description: Decision to build wizard+payment first (Option B) before build pipeline automation. Wizard collects biz info, redirects to Stripe, operator manually builds site post-payment. Pipeline deferred until 3 paying customers.
type: project
---

Decided 2026-03-18: Option B (Wizard + Payment First, Build Pipeline Later).

User picks template -> fills business info -> Stripe Checkout -> operator manually builds site within 48 hours.

**What gets built (3-5 days):**
- Template picker page (grid of 6 templates linking to existing demos)
- Onboarding wizard (template, biz info, Stripe Checkout)
- Stripe webhook creates project row with siteConfig JSONB
- Confirmation page + Resend email (to customer and operator)

**What is deferred until 3 paying customers:**
- Automated Vite build pipeline
- Nginx auto-config with SSL
- Asset upload UI to Spaces
- Subdomain preview system
- Customer dashboard/login

**Why:** $0 MRR, solo developer. Manual builds (~2hrs each) are free at this stage. 2-3 weeks of pipeline engineering before demand validation is the highest-risk path. CustomerConfig JSONB from wizard maps directly to existing template config system.

**How to apply:** Reject any scope creep toward build automation, preview systems, or dashboards until break-even (3 Starter subscribers = $57/mo recurring). Every feature request should pass through: "Does this get us closer to the first Stripe payment?"
