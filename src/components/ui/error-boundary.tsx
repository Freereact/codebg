import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Button } from './button'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      return (
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 p-8 text-center">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Something went wrong</h2>
          <p className="max-w-sm text-sm text-slate-500 dark:text-slate-400">
            An unexpected error occurred. Please refresh the page to try again.
          </p>
          <Button onClick={() => window.location.reload()}>Refresh page</Button>
        </div>
      )
    }
    return this.props.children
  }
}
