import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { ToolsPage } from './pages/ToolsPage';
import { ImageEnhancer } from './components/tools/ImageEnhancer';
import { Translator } from './components/tools/Translator';
import { OCR } from './components/tools/OCR';
import { TextToSpeech } from './components/tools/TextToSpeech';
import { WordEditor } from './components/tools/WordEditor';
import { FileConverter } from './components/tools/FileConverter';
import { BackgroundRemover } from './components/tools/BackgroundRemover';
import { ScreenRecorder } from './components/tools/ScreenRecorder';
import { NotepadApp } from './components/notepad/store/NotepadApp';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/tools" element={<ToolsPage />} />
          <Route path="/tools/image-enhancer" element={<ImageEnhancer />} />
          <Route path="/tools/translator" element={<Translator />} />
          <Route path="/tools/ocr" element={<OCR />} />
          <Route path="/tools/text-to-speech" element={<TextToSpeech />} />
          <Route path="/tools/word-editor" element={<WordEditor />} />
          <Route path="/tools/file-converter" element={<FileConverter />} />
          <Route path="/tools/background-remover" element={<BackgroundRemover />} />
          <Route path="/tools/screen-recorder" element={<ScreenRecorder />} />
          <Route path='/tools/notepad' element={<NotepadApp />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;