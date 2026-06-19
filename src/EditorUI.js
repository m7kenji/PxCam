export class EditorUI {
  constructor(app) {
    this.app = app;
    this.gridContainer = document.getElementById('editor-grid');
    this.isDrawing = false;
    this.drawMode = 1; // 1 = paint (draw), 0 = erase
  }

  init() {
    this.initGrid();
    this.setupGlobalPointerListeners();
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
    // Notify the app of the change
    this.app.onPatternChanged(this.app.patternData);
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
