---
name: Self-service customer onboarding project
description: CodeBG is adding self-service signup so SMB owners can choose templates, pay via Stripe, and track project status. Previously contact-form only.
type: project
---

CodeBG is transitioning from contact-form-only to self-service customer accounts for SMB website projects.

**Why:** To reduce manual intake friction and let business owners sign up, choose a template, pay, and track their project without needing a sales call.

**How to apply:**
- Three pricing tiers: Starter ($49 setup + $19/mo), Professional ($149 setup + $29/mo), Custom (quote + $49/mo)
- Six templates exist in sample-apps: autoshop, bakery, dental, massage, cafe (skaha-cafe), winery
- Magic link auth (never call it "magic link" in UI -- just "sign-in link")
- Stripe Checkout for payment; monthly subscription starts AFTER site goes live, not at signup
- Wizard flow: template -> business info -> plan -> pay -> confirmation
- Full plan documented at `/home/sz-server/projects/codebg/docs/onboarding-flow-plan.md`
- Backend currently has Express + Redis + RabbitMQ + Resend for email; needs Postgres/SQLite for accounts and projects
