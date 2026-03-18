import type { CustomerConfig } from '../../types'
import heroImage from './assets/cafe-hero.jpg'
import patioImage from './assets/cafe-patio.jpg'

export const config: CustomerConfig = {
  name: 'Skaha Beach Cafe',
  slug: 'skaha-beach-cafe',
  phone: '(250) 555-0274',
  email: 'hello@skahabeachcafe.ca',
  address: 'Skaha Lake Road, Penticton, BC',
  hours: 'Daily 8:00 AM – 8:00 PM (seasonal)',
  hero: {
    eyebrow: 'Lakeside Dining • Skaha Beach, Penticton',
    headline: 'Fresh eats and cold drinks, steps from the water.',
    description: 'A casual beachside cafe serving brunch, sandwiches, smoothies, and local craft beverages with panoramic views of Skaha Lake.',
    image: heroImage,
    cta: { label: 'View menu', scrollTo: 'pricing-0' },
    secondaryCta: { label: 'Find us', scrollTo: 'location-4' },
    overlay: 'dark',
  },
  sections: [
    {
      type: 'pricing',
      title: 'Menu highlights',
      layout: 'list',
      items: [
        { label: 'Skaha Sunrise Bowl', price: '$16', note: 'Poached eggs, avocado, feta, cherry tomatoes on sourdough.' },
        { label: 'Beach Burger', price: '$19', note: 'Angus beef, aged cheddar, house pickles, brioche bun with fries.' },
        { label: 'Grilled Halloumi Wrap', price: '$15', note: 'Halloumi, roasted peppers, arugula, tzatziki in a warm tortilla.' },
        { label: 'Fish Tacos', price: '$17', note: 'Beer-battered cod, mango slaw, chipotle crema, corn tortillas.' },
        { label: 'Acai Bowl', price: '$14', note: 'Blended acai, banana, granola, coconut, seasonal berries.' },
        { label: 'Iced Okanagan Lemonade', price: '$6', note: 'House-squeezed with local honey and fresh mint.' },
      ],
    },
    {
      type: 'services',
      title: 'Drinks & refreshments',
      items: [
        {
          title: 'Craft Coffee',
          description: 'Locally roasted espresso, cold brew, and iced lattes.',
        },
        {
          title: 'Smoothies & Juices',
          description: 'Tropical blends, green juices, and protein shakes made to order.',
        },
        {
          title: 'Local Craft Beer & Wine',
          description: 'Rotating taps from Okanagan breweries and a curated wine list.',
        },
      ],
    },
    {
      type: 'benefits',
      title: 'Why locals love it',
      image: patioImage,
      items: [
        'Shaded patio with direct lake views',
        'Dog-friendly outdoor seating',
        'Seasonal menu with local ingredients',
        'Steps from the beach and playground',
      ],
    },
    {
      type: 'testimonials',
      title: 'What visitors say',
      items: [
        { quote: '"Best brunch spot in Penticton — the view alone is worth it."', author: '— Sarah M.' },
        { quote: '"Fish tacos and a cold beer on the patio. Summer perfection."', author: '— Jake T.' },
        { quote: '"We stop here every time we visit Skaha Beach. Kids love the smoothies."', author: '— The Chen Family' },
      ],
    },
    {
      type: 'location',
      title: 'Find us at Skaha Beach',
      mapQuery: 'Skaha Beach Penticton BC',
    },
  ],
}
