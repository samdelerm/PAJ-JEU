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
        this.items = [];
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
        
        // Caméra et affichage
        this.camera = { x: 0, y: 0 };
        this.trackWidth = 1400;
        this.trackHeight = 1000;
        this.viewportWidth = this.canvas.width;
        this.viewportHeight = this.canvas.height;
        
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
        // Circuit style Mario Kart avec virages et sections
        const centerX = this.trackWidth / 2;
        const centerY = this.trackHeight / 2;
        const trackRadius = 300;
        const trackWidth = 120;
        
        // Points du circuit principal (ovale avec chicanes)
        this.raceCircuit = [
            { x: centerX - 400, y: centerY, angle: Math.PI },
            { x: centerX - 350, y: centerY - 250, angle: -Math.PI/2 },
            { x: centerX - 100, y: centerY - 300, angle: 0 },
            { x: centerX + 200, y: centerY - 250, angle: Math.PI/4 },
            { x: centerX + 350, y: centerY - 100, angle: Math.PI/2 },
            { x: centerX + 400, y: centerY + 100, angle: Math.PI/2 },
            { x: centerX + 300, y: centerY + 250, angle: Math.PI },
            { x: centerX + 100, y: centerY + 300, angle: Math.PI },
            { x: centerX - 200, y: centerY + 250, angle: -Math.PI/2 },
            { x: centerX - 350, y: centerY + 100, angle: -Math.PI/2 }
        ];
        
        // Générer les murs du circuit
        this.track = [];
        for (let i = 0; i < this.raceCircuit.length; i++) {
            const current = this.raceCircuit[i];
            const next = this.raceCircuit[(i + 1) % this.raceCircuit.length];
            
            // Murs intérieurs et extérieurs
            const angle = Math.atan2(next.y - current.y, next.x - current.x);
            const perpAngle = angle + Math.PI / 2;
            
            const innerRadius = trackWidth / 2 - 20;
            const outerRadius = trackWidth / 2 + 20;
            
            // Mur intérieur
            this.track.push({
                x: current.x + Math.cos(perpAngle) * innerRadius,
                y: current.y + Math.sin(perpAngle) * innerRadius,
                width: 15,
                height: 15,
                type: 'inner_wall'
            });
            
            // Mur extérieur
            this.track.push({
                x: current.x - Math.cos(perpAngle) * outerRadius,
                y: current.y - Math.sin(perpAngle) * outerRadius,
                width: 15,
                height: 15,
                type: 'outer_wall'
            });
        }
    }

    createCheckpoints() {
        this.checkpoints = [];
        const numCheckpoints = 8;
        
        for (let i = 0; i < numCheckpoints; i++) {
            const circuitIndex = Math.floor((i / numCheckpoints) * this.raceCircuit.length);
            const point = this.raceCircuit[circuitIndex];
            
            this.checkpoints.push({
                x: point.x - 15,
                y: point.y - 15,
                width: 30,
                height: 30,
                index: i,
                passed: false
            });
        }
    }

    createOpponents() {
        const opponentData = [
            { name: 'BOWSER', color: '#8B4513', ai: 'aggressive', speed: 0.9 },
            { name: 'PEACH', color: '#FFB6C1', ai: 'balanced', speed: 1.0 },
            { name: 'YOSHI', color: '#32CD32', ai: 'defensive', speed: 1.1 }
        ];
        
        this.opponents = [];
        for (let i = 0; i < this.numOpponents; i++) {
            const data = opponentData[i];
            const startOffset = (i + 1) * 35;
            
            this.opponents.push({
                x: 150 - startOffset, y: 280 + (i * 20), width: 28, height: 16,
                vx: 0, vy: 0, angle: 0, speed: 0,
                maxSpeed: 11 * data.speed, acceleration: 0.35, friction: 0.92,
                color: data.color, name: data.name, trail: [],
                boost: 0, shield: 0, lap: 1, checkpointIndex: 0,
                lapTime: 0, bestLap: Infinity, position: i + 2,
                ai: {
                    type: data.ai,
                    targetX: 150, targetY: 280,
                    decisionTimer: 0,
                    stuck: 0,
                    lastX: 150 - startOffset,
                    lastY: 280 + (i * 20)
                }
            });
        }
    }

    createPowerUps() {
        this.powerUps = [];
        const powerUpTypes = [
            { type: 'speed_boost', color: '#FFD700', effect: 60 },
            { type: 'shield', color: '#00CED1', effect: 120 },
            { type: 'missile', color: '#FF6347', effect: 1 },
            { type: 'banana', color: '#FFFF00', effect: 1 }
        ];
        
        // Placer des power-ups le long du circuit
        for (let i = 0; i < 12; i++) {
            const circuitIndex = Math.floor((i / 12) * this.raceCircuit.length);
            const point = this.raceCircuit[circuitIndex];
            const type = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
            
            this.powerUps.push({
                x: point.x + (Math.random() - 0.5) * 60,
                y: point.y + (Math.random() - 0.5) * 60,
                width: 20, height: 20,
                type: type.type,
                color: type.color,
                effect: type.effect,
                collected: false,
                respawnTime: 0,
                pulse: 0
            });
        }
    }

    createObstacles() {
        this.obstacles = [];
        // Quelques obstacles fixes sur le circuit
        const numObstacles = 6;
        
        for (let i = 0; i < numObstacles; i++) {
            const circuitIndex = Math.floor((i / numObstacles) * this.raceCircuit.length);
            const point = this.raceCircuit[circuitIndex];
            
            this.obstacles.push({
                x: point.x + (Math.random() - 0.5) * 40,
                y: point.y + (Math.random() - 0.5) * 40,
                width: 20, height: 20,
                type: 'barrel',
                color: '#8B4513',
                health: 1
            });
        }
    }

    createAmbientParticles() {
        this.particles = [];
        // Particules d'ambiance (poussière, fumée)
        for (let i = 0; i < 40; i++) {
            this.particles.push({
                x: Math.random() * this.trackWidth,
                y: Math.random() * this.trackHeight,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                size: Math.random() * 3 + 1,
                color: `rgba(${200 + Math.random() * 55}, ${200 + Math.random() * 55}, ${180 + Math.random() * 75}, 0.3)`,
                type: 'ambient',
                life: Math.random() * 200 + 100,
                maxLife: 300
            });
        }
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

    updatePlayer(deltaTime) {
        // Contrôles du joueur
        this.handlePlayerInput();
        
        // Physique
        this.updateKartPhysics(this.player, deltaTime);
        
        // Collisions
        this.checkCollisions(this.player);
        
        // Checkpoints
        this.checkCheckpoints(this.player);
    }

    handlePlayerInput() {
        // Accélération/freinage
        if (this.controls.isPressed('up')) {
            this.player.speed = Math.min(this.player.speed + this.player.acceleration, this.player.maxSpeed);
        } else if (this.controls.isPressed('down')) {
            this.player.speed = Math.max(this.player.speed - this.player.acceleration * 1.5, -this.player.maxSpeed * 0.5);
        } else {
            this.player.speed *= this.player.friction;
        }
        
        // Direction
        if (this.controls.isPressed('left') && Math.abs(this.player.speed) > 0.5) {
            this.player.angle -= 0.08 * (Math.abs(this.player.speed) / this.player.maxSpeed);
        }
        if (this.controls.isPressed('right') && Math.abs(this.player.speed) > 0.5) {
            this.player.angle += 0.08 * (Math.abs(this.player.speed) / this.player.maxSpeed);
        }
        
        // Utilisation d'objets
        if (this.controls.isPressed('action') && this.player.boost > 0) {
            this.usePlayerItem();
        }
    }

    usePlayerItem() {
        if (this.player.boost > 0) {
            this.player.boost -= 1;
            this.player.speed = Math.min(this.player.speed + 0.5, this.player.maxSpeed * 1.4);
            this.createBoostParticles(this.player);
        }
    }

    updateOpponents(deltaTime) {
        this.opponents.forEach(opponent => {
            this.updateOpponentAI(opponent, deltaTime);
            this.updateKartPhysics(opponent, deltaTime);
            this.checkCollisions(opponent);
            this.checkCheckpoints(opponent);
        });
    }

    updateOpponentAI(opponent, deltaTime) {
        const ai = opponent.ai;
        ai.decisionTimer += deltaTime;
        
        // Mise à jour de la cible IA toutes les 200ms
        if (ai.decisionTimer > 200) {
            ai.decisionTimer = 0;
            this.updateAITarget(opponent);
        }
        
        // Mouvement vers la cible
        const dx = ai.targetX - opponent.x;
        const dy = ai.targetY - opponent.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const targetAngle = Math.atan2(dy, dx);
        
        // Ajuster l'angle progressivement
        let angleDiff = targetAngle - opponent.angle;
        while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
        while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
        
        const turnSpeed = 0.06;
        if (Math.abs(angleDiff) > 0.1) {
            if (angleDiff > 0) {
                opponent.angle += turnSpeed;
            } else {
                opponent.angle -= turnSpeed;
            }
        }
        
        // Vitesse basée sur la distance et le type d'IA
        let targetSpeed = opponent.maxSpeed;
        
        if (distance < 50) {
            targetSpeed *= 0.7; // Ralentir près de la cible
        }
        
        if (ai.type === 'aggressive') {
            targetSpeed *= 1.1;
        } else if (ai.type === 'defensive') {
            targetSpeed *= 0.9;
        }
        
        // Ajuster la vitesse
        if (opponent.speed < targetSpeed) {
            opponent.speed = Math.min(opponent.speed + opponent.acceleration, targetSpeed);
        } else {
            opponent.speed = Math.max(opponent.speed - opponent.acceleration, targetSpeed * 0.5);
        }
        
        // Détection de blocage
        const moveDistance = Math.sqrt(
            (opponent.x - ai.lastX) ** 2 + (opponent.y - ai.lastY) ** 2
        );
        
        if (moveDistance < 2 && opponent.speed > 2) {
            ai.stuck += deltaTime;
            if (ai.stuck > 1000) {
                // Déblocage : reculer et tourner
                opponent.speed = -opponent.maxSpeed * 0.3;
                opponent.angle += (Math.random() - 0.5) * 0.5;
                ai.stuck = 0;
            }
        } else {
            ai.stuck = 0;
        }
        
        ai.lastX = opponent.x;
        ai.lastY = opponent.y;
        
        // Utilisation d'objets IA
        if (Math.random() < 0.001 && opponent.boost > 0) {
            opponent.boost -= 1;
            opponent.speed = Math.min(opponent.speed + 0.4, opponent.maxSpeed * 1.3);
            this.createBoostParticles(opponent);
        }
    }

    updateAITarget(opponent) {
        // L'IA vise le prochain checkpoint
        const nextCheckpointIndex = (opponent.checkpointIndex + 1) % this.checkpoints.length;
        const checkpoint = this.checkpoints[nextCheckpointIndex];
        
        if (checkpoint) {
            // Ajouter de la variation pour éviter que tous les karts suivent exactement la même ligne
            const variation = 30;
            opponent.ai.targetX = checkpoint.x + (Math.random() - 0.5) * variation;
            opponent.ai.targetY = checkpoint.y + (Math.random() - 0.5) * variation;
        }
    }
        });

        // Collision avec obstacles
        this.obstacles.forEach(obstacle => {
            if (this.kart.x < obstacle.x + obstacle.width && 
                this.kart.x + this.kart.width > obstacle.x &&
                this.kart.y < obstacle.y + obstacle.height && 
                this.kart.y + this.kart.height > obstacle.y) {
                
                if (obstacle.type === 'oil') {
                    // Glissement sur l'huile
                    this.kart.speed *= 0.5;
                    this.kart.angle += (Math.random() - 0.5) * 0.3;
                } else if (obstacle.type === 'cone') {
                    // Ralentissement sur cône
                    this.kart.speed *= 0.7;
                    this.createCollisionParticles();
                }
            }
        });
    }

    updatePowerUps() {
        this.powerUps.forEach(powerUp => {
            if (!powerUp.collected) {
                powerUp.pulse += 0.1;
                
                // Collision avec le kart
                if (this.kart.x < powerUp.x + powerUp.width && 
                    this.kart.x + this.kart.width > powerUp.x &&
                    this.kart.y < powerUp.y + powerUp.height && 
                    this.kart.y + this.kart.height > powerUp.y) {
                    
                    powerUp.collected = true;
                    
                    if (powerUp.type === 'boost') {
                        this.kart.boost = 100;
                        this.createPowerUpEffect(powerUp.x, powerUp.y, '#FFD700');
                    } else if (powerUp.type === 'shield') {
                        this.kart.shield = 200;
                        this.createPowerUpEffect(powerUp.x, powerUp.y, '#00CED1');
                    }
                }
            }
        });
    }

    updateParticles() {
        this.particles.forEach((particle, index) => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life--;
            
            if (particle.type === 'ambient') {
                particle.vy += 0.01; // Légère gravité
                
                // Recyclage des particules d'ambiance
                if (particle.life <= 0) {
                    particle.x = Math.random() * this.trackWidth;
                    particle.y = Math.random() * this.trackHeight;
                    particle.life = Math.random() * 200 + 100;
                }
            } else if (particle.life <= 0) {
                this.particles.splice(index, 1);
            }
        });
    }

    checkCheckpoints() {
        const checkpoint = this.checkpoints[this.currentCheckpoint];
        
        if (this.kart.x < checkpoint.x + checkpoint.width && 
            this.kart.x + this.kart.width > checkpoint.x &&
            this.kart.y < checkpoint.y + checkpoint.height && 
            this.kart.y + this.kart.height > checkpoint.y) {
            
            if (!checkpoint.passed) {
                checkpoint.passed = true;
                this.currentCheckpoint++;
                
                // Vérifier fin de tour
                if (this.currentCheckpoint >= this.checkpoints.length) {
                    this.completeLap();
                }
                
                this.createCheckpointEffect(checkpoint.x, checkpoint.y);
            }
        }
    }

    completeLap() {
        const lapTime = Date.now() - this.lapStartTime;
        this.lapTimes.push(lapTime);
        
        if (lapTime < this.bestLap) {
            this.bestLap = lapTime;
        }
        
        this.currentLap++;
        this.currentCheckpoint = 0;
        
        // Réinitialiser les checkpoints
        this.checkpoints.forEach(cp => cp.passed = false);
        
        // Vérifier fin de course
        if (this.currentLap > this.totalLaps) {
            this.endRace();
        } else {
            this.lapStartTime = Date.now();
        }
    }

    updateCamera() {
        // Caméra qui suit le kart avec lissage
        const targetX = this.kart.x - this.canvas.width / 2;
        const targetY = this.kart.y - this.canvas.height / 2;
        
        this.camera.x += (targetX - this.camera.x) * 0.1;
        this.camera.y += (targetY - this.camera.y) * 0.1;
        
        // Limiter la caméra aux bords de la piste
        this.camera.x = GameEngine.clamp(this.camera.x, 0, this.trackWidth - this.canvas.width);
        this.camera.y = GameEngine.clamp(this.camera.y, 0, this.trackHeight - this.canvas.height);
    }

    createBoostParticles() {
        for (let i = 0; i < 8; i++) {
            this.particles.push({
                x: this.kart.x - Math.cos(this.kart.angle) * 20,
                y: this.kart.y - Math.sin(this.kart.angle) * 20,
                vx: -Math.cos(this.kart.angle) * 5 + (Math.random() - 0.5) * 4,
                vy: -Math.sin(this.kart.angle) * 5 + (Math.random() - 0.5) * 4,
                size: Math.random() * 4 + 2,
                color: `hsl(${30 + Math.random() * 30}, 80%, 60%)`,
                type: 'boost',
                life: 30,
                maxLife: 30
            });
        }
    }

    createCollisionParticles() {
        for (let i = 0; i < 6; i++) {
            this.particles.push({
                x: this.kart.x + this.kart.width/2,
                y: this.kart.y + this.kart.height/2,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                size: Math.random() * 3 + 1,
                color: '#FF6B6B',
                type: 'collision',
                life: 25,
                maxLife: 25
            });
        }
    }

    createPowerUpEffect(x, y, color) {
        for (let i = 0; i < 12; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                size: Math.random() * 5 + 2,
                color: color,
                type: 'powerup',
                life: 40,
                maxLife: 40
            });
        }
    }

    createCheckpointEffect(x, y) {
        for (let i = 0; i < 15; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                size: Math.random() * 4 + 1,
                color: '#00FF00',
                type: 'checkpoint',
                life: 35,
                maxLife: 35
            });
        }
    }

    endRace() {
        this.gameRunning = false;
        // Afficher les résultats
        console.log('Course terminée !');
        console.log(`Meilleur tour: ${this.formatTime(this.bestLap)}`);
        console.log(`Temps total: ${this.formatTime(this.raceTime)}`);
    }

    formatTime(ms) {
        const minutes = Math.floor(ms / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        const centiseconds = Math.floor((ms % 1000) / 10);
        return `${minutes}:${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
    }

    render() {
        // Fond avec dégradé
        this.drawGradientRect(0, 0, this.canvas.width, this.canvas.height, 
            '#2F4F2F', '#1C3A1C', 'vertical');
        
        // Appliquer la translation de caméra
        this.ctx.save();
        this.ctx.translate(-this.camera.x, -this.camera.y);
        
        // Piste
        this.drawTrack();
        
        // Obstacles
        this.drawObstacles();
        
        // Power-ups
        this.drawPowerUps();
        
        // Checkpoints
        this.drawCheckpoints();
        
        // Particules
        this.drawParticles();
        
        // Kart
        this.drawKart();
        
        this.ctx.restore();
        
        // Interface (pas affectée par la caméra)
        this.drawUI();
        
        // Mini-carte
        this.drawMiniMap();
    }

    drawTrack() {
        // Surface de course avec texture
        this.ctx.fillStyle = '#696969';
        this.ctx.fillRect(100, 80, 600, 440);
        
        // Lignes de circuit
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([10, 10]);
        this.ctx.beginPath();
        this.ctx.moveTo(400, 100);
        this.ctx.lineTo(400, 500);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
        
        // Murs avec style 3D
        this.track.forEach(wall => {
            // Ombre du mur
            this.drawShadowRect(wall.x, wall.y, wall.width, wall.height, '#8B4513', 'rgba(0,0,0,0.4)');
        });
    }

    drawObstacles() {
        this.obstacles.forEach(obstacle => {
            if (obstacle.type === 'cone') {
                // Cône en 3D
                this.ctx.fillStyle = obstacle.color;
                this.ctx.beginPath();
                this.ctx.moveTo(obstacle.x + obstacle.width/2, obstacle.y);
                this.ctx.lineTo(obstacle.x, obstacle.y + obstacle.height);
                this.ctx.lineTo(obstacle.x + obstacle.width, obstacle.y + obstacle.height);
                this.ctx.closePath();
                this.ctx.fill();
                
                // Bande réfléchissante
                this.ctx.fillStyle = '#FFFFFF';
                this.ctx.fillRect(obstacle.x + 5, obstacle.y + obstacle.height - 5, 5, 3);
            } else if (obstacle.type === 'oil') {
                // Flaque d'huile avec reflets
                this.ctx.fillStyle = obstacle.color;
                this.ctx.beginPath();
                this.ctx.ellipse(obstacle.x + obstacle.width/2, obstacle.y + obstacle.height/2, 
                    obstacle.width/2, obstacle.height/2, 0, 0, Math.PI * 2);
                this.ctx.fill();
                
                // Reflet
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                this.ctx.beginPath();
                this.ctx.ellipse(obstacle.x + obstacle.width/3, obstacle.y + obstacle.height/3, 
                    5, 3, 0, 0, Math.PI * 2);
                this.ctx.fill();
            }
        });
    }

    drawPowerUps() {
        this.powerUps.forEach(powerUp => {
            if (!powerUp.collected) {
                const pulse = Math.sin(powerUp.pulse) * 0.2 + 1;
                const size = 10 * pulse;
                
                // Ombre
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
                this.ctx.beginPath();
                this.ctx.arc(powerUp.x + 2, powerUp.y + 2, size, 0, Math.PI * 2);
                this.ctx.fill();
                
                // Power-up principal
                this.ctx.fillStyle = powerUp.color;
                this.ctx.beginPath();
                this.ctx.arc(powerUp.x, powerUp.y, size, 0, Math.PI * 2);
                this.ctx.fill();
                
                // Effet lumineux
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
                this.ctx.beginPath();
                this.ctx.arc(powerUp.x, powerUp.y, size * 0.5, 0, Math.PI * 2);
                this.ctx.fill();
                
                // Icône
                this.drawText(powerUp.type === 'boost' ? '⚡' : '🛡️', powerUp.x, powerUp.y, {
                    font: '12px Arial',
                    align: 'center',
                    baseline: 'middle'
                });
            }
        });
    }

    drawCheckpoints() {
        this.checkpoints.forEach((checkpoint, index) => {
            const isActive = index === this.currentCheckpoint;
            const color = checkpoint.passed ? '#00FF00' : (isActive ? '#FF0000' : '#FFFFFF');
            
            // Zone de checkpoint
            this.ctx.fillStyle = `${color}33`;
            this.ctx.fillRect(checkpoint.x, checkpoint.y, checkpoint.width, checkpoint.height);
            
            // Bordure
            this.ctx.strokeStyle = color;
            this.ctx.lineWidth = 3;
            this.ctx.strokeRect(checkpoint.x, checkpoint.y, checkpoint.width, checkpoint.height);
            
            // Numéro
            this.drawText((index + 1).toString(), 
                checkpoint.x + checkpoint.width/2, checkpoint.y + checkpoint.height/2, {
                font: '16px Arial',
                color: color,
                align: 'center',
                baseline: 'middle',
                shadow: true
            });
        });
    }

    drawParticles() {
        this.particles.forEach(particle => {
            const alpha = particle.type === 'ambient' ? 0.6 : particle.life / particle.maxLife;
            this.drawParticle(particle.x, particle.y, particle.size, particle.color, alpha);
        });
    }

    drawKart() {
        this.ctx.save();
        this.ctx.translate(this.kart.x + this.kart.width/2, this.kart.y + this.kart.height/2);
        this.ctx.rotate(this.kart.angle);
        
        // Trail du kart
        this.kart.trail.forEach((point, index) => {
            const alpha = point.life / 30;
            this.ctx.fillStyle = `rgba(139, 69, 19, ${alpha * 0.5})`;
            this.ctx.beginPath();
            this.ctx.arc(point.x - this.kart.x, point.y - this.kart.y, 2, 0, Math.PI * 2);
            this.ctx.fill();
        });
        
        // Corps du kart avec dégradé
        this.ctx.fillStyle = this.kart.color;
        this.ctx.fillRect(-this.kart.width/2, -this.kart.height/2, this.kart.width, this.kart.height);
        
        // Détails du kart
        this.ctx.fillStyle = '#2C3E50';
        this.ctx.fillRect(-5, -3, 10, 6);
        
        // Roues
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(-12, -8, 4, 3);
        this.ctx.fillRect(-12, 5, 4, 3);
        this.ctx.fillRect(8, -8, 4, 3);
        this.ctx.fillRect(8, 5, 4, 3);
        
        // Effet de boost
        if (this.kart.boost > 0) {
            this.ctx.fillStyle = '#FFD700';
            this.ctx.beginPath();
            this.ctx.arc(0, 0, 20, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        // Bouclier
        if (this.kart.shield > 0) {
            this.ctx.strokeStyle = '#00CED1';
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, 25, 0, Math.PI * 2);
            this.ctx.stroke();
        }
        
        this.ctx.restore();
    }

    drawUI() {
        // Panneau principal
        this.drawRoundedRect(20, 20, 300, 120, 10, 'rgba(0, 0, 0, 0.8)');
        
        // Informations de course
        this.drawText(`Tour: ${this.currentLap}/${this.totalLaps}`, 40, 40, {
            font: '18px Arial',
            color: '#FFD700',
            shadow: true
        });
        
        this.drawText(`Temps: ${this.formatTime(this.raceTime)}`, 40, 65, {
            font: '16px Arial',
            color: '#87CEEB',
            shadow: true
        });
        
        if (this.bestLap !== Infinity) {
            this.drawText(`Meilleur: ${this.formatTime(this.bestLap)}`, 40, 90, {
                font: '16px Arial',
                color: '#98FB98',
                shadow: true
            });
        }
        
        this.drawText(`Vitesse: ${Math.abs(this.kart.speed).toFixed(1)}`, 40, 115, {
            font: '16px Arial',
            color: '#FFA500',
            shadow: true
        });
        
        // Indicateurs de power-ups
        if (this.kart.boost > 0) {
            this.drawRoundedRect(this.canvas.width - 120, 20, 100, 30, 5, 'rgba(255, 215, 0, 0.8)');
            this.drawText(`⚡ ${Math.ceil(this.kart.boost/2)}s`, this.canvas.width - 70, 35, {
                font: '14px Arial',
                color: '#000',
                align: 'center'
            });
        }
        
        if (this.kart.shield > 0) {
            this.drawRoundedRect(this.canvas.width - 120, 60, 100, 30, 5, 'rgba(0, 206, 209, 0.8)');
            this.drawText(`🛡️ ${Math.ceil(this.kart.shield/10)}s`, this.canvas.width - 70, 75, {
                font: '14px Arial',
                color: '#000',
                align: 'center'
            });
        }
        
        // Instructions
        const instructions = this.controls.touchControls ? 
            'Utilisez les contrôles tactiles pour piloter' :
            'ZQSD/Flèches: Piloter | ESPACE: Turbo';
            
        this.drawText(instructions, this.canvas.width/2, this.canvas.height - 20, {
            font: '14px Arial',
            color: '#DDD',
            align: 'center',
            shadow: true
        });
    }

    drawMiniMap() {
        const mapX = this.canvas.width - 160;
        const mapY = this.canvas.height - 120;
        const mapWidth = 140;
        const mapHeight = 100;
        
        // Fond de la mini-carte
        this.drawRoundedRect(mapX, mapY, mapWidth, mapHeight, 5, 'rgba(0, 0, 0, 0.8)');
        
        this.ctx.save();
        this.ctx.translate(mapX, mapY);
        this.ctx.scale(this.miniMapScale, this.miniMapScale);
        
        // Piste sur la mini-carte
        this.ctx.fillStyle = '#696969';
        this.ctx.fillRect(100, 80, 600, 440);
        
        // Murs
        this.track.forEach(wall => {
            this.ctx.fillStyle = '#8B4513';
            this.ctx.fillRect(wall.x, wall.y, wall.width, wall.height);
        });
        
        // Kart sur la mini-carte
        this.ctx.fillStyle = '#FF0000';
        this.ctx.beginPath();
        this.ctx.arc(this.kart.x, this.kart.y, 8, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.restore();
    }
}
