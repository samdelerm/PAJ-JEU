class VolleyballGame extends BaseGame {
    constructor(canvas, ctx) {
        super(canvas, ctx);
        this.ball = { 
            x: 400, y: 300, vx: 1, vy: -0.8, radius: 15, // Vitesse encore plus réduite
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

    getGameSpecificControls() {
        return [
            { key: 'Espace/Saut', action: 'Saut/Frappe' },
            { key: 'Tactile', action: 'Bouton vert pour sauter' }
        ];
    }

    initWaves() {
        for (let i = 0; i < 5; i++) {
            this.waves.push({
                x: i * 200,
                offset: Math.random() * Math.PI * 2,
                amplitude: 10 + Math.random() * 5
            });
        }
    }

    update() {
        // Contrôles modernisés (AZERTY + tactile)
        const p1Speed = 4;
        const p2Speed = 4;

        // Joueur 1 (ZQSD ou tactile)
        if (this.controls.isPressed('up') && this.player1.y > 420) this.player1.y -= p1Speed;
        if (this.controls.isPressed('down') && this.player1.y < 540) this.player1.y += p1Speed;
        if (this.controls.isPressed('left') && this.player1.x > 0) this.player1.x -= p1Speed;
        if (this.controls.isPressed('right') && this.player1.x < 340) this.player1.x += p1Speed;
        
        // Saut joueur 1 (unifié avec action pour les contrôles tactiles)
        if ((this.controls.isPressed('jump') || this.controls.isPressed('action')) && !this.player1.isJumping) {
            this.player1.isJumping = true;
            this.player1.jumpPower = 15;
        }

        // Joueur 2 (IA améliorée)
        this.updateAI();

        // Physique de saut
        this.updateJumping(this.player1);
        this.updateJumping(this.player2);

        // Physique de la balle améliorée
        this.updateBall();
        
        // Mise à jour des effets visuels
        this.updateParticles();
        this.updateWaves();
    }

    updateAI() {
        const ballDistance = Math.abs(this.ball.x - (this.player2.x + 20));
        const speed = 3;

        // IA plus intelligente
        if (this.ball.x > 400) {
            // Suivre la balle
            if (this.ball.x > this.player2.x + 20) this.player2.x += speed;
            if (this.ball.x < this.player2.x + 20) this.player2.x -= speed;
            if (this.ball.y > this.player2.y + 30) this.player2.y += speed;
            if (this.ball.y < this.player2.y + 30) this.player2.y -= speed;

            // Saut automatique si la balle est proche
            if (ballDistance < 50 && this.ball.y < this.player2.y && !this.player2.isJumping) {
                this.player2.isJumping = true;
                this.player2.jumpPower = 12;
            }
        }

        // Limites
        this.player2.x = GameEngine.clamp(this.player2.x, 420, 760);
        this.player2.y = GameEngine.clamp(this.player2.y, 420, 540);
    }

    updateJumping(player) {
        if (player.isJumping) {
            player.y -= player.jumpPower;
            player.jumpPower -= 1;
            
            if (player.y >= 500) {
                player.y = 500;
                player.isJumping = false;
                player.jumpPower = 0;
                this.createSandParticles(player.x + 20, player.y + 60);
            }
        }
    }

    updateBall() {
        // Trail de la balle
        this.ball.trail.push({ x: this.ball.x, y: this.ball.y, alpha: 1 });
        if (this.ball.trail.length > 8) this.ball.trail.shift();
        
        this.ball.trail.forEach((point, index) => {
            point.alpha -= 0.15;
        });

        this.ball.x += this.ball.vx;
        this.ball.y += this.ball.vy;
        this.ball.vy += 0.15; // Gravité encore plus réduite pour un jeu très lent
        this.ball.rotation += 0.15;

        // Collision avec le sol
        if (this.ball.y > 570) {
            if (this.ball.x < 400) {
                this.player2.score++;
            } else {
                this.player1.score++;
            }
            this.resetBall();
            this.createSandExplosion(this.ball.x, 570);
        }

        // Collision avec les bords
        if (this.ball.x < 15 || this.ball.x > 785) {
            this.ball.vx *= -0.5; // Réduction de vitesse encore plus importante
            this.createWaterSplash(this.ball.x < 400 ? 15 : 785, this.ball.y);
        }
        if (this.ball.y < 15) {
            this.ball.vy *= -0.4; // Réduction de vitesse encore plus importante
        }

        // Collision avec le filet
        if (this.ball.x > 380 && this.ball.x < 420 && this.ball.y > 420) {
            this.ball.vx *= -0.6; // Réduction de vitesse plus importante
            this.ball.vy *= 0.7;
        }

        // Collision avec les joueurs
        this.checkPlayerCollision(this.player1);
        this.checkPlayerCollision(this.player2);
    }

    checkPlayerCollision(player) {
        const ballCenterX = this.ball.x;
        const ballCenterY = this.ball.y;
        const playerCenterX = player.x + player.width / 2;
        const playerCenterY = player.y + player.height / 2;
        
        const distance = Math.sqrt(
            Math.pow(ballCenterX - playerCenterX, 2) + 
            Math.pow(ballCenterY - playerCenterY, 2)
        );

        if (distance < this.ball.radius + 25) {
            // Déterminer la force selon si le joueur saute
            const power = player.isJumping ? 10 : 7; // Puissances réduites
            const upwardForce = player.isJumping ? -6 : -4; // Forces verticales réduites
            
            // Déterminer la direction selon le côté du joueur
            let targetDirection;
            if (player === this.player1) {
                // Joueur 1 (gauche) envoie toujours à droite
                targetDirection = 1;
            } else {
                // Joueur 2 (droite) envoie toujours à gauche
                targetDirection = -1;
            }
            
            // Calculer l'angle pour envoyer la balle de l'autre côté
            const horizontalPower = power * targetDirection;
            const verticalPower = upwardForce + Math.random() * -2; // Variation réduite
            
            this.ball.vx = horizontalPower + Math.random() * 0.6 - 0.3; // Variation très réduite pour plus de contrôle
            this.ball.vy = verticalPower;
            
            this.createHitParticles(this.ball.x, this.ball.y, player.color);
        }
    }

    createSandParticles(x, y) {
        for (let i = 0; i < 8; i++) {
            this.particles.push({
                x: x + Math.random() * 20 - 10,
                y: y,
                vx: Math.random() * 4 - 2,
                vy: Math.random() * -3 - 1,
                size: Math.random() * 3 + 1,
                color: '#F4D03F',
                life: 30
            });
        }
    }

    createSandExplosion(x, y) {
        for (let i = 0; i < 15; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: Math.random() * 8 - 4,
                vy: Math.random() * -8 - 2,
                size: Math.random() * 4 + 2,
                color: '#F4D03F',
                life: 40
            });
        }
    }

    createWaterSplash(x, y) {
        for (let i = 0; i < 10; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: Math.random() * 6 - 3,
                vy: Math.random() * -6 - 1,
                size: Math.random() * 3 + 1,
                color: '#3498DB',
                life: 25
            });
        }
    }

    createHitParticles(x, y, color) {
        for (let i = 0; i < 6; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: Math.random() * 4 - 2,
                vy: Math.random() * -4 - 1,
                size: Math.random() * 2 + 1,
                color: color,
                life: 20
            });
        }
    }

    updateParticles() {
        this.particles.forEach((particle, index) => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vy += 0.2;
            particle.life--;
            
            if (particle.life <= 0) {
                this.particles.splice(index, 1);
            }
        });
    }

    updateWaves() {
        this.waves.forEach(wave => {
            wave.offset += 0.05;
        });
        
        this.palmTrees.forEach(tree => {
            tree.sway += 0.02;
        });
    }

    resetBall() {
        this.ball.x = 400;
        this.ball.y = 300;
        this.ball.vx = Math.random() > 0.5 ? 1 : -1; // Vitesse initiale très réduite
        this.ball.vy = -2; // Vitesse verticale réduite
        this.ball.trail = [];
        this.ball.rotation = 0;
    }

    render() {
        this.clearCanvas('#87CEEB');

        // Dégradé du ciel
        this.drawGradientRect(0, 0, 800, 300, '#87CEEB', '#FFE4B5');
        
        // Mer avec vagues animées
        this.drawGradientRect(0, 300, 800, 120, '#3498DB', '#2980B9');
        this.renderWaves();

        // Sable avec texture
        this.drawGradientRect(0, 420, 800, 180, '#F4D03F', '#F1C40F');
        this.renderSandTexture();

        // Palmiers animés
        this.renderPalmTrees();

        // Filet moderne
        this.renderNet();

        // Joueurs avec animations
        this.renderPlayer(this.player1);
        this.renderPlayer(this.player2);

        // Balle avec trail et rotation
        this.renderBall();

        // Particules
        this.renderParticles();

        // Interface moderne
        this.renderUI();
    }

    renderWaves() {
        this.ctx.strokeStyle = '#1ABC9C';
        this.ctx.lineWidth = 2;
        
        this.waves.forEach(wave => {
            this.ctx.beginPath();
            for (let x = 0; x < 800; x += 5) {
                const y = 350 + Math.sin((x + wave.x + wave.offset * 100) * 0.01) * wave.amplitude;
                if (x === 0) this.ctx.moveTo(x, y);
                else this.ctx.lineTo(x, y);
            }
            this.ctx.stroke();
        });
    }

    renderSandTexture() {
        for (let i = 0; i < 50; i++) {
            const x = Math.random() * 800;
            const y = 420 + Math.random() * 180;
            this.drawParticle(x, y, 1, 'rgba(241, 196, 15, 0.3)');
        }
    }

    renderPalmTrees() {
        this.palmTrees.forEach(tree => {
            // Tronc
            this.ctx.fillStyle = '#8B4513';
            this.ctx.fillRect(tree.x, tree.y, 15, 100);
            
            // Feuilles avec animation
            const sway = Math.sin(tree.sway) * 10;
            this.ctx.fillStyle = '#228B22';
            this.ctx.save();
            this.ctx.translate(tree.x + 7, tree.y);
            this.ctx.rotate(sway * 0.1);
            this.ctx.fillRect(-20, -30, 40, 30);
            this.ctx.restore();
        });
    }

    renderNet() {
        // Poteau
        this.drawRoundedRect(this.net.x, this.net.y, this.net.width, this.net.height, 5, '#654321');
        
        // Filet
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = 2;
        for (let i = 0; i < 8; i++) {
            const y = this.net.y + (i * 20);
            this.ctx.beginPath();
            this.ctx.moveTo(this.net.x, y);
            this.ctx.lineTo(this.net.x + this.net.width, y);
            this.ctx.stroke();
        }
        for (let i = 0; i < 3; i++) {
            const x = this.net.x + (i * 15);
            this.ctx.beginPath();
            this.ctx.moveTo(x, this.net.y);
            this.ctx.lineTo(x, this.net.y + this.net.height);
            this.ctx.stroke();
        }
    }

    renderPlayer(player) {
        const jumpOffset = player.isJumping ? -Math.abs(player.jumpPower) : 0;
        
        // Ombre
        this.ctx.fillStyle = 'rgba(0,0,0,0.2)';
        this.ctx.fillRect(player.x, 560, player.width, 8);
        
        // Corps du joueur
        this.drawRoundedRect(
            player.x, 
            player.y + jumpOffset, 
            player.width, 
            player.height, 
            8, 
            player.color
        );
        
        // Détails du joueur
        this.ctx.fillStyle = '#2C3E50';
        this.ctx.fillRect(player.x + 15, player.y + 10 + jumpOffset, 10, 10); // Tête
        
        // Bras (animation de saut)
        if (player.isJumping) {
            this.ctx.fillRect(player.x - 5, player.y + 20 + jumpOffset, 8, 15);
            this.ctx.fillRect(player.x + 37, player.y + 20 + jumpOffset, 8, 15);
        }
    }

    renderBall() {
        // Trail de la balle
        this.ball.trail.forEach((point, index) => {
            if (point.alpha > 0) {
                this.drawParticle(point.x, point.y, this.ball.radius * point.alpha * 0.8, 
                    `rgba(255, 230, 109, ${point.alpha})`);
            }
        });

        // Balle principale avec rotation
        this.ctx.save();
        this.ctx.translate(this.ball.x, this.ball.y);
        this.ctx.rotate(this.ball.rotation);
        
        // Dégradé de la balle
        const gradient = this.ctx.createRadialGradient(0, -5, 0, 0, 0, this.ball.radius);
        gradient.addColorStop(0, '#FFE66D');
        gradient.addColorStop(1, '#FF9F43');
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, this.ball.radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Lignes de la balle
        this.ctx.strokeStyle = '#F39C12';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, this.ball.radius * 0.7, 0, Math.PI * 2);
        this.ctx.stroke();
        
        this.ctx.restore();
    }

    renderParticles() {
        this.particles.forEach(particle => {
            const alpha = particle.life / 40;
            this.drawParticle(particle.x, particle.y, particle.size, 
                particle.color.replace('rgb', 'rgba').replace(')', `, ${alpha})`));
        });
    }

    renderUI() {
        // Fond semi-transparent pour l'UI
        this.ctx.fillStyle = 'rgba(0,0,0,0.5)';
        this.ctx.fillRect(0, 0, 800, 80);
        
        // Score avec style moderne
        this.drawText(`Joueur 1: ${this.player1.score}`, 50, 25, {
            font: 'bold 24px Arial',
            color: this.player1.color,
            shadow: true
        });
        
        this.drawText(`IA: ${this.player2.score}`, 550, 25, {
            font: 'bold 24px Arial',
            color: this.player2.color,
            shadow: true
        });

        // Instructions modernes
        const controlText = this.controls.touchControls 
            ? 'Utilisez les contrôles tactiles' 
            : 'ZQSD: Bouger | Espace: Sauter';
            
        this.drawText(controlText, 400, 50, {
            font: '14px Arial',
            color: '#ECF0F1',
            align: 'center'
        });
    }

    gameLoop() {
        if (!this.gameRunning) return;
        
        this.update();
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
}

