export default function SplitSection({
  title,
  items,
  description,
  image,
}: {
  title: string
  items: string[]
  description?: string
  image?: string
}) {
  return (
    <section className="card split">
      {image && <img src={image} alt={title} loading="lazy" />}
      <div>
        <h2>{title}</h2>
        <ul>
          {items.map((item) => (
            <li key={item}>✅ {item}</li>
          ))}
        </ul>
        {description && <p className="muted">{description}</p>}
      </div>
    </section>
  )
}
