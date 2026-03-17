import type { CustomerConfig } from '../../types'
import heroImage from './assets/autoshop-hero.jpg'
import liftImage from './assets/autoshop-lift.jpg'
import toolsImage from './assets/autoshop-tools.jpg'

export const config: CustomerConfig = {
  name: 'Joyful Mechanics Auto Repair',
  slug: 'autoshop',
  phone: '(250) 555-0199',
  address: 'Penticton, BC',
  hours: 'Mon-Fri: 8:00 AM - 5:00 PM',
  hero: {
    headline: 'Honest, Reliable Auto Repair in the Heart of the Okanagan.',
    description: 'From routine maintenance to complex engine diagnostics, we get you back on Highway 97 safely and affordably.',
    image: heroImage,
    cta: { label: 'Book an Appointment' },
    secondaryCta: { label: 'See Our Services' },
    overlay: 'light',
  },
  sections: [
    {
      type: 'services',
      title: 'What Can We Fix For You Today?',
      items: [
        { icon: '🚗', title: 'Routine Maintenance', description: 'Oil changes, fluid flushes, and filter replacements.' },
        { icon: '❄️', title: 'Tires & Alignments', description: 'Swap-overs, balancing, patching, and precision alignments.' },
        { icon: '🛑', title: 'Brake Services', description: 'Pads, rotors, and line repairs with clear diagnostics.' },
        { icon: '💻', title: 'Engine Diagnostics', description: 'State-of-the-art scans to find the exact issue.' },
        { icon: '🌡️', title: 'A/C & Heating', description: 'Cabin comfort in summer heat and winter freezes.' },
        { icon: '🔧', title: 'General Repairs', description: 'Suspension, exhaust, batteries, and more.' },
      ],
    },
    {
      type: 'gallery',
      title: 'Inside the Shop',
      images: [
        { src: heroImage, alt: 'Professional auto service bay' },
        { src: liftImage, alt: 'Vehicle inspection on hydraulic lift' },
        { src: toolsImage, alt: 'Certified mechanic tools and diagnostics setup' },
      ],
    },
    {
      type: 'benefits',
      title: 'Your Local Penticton Auto Experts',
      description: 'No hidden fees, no unnecessary repairs, and crystal-clear communication.',
      items: [
        'Red Seal Certified Mechanics',
        '2-Year / 40,000 km Warranty on Parts and Labor',
        'Locally Owned & Operated in Penticton',
        'Free Digital Inspections',
      ],
    },
    {
      type: 'testimonials',
      title: "Don't Just Take Our Word For It",
      items: [
        { quote: '⭐⭐⭐⭐⭐ "They squeezed me in and fixed it for less than the dealership quote."', author: '— Sarah T.' },
        { quote: '⭐⭐⭐⭐⭐ "Honest mechanics are hard to find. Great service."', author: '— Mark R.' },
      ],
    },
    {
      type: 'location',
      title: 'Stop By the Shop',
      mapQuery: 'Penticton BC auto repair',
    },
  ],
}
