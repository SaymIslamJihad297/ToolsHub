import React, { useState, useRef, useEffect } from 'react';
import { useNotepadStore } from './store/notepadStore';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Image,
  Download,
  Upload,
  Type,
  Palette,
  Highlighter,
  FileText,
  Camera,
  Mic,
  Video,
  Save,
  Layers,
  X,
  Check,
  Square,
  CheckSquare,
  PenTool,
  Move,
  Trash2
} from 'lucide-react';

interface NoteEditorProps {
  noteId: string;
}

interface TextSelection {
  id: string;
  text: string;
  range: Range;
  element: HTMLElement;
  isActive: boolean;
}

export const NoteEditor: React.FC<NoteEditorProps> = ({ noteId }) => {
  const { notes, updateNote, exportNote } = useNotepadStore();
  const note = notes.find(n => n.id === noteId);

  const [title, setTitle] = useState(note?.title || '');
  const [content, setContent] = useState(note?.content || '');
  const [showToolbar, setShowToolbar] = useState(false);
  const [fontSize, setFontSize] = useState(14);
  const [fontFamily, setFontFamily] = useState('Inter');
  const [textColor, setTextColor] = useState('#000000');
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [isSaving, setIsSaving] = useState(false);
  
  // Multiple selection states
  const [multipleSelectionMode, setMultipleSelectionMode] = useState(false);
  const [selectedTexts, setSelectedTexts] = useState<TextSelection[]>([]);
  const [showSelectionPanel, setShowSelectionPanel] = useState(false);
  
  // Drawing states
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [showDrawingCanvas, setShowDrawingCanvas] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 400, height: 300 });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [penColor, setPenColor] = useState('#000000');
  const [penSize, setPenSize] = useState(2);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPoint, setLastPoint] = useState<{ x: number; y: number } | null>(null);

  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingContainerRef = useRef<HTMLDivElement>(null);

  const prevNoteIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (note && noteId !== prevNoteIdRef.current) {
      setTitle(note.title);
      setContent(note.content);
      if (editorRef.current) {
        editorRef.current.innerHTML = note.content;
      }
      prevNoteIdRef.current = noteId;
    }
  }, [note, noteId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (note && (title !== note.title || content !== note.content)) {
        updateNote(noteId, { title, content });
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [title, content, note, noteId, updateNote]);

  const handleManualSave = async () => {
    if (note && (title !== note.title || content !== note.content)) {
      setIsSaving(true);
      updateNote(noteId, { title, content });

      setTimeout(() => {
        setIsSaving(false);
      }, 500);
    }
  };

  const generateSelectionId = () => {
    return 'selection-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  };

  const handleTextSelection = () => {
    if (!multipleSelectionMode) return;

    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;

    const range = selection.getRangeAt(0);
    const selectedText = selection.toString().trim();
    
    if (selectedText.length === 0) return;

    // Create a wrapper element for the selection
    const wrapper = document.createElement('span');
    wrapper.className = 'multi-selection-highlight';
    wrapper.style.backgroundColor = 'rgba(59, 130, 246, 0.2)';
    wrapper.style.borderRadius = '2px';
    wrapper.style.padding = '1px 2px';
    
    try {
      range.surroundContents(wrapper);
    } catch (e) {
      // If surroundContents fails, extract and wrap the contents
      const contents = range.extractContents();
      wrapper.appendChild(contents);
      range.insertNode(wrapper);
    }

    const newSelection: TextSelection = {
      id: generateSelectionId(),
      text: selectedText,
      range: range.cloneRange(),
      element: wrapper,
      isActive: true
    };

    setSelectedTexts(prev => [...prev, newSelection]);
    setShowSelectionPanel(true);
    
    // Clear the selection
    selection.removeAllRanges();
    
    // Update content
    if (editorRef.current) {
      setContent(editorRef.current.innerHTML);
    }
  };

  const toggleSelectionActive = (selectionId: string) => {
    setSelectedTexts(prev => prev.map(sel => {
      if (sel.id === selectionId) {
        const newActive = !sel.isActive;
        // Update visual feedback
        if (sel.element) {
          sel.element.style.backgroundColor = newActive 
            ? 'rgba(59, 130, 246, 0.2)' 
            : 'rgba(156, 163, 175, 0.1)';
        }
        return { ...sel, isActive: newActive };
      }
      return sel;
    }));
  };

  const removeSelection = (selectionId: string) => {
    setSelectedTexts(prev => {
      const selection = prev.find(sel => sel.id === selectionId);
      if (selection && selection.element) {
        // Remove the wrapper and keep the text
        const parent = selection.element.parentNode;
        if (parent) {
          while (selection.element.firstChild) {
            parent.insertBefore(selection.element.firstChild, selection.element);
          }
          parent.removeChild(selection.element);
        }
      }
      return prev.filter(sel => sel.id !== selectionId);
    });
    
    // Update content
    if (editorRef.current) {
      setContent(editorRef.current.innerHTML);
    }
  };

  const clearAllSelections = () => {
    selectedTexts.forEach(selection => {
      if (selection.element) {
        const parent = selection.element.parentNode;
        if (parent) {
          while (selection.element.firstChild) {
            parent.insertBefore(selection.element.firstChild, selection.element);
          }
          parent.removeChild(selection.element);
        }
      }
    });
    
    setSelectedTexts([]);
    setShowSelectionPanel(false);
    
    // Update content
    if (editorRef.current) {
      setContent(editorRef.current.innerHTML);
    }
  };

  const applyFormatToActiveSelections = (command: string, value?: string) => {
    if (!multipleSelectionMode) {
      execCommand(command, value);
      return;
    }

    const activeSelections = selectedTexts.filter(sel => sel.isActive);
    if (activeSelections.length === 0) {
      execCommand(command, value);
      return;
    }

    activeSelections.forEach(selection => {
      if (selection.element) {
        const range = document.createRange();
        range.selectNodeContents(selection.element);
        
        const sel = window.getSelection();
        if (sel) {
          sel.removeAllRanges();
          sel.addRange(range);
          document.execCommand(command, false, value);
        }
      }
    });

    // Clear selection
    const sel = window.getSelection();
    if (sel) {
      sel.removeAllRanges();
    }

    // Update content
    if (editorRef.current) {
      setContent(editorRef.current.innerHTML);
    }
  };

  // Drawing functions
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingMode) return;
    
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setLastPoint({ x, y });
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !isDrawingMode || !lastPoint) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    ctx.strokeStyle = penColor;
    ctx.lineWidth = penSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    ctx.beginPath();
    ctx.moveTo(lastPoint.x, lastPoint.y);
    ctx.lineTo(x, y);
    ctx.stroke();
    
    setLastPoint({ x, y });
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    setLastPoint(null);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const saveDrawing = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const dataURL = canvas.toDataURL('image/png');
    const img = document.createElement('img');
    img.src = dataURL;
    img.style.maxWidth = '100%';
    img.style.height = 'auto';
    img.style.margin = '10px 0';
    img.style.border = '1px solid #e5e7eb';
    img.style.borderRadius = '4px';
    
    // Insert the drawing into the editor
    if (editorRef.current) {
      editorRef.current.appendChild(img);
      setContent(editorRef.current.innerHTML);
    }
    
    // Close the drawing canvas
    setShowDrawingCanvas(false);
    setIsDrawingMode(false);
    clearCanvas();
  };

  const cancelDrawing = () => {
    setShowDrawingCanvas(false);
    setIsDrawingMode(false);
    clearCanvas();
  };

  // Resize functions
  const startResize = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: canvasSize.width,
      height: canvasSize.height
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
      const deltaX = e.clientX - resizeStart.x;
      const deltaY = e.clientY - resizeStart.y;
      
      const newWidth = Math.max(200, resizeStart.width + deltaX);
      const newHeight = Math.max(150, resizeStart.height + deltaY);
      
      setCanvasSize({ width: newWidth, height: newHeight });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, resizeStart]);

  const execCommand = (command: string, value?: string) => {
    if (multipleSelectionMode) {
      applyFormatToActiveSelections(command, value);
    } else {
      document.execCommand(command, false, value);
      editorRef.current?.focus();
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = document.createElement('img');
        img.src = e.target?.result as string;
        img.style.maxWidth = '100%';
        img.style.height = 'auto';
        img.style.margin = '10px 0';

        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          range.insertNode(img);
          range.collapse(false);
        } else if (editorRef.current) {
          editorRef.current.appendChild(img);
        }

        if (editorRef.current) {
          setContent(editorRef.current.innerHTML);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      if (item.type.indexOf('image') !== -1) {
        e.preventDefault();
        const blob = item.getAsFile();
        if (blob) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const img = document.createElement('img');
            img.src = event.target?.result as string;
            img.style.maxWidth = '100%';
            img.style.height = 'auto';
            img.style.margin = '10px 0';

            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0) {
              const range = selection.getRangeAt(0);
              range.insertNode(img);
              range.collapse(false);
            }

            if (editorRef.current) {
              setContent(editorRef.current.innerHTML);
            }
          };
          reader.readAsDataURL(blob);
        }
        break;
      }
    }
  };

  const handleContentChange = () => {
    if (editorRef.current) {
      const newContent = editorRef.current.innerHTML;
      setContent(newContent);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault();
          execCommand('bold');
          break;
        case 'i':
          e.preventDefault();
          execCommand('italic');
          break;
        case 'u':
          e.preventDefault();
          execCommand('underline');
          break;
        case 's':
          e.preventDefault();
          break;
      }
    }
  };

  const handleMouseUp = () => {
    if (multipleSelectionMode) {
      setTimeout(handleTextSelection, 10);
    }
  };

  if (!note) {
    return (
      <div className="h-full flex items-center justify-center bg-white dark:bg-gray-800">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <FileText className="h-16 w-16 mx-auto mb-4" />
          <p>Note not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex bg-white dark:bg-gray-800">
      {/* Main Editor */}
      <div className="flex-1 flex flex-col">
        {/* Title */}
        <div className="border-b border-gray-200 dark:border-gray-700 p-6">
          <input
            ref={titleInputRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Untitled Note"
            className="w-full text-2xl font-bold bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
          />
          <div className="flex items-center justify-between mt-2">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Last updated: {new Date(note.updatedAt).toLocaleString()}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => exportNote(noteId, 'txt')}
                className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Export TXT
              </button>
              <button
                onClick={() => exportNote(noteId, 'html')}
                className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Export HTML
              </button>
              <button
                onClick={() => exportNote(noteId, 'pdf')}
                className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Export PDF
              </button>
              <button
                onClick={handleManualSave}
                disabled={isSaving}
                className={`flex items-center space-x-1 px-3 py-1 rounded text-sm transition-colors ${isSaving
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-blue-100 hover:bg-blue-200 text-blue-700 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 dark:text-blue-400'
                  }`}
              >
                <Save className="h-4 w-4" />
                <span>{isSaving ? 'Saved!' : 'Save'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="border-b border-gray-200 dark:border-gray-700 p-4">
          <div className="flex flex-wrap items-center gap-2">
            {/* Multiple Selection Toggle */}
            <div className="flex items-center space-x-2 border-r border-gray-200 dark:border-gray-700 pr-3">
              <button
                onClick={() => {
                  setMultipleSelectionMode(!multipleSelectionMode);
                  if (multipleSelectionMode) {
                    clearAllSelections();
                  }
                }}
                className={`flex items-center space-x-1 px-3 py-1 rounded text-sm transition-colors ${multipleSelectionMode
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300'
                  }`}
                title="Toggle Multiple Selection Mode"
              >
                <Layers className="h-4 w-4" />
                <span>Multi-Select</span>
              </button>
              {multipleSelectionMode && selectedTexts.length > 0 && (
                <button
                  onClick={() => setShowSelectionPanel(!showSelectionPanel)}
                  className="flex items-center space-x-1 px-2 py-1 rounded text-sm bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                >
                  <span>{selectedTexts.length} selected</span>
                </button>
              )}
            </div>

            {/* Text Formatting */}
            <div className="flex items-center space-x-1 border-r border-gray-200 dark:border-gray-700 pr-3">
              <button
                onClick={() => execCommand('bold')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-400"
                title="Bold (Ctrl+B)"
              >
                <Bold className="h-4 w-4" />
              </button>
              <button
                onClick={() => execCommand('italic')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-400"
                title="Italic (Ctrl+I)"
              >
                <Italic className="h-4 w-4" />
              </button>
              <button
                onClick={() => execCommand('underline')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-400"
                title="Underline (Ctrl+U)"
              >
                <Underline className="h-4 w-4" />
              </button>
              <button
                onClick={() => execCommand('strikeThrough')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-400"
                title="Strikethrough"
              >
                <Strikethrough className="h-4 w-4" />
              </button>
            </div>

            {/* Alignment */}
            <div className="flex items-center space-x-1 border-r border-gray-200 dark:border-gray-700 pr-3">
              <button
                onClick={() => execCommand('justifyLeft')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-400"
                title="Align Left"
              >
                <AlignLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => execCommand('justifyCenter')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-400"
                title="Align Center"
              >
                <AlignCenter className="h-4 w-4" />
              </button>
              <button
                onClick={() => execCommand('justifyRight')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-400"
                title="Align Right"
              >
                <AlignRight className="h-4 w-4" />
              </button>
            </div>

            {/* Lists */}
            <div className="flex items-center space-x-1 border-r border-gray-200 dark:border-gray-700 pr-3">
              <button
                onClick={() => execCommand('insertUnorderedList')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-400"
                title="Bullet List"
              >
                <List className="h-4 w-4" />
              </button>
              <button
                onClick={() => execCommand('insertOrderedList')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-400"
                title="Numbered List"
              >
                <ListOrdered className="h-4 w-4" />
              </button>
            </div>

            {/* Font Size */}
            <div className="flex items-center space-x-2 border-r border-gray-200 dark:border-gray-700 pr-3">
              <select
                value={fontSize}
                onChange={(e) => {
                  const pxSize = Number(e.target.value);
                  setFontSize(pxSize);
                  
                  if (multipleSelectionMode) {
                    applyFormatToActiveSelections('fontSize', '7');
                    const editor = editorRef.current;
                    if (editor) {
                      const fonts = editor.getElementsByTagName('font');
                      for (let i = 0; i < fonts.length; i++) {
                        const font = fonts[i];
                        if (font.size === '7') {
                          const span = document.createElement('span');
                          span.style.fontSize = `${pxSize}px`;
                          span.innerHTML = font.innerHTML;
                          font.replaceWith(span);
                        }
                      }
                    }
                  } else {
                    execCommand('fontSize', '7');
                    const editor = editorRef.current;
                    if (editor) {
                      const fonts = editor.getElementsByTagName('font');
                      for (let i = 0; i < fonts.length; i++) {
                        const font = fonts[i];
                        if (font.size === '7') {
                          const span = document.createElement('span');
                          span.style.fontSize = `${pxSize}px`;
                          span.innerHTML = font.innerHTML;
                          font.replaceWith(span);
                        }
                      }
                    }
                  }
                  
                  editorRef.current?.focus();
                }}
                className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {[10, 12, 14, 16, 18, 20, 24, 28, 32, 36].map(size => (
                  <option key={size} value={size}>{size}px</option>
                ))}
              </select>
            </div>

            {/* Colors */}
            <div className="flex items-center space-x-1 border-r border-gray-200 dark:border-gray-700 pr-3">
              <div className="flex items-center space-x-1">
                <input
                  type="color"
                  value={textColor}
                  onChange={(e) => {
                    setTextColor(e.target.value);
                    execCommand('foreColor', e.target.value);
                  }}
                  className="w-8 h-8 border border-gray-300 dark:border-gray-600 rounded cursor-pointer"
                  title="Text Color"
                />
                <input
                  type="color"
                  value={backgroundColor}
                  onChange={(e) => {
                    setBackgroundColor(e.target.value);
                    execCommand('backColor', e.target.value);
                  }}
                  className="w-8 h-8 border border-gray-300 dark:border-gray-600 rounded cursor-pointer"
                  title="Background Color"
                />
              </div>
            </div>

            {/* Media */}
            <div className="flex items-center space-x-1">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-400"
                title="Insert Image"
              >
                <Image className="h-4 w-4" />
              </button>
              <button
                onClick={() => {
                  setShowDrawingCanvas(true);
                  setIsDrawingMode(true);
                }}
                className={`p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors ${
                  isDrawingMode 
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' 
                    : 'text-gray-600 dark:text-gray-400'
                }`}
                title="Draw"
              >
                <PenTool className="h-4 w-4" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
          </div>
        </div>

        {/* Multiple Selection Info */}
        {multipleSelectionMode && (
          <div className="border-b border-gray-200 dark:border-gray-700 p-2 bg-blue-50 dark:bg-blue-900/20">
            <div className="flex items-center justify-between text-sm">
              <span className="text-blue-700 dark:text-blue-400">
                Multiple selection mode active - Select text to add to selection
              </span>
              {selectedTexts.length > 0 && (
                <button
                  onClick={clearAllSelections}
                  className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                >
                  Clear All
                </button>
              )}
            </div>
          </div>
        )}

        {/* Editor */}
        <div className="flex-1 overflow-y-auto">
          {/* Drawing Canvas Overlay */}
          {showDrawingCanvas && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div 
                ref={drawingContainerRef}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-6 relative"
                style={{ 
                  width: canvasSize.width + 100, 
                  height: canvasSize.height + 150 
                }}
              >
                {/* Drawing Controls */}
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Drawing Canvas
                  </h3>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={saveDrawing}
                      className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition-colors"
                    >
                      Save Drawing
                    </button>
                    <button
                      onClick={cancelDrawing}
                      className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>

                {/* Pen Controls */}
                <div className="flex items-center space-x-4 mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded">
                  <div className="flex items-center space-x-2">
                    <label className="text-sm text-gray-700 dark:text-gray-300">Color:</label>
                    <input
                      type="color"
                      value={penColor}
                      onChange={(e) => setPenColor(e.target.value)}
                      className="w-8 h-8 border border-gray-300 dark:border-gray-600 rounded cursor-pointer"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <label className="text-sm text-gray-700 dark:text-gray-300">Size:</label>
                    <input
                      type="range"
                      min="1"
                      max="20"
                      value={penSize}
                      onChange={(e) => setPenSize(Number(e.target.value))}
                      className="w-20"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300 w-6">{penSize}</span>
                  </div>
                  <button
                    onClick={clearCanvas}
                    className="flex items-center space-x-1 px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-400 rounded text-sm transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Clear</span>
                  </button>
                </div>

                {/* Canvas Container */}
                <div className="relative border-2 border-gray-300 dark:border-gray-600 rounded">
                  <canvas
                    ref={canvasRef}
                    width={canvasSize.width}
                    height={canvasSize.height}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    className="bg-white cursor-crosshair block"
                    style={{ 
                      cursor: isDrawingMode ? 'crosshair' : 'default'
                    }}
                  />
                  
                  {/* Resize Handle */}
                  <div
                    onMouseDown={startResize}
                    className="absolute bottom-0 right-0 w-4 h-4 bg-blue-600 cursor-se-resize hover:bg-blue-700 transition-colors"
                    style={{
                      clipPath: 'polygon(100% 0, 0 100%, 100% 100%)'
                    }}
                  />
                </div>
                
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                  Drag the corner to resize • Click and drag to draw
                </div>
              </div>
            </div>
          )}

          <div
            ref={editorRef}
            contentEditable
            onInput={handleContentChange}
            onPaste={handlePaste}
            onKeyDown={handleKeyDown}
            onMouseUp={handleMouseUp}
            className="h-full p-6 outline-none text-gray-900 dark:text-white"
            style={{
              fontSize: `${fontSize}px`,
              fontFamily: fontFamily,
              lineHeight: '1.6',
              minHeight: '100%',
            }}
            suppressContentEditableWarning={true}
          >
          </div>
        </div>

        {/* Status Bar */}
        <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-2 bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
            <div>
              Words: {content.replace(/<[^>]*>/g, '').split(/\s+/).filter(word => word.length > 0).length}
            </div>
            <div>
              Characters: {content.replace(/<[^>]*>/g, '').length}
            </div>
            <div>
              {multipleSelectionMode && selectedTexts.length > 0 && (
                <span className="text-blue-600 dark:text-blue-400 mr-4">
                  {selectedTexts.filter(sel => sel.isActive).length} active selections
                </span>
              )}
              {isSaving ? 'Saving...' : 'Auto-saved'}
            </div>
          </div>
        </div>
      </div>

      {/* Selection Panel */}
      {showSelectionPanel && selectedTexts.length > 0 && (
        <div className="w-80 border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Selected Text
              </h3>
              <button
                onClick={() => setShowSelectionPanel(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {selectedTexts.length} selections • {selectedTexts.filter(sel => sel.isActive).length} active
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {selectedTexts.map((selection, index) => (
              <div
                key={selection.id}
                className={`p-3 rounded-lg border transition-colors ${
                  selection.isActive
                    ? 'border-blue-200 bg-blue-50 dark:border-blue-700 dark:bg-blue-900/30'
                    : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-700'
                }`}
              >
                <div className="flex items-start justify-between">
                  <button
                    onClick={() => toggleSelectionActive(selection.id)}
                    className="flex items-center space-x-2 flex-1 text-left"
                  >
                    {selection.isActive ? (
                      <CheckSquare className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                    ) : (
                      <Square className="h-5 w-5 text-gray-400 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${
                        selection.isActive
                          ? 'text-blue-900 dark:text-blue-100'
                          : 'text-gray-600 dark:text-gray-400'
                      }`}>
                        Selection {index + 1}
                      </p>
                      <p className={`text-xs truncate ${
                        selection.isActive
                          ? 'text-blue-700 dark:text-blue-300'
                          : 'text-gray-500 dark:text-gray-500'
                      }`}>
                        {selection.text}
                      </p>
                    </div>
                  </button>
                  <button
                    onClick={() => removeSelection(selection.id)}
                    className="text-red-400 hover:text-red-600 dark:hover:text-red-300 ml-2"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  setSelectedTexts(prev => prev.map(sel => ({ ...sel, isActive: true })));
                  selectedTexts.forEach(sel => {
                    if (sel.element) {
                      sel.element.style.backgroundColor = 'rgba(59, 130, 246, 0.2)';
                    }
                  });
                }}
                className="flex-1 px-3 py-2 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 dark:text-blue-400 rounded"
              >
                Select All
              </button>
              <button
                onClick={() => {
                  setSelectedTexts(prev => prev.map(sel => ({ ...sel, isActive: false })));
                  selectedTexts.forEach(sel => {
                    if (sel.element) {
                      sel.element.style.backgroundColor = 'rgba(156, 163, 175, 0.1)';
                    }
                  });
                }}
                className="flex-1 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300 rounded"
              >
                Deselect All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NoteEditor;