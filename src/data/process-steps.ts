export interface ProcessStep {
  number: number
  title: string
  summary: string
  details: string[]
}

export const processSteps: ProcessStep[] = [
  {
    number: 1,
    title: 'Pick a template',
    summary: 'Choose from 6 industry-specific designs.',
    details: [
      'Templates for bakeries, auto shops, dental clinics, cafes, massage studios, and wineries.',
      'Each template is conversion-focused with sections that work for your industry.',
      'See live previews before you commit.',
    ],
  },
  {
    number: 2,
    title: 'Add your info',
    summary: 'Business name, phone, address, hours — that is it.',
    details: [
      'A quick form with just 4 fields. No meetings, no briefs, no waiting.',
      'Your info is placed into the template automatically.',
      'Change anything later through your dashboard or GitHub repo.',
    ],
  },
  {
    number: 3,
    title: 'Preview instantly',
    summary: 'Your site is built and ready in seconds.',
    details: [
      'See your finished site in a live preview right in your dashboard.',
      'Use click-to-comment to request changes on any section.',
      'Download the full source code as a ZIP anytime.',
    ],
  },
  {
    number: 4,
    title: 'Go live',
    summary: 'Make your site public when you are ready.',
    details: [
      'Choose a plan and your site gets a public URL with SSL.',
      'Push changes via GitHub and your site rebuilds automatically.',
      'You own the code — deploy it anywhere, cancel anytime.',
    ],
  },
]

/** Legacy tuple format for backward compat */
export const processStepTuples = processSteps.map((s) => [`${s.number}. ${s.title}`, s.summary] as const)
