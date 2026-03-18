import type { CustomerConfig } from '../../types'
import heroImage from './assets/massage-hero.jpg'
import roomImage from './assets/massage-room.jpg'

export const config: CustomerConfig = {
  name: 'Restore Massage Therapy',
  slug: 'massage-service',
  phone: '(250) 555-0288',
  email: 'hello@restoremassage.example',
  address: 'Penticton, BC',
  hours: 'Mon–Sat: 9:00 AM – 7:00 PM | Sun Closed',
  hero: {
    eyebrow: 'Therapeutic & Relaxation Massage',
    headline: 'Feel better in your body — one session at a time.',
    description: 'Restore Massage Therapy helps you reduce pain, improve mobility, and recharge with personalized treatment plans.',
    image: heroImage,
    cta: { label: 'Book Your Session', scrollTo: 'pricing-3' },
    secondaryCta: { label: 'View Services', scrollTo: 'services-0' },
    overlay: 'dark',
  },
  sections: [
    {
      type: 'services',
      title: 'Popular Services',
      items: [
        { title: 'Relaxation Massage', description: '60 or 90-minute sessions to reduce stress and improve sleep.' },
        { title: 'Deep Tissue', description: 'Targeted pressure for chronic muscle tightness and posture strain.' },
        { title: 'Sports Recovery', description: 'Pre/post event treatment to improve mobility and recovery time.' },
        { title: 'Prenatal Massage', description: 'Comfort-focused support tailored for pregnancy stages.' },
        { title: 'Neck & Shoulder Reset', description: 'Quick focused treatment for desk and driving tension.' },
        { title: 'Full Body Renewal', description: 'Comprehensive session with customized pressure and pace.' },
      ],
    },
    {
      type: 'benefits',
      title: 'Why clients choose us',
      description: 'We combine professional technique with a calm, welcoming environment so every visit feels restorative.',
      image: roomImage,
      items: [
        'Registered and insured therapists',
        'Direct billing support (where eligible)',
        'Calm private treatment rooms',
        'Easy online booking and reminders',
      ],
    },
    {
      type: 'steps',
      title: 'How it works',
      steps: [
        { title: 'Quick intake', description: 'Tell us your goals, pain points, and preferences.' },
        { title: 'Personalized session', description: 'Your therapist adapts pressure and technique in real time.' },
        { title: 'Recovery plan', description: 'Leave with practical aftercare guidance and follow-up options.' },
      ],
    },
    {
      type: 'pricing',
      title: 'Simple pricing',
      items: [
        { label: '60 min', price: '$99' },
        { label: '90 min', price: '$139' },
        { label: '120 min', price: '$179' },
      ],
    },
    {
      type: 'testimonials',
      title: 'Client testimonials',
      items: [
        { quote: '"Best massage in town — my back pain dropped after two sessions."', author: '— Andrea L.' },
        { quote: '"Warm, professional, and super clean clinic. Highly recommend."', author: '— Jason P.' },
        { quote: '"Great for post-workout recovery. I book every two weeks now."', author: '— Nina K.' },
      ],
    },
    {
      type: 'location',
      title: 'Location & hours',
      mapQuery: 'Penticton BC massage therapy',
    },
    {
      type: 'cta',
      title: 'Ready to feel better?',
      description: "Book your first appointment and let's build your recovery plan.",
      buttonLabel: 'Request appointment',
      scrollTo: 'location-5',
    },
  ],
}
