import type { NewsEntry } from '../types'

export const newsEntries: NewsEntry[] = [
  {
    slug: 'codebg-self-service-launch',
    title: 'CodeBG is now a self-service website platform',
    description:
      'Create your business website in seconds. Pick a template, fill in your info, preview instantly. Own your code.',
    category: 'Product',
    date: 'Mar 2026',
    href: '/news/codebg-self-service-launch',
    linkLabel: 'Read announcement',
    body: (
      <>
        <p>
          CodeBG has evolved from a web development agency into an <strong>open-source website platform</strong> for
          small businesses. You can now create, customize, and preview your business website in under a minute — for
          free.
        </p>

        <h3>What you can do now</h3>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Pick a template</strong> — 6 industry-specific designs (bakery, auto shop, dental, cafe, massage,
            winery)
          </li>
          <li>
            <strong>Fill in your business info</strong> — name, phone, address, hours. That is it.
          </li>
          <li>
            <strong>See your site instantly</strong> — built in seconds, preview it right in your dashboard
          </li>
          <li>
            <strong>Leave visual feedback</strong> — click any section of your site to request changes
          </li>
          <li>
            <strong>Download your code</strong> — get a standalone ZIP you can deploy anywhere (Vercel, Netlify,
            Cloudflare Pages)
          </li>
          <li>
            <strong>GitHub integration</strong> — your project is a real git repo. Push changes, auto-rebuild.
          </li>
        </ul>

        <h3>Own your code</h3>
        <p>
          Every project is a standard Vite/React application. No vendor lock-in. Download it, fork it, self-host it.
          CodeBG is the friendly layer on top — you own everything underneath.
        </p>

        <h3>Coming soon: paid hosting</h3>
        <p>
          Free tier gives you a private preview. Paid plans (starting at $19/mo) will give you a public URL, managed
          hosting, SSL, and custom domain support. Stay tuned.
        </p>

        <h3>For developers</h3>
        <p>
          The entire platform is{' '}
          <a href="https://github.com/codebg-team/codebg" className="text-accent hover:underline">
            open source on GitHub
          </a>
          . MIT licensed. Built with React, TypeScript, Vite, Express, Prisma, and PostgreSQL. Contributions welcome.
        </p>
      </>
    ),
  },
  {
    slug: 'choosing-the-right-template',
    title: 'How to choose the right template for your business',
    description: 'A quick guide to picking the template that fits your industry and goals.',
    category: 'Guide',
    date: 'Mar 2026',
    href: '/customers',
    linkLabel: 'Browse templates',
  },
  {
    slug: 'local-service-pages',
    title: 'New local service pages are live',
    description: 'Added focused pages for Penticton web design and small business redesign.',
    category: 'SEO',
    href: '/services/web-design-penticton',
    linkLabel: 'Read page',
  },
]
