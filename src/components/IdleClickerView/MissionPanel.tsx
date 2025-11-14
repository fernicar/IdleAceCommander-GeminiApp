import React, { useState, useEffect } from 'react';
import { useGameState } from '../../contexts/GameStateContext';
import { useMissionTimer } from '../../hooks/useMissionTimer';
import { calculateBattleOutcome } from '../../utils/combatCalculations';
import { PreCalculatedOutcome } from '../../types/game.types';

const MissionPanel: React.FC = () => {
  const { gameState, setCurrentView, setCurrentMission, setPreCalculatedOutcome } = useGameState();
  const { timeRemaining, currentMission, clearMission, playerLevel } = useMissionTimer();
  const [preCalculatedOutcome, setPreCalculatedOutcomeState] = useState<PreCalculatedOutcome | null>(null);

  useEffect(() => {
    if (gameState.debugMode && currentMission) {
      // Tactic is not available here, defaulting to 'aggressive' for pre-calculation
      const outcome = calculateBattleOutcome(gameState.squadron, gameState.pilots, currentMission, 'aggressive');
      setPreCalculatedOutcomeState(outcome);
    } else {
      setPreCalculatedOutcomeState(null);
    }
  }, [currentMission, gameState.squadron, gameState.pilots, gameState.research.completed, gameState.debugMode]);


  const formatTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getDifficultyColor = (difficulty: string) => {
    const colors = {
      easy: 'bg-green-900 text-green-300 border-green-500',
      medium: 'bg-yellow-900 text-yellow-300 border-yellow-500',
      hard: 'bg-orange-900 text-orange-300 border-orange-500',
      extreme: 'bg-red-900 text-red-300 border-red-500',
    };
    return colors[difficulty as keyof typeof colors] || colors.easy;
  };

  const handleLaunch = () => {
    if (currentMission) {
      setCurrentMission(currentMission);
      setPreCalculatedOutcome(preCalculatedOutcome);
      setCurrentView('general-briefing');
      clearMission();
    }
  };

  return (
    <div className="bg-gray-800 border-2 border-military-green p-6 rounded-lg h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-military-tan">
          <i className="fas fa-crosshairs mr-2"></i>
          MISSION CONTROL
        </h2>
        <div className="text-sm bg-gray-700 px-3 py-1 rounded">
          Level {playerLevel}
        </div>
      </div>

      {currentMission ? (
        <div className="flex-1 flex flex-col space-y-4">
          {/* Mission Card */}
          <div className="bg-gray-900 p-4 rounded border border-military-green flex-1">
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-xl font-bold text-hud-blue">
                {currentMission.name}
              </h3>
              <div className={`px-3 py-1 rounded border text-xs font-bold uppercase ${getDifficultyColor(currentMission.difficulty)}`}>
                {currentMission.difficulty}
              </div>
            </div>

            <p className="text-gray-300 text-sm mb-4">
              {currentMission.description}
            </p>

            {/* Enemy Stats */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="bg-gray-800 p-2 rounded text-center">
                <div className="text-xs text-gray-400">Enemies</div>
                <div className="text-2xl font-bold text-enemy-red">
                  {currentMission.enemyCount}
                </div>
              </div>
              <div className="bg-gray-800 p-2 rounded text-center">
                <div className="text-xs text-gray-400">Strength</div>
                <div className="text-2xl font-bold text-enemy-red">
                  {currentMission.enemyStats.weaponStrength}
                </div>
              </div>
              <div className="bg-gray-800 p-2 rounded text-center">
                <div className="text-xs text-gray-400">Speed</div>
                <div className="text-2xl font-bold text-enemy-red">
                  {currentMission.enemyStats.speed}
                </div>
              </div>
            </div>

            {/* Rewards */}
            <div className="bg-gray-800 p-3 rounded">
              <div className="text-xs text-gray-400 mb-2 uppercase">Mission Rewards</div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <i className="fas fa-coins text-green-400"></i>
                  <div className="text-sm font-bold text-green-400">
                    {currentMission.rewards.credits}
                  </div>
                </div>
                <div>
                  <i className="fas fa-flask text-blue-400"></i>
                  <div className="text-sm font-bold text-blue-400">
                    {currentMission.rewards.researchPoints}
                  </div>
                </div>
                <div>
                  <i className="fas fa-trophy text-yellow-400"></i>
                  <div className="text-sm font-bold text-yellow-400">
                    +{currentMission.rewards.highScoreBonus}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Launch Button */}
          <div>
            <button
              onClick={handleLaunch}
              className="w-full bg-military-green hover:bg-green-600 text-white font-bold py-4 rounded-lg border-2 border-green-400 transition-all transform hover:scale-105"
            >
              <i className="fas fa-rocket mr-2"></i>
              LAUNCH MISSION
            </button>
            {gameState.debugMode && preCalculatedOutcome && currentMission && (
              <div className="text-center text-xs text-red-400 font-military mt-2 bg-gray-900 p-1 rounded">
                &#123;Allies {preCalculatedOutcome.results.destroyedAllied}/{gameState.squadron.length}, Enemies {preCalculatedOutcome.results.destroyedEnemy}/{currentMission.enemyCount}&#125;
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center">
          <i className="fas fa-satellite-dish text-6xl text-gray-600 mb-4 animate-pulse"></i>
          <div className="text-gray-400 mb-2">Next Mission In</div>
          <div className="text-4xl font-bold font-military text-hud-blue mb-6">
            {formatTime(timeRemaining)}
          </div>
          <div className="text-sm text-gray-500">
            Awaiting Orders from Command
          </div>
        </div>
      )}
    </div>
  );
};

export default MissionPanel;
