import React, { useRef, useEffect } from 'react'
import { useStore } from '../store/useStore'

export function Canvas() {
  const canvasRef = useRef(null)
  const backBufferRef = useRef(null) // Persistent back-buffer
  const { image, transforms, symmetry, warp, displacement, masking, feedback, recording, setRecording, tiling } = useStore()

  // Recording Effect
  useEffect(() => {
    if (!recording.isActive) return

    const canvas = canvasRef.current
    if (!canvas) return

    // 60 FPS Capture
    const stream = canvas.captureStream(60)
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp9',
      videoBitsPerSecond: 5000000 // 5 Mbps
    })

    const chunks = []
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data)
    }

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `lumen-lab-loop-${Date.now()}.webm`
      a.click()
      URL.revokeObjectURL(url)

      setRecording('isActive', false)
      setRecording('progress', 0)
    }

    mediaRecorder.start()

    // 3 Second Timer
    const duration = 3000
    const startTime = Date.now()

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(100, Math.round((elapsed / duration) * 100))
      setRecording('progress', progress)

      if (elapsed >= duration) {
        clearInterval(interval)
        mediaRecorder.stop()
      }
    }, 100)

    return () => {
      clearInterval(interval)
      if (mediaRecorder.state !== 'inactive') mediaRecorder.stop()
    }

  }, [recording.isActive])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { willReadFrequently: true })

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    // Initialize Back Buffer if needed
    if (!backBufferRef.current) {
      backBufferRef.current = document.createElement('canvas')
    }
    const backBuffer = backBufferRef.current
    if (backBuffer.width !== canvas.width || backBuffer.height !== canvas.height) {
      backBuffer.width = canvas.width
      backBuffer.height = canvas.height
    }
    const backCtx = backBuffer.getContext('2d')

    // Fill background
    ctx.fillStyle = '#171717'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Apply Feedback (Draw Back Buffer)
    if (feedback.amount > 0) {
      ctx.save()
      ctx.globalAlpha = feedback.amount / 100
      ctx.drawImage(backBuffer, 0, 0)
      ctx.restore()
    }

    if (!image) {
      ctx.font = '20px Inter, sans-serif'
      ctx.fillStyle = '#525252'
      ctx.textAlign = 'center'
      ctx.fillText('Upload an image to begin', canvas.width / 2, canvas.height / 2)
      return
    }

    const centerX = canvas.width / 2
    const centerY = canvas.height / 2

    // --- STRATEGY ---
    // 1. Offscreen Canvas: Draw transformed geometry (Affine + Symmetry)
    const offCanvas = document.createElement('canvas')
    offCanvas.width = canvas.width
    offCanvas.height = canvas.height
    const offCtx = offCanvas.getContext('2d')

    // 2. Offscreen Canvas: Draw ORIGINAL geometry (centered, no symmetry/warp) for "Frozen" areas
    const origCanvas = document.createElement('canvas')
    origCanvas.width = canvas.width
    origCanvas.height = canvas.height
    const origCtx = origCanvas.getContext('2d')

    // Helper to draw the base slice/image
    const drawSimpleImage = (targetCtx) => {
      targetCtx.save()
      targetCtx.translate(centerX, centerY)
      targetCtx.translate(transforms.x, transforms.y)
      targetCtx.scale(transforms.scale, transforms.scale)
      targetCtx.rotate(transforms.rotation)
      targetCtx.drawImage(image, -image.width / 2, -image.height / 2)
      targetCtx.restore()
    }

    // Draw Frozen Layer (Affine Only)
    drawSimpleImage(origCtx)

    // Function to draw Active Layer (Affine + Symmetry)
    const drawActiveGeometry = (targetCtx) => {
      if (symmetry.enabled) {
        const slices = symmetry.slices
        const angle = (2 * Math.PI) / slices

        for (let i = 0; i < slices; i++) {
          targetCtx.save()
          targetCtx.translate(centerX, centerY)
          targetCtx.rotate(i * angle)

          targetCtx.beginPath()
          targetCtx.moveTo(0, 0)
          targetCtx.arc(0, 0, Math.max(canvas.width, canvas.height), -0.5 * angle - 0.01, 0.5 * angle + 0.01)
          targetCtx.lineTo(0, 0)
          targetCtx.clip()

          if (i % 2 !== 0) {
            targetCtx.scale(1, -1)
          }

          // Draw image with affine transforms inside the wedge
          targetCtx.translate(transforms.x, transforms.y)
          targetCtx.scale(transforms.scale, transforms.scale)
          targetCtx.rotate(transforms.rotation)
          targetCtx.drawImage(image, -image.width / 2, -image.height / 2)

          targetCtx.restore()
        }
      } else {
        drawSimpleImage(targetCtx)
      }
    }

    // --- TILING LOGIC (Phase 5) ---
    if (tiling.type !== 'none') {
      const tileSize = Math.min(canvas.width, canvas.height) * tiling.scale
      const cols = Math.ceil(canvas.width / tileSize) + 2
      const rows = Math.ceil(canvas.height / tileSize) + 2

      // offCtx is clear (new canvas)

      // We iterate and draw tiles
      // We iterate and draw tiles

      // CACHE: If feather > 0, we should pre-render the feathered unit cell to improve performance?
      // For now, let's do it per tile or use a temp canvas for the unit cell.

      let unitCellCanvas = null

      if (tiling.feather > 0) {
        const size = Math.min(canvas.width, canvas.height) // Base size for unit cell gen?
        // To properly feather, we need the unit cell as an image.
        // Let's create a temp canvas that contains the result of `drawActiveGeometry`
        unitCellCanvas = document.createElement('canvas')
        // Render at screen resolution for quality, or tile resolution?
        // Let's match screen to be safe for now, though performance heavy.
        unitCellCanvas.width = canvas.width
        unitCellCanvas.height = canvas.height
        const ucCtx = unitCellCanvas.getContext('2d')

        // Draw Active geometry centered
        ucCtx.translate(centerX, centerY)
        // We need to undo the canvas translation if we want it centered in temp
        // Actually drawActiveGeometry assumes (centerX, centerY) as origin.
        // So we just call it on ucCtx.
        // But wait, drawActiveGeometry sets its own transforms?
        // No, it expects targetCtx to have default transform (identity). It does internal translates.
        drawActiveGeometry(ucCtx)

        // Apply Feather Mask
        // Radial Gradient or Rect Gradient? p1 usually implies rectangular tile.
        // But symmetry shapes are circular/wedge.
        // "Perfect seamless duplication" for p1 usually means Rectangular Fade.

        const f = tiling.feather * 0.5 // 0 to 0.5 radius
        // We want to fade the edges of the TILE, not the screen.
        // But the geometry is drawn "full screen".
        // We need to adhere to the `tileSize`.
        // This is tricky because `drawActiveGeometry` draws unbounded.

        // Simplified Feather: Mask the Unit Cell to a Circle or Box based on tileSize?
        // Let's try Radial since symmetry is radial.

        ucCtx.globalCompositeOperation = 'destination-in'
        const grad = ucCtx.createRadialGradient(centerX, centerY, tileSize * 0.5 * (1 - tiling.feather), centerX, centerY, tileSize * 0.5)
        grad.addColorStop(0, 'rgba(0,0,0,1)')
        grad.addColorStop(1, 'rgba(0,0,0,0)')

        ucCtx.fillStyle = grad
        ucCtx.fillRect(0, 0, unitCellCanvas.width, unitCellCanvas.height)

        ucCtx.globalCompositeOperation = 'source-over'
      }

      for (let row = -1; row < rows; row++) {
        for (let col = -1; col < cols; col++) {
          offCtx.save()

          const tx = col * tileSize
          const ty = row * tileSize
          const halfTile = tileSize / 2

          // Center of the current tile
          offCtx.translate(tx + halfTile, ty + halfTile)

          // Wallpaper Group Logic
          if (tiling.type === 'p2') {
            if ((row + col) % 2 !== 0) {
              offCtx.rotate(Math.PI)
            }
          } else if (tiling.type === 'p4m') {
            const isColOdd = col % 2 !== 0
            const isRowOdd = row % 2 !== 0

            // Move origin to corner for scaling? No, logic above was:
            // if col%2!=0, translate(tileSize, 0) scale(-1, 1)
            // relative to tx, ty (top left of tile)

            // Let's revert to Top-Left logic for transforms if p4m
            offCtx.translate(-halfTile, -halfTile) // Go back to top-left

            if (isColOdd) {
              offCtx.translate(tileSize, 0)
              offCtx.scale(-1, 1)
            }
            if (isRowOdd) {
              offCtx.translate(0, tileSize)
              offCtx.scale(1, -1)
            }

            offCtx.translate(halfTile, halfTile) // Go back to center
          }

          // Apply Overlap (Scale the drawing, not the grid)
          const scaleMult = 1.0 + tiling.overlap
          offCtx.scale(scaleMult, scaleMult)

          // Draw Unit Cell
          // We need to scale the "Screen Size" geometry down to "Tile Size"
          const baseScale = tileSize / Math.min(canvas.width, canvas.height)
          offCtx.scale(baseScale, baseScale)

          // Move (0,0) to be the "Center" of the screen space for drawActiveGeometry
          offCtx.translate(-centerX, -centerY)

          if (tiling.feather > 0 && unitCellCanvas) {
            // Draw the pre-feathered image
            offCtx.drawImage(unitCellCanvas, 0, 0)
          } else {
            drawActiveGeometry(offCtx)
          }

          offCtx.restore()
        }
      }
    } else {
      drawActiveGeometry(offCtx)
    }

    // --- PIXEL LOOP (Warp + Displacement + Masking) ---
    const hasWarp = warp.type !== 'none'
    const hasDisplacement = displacement.amp > 0
    const hasMasking = masking.lumaThreshold > 0 || masking.centerRadius > 0

    const fxCanvas = document.createElement('canvas')
    fxCanvas.width = canvas.width
    fxCanvas.height = canvas.height
    const fxCtx = fxCanvas.getContext('2d')
    let outputCtx = ctx // Default to main

    if (hasWarp || hasDisplacement || hasMasking) {
      outputCtx = fxCtx
    } else {
      ctx.drawImage(offCanvas, 0, 0)
    }

    if (hasWarp || hasDisplacement || hasMasking) {
      const srcData = offCtx.getImageData(0, 0, canvas.width, canvas.height)
      const origData = origCtx.getImageData(0, 0, canvas.width, canvas.height)
      const dstData = fxCtx.createImageData(canvas.width, canvas.height)

      const srcW = canvas.width
      const srcH = canvas.height

      const dispAmp = displacement.amp
      const dispFreq = displacement.freq * 0.01

      const radiusSq = (masking.centerRadius / 100 * Math.min(canvas.width, canvas.height) / 2) ** 2
      const lumaThresh = masking.lumaThreshold * 2.55

      for (let y = 0; y < srcH; y++) {
        for (let x = 0; x < srcW; x++) {

          let isFrozen = false

          // 1. Distance Mask
          if (masking.centerRadius > 0) {
            const dx = x - centerX
            const dy = y - centerY
            if (dx * dx + dy * dy < radiusSq) {
              isFrozen = true
            }
          }

          // 2. Luma Mask
          if (!isFrozen && masking.lumaThreshold > 0) {
            const idx = (y * srcW + x) * 4
            const r = origData.data[idx]
            const g = origData.data[idx + 1]
            const b = origData.data[idx + 2]
            const luma = 0.299 * r + 0.587 * g + 0.114 * b

            if (masking.invertLuma) {
              if (luma < lumaThresh) isFrozen = true
            } else {
              if (luma > lumaThresh) isFrozen = true
            }
          }

          const dstIdx = (y * srcW + x) * 4

          if (isFrozen) {
            const idx = dstIdx
            dstData.data[idx] = origData.data[idx]
            dstData.data[idx + 1] = origData.data[idx + 1]
            dstData.data[idx + 2] = origData.data[idx + 2]
            dstData.data[idx + 3] = 255
          } else {
            let u = x
            let v = y

            if (hasWarp) {
              let nx = (x - centerX) / centerX
              let ny = (y - centerY) / centerY

              if (warp.type === 'polar') {
                const r = Math.sqrt(nx * nx + ny * ny)
                const theta = Math.atan2(ny, nx)
                u = (theta + Math.PI) / (2 * Math.PI) * srcW
                v = r * srcH
              } else if (warp.type === 'log-polar') {
                const r = Math.sqrt(nx * nx + ny * ny)
                const theta = Math.atan2(ny, nx)
                if (r > 0) {
                  const logR = Math.log(r)
                  u = ((theta / Math.PI) * 0.5 + 0.5) * srcW
                  v = (logR * 0.5 % 1.0) * srcH
                  if (v < 0) v += srcH
                }
              }
            }

            if (hasDisplacement) {
              u += Math.sin(v * dispFreq) * dispAmp
              v += Math.cos(u * dispFreq) * dispAmp
            }

            const srcX = Math.floor(u) % srcW
            let srcY = Math.floor(v) % srcH
            let safeSrcX = srcX < 0 ? srcX + srcW : srcX
            let safeSrcY = srcY < 0 ? srcY + srcH : srcY

            if (safeSrcX >= 0 && safeSrcX < srcW && safeSrcY >= 0 && safeSrcY < srcH) {
              const srcIdx = (safeSrcY * srcW + safeSrcX) * 4
              dstData.data[dstIdx] = srcData.data[srcIdx]
              dstData.data[dstIdx + 1] = srcData.data[srcIdx + 1]
              dstData.data[dstIdx + 2] = srcData.data[srcIdx + 2]
              dstData.data[dstIdx + 3] = 255
            }
          }
        }
      }
      fxCtx.putImageData(dstData, 0, 0)
      ctx.drawImage(fxCanvas, 0, 0)
    }

    // Update Back Buffer
    backCtx.clearRect(0, 0, canvas.width, canvas.height)
    backCtx.drawImage(canvas, 0, 0)


  }, [image, transforms, symmetry, warp, displacement, masking, feedback, tiling, window.innerWidth, window.innerHeight])

  return (
    <canvas ref={canvasRef} className="block w-full h-full" />
  )
}
