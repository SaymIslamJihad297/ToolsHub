import { useState, useCallback } from 'react';

export const useFileUpload = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = useCallback((selectedFiles: File[]) => {
    setFiles(selectedFiles);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    setFiles(droppedFiles);
  }, []);

  const clearFiles = useCallback(() => {
    setFiles([]);
  }, []);

  return {
    files,
    isDragging,
    handleFileSelect,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    clearFiles
  };
};