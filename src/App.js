import { CameraController } from './CameraController.js';
import { EditorUI } from './EditorUI.js';
import { Renderer } from './Renderer.js';

export class App {
  constructor() {
    this.theme = 'dark'; // 'dark' | 'light'
    this.patternSize = 8; // 8 | 16
    this.activePatternIndex = 0; // Currently edited pattern slot (0 to 3)
    this.brightness = 1.0;
    this.contrast = 1.0;
    
    // Default patterns (8x8) from darkest to lightest tones
    this.patterns8 = [
      // Tone 0 (Darkest - dense grid)
      [
        1,1,1,1,1,1,1,1,
        1,1,0,0,0,0,1,1,
        1,0,1,0,0,1,0,1,
        1,0,0,1,1,0,0,1,
        1,0,0,1,1,0,0,1,
        1,0,1,0,0,1,0,1,
        1,1,0,0,0,0,1,1,
        1,1,1,1,1,1,1,1
      ],
      // Tone 1 (Mid-Dark - retro diamond/box)
      [
        0,0,1,1,1,1,0,0,
        0,1,0,0,0,0,1,0,
        1,0,1,0,0,1,0,1,
        1,0,0,0,0,0,0,1,
        1,0,0,0,0,0,0,1,
        1,0,1,0,0,1,0,1,
        0,1,0,0,0,0,1,0,
        0,0,1,1,1,1,0,0
      ],
      // Tone 2 (Mid-Light - diagonal checkerboard)
      [
        1,0,1,0,1,0,1,0,
        0,1,0,1,0,1,0,1,
        1,0,1,0,1,0,1,0,
        0,1,0,1,0,1,0,1,
        1,0,1,0,1,0,1,0,
        0,1,0,1,0,1,0,1,
        1,0,1,0,1,0,1,0,
        0,1,0,1,0,1,0,1
      ],
      // Tone 3 (Lightest - sparse dot/outer ring)
      [
        0,0,0,0,0,0,0,0,
        0,0,0,1,1,0,0,0,
        0,0,1,0,0,1,0,0,
        0,1,0,0,0,0,1,0,
        0,1,0,0,0,0,1,0,
        0,0,1,0,0,1,0,0,
        0,0,0,1,1,0,0,0,
        0,0,0,0,0,0,0,0
      ]
    ];

    // Default patterns (16x16) generated procedurally
    this.patterns16 = [
      // Slot 0 (Dense rings)
      Array(256).fill(0).map((_, i) => {
        const x = i % 16; const y = Math.floor(i / 16);
        const d = Math.sqrt((x - 7.5)**2 + (y - 7.5)**2);
        return (d < 7.5 && d > 5.5) || (d < 4.5 && d > 2.5) || (d < 1) ? 1 : 0;
      }),
      // Slot 1 (Circle outline)
      Array(256).fill(0).map((_, i) => {
        const x = i % 16; const y = Math.floor(i / 16);
        const d = Math.sqrt((x - 7.5)**2 + (y - 7.5)**2);
        return (d < 6.5 && d > 4.5) ? 1 : 0;
      }),
      // Slot 2 (Cross hatch grid lines)
      Array(256).fill(0).map((_, i) => {
        const x = i % 16; const y = Math.floor(i / 16);
        return (x + y) % 4 === 0 || (x - y) % 4 === 0 ? 1 : 0;
      }),
      // Slot 3 (Center targets)
      Array(256).fill(0).map((_, i) => {
        const x = i % 16; const y = Math.floor(i / 16);
        return (x === 8 || y === 8) && (x > 3 && x < 13 && y > 3 && y < 13) ? 1 : 0;
      })
    ];

    // Premium Industrial Palettes (indexed color maps)
    this.palettes = [
      {
        name: 'CRT_AMBER',
        colors: ['#0d0500', '#4a2500', '#9e5200', '#ff8c00', '#ffd399']
      },
      {
        name: 'CRT_GREEN',
        colors: ['#000c02', '#00400a', '#008f11', '#00ff66', '#a3ffc2']
      },
      {
        name: 'TECH_INK',
        colors: ['#000000', '#262626', '#737373', '#d4d4d4', '#ffffff']
      },
      {
        name: 'WARNING_GRID',
        colors: ['#0a0800', '#423300', '#9c7b00', '#f59e0b', '#fffbeb']
      }
    ];
    this.activePaletteIndex = 2;
    this.currentPaletteColors = [...this.palettes[this.activePaletteIndex].colors];

    // References to controllers
    this.cameraController = null;
    this.editorUI = null;
    this.renderer = null;

    // Frame rate control config
    this.targetFps = 60; // 60 | 30 | 15 | 8
    this.lastFrameTime = 0;
  }

