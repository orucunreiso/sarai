import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface CollapsibleCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  headerContent?: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

export const CollapsibleCard: React.FC<CollapsibleCardProps> = ({
  title,
  subtitle,
  children,
  actions,
  headerContent,
  defaultOpen = false,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={`bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-pink-200/50 overflow-hidden ${className}`}>
      <div className="p-4">
        <div 
          className="flex items-center justify-between cursor-pointer" 
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-800">{title}</h3>
              {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
            </div>
            {headerContent && (
              <div className="mt-2">{headerContent}</div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {actions && <div onClick={(e) => e.stopPropagation()}>{actions}</div>}
            <button 
              className="p-1 rounded-full hover:bg-gray-100 transition-colors"
              aria-label={isOpen ? "Daralt" : "Genişlet"}
            >
              {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
          </div>
        </div>
      </div>

      <div 
        className={`transition-all duration-300 ${
          isOpen 
            ? "max-h-[1000px] opacity-100" 
            : "max-h-0 opacity-0 overflow-hidden"
        }`}
      >
        <div className="p-4 pt-0 border-t border-pink-100">{children}</div>
      </div>
    </div>
  );
};

export default CollapsibleCard;
