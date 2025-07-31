class PacmanGame extends BaseGame {
    constructor(canvas, ctx) {
        super(canvas, ctx);
        this.player = { 
            x: 50, y: 50, size: 25, direction: 0, 
            animation: 0, powerMode: false, powerTimer: 0
        };
        this.dots = [];
        this.enemies = [];
        this.powerPellets = [];
        this.score = 0;
        this.level = 1;
        this.particles = [];
        this.campfire = { x: 400, y: 300, flames: [] };
        
        // Sprites
        this.sprites = {};
        this.spritesLoaded = false;
        this.loadSprites();
        
        this.initLevel();
        this.initCampfire();
    }

    getGameSpecificControls() {
        return [
            { key: 'Espace', action: 'Sprint/Dash' },
            { key: 'Tactile', action: 'Tap pour changer direction' }
        ];
    }

    loadSprites() {
        const spriteFiles = [
            'pacman.png',
            'ghost.png',
            'dot.png',
            'power-pellet.png'
        ];
        
        let loadedCount = 0;
        
        spriteFiles.forEach(fileName => {
            const img = new Image();
            img.onload = () => {
                console.log(`Sprite ${fileName} chargé avec succès`);
                loadedCount++;
                if (loadedCount === spriteFiles.length) {
                    this.spritesLoaded = true;
                }
            };
            img.onerror = () => {
                console.log(`Sprite ${fileName} non trouvé, génération d'un sprite de secours`);
                // Générer un sprite de secours
                const spriteType = fileName.replace('.png', '');
                const generatedSprite = SpriteGenerator.generateSprite(spriteType, 32);
                this.sprites[spriteType] = SpriteGenerator.createImageFromCanvas(generatedSprite);
                
                loadedCount++;
                if (loadedCount === spriteFiles.length) {
                    this.spritesLoaded = true;
                }
            };
            img.src = `assets/sprites/${fileName}`;
            this.sprites[fileName.replace('.png', '')] = img;
        });
    }

    initLevel() {
        // Créer une grille de points plus organisée
        for (let x = 80; x < 720; x += 60) {
            for (let y = 80; y < 520; y += 60) {
                if (Math.random() > 0.2) {
                    this.dots.push({ 
                        x: x, y: y, collected: false, 
                        size: 3 + Math.random() * 2,
                        glow: Math.random() * Math.PI * 2
                    });
                }
            }
        }

        // Power pellets spéciaux
        this.powerPellets = [
            { x: 100, y: 100, collected: false, pulse: 0 },
            { x: 700, y: 100, collected: false, pulse: 0 },
            { x: 100, y: 500, collected: false, pulse: 0 },
            { x: 700, y: 500, collected: false, pulse: 0 }
        ];

        // Ennemis avec IA améliorée
        const enemyColors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#A8E6CF'];
        for (let i = 0; i < 4; i++) {
            this.enemies.push({
                x: 200 + i * 120,
                y: 200 + Math.random() * 200,
                vx: (Math.random() - 0.5) * 3,
                vy: (Math.random() - 0.5) * 3,
                size: 20,
                color: enemyColors[i],
                scared: false,
                scaredTimer: 0,
                eyes: { x: 0, y: 0 },
                trail: []
            });
        }
    }

    initCampfire() {
        for (let i = 0; i < 15; i++) {
            this.campfire.flames.push({
                x: this.campfire.x + Math.random() * 40 - 20,
                y: this.campfire.y,
                height: Math.random() * 30 + 20,
                life: Math.random() * 60 + 30,
                color: Math.random() > 0.5 ? '#FF6B6B' : '#FFE66D'
            });
        }
    }

    update() {
        // Contrôles modernisés
        const speed = 3;
        let moved = false;

        if (this.controls.isPressed('up')) {
            this.player.y -= speed;
            this.player.direction = 1.5 * Math.PI;
            moved = true;
        }
        if (this.controls.isPressed('down')) {
            this.player.y += speed;
            this.player.direction = 0.5 * Math.PI;
            moved = true;
        }
        if (this.controls.isPressed('left')) {
            this.player.x -= speed;
            this.player.direction = Math.PI;
            moved = true;
        }
        if (this.controls.isPressed('right')) {
            this.player.x += speed;
            this.player.direction = 0;
            moved = true;
        }

        if (moved) this.player.animation += 0.3;

        // Limites de l'écran avec téléportation
        if (this.player.x < -25) this.player.x = 800;
        if (this.player.x > 825) this.player.x = 0;
        this.player.y = GameEngine.clamp(this.player.y, 25, 575);

        // Gestion du mode power
        if (this.player.powerMode) {
            this.player.powerTimer--;
            if (this.player.powerTimer <= 0) {
                this.player.powerMode = false;
                this.enemies.forEach(enemy => enemy.scared = false);
            }
        }

        // Mise à jour des ennemis
        this.updateEnemies();

        // Collision avec les points
        this.checkDotCollision();
        
        // Collision avec les power pellets
        this.checkPowerPelletCollision();

        // Collision avec les ennemis
        this.checkEnemyCollision();

        // Mise à jour des effets
        this.updateParticles();
        this.updateCampfire();
        this.updateDotsGlow();
    }

    updateEnemies() {
        this.enemies.forEach(enemy => {
            // IA améliorée
            if (enemy.scared) {
                // Fuir le joueur
                const dx = enemy.x - this.player.x;
                const dy = enemy.y - this.player.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance > 0) {
                    enemy.vx = (dx / distance) * 2;
                    enemy.vy = (dy / distance) * 2;
                }
                
                enemy.scaredTimer--;
                if (enemy.scaredTimer <= 0) enemy.scared = false;
            } else {
                // Poursuivre le joueur
                const dx = this.player.x - enemy.x;
                const dy = this.player.y - enemy.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance > 0 && distance < 150) {
                    enemy.vx = (dx / distance) * 1.5;
                    enemy.vy = (dy / distance) * 1.5;
                }
            }

            enemy.x += enemy.vx;
            enemy.y += enemy.vy;

            // Rebonds sur les bords
            if (enemy.x < 25 || enemy.x > 775) enemy.vx *= -1;
            if (enemy.y < 25 || enemy.y > 575) enemy.vy *= -1;

            // Trail des ennemis
            enemy.trail.push({ x: enemy.x, y: enemy.y, alpha: 1 });
            if (enemy.trail.length > 5) enemy.trail.shift();
            enemy.trail.forEach(point => point.alpha -= 0.2);

            // Yeux qui suivent le joueur
            const eyeAngle = Math.atan2(this.player.y - enemy.y, this.player.x - enemy.x);
            enemy.eyes.x = Math.cos(eyeAngle) * 3;
            enemy.eyes.y = Math.sin(eyeAngle) * 3;
        });
    }

    checkDotCollision() {
        this.dots.forEach((dot, index) => {
            if (!dot.collected) {
                const dist = Math.sqrt((this.player.x - dot.x) ** 2 + (this.player.y - dot.y) ** 2);
                if (dist < 25) {
                    dot.collected = true;
                    this.score += 10;
                    this.createCollectParticles(dot.x, dot.y);
                }
            }
        });
    }

    checkPowerPelletCollision() {
        this.powerPellets.forEach(pellet => {
            if (!pellet.collected) {
                const dist = Math.sqrt((this.player.x - pellet.x) ** 2 + (this.player.y - pellet.y) ** 2);
                if (dist < 30) {
                    pellet.collected = true;
                    this.score += 50;
                    this.player.powerMode = true;
                    this.player.powerTimer = 300;
                    
                    this.enemies.forEach(enemy => {
                        enemy.scared = true;
                        enemy.scaredTimer = 300;
                    });
                    
                    this.createPowerParticles(pellet.x, pellet.y);
                }
            }
        });
    }

    checkEnemyCollision() {
        this.enemies.forEach((enemy, index) => {
            const dist = Math.sqrt((this.player.x - enemy.x) ** 2 + (this.player.y - enemy.y) ** 2);
            if (dist < 35) {
                if (this.player.powerMode && enemy.scared) {
                    // Manger l'ennemi
                    this.score += 200;
                    this.createEatParticles(enemy.x, enemy.y);
                    enemy.x = 400;
                    enemy.y = 300;
                    enemy.scared = false;
                } else if (!enemy.scared) {
                    this.resetPlayer();
                }
            }
        });
    }

    createCollectParticles(x, y) {
        for (let i = 0; i < 6; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: Math.random() * 4 - 2,
                vy: Math.random() * 4 - 2,
                size: 2,
                color: '#FFE4E1',
                life: 20
            });
        }
    }

    createPowerParticles(x, y) {
        for (let i = 0; i < 15; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: Math.random() * 6 - 3,
                vy: Math.random() * 6 - 3,
                size: 4,
                color: '#FFD700',
                life: 30
            });
        }
    }

    createEatParticles(x, y) {
        for (let i = 0; i < 10; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: Math.random() * 8 - 4,
                vy: Math.random() * 8 - 4,
                size: 3,
                color: '#FF6B6B',
                life: 25
            });
        }
    }

    updateParticles() {
        this.particles.forEach((particle, index) => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vx *= 0.98;
            particle.vy *= 0.98;
            particle.life--;
            
            if (particle.life <= 0) {
                this.particles.splice(index, 1);
            }
        });
    }

    updateCampfire() {
        this.campfire.flames.forEach((flame, index) => {
            flame.y -= 2;
            flame.life--;
            flame.x += Math.sin(flame.life * 0.1) * 0.5;
            
            if (flame.life <= 0) {
                this.campfire.flames.splice(index, 1);
                // Ajouter une nouvelle flamme
                this.campfire.flames.push({
                    x: this.campfire.x + Math.random() * 40 - 20,
                    y: this.campfire.y,
                    height: Math.random() * 30 + 20,
                    life: Math.random() * 60 + 30,
                    color: Math.random() > 0.5 ? '#FF6B6B' : '#FFE66D'
                });
            }
        });
    }

    updateDotsGlow() {
        this.dots.forEach(dot => {
            if (!dot.collected) {
                dot.glow += 0.1;
            }
        });
        
        this.powerPellets.forEach(pellet => {
            if (!pellet.collected) {
                pellet.pulse += 0.15;
            }
        });
    }

    resetPlayer() {
        this.player.x = 50;
        this.player.y = 50;
        this.score = Math.max(0, this.score - 50);
        this.player.powerMode = false;
        this.enemies.forEach(enemy => enemy.scared = false);
    }

    render() {
        // Fond dégradé de forêt
        this.drawGradientRect(0, 0, 800, 600, '#2C5F2D', '#0F3460');

        // Étoiles
        this.renderStars();

        // Feu de camp
        this.renderCampfire();

        // Arbres en arrière-plan
        this.renderTrees();

        // Points avec effet de lueur
        this.renderDots();

        // Power pellets
        this.renderPowerPellets();

        // Ennemis avec trail
        this.renderEnemies();

        // Joueur avec animation
        this.renderPlayer();

        // Particules
        this.renderParticles();

        // Interface
        this.renderUI();
    }

    renderStars() {
        for (let i = 0; i < 100; i++) {
            const x = (i * 13) % 800;
            const y = (i * 17) % 300;
            const alpha = 0.3 + Math.sin((i + Date.now() * 0.001)) * 0.3;
            this.drawParticle(x, y, 1, `rgba(255, 255, 255, ${Math.max(0, alpha)})`);
        }
    }

    renderCampfire() {
        // Base du feu
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(this.campfire.x - 20, this.campfire.y, 40, 20);

        // Flammes
        this.campfire.flames.forEach(flame => {
            const alpha = flame.life / 60;
            this.ctx.fillStyle = flame.color.replace('rgb', 'rgba').replace(')', `, ${alpha})`);
            this.ctx.fillRect(flame.x - 3, flame.y - flame.height, 6, flame.height);
        });

        // Lueur
        const gradient = this.ctx.createRadialGradient(
            this.campfire.x, this.campfire.y - 20, 0,
            this.campfire.x, this.campfire.y - 20, 100
        );
        gradient.addColorStop(0, 'rgba(255, 100, 0, 0.3)');
        gradient.addColorStop(1, 'rgba(255, 100, 0, 0)');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(this.campfire.x - 100, this.campfire.y - 120, 200, 200);
    }

    renderTrees() {
        for (let i = 0; i < 8; i++) {
            const x = i * 120 + 50;
            const y = 100 + Math.sin(i) * 30;
            
            // Tronc
            this.ctx.fillStyle = '#4A2C2A';
            this.ctx.fillRect(x, y, 15, 80);
            
            // Feuillage
            this.ctx.fillStyle = '#1E3A1E';
            this.ctx.beginPath();
            this.ctx.arc(x + 7, y, 25, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    renderDots() {
        this.dots.forEach(dot => {
            if (!dot.collected) {
                dot.glow += 0.1;
                const glowSize = dot.size + Math.sin(dot.glow) * 2;
                
                if (this.spritesLoaded && this.sprites.dot && this.sprites.dot.complete) {
                    // Utiliser le sprite
                    try {
                        this.ctx.save();
                        this.ctx.globalAlpha = 0.8 + Math.sin(dot.glow) * 0.2;
                        this.ctx.drawImage(this.sprites.dot, 
                            dot.x - dot.size, dot.y - dot.size, 
                            dot.size * 2, dot.size * 2);
                        this.ctx.restore();
                    } catch (e) {
                        // Si erreur, utiliser le rendu par défaut
                        this.renderDotDefault(dot, glowSize);
                    }
                } else {
                    // Rendu par défaut
                    this.renderDotDefault(dot, glowSize);
                }
            }
        });
    }

    renderDotDefault(dot, glowSize) {
        // Lueur
        this.drawParticle(dot.x, dot.y, glowSize + 5, 'rgba(255, 228, 225, 0.3)');
        
        // Point principal
        this.drawParticle(dot.x, dot.y, dot.size, '#FFE4E1');
    }

    renderPowerPellets() {
        this.powerPellets.forEach(pellet => {
            if (!pellet.collected) {
                const pulseSize = 8 + Math.sin(pellet.pulse) * 4;
                
                if (this.spritesLoaded && this.sprites['power-pellet'] && this.sprites['power-pellet'].complete) {
                    // Utiliser le sprite
                    try {
                        this.ctx.save();
                        this.ctx.globalAlpha = 0.7 + Math.sin(pellet.pulse) * 0.3;
                        this.ctx.drawImage(this.sprites['power-pellet'], 
                            pellet.x - pulseSize, pellet.y - pulseSize, 
                            pulseSize * 2, pulseSize * 2);
                        this.ctx.restore();
                    } catch (e) {
                        // Si erreur, utiliser le rendu par défaut
                        this.renderPowerPelletDefault(pellet, pulseSize);
                    }
                } else {
                    // Rendu par défaut
                    this.renderPowerPelletDefault(pellet, pulseSize);
                }
            }
        });
    }

    renderPowerPelletDefault(pellet, pulseSize) {
        // Aura pulsante
        this.drawParticle(pellet.x, pellet.y, pulseSize + 10, 'rgba(255, 215, 0, 0.4)');
        
        // Pellet principal
        this.drawParticle(pellet.x, pellet.y, pulseSize, '#FFD700');
    }

    renderEnemies() {
        this.enemies.forEach(enemy => {
            // Trail
            enemy.trail.forEach(point => {
                if (point.alpha > 0) {
                    this.drawParticle(point.x, point.y, enemy.size * point.alpha * 0.5, 
                        enemy.color.replace('rgb', 'rgba').replace(')', `, ${point.alpha * 0.3})`));
                }
            });

            // Corps de l'ennemi
            if (this.spritesLoaded && this.sprites.ghost && this.sprites.ghost.complete) {
                // Utiliser le sprite
                try {
                    this.ctx.save();
                    
                    if (enemy.scared) {
                        // Effet de peur
                        this.ctx.filter = enemy.scaredTimer % 20 < 10 ? 'hue-rotate(180deg)' : 'brightness(0.5)';
                    }
                    
                    this.ctx.drawImage(this.sprites.ghost, 
                        enemy.x - enemy.size, enemy.y - enemy.size, 
                        enemy.size * 2, enemy.size * 2);
                        
                    this.ctx.restore();
                } catch (e) {
                    // Si erreur, utiliser le rendu par défaut
                    this.renderEnemyDefault(enemy);
                }
            } else {
                // Rendu par défaut
                this.renderEnemyDefault(enemy);
            }
        });
    }

    renderEnemyDefault(enemy) {
        const color = enemy.scared ? '#000080' : enemy.color;
        
        if (enemy.scared) {
            // Effet de peur (clignotement)
            const flashColor = enemy.scaredTimer % 20 < 10 ? '#000080' : '#FFFFFF';
            this.drawParticle(enemy.x, enemy.y, enemy.size, flashColor);
        } else {
            this.drawParticle(enemy.x, enemy.y, enemy.size, color);
        }

        // Yeux
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillRect(enemy.x - 6 + enemy.eyes.x, enemy.y - 6 + enemy.eyes.y, 4, 4);
        this.ctx.fillRect(enemy.x + 2 + enemy.eyes.x, enemy.y - 6 + enemy.eyes.y, 4, 4);
        
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(enemy.x - 5 + enemy.eyes.x, enemy.y - 5 + enemy.eyes.y, 2, 2);
        this.ctx.fillRect(enemy.x + 3 + enemy.eyes.x, enemy.y - 5 + enemy.eyes.y, 2, 2);
    }

    renderPlayer() {
        const powerGlow = this.player.powerMode ? 5 + Math.sin(Date.now() * 0.01) * 3 : 0;

        // Aura de pouvoir
        if (this.player.powerMode) {
            this.drawParticle(this.player.x, this.player.y, this.player.size + powerGlow + 10, 
                'rgba(255, 215, 0, 0.4)');
        }

        if (this.spritesLoaded && this.sprites.pacman && this.sprites.pacman.complete) {
            // Utiliser le sprite
            try {
                this.ctx.save();
                this.ctx.translate(this.player.x, this.player.y);
                this.ctx.rotate(this.player.direction);
                
                if (this.player.powerMode) {
                    this.ctx.filter = 'brightness(1.3) drop-shadow(0 0 10px gold)';
                }
                
                this.ctx.drawImage(this.sprites.pacman, 
                    -(this.player.size + powerGlow), -(this.player.size + powerGlow), 
                    (this.player.size + powerGlow) * 2, (this.player.size + powerGlow) * 2);
                    
                this.ctx.restore();
            } catch (e) {
                // Si erreur, utiliser le rendu par défaut
                this.renderPlayerDefault(powerGlow);
            }
        } else {
            // Rendu par défaut
            this.renderPlayerDefault(powerGlow);
        }
    }

    renderPlayerDefault(powerGlow) {
        const mouthOpen = Math.sin(this.player.animation) > 0;

        // Corps du joueur
        this.ctx.fillStyle = this.player.powerMode ? '#FFD700' : '#FFFF00';
        this.ctx.beginPath();
        
        if (mouthOpen) {
            // Bouche ouverte (Pac-Man classique)
            this.ctx.arc(this.player.x, this.player.y, this.player.size + powerGlow, 
                this.player.direction + 0.5, this.player.direction - 0.5);
            this.ctx.lineTo(this.player.x, this.player.y);
        } else {
            // Bouche fermée
            this.ctx.arc(this.player.x, this.player.y, this.player.size + powerGlow, 0, Math.PI * 2);
        }
        
        this.ctx.fill();

        // Œil
        this.ctx.fillStyle = '#000000';
        const eyeX = this.player.x + Math.cos(this.player.direction - Math.PI/2) * (this.player.size * 0.3);
        const eyeY = this.player.y + Math.sin(this.player.direction - Math.PI/2) * (this.player.size * 0.3);
        this.ctx.beginPath();
        this.ctx.arc(eyeX, eyeY, 3, 0, Math.PI * 2);
        this.ctx.fill();
    }

    renderParticles() {
        this.particles.forEach(particle => {
            const alpha = particle.life / 30;
            this.drawParticle(particle.x, particle.y, particle.size, 
                particle.color.replace('rgb', 'rgba').replace(')', `, ${alpha})`));
        });
    }

    renderUI() {
        // Panneau de score avec style camping
        this.drawRoundedRect(10, 10, 200, 60, 10, 'rgba(139, 69, 19, 0.8)');
        
        this.drawText(`Score: ${this.score}`, 20, 25, {
            font: 'bold 20px Arial',
            color: '#FFE4E1',
            shadow: true
        });

        const dotsLeft = this.dots.filter(d => !d.collected).length;
        this.drawText(`Marshmallows: ${dotsLeft}`, 20, 45, {
            font: '14px Arial',
            color: '#FFE4E1'
        });

        // Mode pouvoir
        if (this.player.powerMode) {
            this.drawText('MODE POUVOIR!', 400, 30, {
                font: 'bold 24px Arial',
                color: '#FFD700',
                align: 'center',
                shadow: true
            });
        }

        // Instructions
        const controlText = this.controls.touchControls 
            ? 'Contrôles tactiles actifs' 
            : 'ZQSD: Bouger | Collectez tous les marshmallows!';
            
        this.drawText(controlText, 400, 570, {
            font: '14px Arial',
            color: '#FFE4E1',
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

