varying vec2 vUv;

uniform sampler2D uTexture;
uniform vec2 uResolution;
uniform float uTime;
uniform float uAspect; // Canvas Aspect Ratio
uniform float uImageAspect; // Image Aspect Ratio
uniform float uShape; // 0=Rect, 1=Circle

// Transforms
uniform vec4 uTransforms; // x, y, scale, rotation

// Symmetry
uniform bool uSymEnabled;
uniform float uSymSlices;

// Warp & Distortion
uniform float uWarpType; // 0=none, 1=polar, 2=log-polar
uniform vec2 uDisplacement; // amp, freq

// Tiling
uniform float uTilingType; // 0=none, 1=p1-grid, 2=p2-spin, 3=p4m-mirror
uniform float uTilingScale;

// Color & Effects
uniform float uPosterize;
uniform vec4 uEffects; // edge, invert, solarize, shift

// Generator
uniform float uGenType; // 0=none, 1=fib, 2=voronoi, 3=grid
uniform vec3 uGenParams; // p1, p2, p3

#define PI 3.14159265359

// --- GENERATORS ---
float random (in vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
}

vec3 fibonacciSpiral(vec2 uv) {
    vec2 center = uv - 0.5;
    float dist = length(center);
    float angle = atan(center.y, center.x);
    float r = dist * uGenParams.y; // Zoom
    float theta = angle + uTime * 0.1;
    float spiral = sin(10.0 * log(r + 0.0001) + theta * uGenParams.x); // Density
    float val = smoothstep(-0.2, 0.2, spiral);
    return vec3(val);
}

vec3 voronoi(vec2 uv) {
    vec2 st = uv * uGenParams.x * 0.1 + 1.0; // Scale
    vec2 i_st = floor(st);
    vec2 f_st = fract(st);
    float m_dist = 1.0;

    for (int y= -1; y <= 1; y++) {
        for (int x= -1; x <= 1; x++) {
            vec2 neighbor = vec2(float(x),float(y));
            vec2 point = vec2(random(i_st + neighbor));
            point = 0.5 + 0.5*sin(uTime*0.5 + 6.2831*point);
            vec2 diff = neighbor + point - f_st;
            float dist = length(diff);
            m_dist = min(m_dist, dist);
        }
    }
    float val = smoothstep(0.0, uGenParams.y * 0.01 + 0.1, m_dist);
    return vec3(val);
}

vec3 basicGrid(vec2 uv) {
    vec2 st = uv * uGenParams.x * 0.2;
    vec2 grid = abs(fract(st - 0.5) - 0.5) / fwidth(st);
    float line = min(grid.x, grid.y);
    float val = 1.0 - min(line, 1.0);
    return vec3(val);
}

