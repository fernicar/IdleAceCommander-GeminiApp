
import React, { useState } from 'react';
import { useGameState } from '../contexts/GameStateContext';
import SettingsModal from './SettingsModal';
import { getScoreRank } from '../utils/scoreCalculations';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';

interface HeaderProps {
  onShowTutorial?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onShowTutorial }) => {
  const { gameState, saveGame } = useGameState();
  const [showSettings, setShowSettings] = useState(false);

  return (
    <>
      <header className="bg-military-dark border-b-2 border-military-green py-4 px-6 scanline-effect">
        <div className="container mx-auto flex justify-between items-center">
          {/* Logo / Title */}
          <div className="flex items-center space-x-4">
            <i className="fas fa-jet-fighter text-3xl text-allied-green"></i>
            <div>
              <h1 className="text-2xl font-bold font-military text-military-tan tracking-wider">
                IDLE ACE COMMANDER
              </h1>
              <p className="text-xs text-gray-400 font-military">
                TACTICAL COMBAT OPERATIONS
              </p>
            </div>
          </div>

          {/* High Score Display */}
          <div className="flex items-center space-x-6">
            <div className="text-right">
              <p className="text-xs text-gray-400 uppercase tracking-wide">High Score</p>
              <p className="text-2xl font-bold text-hud-blue font-military">
                {gameState.highScore.toLocaleString()}
              </p>
              <p className="text-xs text-yellow-400 font-bold">{getScoreRank(gameState.highScore)}</p>
            </div>

            {/* Ko-Fi Donate Button */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <a
                    href="https://ko-fi.com/driftjohnson"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center bg-secondary/20 hover:bg-secondary/40 px-3 py-2 rounded border border-secondary/50 hover:border-secondary transition-all hover:shadow-lg hover:shadow-secondary/50"
                  >
                    <i className="fas fa-mug-hot text-xl text-military-tan"></i>
                  </a>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="bg-military-dark border-secondary">
                  <p className="text-military-tan font-military text-sm">Support Development ☕</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Resources */}
            <div className="text-right">
              <p className="text-xs text-gray-400 uppercase tracking-wide">Credits</p>
              <p className="text-xl font-bold text-green-400 font-military">
                <i className="fas fa-coins mr-1"></i>
                {gameState.resources.credits.toLocaleString()}
              </p>
            </div>

            <div className="text-right">
              <p className="text-xs text-gray-400 uppercase tracking-wide">Research</p>
              <p className="text-xl font-bold text-blue-400 font-military">
                <i className="fas fa-flask mr-1"></i>
                {gameState.resources.researchPoints.toLocaleString()}
              </p>
            </div>

            {/* Save Button */}
            <button
              onClick={saveGame}
              className="bg-military-green hover:bg-military-dark px-4 py-2 rounded border border-military-tan transition-colors"
              title="Save Game"
            >
              <i className="fas fa-save"></i>
            </button>

            {/* Tutorial Button */}
            {onShowTutorial && (
              <button
                onClick={onShowTutorial}
                className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded border border-gray-500 transition-colors"
                title="Show Tutorial"
              >
                <i className="fas fa-question-circle"></i>
              </button>
            )}

            {/* Settings Button */}
            <button
              onClick={() => setShowSettings(true)}
              className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded border border-gray-500 transition-colors"
              title="Settings"
            >
              <i className="fas fa-cog"></i>
            </button>
          </div>
        </div>
      </header>

      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </>
  );
};

export default Header;
