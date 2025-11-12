
import React, { useMemo } from 'react';
import { BattleEntity } from '../../../types/combat.types';
import { cartesianToSpherical, formatDistance, formatBearing } from './utils';
import { HUDText } from './HUDOverlay';

interface TacticalSphereProps {
  alliedJets: BattleEntity[];
  enemyJets: BattleEntity[];
  cameraPosition: [number, number, number];
  className?: string;
}

interface ContactDisplay {
  id: string;
  team: 'allied' | 'enemy';
  azimuth: number;
  elevation: number;
  range: number;
  isDestroyed: boolean;
  threatLevel: 'low' | 'medium' | 'high';
}

/**
 * TacticalSphere - 3D Situational Awareness Display
 * Shows all contacts in a hemispherical bubble view with range rings
 */
export const TacticalSphere: React.FC<TacticalSphereProps> = ({
  alliedJets,
  enemyJets,
  cameraPosition,
  className
}) => {
  // Process all entities into display contacts
  const contacts = useMemo<ContactDisplay[]>(() => {
    const processEntity = (entity: BattleEntity, team: 'allied' | 'enemy'): ContactDisplay => {
      const spherical = cartesianToSpherical(
        entity.position[0] - cameraPosition[0],
        entity.position[1] - cameraPosition[1],
        entity.position[2] - cameraPosition[2]
      );

      // Calculate threat level based on range and health
      let threatLevel: 'low' | 'medium' | 'high' = 'low';
      if (team === 'enemy' && !entity.isDestroyed) {
        if (spherical.range < 20) threatLevel = 'high';
        else if (spherical.range < 40) threatLevel = 'medium';
      }

      return {
        id: entity.id,
        team,
        azimuth: spherical.azimuth,
        elevation: spherical.elevation,
        range: spherical.range,
        isDestroyed: entity.isDestroyed,
        threatLevel
      };
    };

    return [
      ...alliedJets.map(j => processEntity(j, 'allied')),
      ...enemyJets.map(j => processEntity(j, 'enemy'))
    ];
  }, [alliedJets, enemyJets, cameraPosition]);

  // Convert spherical coords to 2D position on tactical display
  const sphericalToDisplay = (azimuth: number, elevation: number, range: number) => {
    // Normalize elevation to hemisphere (-90° to +90°)
    const elevRad = (elevation * Math.PI) / 180;
    const aziRad = (azimuth * Math.PI) / 180;

    // Project onto 2D circle (top-down view with elevation as distance from center)
    // Range affects size scaling
    const maxRange = 80; // km
    const normalizedRange = Math.min(range / maxRange, 1);
    
    // Elevation affects radial distance from center
    // -90° (bottom) = outer edge, 0° (horizon) = middle, +90° (top) = near center
    const elevationFactor = 0.5 + (elevation / 180) * 0.5; // 0 to 1
    const radius = 100 * (1 - elevationFactor); // pixels from center

    const x = 120 + radius * Math.sin(aziRad);
    const y = 120 - radius * Math.cos(aziRad);

    return { x, y, scale: 1 - normalizedRange * 0.5 };
  };

  return (
    <div className={className}>
      <svg
        width="240"
        height="280"
        viewBox="0 0 240 280"
        className="filter drop-shadow-[0_0_10px_hsl(var(--primary)/0.5)]"
      >
        <defs>
          {/* Glow filters */}
          <filter id="allied-glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <filter id="hostile-glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Title */}
        <text
          x="120"
          y="20"
          textAnchor="middle"
          fill="hsl(var(--primary))"
          fontSize="12"
          fontWeight="bold"
          fontFamily="monospace"
        >
          TACTICAL SA
        </text>

        {/* Main tactical sphere background */}
        <circle
          cx="120"
          cy="120"
          r="100"
          fill="hsl(var(--background))"
          fillOpacity="0.8"
          stroke="hsl(var(--primary))"
          strokeWidth="2"
          strokeOpacity="0.5"
        />

        {/* Range rings (20km, 40km, 60km, 80km) */}
        {[25, 50, 75, 100].map((r, i) => (
          <g key={`ring-${i}`}>
            <circle
              cx="120"
              cy="120"
              r={r}
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="1"
              strokeOpacity="0.3"
              strokeDasharray="2,2"
            />
            {/* Range label */}
            {i < 3 && (
              <text
                x="120"
                y={120 - r - 5}
                textAnchor="middle"
                fill="hsl(var(--primary))"
                fontSize="8"
                fontFamily="monospace"
                opacity="0.5"
              >
                {(i + 1) * 20}km
              </text>
            )}
          </g>
        ))}

        {/* Elevation grid lines (every 30°) */}
        {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map(angle => {
          const rad = (angle * Math.PI) / 180;
          const x2 = 120 + 100 * Math.sin(rad);
          const y2 = 120 - 100 * Math.cos(rad);
          return (
            <line
              key={`grid-${angle}`}
              x1="120"
              y1="120"
              x2={x2}
              y2={y2}
              stroke="hsl(var(--primary))"
              strokeWidth="0.5"
              strokeOpacity="0.2"
            />
          );
        })}

        {/* Cardinal direction labels */}
        <text x="120" y="15" textAnchor="middle" fill="hsl(var(--primary))" fontSize="10" fontWeight="bold" fontFamily="monospace">N</text>
        <text x="225" y="125" textAnchor="start" fill="hsl(var(--primary))" fontSize="10" fontWeight="bold" fontFamily="monospace">E</text>
        <text x="120" y="228" textAnchor="middle" fill="hsl(var(--primary))" fontSize="10" fontWeight="bold" fontFamily="monospace">S</text>
        <text x="15" y="125" textAnchor="end" fill="hsl(var(--primary))" fontSize="10" fontWeight="bold" fontFamily="monospace">W</text>

        {/* Center crosshair */}
        <circle
          cx="120"
          cy="120"
          r="4"
          fill="hsl(var(--primary))"
          fillOpacity="0.5"
        />
        <line x1="115" y1="120" x2="125" y2="120" stroke="hsl(var(--primary))" strokeWidth="1" />
        <line x1="120" y1="115" x2="120" y2="125" stroke="hsl(var(--primary))" strokeWidth="1" />

        {/* Render contacts */}
        {contacts.map(contact => {
          if (contact.isDestroyed) {
            // Destroyed units as fading X marks
            const pos = sphericalToDisplay(contact.azimuth, contact.elevation, contact.range);
            return (
              <g key={contact.id} opacity="0.3">
                <line
                  x1={pos.x - 4}
                  y1={pos.y - 4}
                  x2={pos.x + 4}
                  y2={pos.y + 4}
                  stroke="hsl(var(--muted-foreground))"
                  strokeWidth="1.5"
                />
                <line
                  x1={pos.x - 4}
                  y1={pos.y + 4}
                  x2={pos.x + 4}
                  y2={pos.y - 4}
                  stroke="hsl(var(--muted-foreground))"
                  strokeWidth="1.5"
                />
              </g>
            );
          }

          const pos = sphericalToDisplay(contact.azimuth, contact.elevation, contact.range);
          const size = 8 * pos.scale;

          if (contact.team === 'allied') {
            // Allied: Green chevron (upward triangle)
            return (
              <g key={contact.id} filter="url(#allied-glow)">
                <path
                  d={`M ${pos.x},${pos.y - size} L ${pos.x - size * 0.7},${pos.y + size * 0.5} L ${pos.x + size * 0.7},${pos.y + size * 0.5} Z`}
                  fill="hsl(var(--accent))"
                  stroke="hsl(var(--accent))"
                  strokeWidth="1"
                />
                {/* Callsign for closest allies */}
                {contact.range < 30 && (
                  <text
                    x={pos.x}
                    y={pos.y + size + 10}
                    textAnchor="middle"
                    fill="hsl(var(--accent))"
                    fontSize="7"
                    fontFamily="monospace"
                  >
                    {contact.id.slice(-2)}
                  </text>
                )}
              </g>
            );
          } else {
            // Enemy: Red diamond
            const isHighThreat = contact.threatLevel === 'high';
            return (
              <g key={contact.id} filter="url(#hostile-glow)">
                <path
                  d={`M ${pos.x},${pos.y - size} L ${pos.x + size},${pos.y} L ${pos.x},${pos.y + size} L ${pos.x - size},${pos.y} Z`}
                  fill={isHighThreat ? "hsl(var(--destructive))" : "none"}
                  stroke="hsl(var(--destructive))"
                  strokeWidth={isHighThreat ? "2" : "1.5"}
                  opacity={isHighThreat ? "1" : "0.8"}
                >
                  {/* Flashing animation for close threats */}
                  {isHighThreat && (
                    <animate
                      attributeName="opacity"
                      values="0.8;1;0.8"
                      dur="1s"
                      repeatCount="indefinite"
                    />
                  )}
                </path>
                {/* Range indicator for threats */}
                {contact.range < 40 && (
                  <text
                    x={pos.x}
                    y={pos.y + size + 10}
                    textAnchor="middle"
                    fill="hsl(var(--destructive))"
                    fontSize="7"
                    fontFamily="monospace"
                  >
                    {formatDistance(contact.range)}
                  </text>
                )}
              </g>
            );
          }
        })}

        {/* Legend */}
        <g transform="translate(10, 245)">
          {/* Allied symbol */}
          <path
            d="M 5,0 L 2,4 L 8,4 Z"
            fill="hsl(var(--accent))"
            stroke="hsl(var(--accent))"
            strokeWidth="1"
          />
          <text x="12" y="5" fill="hsl(var(--primary))" fontSize="8" fontFamily="monospace">
            ALLIED
          </text>

          {/* Enemy symbol */}
          <path
            d="M 75,0 L 80,4 L 75,8 L 70,4 Z"
            fill="none"
            stroke="hsl(var(--destructive))"
            strokeWidth="1"
          />
          <text x="82" y="6" fill="hsl(var(--primary))" fontSize="8" fontFamily="monospace">
            HOSTILE
          </text>
        </g>
      </svg>

      {/* Stats display below sphere */}
      <div className="mt-2 space-y-1">
        <div className="flex justify-between items-center">
          <HUDText size="xs" color="success">
            ALLIED: {alliedJets.filter(j => !j.isDestroyed).length}
          </HUDText>
          <HUDText size="xs" color="danger">
            HOSTILE: {enemyJets.filter(j => !j.isDestroyed).length}
          </HUDText>
        </div>
        
        {/* Threat level indicator */}
        {(() => {
          const closestThreat = contacts
            .filter(c => c.team === 'enemy' && !c.isDestroyed)
            .sort((a, b) => a.range - b.range)[0];
          
          if (!closestThreat) return null;

          return (
            <div className="text-center">
              <HUDText 
                size="xs" 
                color={closestThreat.threatLevel === 'high' ? 'danger' : 'warning'}
              >
                THREAT: {formatDistance(closestThreat.range)} / {formatBearing(closestThreat.azimuth)}°
              </HUDText>
            </div>
          );
        })()}
      </div>
    </div>
  );
};

export default TacticalSphere;
