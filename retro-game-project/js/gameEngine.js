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

// Gestionnaire de contrôles tactiles et clavier amélioré
class ControlManager {
    constructor() {
        this.touchControls = this.isMobile();
        this.keys = {};
        this.touches = {};
        this.touchPositions = {};
        this.gamepadIndex = null;
        this.vibrationSupported = 'vibrate' in navigator;
        this.deadZone = 0; // Zone morte pour les joysticks
        this.touchSensitivity = 1.5;
        this.setupControls();
        this.createVirtualControls();
        this.setupGamepad();
    }

    isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
               (navigator.maxTouchPoints && navigator.maxTouchPoints > 1);
    }

    setupControls() {
        // Contrôles clavier améliorés (AZERTY et QWERTY)
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

        // Contrôles tactiles améliorés avec gestes
        document.addEventListener('touchstart', (e) => this.handleTouch(e, true), { passive: false });
        document.addEventListener('touchend', (e) => this.handleTouch(e, false), { passive: false });
        document.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
        
        // Prévenir le zoom et les gestes par défaut
        document.addEventListener('gesturestart', (e) => e.preventDefault());
        document.addEventListener('gesturechange', (e) => e.preventDefault());
        document.addEventListener('gestureend', (e) => e.preventDefault());
    }

    setupGamepad() {
        // Support des manettes de jeu
        window.addEventListener('gamepadconnected', (e) => {
            this.gamepadIndex = e.gamepad.index;
            console.log('Manette connectée:', e.gamepad.id);
        });

        window.addEventListener('gamepaddisconnected', (e) => {
            if (this.gamepadIndex === e.gamepad.index) {
                this.gamepadIndex = null;
            }
        });
    }

    handleTouch(e, isPressed) {
        e.preventDefault();
        for (let touch of e.changedTouches) {
            const element = document.elementFromPoint(touch.clientX, touch.clientY);
            if (element && element.dataset.control) {
                this.touches[element.dataset.control] = isPressed;
                this.touchPositions[touch.identifier] = {
                    x: touch.clientX,
                    y: touch.clientY,
                    control: element.dataset.control
                };
                
                if (isPressed) {
                    this.hapticFeedback('medium');
                    element.classList.add('pressed');
                } else {
                    element.classList.remove('pressed');
                }
            }
        }
    }

    handleTouchMove(e) {
        e.preventDefault();
        for (let touch of e.changedTouches) {
            if (this.touchPositions[touch.identifier]) {
                const startPos = this.touchPositions[touch.identifier];
                const deltaX = touch.clientX - startPos.x;
                const deltaY = touch.clientY - startPos.y;
                const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
                
                // Gestion des gestes de swipe
                if (distance > 30) {
                    const angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI;
                    this.handleSwipeGesture(angle, distance);
                }
            }
        }
    }

    handleSwipeGesture(angle, distance) {
        const intensity = 100
        
        if (angle >= -45 && angle < 45) {
            this.touches['swipe-right'] = intensity;
        } else if (angle >= 45 && angle < 135) {
            this.touches['swipe-down'] = intensity;
        } else if (angle >= 135 || angle < -135) {
            this.touches['swipe-left'] = intensity;
        } else {
            this.touches['swipe-up'] = intensity;
        }
    }

    getGamepadInput() {
        if (this.gamepadIndex === null) return null;
        
        const gamepad = navigator.getGamepads()[this.gamepadIndex];
        if (!gamepad) return null;

        return {
            leftStick: {
                x: Math.abs(gamepad.axes[0]) > this.deadZone ? gamepad.axes[0] : 0,
                y: Math.abs(gamepad.axes[1]) > this.deadZone ? gamepad.axes[1] : 0
            },
            rightStick: {
                x: Math.abs(gamepad.axes[2]) > this.deadZone ? gamepad.axes[2] : 0,
                y: Math.abs(gamepad.axes[3]) > this.deadZone ? gamepad.axes[3] : 0
            },
            buttons: gamepad.buttons.map(btn => btn.pressed)
        };
    }

    hapticFeedback(intensity = 'medium') {
        if (!this.vibrationSupported) return;
        
        const patterns = {
            light: 10,
            medium: [10, 10, 10],
            strong: [50, 30, 50]
        };
        
        navigator.vibrate(patterns[intensity] || patterns.medium);
    }

    isPressed(control) {
        // Mapping étendu des contrôles
        const keyMap = {
            'up': ['z', 'w', 'arrowup', 'KeyW', 'KeyZ'],
            'down': ['s', 'arrowdown', 'KeyS'],
            'left': ['q', 'a', 'arrowleft', 'KeyA', 'KeyQ'],
            'right': ['d', 'arrowright', 'KeyD'],
            'action': [' ', 'space', 'enter', 'Space', 'Enter'],
            'jump': ['z', 'w', 'space', 'KeyW', 'KeyZ', 'Space'],
            'boost': ['shift', 'shiftleft', 'shiftright'],
            'brake': ['control', 'controlleft', 'controlright']
        };

        // Vérifier les contrôles tactiles
        if (this.touchControls && this.touches[control]) return true;
        
        // Vérifier les contrôles clavier
        const keys = keyMap[control] || [control];
        const keyPressed = keys.some(key => this.keys[key] || this.keys[key.toLowerCase()]);
        
        // Vérifier la manette de jeu
        const gamepad = this.getGamepadInput();
        if (gamepad) {
            switch(control) {
                case 'up': return keyPressed || gamepad.leftStick.y < -0.5 || gamepad.buttons[12];
                case 'down': return keyPressed || gamepad.leftStick.y > 0.5 || gamepad.buttons[13];
                case 'left': return keyPressed || gamepad.leftStick.x < -0.5 || gamepad.buttons[14];
                case 'right': return keyPressed || gamepad.leftStick.x > 0.5 || gamepad.buttons[15];
                case 'action': return keyPressed || gamepad.buttons[0]; // A
                case 'jump': return keyPressed || gamepad.buttons[1]; // B
                case 'boost': return keyPressed || gamepad.buttons[5]; // RT
                case 'brake': return keyPressed || gamepad.buttons[4]; // LT
            }
        }
        
        return keyPressed;
    }

    getAnalogInput(control) {
        const gamepad = this.getGamepadInput();
        if (!gamepad) return 0;
        
        switch(control) {
            case 'horizontal': return gamepad.leftStick.x;
            case 'vertical': return gamepad.leftStick.y;
            case 'camera-x': return gamepad.rightStick.x;
            case 'camera-y': return gamepad.rightStick.y;
            default: return 0;
        }
    }

    createVirtualControls() {
        if (!this.touchControls) return;

        const controlsHTML = `
            <div id="virtual-controls">
                <div class="dpad-container">
                    <div class="dpad">
                        <button data-control="up" class="btn-up">
                            <span class="btn-icon">▲</span>
                        </button>
                        <button data-control="left" class="btn-left">
                            <span class="btn-icon">◀</span>
                        </button>
                        <button data-control="down" class="btn-down">
                            <span class="btn-icon">▼</span>
                        </button>
                        <button data-control="right" class="btn-right">
                            <span class="btn-icon">▶</span>
                        </button>
                        <div class="dpad-center"></div>
                    </div>
                </div>
                <div class="action-buttons">
                    <button data-control="boost" class="btn-boost">
                        <span class="btn-label">BOOST</span>
                    </button>
                    <button data-control="action" class="btn-action">
                        <span class="btn-label">A</span>
                    </button>
                    <button data-control="jump" class="btn-jump">
                        <span class="btn-label">B</span>
                    </button>
                </div>
                <button id="back-to-menu" class="back-btn">
                    <span class="back-icon">🏠</span>
                </button>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', controlsHTML);
        this.addVirtualControlsCSS();
        this.setupVirtualControlsEvents();
    }

    setupVirtualControlsEvents() {
        // Gestionnaire de retour au menu
        const backBtn = document.getElementById('back-to-menu');
        if (backBtn) {
            backBtn.addEventListener('click', () => this.backToMenu());
        }

        // Effets visuels et sonores pour les boutons
        const buttons = document.querySelectorAll('#virtual-controls button');
        buttons.forEach(btn => {
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                btn.classList.add('pressed');
                this.hapticFeedback('light');
            });

            btn.addEventListener('touchend', (e) => {
                e.preventDefault();
                btn.classList.remove('pressed');
            });

            btn.addEventListener('touchcancel', (e) => {
                e.preventDefault();
                btn.classList.remove('pressed');
            });
        });
    }

    addVirtualControlsCSS() {
        const style = document.createElement('style');
        style.textContent = `
            #virtual-controls {
                position: fixed;
                bottom: 8px;
                left: 0;
                right: 0;
                display: flex;
                justify-content: space-between;
                align-items: flex-end;
                padding: 0 12px;
                pointer-events: none;
                z-index: 1000;
                opacity: 0.85;
                transition: opacity 0.3s ease;
            }
            
            #virtual-controls:hover {
                opacity: 1;
            }
            
            .dpad-container, .action-buttons {
                position: relative;
                pointer-events: all;
            }
            
            .dpad {
                position: relative;
                width: 110px;
                height: 110px;
                background: radial-gradient(circle, rgba(15,15,15,0.95) 0%, rgba(5,5,5,0.85) 100%);
                border-radius: 50%;
                border: 2px solid rgba(0,242,254,0.3);
                backdrop-filter: blur(15px);
                -webkit-backdrop-filter: blur(15px);
                box-shadow: 
                    0 6px 20px rgba(0,0,0,0.7),
                    inset 0 2px 5px rgba(255,255,255,0.1),
                    0 0 20px rgba(0,242,254,0.2);
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s ease;
            }
            
            .dpad:active {
                transform: scale(0.98);
                box-shadow: 
                    0 4px 15px rgba(0,0,0,0.8),
                    inset 0 2px 8px rgba(0,0,0,0.3),
                    0 0 25px rgba(0,242,254,0.4);
            }
            
            .dpad-center {
                position: absolute;
                width: 20px;
                height: 20px;
                background: radial-gradient(circle, rgba(0,242,254,0.6) 0%, rgba(0,150,200,0.3) 100%);
                border-radius: 50%;
                border: 1px solid rgba(0,242,254,0.5);
                z-index: 1;
                transition: all 0.2s ease;
            }
            
            .dpad button {
                position: absolute;
                width: 32px;
                height: 32px;
                border: none;
                border-radius: 8px;
                background: linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(220,220,220,0.8) 100%);
                color: #333;
                font-size: 14px;
                font-weight: bold;
                user-select: none;
                touch-action: manipulation;
                box-shadow: 
                    0 3px 8px rgba(0,0,0,0.4),
                    inset 0 1px 2px rgba(255,255,255,0.3);
                transition: all 0.1s ease;
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 2;
            }
            
            .dpad button:active,
            .dpad button.pressed {
                background: linear-gradient(135deg, rgba(0,242,254,0.9) 0%, rgba(0,180,230,0.8) 100%);
                color: white;
                transform: scale(0.95) translateZ(0);
                box-shadow: 
                    0 1px 4px rgba(0,242,254,0.6),
                    inset 0 1px 3px rgba(0,0,0,0.2);
            }
            
            .btn-up { top: 6px; left: 39px; }
            .btn-down { bottom: 6px; left: 39px; }
            .btn-left { top: 39px; left: 6px; }
            .btn-right { top: 39px; right: 6px; }
            
            .btn-icon {
                font-size: 16px;
                text-shadow: 0 1px 2px rgba(0,0,0,0.3);
            }
            
            .action-buttons {
                display: flex;
                flex-direction: column;
                gap: 8px;
                align-items: center;
            }
            
            .action-buttons button {
                width: 50px;
                height: 50px;
                border-radius: 50%;
                border: 2px solid rgba(255,255,255,0.2);
                user-select: none;
                touch-action: manipulation;
                backdrop-filter: blur(12px);
                -webkit-backdrop-filter: blur(12px);
                transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
                display: flex;
                align-items: center;
                justify-content: center;
                position: relative;
                overflow: hidden;
            }
            
            .btn-action {
                background: linear-gradient(135deg, rgba(255,65,54,0.9) 0%, rgba(220,38,38,0.8) 100%);
                box-shadow: 
                    0 4px 12px rgba(255,65,54,0.4),
                    inset 0 1px 3px rgba(255,255,255,0.2);
            }
            
            .btn-jump {
                background: linear-gradient(135deg, rgba(34,197,94,0.9) 0%, rgba(22,163,74,0.8) 100%);
                box-shadow: 
                    0 4px 12px rgba(34,197,94,0.4),
                    inset 0 1px 3px rgba(255,255,255,0.2);
            }
            
            .btn-boost {
                background: linear-gradient(135deg, rgba(168,85,247,0.9) 0%, rgba(139,69,209,0.8) 100%);
                box-shadow: 
                    0 4px 12px rgba(168,85,247,0.4),
                    inset 0 1px 3px rgba(255,255,255,0.2);
                width: 45px;
                height: 30px;
                border-radius: 15px;
                margin-bottom: 5px;
            }
            
            .action-buttons button:active,
            .action-buttons button.pressed {
                transform: scale(0.92) translateZ(0);
                box-shadow: 
                    0 2px 6px rgba(0,0,0,0.4),
                    inset 0 1px 4px rgba(0,0,0,0.2);
            }
            
            .btn-label {
                color: white;
                font-size: 12px;
                font-weight: bold;
                text-shadow: 0 1px 2px rgba(0,0,0,0.5);
                letter-spacing: 0.5px;
            }
            
            .back-btn {
                position: fixed;
                top: 12px;
                right: 12px;
                width: 42px;
                height: 42px;
                border-radius: 50%;
                border: 2px solid rgba(255,255,255,0.3);
                background: linear-gradient(135deg, rgba(15,15,15,0.95) 0%, rgba(5,5,5,0.85) 100%);
                color: white;
                font-size: 16px;
                cursor: pointer;
                backdrop-filter: blur(15px);
                -webkit-backdrop-filter: blur(15px);
                box-shadow: 
                    0 4px 15px rgba(0,0,0,0.6),
                    inset 0 1px 3px rgba(255,255,255,0.1);
                transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                z-index: 1001;
                opacity: 0.9;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .back-btn:hover {
                opacity: 1;
                transform: scale(1.05);
                box-shadow: 
                    0 6px 20px rgba(0,0,0,0.7),
                    0 0 20px rgba(168,85,247,0.3);
            }
            
            .back-btn:active {
                background: linear-gradient(135deg, rgba(168,85,247,0.9) 0%, rgba(139,69,209,0.8) 100%);
                transform: scale(0.95);
                box-shadow: 
                    0 2px 8px rgba(168,85,247,0.6),
                    inset 0 1px 4px rgba(0,0,0,0.2);
            }
            
            .back-icon {
                font-size: 18px;
                filter: drop-shadow(0 1px 2px rgba(0,0,0,0.5));
            }
            
            /* Animations d'entrée */
            @keyframes controlsSlideIn {
                0% {
                    opacity: 0;
                    transform: translateY(50px);
                }
                100% {
                    opacity: 0.85;
                    transform: translateY(0);
                }
            }
            
            #virtual-controls {
                animation: controlsSlideIn 0.5s ease-out;
            }
            
            /* Responsive pour très petits écrans */
            @media (max-width: 360px) {
                .dpad {
                    width: 95px;
                    height: 95px;
                }
                .dpad button {
                    width: 28px;
                    height: 28px;
                }
                .btn-up { top: 5px; left: 33px; }
                .btn-down { bottom: 5px; left: 33px; }
                .btn-left { top: 33px; left: 5px; }
                .btn-right { top: 33px; right: 5px; }
                .action-buttons button {
                    width: 45px;
                    height: 45px;
                }
                .btn-boost {
                    width: 40px;
                    height: 25px;
                }
            }
            
            @media (max-width: 768px) {
                .back-btn {
                    display: flex;
                }
                #virtual-controls {
                    display: flex;
                }
            }
            
            @media (min-width: 769px) {
                .back-btn { 
                    display: none; 
                }
                #virtual-controls { 
                    display: none; 
                }
            }
        `;
        document.head.appendChild(style);
    }

    showControlHelp(controls = []) {
        // Afficher une aide contextuelle pour les contrôles
        const helpHTML = `
            <div id="control-help" class="control-help">
                <div class="help-header">Contrôles disponibles</div>
                <div class="help-content">
                    ${controls.map(control => `
                        <div class="help-item">
                            <span class="help-key">${control.key}</span>
                            <span class="help-action">${control.action}</span>
                        </div>
                    `).join('')}
                </div>
                <div class="help-footer">Appuyez sur H pour masquer/afficher</div>
            </div>
        `;

        // Supprimer l'aide existante
        const existingHelp = document.getElementById('control-help');
        if (existingHelp) existingHelp.remove();

        // Ajouter la nouvelle aide
        document.body.insertAdjacentHTML('beforeend', helpHTML);
        
        // Ajouter les styles
        this.addControlHelpCSS();

        // Auto-masquer après 5 secondes
        setTimeout(() => {
            const help = document.getElementById('control-help');
            if (help) help.classList.add('hidden');
        }, 5000);
    }

    addControlHelpCSS() {
        if (document.getElementById('control-help-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'control-help-styles';
        style.textContent = `
            .control-help {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(0,0,0,0.9);
                backdrop-filter: blur(15px);
                border: 1px solid rgba(0,242,254,0.3);
                border-radius: 15px;
                padding: 20px;
                max-width: 300px;
                z-index: 2000;
                opacity: 1;
                transition: all 0.3s ease;
                box-shadow: 0 10px 30px rgba(0,0,0,0.7);
            }
            
            .control-help.hidden {
                opacity: 0;
                pointer-events: none;
                transform: translate(-50%, -50%) scale(0.9);
            }
            
            .help-header {
                color: #00f2fe;
                font-size: 16px;
                font-weight: bold;
                margin-bottom: 15px;
                text-align: center;
                text-shadow: 0 0 10px rgba(0,242,254,0.5);
            }
            
            .help-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 8px;
                padding: 5px 0;
                border-bottom: 1px solid rgba(255,255,255,0.1);
            }
            
            .help-key {
                background: rgba(255,255,255,0.1);
                padding: 4px 8px;
                border-radius: 6px;
                font-family: monospace;
                font-size: 12px;
                color: #00f2fe;
                min-width: 60px;
                text-align: center;
            }
            
            .help-action {
                color: #fff;
                font-size: 14px;
                flex: 1;
                margin-left: 10px;
            }
            
            .help-footer {
                color: rgba(255,255,255,0.6);
                font-size: 12px;
                text-align: center;
                margin-top: 15px;
                font-style: italic;
            }
        `;
        document.head.appendChild(style);
    }

    toggleControlHelp() {
        const help = document.getElementById('control-help');
        if (help) {
            help.classList.toggle('hidden');
        }
    }
    
    cleanup() {
        // Supprimer tous les event listeners
        document.removeEventListener('keydown', this.handleKeyDown);
        document.removeEventListener('keyup', this.handleKeyUp);
        
        // Supprimer les event listeners tactiles
        const canvas = document.getElementById('gameCanvas');
        if (canvas) {
            canvas.removeEventListener('touchstart', this.handleTouchStart);
            canvas.removeEventListener('touchend', this.handleTouchEnd);
            canvas.removeEventListener('touchmove', this.handleTouchMove);
        }
        
        // Réinitialiser les états des touches
        this.keys = {};
        this.touch = { active: false, x: 0, y: 0 };
    }
    
    backToMenu() {
        // Arrêter tous les timers et nettoyer le jeu
        if (this.gameLoop) {
            cancelAnimationFrame(this.gameLoop);
            this.gameLoop = null;
        }
        
        // Nettoyer les event listeners
        this.cleanup();
        
        // Supprimer les contrôles virtuels
        const virtualControls = document.getElementById('virtual-controls');
        if (virtualControls) {
            virtualControls.remove();
        }
        
        const backButton = document.querySelector('.back-btn');
        if (backButton) {
            backButton.remove();
        }
        
        // Afficher le menu principal et cacher le canvas
        const gameContainer = document.getElementById('game-container');
        const canvas = document.getElementById('gameCanvas');
        const levelSelection = document.querySelector('.level-selection');
        
        if (canvas) {
            canvas.style.display = 'none';
        }
        
        if (levelSelection) {
            levelSelection.style.display = 'block';
        }
        
        // Restaurer le style original du container
        if (gameContainer) {
            gameContainer.style.padding = '';
            gameContainer.style.maxWidth = '';
            gameContainer.style.width = '';
        }
        
        // Réactiver les boutons de sélection de niveau
        const levelButtons = document.querySelectorAll('.level-btn');
        levelButtons.forEach(btn => {
            btn.style.pointerEvents = 'auto';
            btn.disabled = false;
        });
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
        // Gestionnaire pour afficher/masquer l'aide des contrôles
        document.addEventListener('keydown', (e) => {
            if (e.key.toLowerCase() === 'h' && this.gameRunning) {
                this.controls.toggleControlHelp();
            }
        });
    }

    showGameControls(gameSpecificControls = []) {
        // Contrôles de base communs à tous les jeux
        const baseControls = [
            { key: 'Z/W/↑', action: 'Haut' },
            { key: 'S/↓', action: 'Bas' },
            { key: 'Q/A/←', action: 'Gauche' },
            { key: 'D/→', action: 'Droite' },
            { key: 'H', action: 'Aide contrôles' },
            { key: '🏠', action: 'Menu principal' }
        ];

        // Fusionner avec les contrôles spécifiques au jeu
        const allControls = [...baseControls, ...gameSpecificControls];
        this.controls.showControlHelp(allControls);
    }

    start() {
        this.gameRunning = true;
        this.init();
        this.gameLoop();
        
        // Afficher l'aide des contrôles au démarrage
        setTimeout(() => {
            this.showGameControls(this.getGameSpecificControls());
        }, 1000);
    }

    getGameSpecificControls() {
        // À surcharger dans les classes enfants
        return [];
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