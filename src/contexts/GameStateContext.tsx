import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { GameState, FighterJet, Pilot, Mission, TechNode } from '../types/game.types';

// Debug mode for faster mission timers
const DEBUG = true;

// ============================================
// CONTEXT TYPE
// ============================================

interface GameStateContextType {
  gameState: GameState;
  updateResources: (credits: number, researchPoints: number) => void;
  updateHighScore: (points: number) => void;
  setCurrentView: (view: GameState['currentView']) => void;
  setCurrentMission: (mission: Mission | null) => void;
  updateSquadron: (squadron: FighterJet[]) => void;
  updatePilots: (pilots: Pilot[]) => void;
  startResearch: (tech: TechNode) => void;
  completeResearch: () => void;
  addCompletedMission: (mission: Mission) => void;
  upgradeJet: (jetId: string, upgradeType: 'weapons' | 'engines' | 'avionics') => void;
  trainPilot: (pilotId: string, stat: 'intelligence' | 'endurance', amount: number) => void;
  updateTTSSettings: (settings: Partial<GameState['settings']['tts']>) => void;
  saveGame: () => void;
  resetGame: () => void;
}

// ============================================
// CREATE CONTEXT
// ============================================

const GameStateContext = createContext<GameStateContextType | undefined>(undefined);

// ============================================
// INITIAL STATE
// ============================================

const createInitialState = (): GameState => ({
  highScore: 0,
  gameStartTime: Date.now(),
  lastSaveTime: Date.now(),
  currentView: 'idle',
  currentMission: null,

  resources: {
    credits: 1000,
    researchPoints: 0,
  },

  squadron: [
    {
      id: 'jet-1',
      name: 'Falcon One',
      level: 1,
      baseWeaponStrength: 10,
      baseSpeed: 5,
      baseAgility: 5,
      upgrades: {
        weapons: 0,
        engines: 0,
        avionics: 0,
      },
      computedStats: {
        weaponStrength: 10,
        speed: 5,
        agility: 5,
      },
      assignedPilotId: 'pilot-1',
      color: 'green',
    },
    {
      id: 'jet-2',
      name: 'Falcon Two',
      level: 1,
      baseWeaponStrength: 10,
      baseSpeed: 5,
      baseAgility: 5,
      upgrades: {
        weapons: 0,
        engines: 0,
        avionics: 0,
      },
      computedStats: {
        weaponStrength: 10,
        speed: 5,
        agility: 5,
      },
      assignedPilotId: 'pilot-2',
      color: 'green',
    },
  ],

  pilots: [
    {
      id: 'pilot-1',
      callsign: 'Maverick',
      rank: 'Lieutenant',
      level: 1,
      intelligence: 50,
      endurance: 50,
      trainingProgress: {
        intelligence: 0,
        endurance: 0,
      },
      assignedJetId: 'jet-1',
      missionsFlown: 0,
      kills: 0,
      survivalStreak: 0,
    },
    {
      id: 'pilot-2',
      callsign: 'Viper',
      rank: 'Lieutenant',
      level: 1,
      intelligence: 50,
      endurance: 50,
      trainingProgress: {
        intelligence: 0,
        endurance: 0,
      },
      assignedJetId: 'jet-2',
      missionsFlown: 0,
      kills: 0,
      survivalStreak: 0,
    },
  ],

  research: {
    completed: [],
    inProgress: null,
    available: [],
    tree: [], // Will be populated from tech tree data
  },

  missions: {
    available: [],
    completed: [],
    lastCompletedTime: 0,
    nextMissionTime: Date.now() + (DEBUG ? 2000 : 60000), // 2 seconds in DEBUG, 1 minute otherwise
  },

  settings: {
    apiKey: '',
    selectedModel: 'x-ai/grok-4-fast',
    volume: 50,
    showTutorial: true,
    tts: {
      enabled: false,
      voice: '',
      rate: 1.0,
      pitch: 1.0,
      volume: 1.0,
    },
  },
});

// ============================================
// PROVIDER COMPONENT
// ============================================

