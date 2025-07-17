import React, { useState, useRef } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Volume2, Play, Pause, Square, Download, Mic } from 'lucide-react';
import { downloadFile } from '../../utils/fileHelpers';

export const TextToSpeech: React.FC = () => {
  const [text, setText] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [voice, setVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  React.useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
      if (availableVoices.length > 0 && !voice) {
        setVoice(availableVoices[0]);
      }
    };

    loadVoices();
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
    
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
    };
  }, [voice]);

  const speak = () => {
    if (!text.trim()) return;

    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = voice;
    utterance.rate = rate;
    utterance.pitch = pitch;
    
    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);
    
    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const pause = () => {
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.pause();
      setIsPlaying(false);
    }
  };

  const resume = () => {
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setIsPlaying(true);
    }
  };

  const stop = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        setRecordedChunks(chunks);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      
      // Also start speech synthesis
      speak();
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      stop();
    }
  };

  const downloadRecording = () => {
    if (recordedChunks.length > 0) {
      const blob = new Blob(recordedChunks, { type: 'audio/webm' });
      downloadFile(blob, `tts_recording_${Date.now()}.webm`);
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Text-to-Speech</h1>
        <p className="text-gray-600">
          Convert text to natural speech with recording capabilities
        </p>
      </div>

      {/* Text Input */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <Volume2 className="mr-2 h-5 w-5" />
          Text Input
        </h2>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter text to convert to speech..."
          className="w-full h-32 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        />
        <div className="mt-2 text-sm text-gray-500">
          {text.length} characters
        </div>
      </Card>

      {/* Voice Settings */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Voice Settings</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Voice</label>
            <select
              value={voice?.name || ''}
              onChange={(e) => {
                const selectedVoice = voices.find(v => v.name === e.target.value);
                setVoice(selectedVoice || null);
              }}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {voices.map((v) => (
                <option key={v.name} value={v.name}>
                  {v.name} ({v.lang})
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Speed: {rate}x
            </label>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={rate}
              onChange={(e) => setRate(Number(e.target.value))}
              className="w-full"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pitch: {pitch}
            </label>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={pitch}
              onChange={(e) => setPitch(Number(e.target.value))}
              className="w-full"
            />
          </div>
        </div>
      </Card>

      {/* Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Playback Controls */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Playback Controls</h2>
          <div className="flex gap-3">
            {!isPlaying ? (
              <Button onClick={speak} disabled={!text.trim()} className="flex-1">
                <Play className="mr-2 h-4 w-4" />
                Play
              </Button>
            ) : (
              <Button onClick={pause} className="flex-1">
                <Pause className="mr-2 h-4 w-4" />
                Pause
              </Button>
            )}
            <Button onClick={stop} variant="outline" disabled={!isPlaying}>
              <Square className="mr-2 h-4 w-4" />
              Stop
            </Button>
          </div>
        </Card>

        {/* Recording Controls */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Record Audio</h2>
          <div className="flex gap-3">
            {!isRecording ? (
              <Button 
                onClick={startRecording} 
                disabled={!text.trim()}
                variant="outline"
                className="flex-1"
              >
                <Mic className="mr-2 h-4 w-4" />
                Record Speech
              </Button>
            ) : (
              <Button onClick={stopRecording} className="flex-1 bg-red-600 hover:bg-red-700">
                <Square className="mr-2 h-4 w-4" />
                Stop Recording
              </Button>
            )}
            {recordedChunks.length > 0 && (
              <Button onClick={downloadRecording} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            )}
          </div>
          {isRecording && (
            <div className="mt-4 flex items-center text-red-600">
              <div className="animate-pulse w-3 h-3 bg-red-600 rounded-full mr-2" />
              Recording in progress...
            </div>
          )}
        </Card>
      </div>

      {/* Quick Examples */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Quick Examples</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            'Hello, welcome to ToolsHub!',
            'This is a demonstration of our text-to-speech feature.',
            'The quick brown fox jumps over the lazy dog.',
            'Technology is making our lives easier every day.'
          ].map((example, index) => (
            <Button
              key={index}
              variant="outline"
              onClick={() => setText(example)}
              className="text-left justify-start p-3 h-auto"
            >
              {example}
            </Button>
          ))}
        </div>
      </Card>
    </div>
  );
};