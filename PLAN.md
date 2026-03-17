# Plan: Unify Page Layouts

## Problem

The home page and detail pages (news articles, service pages, 404) have **inconsistent layout structures**, even though they share the same `RootLayout` (header/footer). The inconsistencies are:

1. **Duplicated container logic** — `RootLayout` adds padding (`px-4 py-10 md:px-6 md:py-12`) to `<main>`, then each page adds its own `mx-auto max-w-*` wrapper. The container/padding responsibility is split between the layout and the pages.

2. **Different content widths** — Home page uses `max-w-6xl`, article pages use `max-w-3xl`. The width decision is scattered across individual pages instead of being centralized.

3. **`ArticleLayout` duplicates layout concerns** — It re-implements padding (`p-8 md:p-10`), card styling (`section-card`), and a back link. These are layout-level concerns that should be handled by the routing/layout layer, not a wrapper component.

4. **No content-width strategy in `RootLayout`** — The layout doesn't know or control how wide the content area is. Each page makes its own decision independently.

## Solution

Centralize the content container in `RootLayout` and use a consistent `PageLayout` component for all non-home pages.

### Changes

#### 1. Move container logic into `RootLayout` (root-layout.tsx)
- Remove the hardcoded padding from `<main>` (`px-4 py-10 md:px-6 md:py-12`)
- The `<main>` tag stays as a minimal wrapper; pages control their own spacing since home page and detail pages have fundamentally different content structures

**Actually — the better approach**: Keep `RootLayout` lean (just header + `<Outlet>` + footer), and let each page route decide its container. The real fix is making the **detail pages** use the same `Section` component and `max-w-6xl` container that the home page uses, so they look like they belong to the same site.

#### 2. Create a `PageLayout` component (replaces `ArticleLayout`)
- New component: `src/components/layout/page-layout.tsx`
- Uses `max-w-6xl mx-auto` container (same as home page)
- Wraps content in the same `Section` component used by home page sections
- Accepts props: `title`, `kicker`, `meta`, `backLink` (default: `← Back to CodeBG`)
- Consistent padding matching home page sections

#### 3. Update detail pages to use `PageLayout`
- `news-article.tsx` → replace `ArticleLayout` with `PageLayout`
- `service-page.tsx` → replace `ArticleLayout` with `PageLayout`
- `not-found.tsx` → replace `ArticleLayout` with `PageLayout`

#### 4. Remove `RootLayout` main padding
- Change `<main>` from `className="px-4 py-10 md:px-6 md:py-12"` to just basic padding that matches what home page expects, or move that padding into the page-level wrappers

#### 5. Delete `article-layout.tsx`
- No longer needed after migration

### File changes summary

| File | Action |
|------|--------|
| `src/components/layout/page-layout.tsx` | **Create** — new unified layout for detail pages |
| `src/components/layout/root-layout.tsx` | **Edit** — remove excess main padding |
| `src/pages/news-article.tsx` | **Edit** — use `PageLayout` |
| `src/pages/service-page.tsx` | **Edit** — use `PageLayout` |
| `src/pages/not-found.tsx` | **Edit** — use `PageLayout` |
| `src/components/layout/article-layout.tsx` | **Delete** |

### Result
- All pages share `max-w-6xl` as the content container width
- Detail pages use the same `Section` component / `section-card` styling as home page sections
- Layout padding is consistent everywhere
- One component (`PageLayout`) handles all detail page needs
