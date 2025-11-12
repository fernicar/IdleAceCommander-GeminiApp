
import React, { useState } from 'react';
import { useGameState } from '../contexts/GameStateContext';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import { Switch } from './ui/switch';
import { Slider } from './ui/slider';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { gameState, resetGame, updateTTSSettings } = useGameState();
  const { availableVoices, speak } = useTextToSpeech();
  const [apiKey, setApiKey] = useState(
    localStorage.getItem('idle-ace-api-key') || gameState.settings.apiKey
  );
  const [selectedModel, setSelectedModel] = useState(
    localStorage.getItem('idle-ace-model') || gameState.settings.selectedModel
  );
  const [ttsEnabled, setTtsEnabled] = useState(gameState.settings.tts?.enabled ?? false);
  const [ttsVoice, setTtsVoice] = useState(gameState.settings.tts?.voice ?? '');
  const [ttsRate, setTtsRate] = useState(gameState.settings.tts?.rate ?? 1.0);
  const [ttsPitch, setTtsPitch] = useState(gameState.settings.tts?.pitch ?? 1.0);
  const [ttsVolume, setTtsVolume] = useState(gameState.settings.tts?.volume ?? 1.0);

  if (!isOpen) return null;

  const handleSave = () => {
    localStorage.setItem('idle-ace-api-key', apiKey);
    localStorage.setItem('idle-ace-model', selectedModel);
    
    // Save TTS settings to both localStorage and game state
    const ttsSettings = {
      enabled: ttsEnabled,
      voice: ttsVoice,
      rate: ttsRate,
      pitch: ttsPitch,
      volume: ttsVolume,
    };
    
    localStorage.setItem('idle-ace-tts-settings', JSON.stringify(ttsSettings));
    updateTTSSettings(ttsSettings);
    
    onClose();
  };

  const handleTestVoice = () => {
    speak("General Martin reporting. All systems nominal, pilot. Mission briefing commencing now.");
  };

  const models = [
    { id: 'x-ai/grok-4-fast', name: 'Grok 4 Fast (Recommended)' },
    { id: 'google/gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite' },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-gray-800 border-2 border-military-green rounded-lg p-6 max-w-2xl w-full mx-4">
        <h2 className="text-3xl font-bold mb-6 text-military-tan">
          <i className="fas fa-cog mr-2"></i>
          SETTINGS
        </h2>

        {/* AI Configuration */}
        <div className="mb-6">
          <h3 className="text-xl font-bold mb-4 text-gray-200">AI Narrative System</h3>

          {/* API Key */}
          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-2">
              OpenRouter API Key
              <a
                href="https://openrouter.ai/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="ml-2 text-hud-blue hover:underline"
              >
                (Get Key)
              </a>
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-or-..."
              className="w-full bg-gray-900 border border-gray-600 rounded px-4 py-2 text-gray-100 focus:border-military-green focus:outline-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              Your API key is stored locally and never sent anywhere except OpenRouter
            </p>
          </div>

          {/* Model Selection */}
          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-2">AI Model</label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full bg-gray-900 border border-gray-600 rounded px-4 py-2 text-gray-100 focus:border-military-green focus:outline-none"
            >
              {models.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Grok 4 Fast recommended for speed and cost-effectiveness
            </p>
          </div>
        </div>

        {/* Text-to-Speech Settings */}
        <div className="mb-6">
          <h3 className="text-xl font-bold mb-4 text-gray-200">Text-to-Speech (General Martin)</h3>

          {/* Enable/Disable Toggle */}
          <div className="flex items-center justify-between mb-4">
            <label className="text-sm text-gray-300">Enable Text-to-Speech</label>
            <Switch checked={ttsEnabled} onCheckedChange={setTtsEnabled} />
          </div>

          {ttsEnabled && (
            <>
              {/* Voice Selection */}
              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-2">Voice</label>
                <select
                  value={ttsVoice}
                  onChange={(e) => setTtsVoice(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-600 rounded px-4 py-2 text-gray-100 focus:border-military-green focus:outline-none"
                >
                  {availableVoices.map((voice) => (
                    <option key={voice.name} value={voice.name}>
                      {voice.name} ({voice.lang})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Deeper, authoritative voices work best for General Martin
                </p>
              </div>

              {/* Rate Slider */}
              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-2">
                  Speech Rate: {ttsRate.toFixed(1)}x
                </label>
                <Slider
                  value={[ttsRate]}
                  onValueChange={(values) => setTtsRate(values[0])}
                  min={0.5}
                  max={2}
                  step={0.1}
                  className="w-full"
                />
              </div>

              {/* Pitch Slider */}
              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-2">
                  Pitch: {ttsPitch.toFixed(1)}
                </label>
                <Slider
                  value={[ttsPitch]}
                  onValueChange={(values) => setTtsPitch(values[0])}
                  min={0.5}
                  max={2}
                  step={0.1}
                  className="w-full"
                />
              </div>

              {/* Volume Slider */}
              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-2">
                  Volume: {(ttsVolume * 100).toFixed(0)}%
                </label>
                <Slider
                  value={[ttsVolume]}
                  onValueChange={(values) => setTtsVolume(values[0])}
                  min={0}
                  max={1}
                  step={0.1}
                  className="w-full"
                />
              </div>

              {/* Test Button */}
              <button
                onClick={handleTestVoice}
                className="bg-military-green hover:bg-green-600 text-white font-bold py-2 px-4 rounded transition-colors w-full"
              >
                <i className="fas fa-volume-up mr-2"></i>
                TEST VOICE
              </button>
            </>
          )}
        </div>

        {/* Game Management */}
        <div className="mb-6">
          <h3 className="text-xl font-bold mb-4 text-gray-200">Game Management</h3>

          <button
            onClick={() => {
              if (confirm('Reset all game progress? This cannot be undone.')) {
                resetGame();
                onClose();
              }
            }}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition-colors"
          >
            <i className="fas fa-exclamation-triangle mr-2"></i>
            RESET GAME
          </button>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-6 rounded transition-colors"
          >
            CANCEL
          </button>
          <button
            onClick={handleSave}
            className="bg-military-green hover:bg-green-600 text-white font-bold py-2 px-6 rounded transition-colors"
          >
            <i className="fas fa-save mr-2"></i>
            SAVE
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
