import { Mission } from '@/types/game.types';
import { BattleResults } from '@/types/combat.types';

export const calculateMissionScore = (
  mission: Mission,
  results: BattleResults
): number => {
  let score = results.rewards.highScoreBonus;

  // Bonus for perfect victory (no losses)
  if (results.victory && results.destroyedAllied === 0) {
    score += mission.rewards.highScoreBonus * 0.5; // 50% bonus
  }

  // Bonus for difficulty
  const difficultyMultiplier = {
    easy: 1.0,
    medium: 1.5,
    hard: 2.0,
    extreme: 3.0,
  };

  score *= difficultyMultiplier[mission.difficulty as keyof typeof difficultyMultiplier];

  // Bonus for enemy count
  score += results.destroyedEnemy * 100;

  return Math.floor(score);
};

export const getScoreRank = (highScore: number): string => {
  if (highScore < 1000) return 'RECRUIT';
  if (highScore < 5000) return 'LIEUTENANT';
  if (highScore < 10000) return 'CAPTAIN';
  if (highScore < 25000) return 'MAJOR';
  if (highScore < 50000) return 'COLONEL';
  if (highScore < 100000) return 'GENERAL';
  return 'ACE COMMANDER';
};