  // Active pattern set getter based on current pattern size
  get patterns() {
    return this.patternSize === 8 ? this.patterns8 : this.patterns16;
  }

  // Active single pattern data being edited
  get patternData() {
    return this.patterns[this.activePatternIndex];
  }

  set patternData(val) {
    this.patterns[this.activePatternIndex] = val;
  }

  init() {
    this.log('SYS_BOOT: STARTING INITIALIZATION SEQUENCE');
    
    // Setup Controllers
    this.cameraController = new CameraController(this);
    this.editorUI = new EditorUI(this);
    this.renderer = new Renderer(this);

    // Initial setups
    this.setupEventListeners();
    this.setupPaletteUI();
    
    // Initialize components
    this.cameraController.init();
    this.editorUI.init();
    this.renderer.init();

    // Set initial source filter values in renderer
    this.renderer.brightness = this.brightness;
    this.renderer.contrast = this.contrast;

    // Synchronize custom color pickers with initial palette colors
    this.updateColorPickersUI();

    // Resize snapping
    this.handleResize();
    window.addEventListener('resize', () => this.handleResize());

    // Render loop start
    this.startLoop();

    this.log('SYS_BOOT: INITIALIZATION COMPLETE. STANDBY.');
  }

  setupEventListeners() {
    // Theme Toggle (Vintage Switch)
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
      themeToggle.checked = this.theme === 'light';
      themeToggle.addEventListener('change', (e) => {
        this.setTheme(e.target.checked ? 'light' : 'dark');
      });
    }

    // Grid Size Toggle
    const btnToggleGridSize = document.getElementById('btn-toggle-grid-size');
    if (btnToggleGridSize) {
      btnToggleGridSize.addEventListener('click', () => {
        const nextSize = this.patternSize === 8 ? 16 : 8;
        this.setGridSize(nextSize);
      });
    }

    // Header Grid Size Toggle (metadata-feed in normal view)
    const headerGridToggle = document.getElementById('header-grid-size-toggle');
    if (headerGridToggle) {
      headerGridToggle.addEventListener('click', () => {
        const nextSize = this.patternSize === 8 ? 16 : 8;
        this.setGridSize(nextSize);
      });
    }

    // Clear Grid Button
    const btnClear = document.getElementById('btn-clear');
    if (btnClear) {
      btnClear.addEventListener('click', () => {
        this.patternData.fill(0);
        this.editorUI.updateGridFromState();
        this.onPatternChanged();
        this.log(`EDITOR: TONE ${this.activePatternIndex + 1} GRID CLEARED`);
      });
    }

    // Invert Grid Button
    const btnInvert = document.getElementById('btn-invert');
    if (btnInvert) {
      btnInvert.addEventListener('click', () => {
        this.patterns[this.activePatternIndex] = this.patternData.map(v => v === 1 ? 0 : 1);
        this.editorUI.updateGridFromState();
        this.onPatternChanged();
        this.log(`EDITOR: TONE ${this.activePatternIndex + 1} GRID INVERTED`);
      });
    }

