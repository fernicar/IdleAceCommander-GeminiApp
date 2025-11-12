
import React, { useEffect, useState } from 'react';
import { useGameState } from './contexts/GameStateContext';
import { useNarrative } from './contexts/NarrativeContext';
import { useOpenRouter } from './hooks/useOpenRouter';
import { BattleResults } from './types/combat.types';
import Header from './components/Header';
import IdleClickerView from './components/IdleClickerView';
import CombatSimulator from './components/CombatSimulator';
import GeneralMartinModal from './components/GeneralMartinModal';
import TutorialModal from './components/TutorialModal';
import {
  generateMissionBriefingPrompt,
  FALLBACK_BRIEFING,
} from './utils/dialogueGenerator';

const App: React.FC = () => {
  const { gameState, setCurrentView } = useGameState();
  const { narrativeState, addDialogue, dismissDialogue } = useNarrative();
  const { sendChatCompletion, loading } = useOpenRouter();
  const [transitioning, setTransitioning] = useState(false);
  const [previousView, setPreviousView] = useState(gameState.currentView);
  const [showTutorial, setShowTutorial] = useState(false);

  // Check if tutorial should be shown
  useEffect(() => {
    const tutorialCompleted = localStorage.getItem('tutorial-completed');
    if (!tutorialCompleted) {
      setShowTutorial(true);
    }
  }, []);

  // Handle view transitions
  useEffect(() => {
    if (previousView !== gameState.currentView) {
      setTransitioning(true);
      setTimeout(() => {
        setPreviousView(gameState.currentView);
        setTransitioning(false);
      }, 300);
    }
  }, [gameState.currentView, previousView]);
  // Handle mission briefing
  useEffect(() => {
    if (gameState.currentView === 'general-briefing' && gameState.currentMission) {
      const generateBriefing = async () => {
        const apiKey = localStorage.getItem('idle-ace-api-key') || '';
        const model = localStorage.getItem('idle-ace-model') || 'x-ai/grok-4-fast';

        let briefingText = FALLBACK_BRIEFING;

        if (apiKey) {
          const messages = generateMissionBriefingPrompt(
            gameState.currentMission!,
            narrativeState.warProgress
          );

          const response = await sendChatCompletion(apiKey, model, messages);
          if (response) {
            briefingText = response;
          }
        }

        addDialogue({
          id: `briefing-${Date.now()}`,
          type: 'mission-brief',
          speaker: 'general-martin',
          text: briefingText,
          timestamp: Date.now(),
          dismissed: false,
        });
      };

      generateBriefing();
    }
  }, [gameState.currentView, gameState.currentMission]);

  const handleDialogueDismiss = () => {
    if (narrativeState.currentDialogue) {
      dismissDialogue(narrativeState.currentDialogue.id);

      // Proceed based on dialogue type
      if (narrativeState.currentDialogue.type === 'mission-brief') {
        setCurrentView('combat');
      }
    }
  };

  const handleMissionComplete = (results: BattleResults) => {
    // Mission results are now handled directly in CombatSimulator/ResultsScreen
    // When ResultsScreen is dismissed, transition back to idle view
    setCurrentView('idle');
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      {gameState.currentView !== 'combat' && <Header onShowTutorial={() => setShowTutorial(true)} />}
      
      <main 
        className={`${gameState.currentView === 'combat' ? '' : 'container mx-auto px-4 py-6'} transition-opacity duration-300 ${
          transitioning ? 'opacity-0' : 'opacity-100'
        }`}
      >
        {gameState.currentView === 'idle' && <IdleClickerView />}
        
        {gameState.currentView === 'combat' && (
          <CombatSimulator onMissionComplete={handleMissionComplete} />
        )}
      </main>

      {/* General Martin Modal - Only show for non-mission-result dialogues or when not in combat */}
      {narrativeState.currentDialogue && !narrativeState.currentDialogue.dismissed &&
       (narrativeState.currentDialogue.type !== 'mission-result' || gameState.currentView !== 'combat') && (
        <GeneralMartinModal
          dialogue={narrativeState.currentDialogue}
          onDismiss={handleDialogueDismiss}
        />
      )}

      {/* Tutorial Modal */}
      <TutorialModal isOpen={showTutorial} onClose={() => setShowTutorial(false)} />

      {/* Loading Indicator */}
      {loading && (
        <div className="fixed bottom-4 right-4 bg-gray-800 border-2 border-military-green rounded-lg p-4 z-40">
          <i className="fas fa-spinner fa-spin mr-2"></i>
          Communicating with General Martin...
        </div>
      )}
    </div>
  );
};

export default App;
