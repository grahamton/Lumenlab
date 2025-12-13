import React from 'react'

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-50">
          <div className="text-red-500 font-mono text-xs mb-4">Canvas Error</div>
          <button
            onClick={() => {
              localStorage.clear()
              window.location.reload()
            }}
            className="px-4 py-2 bg-red-900/30 border border-red-500/50 text-red-500 text-xs font-bold uppercase rounded hover:bg-red-900/50 transition-colors"
          >
            Reset Application
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
