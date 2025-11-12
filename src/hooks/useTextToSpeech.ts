import { useState, useEffect, useCallback } from 'react';

export interface TTSSettings {
  enabled: boolean;
  voice: string;
  rate: number;
  pitch: number;
  volume: number;
}

const DEFAULT_SETTINGS: TTSSettings = {
  enabled: false,
  voice: '',
  rate: 1.0,
  pitch: 1.0,
  volume: 1.0,
};

export const useTextToSpeech = (externalSettings?: TTSSettings) => {
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [settings, setSettings] = useState<TTSSettings>(() => {
    // Use externalSettings if provided, otherwise load from localStorage
    if (externalSettings) {
      return externalSettings;
    }
    const saved = localStorage.getItem('idle-ace-tts-settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return DEFAULT_SETTINGS;
      }
    }
    return DEFAULT_SETTINGS;
  });

  // Update internal settings when external settings change
  useEffect(() => {
    if (externalSettings) {
      setSettings(externalSettings);
    }
  }, [externalSettings]);

  // Load available voices
  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      setAvailableVoices(voices);
      
      // Set default voice if not set
      if (voices.length > 0 && !settings.voice) {
        // Try to find an English voice, prefer ones with 'male' or 'general' in the name
        const preferredVoice = voices.find(v => 
          v.lang.startsWith('en') && (v.name.toLowerCase().includes('male') || v.name.toLowerCase().includes('daniel'))
        ) || voices.find(v => v.lang.startsWith('en')) || voices[0];
        
        updateSettings({ voice: preferredVoice.name });
      }
    };

    loadVoices();
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);

    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
    };
  }, []);

  // Update settings
  const updateSettings = useCallback((newSettings: Partial<TTSSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem('idle-ace-tts-settings', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Speak text
  const speak = useCallback((text: string) => {
    if (!text || typeof window.speechSynthesis === 'undefined') return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Find the selected voice
    const voice = availableVoices.find(v => v.name === settings.voice);
    if (voice) {
      utterance.voice = voice;
    }

    utterance.rate = settings.rate;
    utterance.pitch = settings.pitch;
    utterance.volume = settings.volume;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, [availableVoices, settings]);

  // Stop speaking
  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  // Pause speaking
  const pause = useCallback(() => {
    window.speechSynthesis.pause();
  }, []);

  // Resume speaking
  const resume = useCallback(() => {
    window.speechSynthesis.resume();
  }, []);

  return {
    speak,
    stop,
    pause,
    resume,
    isSpeaking,
    availableVoices,
    settings,
    updateSettings,
  };
};
