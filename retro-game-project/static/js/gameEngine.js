
// Moteur de jeu principal avec utilitaires communes
class GameEngine {
    constructor() {
        this.lastTime = 0;
        this.deltaTime = 0;
        this.fps = 60;
        this.targetFrameTime = 1000 / this.fps;
    }

    // Boucle de jeu avec contrôle du framerate
    gameLoop(currentTime, updateCallback, renderCallback) {
        this.deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        if (this.deltaTime >= this.targetFrameTime) {
            updateCallback(this.deltaTime);
            renderCallback();
        }
        requestAnimationFrame((time) => 
            this.gameLoop(time, updateCallback, renderCallback)
        );
    }

    // Utilitaires mathématiques
    static clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }
    static lerp(start, end, factor) {
        return start + (end - start) * factor;
    }
    static randomBetween(min, max) {
        return Math.random() * (max - min) + min;
    }
    static randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    static degToRad(degrees) {
        return degrees * Math.PI / 180;
    }
    static radToDeg(radians) {
        return radians * 180 / Math.PI;
    }
}

// Gestionnaire de contrôles tactiles et clavier amélioré
class ControlManager {
    constructor() {
        this.touchControls = this.isMobile();
        this.keys = {};
        this.touches = {};
        this.touchPositions = {};
        this.gamepadIndex = null;
        this.vibrationSupported = 'vibrate' in navigator;
        this.deadZone = 0.1;
        this.touchSensitivity = 2.0;
        this.touchThreshold = 15;
        this.lastTouchTime = 0;
        this.touchDebounce = 16;
        this.joystickState = {
            active: false,
            center: { x: 0, y: 0 },
            current: { x: 0, y: 0 },
            intensity: { x: 0, y: 0 },
            maxRadius: 50
        };
        this.touchJoystick = {
            active: false,
            intensity: { x: 0, y: 0 },
            isDPadControl: false
        };
        this.setupControls();
        this.createVirtualControls();
        this.setupGamepad();
    }
    isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
               (navigator.maxTouchPoints && navigator.maxTouchPoints > 1);
    }
    setupControls() {
        document.addEventListener('keydown', (e) => {
            if (!this.keys[e.key.toLowerCase()]) {
                this.keys[e.key.toLowerCase()] = true;
                this.keys[e.code] = true;
                this.hapticFeedback('light');
            }
        });
        document.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
            this.keys[e.code] = false;
        });
    }
    setupGamepad() {
        window.addEventListener('gamepadconnected', (e) => {
            this.gamepadIndex = e.gamepad.index;
        });
        window.addEventListener('gamepaddisconnected', (e) => {
            if (this.gamepadIndex === e.gamepad.index) {
                this.gamepadIndex = null;
            }
        });
    }
    hapticFeedback(intensity = 'medium') {
        if (!this.vibrationSupported) return;
        const now = performance.now();
        if (now - (this.lastHapticTime || 0) < 50) return;
        this.lastHapticTime = now;
        const patterns = {
            light: 5,
            medium: 10,
            strong: 20
        };
        try {
            navigator.vibrate(patterns[intensity] || patterns.medium);
        } catch (e) {}
    }
    isPressed(control) {
        if (this.touchControls) {
            if (this.touches[control]) return true;
            switch(control) {
                case 'up': return this.touches['up'] || this.touches['swipe-up'];
                case 'down': return this.touches['down'] || this.touches['swipe-down'];
                case 'left': return this.touches['left'] || this.touches['swipe-left'];
                case 'right': return this.touches['right'] || this.touches['swipe-right'];
                case 'jump': return this.touches['action'] || this.touches['jump'];
            }
        }
        if (!this.keyMapCache) {
            this.keyMapCache = {
                'up': new Set(['z', 'w', 'arrowup', 'KeyW', 'KeyZ']),
                'down': new Set(['s', 'arrowdown', 'KeyS']),
                'left': new Set(['q', 'a', 'arrowleft', 'KeyA', 'KeyQ']),
                'right': new Set(['d', 'arrowright', 'KeyD']),
                'action': new Set([' ', 'space', 'enter', 'Space', 'Enter']),
                'jump': new Set(['z', 'w', 'space', 'KeyW', 'KeyZ', 'Space']),
                'boost': new Set(['shift', 'shiftleft', 'shiftright']),
                'brake': new Set(['control', 'controlleft', 'controlright'])
            };
        }
        const keySet = this.keyMapCache[control];
        if (keySet) {
            for (const key of keySet) {
                if (this.keys[key] || this.keys[key.toLowerCase()]) {
                    return true;
                }
            }
        }
        return false;
    }
    createVirtualControls() {
        // Ajoute des boutons virtuels si mobile (optionnel)
    }
}

// Classe de base pour tous les jeux
class BaseGame {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.gameRunning = false;
        this.engine = new GameEngine();
        this.controls = new ControlManager();
        this.setupControlHelp();
    }
    setupControlHelp() {
        document.addEventListener('keydown', (e) => {
            if (e.key.toLowerCase() === 'h' && this.gameRunning) {
                // Affiche l'aide (optionnel)
            }
        });
    }
    showGameControls(gameSpecificControls = []) {
        // Affiche l'aide (optionnel)
    }
    start() {
        this.gameRunning = true;
        this.init();
        this.gameLoop();
        setTimeout(() => {
            this.showGameControls(this.getGameSpecificControls());
        }, 1000);
    }
    getGameSpecificControls() {
        return [];
    }
    stop() {
        this.gameRunning = false;
    }
    init() {}
    update(deltaTime) {}
    render() {}
    gameLoop() {
        if (!this.gameRunning) return;
        this.update();
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
    clearCanvas(color = '#000000') {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    drawGradientRect(x, y, width, height, color1, color2, direction = 'vertical') {
        const gradient = direction === 'vertical' 
            ? this.ctx.createLinearGradient(x, y, x, y + height)
            : this.ctx.createLinearGradient(x, y, x + width, y);
        gradient.addColorStop(0, color1);
        gradient.addColorStop(1, color2);
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(x, y, width, height);
    }
    drawRoundedRect(x, y, width, height, radius, color) {
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.roundRect(x, y, width, height, radius);
        this.ctx.fill();
    }
    drawShadowRect(x, y, width, height, color, shadowColor = 'rgba(0,0,0,0.3)', offset = 3) {
        this.ctx.fillStyle = shadowColor;
        this.ctx.fillRect(x + offset, y + offset, width, height);
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x, y, width, height);
    }
    drawParticle(x, y, size, color, alpha = 1) {
        this.ctx.save();
        this.ctx.globalAlpha = alpha;
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.arc(x, y, size, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
    }
    drawText(text, x, y, options = {}) {
        const {
            font = '16px Arial',
            color = '#000',
            align = 'left',
            baseline = 'top',
            shadow = false,
            shadowColor = 'rgba(0,0,0,0.5)',
            shadowOffset = 2
        } = options;
        this.ctx.font = font;
        this.ctx.textAlign = align;
        this.ctx.textBaseline = baseline;
        if (shadow) {
            this.ctx.fillStyle = shadowColor;
            this.ctx.fillText(text, x + shadowOffset, y + shadowOffset);
        }
        this.ctx.fillStyle = color;
        this.ctx.fillText(text, x, y);
    }
}
