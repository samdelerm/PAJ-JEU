// Moteur de jeu principal avec utilities communes
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

    // Conversion degrés/radians
    static degToRad(degrees) {
        return degrees * Math.PI / 180;
    }

    static radToDeg(radians) {
        return radians * 180 / Math.PI;
    }
}

// Gestionnaire de contrôles tactiles et clavier
class ControlManager {
    constructor() {
        this.touchControls = this.isMobile();
        this.keys = {};
        this.touches = {};
        this.setupControls();
        this.createVirtualControls();
    }

    isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    setupControls() {
        // Contrôles clavier (AZERTY et QWERTY)
        document.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            this.keys[e.code] = true;
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
            this.keys[e.code] = false;
        });

        // Contrôles tactiles
        document.addEventListener('touchstart', (e) => this.handleTouch(e, true));
        document.addEventListener('touchend', (e) => this.handleTouch(e, false));
        document.addEventListener('touchmove', (e) => e.preventDefault());
    }

    handleTouch(e, isPressed) {
        e.preventDefault();
        for (let touch of e.changedTouches) {
            const element = document.elementFromPoint(touch.clientX, touch.clientY);
            if (element && element.dataset.control) {
                this.touches[element.dataset.control] = isPressed;
            }
        }
    }

    isPressed(control) {
        // Mapping des contrôles AZERTY/QWERTY
        const keyMap = {
            'up': ['z', 'w', 'arrowup'],
            'down': ['s', 'arrowdown'],
            'left': ['q', 'a', 'arrowleft'],
            'right': ['d', 'arrowright'],
            'action': [' ', 'space', 'enter'],
            'jump': ['z', 'w', 'space']
        };

        if (this.touchControls && this.touches[control]) return true;
        
        const keys = keyMap[control] || [control];
        return keys.some(key => this.keys[key]);
    }

    createVirtualControls() {
        if (!this.touchControls) return;

        const controlsHTML = `
            <div id="virtual-controls">
                <div class="dpad">
                    <button data-control="up" class="btn-up">↑</button>
                    <button data-control="left" class="btn-left">←</button>
                    <button data-control="down" class="btn-down">↓</button>
                    <button data-control="right" class="btn-right">→</button>
                </div>
                <div class="action-buttons">
                    <button data-control="action" class="btn-action">A</button>
                    <button data-control="jump" class="btn-jump">B</button>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', controlsHTML);
        this.addVirtualControlsCSS();
    }

    addVirtualControlsCSS() {
        const style = document.createElement('style');
        style.textContent = `
            #virtual-controls {
                position: fixed;
                bottom: 20px;
                left: 0;
                right: 0;
                display: flex;
                justify-content: space-between;
                padding: 0 20px;
                pointer-events: none;
                z-index: 1000;
            }
            .dpad, .action-buttons {
                position: relative;
                pointer-events: all;
            }
            .dpad {
                width: 120px;
                height: 120px;
            }
            .dpad button {
                position: absolute;
                width: 40px;
                height: 40px;
                border: none;
                border-radius: 8px;
                background: rgba(0,0,0,0.7);
                color: white;
                font-size: 20px;
                user-select: none;
                touch-action: manipulation;
            }
            .btn-up { top: 0; left: 40px; }
            .btn-down { bottom: 0; left: 40px; }
            .btn-left { top: 40px; left: 0; }
            .btn-right { top: 40px; right: 0; }
            .action-buttons button {
                width: 60px;
                height: 60px;
                border-radius: 50%;
                border: none;
                background: rgba(220,53,69,0.8);
                color: white;
                font-size: 18px;
                margin: 10px;
                user-select: none;
                touch-action: manipulation;
            }
            @media (min-width: 768px) {
                #virtual-controls { display: none; }
            }
        `;
        document.head.appendChild(style);
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
    }

    start() {
        this.gameRunning = true;
        this.init();
        this.gameLoop();
    }

    stop() {
        this.gameRunning = false;
    }

    init() {
        // À implémenter dans les classes filles
    }

    update(deltaTime) {
        // À implémenter dans les classes filles
    }

    render() {
        // À implémenter dans les classes filles
    }

    gameLoop() {
        if (!this.gameRunning) return;
        
        this.update();
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }

    // Nettoyer le canvas
    clearCanvas(color = '#000000') {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    // Utilitaires de rendu moderne
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
        // Ombre
        this.ctx.fillStyle = shadowColor;
        this.ctx.fillRect(x + offset, y + offset, width, height);
        
        // Rectangle principal
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