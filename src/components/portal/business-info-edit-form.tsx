import { useState } from 'react'
import { Button } from '../ui/button'
import { validateBusinessInfo, type BusinessInfo, type FieldErrors } from '../../lib/business-info-validation'

interface BusinessInfoEditFormProps {
  initialValues: Partial<BusinessInfo>
  onSave: (changed: Partial<BusinessInfo>) => Promise<void>
  saving: boolean
}

const FIELDS: {
  key: keyof BusinessInfo
  label: string
  type: string
  placeholder: string
  required: boolean
}[] = [
  { key: 'name', label: 'Business name', type: 'text', placeholder: 'Sunrise Bakery', required: true },
  { key: 'phone', label: 'Phone number', type: 'tel', placeholder: '(250) 555-0366', required: true },
  { key: 'address', label: 'Address', type: 'text', placeholder: '123 Main St, Penticton, BC', required: true },
  { key: 'hours', label: 'Business hours', type: 'text', placeholder: 'Mon-Sat 7am-5pm', required: true },
  { key: 'email', label: 'Email', type: 'email', placeholder: 'hello@mybusiness.com', required: false },
  { key: 'tagline', label: 'Tagline', type: 'text', placeholder: 'Fresh bread daily since 1995', required: false },
]

export function BusinessInfoEditForm({ initialValues, onSave, saving }: BusinessInfoEditFormProps) {
  const [values, setValues] = useState<BusinessInfo>({
    name: initialValues.name ?? '',
    phone: initialValues.phone ?? '',
    address: initialValues.address ?? '',
    hours: initialValues.hours ?? '',
    email: initialValues.email ?? '',
    tagline: initialValues.tagline ?? '',
  })
  const [errors, setErrors] = useState<FieldErrors>({})
  const [touched, setTouched] = useState<Partial<Record<keyof BusinessInfo, boolean>>>({})

  const isDirty = FIELDS.some((f) => (values[f.key] ?? '') !== (initialValues[f.key] ?? ''))

  const updateField = (key: keyof BusinessInfo, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }))
    if (touched[key]) {
      const updated = { ...values, [key]: value }
      const fieldErrors = validateBusinessInfo(updated)
      setErrors((prev) => ({ ...prev, [key]: fieldErrors[key] }))
    }
  }

  const handleBlur = (key: keyof BusinessInfo) => {
    setTouched((prev) => ({ ...prev, [key]: true }))
    const fieldErrors = validateBusinessInfo(values)
    setErrors((prev) => ({ ...prev, [key]: fieldErrors[key] }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const fieldErrors = validateBusinessInfo(values)
    setErrors(fieldErrors)
    setTouched(Object.fromEntries(FIELDS.map((f) => [f.key, true])))

    const hasErrors = Object.values(fieldErrors).some(Boolean)
    if (hasErrors) return

    // Only send changed fields
    const changed: Partial<BusinessInfo> = {}
    for (const f of FIELDS) {
      if ((values[f.key] ?? '') !== (initialValues[f.key] ?? '')) {
        changed[f.key] = values[f.key] ?? ''
      }
    }
    if (Object.keys(changed).length === 0) return

    await onSave(changed)
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {FIELDS.map((f) => {
        const fieldError = touched[f.key] ? errors[f.key] : undefined
        const errorId = `edit-${f.key}-error`
        return (
          <div key={f.key}>
            <label
              htmlFor={`edit-${f.key}`}
              className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              {f.label} {f.required && '*'}
            </label>
            <input
              id={`edit-${f.key}`}
              type={f.type}
              value={values[f.key] ?? ''}
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

      <div className="pt-2">
        <Button type="submit" disabled={saving || !isDirty}>
          {saving ? 'Saving...' : isDirty ? 'Save & rebuild' : 'No changes'}
        </Button>
      </div>
    </form>
  )
}
