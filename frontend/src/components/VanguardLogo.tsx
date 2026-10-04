import React from 'react';

export interface VanguardLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  variant?: 'dark' | 'light';
  className?: string;
}

/**
 * Vanguard Intelligence — The "Vi" Monogram Emblem
 * Direct synthesis of the user's reference designs:
 * - Left Stem: Deep Vanguard Navy blade (#000814 -> #001D3D)
 * - Right 'i' Stem: Vanguard Royal Blue column (#003566 -> #0052A3)
 * - 'i' Dot Beacon: Radiant Vanguard Gold (#FFD60A -> #FFC300) with ambient glow
 * - Precision architectural negative-space slit between strokes
 */
export const VanguardEmblem: React.FC<{
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'dark' | 'light';
  className?: string;
}> = ({ size = 'md', variant = 'dark', className = '' }) => {
  const iconSize =
    size === 'xs' ? 'w-5 h-5' :
    size === 'sm' ? 'w-6 h-6' :
    size === 'md' ? 'w-8 h-8 sm:w-9 sm:h-9' :
    size === 'lg' ? 'w-10 h-10 sm:w-11 sm:h-11' : 'w-12 h-12 sm:w-14 sm:h-14';

  const isLight = variant === 'light';
  const prefix = isLight ? 'vi-lt' : 'vi-dk';

  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${iconSize} ${className} flex-shrink-0 transition-transform`}
    >
      <defs>
        {/* Left 'V' Blade Gradient */}
        <linearGradient id={`${prefix}-leftBlade`} x1="5" y1="7.5" x2="15" y2="33" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={isLight ? '#FFFFFF' : '#000814'} />
          <stop offset="60%" stopColor={isLight ? '#F1F5F9' : '#001D3D'} />
          <stop offset="100%" stopColor={isLight ? '#CBD5E1' : '#002855'} />
        </linearGradient>

        {/* Right 'i' Stem Gradient */}
        <linearGradient id={`${prefix}-rightStem`} x1="16.5" y1="33" x2="29.5" y2="14.5" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={isLight ? '#93C5FD' : '#002855'} />
          <stop offset="50%" stopColor={isLight ? '#38BDF8' : '#003566'} />
          <stop offset="100%" stopColor={isLight ? '#0284C7' : '#0052A3'} />
        </linearGradient>

        {/* 'i' Dot Beacon: Clean, Crisp Vanguard Gold (No glow/scatter) */}
        <linearGradient id={`${prefix}-goldBeacon`} x1="26" y1="3" x2="33" y2="10" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFBEB" />
          <stop offset="40%" stopColor="#FFD60A" />
          <stop offset="100%" stopColor="#FFC300" />
        </linearGradient>
      </defs>

      {/* ── Left Blade of 'V' ── */}
      <path
        d="M 5 7.5 L 12.5 7.5 L 15 33 L 9.5 33 Z"
        fill={`url(#${prefix}-leftBlade)`}
      />

      {/* ── Right Stem of 'V' / Body of 'i' ── */}
      <path
        d="M 16.5 33 L 23.5 14.5 L 29.5 14.5 L 22.5 33 Z"
        fill={`url(#${prefix}-rightStem)`}
      />

      {/* ── The Iconic 'i' Dot (Vanguard Gold Intelligence Beacon - Clean & Crisp) ── */}
      <circle
        cx="29.5"
        cy="6.5"
        r="3.5"
        fill={`url(#${prefix}-goldBeacon)`}
      />
    </svg>
  );
};

/**
 * VanguardLogo:
 * Positioning: [Vi Monogram Logo] [Vanguard] [Intelligence]
 * Clean, bold, elegant typography directly on canvas.
 */
export const VanguardLogo: React.FC<VanguardLogoProps> = ({
  size = 'md',
  showText = true,
  variant = 'dark',
  className = ''
}) => {
  const isLight = variant === 'light';

  const textSize =
    size === 'xs' ? 'text-sm' :
    size === 'sm' ? 'text-base sm:text-lg' :
    size === 'md' ? 'text-xl sm:text-2xl' :
    size === 'lg' ? 'text-2xl sm:text-3xl' : 'text-3xl sm:text-4xl';

  return (
    <div className={`inline-flex items-center gap-2.5 sm:gap-3 select-none ${className}`}>
      {/* The Vi Monogram Emblem */}
      <VanguardEmblem size={size} variant={variant} />

      {/* Word 1 (Vanguard) + Word 2 (Intelligence) */}
      {showText && (
        <span className={`font-display font-extrabold tracking-tight ${textSize} leading-none flex items-center gap-1.5 sm:gap-2`}>
          <span className={isLight ? 'text-white' : 'text-[#000814]'}>
            Vanguard
          </span>
          <span className={isLight ? 'text-[#38BDF8]' : 'text-[#003566]'}>
            Intelligence
          </span>
        </span>
      )}
    </div>
  );
};

export default VanguardLogo;
