// Gestionnaire d'entrées centralisé pour tous les jeux
class InputManager {
    constructor() {
        this.keys = {};
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
            this.keys[e.code] = true;
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
            this.keys[e.code] = false;
        });
    }

    isKeyPressed(key) {
        return this.keys[key] || false;
    }

    isAnyKeyPressed(keys) {
        return keys.some(key => this.isKeyPressed(key));
    }
}

// Instance globale
const inputManager = new InputManager();