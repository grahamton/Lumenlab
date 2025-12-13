import { useEffect } from 'react'
import { CanvasGL } from './components/CanvasGL'
import { Controls } from './components/Controls'
import { HelpModal } from './components/HelpModal'
import { useAnimator } from './hooks/useAnimator'
import { useGamepad } from './hooks/useGamepad'
import { useStore } from './store/useStore'
import { midiManager } from './core/MidiManager'

import { ErrorBoundary } from './components/ErrorBoundary'

function App() {
  useAnimator() // Hook for physics/animation loop (updates store)
  useGamepad() // Hook for Xbox controller input

  useEffect(() => {
    const state = useStore.getState()

    // Startup Preference Check
    if (state.ui.resumeOnStartup === false) {
      console.log("Startup Preference: Start Fresh. Resetting state...")
      state.resetAll()
      // We need to re-fetch state after reset to ensure we have clean state for other checks if needed,
      // but resetAll() sets state synchronously in Zustand.
    }
    // Self-Repair (Only needed if we didn't just reset)
    else if (!state.audio || !state.flux || state.effects.bloom === undefined) {
      console.warn("Corrupted State detected. Performing Factory Reset.")
      state.resetAll()
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
