class VolleyballGame extends BaseGame {
    constructor(canvas, ctx) {
        super(canvas, ctx);
        this.ball = { 
            x: 400, y: 300, vx: 0.5, vy: -0.4, radius: 15, // Vitesses divisées par 2
            trail: [], rotation: 0
        };
        this.player1 = { 
            x: 100, y: 500, width: 40, height: 60, score: 0,
            color: '#FF6B6B', isJumping: false, jumpPower: 0
        };
        this.player2 = { 
            x: 640, y: 500, width: 40, height: 60, score: 0,
            color: '#4ECDC4', isJumping: false, jumpPower: 0
        };
        this.net = { x: 380, y: 420, width: 40, height: 180 };
        this.particles = [];
        this.waves = [];
        this.palmTrees = [
            { x: 50, y: 250, sway: 0 },
            { x: 700, y: 280, sway: 0 }
        ];
        
        this.initWaves();
    }
    // ... (reste du code du jeu volleyball)
}
