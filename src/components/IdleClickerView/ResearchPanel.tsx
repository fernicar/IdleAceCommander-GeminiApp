
import React, { useEffect, useState } from 'react';
import { useGameState } from '../../contexts/GameStateContext';
import { TechNode } from '../../types/game.types';
import { TECH_TREE } from '../../utils/techTree';

const ResearchPanel: React.FC = () => {
  const { gameState, startResearch, completeResearch, updateResources } = useGameState();
  const [techTree, setTechTree] = useState<TechNode[]>(TECH_TREE);
  const [progress, setProgress] = useState(0);

  // Update tech tree based on completed research
  useEffect(() => {
    const updated = techTree.map((node) => {
      const isCompleted = gameState.research.completed.some((c) => c.id === node.id);
      if (isCompleted) return { ...node, status: 'completed' as const };

      const prereqsMet = node.prerequisites.every((prereqId) =>
        gameState.research.completed.some((c) => c.id === prereqId)
      );

      if (prereqsMet && node.status === 'locked') {
        return { ...node, status: 'available' as const };
      }

      return node;
    });

    setTechTree(updated);
  }, [gameState.research.completed]);

  // Update progress
  useEffect(() => {
    if (gameState.research.inProgress) {
      const interval = setInterval(() => {
        const elapsed = Date.now() - (gameState.research.inProgress?.researchStartTime || 0);
        // In DEBUG mode, research completes in 2 seconds regardless of actual researchTime
        const DEBUG = true; // Same DEBUG flag as used elsewhere
        const total = DEBUG ? 2000 : (gameState.research.inProgress?.researchTime || 1);
        const percentage = Math.min(100, (elapsed / total) * 100);
        setProgress(percentage);

        if (percentage >= 100) {
          completeResearch();
        }
      }, 100);

      return () => clearInterval(interval);
    } else {
      setProgress(0);
    }
  }, [gameState.research.inProgress]);

  const handleStartResearch = (node: TechNode) => {
    if (node.status !== 'available') return;
    if (gameState.resources.researchPoints < node.researchPointCost) return;
    if (gameState.research.inProgress) return;

    startResearch(node);
    updateResources(0, -node.researchPointCost);
  };

  const getRemainingTime = (): string => {
    if (!gameState.research.inProgress) return '0:00';
    const elapsed = Date.now() - (gameState.research.inProgress.researchStartTime || 0);
    const remaining = Math.max(0, gameState.research.inProgress.researchTime - elapsed);
    const seconds = Math.floor(remaining / 1000);
    const minutes = Math.floor(seconds / 60);
    return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'weapons': return 'fa-gun';
      case 'engines': return 'fa-rocket';
      case 'avionics': return 'fa-microchip';
      default: return 'fa-flask';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'weapons': return 'text-red-400';
      case 'engines': return 'text-blue-400';
      case 'avionics': return 'text-green-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="bg-gray-800 border-2 border-military-green p-6 rounded-lg h-full flex flex-col">
      <h2 className="text-2xl font-bold mb-4 text-military-tan">
        <i className="fas fa-microscope mr-2"></i>
        RESEARCH LAB
      </h2>

      {/* Current Research */}
      {gameState.research.inProgress && (
        <div className="bg-gray-900 p-4 rounded border border-hud-blue mb-4">
          <div className="text-xs text-gray-400 uppercase mb-2">
            Research In Progress
          </div>
          <div className="font-bold mb-2">{gameState.research.inProgress.name}</div>
          <div className="mb-2">
            <div className="flex justify-between text-xs mb-1">
              <span>Completion</span>
              <span>{getRemainingTime()}</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-2">
              <div
                className="h-full rounded-full bg-hud-blue transition-all"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* Tech Tree */}
      <div className="flex-1 overflow-y-auto space-y-2">
        {techTree.map((node) => {
          const canAfford = gameState.resources.researchPoints >= node.researchPointCost;
          const canResearch = node.status === 'available' && !gameState.research.inProgress;

          return (
            <div
              key={node.id}
              className={`bg-gray-900 p-3 rounded border ${
                node.status === 'completed'
                  ? 'border-green-500'
                  : node.status === 'available'
                  ? 'border-hud-blue'
                  : 'border-gray-700'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <div className="font-bold flex items-center">
                    <i
                      className={`fas ${getCategoryIcon(node.category)} mr-2 ${getCategoryColor(
                        node.category
                      )}`}
                    ></i>
                    {node.name}
                    {node.status === 'completed' && (
                      <i className="fas fa-check-circle ml-2 text-green-500"></i>
                    )}
                  </div>
                  <div className="text-xs text-gray-400">{node.description}</div>
                </div>
                <div className="text-right ml-2">
                  <div className="text-sm text-gray-400">Cost</div>
                  <div className="text-lg font-bold text-blue-400">
                    {node.researchPointCost}
                  </div>
                </div>
              </div>

              {node.status === 'available' && !gameState.research.inProgress && (
                <button
                  onClick={() => handleStartResearch(node)}
                  disabled={!canAfford}
                  className={`w-full py-2 rounded text-sm font-bold transition-colors ${
                    canAfford
                      ? 'bg-military-green hover:bg-green-600 text-white'
                      : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <i className="fas fa-flask mr-2"></i>
                  RESEARCH ({Math.floor(node.researchTime / 1000)}s)
                </button>
              )}

              {node.status === 'locked' && (
                <div className="text-xs text-gray-500 italic">
                  <i className="fas fa-lock mr-1"></i>
                  Requires: {node.prerequisites.join(', ')}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ResearchPanel;
