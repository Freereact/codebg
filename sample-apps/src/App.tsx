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

function sectionId(section: Section, index: number): string {
  return `${section.type}-${index}`
}

function renderSection(section: Section, config: CustomerConfig, index: number) {
  const key = sectionId(section, index)
  const id = sectionId(section, index)
  switch (section.type) {
    case 'services':
      return <div id={id} key={key}><ServiceGrid title={section.title} items={section.items} /></div>
    case 'gallery':
      return <div id={id} key={key}><Gallery title={section.title} images={section.images} /></div>
    case 'benefits':
      return <div id={id} key={key}><SplitSection title={section.title} items={section.items} description={section.description} image={section.image} imagePosition={section.imagePosition} /></div>
    case 'steps':
      return <div id={id} key={key}><Steps title={section.title} steps={section.steps} /></div>
    case 'pricing':
      return <div id={id} key={key}><PricingGrid title={section.title} items={section.items} layout={section.layout} /></div>
    case 'testimonials':
      return <div id={id} key={key}><Testimonials title={section.title} items={section.items} /></div>
    case 'location':
      return <div id={id} key={key}><LocationHours title={section.title} config={config} mapQuery={section.mapQuery} /></div>
    case 'cta':
      return <div id={id} key={key}><CtaBanner title={section.title} description={section.description} buttonLabel={section.buttonLabel} scrollTo={section.scrollTo} /></div>
  }
}

export default function App({ config }: { config: CustomerConfig }) {
  return (
    <div className="page">
      <div id="topbar"><TopBar config={config} /></div>
      <div id="hero"><Hero config={config} /></div>
      {config.sections.map((section, i) => renderSection(section, config, i))}
      <div id="footer"><Footer /></div>
    </div>
  )
}
