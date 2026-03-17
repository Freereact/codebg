export default function CtaBanner({
  title,
  description,
  buttonLabel,
}: {
  title: string
  description: string
  buttonLabel: string
}) {
  return (
    <section className="card cta-section">
      <h2>{title}</h2>
      <p>{description}</p>
      <button>{buttonLabel}</button>
    </section>
  )
}
