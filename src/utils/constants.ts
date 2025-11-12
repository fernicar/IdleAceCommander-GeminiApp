// Game Balance Constants
export const BALANCE = {
  // Mission Generation
  MISSION_BASE_COOLDOWN: 60000, // 1 minute
  ENEMY_POWER_SCALING: 0.1, // Per player level

  // Upgrades
  UPGRADE_BASE_COST: 100,
  UPGRADE_COST_SCALING: 1.5, // Multiplier per level
  MAX_UPGRADE_LEVEL: 10,

  // Training
  TRAINING_COST: 50,
  TRAINING_PROGRESS_PER_SESSION: 10,
  LEVEL_UP_THRESHOLD: 100,

  // Research
  RESEARCH_BASE_TIME: 30000, // 30 seconds
  RESEARCH_BASE_COST: 20,

  // Combat
  BASE_BATTLE_DURATION: 30000, // 30 seconds
  HIT_ACCURACY: 0.7, // 70% of shots hit
  KILL_CHANCE_ON_HIT: 0.3, // 30% of hits are kills

  // Scoring
  SCORE_PER_KILL: 100,
  PERFECT_VICTORY_BONUS: 0.5, // 50% bonus for no losses
  DIFFICULTY_MULTIPLIERS: {
    easy: 1.0,
    medium: 1.5,
    hard: 2.0,
    extreme: 3.0,
  },
};

// UI Constants
export const UI = {
  TYPEWRITER_SPEED: 30, // ms per character
  TRANSITION_DURATION: 300, // ms
  AUTO_SAVE_INTERVAL: 30000, // 30 seconds
};

// API Constants
export const API = {
  OPENROUTER_URL: 'https://openrouter.ai/api/v1/chat/completions',
  DEFAULT_MODEL: 'x-ai/grok-4-fast',
  MAX_TOKENS: 500,
  TEMPERATURE: 0.8,
};
