
import React, { useState, useEffect } from 'react';
import { useGameState } from '../../contexts/GameStateContext';
import { Pilot } from '../../types/game.types';

const PilotTrainingPanel: React.FC = () => {
  const { gameState, trainPilot, updateResources } = useGameState();
  const [selectedPilot, setSelectedPilot] = useState<Pilot | null>(
    gameState.pilots[0] || null
  );

  // Update selectedPilot when pilots array changes
  useEffect(() => {
    if (selectedPilot) {
      const updatedPilot = gameState.pilots.find(p => p.id === selectedPilot.id);
      if (updatedPilot && updatedPilot !== selectedPilot) {
        setSelectedPilot(updatedPilot);
      }
    } else if (gameState.pilots.length > 0) {
      setSelectedPilot(gameState.pilots[0]);
    }
  }, [gameState.pilots, selectedPilot]);

  const TRAINING_COST = 50; // Credits per training session
  const TRAINING_AMOUNT = 10; // Progress gained per session

  const handleTrain = (stat: 'intelligence' | 'endurance') => {
    if (!selectedPilot) return;
    if (gameState.resources.credits < TRAINING_COST) return;

    trainPilot(selectedPilot.id, stat, TRAINING_AMOUNT);
    updateResources(-TRAINING_COST, 0);
  };

  if (!selectedPilot) {
    return (
      <div className="bg-gray-800 border-2 border-military-green p-6 rounded-lg">
        <h2 className="text-2xl font-bold mb-4 text-military-tan">
          <i className="fas fa-user-graduate mr-2"></i>
          PILOT TRAINING
        </h2>
        <p className="text-gray-400">No pilots available</p>
      </div>
    );
  }

  const canAffordTraining = gameState.resources.credits >= TRAINING_COST;

  return (
    <div className="bg-gray-800 border-2 border-military-green p-6 rounded-lg h-full flex flex-col">
      <h2 className="text-2xl font-bold mb-4 text-military-tan">
        <i className="fas fa-user-graduate mr-2"></i>
        PILOT TRAINING
      </h2>

      {/* Pilot Selector */}
      <div className="mb-4">
        <div className="text-xs text-gray-400 uppercase mb-2">Select Pilot</div>
        <div className="grid grid-cols-2 gap-2">
          {gameState.pilots.map((pilot) => (
            <button
              key={pilot.id}
              onClick={() => setSelectedPilot(pilot)}
              className={`p-3 rounded border-2 transition-colors ${
                selectedPilot.id === pilot.id
                  ? 'border-military-green bg-gray-700'
                  : 'border-gray-600 bg-gray-900 hover:border-gray-500'
              }`}
            >
              <div className="font-bold">{pilot.callsign}</div>
              <div className="text-xs text-gray-400">{pilot.rank}</div>
              <div className="text-xs text-gray-400">Lvl {pilot.level}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Pilot Stats */}
      <div className="bg-gray-900 p-3 rounded mb-4">
        <div className="text-xs text-gray-400 uppercase mb-2">Combat Record</div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <div className="text-sm text-gray-400">Missions</div>
            <div className="text-xl font-bold">{selectedPilot.missionsFlown}</div>
          </div>
          <div>
            <div className="text-sm text-gray-400">Kills</div>
            <div className="text-xl font-bold text-enemy-red">
              {selectedPilot.kills}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-400">Survival Streak</div>
            <div className="text-xl font-bold text-allied-green">
              {selectedPilot.survivalStreak}
            </div>
          </div>
        </div>
      </div>

      {/* Training Options */}
      <div className="flex-1 space-y-4">
        {/* Intelligence Training */}
        <div className="bg-gray-900 p-4 rounded border border-gray-700">
          <div className="flex justify-between items-center mb-2">
            <div>
              <div className="font-bold flex items-center">
                <i className="fas fa-brain mr-2 text-purple-400"></i>
                Intelligence Training
              </div>
              <div className="text-xs text-gray-400">
                Improves targeting accuracy
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-purple-400">
                {selectedPilot.intelligence}
              </div>
              <div className="text-xs text-gray-400">Current</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-2">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Progress to Level {selectedPilot.level + 1}</span>
              <span>{selectedPilot.trainingProgress.intelligence}%</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-3">
              <div
                className="h-full rounded-full bg-purple-500"
                style={{
                  width: `${selectedPilot.trainingProgress.intelligence}%`,
                }}
              ></div>
            </div>
          </div>

          <button
            onClick={() => handleTrain('intelligence')}
            disabled={!canAffordTraining}
            className={`w-full py-2 rounded font-bold transition-colors ${
              canAffordTraining
                ? 'bg-military-green hover:bg-green-600 text-white'
                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            }`}
          >
            <i className="fas fa-coins mr-2"></i>
            TRAIN ({TRAINING_COST} Credits)
          </button>
        </div>

        {/* Endurance Training */}
        <div className="bg-gray-900 p-4 rounded border border-gray-700">
          <div className="flex justify-between items-center mb-2">
            <div>
              <div className="font-bold flex items-center">
                <i className="fas fa-heart mr-2 text-red-400"></i>
                Endurance Training
              </div>
              <div className="text-xs text-gray-400">
                Improves sustained combat performance
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-red-400">
                {selectedPilot.endurance}
              </div>
              <div className="text-xs text-gray-400">Current</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-2">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Progress to Level {selectedPilot.level + 1}</span>
              <span>{selectedPilot.trainingProgress.endurance}%</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-3">
              <div
                className="h-full rounded-full bg-red-500"
                style={{
                  width: `${selectedPilot.trainingProgress.endurance}%`,
                }}
              ></div>
            </div>
          </div>

          <button
            onClick={() => handleTrain('endurance')}
            disabled={!canAffordTraining}
            className={`w-full py-2 rounded font-bold transition-colors ${
              canAffordTraining
                ? 'bg-military-green hover:bg-green-600 text-white'
                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            }`}
          >
            <i className="fas fa-coins mr-2"></i>
            TRAIN ({TRAINING_COST} Credits)
          </button>
        </div>
      </div>
    </div>
  );
};

export default PilotTrainingPanel;
