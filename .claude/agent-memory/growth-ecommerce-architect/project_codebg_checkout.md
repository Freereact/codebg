---
name: CodeBG checkout architecture plan
description: Self-service Stripe checkout with tiered pricing ($49+$19/mo Starter, $149+$29/mo Professional, Quote+$49/mo Custom). Plan created 2026-03-18, stored at dev_info/checkout-conversion-architecture.md. Uses Stripe Checkout hosted page with setup fees as mixed line items, webhooks for provisioning, Postgres for subscription/project tracking.
type: project
---

Checkout/conversion architecture plan created 2026-03-18 at `/home/sz-server/projects/codebg/dev_info/checkout-conversion-architecture.md`.

**Why:** CodeBG is transitioning from contact-form-only to self-service purchasing with MRR. Current revenue: $0 recurring. Target: $1,000 MRR at 12 months.

**How to apply:** This plan is the canonical reference for all Stripe integration, checkout flow, email sequence, and analytics work. Implementation is phased: Phase 1 (Stripe foundation, 26h), Phase 2 (post-purchase, 16h), Phase 3 (optimization, 23h).

Key decisions made:
- Stripe Checkout hosted page (not custom Elements) -- fewer PCI concerns, mobile-optimized by Stripe
- Setup fee as mixed line item in subscription Checkout Session (not subscription phases)
- Template selection happens AFTER payment, not before (reduces pre-purchase friction)
- No Stripe trial period -- instead "draft preview" model where customer sees draft before paying
- 6-email lifecycle sequence via Resend
- GA4 events at every funnel step + server-side Measurement Protocol for purchase events
- Annual billing at 20% discount
- Referral program: 1 free month for referrer, 25% off for referred
