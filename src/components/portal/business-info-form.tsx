import { useState } from 'react'
import type { BusinessInfoInput } from '../../types/portal'
import { Button } from '../ui/button'
import { validateBusinessInfo, type BusinessInfo, type FieldErrors } from '../../lib/business-info-validation'

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
  const [errors, setErrors] = useState<FieldErrors>({})
  const [touched, setTouched] = useState<Partial<Record<keyof BusinessInfo, boolean>>>({})

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const fieldErrors = validateBusinessInfo(info)
    setErrors(fieldErrors)
    setTouched({ name: true, phone: true, address: true, hours: true })
    if (Object.keys(fieldErrors).length === 0) {
      onSubmit(info)
    }
  }

  const updateField = (field: keyof BusinessInfoInput, value: string) => {
    setInfo((prev) => ({ ...prev, [field]: value }))
    if (touched[field]) {
      const updated = { ...info, [field]: value }
      const fieldErrors = validateBusinessInfo(updated)
      setErrors((prev) => ({ ...prev, [field]: fieldErrors[field] }))
    }
  }

  const handleBlur = (field: keyof BusinessInfoInput) => {
    setTouched((prev) => ({ ...prev, [field]: true }))
    const fieldErrors = validateBusinessInfo(info)
    setErrors((prev) => ({ ...prev, [field]: fieldErrors[field] }))
  }

  const fields: { key: keyof BusinessInfoInput; id: string; label: string; type: string; placeholder: string }[] = [
    { key: 'name', id: 'biz-name', label: 'Business name', type: 'text', placeholder: 'Sunrise Bakery' },
    { key: 'phone', id: 'biz-phone', label: 'Phone number', type: 'tel', placeholder: '(250) 555-0366' },
    { key: 'address', id: 'biz-address', label: 'Address', type: 'text', placeholder: '123 Main St, Penticton, BC' },
    { key: 'hours', id: 'biz-hours', label: 'Business hours', type: 'text', placeholder: 'Mon-Sat 7am-5pm' },
  ]

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      {fields.map((f) => {
        const fieldError = touched[f.key] ? errors[f.key] : undefined
        const errorId = `${f.id}-error`
        return (
          <div key={f.key}>
            <label htmlFor={f.id} className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              {f.label} *
            </label>
            <input
              id={f.id}
              type={f.type}
              value={info[f.key]}
              onChange={(e) => updateField(f.key, e.target.value)}
              onBlur={() => handleBlur(f.key)}
              placeholder={f.placeholder}
              className={`input ${fieldError ? 'border-red-400 dark:border-red-500' : ''}`}
              aria-invalid={fieldError ? true : undefined}
              aria-describedby={fieldError ? errorId : undefined}
            />
            {fieldError && (
              <p id={errorId} role="alert" className="mt-1 text-xs text-red-500 dark:text-red-400">
                {fieldError}
              </p>
            )}
          </div>
        )
      })}

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
