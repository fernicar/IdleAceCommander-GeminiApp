import { useState, useEffect } from 'react';
import { useGameState } from '../contexts/GameStateContext';
import { generateMission, calculatePlayerLevel } from '../utils/missionGenerator';
import { Mission } from '../types/game.types';

export const useMissionTimer = () => {
  const { gameState } = useGameState();
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [currentMission, setCurrentMission] = useState<Mission | null>(null);

  const playerLevel = calculatePlayerLevel(
    gameState.highScore,
    gameState.missions.completed.length
  );

  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      const nextTime = gameState.missions.nextMissionTime;
      const remaining = nextTime - now;

      if (remaining <= 0 && !currentMission) {
        // Generate new mission
        const mission = generateMission(playerLevel);
        setCurrentMission(mission);
        setTimeRemaining(0);
      } else {
        setTimeRemaining(Math.max(0, remaining));
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState.missions.nextMissionTime, currentMission, playerLevel]);

  const clearMission = () => setCurrentMission(null);

  return { timeRemaining, currentMission, clearMission, playerLevel };
};
