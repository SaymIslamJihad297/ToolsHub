import React from 'react';
import { useNotepadStore } from './store/notepadStore';
import { Moon, Sun } from 'lucide-react';

export const ThemeToggle: React.FC = () => {
  const { darkMode, toggleDarkMode } = useNotepadStore();

  return (
    <button
      onClick={toggleDarkMode}
      className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
      title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {darkMode ? (
        <Sun className="h-5 w-5" />
      ) : (
        <Moon className="h-5 w-5" />
      )}
    </button>
  );
};