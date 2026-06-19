import { CameraController } from './CameraController.js';
import { EditorUI } from './EditorUI.js';
import { Renderer } from './Renderer.js';

export class App {
  constructor() {
    this.theme = 'dark'; // 'dark' | 'light'
    this.patternSize = 8; // 8 | 16
    
    // Default patterns
    this.defaultPattern8 = [
      0,0,1,1,1,1,0,0,
      0,1,0,0,0,0,1,0,
      1,0,1,0,0,1,0,1,
      1,0,0,0,0,0,0,1,
      1,0,1,0,0,1,0,1,
      1,0,0,1,1,0,0,1,
      0,1,0,0,0,0,1,0,
      0,0,1,1,1,1,0,0
    ]; // A classic 8x8 pixel mask

    this.defaultPattern16 = Array(256).fill(0).map((_, i) => {
      const x = i % 16;
      const y = Math.floor(i / 16);
      // Generate procedural concentric circles/crosses
      const dist = Math.sqrt((x - 7.5)**2 + (y - 7.5)**2);
      return dist > 4 && dist < 7 ? 1 : 0;
    });

    this.patternData = [...this.defaultPattern8];

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
    this.activePaletteIndex = 0;

    // References to controllers
    this.cameraController = null;
    this.editorUI = null;
    this.renderer = null;
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

    // Clear Grid Button
    const btnClear = document.getElementById('btn-clear');
    if (btnClear) {
      btnClear.addEventListener('click', () => {
        this.patternData.fill(0);
        this.editorUI.updateGridFromState();
        this.log('EDITOR: GRID CLEARED');
      });
    }

    // Invert Grid Button
    const btnInvert = document.getElementById('btn-invert');
    if (btnInvert) {
      btnInvert.addEventListener('click', () => {
        this.patternData = this.patternData.map(v => v === 1 ? 0 : 1);
        this.editorUI.updateGridFromState();
        this.log('EDITOR: GRID INVERTED');
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
  }

  setupPaletteUI() {
    const paletteList = document.getElementById('palette-list');
    if (!paletteList) return;

    paletteList.innerHTML = '';
    this.palettes.forEach((palette, idx) => {
      const item = document.createElement('div');
      item.className = `palette-color ${idx === this.activePaletteIndex ? 'active' : ''}`;
      // Display first 2 vibrant colors or gradient
      item.style.background = `linear-gradient(135deg, ${palette.colors[2]} 0%, ${palette.colors[3]} 100%)`;
      item.title = palette.name;
      
      item.addEventListener('click', () => {
        this.setPalette(idx);
      });
      paletteList.appendChild(item);
    });
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

    // Reload default patterns
    this.patternData = size === 8 ? [...this.defaultPattern8] : [...this.defaultPattern16];
    
    // Reinitialize grid layout
    this.editorUI.initGrid();
    this.log(`SYS: GRID CONFIG CHANGED TO ${size}x${size}`);
  }

  setPalette(index) {
    this.activePaletteIndex = index;
    this.setupPaletteUI(); // Refresh active class
    
    // Tell renderer to use new palette colors
    this.renderer.setPalette(this.palettes[index].colors);
    this.log(`SYS: PALETTE CHANGED TO [${this.palettes[index].name}]`);
  }

  // Handle updates from EditorUI
  onPatternChanged(newData) {
    this.patternData = newData;
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

  // Loop manager to request frames
  startLoop() {
    const tick = () => {
      if (this.cameraController && this.renderer) {
        // Retrieve frame from CameraController
        const videoElement = this.cameraController.getVideoElement();
        this.renderer.render(videoElement);
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
}
