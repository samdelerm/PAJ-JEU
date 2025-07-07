class GameManager {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.currentLevel = null;
        this.init();
    }

    init() {
        // Attendre que le DOM soit chargé
        document.addEventListener('DOMContentLoaded', () => {
            this.canvas = document.getElementById('game-canvas');
            if (this.canvas) {
                this.ctx = this.canvas.getContext('2d');
                this.canvas.width = 800;
                this.canvas.height = 600;
                this.setupLevelButtons();
            }
        });
    }

    setupLevelButtons() {
        document.getElementById('level1').addEventListener('click', () => this.startLevel('volleyball'));
        document.getElementById('level2').addEventListener('click', () => this.startLevel('pacman'));
        document.getElementById('level3').addEventListener('click', () => this.startLevel('archery'));
        document.getElementById('level4').addEventListener('click', () => this.startLevel('karting'));
    }

    startLevel(levelType) {
        console.log(`Starting ${levelType}`);
        
        // Arrêter le niveau actuel s'il existe
        if (this.currentLevel && this.currentLevel.stop) {
            this.currentLevel.stop();
        }

        // Créer le nouveau niveau
        switch(levelType) {
            case 'volleyball':
                this.currentLevel = new VolleyballGame(this.canvas, this.ctx);
                break;
            case 'pacman':
                this.currentLevel = new PacmanGame(this.canvas, this.ctx);
                break;
            case 'archery':
                this.currentLevel = new ArcheryGame(this.canvas, this.ctx);
                break;
            case 'karting':
                this.currentLevel = new KartingGame(this.canvas, this.ctx);
                break;
        }

        if (this.currentLevel) {
            this.currentLevel.start();
        }
    }
}

// Initialiser le gestionnaire de jeu
const gameManager = new GameManager();