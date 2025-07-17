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
  Save
} from 'lucide-react';

interface NoteEditorProps {
  noteId: string;
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

  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

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

      // Show saving feedback for a brief moment
      setTimeout(() => {
        setIsSaving(false);
      }, 500);
    }
  };

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
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

        // Update content
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
    // Keyboard shortcuts
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
          // Save is automatic, but we can show a save indicator
          break;
      }
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
    <div className="h-full flex flex-col bg-white dark:bg-gray-800">
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

                // Step 1: Run execCommand with placeholder size
                execCommand('fontSize', '7'); // size="7" is used to find it later

                // Step 2: Replace the inserted <font size="7"> with a <span style="font-size:XXpx">
                const editor = editorRef.current;
                if (!editor) return;

                // Find all <font size="7"> and replace them
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

                editor.focus();
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

      {/* Editor */}
      <div className="flex-1 overflow-y-auto">
        <div
          ref={editorRef}
          contentEditable
          onInput={handleContentChange}
          onPaste={handlePaste}
          onKeyDown={handleKeyDown}
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
            {isSaving ? 'Saving...' : 'Auto-saved'}
          </div>
        </div>
      </div>
    </div>
  );
};