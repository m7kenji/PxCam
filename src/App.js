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
    
    this.activePresetIndex = 0; // 0 to 4
    this.presets = [
      {
        name: 'DEFAULT',
        patterns8: [
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
        ],
        patterns16: [
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
        ]
      },
      {
        name: 'GRID_LINE',
        patterns8: [
          // Tone 0: 2x2 grid check
          [
            1,1,0,0,1,1,0,0,
            1,1,0,0,1,1,0,0,
            0,0,1,1,0,0,1,1,
            0,0,1,1,0,0,1,1,
            1,1,0,0,1,1,0,0,
            1,1,0,0,1,1,0,0,
            0,0,1,1,0,0,1,1,
            0,0,1,1,0,0,1,1
          ],
          // Tone 1: Vertical stripes
          [
            1,0,1,0,1,0,1,0,
            1,0,1,0,1,0,1,0,
            1,0,1,0,1,0,1,0,
            1,0,1,0,1,0,1,0,
            1,0,1,0,1,0,1,0,
            1,0,1,0,1,0,1,0,
            1,0,1,0,1,0,1,0,
            1,0,1,0,1,0,1,0
          ],
          // Tone 2: Horizontal stripes
          [
            1,1,1,1,1,1,1,1,
            0,0,0,0,0,0,0,0,
            1,1,1,1,1,1,1,1,
            0,0,0,0,0,0,0,0,
            1,1,1,1,1,1,1,1,
            0,0,0,0,0,0,0,0,
            1,1,1,1,1,1,1,1,
            0,0,0,0,0,0,0,0
          ],
          // Tone 3: Diagonal stripes
          [
            1,0,0,0,1,0,0,0,
            0,1,0,0,0,1,0,0,
            0,0,1,0,0,0,1,0,
            0,0,0,1,0,0,0,1,
            1,0,0,0,1,0,0,0,
            0,1,0,0,0,1,0,0,
            0,0,1,0,0,0,1,0,
            0,0,0,1,0,0,0,1
          ]
        ],
        patterns16: [
          // Slot 0: Grid lines
          Array(256).fill(0).map((_, i) => {
            const x = i % 16; const y = Math.floor(i / 16);
            return (x % 4 === 0 || y % 4 === 0) ? 1 : 0;
          }),
          // Slot 1: Bold vertical stripes
          Array(256).fill(0).map((_, i) => {
            const x = i % 16;
            return (x % 4 < 2) ? 1 : 0;
          }),
          // Slot 2: Diagonal grid lines
          Array(256).fill(0).map((_, i) => {
            const x = i % 16; const y = Math.floor(i / 16);
            return (x + y) % 8 === 0 || (x - y) % 8 === 0 ? 1 : 0;
          }),
          // Slot 3: Thick diagonal stripes
          Array(256).fill(0).map((_, i) => {
            const x = i % 16; const y = Math.floor(i / 16);
            return ((x + y) % 8 < 3) ? 1 : 0;
          })
        ]
      },
      {
        name: 'HALFTONE',
        patterns8: [
          // Tone 0: Large dot
          [
            0,0,0,0,0,0,0,0,
            0,1,1,1,1,1,1,0,
            0,1,1,1,1,1,1,0,
            0,1,1,1,1,1,1,0,
            0,1,1,1,1,1,1,0,
            0,1,1,1,1,1,1,0,
            0,1,1,1,1,1,1,0,
            0,0,0,0,0,0,0,0
          ],
          // Tone 1: Medium dot
          [
            0,0,0,0,0,0,0,0,
            0,0,0,0,0,0,0,0,
            0,0,1,1,1,1,0,0,
            0,0,1,1,1,1,0,0,
            0,0,1,1,1,1,0,0,
            0,0,1,1,1,1,0,0,
            0,0,0,0,0,0,0,0,
            0,0,0,0,0,0,0,0
          ],
          // Tone 2: Small dot
          [
            0,0,0,0,0,0,0,0,
            0,0,0,0,0,0,0,0,
            0,0,0,0,0,0,0,0,
            0,0,0,1,1,0,0,0,
            0,0,0,1,1,0,0,0,
            0,0,0,0,0,0,0,0,
            0,0,0,0,0,0,0,0,
            0,0,0,0,0,0,0,0
          ],
          // Tone 3: Scattered dot
          [
            1,0,0,0,0,0,0,0,
            0,0,0,0,0,0,0,0,
            0,0,0,0,1,0,0,0,
            0,0,0,0,0,0,0,0,
            0,0,1,0,0,0,0,0,
            0,0,0,0,0,0,0,0,
            0,0,0,0,0,0,0,1,
            0,0,0,0,0,0,0,0
          ]
        ],
        patterns16: [
          // Slot 0: Large halftone
          Array(256).fill(0).map((_, i) => {
            const x = i % 16; const y = Math.floor(i / 16);
            const d = Math.sqrt((x - 7.5)**2 + (y - 7.5)**2);
            return (d < 6) ? 1 : 0;
          }),
          // Slot 1: Medium halftone
          Array(256).fill(0).map((_, i) => {
            const x = i % 16; const y = Math.floor(i / 16);
            const d = Math.sqrt((x - 7.5)**2 + (y - 7.5)**2);
            return (d < 4) ? 1 : 0;
          }),
          // Slot 2: Small halftone
          Array(256).fill(0).map((_, i) => {
            const x = i % 16; const y = Math.floor(i / 16);
            const d = Math.sqrt((x - 7.5)**2 + (y - 7.5)**2);
            return (d < 2.5) ? 1 : 0;
          }),
          // Slot 3: Tiny halftone
          Array(256).fill(0).map((_, i) => {
            const x = i % 16; const y = Math.floor(i / 16);
            const d = Math.sqrt((x - 7.5)**2 + (y - 7.5)**2);
            return (d < 1.2) ? 1 : 0;
          })
        ]
      },
      {
        name: 'WAVE_NOISE',
        patterns8: [
          // Tone 0: Zigzag wave
          [
            1,0,0,0,0,0,0,1,
            0,1,0,0,0,0,1,0,
            0,0,1,0,0,1,0,0,
            0,0,0,1,1,0,0,0,
            0,0,0,1,1,0,0,0,
            0,0,1,0,0,1,0,0,
            0,1,0,0,0,0,1,0,
            1,0,0,0,0,0,0,1
          ],
          // Tone 1: Checkerboard 8x8
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
          // Tone 2: Plus sign (+)
          [
            0,0,0,1,1,0,0,0,
            0,0,0,1,1,0,0,0,
            0,0,0,1,1,0,0,0,
            1,1,1,1,1,1,1,1,
            1,1,1,1,1,1,1,1,
            0,0,0,1,1,0,0,0,
            0,0,0,1,1,0,0,0,
            0,0,0,1,1,0,0,0
          ],
          // Tone 3: Sparse cross (x)
          [
            1,0,0,0,0,0,0,1,
            0,1,0,0,0,0,1,0,
            0,0,0,0,0,0,0,0,
            0,0,0,0,0,0,0,0,
            0,0,0,0,0,0,0,0,
            0,0,0,0,0,0,0,0,
            0,1,0,0,0,0,1,0,
            1,0,0,0,0,0,0,1
          ]
        ],
        patterns16: [
          // Slot 0: Dense Bayer 4x4
          Array(256).fill(0).map((_, i) => {
            const x = i % 16; const y = Math.floor(i / 16);
            const bayer = [
              [ 0,  8,  2, 10],
              [12,  4, 14,  6],
              [ 3, 11,  1,  9],
              [15,  7, 13,  5]
            ];
            return bayer[y % 4][x % 4] >= 4 ? 1 : 0;
          }),
          // Slot 1: Mid Bayer 4x4
          Array(256).fill(0).map((_, i) => {
            const x = i % 16; const y = Math.floor(i / 16);
            const bayer = [
              [ 0,  8,  2, 10],
              [12,  4, 14,  6],
              [ 3, 11,  1,  9],
              [15,  7, 13,  5]
            ];
            return bayer[y % 4][x % 4] >= 8 ? 1 : 0;
          }),
          // Slot 2: Low Bayer 4x4
          Array(256).fill(0).map((_, i) => {
            const x = i % 16; const y = Math.floor(i / 16);
            const bayer = [
              [ 0,  8,  2, 10],
              [12,  4, 14,  6],
              [ 3, 11,  1,  9],
              [15,  7, 13,  5]
            ];
            return bayer[y % 4][x % 4] >= 12 ? 1 : 0;
          }),
          // Slot 3: Sparse Bayer 4x4
          Array(256).fill(0).map((_, i) => {
            const x = i % 16; const y = Math.floor(i / 16);
            const bayer = [
              [ 0,  8,  2, 10],
              [12,  4, 14,  6],
              [ 3, 11,  1,  9],
              [15,  7, 13,  5]
            ];
            return bayer[y % 4][x % 4] >= 14 ? 1 : 0;
          })
        ]
      },
      {
        name: 'CYBER_TECH',
        patterns8: [
          // Tone 0: Checker blocks
          [
            1,1,1,1,0,0,0,0,
            1,1,1,1,0,0,0,0,
            1,1,1,1,0,0,0,0,
            1,1,1,1,0,0,0,0,
            0,0,0,0,1,1,1,1,
            0,0,0,0,1,1,1,1,
            0,0,0,0,1,1,1,1,
            0,0,0,0,1,1,1,1
          ],
          // Tone 1: Corner bracket
          [
            1,1,1,1,1,1,1,1,
            1,0,0,0,0,0,0,1,
            1,0,0,0,0,0,0,1,
            1,0,0,0,0,0,0,0,
            1,0,0,0,0,0,0,0,
            1,0,0,0,0,0,0,1,
            1,0,0,0,0,0,0,1,
            1,1,1,1,1,1,1,1
          ],
          // Tone 2: Reticle
          [
            0,0,1,1,1,1,0,0,
            0,0,0,0,0,0,0,0,
            1,0,0,0,0,0,0,1,
            1,0,0,0,0,0,0,1,
            1,0,0,0,0,0,0,1,
            1,0,0,0,0,0,0,1,
            0,0,0,0,0,0,0,0,
            0,0,1,1,1,1,0,0
          ],
          // Tone 3: Center & Corners
          [
            1,0,0,0,0,0,0,1,
            0,0,0,0,0,0,0,0,
            0,0,0,0,0,0,0,0,
            0,0,0,1,1,0,0,0,
            0,0,0,1,1,0,0,0,
            0,0,0,0,0,0,0,0,
            0,0,0,0,0,0,0,0,
            1,0,0,0,0,0,0,1
          ]
        ],
        patterns16: [
          // Slot 0: Circuit Board lines
          Array(256).fill(0).map((_, i) => {
            const x = i % 16; const y = Math.floor(i / 16);
            return (x === 2 || x === 13 || y === 2 || y === 13 || (x === y && x > 2 && x < 13)) ? 1 : 0;
          }),
          // Slot 1: Cyber grid
          Array(256).fill(0).map((_, i) => {
            const x = i % 16; const y = Math.floor(i / 16);
            return (x % 8 === 0 || y % 8 === 0 || x === y || x === (15 - y)) ? 1 : 0;
          }),
          // Slot 2: Reticle cross & circle
          Array(256).fill(0).map((_, i) => {
            const x = i % 16; const y = Math.floor(i / 16);
            const d = Math.sqrt((x - 7.5)**2 + (y - 7.5)**2);
            return (d < 5.5 && d > 4.5) || ((x === 8 || y === 8) && d < 7.5) ? 1 : 0;
          }),
          // Slot 3: Corner block marks & center
          Array(256).fill(0).map((_, i) => {
            const x = i % 16; const y = Math.floor(i / 16);
            const isCorner = (x < 3 && y < 3) || (x > 12 && y < 3) || (x < 3 && y > 12) || (x > 12 && y > 12);
            const isCenter = (x > 6 && x < 9 && y > 6 && y < 9);
            return (isCorner || isCenter) ? 1 : 0;
          })
        ]
      },
      {
        name: 'VINTAGE_TILES',
        patterns8: [
          // Tone 0: brick wall
          [
            1,1,1,1,1,1,1,1,
            1,0,0,0,0,0,0,1,
            1,1,1,1,1,1,1,1,
            0,0,0,1,1,0,0,0,
            1,1,1,1,1,1,1,1,
            0,0,0,0,0,0,0,1,
            1,1,1,1,1,1,1,1,
            1,0,0,0,0,0,0,1
          ],
          // Tone 1: coptic cross / square frame check
          [
            1,1,1,0,0,1,1,1,
            1,0,0,0,0,0,0,1,
            1,0,0,0,0,0,0,1,
            0,0,0,1,1,0,0,0,
            0,0,0,1,1,0,0,0,
            1,0,0,0,0,0,0,1,
            1,0,0,0,0,0,0,1,
            1,1,1,0,0,1,1,1
          ],
          // Tone 2: diamond cross
          [
            0,0,0,1,1,0,0,0,
            0,0,1,0,0,1,0,0,
            0,1,0,0,0,0,1,0,
            1,0,0,0,0,0,0,1,
            1,0,0,0,0,0,0,1,
            0,1,0,0,0,0,1,0,
            0,0,1,0,0,1,0,0,
            0,0,0,1,1,0,0,0
          ],
          // Tone 3: sparse tiny flowers
          [
            0,0,0,0,0,0,0,0,
            0,0,1,0,0,1,0,0,
            0,1,1,1,1,1,1,0,
            0,0,1,0,0,1,0,0,
            0,0,0,0,0,0,0,0,
            0,1,0,0,0,0,1,0,
            1,1,1,0,0,1,1,1,
            0,1,0,0,0,0,1,0
          ]
        ],
        patterns16: [
          // Slot 0: Arabesque tile
          Array(256).fill(0).map((_, i) => {
            const x = i % 16; const y = Math.floor(i / 16);
            return ((x % 8 === 0 || y % 8 === 0) || (x === y && x % 4 === 0) || ((15 - x) === y && x % 4 === 0)) ? 1 : 0;
          }),
          // Slot 1: Houndstooth
          Array(256).fill(0).map((_, i) => {
            const x = i % 16; const y = Math.floor(i / 16);
            const lx = x % 8; const ly = y % 8;
            return (lx < 4 && ly < 4) || (lx >= 4 && ly >= 4 && lx - 4 < ly) ? 1 : 0;
          }),
          // Slot 2: Herringbone
          Array(256).fill(0).map((_, i) => {
            const x = i % 16; const y = Math.floor(i / 16);
            const lx = x % 8; const ly = y % 8;
            return (lx === ly || lx === (8 - ly)) ? 1 : 0;
          }),
          // Slot 3: Basket weave
          Array(256).fill(0).map((_, i) => {
            const x = i % 16; const y = Math.floor(i / 16);
            const blockX = Math.floor(x / 4);
            const blockY = Math.floor(y / 4);
            return (blockX + blockY) % 2 === 0 ? ((x % 4 === 0) ? 1 : 0) : ((y % 4 === 0) ? 1 : 0);
          })
        ]
      },
      {
        name: 'GEOMETRIC_FLOW',
        patterns8: [
          // Tone 0: S-curve line
          [
            1,1,0,0,0,0,1,1,
            0,1,1,0,0,1,1,0,
            0,0,1,1,1,1,0,0,
            0,0,0,1,1,0,0,0,
            0,0,0,1,1,0,0,0,
            0,0,1,1,1,1,0,0,
            0,1,1,0,0,1,1,0,
            1,1,0,0,0,0,1,1
          ],
          // Tone 1: Wave horizontal
          [
            0,1,1,0,0,1,1,0,
            1,0,0,1,1,0,0,1,
            0,0,0,0,0,0,0,0,
            1,1,0,0,1,1,0,0,
            0,0,1,1,0,0,1,1,
            0,0,0,0,0,0,0,0,
            0,1,1,0,0,1,1,0,
            1,0,0,1,1,0,0,1
          ],
          // Tone 2: concentric ring seg
          [
            1,1,1,1,0,0,0,0,
            1,0,0,0,1,1,0,0,
            1,0,0,0,0,0,1,0,
            1,0,0,0,0,0,0,1,
            0,1,0,0,0,0,0,1,
            0,0,1,1,0,0,0,1,
            0,0,0,0,1,1,1,1,
            0,0,0,0,0,0,0,0
          ],
          // Tone 3: sparse dash
          [
            1,0,0,0,0,0,0,0,
            0,1,0,0,0,0,0,0,
            0,0,0,0,0,0,0,0,
            0,0,0,0,1,0,0,0,
            0,0,0,0,0,1,0,0,
            0,0,0,0,0,0,0,0,
            0,0,1,0,0,0,0,0,
            0,0,0,1,0,0,0,0
          ]
        ],
        patterns16: [
          // Slot 0: Wave interference
          Array(256).fill(0).map((_, i) => {
            const x = i % 16; const y = Math.floor(i / 16);
            const w1 = Math.sin(x * 0.5) * 4;
            const w2 = Math.cos(y * 0.5) * 4;
            return Math.floor(w1 + w2) % 3 === 0 ? 1 : 0;
          }),
          // Slot 1: Topography lines
          Array(256).fill(0).map((_, i) => {
            const x = i % 16; const y = Math.floor(i / 16);
            const v = Math.sin(x * 0.3) * Math.cos(y * 0.3);
            return Math.abs(v) < 0.15 ? 1 : 0;
          }),
          // Slot 2: Spiral
          Array(256).fill(0).map((_, i) => {
            const x = i % 16 - 7.5; const y = Math.floor(i / 16) - 7.5;
            const r = Math.sqrt(x*x + y*y);
            const theta = Math.atan2(y, x);
            return Math.sin(r * 0.8 - theta * 2.0) > 0.5 ? 1 : 0;
          }),
          // Slot 3: Parallel stripes
          Array(256).fill(0).map((_, i) => {
            const x = i % 16; const y = Math.floor(i / 16);
            return (x - y) % 6 === 0 ? 1 : 0;
          })
        ]
      },
      {
        name: 'ASCII_ART',
        patterns8: [
          // Tone 0: Solid blocks (hash '#')
          [
            1,1,0,1,1,0,1,1,
            1,1,0,1,1,0,1,1,
            1,1,1,1,1,1,1,1,
            1,1,0,1,1,0,1,1,
            1,1,0,1,1,0,1,1,
            1,1,1,1,1,1,1,1,
            1,1,0,1,1,0,1,1,
            1,1,0,1,1,0,1,1
          ],
          // Tone 1: Letter 'o'
          [
            0,0,1,1,1,1,0,0,
            0,1,1,0,0,1,1,0,
            1,1,0,0,0,0,1,1,
            1,1,0,0,0,0,1,1,
            1,1,0,0,0,0,1,1,
            1,1,0,0,0,0,1,1,
            0,1,1,0,0,1,1,0,
            0,0,1,1,1,1,0,0
          ],
          // Tone 2: Colon ':'
          [
            0,0,0,0,0,0,0,0,
            0,0,0,1,1,0,0,0,
            0,0,0,1,1,0,0,0,
            0,0,0,0,0,0,0,0,
            0,0,0,0,0,0,0,0,
            0,0,0,1,1,0,0,0,
            0,0,0,1,1,0,0,0,
            0,0,0,0,0,0,0,0
          ],
          // Tone 3: Period '.'
          [
            0,0,0,0,0,0,0,0,
            0,0,0,0,0,0,0,0,
            0,0,0,0,0,0,0,0,
            0,0,0,0,0,0,0,0,
            0,0,0,0,0,0,0,0,
            0,0,0,0,0,0,0,0,
            0,0,0,1,1,0,0,0,
            0,0,0,1,1,0,0,0
          ]
        ],
        patterns16: [
          // Slot 0: Matrix code letters
          Array(256).fill(0).map((_, i) => {
            const x = i % 16; const y = Math.floor(i / 16);
            const charData = [
              0x3c, 0x66, 0x6e, 0x76, 0x66, 0x66, 0x3c, 0x00,
              0x7e, 0x06, 0x0c, 0x18, 0x30, 0x60, 0x7e, 0x00
            ];
            const subY = y % 8;
            const charIdx = Math.floor(y / 8);
            const row = charData[charIdx * 8 + subY];
            return (row & (1 << (7 - (x % 8)))) ? 1 : 0;
          }),
          // Slot 1: Digital 7-segments numbers
          Array(256).fill(0).map((_, i) => {
            const x = i % 16; const y = Math.floor(i / 16);
            const lx = x % 8; const ly = y % 8;
            const isHorizontal = (ly === 0 || ly === 4 || ly === 7) && (lx > 0 && lx < 6);
            const isVertical = (lx === 0 || lx === 6) && (ly !== 0 && ly !== 4 && ly !== 7);
            return (isHorizontal || isVertical) ? 1 : 0;
          }),
          // Slot 2: Tetris Blocks
          Array(256).fill(0).map((_, i) => {
            const x = i % 16; const y = Math.floor(i / 16);
            const bx = Math.floor(x / 8); const by = Math.floor(y / 8);
            const lx = x % 8; const ly = y % 8;
            if (bx === 0 && by === 0) return (lx >= 2 && lx < 6 && ly >= 2 && ly < 6) ? 1 : 0;
            if (bx === 1 && by === 0) return (lx >= 3 && lx < 5 && ly >= 1 && ly < 7) ? 1 : 0;
            if (bx === 0 && by === 1) return (ly === 4 && lx >= 2 && lx < 6) || (ly === 3 && lx === 4) ? 1 : 0;
            return (lx === 3 && ly >= 2 && ly < 6) || (lx === 4 && ly === 5) ? 1 : 0;
          }),
          // Slot 3: Space-invader character
          Array(256).fill(0).map((_, i) => {
            const x = i % 16; const y = Math.floor(i / 16);
            const lx = x % 8; const ly = y % 8;
            const invader = [
              0b00011000,
              0b00111100,
              0b01111110,
              0b11011011,
              0b11111111,
              0b00100100,
              0b01011010,
              0b10100101
            ];
            return (invader[ly] & (1 << (7 - lx))) ? 1 : 0;
          })
        ]
      },
      {
        name: 'ORGANIC_NOISE',
        patterns8: [
          // Tone 0: sand texture
          [
            1,0,1,0,0,1,0,1,
            0,1,0,1,1,0,1,0,
            1,0,0,1,0,1,0,1,
            0,1,1,0,1,0,1,0,
            1,0,1,0,0,1,0,1,
            0,1,0,1,1,0,1,0,
            1,0,0,1,0,1,0,1,
            0,1,1,0,1,0,1,0
          ],
          // Tone 1: woven fabric
          [
            1,1,0,0,1,1,0,0,
            1,1,0,0,1,1,0,0,
            0,0,1,1,0,0,1,1,
            0,0,1,1,0,0,1,1,
            1,1,0,0,1,1,0,0,
            1,1,0,0,1,1,0,0,
            0,0,1,1,0,0,1,1,
            0,0,1,1,0,0,1,1
          ],
          // Tone 2: woodgrain lines
          [
            1,1,0,0,0,0,1,1,
            1,0,0,0,0,1,1,0,
            0,0,0,0,1,1,0,0,
            0,0,0,1,1,0,0,0,
            0,0,1,1,0,0,0,0,
            0,1,1,0,0,0,0,1,
            1,1,0,0,0,0,1,1,
            1,0,0,0,0,1,1,0
          ],
          // Tone 3: stippling
          [
            0,0,0,0,1,0,0,0,
            1,0,0,0,0,0,0,0,
            0,0,0,0,0,0,1,0,
            0,0,1,0,0,0,0,0,
            0,0,0,0,0,1,0,0,
            0,1,0,0,0,0,0,0,
            0,0,0,0,0,0,0,1,
            0,0,0,1,0,0,0,0
          ]
        ],
        patterns16: [
          // Slot 0: Perlin threshold
          Array(256).fill(0).map((_, i) => {
            const x = i % 16; const y = Math.floor(i / 16);
            const n = Math.sin(x * 0.4) + Math.sin(y * 0.4) + Math.sin((x+y)*0.3);
            return n > 0.5 ? 1 : 0;
          }),
          // Slot 1: Cellular Voronoi borders
          Array(256).fill(0).map((_, i) => {
            const x = i % 16; const y = Math.floor(i / 16);
            const centers = [[4,4], [12,4], [4,12], [12,12]];
            const dists = centers.map(c => Math.sqrt((x-c[0])**2 + (y-c[1])**2));
            const sorted = [...dists].sort((a,b) => a-b);
            return (sorted[1] - sorted[0] < 1.2) ? 1 : 0;
          }),
          // Slot 2: Cellular cracks
          Array(256).fill(0).map((_, i) => {
            const x = i % 16; const y = Math.floor(i / 16);
            return (x * 7 + y * 13) % 29 === 0 ? 1 : 0;
          }),
          // Slot 3: Random rain streaks
          Array(256).fill(0).map((_, i) => {
            const x = i % 16; const y = Math.floor(i / 16);
            return (x * 17 + y * 31) % 19 === 0 && (y % 2 === 0) ? 1 : 0;
          })
        ]
      },
      {
        name: 'RETRO_CONSOLE',
        patterns8: [
          // Tone 0: LCD screen frame grid
          [
            1,1,1,1,1,1,1,1,
            1,0,0,0,0,0,0,1,
            1,0,0,0,0,0,0,1,
            1,0,0,0,0,0,0,1,
            1,0,0,0,0,0,0,1,
            1,0,0,0,0,0,0,1,
            1,0,0,0,0,0,0,1,
            1,1,1,1,1,1,1,1
          ],
          // Tone 1: Scanline vertical dense
          [
            1,0,1,0,1,0,1,0,
            1,0,1,0,1,0,1,0,
            1,0,1,0,1,0,1,0,
            1,0,1,0,1,0,1,0,
            1,0,1,0,1,0,1,0,
            1,0,1,0,1,0,1,0,
            1,0,1,0,1,0,1,0,
            1,0,1,0,1,0,1,0
          ],
          // Tone 2: Scanline horizontal thick
          [
            1,1,1,1,1,1,1,1,
            1,1,1,1,1,1,1,1,
            0,0,0,0,0,0,0,0,
            0,0,0,0,0,0,0,0,
            1,1,1,1,1,1,1,1,
            1,1,1,1,1,1,1,1,
            0,0,0,0,0,0,0,0,
            0,0,0,0,0,0,0,0
          ],
          // Tone 3: CRT subpixel corners
          [
            1,0,0,0,0,0,0,1,
            0,0,0,0,0,0,0,0,
            0,0,0,0,0,0,0,0,
            0,0,0,0,0,0,0,0,
            0,0,0,0,0,0,0,0,
            0,0,0,0,0,0,0,0,
            0,0,0,0,0,0,0,0,
            1,0,0,0,0,0,0,1
          ]
        ],
        patterns16: [
          // Slot 0: Gameboy Pocket camera dither matrix
          Array(256).fill(0).map((_, i) => {
            const x = i % 16; const y = Math.floor(i / 16);
            return (x % 4 === 0 && y % 2 === 0) || (x % 2 === 0 && y % 4 === 0) ? 1 : 0;
          }),
          // Slot 1: Shadowmask CRT pattern
          Array(256).fill(0).map((_, i) => {
            const x = i % 16; const y = Math.floor(i / 16);
            const rowOffset = (Math.floor(y / 3) % 2) * 2;
            return (x + rowOffset) % 4 === 0 && y % 3 !== 0 ? 1 : 0;
          }),
          // Slot 2: Analog TV scanlines
          Array(256).fill(0).map((_, i) => {
            const x = i % 16; const y = Math.floor(i / 16);
            if (y % 4 === 0) return 1;
            return (x * 19 + y * 7) % 37 === 0 ? 1 : 0;
          }),
          // Slot 3: Vectrex vector lines
          Array(256).fill(0).map((_, i) => {
            const x = i % 16; const y = Math.floor(i / 16);
            return (x === y || x === 15 - y) && (x % 2 === 0) ? 1 : 0;
          })
        ]
      },
      {
        name: 'DOT_DANCE',
        patterns8: [
          // Tone 0: Smiley face
          [
            0,0,0,0,0,0,0,0,
            0,1,1,0,0,1,1,0,
            0,1,1,0,0,1,1,0,
            0,0,0,0,0,0,0,0,
            1,0,0,0,0,0,0,1,
            0,1,1,1,1,1,1,0,
            0,0,1,1,1,1,0,0,
            0,0,0,0,0,0,0,0
          ],
          // Tone 1: Pixel Heart
          [
            0,0,0,0,0,0,0,0,
            0,1,1,0,0,1,1,0,
            1,1,1,1,1,1,1,1,
            1,1,1,1,1,1,1,1,
            0,1,1,1,1,1,1,0,
            0,0,1,1,1,1,0,0,
            0,0,0,1,1,0,0,0,
            0,0,0,0,0,0,0,0
          ],
          // Tone 2: Twinkling Star
          [
            0,0,0,1,1,0,0,0,
            0,0,0,1,1,0,0,0,
            0,0,1,1,1,1,0,0,
            1,1,1,1,1,1,1,1,
            1,1,1,1,1,1,1,1,
            0,0,1,1,1,1,0,0,
            0,0,0,1,1,0,0,0,
            0,0,0,1,1,0,0,0
          ],
          // Tone 3: Cute skull / ghost outline
          [
            0,0,1,1,1,1,0,0,
            0,1,1,1,1,1,1,0,
            1,0,1,1,1,1,0,1,
            1,1,0,1,1,0,1,1,
            1,1,1,1,1,1,1,1,
            0,1,0,1,1,0,1,0,
            0,1,1,0,0,1,1,0,
            0,0,0,0,0,0,0,0
          ]
        ],
        patterns16: [
          // Slot 0: Pixel Character
          Array(256).fill(0).map((_, i) => {
            const x = i % 16; const y = Math.floor(i / 16);
            const lx = x % 8; const ly = y % 8;
            const sprite = [
              0b00111100,
              0b01111110,
              0b11011011,
              0b11111111,
              0b01111110,
              0b01011010,
              0b10000001,
              0b01000010
            ];
            return (sprite[ly] & (1 << (7 - lx))) ? 1 : 0;
          }),
          // Slot 1: Life Heart & Coin UI
          Array(256).fill(0).map((_, i) => {
            const x = i % 16; const y = Math.floor(i / 16);
            if (x < 8) {
              const hx = x; const hy = y - 4;
              const heart = [
                0b01101100,
                0b11111110,
                0b11111110,
                0b01111100,
                0b00111000,
                0b00010000
              ];
              return (hy >= 0 && hy < 6 && (heart[hy] & (1 << (7 - hx)))) ? 1 : 0;
            } else {
              const cx = x - 12; const cy = y - 7.5;
              const r = Math.sqrt(cx*cx + cy*cy);
              return (r < 3.5 && r > 2.5) || (r < 1.0) ? 1 : 0;
            }
          }),
          // Slot 2: Bubble chat balloon
          Array(256).fill(0).map((_, i) => {
            const x = i % 16; const y = Math.floor(i / 16);
            const isFrame = (x > 2 && x < 13 && (y === 3 || y === 11)) || (y > 3 && y < 11 && (x === 2 || x === 13));
            const isTail = (x === 4 && y === 12) || (x === 5 && y === 11);
            const isExcl = x === 7.5 && ((y >= 5 && y <= 7) || y === 9);
            return (isFrame || isTail || isExcl) ? 1 : 0;
          }),
          // Slot 3: Retro Pointer finger
          Array(256).fill(0).map((_, i) => {
            const x = i % 16; const y = Math.floor(i / 16);
            const finger = [
              0b00100000,
              0b00100000,
              0b00100000,
              0b00111000,
              0b01111100,
              0b01111100,
              0b01111100,
              0b00111000
            ];
            const fx = x - 4; const fy = y - 4;
            return (fx >= 0 && fx < 8 && fy >= 0 && fy < 8 && (finger[fy] & (1 << (7 - fx)))) ? 1 : 0;
          })
        ]
      },
      {
        name: 'GLITCH_CORE',
        patterns8: [
          // Tone 0: slice lines
          [
            1,1,1,1,1,1,1,1,
            0,0,0,0,0,0,0,0,
            1,1,0,0,1,1,0,0,
            0,0,0,0,0,0,0,0,
            0,0,1,1,0,0,1,1,
            0,0,0,0,0,0,0,0,
            1,1,1,1,1,1,1,1,
            0,0,0,0,0,0,0,0
          ],
          // Tone 1: static blocks
          [
            1,1,0,0,0,0,0,0,
            1,1,0,0,1,1,1,1,
            0,0,0,0,1,1,1,1,
            0,0,0,0,0,0,0,0,
            1,1,1,1,0,0,1,1,
            1,1,1,1,0,0,1,1,
            0,0,0,0,0,0,0,0,
            0,0,0,0,1,1,0,0
          ],
          // Tone 2: bit flip checker
          [
            1,0,1,0,0,0,0,0,
            0,0,0,0,1,0,1,0,
            0,1,0,1,0,0,0,0,
            0,0,0,0,0,1,0,1,
            1,0,1,0,0,0,0,0,
            0,0,0,0,1,0,1,0,
            0,1,0,1,0,0,0,0,
            0,0,0,0,0,1,0,1
          ],
          // Tone 3: single diagonal slice
          [
            0,0,0,0,0,0,0,0,
            0,0,0,0,0,0,0,0,
            0,0,0,0,0,0,0,0,
            1,1,1,1,1,1,1,1,
            0,0,0,0,0,0,0,0,
            0,0,0,0,0,0,0,0,
            0,0,0,0,0,0,0,0,
            0,0,0,0,0,0,0,0
          ]
        ],
        patterns16: [
          // Slot 0: Corrupted barcode
          Array(256).fill(0).map((_, i) => {
            const x = i % 16; const y = Math.floor(i / 16);
            const sliceY = Math.floor(y / 4);
            const shift = (sliceY % 2 === 0) ? 2 : -2;
            const shiftedX = (x + shift + 16) % 16;
            return (shiftedX % 3 === 0) ? 1 : 0;
          }),
          // Slot 1: Broken electrical circuits
          Array(256).fill(0).map((_, i) => {
            const x = i % 16; const y = Math.floor(i / 16);
            return (x === 4 || x === 11 || y === 4 || y === 11) && !((x > 6 && x < 9) || (y > 6 && y < 9)) ? 1 : 0;
          }),
          // Slot 2: Glitched font glyph fragments
          Array(256).fill(0).map((_, i) => {
            const x = i % 16; const y = Math.floor(i / 16);
            return ((x > 2 && x < 6) && (y > 2 && y < 13)) || ((x > 9 && x < 13) && (y > 2 && y < 13)) || (y === 7.5 && x > 2 && x < 13) ? (x % 2 === 0 && y % 2 === 0 ? 0 : 1) : 0;
          }),
          // Slot 3: TV Interlace sync loss
          Array(256).fill(0).map((_, i) => {
            const x = i % 16; const y = Math.floor(i / 16);
            const shift = Math.floor(Math.sin(y * 1.5) * 3);
            return ((x + shift + 16) % 8 === 0) && (y % 2 === 0) ? 1 : 0;
          })
        ]
      },
      {
        name: 'PLAYGROUND',
        patterns8: [
          // Tone 0: Puzzle piece
          [
            0,0,1,1,1,1,0,0,
            0,1,1,0,0,1,1,0,
            1,1,0,0,0,0,1,1,
            1,1,0,0,0,0,1,1,
            0,1,1,1,1,1,1,0,
            0,1,1,1,1,1,1,0,
            0,0,1,1,1,1,0,0,
            0,0,0,0,0,0,0,0
          ],
          // Tone 1: Cycle arrows
          [
            0,1,1,1,1,0,0,0,
            0,1,0,0,1,1,0,0,
            0,1,0,0,0,1,0,0,
            0,1,1,1,0,1,0,0,
            0,0,1,0,0,1,0,0,
            0,0,1,0,0,1,0,0,
            0,0,1,1,1,1,0,0,
            0,0,0,0,0,0,0,0
          ],
          // Tone 2: OX patterns
          [
            1,0,0,1,0,1,1,0,
            0,1,1,0,1,0,0,1,
            0,1,1,0,1,0,0,1,
            1,0,0,1,0,1,1,0,
            0,1,1,0,1,0,0,1,
            1,0,0,1,0,1,1,0,
            1,0,0,1,0,1,1,0,
            0,1,1,0,1,0,0,1
          ],
          // Tone 3: Cherry fruit
          [
            0,0,0,0,1,0,0,0,
            0,0,0,1,0,0,0,0,
            0,0,1,0,0,1,0,0,
            0,1,0,0,1,0,1,0,
            1,1,0,0,1,1,0,0,
            1,1,0,0,1,1,0,0,
            0,0,0,0,0,0,0,0,
            0,0,0,0,0,0,0,0
          ]
        ],
        patterns16: [
          // Slot 0: Maze walls
          Array(256).fill(0).map((_, i) => {
            const x = i % 16; const y = Math.floor(i / 16);
            return (x % 4 === 0 && y > 2 && y < 13) || (y % 4 === 0 && x > 2 && x < 13) ? 1 : 0;
          }),
          // Slot 1: Brick breaker layout
          Array(256).fill(0).map((_, i) => {
            const x = i % 16; const y = Math.floor(i / 16);
            const isBricks = (y >= 2 && y <= 6) && (x % 4 !== 0) && (y % 2 !== 0);
            const isPaddle = (y === 13) && (x >= 5 && x <= 10);
            const isBall = (x === 7 && y === 10);
            return (isBricks || isPaddle || isBall) ? 1 : 0;
          }),
          // Slot 2: Stardust trail
          Array(256).fill(0).map((_, i) => {
            const x = i % 16; const y = Math.floor(i / 16);
            return (x * y) % 17 === 3 ? 1 : 0;
          }),
          // Slot 3: Retro controller D-pad & Buttons
          Array(256).fill(0).map((_, i) => {
            const x = i % 16; const y = Math.floor(i / 16);
            if (x < 8) {
              const cx = x - 3.5; const cy = y - 7.5;
              return (Math.abs(cx) < 2.5 && Math.abs(cy) < 1.0) || (Math.abs(cy) < 2.5 && Math.abs(cx) < 1.0) ? 1 : 0;
            } else {
              const d1 = Math.sqrt((x - 10.5)**2 + (y - 9.5)**2);
              const d2 = Math.sqrt((x - 13.5)**2 + (y - 7.5)**2);
              return (d1 < 1.5 || d2 < 1.5) ? 1 : 0;
            }
          })
        ]
      }
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

    // Video Recording state
    this.isRecording = false;
    this.mediaRecorder = null;
    this.recordedChunks = [];
    this.recordingStartTime = 0;
    this.recordingInterval = null;
    this.recordingAutoStopTimeout = null;
  }

  // Active pattern set getter based on current pattern size
  get patterns() {
    const preset = this.presets[this.activePresetIndex];
    return this.patternSize === 8 ? preset.patterns8 : preset.patterns16;
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

    // Set initial preset label
    const label = document.getElementById('pattern-preset-label');
    if (label) {
      label.textContent = this.presets[this.activePresetIndex].name;
    }

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

    // Pattern Preset Toggle (metadata-feed in normal view)
    const headerPresetToggle = document.getElementById('header-pattern-preset-toggle');
    if (headerPresetToggle) {
      headerPresetToggle.addEventListener('click', () => {
        const nextPreset = (this.activePresetIndex + 1) % this.presets.length;
        this.setPreset(nextPreset);
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

    // Capture Buttons
    const btnCaptureStill = document.getElementById('btn-capture-still');
    if (btnCaptureStill) {
      btnCaptureStill.addEventListener('click', () => {
        this.captureStill();
      });
    }

    const btnRecordVideo = document.getElementById('btn-record-video');
    if (btnRecordVideo) {
      btnRecordVideo.addEventListener('click', () => {
        this.toggleVideoRecord();
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

  setPreset(index) {
    this.activePresetIndex = index;
    const label = document.getElementById('pattern-preset-label');
    if (label) {
      label.textContent = this.presets[index].name;
    }

    // Refresh UI & Renderer
    if (this.editorUI) {
      if (this.editorUI.isEditMode) {
        this.editorUI.initGrid();
        this.editorUI.updateGridFromState();
      } else {
        this.editorUI.updateMiniGrids();
      }
    }
    this.onPatternChanged();
    this.log(`SYS: PATTERN PRESET CHANGED TO [${this.presets[index].name}]`);
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

  captureStill() {
    if (!this.renderer || !this.renderer.canvas) return;

    try {
      const canvas = this.renderer.canvas;
      const dataUrl = canvas.toDataURL('image/png');

      const timestamp = new Date().toISOString().replace(/[-:T]/g, '_').slice(0, 19);
      const filename = `pxcam_${timestamp}.png`;

      const link = document.createElement('a');
      link.download = filename;
      link.href = dataUrl;
      link.click();

      this.log(`SYS: STILL CAPTURE COMPLETED: ${filename}`);
    } catch (err) {
      this.log(`SYS_ERROR: STILL CAPTURE FAILED: ${err.message}`);
    }
  }

  toggleVideoRecord() {
    if (this.isRecording) {
      this.stopRecording();
    } else {
      this.startRecording();
    }
  }

  startRecording() {
    if (!this.renderer || !this.renderer.canvas) return;

    this.recordedChunks = [];

    // Check supported mime types
    let options = { mimeType: 'video/webm;codecs=vp9' };
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      options = { mimeType: 'video/webm;codecs=vp8' };
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options = { mimeType: 'video/webm' };
      }
    }

    try {
      // Capture stream from WebGL canvas at targetFps
      const stream = this.renderer.canvas.captureStream(this.targetFps);
      
      this.mediaRecorder = new MediaRecorder(stream, options);
      
      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          this.recordedChunks.push(e.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.recordedChunks, { type: options.mimeType });
        const url = URL.createObjectURL(blob);
        
        const timestamp = new Date().toISOString().replace(/[-:T]/g, '_').slice(0, 19);
        const extension = options.mimeType.includes('mp4') ? 'mp4' : 'webm';
        const filename = `pxcam_${timestamp}.${extension}`;
        
        const link = document.createElement('a');
        link.download = filename;
        link.href = url;
        link.click();
        
        setTimeout(() => URL.revokeObjectURL(url), 100);

        this.log(`SYS: VIDEO RECORDING COMPLETED: ${filename}`);
      };

      // Start recording
      this.mediaRecorder.start();
      this.isRecording = true;
      this.recordingStartTime = performance.now();

      // Auto-stop after 30 seconds to prevent OOM
      this.recordingAutoStopTimeout = setTimeout(() => {
        this.log('SYS: AUTO-STOPPED VIDEO RECORDING (30S LIMIT REACHED)');
        this.stopRecording();
      }, 30000);
      
      // Update UI button and start timer
      const btnRecordVideo = document.getElementById('btn-record-video');
      if (btnRecordVideo) {
        btnRecordVideo.classList.add('recording');
        btnRecordVideo.textContent = `[ REC: 00:00 ]`;
      }

      this.recordingInterval = setInterval(() => {
        const elapsed = Math.floor((performance.now() - this.recordingStartTime) / 1000);
        const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
        const ss = String(elapsed % 60).padStart(2, '0');
        if (btnRecordVideo) {
          btnRecordVideo.textContent = `[ REC: ${mm}:${ss} ]`;
        }
      }, 1000);

      this.log('SYS: VIDEO RECORDING STARTED');
    } catch (err) {
      this.log(`SYS_ERROR: VIDEO RECORDING FAILED: ${err.message}`);
    }
  }

  stopRecording() {
    if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') return;

    // Clear auto-stop timeout if stopped manually
    if (this.recordingAutoStopTimeout) {
      clearTimeout(this.recordingAutoStopTimeout);
      this.recordingAutoStopTimeout = null;
    }

    this.mediaRecorder.stop();
    this.isRecording = false;

    // Clear timer
    if (this.recordingInterval) {
      clearInterval(this.recordingInterval);
      this.recordingInterval = null;
    }

    // Reset UI button
    const btnRecordVideo = document.getElementById('btn-record-video');
    if (btnRecordVideo) {
      btnRecordVideo.classList.remove('recording');
      btnRecordVideo.textContent = '[ VID_REC ]';
    }
  }
}
