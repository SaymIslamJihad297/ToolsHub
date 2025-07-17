import React, { useState, useRef } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { 
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight,
  List, ListOrdered, Download, Save, FileText, Type
} from 'lucide-react';
import { downloadFile } from '../../utils/fileHelpers';
import jsPDF from 'jspdf';

export const WordEditor: React.FC = () => {
  const [content, setContent] = useState('');
  const [fontSize, setFontSize] = useState(16);
  const [fontFamily, setFontFamily] = useState('Arial, sans-serif');
  const editorRef = useRef<HTMLDivElement>(null);

  const executeCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      setContent(editorRef.current.innerHTML);
    }
  };

  const handleContentChange = () => {
    if (editorRef.current) {
      setContent(editorRef.current.innerHTML);
    }
  };

  const downloadAsText = () => {
    const text = editorRef.current?.innerText || '';
    const blob = new Blob([text], { type: 'text/plain' });
    downloadFile(blob, `document_${Date.now()}.txt`);
  };

  const downloadAsHTML = () => {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Document</title>
          <style>
            body {
              font-family: ${fontFamily};
              font-size: ${fontSize}px;
              line-height: 1.6;
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
            }
          </style>
        </head>
        <body>
          ${content}
        </body>
      </html>
    `;
    const blob = new Blob([html], { type: 'text/html' });
    downloadFile(blob, `document_${Date.now()}.html`);
  };

  const downloadAsPDF = () => {
    const pdf = new jsPDF();
    const text = editorRef.current?.innerText || '';
    const lines = text.split('\n');
    let yPosition = 20;
    
    lines.forEach((line) => {
      if (yPosition > 250) {
        pdf.addPage();
        yPosition = 20;
      }
      pdf.text(line, 20, yPosition);
      yPosition += 10;
    });
    
    pdf.save(`document_${Date.now()}.pdf`);
  };

  const insertTable = () => {
    const tableHTML = `
      <table border="1" style="border-collapse: collapse; width: 100%;">
        <tr>
          <td style="padding: 8px;">Cell 1</td>
          <td style="padding: 8px;">Cell 2</td>
        </tr>
        <tr>
          <td style="padding: 8px;">Cell 3</td>
          <td style="padding: 8px;">Cell 4</td>
        </tr>
      </table>
    `;
    document.execCommand('insertHTML', false, tableHTML);
    handleContentChange();
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Online Word Editor</h1>
        <p className="text-gray-600">
          Full-featured document editor with export options
        </p>
      </div>

      {/* Toolbar */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-2 items-center">
          {/* Font Settings */}
          <div className="flex items-center gap-2 mr-4">
            <select
              value={fontFamily}
              onChange={(e) => setFontFamily(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded text-sm"
            >
              <option value="Arial, sans-serif">Arial</option>
              <option value="Georgia, serif">Georgia</option>
              <option value="'Times New Roman', serif">Times New Roman</option>
              <option value="'Courier New', monospace">Courier New</option>
              <option value="Helvetica, sans-serif">Helvetica</option>
            </select>
            
            <select
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="px-3 py-1 border border-gray-300 rounded text-sm w-16"
            >
              {[10, 12, 14, 16, 18, 20, 24, 28, 32].map(size => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </div>

          {/* Text Formatting */}
          <div className="flex gap-1 mr-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => executeCommand('bold')}
            >
              <Bold className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => executeCommand('italic')}
            >
              <Italic className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => executeCommand('underline')}
            >
              <Underline className="h-4 w-4" />
            </Button>
          </div>

          {/* Alignment */}
          <div className="flex gap-1 mr-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => executeCommand('justifyLeft')}
            >
              <AlignLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => executeCommand('justifyCenter')}
            >
              <AlignCenter className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => executeCommand('justifyRight')}
            >
              <AlignRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Lists */}
          <div className="flex gap-1 mr-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => executeCommand('insertUnorderedList')}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => executeCommand('insertOrderedList')}
            >
              <ListOrdered className="h-4 w-4" />
            </Button>
          </div>

          {/* Insert */}
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={insertTable}
            >
              Table
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => executeCommand('createLink', prompt('Enter URL:') || '')}
            >
              Link
            </Button>
          </div>
        </div>
      </Card>

      {/* Editor */}
      <Card className="p-0 overflow-hidden">
        <div
          ref={editorRef}
          contentEditable
          onInput={handleContentChange}
          className="min-h-96 p-6 focus:outline-none"
          style={{
            fontFamily,
            fontSize: `${fontSize}px`,
            lineHeight: '1.6'
          }}
          suppressContentEditableWarning={true}
        >
          <p>Start typing your document here...</p>
          <p>You can use the toolbar above to format your text, add lists, tables, and more.</p>
        </div>
      </Card>

      {/* Export Options */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <Download className="mr-2 h-5 w-5" />
          Export Document
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button onClick={downloadAsText} variant="outline" className="flex items-center justify-center">
            <FileText className="mr-2 h-4 w-4" />
            Download as TXT
          </Button>
          <Button onClick={downloadAsHTML} variant="outline" className="flex items-center justify-center">
            <Type className="mr-2 h-4 w-4" />
            Download as HTML
          </Button>
          <Button onClick={downloadAsPDF} variant="outline" className="flex items-center justify-center">
            <Download className="mr-2 h-4 w-4" />
            Download as PDF
          </Button>
        </div>
      </Card>

      {/* Features Info */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Editor Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Type className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="font-medium mb-2">Rich Formatting</h3>
            <p className="text-sm text-gray-600">Bold, italic, underline, fonts, and sizes</p>
          </div>
          <div className="text-center p-4">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <List className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="font-medium mb-2">Lists & Tables</h3>
            <p className="text-sm text-gray-600">Ordered lists, bullet points, and tables</p>
          </div>
          <div className="text-center p-4">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Download className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="font-medium mb-2">Multiple Export</h3>
            <p className="text-sm text-gray-600">TXT, HTML, and PDF formats</p>
          </div>
        </div>
      </Card>
    </div>
  );
};