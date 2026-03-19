---
name: Customer portal and admin panel planning context
description: Planning session for CodeBG self-service customer portal and admin panel — decisions made, constraints, and rationale
type: project
---

## Session date: 2026-03-18

## Scope
Customer self-service portal for SMB owners + admin panel for operator.

## Key decisions recorded after planning:
- Same SPA (not a separate app). Portal lives under /portal/* and /admin/* within the existing BrowserRouter.
- Portal and admin get their own Layout component (PortalLayout with sidebar, AdminLayout with sidebar) — NOT RootLayout (no marketing header/footer).
- Auth: magic link only, JWT stored in httpOnly cookie (not localStorage — XSS risk). Auth context reads session via GET /api/auth/me on mount.
- Token refresh: silent refresh via /api/auth/refresh endpoint, AuthProvider handles on 401.
- State management: React Context is sufficient. No Redux/Zustand needed given scope. Server state via custom hooks wrapping fetch().
- New project wizard: 3-step (template → business info → payment redirect to Stripe Checkout). Step state lives in URL search params (?step=1&template=starter) so back-button works.
- Offline: Portal is online-dependent (billing, status tracking) — no offline-first required. Marketing site already has no offline needs either.
- Admin panel: protected by role check (user.role === 'admin') in addition to auth guard.
- Pre-rendering: Portal/admin routes must be excluded from prerender-routes.mjs (they need auth, can't be statically rendered).

## Phase 2 Portal UI Architecture (2026-03-18):

### Route structure
/portal                 → PortalLayout (RequireAuth wrapper)
/portal/dashboard       → DashboardPage (index redirect)
/portal/projects        → ProjectsPage (project list)
/portal/projects/new    → NewProjectPage (3-step wizard)
/portal/account         → AccountPage (email, plan, logout)
/admin                  → AdminLayout (RequireAuth + RequireAdmin)
/admin/dashboard        → AdminDashboardPage

### Layout decision: No sidebar on mobile, sidebar on md+
- PortalLayout is a NEW layout component, completely separate from RootLayout.
- RootLayout is marketing-only (header + footer + contact modal). Portal never uses it.
- PortalLayout structure: sticky top app-bar (mobile) + collapsible sidebar (md+) + main content area.
- No Footer in portal — wastes screen real estate on phone between customers.
- ThemeProvider wraps PortalLayout the same way it wraps RootLayout (ThemeProvider lives inside each layout).

### Header/auth state changes
- When authenticated, the marketing header's "Dashboard" link navigates to /portal/dashboard (not "/").
- The portal has its own app-bar (not the marketing header). The marketing header is hidden inside PortalLayout.
- Portal app-bar contains: CodeBG logo (links back to /), page title, theme toggle, user avatar/initials + dropdown (account, sign out).
- Mobile portal app-bar has a hamburger that reveals bottom-sheet nav (NOT a sidebar slide-in — bottom-sheet is easier to reach one-handed).

### Component tree
PortalLayout
  PortalAppBar
    LogoLink
    PageTitle (from Outlet context or route title map)
    ThemeToggle (reuse existing pattern)
    UserMenu (avatar initials, dropdown: Account, Sign out)
  PortalSidebar (md+ only, hidden on mobile)
    SidebarNavItem (Dashboard, Projects, Account)
  main
    Outlet

DashboardPage
  WelcomeBanner (first name from email prefix, time-of-day greeting)
  ProjectsSummarySection
    EmptyProjectsState (zero projects)  OR  ProjectCardGrid
  QuickActionBar (prominent "New project" button — full width on mobile)

ProjectsPage
  PageHeader (title + "New project" button)
  ProjectCardGrid | EmptyProjectsState

ProjectCard (section-card base, card-hover)
  StatusBadge (builds on color + icon, never color alone)
  ProjectName
  ProjectUrl (subdomain preview)
  ActionChevron (navigates to project detail — future)

EmptyProjectsState
  IllustrationOrIcon
  Heading ("No projects yet")
  Body ("Create your first website in minutes")
  PrimaryButton ("Start a project") — lg size, full width on mobile, min-h-14

NewProjectWizardPage
  WizardProgress (step indicator, 3 steps)
  Step 1: TemplatePicker (large tap cards, icon + name + 1-line description)
  Step 2: BusinessInfoForm (business name, domain preference — .input pattern)
  Step 3: ReviewAndPay (order summary → Stripe Checkout redirect)

AccountPage
  SectionCard: Account info (email, read-only)
  SectionCard: Plan & billing (current plan, manage billing link)
  DangerZone: Sign out button (ghost variant, full width)

### Touch target rules for portal
- All interactive elements minimum h-12 (48px) in portal. h-10 is acceptable for secondary actions only.
- ProjectCard tap area is the entire card (no nested buttons unless absolutely necessary).
- Wizard step cards are min-h-20 with generous padding.
- Bottom navigation on mobile uses h-16 tab bar with icon + label.

### Theme in portal
- Phase 1 issue: dark mode colors sometimes leaked because of hardcoded slate-* values instead of semantic tokens.
- Rule for portal: NEVER use hardcoded bg-slate-800 or text-slate-200 in portal components. Only use:
  - bg-surface / dark:bg-[#1a1d23] (matches .app-shell dark pattern)
  - bg-[#22262d] for cards (matches .section-card dark pattern)
  - text-slate-800 dark:text-slate-100 for body text
  - border-surface-border dark:border-[#3a414b]
- Portal has its own portal-shell CSS class (similar to .app-shell but without the 16px margin and border-radius — portal is full-bleed, not the "card in a shell" marketing look).
- ThemeProvider in PortalLayout reads/writes the same localStorage key ("theme") — theme persists across marketing ↔ portal navigation.

### Responsive strategy
- Base (mobile-first, 375px+): Single column, full-width cards, bottom sheet nav, no sidebar.
- md (768px+): Sidebar appears (240px fixed), content area gets left padding, cards go 2-col grid.
- lg (1024px+): Cards go 3-col grid if applicable.
- No horizontal scroll anywhere. All grids use grid-cols-1 sm:grid-cols-2 lg:grid-cols-3.

### TypeScript models needed (to be defined in /src/types/portal.ts)
- Project: id, name, slug, status (draft | building | live | failed), template, createdAt, previewUrl?
- PortalOutletContext: pageTitle (for app-bar), setPageTitle
- WizardState: step, templateId, businessName, domainPreference

**Why:** Decisions recorded so implementation sessions don't re-litigate architecture.
**How to apply:** Follow these decisions when implementing portal features. If a decision needs revisiting, flag it explicitly.
