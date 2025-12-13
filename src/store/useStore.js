import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export const useStore = create(
  persist(
    (set, get) => ({
      // Image State
      image: null,
      setImage: (img) => set({ image: img }),

      // Affine Transformation State
      transforms: {
        x: 0,
        y: 0,
        scale: 1,
        rotation: 0, // in radians
      },

      // Symmetry State
      symmetry: {
        enabled: false,
        type: 'radial', // 'radial', 'mirrorX', 'mirrorY'
        slices: 6,
        offset: 0,
      },

      // Warp State (Distortion)
      warp: {
        type: 'none', // 'none', 'polar', 'log-polar'
      },

      // Displacement State (Liquify)
      displacement: {
        amp: 0,
        freq: 10,
      },

      // Masking State (Vignette/Luma)
      masking: {
        lumaThreshold: 0,
        centerRadius: 0,
        invertLuma: false,
        feather: 0.0,
      },

      // Tiling State
      tiling: {
        type: 'none', // 'none', 'p1', 'p2', 'p4m'
        scale: 1.0,
        overlap: 0.0,
      },

      // Math Seeds (Generative)
      generator: {
        type: 'none', // 'none', 'fibonacci', 'voronoi', 'grid'
        param1: 50,
        param2: 50,
        param3: 50,
        isAnimated: true,
      },

      // Alchemist's Lab
      color: {
        posterize: 32,
        r: 1.0, g: 1.0, b: 1.0,
        hue: 0.0, sat: 1.0, light: 1.0,
      },
      effects: {
        edgeDetect: 0,
        invert: 0,
        solarize: 0,
        shift: 0,
        bloom: 0, // 0-1
        chromaticAberration: 0, // 0-1
        noise: 0, // 0-1
      },

      // The Projectionist (Canvas Control)
      canvas: {
        width: 1920,
        height: 1080,
        aspect: 'video', // 'free', 'video', 'square', 'portrait'
        fit: 'contain',
        shape: 'rectangle', // 'rectangle', 'circle'
      },

      // The Director's Cut
      snapshots: [],
      userPresets: [],
      animation: {
        isPlaying: false,
        mode: 'loop', // 'loop', 'pingpong', 'once'
        bpm: 120, // Rhythm control (Future: sync with audio)
        transitionTime: 2000, // ms. Replaces 'duration'. Safe default > 500ms
        easing: 'easeInOut', // 'linear', 'easeIn', 'easeOut', 'easeInOut', 'bounce', 'elastic'
        activeStep: 0,
        strobeSafety: true, // Forces min transition time limit
      },

      // Flux State (Auto-Animation)
      flux: {
        enabled: false,
      },

      // LFO State (Parameter Modulation)
      lfo: {
        active: false,
        oscillators: []
      },

      setLfo: (key, value) => set((state) => ({
        lfo: { ...state.lfo, [key]: value }
      })),

      // Audio Reactivity State
      audio: {
        enabled: false,
        source: 'mic', // 'mic', 'file'
        sensitivity: 1.0, // Master Gain
        reactivity: {
          bass: 1.0, // Log-Polar / Scale
          mid: 1.0,  // Displacement
          high: 1.0, // Color / Edge
        }
      },

      // MIDI State
      midi: {
        isEnabled: false,
        inputs: [],
        lastMsg: null, // { type: 'cc', channel: 1, note: 10, value: 0.5 }
        mappings: {}   // Future: { 'cc-1-10': 'displacement.amp' }
      },

      setMidi: (key, value) => set((state) => ({
        midi: { ...state.midi, [key]: value }
      })),

      // UI State
      ui: {
        activeTab: 0, // 0=Generators, 1=Modifiers, 2=Global
        layout: 'sidebar', // 'sidebar', 'floating', 'overlay' (future)
        helpOpen: true,
        controlsOpen: true,
        exportRequest: null, // { width, height, filename }
      },

      setUi: (key, value) => set((state) => ({
        ui: { ...state.ui, [key]: value }
      })),

      toggleControls: (isOpen) => set((state) => ({ ui: { ...state.ui, controlsOpen: isOpen } })),

      toggleHelp: () => set((state) => ({ ui: { ...state.ui, helpOpen: !state.ui.helpOpen } })),

      recording: { isActive: false, progress: 0 },

      // Actions
      randomize: () => {
        get().pushHistory() // Auto-save
        set((state) => {
          const rng = (min, max) => Math.random() * (max - min) + min
          const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]

          const symmetrySlices = pick([4, 6, 8, 12, 16])
          const tilingType = Math.random() > 0.3 ? pick(['p1', 'p2', 'p4m']) : 'none'
          const warpType = Math.random() > 0.4 ? pick(['polar', 'log-polar']) : 'none'

          return {
            transforms: {
              x: rng(-100, 100),
              y: rng(-100, 100),
              scale: rng(0.5, 1.5),
              rotation: rng(0, Math.PI * 2),
            },
            symmetry: {
              enabled: Math.random() > 0.3,
              slices: symmetrySlices,
            },
            warp: { type: warpType },
            displacement: {
              amp: Math.random() > 0.5 ? rng(0, 150) : 0,
              freq: rng(5, 50),
            },
            tiling: {
              type: tilingType,
              scale: rng(0.5, 1.5),
              overlap: rng(0, 0.3),
            },
            masking: {
              lumaThreshold: Math.random() > 0.7 ? rng(0, 50) : 0,
              centerRadius: Math.random() > 0.7 ? rng(0, 40) : 0,
              invertLuma: Math.random() > 0.5,
              feather: rng(0, 0.4),
            },
            color: {
              posterize: Math.random() > 0.6 ? Math.floor(rng(4, 16)) : 256,
            },
            effects: {
              edgeDetect: Math.random() > 0.7 ? rng(20, 100) : 0,
              invert: Math.random() > 0.8 ? rng(20, 100) : 0,
              solarize: Math.random() > 0.8 ? rng(20, 100) : 0,
              shift: Math.random() > 0.8 ? rng(5, 50) : 0,
              bloom: Math.random() > 0.7 ? rng(0, 0.5) : 0,
              chromaticAberration: Math.random() > 0.7 ? rng(0, 0.5) : 0,
              noise: Math.random() > 0.8 ? rng(0, 0.2) : 0,
            },
            generator: {
              ...state.generator,
              param1: rng(10, 90),
              param2: rng(10, 90),
            },
          }
        })
      },

      addSnapshot: () => set((state) => {
        const snap = {
          transforms: { ...state.transforms },
          symmetry: { ...state.symmetry },
          warp: { ...state.warp },
          displacement: { ...state.displacement },
          tiling: { ...state.tiling },
          masking: { ...state.masking },
          color: { ...state.color },
          effects: { ...state.effects },
          generator: { ...state.generator },
          id: Date.now()
        }
        return { snapshots: [...state.snapshots, snap] }
      }),

      deleteSnapshot: (index) => set((state) => ({
        snapshots: state.snapshots.filter((_, i) => i !== index)
      })),

      loadSnapshot: (snap) => set({
        transforms: { ...snap.transforms },
        symmetry: { ...snap.symmetry },
        warp: { ...snap.warp },
        displacement: { ...snap.displacement },
        tiling: { ...snap.tiling },
        masking: { ...snap.masking },
        color: { ...snap.color },
        effects: { ...snap.effects },
        generator: { ...snap.generator },
      }),

      saveUserPreset: (name) => set((state) => {
        const newPreset = {
          name,
          id: Date.now(),
          state: {
            transforms: { ...state.transforms },
            symmetry: { ...state.symmetry },
            warp: { ...state.warp },
            displacement: { ...state.displacement },
            tiling: { ...state.tiling },
            masking: { ...state.masking },
            color: { ...state.color },
            effects: { ...state.effects },
            generator: { ...state.generator },
          }
        }
        return { userPresets: [...(state.userPresets || []), newPreset] }
      }),

      deleteUserPreset: (id) => set((state) => ({
        userPresets: state.userPresets.filter((p) => p.id !== id)
      })),

      setAnimation: (key, value) => set((state) => ({
        animation: { ...state.animation, [key]: value }
      })),

      setTransform: (key, value) => set((state) => ({
        transforms: { ...state.transforms, [key]: value }
      })),

      setSymmetry: (key, value) => set((state) => ({
        symmetry: { ...state.symmetry, [key]: value }
      })),

      setWarp: (key, value) => set((state) => ({
        warp: { ...state.warp, [key]: value }
      })),

      setDisplacement: (key, value) => set((state) => ({
        displacement: { ...state.displacement, [key]: value }
      })),

      setMasking: (key, value) => set((state) => ({
        masking: { ...state.masking, [key]: value }
      })),

      setRecording: (key, value) => set((state) => ({
        recording: { ...state.recording, [key]: value }
      })),

      setTiling: (key, value) => set((state) => ({
        tiling: { ...state.tiling, [key]: value }
      })),

      setColor: (key, value) => {
        set((state) => ({
          color: { ...state.color, [key]: value }
        }))
      },

      setEffect: (key, value) => set((state) => ({
        effects: { ...state.effects, [key]: value }
      })),

      setGenerator: (key, value) => {
        console.log("setGenerator called:", key, value)
        set((state) => {
          console.log("Previous Gen:", state.generator)
          return { generator: { ...state.generator, [key]: value } }
        })
      },

      setCanvas: (key, value) => set((state) => ({
        canvas: { ...state.canvas, [key]: value }
      })),

      resetState: () => set((state) => ({
        transforms: { x: 0, y: 0, scale: 1, rotation: 0 },
        symmetry: { enabled: false, type: 'radial', slices: 6 },
        warp: { type: 'none' },
        displacement: { amp: 0, freq: 10 },
        masking: { lumaThreshold: 0, centerRadius: 0, invertLuma: false, feather: 0.0 },
        recording: { isActive: false, progress: 0 },
        tiling: { type: 'none', scale: 1.0, overlap: 0.0 },
        tiling: { type: 'none', scale: 1.0, overlap: 0.0 },
        generator: { type: 'none', param1: 50, param2: 50, param3: 50, isAnimated: true },
        color: { posterize: 32, r: 1, g: 1, b: 1, hue: 0, sat: 1, light: 1 },
        effects: { edgeDetect: 0, invert: 0, solarize: 0, shift: 0, bloom: 0, chromaticAberration: 0, noise: 0 },
        flux: { enabled: false },
        animation: { ...state.animation, isPlaying: false, transitionTime: 2000, mode: 'loop', easing: 'easeInOut', activeStep: 0 }
      })),

      resetForUpload: () => set((state) => ({
        generator: { type: 'none', param1: 50, param2: 50, param3: 50, isAnimated: true },
        tiling: { type: 'none', scale: 1.0, overlap: 0.0 },
        warp: { type: 'none' },
        displacement: { amp: 0, freq: 10 },
        warp: { type: 'none' },
        displacement: { amp: 0, freq: 10 },
        symmetry: { enabled: false, type: 'radial', slices: 6, offset: 0 },
        effects: { edgeDetect: 0, invert: 0, solarize: 0, shift: 0, bloom: 0, chromaticAberration: 0, noise: 0 },
        effects: { edgeDetect: 0, invert: 0, solarize: 0, shift: 0, bloom: 0, chromaticAberration: 0, noise: 0 },
        transforms: { x: 0, y: 0, scale: 1, rotation: 0 },
      })),

      setFlux: (key, value) => set((state) => ({
        flux: { ...state.flux, [key]: value }
      })),

      setAudio: (key, value) => set((state) => {
        return { audio: { ...state.audio, [key]: value } }
      }),

      // History & Reset
      history: [],

      pushHistory: () => set((state) => {
        // Limit history to 20 steps
        const newHistory = [
          {
            transforms: { ...state.transforms },
            symmetry: { ...state.symmetry },
            warp: { ...state.warp },
            displacement: { ...state.displacement },
            tiling: { ...state.tiling },
            masking: { ...state.masking },
            color: { ...state.color },
            effects: { ...state.effects },
            generator: { ...state.generator },
            animation: { ...state.animation }
          },
          ...state.history
        ].slice(0, 20)
        return { history: newHistory }
      }),

      undo: () => set((state) => {
        if (state.history.length === 0) return {}
        const [previous, ...rest] = state.history
        return {
          ...previous,
          history: rest
        }
      }),

      resetParams: () => {
        const { pushHistory } = get()
        pushHistory() // Save before reset
        set((state) => ({
          transforms: { x: 0, y: 0, scale: 1, rotation: 0 },
          symmetry: { enabled: false, type: 'radial', slices: 6, offset: 0 },
          warp: { type: 'none' },
          displacement: { amp: 0, freq: 10 },
          masking: { lumaThreshold: 0, centerRadius: 0, invertLuma: false, feather: 0.0 },
          tiling: { type: 'none', scale: 1.0, overlap: 0.0 },
          tiling: { type: 'none', scale: 1.0, overlap: 0.0 },
          generator: { type: 'none', param1: 50, param2: 50, param3: 50, isAnimated: true },
          color: { posterize: 32, r: 1, g: 1, b: 1, hue: 0, sat: 1, light: 1 },
          effects: { edgeDetect: 0, invert: 0, solarize: 0, shift: 0, bloom: 0, chromaticAberration: 0, noise: 0 },
          flux: { enabled: false },
          animation: { ...state.animation, isPlaying: false }
        }))
      },

      // UI & Export
      triggerExport: (req) => set((state) => ({
        ui: { ...state.ui, exportRequest: req }
      })),

      toggleHelp: (val) => set((state) => ({
        ui: { ...state.ui, helpOpen: val !== undefined ? val : !state.ui.helpOpen }
      }))
    }),
    {
      name: 'lumen-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        transforms: state.transforms,
        symmetry: state.symmetry,
        warp: state.warp,
        displacement: state.displacement,
        masking: state.masking,
        tiling: state.tiling,
        generator: state.generator,
        color: state.color,
        effects: state.effects,
        canvas: state.canvas,
        snapshots: state.snapshots,
        userPresets: state.userPresets,
        audio: state.audio,
        flux: state.flux,
        animation: state.animation,
        ui: state.ui,
      }),
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...persistedState,
        // Deep merge nested objects to ensure new keys (like 'bloom' or 'audio') are present
        // Deep merge nested objects to ensure new keys (like 'bloom' or 'audio') are present
        effects: { ...currentState.effects, ...(persistedState?.effects || {}) },
        audio: { ...currentState.audio, ...(persistedState?.audio || {}) },
        flux: { ...currentState.flux, ...(persistedState?.flux || {}) },
        ui: { ...currentState.ui, ...(persistedState?.ui || {}) },
        animation: { ...currentState.animation, ...(persistedState?.animation || {}) },
        // Deep merge Symmetry & Generator to preserve new keys (type, isAnimated)
        symmetry: { ...currentState.symmetry, ...(persistedState?.symmetry || {}) },
        generator: { ...currentState.generator, ...(persistedState?.generator || {}) },
        color: { ...currentState.color, ...(persistedState?.color || {}) }, // Add Color deep merge
      }),
    }
  )
)
