import type { CustomerConfig, Section } from './types'
import TopBar from './components/TopBar'
import Hero from './components/Hero'
import ServiceGrid from './components/ServiceGrid'
import Gallery from './components/Gallery'
import SplitSection from './components/SplitSection'
import Steps from './components/Steps'
import PricingGrid from './components/PricingGrid'
import Testimonials from './components/Testimonials'
import LocationHours from './components/LocationHours'
import CtaBanner from './components/CtaBanner'
import Footer from './components/Footer'

function renderSection(section: Section, config: CustomerConfig, index: number) {
  const key = `${section.type}-${index}`
  switch (section.type) {
    case 'services':
      return <ServiceGrid key={key} title={section.title} items={section.items} />
    case 'gallery':
      return <Gallery key={key} title={section.title} images={section.images} />
    case 'benefits':
      return <SplitSection key={key} title={section.title} items={section.items} description={section.description} image={section.image} />
    case 'steps':
      return <Steps key={key} title={section.title} steps={section.steps} />
    case 'pricing':
      return <PricingGrid key={key} title={section.title} items={section.items} />
    case 'testimonials':
      return <Testimonials key={key} title={section.title} items={section.items} />
    case 'location':
      return <LocationHours key={key} title={section.title} config={config} mapQuery={section.mapQuery} />
    case 'cta':
      return <CtaBanner key={key} title={section.title} description={section.description} buttonLabel={section.buttonLabel} />
  }
}

export default function App({ config }: { config: CustomerConfig }) {
  return (
    <div className="page">
      <TopBar config={config} />
      <Hero config={config} />
      {config.sections.map((section, i) => renderSection(section, config, i))}
      <Footer />
    </div>
  )
}
