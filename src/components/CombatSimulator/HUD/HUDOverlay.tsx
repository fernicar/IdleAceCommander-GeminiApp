
import React from 'react';
import { cn } from '../../../lib/utils';

interface HUDOverlayProps {
  children?: React.ReactNode;
  intensity?: 'day' | 'night' | 'off';
  className?: string;
}

/**
 * HUDOverlay - Glass cockpit overlay layer
 * Provides SVG-based HUD rendering with military-style vector graphics
 */
export const HUDOverlay: React.FC<HUDOverlayProps> = ({
  children,
  intensity = 'day',
  className
}) => {
  if (intensity === 'off') return null;

  // Intensity-based opacity
  const opacity = intensity === 'day' ? 0.9 : 0.6;

  return (
    <div 
      className={cn(
        "absolute inset-0 pointer-events-none z-10",
        "hud-overlay",
        className
      )}
      style={{ opacity }}
    >
      {/* SVG Container for vector graphics */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 1920 1080"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* HUD Green Glow Filter */}
          <filter id="hud-glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>

          {/* Scan Line Pattern */}
          <pattern id="scanlines" x="0" y="0" width="100%" height="4" patternUnits="userSpaceOnUse">
            <rect x="0" y="0" width="100%" height="2" fill="rgba(0, 255, 100, 0.03)"/>
            <rect x="0" y="2" width="100%" height="2" fill="transparent"/>
          </pattern>
        </defs>

        {/* Background Scan Lines Effect */}
        <rect x="0" y="0" width="1920" height="1080" fill="url(#scanlines)" opacity="0.3"/>

        {/* HUD Frame Border */}
        <rect 
          x="20" 
          y="20" 
          width="1880" 
          height="1040" 
          fill="none" 
          stroke="hsl(var(--primary))" 
          strokeWidth="2" 
          opacity="0.3"
          filter="url(#hud-glow)"
        />

        {/* Corner Brackets (typical military HUD style) */}
        {/* Top-left */}
        <path 
          d="M 40,40 L 40,80 M 40,40 L 80,40" 
          stroke="hsl(var(--primary))" 
          strokeWidth="2" 
          fill="none"
          filter="url(#hud-glow)"
        />
        {/* Top-right */}
        <path 
          d="M 1880,40 L 1840,40 M 1880,40 L 1880,80" 
          stroke="hsl(var(--primary))" 
          strokeWidth="2" 
          fill="none"
          filter="url(#hud-glow)"
        />
        {/* Bottom-left */}
        <path 
          d="M 40,1040 L 40,1000 M 40,1040 L 80,1040" 
          stroke="hsl(var(--primary))" 
          strokeWidth="2" 
          fill="none"
          filter="url(#hud-glow)"
        />
        {/* Bottom-right */}
        <path 
          d="M 1880,1040 L 1840,1040 M 1880,1040 L 1880,1000" 
          stroke="hsl(var(--primary))" 
          strokeWidth="2" 
          fill="none"
          filter="url(#hud-glow)"
        />

        {/* Center Crosshair (Bore Sight Reference) */}
        <g opacity="0.5">
          <circle 
            cx="960" 
            cy="540" 
            r="20" 
            fill="none" 
            stroke="hsl(var(--primary))" 
            strokeWidth="1.5"
            filter="url(#hud-glow)"
          />
          <line 
            x1="945" 
            y1="540" 
            x2="975" 
            y2="540" 
            stroke="hsl(var(--primary))" 
            strokeWidth="1.5"
            filter="url(#hud-glow)"
          />
          <line 
            x1="960" 
            y1="525" 
            x2="960" 
            y2="555" 
            stroke="hsl(var(--primary))" 
            strokeWidth="1.5"
            filter="url(#hud-glow)"
          />
        </g>

        {/* Additional HUD elements will be inserted here by child components */}
      </svg>

      {/* HTML/React Content Container (for complex dynamic elements) */}
      <div className="absolute inset-0 w-full h-full">
        {children}
      </div>
    </div>
  );
};

/**
 * HUDLayer - Individual layer component for organizing HUD elements
 */
interface HUDLayerProps {
  children: React.ReactNode;
  zIndex?: number;
  className?: string;
}

export const HUDLayer: React.FC<HUDLayerProps> = ({ 
  children, 
  zIndex = 10,
  className 
}) => {
  return (
    <div 
      className={cn("absolute inset-0 pointer-events-none", className)}
      style={{ zIndex }}
    >
      {children}
    </div>
  );
};

/**
 * HUDText - Styled text component for HUD displays
 */
interface HUDTextProps {
  children: React.ReactNode;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  color?: 'primary' | 'warning' | 'danger' | 'success';
  className?: string;
}

export const HUDText: React.FC<HUDTextProps> = ({ 
  children, 
  size = 'md',
  color = 'primary',
  className 
}) => {
  const sizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  const colorClasses = {
    primary: 'text-primary',
    warning: 'text-yellow-400',
    danger: 'text-destructive',
    success: 'text-green-400'
  };

  return (
    <span 
      className={cn(
        'font-mono font-bold tracking-wider uppercase',
        'drop-shadow-[0_0_8px_var(--primary)]',
        sizeClasses[size],
        colorClasses[color],
        className
      )}
      style={{
        textShadow: '0 0 10px currentColor, 0 0 20px currentColor'
      }}
    >
      {children}
    </span>
  );
};
