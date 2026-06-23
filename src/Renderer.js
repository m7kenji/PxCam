export class Renderer {
  constructor(app) {
    this.app = app;
    
    // VGA-like low-resolution target
    this.config = {
      targetResolution: { width: 480, height: 480 },
      quadtreeThreshold: 0.20, // Variance threshold
      maxDepth: 6,             // Subdivision depth limit
      bypassEffect: false      // Effect bypass switch
    };

    this.canvas = document.getElementById('output-canvas');
    
    // WebGL Context and program variables
    this.gl = null;
    this.shaderProgram = null;
    this.quadBuffer = null;
    this.patternTexture = null;
    this.sourceTexture = null;

    // Offscreen 2D canvas for CPU luminance analysis
    this.offscreenCanvas = document.createElement('canvas');
    this.offscreenCtx = this.offscreenCanvas.getContext('2d');

    // Uniform locations
    this.u_resolution = null;
    this.u_block_pos = null;
    this.u_block_size = null;
    this.u_avg_luma = null;
    this.u_pattern_size = null;
    this.u_palette = null;
    
    // FPS tracking variables
    this.lastTime = performance.now();
    this.fpsSmooth = 30;
    this.fpsUpdateCounter = 0;

    // Source filter levels
    this.brightness = 1.0;
    this.contrast = 1.0;
  }

  init() {
    if (!this.canvas) return;

    // Step 1: Initialize WebGL Context with preserveDrawingBuffer to support capture/recording
    const glOptions = { preserveDrawingBuffer: true };
    this.gl = this.canvas.getContext('webgl', glOptions) || this.canvas.getContext('experimental-webgl', glOptions);
    if (!this.gl) {
      this.app.log('RENDERER_ERROR: WEBGL CONTEXT NOT SUPPORTED.');
      return;
    }

    // Lock canvas drawing buffer resolution
    this.canvas.width = this.config.targetResolution.width;
    this.canvas.height = this.config.targetResolution.height;
    
    this.offscreenCanvas.width = this.config.targetResolution.width;
    this.offscreenCanvas.height = this.config.targetResolution.height;

    // Step 2: Compile & Link Shaders
    this.initShaders();

    // Step 3: Setup Quad Geometry Buffers
    this.initBuffers();

    // Step 4: Setup WebGL Textures
    this.initTextures();

    // Initial pattern upload
    this.updatePatternTexture();

    this.app.log(`RENDERER: WebGL PIPELINE ONLINE. BUFFER=${this.canvas.width}x${this.canvas.height}`);
  }

  // Handle canvas sizing updates dynamically from app resize layout snapping
  resize(newSize) {
    if (!this.canvas) return;
    this.canvas.width = newSize;
    this.canvas.height = newSize;
    this.offscreenCanvas.width = newSize;
    this.offscreenCanvas.height = newSize;
    
    this.config.targetResolution.width = newSize;
    this.config.targetResolution.height = newSize;
    
    this.app.log(`RENDERER: RESOLUTION SNAPPED TO ${newSize}x${newSize}`);
  }

  initShaders() {
    const gl = this.gl;

    // Vertex Shader Source
    const vsSource = `
      attribute vec2 a_position; // Coordinates inside unit quad [0..1]
      uniform vec2 u_block_pos;  // Top-left coordinate in screen space
      uniform float u_block_size; // Block size in pixels
      uniform vec2 u_resolution; // Viewport resolution (480, 480)
      varying vec2 v_local_coord; // Interpolated coords across the block
      varying vec2 v_screen_coord; // Screen-space coords for source lookup

      void main() {
        // Map unit square position [0..1] to actual pixel space coordinates
        vec2 pixel_pos = u_block_pos + a_position * u_block_size;
        
        // Convert pixel coordinates (0..resolution) to clip space (-1.0 to 1.0)
        vec2 clip_pos = (pixel_pos / u_resolution) * 2.0 - 1.0;
        
        // Output vertex position (flip Y so 0,0 is at the top-left)
        gl_Position = vec4(clip_pos.x, -clip_pos.y, 0.0, 1.0);
        v_local_coord = a_position;
        v_screen_coord = pixel_pos / u_resolution; // Calculate screen texture coordinate
      }
    `;

    // Fragment Shader Source
    const fsSource = `
      precision mediump float;
      varying vec2 v_local_coord;
      varying vec2 v_screen_coord;

      uniform sampler2D u_pattern_texture;
      uniform sampler2D u_source_texture; // Bypass source video texture
      uniform float u_pattern_size; // 8.0 or 16.0
      uniform float u_avg_luma;    // Average brightness level [0..1]
      uniform vec3 u_palette[5];   // 5 indexed colors from active palette
      uniform float u_bypass;      // 0.0: Render Dither Effect, 1.0: Bypass raw video

      void main() {
        if (u_bypass > 0.5) {
          gl_FragColor = texture2D(u_source_texture, v_screen_coord);
          return;
        }

        // 1. Choose pattern slot (0 to 3) based on average brightness
        float slot = floor(u_avg_luma * 4.0);
        slot = clamp(slot, 0.0, 3.0);

        // 2. Identify the discrete pixel position inside the pattern matrix
        float px = floor(v_local_coord.x * u_pattern_size);
        float py = floor(v_local_coord.y * u_pattern_size);
        px = clamp(px, 0.0, u_pattern_size - 1.0);
        py = clamp(py, 0.0, u_pattern_size - 1.0);

        // 3. Sample the bit mask from the 2D atlas texture
        // Width of atlas is pattern_size * 4, height is pattern_size
        float tex_u = (slot * u_pattern_size + px + 0.5) / (u_pattern_size * 4.0);
        float tex_v = (py + 0.5) / u_pattern_size;

        vec4 tex_color = texture2D(u_pattern_texture, vec2(tex_u, tex_v));
        
        // Luma maps to index color ranges
        float ratio = u_avg_luma;
        int base_idx = int(floor(ratio * 4.0));
        if (base_idx > 3) base_idx = 3;

        // Workaround for WebGL 1.0 lack of dynamic indexing on uniform arrays
        vec3 colorA = u_palette[0];
        vec3 colorB = u_palette[1];

        if (base_idx == 1) {
          colorA = u_palette[1];
          colorB = u_palette[2];
        } else if (base_idx == 2) {
          colorA = u_palette[2];
          colorB = u_palette[3];
        } else if (base_idx == 3) {
          colorA = u_palette[3];
          colorB = u_palette[4];
        }

        // Single-channel luminance test (red channel holds 1-bit value)
        float bit = tex_color.r > 0.5 ? 1.0 : 0.0;

        // Blend the colors based on mask state
        vec3 final_color = mix(colorA, colorB, bit);
        
        gl_FragColor = vec4(final_color, 1.0);
      }
    `;

    // Compile shaders and link program
    const vertexShader = this.loadShader(gl.VERTEX_SHADER, vsSource);
    const fragmentShader = this.loadShader(gl.FRAGMENT_SHADER, fsSource);
    
    this.shaderProgram = gl.createProgram();
    gl.attachShader(this.shaderProgram, vertexShader);
    gl.attachShader(this.shaderProgram, fragmentShader);
    gl.linkProgram(this.shaderProgram);

    if (!gl.getProgramParameter(this.shaderProgram, gl.LINK_STATUS)) {
      this.app.log(`RENDERER_ERROR: Shader Link Failed: ${gl.getProgramInfoLog(this.shaderProgram)}`);
      return;
    }

    // Retrieve uniform & attribute locations
    this.a_position = gl.getAttribLocation(this.shaderProgram, 'a_position');
    this.u_resolution = gl.getUniformLocation(this.shaderProgram, 'u_resolution');
    this.u_block_pos = gl.getUniformLocation(this.shaderProgram, 'u_block_pos');
    this.u_block_size = gl.getUniformLocation(this.shaderProgram, 'u_block_size');
    this.u_avg_luma = gl.getUniformLocation(this.shaderProgram, 'u_avg_luma');
    this.u_pattern_size = gl.getUniformLocation(this.shaderProgram, 'u_pattern_size');
    this.u_palette = gl.getUniformLocation(this.shaderProgram, 'u_palette');
    this.u_bypass = gl.getUniformLocation(this.shaderProgram, 'u_bypass');
    this.u_source_texture = gl.getUniformLocation(this.shaderProgram, 'u_source_texture');
  }

  loadShader(type, source) {
    const gl = this.gl;
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      this.app.log(`RENDERER_ERROR: Shader Compile Failed: ${gl.getShaderInfoLog(shader)}`);
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  initBuffers() {
    const gl = this.gl;

    // Unit square coordinates (two triangles forming a quad from 0,0 to 1,1)
    const vertices = new Float32Array([
      0.0, 0.0,
      1.0, 0.0,
      0.0, 1.0,
      0.0, 1.0,
      1.0, 0.0,
      1.0, 1.0
    ]);

    this.quadBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
  }

  initTextures() {
    const gl = this.gl;

    // Setup pattern atlas texture
    this.patternTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.patternTexture);
    
    // Pixel-perfect nearest neighbor filtering
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    // Setup source bypass texture
    this.sourceTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.sourceTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  }

  // Upload dynamic pattern bits to WebGL texture
  updatePatternTexture() {
    if (!this.gl || !this.patternTexture) return;

    const gl = this.gl;
    const size = this.app.patternSize;
    const packedData = this.app.getPackedPatterns();

    gl.bindTexture(gl.TEXTURE_2D, this.patternTexture);
    
    // Size of atlas texture: width = patternSize * 4, height = patternSize
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.LUMINANCE,
      size * 4,
      size,
      0,
      gl.LUMINANCE,
      gl.UNSIGNED_BYTE,
      packedData
    );
  }

  // Triggered when palette changes
  setPalette(colors) {
    // App handles palette cache; we fetch dynamic Float32Array uniforms during draw calls
  }

  render(sourceVideo) {
    if (!this.gl || !this.shaderProgram || !sourceVideo) return;

    const gl = this.gl;
    const targetW = this.config.targetResolution.width;
    const targetH = this.config.targetResolution.height;

    // 1. Draw source video centered & cropped into the offscreen 2D canvas
    let sw = sourceVideo.videoWidth || sourceVideo.width || targetW;
    let sh = sourceVideo.videoHeight || sourceVideo.height || targetH;
    let sSize = Math.min(sw, sh);
    let sx = (sw - sSize) / 2;
    let sy = (sh - sSize) / 2;

    // Apply brightness and contrast filters to the offscreen source frame
    this.offscreenCtx.filter = `brightness(${this.brightness}) contrast(${this.contrast})`;

    this.offscreenCtx.drawImage(
      sourceVideo,
      sx, sy, sSize, sSize,
      0, 0, targetW, targetH
    );

    // 2. Upload offscreen canvas to sourceTexture for bypass lookup
    gl.bindTexture(gl.TEXTURE_2D, this.sourceTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.offscreenCanvas);

    // 3. Compute dynamic quadtree segmentation list
    let blocks;
    if (this.config.bypassEffect) {
      // If bypassed, skip quadtree and draw a single full screen block (extremely fast)
      blocks = [{ x: 0, y: 0, size: targetW, avg: 127.5 }];
    } else {
      // Read luma pixel data on CPU for Quadtree segmentation
      const imgData = this.offscreenCtx.getImageData(0, 0, targetW, targetH);
      const pixels = imgData.data;

      const getLuma = (px, py) => {
        const idx = (py * targetW + px) * 4;
        return 0.299 * pixels[idx] + 0.587 * pixels[idx + 1] + 0.114 * pixels[idx + 2];
      };

      blocks = this.computeVariableGrid(getLuma, targetW, targetH);
    }

    // 4. WebGL Viewport setups and Clear
    gl.viewport(0, 0, targetW, targetH);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // 5. Bind program & vertex attributes
    gl.useProgram(this.shaderProgram);
    gl.enableVertexAttribArray(this.a_position);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
    gl.vertexAttribPointer(this.a_position, 2, gl.FLOAT, false, 0, 0);

    // 6. Bind textures & uniforms
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.patternTexture);
    gl.uniform1i(gl.getUniformLocation(this.shaderProgram, 'u_pattern_texture'), 0);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.sourceTexture);
    gl.uniform1i(this.u_source_texture, 1);

    gl.uniform2f(this.u_resolution, targetW, targetH);
    gl.uniform1f(this.u_pattern_size, this.app.patternSize);
    gl.uniform1f(this.u_bypass, this.config.bypassEffect ? 1.0 : 0.0);
    
    // Set 5-color palette Float32Array
    gl.uniform3fv(this.u_palette, this.app.getPaletteFloatArray());

    // 7. Loop and draw blocks as individual quads
    blocks.forEach((block) => {
      // Set uniforms for this block instance
      gl.uniform2f(this.u_block_pos, block.x, block.y);
      gl.uniform1f(this.u_block_size, block.size);
      gl.uniform1f(this.u_avg_luma, block.avg / 255.0);

      // Draw block quad (6 vertices)
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    });

    // 8. Update FPS readout
    this.updateFPS();
  }

  // CPU Quadtree subdivision logic
  computeVariableGrid(getLuma, width, height) {
    const blocks = [];
    const threshold = this.config.quadtreeThreshold * 255;
    const maxDepth = this.config.maxDepth;
    const minBlockSize = this.app.patternSize; // 8 for 8x8, 16 for 16x16

    // Calculate dynamic temporal offset to break spatial sampling grid symmetry
    const frameTime = performance.now() * 0.05;
    const globalJitterX = Math.sin(frameTime);
    const globalJitterY = Math.cos(frameTime * 1.2);

    const subdivide = (x, y, size, depth) => {
      let minLuma = 255;
      let maxLuma = 0;
      let sumLuma = 0;
      const sampleCount = 4;
      const step = size / sampleCount;

      // Calculate jitter offsets relative to block step size
      const jX = globalJitterX * (step * 0.25);
      const jY = globalJitterY * (step * 0.25);

      for (let sy = 0; sy < sampleCount; sy++) {
        for (let sx = 0; sx < sampleCount; sx++) {
          const px = Math.min(width - 1, Math.max(0, Math.floor(x + sx * step + step / 2 + jX)));
          const py = Math.min(height - 1, Math.max(0, Math.floor(y + sy * step + step / 2 + jY)));
          const luma = getLuma(px, py);
          
          if (luma < minLuma) minLuma = luma;
          if (luma > maxLuma) maxLuma = luma;
          sumLuma += luma;
        }
      }

      const avgLuma = sumLuma / (sampleCount * sampleCount);
      const contrast = maxLuma - minLuma;

      // Subdivide if contrast exceeds threshold, and block is larger than minBlockSize (to avoid micro-dithers)
      if (contrast > threshold && depth < maxDepth && size > minBlockSize) {
        const half = size / 2;
        subdivide(x, y, half, depth + 1);
        subdivide(x + half, y, half, depth + 1);
        subdivide(x, y + half, half, depth + 1);
        subdivide(x + half, y + half, half, depth + 1);
      } else {
        blocks.push({ x, y, size, avg: avgLuma });
      }
    };

    subdivide(0, 0, width, 1);
    return blocks;
  }

  updateFPS() {
    const now = performance.now();
    const delta = now - this.lastTime;
    this.lastTime = now;

    if (delta > 0) {
      const currentFps = 1000 / delta;
      this.fpsSmooth = this.fpsSmooth * 0.95 + currentFps * 0.05;
    }

    this.fpsUpdateCounter++;
    if (this.fpsUpdateCounter >= 10) {
      const fpsSpan = document.getElementById('val-fps');
      if (fpsSpan) {
        fpsSpan.textContent = Math.round(this.fpsSmooth);
      }
      this.fpsUpdateCounter = 0;
    }
  }
}