    // Slider: Quadtree Threshold
    const sliderThreshold = document.getElementById('slider-threshold');
    const valThreshold = document.getElementById('val-threshold');
    if (sliderThreshold && valThreshold) {
      sliderThreshold.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        valThreshold.textContent = val.toFixed(2);
        this.renderer.config.quadtreeThreshold = val;
        this.log(`CONFIG: QT_THRESHOLD ADJUSTED TO ${val.toFixed(2)}`);
      });
    }

    // Slider: Max Depth
    const sliderDepth = document.getElementById('slider-depth');
    const valDepth = document.getElementById('val-depth');
    if (sliderDepth && valDepth) {
      sliderDepth.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        valDepth.textContent = val;
        this.renderer.config.maxDepth = val;
        this.log(`CONFIG: MAX_DEPTH ADJUSTED TO ${val}`);
      });
    }

    // Camera / Source Selector (Unifies test patterns and physical devices)
    const selectCamera = document.getElementById('select-camera');
    if (selectCamera) {
      selectCamera.addEventListener('change', (e) => {
        const val = e.target.value;
        this.cameraController.requestCamera(val);
        
        const statusMeta = document.querySelector('#camera-section .metadata-feed');
        if (statusMeta) {
          if (val === 'test_shapes' || val === 'test_cloud') {
            statusMeta.textContent = `SYS_STATUS: TEST_${val.slice(5).toUpperCase()}`;
          } else {
            statusMeta.textContent = 'SYS_STATUS: ACTIVE';
          }
        }
      });
    }

    // Bypass Effect Toggle
    const btnBypass = document.getElementById('btn-bypass');
    if (btnBypass) {
      btnBypass.addEventListener('click', () => {
        const nextState = !this.renderer.config.bypassEffect;
        this.renderer.config.bypassEffect = nextState;
        
        btnBypass.textContent = nextState ? 'ON' : 'OFF';
        this.log(`CONFIG: BYPASS_EFFECT SWITCHED TO ${nextState ? 'ON' : 'OFF'}`);
      });
    }

    // Slider: Brightness
    const sliderBrightness = document.getElementById('slider-brightness');
    const valBrightness = document.getElementById('val-brightness');
    if (sliderBrightness && valBrightness) {
      sliderBrightness.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        valBrightness.textContent = val.toFixed(2);
        this.brightness = val;
        if (this.renderer) {
          this.renderer.brightness = val;
        }
        this.log(`CONFIG: BRIGHTNESS ADJUSTED TO ${val.toFixed(2)}`);
      });
    }

    // Slider: Contrast
    const sliderContrast = document.getElementById('slider-contrast');
    const valContrast = document.getElementById('val-contrast');
    if (sliderContrast && valContrast) {
      sliderContrast.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        valContrast.textContent = val.toFixed(2);
        this.contrast = val;
        if (this.renderer) {
          this.renderer.contrast = val;
        }
        this.log(`CONFIG: CONTRAST ADJUSTED TO ${val.toFixed(2)}`);
      });
    }

    // Color pickers input listeners
    for (let i = 0; i < 5; i++) {
      const picker = document.getElementById(`picker-color-${i}`);
      if (picker) {
        picker.addEventListener('input', (e) => {
          const color = e.target.value;
          this.currentPaletteColors[i] = color;
          this.onPatternChanged(); // Trigger renderer update
        });
        picker.addEventListener('change', (e) => {
          this.log(`CONFIG: COLOR_${i + 1} ADJUSTED TO ${e.target.value.toUpperCase()}`);
        });
      }
    }

    // Random palette generator button
    const btnRandom = document.getElementById('btn-random-palette');
    if (btnRandom) {
      btnRandom.addEventListener('click', () => {
        this.generateRandomHarmonizedPalette();
      });
    }

    // Dummy Capture Buttons
    const btnCaptureStill = document.getElementById('btn-capture-still');
    if (btnCaptureStill) {
      btnCaptureStill.addEventListener('click', () => {
        this.log('SYSTEM: STILL CAPTURE TRIGGERED (DUMMY)');
      });
    }

    const btnRecordVideo = document.getElementById('btn-record-video');
    if (btnRecordVideo) {
      btnRecordVideo.addEventListener('click', () => {
        this.log('SYSTEM: VIDEO RECORDING STARTED (DUMMY)');
      });
    }

    // FPS Limit Toggle (under tech-data)
    const rateToggle = document.getElementById('rate-toggle-trigger');
    if (rateToggle) {
      rateToggle.addEventListener('click', () => {
        const current = this.targetFps;
        let next = 60;
        if (current === 60) next = 30;
        else if (current === 30) next = 15;
        else if (current === 15) next = 8;
        else next = 60;
        
        this.targetFps = next;
        const targetFpsSpan = document.getElementById('val-target-fps');
        if (targetFpsSpan) {
          targetFpsSpan.textContent = next;
        }
        this.log(`SYS: TARGET FRAME RATE LIMIT SET TO ${next} FPS`);
      });
    }
  }

  setupPaletteUI() {
    const paletteList = document.getElementById('palette-list');
    if (!paletteList) return;

    paletteList.innerHTML = '';
    this.palettes.forEach((palette, idx) => {
      const item = document.createElement('div');
      item.className = `palette-color ${idx === this.activePaletteIndex ? 'active' : ''}`;
      item.style.backgroundColor = palette.colors[2];
      item.title = palette.name;
      
      item.addEventListener('click', () => {
        this.setPalette(idx);
      });
      paletteList.appendChild(item);
    });
  }

  updateColorPickersUI() {
    this.currentPaletteColors.forEach((color, idx) => {
      const picker = document.getElementById(`picker-color-${idx}`);
      if (picker) {
        picker.value = color;
      }
    });
  }

  generateRandomHarmonizedPalette() {
    const isPsychedelic = Math.random() < 0.7;
    const modeName = isPsychedelic ? 'PSYCHEDELIC' : 'VINTAGE';
    const newColors = [];

    if (isPsychedelic) {
      // 60s Psychedelic 2.0: Dynamic 3-phase color interpolation
      const hStart = Math.floor(Math.random() * 360);
      const hMid = (hStart + 60 + Math.floor(Math.random() * 120)) % 360;
      const hEnd = (hMid + 60 + Math.floor(Math.random() * 120)) % 360;

      // Vivid saturation (70% to 100%)
      const saturation = 70 + Math.floor(Math.random() * 30);

      // Randomize lightness limits so darks and brights are colorful (not just black/white)
      const lStart = 5 + Math.floor(Math.random() * 20); // 5% to 25% (colorful darks)
      const lEnd = 70 + Math.floor(Math.random() * 25);  // 70% to 95% (vivid brights)

      for (let i = 0; i < 5; i++) {
        const ratio = i / 4; // 0.0 to 1.0
        
        // HSL interpolation with a middle anchor at ratio = 0.5
        let h;
        if (ratio < 0.5) {
          const t = ratio * 2; // 0.0 to 1.0
          h = Math.round(hStart * (1 - t) + hMid * t);
        } else {
          const t = (ratio - 0.5) * 2; // 0.0 to 1.0
          h = Math.round(hMid * (1 - t) + hEnd * t);
        }
        h = (h + 360) % 360;

        const s = saturation;
        const l = Math.round(lStart * (1 - ratio) + lEnd * ratio);

        newColors.push(this.hslToHex(h, s, l));
      }
    } else {
      // Vintage Lo-Fi: Subtle harmonized complementary tones (2-phase)
      const hStart = Math.floor(Math.random() * 360);
      const hueDiff = (Math.random() > 0.5 ? 1 : -1) * (30 + Math.floor(Math.random() * 60));
      const hEnd = (hStart + hueDiff + 360) % 360;
      
      const saturation = 35 + Math.floor(Math.random() * 40);

      // Vintage standard lightness range (strictly dark to light)
      const lStart = 8;
      const lEnd = 88;

      for (let i = 0; i < 5; i++) {
        const ratio = i / 4;
        const h = Math.round(((hStart * (1 - ratio) + hEnd * ratio) + 360) % 360);
        const s = saturation;
        const l = Math.round(lStart * (1 - ratio) + lEnd * ratio);

        newColors.push(this.hslToHex(h, s, l));
      }
    }

    this.currentPaletteColors = newColors;
    
    // Clear active class from preset palettes since we are customized
    const paletteList = document.getElementById('palette-list');
    if (paletteList) {
      paletteList.querySelectorAll('.palette-color').forEach(item => item.classList.remove('active'));
    }

    this.updateColorPickersUI();
    this.onPatternChanged();
    this.log(`SYS: GENERATED [${modeName}] PALETTE (C1:${this.currentPaletteColors[0]} -> C5:${this.currentPaletteColors[4]})`);
  }

  hslToHex(h, s, l) {
    l /= 100;
    const a = (s * Math.min(l, 1 - l)) / 100;
    const f = (n) => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  }

  setTheme(theme) {
    this.theme = theme;
    document.body.setAttribute('data-theme', theme);
    this.log(`SYS: COLOR_MODE SWITCHED TO ${theme.toUpperCase()}`);
  }

  setGridSize(size) {
    this.patternSize = size;
    const label = document.getElementById('grid-size-label');
    const btn = document.getElementById('btn-toggle-grid-size');
    if (label) label.textContent = `${size}x8` === '16x8' ? '16x16' : '8x8';
    if (btn) btn.textContent = `${size}x8` === '16x8' ? '16x16' : '8x8';

    // Reinitialize grid layouts
    this.editorUI.initGrid();
    this.editorUI.initMiniGrids();
    this.onPatternChanged();
    this.log(`SYS: GRID CONFIG CHANGED TO ${size}x${size}`);
  }

  setPalette(index) {
    this.activePaletteIndex = index;
    this.currentPaletteColors = [...this.palettes[index].colors];
    this.setupPaletteUI(); // Refresh active class
    this.updateColorPickersUI(); // Update color pickers in UI
    
    this.onPatternChanged(); // Notify renderer of palette color changes
    this.log(`SYS: PALETTE CHANGED TO [${this.palettes[index].name}]`);
  }

  // Handle updates from EditorUI
  onPatternChanged() {
    if (this.renderer) {
      this.renderer.updatePatternTexture();
    }
    if (this.editorUI) {
      this.editorUI.updateMiniGrids();
    }
  }

  // Pack the 4 patterns into a single Uint8Array for WebGL texture upload (2D Row-by-Row layout)
  getPackedPatterns() {
    const size = this.patternSize; // 8 or 16
    const currentPatterns = this.patterns; // patterns8 or patterns16
    const width = size * 4;
    const height = size;
    const packed = new Uint8Array(width * height);
    
    for (let y = 0; y < size; y++) {
      for (let s = 0; s < 4; s++) {
        const pattern = currentPatterns[s];
        for (let x = 0; x < size; x++) {
          const srcIdx = y * size + x;
          const destIdx = y * width + (s * size + x);
          packed[destIdx] = pattern[srcIdx] === 1 ? 255 : 0;
        }
      }
    }
    return packed;
  }

  // Convert current hex palette to Float32Array for WebGL uniforms
  getPaletteFloatArray() {
    const colors = this.currentPaletteColors;
    const floatArr = new Float32Array(5 * 3); // 5 colors, 3 floats each (RGB)
    colors.forEach((color, idx) => {
      const r = parseInt(color.slice(1, 3), 16) / 255;
      const g = parseInt(color.slice(3, 5), 16) / 255;
      const b = parseInt(color.slice(5, 7), 16) / 255;
      floatArr[idx * 3] = r;
      floatArr[idx * 3 + 1] = g;
      floatArr[idx * 3 + 2] = b;
    });
    return floatArr;
  }

  // System logging utility
  log(message) {
    const logFeed = document.getElementById('log-feed');
    if (!logFeed) return;

    const time = new Date().toISOString().slice(11, 19);
    const line = document.createElement('div');
    line.className = 'log-line';
    line.textContent = `> [${time}] ${message}`;
    
    logFeed.appendChild(line);
    logFeed.scrollTop = logFeed.scrollHeight;
  }

  // Loop manager to request frames with target frame rate limiting
  startLoop() {
    const tick = (timestamp) => {
      if (!this.lastFrameTime) {
        this.lastFrameTime = timestamp;
      }
      const elapsed = timestamp - this.lastFrameTime;
      const interval = 1000 / this.targetFps;

      // Allow 2ms tolerance to smooth out requestAnimationFrame variations
      if (elapsed >= interval - 2) {
        if (this.cameraController && this.renderer) {
          const videoElement = this.cameraController.getVideoElement();
          this.renderer.render(videoElement);
        }
        // Adjust lastFrameTime keeping the drift correction
        this.lastFrameTime = timestamp - (elapsed % interval);
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  // Handle snapping of the aspect-boxes to integer multiples of 80px
  handleResize() {
    const isMobile = window.innerWidth <= 768;
    const wrappers = document.querySelectorAll('.visual-wrapper');
    const isEditing = document.getElementById('app')?.classList.contains('mode-editing');

    wrappers.forEach((wrapper) => {
      const box = wrapper.querySelector('.aspect-box');
      if (!box) return;

      const isCamera = wrapper.closest('#camera-section') !== null;

      // On mobile, release 1:1 aspect ratio constraint for tone previews in normal mode to span 100% width
      if (isMobile && !isCamera && !isEditing) {
        box.style.width = '100%';
        box.style.height = 'auto';
        box.style.aspectRatio = 'auto';
        return;
      }

      // On mobile, use window.innerWidth to avoid parent container expanding from child size
      const availW = isMobile ? (window.innerWidth - 6) : (wrapper.clientWidth - 40);
      let maxFit = availW;

      if (isMobile) {
        if (isEditing) {
          if (isCamera) {
            // Shrink camera snapshot in editing mode to save screen height
            maxFit = 128;
          } else {
            // Editor grid size in editing mode
            maxFit = Math.min(availW, 256);
          }
        } else {
          // Allow larger camera sizes up to 384px in normal mode on mobile
          maxFit = Math.min(availW, 384);
        }
      } else {
        const availH = wrapper.clientHeight - 40;
        maxFit = Math.min(availW, availH);
      }
      
      // Snap to the largest power of two (or 384px multiplier) that fits to ensure pixel-perfect scaling
      let snappedSize = 128;
      if (maxFit >= 1024) {
        snappedSize = 1024;
      } else if (maxFit >= 512) {
        snappedSize = 512;
      } else if (maxFit >= 384) {
        snappedSize = 384;
      } else if (maxFit >= 256) {
        snappedSize = 256;
      }
      
      box.style.width = `${snappedSize}px`;
      box.style.height = `${snappedSize}px`;
      box.style.aspectRatio = '';
    });

    // Notify Renderer of new canvas resolution to update target buffer
    if (this.renderer && this.renderer.canvas) {
      const box = this.renderer.canvas.parentElement;
      const size = parseInt(box.style.width, 10) || 480;
      if (this.renderer.canvas.width !== size) {
        this.renderer.resize(size);
      }
    }
  }
}
