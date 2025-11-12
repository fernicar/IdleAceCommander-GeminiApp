
import React, { useState, useEffect } from 'react';
import { Dialogue } from '../../types/narrative.types';
import { useTextToSpeech } from '../../hooks/useTextToSpeech';
import { useGameState } from '../../contexts/GameStateContext';

interface GeneralMartinModalProps {
  dialogue: Dialogue;
  onDismiss: () => void;
}

const GeneralMartinModal: React.FC<GeneralMartinModalProps> = ({ dialogue, onDismiss }) => {
  const { gameState } = useGameState();
  const { speak, stop, isSpeaking: ttsIsSpeaking } = useTextToSpeech(gameState.settings.tts);
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-speak dialogue on mount
  useEffect(() => {
    if (gameState.settings.tts?.enabled && dialogue.text) {
      speak(dialogue.text);
    }
    return () => stop();
  }, [dialogue.id, dialogue.text, gameState.settings.tts?.enabled, speak, stop]);

  // Typewriter effect
  useEffect(() => {
    if (currentIndex < dialogue.text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText((prev) => prev + dialogue.text[currentIndex]);
        setCurrentIndex((prev) => prev + 1);
      }, 30); // 30ms per character

      return () => clearTimeout(timeout);
    }
  }, [currentIndex, dialogue.text]);

  const handleSkip = () => {
    setDisplayedText(dialogue.text);
    setCurrentIndex(dialogue.text.length);
    stop();
  };

  const handleDismiss = () => {
    stop();
    onDismiss();
  };

  const toggleTTS = () => {
    if (ttsIsSpeaking) {
      stop();
    } else {
      speak(dialogue.text);
    }
  };

  const canContinue = currentIndex >= dialogue.text.length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
      <div className="max-w-4xl w-full">
        {/* Character Portrait */}
        <div className="flex justify-center mb-4">
          <div className="bg-gray-800 border-4 border-military-green rounded-full p-4">
            <i className="fas fa-user-tie text-6xl text-military-tan"></i>
          </div>
        </div>

        {/* Name Plate */}
        <div className="text-center mb-4">
          <div className="inline-block bg-military-dark border-2 border-military-green px-6 py-2 rounded">
            <div className="text-2xl font-bold text-military-tan font-military">
              GENERAL MARTIN
            </div>
            <div className="text-xs text-gray-400">COMMANDER-IN-CHIEF</div>
          </div>
        </div>

        {/* Dialogue Box */}
        <div className="bg-gray-800 border-4 border-military-green rounded-lg p-8 scanline-effect">
          <div className="min-h-[200px] relative">
            <p className="text-xl text-gray-100 font-military leading-relaxed">
              {displayedText}
              {!canContinue && <span className="animate-pulse">▮</span>}
            </p>
          </div>

          {/* Controls */}
          <div className="flex justify-between items-center mt-6 pt-4 border-t-2 border-gray-700">
            <div className="flex items-center gap-4">
              {gameState.settings.tts?.enabled && (
                <button
                  onClick={toggleTTS}
                  className="text-gray-400 hover:text-gray-200 transition-colors text-sm"
                  title={ttsIsSpeaking ? "Stop audio" : "Play audio"}
                >
                  <i className={`fas ${ttsIsSpeaking ? 'fa-volume-up animate-pulse' : 'fa-volume-mute'} mr-2`}></i>
                  {ttsIsSpeaking ? 'SPEAKING' : 'SPEAK'}
                </button>
              )}
              
              {!canContinue && (
                <button
                  onClick={handleSkip}
                  className="text-gray-400 hover:text-gray-200 transition-colors text-sm"
                >
                  <i className="fas fa-forward mr-2"></i>
                  SKIP
                </button>
              )}
            </div>

            {canContinue && (
              <button
                onClick={handleDismiss}
                className="ml-auto bg-military-green hover:bg-green-600 text-white font-bold py-3 px-8 rounded transition-all transform hover:scale-105"
              >
                CONTINUE
                <i className="fas fa-chevron-right ml-2"></i>
              </button>
            )}
          </div>
        </div>

        {/* Mission Type Badge */}
        <div className="text-center mt-4">
          <span className="inline-block bg-gray-800 border border-military-green px-4 py-1 rounded text-xs text-gray-400 uppercase">
            {dialogue.type.replace('-', ' ')}
          </span>
        </div>
      </div>
    </div>
  );
};

export default GeneralMartinModal;
