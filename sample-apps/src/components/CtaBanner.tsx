export default function CtaBanner({
  title,
  description,
  buttonLabel,
  scrollTo,
}: {
  title: string
  description: string
  buttonLabel: string
  scrollTo?: string
}) {
  return (
    <section className="card cta-section">
      <h2>{title}</h2>
      <p>{description}</p>
      <button onClick={() => {
        if (scrollTo) document.getElementById(scrollTo)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }}>{buttonLabel}</button>
    </section>
  )
}
