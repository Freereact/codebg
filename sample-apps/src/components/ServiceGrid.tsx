import type { ServiceItem } from '../types'

export default function ServiceGrid({ title, items }: { title: string; items: ServiceItem[] }) {
  return (
    <section className="card">
      <h2>{title}</h2>
      <div className="grid">
        {items.map((item) => (
          <article key={item.title}>
            {item.image && <img src={item.image} alt={item.title} loading="lazy" />}
            <h3>{item.icon ? `${item.icon} ${item.title}` : item.title}</h3>
            <p>{item.description}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
