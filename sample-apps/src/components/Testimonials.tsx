export default function Testimonials({ title, items }: { title: string; items: { quote: string; author: string }[] }) {
  return (
    <section className="card">
      <h2>{title}</h2>
      <div className="testimonials">
        {items.map((item) => (
          <blockquote key={item.author}>
            <p>{item.quote}</p>
            <cite>{item.author}</cite>
          </blockquote>
        ))}
      </div>
    </section>
  )
}
