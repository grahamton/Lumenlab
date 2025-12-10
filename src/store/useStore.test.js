import { describe, it, expect, beforeEach } from 'vitest'
import { act } from '@testing-library/react'
import { useStore } from './useStore'

describe('Zustand Store', () => {
  // Reset store before each test to ensure isolation
  beforeEach(() => {
    act(() => {
      useStore.setState({
        // Minimal reset to defaults relevant for testing
        transforms: { x: 0, y: 0, scale: 1, rotation: 0 },
        audio: { enabled: false, source: 'mic', sensitivity: 1.0, reactivity: { bass: 1.0, mid: 1.0, high: 1.0 } },
        effects: { bloom: 0, chromaticAberration: 0, noise: 0, edgeDetect: 0, invert: 0, solarize: 0, shift: 0 }
      })
    })
  })

  it('should initialize with default values', () => {
    const state = useStore.getState()
    expect(state.transforms.scale).toBe(1)
    expect(state.audio.enabled).toBe(false)
  })

  it('should update transforms via setTransform', () => {
    const { setTransform } = useStore.getState()

    act(() => {
      setTransform('scale', 2.5)
      setTransform('rotation', 45)
    })

    const state = useStore.getState()
    expect(state.transforms.scale).toBe(2.5)
    expect(state.transforms.rotation).toBe(45)
  })

  it('should update audio settings via setAudio', () => {
    const { setAudio } = useStore.getState()

    act(() => {
      setAudio('enabled', true)
      setAudio('sensitivity', 1.5)
    })

    const state = useStore.getState()
    expect(state.audio.enabled).toBe(true)
    expect(state.audio.sensitivity).toBe(1.5)
  })

  it('should update nested reactivity settings correctly', () => {
    const { setAudio } = useStore.getState()

    act(() => {
      setAudio('reactivity', { bass: 2.0, mid: 0.5, high: 1.0 })
    })

    const state = useStore.getState()
    expect(state.audio.reactivity.bass).toBe(2.0)
    expect(state.audio.reactivity.mid).toBe(0.5)
  })

  it('should update post-processing effects', () => {
    const { setEffects } = useStore.getState()

    act(() => {
      setEffects('bloom', 0.8)
      setEffects('noise', 0.2)
    })

    const state = useStore.getState()
    expect(state.effects.bloom).toBe(0.8)
    expect(state.effects.noise).toBe(0.2)
  })
})
