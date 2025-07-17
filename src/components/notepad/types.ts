export interface Note {
  id: string;
  title: string;
  content: string;
  folderId?: string;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  isDeleted: boolean;
}

export interface Folder {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
}

export interface MediaFile {
  id: string;
  name: string;
  type: string;
  data: string; // base64 or blob URL
  size: number;
  noteId: string;
}

export interface AppSettings {
  darkMode: boolean;
  fontSize: number;
  fontFamily: string;
  autoSave: boolean;
  autoBackup: boolean;
}

export interface SearchFilters {
  query: string;
  tags: string[];
  folderId?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
}