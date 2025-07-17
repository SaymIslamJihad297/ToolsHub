import { Tool } from '../types';

export const tools: Tool[] = [
  {
    id: 'screen-recorder',
    name: 'Screen Recorder',
    description: 'Record your screen with audio in the browser',
    icon: '🎥',
    category: 'media',
    route: '/tools/screen-recorder',
    gradient: 'from-red-400 to-red-600'
  },
  {
    id: 'notepad',
    name: 'Notepad',
    description: 'A simple note-taking tool to jot down your ideas.',
    category: 'text',
    route: '/notepad',
    icon: '📝',
    gradient: 'from-green-400 to-green-600',
  },
  {
    id: 'file-converter',
    name: 'File Converter',
    description: 'Convert between multiple file formats instantly',
    icon: '🔄',
    category: 'document',
    route: '/tools/file-converter',
    gradient: 'from-teal-400 to-teal-600'
  },
  {
    id: 'ocr',
    name: 'OCR Text Extractor',
    description: 'Extract text from images and PDF documents',
    icon: '📄',
    category: 'text',
    route: '/tools/ocr',
    gradient: 'from-purple-400 to-purple-600'
  },
  {
    id: 'text-to-speech',
    name: 'Text-to-Speech',
    description: 'Convert text to natural speech with recording',
    icon: '🔊',
    category: 'media',
    route: '/tools/text-to-speech',
    gradient: 'from-orange-400 to-orange-600'
  },
  {
    id: 'word-editor',
    name: 'Online Word Editor',
    description: 'Full-featured document editor with export options',
    icon: '📝',
    category: 'document',
    route: '/tools/word-editor',
    gradient: 'from-indigo-400 to-indigo-600'
  },
  {
    id: 'translator',
    name: 'Multilingual Translator',
    description: 'Real-time translation between 100+ languages',
    icon: '🌍',
    category: 'text',
    route: '/tools/translator',
    gradient: 'from-green-400 to-green-600'
  },
  {
    id: 'image-enhancer',
    name: 'Image Enhancer',
    description: 'AI-powered image upscaling and quality enhancement',
    icon: '🖼️',
    category: 'image',
    route: '/tools/image-enhancer',
    gradient: 'from-blue-400 to-blue-600'
  },
  {
    id: 'background-remover',
    name: 'Background Remover',
    description: 'Remove backgrounds from images with AI precision',
    icon: '✂️',
    category: 'image',
    route: '/tools/background-remover',
    gradient: 'from-pink-400 to-pink-600'
  }
];