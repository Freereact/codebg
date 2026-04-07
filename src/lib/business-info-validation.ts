export interface BusinessInfo {
  name: string
  phone: string
  address: string
  hours: string
  email?: string
  tagline?: string
}

export type FieldErrors = Partial<Record<keyof BusinessInfo, string>>

export function validateBusinessInfo(info: BusinessInfo): FieldErrors {
  const errors: FieldErrors = {}
  if (info.name.trim().length < 2) errors.name = 'At least 2 characters'
  if (info.name.length > 200) errors.name = 'Max 200 characters'
  if (info.phone.trim().length < 5) errors.phone = 'At least 5 characters'
  if (info.phone.length > 30) errors.phone = 'Max 30 characters'
  if (info.address.trim().length < 5) errors.address = 'At least 5 characters'
  if (info.address.length > 500) errors.address = 'Max 500 characters'
  if (info.hours.trim().length < 3) errors.hours = 'At least 3 characters'
  if (info.hours.length > 500) errors.hours = 'Max 500 characters'
  if (info.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(info.email)) errors.email = 'Invalid email format'
  if (info.tagline && info.tagline.length > 500) errors.tagline = 'Max 500 characters'
  return errors
}
