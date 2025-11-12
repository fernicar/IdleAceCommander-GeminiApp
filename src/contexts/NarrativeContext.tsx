import React, { createContext, useContext, useState, ReactNode } from 'react';
import { NarrativeState, Dialogue, WarProgress } from '../types/narrative.types';

interface NarrativeContextType {
  narrativeState: NarrativeState;
  addDialogue: (dialogue: Dialogue) => void;
  dismissDialogue: (id: string) => void;
  updateWarProgress: (progress: Partial<WarProgress>) => void;
  getCurrentDialogue: () => Dialogue | null;
}

const NarrativeContext = createContext<NarrativeContextType | undefined>(undefined);

const createInitialNarrativeState = (): NarrativeState => ({
  dialogues: [],
  currentDialogue: null,
  warProgress: {
    currentTheater: 'Eastern Pacific',
    enemyStrength: 'moderate',
    allyMorale: 70,
    territoryControl: 60,
    lastUpdate: Date.now(),
    statusDescription: 'The war effort continues with moderate success.',
  },
  generalMood: 'neutral',
});

export const NarrativeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [narrativeState, setNarrativeState] = useState<NarrativeState>(
    createInitialNarrativeState()
  );

  const addDialogue = (dialogue: Dialogue) => {
    setNarrativeState((prev) => ({
      ...prev,
      dialogues: [...prev.dialogues, dialogue],
      currentDialogue: dialogue,
    }));
  };

  const dismissDialogue = (id: string) => {
    setNarrativeState((prev) => ({
      ...prev,
      dialogues: prev.dialogues.map((d) => (d.id === id ? { ...d, dismissed: true } : d)),
      currentDialogue: null,
    }));
  };

  const updateWarProgress = (progress: Partial<WarProgress>) => {
    setNarrativeState((prev) => ({
      ...prev,
      warProgress: {
        ...prev.warProgress,
        ...progress,
        lastUpdate: Date.now(),
      },
    }));
  };

  const getCurrentDialogue = () => {
    return narrativeState.currentDialogue;
  };

  const value: NarrativeContextType = {
    narrativeState,
    addDialogue,
    dismissDialogue,
    updateWarProgress,
    getCurrentDialogue,
  };

  return <NarrativeContext.Provider value={value}>{children}</NarrativeContext.Provider>;
};

export const useNarrative = (): NarrativeContextType => {
  const context = useContext(NarrativeContext);
  if (!context) {
    throw new Error('useNarrative must be used within NarrativeProvider');
  }
  return context;
};
