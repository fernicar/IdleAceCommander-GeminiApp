
import React, { useMemo } from 'react';
import { BattleEntity } from '../../../types/combat.types';
import { cartesianToSpherical, normalizeAngle, angleDifference, formatBearing } from './utils';
import { HUDText } from './HUDOverlay';

interface HMSReticleProps {
  cameraPosition: [number, number, number];
  cameraRotation: [number, number, number];
  primaryTarget: BattleEntity | null;
  weaponRange?: number; // km
  className?: string;
}

/**
 * HMSReticle - Helmet-Mounted Sight Reticle
 * Dynamic targeting reticle with azimuth/elevation indicators
 */
export const HMSReticle: React.FC<HMSReticleProps> = ({
  cameraPosition,
  cameraRotation,
  primaryTarget,
  weaponRange = 10, // Default 10km weapon range
  className
}) => {
  // Convert camera rotation from radians to degrees
  const cameraHeading = normalizeAngle((cameraRotation[1] * 180) / Math.PI);
  const cameraPitch = (cameraRotation[0] * 180) / Math.PI;
  const cameraRoll = (cameraRotation[2] * 180) / Math.PI;

  // Calculate target bearing and elevation if we have a target
  const targetInfo = useMemo(() => {
    if (!primaryTarget || primaryTarget.isDestroyed) return null;

    const spherical = cartesianToSpherical(
      primaryTarget.position[0] - cameraPosition[0],
      primaryTarget.position[1] - cameraPosition[1],
      primaryTarget.position[2] - cameraPosition[2]
    );

    // Calculate relative bearing (how many degrees off-boresight)
    const relativeBearing = angleDifference(cameraHeading, spherical.azimuth);
    const relativeElevation = spherical.elevation - cameraPitch;

    // Check if in weapon range
    const inRange = spherical.range <= weaponRange;

    // Calculate lead indicator (simplified)
    // In reality, this would account for projectile speed, target velocity, etc.
    const leadX = primaryTarget.velocity[0] * 0.5;
    const leadY = primaryTarget.velocity[1] * 0.5;

    return {
      bearing: spherical.azimuth,
      elevation: spherical.elevation,
      range: spherical.range,
      relativeBearing,
      relativeElevation,
      inRange,
      leadX,
      leadY
    };
  }, [primaryTarget, cameraPosition, cameraHeading, cameraPitch, weaponRange]);

  // Generate compass rose marks (every 30 degrees)
  const compassMarks = useMemo(() => {
    const marks = [];
    for (let i = 0; i < 12; i++) {
      const angle = i * 30;
      const offset = angleDifference(cameraHeading, angle);
      // Only show marks within ±90 degrees
      if (Math.abs(offset) <= 90) {
        marks.push({ angle, offset });
      }
    }
    return marks;
  }, [cameraHeading]);

  // Generate pitch ladder marks (every 15 degrees)
  const pitchMarks = useMemo(() => {
    const marks = [];
    for (let i = -6; i <= 6; i++) {
      const pitch = i * 15;
      const offset = pitch - cameraPitch;
      // Only show marks within ±90 degrees
      if (Math.abs(offset) <= 90) {
        marks.push({ pitch, offset });
      }
    }
    return marks;
  }, [cameraPitch]);

  return (
    <div className={className}>
      {/* Main SVG Overlay for Reticle */}
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 1920 1080"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 pointer-events-none"
      >
        <defs>
          <filter id="reticle-glow">
            <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Azimuth Scale (Top) - Compass Rose */}
        <g filter="url(#reticle-glow)">
          {/* Background bar */}
          <rect
            x="760"
            y="40"
            width="400"
            height="40"
            fill="hsl(var(--background))"
            fillOpacity="0.6"
            stroke="hsl(var(--primary))"
            strokeWidth="1"
            strokeOpacity="0.5"
          />

          {/* Current heading indicator */}
          <path
            d="M 960,80 L 950,90 L 970,90 Z"
            fill="hsl(var(--primary))"
            filter="url(#reticle-glow)"
          />

          {/* Compass marks */}
          {compassMarks.map(({ angle, offset }) => {
            const x = 960 + offset * 3; // Scale factor for display
            const isMajor = angle % 90 === 0;
            return (
              <g key={angle}>
                <line
                  x1={x}
                  y1={isMajor ? 45 : 50}
                  x2={x}
                  y2={isMajor ? 70 : 65}
                  stroke="hsl(var(--primary))"
                  strokeWidth={isMajor ? 2 : 1}
                  opacity={isMajor ? 1 : 0.6}
                />
                {isMajor && (
                  <text
                    x={x}
                    y={62}
                    textAnchor="middle"
                    fill="hsl(var(--primary))"
                    fontSize="12"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    {formatBearing(angle)}
                  </text>
                )}
              </g>
            );
          })}

          {/* Current heading text */}
          <text
            x="960"
            y="105"
            textAnchor="middle"
            fill="hsl(var(--primary))"
            fontSize="16"
            fontFamily="monospace"
            fontWeight="bold"
          >
            HDG {formatBearing(cameraHeading)}°
          </text>
        </g>

        {/* Pitch Ladder (Right Side) */}
        <g filter="url(#reticle-glow)">
          {/* Background bar */}
          <rect
            x="1820"
            y="240"
            width="80"
            height="600"
            fill="hsl(var(--background))"
            fillOpacity="0.6"
            stroke="hsl(var(--primary))"
            strokeWidth="1"
            strokeOpacity="0.5"
          />

          {/* Pitch marks */}
          {pitchMarks.map(({ pitch, offset }) => {
            const y = 540 - offset * 4; // Scale factor for display
            const isMajor = pitch % 30 === 0;
            return (
              <g key={pitch}>
                <line
                  x1={isMajor ? 1825 : 1830}
                  y1={y}
                  x2={1895}
                  y2={y}
                  stroke="hsl(var(--primary))"
                  strokeWidth={isMajor ? 2 : 1}
                  opacity={isMajor ? 1 : 0.6}
                />
                {isMajor && (
                  <text
                    x={1860}
                    y={y + 5}
                    textAnchor="middle"
                    fill="hsl(var(--primary))"
                    fontSize="12"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    {pitch > 0 ? '+' : ''}{pitch}°
                  </text>
                )}
              </g>
            );
          })}

          {/* Current pitch indicator */}
          <path
            d="M 1820,540 L 1810,535 L 1810,545 Z"
            fill="hsl(var(--primary))"
            filter="url(#reticle-glow)"
          />

          {/* Current pitch text */}
          <text
            x="1780"
            y="545"
            textAnchor="end"
            fill="hsl(var(--primary))"
            fontSize="16"
            fontFamily="monospace"
            fontWeight="bold"
          >
            {cameraPitch.toFixed(1)}°
          </text>
        </g>

        {/* Bore Sight Cross (Fixed Center) */}
        <g filter="url(#reticle-glow)">
          {/* Outer circle */}
          <circle
            cx="960"
            cy="540"
            r="30"
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="2"
            opacity="0.7"
          />

          {/* Cross lines */}
          <line x1="935" y1="540" x2="985" y2="540" stroke="hsl(var(--primary))" strokeWidth="2" />
          <line x1="960" y1="515" x2="960" y2="565" stroke="hsl(var(--primary))" strokeWidth="2" />

          {/* Mil-dot ranging reticle */}
          <circle cx="960" cy="520" r="2" fill="hsl(var(--primary))" />
          <circle cx="960" cy="560" r="2" fill="hsl(var(--primary))" />
          <circle cx="940" cy="540" r="2" fill="hsl(var(--primary))" />
          <circle cx="980" cy="540" r="2" fill="hsl(var(--primary))" />
        </g>

        {/* Steering Cue Diamond (Points toward target) */}
        {targetInfo && (
          <g filter="url(#reticle-glow)">
            {/* Calculate steering cue position */}
            {(() => {
              // Convert relative angles to pixel offset
              // Clamp to screen bounds
              const maxOffset = 400;
              const xOffset = Math.max(-maxOffset, Math.min(maxOffset, targetInfo.relativeBearing * 10));
              const yOffset = Math.max(-maxOffset, Math.min(maxOffset, -targetInfo.relativeElevation * 10));
              
              const cuePosX = 960 + xOffset;
              const cuePosY = 540 + yOffset;

              const isOnScreen = Math.abs(xOffset) < 350 && Math.abs(yOffset) < 350;

              return (
                <>
                  {isOnScreen ? (
                    <>
                      {/* Steering diamond */}
                      <path
                        d={`M ${cuePosX},${cuePosY - 20} L ${cuePosX + 15},${cuePosY} L ${cuePosX},${cuePosY + 20} L ${cuePosX - 15},${cuePosY} Z`}
                        fill="none"
                        stroke={targetInfo.inRange ? 'hsl(var(--destructive))' : 'hsl(var(--primary))'}
                        strokeWidth="2.5"
                      >
                        {targetInfo.inRange && (
                          <animate
                            attributeName="opacity"
                            values="0.6;1;0.6"
                            dur="0.8s"
                            repeatCount="indefinite"
                          />
                        )}
                      </path>

                      {/* Lead indicator */}
                      <circle
                        cx={cuePosX + targetInfo.leadX}
                        cy={cuePosY + targetInfo.leadY}
                        r="8"
                        fill="none"
                        stroke={targetInfo.inRange ? 'hsl(var(--destructive))' : 'hsl(var(--primary))'}
                        strokeWidth="1.5"
                        strokeDasharray="3,3"
                      />

                      {/* Range finder scale */}
                      <text
                        x={cuePosX}
                        y={cuePosY + 35}
                        textAnchor="middle"
                        fill={targetInfo.inRange ? 'hsl(var(--destructive))' : 'hsl(var(--primary))'}
                        fontSize="12"
                        fontFamily="monospace"
                        fontWeight="bold"
                      >
                        {targetInfo.range.toFixed(1)} km
                      </text>
                    </>
                  ) : (
                    <>
                      {/* Off-screen target indicator arrows */}
                      {(() => {
                        const angle = Math.atan2(yOffset, xOffset);
                        const edgeX = 960 + Math.cos(angle) * 450;
                        const edgeY = 540 + Math.sin(angle) * 300;
                        
                        return (
                          <g>
                            <path
                              d={`M ${edgeX - 15 * Math.cos(angle)},${edgeY - 15 * Math.sin(angle)} 
                                  L ${edgeX + 10 * Math.cos(angle - Math.PI/6)},${edgeY + 10 * Math.sin(angle - Math.PI/6)} 
                                  L ${edgeX + 10 * Math.cos(angle + Math.PI/6)},${edgeY + 10 * Math.sin(angle + Math.PI/6)} Z`}
                              fill={targetInfo.inRange ? 'hsl(var(--destructive))' : 'hsl(var(--primary))'}
                            >
                              <animate
                                attributeName="opacity"
                                values="0.4;1;0.4"
                                dur="1s"
                                repeatCount="indefinite"
                              />
                            </path>
                            <text
                              x={edgeX + 20 * Math.cos(angle)}
                              y={edgeY + 20 * Math.sin(angle) + 5}
                              textAnchor="middle"
                              fill={targetInfo.inRange ? 'hsl(var(--destructive))' : 'hsl(var(--primary))'}
                              fontSize="11"
                              fontFamily="monospace"
                              fontWeight="bold"
                            >
                              {targetInfo.relativeBearing > 0 ? '→' : '←'} {Math.abs(targetInfo.relativeBearing).toFixed(0)}°
                            </text>
                          </g>
                        );
                      })()}
                    </>
                  )}
                </>
              );
            })()}
          </g>
        )}

        {/* "IN RANGE" Indicator */}
        {targetInfo?.inRange && (
          <g filter="url(#reticle-glow)">
            <rect
              x="860"
              y="150"
              width="200"
              height="40"
              fill="hsl(var(--destructive))"
              fillOpacity="0.8"
            >
              <animate
                attributeName="fill-opacity"
                values="0.6;0.9;0.6"
                dur="0.8s"
                repeatCount="indefinite"
              />
            </rect>
            <text
              x="960"
              y="177"
              textAnchor="middle"
              fill="white"
              fontSize="22"
              fontFamily="monospace"
              fontWeight="bold"
            >
              IN RANGE
            </text>
          </g>
        )}
      </svg>

      {/* HTML Overlay for Additional Info */}
      <div className="absolute bottom-8 left-8 space-y-1">
        <HUDText size="xs" color="primary">
          ROLL: {cameraRoll.toFixed(1)}°
        </HUDText>
        {targetInfo && (
          <>
            <HUDText size="xs" color="primary">
              TGT BRG: {formatBearing(targetInfo.bearing)}°
            </HUDText>
            <HUDText size="xs" color="primary">
              REL BRG: {targetInfo.relativeBearing > 0 ? '+' : ''}{targetInfo.relativeBearing.toFixed(1)}°
            </HUDText>
          </>
        )}
      </div>
    </div>
  );
};

export default HMSReticle;
