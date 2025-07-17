import React, { useState, useCallback } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { FileUpload } from '../ui/FileUpload';
import { FileText, Copy, Download, Eye, AlertCircle } from 'lucide-react';
import { createWorker } from 'tesseract.js';
import { downloadFile } from '../../utils/fileHelpers';

export const OCR: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [extractedText, setExtractedText] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string>('');
  const [copySuccess, setCopySuccess] = useState(false);

  const handleFileSelect = useCallback((files: File[]) => {
    if (files.length > 0) {
      const file = files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setExtractedText('');
      setError('');
    }
  }, []);

  const extractText = useCallback(async () => {
    if (!selectedFile) return;
    
    setIsProcessing(true);
    setProgress(0);
    setError('');
    
    try {
      // Create worker with proper configuration
      const worker = await createWorker('eng', 1, {
        logger: (m) => {
          console.log(m);
          if (m.status === 'recognizing text') {
            setProgress(Math.round(m.progress * 100));
          }
        }
      });
      
      // Recognize text from the image
      const { data: { text } } = await worker.recognize(selectedFile);
      
      if (text.trim()) {
        setExtractedText(text.trim());
      } else {
        setError('No text found in the image. Please try with a clearer image.');
      }
      
      await worker.terminate();
    } catch (error) {
      console.error('OCR Error:', error);
      setError('Failed to extract text from image. Please try again with a different image.');
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  }, [selectedFile]);

  const copyText = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(extractedText);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('Failed to copy text:', error);
    }
  }, [extractedText]);

  const downloadText = useCallback(() => {
    const blob = new Blob([extractedText], { type: 'text/plain' });
    const filename = `extracted_text_${new Date().toISOString().slice(0, 10)}.txt`;
    downloadFile(blob, filename);
  }, [extractedText]);

  const clearAll = useCallback(() => {
    setSelectedFile(null);
    setPreviewUrl('');
    setExtractedText('');
    setError('');
    setProgress(0);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 p-4">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            <FileText className="inline-block mr-3 h-10 w-10 text-indigo-600" />
            OCR Text Extractor
          </h1>
          <p className="text-gray-600 text-lg">
            Extract text from images and documents with high accuracy using AI
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center">
                <span className="w-3 h-3 bg-indigo-500 rounded-full mr-2"></span>
                Upload Document
              </h2>
              {selectedFile && (
                <Button variant="ghost" size="sm" onClick={clearAll}>
                  Clear
                </Button>
              )}
            </div>
            
            <FileUpload
              accept="image/*"
              onFileSelect={handleFileSelect}
              description="Upload images (JPG, PNG, GIF, BMP, TIFF)"
              maxSize={10 * 1024 * 1024} // 10MB
            />
            
            {previewUrl && selectedFile && (
              <div className="mt-6 space-y-4">
                <h3 className="text-lg font-medium flex items-center">
                  <Eye className="mr-2 h-4 w-4" />
                  Preview
                </h3>
                <div className="relative">
                  <img
                    src={previewUrl}
                    alt="Document preview"
                    className="w-full max-h-64 object-contain rounded-lg border shadow-sm"
                  />
                  <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                    {selectedFile.name}
                  </div>
                </div>
                
                <Button 
                  onClick={extractText} 
                  disabled={isProcessing} 
                  className="w-full"
                  size="lg"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Processing... {progress}%
                    </>
                  ) : (
                    <>
                      <FileText className="mr-2 h-4 w-4" />
                      Extract Text
                    </>
                  )}
                </Button>
                
                {isProcessing && (
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* Results Section */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
              Extracted Text
            </h2>
            
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
                <AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-red-700 font-medium">Error</p>
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              </div>
            )}
            
            {extractedText ? (
              <div className="space-y-4">
                <textarea
                  value={extractedText}
                  onChange={(e) => setExtractedText(e.target.value)}
                  className="w-full h-64 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none text-base leading-relaxed"
                  placeholder="Extracted text will appear here..."
                />
                
                <div className="flex gap-3">
                  <Button 
                    onClick={copyText} 
                    variant="outline" 
                    className="flex-1"
                    disabled={!extractedText.trim()}
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    {copySuccess ? 'Copied!' : 'Copy Text'}
                  </Button>
                  <Button 
                    onClick={downloadText} 
                    variant="outline" 
                    className="flex-1"
                    disabled={!extractedText.trim()}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                </div>
                
                <div className="flex justify-between text-sm text-gray-500">
                  <span>{extractedText.length} characters extracted</span>
                  <span>{extractedText.split(/\s+/).filter(word => word.length > 0).length} words</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-16 text-gray-500">
                <FileText className="mx-auto h-16 w-16 mb-4 opacity-30" />
                <p className="text-lg font-medium">No text extracted yet</p>
                <p className="text-sm">Upload an image and click "Extract Text" to begin</p>
              </div>
            )}
          </Card>
        </div>

        {/* Features */}
        <Card className="p-6 bg-gradient-to-r from-indigo-50 to-cyan-50 border-indigo-200">
          <h2 className="text-xl font-semibold mb-6 text-indigo-900">OCR Capabilities</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <FileText className="h-6 w-6 text-indigo-600" />
              </div>
              <h3 className="font-medium mb-2 text-indigo-900">Multi-format Support</h3>
              <p className="text-sm text-indigo-700">JPG, PNG, GIF, BMP, TIFF images</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Eye className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-medium mb-2 text-indigo-900">High Accuracy</h3>
              <p className="text-sm text-indigo-700">Advanced OCR with 95%+ accuracy</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Download className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-medium mb-2 text-indigo-900">Export Options</h3>
              <p className="text-sm text-indigo-700">Copy or download as text file</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-cyan-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <FileText className="h-6 w-6 text-cyan-600" />
              </div>
              <h3 className="font-medium mb-2 text-indigo-900">Real-time Processing</h3>
              <p className="text-sm text-indigo-700">Fast text extraction with progress tracking</p>
            </div>
          </div>
        </Card>

        {/* Tips */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-900">Tips for Better Results</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
            <div className="space-y-2">
              <p>• Use high-resolution images for better accuracy</p>
              <p>• Ensure good lighting and contrast</p>
              <p>• Avoid blurry or distorted images</p>
            </div>
            <div className="space-y-2">
              <p>• Keep text horizontal and properly aligned</p>
              <p>• Use images with clear, readable fonts</p>
              <p>• Crop images to focus on text areas</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};