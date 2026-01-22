// Light Cycle - Tron Puzzle Game
// Enhanced Edition with Click-to-Draw and Visual Effects

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
        this.renderLevelSelect();
        this.startAnimationLoop();
    }
    
    initLevels() {
        this.levels = [
            { id: 1, name: "First Light", description: "Click cells to draw a path from outlet to station", gridSize: 5,
              outlets: [{ id: 'o1', x: 0, y: 2, color: 'cyan' }],
              stations: [{ id: 's1', x: 4, y: 2, color: 'cyan' }],
              obstacles: [], splitters: [], colorChangers: [] },
            { id: 2, name: "Two Paths", description: "Guide both cycles to their matching stations", gridSize: 5,
              outlets: [{ id: 'o1', x: 0, y: 1, color: 'cyan' }, { id: 'o2', x: 0, y: 3, color: 'magenta' }],
              stations: [{ id: 's1', x: 4, y: 1, color: 'cyan' }, { id: 's2', x: 4, y: 3, color: 'magenta' }],
              obstacles: [], splitters: [], colorChangers: [] },
            { id: 3, name: "Crossroads", description: "Paths can cross each other", gridSize: 5,
              outlets: [{ id: 'o1', x: 0, y: 2, color: 'cyan' }, { id: 'o2', x: 2, y: 0, color: 'magenta' }],
              stations: [{ id: 's1', x: 4, y: 2, color: 'cyan' }, { id: 's2', x: 2, y: 4, color: 'magenta' }],
              obstacles: [], splitters: [], colorChangers: [] },
            { id: 4, name: "Color Blend", description: "Merge paths to mix colors: Red + Blue = Purple", gridSize: 6,
              outlets: [{ id: 'o1', x: 0, y: 1, color: 'red' }, { id: 'o2', x: 0, y: 4, color: 'blue' }],
              stations: [{ id: 's1', x: 5, y: 2, color: 'purple' }],
              obstacles: [], splitters: [], colorChangers: [] },
            { id: 5, name: "Split Decision", description: "Use splitters to divide your path", gridSize: 6,
              outlets: [{ id: 'o1', x: 0, y: 2, color: 'cyan' }],
              stations: [{ id: 's1', x: 5, y: 0, color: 'cyan' }, { id: 's2', x: 5, y: 4, color: 'cyan' }],
              obstacles: [], splitters: [{ x: 3, y: 2, directions: ['up', 'down'] }], colorChangers: [] },
            { id: 6, name: "Obstacle Course", description: "Navigate around the barriers", gridSize: 6,
              outlets: [{ id: 'o1', x: 0, y: 2, color: 'cyan' }],
              stations: [{ id: 's1', x: 5, y: 2, color: 'cyan' }],
              obstacles: [{ x: 2, y: 1 }, { x: 2, y: 2 }, { x: 2, y: 3 }, { x: 4, y: 0 }, { x: 4, y: 1 }, { x: 4, y: 3 }, { x: 4, y: 4 }],
              splitters: [], colorChangers: [] },
            { id: 7, name: "Color Shift", description: "Use color changers to transform cycles", gridSize: 6,
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
            { id: 10, name: "Complex Web", description: "Multiple splits and merges required", gridSize: 7,
              outlets: [{ id: 'o1', x: 0, y: 3, color: 'cyan' }, { id: 'o2', x: 3, y: 0, color: 'magenta' }],
              stations: [{ id: 's1', x: 6, y: 1, color: 'cyan' }, { id: 's2', x: 6, y: 5, color: 'magenta' }, { id: 's3', x: 3, y: 6, color: 'white' }],
              obstacles: [{ x: 2, y: 2 }, { x: 4, y: 4 }], splitters: [{ x: 2, y: 3, directions: ['right', 'down'] }], colorChangers: [] },
            { id: 11, name: "The Maze", description: "Find your way through the labyrinth", gridSize: 7,
              outlets: [{ id: 'o1', x: 0, y: 0, color: 'cyan' }],
              stations: [{ id: 's1', x: 6, y: 6, color: 'cyan' }],
              obstacles: [{ x: 1, y: 1 }, { x: 2, y: 1 }, { x: 3, y: 1 }, { x: 4, y: 1 }, { x: 4, y: 2 }, { x: 4, y: 3 }, { x: 1, y: 3 }, { x: 2, y: 3 }, { x: 2, y: 4 }, { x: 2, y: 5 }, { x: 4, y: 5 }, { x: 5, y: 5 }],
              splitters: [], colorChangers: [] },
            { id: 12, name: "Grand Finale", description: "Put all your skills to the test", gridSize: 7,
              outlets: [{ id: 'o1', x: 0, y: 1, color: 'red' }, { id: 'o2', x: 0, y: 5, color: 'blue' }],
              stations: [{ id: 's1', x: 6, y: 0, color: 'red' }, { id: 's2', x: 6, y: 3, color: 'purple' }, { id: 's3', x: 6, y: 6, color: 'blue' }],
              obstacles: [{ x: 2, y: 0 }, { x: 2, y: 6 }, { x: 4, y: 2 }, { x: 4, y: 4 }],
              splitters: [{ x: 2, y: 1, directions: ['right', 'down'] }, { x: 2, y: 5, directions: ['right', 'up'] }], colorChangers: [] },
            { id: 13, name: "Prismatic", description: "Create all three secondary colors", gridSize: 7,
              outlets: [{ id: 'o1', x: 0, y: 1, color: 'red' }, { id: 'o2', x: 0, y: 3, color: 'yellow' }, { id: 'o3', x: 0, y: 5, color: 'blue' }],
              stations: [{ id: 's1', x: 6, y: 1, color: 'orange' }, { id: 's2', x: 6, y: 3, color: 'green' }, { id: 's3', x: 6, y: 5, color: 'purple' }],
              obstacles: [{ x: 3, y: 0 }, { x: 3, y: 6 }], splitters: [], colorChangers: [] },
            { id: 14, name: "Chain Reaction", description: "Multiple color transformations", gridSize: 7,
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
                    oscillator.stop(this.audioContext.currentTime + 0.08);
                    break;
                case 'path':
                    oscillator.frequency.setValueAtTime(660, this.audioContext.currentTime);
                    oscillator.type = 'triangle';
                    gainNode.gain.setValueAtTime(0.06, this.audioContext.currentTime);
                    oscillator.start();
                    oscillator.stop(this.audioContext.currentTime + 0.04);
                    break;
                case 'undo':
                    oscillator.frequency.setValueAtTime(440, this.audioContext.currentTime);
                    oscillator.type = 'sine';
                    gainNode.gain.setValueAtTime(0.06, this.audioContext.currentTime);
                    oscillator.start();
                    oscillator.stop(this.audioContext.currentTime + 0.06);
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
            }
        } catch(e) {}
    }
    
    hapticFeedback(type = 'light') {
        if (!this.settings.haptic || !navigator.vibrate) return;
        switch(type) {
            case 'light': navigator.vibrate(8); break;
            case 'medium': navigator.vibrate(20); break;
            case 'success': navigator.vibrate([40, 40, 80]); break;
            case 'fail': navigator.vibrate([80, 40, 80]); break;
        }
    }
    
    loadSettings() {
        const saved = localStorage.getItem('lightcycle_settings');
        return saved ? JSON.parse(saved) : { sound: true, haptic: true, gridNumbers: false };
    }
    
    saveSettings() { localStorage.setItem('lightcycle_settings', JSON.stringify(this.settings)); }
    
    loadProgress() {
        const saved = localStorage.getItem('lightcycle_progress');
        return saved ? JSON.parse(saved) : { completedLevels: [], stars: {} };
    }
    
    saveProgress() { localStorage.setItem('lightcycle_progress', JSON.stringify(this.progress)); }
    
    initEventListeners() {
        document.getElementById('play-btn').addEventListener('click', () => {
            this.playSound('click'); this.hapticFeedback('light');
            this.startLevel(this.getNextUncompletedLevel());
        });
        document.getElementById('levels-btn').addEventListener('click', () => {
            this.playSound('click'); this.hapticFeedback('light'); this.showScreen('level-select');
        });
        document.getElementById('how-to-play-btn').addEventListener('click', () => {
            this.playSound('click'); this.hapticFeedback('light'); this.showScreen('how-to-play');
        });
        document.getElementById('settings-btn').addEventListener('click', () => {
            this.playSound('click'); this.hapticFeedback('light'); this.showScreen('settings');
        });
        
        document.querySelectorAll('.back-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.playSound('click'); this.hapticFeedback('light');
                const target = e.currentTarget.dataset.target;
                if (target) this.showScreen(target);
            });
        });
        
        document.getElementById('game-back-btn').addEventListener('click', () => {
            this.playSound('click'); this.hapticFeedback('light');
            this.stopSimulation(); this.showScreen('level-select');
        });
        
        document.getElementById('run-btn').addEventListener('click', () => {
            this.playSound('click'); this.hapticFeedback('medium'); this.runSimulation();
        });
        document.getElementById('undo-btn').addEventListener('click', () => {
            this.playSound('undo'); this.hapticFeedback('light'); this.undoLastSegment();
        });
        document.getElementById('clear-btn').addEventListener('click', () => {
            this.playSound('click'); this.hapticFeedback('light'); this.clearAllPaths();
        });
        document.getElementById('reset-level-btn').addEventListener('click', () => {
            this.playSound('click'); this.hapticFeedback('light'); this.resetLevel();
        });
        
        document.getElementById('sound-toggle').addEventListener('change', (e) => {
            this.settings.sound = e.target.checked; this.saveSettings();
            if (e.target.checked) this.playSound('click');
        });
        document.getElementById('haptic-toggle').addEventListener('change', (e) => {
            this.settings.haptic = e.target.checked; this.saveSettings(); this.hapticFeedback('light');
        });
        document.getElementById('grid-numbers-toggle').addEventListener('change', (e) => {
            this.settings.gridNumbers = e.target.checked; this.saveSettings();
        });
        document.getElementById('reset-progress-btn').addEventListener('click', () => {
            if (confirm('Are you sure you want to reset all progress?')) {
                this.progress = { completedLevels: [], stars: {} };
                this.saveProgress(); this.renderLevelSelect(); this.playSound('click');
            }
        });
        
        document.getElementById('replay-btn').addEventListener('click', () => {
            this.playSound('click'); this.hapticFeedback('light'); this.hideModal(); this.resetLevel();
        });
        document.getElementById('next-level-btn').addEventListener('click', () => {
            this.playSound('click'); this.hapticFeedback('light'); this.hideModal();
            if (this.currentLevel < this.levels.length - 1) this.startLevel(this.currentLevel + 1);
            else this.showScreen('level-select');
        });
        
        // Canvas click-to-draw
        this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleCanvasHover(e));
        this.canvas.addEventListener('mouseleave', () => { this.hoverCell = null; });
        
        // Touch support with double-tap
        let lastTouchEnd = 0;
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (this.isRunning) return;
            const touch = e.touches[0];
            this.hoverCell = this.getGridPosition(touch.clientX, touch.clientY);
        }, { passive: false });
        
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            if (this.isRunning) return;
            const now = Date.now();
            if (this.hoverCell) {
                if (now - lastTouchEnd < 300 && this.currentPath && this.currentPath.length > 1) {
                    this.finishCurrentPath();
                } else {
                    this.processGridClick(this.hoverCell);
                }
            }
            lastTouchEnd = now;
        });
        
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (this.isRunning) return;
            const touch = e.touches[0];
            this.hoverCell = this.getGridPosition(touch.clientX, touch.clientY);
        }, { passive: false });
        
        document.getElementById('sound-toggle').checked = this.settings.sound;
        document.getElementById('haptic-toggle').checked = this.settings.haptic;
        document.getElementById('grid-numbers-toggle').checked = this.settings.gridNumbers;
        
        window.addEventListener('resize', () => this.resizeCanvas());
    }
    
    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById(screenId).classList.add('active');
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
            tile.innerHTML = '<span class="level-number">' + level.id + '</span><span class="level-name">' + level.name + '</span><span class="level-stars">' + (isCompleted ? '⭐'.repeat(stars) + '☆'.repeat(3-stars) : '☆☆☆') + '</span>';
            if (isUnlocked) {
                tile.addEventListener('click', () => {
                    this.playSound('click'); this.hapticFeedback('light'); this.startLevel(index);
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
        document.getElementById('current-level-name').textContent = 'Level ' + level.id + ': ' + level.name;
        document.getElementById('level-message').textContent = level.description;
        this.gridSize = level.gridSize;
        this.paths = {};
        this.currentPath = null;
        this.currentOutlet = null;
        this.cycles = [];
        this.isRunning = false;
        this.trailParticles = [];
        this.showScreen('game-screen');
        this.resizeCanvas();
    }
    
    resetLevel() {
        this.paths = {}; this.currentPath = null; this.currentOutlet = null;
        this.cycles = []; this.isRunning = false; this.trailParticles = [];
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
    
    handleCanvasClick(e) {
        if (this.isRunning) return;
        const pos = this.getGridPosition(e.clientX, e.clientY);
        if (pos) this.processGridClick(pos);
    }
    
    handleCanvasHover(e) {
        if (this.isRunning) return;
        const pos = this.getGridPosition(e.clientX, e.clientY);
        if (pos && (!this.hoverCell || this.hoverCell.x !== pos.x || this.hoverCell.y !== pos.y)) {
            this.hoverCell = pos;
        }
    }
    
    processGridClick(pos) {
        const level = this.levels[this.currentLevel];
        if (this.isObstacle(pos.x, pos.y)) return;
        
        const outlet = level.outlets.find(o => o.x === pos.x && o.y === pos.y);
        if (outlet) { this.startNewPath(outlet); return; }
        
        if (this.currentPath && this.currentOutlet) this.extendPath(pos);
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
        this.playSound('path'); this.hapticFeedback('light');
        this.spawnTrailParticles(pos.x, pos.y, this.currentOutlet.color);
        
        const level = this.levels[this.currentLevel];
        const station = level.stations.find(s => s.x === pos.x && s.y === pos.y);
        if (station) this.finishCurrentPath();
    }
    
    finishCurrentPath() { this.currentOutlet = null; this.currentPath = null; }
    
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
        this.paths = {}; this.currentPath = null; this.currentOutlet = null; this.trailParticles = [];
    }
    
    spawnTrailParticles(x, y, colorName) {
        const cx = x * this.cellSize + this.cellSize / 2;
        const cy = y * this.cellSize + this.cellSize / 2;
        const color = this.colors[colorName] || '#00ffff';
        for (let i = 0; i < 5; i++) {
            this.trailParticles.push({
                x: cx, y: cy,
                vx: (Math.random() - 0.5) * 3, vy: (Math.random() - 0.5) * 3,
                life: 1, color: color, size: Math.random() * 4 + 2
            });
        }
    }
    
    updateTrailParticles() {
        for (let i = this.trailParticles.length - 1; i >= 0; i--) {
            const p = this.trailParticles[i];
            p.x += p.vx; p.y += p.vy;
            p.life -= 0.03; p.vx *= 0.95; p.vy *= 0.95;
            if (p.life <= 0) this.trailParticles.splice(i, 1);
        }
    }
    
    runSimulation() {
        if (this.isRunning) return;
        const level = this.levels[this.currentLevel];
        
        const hasAllPaths = level.outlets.every(o => {
            const path = this.paths[o.id];
            return path && path.length > 1;
        });
        
        if (!hasAllPaths) {
            document.getElementById('level-message').textContent = 'Draw paths from all outlets first!';
            this.playSound('fail');
            return;
        }
        
        this.isRunning = true;
        this.cycles = [];
        
        level.outlets.forEach(outlet => {
            const path = this.paths[outlet.id];
            if (path && path.length > 1) {
                this.cycles.push({
                    color: outlet.color, path: [...path], progress: 0,
                    active: true, merged: false, trail: []
                });
            }
        });
        
        this.simulationStartTime = Date.now();
        this.animateCycles();
    }
    
    animateCycles() {
        if (!this.isRunning) return;
        
        const elapsed = Date.now() - this.simulationStartTime;
        const speed = 0.0025;
        let allFinished = true, anyFailed = false;
        
        this.cycles.forEach(cycle => {
            if (!cycle.active) return;
            cycle.progress = elapsed * speed;
            
            const pos = this.getCyclePosition(cycle);
            if (pos) {
                cycle.trail.push({ ...pos, time: Date.now() });
                if (cycle.trail.length > 50) cycle.trail.shift();
            }
            
            if (Math.floor(cycle.progress) >= cycle.path.length - 1) {
                const endPos = cycle.path[cycle.path.length - 1];
                const level = this.levels[this.currentLevel];
                const station = level.stations.find(s => s.x === endPos.x && s.y === endPos.y);
                
                if (station && station.color === cycle.color) {
                    cycle.active = false; cycle.success = true;
                } else {
                    cycle.active = false; cycle.success = false; anyFailed = true;
                }
            } else allFinished = false;
        });
        
        this.checkMerges();
        
        if (allFinished || anyFailed) {
            this.isRunning = false;
            if (!anyFailed && this.cycles.every(c => c.success || c.merged)) this.levelComplete();
            else this.levelFailed();
        } else {
            this.animationFrame = requestAnimationFrame(() => this.animateCycles());
        }
    }
    
    checkMerges() {
        for (let i = 0; i < this.cycles.length; i++) {
            for (let j = i + 1; j < this.cycles.length; j++) {
                const c1 = this.cycles[i], c2 = this.cycles[j];
                if (!c1.active || !c2.active) continue;
                
                const pos1 = this.getCyclePosition(c1);
                const pos2 = this.getCyclePosition(c2);
                
                if (pos1 && pos2 && pos1.x === pos2.x && pos1.y === pos2.y) {
                    c1.color = this.mixColors(c1.color, c2.color);
                    c2.active = false; c2.merged = true;
                    this.spawnTrailParticles(pos1.x, pos1.y, c1.color);
                }
            }
        }
    }
    
    getCyclePosition(cycle) {
        if (!cycle.active && !cycle.success) return null;
        const index = Math.min(Math.floor(cycle.progress), cycle.path.length - 1);
        return cycle.path[index];
    }
    
    mixColors(c1, c2) { return this.colorMixing[c1 + '+' + c2] || c1; }
    
    stopSimulation() {
        this.isRunning = false;
        if (this.animationFrame) { cancelAnimationFrame(this.animationFrame); this.animationFrame = null; }
    }
    
    levelComplete() {
        this.playSound('success'); this.hapticFeedback('success');
        
        const level = this.levels[this.currentLevel];
        let totalPathLength = 0;
        for (const id in this.paths) totalPathLength += this.paths[id].length;
        
        const optimal = level.outlets.length * (this.gridSize - 1);
        const efficiency = optimal / totalPathLength;
        
        let stars = 1;
        if (efficiency > 0.6) stars = 2;
        if (efficiency > 0.85) stars = 3;
        
        if (!this.progress.completedLevels.includes(this.currentLevel)) {
            this.progress.completedLevels.push(this.currentLevel);
        }
        this.progress.stars[this.currentLevel] = Math.max(this.progress.stars[this.currentLevel] || 0, stars);
        this.saveProgress();
        
        document.getElementById('stars-container').innerHTML = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
        document.getElementById('complete-message').textContent = ['Good routing!', 'Excellent work!', 'Perfect solution!'][stars - 1];
        document.getElementById('next-level-btn').style.display = this.currentLevel < this.levels.length - 1 ? 'block' : 'none';
        document.getElementById('level-complete-modal').classList.add('active');
        this.startConfetti();
    }
    
    levelFailed() {
        this.playSound('fail'); this.hapticFeedback('fail');
        document.getElementById('level-message').textContent = "Cycles didn't reach matching stations. Try again!";
        setTimeout(() => this.resetLevel(), 1500);
    }
    
    hideModal() {
        document.getElementById('level-complete-modal').classList.remove('active');
        this.stopConfetti();
    }
    
    startConfetti() {
        this.confettiCanvas.width = window.innerWidth;
        this.confettiCanvas.height = window.innerHeight;
        this.confettiParticles = [];
        const colors = ['#00ffff', '#ff00ff', '#ffff00', '#ff3366', '#00ff66', '#9933ff'];
        for (let i = 0; i < 120; i++) {
            this.confettiParticles.push({
                x: Math.random() * this.confettiCanvas.width,
                y: Math.random() * this.confettiCanvas.height - this.confettiCanvas.height,
                size: Math.random() * 10 + 5, color: colors[Math.floor(Math.random() * colors.length)],
                speedY: Math.random() * 4 + 2, speedX: (Math.random() - 0.5) * 5,
                rotation: Math.random() * 360, rotationSpeed: (Math.random() - 0.5) * 12
            });
        }
        this.animateConfetti();
    }
    
    animateConfetti() {
        if (!this.confettiParticles) return;
        this.confettiCtx.clearRect(0, 0, this.confettiCanvas.width, this.confettiCanvas.height);
        this.confettiParticles.forEach(p => {
            p.y += p.speedY; p.x += p.speedX; p.rotation += p.rotationSpeed;
            this.confettiCtx.save();
            this.confettiCtx.translate(p.x, p.y);
            this.confettiCtx.rotate(p.rotation * Math.PI / 180);
            this.confettiCtx.fillStyle = p.color;
            this.confettiCtx.shadowColor = p.color;
            this.confettiCtx.shadowBlur = 5;
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
    
    startAnimationLoop() {
        const animate = (timestamp) => {
            if (timestamp - this.lastRenderTime > 16) {
                this.pulsePhase += 0.05;
                this.updateTrailParticles();
                this.render();
                this.lastRenderTime = timestamp;
            }
            requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
    }
    
    render() {
        const ctx = this.ctx;
        const level = this.levels[this.currentLevel];
        if (!level) return;
        
        ctx.fillStyle = '#0a0a1a';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.drawGrid();
        this.drawObstacles(level.obstacles);
        this.drawSplitters(level.splitters);
        this.drawColorChangers(level.colorChangers);
        this.drawPaths();
        if (this.hoverCell && !this.isRunning) this.drawHoverPreview();
        this.drawTrailParticles();
        this.drawOutlets(level.outlets);
        this.drawStations(level.stations);
        if (this.isRunning) this.drawCycles();
    }
    
    drawGrid() {
        const ctx = this.ctx;
        const pulse = Math.sin(this.pulsePhase) * 0.2 + 0.8;
        
        ctx.strokeStyle = 'rgba(26, 58, 74, ' + (0.5 * pulse) + ')';
        ctx.lineWidth = 1;
        
        for (let i = 0; i <= this.gridSize; i++) {
            ctx.beginPath(); ctx.moveTo(i * this.cellSize, 0); ctx.lineTo(i * this.cellSize, this.canvas.height); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(0, i * this.cellSize); ctx.lineTo(this.canvas.width, i * this.cellSize); ctx.stroke();
        }
        
        ctx.fillStyle = 'rgba(0, 255, 255, ' + (0.15 * pulse) + ')';
        for (let i = 0; i <= this.gridSize; i++) {
            for (let j = 0; j <= this.gridSize; j++) {
                ctx.beginPath(); ctx.arc(i * this.cellSize, j * this.cellSize, 2, 0, Math.PI * 2); ctx.fill();
            }
        }
        
        if (this.settings.gridNumbers) {
            ctx.fillStyle = 'rgba(0, 255, 255, 0.3)';
            ctx.font = '10px monospace';
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            for (let x = 0; x < this.gridSize; x++) {
                for (let y = 0; y < this.gridSize; y++) {
                    ctx.fillText(x + ',' + y, x * this.cellSize + this.cellSize / 2, y * this.cellSize + this.cellSize / 2);
                }
            }
        }
    }
    
    drawObstacles(obstacles) {
        const ctx = this.ctx;
        obstacles.forEach(obs => {
            const x = obs.x * this.cellSize, y = obs.y * this.cellSize;
            const gradient = ctx.createLinearGradient(x, y, x + this.cellSize, y + this.cellSize);
            gradient.addColorStop(0, '#1a0a1a'); gradient.addColorStop(1, '#0a0a0a');
            ctx.fillStyle = gradient;
            ctx.fillRect(x + 2, y + 2, this.cellSize - 4, this.cellSize - 4);
            
            ctx.strokeStyle = '#ff3366'; ctx.lineWidth = 2;
            ctx.shadowColor = '#ff3366'; ctx.shadowBlur = 8;
            ctx.strokeRect(x + 4, y + 4, this.cellSize - 8, this.cellSize - 8);
            ctx.shadowBlur = 0;
            
            ctx.lineWidth = 1; ctx.globalAlpha = 0.5;
            ctx.beginPath();
            ctx.moveTo(x + 8, y + 8); ctx.lineTo(x + this.cellSize - 8, y + this.cellSize - 8);
            ctx.moveTo(x + this.cellSize - 8, y + 8); ctx.lineTo(x + 8, y + this.cellSize - 8);
            ctx.stroke();
            ctx.globalAlpha = 1;
        });
    }
    
    drawSplitters(splitters) {
        const ctx = this.ctx;
        const pulse = Math.sin(this.pulsePhase * 1.5) * 0.3 + 0.7;
        splitters.forEach(s => {
            const cx = s.x * this.cellSize + this.cellSize / 2;
            const cy = s.y * this.cellSize + this.cellSize / 2;
            const size = this.cellSize * 0.35;
            
            ctx.shadowColor = '#ffff00'; ctx.shadowBlur = 15 * pulse;
            ctx.fillStyle = '#0a0a1a'; ctx.strokeStyle = '#ffff00'; ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(cx, cy - size); ctx.lineTo(cx + size, cy); ctx.lineTo(cx, cy + size); ctx.lineTo(cx - size, cy);
            ctx.closePath(); ctx.fill(); ctx.stroke();
            
            ctx.strokeStyle = 'rgba(255, 255, 0, ' + (0.5 * pulse) + ')'; ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(cx - size * 0.5, cy); ctx.lineTo(cx + size * 0.5, cy);
            ctx.moveTo(cx, cy - size * 0.5); ctx.lineTo(cx, cy + size * 0.5);
            ctx.stroke();
            ctx.shadowBlur = 0;
        });
    }
    
    drawColorChangers(colorChangers) {
        const ctx = this.ctx;
        const pulse = Math.sin(this.pulsePhase * 2) * 0.3 + 0.7;
        colorChangers.forEach(changer => {
            const cx = changer.x * this.cellSize + this.cellSize / 2;
            const cy = changer.y * this.cellSize + this.cellSize / 2;
            const size = this.cellSize * 0.3;
            const color = this.colors[changer.toColor] || '#ffffff';
            
            ctx.shadowColor = color; ctx.shadowBlur = 20 * pulse;
            ctx.fillStyle = '#0a0a1a'; ctx.strokeStyle = color; ctx.lineWidth = 2;
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const angle = (i * 60 - 30) * Math.PI / 180;
                const px = cx + size * Math.cos(angle), py = cy + size * Math.sin(angle);
                if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
            }
            ctx.closePath(); ctx.fill(); ctx.stroke();
            
            ctx.fillStyle = color; ctx.globalAlpha = 0.3 * pulse;
            ctx.beginPath(); ctx.arc(cx, cy, size * 0.5, 0, Math.PI * 2); ctx.fill();
            ctx.globalAlpha = 1; ctx.shadowBlur = 0;
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
            const isCurrentPath = this.currentOutlet && this.currentOutlet.id === outletId;
            
            // Outer glow
            ctx.strokeStyle = color; ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
            ctx.shadowColor = color; ctx.shadowBlur = 15; ctx.globalAlpha = 0.3;
            ctx.beginPath();
            for (let i = 0; i < path.length; i++) {
                const x = path[i].x * this.cellSize + this.cellSize / 2;
                const y = path[i].y * this.cellSize + this.cellSize / 2;
                if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
            }
            ctx.stroke();
            
            // Main path
            ctx.globalAlpha = 1; ctx.lineWidth = 4; ctx.stroke();
            ctx.shadowBlur = 0;
            
            // Nodes with numbers for current path
            if (isCurrentPath) {
                path.forEach((point, index) => {
                    if (index === 0) return;
                    const x = point.x * this.cellSize + this.cellSize / 2;
                    const y = point.y * this.cellSize + this.cellSize / 2;
                    
                    ctx.fillStyle = color; ctx.shadowColor = color; ctx.shadowBlur = 10;
                    ctx.beginPath(); ctx.arc(x, y, 8, 0, Math.PI * 2); ctx.fill();
                    ctx.shadowBlur = 0;
                    
                    ctx.fillStyle = '#0a0a1a'; ctx.font = 'bold 9px sans-serif';
                    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                    ctx.fillText(index.toString(), x, y);
                });
            }
        }
    }
    
    drawHoverPreview() {
        const ctx = this.ctx;
        const pos = this.hoverCell;
        if (!pos) return;
        
        const pulse = Math.sin(this.pulsePhase * 3) * 0.15 + 0.25;
        
        if (this.currentPath && this.currentPath.length > 0 && this.currentOutlet) {
            const lastPos = this.currentPath[this.currentPath.length - 1];
            const color = this.colors[this.currentOutlet.color] || '#00ffff';
            
            const dx = Math.abs(pos.x - lastPos.x), dy = Math.abs(pos.y - lastPos.y);
            const isAdjacent = (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
            const existingIndex = this.currentPath.findIndex(p => p.x === pos.x && p.y === pos.y);
            const isBacktrack = existingIndex >= 0 && existingIndex < this.currentPath.length - 1;
            
            if (isBacktrack) {
                ctx.fillStyle = 'rgba(255, 255, 0, ' + pulse + ')';
                ctx.strokeStyle = '#ffff00';
            } else if (isAdjacent && !this.isObstacle(pos.x, pos.y)) {
                ctx.fillStyle = 'rgba(0, 255, 102, ' + pulse + ')';
                ctx.strokeStyle = '#00ff66';
                
                ctx.setLineDash([5, 5]); ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(lastPos.x * this.cellSize + this.cellSize / 2, lastPos.y * this.cellSize + this.cellSize / 2);
                ctx.lineTo(pos.x * this.cellSize + this.cellSize / 2, pos.y * this.cellSize + this.cellSize / 2);
                ctx.stroke();
                ctx.setLineDash([]);
            } else {
                ctx.fillStyle = 'rgba(0, 255, 255, ' + (pulse * 0.5) + ')';
                ctx.strokeStyle = color;
            }
        } else {
            ctx.fillStyle = 'rgba(0, 255, 255, ' + (pulse * 0.5) + ')';
            ctx.strokeStyle = '#00ffff';
        }
        
        ctx.fillRect(pos.x * this.cellSize + 4, pos.y * this.cellSize + 4, this.cellSize - 8, this.cellSize - 8);
        ctx.lineWidth = 2; ctx.setLineDash([4, 4]);
        ctx.strokeRect(pos.x * this.cellSize + 4, pos.y * this.cellSize + 4, this.cellSize - 8, this.cellSize - 8);
        ctx.setLineDash([]);
    }
    
    drawTrailParticles() {
        const ctx = this.ctx;
        this.trailParticles.forEach(p => {
            ctx.fillStyle = p.color; ctx.globalAlpha = p.life;
            ctx.shadowColor = p.color; ctx.shadowBlur = 10;
            ctx.beginPath(); ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2); ctx.fill();
        });
        ctx.globalAlpha = 1; ctx.shadowBlur = 0;
    }
    
    drawOutlets(outlets) {
        const ctx = this.ctx;
        const pulse = Math.sin(this.pulsePhase * 2) * 0.2 + 0.8;
        
        outlets.forEach(outlet => {
            const cx = outlet.x * this.cellSize + this.cellSize / 2;
            const cy = outlet.y * this.cellSize + this.cellSize / 2;
            const size = this.cellSize * 0.35;
            const color = this.colors[outlet.color] || '#00ffff';
            
            ctx.shadowColor = color; ctx.shadowBlur = 20 * pulse;
            ctx.fillStyle = color;
            ctx.fillRect(cx - size, cy - size, size * 2, size * 2);
            
            ctx.fillStyle = '#0a0a1a';
            ctx.fillRect(cx - size * 0.6, cy - size * 0.6, size * 1.2, size * 1.2);
            
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.moveTo(cx - size * 0.3, cy - size * 0.25);
            ctx.lineTo(cx + size * 0.35, cy);
            ctx.lineTo(cx - size * 0.3, cy + size * 0.25);
            ctx.closePath(); ctx.fill();
            ctx.shadowBlur = 0;
            
            if (this.currentOutlet && this.currentOutlet.id === outlet.id) {
                ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2;
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
            
            ctx.shadowColor = color; ctx.shadowBlur = 15 * pulse;
            ctx.fillStyle = '#0a0a1a'; ctx.strokeStyle = color; ctx.lineWidth = 3;
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const angle = (i * 60 - 30) * Math.PI / 180;
                const px = cx + size * Math.cos(angle), py = cy + size * Math.sin(angle);
                if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
            }
            ctx.closePath(); ctx.fill(); ctx.stroke();
            
            ctx.fillStyle = color; ctx.globalAlpha = 0.4 * pulse;
            ctx.beginPath(); ctx.arc(cx, cy, size * 0.5, 0, Math.PI * 2); ctx.fill();
            ctx.globalAlpha = 1; ctx.shadowBlur = 0;
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
                ctx.strokeStyle = color; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
                for (let i = 1; i < cycle.trail.length; i++) {
                    const age = (now - cycle.trail[i].time) / 500;
                    const alpha = Math.max(0, 1 - age);
                    ctx.globalAlpha = alpha * 0.5;
                    ctx.lineWidth = 6 * (1 - age * 0.5);
                    ctx.shadowColor = color; ctx.shadowBlur = 10;
                    
                    const prev = cycle.trail[i - 1], curr = cycle.trail[i];
                    ctx.beginPath();
                    ctx.moveTo(prev.x * this.cellSize + this.cellSize / 2, prev.y * this.cellSize + this.cellSize / 2);
                    ctx.lineTo(curr.x * this.cellSize + this.cellSize / 2, curr.y * this.cellSize + this.cellSize / 2);
                    ctx.stroke();
                }
                ctx.globalAlpha = 1; ctx.shadowBlur = 0;
            }
            
            // Cycle position
            const progress = cycle.progress % 1;
            const currentIndex = Math.min(Math.floor(cycle.progress), cycle.path.length - 1);
            const nextIndex = Math.min(currentIndex + 1, cycle.path.length - 1);
            const currentPos = cycle.path[currentIndex], nextPos = cycle.path[nextIndex];
            
            const x = (currentPos.x + (nextPos.x - currentPos.x) * progress) * this.cellSize + this.cellSize / 2;
            const y = (currentPos.y + (nextPos.y - currentPos.y) * progress) * this.cellSize + this.cellSize / 2;
            const radius = this.cellSize * 0.25;
            
            ctx.shadowColor = color; ctx.shadowBlur = 25;
            ctx.fillStyle = color;
            ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill();
            
            ctx.fillStyle = '#ffffff';
            ctx.beginPath(); ctx.arc(x, y, radius * 0.4, 0, Math.PI * 2); ctx.fill();
            ctx.shadowBlur = 0;
            
            if (cycle.success) {
                ctx.fillStyle = '#00ff66'; ctx.shadowColor = '#00ff66'; ctx.shadowBlur = 15;
                ctx.font = (this.cellSize * 0.4) + 'px sans-serif';
                ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillText('✓', x, y - radius * 1.5);
                ctx.shadowBlur = 0;
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', () => { window.game = new LightCycleGame(); });
