import { CanvasGL } from './components/CanvasGL'
import { Controls } from './components/Controls'
import { HelpModal } from './components/HelpModal'
import { useAnimator } from './hooks/useAnimator'

function App() {
  useAnimator() // Hook for physics/animation loop (updates store)

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black text-white">
      <CanvasGL />
      <Controls />
      <HelpModal />
    </div>
  )
}

export default App
