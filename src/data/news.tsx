import type { NewsEntry } from '../types'

export const newsEntries: NewsEntry[] = [
  {
    slug: 'nemoclaw-by-nvidia',
    title: "NemoClaw (OpenClaw plugin): what's confirmed",
    description: 'Verified summary of NVIDIA NemoClaw in OpenClaw deployment context.',
    category: 'NVIDIA',
    date: 'Mar 2026',
    href: '/news/nemoclaw-by-nvidia',
    linkLabel: 'Read article',
    body: (
      <>
        <p>
          Confirmed from public sources: NVIDIA NemoClaw is presented as an alpha
          open-source stack/plugin for secure OpenClaw deployment with OpenShell.
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Repo:{' '}
            <a
              href="https://github.com/NVIDIA/NemoClaw"
              target="_blank"
              rel="noreferrer"
              className="text-accent hover:underline"
            >
              github.com/NVIDIA/NemoClaw
            </a>
          </li>
          <li>Status: Alpha</li>
          <li>Focus: sandbox policy controls and secure runtime setup</li>
        </ul>
      </>
    ),
  },
  {
    slug: 'dynamic-sample-catalog',
    title: 'Sample catalog now updates dynamically',
    description: 'Main site sample cards now load from a shared JSON catalog for faster updates.',
    category: 'Platform',
    href: '/customers',
    linkLabel: 'Open samples',
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
