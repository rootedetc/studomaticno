# UX/UI Audit & Improvement Plan

## 1. Executive Summary
The application is built on a solid technical foundation (React + Tailwind + PWA) with a generally clean codebase. The "not that great" UX likely stems from a lack of **visual delight**, **information hierarchy optimization**, and **user-centric feedback loops** rather than structural failures. The current UI is functional but generic.

## 2. Identified Issues & Opportunities

### A. Dashboard Experience
- **Current State**: Large greeting header takes up 30-40% of the screen on mobile. Quick stats are useful but visually equal. "Today's Timetable" is good but could be more actionable.
- **Problem**: Information density is low in the prime screen real estate (top fold).
- **Opportunity**: 
  - Condense the greeting.
  - Add a **"Next Up"** widget (e.g., "Next class in 45 mins: Mathematics").
  - Use graphical charts for grades/finance summaries instead of text cards.

### B. Navigation & Information Architecture
- **Current State**: 
  - Desktop: Sidebar (Standard).
  - Mobile: Bottom Nav (4 items) + "More" Grid.
- **Problem**: "More" menu hides important features like Grades/Files. 
- **Opportunity**: 
  - Allow customization of the bottom bar.
  - Add gestures (swipe left/right) to switch days in Timetable.

### C. Timetable UI
- **Current State**: Segmented Control + Date Picker + Prev/Next buttons.
- **Problem**: On mobile, the control row is cramped. The date picker is a native input which can be jarring.
- **Opportunity**:
  - Implement a **horizontal date strip** (swipeable week view) for easier day switching on mobile.
  - Simplify the header controls.

### D. Visual Feedback & Empty States
- **Current State**: 
  - Loading: Skeletons (Good).
  - Errors: `error-banner` (Red text box).
  - Empty: Simple icon + text.
- **Problem**: 
  - Error messages are often raw technical strings (`err.message`).
  - Empty states are uninspiring.
  - Transitions between loading -> content can be abrupt.
- **Opportunity**:
  - **Rich Empty States**: Use SVG illustrations for "No classes", "No messages".
  - **Toast Notifications**: Use non-intrusive toasts for minor errors/successes.
  - **Skeleton Transitions**: Fade out skeletons while fading in content.

### E. Micro-interactions
- **Current State**: Basic CSS `:active` scale and color transitions.
- **Problem**: Feels "static".
- **Opportunity**:
  - Add specific animations for entering pages (slide-in).
  - Animate numbers (e.g., counting up grades average).
  - Add "pull-to-refresh" haptic feedback if possible.

## 3. Implementation Plan (Prioritized)

### Phase 1: High Impact, Low Effort (Quick Wins)
1.  **Improve Error Messages**: Create a utility to map error codes/messages to user-friendly text.
2.  **Rich Empty States**: Replace `Icon` in `EmptyState` with dedicated SVG illustrations.
3.  **Dashboard Layout**: Reduce greeting size, emphasize the "Next Class" or "Unread" counts.

### Phase 2: UX Deep Dive
1.  **Timetable Mobile View**: Refactor the navigation controls for better touch targets and layout.
2.  **Grade Visualization**: Add a simple chart or progress bar for ECTS/GPA.

### Phase 3: Polish
1.  **Animations**: Refine page transitions and loading state exits.
2.  **Theme Customization**: Add more accent colors or "Theme" options beyond just Light/Dark.

## 4. Technical Recommendations
- **Icons**: The current `Icon.jsx` is a manual SVG map. Consider moving to `lucide-react` or `heroicons` for a more consistent and extensive icon set without manual SVG maintenance.
- **Error Boundary**: Ensure the `ErrorBoundary` provides a way to "Try Again" without reloading the page if possible.
