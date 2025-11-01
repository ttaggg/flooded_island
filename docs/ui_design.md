# UI Design Guidelines

## Visual Style

### Color Palette
- **Primary Theme**: Indigo palette with soft gradients
- **Field States**:
  - **Dry**: Yellow (#FFC107, #FFD54F, or similar warm yellows)
  - **Flooded**: Blue (#2196F3, #42A5F5, or similar blues)
- **Background**: Soft indigo gradients
- **UI Elements**: Indigo shades (from light to dark)

### Design Principles
- Modern, clean interface
- Soft gradients throughout
- Smooth animations and transitions
- Clear visual feedback for all actions
- Responsive and intuitive controls

## Grid & Fields

### Field Appearance
- **Shape**: Squares with slightly rounded corners
- **Size**: NxN grid scaled to fit viewport
- **States**:
  - Dry: Yellow background
  - Flooded: Blue background
  - Adventurer position: Highlighted/marked on current square
  - Selectable: Hover state showing it can be selected
  - Selected: Border or glow effect

### Animations
- **State Change**: 3D flip/rotate animation when field changes from dry to flooded or vice versa
  - Smooth rotation (around vertical or horizontal axis)
  - Duration: ~300-500ms
  - Easing: ease-in-out
- **Selection**: Subtle scale or highlight animation
- **Invalid Action**: Shake or pulse animation for feedback

### Grid Layout
- Centered on screen
- Responsive sizing based on viewport
- Clear grid lines or subtle spacing between squares
- Should work on various screen sizes (desktop/tablet/mobile browsers)

## UI Components

### Role Selection Screen
- Display available roles: "Adventurer" and "Weather"
- Show which roles are taken/available
- Clear call-to-action buttons
- Indigo gradient background

### Game Configuration Screen
- Grid size selector (before game starts)
- Visual preview of grid size
- Start game button (when both players ready)
- Indigo-themed controls

### Game Board
- Grid occupies main viewport area
- Turn indicator (whose turn it is)
- Day counter (current turn / 365)
- Current role display
- "End Turn" button (prominent, disabled until valid action selected)

### Turn Controls
- **Adventurer**:
  - Clickable adjacent dry fields
  - Selected field highlighted
  - "End Turn" button
  - Clear indication of which fields will be dried
  
- **Weather**:
  - Clickable dry fields (anywhere on grid)
  - Selected fields highlighted (up to 2)
  - Counter showing how many selected (0/2, 1/2, 2/2)
  - "End Turn" button

### Game End Screen
- Winner announcement
- Final statistics (days survived, fields flooded, etc.)
- "Play Again" option
- Soft indigo gradient background with celebratory or neutral styling

## User Experience

### Feedback & Clarity
- **Hover States**: Show interactive elements clearly
- **Selection Preview**: Show what will happen before confirming
- **Invalid Actions**: Disabled states and/or error messages
- **Turn Transitions**: Smooth fade or transition between turns
- **Loading States**: If needed for WebSocket connection

### Responsive Design
- Should work in modern browsers (Chrome, Firefox, Safari, Edge)
- Adapt to different screen sizes
- Touch-friendly on tablets
- Keyboard navigation (optional enhancement)

### Accessibility Considerations
- Clear contrast between dry and flooded states
- Color-blind friendly palette (consider patterns/textures if needed)
- Clear labels and button states
- Screen reader support (optional enhancement)

## Technical Implementation Notes

### CSS/Styling Approach
- **Option 1**: Tailwind CSS (utility-first, easy indigo palette)
- **Option 2**: CSS Modules (scoped styles, more control)
- Use CSS transitions for smooth animations
- Consider using `transform` and `perspective` for 3D flip effect

### Animation Libraries (Optional)
- **framer-motion**: React animation library, great for complex interactions
- **react-spring**: Physics-based animations
- Pure CSS: For simple flip/rotate effects

### Layout Strategy
- CSS Grid or Flexbox for game board
- CSS variables for theming (indigo shades, sizes)
- Mobile-first responsive design
