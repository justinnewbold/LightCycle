// Light Cycle - Tron Puzzle Game
// iOS-Native Enhanced Edition with Swipe Controls & Modern UX

class LightCycleGame {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.confettiCanvas = document.getElementById('confetti-canvas');
        this.confettiCtx = this.confettiCanvas.getContext('2d');
        
        this.currentLevel = 0;
        this.isRunning = false;
        this.paths = {};
        this.currentPath = null;
        this.currentOutlet = null;
        this.cycles = [];
        this.animationFrame = null;
        this.hoverCell = null;
        this.lastRenderTime = 0;
        this.trailParticles = [];
        this.crashParticles = []; // Explosion particles for crashes
        this.pulsePhase = 0;
        
        // Swipe/gesture state
        this.touchStart = null;
        this.touchCurrent = null;
        this.isDragging = false;
        this.dragPath = [];
        this.lastDragCell = null;
        this.swipeThreshold = 10;
        this.isSwipeDrawing = false;
        
        // Long press detection
        this.longPressTimer = null;
        this.longPressDuration = 400;
        this.isLongPress = false;
        
        // Undo stack for multi-step undo
        this.undoStack = [];
        this.maxUndoSteps = 50;
        
        // Toast notifications
        this.toasts = [];
        
        // Switchable junctions state
        // Key: "x,y", Value: { paths: [{outletId, entryDir, exitDir}], activeIndex: 0 }
        this.junctions = {};
        this.lastTapTime = 0;
        this.lastTapPos = null;
        this.doubleTapThreshold = 300; // ms
        
        // Screen transition state
        this.screenTransition = null;
        
        this.settings = this.loadSettings();
        this.progress = this.loadProgress();
        
        // Dev mode: enable via URL param ?dev=1 or Shift+D keyboard shortcut
        if (new URLSearchParams(window.location.search).get('dev') === '1') {
            this.settings.devMode = true;
            this.saveSettings();
            console.log('🔓 Dev mode enabled via URL - all levels unlocked');
        }
        
        this.gridSize = 7;
        this.cellSize = 50;
        
        this.colors = {
            red: '#ff3366', blue: '#3366ff', yellow: '#ffff00', green: '#00ff66',
            cyan: '#00ffff', magenta: '#ff00ff', orange: '#ff9933', purple: '#9933ff',
            white: '#ffffff', pink: '#ff66b2'
        };
        
        this.colorMixing = {
            'red+blue': 'purple', 'blue+red': 'purple',
            'red+yellow': 'orange', 'yellow+red': 'orange',
            'blue+yellow': 'green', 'yellow+blue': 'green',
            'red+green': 'yellow', 'green+red': 'yellow',
            'cyan+magenta': 'white', 'magenta+cyan': 'white',
            'cyan+yellow': 'green', 'yellow+cyan': 'green',
            'red+cyan': 'white', 'cyan+red': 'white'
        };
        
        // Timer state
        this.timerStart = null;
        this.timerRunning = false;
        this.lastTime = 0;
        
        this.initLevels();
        this.initEventListeners();
        this.initAudio();
        this.initSwipeNavigation();
        this.initKeyboardShortcuts();
        this.renderLevelSelect();
        this.startAnimationLoop();
        
        // Check for shared level in URL
        this.checkForSharedLevel();
        
