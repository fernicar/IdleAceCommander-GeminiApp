import React, { useState, useEffect } from 'react';
import { useGameState } from '../../contexts/GameStateContext';
import { useNarrative } from '../../contexts/NarrativeContext';
import { useOpenRouter } from '../../hooks/useOpenRouter';
import { useBattleSimulation } from '../../hooks/useBattleSimulation';
import ThreeJsScene from './ThreeJsScene';
import ResultsScreen from './ResultsScreen';
import { HUD } from './HUD';
import { BattleResults } from '../../types/combat.types';
import {
  generateMissionResultsPrompt,
  FALLBACK_VICTORY,
  FALLBACK_DEFEAT,
} from '../../utils/dialogueGenerator';
import { calculateMissionScore } from '../../utils/scoreCalculations';

interface CombatSimulatorProps {
  onMissionComplete?: (results: BattleResults) => void;
}

const CombatSimulator: React.FC<CombatSimulatorProps> = ({ onMissionComplete }) => {
  const { gameState, setCurrentView, updateResources, updateHighScore, addCompletedMission, updatePilots } =
    useGameState();
  const { narrativeState } = useNarrative();
  const { sendChatCompletion } = useOpenRouter();
  const [tactic, setTactic] = useState<'aggressive' | 'defensive'>('aggressive');
  const [hasGeneratedResults, setHasGeneratedResults] = useState(false);
  const [hasAppliedRewards, setHasAppliedRewards] = useState(false);
  const [resultsDialogue, setResultsDialogue] = useState<string>('');

  const { battleState, initializeBattle, forceEndBattle } = useBattleSimulation(
    gameState.squadron,
    gameState.pilots,
    gameState.currentMission,
    tactic,
    gameState.debugMode,
    gameState.respawnEnabled,
    gameState.preCalculatedOutcome
  );

  // Initialize battle on mount
  useEffect(() => {
    initializeBattle();
  }, []);

  // Apply rewards and update pilot stats when battle ends
  useEffect(() => {
    if (!battleState?.results || hasAppliedRewards) return;
    if (battleState.status !== 'victory' && battleState.status !== 'defeat') return;

    const missionScore = gameState.currentMission
      ? calculateMissionScore(gameState.currentMission, battleState.results)
      : battleState.results.rewards.highScoreBonus;

    console.info('Applying mission rewards:', {
      credits: battleState.results.rewards.credits,
      researchPoints: battleState.results.rewards.researchPoints,
      missionScore,
      victory: battleState.results.victory
    });

    updateResources(
      battleState.results.rewards.credits,
      battleState.results.rewards.researchPoints
    );
    updateHighScore(missionScore);

    // Update pilot stats based on battle results
    const survivingPilots = battleState.results.pilotStats.filter(stat => stat.survival).map(stat =>
      gameState.pilots.find(pilot => pilot.id === stat.pilotId)
    ).filter(Boolean) as typeof gameState.pilots;

    const killedPilots = battleState.results.pilotStats.filter(stat => !stat.survival).map(stat =>
      gameState.pilots.find(pilot => pilot.id === stat.pilotId)
    ).filter(Boolean) as typeof gameState.pilots;

    // Distribute kills among surviving pilots
    const totalKills = battleState.results.destroyedEnemy;
    const killsPerSurvivingPilot = survivingPilots.length > 0 ? Math.floor(totalKills / survivingPilots.length) : 0;
    const extraKills = survivingPilots.length > 0 ? totalKills % survivingPilots.length : 0;

    const updatedPilots = gameState.pilots.map(pilot => {
      const isSurviving = survivingPilots.some(p => p.id === pilot.id);
      const isKilled = killedPilots.some(p => p.id === pilot.id);

      if (isSurviving) {
        // Calculate kills for this pilot (distribute evenly with some getting extra)
        const pilotIndex = survivingPilots.findIndex(p => p.id === pilot.id);
        const baseKills = killsPerSurvivingPilot;
        const extraKill = pilotIndex < extraKills ? 1 : 0;
        const pilotKills = baseKills + extraKill;

        return {
          ...pilot,
          missionsFlown: pilot.missionsFlown + 1,
          kills: pilot.kills + pilotKills,
          survivalStreak: pilot.survivalStreak + 1, // Increment survival streak
        };
      } else if (isKilled) {
        return {
          ...pilot,
          missionsFlown: pilot.missionsFlown + 1,
          survivalStreak: 0, // Reset survival streak on death
        };
      }

      return pilot;
    });

    updatePilots(updatedPilots);

    if (gameState.currentMission) {
      addCompletedMission(gameState.currentMission);
    }

    setHasAppliedRewards(true);
  }, [battleState?.status, hasAppliedRewards]);

  // Generate AI results dialogue when battle ends
  useEffect(() => {
    const generateResultsDialogue = async () => {
      if (!battleState?.results || !gameState.currentMission || hasGeneratedResults) return;
      if (battleState.status !== 'victory' && battleState.status !== 'defeat') return;

      setHasGeneratedResults(true);

      const apiKey = localStorage.getItem('idle-ace-api-key') || '';
      const model = localStorage.getItem('idle-ace-model') || 'x-ai/grok-beta';

      let resultsText = battleState.results.victory ? FALLBACK_VICTORY : FALLBACK_DEFEAT;

      if (apiKey) {
        const messages = generateMissionResultsPrompt(
          gameState.currentMission,
          battleState.results,
          narrativeState.warProgress
        );

        const response = await sendChatCompletion(apiKey, model, messages);
        if (response) {
          resultsText = response;
        }
      }

      setResultsDialogue(resultsText);
    };

    if (battleState && (battleState.status === 'victory' || battleState.status === 'defeat')) {
      generateResultsDialogue();
    }
  }, [battleState?.status, hasGeneratedResults]);

  const handleReturnToBase = () => {
    // Rewards already applied automatically, just handle navigation
    setTimeout(() => {
      if (battleState?.results) {
        if (onMissionComplete) {
          onMissionComplete(battleState.results);
        } else {
          setCurrentView('idle');
        }
      }
    }, 100); // Small delay ensures smooth state propagation
  };

  if (!battleState) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-6xl text-hud-blue mb-4"></i>
          <p className="text-xl">Initializing Combat Systems...</p>
        </div>
      </div>
    );
  }

  if (battleState.status === 'victory' || battleState.status === 'defeat') {
    return <ResultsScreen results={battleState.results!} onReturn={handleReturnToBase} dialogueText={resultsDialogue} />;
  }

  return (
    <div className="relative h-screen bg-gray-900 overflow-hidden">
      {/* Three.js Scene */}
      <div className="absolute inset-0">
        <ThreeJsScene
          alliedJets={battleState.alliedJets}
          enemyJets={battleState.enemyJets}
          tracers={battleState.tracers}
          missiles={battleState.missiles}
          flares={battleState.flares}
          recentEvents={battleState.executedEvents.slice(-5)}
        />
      </div>

      {/* New HUD System */}
      <HUD
        battleState={battleState}
        cameraPosition={[0, 50, 100]}
        cameraRotation={[0, 0, 0]}
      />

      {/* Skip Button */}
      {gameState.debugMode && (
        <div className="absolute top-4 right-4 z-50">
          <button
            onClick={forceEndBattle}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded border-2 border-red-400 font-bold shadow-lg"
          >
            Skip
          </button>
        </div>
      )}

      {/* Event Log */}
      <div className="absolute top-1/3 left-4 -translate-y-full -translate-y-4 bg-gray-800 bg-opacity-90 p-4 rounded border-2 border-military-green max-w-md pointer-events-none">
        <div className="text-xs text-gray-400 uppercase mb-2">Combat Log</div>
        <div className="space-y-1 text-sm max-h-32 overflow-y-auto">
          {battleState.executedEvents.slice(-5).map((event, i) => (
            <div key={i} className="text-gray-300">
              {event.type === 'hit' && '💥 Direct hit!'}
              {event.type === 'destroy' && '☠️ Target destroyed!'}
              {event.type === 'escape' && '🚀 Enemy escaping!'}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CombatSimulator;