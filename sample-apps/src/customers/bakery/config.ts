import type { CustomerConfig } from '../../types'
import heroImage from './assets/bakery-hero.jpg'
import counterImage from './assets/bakery-counter.jpg'

export const config: CustomerConfig = {
  name: 'Sunrise Bakery',
  slug: 'bakery-service',
  phone: '(250) 555-0366',
  email: 'hello@sunrisebakery.example',
  address: 'Penticton, BC',
  hours: 'Mon–Sat 7:00 AM – 5:00 PM | Sun 8:00 AM – 3:00 PM',
  hero: {
    eyebrow: 'Local Artisan Bakery',
    headline: 'Warm bread, flaky pastries, and cakes made with care.',
    description: 'Daily baked goods, custom orders, and cozy coffee pairings from your neighborhood bakery.',
    image: heroImage,
    cta: { label: 'Order now', scrollTo: 'location-3' },
    secondaryCta: { label: 'See menu', scrollTo: 'pricing-0' },
    overlay: 'dark',
  },
  sections: [
    {
      type: 'pricing',
      title: 'Best sellers',
      items: [
        { label: 'Sourdough Loaf', price: '$8', note: '24-hour fermented artisan sourdough.' },
        { label: 'Butter Croissant', price: '$4', note: 'Flaky layers, baked fresh every morning.' },
        { label: 'Cinnamon Buns', price: '$5', note: 'Soft rolls with house vanilla glaze.' },
        { label: 'Custom Cakes', price: 'from $65', note: 'Birthday and celebration cakes by order.' },
      ],
    },
    {
      type: 'benefits',
      title: 'Made fresh every morning',
      image: counterImage,
      items: [
        'Small-batch, scratch-made recipes',
        'Seasonal specials and holiday boxes',
        'Pick-up and pre-order available',
        'Local ingredients whenever possible',
      ],
    },
    {
      type: 'testimonials',
      title: 'What customers say',
      items: [
        { quote: '"The sourdough is incredible — crispy crust, soft center."', author: '— Emma R.' },
        { quote: '"Our wedding cake was beautiful and tasted amazing."', author: '— Daniel & Priya' },
      ],
    },
    {
      type: 'location',
      title: 'Location & hours',
      mapQuery: 'Penticton BC bakery',
    },
  ],
}
