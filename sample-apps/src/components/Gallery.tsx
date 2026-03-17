export default function Gallery({ title, images }: { title: string; images: { src: string; alt: string }[] }) {
  return (
    <section className="card">
      <h2>{title}</h2>
      <div className="photo-grid">
        {images.map((img) => (
          <figure key={img.alt} className="photo-card">
            <img src={img.src} alt={img.alt} loading="lazy" />
          </figure>
        ))}
      </div>
    </section>
  )
}
