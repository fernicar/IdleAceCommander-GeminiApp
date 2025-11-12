import React from 'react';
import MissionPanel from './MissionPanel';
import OutfitPanel from './OutfitPanel';
import PilotTrainingPanel from './PilotTrainingPanel';
import ResearchPanel from './ResearchPanel';

const IdleClickerView: React.FC = () => {
  return (
    <div className="grid grid-cols-2 gap-6 h-[calc(100vh-120px)]">
      <MissionPanel />
      <OutfitPanel />
      <PilotTrainingPanel />
      <ResearchPanel />
    </div>
  );
};

export default IdleClickerView;
