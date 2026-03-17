import type { CustomerConfig } from '../../types'

export const config: CustomerConfig = {
  name: 'Penticton Dentist Group',
  slug: 'dental-cabinet',
  phone: '(250) 555-0142',
  email: 'info@pentictondentistgroup.ca',
  address: 'Penticton, BC',
  hours: 'Mon-Fri: 8:00 AM - 5:00 PM',
  hero: {
    eyebrow: 'Trusted Family Dentistry • Penticton, BC',
    headline: 'Comfort-first dental care with safe, low-pain procedures.',
    description: 'From routine cleanings to restorative care, our team focuses on gentle treatment, clear communication, and modern techniques to keep your visits stress-free.',
    image: 'https://images.unsplash.com/photo-1606811971618-4486d14f3f99?auto=format&fit=crop&w=1600&q=80',
    cta: { label: 'Request Appointment' },
    overlay: 'light',
  },
  sections: [
    {
      type: 'services',
      title: 'Services',
      items: [
        {
          title: 'Preventive Care',
          description: 'Checkups, cleanings, and personalized oral health plans.',
          image: 'https://images.unsplash.com/photo-1606265752439-1f18756aa5fc?auto=format&fit=crop&w=1200&q=80',
        },
        {
          title: 'Restorative Dentistry',
          description: 'Fillings, crowns, and treatment plans to restore function and confidence.',
          image: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=1200&q=80',
        },
        {
          title: 'Cosmetic Options',
          description: 'Whitening and smile improvements with conservative, practical care.',
          image: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=1200&q=80',
        },
      ],
    },
    {
      type: 'benefits',
      title: 'Why patients choose us',
      items: [
        'Low-pain, patient-safe approach',
        'Experienced local team with modern equipment',
        'Friendly guidance before, during, and after treatment',
      ],
    },
    {
      type: 'location',
      title: 'Location',
      mapQuery: 'Penticton BC dentist',
    },
  ],
}
