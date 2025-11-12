
import React, { useState, useEffect } from 'react';
import { useGameState } from '../../contexts/GameStateContext';
import { FighterJet } from '../../types/game.types';

const OutfitPanel: React.FC = () => {
  const { gameState, upgradeJet, updateResources } = useGameState();
  const [selectedJet, setSelectedJet] = useState<FighterJet | null>(
    gameState.squadron[0] || null
  );

  // Sync selectedJet with gameState when squadron updates
  useEffect(() => {
    if (selectedJet) {
      const updatedJet = gameState.squadron.find(jet => jet.id === selectedJet.id);
      if (updatedJet) {
        setSelectedJet(updatedJet);
      }
    }
  }, [gameState.squadron, selectedJet]);

  const getUpgradeCost = (currentLevel: number): number => {
    return (currentLevel + 1) * 100;
  };

  const canAffordUpgrade = (cost: number): boolean => {
    return gameState.resources.credits >= cost;
  };

  const handleUpgrade = (upgradeType: 'weapons' | 'engines' | 'avionics') => {
    if (!selectedJet) return;

    const currentLevel = selectedJet.upgrades[upgradeType];
    if (currentLevel >= 10) return;

    const cost = getUpgradeCost(currentLevel);
    if (!canAffordUpgrade(cost)) return;

    upgradeJet(selectedJet.id, upgradeType);
    updateResources(-cost, 0);
  };

  if (!selectedJet) {
    return (
      <div className="bg-gray-800 border-2 border-military-green p-6 rounded-lg">
        <h2 className="text-2xl font-bold mb-4 text-military-tan">
          <i className="fas fa-wrench mr-2"></i>
          OUTFIT
        </h2>
        <p className="text-gray-400">No aircraft available</p>
      </div>
    );
  }

  const upgradeTypes = [
    {
      key: 'weapons' as const,
      name: 'Weapon Systems',
      icon: 'fa-gun',
      stat: 'weaponStrength',
      description: 'Increases damage output',
      color: 'text-red-400',
    },
    {
      key: 'engines' as const,
      name: 'Engine Upgrade',
      icon: 'fa-rocket',
      stat: 'speed',
      description: 'Increases movement speed',
      color: 'text-blue-400',
    },
    {
      key: 'avionics' as const,
      name: 'Avionics Suite',
      icon: 'fa-microchip',
      stat: 'agility',
      description: 'Increases maneuverability',
      color: 'text-green-400',
    },
  ];

  return (
    <div className="bg-gray-800 border-2 border-military-green p-6 rounded-lg h-full flex flex-col">
      <h2 className="text-2xl font-bold mb-4 text-military-tan">
        <i className="fas fa-wrench mr-2"></i>
        OUTFIT
      </h2>

      {/* Aircraft Selector */}
      <div className="mb-4">
        <div className="text-xs text-gray-400 uppercase mb-2">Select Aircraft</div>
        <div className="flex space-x-2">
          {gameState.squadron.map((jet) => (
            <button
              key={jet.id}
              onClick={() => setSelectedJet(jet)}
              className={`flex-1 p-2 rounded border-2 transition-colors ${
                selectedJet.id === jet.id
                  ? 'border-military-green bg-gray-700'
                  : 'border-gray-600 bg-gray-900 hover:border-gray-500'
              }`}
            >
              <div className="text-sm font-bold">{jet.name}</div>
              <div className="text-xs text-gray-400">Lvl {jet.level}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Aircraft Stats Overview */}
      <div className="bg-gray-900 p-3 rounded mb-4">
        <div className="text-xs text-gray-400 uppercase mb-2">Current Stats</div>
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center">
            <div className="text-lg font-bold text-red-400">
              {selectedJet.computedStats.weaponStrength}
            </div>
            <div className="text-xs text-gray-400">Damage</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-blue-400">
              {selectedJet.computedStats.speed}
            </div>
            <div className="text-xs text-gray-400">Speed</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-green-400">
              {selectedJet.computedStats.agility}
            </div>
            <div className="text-xs text-gray-400">Agility</div>
          </div>
        </div>
      </div>

      {/* Upgrade Options */}
      <div className="flex-1 space-y-3 overflow-y-auto">
        {upgradeTypes.map((upgrade) => {
          const currentLevel = selectedJet.upgrades[upgrade.key];
          const cost = getUpgradeCost(currentLevel);
          const canAfford = canAffordUpgrade(cost);
          const isMaxLevel = currentLevel >= 10;

          return (
            <div
              key={upgrade.key}
              className="bg-gray-900 p-4 rounded border border-gray-700"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="font-bold flex items-center">
                    <i className={`fas ${upgrade.icon} mr-2 ${upgrade.color}`}></i>
                    {upgrade.name}
                  </div>
                  <div className="text-xs text-gray-400">
                    {upgrade.description}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-400">Level</div>
                  <div className="text-xl font-bold">{currentLevel}/10</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-800 rounded-full h-2 mb-3">
                <div
                  className={`h-full rounded-full ${
                    isMaxLevel ? 'bg-yellow-500' : 'bg-military-green'
                  }`}
                  style={{ width: `${(currentLevel / 10) * 100}%` }}
                ></div>
              </div>

              {/* Upgrade Button */}
              <button
                onClick={() => handleUpgrade(upgrade.key)}
                disabled={isMaxLevel || !canAfford}
                className={`w-full py-2 rounded font-bold transition-colors ${
                  isMaxLevel
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : canAfford
                    ? 'bg-military-green hover:bg-green-600 text-white'
                    : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isMaxLevel ? (
                  'MAX LEVEL'
                ) : (
                  <>
                    <i className="fas fa-coins mr-2"></i>
                    UPGRADE ({cost} Credits)
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OutfitPanel;
