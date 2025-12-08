# Lumen Lab

**Lumen Lab** is a generative art "chemistry set" designed for visual synthesis, VJing, and creative exploration. It transforms static images into living, breathing, and infinite mathematical tapestries using the HTML5 Canvas API.

## 🧪 Features

### 📐 Phase 1: The Geometry Engine
- **Affine Transforms**: Real-time Translation, Scaling, and Rotation.
- **Symmetry Generator**: A Dihedral Group engine creating complex kaleidoscope effects with adjustable slices.

### 🌀 Phase 2: The "Trippy" Math
- **Warping**: Transform Cartesian coordinates to Polar or Log-Polar (Droste Effect) space.
- **Displacement**: Apply liquid-like flow and distortion to pixels.

### ❄️ Phase 3: The "Freeze" System (Masking)
- **Luma Key**: Freeze pixels based on brightness/darkness.
- **Radial Mask**: Lock the center of the image while the periphery mutates.

### ⏳ Phase 4: The Time Studio
- **Video Echo**: Feedback loops that create trailing "ghosts" of previous frames.
- **Boomerang Loop**: Record 3-second seamless video loops (.webm).

### 🕸️ Phase 5: The Fabric Weaver
- **Wallpaper Groups**: Turn your art into an infinite tiling texture.
    - **p1**: Standard Grid.
    - **p2**: 180° Rotational Tiling.
    - **p4m**: Square Kaleidoscopic Tiling.

## 🛠️ Technology Stack
- **Core**: React 18, Vite
- **Styling**: TailwindCSS
- **State**: Zustand
- **Graphics**: Native HTML5 Canvas API (2D Context)

## 🚀 Getting Started

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start the Development Server**
   ```bash
   npm run dev
   ```

3. **Open the Lab**
   Navigate to `http://localhost:5173`

4. **Create Art**
   - Upload an image.
   - Experiment with the controls on the right panel.
   - Click "Record 3s Loop" to save your creation.

## 📜 License
MIT
