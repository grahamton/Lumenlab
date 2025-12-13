export const CONTROLS = {
  // Global Transforms
  transforms: {
    scale: { min: 0.1, max: 5, step: 0.1, label: 'Scale' },
    rotation: { min: -180, max: 180, step: 1, label: 'Rotation' },
    x: { min: -100, max: 100, step: 1, label: 'Position X' },
    y: { min: -100, max: 100, step: 1, label: 'Position Y' },
  },

  // Generators
  generator: {
    param1: { min: 0, max: 100, step: 1, label: 'Complexity' },
    param2: { min: 0, max: 100, step: 1, label: 'Detail' },
    param3: { min: 0, max: 100, step: 1, label: 'Speed' },
  },

  // Effects
  displacement: {
    amp: { min: 0, max: 200, step: 1, label: 'Amount' },
    freq: { min: 1, max: 50, step: 0.5, label: 'Frequency' },
  },

  effects: {
    bloom: { min: 0, max: 3, step: 0.1, label: 'Bloom' },
    chromaticAberration: { min: 0, max: 1, step: 0.01, label: 'Aberration' },
    noise: { min: 0, max: 1, step: 0.01, label: 'Grain' },
    blur: { min: 0, max: 1, step: 0.01, label: 'Blur' },
    edgeDetect: { min: 0, max: 100, step: 1, label: 'Edge Detect' },
    solarize: { min: 0, max: 100, step: 1, label: 'Solarize' },
    shift: { min: 0, max: 100, step: 1, label: 'RGB Shift' },
    invert: { min: 0, max: 100, step: 1, label: 'Invert' },
  },

  // Color Section
  color: {
    posterize: { min: 2, max: 32, step: 1, label: 'Posterize' },
    r: { min: 0, max: 2, step: 0.05, label: 'Red' },
    g: { min: 0, max: 2, step: 0.05, label: 'Green' },
    b: { min: 0, max: 2, step: 0.05, label: 'Blue' },
    hue: { min: -1.0, max: 1.0, step: 0.01, label: 'Hue Rotate' },
    sat: { min: 0, max: 3.0, step: 0.05, label: 'Saturation' },
    light: { min: 0, max: 2.0, step: 0.05, label: 'Brightness' },
  },

  // Symmetry
  symmetry: {
    slices: { min: 2, max: 32, step: 1, label: 'Slices' },
    offset: { min: -1.0, max: 1.0, step: 0.01, label: 'Center Offset' },
  }
}
