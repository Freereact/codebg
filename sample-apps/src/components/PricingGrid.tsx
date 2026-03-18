export default function PricingGrid({
  title,
  items,
  layout = 'grid',
}: {
  title: string
  items: { label: string; price: string; note?: string }[]
  layout?: 'grid' | 'list'
}) {
  if (layout === 'list') {
    return (
      <section className="card">
        <h2>{title}</h2>
        <div className="price-list">
          {items.map((item) => (
            <div key={item.label} className="price-list-item">
              <div className="item-info">
                <p className="item-name">{item.label}</p>
                {item.note && <p className="item-note">{item.note}</p>}
              </div>
              <span className="item-price">{item.price}</span>
            </div>
          ))}
        </div>
      </section>
    )
  }

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
