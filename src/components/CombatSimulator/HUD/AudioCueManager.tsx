
import React, { useEffect, useState } from 'react';
import { BattleState, BattleEvent } from '../../../types/combat.types';
import { HUDText } from './HUDOverlay';

interface AudioCueManagerProps {
  battleState: BattleState;
  primaryTargetId: string | null;
  className?: string;
}

type AudioCue = {
  id: string;
  type: 'friendly' | 'hostile' | 'warning' | 'splash' | 'rtb' | 'lock-tone';
  text: string;
  color: 'success' | 'danger' | 'warning' | 'primary';
  priority: number; // Higher = more important
  timestamp: number;
  duration: number; // ms
};

/**
 * AudioCueManager - Simulates Audio Feedback System
 * Displays text-based audio cues and visual lock tone indicators
 */
export const AudioCueManager: React.FC<AudioCueManagerProps> = ({
  battleState,
  primaryTargetId,
  className
}) => {
  const [activeCues, setActiveCues] = useState<AudioCue[]>([]);
  const [lockToneActive, setLockToneActive] = useState(false);
  const [processedEvents, setProcessedEvents] = useState<Set<number>>(new Set());

  // Monitor primary target for lock tone
  useEffect(() => {
    if (!primaryTargetId) {
      setLockToneActive(false);
      return;
    }

    const target = [...battleState.alliedJets, ...battleState.enemyJets]
      .find(j => j.id === primaryTargetId);

    if (target && !target.isDestroyed) {
      // Calculate if target is in range
      const distanceSquared = 
        target.position[0] ** 2 + 
        target.position[1] ** 2 + 
        target.position[2] ** 2;
      const inRange = Math.sqrt(distanceSquared) < 15000; // 15km in meters

      setLockToneActive(inRange && target.team === 'enemy');
    } else {
      setLockToneActive(false);
    }
  }, [primaryTargetId, battleState.alliedJets, battleState.enemyJets]);

  // Process battle events for audio cues
  useEffect(() => {
    battleState.executedEvents.forEach((event) => {
      // Skip if already processed
      if (processedEvents.has(event.timestamp)) return;

      const newCue = generateCueFromEvent(event, battleState);
      if (newCue) {
        setActiveCues(prev => [...prev, newCue]);
        setProcessedEvents(prev => new Set(prev).add(event.timestamp));
      }
    });
  }, [battleState.executedEvents]);

  // Monitor battle status for RTB cue
  useEffect(() => {
    if (battleState.status === 'victory' || battleState.status === 'defeat') {
      const rtbCue: AudioCue = {
        id: `rtb-${Date.now()}`,
        type: 'rtb',
        text: 'RETURN TO BASE',
        color: 'primary',
        priority: 100,
        timestamp: Date.now(),
        duration: 3000
      };
      setActiveCues(prev => [...prev, rtbCue]);
    }
  }, [battleState.status]);

  // Clean up expired cues
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setActiveCues(prev => 
        prev.filter(cue => now - cue.timestamp < cue.duration)
      );
    }, 100);

    return () => clearInterval(interval);
  }, []);

  // Get highest priority active cue
  const displayCue = activeCues.length > 0
    ? activeCues.reduce((highest, current) => 
        current.priority > highest.priority ? current : highest
      )
    : null;

  return (
    <div className={className}>
      {/* Main Audio Cue Display (Top Center) */}
      {displayCue && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-50">
          <div className={`
            bg-background/90 border-2 px-8 py-4 rounded-lg
            ${getCueBorderColor(displayCue.type)}
            animate-pulse
          `}>
            <HUDText 
              size="lg" 
              color={displayCue.color}
              className="text-center"
            >
              {displayCue.text}
            </HUDText>
          </div>
        </div>
      )}

      {/* Lock Tone Visual Indicator */}
      {lockToneActive && (
        <div className="absolute inset-0 pointer-events-none">
          {/* Pulsing reticle indicator */}
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 1920 1080"
            preserveAspectRatio="xMidYMid slice"
          >
            <defs>
              <filter id="lock-tone-glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>

            {/* Pulsing lock circle */}
            <circle
              cx="960"
              cy="540"
              r="60"
              fill="none"
              stroke="hsl(var(--destructive))"
              strokeWidth="3"
              filter="url(#lock-tone-glow)"
            >
              <animate
                attributeName="r"
                values="60;70;60"
                dur="0.6s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                values="0.8;1;0.8"
                dur="0.6s"
                repeatCount="indefinite"
              />
            </circle>

            {/* Lock tone indicator bars (like radar sweeps) */}
            {[0, 90, 180, 270].map((angle, i) => (
              <line
                key={i}
                x1="960"
                y1="540"
                x2={960 + Math.cos((angle * Math.PI) / 180) * 80}
                y2={540 + Math.sin((angle * Math.PI) / 180) * 80}
                stroke="hsl(var(--destructive))"
                strokeWidth="2"
                opacity="0.8"
                filter="url(#lock-tone-glow)"
              >
                <animate
                  attributeName="opacity"
                  values="0.3;0.9;0.3"
                  dur="0.6s"
                  repeatCount="indefinite"
                  begin={`${i * 0.15}s`}
                />
              </line>
            ))}
          </svg>

          {/* Lock tone text */}
          <div className="absolute bottom-32 left-1/2 -translate-x-1/2">
            <HUDText size="md" color="danger" className="animate-pulse">
              🔒 LOCK TONE
            </HUDText>
          </div>
        </div>
      )}

      {/* Cue History Display (Bottom Left, semi-transparent) */}
      <div className="absolute bottom-24 left-8 space-y-1 opacity-60">
        {activeCues.slice(-3).map((cue, idx) => (
          <div
            key={cue.id}
            className="transition-opacity duration-500"
            style={{
              opacity: 1 - (idx * 0.3)
            }}
          >
            <HUDText size="xs" color={cue.color}>
              {cue.text}
            </HUDText>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Generate audio cue from battle event
 */
function generateCueFromEvent(event: BattleEvent, battleState: BattleState): AudioCue | null {
  const target = [...battleState.alliedJets, ...battleState.enemyJets]
    .find(j => j.id === event.targetId);

  if (!target) return null;

  switch (event.type) {
    case 'destroy':
      if (target.team === 'enemy') {
        return {
          id: `splash-${event.timestamp}`,
          type: 'splash',
          text: '💥 SPLASH ONE',
          color: 'success',
          priority: 80,
          timestamp: Date.now(),
          duration: 2000
        };
      } else {
        return {
          id: `warning-${event.timestamp}`,
          type: 'warning',
          text: '⚠️ ALLIED AIRCRAFT DOWN',
          color: 'warning',
          priority: 90,
          timestamp: Date.now(),
          duration: 2500
        };
      }

    case 'hit':
      if (target.team === 'allied') {
        return {
          id: `warning-${event.timestamp}`,
          type: 'warning',
          text: '⚠️ TAKING FIRE',
          color: 'warning',
          priority: 70,
          timestamp: Date.now(),
          duration: 1500
        };
      }
      break;

    case 'escape':
      return {
        id: `warning-${event.timestamp}`,
        type: 'warning',
        text: 'ENEMY ESCAPING',
        color: 'warning',
        priority: 50,
        timestamp: Date.now(),
        duration: 1500
      };
  }

  return null;
}

/**
 * Get border color class based on cue type
 */
function getCueBorderColor(type: AudioCue['type']): string {
  switch (type) {
    case 'friendly':
      return 'border-accent';
    case 'hostile':
      return 'border-destructive';
    case 'warning':
      return 'border-yellow-500';
    case 'splash':
      return 'border-accent';
    case 'rtb':
      return 'border-primary';
    case 'lock-tone':
      return 'border-destructive';
    default:
      return 'border-primary';
  }
}

export default AudioCueManager;
