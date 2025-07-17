import React, { useState } from 'react';
import { useNotepadStore } from './store/notepadStore';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  FileText, 
  Trash2,
  Clock,
  Edit2,
  X
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  onCreateNote: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  onToggleCollapse,
  onCreateNote,
}) => {
  const {
    notes,
    selectedNote,
    setSelectedNote,
    updateNote,
    deleteNote,
    filteredNotes,
    recentNotes,
    deletedNotes,
  } = useNotepadStore();

  const [activeTab, setActiveTab] = useState<'all' | 'recent' | 'trash'>('all');
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [noteTitle, setNoteTitle] = useState('');

  const activeNotes = filteredNotes();

  const handleNoteEdit = (noteId: string, title: string) => {
    setEditingNote(noteId);
    setNoteTitle(title);
  };

  const saveNoteTitle = () => {
    if (editingNote && noteTitle.trim()) {
      updateNote(editingNote, { title: noteTitle.trim() });
    }
    setEditingNote(null);
    setNoteTitle('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveNoteTitle();
    } else if (e.key === 'Escape') {
      setEditingNote(null);
      setNoteTitle('');
    }
  };

  if (collapsed) {
    return (
      <div className="h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={onToggleCollapse}
            className="w-full flex items-center justify-center p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
        
        <div className="flex-1 p-2 space-y-2">
          <button
            onClick={onCreateNote}
            className="w-full p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg flex items-center justify-center"
            title="Create Note"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Notes</h2>
          <button
            onClick={onToggleCollapse}
            className="p-1 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        </div>
        
        <button
          onClick={onCreateNote}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm flex items-center justify-center"
        >
          <Plus className="h-4 w-4 mr-1" />
          New Note
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <div className="flex">
          {[
            { id: 'all', label: 'All', icon: FileText },
            { id: 'recent', label: 'Recent', icon: Clock },
            { id: 'trash', label: 'Trash', icon: Trash2 },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <Icon className="h-4 w-4 mx-auto" />
              <span className="block mt-1">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'all' && (
          <div className="p-4">
            <div className="space-y-1">
              {activeNotes.map((note) => (
                <div
                  key={note.id}
                  className={`group flex items-center p-2 rounded-lg cursor-pointer transition-colors ${
                    selectedNote === note.id
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                  onClick={() => setSelectedNote(note.id)}
                >
                  <FileText className="h-4 w-4 mr-2 flex-shrink-0" />
                  {editingNote === note.id ? (
                    <input
                      type="text"
                      value={noteTitle}
                      onChange={(e) => setNoteTitle(e.target.value)}
                      onBlur={saveNoteTitle}
                      onKeyDown={handleKeyPress}
                      className="flex-1 bg-transparent border-none outline-none text-sm"
                      autoFocus
                    />
                  ) : (
                    <span className="flex-1 text-sm truncate">{note.title}</span>
                  )}
                  <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNoteEdit(note.id, note.title);
                      }}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                    >
                      <Edit2 className="h-3 w-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNote(note.id);
                      }}
                      className="p-1 hover:bg-red-200 dark:hover:bg-red-900/30 rounded text-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'recent' && (
          <div className="p-4">
            <div className="space-y-1">
              {recentNotes().map((note) => (
                <div
                  key={note.id}
                  className={`flex items-center p-2 rounded-lg cursor-pointer transition-colors ${
                    selectedNote === note.id
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                  onClick={() => setSelectedNote(note.id)}
                >
                  <FileText className="h-4 w-4 mr-2 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm truncate">{note.title}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(note.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'trash' && (
          <div className="p-4">
            <div className="space-y-1">
              {deletedNotes().map((note) => (
                <div
                  key={note.id}
                  className="flex items-center p-2 rounded-lg text-gray-500 dark:text-gray-400"
                >
                  <Trash2 className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span className="flex-1 text-sm truncate">{note.title}</span>
                  <button
                    onClick={() => {
                      // Restore note functionality
                      console.log('Restore note:', note.id);
                    }}
                    className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
                  >
                    Restore
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};