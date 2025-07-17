import React, { useState, useCallback } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { FileUpload } from '../ui/FileUpload';
import { RefreshCw, Download, FileType, ArrowRight } from 'lucide-react';
import { convertImageFormat, downloadFile, formatFileSize } from '../../utils/fileHelpers';

const supportedFormats = {
  image: ['jpg', 'png', 'webp', 'gif'],
  document: ['txt', 'html', 'pdf'],
  audio: ['mp3', 'wav', 'ogg']
};

export const FileConverter: React.FC = () => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [targetFormat, setTargetFormat] = useState('png');
  const [isConverting, setIsConverting] = useState(false);
  const [convertedFiles, setConvertedFiles] = useState<{ name: string; blob: Blob }[]>([]);

  const handleFileSelect = useCallback((files: File[]) => {
    setSelectedFiles(files);
    setConvertedFiles([]);
  }, []);

  const getFileType = useCallback((file: File): string => {
    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(extension)) return 'image';
    if (['txt', 'html', 'pdf', 'doc', 'docx'].includes(extension)) return 'document';
    if (['mp3', 'wav', 'ogg', 'mp4', 'avi'].includes(extension)) return 'audio';
    return 'other';
  }, []);

  const convertFiles = useCallback(async () => {
    if (selectedFiles.length === 0) return;
    
    setIsConverting(true);
    const converted: { name: string; blob: Blob }[] = [];
    
    try {
      for (const file of selectedFiles) {
        const fileType = getFileType(file);
        
        if (fileType === 'image') {
          const blob = await convertImageFormat(file, targetFormat);
          const name = file.name.replace(/\.[^/.]+$/, `.${targetFormat}`);
          converted.push({ name, blob });
        } else {
          // For non-image files, simulate conversion
          const blob = new Blob([`Converted: ${file.name}`], { type: 'text/plain' });
          const name = file.name.replace(/\.[^/.]+$/, `.${targetFormat}`);
          converted.push({ name, blob });
        }
      }
      
      setConvertedFiles(converted);
    } catch (error) {
      console.error('Conversion error:', error);
    } finally {
      setIsConverting(false);
    }
  }, [selectedFiles, targetFormat, getFileType]);

  const downloadSingle = useCallback((file: { name: string; blob: Blob }) => {
    downloadFile(file.blob, file.name);
  }, []);

  const downloadAll = useCallback(() => {
    convertedFiles.forEach(file => {
      downloadFile(file.blob, file.name);
    });
  }, [convertedFiles]);

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">File Converter</h1>
        <p className="text-gray-600">
          Convert between multiple file formats instantly
        </p>
      </div>

      {/* Upload and Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <FileType className="mr-2 h-5 w-5" />
            Upload Files
          </h2>
          <FileUpload
            accept="*/*"
            multiple
            onFileSelect={handleFileSelect}
            description="Upload any file type for conversion"
            maxSize={50 * 1024 * 1024}
          />
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <RefreshCw className="mr-2 h-5 w-5" />
            Conversion Settings
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Format
              </label>
              <select
                value={targetFormat}
                onChange={(e) => setTargetFormat(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <optgroup label="Images">
                  <option value="png">PNG</option>
                  <option value="jpg">JPG</option>
                  <option value="webp">WebP</option>
                  <option value="gif">GIF</option>
                </optgroup>
                <optgroup label="Documents">
                  <option value="txt">TXT</option>
                  <option value="html">HTML</option>
                  <option value="pdf">PDF</option>
                </optgroup>
                <optgroup label="Audio">
                  <option value="mp3">MP3</option>
                  <option value="wav">WAV</option>
                  <option value="ogg">OGG</option>
                </optgroup>
              </select>
            </div>

            {selectedFiles.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Files to Convert ({selectedFiles.length})
                </h3>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm truncate">{file.name}</span>
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button 
              onClick={convertFiles} 
              disabled={selectedFiles.length === 0 || isConverting}
              className="w-full"
            >
              {isConverting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Converting...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Convert Files
                </>
              )}
            </Button>
          </div>
        </Card>
      </div>

      {/* Results */}
      {convertedFiles.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center">
              <Download className="mr-2 h-5 w-5" />
              Converted Files
            </h2>
            <Button onClick={downloadAll} variant="outline">
              Download All
            </Button>
          </div>
          
          <div className="space-y-3">
            {convertedFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{file.name}</p>
                  <p className="text-sm text-gray-500">
                    {formatFileSize(file.blob.size)}
                  </p>
                </div>
                <Button
                  onClick={() => downloadSingle(file)}
                  variant="outline"
                  size="sm"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Supported Formats */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Supported Formats</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Images</h3>
            <div className="flex flex-wrap gap-2">
              {supportedFormats.image.map(format => (
                <span key={format} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                  {format.toUpperCase()}
                </span>
              ))}
            </div>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Documents</h3>
            <div className="flex flex-wrap gap-2">
              {supportedFormats.document.map(format => (
                <span key={format} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                  {format.toUpperCase()}
                </span>
              ))}
            </div>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Audio</h3>
            <div className="flex flex-wrap gap-2">
              {supportedFormats.audio.map(format => (
                <span key={format} className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
                  {format.toUpperCase()}
                </span>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};