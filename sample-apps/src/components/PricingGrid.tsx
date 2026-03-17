export default function PricingGrid({
  title,
  items,
}: {
  title: string
  items: { label: string; price: string; note?: string }[]
}) {
  return (
    <section className="card">
      <h2>{title}</h2>
      <div className="price-row">
        {items.map((item) => (
          <div key={item.label}>
            <p className="price-label">{item.label}</p>
            <p className="price-value">{item.price}</p>
            {item.note && <p className="price-note">{item.note}</p>}
          </div>
        ))}
      </div>
    </section>
  )
}
