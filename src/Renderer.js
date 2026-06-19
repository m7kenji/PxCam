export class Renderer {
  constructor(app) {
    this.app = app;
    
    // Low-resolution rendering buffer settings (VGA-like square crop)
    this.config = {
      targetResolution: { width: 480, height: 480 },
      quadtreeThreshold: 0.10, // Default variance threshold
      maxDepth: 4              // Depth of recursion
    };

    this.canvas = document.getElementById('output-canvas');
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;

    // Offscreen canvas for cropping and downscaling the input video stream
    this.offscreenCanvas = document.createElement('canvas');
    this.offscreenCtx = this.offscreenCanvas.getContext('2d');

    // Current active color palette
    this.palette = [];
    
    // FPS tracking variables
    this.lastTime = performance.now();
    this.fpsSmooth = 30;
    this.fpsUpdateCounter = 0;
  }

  init() {
    if (!this.canvas) return;

    // Set physical resolution of the drawing buffer
    this.canvas.width = this.config.targetResolution.width;
    this.canvas.height = this.config.targetResolution.height;
    
    this.offscreenCanvas.width = this.config.targetResolution.width;
    this.offscreenCanvas.height = this.config.targetResolution.height;

    // Set initial palette to App's default
    this.setPalette(this.app.palettes[this.app.activePaletteIndex].colors);

    this.app.log(`RENDERER: DISPLAY RESOLUTION LOCKED TO ${this.canvas.width}x${this.canvas.height}`);
  }

  setPalette(colors) {
    this.palette = colors;
  }

  // Draw the current video frame using quadtree dither pipeline
  render(sourceVideo) {
    if (!this.ctx || !sourceVideo) return;

    const targetW = this.config.targetResolution.width;
    const targetH = this.config.targetResolution.height;

    // 1. Crop and draw the sourceVideo to offscreen canvas as 1:1 square
    let sw = sourceVideo.videoWidth || sourceVideo.width || targetW;
    let sh = sourceVideo.videoHeight || sourceVideo.height || targetH;
    let sSize = Math.min(sw, sh);
    let sx = (sw - sSize) / 2;
    let sy = (sh - sSize) / 2;

    this.offscreenCtx.drawImage(
      sourceVideo,
      sx, sy, sSize, sSize,     // Source crop
      0, 0, targetW, targetH    // Destination scale
    );

    // 2. Read luminance data of the downscaled frame
    const imgData = this.offscreenCtx.getImageData(0, 0, targetW, targetH);
    const pixels = imgData.data;

    // Fast helper to get average luminance of a pixel
    // Y = 0.299R + 0.587G + 0.114B
    const getLuma = (px, py) => {
      const idx = (py * targetW + px) * 4;
      return 0.299 * pixels[idx] + 0.587 * pixels[idx + 1] + 0.114 * pixels[idx + 2];
    };

    // 3. Compute Variable Grid using Quadtree decomposition
    const blocks = this.computeVariableGrid(getLuma, targetW, targetH);

    // 4. Render blocks with color palette and pattern mask
    this.ctx.fillStyle = this.palette[0];
    this.ctx.fillRect(0, 0, targetW, targetH);

    const pattern = this.app.patternData;
    const pSize = this.app.patternSize;

    blocks.forEach((block) => {
      // Map average luminance (0-255) to index palette
      const ratio = block.avg / 255.0;
      const paletteLength = this.palette.length;
      
      // Select base index color and secondary index color for dither contrast
      const baseIdx = Math.min(
        Math.floor(ratio * (paletteLength - 1)),
        paletteLength - 2
      );
      const colorA = this.palette[baseIdx];
      const colorB = this.palette[baseIdx + 1];

      // Draw the pattern grid inside the block
      const cellSize = block.size / pSize;

      for (let cy = 0; cy < pSize; cy++) {
        for (let cx = 0; cx < pSize; cx++) {
          const bit = pattern[cy * pSize + cx];
          
          this.ctx.fillStyle = bit === 1 ? colorB : colorA;
          this.ctx.fillRect(
            block.x + cx * cellSize,
            block.y + cy * cellSize,
            cellSize + 0.5, // Overlap slightly to prevent anti-aliasing gaps
            cellSize + 0.5
          );
        }
      }
    });

    // 5. Update FPS counter in UI
    this.updateFPS();
  }

  // Quadtree subdivision based on local contrast/variance
  computeVariableGrid(getLuma, width, height) {
    const blocks = [];
    const threshold = this.config.quadtreeThreshold * 255;
    const maxDepth = this.config.maxDepth;

    // Recursive subdivider
    const subdivide = (x, y, size, depth) => {
      // Sample pixels inside block to evaluate variance (contrast)
      // For performance, we sample a 4x4 grid within the block
      let minLuma = 255;
      let maxLuma = 0;
      let sumLuma = 0;
      const sampleCount = 4;
      const step = size / sampleCount;

      for (let sy = 0; sy < sampleCount; sy++) {
        for (let sx = 0; sx < sampleCount; sx++) {
          const px = Math.min(width - 1, Math.floor(x + sx * step + step / 2));
          const py = Math.min(height - 1, Math.floor(y + sy * step + step / 2));
          const luma = getLuma(px, py);
          
          if (luma < minLuma) minLuma = luma;
          if (luma > maxLuma) maxLuma = luma;
          sumLuma += luma;
        }
      }

      const avgLuma = sumLuma / (sampleCount * sampleCount);
      const contrast = maxLuma - minLuma;

      // Subdivide if contrast exceeds threshold, max depth isn't reached, and block is big enough (min 16px)
      if (contrast > threshold && depth < maxDepth && size > 16) {
        const half = size / 2;
        subdivide(x, y, half, depth + 1);
        subdivide(x + half, y, half, depth + 1);
        subdivide(x, y + half, half, depth + 1);
        subdivide(x + half, y + half, half, depth + 1);
      } else {
        // Keep this block
        blocks.push({ x, y, size, avg: avgLuma });
      }
    };

    // Begin recursion from root
    subdivide(0, 0, width, 1);
    return blocks;
  }

  // Calculate and display smoothed FPS
  updateFPS() {
    const now = performance.now();
    const delta = now - this.lastTime;
    this.lastTime = now;

    if (delta > 0) {
      const currentFps = 1000 / delta;
      // Exponential moving average to smooth value
      this.fpsSmooth = this.fpsSmooth * 0.95 + currentFps * 0.05;
    }

    this.fpsUpdateCounter++;
    // Update the DOM text only every 10 frames to avoid layout thrashing
    if (this.fpsUpdateCounter >= 10) {
      const fpsSpan = document.getElementById('val-fps');
      if (fpsSpan) {
        fpsSpan.textContent = Math.round(this.fpsSmooth);
      }
      this.fpsUpdateCounter = 0;
    }
  }
}
