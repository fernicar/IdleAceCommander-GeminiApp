
import React from 'react';
import { BattleEntity } from '../../../types/combat.types';
import { cartesianToSpherical } from './utils';

interface RangeIndicatorsProps {
  cameraPosition: [number, number, number];
  enemyJets: BattleEntity[];
  threatRange?: number; // km
  className?: string;
}

/**
 * RangeIndicators - 3D Range Rings and Threat Engagement Zones
 * Visual overlay showing distance rings and weapon threat bubbles
 */
export const RangeIndicators: React.FC<RangeIndicatorsProps> = ({
  cameraPosition,
  enemyJets,
  threatRange = 15, // Default 15km weapon threat range
  className
}) => {
  // Check if camera is within any threat zone
  const inThreatZone = enemyJets.some(enemy => {
    if (enemy.isDestroyed) return false;
    const spherical = cartesianToSpherical(
      enemy.position[0] - cameraPosition[0],
      enemy.position[1] - cameraPosition[1],
      enemy.position[2] - cameraPosition[2]
    );
    return spherical.range <= threatRange;
  });

  return (
    <div className={className}>
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 1920 1080"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 pointer-events-none"
      >
        <defs>
          {/* Gradient for range rings */}
          <radialGradient id="range-gradient-safe" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity="0.1" />
            <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity="0.3" />
          </radialGradient>
          <radialGradient id="range-gradient-caution" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="hsl(43, 96%, 56%)" stopOpacity="0.1" />
            <stop offset="100%" stopColor="hsl(43, 96%, 56%)" stopOpacity="0.3" />
          </radialGradient>
          <radialGradient id="range-gradient-danger" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="hsl(var(--destructive))" stopOpacity="0.15" />
            <stop offset="100%" stopColor="hsl(var(--destructive))" stopOpacity="0.4" />
          </radialGradient>

          {/* Pulse animation for threat zones */}
          <radialGradient id="threat-pulse" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="hsl(var(--destructive))" stopOpacity="0.3">
              <animate
                attributeName="stop-opacity"
                values="0.3;0.6;0.3"
                dur="2s"
                repeatCount="indefinite"
              />
            </stop>
            <stop offset="100%" stopColor="hsl(var(--destructive))" stopOpacity="0">
              <animate
                attributeName="stop-opacity"
                values="0;0.2;0"
                dur="2s"
                repeatCount="indefinite"
              />
            </stop>
          </radialGradient>
        </defs>

        {/* Range Rings - Concentric circles from center */}
        <g opacity="0.6">
          {/* 20km ring - Safe (Green) */}
          <circle
            cx="960"
            cy="540"
            r="150"
            fill="url(#range-gradient-safe)"
            stroke="hsl(var(--accent))"
            strokeWidth="2"
            strokeDasharray="8,4"
            opacity="0.5"
          >
            <animate
              attributeName="stroke-dashoffset"
              from="0"
              to="24"
              dur="3s"
              repeatCount="indefinite"
            />
          </circle>

          {/* 40km ring - Caution (Yellow) */}
          <circle
            cx="960"
            cy="540"
            r="250"
            fill="url(#range-gradient-caution)"
            stroke="hsl(43, 96%, 56%)"
            strokeWidth="2"
            strokeDasharray="8,4"
            opacity="0.4"
          >
            <animate
              attributeName="stroke-dashoffset"
              from="0"
              to="24"
              dur="4s"
              repeatCount="indefinite"
            />
          </circle>

          {/* 60km ring - Danger (Red) */}
          <circle
            cx="960"
            cy="540"
            r="350"
            fill="url(#range-gradient-danger)"
            stroke="hsl(var(--destructive))"
            strokeWidth="2"
            strokeDasharray="8,4"
            opacity="0.3"
          >
            <animate
              attributeName="stroke-dashoffset"
              from="0"
              to="24"
              dur="5s"
              repeatCount="indefinite"
            />
          </circle>
        </g>

        {/* Range labels */}
        <g opacity="0.7">
          <text
            x="960"
            y="395"
            textAnchor="middle"
            fill="hsl(var(--accent))"
            fontSize="11"
            fontFamily="monospace"
            fontWeight="bold"
          >
            20 km
          </text>
          <text
            x="960"
            y="295"
            textAnchor="middle"
            fill="hsl(43, 96%, 56%)"
            fontSize="11"
            fontFamily="monospace"
            fontWeight="bold"
          >
            40 km
          </text>
          <text
            x="960"
            y="195"
            textAnchor="middle"
            fill="hsl(var(--destructive))"
            fontSize="11"
            fontFamily="monospace"
            fontWeight="bold"
          >
            60 km
          </text>
        </g>

        {/* Threat Warning Overlay - Flashing red when in danger */}
        {inThreatZone && (
          <g>
            {/* Pulsing border */}
            <rect
              x="10"
              y="10"
              width="1900"
              height="1060"
              fill="none"
              stroke="hsl(var(--destructive))"
              strokeWidth="4"
              opacity="0.8"
            >
              <animate
                attributeName="opacity"
                values="0.3;0.9;0.3"
                dur="1s"
                repeatCount="indefinite"
              />
            </rect>

            {/* Corner warning indicators */}
            {[[50, 50], [1870, 50], [50, 1030], [1870, 1030]].map(([x, y], i) => (
              <g key={i}>
                <polygon
                  points={`${x},${y} ${x + (i % 2 === 0 ? 30 : -30)},${y} ${x},${y + (i < 2 ? 30 : -30)}`}
                  fill="hsl(var(--destructive))"
                  opacity="0.7"
                >
                  <animate
                    attributeName="opacity"
                    values="0.4;0.9;0.4"
                    dur="1s"
                    repeatCount="indefinite"
                    begin={`${i * 0.25}s`}
                  />
                </polygon>
              </g>
            ))}

            {/* Warning text */}
            <text
              x="960"
              y="980"
              textAnchor="middle"
              fill="hsl(var(--destructive))"
              fontSize="24"
              fontFamily="monospace"
              fontWeight="bold"
            >
              ⚠ THREAT WARNING ⚠
              <animate
                attributeName="opacity"
                values="0.6;1;0.6"
                dur="0.8s"
                repeatCount="indefinite"
              />
            </text>
          </g>
        )}

        {/* Directional Threat Indicators */}
        {enemyJets
          .filter(enemy => !enemy.isDestroyed)
          .map((enemy, idx) => {
            const spherical = cartesianToSpherical(
              enemy.position[0] - cameraPosition[0],
              enemy.position[1] - cameraPosition[1],
              enemy.position[2] - cameraPosition[2]
            );

            // Only show if within 40km
            if (spherical.range > 40) return null;

            // Convert bearing to screen edge position
            const angle = (spherical.azimuth * Math.PI) / 180;
            const radius = 400;
            const edgeX = 960 + Math.sin(angle) * radius;
            const edgeY = 540 - Math.cos(angle) * radius;

            const threatColor = spherical.range < 20 
              ? 'hsl(var(--destructive))'
              : spherical.range < 30
              ? 'hsl(43, 96%, 56%)'
              : 'hsl(var(--primary))';

            return (
              <g key={enemy.id} opacity="0.6">
                {/* Threat direction line */}
                <line
                  x1="960"
                  y1="540"
                  x2={edgeX}
                  y2={edgeY}
                  stroke={threatColor}
                  strokeWidth="1"
                  strokeDasharray="4,4"
                  opacity="0.3"
                />
                
                {/* Threat marker at edge */}
                <circle
                  cx={edgeX}
                  cy={edgeY}
                  r="6"
                  fill={threatColor}
                  opacity="0.7"
                >
                  {spherical.range < 20 && (
                    <animate
                      attributeName="r"
                      values="6;9;6"
                      dur="1s"
                      repeatCount="indefinite"
                    />
                  )}
                </circle>
              </g>
            );
          })}
      </svg>

      {/* Energy State Indicator (Bottom Right) */}
      <div className="absolute bottom-8 right-8 space-y-2">
        <div className="bg-background/80 border border-primary/30 p-3 rounded">
          <div className="text-xs text-primary font-mono mb-2">ENERGY STATE</div>
          <div className="flex items-center gap-2">
            <div className="h-1 w-32 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-accent transition-all duration-500"
                style={{ width: '75%' }}
              />
            </div>
            <span className="text-xs text-accent font-mono font-bold">HIGH</span>
          </div>
        </div>

        {inThreatZone && (
          <div className="bg-destructive/80 border border-destructive p-2 rounded text-center animate-pulse">
            <div className="text-xs text-white font-mono font-bold">
              EVASIVE ACTION ADVISED
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RangeIndicators;
