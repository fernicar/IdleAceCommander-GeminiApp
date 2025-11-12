
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { BattleState } from '../../../types/combat.types';
import { HUDOverlay, HUDLayer, HUDText } from './HUDOverlay';
import { TacticalSphere } from './TacticalSphere';
import { IFFIndicator } from './IFFIndicator';
import { HMSReticle } from './HMSReticle';
import { RangeIndicators } from './RangeIndicators';
import { AudioCueManager } from './AudioCueManager';

interface HUDProps {
  battleState: BattleState;
  cameraPosition?: [number, number, number];
  cameraRotation?: [number, number, number];
  className?: string;
}

/**
 * Main HUD Container Component
 * Orchestrates all HUD layers and manages HUD state
 */
export const HUD: React.FC<HUDProps> = ({
  battleState,
  cameraPosition = [0, 0, 0],
  cameraRotation = [0, 0, 0],
  className
}) => {
  const [hudIntensity, setHudIntensity] = useState<'day' | 'night' | 'off'>('day');
  const [displayMode, setDisplayMode] = useState<'full' | 'tactical' | 'minimal'>('full');
  const [primaryTargetId, setPrimaryTargetId] = useState<string | null>(null);

  // Load HUD settings from localStorage
  useEffect(() => {
    const savedIntensity = localStorage.getItem('hud-intensity') as 'day' | 'night' | 'off' | null;
    const savedMode = localStorage.getItem('hud-mode') as 'full' | 'tactical' | 'minimal' | null;
    
    if (savedIntensity) setHudIntensity(savedIntensity);
    if (savedMode) setDisplayMode(savedMode);
  }, []);

  // Save HUD settings to localStorage
  useEffect(() => {
    localStorage.setItem('hud-intensity', hudIntensity);
    localStorage.setItem('hud-mode', displayMode);
  }, [hudIntensity, displayMode]);

  // Keyboard shortcuts for HUD control
  const toggleIntensity = useCallback(() => {
    setHudIntensity(prev => {
      if (prev === 'day') return 'night';
      if (prev === 'night') return 'off';
      return 'day';
    });
  }, []);

  const cycleDisplayMode = useCallback(() => {
    setDisplayMode(prev => {
      if (prev === 'full') return 'tactical';
      if (prev === 'tactical') return 'minimal';
      return 'full';
    });
  }, []);

  // Keyboard event handlers
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key.toLowerCase()) {
        case 'h':
          toggleIntensity();
          break;
        case 'm':
          cycleDisplayMode();
          break;
        case 't': {
          // Cycle through enemy targets
          const enemies = battleState.enemyJets.filter(j => !j.isDestroyed);
          if (enemies.length === 0) {
            setPrimaryTargetId(null);
            return;
          }

          const currentIndex = primaryTargetId
            ? enemies.findIndex(e => e.id === primaryTargetId)
            : -1;
          const nextIndex = (currentIndex + 1) % enemies.length;
          setPrimaryTargetId(enemies[nextIndex].id);
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [toggleIntensity, cycleDisplayMode, primaryTargetId, battleState.enemyJets]);

  // Calculate real-time statistics
  const aliveAllied = battleState.alliedJets.filter(j => !j.isDestroyed).length;
  const aliveEnemy = battleState.enemyJets.filter(j => !j.isDestroyed).length;

  // Get primary target entity
  const primaryTargetEntity = useMemo(() => {
    if (!primaryTargetId) return null;
    return [...battleState.alliedJets, ...battleState.enemyJets]
      .find(j => j.id === primaryTargetId) || null;
  }, [primaryTargetId, battleState.alliedJets, battleState.enemyJets]);

  return (
    <HUDOverlay intensity={hudIntensity} className={className}>
      {/* Layer 0: Range Indicators (Deepest Background) */}
      <HUDLayer zIndex={9}>
        <RangeIndicators
          cameraPosition={cameraPosition}
          enemyJets={battleState.enemyJets}
          threatRange={15}
        />
      </HUDLayer>

      {/* Layer 0.5: HMS Reticle */}
      <HUDLayer zIndex={10}>
        <HMSReticle
          cameraPosition={cameraPosition}
          cameraRotation={cameraRotation}
          primaryTarget={primaryTargetEntity}
          weaponRange={15}
        />
      </HUDLayer>

      {/* Layer 1: Status Information (Top) */}
      <HUDLayer zIndex={11}>
        <div className="absolute top-8 left-8 space-y-2">
          <HUDText size="sm" color="success">
            ALLIED: {aliveAllied}
          </HUDText>
        </div>
        <div className="absolute top-8 right-8 space-y-2">
          <HUDText size="sm" color="danger">
            HOSTILE: {aliveEnemy}
          </HUDText>
        </div>
      </HUDLayer>

      {/* Layer 2: Central Targeting Info & IFF System */}
      <HUDLayer zIndex={12}>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          {displayMode !== 'minimal' && (
            <IFFIndicator
              alliedJets={battleState.alliedJets}
              enemyJets={battleState.enemyJets}
              cameraPosition={cameraPosition}
              primaryTargetId={primaryTargetId}
              onTargetSelect={setPrimaryTargetId}
            />
          )}
        </div>
      </HUDLayer>

      {/* Layer 3: Tactical Display (Right) */}
      {displayMode !== 'minimal' && (
        <HUDLayer zIndex={13}>
          <div className="absolute top-20 right-8">
            <TacticalSphere
              alliedJets={battleState.alliedJets}
              enemyJets={battleState.enemyJets}
              cameraPosition={cameraPosition}
            />
          </div>
        </HUDLayer>
      )}

      {/* Layer 4: Audio Cues & Alerts */}
      <HUDLayer zIndex={15}>
        <AudioCueManager
          battleState={battleState}
          primaryTargetId={primaryTargetId}
        />
      </HUDLayer>

      {/* Layer 5: Bottom Status Bar & Controls */}
      <HUDLayer zIndex={16}>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-6">
          <HUDText size="xs" color="primary">
            MODE: {displayMode.toUpperCase()}
          </HUDText>
          <HUDText size="xs" color="primary">
            •
          </HUDText>
          <HUDText size="xs" color="primary">
            TACTIC: {battleState.playerTactic.toUpperCase()}
          </HUDText>
          <HUDText size="xs" color="primary">
            •
          </HUDText>
          <HUDText size="xs" color={battleState.status === 'active' ? 'success' : 'warning'}>
            STATUS: {battleState.status.toUpperCase()}
          </HUDText>
          <HUDText size="xs" color="primary">
            •
          </HUDText>
          <HUDText size="xs" color="primary">
            HUD: {hudIntensity.toUpperCase()}
          </HUDText>
        </div>

        {/* HUD Controls Help (Middle Left) */}
        <div className="absolute top-1/2 left-4 -translate-y-1/2 bg-background/70 border border-primary/20 p-2 rounded text-xs space-y-1">
          <HUDText size="xs" color="primary">CONTROLS:</HUDText>
          <div className="flex items-center gap-2 opacity-70">
            <span className="text-primary font-mono">[H]</span>
            <span className="text-muted-foreground">Toggle HUD</span>
          </div>
          <div className="flex items-center gap-2 opacity-70">
            <span className="text-primary font-mono">[M]</span>
            <span className="text-muted-foreground">Display Mode</span>
          </div>
          <div className="flex items-center gap-2 opacity-70">
            <span className="text-primary font-mono">[T]</span>
            <span className="text-muted-foreground">Cycle Target</span>
          </div>
        </div>
      </HUDLayer>

      {/* Debug Info (will be removed in production) */}
      {process.env.NODE_ENV === 'development' && (
        <HUDLayer zIndex={99}>
          <div className="absolute bottom-20 left-8 space-y-1 text-xs text-primary/50 font-mono">
            <div>CAM: [{cameraPosition.map(v => v.toFixed(1)).join(', ')}]</div>
            <div>ROT: [{cameraRotation.map(v => (v * 180 / Math.PI).toFixed(1)).join('°, ')}°]</div>
            <div>INTENSITY: {hudIntensity.toUpperCase()}</div>
          </div>
        </HUDLayer>
      )}
    </HUDOverlay>
  );
};

export default HUD;
