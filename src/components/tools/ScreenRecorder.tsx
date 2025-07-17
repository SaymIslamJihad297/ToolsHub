import React, { useState, useRef, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Video, Square, Play, Pause, Download, Monitor, Volume2, Edit3, Eraser, Palette, Minus, X, Type, MousePointer, Image, Code, Clipboard, Trash2, Move } from 'lucide-react';
import { downloadFile } from '../../utils/fileHelpers';

interface PastedItem {
  id: string;
  type: 'text' | 'code' | 'image';
  content: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  fontSize?: number;
  language?: string;
}

export const ScreenRecorder: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [includeAudio, setIncludeAudio] = useState(true);
  const [includeMicrophone, setIncludeMicrophone] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [enablePen, setEnablePen] = useState(false);
  const [enableWhiteboard, setEnableWhiteboard] = useState(false);
  const [whiteboardColor, setWhiteboardColor] = useState('#ffffff');
  const [isDrawing, setIsDrawing] = useState(false);
  const [penColor, setPenColor] = useState('#ff0000');
  const [penSize, setPenSize] = useState(3);
  const [textSize, setTextSize] = useState(16);
  const [penType, setPenType] = useState<'draw' | 'highlight'>('draw');
  const [toolMode, setToolMode] = useState<'pen' | 'text' | 'eraser' | 'paste' | 'cursor'>('pen');
  const [showToolPalette, setShowToolPalette] = useState(false);
  const [palettePosition, setPalettePosition] = useState({ x: 20, y: 20 });
  const [isDraggingPalette, setIsDraggingPalette] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [textInputs, setTextInputs] = useState<Array<{
    id: string;
    x: number;
    y: number;
    text: string;
    color: string;
    size: number;
  }>>([]);
  const [activeTextInput, setActiveTextInput] = useState<string | null>(null);
  
  // New state for pasted items
  const [pastedItems, setPastedItems] = useState<PastedItem[]>([]);
  const [selectedPastedItem, setSelectedPastedItem] = useState<string | null>(null);
  const [isDraggingItem, setIsDraggingItem] = useState(false);
  const [dragItemOffset, setDragItemOffset] = useState({ x: 0, y: 0 });
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);

  // Helper function to detect if text is likely code
  const detectCodeLanguage = (text: string): string | null => {
    const codePatterns = [
      { pattern: /function\s+\w+\s*\(|const\s+\w+\s*=|let\s+\w+\s*=|var\s+\w+\s*=/, language: 'javascript' },
      { pattern: /def\s+\w+\s*\(|import\s+\w+|from\s+\w+\s+import|class\s+\w+:/, language: 'python' },
      { pattern: /public\s+class\s+\w+|import\s+java\.|System\.out\.println/, language: 'java' },
      { pattern: /#include\s*<|int\s+main\s*\(|printf\s*\(/, language: 'c' },
      { pattern: /fn\s+\w+\s*\(|use\s+std::|println!/, language: 'rust' },
      { pattern: /<\?php|echo\s+|function\s+\w+\s*\(/, language: 'php' },
      { pattern: /SELECT\s+.*FROM|INSERT\s+INTO|UPDATE\s+.*SET/i, language: 'sql' },
      { pattern: /<html|<div|<span|<script|<style/, language: 'html' },
      { pattern: /\.[\w-]+\s*\{|@media|display\s*:|color\s*:/, language: 'css' },
      { pattern: /\{[\s\S]*\}|"[\w-]+"\s*:|\[[\s\S]*\]/, language: 'json' }
    ];

    for (const { pattern, language } of codePatterns) {
      if (pattern.test(text)) {
        return language;
      }
    }

    // Additional heuristics for code detection
    const codeIndicators = [
      /[{}();].*[{}();]/,  // Multiple code symbols
      /\w+\s*\([^)]*\)\s*[{;]/,  // Function calls/declarations
      /^\s*\/\/|^\s*\/\*|^\s*#/m,  // Comments
      /import\s+|require\s*\(/,  // Imports
      /class\s+\w+|interface\s+\w+/,  // Class/interface declarations
    ];

    for (const indicator of codeIndicators) {
      if (indicator.test(text)) {
        return 'code'; // Generic code
      }
    }

    return null;
  };

  // Handle paste events
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      if (!enablePen) return;

      e.preventDefault();
      
      const items = e.clipboardData?.items;
      if (!items) return;

      // Get mouse position for paste location
      const getMousePosition = () => {
        // Try to get last known mouse position, fallback to center
        const rect = canvasRef.current?.getBoundingClientRect();
        if (rect && window.lastMouseX !== undefined && window.lastMouseY !== undefined) {
          return {
            x: Math.max(20, Math.min(window.innerWidth - 300, window.lastMouseX - rect.left)),
            y: Math.max(20, Math.min(window.innerHeight - 200, window.lastMouseY - rect.top))
          };
        }
        // Fallback to center of screen
        return {
          x: Math.max(20, window.innerWidth / 2 - 150),
          y: Math.max(20, window.innerHeight / 2 - 100)
        };
      };

      for (const item of Array.from(items)) {
        if (item.type.startsWith('image/')) {
          // Handle image paste
          const file = item.getAsFile();
          if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
              const imageUrl = event.target?.result as string;
              const position = getMousePosition();
              const newItem: PastedItem = {
                id: Date.now().toString(),
                type: 'image',
                content: imageUrl,
                x: position.x,
                y: position.y,
                width: 300,
                height: 200
              };
              setPastedItems(prev => [...prev, newItem]);
            };
            reader.readAsDataURL(file);
          }
        } else if (item.type === 'text/plain') {
          // Handle text/code paste
          const text = await new Promise<string>((resolve) => {
            item.getAsString(resolve);
          });
          
          if (text.trim()) {
            const detectedLanguage = detectCodeLanguage(text);
            const isCode = detectedLanguage !== null;
            const position = getMousePosition();
            
            const newItem: PastedItem = {
              id: Date.now().toString(),
              type: isCode ? 'code' : 'text',
              content: text,
              x: position.x,
              y: position.y,
              fontSize: isCode ? 14 : 16,
              language: detectedLanguage || undefined
            };
            setPastedItems(prev => [...prev, newItem]);
          }
        }
      }
    };

    if (enablePen) {
      document.addEventListener('paste', handlePaste);
    }

    return () => {
      document.removeEventListener('paste', handlePaste);
    };
  }, [enablePen]);

  // Track mouse position for paste location
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      window.lastMouseX = e.clientX;
      window.lastMouseY = e.clientY;
    };

    if (enablePen) {
      document.addEventListener('mousemove', handleMouseMove);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [enablePen]);

  // Handle dragging of pasted items
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingItem && selectedPastedItem) {
        setPastedItems(prev => prev.map(item => 
          item.id === selectedPastedItem 
            ? { 
                ...item, 
                x: Math.max(0, Math.min(window.innerWidth - 200, e.clientX - dragItemOffset.x)),
                y: Math.max(0, Math.min(window.innerHeight - 100, e.clientY - dragItemOffset.y))
              }
            : item
        ));
      }
    };

    const handleMouseUp = () => {
      setIsDraggingItem(false);
      setSelectedPastedItem(null);
    };

    if (isDraggingItem) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingItem, selectedPastedItem, dragItemOffset]);

  // Initialize BroadcastChannel for cross-tab communication
  useEffect(() => {
    broadcastChannelRef.current = new BroadcastChannel('pen-tool-sync');
    
    broadcastChannelRef.current.onmessage = (event) => {
      const { type, data } = event.data;
      
      switch (type) {
        case 'PEN_TOGGLE':
          setEnablePen(data.enabled);
          setShowToolPalette(data.enabled);
          break;
        case 'WHITEBOARD_TOGGLE':
          setEnableWhiteboard(data.enabled);
          setWhiteboardColor(data.color);
          break;
        case 'PEN_CONFIG':
          setPenColor(data.color);
          setPenSize(data.size);
          setPenType(data.type);
          setToolMode(data.toolMode);
          break;
        case 'CURSOR_UPDATE':
          updateGlobalCursor(data.enabled, data.type, data.toolMode);
          break;
      }
    };

    return () => {
      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.close();
      }
    };
  }, []);

  // Global cursor management
  const updateGlobalCursor = (enabled: boolean, type: 'draw' | 'highlight', mode: 'pen' | 'text' | 'eraser' | 'paste' | 'cursor') => {
    let cursorStyle = 'default';
    
    if (enabled && mode !== 'cursor') {
      if (mode === 'text') {
        cursorStyle = 'text';
      } else if (mode === 'paste') {
        cursorStyle = 'copy';
      } else if (mode === 'paste') {
        cursorStyle = 'copy';
      } else if (type === 'highlight') {
        cursorStyle = 'url("data:image/svg+xml;charset=utf8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23ffff00\' stroke-width=\'3\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpath d=\'M12 19l7-7 3 3-7 7-3-3z\'/%3E%3Cpath d=\'M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z\'/%3E%3Cpath d=\'M2 2l7.586 7.586\'/%3E%3Ccircle cx=\'11\' cy=\'11\' r=\'2\'/%3E%3C/svg%3E") 12 12, crosshair';
      } else {
        cursorStyle = 'url("data:image/svg+xml;charset=utf8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23000000\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpath d=\'M12 19l7-7 3 3-7 7-3-3z\'/%3E%3Cpath d=\'M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z\'/%3E%3Cpath d=\'M2 2l7.586 7.586\'/%3E%3Ccircle cx=\'11\' cy=\'11\' r=\'2\'/%3E%3C/svg%3E") 12 12, crosshair';
      }
    }
    
    document.body.style.cursor = cursorStyle;
    
    // Apply to all elements to ensure consistency
    const style = document.getElementById('global-cursor-style') || document.createElement('style');
    style.id = 'global-cursor-style';
    style.textContent = enabled && mode !== 'cursor'
      ? `* { cursor: ${cursorStyle} !important; }
         .tool-palette, .tool-palette *, .text-input, .pasted-item { cursor: default !important; }
         button, input, select, textarea, a { cursor: pointer !important; }`
      : '';
    
    if (enabled && mode !== 'cursor' && !document.head.contains(style)) {
      document.head.appendChild(style);
    } else if ((!enabled || mode === 'cursor') && document.head.contains(style)) {
      document.head.removeChild(style);
    }
  };

  // Broadcast pen state changes
  const broadcastPenState = (enabled: boolean) => {
    if (broadcastChannelRef.current) {
      broadcastChannelRef.current.postMessage({
        type: 'PEN_TOGGLE',
        data: { enabled }
      });
      
      broadcastChannelRef.current.postMessage({
        type: 'CURSOR_UPDATE',
        data: { enabled, type: penType, toolMode }
      });
    }
  };

  const broadcastWhiteboardState = (enabled: boolean, color: string) => {
    if (broadcastChannelRef.current) {
      broadcastChannelRef.current.postMessage({
        type: 'WHITEBOARD_TOGGLE',
        data: { enabled, color }
      });
    }
  };

  const broadcastPenConfig = () => {
    if (broadcastChannelRef.current) {
      broadcastChannelRef.current.postMessage({
        type: 'PEN_CONFIG',
        data: { color: penColor, size: penSize, type: penType, toolMode }
      });
    }
  };

  // Initialize canvas for drawing
  useEffect(() => {
    if (enablePen && canvasRef.current) {
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (context) {
        context.lineCap = 'round';
        context.lineJoin = 'round';
        contextRef.current = context;
        
        // Apply current pen settings
        updatePenSettings();
      }
    }
  }, [enablePen, penColor, penSize, penType]);

  // Function to update pen settings
  const updatePenSettings = () => {
    if (contextRef.current) {
      if (toolMode === 'eraser') {
        contextRef.current.globalCompositeOperation = 'destination-out';
        contextRef.current.lineWidth = penSize * 2;
      } else {
        contextRef.current.globalCompositeOperation = penType === 'highlight' ? 'multiply' : 'source-over';
        contextRef.current.strokeStyle = penType === 'highlight' ? `${penColor}80` : penColor;
        contextRef.current.lineWidth = penType === 'highlight' ? penSize * 3 : penSize;
      }
    }
  };

  // Update pen settings whenever color, size, type, or tool mode changes
  useEffect(() => {
    updatePenSettings();
  }, [penColor, penSize, penType, toolMode]);

  // Update global cursor when pen state changes
  useEffect(() => {
    updateGlobalCursor(enablePen, penType, toolMode);
    setShowToolPalette(enablePen);
    broadcastPenState(enablePen);
    
    return () => {
      if (!enablePen) {
        updateGlobalCursor(false, penType, toolMode);
      }
    };
  }, [enablePen, penType, toolMode]);

  // Broadcast config changes
  useEffect(() => {
    broadcastPenConfig();
  }, [penColor, penSize, penType, toolMode, textSize]);

  // Broadcast whiteboard changes
  useEffect(() => {
    broadcastWhiteboardState(enableWhiteboard, whiteboardColor);
  }, [enableWhiteboard, whiteboardColor]);

  // Resize canvas to match window size
  useEffect(() => {
    if (enablePen && canvasRef.current) {
      const canvas = canvasRef.current;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      const handleResize = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        // Reapply pen settings after resize
        if (contextRef.current) {
          contextRef.current.lineCap = 'round';
          contextRef.current.lineJoin = 'round';
          updatePenSettings();
        }
      };
      
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, [enablePen, penColor, penSize, penType]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!enablePen || toolMode !== 'text' || toolMode === 'cursor') return;
    
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const newTextInput = {
      id: Date.now().toString(),
      x,
      y,
      text: '',
      color: penColor,
      size: textSize
    };
    
    setTextInputs(prev => [...prev, newTextInput]);
    setActiveTextInput(newTextInput.id);
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!enablePen || !contextRef.current || toolMode === 'text' || toolMode === 'paste' || toolMode === 'cursor') return;
    
    // Ensure pen settings are applied before drawing
    updatePenSettings();
    
    setIsDrawing(true);
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    contextRef.current.beginPath();
    contextRef.current.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !enablePen || !contextRef.current || toolMode === 'text' || toolMode === 'paste' || toolMode === 'cursor') return;
    
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    contextRef.current.lineTo(x, y);
    contextRef.current.stroke();
  };

  const stopDrawing = () => {
    if (!enablePen || !contextRef.current || toolMode === 'text' || toolMode === 'paste' || toolMode === 'cursor') return;
    setIsDrawing(false);
    contextRef.current.closePath();
  };

  const clearCanvas = () => {
    if (canvasRef.current && contextRef.current) {
      contextRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
    setTextInputs([]);
    setActiveTextInput(null);
  };

  const clearAllPastedItems = () => {
    setPastedItems([]);
    setSelectedPastedItem(null);
  };

  const deletePastedItem = (id: string) => {
    setPastedItems(prev => prev.filter(item => item.id !== id));
    if (selectedPastedItem === id) {
      setSelectedPastedItem(null);
    }
  };

  const togglePen = () => {
    setEnablePen(!enablePen);
    if (!enablePen) {
      setEnableWhiteboard(false);
    }
  };

  const updateTextInput = (id: string, text: string) => {
    setTextInputs(prev => prev.map(input => 
      input.id === id ? { ...input, text } : input
    ));
  };

  const removeTextInput = (id: string) => {
    setTextInputs(prev => prev.filter(input => input.id !== id));
    if (activeTextInput === id) {
      setActiveTextInput(null);
    }
  };

  // Pasted item drag handlers
  const handlePastedItemMouseDown = (e: React.MouseEvent, itemId: string) => {
    e.stopPropagation();
    setSelectedPastedItem(itemId);
    setIsDraggingItem(true);
    
    const item = pastedItems.find(i => i.id === itemId);
    if (item) {
      setDragItemOffset({
        x: e.clientX - item.x,
        y: e.clientY - item.y
      });
    }
  };

  // Palette drag handlers
  const handlePaletteMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains('palette-header')) {
      setIsDraggingPalette(true);
      setDragOffset({
        x: e.clientX - palettePosition.x,
        y: e.clientY - palettePosition.y
      });
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingPalette) {
        setPalettePosition({
          x: Math.max(0, Math.min(window.innerWidth - 250, e.clientX - dragOffset.x)),
          y: Math.max(0, Math.min(window.innerHeight - 400, e.clientY - dragOffset.y))
        });
      }
    };

    const handleMouseUp = () => {
      setIsDraggingPalette(false);
    };

    if (isDraggingPalette) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingPalette, dragOffset]);

  const startRecording = async () => {
    try {
      // Get screen capture stream
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          mediaSource: 'screen'
        },
        audio: includeAudio
      });

      let finalStream = stream;

      // If microphone is enabled, get microphone stream and combine
      if (includeMicrophone) {
        try {
          const micStream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true
            }
          });

          // Create audio context to mix streams
          const audioContext = new AudioContext();
          const destination = audioContext.createMediaStreamDestination();

          // Add screen audio if available
          if (stream.getAudioTracks().length > 0) {
            const screenAudioSource = audioContext.createMediaStreamSource(stream);
            screenAudioSource.connect(destination);
          }

          // Add microphone audio
          const micAudioSource = audioContext.createMediaStreamSource(micStream);
          micAudioSource.connect(destination);

          // Combine video from screen with mixed audio
          const videoTrack = stream.getVideoTracks()[0];
          const mixedAudioTrack = destination.stream.getAudioTracks()[0];
          
          finalStream = new MediaStream([videoTrack, mixedAudioTrack]);

          // Store references for cleanup
          streamRef.current = finalStream;
          
          // Clean up original streams when recording stops
          const originalCleanup = () => {
            stream.getTracks().forEach(track => track.stop());
            micStream.getTracks().forEach(track => track.stop());
            audioContext.close();
          };

          // Override the cleanup function
          finalStream.addEventListener = stream.addEventListener.bind(stream);
          finalStream.originalCleanup = originalCleanup;

        } catch (micError) {
          console.warn('Microphone access denied or failed:', micError);
          alert('Microphone access was denied. Recording will continue with system audio only.');
          finalStream = stream;
        }
      }

      streamRef.current = finalStream;
      chunksRef.current = [];

      const mediaRecorder = new MediaRecorder(finalStream, {
        mimeType: 'video/webm;codecs=vp9'
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        setRecordedBlob(blob);
        setPreviewUrl(URL.createObjectURL(blob));
        
        // Clean up stream
        if (streamRef.current) {
          if (streamRef.current.originalCleanup) {
            streamRef.current.originalCleanup();
          } else {
            streamRef.current.getTracks().forEach(track => track.stop());
          }
        }
      };

      // Handle when user stops sharing screen
      finalStream.getVideoTracks()[0].addEventListener('ended', () => {
        stopRecording();
      });

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(1000); // Collect data every second
      
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Error starting screen recording:', error);
      alert('Error starting screen recording. Please ensure you granted screen sharing permissions.');
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      if (isPaused) {
        mediaRecorderRef.current.resume();
        setIsPaused(false);
        timerRef.current = setInterval(() => {
          setRecordingTime(prev => prev + 1);
        }, 1000);
      } else {
        mediaRecorderRef.current.pause();
        setIsPaused(true);
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
    
    setIsRecording(false);
    setIsPaused(false);
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  const downloadRecording = () => {
    if (recordedBlob) {
      downloadFile(recordedBlob, `screen_recording_${Date.now()}.webm`);
    }
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const resetRecording = () => {
    setRecordedBlob(null);
    setPreviewUrl('');
    setRecordingTime(0);
  };

  return (
    <div className="space-y-8">
      {/* Whiteboard Background */}
      {enablePen && enableWhiteboard && (
        <div
          className="fixed inset-0 z-30"
          style={{
            backgroundColor: whiteboardColor,
            pointerEvents: 'none'
          }}
        />
      )}

      {/* Pasted Items Overlay */}
      {enablePen && pastedItems.map(item => (
        <div
          key={item.id}
          className={`pasted-item fixed z-40 ${
            selectedPastedItem === item.id ? 'ring-2 ring-blue-500' : ''
          }`}
          style={{
            left: item.x,
            top: item.y,
            width: item.width || 'auto',
            height: item.height || 'auto',
            pointerEvents: 'auto'
          }}
          onMouseDown={(e) => handlePastedItemMouseDown(e, item.id)}
        >
          {item.type === 'image' && (
            <div className="relative group">
              <img
                src={item.content}
                alt="Pasted content"
                className="border border-gray-300 rounded shadow-lg object-contain"
                style={{
                  width: item.width,
                  height: item.height,
                  maxWidth: '100%',
                  maxHeight: '100%'
                }}
                draggable={false}
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deletePastedItem(item.id);
                }}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          
          {item.type === 'text' && (
            <div className="relative group bg-white border border-gray-300 rounded shadow-lg p-3 max-w-md">
              <pre
                className="whitespace-pre-wrap text-gray-800 text-sm leading-relaxed"
                style={{ fontSize: item.fontSize }}
              >
                {item.content}
              </pre>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deletePastedItem(item.id);
                }}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          
          {item.type === 'code' && (
            <div className="relative group bg-gray-900 border border-gray-700 rounded shadow-lg p-4 max-w-2xl">
              {item.language && (
                <div className="text-xs text-gray-400 mb-2 flex items-center">
                  <Code className="h-3 w-3 mr-1" />
                  {item.language}
                </div>
              )}
              <pre className="text-green-400 text-sm overflow-x-auto">
                <code style={{ fontSize: item.fontSize }}>
                  {item.content}
                </code>
              </pre>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deletePastedItem(item.id);
                }}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
      ))}

      {/* Drawing Canvas Overlay */}
      {enablePen && (
        <canvas
          ref={canvasRef}
          className={`fixed inset-0 z-40 ${toolMode === 'cursor' ? 'pointer-events-none' : 'pointer-events-auto'}`}
          style={{
            background: 'transparent',
            pointerEvents: enablePen && toolMode !== 'cursor' ? 'auto' : 'none'
          }}
          onClick={handleCanvasClick}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
        />
      )}

      {/* Text Inputs Overlay */}
      {enablePen && textInputs.map(textInput => (
        <div
          key={textInput.id}
          className="text-input fixed z-50"
          style={{
            left: textInput.x,
            top: textInput.y,
            color: textInput.color,
            fontSize: `${textInput.size}px`,
            fontWeight: 'bold',
            pointerEvents: 'auto'
          }}
        >
          {activeTextInput === textInput.id ? (
            <input
              type="text"
              value={textInput.text}
              onChange={(e) => updateTextInput(textInput.id, e.target.value)}
              onBlur={() => {
                if (!textInput.text.trim()) {
                  removeTextInput(textInput.id);
                } else {
                  setActiveTextInput(null);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setActiveTextInput(null);
                } else if (e.key === 'Escape') {
                  removeTextInput(textInput.id);
                }
              }}
              autoFocus
              className="bg-transparent border-none outline-none"
              style={{
                color: textInput.color,
                fontSize: `${textInput.size}px`,
                fontWeight: 'bold',
                minWidth: '100px'
              }}
            />
          ) : (
            <div
              onClick={() => setActiveTextInput(textInput.id)}
              className="cursor-pointer"
            >
              {textInput.text || 'Click to edit'}
            </div>
          )}
        </div>
      ))}

      {/* Floating Tool Palette */}
      {showToolPalette && (
        <div
          className="tool-palette fixed z-50 bg-white rounded-lg shadow-2xl border border-gray-200 p-4 min-w-[250px]"
          style={{
            left: palettePosition.x,
            top: palettePosition.y,
            cursor: isDraggingPalette ? 'grabbing' : 'grab'
          }}
          onMouseDown={handlePaletteMouseDown}
        >
          <div className="palette-header flex items-center justify-between mb-3 pb-2 border-b border-gray-200">
            <h3 className="font-semibold text-sm text-gray-800">Drawing Tools</h3>
            <button
              onClick={() => setEnablePen(false)}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          
          <div className="space-y-3">
            {/* Pen Toggle */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Pen Tool</span>
              <button
                onClick={togglePen}
                className={`w-10 h-6 rounded-full transition-colors ${
                  enablePen ? 'bg-blue-500' : 'bg-gray-300'
                }`}
              >
                <div
                  className={`w-4 h-4 bg-white rounded-full transition-transform ${
                    enablePen ? 'translate-x-5' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Whiteboard Toggle */}
            {enablePen && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Whiteboard</span>
                <button
                  onClick={() => setEnableWhiteboard(!enableWhiteboard)}
                  className={`w-10 h-6 rounded-full transition-colors ${
                    enableWhiteboard ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`w-4 h-4 bg-white rounded-full transition-transform ${
                      enableWhiteboard ? 'translate-x-5' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            )}

            {/* Whiteboard Color */}
            {enablePen && enableWhiteboard && (
              <div>
                <label className="text-sm text-gray-700 block mb-1">Board Color</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={whiteboardColor}
                    onChange={(e) => setWhiteboardColor(e.target.value)}
                    className="w-8 h-8 rounded border border-gray-300"
                  />
                  <input
                    type="text"
                    value={whiteboardColor}
                    onChange={(e) => setWhiteboardColor(e.target.value)}
                    className="flex-1 text-sm border border-gray-300 rounded px-2 py-1"
                  />
                </div>
              </div>
            )}

            {/* Tool Mode */}
            {enablePen && (
              <div>
                <label className="text-sm text-gray-700 block mb-1">Tool Mode</label>
                <div className="grid grid-cols-3 gap-1 mb-2">
                  <button
                    onClick={() => setToolMode('pen')}
                    className={`text-xs py-2 px-2 rounded flex items-center justify-center ${
                      toolMode === 'pen' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    <Edit3 className="h-3 w-3 mr-1" />
                    <span className="ml-1">Pen</span>
                  </button>
                  <button
                    onClick={() => setToolMode('text')}
                    className={`text-xs py-2 px-2 rounded flex items-center justify-center ${
                      toolMode === 'text' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    <Type className="h-3 w-3 mr-1" />
                    <span className="ml-1">Text</span>
                  </button>
                  <button
                    onClick={() => setToolMode('eraser')}
                    className={`text-xs py-2 px-2 rounded flex items-center justify-center ${
                      toolMode === 'eraser' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    <Eraser className="h-3 w-3 mr-1" />
                    <span className="ml-1">Erase</span>
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-1">
                  <button
                    onClick={() => setToolMode('paste')}
                    className={`text-xs py-2 px-2 rounded flex items-center justify-center ${
                      toolMode === 'paste' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    <Palette className="h-3 w-3" />
                    <span className="ml-1">Paste</span>
                  </button>
                  <button
                    onClick={() => setToolMode('cursor')}
                    className={`text-xs py-2 px-2 rounded flex items-center justify-center ${
                      toolMode === 'cursor' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    <MousePointer className="h-3 w-3" />
                    <span className="ml-1">Cursor</span>
                  </button>
                  <button
                    onClick={() => setToolMode('paste')}
                    className={`text-xs py-2 px-2 rounded flex items-center justify-center ${
                      toolMode === 'paste' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    <Clipboard className="h-3 w-3 mr-1" />
                    Paste
                  </button>
                </div>
              </div>
            )}

            {/* Paste Mode Instructions */}
            {enablePen && toolMode === 'paste' && (
              <div className="bg-blue-50 border border-blue-200 rounded p-2">
                <div className="text-xs text-blue-800">
                  <strong>Paste Mode Active</strong>
                  <br />
                  • Press Ctrl+V to paste text, code, or images
                  • Drag items to reposition them
                  • Auto-detects code vs regular text
                  • Click X to delete individual items
                </div>
              </div>
            )}

            {/* Pen Type (only for pen mode, not eraser) */}
            {enablePen && toolMode === 'pen' && (
              <div>
                <label className="text-sm text-gray-700 block mb-1">Pen Type</label>
                <select
                  value={penType}
                  onChange={(e) => setPenType(e.target.value as 'draw' | 'highlight')}
                  className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                >
                  <option value="draw">Draw</option>
                  <option value="highlight">Highlight</option>
                </select>
              </div>
            )}

            {/* Color Picker */}
            {enablePen && toolMode !== 'cursor' && toolMode !== 'paste' && (
              <div>
                <label className="text-sm text-gray-700 block mb-1">
                  {toolMode === 'text' ? 'Text Color' : toolMode === 'eraser' ? 'Eraser' : 'Pen Color'}
                </label>
                {toolMode !== 'eraser' && toolMode !== 'paste' ? (
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={penColor}
                      onChange={(e) => setPenColor(e.target.value)}
                      className="w-8 h-8 rounded border border-gray-300"
                    />
                    <input
                      type="text"
                      value={penColor}
                      onChange={(e) => setPenColor(e.target.value)}
                      className="flex-1 text-sm border border-gray-300 rounded px-2 py-1"
                    />
                  </div>
                ) : toolMode === 'eraser' ? (
                  <div className="text-sm text-gray-500 italic">
                    Eraser removes drawings
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 italic">
                    Use Ctrl+V to paste content
                  </div>
                )}
              </div>
            )}

            {/* Cursor Mode Info */}
            {enablePen && toolMode === 'cursor' && (
              <div className="bg-green-50 p-3 rounded border border-green-200">
                <h4 className="text-sm font-medium text-green-900 mb-2">Cursor Mode Active</h4>
                <div className="text-xs text-green-800 space-y-1">
                  <p>• Normal cursor behavior</p>
                  <p>• Click and interact normally</p>
                  <p>• Switch to other tools to draw</p>
                  <p>• Canvas interactions disabled</p>
                </div>
              </div>
            )}

            {/* Pen Size Slider */}
            {enablePen && toolMode === 'pen' && (
              <div>
                <label className="text-sm text-gray-700 block mb-1">
                  Pen Thickness: {penSize}px
                </label>
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={penSize}
                  onChange={(e) => setPenSize(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            )}

            {/* Eraser Size Slider */}
            {enablePen && toolMode === 'eraser' && (
              <div>
                <label className="text-sm text-gray-700 block mb-1">
                  Eraser Size: {penSize * 2}px
                </label>
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={penSize}
                  onChange={(e) => setPenSize(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            )}

            {/* Text Size Slider */}
            {enablePen && toolMode === 'text' && (
              <div>
                <label className="text-sm text-gray-700 block mb-1">
                  Text Size: {textSize}px
                </label>
                <input
                  type="range"
                  min="8"
                  max="48"
                  value={textSize}
                  onChange={(e) => setTextSize(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            )}

            {/* Highlight Size (only for highlight mode) */}
            {enablePen && toolMode === 'pen' && penType === 'highlight' && (
              <div>
                <label className="text-sm text-gray-700 block mb-1">
                  Highlight Thickness: {penSize * 3}px
                </label>
                <input
                  type="range"
                  min="1"
                  max="15"
                  value={penSize}
                  onChange={(e) => setPenSize(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            )}

            {/* Action Buttons */}
            {enablePen && (
              <div className="flex space-x-2 pt-2">
                <button
                  onClick={clearCanvas}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white text-sm py-2 px-3 rounded flex items-center justify-center"
                >
                  <Eraser className="mr-1 h-3 w-3" />
                  Clear Canvas
                </button>
                {pastedItems.length > 0 && (
                  <button
                    onClick={clearAllPastedItems}
                    className="flex-1 bg-orange-500 hover:bg-orange-600 text-white text-sm py-2 px-3 rounded flex items-center justify-center"
                  >
                    <Trash2 className="mr-1 h-3 w-3" />
                    Clear Paste
                  </button>
                )}
              </div>
            )}

            {/* Pasted Items Counter */}
            {enablePen && pastedItems.length > 0 && (
              <div className="text-xs text-gray-500 text-center">
                {pastedItems.length} pasted item{pastedItems.length !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Screen Recorder</h1>
        <p className="text-gray-600">
          Record your screen with audio, drawing annotations, whiteboard, and paste functionality directly in the browser
        </p>
      </div>

      {/* Recording Controls */}
      <Card className="p-6">
        <div className="text-center space-y-6">
          {/* Status Display */}
          <div className="flex items-center justify-center space-x-4">
            <div className={`w-4 h-4 rounded-full ${
              isRecording 
                ? isPaused 
                  ? 'bg-yellow-500 animate-pulse' 
                  : 'bg-red-500 animate-pulse'
                : 'bg-gray-400'
            }`} />
            <span className="text-2xl font-mono font-bold">
              {formatTime(recordingTime)}
            </span>
            <span className="text-sm text-gray-500">
              {isRecording 
                ? isPaused 
                  ? 'PAUSED' 
                  : 'RECORDING'
                : 'READY'}
            </span>
          </div>

          {/* Settings */}
          <div className="flex items-center justify-center space-x-6 flex-wrap gap-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={includeAudio}
                onChange={(e) => setIncludeAudio(e.target.checked)}
                disabled={isRecording}
                className="rounded"
              />
              <Volume2 className="h-4 w-4" />
              <span>Include Audio</span>
            </label>
            
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={includeMicrophone}
                onChange={(e) => setIncludeMicrophone(e.target.checked)}
                disabled={isRecording}
                className="rounded"
              />
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
              <span>Include Microphone</span>
            </label>
            
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={enablePen}
                onChange={(e) => setEnablePen(e.target.checked)}
                className="rounded"
              />
              <Edit3 className="h-4 w-4" />
              <span>Enable Drawing Tools</span>
            </label>
          </div>

          {/* Control Buttons */}
          <div className="flex justify-center space-x-4">
            {!isRecording ? (
              <Button 
                onClick={startRecording}
                size="lg"
                className="bg-red-600 hover:bg-red-700"
              >
                <Video className="mr-2 h-5 w-5" />
                Start Recording
              </Button>
            ) : (
              <>
                <Button
                  onClick={pauseRecording}
                  variant="outline"
                  size="lg"
                >
                  {isPaused ? (
                    <>
                      <Play className="mr-2 h-5 w-5" />
                      Resume
                    </>
                  ) : (
                    <>
                      <Pause className="mr-2 h-5 w-5" />
                      Pause
                    </>
                  )}
                </Button>
                <Button
                  onClick={stopRecording}
                  variant="outline"
                  size="lg"
                >
                  <Square className="mr-2 h-5 w-5" />
                  Stop
                </Button>
              </>
            )}
          </div>
        </div>
      </Card>

      {/* Preview and Download */}
      {previewUrl && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Video className="mr-2 h-5 w-5" />
            Recording Preview
          </h2>
          
          <div className="space-y-4">
            <video
              src={previewUrl}
              controls
              className="w-full max-h-96 rounded-lg"
            />
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Button onClick={downloadRecording} className="flex-1">
                <Download className="mr-2 h-4 w-4" />
                Download Recording
              </Button>
              <Button onClick={resetRecording} variant="outline" className="flex-1">
                Record Again
              </Button>
            </div>
            
            <div className="text-sm text-gray-500 text-center">
              Recording saved as WebM format • Duration: {formatTime(recordingTime)}
            </div>
          </div>
        </Card>
      )}

      {/* Instructions */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">How to Use Screen Recorder with Whiteboard & Paste</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h3 className="font-medium mb-2 flex items-center">
              <Monitor className="mr-2 h-4 w-4" />
              Recording Options
            </h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Record entire screen or specific application</li>
              <li>• Optional system audio and microphone recording</li>
              <li>• Automatic audio mixing when both are enabled</li>
              <li>• Pause and resume functionality</li>
              <li>• Real-time recording timer</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium mb-2 flex items-center">
              <Edit3 className="mr-2 h-4 w-4" />
              Drawing Tools & Whiteboard
            </h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Floating tool palette with drag support</li>
              <li>• Whiteboard with customizable background color</li>
              <li>• Pen, text, eraser, and paste tools</li>
              <li>• Draw and highlight modes with thickness control</li>
              <li>• Customizable text size and pen thickness</li>
              <li>• Click-to-add text annotations</li>
              <li>• Eraser tool for selective removal</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium mb-2 flex items-center">
              <Clipboard className="mr-2 h-4 w-4" />
              Paste Functionality
            </h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Paste images from clipboard (Ctrl+V)</li>
              <li>• Paste code with syntax detection</li>
              <li>• Paste regular text with formatting</li>
              <li>• Drag to reposition pasted items</li>
              <li>• Auto-detects programming languages</li>
              <li>• Delete individual pasted items</li>
              <li>• Works like Notion's paste system</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* New Paste Features Notice */}
      <Card className="p-6 bg-purple-50 border-purple-200">
        <h2 className="text-xl font-semibold mb-4 text-purple-900">✨ New Paste Features</h2>
        <div className="text-purple-800 text-sm space-y-2">
          <p>🖼️ <strong>Image Paste:</strong> Copy images from anywhere and paste with Ctrl+V</p>
          <p>💻 <strong>Smart Code Detection:</strong> Automatically detects JavaScript, Python, Java, C/C++, Rust, PHP, SQL, HTML, CSS, and JSON</p>
          <p>📝 <strong>Text Paste:</strong> Regular text with proper formatting and sizing</p>
          <p>🎯 <strong>Drag & Drop:</strong> Click and drag any pasted item to reposition</p>
          <p>🗑️ <strong>Individual Delete:</strong> Hover over items to see delete button</p>
          <p>🔧 <strong>Paste Mode:</strong> Dedicated paste tool mode in the palette</p>
          <p>🎨 <strong>Syntax Highlighting:</strong> Code blocks display with dark theme and language labels</p>
          <p>💡 <strong>Pro Tip:</strong> Switch to paste mode, then use Ctrl+V to paste images, code, or text anywhere on the whiteboard!</p>
        </div>
      </Card>

      {/* Browser Support Notice */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h2 className="text-xl font-semibold mb-4 text-blue-900">Browser Compatibility</h2>
        <p className="text-blue-800 text-sm">
          Screen recording requires a modern browser with MediaRecorder API support. 
          Works best in Chrome, Firefox, and Edge. Safari support may be limited. 
          Microphone recording requires additional permissions. Drawing, whiteboard, and paste features work within the browser window and will be captured when recording the browser.
          Paste functionality requires clipboard access permissions.
        </p>
      </Card>
    </div>
  );
};