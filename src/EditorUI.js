export class EditorUI {
  constructor(app) {
    this.app = app;
    this.gridContainer = document.getElementById('editor-grid');
    this.previewContainer = document.getElementById('editor-preview-view');
    this.editContainer = document.getElementById('editor-edit-view');
    this.controlsPanel = document.getElementById('editor-controls-panel');
    this.editHeaderNormal = document.getElementById('editor-header-normal');
    this.editHeaderEdit = document.getElementById('editor-header-edit');
    
    this.isDrawing = false;
    this.drawMode = 1; // 1 = paint (draw), 0 = erase
    this.isEditMode = false;
  }

  init() {
    this.initGrid();
    this.initMiniGrids();
    this.updateMiniGrids();
    this.setupGlobalPointerListeners();
    this.setupViewToggleListeners();
  }

  // Setup click listeners to toggle between previews and full editor
  setupViewToggleListeners() {
    // Click on preview item enters edit mode
    if (this.previewContainer) {
      const items = this.previewContainer.querySelectorAll('.preview-item');
      items.forEach((item) => {
        item.addEventListener('click', () => {
          const slot = parseInt(item.dataset.slot, 10);
          this.enterEditMode(slot);
        });
      });
    }

    // Click on RETURN button exits edit mode
    const btnBack = document.getElementById('btn-back-to-list');
    if (btnBack) {
      btnBack.addEventListener('click', () => {
        this.exitEditMode();
      });
    }
  }

  enterEditMode(slot) {
    this.isEditMode = true;
    this.app.activePatternIndex = slot;

    // Update active edit tag text
    const activeEditTag = document.getElementById('active-edit-tag');
    if (activeEditTag) {
      activeEditTag.textContent = `EDIT: TONE ${slot + 1}`;
    }

    // Toggle container display
    if (this.previewContainer) this.previewContainer.classList.add('hidden');
    if (this.editContainer) this.editContainer.classList.remove('hidden');
    if (this.controlsPanel) this.controlsPanel.classList.remove('hidden');
    if (this.editHeaderNormal) this.editHeaderNormal.classList.add('hidden');
    if (this.editHeaderEdit) this.editHeaderEdit.classList.remove('hidden');

    // Add editing mode class to root for responsive flex layout transition
    const appEl = document.getElementById('app');
    if (appEl) appEl.classList.add('mode-editing');

    // Re-initialize editor grid and populate it with selected slot's pattern data
    this.initGrid();
    this.updateGridFromState();

    // Trigger snapping layout update instantly to accommodate size transition
    this.app.handleResize();

    this.app.log(`EDITOR: ENTERED EDIT MODE FOR TONE_${slot + 1}`);
  }

  exitEditMode() {
    this.isEditMode = false;

    // Toggle container display back
    if (this.previewContainer) this.previewContainer.classList.remove('hidden');
    if (this.editContainer) this.editContainer.classList.add('hidden');
    if (this.controlsPanel) this.controlsPanel.classList.add('hidden');
    if (this.editHeaderNormal) this.editHeaderNormal.classList.remove('hidden');
    if (this.editHeaderEdit) this.editHeaderEdit.classList.add('hidden');

    // Remove editing mode class from root
    const appEl = document.getElementById('app');
    if (appEl) appEl.classList.remove('mode-editing');

    // Sync mini grids with the newly edited state
    this.updateMiniGrids();

    // Trigger snapping layout update
    this.app.handleResize();

    this.app.log(`EDITOR: EXITED EDIT MODE`);
  }

  // Setup the grid container and generate cells dynamically
  initGrid() {
    if (!this.gridContainer) return;

    const size = this.app.patternSize;
    this.gridContainer.innerHTML = '';
    this.gridContainer.style.setProperty('--grid-size', size);

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const index = y * size + x;
        const cell = document.createElement('div');
        cell.className = 'grid-cell';
        cell.dataset.index = index;
        cell.dataset.x = x;
        cell.dataset.y = y;

        // Apply initial state from patternData
        if (this.app.patternData[index] === 1) {
          cell.classList.add('active');
        }

        // Pointer event down starts drawing sequence
        cell.addEventListener('pointerdown', (e) => {
          e.preventDefault();
          this.isDrawing = true;
          // Determine mode: if active, erase. If inactive, paint.
          this.drawMode = this.app.patternData[index] === 1 ? 0 : 1;
          this.toggleCell(cell, index, this.drawMode);
          cell.releasePointerCapture(e.pointerId); // Allows pointerenter to work on other elements
        });

        // Pointerenter toggles cell when drawing
        cell.addEventListener('pointerenter', () => {
          if (this.isDrawing) {
            this.toggleCell(cell, index, this.drawMode);
          }
        });

        this.gridContainer.appendChild(cell);
      }
    }
  }

  // Initialize the 4 miniature preview grids (8x8 or 16x16)
  initMiniGrids() {
    const size = this.app.patternSize;
    for (let s = 0; s < 4; s++) {
      const miniGrid = document.getElementById(`mini-grid-${s}`);
      if (!miniGrid) continue;

      miniGrid.innerHTML = '';
      miniGrid.style.setProperty('--grid-size', size);

      const cellCount = size * size;
      for (let i = 0; i < cellCount; i++) {
        const cell = document.createElement('div');
        cell.className = 'mini-grid-cell';
        miniGrid.appendChild(cell);
      }
    }
  }

  // Synchronize mini preview grid cell colors with pattern and palette colors
  updateMiniGrids() {
    const size = this.app.patternSize;
    const currentPatterns = this.app.patterns; // patterns8 or patterns16
    const colors = this.app.currentPaletteColors;

    for (let s = 0; s < 4; s++) {
      const miniGrid = document.getElementById(`mini-grid-${s}`);
      if (!miniGrid) continue;

      const cells = miniGrid.querySelectorAll('.mini-grid-cell');
      const pattern = currentPatterns[s];

      // HSL/RGB boundaries for this slot (s -> s+1)
      const bgColor = colors[s];
      const fgColor = colors[s + 1];

      cells.forEach((cell, idx) => {
        if (cell && idx < pattern.length) {
          const val = pattern[idx];
          cell.style.backgroundColor = val === 1 ? fgColor : bgColor;
        }
      });
    }
  }

  // Update existing DOM cell classes from the app state
  updateGridFromState() {
    if (!this.gridContainer) return;
    const cells = this.gridContainer.querySelectorAll('.grid-cell');
    cells.forEach((cell) => {
      const index = parseInt(cell.dataset.index, 10);
      if (this.app.patternData[index] === 1) {
        cell.classList.add('active');
      } else {
        cell.classList.remove('active');
      }
    });
  }

  // Set the specific state of a cell and trigger repaint
  toggleCell(cellElement, index, value) {
    this.app.patternData[index] = value;
    if (value === 1) {
      cellElement.classList.add('active');
    } else {
      cellElement.classList.remove('active');
    }
    // Update the corresponding mini preview cell in real-time
    const activeSlot = this.app.activePatternIndex;
    const miniGrid = document.getElementById(`mini-grid-${activeSlot}`);
    if (miniGrid) {
      const miniCells = miniGrid.querySelectorAll('.mini-grid-cell');
      if (miniCells[index]) {
        const colors = this.app.currentPaletteColors;
        miniCells[index].style.backgroundColor = value === 1 ? colors[activeSlot + 1] : colors[activeSlot];
      }
    }

    // Notify the app of the change
    this.app.onPatternChanged();
  }

  setupGlobalPointerListeners() {
    // End drawing sequence when pointer is released anywhere
    window.addEventListener('pointerup', () => {
      if (this.isDrawing) {
        this.isDrawing = false;
      }
    });

    // Also stop drawing if window loses focus
    window.addEventListener('blur', () => {
      this.isDrawing = false;
    });
  }
}
