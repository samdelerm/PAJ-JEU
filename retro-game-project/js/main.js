class GameManager {
    constructor() {
        this.currentLevel = null;
        this.init();
    }

    init() {
        // Attendre que le DOM soit chargé
        document.addEventListener('DOMContentLoaded', () => {
            this.setupLevelButtons();
        });
    }

    setupLevelButtons() {
        document.getElementById('level1').addEventListener('click', () => this.startLevel('volleyball'));
        document.getElementById('level2').addEventListener('click', () => this.startLevel('pacman'));
        document.getElementById('level4').addEventListener('click', () => this.startLevel('karting'));
    }

    startLevel(levelType) {
        console.log(`Starting ${levelType}`);
        
        // Arrêter le niveau actuel s'il existe
        if (this.currentLevel) {
            if (this.currentLevel.stop) {
                this.currentLevel.stop();
            }
            if (this.currentLevel.cleanup) {
                this.currentLevel.cleanup();
            }
        }

        // Masquer la sélection de niveau et afficher le canvas
        const levelSelection = document.querySelector('.level-selection');
        if (levelSelection) {
            levelSelection.style.display = 'none';
        }
        
        // Créer ou réutiliser le canvas
        let canvas = document.getElementById('gameCanvas');
        if (!canvas) {
            canvas = document.createElement('canvas');
            canvas.id = 'gameCanvas';
            canvas.className = 'game-screen';
            canvas.width = 800;
            canvas.height = 600;
            document.getElementById('game-container').appendChild(canvas);
        }
        
        canvas.style.display = 'block';
        const ctx = canvas.getContext('2d');

        // Créer le nouveau niveau
        switch(levelType) {
            case 'volleyball':
                this.currentLevel = new VolleyballGame(canvas, ctx);
                break;
            case 'pacman':
                this.currentLevel = new PacmanGame(canvas, ctx);
                break;
            case 'karting':
                this.currentLevel = new KartingGame(canvas, ctx);
                break;
        }

        if (this.currentLevel) {
            this.currentLevel.start();
        }
    }
}

// Initialiser le gestionnaire de jeu
const gameManager = new GameManager();