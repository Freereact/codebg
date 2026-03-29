import type { CustomerConfig } from '../types'

export default function Hero({ config }: { config: CustomerConfig }) {
  const { hero } = config
  const overlay = hero.overlay === 'light'
    ? 'linear-gradient(180deg, rgba(255,255,255,0.84), rgba(255,255,255,0.9))'
    : 'linear-gradient(rgba(20,20,20,0.42), rgba(20,20,20,0.42))'

  return (
    <section
      className={`card hero ${hero.overlay === 'light' ? 'overlay-light' : ''}`}
      style={{ backgroundImage: `${overlay}, url(${hero.image})` }}
    >
      {hero.eyebrow && <p className="eyebrow">{hero.eyebrow}</p>}
      <h1>{hero.headline}</h1>
      <p>{hero.description}</p>
      <div className="actions">
        <button onClick={() => scrollToSection(hero.cta.scrollTo)}>{hero.cta.label}</button>
        {hero.secondaryCta && (
          <button className="secondary" onClick={() => scrollToSection(hero.secondaryCta!.scrollTo)}>
            {hero.secondaryCta.label}
          </button>
        )}
      </div>
    </section>
  )
}

function scrollToSection(id?: string) {
  if (!id) return
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
