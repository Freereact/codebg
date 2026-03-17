/// <reference types="vite/client" />

declare module '@customer/config' {
  import type { CustomerConfig } from './types'
  export const config: CustomerConfig
}

declare module '@customer/theme.css' {}

declare module '*.jpg' {
  const src: string
  export default src
}

declare module '*.jpeg' {
  const src: string
  export default src
}

declare module '*.png' {
  const src: string
  export default src
}

declare module '*.webp' {
  const src: string
  export default src
}