export const GameStateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [gameState, setGameState] = useState<GameState>(() => {
    // Load from LocalStorage if available
    const saved = localStorage.getItem('idle-ace-commander-save');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const initial = createInitialState();
        // Deep merge settings to ensure new TTS settings are added
        return {
          ...initial,
          ...parsed,
          settings: {
            ...initial.settings,
            ...parsed.settings,
            tts: {
              ...initial.settings.tts,
              ...(parsed.settings?.tts || {}),
            },
          },
        };
      } catch (error) {
        console.error('Failed to parse save data:', error);
        return createInitialState();
      }
    }
    return createInitialState();
  });

  // Auto-save every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      saveGame();
    }, 30000);

    return () => clearInterval(interval);
  }, [gameState]);

  // Save to LocalStorage
  const saveGame = () => {
    const saveData = {
      ...gameState,
      lastSaveTime: Date.now(),
    };
    localStorage.setItem('idle-ace-commander-save', JSON.stringify(saveData));
    console.log('Game saved');
  };

  // Update resources
  const updateResources = (credits: number, researchPoints: number) => {
    setGameState(prev => ({
      ...prev,
      resources: {
        credits: Math.max(0, prev.resources.credits + credits),
        researchPoints: Math.max(0, prev.resources.researchPoints + researchPoints),
      },
    }));
  };

  // Update high score
  const updateHighScore = (points: number) => {
    setGameState(prev => ({
      ...prev,
      highScore: prev.highScore + points,
    }));
  };

  // Set current view
  const setCurrentView = (view: GameState['currentView']) => {
    setGameState(prev => ({ ...prev, currentView: view }));
  };

  // Set current mission
  const setCurrentMission = (mission: Mission | null) => {
    setGameState(prev => ({ ...prev, currentMission: mission }));
  };

  // Update squadron
  const updateSquadron = (squadron: FighterJet[]) => {
    setGameState(prev => ({ ...prev, squadron }));
  };

  // Update pilots
  const updatePilots = (pilots: Pilot[]) => {
    setGameState(prev => ({ ...prev, pilots }));
  };

  // Start research
  const startResearch = (tech: TechNode) => {
    setGameState(prev => ({
      ...prev,
      research: {
        ...prev.research,
        inProgress: {
          ...tech,
          status: 'researching',
          researchStartTime: Date.now(),
        },
      },
    }));
  };

  // Complete research
  const completeResearch = () => {
    setGameState(prev => {
      if (!prev.research.inProgress) return prev;

      return {
        ...prev,
        research: {
          ...prev.research,
          completed: [...prev.research.completed, {
            ...prev.research.inProgress,
            status: 'completed',
          }],
          inProgress: null,
        },
      };
    });
  };

  // Add completed mission
  const addCompletedMission = (mission: Mission) => {
    setGameState(prev => ({
      ...prev,
      missions: {
        ...prev.missions,
        completed: [...prev.missions.completed, mission],
        lastCompletedTime: Date.now(),
        nextMissionTime: Date.now() + (DEBUG ? 2000 : 60000), // Next mission available in 2 seconds (DEBUG) or 1 minute
      },
    }));
  };

  // Upgrade jet
  const upgradeJet = (jetId: string, upgradeType: 'weapons' | 'engines' | 'avionics') => {
    setGameState(prev => ({
      ...prev,
      squadron: prev.squadron.map(jet => {
        if (jet.id === jetId) {
          const newUpgrades = {
            ...jet.upgrades,
            [upgradeType]: Math.min(10, jet.upgrades[upgradeType] + 1),
          };

          // Recalculate computed stats
          const computedStats = {
            weaponStrength: jet.baseWeaponStrength + (newUpgrades.weapons * 2),
            speed: jet.baseSpeed + (newUpgrades.engines * 1),
            agility: jet.baseAgility + (newUpgrades.avionics * 1),
          };

          return {
            ...jet,
            upgrades: newUpgrades,
            computedStats,
          };
        }
        return jet;
      }),
    }));
  };

  // Train pilot
  const trainPilot = (pilotId: string, stat: 'intelligence' | 'endurance', amount: number) => {
    setGameState(prev => ({
      ...prev,
      pilots: prev.pilots.map(pilot => {
        if (pilot.id === pilotId) {
          const newProgress = pilot.trainingProgress[stat] + amount;

          if (newProgress >= 100) {
            // Level up!
            return {
              ...pilot,
              [stat]: Math.min(100, pilot[stat] + 10),
              level: pilot.level + 1,
              trainingProgress: {
                ...pilot.trainingProgress,
                [stat]: newProgress - 100,
              },
            };
          } else {
            return {
              ...pilot,
              trainingProgress: {
                ...pilot.trainingProgress,
                [stat]: newProgress,
              },
            };
          }
        }
        return pilot;
      }),
    }));
  };

  // Update TTS settings
  const updateTTSSettings = (ttsSettings: Partial<GameState['settings']['tts']>) => {
    setGameState(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        tts: {
          ...prev.settings.tts,
          ...ttsSettings,
        },
      },
    }));
  };

  // Reset game
  const resetGame = () => {
    localStorage.removeItem('idle-ace-commander-save');
    setGameState(createInitialState());
  };

  const value: GameStateContextType = {
    gameState,
    updateResources,
    updateHighScore,
    setCurrentView,
    setCurrentMission,
    updateSquadron,
    updatePilots,
    startResearch,
    completeResearch,
    addCompletedMission,
    upgradeJet,
    trainPilot,
    updateTTSSettings,
    saveGame,
    resetGame,
  };

  return (
    <GameStateContext.Provider value={value}>
      {children}
    </GameStateContext.Provider>
  );
};

// ============================================
// CUSTOM HOOK
// ============================================

export const useGameState = (): GameStateContextType => {
  const context = useContext(GameStateContext);
  if (!context) {
    throw new Error('useGameState must be used within GameStateProvider');
  }
  return context;
};
