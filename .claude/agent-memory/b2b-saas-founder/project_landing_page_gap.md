---
name: Landing Page Messaging Gap
description: As of 2026-03-20, codebg.com landing page still sells the old agency model ("we build your site") while the product is now a self-service platform. This is the top blocker to first revenue.
type: project
---

As of 2026-03-20, the entire public-facing site (hero, services, pricing section, pricing page, CTAs, news) positions CodeBG as a freelancer/agency ("Your local web team", "Request your build", "From $49 one-time", "free hosting on Netlify"). The product is a self-service platform where users get a live site in 2 seconds.

Key files that need rewriting: hero.tsx, services.ts, pricing.tsx, pricing-page.tsx, news.tsx, nav-links.ts.

**Why:** No visitor can discover the self-service platform from the current landing page. Stripe integration is pointless if nobody reaches the signup flow.

**How to apply:** Landing page rewrite is P0, must ship before Stripe integration. New positioning: "Pick a template, fill in your info, site live in 2 seconds." CTAs should say "Start building -- free" and link to template picker.
