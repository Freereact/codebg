import { useState } from 'react'
import type { BusinessInfoInput } from '../../types/portal'
import { Button } from '../ui/button'

interface BusinessInfoFormProps {
  onSubmit: (info: BusinessInfoInput) => void
  onBack: () => void
  loading: boolean
}

export function BusinessInfoForm({ onSubmit, onBack, loading }: BusinessInfoFormProps) {
  const [info, setInfo] = useState<BusinessInfoInput>({
    name: '',
    phone: '',
    address: '',
    hours: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(info)
  }

  const updateField = (field: keyof BusinessInfoInput, value: string) => {
    setInfo((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div>
        <label htmlFor="biz-name" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
          Business name *
        </label>
        <input
          id="biz-name"
          type="text"
          required
          value={info.name}
          onChange={(e) => updateField('name', e.target.value)}
          placeholder="Sunrise Bakery"
          className="input"
        />
      </div>

      <div>
        <label htmlFor="biz-phone" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
          Phone number *
        </label>
        <input
          id="biz-phone"
          type="tel"
          required
          value={info.phone}
          onChange={(e) => updateField('phone', e.target.value)}
          placeholder="(250) 555-0366"
          className="input"
        />
      </div>

      <div>
        <label htmlFor="biz-address" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
          Address *
        </label>
        <input
          id="biz-address"
          type="text"
          required
          value={info.address}
          onChange={(e) => updateField('address', e.target.value)}
          placeholder="123 Main St, Penticton, BC"
          className="input"
        />
      </div>

      <div>
        <label htmlFor="biz-hours" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
          Business hours *
        </label>
        <input
          id="biz-hours"
          type="text"
          required
          value={info.hours}
          onChange={(e) => updateField('hours', e.target.value)}
          placeholder="Mon-Sat 7am-5pm"
          className="input"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="ghost" onClick={onBack} className="flex-1">
          Back
        </Button>
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? 'Creating...' : 'Create my site'}
        </Button>
      </div>
    </form>
  )
}