// --- MAIN ---
void main() {
    vec2 uv = vUv;

    // 0. Generator Background (if no texture)
    vec4 baseColor = vec4(0.0, 0.0, 0.0, 1.0);

    // 1. Tiling Logic (Modify UVs first)
    if (uTilingType > 0.5) {
        vec2 tileUV = uv * uTilingScale;

        if (uTilingType > 2.5) { // p4m Mirror
             vec2 grid = fract(tileUV);
             if (mod(floor(tileUV.x), 2.0) == 1.0) grid.x = 1.0 - grid.x;
             if (mod(floor(tileUV.y), 2.0) == 1.0) grid.y = 1.0 - grid.y;
             tileUV = grid;
        } else {
             tileUV = fract(tileUV);
        }
        uv = tileUV;
    }

    // 2. Coordinates centering
    vec2 center = vec2(0.5);
    vec2 coord = uv - center;

    // Correct for Aspect Ratio (Square space for rotation)
    coord.x *= uAspect;

    // 3. Displacement (Liquify)
    if (uDisplacement.x > 0.0) {
        float freq = uDisplacement.y * 10.0;
        float amp = uDisplacement.x * 0.001;
        coord.x += sin(coord.y * freq + uTime) * amp;
        coord.y += cos(coord.x * freq + uTime) * amp;
    }

    // 4. Warp
    if (uWarpType > 0.5) {
        float r = length(coord);
        float a = atan(coord.y, coord.x);

        if (uWarpType < 1.5) { // Polar
            coord = vec2(a / (2.0 * PI) + 0.5, r);
        } else { // Log Polar
            coord = vec2(a / (2.0 * PI) + 0.5, log(r + 0.0001));
        }
    }

    // 5. Symmetry (Kaleidoscope)
    if (uSymEnabled) {
        float angle = atan(coord.y, coord.x);
        float radius = length(coord);
        float slice = (2.0 * PI) / uSymSlices;
        angle = mod(angle, slice);
        angle = abs(angle - slice * 0.5); // Mirror within slice
        coord = vec2(cos(angle) * radius, sin(angle) * radius);
    }

    // 6. Transform (Inverse applied to texture coords)
    // Rotate
    float s = sin(-uTransforms.w);
    float c = cos(-uTransforms.w);
    coord = mat2(c, -s, s, c) * coord;

    // Scale
    coord /= uTransforms.z;

    // Translate
    coord -= vec2(uTransforms.x, -uTransforms.y) * 0.001;

    // Restore UV to Texture Space (0-1)

    // IMAGE FIT: CONTAIN logic
    // We have coord in "Canvas Aspect Space". We need to map to "Image Aspect Space".
    // uAspect = Canvas Width / Canvas Height
    // uImageAspect = Image Width / Image Height

    // If we just divide by uAspect, we get back to 0-1 canvas space.
    // We want to scale so the image 'fits' inside the canvas.

    float scaleFactor = 1.0;
    if (uAspect > uImageAspect) {
        // Canvas is wider than image (or image is taller)
        // We need to scale X to match height
        // height matches (1.0). width needs to be wider in UV space (to sample smaller part of texture? no wait.)
        // To FIT, we map 0-1 image to center of canvas.
        // Actually simplest is:
        coord.x /= uImageAspect; // Now both are "height-normalized" ???

         // Let's try standard approach:
         // 1. Convert back to normalized Square (-0.5 to 0.5) relative to IMAGE
         // Current: X is scaled by uAspect. Y is 1.0.

         // undo Aspect correction first?
         // coord.x /= uAspect;
         // Now we are in 0..1 canvas pixels normalized.

         // To sample texture:
         // texture.x = coord.x * (CanvasAspect / ImageAspect) ?
    }

    // Robust "Contain" Mapping:
    // We want 0,0 at center.
    // If uAspect > uImageAspect (Canvas wider):
    //   Image should touch top/bottom. Sides empty.
    //   coord.y is already correct (-0.5 to 0.5 range covers full height)
    //   coord.x covers (-uAspect/2 to uAspect/2).
    //   We want image to cover (-uImageAspect/2 to uImageAspect/2).
    //   So UV.x = coord.x / uImageAspect + 0.5

    // If uAspect < uImageAspect (Canvas taller):
    //   Image should touch sides. Top/bottom empty.
    //   coord.x covers full width? No, coord.x was multiplied by uAspect.
    //   Wait, earlier: coord.x *= uAspect.
    //   So coord.y is [-0.5, 0.5]
    //   coord.x is [-uAspect/2, uAspect/2]

    if (uAspect > uImageAspect) {
        coord.x /= uImageAspect; // Scale X to be relative to Image Height
        // coord.y is already relative to Image Height (since fit to height)
    } else {
        // Fit to Width
        // we want X to go from 0 to 1.
        // Currently X is [-uAspect/2, uAspect/2].
        // We want that range to map to... 0 to 1? NO.
        // If canvas is taller, the image fills the width.
        // So [-uAspect/2, uAspect/2] corresponds to [0, 1] texture.
        coord.x /= uAspect; // Back to 1.0 range
        coord.y *= (uAspect / uImageAspect); // Scale Y
    }

    coord += center; // Back to 0..1

    // 7. Sample Texture or Generator
    vec4 texColor = vec4(0.0);

    // Check Bounds for Texture (Clamp to border / transparency)
    // Only if not tiling? No, transforms might push it out.
    // For "Contain", we want transparent borders if out of bounds.
    // unless generator is active.

    bool inBounds = (coord.x >= 0.0 && coord.x <= 1.0 && coord.y >= 0.0 && coord.y <= 1.0);

    if (uGenType > 0.5) {
        vec3 gen = vec3(0.0);
        if (uGenType < 1.5) gen = fibonacciSpiral(coord);
        else if (uGenType < 2.5) gen = voronoi(coord);
        else gen = basicGrid(coord);
        texColor = vec4(gen, 1.0);
    } else {
        if (inBounds) {
             texColor = texture2D(uTexture, coord);
        } else {
             // Border color (or transparent)
             texColor = vec4(0.0, 0.0, 0.0, 0.0);
        }
    }

    // 8. Effects
    vec3 color = texColor.rgb;

    // Invert
    if (uEffects.y > 0.0) {
        color = mix(color, 1.0 - color, uEffects.y * 0.01);
    }

    // Solarize
    if (uEffects.z > 0.0) {
        float luma = dot(color, vec3(0.299, 0.587, 0.114));
        vec3 sol = color;
        if (luma > 0.5) sol = 1.0 - color;
        color = mix(color, sol, uEffects.z * 0.01);
    }

    // Shift
    if (uEffects.w > 0.0) {
        float shift = uEffects.w * 0.01;
        float r = 0.0;
        float b = 0.0;

        // Simple shift needs bound check too or clamp
        vec2 shiftCoords = coord;

        if (inBounds) {
             r = texture2D(uTexture, coord - vec2(shift, 0.0)).r;
             b = texture2D(uTexture, coord + vec2(shift, 0.0)).b;
             color.r = r;
             color.b = b;
        }
    }

    // Posterize
    if (uPosterize < 255.0) {
        float levels = uPosterize;
        color = floor(color * levels) / levels;
    }

    vec4 finalColor = vec4(color, texColor.a);

    // 9. Shape Mask (Circle)
    // Mask based on ORIGINAL SCREEN UV (vUv), not transformed texture UV.
    // Center is 0.5, 0.5
    if (uShape > 0.5) {
        vec2 center = vec2(0.5);
        vec2 distVec = vUv - center;
        distVec.x *= uAspect; // Correct for canvas aspect to get perfect circle
        float dist = length(distVec);

        // Radius 0.5 (diameter 1.0 height)
        // Soft edge (AA)
        float alpha = 1.0 - smoothstep(0.495, 0.505, dist);
        finalColor.a *= alpha;
    }

    gl_FragColor = finalColor;
}
