'use client'
import React from 'react'

export default class ErrorBoundary extends React.Component {
  constructor(props){
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError(){
    return { hasError: true }
  }
  componentDidCatch(error, info){
    console.error('ErrorBoundary', error, info)
  }
  render(){
    if (this.state.hasError) {
      return (
        <div className="min-h-[50vh] grid place-items-center p-6">
          <div className="text-center space-y-3">
            <h2 className="text-2xl font-semibold">Something went wrong</h2>
            <button className="px-4 py-2 rounded-md border" onClick={() => location.reload()}>Reload</button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

