import { Mission } from '@/types/game.types';

const MISSION_TEMPLATES = [
  { prefix: 'Operation', names: ['Thunderstrike', 'Iron Eagle', 'Sky Fortress', 'Storm Hunter', 'Night Raptor'] },
  { prefix: 'Mission', names: ['Crimson Dawn', 'Steel Phoenix', 'Shadow Wing', 'Arctic Viper', 'Desert Falcon'] },
  { prefix: 'Objective', names: ['Blackout', 'Crossfire', 'Guardian', 'Sentinel', 'Warhawk'] },
];

const DESCRIPTIONS = [
  'Enemy fighters detected in contested airspace. Engage and neutralize all hostile contacts.',
  'Multiple bogies inbound. Establish air superiority and protect allied assets.',
  'Hostile squadron threatens our position. Eliminate all enemy aircraft.',
  'Enemy force approaching critical zone. Intercept and destroy all targets.',
  'Air-to-air combat imminent. Engage enemy fighters and secure the sector.',
];

export const generateMission = (playerLevel: number): Mission => {
  const template = MISSION_TEMPLATES[Math.floor(Math.random() * MISSION_TEMPLATES.length)];
  const name = `${template.prefix} ${template.names[Math.floor(Math.random() * template.names.length)]}`;
  const description = DESCRIPTIONS[Math.floor(Math.random() * DESCRIPTIONS.length)];

  // Scale difficulty based on player level
  const difficultyRoll = Math.random();
  let difficulty: Mission['difficulty'];
  let difficultyMultiplier: number;

  if (playerLevel < 3) {
    difficulty = 'easy';
    difficultyMultiplier = 0.8;
  } else if (playerLevel < 6) {
    difficulty = difficultyRoll > 0.7 ? 'medium' : 'easy';
    difficultyMultiplier = difficultyRoll > 0.7 ? 1.2 : 0.8;
  } else if (playerLevel < 10) {
    difficulty = difficultyRoll > 0.6 ? 'hard' : difficultyRoll > 0.3 ? 'medium' : 'easy';
    difficultyMultiplier = difficultyRoll > 0.6 ? 1.6 : difficultyRoll > 0.3 ? 1.2 : 0.8;
  } else {
    difficulty = difficultyRoll > 0.5 ? 'extreme' : difficultyRoll > 0.25 ? 'hard' : 'medium';
    difficultyMultiplier = difficultyRoll > 0.5 ? 2.0 : difficultyRoll > 0.25 ? 1.6 : 1.2;
  }

  // Enemy count scales with difficulty and player level
  const baseEnemyCount = 2 + Math.floor(playerLevel / 2);
  const enemyCount = Math.max(2, Math.floor(baseEnemyCount * difficultyMultiplier));

  // Enemy stats scale with player level and difficulty
  const baseStats = {
    weaponStrength: 8 + playerLevel,
    speed: 4 + Math.floor(playerLevel / 2),
    agility: 4 + Math.floor(playerLevel / 2),
    intelligence: 40 + playerLevel * 2,
    endurance: 40 + playerLevel * 2,
  };

  const enemyStats = {
    weaponStrength: Math.floor(baseStats.weaponStrength * difficultyMultiplier),
    speed: Math.floor(baseStats.speed * difficultyMultiplier),
    agility: Math.floor(baseStats.agility * difficultyMultiplier),
    intelligence: Math.floor(baseStats.intelligence * difficultyMultiplier),
    endurance: Math.floor(baseStats.endurance * difficultyMultiplier),
  };

  // Rewards scale with difficulty
  const baseRewards = {
    credits: 150 + (playerLevel * 50),
    researchPoints: 5 + (playerLevel * 2),
    highScoreBonus: 100 + (playerLevel * 25),
  };

  const rewards = {
    credits: Math.floor(baseRewards.credits * difficultyMultiplier),
    researchPoints: Math.floor(baseRewards.researchPoints * difficultyMultiplier),
    highScoreBonus: Math.floor(baseRewards.highScoreBonus * difficultyMultiplier),
  };

  return {
    id: `mission-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name,
    description,
    difficulty,
    enemyCount,
    enemyStats,
    rewards,
    availableAt: Date.now(),
    cooldown: 60000, // 1 minute cooldown between missions
  };
};

export const calculatePlayerLevel = (highScore: number, missionsCompleted: number): number => {
  // Level based on high score and missions completed
  const scoreLevel = Math.floor(highScore / 1000);
  const missionLevel = Math.floor(missionsCompleted / 3);
  return Math.max(1, Math.min(20, scoreLevel + missionLevel));
};
