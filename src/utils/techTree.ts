import { TechNode } from '@/types/game.types';

export const TECH_TREE: TechNode[] = [
  // Tier 1 - Basic Upgrades
  {
    id: 'weapons-1',
    name: 'Advanced Missiles',
    description: 'Unlocks Weapon Upgrade Level 3',
    category: 'weapons',
    researchTime: 30000, // 30 seconds
    researchPointCost: 20,
    prerequisites: [],
    unlocks: {
      upgradeType: 'weapons',
      levelUnlocked: 3,
      statBonus: 2,
    },
    status: 'available',
    researchStartTime: null,
  },
  {
    id: 'engines-1',
    name: 'Afterburner Technology',
    description: 'Unlocks Engine Upgrade Level 3',
    category: 'engines',
    researchTime: 30000,
    researchPointCost: 20,
    prerequisites: [],
    unlocks: {
      upgradeType: 'engines',
      levelUnlocked: 3,
      statBonus: 1,
    },
    status: 'available',
    researchStartTime: null,
  },
  {
    id: 'avionics-1',
    name: 'Fly-by-Wire Systems',
    description: 'Unlocks Avionics Upgrade Level 3',
    category: 'avionics',
    researchTime: 30000,
    researchPointCost: 20,
    prerequisites: [],
    unlocks: {
      upgradeType: 'avionics',
      levelUnlocked: 3,
      statBonus: 1,
    },
    status: 'available',
    researchStartTime: null,
  },

  // Tier 2 - Intermediate
  {
    id: 'weapons-2',
    name: 'Plasma Cannons',
    description: 'Unlocks Weapon Upgrade Level 6',
    category: 'weapons',
    researchTime: 60000, // 1 minute
    researchPointCost: 50,
    prerequisites: ['weapons-1'],
    unlocks: {
      upgradeType: 'weapons',
      levelUnlocked: 6,
      statBonus: 3,
    },
    status: 'locked',
    researchStartTime: null,
  },
  {
    id: 'engines-2',
    name: 'Ion Propulsion',
    description: 'Unlocks Engine Upgrade Level 6',
    category: 'engines',
    researchTime: 60000,
    researchPointCost: 50,
    prerequisites: ['engines-1'],
    unlocks: {
      upgradeType: 'engines',
      levelUnlocked: 6,
      statBonus: 2,
    },
    status: 'locked',
    researchStartTime: null,
  },
  {
    id: 'avionics-2',
    name: 'Neural Interface',
    description: 'Unlocks Avionics Upgrade Level 6',
    category: 'avionics',
    researchTime: 60000,
    researchPointCost: 50,
    prerequisites: ['avionics-1'],
    unlocks: {
      upgradeType: 'avionics',
      levelUnlocked: 6,
      statBonus: 2,
    },
    status: 'locked',
    researchStartTime: null,
  },

  // Tier 3 - Advanced
  {
    id: 'weapons-3',
    name: 'Antimatter Warheads',
    description: 'Unlocks Weapon Upgrade Level 10',
    category: 'weapons',
    researchTime: 120000, // 2 minutes
    researchPointCost: 100,
    prerequisites: ['weapons-2'],
    unlocks: {
      upgradeType: 'weapons',
      levelUnlocked: 10,
      statBonus: 5,
    },
    status: 'locked',
    researchStartTime: null,
  },
  {
    id: 'engines-3',
    name: 'Quantum Drive',
    description: 'Unlocks Engine Upgrade Level 10',
    category: 'engines',
    researchTime: 120000,
    researchPointCost: 100,
    prerequisites: ['engines-2'],
    unlocks: {
      upgradeType: 'engines',
      levelUnlocked: 10,
      statBonus: 3,
    },
    status: 'locked',
    researchStartTime: null,
  },
  {
    id: 'avionics-3',
    name: 'AI Autopilot',
    description: 'Unlocks Avionics Upgrade Level 10',
    category: 'avionics',
    researchTime: 120000,
    researchPointCost: 100,
    prerequisites: ['avionics-2'],
    unlocks: {
      upgradeType: 'avionics',
      levelUnlocked: 10,
      statBonus: 3,
    },
    status: 'locked',
    researchStartTime: null,
  },
];
