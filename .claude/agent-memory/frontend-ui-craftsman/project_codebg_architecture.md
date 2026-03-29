---
name: CodeBG existing frontend architecture
description: Current patterns, conventions, file structure, design tokens, and component API for the CodeBG marketing site
type: project
---

## Stack
- React 18 + TypeScript (strict mode: noUnusedLocals, noUnusedParameters)
- Vite 5, React Router DOM 7 (BrowserRouter, not createBrowserRouter)
- TailwindCSS 3.4 with custom tokens
- Radix UI Slot, CVA, clsx, tailwind-merge, lucide-react

## Design Tokens (tailwind.config.ts)
- `shell`: #2a2f36 (dark header/footer background)
- `shell-border`: #3a414b
- `surface`: #f6f6f3 (page background)
- `surface-border`: #d8d8d2
- `accent`: #f97316 (orange — primary CTA color)
- `accent-hover`: #ea580c
- `accent-soft`: #fff7ed (light orange tint for featured cards)
- `accent-soft-border`: #fdba74
- `accent-text`: #c2410c
- `title`: #e6f4ff

## CSS Patterns
- `.app-shell` — 16px margin, 24px border-radius, surface bg, overflow:clip (wraps entire page)
- `.section-card` — 20px border-radius, surface bg with border (used for content sections)
- `.input` — full-width, rounded-xl, border-slate-300, focus:border-accent
- `.section-heading` — 2xl font-semibold with orange accent bar underline (::after pseudo)
- `.reveal-fade-up`, `.reveal-fade-in`, `.reveal-scale-in` — scroll animation classes
- `.stagger-children` — delays children animation by 80ms each
- `.card-hover` — hover lift effect (-translate-y-0.5, shadow-md)
- `.pulse-glow` — keyframe animation for CTA buttons
- Dark mode: `darkMode: ['class']` — toggled via `html.dark` class

## Component Patterns
- `Button`: CVA variants (default=orange, ghost=bordered). Sizes: default(h-10), lg(h-11). Uses Radix Slot for asChild.
- `Card`: CVA variants (default, featured=orange gradient, link). `as` prop for div/article/a polymorphism.
- `Section`: Wraps `section-card` + scroll reveal. Props: id, heading, description, headerRight, animate, stagger.
- `Toast`: Fixed bottom, aria-live="polite", auto-dismiss with duration prop.
- `Breadcrumbs`: Renders JSON-LD BreadcrumbList schema.
- `ArticleLayout` / `Section`: Layout wrappers for detail pages (there is a PLAN.md to unify these into PageLayout — not yet executed).

## Routing Pattern
- Flat `BrowserRouter` with `<Routes>` in main.tsx (NOT createBrowserRouter)
- Single `RootLayout` wrapping all marketing routes via `<Route element={<RootLayout />}>`
- RootLayout provides ThemeProvider, Header, Footer, ContactModal via Outlet context
- Outlet context pattern: `useOutletContext<ContactOutletContext>()` used in child pages

## Context Pattern
- `ThemeContext` — stores theme in localStorage, toggles `html.dark` class
- Pattern: createContext with null default, throw in hook if outside provider

## Hooks
- `useContactForm` — manages modal state, Turnstile captcha, API submission
- `useScrollReveal<T extends HTMLElement>` — IntersectionObserver → adds `.revealed` class
- `useDocumentMeta` — sets title, meta tags, OG tags, JSON-LD imperatively
- `useActiveSection` — tracks which section is in viewport for header highlight

## File Structure Conventions
- `/src/components/layout/` — layout wrappers (root-layout, article-layout)
- `/src/components/sections/` — page-level section components (hero, pricing, etc.)
- `/src/components/ui/` — reusable primitives (button, card, toast, etc.)
- `/src/contexts/` — React contexts
- `/src/hooks/` — custom hooks
- `/src/pages/` — route-level page components
- `/src/data/` — static data (nav-links, news, samples, etc.)
- `/src/types.ts` — shared TypeScript types

## Backend
- Express API on port 8787
- Redis + RabbitMQ for email job queue
- Resend for email delivery
- Cloudflare Turnstile for CAPTCHA
- ALLOWED_ORIGINS for CORS
- No auth system exists yet

## API Pattern
- fetch() calls to VITE_API_BASE_URL (env var, defaults to https://codebg.com)
- JSON request/response: { ok: boolean; error?: string }

## Build
- `npm run build` = generate-sitemap.mjs + tsc + vite build + prerender-routes.mjs
- Pre-rendering indicates SSG/static deployment (likely Netlify)

**Why:** Documenting patterns so future conversations can maintain consistency without re-reading every file.
**How to apply:** When adding portal routes/components, follow these exact patterns — same CVA component style, same context pattern, same hook naming, same file structure conventions.
