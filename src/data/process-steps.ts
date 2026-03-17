export interface ProcessStep {
  number: number
  title: string
  summary: string
  details: string[]
}

export const processSteps: ProcessStep[] = [
  {
    number: 1,
    title: 'Brief',
    summary: 'We clarify your offer, audience, and goals.',
    details: [
      'A short intake form covers everything we need — no hour-long meetings.',
      'AI analysis of your industry helps us benchmark what works for similar businesses.',
      'You get a clear project scope before any work begins.',
    ],
  },
  {
    number: 2,
    title: 'Draft',
    summary: 'We shape the sections and messaging for conversion.',
    details: [
      'AI-assisted copywriting generates multiple headline and CTA options fast.',
      'We refine layout and messaging with your feedback in a single round.',
      'Wireframes are reviewed before a single line of production code is written.',
    ],
  },
  {
    number: 3,
    title: 'Build',
    summary: 'We implement a polished, performant single-page site.',
    details: [
      'AI code generation accelerates development — reducing your build cost.',
      'Every component is hand-reviewed for quality, accessibility, and performance.',
      'Modern stack: React, Tailwind, Vite — fast by default.',
    ],
  },
  {
    number: 4,
    title: 'Launch',
    summary: 'You review, approve, and go live quickly.',
    details: [
      'Preview your live site before it goes public.',
      'One-click deployment through our CI pipeline.',
      'Post-launch support included — we don\'t disappear after go-live.',
    ],
  },
]

/** Legacy tuple format for backward compat */
export const processStepTuples = processSteps.map(
  (s) => [`${s.number}. ${s.title}`, s.summary] as const,
)
