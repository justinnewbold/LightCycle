// Light Cycle - Tron Puzzle Game
// Main Game Logic

class LightCycleGame {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.confettiCanvas = document.getElementById('confetti-canvas');
        this.confettiCtx = this.confettiCanvas.getContext('2d');
        
        // Game state
        this.currentLevel = 0;
        this.isRunning = false;
        this.paths = {}; // Paths drawn by player, keyed by outlet ID
        this.currentPath = null;
        this.currentOutlet = null;
        this.cycles = [];
        this.animationFrame = null;
        this.hoverCell = null;
        
        // Settings
        this.settings = this.loadSettings();
        this.progress = this.loadProgress();
        
        // Grid settings
        this.gridSize = 7;
        this.cellSize = 50;
        this.padding = 20;
        
        // Colors
        this.colors = {
            red: '#ff3366',
            blue: '#3366ff',
            yellow: '#ffff00',
            green: '#00ff66',
            cyan: '#00ffff',
            magenta: '#ff00ff',
            orange: '#ff9933',
            purple: '#9933ff',
            white: '#ffffff'
        };
        
        // Color mixing rules
        this.colorMixing = {
            'red+blue': 'purple',
            'blue+red': 'purple',
            'red+yellow': 'orange',
            'yellow+red': 'orange',
            'blue+yellow': 'green',
            'yellow+blue': 'green',
            'red+green': 'yellow',
            'green+red': 'yellow',
            'blue+orange': 'purple',
            'orange+blue': 'purple',
            'cyan+magenta': 'white',
            'magenta+cyan': 'white'
        };
        
