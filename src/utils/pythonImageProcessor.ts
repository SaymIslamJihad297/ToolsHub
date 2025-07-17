export interface PythonEnhancementOptions {
  brightness: number;
  contrast: number;
  saturation: number;
  sharpness: number;
  scale: number;
  quality: number;
  denoise: boolean;
  preserveColors: boolean;
  animeMode: boolean;
}

export interface PythonEnhancementResult {
  success: boolean;
  width?: number;
  height?: number;
  message?: string;
  algorithm?: string;
  quality_applied?: number;
  color_preservation?: boolean;
  error?: string;
}

export class PythonImageProcessor {
  async enhanceImage(file: File, options: PythonEnhancementOptions): Promise<PythonEnhancementResult> {
    try {
      // Convert file to base64
      const imageData = await this.fileToBase64(file);
      
      // Prepare data for Python script
      const inputData = {
        imageData: imageData.split(',')[1], // Remove data:image/... prefix
        options: {
          brightness: options.brightness,
          contrast: options.contrast,
          saturation: options.saturation,
          sharpness: options.sharpness,
          scale: options.scale,
          quality: options.quality,
          denoise: options.denoise,
          preserveColors: options.preserveColors,
          animeMode: options.animeMode
        }
      };

      // Execute Python script
      const response = await fetch('/api/enhance-python', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(inputData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;

    } catch (error) {
      console.error('Python enhancement error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to process image with Python'
      };
    }
  }

  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async createPreview(file: File, maxWidth: number = 400): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
        const width = Math.round(img.width * ratio);
        const height = Math.round(img.height * ratio);

        canvas.width = width;
        canvas.height = height;
        
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }
}