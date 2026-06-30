import { Component, type ReactNode, type ErrorInfo } from 'react'

interface Props {
  children: ReactNode
  name?: string
}

interface State {
  hasError: boolean
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error(`[ErrorBoundary${this.props.name ? ` ${this.props.name}` : ''}]`, error, info.componentStack)
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div
          className="flex flex-col items-center justify-center p-4 gap-1"
          style={{ background: 'var(--surface-2)' }}
        >
          <span className="text-xs font-medium" style={{ color: '#f87171' }}>
            {this.props.name || 'Error'}
          </span>
          <span className="text-xs" style={{ color: 'var(--text-muted)', textAlign: 'center' }}>
            Something went wrong
          </span>
        </div>
      )
    }
    return this.props.children
  }
}
