import React, { useState } from 'react';
import { ChevronDown, ChevronUp, MoreHorizontal } from 'lucide-react';

interface BaseWidgetProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  collapsedContent?: React.ReactNode; // Content to show when collapsed
  isExpandable?: boolean;
  defaultExpanded?: boolean;
  showActions?: boolean;
  onAction?: () => void;
  secondaryAction?: {
    icon: React.ReactNode;
    onClick: () => void;
    label: string;
  };
  className?: string;
  size?: 'small' | 'medium' | 'large';
  widgetId?: string; // Unique identifier for each widget
}

export const BaseWidget: React.FC<BaseWidgetProps> = ({
  title,
  icon,
  children,
  collapsedContent,
  isExpandable = true,
  defaultExpanded = false,
  showActions = true,
  onAction,
  secondaryAction,
  className = '',
  size = 'medium',
  widgetId,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const sizeClasses = {
    small: 'col-span-1 row-span-1',
    medium: 'col-span-1 row-span-1',
    large: 'col-span-2 row-span-1',
  };

  const handleToggle = () => {
    if (isExpandable) {
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <div 
      className={`modern-widget ${sizeClasses[size]} ${className}`}
      data-widget-id={widgetId}
    >
      {/* Widget Header */}
      <div 
        className="widget-header"
        onClick={handleToggle}
        role={isExpandable ? "button" : "heading"}
        tabIndex={isExpandable ? 0 : -1}
      >
        <div className="widget-header-content">
          <div className="widget-icon">
            {icon}
          </div>
          <h3 className="widget-title">{title}</h3>
        </div>
        
        <div className="widget-controls">
          {secondaryAction && (
            <button
              className="widget-action-btn"
              onClick={(e) => {
                e.stopPropagation();
                secondaryAction.onClick();
              }}
              aria-label={secondaryAction.label}
            >
              {secondaryAction.icon}
            </button>
          )}

          {showActions && (
            <button
              className="widget-action-btn"
              onClick={(e) => {
                e.stopPropagation();
                onAction?.();
              }}
              aria-label="Widget ayarları"
            >
              <MoreHorizontal size={16} />
            </button>
          )}
          
          {isExpandable && (
            <button
              className="widget-expand-btn"
              onClick={(e) => {
                e.stopPropagation();
                handleToggle();
              }}
              aria-label={isExpanded ? "Daralt" : "Genişlet"}
            >
              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          )}
        </div>
      </div>

      {/* Widget Content */}
      {!isExpanded && collapsedContent && (
        <div className="widget-collapsed-content">
          {collapsedContent}
        </div>
      )}
      
      <div className={`widget-expanded-content ${isExpanded ? 'expanded' : 'collapsed'}`}>
        {children}
      </div>
    </div>
  );
};

export default BaseWidget;
