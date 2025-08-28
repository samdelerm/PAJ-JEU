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
        this.deadZone = 0.1; // Zone morte réduite pour plus de réactivité
        this.touchSensitivity = 2.0; // Sensibilité tactile augmentée
        this.touchThreshold = 15; // Seuil de détection plus bas
        this.lastTouchTime = 0;
        this.touchDebounce = 16; // ~60fps
        
        // Support du joystick analogique
        this.joystickState = {
            active: false,
            center: { x: 0, y: 0 },
            current: { x: 0, y: 0 },
            intensity: { x: 0, y: 0 },
            maxRadius: 50
        };
        
        // Référence pour les contrôles analogiques (accessible aux jeux)
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

        // Contrôles tactiles optimisés pour la performance
        const touchOptions = { passive: false, capture: true };
        document.addEventListener('touchstart', (e) => this.handleTouch(e, true), touchOptions);
        document.addEventListener('touchend', (e) => this.handleTouch(e, false), touchOptions);
        document.addEventListener('touchmove', (e) => this.handleTouchMove(e), touchOptions);
        document.addEventListener('touchcancel', (e) => this.handleTouch(e, false), touchOptions);
        
        // Désactiver les gestes par défaut qui peuvent interférer
        document.addEventListener('gesturestart', (e) => e.preventDefault(), { passive: false });
        document.addEventListener('gesturechange', (e) => e.preventDefault(), { passive: false });
        document.addEventListener('gestureend', (e) => e.preventDefault(), { passive: false });
        
        // Désactiver le menu contextuel sur les contrôles
        document.addEventListener('contextmenu', (e) => {
            if (e.target.closest('#virtual-controls')) {
                e.preventDefault();
            }
        });
        
        // Optimisations pour les appareils mobiles
        if (this.touchControls) {
            document.body.style.touchAction = 'none';
            document.body.style.userSelect = 'none';
            document.body.style.webkitUserSelect = 'none';
            document.body.style.webkitTouchCallout = 'none';
        }
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
        e.stopPropagation();
        
        // Traitement immédiat pour améliorer la réactivité sur Android
        const processTouches = () => {
            for (let touch of e.changedTouches) {
                // Utiliser des coordonnées plus précises
                const rect = document.documentElement.getBoundingClientRect();
                const x = touch.clientX - rect.left;
                const y = touch.clientY - rect.top;
                
                // Méthode plus robuste pour détecter l'élément touché
                let element = document.elementFromPoint(touch.clientX, touch.clientY);
                
                // Si pas d'élément direct, chercher dans un rayon plus large
                if (!element || !element.dataset?.control) {
                    const radius = 25; // Rayon de recherche élargi
                    for (let offsetX = -radius; offsetX <= radius; offsetX += 10) {
                        for (let offsetY = -radius; offsetY <= radius; offsetY += 10) {
                            const testElement = document.elementFromPoint(
                                touch.clientX + offsetX, 
                                touch.clientY + offsetY
                            );
                            if (testElement?.dataset?.control) {
                                element = testElement;
                                break;
                            }
                        }
                        if (element?.dataset?.control) break;
                    }
                }
                
                if (element && element.dataset && element.dataset.control) {
                    const control = element.dataset.control;
                    
                    // Mise à jour immédiate de l'état
                    this.touches[control] = isPressed;
                    
                    // Stockage de la position pour les gestes
                    if (isPressed) {
                        this.touchPositions[touch.identifier] = {
                            x: touch.clientX,
                            y: touch.clientY,
                            control: control,
                            timestamp: performance.now()
                        };
                        
                        // Feedback visuel et haptique immédiat
                        element.classList.add('pressed');
                        element.style.transform = 'scale(0.95) translateZ(0)';
                        this.hapticFeedback('light');
                    } else {
                        // Nettoyage des données de touch
                        delete this.touchPositions[touch.identifier];
                        element.classList.remove('pressed');
                        element.style.transform = '';
                    }
                }
            }
        };
        
        // Exécution immédiate pour Android
        processTouches();
    }

    handleTouchMove(e) {
        e.preventDefault();
        e.stopPropagation();
        
        // Traitement optimisé des mouvements avec support joystick analogique
        for (let touch of e.changedTouches) {
            const touchData = this.touchPositions[touch.identifier];
            if (touchData) {
                const deltaX = touch.clientX - touchData.x;
                const deltaY = touch.clientY - touchData.y;
                const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
                
                // Mise à jour du joystick analogique si c'est un contrôle directionnel
                if (touchData.control === 'left' || touchData.control === 'right' || 
                    touchData.control === 'up' || touchData.control === 'down') {
                    
                    this.updateJoystickAnalog(touchData, touch, deltaX, deltaY, distance);
                }
                
                // Seuil plus bas pour des gestes plus réactifs
                if (distance > 20) {
                    const angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI;
                    this.handleSwipeGesture(angle, distance);
                }
                
                // Vérifier si le doigt est toujours sur le bon élément
                const currentElement = document.elementFromPoint(touch.clientX, touch.clientY);
                if (currentElement && currentElement.dataset.control) {
                    const newControl = currentElement.dataset.control;
                    if (newControl !== touchData.control) {
                        // Désactiver l'ancien contrôle
                        this.touches[touchData.control] = false;
                        document.querySelector(`[data-control="${touchData.control}"]`)?.classList.remove('pressed');
                        
                        // Activer le nouveau contrôle
                        this.touches[newControl] = true;
                        currentElement.classList.add('pressed');
                        touchData.control = newControl;
                    }
                } else {
                    // Le doigt a quitté la zone de contrôle
                    this.touches[touchData.control] = false;
                    document.querySelector(`[data-control="${touchData.control}"]`)?.classList.remove('pressed');
                }
            }
        }
    }

    updateJoystickAnalog(touchData, touch, deltaX, deltaY, distance) {
        // Calculer l'intensité analogique basée sur la distance du centre
        const maxDistance = 50; // Distance maximale pour l'intensité complète
        const normalizedDistance = Math.min(distance / maxDistance, 1.0);
        
        // Calculer l'intensité avec courbe de réponse
        const intensityX = Math.sign(deltaX) * Math.pow(Math.abs(deltaX) / maxDistance, 0.8);
        const intensityY = Math.sign(deltaY) * Math.pow(Math.abs(deltaY) / maxDistance, 0.8);
        
        // Appliquer une zone morte
        const deadZone = 0.15;
        const clampedX = Math.abs(intensityX) > deadZone ? intensityX : 0;
        const clampedY = Math.abs(intensityY) > deadZone ? intensityY : 0;
        
        // Mettre à jour l'état du joystick
        this.touchJoystick.active = normalizedDistance > deadZone;
        this.touchJoystick.intensity = {
            x: Math.max(-1, Math.min(1, clampedX)),
            y: Math.max(-1, Math.min(1, clampedY))
        };
        
        this.joystickState.active = this.touchJoystick.active;
        this.joystickState.center = { x: touchData.x, y: touchData.y };
        this.joystickState.current = { x: touch.clientX, y: touch.clientY };
        this.joystickState.intensity = this.touchJoystick.intensity;
    }

    handleSwipeGesture(angle, distance) {
        const intensity = Math.min(distance / 50, 2); // Plus réactif
        const now = performance.now();
        
        // Éviter les gestes trop rapprochés
        if (now - this.lastTouchTime < this.touchDebounce) return;
        this.lastTouchTime = now;
        
        // Réinitialiser tous les gestes précédents
        this.touches['swipe-up'] = false;
        this.touches['swipe-down'] = false;
        this.touches['swipe-left'] = false;
        this.touches['swipe-right'] = false;
        
        // Détection plus précise des directions
        if (angle >= -30 && angle <= 30) {
            this.touches['swipe-right'] = intensity;
            this.hapticFeedback('light');
        } else if (angle >= 60 && angle <= 120) {
            this.touches['swipe-down'] = intensity;
            this.hapticFeedback('light');
        } else if (angle >= 150 || angle <= -150) {
            this.touches['swipe-left'] = intensity;
            this.hapticFeedback('light');
        } else if (angle >= -120 && angle <= -60) {
            this.touches['swipe-up'] = intensity;
            this.hapticFeedback('light');
        }
        
        // Auto-reset après un court délai
        setTimeout(() => {
            this.touches['swipe-up'] = false;
            this.touches['swipe-down'] = false;
            this.touches['swipe-left'] = false;
            this.touches['swipe-right'] = false;
        }, 100);
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
        
        // Limiter la fréquence des vibrations pour éviter les ralentissements
        const now = performance.now();
        if (now - (this.lastHapticTime || 0) < 50) return;
        this.lastHapticTime = now;
        
        const patterns = {
            light: 5,     // Plus court et plus léger
            medium: 10,   // Réduit de [10,10,10] à 10
            strong: 20    // Réduit de [50,30,50] à 20
        };
        
        try {
            navigator.vibrate(patterns[intensity] || patterns.medium);
        } catch (e) {
            // Silencieusement ignorer les erreurs de vibration
        }
    }

    isPressed(control) {
        // Optimisation : vérifier d'abord les contrôles tactiles (plus fréquents sur mobile)
        if (this.touchControls) {
            // Vérification directe des contrôles tactiles
            if (this.touches[control]) return true;
            
            // Vérification des gestes swipe
            switch(control) {
                case 'up': return this.touches['up'] || this.touches['swipe-up'];
                case 'down': return this.touches['down'] || this.touches['swipe-down'];
                case 'left': return this.touches['left'] || this.touches['swipe-left'];
                case 'right': return this.touches['right'] || this.touches['swipe-right'];
                case 'jump': return this.touches['action'] || this.touches['jump']; // Unifier jump et action
            }
        }
        
        // Mapping étendu des contrôles clavier (cache statique pour performance)
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
        
        // Vérification des contrôles clavier
        const keySet = this.keyMapCache[control];
        if (keySet) {
            for (const key of keySet) {
                if (this.keys[key] || this.keys[key.toLowerCase()]) {
                    return true;
                }
            }
        }
        
        // Vérification de la manette de jeu (si nécessaire)
        const gamepad = this.getGamepadInput();
        if (gamepad) {
            switch(control) {
                case 'up': return gamepad.leftStick.y < -0.3 || gamepad.buttons[12];
                case 'down': return gamepad.leftStick.y > 0.3 || gamepad.buttons[13];
                case 'left': return gamepad.leftStick.x < -0.3 || gamepad.buttons[14];
                case 'right': return gamepad.leftStick.x > 0.3 || gamepad.buttons[15];
                case 'action': return gamepad.buttons[0]; // A
                case 'jump': return gamepad.buttons[1]; // B
                case 'boost': return gamepad.buttons[5]; // RT
                case 'brake': return gamepad.buttons[4]; // LT
            }
        }
        
        return false;
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
                    <div class="dpad" id="analog-joystick">
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
                        <div class="dpad-center" id="joystick-knob"></div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', controlsHTML);
        this.addVirtualControlsCSS();
        // Ne pas appeler setupVirtualControlsEvents car il n'y a plus de boutons à gérer
    }

    setupVirtualControlsEvents() {
        // Gestionnaire de retour au menu
        const backBtn = document.getElementById('back-to-menu');
        if (backBtn) {
            backBtn.addEventListener('click', () => this.backToMenu());
        }

        // Support du joystick analogique sur le D-Pad
        const dpad = document.getElementById('analog-joystick');
        if (dpad) {
            this.setupAnalogJoystick(dpad);
        }

        // Effets visuels et sonores pour les boutons
        const buttons = document.querySelectorAll('#virtual-controls button[data-control]');
        buttons.forEach(btn => {
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.touches[btn.dataset.control] = true;
                btn.classList.add('pressed');
                this.hapticFeedback('light');
            });

            btn.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.touches[btn.dataset.control] = false;
                btn.classList.remove('pressed');
            });

            btn.addEventListener('touchcancel', (e) => {
                e.preventDefault();
                this.touches[btn.dataset.control] = false;
                btn.classList.remove('pressed');
            });
        });
    }

    setupAnalogJoystick(dpad) {
        const knob = document.getElementById('joystick-knob');
        let isActive = false;
        let centerX = 0;
        let centerY = 0;

        const startJoystick = (e) => {
            e.preventDefault();
            const rect = dpad.getBoundingClientRect();
            centerX = rect.left + rect.width / 2;
            centerY = rect.top + rect.height / 2;
            
            isActive = true;
            this.touchJoystick.active = true;
            this.touchJoystick.isDPadControl = true;
            
            dpad.style.transform = 'scale(1.05)';
            this.hapticFeedback('medium');
        };

        const moveJoystick = (e) => {
            if (!isActive) return;
            e.preventDefault();

            const touch = e.touches ? e.touches[0] : e;
            const deltaX = touch.clientX - centerX;
            const deltaY = touch.clientY - centerY;
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            
            const maxDistance = 45; // Rayon maximum du joystick
            const clampedDistance = Math.min(distance, maxDistance);
            
            // Calculer l'intensité analogique
            const intensityX = deltaX / maxDistance;
            const intensityY = deltaY / maxDistance;
            
            // Appliquer zone morte
            const deadZone = 0.15;
            this.touchJoystick.intensity.x = Math.abs(intensityX) > deadZone ? intensityX : 0;
            this.touchJoystick.intensity.y = Math.abs(intensityY) > deadZone ? intensityY : 0;
            
            // Déplacer visuellement le knob
            const knobX = (deltaX / maxDistance) * 30;
            const knobY = (deltaY / maxDistance) * 30;
            knob.style.transform = `translate(${knobX}px, ${knobY}px)`;
            
            // Mettre à jour les contrôles digitaux aussi
            this.touches.left = this.touchJoystick.intensity.x < -0.3;
            this.touches.right = this.touchJoystick.intensity.x > 0.3;
            this.touches.up = this.touchJoystick.intensity.y < -0.3;
            this.touches.down = this.touchJoystick.intensity.y > 0.3;
        };

        const endJoystick = (e) => {
            if (!isActive) return;
            e.preventDefault();
            
            isActive = false;
            this.touchJoystick.active = false;
            this.touchJoystick.isDPadControl = false;
            this.touchJoystick.intensity = { x: 0, y: 0 };
            
            // Reset visuel
            dpad.style.transform = '';
            knob.style.transform = '';
            
            // Reset contrôles digitaux
            this.touches.left = false;
            this.touches.right = false;
            this.touches.up = false;
            this.touches.down = false;
        };

        // Événements tactiles
        dpad.addEventListener('touchstart', startJoystick, { passive: false });
        dpad.addEventListener('touchmove', moveJoystick, { passive: false });
        dpad.addEventListener('touchend', endJoystick, { passive: false });
        
        // Événements souris pour les tests
        dpad.addEventListener('mousedown', startJoystick);
        document.addEventListener('mousemove', moveJoystick);
        document.addEventListener('mouseup', endJoystick);
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
                opacity: 0.9; /* Plus visible sur Android */
                transition: opacity 0.3s ease;
                /* Optimisations pour les performances tactiles */
                touch-action: none;
                user-select: none;
                -webkit-user-select: none;
                -webkit-touch-callout: none;
                will-change: transform;
            }
            
            #virtual-controls:hover {
                opacity: 1;
            }
            
            .dpad-container, .action-buttons {
                position: relative;
                pointer-events: all;
                /* Optimisations tactiles */
                touch-action: none;
                will-change: transform;
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
                transition: transform 0.1s ease; /* Transition plus rapide */
                /* Optimisations tactiles */
                touch-action: none;
                will-change: transform;
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
                background: radial-gradient(circle, rgba(0,242,254,0.8) 0%, rgba(0,150,200,0.5) 100%);
                border-radius: 50%;
                border: 1px solid rgba(0,242,254,0.8);
                z-index: 2;
                transition: all 0.1s ease;
                left: 50%;
                top: 50%;
                transform: translate(-50%, -50%);
                pointer-events: none;
                box-shadow: 0 0 10px rgba(0,242,254,0.5);
            }
            
            #analog-joystick {
                position: relative;
                overflow: visible;
            }
            
            #joystick-knob {
                position: absolute;
                width: 25px;
                height: 25px;
                background: radial-gradient(circle, rgba(0,242,254,0.9) 0%, rgba(0,150,200,0.7) 100%);
                border-radius: 50%;
                border: 2px solid rgba(255,255,255,0.8);
                z-index: 3;
                left: 50%;
                top: 50%;
                transform: translate(-50%, -50%);
                pointer-events: none;
                box-shadow: 
                    0 0 15px rgba(0,242,254,0.6),
                    inset 0 2px 5px rgba(255,255,255,0.3);
                transition: box-shadow 0.1s ease;
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
                transition: all 0.05s ease; /* Très rapide pour la réactivité */
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 2;
                /* Optimisations pour les performances */
                transform: translateZ(0); /* Force l'accélération matérielle */
                will-change: transform, background;
                cursor: pointer;
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
                pointer-events: none;
            }
            
            .action-buttons {
                display: flex;
                flex-direction: column;
                gap: 8px;
                align-items: center;
                justify-content: center;
            }
            
            .action-buttons button {
                width: 60px;
                height: 60px;
                border-radius: 50%;
                border: 2px solid rgba(255,255,255,0.2);
                user-select: none;
                touch-action: manipulation;
                backdrop-filter: blur(12px);
                -webkit-backdrop-filter: blur(12px);
                transition: all 0.05s cubic-bezier(0.4, 0, 0.2, 1);
                display: flex;
                align-items: center;
                justify-content: center;
                position: relative;
                overflow: hidden;
                /* Optimisations pour les performances */
                transform: translateZ(0);
                will-change: transform, background;
                cursor: pointer;
            }
            
            .btn-action {
                background: linear-gradient(135deg, rgba(34,197,94,0.9) 0%, rgba(22,163,74,0.8) 100%);
                box-shadow: 
                    0 4px 12px rgba(34,197,94,0.4),
                    inset 0 1px 3px rgba(255,255,255,0.2);
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
                pointer-events: none;
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
                    width: 55px;
                    height: 55px;
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