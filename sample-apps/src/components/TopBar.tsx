import type { CustomerConfig } from '../types'

export default function TopBar({ config }: { config: CustomerConfig }) {
  return (
    <header className="topbar">
      <span>📍 {config.address} | 🕒 {config.hours}</span>
      <a href={`tel:${config.phone.replace(/[^+\d]/g, '')}`}>Call: {config.phone}</a>
    </header>
  )
}