        // iOS-style entrance animation
        this.animateEntrance();
    }
    
    // ==================== LEVELS ====================
    initLevels() {
        // par = optimal number of total path nodes, undoBonus = max undos for 3 stars
        this.levels = [
            { id: 1, name: "First Light", description: "Swipe from outlet to station", gridSize: 5,
              par: 5, undoBonus: 0,
              outlets: [{ id: 'o1', x: 0, y: 2, color: 'cyan' }],
              stations: [{ id: 's1', x: 4, y: 2, color: 'cyan' }],
              obstacles: [], splitters: [], colorChangers: [] },
            { id: 2, name: "Two Paths", description: "Guide both cycles to their stations", gridSize: 5,
              par: 10, undoBonus: 1,
              outlets: [{ id: 'o1', x: 0, y: 1, color: 'cyan' }, { id: 'o2', x: 0, y: 3, color: 'magenta' }],
              stations: [{ id: 's1', x: 4, y: 1, color: 'cyan' }, { id: 's2', x: 4, y: 3, color: 'magenta' }],
              obstacles: [], splitters: [], colorChangers: [] },
            { id: 3, name: "Crossroads", description: "Paths can cross each other", gridSize: 5,
              par: 10, undoBonus: 1,
              outlets: [{ id: 'o1', x: 0, y: 2, color: 'cyan' }, { id: 'o2', x: 2, y: 0, color: 'magenta' }],
              stations: [{ id: 's1', x: 4, y: 2, color: 'cyan' }, { id: 's2', x: 2, y: 4, color: 'magenta' }],
              obstacles: [], splitters: [], colorChangers: [] },
            { id: 4, name: "Color Blend", description: "Merge paths: Red + Blue = Purple", gridSize: 6,
              par: 10, undoBonus: 2,
              outlets: [{ id: 'o1', x: 0, y: 1, color: 'red' }, { id: 'o2', x: 0, y: 4, color: 'blue' }],
              stations: [{ id: 's1', x: 5, y: 2, color: 'purple' }],
              obstacles: [], splitters: [], colorChangers: [] },
            { id: 5, name: "Split Decision", description: "Splitters divide your path", gridSize: 6,
              par: 10, undoBonus: 2,
              outlets: [{ id: 'o1', x: 0, y: 2, color: 'cyan' }],
              stations: [{ id: 's1', x: 5, y: 0, color: 'cyan' }, { id: 's2', x: 5, y: 4, color: 'cyan' }],
              obstacles: [], splitters: [{ x: 3, y: 2, directions: ['up', 'down'] }], colorChangers: [] },
            { id: 6, name: "Obstacle Course", description: "Navigate around barriers", gridSize: 6,
              par: 10, undoBonus: 2,
              outlets: [{ id: 'o1', x: 0, y: 2, color: 'cyan' }],
              stations: [{ id: 's1', x: 5, y: 2, color: 'cyan' }],
              obstacles: [{ x: 2, y: 1 }, { x: 2, y: 2 }, { x: 2, y: 3 }, { x: 4, y: 0 }, { x: 4, y: 1 }, { x: 4, y: 3 }, { x: 4, y: 4 }],
              splitters: [], colorChangers: [] },
            { id: 7, name: "Color Shift", description: "Color changers transform cycles", gridSize: 6,
              par: 6, undoBonus: 1,
              outlets: [{ id: 'o1', x: 0, y: 2, color: 'red' }],
              stations: [{ id: 's1', x: 5, y: 2, color: 'blue' }],
              obstacles: [], splitters: [], colorChangers: [{ x: 3, y: 2, toColor: 'blue' }] },
            { id: 8, name: "Triple Threat", description: "Three colors, three destinations", gridSize: 7,
              par: 24, undoBonus: 3,
              outlets: [{ id: 'o1', x: 0, y: 1, color: 'red' }, { id: 'o2', x: 0, y: 3, color: 'blue' }, { id: 'o3', x: 0, y: 5, color: 'yellow' }],
              stations: [{ id: 's1', x: 6, y: 1, color: 'red' }, { id: 's2', x: 6, y: 3, color: 'blue' }, { id: 's3', x: 6, y: 5, color: 'yellow' }],
              obstacles: [{ x: 3, y: 0 }, { x: 3, y: 2 }, { x: 3, y: 4 }, { x: 3, y: 6 }], splitters: [], colorChangers: [] },
            { id: 9, name: "Mix Master", description: "Create multiple mixed colors", gridSize: 7,
              par: 18, undoBonus: 3,
              outlets: [{ id: 'o1', x: 0, y: 1, color: 'red' }, { id: 'o2', x: 0, y: 3, color: 'yellow' }, { id: 'o3', x: 0, y: 5, color: 'blue' }],
              stations: [{ id: 's1', x: 6, y: 2, color: 'orange' }, { id: 's2', x: 6, y: 4, color: 'green' }],
              obstacles: [], splitters: [], colorChangers: [] },
            { id: 10, name: "Complex Web", description: "Multiple splits and merges", gridSize: 7,
              par: 20, undoBonus: 4,
              outlets: [{ id: 'o1', x: 0, y: 3, color: 'cyan' }, { id: 'o2', x: 3, y: 0, color: 'magenta' }],
              stations: [{ id: 's1', x: 6, y: 1, color: 'cyan' }, { id: 's2', x: 6, y: 5, color: 'magenta' }, { id: 's3', x: 3, y: 6, color: 'white' }],
              obstacles: [{ x: 2, y: 2 }, { x: 4, y: 4 }], splitters: [{ x: 2, y: 3, directions: ['right', 'down'] }], colorChangers: [] },
            { id: 11, name: "The Maze", description: "Find your way through", gridSize: 7,
              par: 18, undoBonus: 3,
              outlets: [{ id: 'o1', x: 0, y: 0, color: 'cyan' }],
              stations: [{ id: 's1', x: 6, y: 6, color: 'cyan' }],
              obstacles: [{ x: 1, y: 1 }, { x: 2, y: 1 }, { x: 3, y: 1 }, { x: 4, y: 1 }, { x: 4, y: 2 }, { x: 4, y: 3 }, { x: 1, y: 3 }, { x: 2, y: 3 }, { x: 2, y: 4 }, { x: 2, y: 5 }, { x: 4, y: 5 }, { x: 5, y: 5 }],
              splitters: [], colorChangers: [] },
            { id: 12, name: "Grand Finale", description: "Put all skills to the test", gridSize: 7,
              par: 22, undoBonus: 4,
              outlets: [{ id: 'o1', x: 0, y: 1, color: 'red' }, { id: 'o2', x: 0, y: 5, color: 'blue' }],
              stations: [{ id: 's1', x: 6, y: 0, color: 'red' }, { id: 's2', x: 6, y: 3, color: 'purple' }, { id: 's3', x: 6, y: 6, color: 'blue' }],
              obstacles: [{ x: 2, y: 0 }, { x: 2, y: 6 }, { x: 4, y: 2 }, { x: 4, y: 4 }],
              splitters: [{ x: 2, y: 1, directions: ['right', 'down'] }, { x: 2, y: 5, directions: ['right', 'up'] }], colorChangers: [] },
            { id: 13, name: "Prismatic", description: "Create all secondary colors", gridSize: 7,
              par: 24, undoBonus: 4,
              outlets: [{ id: 'o1', x: 0, y: 1, color: 'red' }, { id: 'o2', x: 0, y: 3, color: 'yellow' }, { id: 'o3', x: 0, y: 5, color: 'blue' }],
              stations: [{ id: 's1', x: 6, y: 1, color: 'orange' }, { id: 's2', x: 6, y: 3, color: 'green' }, { id: 's3', x: 6, y: 5, color: 'purple' }],
              obstacles: [{ x: 3, y: 0 }, { x: 3, y: 6 }], splitters: [], colorChangers: [] },
            { id: 14, name: "Chain Reaction", description: "Multiple transformations", gridSize: 7,
              par: 16, undoBonus: 3,
              outlets: [{ id: 'o1', x: 0, y: 3, color: 'cyan' }],
              stations: [{ id: 's1', x: 6, y: 1, color: 'magenta' }, { id: 's2', x: 6, y: 5, color: 'yellow' }],
              obstacles: [{ x: 3, y: 3 }],
              splitters: [{ x: 2, y: 3, directions: ['up', 'down'] }],
              colorChangers: [{ x: 2, y: 1, toColor: 'magenta' }, { x: 2, y: 5, toColor: 'yellow' }] },
            { id: 15, name: "Neon Dreams", description: "Master the grid", gridSize: 8,
              par: 30, undoBonus: 5,
              outlets: [{ id: 'o1', x: 0, y: 1, color: 'red' }, { id: 'o2', x: 0, y: 4, color: 'cyan' }, { id: 'o3', x: 0, y: 7, color: 'yellow' }],
              stations: [{ id: 's1', x: 7, y: 0, color: 'orange' }, { id: 's2', x: 7, y: 3, color: 'white' }, { id: 's3', x: 7, y: 6, color: 'green' }],
              obstacles: [{ x: 2, y: 2 }, { x: 2, y: 5 }, { x: 4, y: 1 }, { x: 4, y: 4 }, { x: 4, y: 6 }, { x: 6, y: 2 }, { x: 6, y: 5 }],
              splitters: [], colorChangers: [] },
            // NEW: Junction levels
            { id: 16, name: "First Junction", description: "Double-tap where paths cross to toggle priority", gridSize: 6,
              par: 12, undoBonus: 2,
              outlets: [{ id: 'o1', x: 0, y: 2, color: 'cyan' }, { id: 'o2', x: 2, y: 0, color: 'magenta' }],
              stations: [{ id: 's1', x: 5, y: 2, color: 'cyan' }, { id: 's2', x: 2, y: 5, color: 'magenta' }],
              obstacles: [], splitters: [], colorChangers: [] },
            { id: 17, name: "Junction Master", description: "Control multiple crossings", gridSize: 7,
              par: 18, undoBonus: 3,
              outlets: [{ id: 'o1', x: 0, y: 1, color: 'red' }, { id: 'o2', x: 0, y: 3, color: 'blue' }, { id: 'o3', x: 0, y: 5, color: 'yellow' }],
              stations: [{ id: 's1', x: 6, y: 5, color: 'red' }, { id: 's2', x: 6, y: 3, color: 'blue' }, { id: 's3', x: 6, y: 1, color: 'yellow' }],
              obstacles: [{ x: 3, y: 0 }, { x: 3, y: 6 }], splitters: [], colorChangers: [] },
            { id: 18, name: "Crossing Colors", description: "Cross paths to mix or keep separate", gridSize: 7,
              par: 16, undoBonus: 3,
              outlets: [{ id: 'o1', x: 0, y: 2, color: 'red' }, { id: 'o2', x: 0, y: 4, color: 'blue' }],
              stations: [{ id: 's1', x: 6, y: 3, color: 'purple' }, { id: 's2', x: 3, y: 6, color: 'red' }],
              obstacles: [], splitters: [], colorChangers: [] },
            // NEW: Multi-train outlet levels
            { id: 19, name: "Double Duty", description: "One outlet releases 2 trains!", gridSize: 6,
              par: 8, undoBonus: 1,
              outlets: [{ id: 'o1', x: 0, y: 2, color: 'cyan', count: 2, delay: 400 }],
              stations: [{ id: 's1', x: 5, y: 1, color: 'cyan' }, { id: 's2', x: 5, y: 3, color: 'cyan' }],
              obstacles: [], splitters: [{ x: 3, y: 2, directions: ['up', 'down'] }], colorChangers: [] },
            { id: 20, name: "Triple Threat Express", description: "3 trains, 3 destinations", gridSize: 7,
              par: 14, undoBonus: 2,
              outlets: [{ id: 'o1', x: 0, y: 3, color: 'magenta', count: 3, delay: 350 }],
              stations: [{ id: 's1', x: 6, y: 1, color: 'magenta' }, { id: 's2', x: 6, y: 3, color: 'magenta' }, { id: 's3', x: 6, y: 5, color: 'magenta' }],
              obstacles: [{ x: 3, y: 0 }, { x: 3, y: 6 }],
              splitters: [{ x: 2, y: 3, directions: ['up', 'right'] }, { x: 2, y: 1, directions: ['right', 'down'] }], colorChangers: [] },
            { id: 21, name: "Timing is Everything", description: "Coordinate multiple train waves", gridSize: 7,
              par: 16, undoBonus: 3,
              outlets: [{ id: 'o1', x: 0, y: 1, color: 'red', count: 2, delay: 600 }, { id: 'o2', x: 0, y: 5, color: 'blue', count: 2, delay: 600 }],
              stations: [{ id: 's1', x: 6, y: 2, color: 'red' }, { id: 's2', x: 6, y: 4, color: 'blue' }, { id: 's3', x: 6, y: 3, color: 'purple' }],
              obstacles: [], splitters: [], colorChangers: [] },
            { id: 22, name: "Train Swarm", description: "Control the chaos!", gridSize: 8,
              par: 20, undoBonus: 4,
              outlets: [{ id: 'o1', x: 0, y: 2, color: 'cyan', count: 4, delay: 300 }],
              stations: [{ id: 's1', x: 7, y: 0, color: 'cyan' }, { id: 's2', x: 7, y: 2, color: 'cyan' }, { id: 's3', x: 7, y: 5, color: 'cyan' }, { id: 's4', x: 7, y: 7, color: 'cyan' }],
              obstacles: [{ x: 4, y: 3 }, { x: 4, y: 4 }],
              splitters: [{ x: 2, y: 2, directions: ['up', 'right'] }, { x: 2, y: 0, directions: ['right', 'down'] }, { x: 4, y: 5, directions: ['right', 'down'] }], colorChangers: [] },
            // NEW: Multi-train station requirement levels
            { id: 23, name: "Fill 'Er Up", description: "Station needs 2 trains to complete!", gridSize: 6,
              par: 8, undoBonus: 1,
              outlets: [{ id: 'o1', x: 0, y: 2, color: 'cyan', count: 2, delay: 400 }],
              stations: [{ id: 's1', x: 5, y: 2, color: 'cyan', required: 2 }],
              obstacles: [], splitters: [], colorChangers: [] },
            { id: 24, name: "Split & Collect", description: "Fill both stations with multiple trains", gridSize: 7,
              par: 12, undoBonus: 2,
              outlets: [{ id: 'o1', x: 0, y: 3, color: 'magenta', count: 4, delay: 350 }],
              stations: [{ id: 's1', x: 6, y: 1, color: 'magenta', required: 2 }, { id: 's2', x: 6, y: 5, color: 'magenta', required: 2 }],
              obstacles: [],
              splitters: [{ x: 3, y: 3, directions: ['up', 'down'] }], colorChangers: [] },
            { id: 25, name: "Convergence Point", description: "Multiple outlets feed one hungry station", gridSize: 7,
              par: 14, undoBonus: 2,
              outlets: [{ id: 'o1', x: 0, y: 1, color: 'cyan' }, { id: 'o2', x: 0, y: 3, color: 'cyan' }, { id: 'o3', x: 0, y: 5, color: 'cyan' }],
              stations: [{ id: 's1', x: 6, y: 3, color: 'cyan', required: 3 }],
              obstacles: [{ x: 3, y: 0 }, { x: 3, y: 6 }], splitters: [], colorChangers: [] },
            { id: 26, name: "Color Collection", description: "Mix colors to fill the station", gridSize: 7,
              par: 14, undoBonus: 3,
              outlets: [{ id: 'o1', x: 0, y: 1, color: 'red', count: 2, delay: 500 }, { id: 'o2', x: 0, y: 5, color: 'blue', count: 2, delay: 500 }],
              stations: [{ id: 's1', x: 6, y: 3, color: 'purple', required: 2 }],
              obstacles: [], splitters: [], colorChangers: [] },
            { id: 27, name: "Demand & Supply", description: "Match train counts to station demands", gridSize: 8,
              par: 20, undoBonus: 4,
              outlets: [{ id: 'o1', x: 0, y: 2, color: 'cyan', count: 3, delay: 300 }, { id: 'o2', x: 0, y: 5, color: 'magenta', count: 2, delay: 400 }],
              stations: [{ id: 's1', x: 7, y: 1, color: 'cyan', required: 2 }, { id: 's2', x: 7, y: 4, color: 'cyan', required: 1 }, { id: 's3', x: 7, y: 6, color: 'magenta', required: 2 }],
              obstacles: [{ x: 4, y: 3 }],
              splitters: [{ x: 2, y: 2, directions: ['up', 'right'] }], colorChangers: [] },
            // NEW: Delayed start timing levels
            { id: 28, name: "Wait For It", description: "Some outlets have a delayed start!", gridSize: 6,
              par: 10, undoBonus: 1,
              outlets: [{ id: 'o1', x: 0, y: 1, color: 'cyan' }, { id: 'o2', x: 0, y: 4, color: 'magenta', startDelay: 1000 }],
              stations: [{ id: 's1', x: 5, y: 2, color: 'cyan' }, { id: 's2', x: 5, y: 3, color: 'magenta' }],
              obstacles: [], splitters: [], colorChangers: [] },
            { id: 29, name: "Staggered Start", description: "Time your crossings carefully", gridSize: 7,
              par: 14, undoBonus: 2,
              outlets: [{ id: 'o1', x: 0, y: 1, color: 'red' }, { id: 'o2', x: 0, y: 3, color: 'blue', startDelay: 800 }, { id: 'o3', x: 0, y: 5, color: 'yellow', startDelay: 1600 }],
              stations: [{ id: 's1', x: 6, y: 5, color: 'red' }, { id: 's2', x: 6, y: 3, color: 'blue' }, { id: 's3', x: 6, y: 1, color: 'yellow' }],
              obstacles: [], splitters: [], colorChangers: [] },
            { id: 30, name: "Merge Window", description: "Delay creates the perfect merge timing", gridSize: 7,
              par: 12, undoBonus: 2,
              outlets: [{ id: 'o1', x: 0, y: 1, color: 'red' }, { id: 'o2', x: 0, y: 5, color: 'blue', startDelay: 600 }],
              stations: [{ id: 's1', x: 6, y: 3, color: 'purple' }],
              obstacles: [{ x: 3, y: 0 }, { x: 3, y: 6 }], splitters: [], colorChangers: [] },
            { id: 31, name: "Wave Coordination", description: "Multiple delayed waves must synchronize", gridSize: 8,
              par: 18, undoBonus: 3,
              outlets: [{ id: 'o1', x: 0, y: 2, color: 'cyan', count: 2, delay: 400 }, { id: 'o2', x: 0, y: 5, color: 'cyan', count: 2, delay: 400, startDelay: 1200 }],
              stations: [{ id: 's1', x: 7, y: 1, color: 'cyan', required: 2 }, { id: 's2', x: 7, y: 6, color: 'cyan', required: 2 }],
              obstacles: [{ x: 4, y: 3 }, { x: 4, y: 4 }],
              splitters: [{ x: 2, y: 2, directions: ['up', 'right'] }, { x: 2, y: 5, directions: ['right', 'down'] }], colorChangers: [] },
            { id: 32, name: "Precision Timing", description: "Every millisecond counts!", gridSize: 8,
              par: 16, undoBonus: 4,
              outlets: [{ id: 'o1', x: 0, y: 1, color: 'red', startDelay: 0 }, { id: 'o2', x: 0, y: 4, color: 'blue', startDelay: 500 }, { id: 'o3', x: 0, y: 7, color: 'yellow', startDelay: 1000 }],
              stations: [{ id: 's1', x: 7, y: 3, color: 'white' }],
              obstacles: [{ x: 4, y: 0 }, { x: 4, y: 7 }], splitters: [], colorChangers: [] },
            // NEW: Crash vs Merge levels
            { id: 33, name: "Collision Course", description: "⚠️ Head-on collisions cause crashes!", gridSize: 6,
              par: 10, undoBonus: 1,
              outlets: [{ id: 'o1', x: 0, y: 2, color: 'cyan' }, { id: 'o2', x: 5, y: 2, color: 'magenta' }],
              stations: [{ id: 's1', x: 5, y: 0, color: 'cyan' }, { id: 's2', x: 0, y: 4, color: 'magenta' }],
              obstacles: [], splitters: [], colorChangers: [] },
            { id: 34, name: "Safe Merge", description: "Same direction = safe merge", gridSize: 6,
              par: 10, undoBonus: 1,
              outlets: [{ id: 'o1', x: 0, y: 1, color: 'red' }, { id: 'o2', x: 0, y: 3, color: 'blue' }],
              stations: [{ id: 's1', x: 5, y: 2, color: 'purple' }],
              obstacles: [], splitters: [], colorChangers: [] },
            { id: 35, name: "Avoid the Crash", description: "Route around potential collisions", gridSize: 7,
              par: 14, undoBonus: 2,
              outlets: [{ id: 'o1', x: 0, y: 3, color: 'cyan' }, { id: 'o2', x: 6, y: 3, color: 'magenta' }],
              stations: [{ id: 's1', x: 6, y: 0, color: 'cyan' }, { id: 's2', x: 0, y: 6, color: 'magenta' }],
              obstacles: [{ x: 3, y: 1 }, { x: 3, y: 5 }], splitters: [], colorChangers: [] },
            { id: 36, name: "Crossing Safely", description: "Perpendicular paths cross without crashing", gridSize: 7,
              par: 12, undoBonus: 2,
              outlets: [{ id: 'o1', x: 0, y: 3, color: 'cyan' }, { id: 'o2', x: 3, y: 0, color: 'magenta' }],
              stations: [{ id: 's1', x: 6, y: 3, color: 'cyan' }, { id: 's2', x: 3, y: 6, color: 'magenta' }],
              obstacles: [], splitters: [], colorChangers: [] },
            { id: 37, name: "Timing Dodge", description: "Use delays to avoid collisions", gridSize: 7,
              par: 12, undoBonus: 2,
              outlets: [{ id: 'o1', x: 0, y: 2, color: 'cyan' }, { id: 'o2', x: 6, y: 2, color: 'magenta', startDelay: 800 }],
              stations: [{ id: 's1', x: 6, y: 4, color: 'cyan' }, { id: 's2', x: 0, y: 4, color: 'magenta' }],
              obstacles: [{ x: 3, y: 0 }, { x: 3, y: 6 }], splitters: [], colorChangers: [] },
            { id: 38, name: "Crash Course Master", description: "Navigate multiple crash hazards", gridSize: 8,
              par: 20, undoBonus: 4,
              outlets: [{ id: 'o1', x: 0, y: 2, color: 'red' }, { id: 'o2', x: 7, y: 2, color: 'blue' }, { id: 'o3', x: 0, y: 5, color: 'yellow' }],
              stations: [{ id: 's1', x: 7, y: 5, color: 'red' }, { id: 's2', x: 0, y: 0, color: 'blue' }, { id: 's3', x: 7, y: 7, color: 'yellow' }],
              obstacles: [{ x: 4, y: 3 }, { x: 4, y: 4 }], splitters: [], colorChangers: [] }
        ];
    }
    
    // ==================== AUDIO ====================
    initAudio() {
        this.audioContext = null;
    }
    
    playSound(type) {
        if (!this.settings.sound) return;
        try {
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            switch(type) {
                case 'click':
                    oscillator.frequency.setValueAtTime(880, this.audioContext.currentTime);
                    oscillator.type = 'sine';
                    gainNode.gain.setValueAtTime(0.08, this.audioContext.currentTime);
                    oscillator.start();
                    oscillator.stop(this.audioContext.currentTime + 0.06);
                    break;
                case 'path':
                    oscillator.frequency.setValueAtTime(660, this.audioContext.currentTime);
                    oscillator.type = 'triangle';
                    gainNode.gain.setValueAtTime(0.05, this.audioContext.currentTime);
                    oscillator.start();
                    oscillator.stop(this.audioContext.currentTime + 0.03);
                    break;
                case 'undo':
                    oscillator.frequency.setValueAtTime(440, this.audioContext.currentTime);
                    oscillator.type = 'sine';
                    gainNode.gain.setValueAtTime(0.05, this.audioContext.currentTime);
                    oscillator.start();
                    oscillator.stop(this.audioContext.currentTime + 0.05);
                    break;
                case 'complete':
                    oscillator.frequency.setValueAtTime(523, this.audioContext.currentTime);
                    gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
                    oscillator.start();
                    oscillator.frequency.setValueAtTime(659, this.audioContext.currentTime + 0.1);
                    oscillator.frequency.setValueAtTime(784, this.audioContext.currentTime + 0.2);
                    oscillator.stop(this.audioContext.currentTime + 0.4);
                    break;
                case 'success':
                    oscillator.frequency.setValueAtTime(523, this.audioContext.currentTime);
                    oscillator.frequency.setValueAtTime(659, this.audioContext.currentTime + 0.12);
                    oscillator.frequency.setValueAtTime(784, this.audioContext.currentTime + 0.24);
                    oscillator.type = 'sine';
                    gainNode.gain.setValueAtTime(0.12, this.audioContext.currentTime);
                    oscillator.start();
                    oscillator.stop(this.audioContext.currentTime + 0.5);
                    break;
                case 'fail':
                    oscillator.frequency.setValueAtTime(330, this.audioContext.currentTime);
                    oscillator.frequency.setValueAtTime(220, this.audioContext.currentTime + 0.15);
                    oscillator.type = 'sawtooth';
                    gainNode.gain.setValueAtTime(0.08, this.audioContext.currentTime);
                    oscillator.start();
                    oscillator.stop(this.audioContext.currentTime + 0.25);
                    break;
                case 'crash':
                    // Dramatic crash sound - low rumble with noise burst
                    oscillator.frequency.setValueAtTime(100, this.audioContext.currentTime);
                    oscillator.frequency.exponentialRampToValueAtTime(40, this.audioContext.currentTime + 0.3);
                    oscillator.type = 'sawtooth';
                    gainNode.gain.setValueAtTime(0.15, this.audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.4);
                    oscillator.start();
                    oscillator.stop(this.audioContext.currentTime + 0.4);
                    break;
                case 'swipe':
                    oscillator.frequency.setValueAtTime(1200, this.audioContext.currentTime);
                    oscillator.type = 'sine';
                    gainNode.gain.setValueAtTime(0.03, this.audioContext.currentTime);
                    oscillator.start();
                    oscillator.stop(this.audioContext.currentTime + 0.02);
                    break;
            }
        } catch(e) {}
    }
    
    hapticFeedback(type = 'light') {
        if (!this.settings.haptic) return;
        
        // iOS Taptic Engine via webkit
        if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.haptic) {
            window.webkit.messageHandlers.haptic.postMessage(type);
        }
        
        // Standard Vibration API fallback
        if (navigator.vibrate) {
            switch(type) {
                case 'light': navigator.vibrate(5); break;
                case 'medium': navigator.vibrate(15); break;
                case 'heavy': navigator.vibrate(25); break;
                case 'success': navigator.vibrate([20, 50, 30]); break;
                case 'fail': navigator.vibrate([50, 30, 50]); break;
                case 'selection': navigator.vibrate(3); break;
            }
        }
    }
    
    // ==================== SETTINGS & PROGRESS ====================
    loadSettings() {
        const saved = localStorage.getItem('lightcycle_settings');
        const defaults = { 
            sound: true, 
            haptic: true, 
            gridNumbers: false, 
            swipeMode: true, 
            showHints: true, 
            devMode: false,
            colorblindMode: false,
            timeAttackMode: false
        };
        return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
    }
    
    saveSettings() { localStorage.setItem('lightcycle_settings', JSON.stringify(this.settings)); }
    
    loadProgress() {
        const saved = localStorage.getItem('lightcycle_progress');
        const defaults = { 
            completedLevels: [], 
            stars: {}, 
            moveHistory: {},
            bestTimes: {},
            dailyCompleted: {},
            dailyStreak: 0,
            lastDailyDate: null
        };
        return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
    }
    
    saveProgress() { localStorage.setItem('lightcycle_progress', JSON.stringify(this.progress)); }
    
    // ==================== COLORBLIND SUPPORT ====================
    getColorLabel(colorName) {
        const labels = {
            red: 'R', blue: 'B', yellow: 'Y', green: 'G',
            cyan: 'C', magenta: 'M', orange: 'O', purple: 'P',
            white: 'W', pink: 'K'
        };
        return labels[colorName] || '?';
    }
    
    getColorPattern(colorName) {
        // Returns a pattern type for colorblind differentiation
        const patterns = {
            red: 'diagonal', blue: 'horizontal', yellow: 'vertical', green: 'dots',
            cyan: 'cross', magenta: 'zigzag', orange: 'checker', purple: 'waves',
            white: 'solid', pink: 'diamond'
        };
        return patterns[colorName] || 'solid';
    }
    
    // ==================== TIMER FUNCTIONS ====================
    startTimer() {
        this.timerStart = Date.now();
        this.timerRunning = true;
        this.updateTimerDisplay();
    }
    
    stopTimer() {
        this.timerRunning = false;
        if (this.timerStart) {
            this.lastTime = Date.now() - this.timerStart;
        }
        return this.lastTime || 0;
    }
    
    updateTimerDisplay() {
        if (!this.timerRunning) return;
        const elapsed = Date.now() - this.timerStart;
        const timerEl = document.getElementById('timer-display');
        if (timerEl) {
            timerEl.textContent = this.formatTime(elapsed);
        }
        if (this.timerRunning) {
            requestAnimationFrame(() => this.updateTimerDisplay());
        }
    }
    
    formatTime(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        const milliseconds = Math.floor((ms % 1000) / 10);
        if (minutes > 0) {
            return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
        }
        return `${remainingSeconds}.${milliseconds.toString().padStart(2, '0')}s`;
    }
    
    // ==================== DAILY CHALLENGE ====================
    getDailySeed() {
        const now = new Date();
        return parseInt(`${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}`);
    }
    
    seededRandom(seed) {
        const x = Math.sin(seed++) * 10000;
        return x - Math.floor(x);
    }
    
    generateDailyChallenge() {
        const seed = this.getDailySeed();
        let s = seed;
        const rand = () => {
            s = (s * 1103515245 + 12345) & 0x7fffffff;
            return s / 0x7fffffff;
        };
        
        // Day of week affects difficulty (0=Sun harder, 6=Sat medium, 1-5 easier)
        const dayOfWeek = new Date().getDay();
        const difficulty = dayOfWeek === 0 ? 'hard' : dayOfWeek === 6 ? 'medium' : 'easy';
        
        const gridSize = difficulty === 'hard' ? 8 : difficulty === 'medium' ? 7 : 6;
        const numOutlets = difficulty === 'hard' ? 3 : difficulty === 'medium' ? 2 : 2;
        
        const colors = ['red', 'blue', 'yellow', 'cyan', 'magenta'];
        const outlets = [];
        const stations = [];
        const obstacles = [];
        
        // Generate outlets on left side
        const usedY = new Set();
        for (let i = 0; i < numOutlets; i++) {
            let y;
            do { y = Math.floor(rand() * (gridSize - 2)) + 1; } while (usedY.has(y));
            usedY.add(y);
            const color = colors[Math.floor(rand() * colors.length)];
            outlets.push({ id: `o${i + 1}`, x: 0, y, color });
        }
        
        // Generate stations on right side - match or mix colors
        const stationY = new Set();
        if (difficulty === 'easy') {
            // Same colors as outlets
            outlets.forEach((o, i) => {
                let y;
                do { y = Math.floor(rand() * (gridSize - 2)) + 1; } while (stationY.has(y));
                stationY.add(y);
                stations.push({ id: `s${i + 1}`, x: gridSize - 1, y, color: o.color });
            });
        } else {
            // Mix some colors
            const mixedColors = [];
            if (outlets.length >= 2) {
                const c1 = outlets[0].color;
                const c2 = outlets[1].color;
                const mixKey = `${c1}+${c2}`;
                const mixed = this.colorMixing[mixKey] || c1;
                mixedColors.push(mixed);
            }
            
            outlets.forEach((o, i) => {
                let y;
                do { y = Math.floor(rand() * (gridSize - 2)) + 1; } while (stationY.has(y));
                stationY.add(y);
                const color = i < mixedColors.length ? mixedColors[i] : o.color;
                stations.push({ id: `s${i + 1}`, x: gridSize - 1, y, color });
            });
        }
        
        // Add some obstacles for medium/hard
        const numObstacles = difficulty === 'hard' ? 6 : difficulty === 'medium' ? 3 : 0;
        const obstacleSet = new Set();
        for (let i = 0; i < numObstacles; i++) {
            let x, y, key;
            let attempts = 0;
            do {
                x = Math.floor(rand() * (gridSize - 4)) + 2;
                y = Math.floor(rand() * gridSize);
                key = `${x},${y}`;
                attempts++;
            } while ((obstacleSet.has(key) || outlets.some(o => o.x === x && o.y === y) || stations.some(s => s.x === x && s.y === y)) && attempts < 50);
            
            if (attempts < 50) {
                obstacleSet.add(key);
                obstacles.push({ x, y });
            }
        }
        
        return {
            id: 'daily',
            name: `Daily Challenge`,
            description: `${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} - ${new Date().toLocaleDateString()}`,
            gridSize,
            par: gridSize * numOutlets,
            undoBonus: difficulty === 'hard' ? 2 : difficulty === 'medium' ? 3 : 5,
            outlets,
            stations,
            obstacles,
            splitters: [],
            colorChangers: [],
            isDaily: true,
            difficulty,
            seed
        };
    }
    
    isDailyCompleted() {
        const today = this.getDailySeed().toString();
        return this.progress.dailyCompleted[today] === true;
    }
    
    completeDailyChallenge(stars, time) {
        const today = this.getDailySeed().toString();
        const yesterday = (this.getDailySeed() - 1).toString();
        
        if (!this.progress.dailyCompleted[today]) {
            this.progress.dailyCompleted[today] = true;
            
            // Update streak
            if (this.progress.lastDailyDate === yesterday) {
                this.progress.dailyStreak++;
            } else if (this.progress.lastDailyDate !== today) {
                this.progress.dailyStreak = 1;
            }
            this.progress.lastDailyDate = today;
            
            // Track best time
            const existingTime = this.progress.bestTimes['daily_' + today];
            if (!existingTime || time < existingTime) {
                this.progress.bestTimes['daily_' + today] = time;
            }
            
            this.saveProgress();
        }
    }
    
    // ==================== LEVEL SHARING ====================
    encodeLevel(level) {
        const data = {
            n: level.name,
            g: level.gridSize,
            p: level.par,
            u: level.undoBonus,
            o: level.outlets.map(o => [o.x, o.y, o.color.charAt(0)]),
            s: level.stations.map(s => [s.x, s.y, s.color.charAt(0)]),
            b: level.obstacles?.map(b => [b.x, b.y]) || [],
            sp: level.splitters?.map(sp => [sp.x, sp.y, sp.directions.map(d => d.charAt(0)).join('')]) || [],
            cc: level.colorChangers?.map(c => [c.x, c.y, c.toColor.charAt(0)]) || []
        };
        return btoa(JSON.stringify(data)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }
    
    decodeLevel(code) {
        try {
            const padded = code.replace(/-/g, '+').replace(/_/g, '/');
            const data = JSON.parse(atob(padded));
            const colorMap = { r: 'red', b: 'blue', y: 'yellow', g: 'green', c: 'cyan', m: 'magenta', o: 'orange', p: 'purple', w: 'white', k: 'pink' };
            const dirMap = { u: 'up', d: 'down', l: 'left', r: 'right' };
            
            return {
                id: 'custom_shared',
                name: data.n || 'Shared Level',
                description: 'A shared puzzle',
                gridSize: data.g || 7,
                par: data.p || 20,
                undoBonus: data.u || 3,
                outlets: (data.o || []).map((o, i) => ({ id: `o${i + 1}`, x: o[0], y: o[1], color: colorMap[o[2]] || 'cyan' })),
                stations: (data.s || []).map((s, i) => ({ id: `s${i + 1}`, x: s[0], y: s[1], color: colorMap[s[2]] || 'cyan' })),
                obstacles: (data.b || []).map(b => ({ x: b[0], y: b[1] })),
                splitters: (data.sp || []).map(sp => ({ x: sp[0], y: sp[1], directions: sp[2].split('').map(d => dirMap[d]) })),
                colorChangers: (data.cc || []).map(c => ({ x: c[0], y: c[1], toColor: colorMap[c[2]] || 'cyan' })),
                isShared: true
            };
        } catch (e) {
            console.error('Failed to decode level:', e);
            return null;
        }
    }
    
    shareCurrentLevel() {
        const level = this.levels[this.currentLevel];
        if (!level) return null;
        
        const code = this.encodeLevel(level);
        const url = `${window.location.origin}${window.location.pathname}?level=${code}`;
        
        if (navigator.share) {
            navigator.share({
                title: `Light Cycle - ${level.name}`,
                text: `Can you solve this puzzle?`,
                url: url
            }).catch(() => {});
        } else if (navigator.clipboard) {
            navigator.clipboard.writeText(url).then(() => {
                this.showToast('Link copied to clipboard!');
            }).catch(() => {
                this.showToast('Share: ' + url);
            });
        }
        return url;
    }
    
    checkForSharedLevel() {
        const params = new URLSearchParams(window.location.search);
        const levelCode = params.get('level');
        if (levelCode) {
            const level = this.decodeLevel(levelCode);
            if (level) {
                this.showToast('Loading shared level...');
                setTimeout(() => this.playSharedLevel(level), 500);
                // Clean URL
                window.history.replaceState({}, '', window.location.pathname);
            }
        }
    }
    
    playSharedLevel(level) {
        this.currentLevel = -1; // Mark as custom
        this.currentLevelData = level;
        this.startLevel(-1, level);
    }
    
    // ==================== KEYBOARD SHORTCUTS ====================
    initKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Check active screen
            const gameScreen = document.getElementById('game-screen');
            const isGameActive = gameScreen && gameScreen.classList.contains('active');
            const levelSelect = document.getElementById('level-select');
            const isLevelSelectActive = levelSelect && levelSelect.classList.contains('active');
            
            // Global shortcuts
            if (e.key === 'Escape') {
                e.preventDefault();
                if (isGameActive) {
                    document.getElementById('game-back-btn').click();
                } else if (!document.getElementById('main-menu').classList.contains('active')) {
                    const backBtn = document.querySelector('.screen.active .back-btn');
                    if (backBtn) backBtn.click();
                }
                return;
            }
            
            // Dev mode toggle
            if (e.shiftKey && e.key === 'D') {
                e.preventDefault();
                this.settings.devMode = !this.settings.devMode;
                this.saveSettings();
                this.showToast(this.settings.devMode ? '🔓 Dev mode ON' : '🔒 Dev mode OFF');
                this.renderLevelSelect();
                return;
            }
            
            // Game screen shortcuts
            if (isGameActive && !this.isRunning) {
                switch (e.key.toLowerCase()) {
                    case 'z':
                        if (e.ctrlKey || e.metaKey) {
                            e.preventDefault();
                            this.undo();
                        }
                        break;
                    case 'u':
                        e.preventDefault();
                        this.undo();
                        break;
                    case 'c':
                        if (!e.ctrlKey && !e.metaKey) {
                            e.preventDefault();
                            this.clearPaths();
                        }
                        break;
                    case 'r':
                        e.preventDefault();
                        this.resetLevel();
                        break;
                    case ' ':
                    case 'Enter':
                        e.preventDefault();
                        this.runSimulation();
                        break;
                }
                
                // Number keys for outlet selection (1-9)
                if (e.key >= '1' && e.key <= '9' && this.level) {
                    const outletIndex = parseInt(e.key) - 1;
                    if (this.level.outlets && outletIndex < this.level.outlets.length) {
                        e.preventDefault();
                        const outlet = this.level.outlets[outletIndex];
                        this.selectOutlet(outlet);
                    }
                }
            }
            
            // Level select shortcuts
            if (isLevelSelectActive) {
                if (e.key >= '1' && e.key <= '9') {
                    const levelNum = parseInt(e.key);
                    if (levelNum <= this.levels.length) {
                        e.preventDefault();
                        const isUnlocked = this.settings.devMode || levelNum === 1 || this.progress.completedLevels.includes(levelNum - 1);
                        if (isUnlocked) {
                            this.startLevel(levelNum - 1);
                        }
                    }
                }
                if (e.key === 'd' && !e.shiftKey) {
                    e.preventDefault();
                    this.startDailyChallenge();
                }
            }
            
            // Main menu shortcuts
            const mainMenu = document.getElementById('main-menu');
            if (mainMenu && mainMenu.classList.contains('active')) {
                switch (e.key.toLowerCase()) {
                    case 'p':
                    case 'Enter':
                    case ' ':
                        e.preventDefault();
                        document.getElementById('play-btn').click();
                        break;
                    case 'l':
                        e.preventDefault();
                        document.getElementById('levels-btn').click();
                        break;
                    case 'h':
                        e.preventDefault();
                        document.getElementById('how-to-play-btn').click();
                        break;
                    case 's':
                        e.preventDefault();
                        document.getElementById('settings-btn').click();
                        break;
                }
            }
        });
    }
    
    selectOutlet(outlet) {
        // Visual feedback and start drawing from this outlet
        this.currentOutlet = outlet;
        this.currentPath = [{ x: outlet.x, y: outlet.y }];
        this.hapticFeedback('selection');
        this.playSound('click');
        this.showToast(`Selected ${outlet.color} outlet`);
        this.render();
    }
    
    // ==================== EVENT LISTENERS ====================
    initEventListeners() {
        // Menu buttons with iOS spring animation
        document.getElementById('play-btn').addEventListener('click', (e) => {
            this.animateButtonPress(e.target);
            this.playSound('click'); this.hapticFeedback('medium');
            this.startLevel(this.getNextUncompletedLevel());
        });
        document.getElementById('levels-btn').addEventListener('click', (e) => {
            this.animateButtonPress(e.target);
            this.playSound('click'); this.hapticFeedback('light');
            this.showScreen('level-select');
        });
        document.getElementById('how-to-play-btn').addEventListener('click', (e) => {
            this.animateButtonPress(e.target);
            this.playSound('click'); this.hapticFeedback('light');
            this.showScreen('how-to-play');
        });
        document.getElementById('settings-btn').addEventListener('click', (e) => {
            this.animateButtonPress(e.target);
            this.playSound('click'); this.hapticFeedback('light');
            this.showScreen('settings');
        });
        
        // Back buttons
        document.querySelectorAll('.back-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.animateButtonPress(e.currentTarget);
                this.playSound('click'); this.hapticFeedback('light');
                const target = e.currentTarget.dataset.target;
                if (target) this.showScreen(target, 'slideRight');
            });
        });
        
        // Game controls
        document.getElementById('game-back-btn').addEventListener('click', (e) => {
            this.animateButtonPress(e.currentTarget);
            this.playSound('click'); this.hapticFeedback('light');
            this.stopSimulation(); this.showScreen('level-select', 'slideRight');
        });
        
        document.getElementById('run-btn').addEventListener('click', (e) => {
            this.animateButtonPress(e.target);
            this.playSound('click'); this.hapticFeedback('medium'); this.runSimulation();
        });
        document.getElementById('undo-btn').addEventListener('click', (e) => {
            this.animateButtonPress(e.target);
            this.playSound('undo'); this.hapticFeedback('light'); this.undo();
        });
        document.getElementById('clear-btn').addEventListener('click', (e) => {
            this.animateButtonPress(e.target);
            this.playSound('click'); this.hapticFeedback('medium'); this.clearAllPaths();
        });
        document.getElementById('reset-level-btn').addEventListener('click', (e) => {
            this.animateButtonPress(e.currentTarget);
            this.playSound('click'); this.hapticFeedback('medium'); this.resetLevel();
        });
        
        // Settings toggles
        document.getElementById('sound-toggle').addEventListener('change', (e) => {
            this.settings.sound = e.target.checked; this.saveSettings();
            if (e.target.checked) this.playSound('click');
            this.hapticFeedback('selection');
        });
        document.getElementById('haptic-toggle').addEventListener('change', (e) => {
            this.settings.haptic = e.target.checked; this.saveSettings();
            this.hapticFeedback('medium');
        });
        document.getElementById('grid-numbers-toggle').addEventListener('change', (e) => {
            this.settings.gridNumbers = e.target.checked; this.saveSettings();
            this.hapticFeedback('selection');
        });
        
        // Colorblind mode toggle
        const colorblindToggle = document.getElementById('colorblind-toggle');
        if (colorblindToggle) {
            colorblindToggle.addEventListener('change', (e) => {
                this.settings.colorblindMode = e.target.checked; this.saveSettings();
                this.hapticFeedback('selection');
                this.showToast(e.target.checked ? 'Colorblind mode ON - color labels visible' : 'Colorblind mode OFF');
                this.render();
            });
        }
        
        // Time attack mode toggle
        const timeAttackToggle = document.getElementById('time-attack-toggle');
        if (timeAttackToggle) {
            timeAttackToggle.addEventListener('change', (e) => {
                this.settings.timeAttackMode = e.target.checked; this.saveSettings();
                this.hapticFeedback('selection');
                this.showToast(e.target.checked ? 'Time Attack ON - timer enabled' : 'Time Attack OFF');
            });
        }
        
        // Share level button
        const shareBtn = document.getElementById('share-level-btn');
        if (shareBtn) {
            shareBtn.addEventListener('click', (e) => {
                this.animateButtonPress(e.target);
                this.playSound('click');
                this.hapticFeedback('light');
                this.shareCurrentLevel();
            });
        }
        
        const swipeToggle = document.getElementById('swipe-mode-toggle');
        if (swipeToggle) {
            swipeToggle.addEventListener('change', (e) => {
                this.settings.swipeMode = e.target.checked; this.saveSettings();
                this.hapticFeedback('selection');
                this.showToast(e.target.checked ? 'Swipe drawing enabled' : 'Tap drawing enabled');
            });
        }
        
        document.getElementById('reset-progress-btn').addEventListener('click', () => {
            this.showConfirmDialog('Reset all progress?', 'This cannot be undone.', () => {
                this.progress = { completedLevels: [], stars: {}, moveHistory: {}, bestTimes: {}, dailyCompleted: {}, dailyStreak: 0, lastDailyDate: null };
                this.saveProgress(); this.renderLevelSelect(); this.playSound('click');
                this.showToast('Progress reset');
            });
        });
        
        // Modal buttons
        document.getElementById('replay-btn').addEventListener('click', (e) => {
            this.animateButtonPress(e.target);
            this.playSound('click'); this.hapticFeedback('light'); this.hideModal(); this.resetLevel();
        });
        document.getElementById('next-level-btn').addEventListener('click', (e) => {
            this.animateButtonPress(e.target);
            this.playSound('click'); this.hapticFeedback('light'); this.hideModal();
            if (this.currentLevel < this.levels.length - 1) this.startLevel(this.currentLevel + 1);
            else this.showScreen('level-select');
        });
        
        // Canvas touch/mouse interactions
        this.initCanvasInteractions();
        
        // Initialize toggle states
        document.getElementById('sound-toggle').checked = this.settings.sound;
        document.getElementById('haptic-toggle').checked = this.settings.haptic;
        document.getElementById('grid-numbers-toggle').checked = this.settings.gridNumbers;
        if (swipeToggle) swipeToggle.checked = this.settings.swipeMode !== false;
        if (colorblindToggle) colorblindToggle.checked = this.settings.colorblindMode;
        if (timeAttackToggle) timeAttackToggle.checked = this.settings.timeAttackMode;
        
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // Prevent pull-to-refresh on iOS
        document.body.addEventListener('touchmove', (e) => {
            if (e.target.closest('#game-canvas')) {
                e.preventDefault();
            }
        }, { passive: false });
    }
    
    // ==================== CANVAS INTERACTIONS ====================
    initCanvasInteractions() {
        // Mouse events
        this.canvas.addEventListener('mousedown', (e) => this.handlePointerStart(e));
        this.canvas.addEventListener('mousemove', (e) => this.handlePointerMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handlePointerEnd(e));
        this.canvas.addEventListener('mouseleave', (e) => this.handlePointerEnd(e));
        
        // Touch events with improved iOS handling
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handlePointerStart(e.touches[0]);
        }, { passive: false });
        
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.handlePointerMove(e.touches[0]);
        }, { passive: false });
        
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.handlePointerEnd(e.changedTouches[0]);
        }, { passive: false });
        
        this.canvas.addEventListener('touchcancel', (e) => {
            this.handlePointerEnd(e.changedTouches[0]);
        });
    }
    
    handlePointerStart(e) {
        if (this.isRunning) return;
        
        const pos = this.getGridPosition(e.clientX, e.clientY);
        if (!pos) return;
        
        this.touchStart = { x: e.clientX, y: e.clientY, time: Date.now() };
        this.touchCurrent = this.touchStart;
        this.isDragging = false;
        this.isSwipeDrawing = false;
        this.dragPath = [];
        this.lastDragCell = null;
        this.isLongPress = false;
        
        // Start long press timer for undo
        this.longPressTimer = setTimeout(() => {
            this.isLongPress = true;
            this.hapticFeedback('heavy');
            this.showContextMenu(pos);
        }, this.longPressDuration);
        
        // Check if starting on an outlet
        const level = this.levels[this.currentLevel];
        const outlet = level.outlets.find(o => o.x === pos.x && o.y === pos.y);
        
        if (outlet) {
            this.saveState();
            this.startNewPath(outlet);
            this.isSwipeDrawing = true;
            this.lastDragCell = pos;
        }
        
        this.hoverCell = pos;
    }
    
    handlePointerMove(e) {
        if (this.isRunning) return;
        
        const pos = this.getGridPosition(e.clientX, e.clientY);
        this.hoverCell = pos;
        
        if (!this.touchStart) return;
        
        const dx = e.clientX - this.touchStart.x;
        const dy = e.clientY - this.touchStart.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Cancel long press if moved
        if (distance > 10 && this.longPressTimer) {
            clearTimeout(this.longPressTimer);
            this.longPressTimer = null;
        }
        
        // Start dragging
        if (distance > this.swipeThreshold) {
            this.isDragging = true;
        }
        
        // Swipe drawing mode
        if (this.isDragging && this.isSwipeDrawing && this.currentPath && this.currentOutlet && pos) {
            if (!this.lastDragCell || this.lastDragCell.x !== pos.x || this.lastDragCell.y !== pos.y) {
                // Check if moving to adjacent cell
                if (this.lastDragCell) {
                    const cellDx = Math.abs(pos.x - this.lastDragCell.x);
                    const cellDy = Math.abs(pos.y - this.lastDragCell.y);
                    
                    if ((cellDx === 1 && cellDy === 0) || (cellDx === 0 && cellDy === 1)) {
                        // Check for backtrack
                        const existingIndex = this.currentPath.findIndex(p => p.x === pos.x && p.y === pos.y);
                        if (existingIndex >= 0 && existingIndex < this.currentPath.length - 1) {
                            // Backtrack - remove nodes
                            this.currentPath.splice(existingIndex + 1);
                            this.playSound('undo');
                            this.hapticFeedback('light');
                        } else if (!this.isObstacle(pos.x, pos.y)) {
                            // Extend path
                            this.addToPath(pos);
                        }
                    }
                }
                this.lastDragCell = pos;
            }
        }
        
        this.touchCurrent = { x: e.clientX, y: e.clientY };
    }
    
    handlePointerEnd(e) {
        // Clear long press timer
        if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
            this.longPressTimer = null;
        }
        
        if (this.isRunning || this.isLongPress) {
            this.resetTouchState();
            return;
        }
        
        const pos = e ? this.getGridPosition(e.clientX, e.clientY) : this.hoverCell;
        
        // If was swipe drawing, finish path
        if (this.isSwipeDrawing && this.currentPath) {
            // Check if ended on a station
            const level = this.levels[this.currentLevel];
            const station = level.stations.find(s => pos && s.x === pos.x && s.y === pos.y);
            if (station || this.currentPath.length > 1) {
                this.finishCurrentPath();
            }
        }
        // Tap (not drag) - use tap-to-draw
        else if (!this.isDragging && pos && this.touchStart) {
            this.processGridClick(pos);
        }
        
        this.resetTouchState();
    }
    
    resetTouchState() {
        this.touchStart = null;
        this.touchCurrent = null;
        this.isDragging = false;
        this.isSwipeDrawing = false;
        this.dragPath = [];
        this.lastDragCell = null;
        this.isLongPress = false;
    }
    
    // ==================== SWIPE NAVIGATION ====================
    initSwipeNavigation() {
        let startX = 0;
        let startY = 0;
        
        document.querySelectorAll('.screen').forEach(screen => {
            screen.addEventListener('touchstart', (e) => {
                // Don't capture swipes on canvas
                if (e.target.closest('#game-canvas')) return;
                startX = e.touches[0].clientX;
                startY = e.touches[0].clientY;
            }, { passive: true });
            
            screen.addEventListener('touchend', (e) => {
                if (e.target.closest('#game-canvas')) return;
                
                const endX = e.changedTouches[0].clientX;
                const endY = e.changedTouches[0].clientY;
                const diffX = endX - startX;
                const diffY = endY - startY;
                
                // Swipe right to go back (iOS-style)
                if (Math.abs(diffX) > 100 && Math.abs(diffX) > Math.abs(diffY) && diffX > 0) {
                    const backBtn = screen.querySelector('.back-btn');
                    if (backBtn) {
                        this.playSound('swipe');
                        this.hapticFeedback('light');
                        backBtn.click();
                    }
                }
            }, { passive: true });
        });
    }
    
    // ==================== CONTEXT MENU ====================
    showContextMenu(pos) {
        // Remove existing menu
        const existing = document.querySelector('.context-menu');
        if (existing) existing.remove();
        
        const menu = document.createElement('div');
        menu.className = 'context-menu';
        menu.innerHTML = `
            <button class="context-item" data-action="undo">↩ Undo Last</button>
            <button class="context-item" data-action="clear-path">🗑 Clear This Path</button>
            <button class="context-item danger" data-action="clear-all">⚠ Clear All</button>
        `;
        
        const rect = this.canvas.getBoundingClientRect();
        menu.style.left = `${pos.x * this.cellSize + rect.left}px`;
        menu.style.top = `${pos.y * this.cellSize + rect.top}px`;
        
        menu.querySelectorAll('.context-item').forEach(item => {
            item.addEventListener('click', () => {
                const action = item.dataset.action;
                this.hapticFeedback('light');
                this.playSound('click');
                
                if (action === 'undo') this.undo();
                else if (action === 'clear-path') this.clearCurrentPath();
                else if (action === 'clear-all') this.clearAllPaths();
                
                menu.remove();
            });
        });
        
        document.body.appendChild(menu);
        
        // Remove menu on tap outside
        setTimeout(() => {
            document.addEventListener('click', function removeMenu() {
                menu.remove();
                document.removeEventListener('click', removeMenu);
            }, { once: true });
        }, 10);
    }
    
    // ==================== PATH DRAWING ====================
    processGridClick(pos) {
        const level = this.levels[this.currentLevel];
        if (this.isObstacle(pos.x, pos.y)) return;
        
        // Check for double-tap to toggle junction
        const now = Date.now();
        const key = `${pos.x},${pos.y}`;
        if (this.lastTapPos && this.lastTapPos.x === pos.x && this.lastTapPos.y === pos.y) {
            if (now - this.lastTapTime < this.doubleTapThreshold) {
                // Double-tap detected!
                if (this.junctions[key] && this.junctions[key].paths.length > 1) {
                    this.toggleJunction(pos.x, pos.y);
                    this.lastTapTime = 0;
                    this.lastTapPos = null;
                    return;
                }
            }
        }
        this.lastTapTime = now;
        this.lastTapPos = { x: pos.x, y: pos.y };
        
        const outlet = level.outlets.find(o => o.x === pos.x && o.y === pos.y);
        if (outlet) {
            this.saveState();
            this.startNewPath(outlet);
            return;
        }
        
        if (this.currentPath && this.currentOutlet) {
            this.saveState();
            this.extendPath(pos);
        }
    }
    
    startNewPath(outlet) {
        if (this.paths[outlet.id] && this.paths[outlet.id].length > 1) delete this.paths[outlet.id];
        this.currentOutlet = outlet;
        this.currentPath = [{ x: outlet.x, y: outlet.y }];
        this.paths[outlet.id] = this.currentPath;
        this.playSound('path'); this.hapticFeedback('light');
        this.spawnTrailParticles(outlet.x, outlet.y, outlet.color);
    }
    
    extendPath(pos) {
        if (!this.currentPath || this.currentPath.length === 0) return;
        const lastPos = this.currentPath[this.currentPath.length - 1];
        
        // Backtrack check
        const existingIndex = this.currentPath.findIndex(p => p.x === pos.x && p.y === pos.y);
        if (existingIndex >= 0 && existingIndex < this.currentPath.length - 1) {
            this.currentPath.splice(existingIndex + 1);
            this.playSound('undo'); this.hapticFeedback('light');
            return;
        }
        
        const dx = Math.abs(pos.x - lastPos.x);
        const dy = Math.abs(pos.y - lastPos.y);
        
        if ((dx === 1 && dy === 0) || (dx === 0 && dy === 1)) {
            if (existingIndex === -1 || this.canCross(pos)) this.addToPath(pos);
        } else {
            const path = this.findPath(lastPos, pos);
            if (path && path.length > 1) {
                for (let i = 1; i < path.length; i++) {
                    if (!this.isObstacle(path[i].x, path[i].y)) this.addToPath(path[i]);
                }
            }
        }
    }
    
    addToPath(pos) {
        // Get direction entering this cell
        const lastPos = this.currentPath[this.currentPath.length - 1];
        const entryDir = this.getDirection(lastPos, pos);
        
        this.currentPath.push({ x: pos.x, y: pos.y });
        this.playSound('path'); this.hapticFeedback('selection');
        this.spawnTrailParticles(pos.x, pos.y, this.currentOutlet.color);
        
        // Update junction tracking when path crosses another path
        this.updateJunctionTracking(pos.x, pos.y);
        
        const level = this.levels[this.currentLevel];
        const station = level.stations.find(s => s.x === pos.x && s.y === pos.y);
        if (station) {
            this.playSound('complete');
            this.hapticFeedback('success');
            this.finishCurrentPath();
        }
    }
    
    // Get direction from pos1 to pos2
    getDirection(pos1, pos2) {
        if (pos2.x > pos1.x) return 'right';
        if (pos2.x < pos1.x) return 'left';
        if (pos2.y > pos1.y) return 'down';
        if (pos2.y < pos1.y) return 'up';
        return null;
    }
    
    // Get opposite direction
    getOppositeDirection(dir) {
        const opposites = { up: 'down', down: 'up', left: 'right', right: 'left' };
        return opposites[dir];
    }
    
    // Update junction tracking when a path goes through a cell
    updateJunctionTracking(x, y) {
        const key = `${x},${y}`;
        
        // Find all paths that pass through this cell
        const pathsAtCell = [];
        for (const outletId in this.paths) {
            const path = this.paths[outletId];
            for (let i = 0; i < path.length; i++) {
                if (path[i].x === x && path[i].y === y) {
                    // Get entry and exit directions
                    let entryDir = null, exitDir = null;
                    if (i > 0) {
                        entryDir = this.getDirection(path[i - 1], path[i]);
                    }
                    if (i < path.length - 1) {
                        exitDir = this.getDirection(path[i], path[i + 1]);
                    }
                    pathsAtCell.push({ outletId, index: i, entryDir, exitDir });
                }
            }
        }
        
        // If multiple paths pass through this cell, it's a junction
        if (pathsAtCell.length > 1) {
            if (!this.junctions[key]) {
                this.junctions[key] = { paths: pathsAtCell, activeConfig: 0 };
                this.showToast('Junction created! Double-tap to toggle', 1500);
            } else {
                this.junctions[key].paths = pathsAtCell;
            }
        } else if (pathsAtCell.length <= 1 && this.junctions[key]) {
            // Remove junction if no longer has multiple paths
            delete this.junctions[key];
        }
    }
    
    // Recalculate all junctions based on current paths
    recalculateJunctions() {
        const newJunctions = {};
        const cellPaths = {}; // Track which paths go through each cell
        
        for (const outletId in this.paths) {
            const path = this.paths[outletId];
            for (let i = 0; i < path.length; i++) {
                const key = `${path[i].x},${path[i].y}`;
                if (!cellPaths[key]) cellPaths[key] = [];
                
                let entryDir = null, exitDir = null;
                if (i > 0) entryDir = this.getDirection(path[i - 1], path[i]);
                if (i < path.length - 1) exitDir = this.getDirection(path[i], path[i + 1]);
                
                cellPaths[key].push({ outletId, index: i, entryDir, exitDir });
            }
        }
        
        // Create junctions for cells with multiple paths
        for (const key in cellPaths) {
            if (cellPaths[key].length > 1) {
                // Preserve existing activeConfig if junction existed before
                const prevConfig = this.junctions[key] ? this.junctions[key].activeConfig : 0;
                newJunctions[key] = {
                    paths: cellPaths[key],
                    activeConfig: prevConfig % this.getJunctionConfigs(cellPaths[key]).length
                };
            }
        }
        
        this.junctions = newJunctions;
    }
    
    // Get possible configurations for a junction
    getJunctionConfigs(paths) {
        // Each configuration specifies which path has priority (goes straight)
        // For now, we cycle through which outlet's path gets priority
        const configs = [];
        const uniqueOutlets = [...new Set(paths.map(p => p.outletId))];
        uniqueOutlets.forEach((outletId, idx) => {
            configs.push({ priorityOutlet: outletId, index: idx });
        });
        return configs.length > 0 ? configs : [{ priorityOutlet: null, index: 0 }];
    }
    
    // Toggle junction configuration
    toggleJunction(x, y) {
        const key = `${x},${y}`;
        if (!this.junctions[key]) return;
        
        const junction = this.junctions[key];
        const configs = this.getJunctionConfigs(junction.paths);
        junction.activeConfig = (junction.activeConfig + 1) % configs.length;
        
        this.playSound('click');
        this.hapticFeedback('medium');
        
        const config = configs[junction.activeConfig];
        const level = this.levels[this.currentLevel];
        const outlet = level.outlets.find(o => o.id === config.priorityOutlet);
        const colorName = outlet ? outlet.color : 'current';
        this.showToast(`Junction: ${colorName} has priority`, 1500);
    }
    
    finishCurrentPath() {
        // Recalculate junctions after path is complete
        this.recalculateJunctions();
        this.currentOutlet = null;
        this.currentPath = null;
    }
    
    clearCurrentPath() {
        if (this.currentOutlet) {
            delete this.paths[this.currentOutlet.id];
            this.currentOutlet = null;
            this.currentPath = null;
        }
    }
    
    // ==================== UNDO SYSTEM ====================
    saveState() {
        const state = {
            paths: JSON.parse(JSON.stringify(this.paths)),
            currentOutlet: this.currentOutlet ? { ...this.currentOutlet } : null,
            currentPath: this.currentPath ? [...this.currentPath] : null,
            junctions: JSON.parse(JSON.stringify(this.junctions))
        };
        this.undoStack.push(state);
        if (this.undoStack.length > this.maxUndoSteps) {
            this.undoStack.shift();
        }
    }
    
    undo() {
        if (this.undoStack.length === 0) {
            this.showToast('Nothing to undo');
            return;
        }
        
        const state = this.undoStack.pop();
        this.paths = state.paths;
        this.currentOutlet = state.currentOutlet;
        this.currentPath = state.currentPath;
        this.junctions = state.junctions || {};
        
        if (this.currentOutlet && this.paths[this.currentOutlet.id]) {
            this.currentPath = this.paths[this.currentOutlet.id];
        }
        
        this.undoCount++; // Track for star calculation
        this.hapticFeedback('light');
    }
    
    undoLastSegment() {
        if (this.currentPath && this.currentPath.length > 1) {
            this.currentPath.pop();
        } else if (!this.currentPath) {
            const level = this.levels[this.currentLevel];
            for (let i = level.outlets.length - 1; i >= 0; i--) {
                const id = level.outlets[i].id;
                if (this.paths[id] && this.paths[id].length > 1) {
                    this.paths[id].pop();
                    if (this.paths[id].length === 1) delete this.paths[id];
                    break;
                }
            }
        }
    }
    
    clearAllPaths() {
        this.saveState();
        this.paths = {};
        this.currentPath = null;
        this.currentOutlet = null;
        this.trailParticles = [];
        this.junctions = {};
        this.hapticFeedback('medium');
    }
    
    // ==================== PATHFINDING ====================
    findPath(start, end) {
        const openSet = [{ x: start.x, y: start.y, g: 0, f: this.heuristic(start, end), parent: null }];
        const closedSet = new Set();
        
        while (openSet.length > 0) {
            openSet.sort((a, b) => a.f - b.f);
            const current = openSet.shift();
            
            if (current.x === end.x && current.y === end.y) {
                const path = [];
                let node = current;
                while (node) { path.unshift({ x: node.x, y: node.y }); node = node.parent; }
                return path;
            }
            
            const key = current.x + ',' + current.y;
            if (closedSet.has(key)) continue;
            closedSet.add(key);
            
            const neighbors = [
                { x: current.x - 1, y: current.y }, { x: current.x + 1, y: current.y },
                { x: current.x, y: current.y - 1 }, { x: current.x, y: current.y + 1 }
            ];
            
            for (const n of neighbors) {
                if (n.x < 0 || n.x >= this.gridSize || n.y < 0 || n.y >= this.gridSize) continue;
                if (this.isObstacle(n.x, n.y)) continue;
                const nKey = n.x + ',' + n.y;
                if (closedSet.has(nKey)) continue;
                
                const g = current.g + 1;
                const f = g + this.heuristic(n, end);
                const existing = openSet.findIndex(o => o.x === n.x && o.y === n.y);
                if (existing === -1) openSet.push({ x: n.x, y: n.y, g, f, parent: current });
                else if (g < openSet[existing].g) {
                    openSet[existing].g = g; openSet[existing].f = f; openSet[existing].parent = current;
                }
            }
        }
        return null;
    }
    
    heuristic(a, b) { return Math.abs(a.x - b.x) + Math.abs(a.y - b.y); }
    
    canCross(pos) {
        for (const outletId in this.paths) {
            if (this.currentOutlet && outletId === this.currentOutlet.id) continue;
            if (this.paths[outletId].some(p => p.x === pos.x && p.y === pos.y)) return true;
        }
        return false;
    }
    
    isObstacle(x, y) {
        return this.levels[this.currentLevel].obstacles.some(o => o.x === x && o.y === y);
    }
    
    // ==================== PARTICLES ====================
    spawnTrailParticles(x, y, colorName) {
        const cx = x * this.cellSize + this.cellSize / 2;
        const cy = y * this.cellSize + this.cellSize / 2;
        const color = this.colors[colorName] || '#00ffff';
        for (let i = 0; i < 6; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 3 + 1;
            this.trailParticles.push({
                x: cx, y: cy,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1, color: color, size: Math.random() * 4 + 2
            });
        }
    }
    
    updateTrailParticles() {
        for (let i = this.trailParticles.length - 1; i >= 0; i--) {
            const p = this.trailParticles[i];
            p.x += p.vx; p.y += p.vy;
            p.life -= 0.025; p.vx *= 0.96; p.vy *= 0.96;
            if (p.life <= 0) this.trailParticles.splice(i, 1);
        }
    }
    
    // ==================== SIMULATION ====================
    runSimulation() {
        if (this.isRunning) return;
        const level = this.levels[this.currentLevel];
        
        const hasAllPaths = level.outlets.every(o => {
            const path = this.paths[o.id];
            return path && path.length > 1;
        });
        
        if (!hasAllPaths) {
            this.showToast('Draw paths from all outlets first!');
            this.playSound('fail');
            this.hapticFeedback('fail');
            return;
        }
        
        // Recalculate junctions before running
        this.recalculateJunctions();
        
        this.isRunning = true;
        this.cycles = [];
        this.pendingCycles = []; // Cycles waiting to be released
        this.stationArrivals = {}; // Track arrivals for multi-train station requirements
        this.crashParticles = []; // Reset crash explosion particles
        
        // Create cycles for each outlet, including multi-train support
        level.outlets.forEach(outlet => {
            const path = this.paths[outlet.id];
            if (path && path.length > 1) {
                const trainCount = outlet.count || 1;
                const trainDelay = outlet.delay || 500; // ms between trains
                const startDelay = outlet.startDelay || 0; // ms before first train releases
                
                for (let i = 0; i < trainCount; i++) {
                    // Release time = initial start delay + (train index * delay between trains)
                    const releaseTime = startDelay + (i * trainDelay);
                    
                    const cycleData = {
                        outletId: outlet.id,
                        color: outlet.color,
                        path: [...path],
                        progress: 0,
                        active: false, // Start inactive, will be activated on release
                        merged: false,
                        trail: [],
                        success: false,
                        trainIndex: i, // Which train in the sequence
                        releaseTime: releaseTime // When to release this train (ms from start)
                    };
                    
                    if (releaseTime === 0) {
                        // No delay - start immediately
                        cycleData.active = true;
                        this.cycles.push(cycleData);
                    } else {
                        // Subsequent trains wait
                        this.pendingCycles.push(cycleData);
                    }
                }
            }
        });
        
        this.simulationStartTime = Date.now();
        this.animateCycles();
    }
    
    animateCycles() {
        if (!this.isRunning) return;
        
        const elapsed = Date.now() - this.simulationStartTime;
        const speed = 0.003;
        let allFinished = true, anyFailed = false;
        
        // Check for pending cycles to release
        for (let i = this.pendingCycles.length - 1; i >= 0; i--) {
            const pending = this.pendingCycles[i];
            if (elapsed >= pending.releaseTime) {
                pending.active = true;
                pending.startTime = elapsed; // Track when this cycle started
                this.cycles.push(pending);
                this.pendingCycles.splice(i, 1);
                this.playSound('path');
                this.hapticFeedback('light');
            }
        }
        
        // Still have pending cycles? Not finished yet
        if (this.pendingCycles.length > 0) {
            allFinished = false;
        }
        
        this.cycles.forEach(cycle => {
            if (!cycle.active) return;
            allFinished = false;
            
            // Calculate progress based on when this cycle was released
            const cycleElapsed = elapsed - (cycle.releaseTime || 0);
            cycle.progress = cycleElapsed * speed;
            const pathIndex = Math.floor(cycle.progress);
            
            if (pathIndex >= cycle.path.length - 1) {
                cycle.progress = cycle.path.length - 1;
                const finalPos = cycle.path[cycle.path.length - 1];
                const level = this.levels[this.currentLevel];
                
                // Check special tiles
                const splitter = level.splitters.find(s => s.x === finalPos.x && s.y === finalPos.y);
                const colorChanger = level.colorChangers.find(c => c.x === finalPos.x && c.y === finalPos.y);
                const station = level.stations.find(s => s.x === finalPos.x && s.y === finalPos.y);
                
                if (station) {
                    if (station.color === cycle.color) {
                        cycle.active = false;
                        cycle.success = true;
                        cycle.arrivedAtStation = station.id;
                        
                        // Track station arrivals for multi-train requirements
                        if (!this.stationArrivals) this.stationArrivals = {};
                        if (!this.stationArrivals[station.id]) this.stationArrivals[station.id] = 0;
                        this.stationArrivals[station.id]++;
                        
                        // Visual/audio feedback for arrival
                        this.hapticFeedback('light');
                    } else {
                        cycle.active = false;
                        anyFailed = true;
                    }
                } else if (colorChanger) {
                    cycle.color = colorChanger.toColor;
                } else {
                    cycle.active = false;
                    anyFailed = true;
                }
            }
            
            // Record trail
            const currentPos = cycle.path[Math.min(Math.floor(cycle.progress), cycle.path.length - 1)];
            if (!cycle.trail.length || cycle.trail[cycle.trail.length - 1].x !== currentPos.x || cycle.trail[cycle.trail.length - 1].y !== currentPos.y) {
                cycle.trail.push({ ...currentPos, time: Date.now() });
            }
        });
        
        // Check for merges and crashes
        this.checkMerges();
        
        // Check if any cycles crashed
        const anyCrashed = this.cycles.some(c => c.crashed);
        if (anyCrashed) {
            // Let particles animate for a bit before stopping
            this.isRunning = false;
            // Continue rendering crash particles
            if (this.crashParticles.length > 0) {
                requestAnimationFrame(() => this.animateCrashParticles());
            }
            return;
        }
        
        if (!allFinished) {
            requestAnimationFrame(() => this.animateCycles());
        } else {
            this.finishSimulation(anyFailed);
        }
    }
    
    // Continue animating just the crash particles after a crash
    animateCrashParticles() {
        this.render();
        if (this.crashParticles.length > 0) {
            requestAnimationFrame(() => this.animateCrashParticles());
        }
    }
    
    checkMerges() {
        for (let i = 0; i < this.cycles.length; i++) {
            for (let j = i + 1; j < this.cycles.length; j++) {
                const c1 = this.cycles[i], c2 = this.cycles[j];
                if (!c1.active || !c2.active || c1.merged || c2.merged || c1.crashed || c2.crashed) continue;
                
                const idx1 = Math.floor(c1.progress);
                const idx2 = Math.floor(c2.progress);
                const p1 = c1.path[idx1];
                const p2 = c2.path[idx2];
                
                if (p1 && p2 && p1.x === p2.x && p1.y === p2.y) {
                    const key = `${p1.x},${p1.y}`;
                    const junction = this.junctions[key];
                    
                    // Get directions for both cycles
                    const dir1 = idx1 < c1.path.length - 1 ? this.getDirection(p1, c1.path[idx1 + 1]) : null;
                    const dir2 = idx2 < c2.path.length - 1 ? this.getDirection(p2, c2.path[idx2 + 1]) : null;
                    
                    // Also get entry directions (where they came from)
                    const entryDir1 = idx1 > 0 ? this.getDirection(c1.path[idx1 - 1], p1) : null;
                    const entryDir2 = idx2 > 0 ? this.getDirection(c2.path[idx2 - 1], p2) : null;
                    
                    // Check if this is a junction with priority settings
                    if (junction && junction.paths.length > 1) {
                        // If cycles are going perpendicular directions, they're crossing
                        if (dir1 && dir2 && !this.areSameAxis(dir1, dir2)) {
                            // Crossing paths pass through each other without interaction
                            continue;
                        }
                    }
                    
                    // Determine interaction type: CRASH, MERGE, or CROSS
                    const interactionType = this.getCollisionType(c1, c2, idx1, idx2, dir1, dir2, entryDir1, entryDir2);
                    
                    if (interactionType === 'crash') {
                        // HEAD-ON COLLISION - Both cycles crash!
                        c1.active = false;
                        c2.active = false;
                        c1.crashed = true;
                        c2.crashed = true;
                        
                        // Create crash explosion effect
                        const crashX = p1.x * this.cellSize + this.cellSize / 2;
                        const crashY = p1.y * this.cellSize + this.cellSize / 2;
                        this.createCrashExplosion(crashX, crashY, c1.color, c2.color);
                        
                        this.playSound('crash');
                        this.hapticFeedback('heavy');
                        this.showToast('💥 Head-on collision!', 'error');
                        
                    } else if (interactionType === 'merge') {
                        // SAME DIRECTION - Merge the colors
                        const mixKey = c1.color + '+' + c2.color;
                        const newColor = this.colorMixing[mixKey] || c1.color;
                        c1.color = newColor;
                        c2.active = false;
                        c2.merged = true;
                        this.hapticFeedback('medium');
                        
                    } else if (interactionType === 'cross') {
                        // PERPENDICULAR CROSSING - Mix colors but both continue
                        // Only mix if they're actually at the exact same progress point
                        const progress1 = c1.progress % 1;
                        const progress2 = c2.progress % 1;
                        if (Math.abs(progress1 - progress2) < 0.3) {
                            // Close enough - mix colors for both
                            const mixKey = c1.color + '+' + c2.color;
                            const newColor = this.colorMixing[mixKey];
                            if (newColor) {
                                c1.color = newColor;
                                c2.color = newColor;
                                this.hapticFeedback('light');
                            }
                        }
                        // Both continue on their paths
                    }
                }
            }
        }
    }
    
    // Determine the type of collision between two cycles
    getCollisionType(c1, c2, idx1, idx2, dir1, dir2, entryDir1, entryDir2) {
        // If either has no next direction (at end of path), can't crash
        if (!dir1 || !dir2) {
            // One is stopping - merge instead of crash
            return 'merge';
        }
        
        // Check if directions are perpendicular (crossing)
        if (!this.areSameAxis(dir1, dir2)) {
            return 'cross';
        }
        
        // Directions are on the same axis - check if head-on or same direction
        // Head-on: directions are opposite (one going left, other going right)
        if (dir1 === this.getOppositeDirection(dir2)) {
            return 'crash';
        }
        
        // Same direction: merge
        if (dir1 === dir2) {
            return 'merge';
        }
        
        // Check entry directions for edge case (T-intersection collision)
        // If they entered from opposite sides and are now at same cell
        if (entryDir1 && entryDir2 && entryDir1 === this.getOppositeDirection(entryDir2)) {
            return 'crash';
        }
        
        // Default to merge for any other case
        return 'merge';
    }
    
    // Create explosion particle effect at crash site
    createCrashExplosion(x, y, color1, color2) {
        const particleCount = 20;
        const colors = [this.colors[color1] || '#ff0000', this.colors[color2] || '#00ffff', '#ffffff', '#ffff00'];
        
        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.5;
            const speed = 2 + Math.random() * 4;
            const color = colors[Math.floor(Math.random() * colors.length)];
            
            this.crashParticles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1.0,
                decay: 0.02 + Math.random() * 0.02,
                size: 4 + Math.random() * 6,
                color: color
            });
        }
    }
    
    // Check if two directions are on the same axis
    areSameAxis(dir1, dir2) {
        const horizontal = ['left', 'right'];
        const vertical = ['up', 'down'];
        return (horizontal.includes(dir1) && horizontal.includes(dir2)) ||
               (vertical.includes(dir1) && vertical.includes(dir2));
    }
    
    finishSimulation(failed) {
        this.isRunning = false;
        const level = this.levels[this.currentLevel];
        
        // Check if any cycles crashed
        const anyCrashed = this.cycles.some(c => c.crashed);
        
        if (anyCrashed) {
            // Crash already handled with sound/haptic in checkMerges
            // Just show failure state
            return;
        }
        
        if (failed) {
            this.playSound('fail');
            this.hapticFeedback('fail');
            this.showToast('Some cycles didn\'t reach their stations!');
        } else {
            const allSuccess = this.cycles.every(c => c.success || c.merged);
            
            // Check if all stations met their requirements
            let stationsMet = true;
            if (allSuccess && level && level.stations) {
                for (const station of level.stations) {
                    const required = station.required || 1;
                    const arrived = (this.stationArrivals && this.stationArrivals[station.id]) || 0;
                    if (arrived < required) {
                        stationsMet = false;
                        break;
                    }
                }
            }
            
            if (allSuccess && stationsMet) {
                this.playSound('success');
                this.hapticFeedback('success');
                this.levelComplete();
            } else if (allSuccess && !stationsMet) {
                this.playSound('fail');
                this.hapticFeedback('fail');
                this.showToast('Stations need more trains!');
            } else {
                this.playSound('fail');
                this.hapticFeedback('fail');
                this.showToast('Try again!');
            }
        }
        
        // Clear station arrivals for next attempt
        this.stationArrivals = {};
    }
    
    stopSimulation() {
        this.isRunning = false;
        this.cycles = [];
        this.pendingCycles = [];
    }
    
    // ==================== LEVEL COMPLETION ====================
    levelComplete() {
        // Stop timer and get elapsed time
        const elapsedTime = this.stopTimer();
        
        const level = this.level || this.levels[this.currentLevel];
        
        // Handle daily challenge
        if (level && level.isDaily) {
            const stars = this.calculateStars(level);
            this.completeDailyChallenge(stars, elapsedTime);
            this.showLevelCompleteModal(stars, elapsedTime, true);
            this.celebrateConfetti();
            return;
        }
        
        // Handle shared level
        if (level && level.isShared) {
            const stars = this.calculateStars(level);
            this.showLevelCompleteModal(stars, elapsedTime, false, true);
            this.celebrateConfetti();
            return;
        }
        
        // Regular level handling
        if (this.currentLevel >= 0) {
            if (!this.progress.completedLevels.includes(this.currentLevel)) {
                this.progress.completedLevels.push(this.currentLevel);
            }
            
            const stars = this.calculateStars(level);
            
            if (!this.progress.stars[this.currentLevel] || this.progress.stars[this.currentLevel] < stars) {
                this.progress.stars[this.currentLevel] = stars;
            }
            
            // Track best time
            if (this.settings.timeAttackMode || elapsedTime > 0) {
                const existingTime = this.progress.bestTimes[this.currentLevel];
                if (!existingTime || elapsedTime < existingTime) {
                    this.progress.bestTimes[this.currentLevel] = elapsedTime;
                }
            }
            
            this.saveProgress();
            this.showLevelCompleteModal(stars, elapsedTime);
            this.celebrateConfetti();
        }
    }
    
    calculateStars(level) {
        // Hybrid star system: efficiency + undo penalty
        // Each factor contributes to the final score
        
        // 1. Path Efficiency (how close to par)
        let totalPathLength = 0;
        Object.values(this.paths).forEach(path => totalPathLength += path.length);
        
        const par = level.par || (level.outlets.length * 5); // Fallback if no par defined
        const efficiencyRatio = par / totalPathLength; // >1 means under par, <1 means over par
        
        // 2. Undo Penalty
        const undoBonus = level.undoBonus || 2; // Max undos allowed for full credit
        const undoPenalty = Math.max(0, this.undoCount - undoBonus); // Penalty for excess undos
        
        // Calculate star score (0-100 scale)
        let score = 0;
        
        // Efficiency component (0-70 points)
        // At par = 50 points, under par = up to 70 points, over par decreases
        if (efficiencyRatio >= 1) {
            // At or under par: 50-70 points
            score += 50 + Math.min(20, (efficiencyRatio - 1) * 40);
        } else {
            // Over par: 0-50 points based on how close
            score += Math.max(0, efficiencyRatio * 50);
        }
        
        // Undo component (0-30 points)
        // No excess undos = 30 points, each excess undo removes 10 points
        score += Math.max(0, 30 - (undoPenalty * 10));
        
        // Convert score to stars
        // 80+ = 3 stars (excellent: at/under par with few undos)
        // 50+ = 2 stars (good: completed reasonably efficiently)  
        // <50 = 1 star (completed but needs improvement)
        let stars = 1;
        if (score >= 50) stars = 2;
        if (score >= 80) stars = 3;
        
        // Debug logging (remove in production)
        console.log(`Level ${level.id} complete:`, {
            pathLength: totalPathLength,
            par: par,
            efficiencyRatio: efficiencyRatio.toFixed(2),
            undoCount: this.undoCount,
            undoBonus: undoBonus,
            undoPenalty: undoPenalty,
            score: score.toFixed(1),
            stars: stars
        });
        
        return stars;
    }
    
    // ==================== UI ====================
    showScreen(screenId, transition = 'slideLeft') {
        const screens = document.querySelectorAll('.screen');
        const targetScreen = document.getElementById(screenId);
        
        screens.forEach(s => {
            if (s.classList.contains('active')) {
                s.style.animation = transition === 'slideRight' ? 'slideOutRight 0.3s ease forwards' : 'slideOutLeft 0.3s ease forwards';
                setTimeout(() => {
                    s.classList.remove('active');
                    s.style.animation = '';
                }, 280);
            }
        });
        
        setTimeout(() => {
            targetScreen.classList.add('active');
            targetScreen.style.animation = transition === 'slideRight' ? 'slideInLeft 0.3s ease forwards' : 'slideInRight 0.3s ease forwards';
            setTimeout(() => targetScreen.style.animation = '', 300);
            
            // Resize canvas after game screen becomes visible
            if (screenId === 'game-screen') {
                setTimeout(() => this.resizeCanvas(), 100);
            }
        }, 50);
        
        if (screenId === 'level-select') this.renderLevelSelect();
    }
    
    renderLevelSelect() {
        const grid = document.getElementById('level-grid');
        grid.innerHTML = '';
        
        // Daily Challenge tile
        const dailyTile = document.createElement('div');
        dailyTile.className = 'level-tile daily-challenge';
        const isDailyDone = this.isDailyCompleted();
        if (isDailyDone) dailyTile.classList.add('completed');
        
        const streakText = this.progress.dailyStreak > 0 ? `🔥 ${this.progress.dailyStreak} day streak` : '';
        dailyTile.innerHTML = `
            <span class="level-number">📅</span>
            <span class="level-name">Daily Challenge</span>
            <span class="level-stars">${isDailyDone ? '✓ Completed' : streakText || 'New puzzle!'}</span>
        `;
        dailyTile.addEventListener('click', () => {
            this.animateButtonPress(dailyTile);
            this.playSound('click');
            this.hapticFeedback('medium');
            this.startDailyChallenge();
        });
        grid.appendChild(dailyTile);
        
        // Regular levels
        this.levels.forEach((level, index) => {
            const tile = document.createElement('div');
            tile.className = 'level-tile';
            const isCompleted = this.progress.completedLevels.includes(index);
            const isUnlocked = this.settings.devMode || index === 0 || this.progress.completedLevels.includes(index - 1);
            if (isCompleted) tile.classList.add('completed');
            if (!isUnlocked) tile.classList.add('locked');
            
            const stars = this.progress.stars[index] || 0;
            const bestTime = this.progress.bestTimes[index];
            const timeText = bestTime ? this.formatTime(bestTime) : '';
            
            tile.innerHTML = `
                <span class="level-number">${level.id}</span>
                <span class="level-name">${level.name}</span>
                <span class="level-stars">${isCompleted ? '★'.repeat(stars) + '☆'.repeat(3-stars) : '☆☆☆'}</span>
                ${timeText ? `<span class="level-time">${timeText}</span>` : ''}
            `;
            
            if (isUnlocked) {
                tile.addEventListener('click', () => {
                    this.animateButtonPress(tile);
                    this.playSound('click');
                    this.hapticFeedback('light');
                    this.startLevel(index);
                });
            }
            grid.appendChild(tile);
        });
    }
    
    startDailyChallenge() {
        const daily = this.generateDailyChallenge();
        this.currentLevel = -1;
        this.currentLevelData = daily;
        this.level = daily;
        
        document.getElementById('current-level-name').textContent = daily.name;
        document.getElementById('level-message').textContent = daily.description;
        this.gridSize = daily.gridSize;
        this.paths = {};
        this.currentPath = null;
        this.currentOutlet = null;
        this.cycles = [];
        this.isRunning = false;
        this.trailParticles = [];
        this.undoStack = [];
        this.undoCount = 0;
        
        // Enable timer for daily
        this.showScreen('game-screen');
        this.resizeCanvas();
        
        // Start timer
        setTimeout(() => {
            this.startTimer();
            this.showToast(`${daily.difficulty.toUpperCase()} difficulty - Good luck!`, 2000);
        }, 500);
    }
    
    getNextUncompletedLevel() {
        for (let i = 0; i < this.levels.length; i++) {
            if (!this.progress.completedLevels.includes(i)) return i;
        }
        return 0;
    }
    
    startLevel(levelIndex, customLevel = null) {
        this.currentLevel = levelIndex;
        const level = customLevel || (levelIndex >= 0 ? this.levels[levelIndex] : this.currentLevelData);
        this.level = level;
        this.currentLevelData = level;
        
        const displayName = level.isDaily ? level.name : (level.isShared ? level.name : `Level ${level.id}: ${level.name}`);
        document.getElementById('current-level-name').textContent = displayName;
        document.getElementById('level-message').textContent = level.description;
        this.gridSize = level.gridSize;
        this.paths = {};
        this.currentPath = null;
        this.currentOutlet = null;
        this.cycles = [];
        this.isRunning = false;
        this.trailParticles = [];
        this.undoStack = [];
        this.undoCount = 0;
        this.junctions = {}; // Reset junctions
        
        // Reset timer
        this.stopTimer();
        this.timerStart = null;
        
        this.showScreen('game-screen');
        this.resizeCanvas();
        
        // Start timer for time attack or daily mode
        if (this.settings.timeAttackMode || level.isDaily) {
            setTimeout(() => this.startTimer(), 300);
        }
        
        // Show hint for first level
        if (levelIndex === 0 && this.settings.showHints && !customLevel) {
            setTimeout(() => {
                this.showToast('Swipe from the outlet to draw a path', 3000);
            }, 500);
        }
        
        // Show shared level toast
        if (level.isShared) {
            setTimeout(() => {
                this.showToast('Playing shared level!', 2000);
            }, 500);
        }
    }
    
    resetLevel() {
        this.paths = {};
        this.currentPath = null;
        this.currentOutlet = null;
        this.cycles = [];
        this.isRunning = false;
        this.trailParticles = [];
        this.undoStack = [];
        this.undoCount = 0; // Reset undo counter
        this.junctions = {}; // Reset junctions
        this.stopSimulation();
        document.getElementById('level-message').textContent = this.levels[this.currentLevel].description;
    }
    
    resizeCanvas() {
        const container = document.getElementById('game-area');
        // Ensure container has dimensions (may not during screen transitions)
        if (!container.clientWidth || !container.clientHeight) {
            // Retry after a short delay
            setTimeout(() => this.resizeCanvas(), 50);
            return;
        }
        const maxSize = Math.min(container.clientWidth - 20, container.clientHeight - 20);
        this.cellSize = Math.max(20, Math.floor(maxSize / this.gridSize)); // Minimum cell size of 20
        const canvasSize = this.cellSize * this.gridSize;
        this.canvas.width = canvasSize;
        this.canvas.height = canvasSize;
        this.canvas.style.width = canvasSize + 'px';
        this.canvas.style.height = canvasSize + 'px';
        console.log(`Canvas resized: ${canvasSize}x${canvasSize}, cellSize: ${this.cellSize}`);
    }
    
    getGridPosition(clientX, clientY) {
        const rect = this.canvas.getBoundingClientRect();
        const x = Math.floor((clientX - rect.left) / this.cellSize);
        const y = Math.floor((clientY - rect.top) / this.cellSize);
        if (x >= 0 && x < this.gridSize && y >= 0 && y < this.gridSize) return { x, y };
        return null;
    }
    
    // ==================== TOASTS & DIALOGS ====================
    showToast(message, duration = 2000) {
        const existing = document.querySelector('.toast');
        if (existing) existing.remove();
        
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        document.getElementById('game-container').appendChild(toast);
        
        requestAnimationFrame(() => toast.classList.add('show'));
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }
    
    showConfirmDialog(title, message, onConfirm) {
        const dialog = document.createElement('div');
        dialog.className = 'confirm-dialog';
        dialog.innerHTML = `
            <div class="confirm-content">
                <h3>${title}</h3>
                <p>${message}</p>
                <div class="confirm-buttons">
                    <button class="neon-button cancel">Cancel</button>
                    <button class="neon-button danger confirm">Confirm</button>
                </div>
            </div>
        `;
        
        dialog.querySelector('.cancel').addEventListener('click', () => {
            this.hapticFeedback('light');
            dialog.remove();
        });
        
        dialog.querySelector('.confirm').addEventListener('click', () => {
            this.hapticFeedback('medium');
            onConfirm();
            dialog.remove();
        });
        
        document.getElementById('game-container').appendChild(dialog);
        requestAnimationFrame(() => dialog.classList.add('active'));
    }
    
    showLevelCompleteModal(stars, time = 0, isDaily = false, isShared = false) {
        const modal = document.getElementById('level-complete-modal');
        const starsContainer = document.getElementById('stars-container');
        
        starsContainer.innerHTML = '';
        for (let i = 0; i < 3; i++) {
            const star = document.createElement('span');
            star.className = 'star';
            star.textContent = i < stars ? '★' : '☆';
            star.style.animationDelay = `${i * 0.15}s`;
            starsContainer.appendChild(star);
        }
        
        let message = '';
        if (isDaily) {
            const streakText = this.progress.dailyStreak > 1 ? ` 🔥 ${this.progress.dailyStreak} day streak!` : '';
            message = `Daily Complete!${streakText}`;
        } else if (isShared) {
            message = 'Shared level complete!';
        } else {
            const messages = ['Good start!', 'Well done!', 'Perfect routing!'];
            message = messages[stars - 1];
        }
        
        // Add time if tracked
        if (time > 0) {
            message += ` ⏱️ ${this.formatTime(time)}`;
        }
        
        document.getElementById('complete-message').textContent = message;
        
        // Update Next button for daily/shared
        const nextBtn = document.getElementById('next-level-btn');
        if (isDaily || isShared) {
            nextBtn.textContent = 'MENU';
            nextBtn.onclick = () => {
                this.hideModal();
                this.showScreen('level-select', 'slideRight');
            };
        } else {
            nextBtn.textContent = 'NEXT';
            nextBtn.onclick = () => {
                this.hideModal();
                if (this.currentLevel < this.levels.length - 1) {
                    this.startLevel(this.currentLevel + 1);
                } else {
                    this.showScreen('level-select', 'slideRight');
                    this.showToast('🎉 All levels complete!', 3000);
                }
            };
        }
        
        modal.classList.add('active');
    }
    
    hideModal() {
        document.getElementById('level-complete-modal').classList.remove('active');
    }
    
    // ==================== ANIMATIONS ====================
    animateButtonPress(element) {
        element.style.transform = 'scale(0.95)';
        setTimeout(() => {
            element.style.transform = '';
        }, 100);
    }
    
    animateEntrance() {
        const title = document.querySelector('.game-title');
        const buttons = document.querySelectorAll('.menu-buttons .neon-button');
        
        if (title) {
            title.style.opacity = '0';
            title.style.transform = 'translateY(-30px)';
            setTimeout(() => {
                title.style.transition = 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)';
                title.style.opacity = '1';
                title.style.transform = 'translateY(0)';
            }, 100);
        }
        
        buttons.forEach((btn, i) => {
            btn.style.opacity = '0';
            btn.style.transform = 'translateY(20px)';
            setTimeout(() => {
                btn.style.transition = 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
                btn.style.opacity = '1';
                btn.style.transform = 'translateY(0)';
            }, 300 + i * 100);
        });
    }
    
    celebrateConfetti() {
        const canvas = this.confettiCanvas;
        const ctx = this.confettiCtx;
        const container = document.getElementById('level-complete-modal');
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        
        const particles = [];
        const colors = ['#00ffff', '#ff00ff', '#ffff00', '#00ff66', '#ff3366', '#3366ff'];
        
        for (let i = 0; i < 100; i++) {
            particles.push({
                x: canvas.width / 2,
                y: canvas.height / 2,
                vx: (Math.random() - 0.5) * 15,
                vy: (Math.random() - 0.5) * 15 - 5,
                color: colors[Math.floor(Math.random() * colors.length)],
                size: Math.random() * 8 + 4,
                rotation: Math.random() * 360,
                rotationSpeed: (Math.random() - 0.5) * 10
            });
        }
        
        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            let stillActive = false;
            
            particles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.3;
                p.vx *= 0.99;
                p.rotation += p.rotationSpeed;
                
                if (p.y < canvas.height + 50) {
                    stillActive = true;
                    ctx.save();
                    ctx.translate(p.x, p.y);
                    ctx.rotate(p.rotation * Math.PI / 180);
                    ctx.fillStyle = p.color;
                    ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size / 2);
                    ctx.restore();
                }
            });
            
            if (stillActive) requestAnimationFrame(animate);
        };
        
        animate();
    }
    
    // ==================== RENDER LOOP ====================
    startAnimationLoop() {
        const loop = (timestamp) => {
            if (timestamp - this.lastRenderTime >= 16) {
                this.render();
                this.lastRenderTime = timestamp;
            }
            requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
    }
    
    render() {
        if (!document.getElementById('game-screen').classList.contains('active')) return;
        
        const level = this.levels[this.currentLevel];
        if (!level) return;
        
        this.updateTrailParticles();
        this.pulsePhase += 0.02;
        
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grid
        this.drawGrid();
        
        // Draw obstacles
        this.drawObstacles(level.obstacles);
        
        // Draw special tiles
        this.drawSplitters(level.splitters);
        this.drawColorChangers(level.colorChangers);
        
        // Draw paths
        this.drawPaths();
        
        // Draw junctions (after paths so they appear on top)
        this.drawJunctions();
        
        // Draw path preview
        if (this.currentPath && this.currentOutlet && this.hoverCell && !this.isRunning) {
            this.drawPathPreview();
        }
        
        // Draw hover indicator
        if (this.hoverCell && !this.isRunning) {
            this.drawHoverIndicator(this.hoverCell);
        }
        
        // Draw outlets and stations
        this.drawOutlets(level.outlets);
        this.drawStations(level.stations);
        
        // Draw active cycles
        this.drawCycles();
        
        // Draw particles
        this.drawTrailParticles();
        
        // Draw crash explosion particles
        this.drawCrashParticles();
    }
    
    drawGrid() {
        const ctx = this.ctx;
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.15)';
        ctx.lineWidth = 1;
        
        for (let i = 0; i <= this.gridSize; i++) {
            ctx.beginPath();
            ctx.moveTo(i * this.cellSize, 0);
            ctx.lineTo(i * this.cellSize, this.gridSize * this.cellSize);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(0, i * this.cellSize);
            ctx.lineTo(this.gridSize * this.cellSize, i * this.cellSize);
            ctx.stroke();
        }
        
        // Grid numbers
        if (this.settings.gridNumbers) {
            ctx.fillStyle = 'rgba(0, 255, 255, 0.3)';
            ctx.font = '10px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            for (let y = 0; y < this.gridSize; y++) {
                for (let x = 0; x < this.gridSize; x++) {
                    ctx.fillText(`${x},${y}`, x * this.cellSize + this.cellSize / 2, y * this.cellSize + this.cellSize / 2);
                }
            }
        }
    }
    
    drawObstacles(obstacles) {
        const ctx = this.ctx;
        obstacles.forEach(obs => {
            const x = obs.x * this.cellSize + 4;
            const y = obs.y * this.cellSize + 4;
            const size = this.cellSize - 8;
            
            ctx.fillStyle = '#1a1a3a';
            ctx.fillRect(x, y, size, size);
            
            ctx.strokeStyle = '#333355';
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, size, size);
            
            // X pattern
            ctx.strokeStyle = '#444466';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x + 6, y + 6);
            ctx.lineTo(x + size - 6, y + size - 6);
            ctx.moveTo(x + size - 6, y + 6);
            ctx.lineTo(x + 6, y + size - 6);
            ctx.stroke();
        });
    }
    
    drawSplitters(splitters) {
        const ctx = this.ctx;
        const pulse = Math.sin(this.pulsePhase * 2) * 0.2 + 0.8;
        
        splitters.forEach(s => {
            const cx = s.x * this.cellSize + this.cellSize / 2;
            const cy = s.y * this.cellSize + this.cellSize / 2;
            const size = this.cellSize * 0.35;
            
            ctx.fillStyle = '#1a1a3a';
            ctx.strokeStyle = '#ffff00';
            ctx.lineWidth = 2;
            ctx.shadowColor = '#ffff00';
            ctx.shadowBlur = 10 * pulse;
            
            ctx.beginPath();
            ctx.moveTo(cx, cy - size);
            ctx.lineTo(cx + size, cy);
            ctx.lineTo(cx, cy + size);
            ctx.lineTo(cx - size, cy);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            
            // Direction arrows
            ctx.fillStyle = '#ffff00';
            s.directions.forEach(dir => {
                ctx.beginPath();
                const arrowSize = size * 0.3;
                switch(dir) {
                    case 'up': ctx.moveTo(cx, cy - size * 0.6); ctx.lineTo(cx - arrowSize, cy - size * 0.3); ctx.lineTo(cx + arrowSize, cy - size * 0.3); break;
                    case 'down': ctx.moveTo(cx, cy + size * 0.6); ctx.lineTo(cx - arrowSize, cy + size * 0.3); ctx.lineTo(cx + arrowSize, cy + size * 0.3); break;
                    case 'left': ctx.moveTo(cx - size * 0.6, cy); ctx.lineTo(cx - size * 0.3, cy - arrowSize); ctx.lineTo(cx - size * 0.3, cy + arrowSize); break;
                    case 'right': ctx.moveTo(cx + size * 0.6, cy); ctx.lineTo(cx + size * 0.3, cy - arrowSize); ctx.lineTo(cx + size * 0.3, cy + arrowSize); break;
                }
                ctx.closePath();
                ctx.fill();
            });
            ctx.shadowBlur = 0;
        });
    }
    
    drawColorChangers(colorChangers) {
        const ctx = this.ctx;
        const pulse = Math.sin(this.pulsePhase * 2.5) * 0.2 + 0.8;
        
        colorChangers.forEach(c => {
            const cx = c.x * this.cellSize + this.cellSize / 2;
            const cy = c.y * this.cellSize + this.cellSize / 2;
            const color = this.colors[c.toColor] || '#ffffff';
            
            ctx.shadowColor = color;
            ctx.shadowBlur = 15 * pulse;
            ctx.fillStyle = color;
            
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const angle = (i * 60 - 30) * Math.PI / 180;
                const px = cx + this.cellSize * 0.3 * Math.cos(angle);
                const py = cy + this.cellSize * 0.3 * Math.sin(angle);
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.fill();
            ctx.shadowBlur = 0;
        });
    }
    
    drawPaths() {
        const ctx = this.ctx;
        const level = this.levels[this.currentLevel];
        
        for (const outletId in this.paths) {
            const path = this.paths[outletId];
            if (path.length < 2) continue;
            
            const outlet = level.outlets.find(o => o.id === outletId);
            const color = outlet ? this.colors[outlet.color] : '#00ffff';
            
            // Glow effect
            ctx.shadowColor = color;
            ctx.shadowBlur = 15;
            ctx.strokeStyle = color;
            ctx.lineWidth = 6;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            
            ctx.beginPath();
            path.forEach((p, i) => {
                const px = p.x * this.cellSize + this.cellSize / 2;
                const py = p.y * this.cellSize + this.cellSize / 2;
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            });
            ctx.stroke();
            
            // Inner white line
            ctx.shadowBlur = 0;
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Node numbers
            if (this.settings.gridNumbers) {
                ctx.fillStyle = color;
                ctx.font = 'bold 12px monospace';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                path.forEach((p, i) => {
                    if (i > 0) {
                        ctx.fillText(i.toString(), p.x * this.cellSize + this.cellSize / 2, p.y * this.cellSize + this.cellSize / 2 - 15);
                    }
                });
            }
        }
    }
    
    drawJunctions() {
        const ctx = this.ctx;
        const level = this.levels[this.currentLevel];
        const pulse = Math.sin(this.pulsePhase * 3) * 0.3 + 0.7;
        
        for (const key in this.junctions) {
            const junction = this.junctions[key];
            if (junction.paths.length < 2) continue;
            
            const [x, y] = key.split(',').map(Number);
            const cx = x * this.cellSize + this.cellSize / 2;
            const cy = y * this.cellSize + this.cellSize / 2;
            const size = this.cellSize * 0.15;
            
            // Get priority outlet for this junction
            const configs = this.getJunctionConfigs(junction.paths);
            const activeConfig = configs[junction.activeConfig];
            const priorityOutlet = level.outlets.find(o => o.id === activeConfig.priorityOutlet);
            const priorityColor = priorityOutlet ? this.colors[priorityOutlet.color] : '#ffffff';
            
            // Draw junction indicator (diamond shape)
            ctx.save();
            ctx.translate(cx, cy);
            
            // Outer glow
            ctx.shadowColor = priorityColor;
            ctx.shadowBlur = 10 * pulse;
            
            // Diamond background
            ctx.fillStyle = '#0a0a1a';
            ctx.strokeStyle = priorityColor;
            ctx.lineWidth = 2;
            
            ctx.beginPath();
            ctx.moveTo(0, -size * 1.5);
            ctx.lineTo(size * 1.5, 0);
            ctx.lineTo(0, size * 1.5);
            ctx.lineTo(-size * 1.5, 0);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            
            // Inner rotating indicator showing active direction
            ctx.fillStyle = priorityColor;
            ctx.globalAlpha = pulse;
            
            // Draw small arrow or dot showing priority
            const arrowSize = size * 0.6;
            ctx.beginPath();
            ctx.arc(0, 0, arrowSize, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.globalAlpha = 1;
            ctx.shadowBlur = 0;
            ctx.restore();
            
            // Show "tap to toggle" hint on hover
            if (this.hoverCell && this.hoverCell.x === x && this.hoverCell.y === y && !this.isRunning) {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                ctx.font = `bold ${this.cellSize * 0.12}px sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('2×tap', cx, cy + this.cellSize * 0.35);
            }
        }
    }
    
    drawPathPreview() {
        if (!this.currentPath || this.currentPath.length === 0) return;
        
        const ctx = this.ctx;
        const lastPos = this.currentPath[this.currentPath.length - 1];
        const previewPath = this.findPath(lastPos, this.hoverCell);
        
        if (previewPath && previewPath.length > 1) {
            const color = this.colors[this.currentOutlet.color] || '#00ffff';
            
            ctx.strokeStyle = color;
            ctx.globalAlpha = 0.3;
            ctx.lineWidth = 4;
            ctx.lineCap = 'round';
            ctx.setLineDash([8, 8]);
            
            ctx.beginPath();
            previewPath.forEach((p, i) => {
                const px = p.x * this.cellSize + this.cellSize / 2;
                const py = p.y * this.cellSize + this.cellSize / 2;
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            });
            ctx.stroke();
            
            ctx.globalAlpha = 1;
            ctx.setLineDash([]);
        }
    }
    
    drawHoverIndicator(pos) {
        const ctx = this.ctx;
        const pulse = Math.sin(this.pulsePhase * 3) * 0.3 + 0.7;
        
        let color = '#00ffff';
        if (this.currentOutlet) {
            color = this.colors[this.currentOutlet.color] || '#00ffff';
        }
        
        // Check if this is an outlet
        const level = this.levels[this.currentLevel];
        const outlet = level.outlets.find(o => o.x === pos.x && o.y === pos.y);
        
        if (outlet) {
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 3;
            ctx.setLineDash([6, 4]);
            const size = this.cellSize * 0.4;
            ctx.strokeRect(
                pos.x * this.cellSize + this.cellSize / 2 - size,
                pos.y * this.cellSize + this.cellSize / 2 - size,
                size * 2, size * 2
            );
            ctx.setLineDash([]);
        } else {
            ctx.fillStyle = `rgba(0, 255, 255, ${pulse * 0.2})`;
            ctx.strokeStyle = color;
            ctx.globalAlpha = pulse;
            ctx.lineWidth = 2;
            ctx.setLineDash([4, 4]);
            ctx.fillRect(pos.x * this.cellSize + 4, pos.y * this.cellSize + 4, this.cellSize - 8, this.cellSize - 8);
            ctx.strokeRect(pos.x * this.cellSize + 4, pos.y * this.cellSize + 4, this.cellSize - 8, this.cellSize - 8);
            ctx.setLineDash([]);
            ctx.globalAlpha = 1;
        }
    }
    
    drawTrailParticles() {
        const ctx = this.ctx;
        this.trailParticles.forEach(p => {
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.life;
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
    }
    
    drawCrashParticles() {
        const ctx = this.ctx;
        
        // Update and draw crash particles
        for (let i = this.crashParticles.length - 1; i >= 0; i--) {
            const p = this.crashParticles[i];
            
            // Update position
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.1; // gravity
            p.life -= p.decay;
            
            // Remove dead particles
            if (p.life <= 0) {
                this.crashParticles.splice(i, 1);
                continue;
            }
            
            // Draw particle
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.life;
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 15 * p.life;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
    }
    
    drawOutlets(outlets) {
        const ctx = this.ctx;
        const pulse = Math.sin(this.pulsePhase * 2) * 0.2 + 0.8;
        
        outlets.forEach((outlet, index) => {
            const cx = outlet.x * this.cellSize + this.cellSize / 2;
            const cy = outlet.y * this.cellSize + this.cellSize / 2;
            const size = this.cellSize * 0.35;
            const color = this.colors[outlet.color] || '#00ffff';
            const trainCount = outlet.count || 1;
            
            ctx.shadowColor = color;
            ctx.shadowBlur = 20 * pulse;
            ctx.fillStyle = color;
            ctx.fillRect(cx - size, cy - size, size * 2, size * 2);
            
            ctx.fillStyle = '#0a0a1a';
            ctx.fillRect(cx - size * 0.6, cy - size * 0.6, size * 1.2, size * 1.2);
            
            // Play arrow
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.moveTo(cx - size * 0.25, cy - size * 0.3);
            ctx.lineTo(cx + size * 0.35, cy);
            ctx.lineTo(cx - size * 0.25, cy + size * 0.3);
            ctx.closePath();
            ctx.fill();
            ctx.shadowBlur = 0;
            
            // Multi-train indicator (show count if > 1)
            if (trainCount > 1) {
                // Draw train count badge
                const badgeX = cx + size * 0.7;
                const badgeY = cy - size * 0.7;
                const badgeSize = this.cellSize * 0.18;
                
                // Badge background
                ctx.fillStyle = '#0a0a1a';
                ctx.strokeStyle = color;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(badgeX, badgeY, badgeSize, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
                
                // Badge number
                ctx.fillStyle = color;
                ctx.font = `bold ${badgeSize * 1.2}px sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(trainCount.toString(), badgeX, badgeY);
                
                // Show stacked train indicators
                const stackOffset = size * 0.15;
                for (let i = 1; i < Math.min(trainCount, 3); i++) {
                    ctx.strokeStyle = color;
                    ctx.globalAlpha = 0.3 + (0.2 * i);
                    ctx.lineWidth = 1;
                    ctx.strokeRect(
                        cx - size + (i * stackOffset),
                        cy - size - (i * stackOffset),
                        size * 2,
                        size * 2
                    );
                }
                ctx.globalAlpha = 1;
            }
            
            // Start delay indicator (show clock icon if startDelay > 0)
            const startDelay = outlet.startDelay || 0;
            if (startDelay > 0) {
                const delayBadgeX = cx - size * 0.8;
                const delayBadgeY = cy - size * 0.8;
                const delayBadgeSize = this.cellSize * 0.15;
                
                // Clock background
                ctx.fillStyle = '#0a0a1a';
                ctx.strokeStyle = '#ffaa00';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.arc(delayBadgeX, delayBadgeY, delayBadgeSize, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
                
                // Clock hands
                ctx.strokeStyle = '#ffaa00';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(delayBadgeX, delayBadgeY);
                ctx.lineTo(delayBadgeX, delayBadgeY - delayBadgeSize * 0.6);
                ctx.moveTo(delayBadgeX, delayBadgeY);
                ctx.lineTo(delayBadgeX + delayBadgeSize * 0.4, delayBadgeY);
                ctx.stroke();
                
                // Show delay value below outlet during hover or always if significant
                if (startDelay >= 500) {
                    ctx.fillStyle = '#ffaa00';
                    ctx.font = `${this.cellSize * 0.12}px sans-serif`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'top';
                    ctx.fillText(`${(startDelay / 1000).toFixed(1)}s`, cx, cy + size + 2);
                }
                
                // Show countdown during simulation
                if (this.isRunning && this.simulationStartTime) {
                    const elapsed = Date.now() - this.simulationStartTime;
                    const remaining = startDelay - elapsed;
                    
                    if (remaining > 0) {
                        // Draw countdown overlay
                        ctx.fillStyle = 'rgba(10, 10, 26, 0.7)';
                        ctx.fillRect(cx - size, cy - size, size * 2, size * 2);
                        
                        // Countdown text
                        ctx.fillStyle = '#ffaa00';
                        ctx.font = `bold ${size * 1.2}px sans-serif`;
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillText((remaining / 1000).toFixed(1), cx, cy);
                        
                        // Progress ring
                        const progress = 1 - (remaining / startDelay);
                        ctx.strokeStyle = '#ffaa00';
                        ctx.lineWidth = 3;
                        ctx.beginPath();
                        ctx.arc(cx, cy, size * 1.2, -Math.PI / 2, -Math.PI / 2 + (progress * Math.PI * 2));
                        ctx.stroke();
                    }
                }
            }
            
            // Colorblind mode: add letter label
            if (this.settings.colorblindMode) {
                const label = this.getColorLabel(outlet.color);
                ctx.fillStyle = '#ffffff';
                ctx.font = `bold ${this.cellSize * 0.2}px sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(label, cx, cy + size + this.cellSize * 0.15);
                
                // Also show number for keyboard selection
                ctx.fillStyle = '#888';
                ctx.font = `${this.cellSize * 0.15}px sans-serif`;
                ctx.fillText(`[${index + 1}]`, cx, cy - size - this.cellSize * 0.12);
            }
            
            // Selection indicator
            if (this.currentOutlet && this.currentOutlet.id === outlet.id) {
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2;
                ctx.strokeRect(cx - size - 4, cy - size - 4, (size + 4) * 2, (size + 4) * 2);
            }
        });
    }
    
    drawStations(stations) {
        const ctx = this.ctx;
        const pulse = Math.sin(this.pulsePhase * 1.5) * 0.2 + 0.8;
        
        stations.forEach(station => {
            const cx = station.x * this.cellSize + this.cellSize / 2;
            const cy = station.y * this.cellSize + this.cellSize / 2;
            const size = this.cellSize * 0.35;
            const color = this.colors[station.color] || '#00ffff';
            const required = station.required || 1;
            const arrived = (this.stationArrivals && this.stationArrivals[station.id]) || 0;
            
            ctx.shadowColor = color;
            ctx.shadowBlur = 15 * pulse;
            ctx.fillStyle = '#0a0a1a';
            ctx.strokeStyle = color;
            ctx.lineWidth = 3;
            
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const angle = (i * 60 - 30) * Math.PI / 180;
                const px = cx + size * Math.cos(angle);
                const py = cy + size * Math.sin(angle);
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            
            ctx.fillStyle = color;
            ctx.globalAlpha = 0.4 * pulse;
            ctx.beginPath();
            ctx.arc(cx, cy, size * 0.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
            ctx.shadowBlur = 0;
            
            // Multi-train station indicator (show required count if > 1)
            if (required > 1) {
                // Draw required count badge
                const badgeX = cx + size * 0.8;
                const badgeY = cy - size * 0.8;
                const badgeSize = this.cellSize * 0.2;
                
                // Badge background
                ctx.fillStyle = '#0a0a1a';
                ctx.strokeStyle = color;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(badgeX, badgeY, badgeSize, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
                
                // Badge text showing arrived/required during simulation, or just required otherwise
                ctx.fillStyle = color;
                ctx.font = `bold ${badgeSize * 1.0}px sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                
                if (this.isRunning && arrived > 0) {
                    // Show progress during simulation
                    ctx.fillText(`${arrived}/${required}`, badgeX, badgeY);
                } else {
                    ctx.fillText(`×${required}`, badgeX, badgeY);
                }
                
                // Show arrival progress rings during simulation
                if (this.isRunning && arrived > 0) {
                    const ringRadius = size * 1.3;
                    const segmentAngle = (Math.PI * 2) / required;
                    
                    for (let i = 0; i < required; i++) {
                        const startAngle = -Math.PI / 2 + (i * segmentAngle) + 0.05;
                        const endAngle = startAngle + segmentAngle - 0.1;
                        
                        ctx.strokeStyle = i < arrived ? color : 'rgba(255,255,255,0.2)';
                        ctx.lineWidth = 3;
                        ctx.beginPath();
                        ctx.arc(cx, cy, ringRadius, startAngle, endAngle);
                        ctx.stroke();
                    }
                }
            }
            
            // Colorblind mode: add letter label
            if (this.settings.colorblindMode) {
                const label = this.getColorLabel(station.color);
                ctx.fillStyle = '#ffffff';
                ctx.font = `bold ${this.cellSize * 0.2}px sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(label, cx, cy + size + this.cellSize * 0.15);
            }
        });
    }
    
    drawCycles() {
        const ctx = this.ctx;
        
        this.cycles.forEach(cycle => {
            if (!cycle.active && !cycle.success) return;
            const color = this.colors[cycle.color] || '#00ffff';
            
            // Light trail
            if (cycle.trail && cycle.trail.length > 1) {
                const now = Date.now();
                ctx.strokeStyle = color;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                
                for (let i = 1; i < cycle.trail.length; i++) {
                    const age = (now - cycle.trail[i].time) / 500;
                    const alpha = Math.max(0, 1 - age);
                    ctx.globalAlpha = alpha * 0.5;
                    ctx.lineWidth = 6 * (1 - age * 0.5);
                    ctx.shadowColor = color;
                    ctx.shadowBlur = 10;
                    
                    const prev = cycle.trail[i - 1];
                    const curr = cycle.trail[i];
                    ctx.beginPath();
                    ctx.moveTo(prev.x * this.cellSize + this.cellSize / 2, prev.y * this.cellSize + this.cellSize / 2);
                    ctx.lineTo(curr.x * this.cellSize + this.cellSize / 2, curr.y * this.cellSize + this.cellSize / 2);
                    ctx.stroke();
                }
                ctx.globalAlpha = 1;
                ctx.shadowBlur = 0;
            }
            
            // Cycle position
            const progress = cycle.progress % 1;
            const currentIndex = Math.min(Math.floor(cycle.progress), cycle.path.length - 1);
            const nextIndex = Math.min(currentIndex + 1, cycle.path.length - 1);
            const currentPos = cycle.path[currentIndex];
            const nextPos = cycle.path[nextIndex];
            
            const x = (currentPos.x + (nextPos.x - currentPos.x) * progress) * this.cellSize + this.cellSize / 2;
            const y = (currentPos.y + (nextPos.y - currentPos.y) * progress) * this.cellSize + this.cellSize / 2;
            const radius = this.cellSize * 0.25;
            
            ctx.shadowColor = color;
            ctx.shadowBlur = 25;
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(x, y, radius * 0.4, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
            
            if (cycle.success) {
                ctx.fillStyle = '#00ff66';
                ctx.shadowColor = '#00ff66';
                ctx.shadowBlur = 15;
                ctx.font = `bold ${this.cellSize * 0.4}px sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('✓', x, y - radius * 1.5);
                ctx.shadowBlur = 0;
            }
        });
    }
}

// Initialize game
document.addEventListener('DOMContentLoaded', () => {
    window.game = new LightCycleGame();
});

