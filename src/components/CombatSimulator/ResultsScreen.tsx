
import React, { useState, useEffect } from 'react';
import { BattleResults } from '../../types/combat.types';
import { useGameState } from '../../contexts/GameStateContext';
import { useTextToSpeech } from '../../hooks/useTextToSpeech';

interface ResultsScreenProps {
  results: BattleResults;
  onReturn: () => void;
  dialogueText?: string;
}

const ResultsScreen: React.FC<ResultsScreenProps> = ({ results, onReturn, dialogueText }) => {
  const { gameState } = useGameState();
  const { speak, stop, isSpeaking: ttsIsSpeaking } = useTextToSpeech(gameState.settings.tts);
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-speak dialogue on mount if provided
  useEffect(() => {
    if (dialogueText && gameState.settings.tts?.enabled) {
      speak(dialogueText);
    }
    return () => stop();
  }, [dialogueText, gameState.settings.tts?.enabled, speak, stop]);

  // Typewriter effect for dialogue
  useEffect(() => {
    if (dialogueText && currentIndex < dialogueText.length) {
      const timeout = setTimeout(() => {
        setDisplayedText((prev) => prev + dialogueText[currentIndex]);
        setCurrentIndex((prev) => prev + 1);
      }, 30); // 30ms per character

      return () => clearTimeout(timeout);
    } else if (dialogueText) {
      setDisplayedText(dialogueText);
      setCurrentIndex(dialogueText.length);
    }
  }, [currentIndex, dialogueText]);

  const handleSkip = () => {
    if (dialogueText) {
      setDisplayedText(dialogueText);
      setCurrentIndex(dialogueText.length);
      stop();
    }
  };

  const toggleTTS = () => {
    if (ttsIsSpeaking) {
      stop();
    } else if (dialogueText) {
      speak(dialogueText);
    }
  };

  const canContinue = !dialogueText || currentIndex >= dialogueText.length;

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-8">
      <div className="max-w-6xl w-full">
        {/* Victory/Defeat Header - Centered */}
        <div className="text-center mb-8">
          {results.victory ? (
            <>
              <i className="fas fa-trophy text-7xl text-yellow-400 mb-4"></i>
              <h1 className="text-5xl font-bold text-yellow-400">MISSION SUCCESS</h1>
            </>
          ) : (
            <>
              <i className="fas fa-skull-crossbones text-7xl text-red-500 mb-4"></i>
              <h1 className="text-5xl font-bold text-red-500">MISSION FAILED</h1>
            </>
          )}
        </div>

        {/* Main Content - Side by Side Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Side - General Martin Dialogue */}
          {dialogueText && (
            <div className="bg-gray-800 border-4 border-military-green rounded-lg p-6">
              {/* Character Portrait */}
              <div className="flex justify-center mb-4">
                <div className="bg-gray-900 border-4 border-military-green rounded-full p-4">
                  <i className="fas fa-user-tie text-4xl text-military-tan"></i>
                </div>
              </div>

              {/* Name Plate */}
              <div className="text-center mb-4">
                <div className="inline-block bg-military-dark border-2 border-military-green px-4 py-2 rounded">
                  <div className="text-xl font-bold text-military-tan font-military">
                    GENERAL MARTIN
                  </div>
                  <div className="text-xs text-gray-400">COMMANDER-IN-CHIEF</div>
                </div>
              </div>

              {/* Dialogue Box */}
              <div className="bg-gray-900 border-2 border-military-green rounded p-4 mb-4">
                <div className="min-h-[200px] relative">
                  <p className="text-lg text-gray-100 font-military leading-relaxed">
                    {displayedText}
                    {!canContinue && <span className="animate-pulse">▮</span>}
                  </p>
                </div>

                {/* Controls */}
                <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-700">
                  <div className="flex items-center gap-3">
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
                    <div className="text-xs text-gray-500">
                      <i className="fas fa-check-circle mr-1 text-green-500"></i>
                      Ready to continue
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Right Side - Battle Stats and Return Button */}
          <div className="bg-gray-800 border-4 border-military-green rounded-lg p-6 flex flex-col">
            {/* Stats */}
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className="bg-gray-900 p-4 rounded">
                <div className="text-gray-400 text-sm mb-2">Allied Casualties</div>
                <div className="text-3xl font-bold text-allied-green">
                  {results.destroyedAllied} / {results.survivingAllied + results.destroyedAllied}
                </div>
              </div>
              <div className="bg-gray-900 p-4 rounded">
                <div className="text-gray-400 text-sm mb-2">Enemy Destroyed</div>
                <div className="text-3xl font-bold text-enemy-red">{results.destroyedEnemy}</div>
              </div>
            </div>

            {/* Rewards */}
            <div className="bg-gray-900 p-6 rounded mb-6 flex-1">
              <h3 className="text-xl font-bold mb-4 text-military-tan">REWARDS</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <i className="fas fa-coins text-3xl text-green-400 mb-2"></i>
                  <div className="text-2xl font-bold text-green-400">
                    +{results.rewards.credits}
                  </div>
                  <div className="text-xs text-gray-400">Credits</div>
                </div>
                <div>
                  <i className="fas fa-flask text-3xl text-blue-400 mb-2"></i>
                  <div className="text-2xl font-bold text-blue-400">
                    +{results.rewards.researchPoints}
                  </div>
                  <div className="text-xs text-gray-400">Research</div>
                </div>
                <div>
                  <i className="fas fa-trophy text-3xl text-yellow-400 mb-2"></i>
                  <div className="text-2xl font-bold text-yellow-400">
                    +{results.rewards.highScoreBonus}
                  </div>
                  <div className="text-xs text-gray-400">Score</div>
                </div>
              </div>
            </div>

            {/* Return Button */}
            <button
              onClick={onReturn}
              className="w-full bg-military-green hover:bg-green-600 text-white font-bold py-4 rounded-lg transition-all text-xl"
            >
              <i className="fas fa-home mr-2"></i>
              RETURN TO BASE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsScreen;
