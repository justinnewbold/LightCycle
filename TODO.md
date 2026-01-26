# Light Cycle - Trainyard Feature Parity TODO

## Overview
Features to implement to make Light Cycle more like Trainyard, the classic puzzle game by Matt Rix.

**Repository:** https://github.com/justinnewbold/LightCycle  
**Live Site:** https://lightcycle.newbold.cloud

---

## Priority 1: Core Mechanics

### 1. [x] Switchable Junctions
**Description:** Allow players to toggle track direction at intersections by double-tap/click.

**Details:**
- When tracks cross or branch at a cell, store multiple possible directions
- Double-tap/click on a junction to cycle through configurations
- Visual indicator showing current switch state (arrow direction)
- Junction state persists until manually changed
- Trains follow the current switch direction when passing through

**Implementation Notes:**
- Add `junctions` array to track cells with multiple exits
- Add `toggleJunction(x, y)` function
- Update rendering to show switch indicators
- Update cycle movement logic to respect junction state

---

### 2. [ ] Multi-Train Outlets
**Description:** Support multiple trains (2-9) spawning from a single outlet with timed releases.

**Details:**
- Outlets can have `count: N` property (1-9 trains)
- Trains release one at a time with configurable delay
- Visual indicator showing train count (stacked icons or number)
- All trains from outlet must reach valid stations

**Implementation Notes:**
- Update outlet data structure: `{ x, y, color, direction, count: 3 }`
- Modify `startSimulation()` to spawn trains sequentially
- Add spawn delay timing (e.g., 500ms between trains)
- Update `drawOutlets()` to show count indicator

---

### 3. [ ] Multi-Train Station Requirements
**Description:** Stations can require multiple trains to complete (e.g., "needs 3 green cycles").

**Details:**
- Stations have `required: N` property (1-9 trains needed)
- Visual indicator showing required count and received count
- Station only "complete" when required count is met
- Level complete when ALL stations have met their requirements

**Implementation Notes:**
- Update station data structure: `{ x, y, color, required: 3, received: 0 }`
- Modify win condition check in `checkLevelComplete()`
- Update `drawStations()` to show requirement (e.g., "0/3")
- Add station fill animation as trains arrive

---

### 4. [ ] Timing Loops for Delays
**Description:** Allow circular paths that delay trains for synchronization.

**Details:**
- Paths can loop back on themselves
- Trains continue around loops until they exit
- Essential for timing-based puzzles where trains must merge at specific moments
- Count-based timing (trains move 1 cell per tick)

**Implementation Notes:**
- Ensure pathfinding doesn't prevent loops
- Trains should be able to traverse same cell multiple times
- May need to track "laps" or visited cells for infinite loop detection
- Add timeout/max-steps failsafe

---

### 5. [ ] Crash vs Merge Distinction
**Description:** Head-on collisions cause crashes (fail), same-direction meetings cause merges (combine).

**Details:**
- **Merge:** Two trains on same cell moving same direction → combine into one
- **Cross:** Two trains cross paths at intersection → colors mix but stay separate
- **Crash:** Two trains collide head-on → level fails with crash animation

**Implementation Notes:**
- Check relative directions when trains occupy same cell
- `areSameDirection(train1, train2)` → merge
- `areOppositeDirection(train1, train2)` → crash
- `areCrossing(train1, train2)` → mix colors, continue separately
- Add crash animation and sound effect

---

## Priority 2: Drawing & UX

### 6. [ ] Free-Form Drawing Mode
**Description:** Optional drag-to-draw mode (vs current click-path A* system).

**Details:**
- Toggle between "Click Path" and "Free Draw" modes
- Free Draw: drag finger/mouse to lay track cell by cell
- More control over exact route, essential for timing puzzles
- Can draw curves, loops, and complex junctions manually

**Implementation Notes:**
- Add drawing mode toggle in UI
- Implement `handleDragDraw()` for continuous input
- Track cells visited during drag gesture
- Connect adjacent cells with appropriate track segments

