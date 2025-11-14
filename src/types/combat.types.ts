import * as THREE from 'three';

// ============================================
// BATTLE STATE
// ============================================

export interface BattleState {
  status: 'preparing' | 'active' | 'victory' | 'defeat';
  startTime: number;
  endTime: number | null;

  // Combatants
  alliedJets: BattleEntity[];
  enemyJets: BattleEntity[];

  // Tactical Settings
  playerTactic: 'aggressive' | 'defensive';

  // Pre-determined Outcomes
  scheduledEvents: BattleEvent[];
  executedEvents: BattleEvent[];

  // Visual Effects
  tracers: TracerState[];
  missiles: MissileState[];
  flares: FlareState[];

  // Results
  results: BattleResults | null;
}

// ============================================
// COMBAT STATE TYPES (from PoC.tsx)
// ============================================

export interface BurstState {
  active: boolean;
  burstsLeft: number;
  tracersLeftInBurst: number;
  nextShotTimer: number;
  isKillShot: boolean;
}

export interface FlareDeploymentState {
  deploying: boolean;
  flaresLeft: number;
  nextFlareTimer: number;
}

export interface TracerState {
  id: string;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  quaternion: THREE.Quaternion;
  life: number;
}

export interface MissileState {
  id: string;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  quaternion: THREE.Quaternion;
  life: number;
  targetId: string | null;
  willDetonate: boolean;
}

export interface FlareState {
  id: string;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  life: number;
}

// ============================================
// BATTLE ENTITIES
// ============================================

export interface BattleEntity {
  id: string;
  originalJetId: string;      // Links back to FighterJet
  team: 'allied' | 'enemy';

  // Current State
  health: number;
  maxHealth: number;
  position: [number, number, number];
  velocity: [number, number, number];
  quaternion: [number, number, number, number]; // For proper 3D rotation

  // Target
  targetId: string | null;
  partnerId: string | null; // For wingman formations

  // Stats (from FighterJet + Pilot)
  weaponStrength: number;
  speed: number;
  agility: number;
  intelligence: number;
  endurance: number;

  // Combat Status
  isDestroyed: boolean;
  isWrecked: boolean; // Separate from destroyed for wreckage physics
  destroyedAt: number | null;
  isEscaping: boolean;
  killCount: number;

  // AI State (from PoC.tsx)
  aiState: 'attacking' | 'following';
  roleChangeTimer: number;
  disengagementAltitude: number | null;

  // Combat State
  fireCooldown: number;
  burstState: BurstState;
  flareState: FlareDeploymentState;
  wreckageAngularVelocity: [number, number, number] | null;

  // Cinematic Kill State
  cinematicKillTargetId: string | null;
  isTargetOfCinematicKill: boolean;

  // Legacy behavior state (for compatibility)
  behaviorState: 'idle' | 'pursuing' | 'attacking' | 'evading' | 'regrouping' | 'escaping';
  behaviorTimer: number;
}

// ============================================
// BATTLE EVENTS
// ============================================

export interface BattleEvent {
  timestamp: number;            // ms since battle start
  type: 'hit' | 'miss' | 'destroy' | 'escape';
  attackerId: string;
  targetId: string;
  damage?: number;
  resultingHealth?: number;
}

// ============================================
// BATTLE RESULTS
// ============================================

export interface BattleResults {
  victory: boolean;
  survivingAllied: number;
  destroyedAllied: number;
  survivingEnemy: number;
  destroyedEnemy: number;
  enemiesEscaped: number;
  duration: number;
  rewards: {
    credits: number;
    researchPoints: number;
    highScoreBonus: number;
  };
  pilotStats: {
    pilotId: string;
    kills: number;
    damage: number;
    survival: boolean;
  }[];
}

// ============================================
// TACTICAL BEHAVIORS
// ============================================

export interface TacticalBehavior {
  formation: 'spread' | 'tight' | 'flanking';
  engagement: 'aggressive' | 'defensive';
  targetSelection: 'nearest' | 'weakest' | 'strongest';
}

// ============================================
// HUD / IFF SYSTEMS
// ============================================

export interface TargetLock {
  targetId: string;
  lockStrength: number;      // 0-100%
  timeToIntercept: number;   // seconds
  closureRate: number;       // m/s (positive = closing)
  iffStatus: 'friend' | 'foe' | 'unknown';
}

export interface HUDState {
  primaryTarget: TargetLock | null;
  secondaryTargets: TargetLock[];
  radarMode: 'search' | 'track' | 'boresight';
}