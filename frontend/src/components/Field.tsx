/**
 * Field Component
 * Renders an individual field on the game board with interactive states
 */

import { useState, useEffect, useRef } from 'react';
import { FieldState } from '../types';

interface FieldProps {
  row: number;
  col: number;
  fieldState: FieldState;
  hasJourneyman: boolean;
  cellSize: number;

  // Interaction states
  isSelectable: boolean;
  isSelected: boolean;
  isHovered: boolean;

  // Handlers
  onClick: (row: number, col: number) => void;
  onMouseEnter: (row: number, col: number) => void;
  onMouseLeave: () => void;
}

/**
 * Individual Field component with click handlers, hover states, and selection highlighting
 */
export function Field({
  row,
  col,
  fieldState,
  hasJourneyman,
  cellSize,
  isSelectable,
  isSelected,
  isHovered,
  onClick,
  onMouseEnter,
  onMouseLeave,
}: FieldProps) {
  // State tracking for animations
  const [isFlipping, setIsFlipping] = useState(false);
  const prevFieldStateRef = useRef(fieldState);

  // Trigger flip animation when field state changes
  useEffect(() => {
    if (prevFieldStateRef.current !== fieldState) {
      setIsFlipping(true);
      const timer = setTimeout(() => setIsFlipping(false), 400);
      prevFieldStateRef.current = fieldState;
      return () => clearTimeout(timer);
    }
  }, [fieldState]);

  // Base field color classes based on state
  const getBaseClasses = (): string => {
    if (fieldState === FieldState.DRY) {
      // When selected by Weather, show blue tint to indicate it will be flooded
      if (isSelected) {
        return 'bg-blue-300 border-blue-500';
      }
      return 'bg-yellow-200 border-yellow-400';
    } else {
      return 'bg-blue-400 border-blue-600';
    }
  };

  // Cursor classes based on selectability
  const getCursorClass = (): string => {
    if (isSelectable) {
      return 'cursor-pointer';
    }
    return 'cursor-default';
  };

  // Hover effect classes
  const getHoverClasses = (): string => {
    if (isSelectable) {
      return 'hover:brightness-110 hover:scale-105';
    }
    return '';
  };

  // Selection highlight classes
  const getSelectionClasses = (): string => {
    if (isSelected) {
      return 'ring-4 ring-blue-500 field-selected';
    }
    if (isHovered && isSelectable) {
      return 'ring-2 ring-white ring-opacity-60';
    }
    return '';
  };

  // Opacity based on selectability (fade non-selectable fields slightly)
  const getOpacityClass = (): string => {
    if (!isSelectable && fieldState === FieldState.DRY) {
      return 'opacity-70';
    }
    return '';
  };

  // Combine all classes
  const fieldClasses = `
    ${getBaseClasses()}
    ${getCursorClass()}
    ${getHoverClasses()}
    ${getSelectionClasses()}
    ${getOpacityClass()}
    ${isFlipping ? 'animate-[flip-y_400ms_ease-in-out]' : ''}
    border-2 rounded transition-all duration-300 flex items-center justify-center relative field-hover
  `.trim();

  // Handle click
  const handleClick = () => {
    if (isSelectable) {
      onClick(row, col);
    }
  };

  // Handle mouse enter
  const handleMouseEnter = () => {
    onMouseEnter(row, col);
  };

  return (
    <div
      className={fieldClasses}
      style={{
        width: `${cellSize}px`,
        height: `${cellSize}px`,
        transformStyle: 'preserve-3d',
      }}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={onMouseLeave}
      role="button"
      tabIndex={isSelectable ? 0 : -1}
      aria-label={`Field at row ${row + 1}, column ${col + 1}, ${fieldState}${hasJourneyman ? ', journeyman here' : ''}${isSelectable ? ', selectable' : ''}`}
    >
      {hasJourneyman && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className="text-2xl drop-shadow-lg"
            style={{ fontSize: `${cellSize * 0.6}px` }}
            aria-hidden="true"
          >
            🧙‍♂️
          </span>
        </div>
      )}
    </div>
  );
}
