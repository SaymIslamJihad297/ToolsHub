import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Note, Folder, MediaFile, AppSettings } from '../types';

interface NotepadState {
  notes: Note[];
  folders: Folder[];
  mediaFiles: MediaFile[];
  settings: AppSettings;
  selectedNote: string | null;
  selectedFolder: string | null;
  searchQuery: string;
  darkMode: boolean;

  // Actions
  createNote: (folderId?: string) => Note;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  restoreNote: (id: string) => void;

  createFolder: () => Folder;
  updateFolder: (id: string, updates: Partial<Folder>) => void;
  deleteFolder: (id: string) => void;

  addMediaFile: (file: Omit<MediaFile, 'id'>) => MediaFile;
  removeMediaFile: (id: string) => void;

  setSelectedNote: (id: string | null) => void;
  setSelectedFolder: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  toggleDarkMode: () => void;

  // Computed
  filteredNotes: () => Note[];
  deletedNotes: () => Note[];
  recentNotes: () => Note[];

  // Utilities
  exportNote: (id: string, format: 'txt' | 'html' | 'pdf') => void;
  importNotes: (files: FileList) => Promise<void>;
  backupData: () => string;
  restoreData: (data: string) => void;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

export const useNotepadStore = create<NotepadState>()(
  persist(
    (set, get) => ({
      notes: [],
      folders: [],
      mediaFiles: [],
      settings: {
        darkMode: false,
        fontSize: 14,
        fontFamily: 'Inter',
        autoSave: true,
        autoBackup: true,
      },
      selectedNote: null,
      selectedFolder: null,
      searchQuery: '',
      darkMode: false,

      createNote: (folderId) => {
        const note: Note = {
          id: generateId(),
          title: 'Untitled Note',
          content: '',
          folderId,
          createdAt: new Date(),
          updatedAt: new Date(),
          tags: [],
          isDeleted: false,
        };

        set((state) => ({
          notes: [...state.notes, note],
        }));

        return note;
      },

      updateNote: (id, updates) => {
        set((state) => ({
          notes: state.notes.map((note) =>
            note.id === id
              ? { ...note, ...updates, updatedAt: new Date() }
              : note
          ),
        }));
      },

      deleteNote: (id) => {
        set((state) => ({
          notes: state.notes.filter((note) => note.id !== id),
        }));
      },


      restoreNote: (id) => {
        set((state) => ({
          notes: state.notes.map((note) =>
            note.id === id ? { ...note, isDeleted: false } : note
          ),
        }));
      },

      createFolder: () => {
        const folder: Folder = {
          id: generateId(),
          name: 'New Folder',
          createdAt: new Date(),
          updatedAt: new Date(),
          isDeleted: false,
        };

        set((state) => ({
          folders: [...state.folders, folder],
        }));

        return folder;
      },

      updateFolder: (id, updates) => {
        set((state) => ({
          folders: state.folders.map((folder) =>
            folder.id === id
              ? { ...folder, ...updates, updatedAt: new Date() }
              : folder
          ),
        }));
      },

      deleteFolder: (id) => {
        set((state) => ({
          folders: state.folders.map((folder) =>
            folder.id === id ? { ...folder, isDeleted: true } : folder
          ),
          notes: state.notes.map((note) =>
            note.folderId === id ? { ...note, isDeleted: true } : note
          ),
        }));
      },

      addMediaFile: (file) => {
        const mediaFile: MediaFile = {
          ...file,
          id: generateId(),
        };

        set((state) => ({
          mediaFiles: [...state.mediaFiles, mediaFile],
        }));

        return mediaFile;
      },

      removeMediaFile: (id) => {
        set((state) => ({
          mediaFiles: state.mediaFiles.filter((file) => file.id !== id),
        }));
      },

      setSelectedNote: (id) => set({ selectedNote: id }),
      setSelectedFolder: (id) => set({ selectedFolder: id }),
      setSearchQuery: (query) => set({ searchQuery: query }),

      toggleDarkMode: () => {
        set((state) => {
          const newDarkMode = !state.darkMode;
          return {
            darkMode: newDarkMode,
            settings: { ...state.settings, darkMode: newDarkMode },
          };
        });
      },

      filteredNotes: () => {
        const { notes, searchQuery, selectedFolder } = get();
        return notes.filter((note) => {
          if (note.isDeleted) return false;

          const matchesSearch = !searchQuery ||
            note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
            note.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

          const matchesFolder = !selectedFolder || note.folderId === selectedFolder;

          return matchesSearch && matchesFolder;
        });
      },

      deletedNotes: () => {
        const { notes } = get();
        return notes.filter((note) => note.isDeleted);
      },

      recentNotes: () => {
        const { notes } = get();
        return notes
          .filter((note) => !note.isDeleted)
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
          .slice(0, 10);
      },

      exportNote: (id, format) => {
        const { notes } = get();
        const note = notes.find((n) => n.id === id);
        if (!note) return;

        let content = '';
        let filename = '';
        let mimeType = '';

        switch (format) {
          case 'txt':
            content = `${note.title}\n\n${note.content.replace(/<[^>]*>/g, '')}`;
            filename = `${note.title}.txt`;
            mimeType = 'text/plain';
            break;
          case 'html':
            content = `
              <!DOCTYPE html>
              <html>
                <head>
                  <title>${note.title}</title>
                  <meta charset="utf-8">
                  <style>
                    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
                    h1 { color: #333; border-bottom: 2px solid #eee; padding-bottom: 10px; }
                  </style>
                </head>
                <body>
                  <h1>${note.title}</h1>
                  <div>${note.content}</div>
                </body>
              </html>
            `;
            filename = `${note.title}.html`;
            mimeType = 'text/html';
            break;
        }

        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
      },

      importNotes: async (files) => {
        // Implementation for importing files
        console.log('Import functionality to be implemented');
      },

      backupData: () => {
        const { notes, folders, mediaFiles, settings } = get();
        return JSON.stringify({
          notes,
          folders,
          mediaFiles,
          settings,
          exportDate: new Date().toISOString(),
        });
      },

      restoreData: (data) => {
        try {
          const parsed = JSON.parse(data);
          set({
            notes: parsed.notes || [],
            folders: parsed.folders || [],
            mediaFiles: parsed.mediaFiles || [],
            settings: parsed.settings || get().settings,
          });
        } catch (error) {
          console.error('Failed to restore data:', error);
        }
      },
    }),
    {
      name: 'notepad-storage',
      partialize: (state) => ({
        notes: state.notes,
        folders: state.folders,
        mediaFiles: state.mediaFiles,
        settings: state.settings,
        darkMode: state.darkMode,
      }),
    }
  )
);