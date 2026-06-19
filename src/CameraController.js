export class CameraController {
  constructor(app) {
    this.app = app;
    this.video = document.getElementById('webcam');
    this.stream = null;
    this.isCameraActive = false;

    // Fallback procedural generator setup
    this.fallbackCanvas = document.createElement('canvas');
    this.fallbackCanvas.width = 320;
    this.fallbackCanvas.height = 320;
    this.fallbackCtx = this.fallbackCanvas.getContext('2d');
    this.fallbackTime = 0;
  }

  init() {
    this.app.log('CAMERA: REQ_ACCESS to mediaDevice.video');
    this.requestCamera();
  }

  async requestCamera() {
    const constraints = {
      video: {
        width: { ideal: 640 },
        height: { ideal: 480 },
        facingMode: 'user'
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
      }
    } catch (err) {
      this.app.log(`CAMERA_WARN: ${err.message || err}. BOOTING PROCEDURAL FALLBACK FEED.`);
      this.isCameraActive = false;
    }
  }

  getVideoElement() {
    if (this.isCameraActive) {
      return this.video;
    } else {
      // Return the dynamic fallback canvas which we update on each frame request
      this.updateFallbackPattern();
      return this.fallbackCanvas;
    }
  }

  updateFallbackPattern() {
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

    // Moving shapes to test pixel filters
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
      // Add slight noise to test dither changes
      const noise = (Math.random() - 0.5) * 15;
      data[i] = Math.min(255, Math.max(0, data[i] + noise));
      data[i+1] = Math.min(255, Math.max(0, data[i+1] + noise));
      data[i+2] = Math.min(255, Math.max(0, data[i+2] + noise));
    }
    ctx.putImageData(imgData, 0, 0);
  }
}
