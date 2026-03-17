import { useEffect, useState } from 'react'
import { Section } from '../ui/section'
import { Button } from '../ui/button'
import type { FormState } from '../../types'

const initialForm: FormState = { name: '', email: '', message: '' }

interface ContactProps {
  onSubmit: (form: FormState) => void
  sent: boolean
  error: string
}

export function Contact({ onSubmit, sent, error }: ContactProps) {
  const [form, setForm] = useState<FormState>(initialForm)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    onSubmit(form)
  }

  useEffect(() => {
    if (sent) setForm(initialForm)
  }, [sent])

  return (
    <Section id="contact" heading="Contact" description="Tell us what you need. We'll reply with a practical plan.">
      <form className="mt-6 grid gap-5 md:grid-cols-2" onSubmit={handleSubmit}>
        <label className="space-y-1.5">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Name</span>
          <input className="input" name="name" value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} required />
        </label>
        <label className="space-y-1.5">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Email</span>
          <input className="input" type="email" name="email" value={form.email} onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))} required />
        </label>
        <label className="space-y-1.5 md:col-span-2">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Project summary</span>
          <textarea className="input min-h-32" name="message" value={form.message} onChange={(e) => setForm((s) => ({ ...s, message: e.target.value }))} required />
        </label>
        <div className="md:col-span-2 flex items-center gap-3">
          <Button type="submit" size="lg">Send request</Button>
          {sent && <span className="text-sm font-medium text-emerald-700">Thanks &mdash; request queued successfully.</span>}
        </div>
        {error && <p className="md:col-span-2 text-sm text-red-600">{error}</p>}
      </form>
    </Section>
  )
}
