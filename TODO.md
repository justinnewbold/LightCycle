# Light Cycle - Trainyard Feature Parity TODO

## Overview
Features to implement to make Light Cycle more like Trainyard, the classic puzzle game by Matt Rix.

**Repository:** https://github.com/justinnewbold/LightCycle  
**Live Site:** https://lightcycle.newbold.cloud

---

## 🎉 ALL 10 ROADMAP ITEMS COMPLETE! 🎉

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

---

### 2. [x] Multi-Train Outlets
**Description:** Support multiple trains (2-9) spawning from a single outlet with timed releases.

**Details:**
- Outlets can have `count: N` property (1-9 trains)
- Trains release one at a time with configurable delay
- Visual indicator showing train count (stacked icons or number)
- All trains from outlet must reach valid stations

---

### 3. [x] Multi-Train Station Requirements
**Description:** Stations can require multiple trains to complete (e.g., "needs 3 green cycles").

**Details:**
- Stations have `required: N` property (1-9 trains needed)
- Visual indicator showing required count and received count
- Station only "complete" when required count is met
- Level complete when ALL stations have met their requirements

---

### 4. [x] Delayed Start Timing & Timing Loops
**Description:** Outlets can have configurable start delays before releasing trains.

**Details:**
- Paths can loop back on themselves
- Trains continue around loops until they exit
- Essential for timing-based puzzles where trains must merge at specific moments
- Count-based timing (trains move 1 cell per tick)

---

### 5. [x] Crash vs Merge Distinction
**Description:** Head-on collisions cause crashes (fail), same-direction meetings cause merges (combine).

**Details:**
- **Merge:** Two trains on same cell moving same direction → combine into one
- **Cross:** Two trains cross paths at intersection → colors mix but stay separate
- **Crash:** Two trains collide head-on → level fails with crash animation

---

## Priority 2: Drawing & UX

### 6. [x] Free-Form Drawing Mode
**Description:** Optional drag-to-draw mode (vs current click-path A* system).

**Details:**
- Toggle between "Click Path" and "Free Draw" modes
- Free Draw: drag finger/mouse to lay track cell by cell
- More control over exact route, essential for timing puzzles
- Can draw curves, loops, and complex junctions manually

---

## Priority 3: Content

### 7. [x] 75 Levels
**Description:** Create more levels with progressive difficulty using new mechanics.

**Details:**
- Tutorial (1-5): Basic routing introduction
- Beginner (6-15): Simple color mixing
- Foundations (16-25): Core mechanics
- Intermediate (26-35): Junctions, multi-train outlets
- Advanced (36-45): Timing-based puzzles
- Expert (46-55): Complex synchronization
- Pathfinder (56-60): Route optimization
- Circuits (61-65): Loop mastery
- Spectrum (66-70): Color mixing expertise
- Masters (71-75): Ultimate challenges

---

### 8. [x] Level Packs / Themed Regions
**Description:** Organize levels into themed collections (like Trainyard's Canadian provinces).

**Details:**
- 12 level packs with unique visual themes
- Each pack introduces/focuses on specific mechanics
- Unlock packs by completing previous ones
- Pack completion tracking with star counts

---

## Priority 4: Social & Sync

### 9. [x] Cloud Sync with Supabase ✅
**Description:** Sync progress across devices using Supabase backend.

**Details:**
- Anonymous user ID generation
- Sync: level progress, stars, best times
- Toggle in Settings to enable/disable
- Manual "Sync Now" button
- Conflict resolution (merge progress)

**Supabase URL:** https://uvanigqqvfidjbtnqvvz.supabase.co
**Table:** `lightcycle_progress`

---

### 10. [x] Community Level Browser ✅
**Description:** In-app browser to discover and play community-created levels.

**Details:**
- Browse levels by: newest, popular (plays), most liked
- Tap to play, long-press to like
- Publish button (🌍) in game header
- Level metadata: name, creator, plays, likes
- Like tracking with local storage + level_likes table

**Supabase Tables:**
- `community_levels` - stores published levels
- `level_likes` - tracks user likes

---

## Completed Features ✅

### Core Gameplay
- [x] Color mixing (primary → secondary)
- [x] Splitters (secondary → primaries)
- [x] Color changers / paint tiles
- [x] Outlets and stations (multi-train support)
- [x] Switchable junctions
- [x] Crash vs merge detection
- [x] Timing loops

### Drawing & Controls
- [x] Click-to-path drawing with A*
- [x] Free-form drawing mode
- [x] Swipe drawing mode
- [x] Undo/redo system
- [x] Path locking
- [x] Eraser mode
- [x] Keyboard shortcuts

### Visual & Audio
- [x] Particle effects & trail system
- [x] Screen shake on events
- [x] Celebration animations
- [x] Cinematic replay mode
- [x] Colorblind mode with letters
- [x] 15+ sound effects
- [x] Haptic feedback

### Content & Progression
- [x] 75 levels across 12 packs
- [x] Daily challenges with streak tracking
- [x] Time attack mode
- [x] Star rating system (par-based)
- [x] Achievement system
- [x] Tutorial system
- [x] Hint system

### Social & Cloud
- [x] Cloud sync via Supabase
- [x] Community level browser
- [x] Level publishing
- [x] Level sharing via URL
- [x] Like/rating system

### Technical
- [x] PWA support
- [x] Statistics tracking
- [x] Speed controls
- [x] Zoom controls
- [x] Dev mode (version tap unlock)

---

## Next Steps (Post-Roadmap)

- [ ] User accounts with profiles
- [ ] Global leaderboards
- [ ] Level creator tool (in-app)
- [ ] Achievement badges display
- [ ] Push notifications for daily challenge
- [ ] Themes/skins for light cycles
- [ ] Tutorial videos

---

*Last Updated: January 30, 2026*
*Roadmap Completed! 🎉*
