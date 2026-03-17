import type { CustomerConfig } from '../types'

export default function LocationHours({
  title,
  config,
  mapQuery,
}: {
  title: string
  config: CustomerConfig
  mapQuery?: string
}) {
  return (
    <section className="card">
      <h2>{title}</h2>
      <p><strong>Address:</strong> {config.address}</p>
      <p><strong>Phone:</strong> <a href={`tel:${config.phone.replace(/[^+\d]/g, '')}`}>{config.phone}</a></p>
      {config.email && <p><strong>Email:</strong> {config.email}</p>}
      <p><strong>Hours:</strong> {config.hours}</p>
      {mapQuery && (
        <div className="map-wrap">
          <iframe
            title={`${config.name} Map`}
            src={`https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed`}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      )}
    </section>
  )
}
