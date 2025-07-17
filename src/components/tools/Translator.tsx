import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Languages, ArrowRight, Copy, Volume2, RefreshCw } from 'lucide-react';

const languages = [
  { code: 'en', name: 'English' },
  { code: 'ar', name: 'Arabic' },
  { code: 'az', name: 'Azerbaijani' },
  { code: 'zh', name: 'Chinese' },
  { code: 'cs', name: 'Czech' },
  { code: 'da', name: 'Danish' },
  { code: 'nl', name: 'Dutch' },
  { code: 'fi', name: 'Finnish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'el', name: 'Greek' },
  { code: 'he', name: 'Hebrew' },
  { code: 'hi', name: 'Hindi' },
  { code: 'hu', name: 'Hungarian' },
  { code: 'id', name: 'Indonesian' },
  { code: 'ga', name: 'Irish' },
  { code: 'it', name: 'Italian' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'fa', name: 'Persian' },
  { code: 'pl', name: 'Polish' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
  { code: 'sk', name: 'Slovak' },
  { code: 'es', name: 'Spanish' },
  { code: 'sv', name: 'Swedish' },
  { code: 'tr', name: 'Turkish' },
  { code: 'uk', name: 'Ukrainian' },
  { code: 'ur', name: 'Urdu' },
  { code: 'vi', name: 'Vietnamese' }
];

export const Translator: React.FC = () => {
  const [sourceText, setSourceText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [sourceLang, setSourceLang] = useState('en');
  const [targetLang, setTargetLang] = useState('es');
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState('');
  const [copySuccess, setCopySuccess] = useState('');

  const translateText = useCallback(async (text: string, from: string, to: string) => {
    if (!text.trim() || from === to) {
      setTranslatedText(text);
      return;
    }
    
    setIsTranslating(true);
    setError('');
    
    try {
      // Primary API: MyMemory Translation API (completely free, no API key needed)
      const response = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${from}|${to}`
      );

      if (!response.ok) {
        throw new Error('Primary translation service unavailable');
      }

      const data = await response.json();
      
      if (data.responseStatus === 200 && data.responseData?.translatedText) {
        setTranslatedText(data.responseData.translatedText);
        return;
      } else {
        throw new Error('Translation failed');
      }
    } catch (error) {
      console.error('Primary translation error:', error);
      
      try {
        // Fallback API: Lingva Translate (free, no API key)
        const fallbackResponse = await fetch(
          `https://lingva.ml/api/v1/${from}/${to}/${encodeURIComponent(text)}`
        );
        
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          if (fallbackData.translation) {
            setTranslatedText(fallbackData.translation);
            return;
          }
        }
        throw new Error('Fallback translation failed');
      } catch (fallbackError) {
        console.error('Fallback translation error:', fallbackError);
        
        try {
          // Second fallback: LibreTranslate (free)
          const libreResponse = await fetch("https://libretranslate.de/translate", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              q: text,
              source: from,
              target: to,
              format: "text"
            })
          });

          if (libreResponse.ok) {
            const libreData = await libreResponse.json();
            if (libreData.translatedText) {
              setTranslatedText(libreData.translatedText);
              return;
            }
          }
          throw new Error('All translation services failed');
        } catch (libreError) {
          console.error('LibreTranslate error:', libreError);
          
          // Last resort: Mock translations for common phrases
          const mockTranslations: { [key: string]: { [key: string]: string } } = {
            'en-es': {
              'Hello': 'Hola',
              'How are you?': '¿Cómo estás?',
              'Thank you': 'Gracias',
              'Good morning': 'Buenos días',
              'Good night': 'Buenas noches',
              'Welcome': 'Bienvenido',
              'Goodbye': 'Adiós',
              'Please': 'Por favor',
              'Sorry': 'Lo siento',
              'Excuse me': 'Disculpe',
              'Yes': 'Sí',
              'No': 'No'
            },
            'en-fr': {
              'Hello': 'Bonjour',
              'How are you?': 'Comment allez-vous?',
              'Thank you': 'Merci',
              'Good morning': 'Bonjour',
              'Good night': 'Bonne nuit',
              'Welcome': 'Bienvenue',
              'Goodbye': 'Au revoir',
              'Please': 'S\'il vous plaît',
              'Sorry': 'Désolé',
              'Excuse me': 'Excusez-moi',
              'Yes': 'Oui',
              'No': 'Non'
            },
            'en-de': {
              'Hello': 'Hallo',
              'How are you?': 'Wie geht es dir?',
              'Thank you': 'Danke',
              'Good morning': 'Guten Morgen',
              'Good night': 'Gute Nacht',
              'Welcome': 'Willkommen',
              'Goodbye': 'Auf Wiedersehen',
              'Please': 'Bitte',
              'Sorry': 'Entschuldigung',
              'Excuse me': 'Entschuldigen Sie',
              'Yes': 'Ja',
              'No': 'Nein'
            },
            'en-it': {
              'Hello': 'Ciao',
              'How are you?': 'Come stai?',
              'Thank you': 'Grazie',
              'Good morning': 'Buongiorno',
              'Good night': 'Buonanotte',
              'Welcome': 'Benvenuto',
              'Goodbye': 'Arrivederci',
              'Please': 'Per favore',
              'Sorry': 'Scusa',
              'Excuse me': 'Mi scusi',
              'Yes': 'Sì',
              'No': 'No'
            },
            'en-pt': {
              'Hello': 'Olá',
              'How are you?': 'Como você está?',
              'Thank you': 'Obrigado',
              'Good morning': 'Bom dia',
              'Good night': 'Boa noite',
              'Welcome': 'Bem-vindo',
              'Goodbye': 'Tchau',
              'Please': 'Por favor',
              'Sorry': 'Desculpe',
              'Excuse me': 'Com licença',
              'Yes': 'Sim',
              'No': 'Não'
            },
            'en-ru': {
              'Hello': 'Привет',
              'How are you?': 'Как дела?',
              'Thank you': 'Спасибо',
              'Good morning': 'Доброе утро',
              'Good night': 'Спокойной ночи',
              'Welcome': 'Добро пожаловать',
              'Goodbye': 'До свидания',
              'Please': 'Пожалуйста',
              'Sorry': 'Извините',
              'Excuse me': 'Извините',
              'Yes': 'Да',
              'No': 'Нет'
            }
          };

          const key = `${from}-${to}`;
          const fallback = mockTranslations[key]?.[text] || 
                          mockTranslations[key]?.[text.toLowerCase()] ||
                          `[${to.toUpperCase()}: ${text}]`;
          
          setTranslatedText(fallback);
          setError('Using offline translation. Internet connection may be limited.');
        }
      }
    } finally {
      setIsTranslating(false);
    }
  }, []);

  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess('Copied!');
      setTimeout(() => setCopySuccess(''), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  }, []);

  const speakText = useCallback((text: string, lang: string) => {
    if ('speechSynthesis' in window && text.trim()) {
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang === 'zh' ? 'zh-CN' : lang;
      utterance.rate = 0.8;
      utterance.pitch = 1;
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  const swapLanguages = useCallback(() => {
    const newSourceLang = targetLang;
    const newTargetLang = sourceLang;
    const newSourceText = translatedText;
    const newTranslatedText = sourceText;
    
    setSourceLang(newSourceLang);
    setTargetLang(newTargetLang);
    setSourceText(newSourceText);
    setTranslatedText(newTranslatedText);
  }, [sourceLang, targetLang, sourceText, translatedText]);

  const handleQuickPhrase = useCallback((phrase: string) => {
    setSourceText(phrase);
  }, []);

  const clearText = useCallback(() => {
    setSourceText('');
    setTranslatedText('');
    setError('');
  }, []);

  const handleRetranslate = useCallback(() => {
    if (sourceText.trim()) {
      translateText(sourceText, sourceLang, targetLang);
    }
  }, [sourceText, sourceLang, targetLang, translateText]);

  // Auto-translate on text change (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (sourceText.trim()) {
        translateText(sourceText, sourceLang, targetLang);
      } else {
        setTranslatedText('');
        setError('');
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [sourceText, sourceLang, targetLang, translateText]);

  const quickPhrases = [
    'Hello',
    'How are you?',
    'Thank you',
    'Good morning',
    'Good night',
    'Welcome',
    'Goodbye',
    'Please',
    'Sorry',
    'Excuse me',
    'Yes',
    'No'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            <Languages className="inline-block mr-3 h-10 w-10 text-blue-600" />
            Universal Translator
          </h1>
          <p className="text-gray-600 text-lg">
            Real-time translation between 30+ languages with voice support
          </p>
        </div>

        {/* Language Selection */}
        <Card className="p-6">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">From</label>
              <select
                value={sourceLang}
                onChange={(e) => setSourceLang(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {languages.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>
            
            <Button 
              variant="ghost" 
              onClick={swapLanguages}
              className="p-3 rounded-full hover:bg-gray-100 transition-transform hover:scale-110 mt-6"
              title="Swap languages"
            >
              <ArrowRight className="h-5 w-5 transform rotate-90 md:rotate-0" />
            </Button>
            
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">To</label>
              <select
                value={targetLang}
                onChange={(e) => setTargetLang(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {languages.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {/* Translation Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Source Text */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium flex items-center">
                <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
                Source Text
              </h2>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => speakText(sourceText, sourceLang)}
                  disabled={!sourceText.trim()}
                  title="Listen to pronunciation"
                >
                  <Volume2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(sourceText)}
                  disabled={!sourceText.trim()}
                  title="Copy text"
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearText}
                  disabled={!sourceText.trim()}
                  title="Clear text"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <textarea
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              placeholder="Enter text to translate..."
              className="w-full h-40 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-base"
            />
            <div className="mt-2 text-sm text-gray-500 flex justify-between">
              <span>{sourceText.length} characters</span>
              {copySuccess && <span className="text-green-600">{copySuccess}</span>}
            </div>
          </Card>

          {/* Translated Text */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium flex items-center">
                <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                Translation
              </h2>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => speakText(translatedText, targetLang)}
                  disabled={!translatedText.trim()}
                  title="Listen to pronunciation"
                >
                  <Volume2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(translatedText)}
                  disabled={!translatedText.trim()}
                  title="Copy translation"
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRetranslate}
                  disabled={!sourceText.trim() || isTranslating}
                  title="Retranslate"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="w-full h-40 p-4 border border-gray-300 rounded-lg bg-gray-50 relative overflow-y-auto">
              {isTranslating ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
                  <span className="ml-2 text-gray-600">Translating...</span>
                </div>
              ) : error ? (
                <div className="text-amber-600 text-sm flex items-start">
                  <span className="text-amber-500 mr-1">⚠️</span>
                  {error}
                </div>
              ) : (
                <div className="text-gray-900 text-base leading-relaxed">
                  {translatedText || 'Translation will appear here...'}
                </div>
              )}
            </div>
            <div className="mt-2 text-sm text-gray-500">
              {translatedText.length} characters
            </div>
          </Card>
        </div>

        {/* Quick Phrases */}
        <Card className="p-6">
          <h2 className="text-lg font-medium mb-4 flex items-center">
            <Languages className="mr-2 h-5 w-5 text-blue-600" />
            Quick Phrases
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {quickPhrases.map((phrase) => (
              <Button
                key={phrase}
                variant="outline"
                size="sm"
                onClick={() => handleQuickPhrase(phrase)}
                className="text-left justify-start hover:bg-blue-50 hover:border-blue-300 transition-colors"
              >
                {phrase}
              </Button>
            ))}
          </div>
        </Card>

        {/* Features Info */}
        <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <h2 className="text-lg font-medium mb-4 text-blue-900">Translation Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="text-blue-800">
              <h3 className="font-medium mb-1">✨ Real-time Translation</h3>
              <p>Instant translation as you type with smart debouncing</p>
            </div>
            <div className="text-blue-800">
              <h3 className="font-medium mb-1">🗣️ Voice Support</h3>
              <p>Text-to-speech for pronunciation in multiple languages</p>
            </div>
            <div className="text-blue-800">
              <h3 className="font-medium mb-1">🌍 Multiple APIs</h3>
              <p>Uses MyMemory, Lingva, and LibreTranslate for reliability</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};