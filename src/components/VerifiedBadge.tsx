import React from 'react';
import { Check } from 'lucide-react';

interface VerifiedBadgeProps {
  isVerified?: boolean;
  className?: string;
  size?: number;
}

export const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({ isVerified, className = '', size = 10 }) => {
  if (!isVerified) return null;

  return (
    <span
      id="verified-badge-element"
      className={`inline-flex items-center justify-center p-0.5 rounded-full bg-blue-500 text-white shadow-[0_0_8px_rgba(59,130,246,0.55)] cursor-default select-none animate-pulse shrink-0 ${className}`}
      style={{ width: `${size + 4}px`, height: `${size + 4}px` }}
      title="Verified Cyber Citizen"
    >
      <Check size={size} strokeWidth={4} />
    </span>
  );
};