        this.initLevels();
        this.initEventListeners();
        this.initAudio();
        this.renderLevelSelect();
    }
    
    initLevels() {
        this.levels = [
            {
                id: 1,
                name: "First Light",
                description: "Draw a path from the outlet to the station",
                gridSize: 5,
                outlets: [{ id: 'o1', x: 0, y: 2, color: 'cyan' }],
                stations: [{ id: 's1', x: 4, y: 2, color: 'cyan' }],
                obstacles: [],
                splitters: [],
                colorChangers: []
            },
            {
                id: 2,
                name: "Two Paths",
                description: "Guide both cycles to their matching stations",
                gridSize: 5,
                outlets: [
                    { id: 'o1', x: 0, y: 1, color: 'cyan' },
                    { id: 'o2', x: 0, y: 3, color: 'magenta' }
                ],
                stations: [
                    { id: 's1', x: 4, y: 1, color: 'cyan' },
                    { id: 's2', x: 4, y: 3, color: 'magenta' }
                ],
                obstacles: [],
                splitters: [],
                colorChangers: []
            },
            {
                id: 3,
                name: "Crossroads",
                description: "Paths can cross each other",
                gridSize: 5,
                outlets: [
                    { id: 'o1', x: 0, y: 2, color: 'cyan' },
                    { id: 'o2', x: 2, y: 0, color: 'magenta' }
                ],
                stations: [
                    { id: 's1', x: 4, y: 2, color: 'cyan' },
                    { id: 's2', x: 2, y: 4, color: 'magenta' }
                ],
                obstacles: [],
                splitters: [],
                colorChangers: []
            },
            {
                id: 4,
                name: "Color Blend",
                description: "Merge paths to mix colors",
                gridSize: 6,
                outlets: [
                    { id: 'o1', x: 0, y: 1, color: 'red' },
                    { id: 'o2', x: 0, y: 4, color: 'blue' }
                ],
                stations: [
                    { id: 's1', x: 5, y: 2, color: 'purple' }
                ],
                obstacles: [],
                splitters: [],
                colorChangers: [],
                mergePoint: { x: 2, y: 2 }
            },
            {
                id: 5,
                name: "Split Decision",
                description: "Use splitters to divide your path",
                gridSize: 6,
                outlets: [
                    { id: 'o1', x: 0, y: 2, color: 'cyan' }
                ],
                stations: [
                    { id: 's1', x: 5, y: 0, color: 'cyan' },
                    { id: 's2', x: 5, y: 4, color: 'cyan' }
                ],
                obstacles: [],
                splitters: [{ x: 3, y: 2, directions: ['up', 'down'] }],
                colorChangers: []
            },
            {
                id: 6,
                name: "Obstacle Course",
                description: "Navigate around the barriers",
                gridSize: 6,
                outlets: [
                    { id: 'o1', x: 0, y: 2, color: 'cyan' }
                ],
                stations: [
                    { id: 's1', x: 5, y: 2, color: 'cyan' }
                ],
                obstacles: [
                    { x: 2, y: 1 }, { x: 2, y: 2 }, { x: 2, y: 3 },
                    { x: 4, y: 0 }, { x: 4, y: 1 }, { x: 4, y: 3 }, { x: 4, y: 4 }
                ],
                splitters: [],
                colorChangers: []
            },
            {
                id: 7,
                name: "Color Shift",
                description: "Use color changers to transform cycles",
                gridSize: 6,
                outlets: [
                    { id: 'o1', x: 0, y: 2, color: 'red' }
                ],
                stations: [
                    { id: 's1', x: 5, y: 2, color: 'blue' }
                ],
                obstacles: [],
                splitters: [],
                colorChangers: [{ x: 3, y: 2, toColor: 'blue' }]
            },
            {
                id: 8,
                name: "Triple Threat",
                description: "Three colors, three destinations",
                gridSize: 7,
                outlets: [
                    { id: 'o1', x: 0, y: 1, color: 'red' },
                    { id: 'o2', x: 0, y: 3, color: 'blue' },
                    { id: 'o3', x: 0, y: 5, color: 'yellow' }
                ],
                stations: [
                    { id: 's1', x: 6, y: 1, color: 'red' },
                    { id: 's2', x: 6, y: 3, color: 'blue' },
                    { id: 's3', x: 6, y: 5, color: 'yellow' }
                ],
                obstacles: [
                    { x: 3, y: 0 }, { x: 3, y: 2 }, { x: 3, y: 4 }, { x: 3, y: 6 }
                ],
                splitters: [],
                colorChangers: []
            },
            {
                id: 9,
                name: "Mix Master",
                description: "Create multiple mixed colors",
                gridSize: 7,
                outlets: [
                    { id: 'o1', x: 0, y: 1, color: 'red' },
                    { id: 'o2', x: 0, y: 3, color: 'yellow' },
                    { id: 'o3', x: 0, y: 5, color: 'blue' }
                ],
                stations: [
                    { id: 's1', x: 6, y: 2, color: 'orange' },
                    { id: 's2', x: 6, y: 4, color: 'green' }
                ],
                obstacles: [],
                splitters: [],
                colorChangers: []
            },
            {
                id: 10,
                name: "Complex Web",
                description: "Multiple splits and merges required",
                gridSize: 7,
                outlets: [
                    { id: 'o1', x: 0, y: 3, color: 'cyan' },
                    { id: 'o2', x: 3, y: 0, color: 'magenta' }
                ],
                stations: [
                    { id: 's1', x: 6, y: 1, color: 'cyan' },
                    { id: 's2', x: 6, y: 5, color: 'magenta' },
                    { id: 's3', x: 3, y: 6, color: 'white' }
                ],
                obstacles: [
                    { x: 2, y: 2 }, { x: 4, y: 4 }
                ],
                splitters: [{ x: 2, y: 3, directions: ['right', 'down'] }],
                colorChangers: []
            },
            {
                id: 11,
                name: "The Maze",
                description: "Find your way through the labyrinth",
                gridSize: 7,
                outlets: [
                    { id: 'o1', x: 0, y: 0, color: 'cyan' }
                ],
                stations: [
                    { id: 's1', x: 6, y: 6, color: 'cyan' }
                ],
                obstacles: [
                    { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 3, y: 1 }, { x: 4, y: 1 },
                    { x: 4, y: 2 }, { x: 4, y: 3 },
                    { x: 1, y: 3 }, { x: 2, y: 3 },
                    { x: 2, y: 4 }, { x: 2, y: 5 },
                    { x: 4, y: 5 }, { x: 5, y: 5 }
                ],
                splitters: [],
                colorChangers: []
            },
            {
                id: 12,
                name: "Grand Finale",
                description: "Put all your skills to the test",
                gridSize: 7,
                outlets: [
                    { id: 'o1', x: 0, y: 1, color: 'red' },
                    { id: 'o2', x: 0, y: 5, color: 'blue' }
                ],
                stations: [
                    { id: 's1', x: 6, y: 0, color: 'red' },
                    { id: 's2', x: 6, y: 3, color: 'purple' },
                    { id: 's3', x: 6, y: 6, color: 'blue' }
                ],
                obstacles: [
                    { x: 2, y: 0 }, { x: 2, y: 6 },
                    { x: 4, y: 2 }, { x: 4, y: 4 }
                ],
                splitters: [
                    { x: 2, y: 1, directions: ['right', 'down'] },
                    { x: 2, y: 5, directions: ['right', 'up'] }
                ],
                colorChangers: []
            }
        ];
    }
    
    initAudio() {
        this.audioContext = null;
        this.sounds = {};
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
                    oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
                    oscillator.type = 'sine';
                    gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
                    gainNode.gain.exponentialDecayTo && gainNode.gain.exponentialDecayTo(0.01, this.audioContext.currentTime + 0.1);
                    oscillator.start();
                    oscillator.stop(this.audioContext.currentTime + 0.1);
                    break;
                case 'path':
                    oscillator.frequency.setValueAtTime(600, this.audioContext.currentTime);
                    oscillator.type = 'triangle';
                    gainNode.gain.setValueAtTime(0.08, this.audioContext.currentTime);
                    oscillator.start();
                    oscillator.stop(this.audioContext.currentTime + 0.05);
                    break;
                case 'success':
                    oscillator.frequency.setValueAtTime(523, this.audioContext.currentTime);
                    oscillator.frequency.setValueAtTime(659, this.audioContext.currentTime + 0.1);
                    oscillator.frequency.setValueAtTime(784, this.audioContext.currentTime + 0.2);
                    oscillator.type = 'sine';
                    gainNode.gain.setValueAtTime(0.15, this.audioContext.currentTime);
                    oscillator.start();
                    oscillator.stop(this.audioContext.currentTime + 0.4);
                    break;
                case 'fail':
                    oscillator.frequency.setValueAtTime(300, this.audioContext.currentTime);
                    oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime + 0.1);
                    oscillator.type = 'sawtooth';
                    gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
                    oscillator.start();
                    oscillator.stop(this.audioContext.currentTime + 0.2);
                    break;
            }
        } catch(e) {
            // Audio not supported
        }
    }
    
    hapticFeedback(type = 'light') {
        if (!this.settings.haptic || !navigator.vibrate) return;
        
        switch(type) {
            case 'light':
                navigator.vibrate(10);
                break;
            case 'medium':
                navigator.vibrate(25);
                break;
            case 'success':
                navigator.vibrate([50, 50, 100]);
                break;
            case 'fail':
                navigator.vibrate([100, 50, 100]);
                break;
        }
    }
    
    loadSettings() {
        const saved = localStorage.getItem('lightcycle_settings');
        return saved ? JSON.parse(saved) : {
            sound: true,
            haptic: true,
            gridNumbers: false
        };
    }
    
    saveSettings() {
        localStorage.setItem('lightcycle_settings', JSON.stringify(this.settings));
    }
    
    loadProgress() {
        const saved = localStorage.getItem('lightcycle_progress');
        return saved ? JSON.parse(saved) : {
            completedLevels: [],
            stars: {}
        };
    }
    
    saveProgress() {
        localStorage.setItem('lightcycle_progress', JSON.stringify(this.progress));
    }
    
    initEventListeners() {
        // Menu buttons
        document.getElementById('play-btn').addEventListener('click', () => {
            this.playSound('click');
            this.hapticFeedback('light');
            const nextLevel = this.getNextUncompletedLevel();
            this.startLevel(nextLevel);
        });
        
        document.getElementById('levels-btn').addEventListener('click', () => {
            this.playSound('click');
            this.hapticFeedback('light');
            this.showScreen('level-select');
        });
        
        document.getElementById('how-to-play-btn').addEventListener('click', () => {
            this.playSound('click');
            this.hapticFeedback('light');
            this.showScreen('how-to-play');
        });
        
        document.getElementById('settings-btn').addEventListener('click', () => {
            this.playSound('click');
            this.hapticFeedback('light');
            this.showScreen('settings');
        });
        
        // Back buttons
        document.querySelectorAll('.back-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.playSound('click');
                this.hapticFeedback('light');
                const target = e.currentTarget.dataset.target;
                if (target) {
                    this.showScreen(target);
                }
            });
        });
        
        // Game back button
        document.getElementById('game-back-btn').addEventListener('click', () => {
            this.playSound('click');
            this.hapticFeedback('light');
            this.stopSimulation();
            this.showScreen('level-select');
        });
        
        // Game controls
        document.getElementById('run-btn').addEventListener('click', () => {
            this.playSound('click');
            this.hapticFeedback('medium');
            this.runSimulation();
        });
        
        document.getElementById('undo-btn').addEventListener('click', () => {
            this.playSound('click');
            this.hapticFeedback('light');
            this.undoLastSegment();
        });
        
        document.getElementById('clear-btn').addEventListener('click', () => {
            this.playSound('click');
            this.hapticFeedback('light');
            this.clearAllPaths();
        });
        
        document.getElementById('reset-level-btn').addEventListener('click', () => {
            this.playSound('click');
            this.hapticFeedback('light');
            this.resetLevel();
        });
        
        // Settings toggles
        document.getElementById('sound-toggle').addEventListener('change', (e) => {
            this.settings.sound = e.target.checked;
            this.saveSettings();
            if (e.target.checked) this.playSound('click');
        });
        
        document.getElementById('haptic-toggle').addEventListener('change', (e) => {
            this.settings.haptic = e.target.checked;
            this.saveSettings();
            this.hapticFeedback('light');
        });
        
        document.getElementById('grid-numbers-toggle').addEventListener('change', (e) => {
            this.settings.gridNumbers = e.target.checked;
            this.saveSettings();
            this.render();
        });
        
        document.getElementById('reset-progress-btn').addEventListener('click', () => {
            if (confirm('Are you sure you want to reset all progress?')) {
                this.progress = { completedLevels: [], stars: {} };
                this.saveProgress();
                this.renderLevelSelect();
                this.playSound('click');
            }
        });
        
        // Modal buttons
        document.getElementById('replay-btn').addEventListener('click', () => {
            this.playSound('click');
            this.hapticFeedback('light');
            this.hideModal();
            this.resetLevel();
        });
        
        document.getElementById('next-level-btn').addEventListener('click', () => {
            this.playSound('click');
            this.hapticFeedback('light');
            this.hideModal();
            if (this.currentLevel < this.levels.length - 1) {
                this.startLevel(this.currentLevel + 1);
            } else {
                this.showScreen('level-select');
            }
        });
        
        // Canvas interactions
        this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleCanvasHover(e));
        this.canvas.addEventListener('mouseleave', () => this.handleCanvasLeave());
        
        // Touch support
        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
        this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
        this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e));
        
        // Apply saved settings to toggles
        document.getElementById('sound-toggle').checked = this.settings.sound;
        document.getElementById('haptic-toggle').checked = this.settings.haptic;
        document.getElementById('grid-numbers-toggle').checked = this.settings.gridNumbers;
        
        // Window resize
        window.addEventListener('resize', () => this.resizeCanvas());
    }
    
    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(screenId).classList.add('active');
        
        if (screenId === 'level-select') {
            this.renderLevelSelect();
        }
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
            const starsDisplay = isCompleted ? '⭐'.repeat(stars) + '☆'.repeat(3 - stars) : '☆☆☆';
            
            tile.innerHTML = `
                <span class="level-number">${level.id}</span>
                <span class="level-stars">${starsDisplay}</span>
            `;
            
            if (isUnlocked) {
                tile.addEventListener('click', () => {
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
            if (!this.progress.completedLevels.includes(i)) {
                return i;
            }
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
        
        this.showScreen('game-screen');
        this.resizeCanvas();
        this.render();
    }
    
    resetLevel() {
        this.paths = {};
        this.currentPath = null;
        this.currentOutlet = null;
        this.cycles = [];
        this.isRunning = false;
        this.stopSimulation();
        
        const level = this.levels[this.currentLevel];
        document.getElementById('level-message').textContent = level.description;
        
        this.render();
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
        
        this.render();
    }
    
    getGridPosition(clientX, clientY) {
        const rect = this.canvas.getBoundingClientRect();
        const x = Math.floor((clientX - rect.left) / this.cellSize);
        const y = Math.floor((clientY - rect.top) / this.cellSize);
        
        if (x >= 0 && x < this.gridSize && y >= 0 && y < this.gridSize) {
            return { x, y };
        }
        return null;
    }
    
    handleCanvasClick(e) {
        if (this.isRunning) return;
        
        const pos = this.getGridPosition(e.clientX, e.clientY);
        if (!pos) return;
        
        this.processGridClick(pos);
    }
    
    handleCanvasHover(e) {
        if (this.isRunning) return;
        
        const pos = this.getGridPosition(e.clientX, e.clientY);
        if (pos && (!this.hoverCell || this.hoverCell.x !== pos.x || this.hoverCell.y !== pos.y)) {
            this.hoverCell = pos;
            this.render();
        }
    }
    
    handleCanvasLeave() {
        this.hoverCell = null;
        this.render();
    }
    
    handleTouchStart(e) {
        e.preventDefault();
        if (this.isRunning) return;
        
        const touch = e.touches[0];
        const pos = this.getGridPosition(touch.clientX, touch.clientY);
        if (pos) {
            this.touchStartPos = pos;
            this.hoverCell = pos;
            this.render();
        }
    }
    
    handleTouchMove(e) {
        e.preventDefault();
        if (this.isRunning) return;
        
        const touch = e.touches[0];
        const pos = this.getGridPosition(touch.clientX, touch.clientY);
        if (pos && (!this.hoverCell || this.hoverCell.x !== pos.x || this.hoverCell.y !== pos.y)) {
            this.hoverCell = pos;
            this.render();
        }
    }
    
    handleTouchEnd(e) {
        if (this.isRunning) return;
        
        if (this.touchStartPos && this.hoverCell) {
            if (this.touchStartPos.x === this.hoverCell.x && this.touchStartPos.y === this.hoverCell.y) {
                this.processGridClick(this.hoverCell);
            }
        }
        
        this.touchStartPos = null;
        this.hoverCell = null;
        this.render();
    }
    
    processGridClick(pos) {
        const level = this.levels[this.currentLevel];
        
        // Check if clicking on an obstacle
        if (this.isObstacle(pos.x, pos.y)) {
            return;
        }
        
        // Check if clicking on an outlet to start a new path
        const outlet = level.outlets.find(o => o.x === pos.x && o.y === pos.y);
        if (outlet) {
            this.startNewPath(outlet);
            return;
        }
        
        // If we have a current path, try to extend it
        if (this.currentPath && this.currentOutlet) {
            this.extendPath(pos);
        }
    }
    
    startNewPath(outlet) {
        this.currentOutlet = outlet;
        this.currentPath = [{ x: outlet.x, y: outlet.y }];
        this.paths[outlet.id] = this.currentPath;
        
        this.playSound('path');
        this.hapticFeedback('light');
        this.render();
    }
    
    extendPath(pos) {
        if (!this.currentPath || this.currentPath.length === 0) return;
        
        const lastPos = this.currentPath[this.currentPath.length - 1];
        
        // Check if adjacent
        const dx = Math.abs(pos.x - lastPos.x);
        const dy = Math.abs(pos.y - lastPos.y);
        
        if ((dx === 1 && dy === 0) || (dx === 0 && dy === 1)) {
            // Check if this position is already in the current path (except for crossing)
            const existingIndex = this.currentPath.findIndex(p => p.x === pos.x && p.y === pos.y);
            
            if (existingIndex === -1 || this.canCross(pos)) {
                this.currentPath.push({ x: pos.x, y: pos.y });
                this.playSound('path');
                this.hapticFeedback('light');
                
                // Check if we've reached a station
                const level = this.levels[this.currentLevel];
                const station = level.stations.find(s => s.x === pos.x && s.y === pos.y);
                if (station) {
                    // Path complete, deselect
                    this.currentOutlet = null;
                    this.currentPath = null;
                }
                
                this.render();
            }
        }
    }
    
    canCross(pos) {
        // Check if other paths cross this position
        const level = this.levels[this.currentLevel];
        for (const outletId in this.paths) {
            if (outletId === this.currentOutlet.id) continue;
            const path = this.paths[outletId];
            if (path.some(p => p.x === pos.x && p.y === pos.y)) {
                return true; // Allow crossing
            }
        }
        return false;
    }
    
    isObstacle(x, y) {
        const level = this.levels[this.currentLevel];
        return level.obstacles.some(o => o.x === x && o.y === y);
    }
    
    undoLastSegment() {
        if (this.currentPath && this.currentPath.length > 1) {
            this.currentPath.pop();
            this.playSound('click');
            this.hapticFeedback('light');
            this.render();
        }
    }
    
    clearAllPaths() {
        this.paths = {};
        this.currentPath = null;
        this.currentOutlet = null;
        this.render();
    }
    
    runSimulation() {
        if (this.isRunning) return;
        
        const level = this.levels[this.currentLevel];
        
        // Check if all outlets have paths
        const hasAllPaths = level.outlets.every(outlet => {
            const path = this.paths[outlet.id];
            return path && path.length > 1;
        });
        
        if (!hasAllPaths) {
            document.getElementById('level-message').textContent = 'Draw paths from all outlets first!';
            this.playSound('fail');
            return;
        }
        
        this.isRunning = true;
        this.cycles = [];
        
        // Create cycles for each outlet
        level.outlets.forEach(outlet => {
            const path = this.paths[outlet.id];
            if (path && path.length > 1) {
                this.cycles.push({
                    color: outlet.color,
                    path: [...path],
                    position: 0,
                    progress: 0,
                    active: true,
                    merged: false
                });
            }
        });
        
        this.simulationStartTime = Date.now();
        this.animate();
    }
    
    animate() {
        if (!this.isRunning) return;
        
        const elapsed = Date.now() - this.simulationStartTime;
        const speed = 0.003; // Units per millisecond
        
        let allFinished = true;
        let anyFailed = false;
        
        this.cycles.forEach(cycle => {
            if (!cycle.active) return;
            
            cycle.progress = elapsed * speed;
            const targetPosition = Math.floor(cycle.progress);
            
            if (targetPosition >= cycle.path.length - 1) {
                // Cycle has reached the end of its path
                const endPos = cycle.path[cycle.path.length - 1];
                const level = this.levels[this.currentLevel];
                const station = level.stations.find(s => s.x === endPos.x && s.y === endPos.y);
                
                if (station && station.color === cycle.color) {
                    cycle.active = false;
                    cycle.success = true;
                } else {
                    cycle.active = false;
                    cycle.success = false;
                    anyFailed = true;
                }
            } else {
                allFinished = false;
            }
        });
        
        // Check for merges
        this.checkMerges();
        
        this.render();
        
        if (allFinished || anyFailed) {
            this.isRunning = false;
            
            if (!anyFailed && this.cycles.every(c => c.success || c.merged)) {
                this.levelComplete();
            } else {
                this.levelFailed();
            }
        } else {
            this.animationFrame = requestAnimationFrame(() => this.animate());
        }
    }
    
    checkMerges() {
        const level = this.levels[this.currentLevel];
        
        for (let i = 0; i < this.cycles.length; i++) {
            for (let j = i + 1; j < this.cycles.length; j++) {
                const c1 = this.cycles[i];
                const c2 = this.cycles[j];
                
                if (!c1.active || !c2.active) continue;
                
                const pos1 = this.getCyclePosition(c1);
                const pos2 = this.getCyclePosition(c2);
                
                if (pos1 && pos2 && pos1.x === pos2.x && pos1.y === pos2.y) {
                    // Merge cycles
                    const mixedColor = this.mixColors(c1.color, c2.color);
                    c1.color = mixedColor;
                    c2.active = false;
                    c2.merged = true;
                }
            }
        }
    }
    
    getCyclePosition(cycle) {
        if (!cycle.active) return null;
        
        const index = Math.min(Math.floor(cycle.progress), cycle.path.length - 1);
        return cycle.path[index];
    }
    
    mixColors(color1, color2) {
        const key = `${color1}+${color2}`;
        return this.colorMixing[key] || color1;
    }
    
    stopSimulation() {
        this.isRunning = false;
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
    }
    
    levelComplete() {
        this.playSound('success');
        this.hapticFeedback('success');
        
        // Calculate stars based on path efficiency
        const level = this.levels[this.currentLevel];
        let totalPathLength = 0;
        for (const outletId in this.paths) {
            totalPathLength += this.paths[outletId].length;
        }
        
        const optimalLength = level.outlets.length * (this.gridSize - 1);
        const efficiency = optimalLength / totalPathLength;
        
        let stars = 1;
        if (efficiency > 0.7) stars = 2;
        if (efficiency > 0.9) stars = 3;
        
        // Update progress
        if (!this.progress.completedLevels.includes(this.currentLevel)) {
            this.progress.completedLevels.push(this.currentLevel);
        }
        this.progress.stars[this.currentLevel] = Math.max(this.progress.stars[this.currentLevel] || 0, stars);
        this.saveProgress();
        
        // Show modal
        const starsContainer = document.getElementById('stars-container');
        starsContainer.innerHTML = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
        
        const messages = [
            'Good routing!',
            'Excellent work!',
            'Perfect solution!'
        ];
        document.getElementById('complete-message').textContent = messages[stars - 1];
        
        // Hide next button if last level
        const nextBtn = document.getElementById('next-level-btn');
        nextBtn.style.display = this.currentLevel < this.levels.length - 1 ? 'block' : 'none';
        
        document.getElementById('level-complete-modal').classList.add('active');
        this.startConfetti();
    }
    
    levelFailed() {
        this.playSound('fail');
        this.hapticFeedback('fail');
        document.getElementById('level-message').textContent = 'Cycles didn\'t reach matching stations. Try again!';
        
        setTimeout(() => {
            this.resetLevel();
        }, 1500);
    }
    
    hideModal() {
        document.getElementById('level-complete-modal').classList.remove('active');
        this.stopConfetti();
    }
    
    startConfetti() {
        this.confettiCanvas.width = window.innerWidth;
        this.confettiCanvas.height = window.innerHeight;
        
        this.confettiParticles = [];
        const colors = ['#00ffff', '#ff00ff', '#ffff00', '#ff3366', '#00ff66'];
        
        for (let i = 0; i < 100; i++) {
            this.confettiParticles.push({
                x: Math.random() * this.confettiCanvas.width,
                y: Math.random() * this.confettiCanvas.height - this.confettiCanvas.height,
                size: Math.random() * 10 + 5,
                color: colors[Math.floor(Math.random() * colors.length)],
                speedY: Math.random() * 3 + 2,
                speedX: (Math.random() - 0.5) * 4,
                rotation: Math.random() * 360,
                rotationSpeed: (Math.random() - 0.5) * 10
            });
        }
        
        this.animateConfetti();
    }
    
    animateConfetti() {
        if (!this.confettiParticles) return;
        
        this.confettiCtx.clearRect(0, 0, this.confettiCanvas.width, this.confettiCanvas.height);
        
        this.confettiParticles.forEach(p => {
            p.y += p.speedY;
            p.x += p.speedX;
            p.rotation += p.rotationSpeed;
            
            this.confettiCtx.save();
            this.confettiCtx.translate(p.x, p.y);
            this.confettiCtx.rotate(p.rotation * Math.PI / 180);
            this.confettiCtx.fillStyle = p.color;
            this.confettiCtx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size / 2);
            this.confettiCtx.restore();
        });
        
        if (this.confettiParticles.some(p => p.y < this.confettiCanvas.height)) {
            requestAnimationFrame(() => this.animateConfetti());
        }
    }
    
    stopConfetti() {
        this.confettiParticles = null;
        this.confettiCtx.clearRect(0, 0, this.confettiCanvas.width, this.confettiCanvas.height);
    }
    
    render() {
        const ctx = this.ctx;
        const level = this.levels[this.currentLevel];
        
        // Clear canvas
        ctx.fillStyle = '#0a0a1a';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grid
        this.drawGrid();
        
        // Draw obstacles
        this.drawObstacles(level.obstacles);
        
        // Draw splitters
        this.drawSplitters(level.splitters);
        
        // Draw color changers
        this.drawColorChangers(level.colorChangers);
        
        // Draw paths
        this.drawPaths();
        
        // Draw hover preview
        if (this.hoverCell && !this.isRunning) {
            this.drawHoverPreview();
        }
        
        // Draw outlets
        this.drawOutlets(level.outlets);
        
        // Draw stations
        this.drawStations(level.stations);
        
        // Draw cycles during simulation
        if (this.isRunning) {
            this.drawCycles();
        }
    }
    
    drawGrid() {
        const ctx = this.ctx;
        
        ctx.strokeStyle = '#1a1a3a';
        ctx.lineWidth = 1;
        
        for (let i = 0; i <= this.gridSize; i++) {
            // Vertical lines
            ctx.beginPath();
            ctx.moveTo(i * this.cellSize, 0);
            ctx.lineTo(i * this.cellSize, this.canvas.height);
            ctx.stroke();
            
            // Horizontal lines
            ctx.beginPath();
            ctx.moveTo(0, i * this.cellSize);
            ctx.lineTo(this.canvas.width, i * this.cellSize);
            ctx.stroke();
        }
        
        // Draw grid numbers if enabled
        if (this.settings.gridNumbers) {
            ctx.fillStyle = '#333';
            ctx.font = '10px monospace';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            
            for (let y = 0; y < this.gridSize; y++) {
                for (let x = 0; x < this.gridSize; x++) {
                    ctx.fillText(`${x},${y}`, x * this.cellSize + 2, y * this.cellSize + 2);
                }
            }
        }
    }
    
    drawObstacles(obstacles) {
        const ctx = this.ctx;
        
        obstacles.forEach(obs => {
            const x = obs.x * this.cellSize;
            const y = obs.y * this.cellSize;
            
            // Draw obstacle block
            ctx.fillStyle = '#1a1a2e';
            ctx.fillRect(x + 2, y + 2, this.cellSize - 4, this.cellSize - 4);
            
            // Draw border glow
            ctx.strokeStyle = '#ff3366';
            ctx.lineWidth = 2;
            ctx.shadowColor = '#ff3366';
            ctx.shadowBlur = 5;
            ctx.strokeRect(x + 2, y + 2, this.cellSize - 4, this.cellSize - 4);
            ctx.shadowBlur = 0;
        });
    }
    
    drawSplitters(splitters) {
        const ctx = this.ctx;
        
        splitters.forEach(splitter => {
            const cx = splitter.x * this.cellSize + this.cellSize / 2;
            const cy = splitter.y * this.cellSize + this.cellSize / 2;
            const size = this.cellSize * 0.3;
            
            ctx.fillStyle = '#ffff00';
            ctx.shadowColor = '#ffff00';
            ctx.shadowBlur = 10;
            
            // Draw diamond shape
            ctx.beginPath();
            ctx.moveTo(cx, cy - size);
            ctx.lineTo(cx + size, cy);
            ctx.lineTo(cx, cy + size);
            ctx.lineTo(cx - size, cy);
            ctx.closePath();
            ctx.fill();
            
            ctx.shadowBlur = 0;
        });
    }
    
    drawColorChangers(colorChangers) {
        const ctx = this.ctx;
        
        colorChangers.forEach(changer => {
            const cx = changer.x * this.cellSize + this.cellSize / 2;
            const cy = changer.y * this.cellSize + this.cellSize / 2;
            const radius = this.cellSize * 0.3;
            
            const color = this.colors[changer.toColor] || '#ffffff';
            
            ctx.fillStyle = color;
            ctx.shadowColor = color;
            ctx.shadowBlur = 15;
            
            ctx.beginPath();
            ctx.arc(cx, cy, radius, 0, Math.PI * 2);
            ctx.fill();
            
            // Inner circle
            ctx.fillStyle = '#0a0a1a';
            ctx.beginPath();
            ctx.arc(cx, cy, radius * 0.5, 0, Math.PI * 2);
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
            const color = this.colors[outlet.color] || '#00ffff';
            
            // Draw path segments
            ctx.strokeStyle = color;
            ctx.lineWidth = 4;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.shadowColor = color;
            ctx.shadowBlur = 10;
            
            ctx.beginPath();
            for (let i = 0; i < path.length; i++) {
                const x = path[i].x * this.cellSize + this.cellSize / 2;
                const y = path[i].y * this.cellSize + this.cellSize / 2;
                
                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.stroke();
            ctx.shadowBlur = 0;
            
            // Draw path nodes
            const isCurrentPath = this.currentOutlet && this.currentOutlet.id === outletId;
            if (isCurrentPath) {
                path.forEach((point, index) => {
                    if (index === 0) return; // Skip outlet node
                    
                    const x = point.x * this.cellSize + this.cellSize / 2;
                    const y = point.y * this.cellSize + this.cellSize / 2;
                    
                    ctx.fillStyle = color;
                    ctx.beginPath();
                    ctx.arc(x, y, 6, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // Node number
                    ctx.fillStyle = '#0a0a1a';
                    ctx.font = 'bold 8px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(index.toString(), x, y);
                });
            }
        }
    }
    
    drawHoverPreview() {
        if (!this.currentPath || this.currentPath.length === 0) return;
        
        const ctx = this.ctx;
        const lastPos = this.currentPath[this.currentPath.length - 1];
        const hoverPos = this.hoverCell;
        
        // Check if hover is adjacent to last position
        const dx = Math.abs(hoverPos.x - lastPos.x);
        const dy = Math.abs(hoverPos.y - lastPos.y);
        
        if ((dx === 1 && dy === 0) || (dx === 0 && dy === 1)) {
            if (!this.isObstacle(hoverPos.x, hoverPos.y)) {
                const color = this.colors[this.currentOutlet.color] || '#00ffff';
                
                ctx.strokeStyle = color;
                ctx.lineWidth = 2;
                ctx.setLineDash([5, 5]);
                ctx.globalAlpha = 0.5;
                
                ctx.beginPath();
                ctx.moveTo(lastPos.x * this.cellSize + this.cellSize / 2, lastPos.y * this.cellSize + this.cellSize / 2);
                ctx.lineTo(hoverPos.x * this.cellSize + this.cellSize / 2, hoverPos.y * this.cellSize + this.cellSize / 2);
                ctx.stroke();
                
                ctx.setLineDash([]);
                ctx.globalAlpha = 1;
            }
        }
        
        // Highlight hover cell
        ctx.fillStyle = 'rgba(0, 255, 255, 0.1)';
        ctx.fillRect(hoverPos.x * this.cellSize, hoverPos.y * this.cellSize, this.cellSize, this.cellSize);
    }
    
    drawOutlets(outlets) {
        const ctx = this.ctx;
        
        outlets.forEach(outlet => {
            const cx = outlet.x * this.cellSize + this.cellSize / 2;
            const cy = outlet.y * this.cellSize + this.cellSize / 2;
            const size = this.cellSize * 0.35;
            
            const color = this.colors[outlet.color] || '#00ffff';
            
            // Outer glow
            ctx.shadowColor = color;
            ctx.shadowBlur = 15;
            
            // Draw square outlet
            ctx.fillStyle = color;
            ctx.fillRect(cx - size, cy - size, size * 2, size * 2);
            
            // Inner dark square
            ctx.fillStyle = '#0a0a1a';
            ctx.fillRect(cx - size * 0.6, cy - size * 0.6, size * 1.2, size * 1.2);
            
            // Arrow indicator
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.moveTo(cx - size * 0.3, cy - size * 0.2);
            ctx.lineTo(cx + size * 0.3, cy);
            ctx.lineTo(cx - size * 0.3, cy + size * 0.2);
            ctx.closePath();
            ctx.fill();
            
            ctx.shadowBlur = 0;
            
            // Highlight if selected
            if (this.currentOutlet && this.currentOutlet.id === outlet.id) {
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2;
                ctx.strokeRect(cx - size - 3, cy - size - 3, (size + 3) * 2, (size + 3) * 2);
            }
        });
    }
    
    drawStations(stations) {
        const ctx = this.ctx;
        
        stations.forEach(station => {
            const cx = station.x * this.cellSize + this.cellSize / 2;
            const cy = station.y * this.cellSize + this.cellSize / 2;
            const size = this.cellSize * 0.35;
            
            const color = this.colors[station.color] || '#00ffff';
            
            // Outer glow
            ctx.shadowColor = color;
            ctx.shadowBlur = 15;
            
            // Draw hexagonal station
            ctx.fillStyle = '#0a0a1a';
            ctx.strokeStyle = color;
            ctx.lineWidth = 3;
            
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const angle = (i * 60 - 30) * Math.PI / 180;
                const x = cx + size * Math.cos(angle);
                const y = cy + size * Math.sin(angle);
                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            
            // Inner colored circle
            ctx.fillStyle = color;
            ctx.globalAlpha = 0.3;
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
            
            const pos = this.getCyclePosition(cycle);
            if (!pos) return;
            
            // Calculate interpolated position for smooth movement
            const progress = cycle.progress % 1;
            const currentIndex = Math.floor(cycle.progress);
            const nextIndex = Math.min(currentIndex + 1, cycle.path.length - 1);
            
            const currentPos = cycle.path[currentIndex];
            const nextPos = cycle.path[nextIndex];
            
            const x = (currentPos.x + (nextPos.x - currentPos.x) * progress) * this.cellSize + this.cellSize / 2;
            const y = (currentPos.y + (nextPos.y - currentPos.y) * progress) * this.cellSize + this.cellSize / 2;
            
            const color = this.colors[cycle.color] || '#00ffff';
            const radius = this.cellSize * 0.25;
            
            // Draw glow trail
            ctx.shadowColor = color;
            ctx.shadowBlur = 20;
            
            // Draw cycle
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
            
            // Inner bright core
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(x, y, radius * 0.4, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.shadowBlur = 0;
        });
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.game = new LightCycleGame();
});
