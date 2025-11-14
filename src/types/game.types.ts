import { BattleEvent, BattleResults } from './combat.types';

// ============================================
// CORE GAME STATE TYPES
// ============================================

export interface PreCalculatedOutcome {
  events: BattleEvent[];
  results: BattleResults;
}

export interface GameState {
  // Meta
  highScore: number;
  gameStartTime: number;
  lastSaveTime: number;

  // Current Activity
  currentView: 'idle' | 'combat' | 'general-briefing' | 'general-results';
  currentMission: Mission | null;
  preCalculatedOutcome: PreCalculatedOutcome | null;
  debugMode: boolean;
  respawnEnabled: boolean;

  // Player Resources
  resources: {
    credits: number;
    researchPoints: number;
  };

  // Squadron Data
  squadron: FighterJet[];
  pilots: Pilot[];

  // Research & Tech
  research: ResearchState;

  // Mission System
  missions: MissionState;

  // Settings
  settings: Settings;
}

// ============================================
// FIGHTER JET & PILOT TYPES
// ============================================

export interface FighterJet {
  id: string;
  name: string;
  level: number;

  // Base Stats (from aircraft type)
  baseWeaponStrength: number;
  baseSpeed: number;
  baseAgility: number;

  // Upgrade Levels
  upgrades: {
    weapons: number;      // 0-10
    engines: number;      // 0-10
    avionics: number;     // 0-10
  };

  // Computed Stats (base + upgrades)
  computedStats: {
    weaponStrength: number;
    speed: number;
    agility: number;
  };

  // Assignment
  assignedPilotId: string | null;

  // Visual
  color: 'green' | 'red';
}

export interface Pilot {
  id: string;
  callsign: string;
  rank: string;
  level: number;

  // Pilot Stats
  intelligence: number;   // 1-100, affects accuracy
  endurance: number;      // 1-100, affects sustained combat

  // Training Progress
  trainingProgress: {
    intelligence: number; // 0-100 progress to next level
    endurance: number;    // 0-100 progress to next level
  };

  // Assignment
  assignedJetId: string | null;

  // Experience & Performance
  missionsFlown: number;
  kills: number;
  survivalStreak: number; // Consecutive missions survived
}

// ============================================
// MISSION TYPES
// ============================================

export interface Mission {
  id: string;
  name: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'extreme';

  // Enemy Configuration
  enemyCount: number;
  enemyStats: {
    weaponStrength: number;
    speed: number;
    agility: number;
    intelligence: number;
    endurance: number;
  };

  // Rewards
  rewards: {
    credits: number;
    researchPoints: number;
    highScoreBonus: number;
  };

  // Timing
  availableAt: number;
  cooldown: number;       // ms until next mission available
}

export interface MissionState {
  available: Mission[];
  completed: Mission[];
  lastCompletedTime: number;
  nextMissionTime: number;
}

// ============================================
// RESEARCH & TECH TREE
// ============================================

export interface TechNode {
  id: string;
  name: string;
  description: string;
  category: 'weapons' | 'engines' | 'avionics' | 'pilot';

  // Requirements
  researchTime: number;         // ms to complete research
  researchPointCost: number;
  prerequisites: string[];      // IDs of required tech

  // Unlocks
  unlocks: {
    upgradeType: 'weapons' | 'engines' | 'avionics' | 'intelligence' | 'endurance';
    levelUnlocked: number;
    statBonus: number;
  };

  // State
  status: 'locked' | 'available' | 'researching' | 'completed';
  researchStartTime: number | null;
}

export interface ResearchState {
  completed: TechNode[];
  inProgress: TechNode | null;
  available: TechNode[];
  tree: TechNode[];
}

// ============================================
// SETTINGS
// ============================================

export interface Settings {
  apiKey: string;
  selectedModel: string;
  volume: number;
  showTutorial: boolean;
  tts: {
    enabled: boolean;
    voice: string;
    rate: number;
    pitch: number;
    volume: number;
  };
}