
import React, { useMemo } from 'react';
import { BattleEntity } from '../../../types/combat.types';
import { calculateClosureRate, cartesianToSpherical, formatDistance, formatBearing } from './utils';
import { HUDText } from './HUDOverlay';

interface IFFIndicatorProps {
  alliedJets: BattleEntity[];
  enemyJets: BattleEntity[];
  cameraPosition: [number, number, number];
  cameraVelocity?: [number, number, number];
  primaryTargetId?: string | null;
  onTargetSelect?: (targetId: string | null) => void;
  className?: string;
}

interface TargetInfo {
  id: string;
  entity: BattleEntity;
  range: number;
  bearing: number;
  elevation: number;
  closureRate: number;
  iffStatus: 'friend' | 'foe' | 'unknown';
  threatLevel: number;
  lockStrength: number;
}

/**
 * IFFIndicator - Identification Friend or Foe System
 * Displays target lock boxes, IFF status, and multiple target tracking
 */
export const IFFIndicator: React.FC<IFFIndicatorProps> = ({
  alliedJets,
  enemyJets,
  cameraPosition,
  // FIX: Explicitly type the default value as a tuple.
  cameraVelocity = [0, 0, 0] as [number, number, number],
  primaryTargetId,
  onTargetSelect,
  className
}) => {
  // Process all entities into target information
  const targets = useMemo<TargetInfo[]>(() => {
    const processEntity = (entity: BattleEntity, team: 'allied' | 'enemy'): TargetInfo => {
      const spherical = cartesianToSpherical(
        entity.position[0] - cameraPosition[0],
        entity.position[1] - cameraPosition[1],
        entity.position[2] - cameraPosition[2]
      );

      const closureRate = calculateClosureRate(
        cameraPosition,
        cameraVelocity,
        entity.position,
        entity.velocity
      );

      // Calculate threat level (0-100)
      let threatLevel = 0;
      if (team === 'enemy' && !entity.isDestroyed) {
        const rangeFactor = Math.max(0, 1 - spherical.range / 80);
        const healthFactor = entity.health / entity.maxHealth;
        const weaponFactor = entity.weaponStrength / 100;
        threatLevel = (rangeFactor * 50 + healthFactor * 25 + weaponFactor * 25);
      }

      // Simulate lock strength (increases over time in real scenario)
      const lockStrength = entity.isDestroyed ? 0 : Math.min(85 + Math.random() * 15, 100);

      return {
        id: entity.id,
        entity,
        range: spherical.range,
        bearing: spherical.azimuth,
        elevation: spherical.elevation,
        closureRate,
        iffStatus: team === 'allied' ? 'friend' : 'foe',
        threatLevel,
        lockStrength
      };
    };

    const allTargets = [
      ...alliedJets.filter(j => !j.isDestroyed).map(j => processEntity(j, 'allied')),
      ...enemyJets.filter(j => !j.isDestroyed).map(j => processEntity(j, 'enemy'))
    ];

    // Sort by threat level (highest first)
    return allTargets.sort((a, b) => b.threatLevel - a.threatLevel);
  }, [alliedJets, enemyJets, cameraPosition, cameraVelocity]);

  // Select primary target (auto-select highest threat if none selected)
  const primaryTarget = useMemo(() => {
    if (primaryTargetId) {
      return targets.find(t => t.id === primaryTargetId) || null;
    }
    // Auto-select highest threat enemy
    return targets.find(t => t.iffStatus === 'foe') || null;
  }, [targets, primaryTargetId]);

  // Secondary targets (up to 8, excluding primary)
  const secondaryTargets = useMemo(() => {
    return targets
      .filter(t => t.id !== primaryTarget?.id && t.iffStatus === 'foe')
      .slice(0, 8);
  }, [targets, primaryTarget]);

  // Calculate time to intercept
  const calculateTTI = (target: TargetInfo): number => {
    if (target.closureRate <= 0) return -1; // Opening, not closing
    return target.range * 1000 / target.closureRate; // Convert km to meters
  };

  if (!primaryTarget) {
    return (
      <div className={className}>
        <div className="text-center">
          <HUDText size="sm" color="warning">
            NO TARGET LOCK
          </HUDText>
          <HUDText size="xs" color="primary">
            SCANNING...
          </HUDText>
        </div>
      </div>
    );
  }

  const tti = calculateTTI(primaryTarget);

  return (
    <div className={className}>
      {/* Primary Target Lock Box */}
      <div className="relative">
        <svg width="400" height="200" viewBox="0 0 400 200">
          <defs>
            <filter id="target-glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* Target bracket box */}
          <g filter="url(#target-glow)">
            {/* Corner brackets */}
            <path
              d="M 100,50 L 100,70 M 100,50 L 120,50"
              stroke={primaryTarget.iffStatus === 'friend' ? 'hsl(var(--accent))' : 'hsl(var(--destructive))'}
              strokeWidth="3"
              fill="none"
            />
            <path
              d="M 300,50 L 280,50 M 300,50 L 300,70"
              stroke={primaryTarget.iffStatus === 'friend' ? 'hsl(var(--accent))' : 'hsl(var(--destructive))'}
              strokeWidth="3"
              fill="none"
            />
            <path
              d="M 100,150 L 100,130 M 100,150 L 120,150"
              stroke={primaryTarget.iffStatus === 'friend' ? 'hsl(var(--accent))' : 'hsl(var(--destructive))'}
              strokeWidth="3"
              fill="none"
            />
            <path
              d="M 300,150 L 280,150 M 300,150 L 300,130"
              stroke={primaryTarget.iffStatus === 'friend' ? 'hsl(var(--accent))' : 'hsl(var(--destructive))'}
              strokeWidth="3"
              fill="none"
            />

            {/* Center crosshair */}
            <circle
              cx="200"
              cy="100"
              r="15"
              fill="none"
              stroke={primaryTarget.iffStatus === 'friend' ? 'hsl(var(--accent))' : 'hsl(var(--destructive))'}
              strokeWidth="2"
            />
            <line x1="185" y1="100" x2="215" y2="100" stroke={primaryTarget.iffStatus === 'friend' ? 'hsl(var(--accent))' : 'hsl(var(--destructive))'} strokeWidth="2" />
            <line x1="200" y1="85" x2="200" y2="115" stroke={primaryTarget.iffStatus === 'friend' ? 'hsl(var(--accent))' : 'hsl(var(--destructive))'} strokeWidth="2" />

            {/* Lock strength arc */}
            <path
              d={`M 200,85 A 15,15 0 ${primaryTarget.lockStrength > 50 ? 1 : 0},1 ${200 + 15 * Math.sin((primaryTarget.lockStrength / 100) * 2 * Math.PI)},${85 + 15 * (1 - Math.cos((primaryTarget.lockStrength / 100) * 2 * Math.PI))}`}
              fill="none"
              stroke={primaryTarget.iffStatus === 'friend' ? 'hsl(var(--accent))' : 'hsl(var(--destructive))'}
              strokeWidth="3"
              strokeLinecap="round"
            />

            {/* IFF Status Banner */}
            <rect
              x="150"
              y="35"
              width="100"
              height="20"
              fill={primaryTarget.iffStatus === 'friend' ? 'hsl(var(--accent))' : 'hsl(var(--destructive))'}
              fillOpacity="0.8"
            />
            <text
              x="200"
              y="49"
              textAnchor="middle"
              fill="white"
              fontSize="14"
              fontWeight="bold"
              fontFamily="monospace"
            >
              {primaryTarget.iffStatus === 'friend' ? 'FRIEND' : 'HOSTILE'}
            </text>
          </g>
        </svg>

        {/* Target Information Overlay */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          {/* Top-left info */}
          <div className="absolute top-4 left-4">
            <HUDText size="xs" color={primaryTarget.iffStatus === 'friend' ? 'success' : 'danger'}>
              TGT: {primaryTarget.id.slice(-4).toUpperCase()}
            </HUDText>
          </div>

          {/* Top-right info */}
          <div className="absolute top-4 right-4 text-right">
            <HUDText size="xs" color="primary">
              LOCK: {primaryTarget.lockStrength.toFixed(0)}%
            </HUDText>
          </div>

          {/* Bottom info panel */}
          <div className="absolute bottom-2 left-0 right-0 flex justify-around items-center">
            <div className="text-center">
              <HUDText size="xs" color="primary">RNG</HUDText>
              <HUDText size="sm" color={primaryTarget.iffStatus === 'friend' ? 'success' : 'danger'}>
                {formatDistance(primaryTarget.range)}
              </HUDText>
            </div>

            <div className="text-center">
              <HUDText size="xs" color="primary">BRG</HUDText>
              <HUDText size="sm" color={primaryTarget.iffStatus === 'friend' ? 'success' : 'danger'}>
                {formatBearing(primaryTarget.bearing)}°
              </HUDText>
            </div>

            <div className="text-center">
              <HUDText size="xs" color="primary">CLO</HUDText>
              <HUDText size="sm" color={primaryTarget.closureRate > 0 ? 'warning' : 'success'}>
                {primaryTarget.closureRate > 0 ? '+' : ''}{primaryTarget.closureRate.toFixed(0)} m/s
              </HUDText>
            </div>

            {tti > 0 && (
              <div className="text-center">
                <HUDText size="xs" color="primary">TTI</HUDText>
                <HUDText size="sm" color="warning">
                  {tti.toFixed(1)}s
                </HUDText>
              </div>
            )}
          </div>

          {/* Health bar */}
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-48">
            <div className="h-2 bg-gray-800 border border-primary/30">
              <div
                className="h-full transition-all duration-300"
                style={{
                  width: `${(primaryTarget.entity.health / primaryTarget.entity.maxHealth) * 100}%`,
                  backgroundColor: primaryTarget.iffStatus === 'friend' ? 'hsl(var(--accent))' : 'hsl(var(--destructive))'
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Multiple Target Tracking (MTT) - Secondary Targets */}
      {secondaryTargets.length > 0 && (
        <div className="mt-4">
          <HUDText size="xs" color="primary" className="mb-2">
            SECONDARY THREATS
          </HUDText>
          <div className="grid grid-cols-4 gap-2">
            {secondaryTargets.map((target, idx) => (
              <div
                key={target.id}
                className="border border-destructive/50 p-1 text-center hover:border-destructive transition-colors cursor-pointer"
                onClick={() => onTargetSelect?.(target.id)}
              >
                <HUDText size="xs" color="danger">
                  {idx + 1}
                </HUDText>
                <HUDText size="xs" color="primary">
                  {formatDistance(target.range)}
                </HUDText>
                <HUDText size="xs" color="primary">
                  {formatBearing(target.bearing)}°
                </HUDText>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* IFF Mode Indicator */}
      <div className="mt-4 text-center">
        <HUDText size="xs" color="primary">
          IFF MODE: ACTIVE • RDR: TRACK
        </HUDText>
      </div>

      {/* Audio Cue Simulation */}
      {primaryTarget.iffStatus === 'friend' && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2">
          <HUDText size="sm" color="success" className="animate-pulse">
            ⚠️ FRIENDLY
          </HUDText>
        </div>
      )}
    </div>
  );
};

export default IFFIndicator;