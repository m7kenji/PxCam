export class CameraController {
  constructor(app) {
    this.app = app;
    this.video = document.getElementById('webcam');
    this.stream = null;
    this.isCameraActive = false;
    this.selectedDeviceId = null;
    this.currentSource = 'test_cloud'; // 'test_shapes' | 'test_cloud' | deviceId

    // Fallback procedural generator setup
    this.fallbackCanvas = document.createElement('canvas');
    this.fallbackCanvas.width = 320;
    this.fallbackCanvas.height = 320;
    this.fallbackCtx = this.fallbackCanvas.getContext('2d');
    this.fallbackTime = 0;
  }

  async init() {
    // Populate camera devices (triggers check, but does not enforce start)
    const selectCamera = document.getElementById('select-camera');
    if (selectCamera) {
      await this.populateDevices(selectCamera);
    }

    // Default startup source
    await this.requestCamera('test_cloud');
  }

  stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (this.video) {
      this.video.srcObject = null;
    }
    this.isCameraActive = false;
  }

  async requestCamera(sourceId = 'test_shapes') {
    this.stopCamera();
    this.currentSource = sourceId;

    if (sourceId === 'test_shapes' || sourceId === 'test_cloud') {
      this.isCameraActive = false;
      this.app.log(`SYS: SWITCHED TO PROCEDURAL INPUT [${sourceId.toUpperCase()}]`);
      return;
    }

    // Attempting camera device activation
    this.selectedDeviceId = sourceId;
    
    const constraints = {
      video: {
        width: { ideal: 640 },
        height: { ideal: 480 },
        deviceId: { exact: sourceId }
      },
      audio: false
    };

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('navigator.mediaDevices.getUserMedia not supported');
      }

      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (this.video) {
        this.video.srcObject = this.stream;
        this.video.play();
        this.isCameraActive = true;
        this.app.log('CAMERA: LIVE_INPUT ESTABLISHED.');
        
        // Listen to metadata to print camera specs
        this.video.addEventListener('loadedmetadata', () => {
          this.app.log(`CAMERA: STREAM RESOLUTION = ${this.video.videoWidth}x${this.video.videoHeight}`);
        });

        // Re-enumerate to get friendly camera names if permissions were just granted
        const selectCamera = document.getElementById('select-camera');
        if (selectCamera) {
          await this.populateDevices(selectCamera);
        }
      }
    } catch (err) {
      this.app.log(`CAMERA_WARN: ${err.message || err}. BOOTING PROCEDURAL FALLBACK FEED.`);
      this.isCameraActive = false;
      // Fallback to test_shapes on error
      this.currentSource = 'test_shapes';
      const selectCamera = document.getElementById('select-camera');
      if (selectCamera) selectCamera.value = 'test_shapes';
    }
  }

  async populateDevices(selectElement) {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      return;
    }

    try {
      // Prompt a temporary stream to trigger permissions if camera device is selected but labels are empty
      const tempStream = await navigator.mediaDevices.getUserMedia({ video: true }).catch(() => null);
      if (tempStream) {
        tempStream.getTracks().forEach(t => t.stop());
      }

      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(d => d.kind === 'videoinput');
      
      // Preserve test pattern options, append hardware cameras below
      selectElement.innerHTML = `
        <option value="test_shapes">[TEST] VECTOR_SHAPES</option>
        <option value="test_cloud">[TEST] FRACTAL_CLOUD</option>
      `;

      videoDevices.forEach((device, idx) => {
        const option = document.createElement('option');
        option.value = device.deviceId;
        option.textContent = `[CAM] ${device.label || `CAMERA_${idx + 1}`}`;
        if (device.deviceId === this.selectedDeviceId) {
          option.selected = true;
        }
        selectElement.appendChild(option);
      });
    } catch (err) {
      this.app.log(`CAMERA_WARN: FAILED TO ENUMERATE DEVICES: ${err.message || err}`);
    }
  }

  getVideoElement() {
    if (this.isCameraActive) {
      return this.video;
    } else {
      if (this.currentSource === 'test_cloud') {
        this.updateCloudPattern();
      } else {
        this.updateShapesPattern();
      }
      return this.fallbackCanvas;
    }
  }

  updateShapesPattern() {
    const ctx = this.fallbackCtx;
    const w = this.fallbackCanvas.width;
    const h = this.fallbackCanvas.height;
    this.fallbackTime += 0.03;

    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, w, h);

    // Draw some retro grid waves + scanning lines
    ctx.strokeStyle = '#222222';
    ctx.lineWidth = 1;
    const gridSpacing = 20;
    
    // Vertical grid
    for (let x = 0; x < w; x += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    // Horizontal grid
    for (let y = 0; y < h; y += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Moving shapes to test pixel filters - Flat vector colors, no gradients
    // Shape 1: A scanning circle
    const cx = w / 2 + Math.sin(this.fallbackTime) * 60;
    const cy = h / 2 + Math.cos(this.fallbackTime * 1.5) * 60;
    const radius = 45 + Math.sin(this.fallbackTime * 2) * 15;
    
    ctx.fillStyle = '#888888';
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();

    // Shape 2: A rotating square
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.rotate(-this.fallbackTime * 0.8);
    ctx.fillStyle = '#cccccc';
    ctx.fillRect(-30, -30, 60, 60);
    ctx.restore();

    // Scanning horizontal sweep bar
    const barY = (this.fallbackTime * 100) % h;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.fillRect(0, barY, w, 6);

    // Draw some noise
    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 15;
      data[i] = Math.min(255, Math.max(0, data[i] + noise));
      data[i+1] = Math.min(255, Math.max(0, data[i+1] + noise));
      data[i+2] = Math.min(255, Math.max(0, data[i+2] + noise));
    }
    ctx.putImageData(imgData, 0, 0);
  }

  updateCloudPattern() {
    const ctx = this.fallbackCtx;
    const w = this.fallbackCanvas.width;
    const h = this.fallbackCanvas.height;
    this.fallbackTime += 0.015; // Slower organic speed

    // Clear background to pure black for maximum contrast
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, w, h);

    // Screen blend mode to superimpose radial gradients smoothly like fractal clouds
    ctx.globalCompositeOperation = 'screen';

    // Cloud 1 - High opacity pure white gradient
    const x1 = w / 2 + Math.sin(this.fallbackTime) * 80;
    const y1 = h / 2 + Math.cos(this.fallbackTime * 0.7) * 80;
    const r1 = 120 + Math.sin(this.fallbackTime * 1.5) * 40;
    const g1 = ctx.createRadialGradient(x1, y1, 0, x1, y1, r1);
    g1.addColorStop(0, 'rgba(255, 255, 255, 0.75)');
    g1.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = g1;
    ctx.beginPath(); ctx.arc(x1, y1, r1, 0, Math.PI * 2); ctx.fill();

    // Cloud 2 - High opacity pure white gradient
    const x2 = w / 2 + Math.cos(this.fallbackTime * 0.8) * 90;
    const y2 = h / 2 + Math.sin(this.fallbackTime * 1.1) * 90;
    const r2 = 140 + Math.cos(this.fallbackTime * 1.2) * 30;
    const g2 = ctx.createRadialGradient(x2, y2, 0, x2, y2, r2);
    g2.addColorStop(0, 'rgba(255, 255, 255, 0.7)');
    g2.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = g2;
    ctx.beginPath(); ctx.arc(x2, y2, r2, 0, Math.PI * 2); ctx.fill();

    // Cloud 3 - Bright accent details
    const x3 = w / 2 + Math.sin(this.fallbackTime * 2.1) * 60;
    const y3 = h / 2 + Math.cos(this.fallbackTime * 1.7) * 60;
    const r3 = 70 + Math.sin(this.fallbackTime * 2.5) * 20;
    const g3 = ctx.createRadialGradient(x3, y3, 0, x3, y3, r3);
    g3.addColorStop(0, 'rgba(200, 200, 200, 0.55)');
    g3.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = g3;
    ctx.beginPath(); ctx.arc(x3, y3, r3, 0, Math.PI * 2); ctx.fill();

    // Reset composite operation to normal
    ctx.globalCompositeOperation = 'source-over';

    // Add very light noise for dithering texture
    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 10;
      data[i] = Math.min(255, Math.max(0, data[i] + noise));
      data[i+1] = Math.min(255, Math.max(0, data[i+1] + noise));
      data[i+2] = Math.min(255, Math.max(0, data[i+2] + noise));
    }
    ctx.putImageData(imgData, 0, 0);
  }
}
