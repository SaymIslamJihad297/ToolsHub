import React from 'react';
import { Upload, X } from 'lucide-react';
import { useFileUpload } from '../../hooks/useFileUpload';
import { formatFileSize } from '../../utils/fileHelpers';

interface FileUploadProps {
  accept: string;
  multiple?: boolean;
  onFileSelect: (files: File[]) => void;
  maxSize?: number;
  description?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  accept,
  multiple = false,
  onFileSelect,
  maxSize,
  description = 'Drag and drop files here or click to browse'
}) => {
  const {
    files,
    isDragging,
    handleFileSelect,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    clearFiles
  } = useFileUpload();

  React.useEffect(() => {
    if (files.length > 0) {
      onFileSelect(files);
    }
  }, [files, onFileSelect]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      handleFileSelect(selectedFiles);
    }
  };

  return (
    <div className="w-full">
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleInputChange}
          className="hidden"
          id="file-upload"
        />
        <label htmlFor="file-upload" className="cursor-pointer">
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-lg font-medium text-gray-900 mb-2">Upload Files</p>
          <p className="text-gray-500">{description}</p>
          {maxSize && (
            <p className="text-sm text-gray-400 mt-2">
              Max file size: {formatFileSize(maxSize)}
            </p>
          )}
        </label>
      </div>

      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          {files.map((file, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">{file.name}</p>
                <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
              </div>
              <button
                onClick={clearFiles}
                className="text-red-500 hover:text-red-700 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};