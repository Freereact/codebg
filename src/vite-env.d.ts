/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_TURNSTILE_SITE_KEY: string
  readonly VITE_API_BASE_URL?: string
  readonly VITE_SITE_URL?: string
  readonly VITE_SAMPLE_APPS_URL?: string
  readonly VITE_IS_TEST?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare global {
  interface Window {
    turnstile?: {
      render: (el: string | HTMLElement, options: Record<string, unknown>) => string
      reset: (widgetId: string) => void
      remove: (widgetId: string) => void
    }
  }
}

export {}