---

## Priority 3: Content

### 7. [ ] Expand to 50-100 Levels
**Description:** Create more levels with progressive difficulty using new mechanics.

**Details:**
- Beginner (1-15): Basic routing, simple color mixing
- Intermediate (16-35): Junctions, multi-train outlets
- Advanced (36-60): Timing loops, crash avoidance
- Expert (61-80): Complex multi-train synchronization
- Master (81-100): All mechanics combined

**Implementation Notes:**
- Design levels that teach each new mechanic
- Ensure mathematical solvability
- Balance difficulty curve
- Add level descriptions/hints

---

### 8. [ ] Level Packs / Themed Regions
**Description:** Organize levels into themed collections (like Trainyard's Canadian provinces).

**Details:**
- 8-10 level packs with unique visual themes
- Pack names: "The Grid", "User Territory", "MCP Core", "Data Stream", etc.
- Each pack introduces/focuses on specific mechanics
- Unlock packs by completing previous ones
- Pack-specific achievements

**Implementation Notes:**
- Create `levelPacks` data structure
- Update level select UI to show packs
- Add pack completion tracking
- Unique color schemes per pack (optional)

---

## Priority 4: Social & Sync

### 9. [ ] Cloud Sync with Supabase
**Description:** Sync progress across devices using Supabase backend.

**Details:**
- Optional account creation (email or anonymous)
- Sync: level progress, stars, achievements, best times
- Leaderboards with real player data
- Custom level cloud storage

**Implementation Notes:**
- Set up Supabase project and tables
- Implement auth flow (optional sign-in)
- Sync on app load and after level completion
- Handle offline/online transitions
- Conflict resolution (latest wins)

---

### 10. [ ] Community Level Browser
**Description:** In-app browser to discover and play community-created levels.

**Details:**
- Browse levels by: newest, popular, difficulty
- Search by name or creator
- Rate levels after playing
- Report inappropriate content
- Featured/curated levels section

**Implementation Notes:**
- Supabase table for shared levels
- Level metadata: name, creator, plays, rating, difficulty
- Pagination for level lists
- Preview thumbnails
- Download and play flow

---

## Completed Features ✅

- [x] Color mixing (primary → secondary)
- [x] Splitters (secondary → primaries)
- [x] Color changers / paint tiles
- [x] Outlets and stations
- [x] Click-to-path drawing with A*
- [x] Colorblind mode with letters
- [x] Daily challenges
- [x] Time attack mode
- [x] Level editor
- [x] Level sharing via URL
- [x] Keyboard shortcuts
- [x] Achievement system (15 achievements)
- [x] Star rating system (par-based)
- [x] Tutorial system
- [x] Speed controls
- [x] Obstacles / rocks
- [x] Undo/redo system
- [x] 30 levels across difficulty tiers
- [x] Statistics tracking
- [x] Haptic feedback
- [x] Sound effects
- [x] PWA support

---

## Implementation Order

| # | Feature | Complexity | Est. Time |
|---|---------|------------|-----------|
| 1 | Switchable Junctions | Medium | 2-3 hrs |
| 2 | Multi-Train Outlets | Medium | 1-2 hrs |
| 3 | Multi-Train Stations | Easy | 1 hr |
| 4 | Timing Loops | Medium | 2 hrs |
| 5 | Crash vs Merge | Medium | 2 hrs |
| 6 | Free-Form Drawing | Medium | 2-3 hrs |
| 7 | 50-100 Levels | High | 4-6 hrs |
| 8 | Level Packs | Medium | 2-3 hrs |
| 9 | Cloud Sync | High | 4-5 hrs |
| 10 | Community Browser | High | 4-5 hrs |

**Total Estimated:** 24-32 hours

---

## Notes

- Each feature should be tested thoroughly before moving to next
- New levels should be designed to showcase new mechanics
- Maintain backward compatibility with existing save data
- Consider mobile UX for all new features
- Update tutorial to explain new mechanics

---

*Last Updated: January 26, 2026*
