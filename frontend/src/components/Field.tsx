/**
 * Field Component
 *
 * Renders an individual field on the game board with interactive states,
 * animations, and accessibility features. Handles click events, hover effects,
 * and visual feedback for different field states and player interactions.
 *
 * Features:
 * - Visual states: dry (yellow) and flooded (blue)
 * - Interactive selection highlighting for weather player
 * - Hover effects and cursor changes
 * - 3D flip animation on state changes
 * - Drying preview highlighting for adventurer movement
 * - Accessibility support with ARIA labels
 * - Adventurer position indicator with emoji
 */

import { useState, useEffect, useRef, memo } from 'react';
import { FieldState } from '../types';

/**
 * Props for the Field component
 */
interface FieldProps {
  /** Row index of the field in the grid */
  row: number;
  /** Column index of the field in the grid */
  col: number;
  /** Current state of the field (DRY or FLOODED) */
  fieldState: FieldState;
  /** Whether the adventurer is positioned on this field */
  hasAdventurer: boolean;
  /** Size of the field in pixels */
  cellSize: number;

  // Interaction states
  /** Whether the field can be selected by the current player */
  isSelectable: boolean;
  /** Whether the field is currently selected (weather player) */
  isSelected: boolean;
  /** Whether the field is currently being hovered */
  isHovered: boolean;
  /** Whether the field is highlighted as a drying preview */
  isDryingPreview: boolean;

  // Event handlers
  /** Function called when the field is clicked */
  onClick: (row: number, col: number) => void;
  /** Function called when mouse enters the field */
  onMouseEnter: (row: number, col: number) => void;
  /** Function called when mouse leaves the field */
  onMouseLeave: () => void;
}

/**
 * Individual Field component with interactive states and animations
 *
 * Renders a single field on the game board with appropriate styling,
 * animations, and interaction handlers based on the current game state.
 *
 * @param props - Component props
 * @returns JSX element representing a game field
 */
function FieldComponent({
  row,
  col,
  fieldState,
  hasAdventurer,
  cellSize,
  isSelectable,
  isSelected,
  isHovered,
  isDryingPreview,
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

  /**
   * Get base CSS classes for the field based on its state
   *
   * Returns appropriate background and border colors for dry/flooded states.
   * Selected dry fields show blue tint to indicate they will be flooded.
   *
   * @returns CSS class string for base field styling
   */
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

  /**
   * Get cursor CSS class based on field selectability
   *
   * @returns CSS class string for cursor styling
   */
  const getCursorClass = (): string => {
    if (isSelectable) {
      return 'cursor-pointer';
    }
    return 'cursor-default';
  };

  /**
   * Get hover effect CSS classes for selectable fields
   *
   * @returns CSS class string for hover effects
   */
  const getHoverClasses = (): string => {
    if (isSelectable) {
      return 'hover:brightness-110 hover:scale-105';
    }
    return '';
  };

  /**
   * Get selection highlight CSS classes with priority ordering
   *
   * Priority: drying preview > selection > hover > default
   *
   * @returns CSS class string for selection highlighting
   */
  const getSelectionClasses = (): string => {
    // Drying preview has highest priority (only for flooded fields)
    if (isDryingPreview && fieldState === FieldState.FLOODED) {
      return 'ring-4 ring-lime-400 brightness-110';
    }
    if (isSelected) {
      return 'ring-4 ring-blue-500 field-selected';
    }
    if (isHovered && isSelectable) {
      return 'ring-2 ring-white ring-opacity-60';
    }
    return '';
  };

  /**
   * Get opacity CSS class for non-selectable fields
   *
   * Reduces opacity of non-selectable dry fields to provide visual feedback.
   *
   * @returns CSS class string for opacity styling
   */
  const getOpacityClass = (): string => {
    if (!isSelectable && fieldState === FieldState.DRY) {
      return 'opacity-70';
    }
    return '';
  };

  /**
   * Handle click events on the field
   *
   * Only processes clicks on selectable fields, passing the field coordinates
   * to the parent component's click handler.
   */
  const handleClick = () => {
    if (isSelectable) {
      onClick(row, col);
    }
  };

  /**
   * Handle mouse enter events
   *
   * Passes the field coordinates to the parent component's mouse enter handler.
   */
  const handleMouseEnter = () => {
    onMouseEnter(row, col);
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
      aria-label={`Field at row ${row + 1}, column ${col + 1}, ${fieldState}${hasAdventurer ? ', adventurer here' : ''}${isSelectable ? ', selectable' : ''}`}
    >
      {hasAdventurer && (
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

// Export the memoized component for performance optimization
export const Field = memo(FieldComponent);
