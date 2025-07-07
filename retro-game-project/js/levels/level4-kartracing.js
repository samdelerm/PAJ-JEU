class KartingGame extends BaseGame {
    constructor(canvas, ctx) {
        super(canvas, ctx);
        
        // Joueur
        this.player = {
            x: 150, y: 280, width: 28, height: 16,
            vx: 0, vy: 0, angle: 0, speed: 0,
            maxSpeed: 12, acceleration: 0.4, friction: 0.92,
            color: '#FF4444', name: 'JOUEUR', trail: [],
            boost: 0, shield: 0, lap: 1, checkpointIndex: 0,
            lapTime: 0, bestLap: Infinity, position: 1
        };
        
        // Adversaires IA
        this.opponents = [];
        this.numOpponents = 3;
        
        // Circuit et éléments
        this.track = [];
        this.obstacles = [];
        this.powerUps = [];
        this.particles = [];
        this.checkpoints = [];
        this.raceCircuit = [];
        
        // État de la course
        this.raceState = 'waiting'; // waiting, countdown, racing, finished
        this.countdown = 3;
        this.countdownTimer = 0;
        this.raceTime = 0;
        this.totalLaps = 3;
        this.raceFinished = false;
        this.finalPositions = [];
        
        // Caméra
        this.camera = { x: 0, y: 0 };
        this.trackWidth = 1000;
        this.trackHeight = 800;
        
        this.initRace();
    }

    initRace() {
        this.createCircuit();
        this.createCheckpoints();
        this.createOpponents();
        this.createPowerUps();
        this.createObstacles();
        this.createAmbientParticles();
        this.startCountdown();
    }

    createCircuit() {
        // Circuit façon Mario Kart - plus complexe et fun
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        // Points du circuit avec des courbes plus intéressantes
        this.raceCircuit = [
            { x: 150, y: 280 }, // Start/Finish
            { x: 200, y: 150 }, // Premier virage
            { x: 400, y: 100 }, // Ligne droite haute
            { x: 650, y: 150 }, // Virage serré
            { x: 700, y: 300 }, // Descente
            { x: 650, y: 450 }, // Virage bas
            { x: 400, y: 500 }, // Ligne droite basse
            { x: 200, y: 450 }, // Retour
            { x: 150, y: 350 }  // Approche finale
        ];
        
        // Créer les murs du circuit
        this.track = [
            // Bordures extérieures
            { x: 30, y: 30, width: this.canvas.width - 60, height: 15, type: 'wall' },
            { x: 30, y: this.canvas.height - 45, width: this.canvas.width - 60, height: 15, type: 'wall' },
            { x: 30, y: 30, width: 15, height: this.canvas.height - 60, type: 'wall' },
            { x: this.canvas.width - 45, y: 30, width: 15, height: this.canvas.height - 60, type: 'wall' },
            
            // Obstacles du circuit
            { x: 320, y: 120, width: 80, height: 15, type: 'wall' },
            { x: 500, y: 120, width: 15, height: 80, type: 'wall' },
            { x: 320, y: 460, width: 80, height: 15, type: 'wall' },
            { x: 180, y: 350, width: 15, height: 80, type: 'wall' },
            
            // Chicanes pour rendre la course plus technique
            { x: 250, y: 200, width: 20, height: 40, type: 'chicane' },
            { x: 280, y: 240, width: 20, height: 40, type: 'chicane' },
            { x: 550, y: 350, width: 20, height: 40, type: 'chicane' },
            { x: 520, y: 390, width: 20, height: 40, type: 'chicane' }
        ];
    }

    createCheckpoints() {
        // Checkpoints mieux positionnés sur le nouveau circuit
        this.checkpoints = [
            { x: 180, y: 140, width: 60, height: 20, index: 0 }, // Après premier virage
            { x: 450, y: 80, width: 60, height: 20, index: 1 },  // Ligne droite haute
            { x: 680, y: 280, width: 20, height: 60, index: 2 }, // Virage serré
            { x: 450, y: 480, width: 60, height: 20, index: 3 }, // Ligne droite basse
            { x: 180, y: 360, width: 20, height: 60, index: 4 }, // Avant ligne d'arrivée
            { x: 120, y: 260, width: 60, height: 40, index: 5 }  // Ligne d'arrivée
        ];
    }

    createOpponents() {
        const opponentData = [
            { name: 'BOWSER', color: '#8B4513', skill: 0.8, aggression: 0.9 },
            { name: 'PEACH', color: '#FFB6C1', skill: 0.7, aggression: 0.3 },
            { name: 'YOSHI', color: '#32CD32', skill: 0.9, aggression: 0.6 },
            { name: 'LUIGI', color: '#00AA00', skill: 0.6, aggression: 0.4 }
        ];
        
        this.opponents = [];
        for (let i = 0; i < this.numOpponents; i++) {
            const data = opponentData[i];
            
            this.opponents.push({
                x: 120 - (i * 30), y: 280 + (i * 25), width: 28, height: 16,
                vx: 0, vy: 0, angle: 0, speed: 0,
                maxSpeed: 8 + data.skill * 4, 
                acceleration: 0.3 + data.skill * 0.2, 
                friction: 0.92,
                color: data.color, name: data.name, trail: [],
                boost: 0, shield: 0, lap: 1, checkpointIndex: 0,
                position: i + 2,
                skill: data.skill,
                aggression: data.aggression,
                ai: {
                    targetX: 150, targetY: 280,
                    decisionTimer: 0,
                    pathOffset: (Math.random() - 0.5) * 40, // Variation dans la trajectoire
                    overtakeTimer: 0,
                    stuck: 0,
                    lastPos: { x: 0, y: 0 }
                }
            });
        }
    }

    createPowerUps() {
        this.powerUps = [
            // Power-ups stratégiquement placés
            { x: 220, y: 180, width: 20, height: 20, type: 'boost', color: '#FFD700', collected: false, pulse: 0, respawnTime: 0 },
            { x: 480, y: 130, width: 20, height: 20, type: 'lightning', color: '#FFFF00', collected: false, pulse: 0, respawnTime: 0 },
            { x: 650, y: 320, width: 20, height: 20, type: 'shell', color: '#FF0000', collected: false, pulse: 0, respawnTime: 0 },
            { x: 480, y: 450, width: 20, height: 20, type: 'boost', color: '#FFD700', collected: false, pulse: 0, respawnTime: 0 },
            { x: 250, y: 380, width: 20, height: 20, type: 'shield', color: '#00CED1', collected: false, pulse: 0, respawnTime: 0 },
            { x: 580, y: 250, width: 20, height: 20, type: 'star', color: '#FFB6C1', collected: false, pulse: 0, respawnTime: 0 }
        ];
    }

    createObstacles() {
        this.obstacles = [
            // Cônes et obstacles dynamiques
            { x: 280, y: 160, width: 12, height: 12, type: 'cone', color: '#FF8C00', rotation: 0 },
            { x: 420, y: 200, width: 12, height: 12, type: 'cone', color: '#FF8C00', rotation: 0 },
            { x: 580, y: 380, width: 12, height: 12, type: 'cone', color: '#FF8C00', rotation: 0 },
            { x: 350, y: 420, width: 12, height: 12, type: 'cone', color: '#FF8C00', rotation: 0 },
            
            // Barils roulants
            { x: 500, y: 180, width: 16, height: 16, type: 'barrel', color: '#8B4513', vx: -1, vy: 0, rotation: 0 },
            { x: 300, y: 400, width: 16, height: 16, type: 'barrel', color: '#8B4513', vx: 1, vy: 0, rotation: 0 },
            
            // Flaques d'huile
            { x: 240, y: 300, width: 25, height: 15, type: 'oil', color: '#333333', slipFactor: 0.5 },
            { x: 520, y: 200, width: 25, height: 15, type: 'oil', color: '#333333', slipFactor: 0.5 }
        ];
    }

    createAmbientParticles() {
        this.particles = [];
    }

    startCountdown() {
        this.raceState = 'countdown';
        this.countdown = 3;
        this.countdownTimer = 0;
    }

    update(deltaTime) {
        if (!this.gameRunning) return;
        
        const dt = deltaTime || 16;
        this.time += dt;
        
        switch (this.raceState) {
            case 'countdown':
                this.updateCountdown(dt);
                break;
            case 'racing':
                this.updateRace(dt);
                break;
            case 'finished':
                this.updateFinished(dt);
                break;
        }
        
        this.updateParticles(dt);
        this.updateCamera();
    }

    updateCountdown(deltaTime) {
        this.countdownTimer += deltaTime;
        
        if (this.countdownTimer >= 1000) {
            this.countdown--;
            this.countdownTimer = 0;
            
            if (this.countdown <= 0) {
                this.raceState = 'racing';
                this.raceTime = 0;
            }
        }
    }

    updateRace(deltaTime) {
        this.raceTime += deltaTime;
        
        // Mise à jour du joueur
        this.updatePlayer(deltaTime);
        
        // Mise à jour des adversaires IA
        this.updateOpponents(deltaTime);
        
        // Mise à jour des power-ups
        this.updatePowerUps(deltaTime);
        
        // Vérification des positions
        this.updatePositions();
        
        // Vérification de fin de course
        this.checkRaceFinished();
    }

    updateFinished(deltaTime) {
        // Animation de fin
    }

    updatePlayer(deltaTime) {
        this.handlePlayerInput();
        this.updateKartPhysics(this.player);
        this.checkCollisions(this.player);
        this.checkCheckpoints(this.player);
    }

    handlePlayerInput() {
        if (this.controls.isPressed('up')) {
            this.player.speed = Math.min(this.player.speed + this.player.acceleration, this.player.maxSpeed);
        } else if (this.controls.isPressed('down')) {
            this.player.speed = Math.max(this.player.speed - this.player.acceleration * 1.5, -this.player.maxSpeed * 0.5);
        } else {
            this.player.speed *= this.player.friction;
        }
        
        if (this.controls.isPressed('left') && Math.abs(this.player.speed) > 0.5) {
            this.player.angle -= 0.08;
        }
        if (this.controls.isPressed('right') && Math.abs(this.player.speed) > 0.5) {
            this.player.angle += 0.08;
        }
        
        if (this.controls.isPressed('action') && this.player.boost > 0) {
            this.player.boost -= 1;
            this.player.speed = Math.min(this.player.speed + 0.5, this.player.maxSpeed * 1.4);
        }
    }

    updateOpponents(deltaTime) {
        this.opponents.forEach(opponent => {
            this.updateOpponentAI(opponent);
            this.updateKartPhysics(opponent);
            this.checkCollisions(opponent);
            this.checkCheckpoints(opponent);
        });
    }

    updateOpponentAI(opponent) {
        // IA améliorée façon Mario Kart
        const checkpoint = this.checkpoints[opponent.checkpointIndex];
        if (!checkpoint) return;
        
        // Calcul de la trajectoire optimale avec offset personnel
        let targetX = checkpoint.x + checkpoint.width/2 + opponent.ai.pathOffset;
        let targetY = checkpoint.y + checkpoint.height/2;
        
        // Évitement d'obstacles
        this.obstacles.forEach(obstacle => {
            const dx = obstacle.x - opponent.x;
            const dy = obstacle.y - opponent.y;
            const distance = Math.sqrt(dx*dx + dy*dy);
            
            if (distance < 60) {
                // Dévier la trajectoire pour éviter l'obstacle
                targetX += (dx > 0 ? -30 : 30);
                targetY += (dy > 0 ? -30 : 30);
            }
        });
        
        // Logique de dépassement
        if (opponent.ai.overtakeTimer > 0) {
            opponent.ai.overtakeTimer--;
            targetX += opponent.ai.pathOffset * 2; // Trajectoire plus agressive
        }
        
        // Détection de blocage
        const distFromLastPos = Math.sqrt(
            Math.pow(opponent.x - opponent.ai.lastPos.x, 2) + 
            Math.pow(opponent.y - opponent.ai.lastPos.y, 2)
        );
        
        if (distFromLastPos < 2 && opponent.speed > 0) {
            opponent.ai.stuck++;
            if (opponent.ai.stuck > 30) {
                // Manœuvre de déblocage
                targetX += (Math.random() - 0.5) * 100;
                targetY += (Math.random() - 0.5) * 100;
                opponent.ai.stuck = 0;
            }
        } else {
            opponent.ai.stuck = 0;
        }
        
        opponent.ai.lastPos = { x: opponent.x, y: opponent.y };
        
        // Calcul de l'angle de direction
        const dx = targetX - opponent.x;
        const dy = targetY - opponent.y;
        const targetAngle = Math.atan2(dy, dx);
        
        // Ajustement de l'angle avec intelligence variable
        let angleDiff = targetAngle - opponent.angle;
        while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
        while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
        
        const turnRate = 0.04 + opponent.skill * 0.03;
        if (Math.abs(angleDiff) > 0.1) {
            if (angleDiff > 0) {
                opponent.angle += turnRate;
            } else {
                opponent.angle -= turnRate;
            }
        }
        
        // Gestion de la vitesse selon la situation
        const distanceToTarget = Math.sqrt(dx*dx + dy*dy);
        let targetSpeed = opponent.maxSpeed;
        
        // Ralentir dans les virages serrés
        if (Math.abs(angleDiff) > 0.5) {
            targetSpeed *= 0.7;
        }
        
        // Utilisation des power-ups par l'IA
        if (opponent.boost > 0 && Math.random() < 0.1) {
            opponent.boost -= 5;
            targetSpeed *= 1.3;
        }
        
        // Accélération progressive
        if (opponent.speed < targetSpeed) {
            opponent.speed = Math.min(opponent.speed + opponent.acceleration, targetSpeed);
        } else {
            opponent.speed = Math.max(opponent.speed - opponent.acceleration * 0.5, targetSpeed);
        }
        
        // Comportement agressif pour les personnages comme Bowser
        if (opponent.aggression > 0.7 && Math.random() < 0.05) {
            opponent.ai.overtakeTimer = 60;
        }
    }

    updateKartPhysics(kart) {
        // Réduction temporaire des effets de statut
        if (kart.boost > 0) kart.boost--;
        if (kart.shield > 0) kart.shield--;
        if (kart.lightning > 0) kart.lightning--;
        if (kart.star > 0) kart.star--;
        
        // Application de la physique
        kart.vx = Math.cos(kart.angle) * kart.speed;
        kart.vy = Math.sin(kart.angle) * kart.speed;
        
        kart.x += kart.vx;
        kart.y += kart.vy;
        
        // Effet de l'huile sur la friction
        let currentFriction = kart.friction;
        this.obstacles.forEach(obstacle => {
            if (obstacle.type === 'oil' &&
                kart.x < obstacle.x + obstacle.width && 
                kart.x + kart.width > obstacle.x &&
                kart.y < obstacle.y + obstacle.height && 
                kart.y + kart.height > obstacle.y) {
                currentFriction = 0.98; // Moins de friction sur l'huile
            }
        });
        
        // Effet éclair
        if (kart.lightning > 0) {
            kart.speed *= 0.95; // Ralentissement progressif
        }
        
        // Trail amélioré
        kart.trail.push({ 
            x: kart.x + kart.width/2, 
            y: kart.y + kart.height/2, 
            life: 20,
            boost: kart.boost > 0,
            star: kart.star > 0
        });
        
        if (kart.trail.length > 8) kart.trail.shift();
        
        kart.trail.forEach(point => point.life--);
        kart.trail = kart.trail.filter(point => point.life > 0);
        
        // Garder le kart dans les limites du canvas
        kart.x = Math.max(0, Math.min(kart.x, this.canvas.width - kart.width));
        kart.y = Math.max(0, Math.min(kart.y, this.canvas.height - kart.height));
    }

    checkCollisions(kart) {
        // Collision avec les murs
        this.track.forEach(wall => {
            if (kart.x < wall.x + wall.width && 
                kart.x + kart.width > wall.x &&
                kart.y < wall.y + wall.height && 
                kart.y + kart.height > wall.y) {
                
                // Rebond plus réaliste
                kart.x -= kart.vx * 1.5;
                kart.y -= kart.vy * 1.5;
                kart.speed *= -0.4;
                
                // Effet visuel de collision
                this.createCollisionEffect(kart.x, kart.y);
            }
        });

        // Collision avec obstacles
        this.obstacles.forEach(obstacle => {
            if (kart.x < obstacle.x + obstacle.width && 
                kart.x + kart.width > obstacle.x &&
                kart.y < obstacle.y + obstacle.height && 
                kart.y + kart.height > obstacle.y) {
                
                if (obstacle.type === 'oil') {
                    // Effet de glisse sur l'huile
                    kart.friction *= obstacle.slipFactor;
                    kart.angle += (Math.random() - 0.5) * 0.3;
                } else {
                    // Collision normale
                    kart.x -= kart.vx;
                    kart.y -= kart.vy;
                    kart.speed *= 0.3;
                    
                    if (obstacle.type === 'barrel') {
                        // Faire bouger le baril
                        obstacle.vx = kart.vx * 0.5;
                        obstacle.vy = kart.vy * 0.5;
                    }
                }
            }
        });

        // Collision avec power-ups
        this.powerUps.forEach(powerUp => {
            if (!powerUp.collected &&
                kart.x < powerUp.x + powerUp.width && 
                kart.x + kart.width > powerUp.x &&
                kart.y < powerUp.y + powerUp.height && 
                kart.y + kart.height > powerUp.y) {
                
                powerUp.collected = true;
                this.createPickupEffect(powerUp.x, powerUp.y, powerUp.color);
                
                // Effets des différents power-ups
                switch (powerUp.type) {
                    case 'boost':
                        kart.boost += 80;
                        break;
                    case 'shield':
                        kart.shield = 180;
                        break;
                    case 'lightning':
                        // Ralentir tous les autres karts
                        this.applyLightningEffect(kart);
                        break;
                    case 'shell':
                        kart.shell = true;
                        break;
                    case 'star':
                        kart.star = 240; // Invincibilité temporaire
                        break;
                }
            }
        });
        
        // Collision entre karts
        const allKarts = [this.player, ...this.opponents];
        allKarts.forEach(otherKart => {
            if (otherKart !== kart && 
                kart.x < otherKart.x + otherKart.width && 
                kart.x + kart.width > otherKart.x &&
                kart.y < otherKart.y + otherKart.height && 
                kart.y + kart.height > otherKart.y) {
                
                // Échange d'impulsion entre karts
                const tempVx = kart.vx;
                const tempVy = kart.vy;
                kart.vx = otherKart.vx * 0.5;
                kart.vy = otherKart.vy * 0.5;
                otherKart.vx = tempVx * 0.5;
                otherKart.vy = tempVy * 0.5;
                
                // Séparation des karts
                const dx = kart.x - otherKart.x;
                const dy = kart.y - otherKart.y;
                const distance = Math.sqrt(dx*dx + dy*dy);
                if (distance > 0) {
                    kart.x += (dx/distance) * 5;
                    kart.y += (dy/distance) * 5;
                    otherKart.x -= (dx/distance) * 5;
                    otherKart.y -= (dy/distance) * 5;
                }
            }
        });
    }

    createCollisionEffect(x, y) {
        // Ajouter des étincelles de collision
        for (let i = 0; i < 8; i++) {
            this.particles.push({
                x: x, y: y,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                life: 30,
                color: '#FFA500',
                size: 3
            });
        }
    }

    createPickupEffect(x, y, color) {
        // Effet visuel de ramassage
        for (let i = 0; i < 12; i++) {
            this.particles.push({
                x: x, y: y,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                life: 40,
                color: color,
                size: 4
            });
        }
    }

    applyLightningEffect(sourceKart) {
        // Effet éclair : ralentir tous les autres karts
        const allKarts = [this.player, ...this.opponents];
        allKarts.forEach(kart => {
            if (kart !== sourceKart && !kart.star) {
                kart.speed *= 0.3;
                kart.lightning = 120; // Durée de l'effet
            }
        });
    }

    updatePowerUps(deltaTime) {
        this.powerUps.forEach(powerUp => {
            powerUp.pulse += 0.1;
            
            // Gestion du respawn des power-ups
            if (powerUp.collected) {
                powerUp.respawnTime += deltaTime;
                if (powerUp.respawnTime >= 3000) { // 3 secondes
                    powerUp.collected = false;
                    powerUp.respawnTime = 0;
                }
            }
        });
        
        // Mise à jour des obstacles dynamiques
        this.obstacles.forEach(obstacle => {
            if (obstacle.type === 'barrel') {
                obstacle.x += obstacle.vx;
                obstacle.y += obstacle.vy;
                obstacle.rotation += 0.1;
                
                // Rebond sur les bords
                if (obstacle.x < 50 || obstacle.x > this.canvas.width - 66) {
                    obstacle.vx *= -1;
                }
                if (obstacle.y < 50 || obstacle.y > this.canvas.height - 66) {
                    obstacle.vy *= -1;
                }
            }
            
            if (obstacle.type === 'cone') {
                obstacle.rotation += 0.02;
            }
        });
    }

    checkCheckpoints(kart) {
        const checkpoint = this.checkpoints[kart.checkpointIndex];
        
        if (checkpoint &&
            kart.x < checkpoint.x + checkpoint.width && 
            kart.x + kart.width > checkpoint.x &&
            kart.y < checkpoint.y + checkpoint.height && 
            kart.y + kart.height > checkpoint.y) {
            
            kart.checkpointIndex = (kart.checkpointIndex + 1) % this.checkpoints.length;
            
            if (kart.checkpointIndex === 0) {
                kart.lap++;
                if (kart.lap > this.totalLaps) {
                    this.finishRace(kart);
                }
            }
        }
    }

    finishRace(kart) {
        if (!this.raceFinished) {
            this.finalPositions.push({
                name: kart.name,
                time: this.raceTime,
                position: this.finalPositions.length + 1
            });
            
            if (kart === this.player) {
                this.raceFinished = true;
                this.raceState = 'finished';
            }
        }
    }

    updatePositions() {
        const allKarts = [this.player, ...this.opponents];
        
        allKarts.sort((a, b) => {
            if (a.lap !== b.lap) {
                return b.lap - a.lap;
            }
            return b.checkpointIndex - a.checkpointIndex;
        });
        
        allKarts.forEach((kart, index) => {
            kart.position = index + 1;
        });
    }

    checkRaceFinished() {
        if (this.player.lap > this.totalLaps && !this.raceFinished) {
            this.finishRace(this.player);
        }
    }

    updateParticles(deltaTime) {
        // Mise à jour des particules d'effets
        this.particles.forEach(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vx *= 0.98;
            particle.vy *= 0.98;
            particle.life--;
            particle.size = Math.max(0, particle.size - 0.1);
        });
        
        this.particles = this.particles.filter(p => p.life > 0);
        
        // Ajouter des particules d'ambiance
        if (Math.random() < 0.02) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: this.canvas.height + 10,
                vx: (Math.random() - 0.5) * 2,
                vy: -Math.random() * 3,
                life: 100,
                color: '#87CEEB',
                size: 2
            });
        }
    }

    updateCamera() {
        // Caméra fixe pour simplicité
        this.camera.x = 0;
        this.camera.y = 0;
    }

    formatTime(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    render() {
        // Arrière-plan dégradé
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(1, '#228B22');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Circuit principal avec texture
        this.ctx.fillStyle = '#404040';
        this.ctx.fillRect(60, 60, this.canvas.width - 120, this.canvas.height - 120);
        
        // Marquages de piste
        this.ctx.strokeStyle = '#FFFF00';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([10, 10]);
        this.ctx.beginPath();
        this.ctx.moveTo(150, 100);
        this.ctx.lineTo(650, 100);
        this.ctx.moveTo(650, 500);
        this.ctx.lineTo(150, 500);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
        
        // Murs avec ombres
        this.track.forEach(wall => {
            // Ombre
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            this.ctx.fillRect(wall.x + 2, wall.y + 2, wall.width, wall.height);
            
            // Mur principal
            if (wall.type === 'chicane') {
                this.ctx.fillStyle = '#FF6347';
            } else {
                this.ctx.fillStyle = '#8B4513';
            }
            this.ctx.fillRect(wall.x, wall.y, wall.width, wall.height);
        });
        
        // Ligne de départ/arrivée avec animation
        this.ctx.fillStyle = '#FFFFFF';
        const flash = Math.sin(this.time * 0.01) > 0;
        for (let i = 0; i < 10; i++) {
            this.ctx.fillStyle = (i % 2 === 0) ? '#FFFFFF' : (flash ? '#FF0000' : '#000000');
            this.ctx.fillRect(100 + i * 12, 250, 10, 80);
        }
        
        // Checkpoints avec indicateurs visuels
        this.checkpoints.forEach((checkpoint, index) => {
            const isPlayerNext = index === this.player.checkpointIndex;
            const isOpponentNext = this.opponents.some(opp => index === opp.checkpointIndex);
            
            if (isPlayerNext) {
                this.ctx.strokeStyle = '#00FF00';
                this.ctx.lineWidth = 4;
                this.ctx.strokeRect(checkpoint.x - 2, checkpoint.y - 2, checkpoint.width + 4, checkpoint.height + 4);
                
                // Flèche indicatrice
                this.ctx.fillStyle = '#00FF00';
                this.ctx.beginPath();
                this.ctx.moveTo(checkpoint.x + checkpoint.width/2, checkpoint.y - 10);
                this.ctx.lineTo(checkpoint.x + checkpoint.width/2 - 8, checkpoint.y - 20);
                this.ctx.lineTo(checkpoint.x + checkpoint.width/2 + 8, checkpoint.y - 20);
                this.ctx.fill();
            } else {
                this.ctx.strokeStyle = '#666666';
                this.ctx.lineWidth = 2;
                this.ctx.strokeRect(checkpoint.x, checkpoint.y, checkpoint.width, checkpoint.height);
            }
        });
        
        // Power-ups avec effets visuels améliorés
        this.powerUps.forEach(powerUp => {
            if (!powerUp.collected) {
                const pulse = Math.sin(powerUp.pulse) * 0.3 + 1;
                const glowSize = Math.sin(powerUp.pulse * 2) * 5 + 10;
                
                // Effet de lueur
                this.ctx.fillStyle = powerUp.color + '40';
                this.ctx.fillRect(
                    powerUp.x - glowSize/2, 
                    powerUp.y - glowSize/2, 
                    powerUp.width + glowSize, 
                    powerUp.height + glowSize
                );
                
                // Power-up principal
                this.ctx.fillStyle = powerUp.color;
                this.ctx.fillRect(
                    powerUp.x + (powerUp.width * (1-pulse))/2, 
                    powerUp.y + (powerUp.height * (1-pulse))/2, 
                    powerUp.width * pulse, 
                    powerUp.height * pulse
                );
                
                // Icône selon le type
                this.ctx.fillStyle = '#000';
                this.ctx.font = '12px Arial';
                this.ctx.textAlign = 'center';
                const iconX = powerUp.x + powerUp.width/2;
                const iconY = powerUp.y + powerUp.height/2 + 4;
                
                switch (powerUp.type) {
                    case 'boost': this.ctx.fillText('⚡', iconX, iconY); break;
                    case 'shield': this.ctx.fillText('🛡', iconX, iconY); break;
                    case 'lightning': this.ctx.fillText('⚡', iconX, iconY); break;
                    case 'shell': this.ctx.fillText('🐚', iconX, iconY); break;
                    case 'star': this.ctx.fillText('⭐', iconX, iconY); break;
                }
            }
        });
        
        // Obstacles avec rotation et effets
        this.obstacles.forEach(obstacle => {
            this.ctx.save();
            this.ctx.translate(obstacle.x + obstacle.width/2, obstacle.y + obstacle.height/2);
            
            if (obstacle.rotation) {
                this.ctx.rotate(obstacle.rotation);
            }
            
            // Ombre de l'obstacle
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            this.ctx.fillRect(-obstacle.width/2 + 1, -obstacle.height/2 + 1, obstacle.width, obstacle.height);
            
            // Obstacle principal
            this.ctx.fillStyle = obstacle.color;
            this.ctx.fillRect(-obstacle.width/2, -obstacle.height/2, obstacle.width, obstacle.height);
            
            // Détails selon le type
            if (obstacle.type === 'barrel') {
                this.ctx.strokeStyle = '#654321';
                this.ctx.lineWidth = 2;
                this.ctx.strokeRect(-obstacle.width/2, -obstacle.height/2, obstacle.width, obstacle.height);
            } else if (obstacle.type === 'oil') {
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                this.ctx.fillRect(-obstacle.width/2 + 2, -obstacle.height/2 + 2, obstacle.width - 4, obstacle.height - 4);
            }
            
            this.ctx.restore();
        });
        
        // Particules d'effets
        this.particles.forEach(particle => {
            if (particle.size > 0) {
                this.ctx.fillStyle = particle.color;
                this.ctx.fillRect(particle.x - particle.size/2, particle.y - particle.size/2, particle.size, particle.size);
            }
        });
        
        // Trails des karts avec effets spéciaux
        [...this.opponents, this.player].forEach(kart => {
            kart.trail.forEach((point, index) => {
                const alpha = (point.life / 20) * 0.5;
                let color = '#FFFFFF';
                
                if (point.boost) color = '#FFD700';
                if (point.star) color = '#FF69B4';
                
                this.ctx.fillStyle = color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
                const size = (point.life / 20) * 4;
                this.ctx.fillRect(point.x - size/2, point.y - size/2, size, size);
            });
        });
        
        // Karts avec effets de statut
        this.opponents.forEach(opponent => this.drawKart(opponent));
        this.drawKart(this.player);
        
        // Interface utilisateur
        this.drawUI();
    }

    drawKart(kart) {
        this.ctx.save();
        this.ctx.translate(kart.x + kart.width/2, kart.y + kart.height/2);
        this.ctx.rotate(kart.angle);
        
        // Effets de statut
        if (kart.star > 0) {
            // Effet étoile - invincibilité
            const starGlow = Math.sin(this.time * 0.02) * 10 + 15;
            this.ctx.fillStyle = '#FFD700';
            this.ctx.fillRect(-kart.width/2 - starGlow/2, -kart.height/2 - starGlow/2, 
                             kart.width + starGlow, kart.height + starGlow);
        }
        
        if (kart.shield > 0) {
            // Bouclier protecteur
            this.ctx.strokeStyle = '#00CED1';
            this.ctx.lineWidth = 3;
            this.ctx.strokeRect(-kart.width/2 - 5, -kart.height/2 - 5, kart.width + 10, kart.height + 10);
        }
        
        if (kart.lightning > 0) {
            // Effet de ralentissement
            this.ctx.fillStyle = 'rgba(255, 255, 0, 0.5)';
            this.ctx.fillRect(-kart.width/2 - 3, -kart.height/2 - 3, kart.width + 6, kart.height + 6);
        }
        
        // Ombre du kart
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.fillRect(-kart.width/2 + 2, -kart.height/2 + 2, kart.width, kart.height);
        
        // Corps principal du kart
        this.ctx.fillStyle = kart.color;
        this.ctx.fillRect(-kart.width/2, -kart.height/2, kart.width, kart.height);
        
        // Détails du kart
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(-kart.width/2 + 2, -kart.height/2 + 2, kart.width - 4, kart.height - 4);
        
        // Direction (avant du kart)
        this.ctx.fillStyle = '#FFF';
        this.ctx.fillRect(kart.width/2 - 2, -2, 4, 4);
        
        // Effet boost
        if (kart.boost > 0) {
            this.ctx.fillStyle = '#FF4500';
            for (let i = 0; i < 3; i++) {
                this.ctx.fillRect(-kart.width/2 - 8 - i*3, -1 + (Math.random()-0.5)*4, 6, 2);
            }
        }
        
        this.ctx.restore();
        
        // Nom et informations au-dessus du kart
        this.ctx.fillStyle = '#FFF';
        this.ctx.font = 'bold 11px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 2;
        
        // Position
        const positionColor = kart === this.player ? '#FFD700' : '#FFF';
        this.ctx.strokeText(`${kart.position}°`, kart.x + kart.width/2, kart.y - 25);
        this.ctx.fillStyle = positionColor;
        this.ctx.fillText(`${kart.position}°`, kart.x + kart.width/2, kart.y - 25);
        
        // Nom
        this.ctx.strokeText(kart.name, kart.x + kart.width/2, kart.y - 10);
        this.ctx.fillStyle = '#FFF';
        this.ctx.fillText(kart.name, kart.x + kart.width/2, kart.y - 10);
        
        // Indicateurs de statut
        let statusY = kart.y + kart.height + 15;
        if (kart.boost > 0) {
            this.ctx.fillStyle = '#FFD700';
            this.ctx.fillText('⚡', kart.x + kart.width/2 - 10, statusY);
        }
        if (kart.shield > 0) {
            this.ctx.fillStyle = '#00CED1';
            this.ctx.fillText('🛡', kart.x + kart.width/2, statusY);
        }
        if (kart.star > 0) {
            this.ctx.fillStyle = '#FFD700';
            this.ctx.fillText('⭐', kart.x + kart.width/2 + 10, statusY);
        }
    }

    drawUI() {
        // Panneau principal de course
        this.drawRoundedRect(15, 15, 280, 140, 12, 'rgba(0, 0, 0, 0.85)');
        
        // Titre du panneau
        this.drawText('MARIO KART STYLE', 30, 35, {
            font: 'bold 16px Arial',
            color: '#FFD700',
            shadow: true
        });
        
        // Position avec style coloré
        const positionColor = this.player.position === 1 ? '#FFD700' : 
                             this.player.position === 2 ? '#C0C0C0' : 
                             this.player.position === 3 ? '#CD7F32' : '#FFF';
        
        this.drawText(`Position: ${this.player.position}/${this.numOpponents + 1}`, 30, 55, {
            font: 'bold 18px Arial',
            color: positionColor,
            shadow: true
        });
        
        // Tours
        this.drawText(`Tour: ${this.player.lap}/${this.totalLaps}`, 30, 75, {
            font: '16px Arial',
            color: '#87CEEB',
            shadow: true
        });
        
        // Temps de course
        this.drawText(`Temps: ${this.formatTime(this.raceTime)}`, 30, 95, {
            font: '16px Arial',
            color: '#98FB98',
            shadow: true
        });
        
        // Vitesse
        const speedKmh = Math.round(Math.abs(this.player.speed) * 10);
        this.drawText(`Vitesse: ${speedKmh} km/h`, 30, 115, {
            font: '14px Arial',
            color: '#FFA500',
            shadow: true
        });
        
        // Power-ups du joueur
        if (this.player.boost > 0 || this.player.shield > 0 || this.player.star > 0) {
            this.drawText(`Power-ups: ${this.player.boost > 0 ? '⚡' : ''}${this.player.shield > 0 ? '🛡' : ''}${this.player.star > 0 ? '⭐' : ''}`, 30, 135, {
                font: '14px Arial',
                color: '#FF69B4',
                shadow: true
            });
        }
        
        // Mini classement
        this.drawRoundedRect(this.canvas.width - 200, 15, 180, 120, 10, 'rgba(0, 0, 0, 0.8)');
        this.drawText('CLASSEMENT', this.canvas.width - 190, 35, {
            font: 'bold 14px Arial',
            color: '#FFD700',
            shadow: true
        });
        
        const allKarts = [this.player, ...this.opponents].sort((a, b) => a.position - b.position);
        allKarts.slice(0, 4).forEach((kart, index) => {
            const isPlayer = kart === this.player;
            const color = isPlayer ? '#FFD700' : '#FFF';
            const text = `${kart.position}. ${kart.name}`;
            
            this.drawText(text, this.canvas.width - 190, 55 + index * 18, {
                font: isPlayer ? 'bold 12px Arial' : '12px Arial',
                color: color,
                shadow: true
            });
        });
        
        // État de la course avec effets
        if (this.raceState === 'countdown') {
            const countdownText = this.countdown > 0 ? this.countdown.toString() : 'GO!';
            const pulseSize = Math.sin(this.time * 0.01) * 10 + 72;
            
            this.drawText(countdownText, this.canvas.width/2, this.canvas.height/2, {
                font: `bold ${pulseSize}px Arial`,
                color: this.countdown <= 1 ? '#00FF00' : '#FF0000',
                align: 'center',
                shadow: true
            });
            
            // Effet de halo
            this.ctx.strokeStyle = this.countdown <= 1 ? '#00FF00' : '#FF0000';
            this.ctx.lineWidth = 4;
            this.ctx.strokeText(countdownText, this.canvas.width/2, this.canvas.height/2);
            
        } else if (this.raceState === 'finished') {
            this.drawRoundedRect(this.canvas.width/2 - 150, this.canvas.height/2 - 80, 300, 160, 15, 'rgba(0, 0, 0, 0.9)');
            
            this.drawText('COURSE TERMINÉE!', this.canvas.width/2, this.canvas.height/2 - 40, {
                font: 'bold 36px Arial',
                color: '#FFD700',
                align: 'center',
                shadow: true
            });
            
            const finalPos = this.finalPositions.find(p => p.name === this.player.name);
            if (finalPos) {
                this.drawText(`Votre position: ${finalPos.position}`, this.canvas.width/2, this.canvas.height/2, {
                    font: 'bold 24px Arial',
                    color: finalPos.position === 1 ? '#FFD700' : '#FFF',
                    align: 'center',
                    shadow: true
                });
                
                this.drawText(`Temps final: ${this.formatTime(finalPos.time)}`, this.canvas.width/2, this.canvas.height/2 + 30, {
                    font: '18px Arial',
                    color: '#87CEEB',
                    align: 'center',
                    shadow: true
                });
            }
        }
        
        // Instructions selon le dispositif
        const instructions = this.controls.touchControls ? 
            'Contrôles tactiles - Touchez pour diriger et accélérer' :
            'Z/S: Accélérer/Freiner | Q/D: Tourner | ESPACE: Utiliser objet';
            
        this.drawText(instructions, this.canvas.width/2, this.canvas.height - 15, {
            font: '13px Arial',
            color: '#DDD',
            align: 'center',
            shadow: true
        });
        
        // Indicateur de prochain checkpoint
        const nextCheckpoint = this.checkpoints[this.player.checkpointIndex];
        if (nextCheckpoint) {
            const dx = nextCheckpoint.x - this.player.x;
            const dy = nextCheckpoint.y - this.player.y;
            const distance = Math.sqrt(dx*dx + dy*dy);
            
            this.drawText(`Prochain checkpoint: ${Math.round(distance)}m`, this.canvas.width - 200, this.canvas.height - 30, {
                font: '12px Arial',
                color: '#90EE90',
                shadow: true
            });
        }
    }
}
