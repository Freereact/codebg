# Plan: Unify Page Layouts — CodeBG

## Problem Analysis

After thorough review, here are all the layout inconsistencies between pages:

| Concern | Homepage (`App.tsx`) | Sub-pages (`SubPageLayout`) |
|---------|---------------------|----------------------------|
| **Theme toggle** | Has toggle (Sun/Moon) | Missing — no `useTheme()` call |
| **Active nav highlighting** | Scroll-spy active state | None — `activeSection` not passed |
| **Skip-to-content link** | Present (`<a href="#main-content">`) | Missing |
| **Main max-width** | `max-w-6xl` | `max-w-3xl` |
| **Main spacing** | `space-y-10` | `space-y-6` |
| **App shell wrapper** | Composed inline in `App.tsx` | Duplicated inline in `SubPageLayout` |
| **Header/Footer** | Composed inline in `App.tsx` | Duplicated in `SubPageLayout` |
| **Meta tag management** | Static in `index.html`, no restoration | DOM manipulation via `useEffect`, no cleanup |
| **Captcha/form logic** | 100+ lines of state in `App.tsx` | N/A |
| **Dark mode text** | Sub-page body uses `text-slate-600` only, missing dark variant |

### SOLID Violations
- **SRP**: `App.tsx` mixes layout, routing concerns, captcha/form logic, and page content
- **OCP**: Adding a new page type requires duplicating Header/Footer/app-shell wrappers
- **DRY**: Layout shell is duplicated between `App.tsx` and `SubPageLayout`

---

## Solution Architecture

### Core Idea: React Router Layout Route + Context

Use React Router's `<Outlet />` pattern to create a single `RootLayout` that wraps all pages. Share theme state via React Context so every page has the theme toggle.

```
BrowserRouter
└── Route (element={<RootLayout />})           ← NEW: single layout for all pages
    ├── Route path="/" (element={<HomePage />}) ← renamed from App
    ├── Route path="/news/:slug" (element={<NewsArticlePage />})
    ├── Route path="/services/:slug" (element={<ServicePage />})
    └── Route path="*" (element={<NotFoundPage />})
```

### Component Hierarchy (After)
```
RootLayout (app-shell + skip link + Header + <Outlet> + Footer)
├── ThemeContext.Provider (theme + toggleTheme)
├── Header (always gets theme toggle + nav links)
├── <main id="main-content"> with base padding
│   └── <Outlet /> → renders the matched page
└── Footer
```

---

## Implementation Steps

### Step 1: Create `ThemeContext`
**File:** `src/contexts/theme-context.tsx`

- Move `useTheme` hook logic into a React Context provider
- Export `ThemeProvider` and `useThemeContext` hook
- All components that need theme access use the context instead of prop-drilling

### Step 2: Create `useDocumentMeta` hook
**File:** `src/hooks/use-document-meta.ts`

- Extract meta tag management from `SubPageLayout` into a reusable hook
- Accepts `{ title, description }` — sets document.title + meta tags
- Cleans up on unmount (restores original values)
- Homepage and sub-pages both use this hook for consistency

### Step 3: Create `useContactForm` hook
**File:** `src/hooks/use-contact-form.ts`

- Extract ALL captcha/turnstile/form-submit logic from `App.tsx` into a custom hook
- Returns: `{ handleSubmit, submitVerified, showCaptchaModal, setShowCaptchaModal, sending, sent, error, turnstileToken, captchaStatus }`
- Keeps `App.tsx` (now `HomePage`) focused on rendering sections

### Step 4: Create `RootLayout` component
**File:** `src/components/layout/root-layout.tsx`

- Single source of truth for the page shell
- Structure:
  ```tsx
  <ThemeProvider>
    <div className="app-shell">
      <a href="#main-content" className="sr-only ...">Skip to main content</a>
      <Header />
      <main id="main-content">
        <Outlet />
      </main>
      <Footer />
    </div>
  </ThemeProvider>
  ```
- `<main>` only provides shared padding (`px-4 py-10 md:px-6 md:py-12`), no max-width — pages control their own max-width

### Step 5: Refactor `Header`
**File:** `src/components/layout/header.tsx`

