import React, { useState, useEffect } from 'react';
import { Sidebar } from '../Sidebar';
import { NoteEditor } from '../NoteEditor';
import { SearchBar } from './SearchBar';
import { ThemeToggle } from '../ThemeToggle';
import { useNotepadStore } from '../store/notepadStore';
import { Note } from './types';
import { Moon, Sun, FileText } from 'lucide-react';

export const NotepadApp: React.FC = () => {
  const {
    notes,
    selectedNote,
    darkMode,
    searchQuery,
    setSelectedNote,
    toggleDarkMode,
    setSearchQuery,
    createNote,
    filteredNotes
  } = useNotepadStore();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const handleCreateNote = () => {
    const note = createNote();
    setSelectedNote(note.id);
  };

  return (
    <div className={`min-h-screen transition-colors duration-200 ${
      darkMode ? 'dark bg-gray-900' : 'bg-gray-50'
    }`}>
      <div className="flex h-screen">
        {/* Sidebar */}
        <div className={`transition-all duration-300 ${
          sidebarCollapsed ? 'w-16' : 'w-80'
        } border-r border-gray-200 dark:border-gray-700`}>
          <Sidebar
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
            onCreateNote={handleCreateNote}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="h-16 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-between px-6">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                {selectedNote ? notes.find(n => n.id === selectedNote)?.title || 'Untitled Note' : 'Notepad'}
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <SearchBar />
              <ThemeToggle />
            </div>
          </div>

          {/* Editor Area */}
          <div className="flex-1 overflow-hidden">
            {selectedNote ? (
              <NoteEditor noteId={selectedNote} />
            ) : (
              <div className="h-full flex items-center justify-center bg-white dark:bg-gray-800">
                <div className="text-center">
                  <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
                    Welcome to Notepad
                  </h2>
                  <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md">
                    Create a new note or select an existing one to start writing. 
                    All your notes are saved locally and persist across sessions.
                  </p>
                  <div className="space-x-3">
                    <button
                      onClick={handleCreateNote}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      Create Note
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotepadApp