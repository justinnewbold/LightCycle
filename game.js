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
        
        // Screen transition state
        this.screenTransition = null;
        
        this.settings = this.loadSettings();
        this.progress = this.loadProgress();
        
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
        
        this.initLevels();
        this.initEventListeners();
        this.initAudio();
        this.initSwipeNavigation();
        this.renderLevelSelect();
        this.startAnimationLoop();
        
        // iOS-style entrance animation
        this.animateEntrance();
    }
    
    // ==================== LEVELS ====================
    initLevels() {
        this.levels = [
            { id: 1, name: "First Light", description: "Swipe from outlet to station", gridSize: 5,
              outlets: [{ id: 'o1', x: 0, y: 2, color: 'cyan' }],
              stations: [{ id: 's1', x: 4, y: 2, color: 'cyan' }],
              obstacles: [], splitters: [], colorChangers: [] },
            { id: 2, name: "Two Paths", description: "Guide both cycles to their stations", gridSize: 5,
              outlets: [{ id: 'o1', x: 0, y: 1, color: 'cyan' }, { id: 'o2', x: 0, y: 3, color: 'magenta' }],
              stations: [{ id: 's1', x: 4, y: 1, color: 'cyan' }, { id: 's2', x: 4, y: 3, color: 'magenta' }],
              obstacles: [], splitters: [], colorChangers: [] },
            { id: 3, name: "Crossroads", description: "Paths can cross each other", gridSize: 5,
              outlets: [{ id: 'o1', x: 0, y: 2, color: 'cyan' }, { id: 'o2', x: 2, y: 0, color: 'magenta' }],
              stations: [{ id: 's1', x: 4, y: 2, color: 'cyan' }, { id: 's2', x: 2, y: 4, color: 'magenta' }],
              obstacles: [], splitters: [], colorChangers: [] },
            { id: 4, name: "Color Blend", description: "Merge paths: Red + Blue = Purple", gridSize: 6,
              outlets: [{ id: 'o1', x: 0, y: 1, color: 'red' }, { id: 'o2', x: 0, y: 4, color: 'blue' }],
              stations: [{ id: 's1', x: 5, y: 2, color: 'purple' }],
              obstacles: [], splitters: [], colorChangers: [] },
            { id: 5, name: "Split Decision", description: "Splitters divide your path", gridSize: 6,
              outlets: [{ id: 'o1', x: 0, y: 2, color: 'cyan' }],
              stations: [{ id: 's1', x: 5, y: 0, color: 'cyan' }, { id: 's2', x: 5, y: 4, color: 'cyan' }],
              obstacles: [], splitters: [{ x: 3, y: 2, directions: ['up', 'down'] }], colorChangers: [] },
            { id: 6, name: "Obstacle Course", description: "Navigate around barriers", gridSize: 6,
              outlets: [{ id: 'o1', x: 0, y: 2, color: 'cyan' }],
              stations: [{ id: 's1', x: 5, y: 2, color: 'cyan' }],
              obstacles: [{ x: 2, y: 1 }, { x: 2, y: 2 }, { x: 2, y: 3 }, { x: 4, y: 0 }, { x: 4, y: 1 }, { x: 4, y: 3 }, { x: 4, y: 4 }],
              splitters: [], colorChangers: [] },
            { id: 7, name: "Color Shift", description: "Color changers transform cycles", gridSize: 6,
              outlets: [{ id: 'o1', x: 0, y: 2, color: 'red' }],
              stations: [{ id: 's1', x: 5, y: 2, color: 'blue' }],
              obstacles: [], splitters: [], colorChangers: [{ x: 3, y: 2, toColor: 'blue' }] },
            { id: 8, name: "Triple Threat", description: "Three colors, three destinations", gridSize: 7,
              outlets: [{ id: 'o1', x: 0, y: 1, color: 'red' }, { id: 'o2', x: 0, y: 3, color: 'blue' }, { id: 'o3', x: 0, y: 5, color: 'yellow' }],
              stations: [{ id: 's1', x: 6, y: 1, color: 'red' }, { id: 's2', x: 6, y: 3, color: 'blue' }, { id: 's3', x: 6, y: 5, color: 'yellow' }],
              obstacles: [{ x: 3, y: 0 }, { x: 3, y: 2 }, { x: 3, y: 4 }, { x: 3, y: 6 }], splitters: [], colorChangers: [] },
            { id: 9, name: "Mix Master", description: "Create multiple mixed colors", gridSize: 7,
              outlets: [{ id: 'o1', x: 0, y: 1, color: 'red' }, { id: 'o2', x: 0, y: 3, color: 'yellow' }, { id: 'o3', x: 0, y: 5, color: 'blue' }],
              stations: [{ id: 's1', x: 6, y: 2, color: 'orange' }, { id: 's2', x: 6, y: 4, color: 'green' }],
              obstacles: [], splitters: [], colorChangers: [] },
            { id: 10, name: "Complex Web", description: "Multiple splits and merges", gridSize: 7,
              outlets: [{ id: 'o1', x: 0, y: 3, color: 'cyan' }, { id: 'o2', x: 3, y: 0, color: 'magenta' }],
              stations: [{ id: 's1', x: 6, y: 1, color: 'cyan' }, { id: 's2', x: 6, y: 5, color: 'magenta' }, { id: 's3', x: 3, y: 6, color: 'white' }],
              obstacles: [{ x: 2, y: 2 }, { x: 4, y: 4 }], splitters: [{ x: 2, y: 3, directions: ['right', 'down'] }], colorChangers: [] },
            { id: 11, name: "The Maze", description: "Find your way through", gridSize: 7,
              outlets: [{ id: 'o1', x: 0, y: 0, color: 'cyan' }],
              stations: [{ id: 's1', x: 6, y: 6, color: 'cyan' }],
              obstacles: [{ x: 1, y: 1 }, { x: 2, y: 1 }, { x: 3, y: 1 }, { x: 4, y: 1 }, { x: 4, y: 2 }, { x: 4, y: 3 }, { x: 1, y: 3 }, { x: 2, y: 3 }, { x: 2, y: 4 }, { x: 2, y: 5 }, { x: 4, y: 5 }, { x: 5, y: 5 }],
              splitters: [], colorChangers: [] },
            { id: 12, name: "Grand Finale", description: "Put all skills to the test", gridSize: 7,
              outlets: [{ id: 'o1', x: 0, y: 1, color: 'red' }, { id: 'o2', x: 0, y: 5, color: 'blue' }],
              stations: [{ id: 's1', x: 6, y: 0, color: 'red' }, { id: 's2', x: 6, y: 3, color: 'purple' }, { id: 's3', x: 6, y: 6, color: 'blue' }],
              obstacles: [{ x: 2, y: 0 }, { x: 2, y: 6 }, { x: 4, y: 2 }, { x: 4, y: 4 }],
              splitters: [{ x: 2, y: 1, directions: ['right', 'down'] }, { x: 2, y: 5, directions: ['right', 'up'] }], colorChangers: [] },
            { id: 13, name: "Prismatic", description: "Create all secondary colors", gridSize: 7,
              outlets: [{ id: 'o1', x: 0, y: 1, color: 'red' }, { id: 'o2', x: 0, y: 3, color: 'yellow' }, { id: 'o3', x: 0, y: 5, color: 'blue' }],
              stations: [{ id: 's1', x: 6, y: 1, color: 'orange' }, { id: 's2', x: 6, y: 3, color: 'green' }, { id: 's3', x: 6, y: 5, color: 'purple' }],
              obstacles: [{ x: 3, y: 0 }, { x: 3, y: 6 }], splitters: [], colorChangers: [] },
            { id: 14, name: "Chain Reaction", description: "Multiple transformations", gridSize: 7,
              outlets: [{ id: 'o1', x: 0, y: 3, color: 'cyan' }],
              stations: [{ id: 's1', x: 6, y: 1, color: 'magenta' }, { id: 's2', x: 6, y: 5, color: 'yellow' }],
              obstacles: [{ x: 3, y: 3 }],
              splitters: [{ x: 2, y: 3, directions: ['up', 'down'] }],
              colorChangers: [{ x: 2, y: 1, toColor: 'magenta' }, { x: 2, y: 5, toColor: 'yellow' }] },
            { id: 15, name: "Neon Dreams", description: "Master the grid", gridSize: 8,
              outlets: [{ id: 'o1', x: 0, y: 1, color: 'red' }, { id: 'o2', x: 0, y: 4, color: 'cyan' }, { id: 'o3', x: 0, y: 7, color: 'yellow' }],
              stations: [{ id: 's1', x: 7, y: 0, color: 'orange' }, { id: 's2', x: 7, y: 3, color: 'white' }, { id: 's3', x: 7, y: 6, color: 'green' }],
              obstacles: [{ x: 2, y: 2 }, { x: 2, y: 5 }, { x: 4, y: 1 }, { x: 4, y: 4 }, { x: 4, y: 6 }, { x: 6, y: 2 }, { x: 6, y: 5 }],
              splitters: [], colorChangers: [] }
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
        return saved ? JSON.parse(saved) : { sound: true, haptic: true, gridNumbers: false, swipeMode: true, showHints: true };
    }
    
    saveSettings() { localStorage.setItem('lightcycle_settings', JSON.stringify(this.settings)); }
    
    loadProgress() {
        const saved = localStorage.getItem('lightcycle_progress');
        return saved ? JSON.parse(saved) : { completedLevels: [], stars: {}, moveHistory: {} };
    }
    
    saveProgress() { localStorage.setItem('lightcycle_progress', JSON.stringify(this.progress)); }
    
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
                this.progress = { completedLevels: [], stars: {}, moveHistory: {} };
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
        this.currentPath.push({ x: pos.x, y: pos.y });
        this.playSound('path'); this.hapticFeedback('selection');
        this.spawnTrailParticles(pos.x, pos.y, this.currentOutlet.color);
        
        const level = this.levels[this.currentLevel];
        const station = level.stations.find(s => s.x === pos.x && s.y === pos.y);
        if (station) {
            this.playSound('complete');
            this.hapticFeedback('success');
            this.finishCurrentPath();
        }
    }
    
    finishCurrentPath() {
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
            currentPath: this.currentPath ? [...this.currentPath] : null
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
        
        if (this.currentOutlet && this.paths[this.currentOutlet.id]) {
            this.currentPath = this.paths[this.currentOutlet.id];
        }
        
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
        
        this.isRunning = true;
        this.cycles = [];
        
        level.outlets.forEach(outlet => {
            const path = this.paths[outlet.id];
            if (path && path.length > 1) {
                this.cycles.push({
                    color: outlet.color, path: [...path], progress: 0,
                    active: true, merged: false, trail: [], success: false
                });
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
        
        this.cycles.forEach(cycle => {
            if (!cycle.active) return;
            allFinished = false;
            
            cycle.progress = elapsed * speed;
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
        
        // Check for merges
        this.checkMerges();
        
        if (!allFinished) {
            requestAnimationFrame(() => this.animateCycles());
        } else {
            this.finishSimulation(anyFailed);
        }
    }
    
    checkMerges() {
        for (let i = 0; i < this.cycles.length; i++) {
            for (let j = i + 1; j < this.cycles.length; j++) {
                const c1 = this.cycles[i], c2 = this.cycles[j];
                if (!c1.active || !c2.active || c1.merged || c2.merged) continue;
                
                const p1 = c1.path[Math.floor(c1.progress)];
                const p2 = c2.path[Math.floor(c2.progress)];
                
                if (p1 && p2 && p1.x === p2.x && p1.y === p2.y) {
                    const mixKey = c1.color + '+' + c2.color;
                    const newColor = this.colorMixing[mixKey] || c1.color;
                    c1.color = newColor;
                    c2.active = false;
                    c2.merged = true;
                    this.hapticFeedback('medium');
                }
            }
        }
    }
    
    finishSimulation(failed) {
        this.isRunning = false;
        
        if (failed) {
            this.playSound('fail');
            this.hapticFeedback('fail');
            this.showToast('Some cycles didn\'t reach their stations!');
        } else {
            const allSuccess = this.cycles.every(c => c.success || c.merged);
            if (allSuccess) {
                this.playSound('success');
                this.hapticFeedback('success');
                this.levelComplete();
            } else {
                this.playSound('fail');
                this.hapticFeedback('fail');
                this.showToast('Try again!');
            }
        }
    }
    
    stopSimulation() {
        this.isRunning = false;
        this.cycles = [];
    }
    
    // ==================== LEVEL COMPLETION ====================
    levelComplete() {
        if (!this.progress.completedLevels.includes(this.currentLevel)) {
            this.progress.completedLevels.push(this.currentLevel);
        }
        
        // Calculate stars based on path efficiency
        let totalPathLength = 0;
        Object.values(this.paths).forEach(path => totalPathLength += path.length);
        const level = this.levels[this.currentLevel];
        const minPossible = level.outlets.length * 2; // Rough minimum
        const efficiency = minPossible / totalPathLength;
        
        let stars = 1;
        if (efficiency > 0.4) stars = 2;
        if (efficiency > 0.6) stars = 3;
        
        if (!this.progress.stars[this.currentLevel] || this.progress.stars[this.currentLevel] < stars) {
            this.progress.stars[this.currentLevel] = stars;
        }
        
        this.saveProgress();
        this.showLevelCompleteModal(stars);
        this.celebrateConfetti();
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
        }, 50);
        
        if (screenId === 'level-select') this.renderLevelSelect();
    }
    
    renderLevelSelect() {
        const grid = document.getElementById('level-grid');
        grid.innerHTML = '';
        
        this.levels.forEach((level, index) => {
            const tile = document.createElement('div');
            tile.className = 'level-tile';
            const isCompleted = this.progress.completedLevels.includes(index);
            const isUnlocked = index === 0 || this.progress.completedLevels.includes(index - 1);
            if (isCompleted) tile.classList.add('completed');
            if (!isUnlocked) tile.classList.add('locked');
            
            const stars = this.progress.stars[index] || 0;
            tile.innerHTML = `
                <span class="level-number">${level.id}</span>
                <span class="level-name">${level.name}</span>
                <span class="level-stars">${isCompleted ? '★'.repeat(stars) + '☆'.repeat(3-stars) : '☆☆☆'}</span>
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
    
    getNextUncompletedLevel() {
        for (let i = 0; i < this.levels.length; i++) {
            if (!this.progress.completedLevels.includes(i)) return i;
        }
        return 0;
    }
    
    startLevel(levelIndex) {
        this.currentLevel = levelIndex;
        const level = this.levels[levelIndex];
        document.getElementById('current-level-name').textContent = `Level ${level.id}: ${level.name}`;
        document.getElementById('level-message').textContent = level.description;
        this.gridSize = level.gridSize;
        this.paths = {};
        this.currentPath = null;
        this.currentOutlet = null;
        this.cycles = [];
        this.isRunning = false;
        this.trailParticles = [];
        this.undoStack = [];
        this.showScreen('game-screen');
        this.resizeCanvas();
        
        // Show hint for first level
        if (levelIndex === 0 && this.settings.showHints) {
            setTimeout(() => {
                this.showToast('Swipe from the outlet to draw a path', 3000);
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
        this.stopSimulation();
        document.getElementById('level-message').textContent = this.levels[this.currentLevel].description;
    }
    
    resizeCanvas() {
        const container = document.getElementById('game-area');
        const maxSize = Math.min(container.clientWidth - 20, container.clientHeight - 20);
        this.cellSize = Math.floor(maxSize / this.gridSize);
        const canvasSize = this.cellSize * this.gridSize;
        this.canvas.width = canvasSize;
        this.canvas.height = canvasSize;
        this.canvas.style.width = canvasSize + 'px';
        this.canvas.style.height = canvasSize + 'px';
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
    
    showLevelCompleteModal(stars) {
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
        
        const messages = [
            'Good start!',
            'Well done!',
            'Perfect routing!'
        ];
        document.getElementById('complete-message').textContent = messages[stars - 1];
        
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
    
    drawOutlets(outlets) {
        const ctx = this.ctx;
        const pulse = Math.sin(this.pulsePhase * 2) * 0.2 + 0.8;
        
        outlets.forEach(outlet => {
            const cx = outlet.x * this.cellSize + this.cellSize / 2;
            const cy = outlet.y * this.cellSize + this.cellSize / 2;
            const size = this.cellSize * 0.35;
            const color = this.colors[outlet.color] || '#00ffff';
            
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
