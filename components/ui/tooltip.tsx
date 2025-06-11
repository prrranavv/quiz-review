import React, { useState, ReactNode, useEffect, useRef } from 'react';

interface TooltipProps {
  content: string;
  children: ReactNode;
  className?: string;
}

const Tooltip: React.FC<TooltipProps> = ({ content, children, className = '' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState<'top' | 'bottom' | 'right'>('top');
  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isVisible && containerRef.current && tooltipRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      
      // Check if tooltip fits above
      if (containerRect.top - tooltipRect.height - 8 < 0) {
        // Not enough space above, try right
        if (containerRect.right + tooltipRect.width + 8 > window.innerWidth) {
          // Not enough space right, show below
          setPosition('bottom');
        } else {
          setPosition('right');
        }
      } else {
        setPosition('top');
      }
    }
  }, [isVisible]);

  if (!content) {
    return <>{children}</>;
  }

  const getTooltipClasses = () => {
    const baseClasses = "absolute z-[9999] px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-2xl whitespace-normal max-w-xs break-words border border-gray-600";
    
    switch (position) {
      case 'top':
        return `${baseClasses} bottom-full left-1/2 transform -translate-x-1/2 mb-2`;
      case 'bottom':
        return `${baseClasses} top-full left-1/2 transform -translate-x-1/2 mt-2`;
      case 'right':
        return `${baseClasses} left-full top-1/2 transform -translate-y-1/2 ml-3`;
      default:
        return `${baseClasses} bottom-full left-1/2 transform -translate-x-1/2 mb-2`;
    }
  };

  const getArrowClasses = () => {
    switch (position) {
      case 'top':
        return "absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900";
      case 'bottom':
        return "absolute bottom-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-b-gray-900";
      case 'right':
        return "absolute right-full top-1/2 transform -translate-y-1/2 border-4 border-transparent border-r-gray-900";
      default:
        return "absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900";
    }
  };

  return (
    <div 
      ref={containerRef}
      className={`relative inline-block ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div ref={tooltipRef} className={getTooltipClasses()}>
          {content}
          <div className={getArrowClasses()}></div>
        </div>
      )}
    </div>
  );
};

export { Tooltip }; 