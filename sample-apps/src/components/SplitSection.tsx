export default function SplitSection({
  title,
  items,
  description,
  image,
  imagePosition = 'left',
}: {
  title: string
  items: string[]
  description?: string
  image?: string
  imagePosition?: 'left' | 'right'
}) {
  return (
    <section className={`card split ${imagePosition === 'right' ? 'reverse' : ''}`}>
      {image && <img src={image} alt={title} loading="lazy" />}
      <div>
        <h2>{title}</h2>
        <ul className="check-list">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        {description && <p className="muted">{description}</p>}
      </div>
    </section>
  )
}
