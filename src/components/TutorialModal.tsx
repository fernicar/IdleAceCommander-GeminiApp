import React, { useState } from 'react';

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TutorialModal: React.FC<TutorialModalProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const steps = [
    {
      title: 'Welcome to Idle Ace Commander',
      content:
        'You are a squadron commander in an ongoing war. Your mission is to train pilots, upgrade fighters, and complete combat missions to achieve victory.',
      icon: 'fa-flag-checkered',
    },
    {
      title: 'Mission Control',
      content:
        'Missions appear on a timer. When available, review the mission details and launch when ready. Higher difficulty missions offer better rewards.',
      icon: 'fa-crosshairs',
    },
    {
      title: 'Outfit Your Squadron',
      content:
        'Spend credits to upgrade your aircraft weapons, engines, and avionics. Each upgrade improves your combat effectiveness.',
      icon: 'fa-wrench',
    },
    {
      title: 'Train Your Pilots',
      content:
        'Invest in pilot training to improve intelligence (accuracy) and endurance (sustained combat). Better pilots mean better mission outcomes.',
      icon: 'fa-user-graduate',
    },
    {
      title: 'Research Technology',
      content:
        'Use research points to unlock advanced upgrades. Research takes time but unlocks higher upgrade levels for your squadron.',
      icon: 'fa-microscope',
    },
    {
      title: 'Combat Tactics',
      content:
        'During missions, choose between Aggressive or Defensive tactics. Your choice affects the battle outcome.',
      icon: 'fa-chess-knight',
    },
    {
      title: 'General Martin',
      content:
        'Your AI commander provides mission briefings and results. Configure your OpenRouter API key in settings to enable AI-generated narrative.',
      icon: 'fa-user-tie',
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      localStorage.setItem('tutorial-completed', 'true');
      onClose();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const step = steps[currentStep];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
      <div className="max-w-2xl w-full bg-gray-800 border-4 border-military-green rounded-lg p-8">
        <div className="text-center mb-6">
          <i className={`fas ${step.icon} text-6xl text-hud-blue mb-4`}></i>
          <h2 className="text-3xl font-bold text-military-tan">{step.title}</h2>
        </div>

        <p className="text-lg text-gray-300 mb-6 text-center">{step.content}</p>

        <div className="flex justify-center mb-4">
          <div className="flex space-x-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-3 h-3 rounded-full ${
                  index === currentStep ? 'bg-military-green' : 'bg-gray-600'
                }`}
              ></div>
            ))}
          </div>
        </div>

        <div className="flex justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className={`px-6 py-2 rounded font-bold ${
              currentStep === 0
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-gray-700 hover:bg-gray-600 text-white'
            }`}
          >
            <i className="fas fa-chevron-left mr-2"></i>
            PREVIOUS
          </button>

          <button
            onClick={handleNext}
            className="bg-military-green hover:bg-green-600 text-white font-bold px-6 py-2 rounded"
          >
            {currentStep === steps.length - 1 ? (
              <>
                START GAME
                <i className="fas fa-check ml-2"></i>
              </>
            ) : (
              <>
                NEXT
                <i className="fas fa-chevron-right ml-2"></i>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TutorialModal;