- Get theme from `useThemeContext()` instead of props — always shows toggle
- Detect homepage vs sub-page via `useLocation()`:
  - Homepage (`/`): use scroll-spy `activeSection`, scroll-to-contact onClick
  - Sub-pages: nav links point to `/#section`, contact links to `/#contact`
- Remove all optional props — Header is now self-contained
- Use `useActiveSection` internally only when on homepage

### Step 6: Refactor `SubPageLayout` → `ArticleLayout`
**File:** `src/components/layout/article-layout.tsx` (renamed)

- Remove Header, Footer, and `app-shell` wrapper (now in RootLayout)
- Becomes a pure content wrapper:
  ```tsx
  <div className="mx-auto max-w-3xl">
    <div className="section-card p-8 md:p-10">
      {kicker}
      <h1>{title}</h1>
      {children}
      <BackLink />
    </div>
  </div>
  ```
- Calls `useDocumentMeta()` for meta tags
- Single Responsibility: only handles article-style content layout

### Step 7: Refactor `App.tsx` → `HomePage`
**File:** `src/pages/home-page.tsx` (moved from App.tsx)

- Remove Header, Footer, app-shell, skip link (all in RootLayout)
- Remove theme state (now in context)
- Use `useContactForm()` hook for form/captcha logic
- Structure:
  ```tsx
  <div className="mx-auto max-w-6xl space-y-10">
    <Hero />
    <Services />
    ...
    <Contact />
  </div>
  <CaptchaModal />
  ```

### Step 8: Update routing in `main.tsx`
**File:** `src/main.tsx`

- Use layout route pattern:
  ```tsx
  <Route element={<RootLayout />}>
    <Route path="/" element={<HomePage />} />
    <Route path="/news/:slug" element={<NewsArticlePage />} />
    <Route path="/services/:slug" element={<ServicePage />} />
    <Route path="*" element={<NotFoundPage />} />
  </Route>
  ```

### Step 9: Update sub-pages
- `news-article.tsx`: Use `ArticleLayout` instead of `SubPageLayout`
- `service-page.tsx`: Use `ArticleLayout` instead of `SubPageLayout`
- `not-found.tsx`: Use `ArticleLayout` instead of `SubPageLayout`

### Step 10: Clean up
- Delete old `sub-page-layout.tsx`
- Delete old `App.tsx` (replaced by `home-page.tsx`)
- Verify all imports are correct
- Run `npm run build` to ensure no TypeScript or build errors

---

## What Changes for Each Page (UX)

| Feature | Before | After |
|---------|--------|-------|
| Theme toggle | Homepage only | Every page |
| Skip-to-content | Homepage only | Every page |
| Nav highlighting | Homepage only | Homepage (scroll-spy), sub-pages (none — correct since no sections) |
| Dark mode text in articles | Missing dark variant (`text-slate-600`) | Fixed (`dark:text-slate-300`) |
| Back-to-top scroll on route change | Not handled | Handled by RootLayout |
| Consistent padding | Different per page | Shared base from RootLayout |

## Files Created
1. `src/contexts/theme-context.tsx`
2. `src/hooks/use-document-meta.ts`
3. `src/hooks/use-contact-form.ts`
4. `src/components/layout/root-layout.tsx`
5. `src/pages/home-page.tsx`
6. `src/components/layout/article-layout.tsx`

## Files Modified
1. `src/main.tsx` — layout routes
2. `src/components/layout/header.tsx` — self-contained with context
3. `src/pages/news-article.tsx` — use ArticleLayout
4. `src/pages/service-page.tsx` — use ArticleLayout
5. `src/pages/not-found.tsx` — use ArticleLayout

## Files Deleted
1. `src/App.tsx` (replaced by `src/pages/home-page.tsx`)
2. `src/components/layout/sub-page-layout.tsx` (replaced by `article-layout.tsx`)

---

## Principles Applied
- **SRP**: Each component has one job (RootLayout = shell, Header = navigation, ArticleLayout = article content, HomePage = homepage sections)
- **OCP**: Adding a new page type just requires a new Route + page component — no layout duplication
- **DRY**: Layout shell defined once in RootLayout
- **Composition over inheritance**: Layout route pattern composes pages inside a shared shell
- **Separation of concerns**: Form/captcha logic extracted to hook, theme to context, meta to hook
