import React, { useState, useRef, useEffect } from 'react';

export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

export interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  position?: TooltipPosition;
  delayMs?: number;
  className?: string;
  tooltipClassName?: string;
  disabled?: boolean;
  key?: React.Key;
}

export function Tooltip({
  content,
  children,
  position = 'top',
  delayMs = 150,
  className = '',
  tooltipClassName = '',
  disabled = false,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (disabled || !content) return;
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delayMs);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  if (disabled || !content) {
    return <>{children}</>;
  }

  // Positioning classes
  const getPositionClasses = () => {
    switch (position) {
      case 'bottom':
        return 'top-full left-1/2 -translate-x-1/2 mt-2';
      case 'left':
        return 'right-full top-1/2 -translate-y-1/2 mr-2';
      case 'right':
        return 'left-full top-1/2 -translate-y-1/2 ml-2';
      case 'top':
      default:
        return 'bottom-full left-1/2 -translate-x-1/2 mb-2';
    }
  };

  // Arrow classes
  const getArrowClasses = () => {
    switch (position) {
      case 'bottom':
        return '-top-1 left-1/2 -translate-x-1/2 border-t-0 border-r border-b-0 border-l border-slate-700 bg-slate-950 rotate-45';
      case 'left':
        return '-right-1 top-1/2 -translate-y-1/2 border-t border-r border-b-0 border-l-0 border-slate-700 bg-slate-950 rotate-45';
      case 'right':
        return '-left-1 top-1/2 -translate-y-1/2 border-t-0 border-r-0 border-b border-l border-slate-700 bg-slate-950 rotate-45';
      case 'top':
      default:
        return '-bottom-1 left-1/2 -translate-x-1/2 border-t-0 border-r border-b border-l-0 border-slate-700 bg-slate-950 rotate-45';
    }
  };

  return (
    <div
      className={`relative inline-flex ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleMouseEnter}
      onBlur={handleMouseLeave}
    >
      {children}
      {isVisible && (
        <div
          role="tooltip"
          className={`absolute z-50 pointer-events-none whitespace-normal max-w-xs px-3 py-1.5 rounded-lg border border-slate-700/90 bg-slate-950 text-slate-100 text-xs shadow-2xl transition-all duration-150 animate-in fade-in zoom-in-95 ${getPositionClasses()} ${tooltipClassName}`}
        >
          {content}
          <div className={`absolute w-2 h-2 ${getArrowClasses()}`} />
        </div>
      )}
    </div>
  );
}
