export interface CustomerConfig {
  name: string
  slug: string
  tagline?: string
  phone: string
  email?: string
  address: string
  hours: string
  hero: {
    eyebrow?: string
    headline: string
    description: string
    image: string
    cta: { label: string }
    secondaryCta?: { label: string }
    overlay?: 'light' | 'dark'
  }
  sections: Section[]
}

export type Section =
  | { type: 'services'; title: string; items: ServiceItem[] }
  | { type: 'gallery'; title: string; images: { src: string; alt: string }[] }
  | { type: 'benefits'; title: string; items: string[]; description?: string; image?: string }
  | { type: 'steps'; title: string; steps: { title: string; description: string }[] }
  | { type: 'pricing'; title: string; items: { label: string; price: string; note?: string }[] }
  | { type: 'testimonials'; title: string; items: { quote: string; author: string }[] }
  | { type: 'location'; title: string; mapQuery?: string }
  | { type: 'cta'; title: string; description: string; buttonLabel: string }

export interface ServiceItem {
  icon?: string
  title: string
  description: string
  image?: string
}
