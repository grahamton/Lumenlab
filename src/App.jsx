import { useEffect } from 'react'
import { CanvasGL } from './components/CanvasGL'
import { Controls } from './components/Controls'
import { HelpModal } from './components/HelpModal'
import { useAnimator } from './hooks/useAnimator'
import { useStore } from './store/useStore'
import { midiManager } from './core/MidiManager'

import { ErrorBoundary } from './components/ErrorBoundary'

function App() {
  useAnimator() // Hook for physics/animation loop (updates store)

  useEffect(() => {
    // Self-Repair: Check for corrupted state/missing keys from old saves
    const state = useStore.getState()
    if (!state.audio || !state.flux || state.effects.bloom === undefined) {
      console.warn("Corrupted State detected. Performing Factory Reset.")
      localStorage.clear()
      window.location.reload()
      return
    }

    midiManager.init()

    const handleKeyDown = (e) => {
      if (e.key === 'Tab') {
        e.preventDefault()
        useStore.getState().toggleControls(!useStore.getState().ui.controlsOpen)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black text-white">
      <ErrorBoundary fallback={<div className="absolute inset-0 flex items-center justify-center text-red-500 font-mono text-xs">Canvas Error - Recovering...</div>}>
        <CanvasGL />
      </ErrorBoundary>
      <Controls />
      {/* Floating Toggle Button (Visible when UI hidden) */}
      {!useStore((state) => state.ui.controlsOpen) && (
        <button
          onClick={() => useStore.getState().toggleControls(true)}
          className="fixed bottom-4 right-4 z-40 p-2 bg-neutral-800/50 hover:bg-neutral-800 text-white rounded-full border border-white/10 backdrop-blur transition-all"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h6v18h-6M10 17l5-5-5-5M13 12H3" /></svg>
        </button>
      )}
      <HelpModal />
    </div>
  )
}

export default App
