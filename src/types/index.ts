export interface Tool {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'image' | 'text' | 'media' | 'document';
  route: string;
  gradient: string;
}

export interface FileUploadProps {
  accept: string;
  multiple?: boolean;
  onFileSelect: (files: File[]) => void;
}

export interface TranslationResult {
  text: string;
  from: string;
  to: string;
}

export interface OCRResult {
  text: string;
  confidence: number;
}