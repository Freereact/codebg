import type { CustomerConfig } from '../../types'

export const config: CustomerConfig = {
  name: 'Penticton Sun Wine Group',
  slug: 'winery',
  phone: '(250) 555-0198',
  email: 'hello@pentictonsunwinegroup.ca',
  address: 'Penticton, BC',
  hours: 'Daily: 11:00 AM - 6:00 PM',
  hero: {
    eyebrow: 'Penticton, BC • Local Winery Experience',
    headline: 'Small-batch wines crafted under the Okanagan sun.',
    description: 'Penticton Sun Wine Group offers approachable, premium wines with a warm tasting-room experience. Discover crisp whites, bold reds, and seasonal releases made for every table.',
    image: 'https://images.unsplash.com/photo-1516594915697-87eb3b1c14ea?auto=format&fit=crop&w=1600&q=80',
    cta: { label: 'Plan your visit' },
    overlay: 'light',
  },
  sections: [
    {
      type: 'services',
      title: 'Featured Wines',
      items: [
        {
          title: 'Suncrest Riesling',
          description: 'Bright citrus, floral finish, perfect for patio evenings.',
          image: 'https://images.unsplash.com/photo-1516594798947-e65505dbb29d?auto=format&fit=crop&w=1200&q=80',
        },
        {
          title: 'Valley Merlot',
          description: 'Velvety texture with berry notes and soft oak character.',
          image: 'https://images.unsplash.com/photo-1474722883778-792e7990302f?auto=format&fit=crop&w=1200&q=80',
        },
        {
          title: 'Rosé Reserve',
          description: 'Fresh, lively, and crafted for warm Okanagan afternoons.',
          image: 'https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?auto=format&fit=crop&w=1200&q=80',
        },
      ],
    },
    {
      type: 'benefits',
      title: 'Tasting Experience',
      items: [
        'Guided flights with pairing recommendations',
        'Vineyard-view patio and seasonal events',
        'Bottle pickup and curated gift options',
      ],
    },
    {
      type: 'location',
      title: 'Location',
      mapQuery: 'Penticton BC winery',
    },
  ],
}
