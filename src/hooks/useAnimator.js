import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useStore } from '../store/useStore'

export function useAnimator() {
  const { snapshots, animation, loadSnapshot, setAnimation } = useStore()
  const requestRef = useRef()
  const startTimeRef = useRef()
  // const currentIndexRef = useRef(0) // Removed: Use store's activeStep for UI consistency if needed, checking below
  const directionRef = useRef(1) // 1 for forward, -1 for backward

  // Deep Lerp for our state object
  const interpolateState = useCallback((s1, s2, t) => {
    // Helper: Linear Interpolation
    const lerp = (start, end, t) => start * (1 - t) + end * t
    // Helper: Rotation Interpolation (Shortest Path)
    const lerpAngle = (start, end, t) => {
      const delta = (end - start + Math.PI * 3) % (Math.PI * 2) - Math.PI
      return start + delta * t
    }

    if (!s1 || !s2) return s1 || s2

    return {
      transforms: {
        x: lerp(s1.transforms.x, s2.transforms.x, t),
        y: lerp(s1.transforms.y, s2.transforms.y, t),
        scale: lerp(s1.transforms.scale, s2.transforms.scale, t),
        rotation: lerpAngle(s1.transforms.rotation, s2.transforms.rotation, t),
      },
      symmetry: {
        enabled: s1.symmetry.enabled,
        slices: Math.round(lerp(s1.symmetry.slices, s2.symmetry.slices, t)),
      },
      warp: { type: s1.warp.type },
      displacement: {
        amp: lerp(s1.displacement.amp, s2.displacement.amp, t),
        freq: lerp(s1.displacement.freq, s2.displacement.freq, t),
      },
      tiling: {
        type: s1.tiling.type,
        scale: lerp(s1.tiling.scale, s2.tiling.scale, t),
        overlap: lerp(s1.tiling.overlap, s2.tiling.overlap, t),
      },
      masking: {
        lumaThreshold: lerp(s1.masking.lumaThreshold, s2.masking.lumaThreshold, t),
        centerRadius: lerp(s1.masking.centerRadius, s2.masking.centerRadius, t),
        invertLuma: s1.masking.invertLuma,
        feather: lerp(s1.masking.feather, s2.masking.feather, t),
      },
      color: {
        posterize: lerp(s1.color.posterize, s2.color.posterize, t),
      },
      effects: {
        edgeDetect: lerp(s1.effects.edgeDetect, s2.effects.edgeDetect, t),
        invert: lerp(s1.effects.invert, s2.effects.invert, t),
        solarize: lerp(s1.effects.solarize, s2.effects.solarize, t),
        shift: lerp(s1.effects.shift, s2.effects.shift, t),
        bloom: lerp(s1.effects.bloom || 0, s2.effects.bloom || 0, t),
        chromaticAberration: lerp(s1.effects.chromaticAberration || 0, s2.effects.chromaticAberration || 0, t),
        noise: lerp(s1.effects.noise || 0, s2.effects.noise || 0, t),
      },
      generator: {
        type: s1.generator.type,
        param1: lerp(s1.generator.param1, s2.generator.param1, t),
        param2: lerp(s1.generator.param2, s2.generator.param2, t),
        param3: lerp(s1.generator.param3, s2.generator.param3, t),
      }
    }
  }, [])

  // Easing Functions
  const easings = useMemo(() => ({
    linear: t => t,
    easeIn: t => t * t,
    easeOut: t => t * (2 - t),
    easeInOut: t => t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
    bounce: t => {
      const n1 = 7.5625; const d1 = 2.75
      if (t < 1 / d1) return n1 * t * t
      else if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75
      else if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375
      else return n1 * (t -= 2.625 / d1) * t + 0.984375
    },
    elastic: t => {
      const c4 = (2 * Math.PI) / 3
      return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1
    }
  }), [])

  const animate = useCallback(function animateFrame(time) {
    if (useStore.getState().ui.globalPause) {
      requestRef.current = requestAnimationFrame(animateFrame)
      return
    }

    if (!animation.isPlaying || snapshots.length < 2) {
      startTimeRef.current = null // Reset timing when paused
      requestRef.current = requestAnimationFrame(animateFrame)
      return
    }

    // Safety Clamp: Prevent Seizures
    // Fallback to 2000ms if transitionTime is undefined (old state)
    const duration = animation.transitionTime || 2000
    const safeDuration = Math.max(duration, animation.strobeSafety ? 500 : 50)

    if (!startTimeRef.current) startTimeRef.current = time
    const elapsed = time - startTimeRef.current

    // Normalize progress 0-1
    let rawT = Math.min(elapsed / safeDuration, 1)

    // Apply Easing
    const easeFn = easings[animation.easing] || easings.linear
    const progress = easeFn(rawT)

    // Determine Indices
    const currIdx = animation.activeStep
    let nextIdx = currIdx + directionRef.current

    // Loop Logic (Wrap around)
    if (nextIdx >= snapshots.length) {
      if (animation.mode === 'loop') nextIdx = 0
      else { nextIdx = currIdx - 1; directionRef.current = -1 }
    } else if (nextIdx < 0) {
      if (animation.mode === 'loop') nextIdx = snapshots.length - 1
      else { nextIdx = currIdx + 1; directionRef.current = 1 }
    }

    // Index Safety
    if (nextIdx >= snapshots.length) nextIdx = 0
    if (nextIdx < 0) nextIdx = 0

    // Interpolate & Load
    const currentState = interpolateState(snapshots[currIdx], snapshots[nextIdx], progress)
    loadSnapshot(currentState)

    // Cycle Complete?
    if (elapsed >= safeDuration) {
      startTimeRef.current = time // Reset timer for next step

      // Advance Step
      setAnimation('activeStep', nextIdx)

      // Ping Pong Turnaround logic
      if (animation.mode === 'pingpong') {
        if (nextIdx >= snapshots.length - 1) directionRef.current = -1
        if (nextIdx <= 0) directionRef.current = 1
      }

      // Once mode stop
      if (animation.mode === 'once' && nextIdx === snapshots.length - 1) {
        setAnimation('isPlaying', false)
      }
    }

    requestRef.current = requestAnimationFrame(animateFrame)
  }, [animation, snapshots, easings, interpolateState, loadSnapshot, setAnimation])

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(requestRef.current)
  }, [animate])
}
