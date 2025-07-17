export interface EnhancementOptions {
  brightness: number;
  contrast: number;
  saturation: number;
  sharpness: number;
  scale: number;
  quality: number; // 0-100, overall enhancement intensity
  denoise: boolean;
  preserveColors: boolean;
  animeMode: boolean;
}

export const defaultEnhancementOptions: EnhancementOptions = {
  brightness: 1.05,
  contrast: 1.1,
  saturation: 1.05,
  sharpness: 1.2,
  scale: 2,
  quality: 75, // Default to 75% quality
  denoise: true,
  preserveColors: true,
  animeMode: false
};

export class ImageProcessor {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private tempCanvas: HTMLCanvasElement;
  private tempCtx: CanvasRenderingContext2D;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d')!;
    this.tempCanvas = document.createElement('canvas');
    this.tempCtx = this.tempCanvas.getContext('2d')!;
  }

  async enhanceImage(file: File, options: EnhancementOptions): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        try {
          // Calculate quality-adjusted options
          const adjustedOptions = this.calculateQualityAdjustedOptions(options);
          
          const newWidth = Math.round(img.width * options.scale);
          const newHeight = Math.round(img.height * options.scale);
          
          // Step 1: High-quality upscaling
          this.performUpscaling(img, newWidth, newHeight, adjustedOptions.animeMode);
          
          // Step 2: Apply enhancements conservatively
          if (!adjustedOptions.preserveColors) {
            this.applyEnhancements(adjustedOptions);
          } else {
            this.applyConservativeEnhancements(adjustedOptions);
          }

          // Convert to blob
          this.canvas.toBlob((blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to create blob'));
            }
          }, 'image/png', 0.95);
        } catch (error) {
          reject(error);
        }
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }

  private calculateQualityAdjustedOptions(options: EnhancementOptions): EnhancementOptions {
    const qualityFactor = options.quality / 100; // Convert 0-100 to 0-1
    
    // Define quality levels
    const minIntensity = 0.1; // Minimum enhancement at 0% quality
    const maxIntensity = 1.0; // Maximum enhancement at 100% quality
    
    // Calculate intensity multiplier
    const intensity = minIntensity + (maxIntensity - minIntensity) * qualityFactor;
    
    return {
      ...options,
      brightness: 1 + (options.brightness - 1) * intensity,
      contrast: 1 + (options.contrast - 1) * intensity,
      saturation: 1 + (options.saturation - 1) * intensity,
      sharpness: 1 + (options.sharpness - 1) * intensity,
      // Scale and boolean options remain unchanged
    };
  }

  private performUpscaling(img: HTMLImageElement, newWidth: number, newHeight: number, animeMode: boolean) {
    this.canvas.width = newWidth;
    this.canvas.height = newHeight;

    // Use different interpolation based on content type
    if (animeMode) {
      // For anime/artwork: Use nearest-neighbor for sharp edges, then smooth
      this.ctx.imageSmoothingEnabled = false;
      this.ctx.drawImage(img, 0, 0, newWidth, newHeight);
      
      // Apply light smoothing to reduce pixelation while preserving edges
      this.applyEdgePreservingSmooth();
    } else {
      // For photos: Use high-quality bicubic interpolation
      this.ctx.imageSmoothingEnabled = true;
      this.ctx.imageSmoothingQuality = 'high';
      this.ctx.drawImage(img, 0, 0, newWidth, newHeight);
    }
  }

  private applyEdgePreservingSmooth() {
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    const newData = new Uint8ClampedArray(data);

    // Light bilateral filter to smooth while preserving edges
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;

        for (let c = 0; c < 3; c++) {
          let sum = 0;
          let weightSum = 0;
          const centerValue = data[idx + c];

          for (let ky = -1; ky <= 1; ky++) {
            for (let kx = -1; kx <= 1; kx++) {
              const kidx = ((y + ky) * width + (x + kx)) * 4 + c;
              const spatialDist = Math.sqrt(kx * kx + ky * ky);
              const colorDiff = Math.abs(centerValue - data[kidx]);
              
              // Weight based on spatial and color distance
              const spatialWeight = Math.exp(-spatialDist * spatialDist / (2 * 0.5 * 0.5));
              const colorWeight = Math.exp(-colorDiff * colorDiff / (2 * 20 * 20));
              const weight = spatialWeight * colorWeight;
              
              sum += data[kidx] * weight;
              weightSum += weight;
            }
          }
          
          newData[idx + c] = Math.round(sum / weightSum);
        }
      }
    }

    for (let i = 0; i < data.length; i++) {
      data[i] = newData[i];
    }
    
    this.ctx.putImageData(imageData, 0, 0);
  }

  private applyConservativeEnhancements(options: EnhancementOptions) {
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    
    // Apply very light adjustments to preserve original colors
    if (Math.abs(options.brightness - 1) > 0.01) {
      this.applyConservativeBrightness(imageData.data, options.brightness);
    }
    
    if (Math.abs(options.contrast - 1) > 0.01) {
      this.applyConservativeContrast(imageData.data, options.contrast);
    }
    
    if (options.sharpness > 1.0) {
      this.applyMildSharpening(imageData, options.sharpness);
    }
    
    if (options.denoise) {
      this.applyMildDenoise(imageData);
    }

    this.ctx.putImageData(imageData, 0, 0);
  }

  private applyEnhancements(options: EnhancementOptions) {
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    
    this.applyBrightnessContrast(imageData.data, options.brightness, options.contrast);
    this.applySaturation(imageData.data, options.saturation);
    
    if (options.sharpness > 1.0) {
      this.applySharpening(imageData, options.sharpness);
    }
    
    if (options.denoise) {
      this.applyDenoise(imageData);
    }

    this.ctx.putImageData(imageData, 0, 0);
  }

  private applyConservativeBrightness(data: Uint8ClampedArray, brightness: number) {
    // Limit brightness adjustment to prevent color inversion
    const safeBrightness = Math.max(0.8, Math.min(1.3, brightness));
    
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.min(255, Math.max(0, data[i] * safeBrightness));
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] * safeBrightness));
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] * safeBrightness));
    }
  }

  private applyConservativeContrast(data: Uint8ClampedArray, contrast: number) {
    // Limit contrast to prevent color distortion
    const safeContrast = Math.max(0.8, Math.min(1.4, contrast));
    const factor = (259 * (safeContrast * 255 + 255)) / (255 * (259 - safeContrast * 255));
    
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.min(255, Math.max(0, factor * (data[i] - 128) + 128));
      data[i + 1] = Math.min(255, Math.max(0, factor * (data[i + 1] - 128) + 128));
      data[i + 2] = Math.min(255, Math.max(0, factor * (data[i + 2] - 128) + 128));
    }
  }

  private applyBrightnessContrast(data: Uint8ClampedArray, brightness: number, contrast: number) {
    // Safe bounds to prevent extreme distortion
    const safeBrightness = Math.max(0.5, Math.min(2.0, brightness));
    const safeContrast = Math.max(0.5, Math.min(2.0, contrast));
    
    for (let i = 0; i < data.length; i += 4) {
      // Apply brightness first
      let r = data[i] * safeBrightness;
      let g = data[i + 1] * safeBrightness;
      let b = data[i + 2] * safeBrightness;
      
      // Apply contrast
      r = ((r / 255 - 0.5) * safeContrast + 0.5) * 255;
      g = ((g / 255 - 0.5) * safeContrast + 0.5) * 255;
      b = ((b / 255 - 0.5) * safeContrast + 0.5) * 255;
      
      data[i] = Math.min(255, Math.max(0, r));
      data[i + 1] = Math.min(255, Math.max(0, g));
      data[i + 2] = Math.min(255, Math.max(0, b));
    }
  }

  private applySaturation(data: Uint8ClampedArray, saturation: number) {
    // Limit saturation to prevent color shifts
    const safeSaturation = Math.max(0.0, Math.min(2.0, saturation));
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // Calculate luminance using standard weights
      const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
      
      // Apply saturation more conservatively
      data[i] = Math.min(255, Math.max(0, luminance + safeSaturation * (r - luminance)));
      data[i + 1] = Math.min(255, Math.max(0, luminance + safeSaturation * (g - luminance)));
      data[i + 2] = Math.min(255, Math.max(0, luminance + safeSaturation * (b - luminance)));
    }
  }

  private applyMildSharpening(imageData: ImageData, intensity: number) {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    const newData = new Uint8ClampedArray(data);

    // Milder sharpening kernel
    const kernel = [
      0, -0.5, 0,
      -0.5, 3, -0.5,
      0, -0.5, 0
    ];

    const factor = Math.min(intensity - 1, 0.5); // Limit sharpening intensity

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;

        for (let c = 0; c < 3; c++) {
          let sum = 0;
          for (let ky = -1; ky <= 1; ky++) {
            for (let kx = -1; kx <= 1; kx++) {
              const kidx = ((y + ky) * width + (x + kx)) * 4 + c;
              const kernelIdx = (ky + 1) * 3 + (kx + 1);
              sum += data[kidx] * kernel[kernelIdx];
            }
          }
          
          const sharpened = data[idx + c] + (sum - data[idx + c]) * factor;
          newData[idx + c] = Math.min(255, Math.max(0, sharpened));
        }
      }
    }

    for (let i = 0; i < data.length; i++) {
      data[i] = newData[i];
    }
  }

  private applySharpening(imageData: ImageData, intensity: number) {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    const newData = new Uint8ClampedArray(data);

    // Standard unsharp mask kernel
    const kernel = [
      0, -1, 0,
      -1, 5, -1,
      0, -1, 0
    ];

    const factor = Math.min(intensity - 1, 1.0); // Limit maximum sharpening

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;

        for (let c = 0; c < 3; c++) {
          let sum = 0;
          for (let ky = -1; ky <= 1; ky++) {
            for (let kx = -1; kx <= 1; kx++) {
              const kidx = ((y + ky) * width + (x + kx)) * 4 + c;
              const kernelIdx = (ky + 1) * 3 + (kx + 1);
              sum += data[kidx] * kernel[kernelIdx];
            }
          }
          
          const sharpened = data[idx + c] + (sum - data[idx + c]) * factor;
          newData[idx + c] = Math.min(255, Math.max(0, sharpened));
        }
      }
    }

    for (let i = 0; i < data.length; i++) {
      data[i] = newData[i];
    }
  }

  private applyMildDenoise(imageData: ImageData) {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    const newData = new Uint8ClampedArray(data);

    // Very mild denoising to preserve details
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;

        for (let c = 0; c < 3; c++) {
          let sum = 0;
          let weightSum = 0;
          const centerValue = data[idx + c];

          for (let ky = -1; ky <= 1; ky++) {
            for (let kx = -1; kx <= 1; kx++) {
              const kidx = ((y + ky) * width + (x + kx)) * 4 + c;
              const diff = Math.abs(centerValue - data[kidx]);
              const weight = Math.exp(-diff * diff / (2 * 10 * 10)); // Very conservative
              
              sum += data[kidx] * weight;
              weightSum += weight;
            }
          }
          
          // Blend with original to preserve details
          const denoised = sum / weightSum;
          newData[idx + c] = Math.round(data[idx + c] * 0.7 + denoised * 0.3);
        }
      }
    }

    for (let i = 0; i < data.length; i++) {
      data[i] = newData[i];
    }
  }

  private applyDenoise(imageData: ImageData) {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    const newData = new Uint8ClampedArray(data);

    // Bilateral filter for noise reduction
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;

        for (let c = 0; c < 3; c++) {
          let sum = 0;
          let weightSum = 0;

          for (let ky = -1; ky <= 1; ky++) {
            for (let kx = -1; kx <= 1; kx++) {
              const kidx = ((y + ky) * width + (x + kx)) * 4 + c;
              const diff = Math.abs(data[idx + c] - data[kidx]);
              const weight = Math.exp(-diff * diff / (2 * 25 * 25));
              
              sum += data[kidx] * weight;
              weightSum += weight;
            }
          }
          
          newData[idx + c] = Math.round(sum / weightSum);
        }
      }
    }

    for (let i = 0; i < data.length; i++) {
      data[i] = newData[i];
    }
  }

  async createPreview(file: File, maxWidth: number = 400): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
        const width = Math.round(img.width * ratio);
        const height = Math.round(img.height * ratio);

        this.canvas.width = width;
        this.canvas.height = height;
        
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';
        this.ctx.drawImage(img, 0, 0, width, height);
        resolve(this.canvas.toDataURL('image/jpeg', 0.85));
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }
}

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
};