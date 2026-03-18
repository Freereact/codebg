export default function Steps({ title, steps }: { title: string; steps: { title: string; description: string }[] }) {
  return (
    <section className="card">
      <h2>{title}</h2>
      <div className="steps-grid">
        {steps.map((step, i) => (
          <div key={step.title} className="step">
            <div className="step-number">{i + 1}</div>
            <h3>{step.title}</h3>
            <p>{step.description}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
