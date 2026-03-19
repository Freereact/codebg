---
name: Pricing Tiers and Unit Economics
description: CodeBG pricing structure, Stripe products, and unit economics calculations as of 2026-03-18.
type: project
---

**Tiers:**
- Starter: $49 CAD setup + $19/mo (Year 1 LTV: $277)
- Professional: $149 CAD setup + $29/mo (Year 1 LTV: $497)
- Custom: Quote-based setup + $49/mo (manual Stripe invoice)

**Stripe architecture:** Separate products for subscriptions and setup fees. Setup fee charged via `add_invoice_items` on Checkout Session (rolls into first invoice). Currency: CAD.

**Unit economics at 20 customers:** $3.25/customer COGS ($2.40 infra + $0.85 Stripe fees). 83% gross margin on Starter, 89% on Professional.

**Break-even:** 3 Starter subscribers cover the $48/mo infrastructure.

**Why:** The old pricing was flat $49 one-time with "free hosting on Netlify" -- zero recurring revenue, actively telling customers they do not need you.

**How to apply:** All pricing discussions should reference these tiers. Do not add complexity (annual billing, add-ons) until monthly model is validated with paying customers.
