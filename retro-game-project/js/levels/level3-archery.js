class ArcheryGame extends BaseGame {
    constructor(canvas, ctx) {
        super(canvas, ctx);
        this.player = { 
            x: 80, 
            y: this.canvas.height - 150, 
            width: 40, 
            height: 60,
            angle: 0,
            aimDirection: 0
        };
        this.arrows = [];
        this.targets = [];
        this.wind = { strength: 0, direction: 1 };
        this.score = 0;
        this.power = 0;
        this.charging = false;
        this.maxPower = 100;
        this.particles = [];
        this.time = 0;
        this.level = 1;
        this.targetsHit = 0;
        this.totalTargets = 0;
        
        this.initLevel();
    }

    initLevel() {
        this.targets = [];
        this.arrows = [];
        this.particles = [];
        
        // Créer des cibles à différentes distances avec variété
        const targetTypes = [
            { size: 50, points: 100, color: '#FFD700' }, // Or
            { size: 40, points: 75, color: '#C0C0C0' },  // Argent
            { size: 35, points: 50, color: '#CD7F32' },  // Bronze
            { size: 30, points: 25, color: '#FF6B6B' },  // Rouge
            { size: 25, points: 10, color: '#4ECDC4' }   // Cyan
        ];

        for (let i = 0; i < 6; i++) {
            const typeIndex = Math.floor(Math.random() * targetTypes.length);
            const targetType = targetTypes[typeIndex];
            
            this.targets.push({
                x: 250 + i * 100 + Math.random() * 50,
                y: 100 + Math.random() * 200,
                width: targetType.size,
                height: targetType.size,
                originalSize: targetType.size,
                hit: false,
                points: targetType.points,
                color: targetType.color,
                pulse: 0,
                hitTime: 0,
                rings: this.generateTargetRings(targetType.size, targetType.color)
            });
        }
        
        this.totalTargets = this.targets.length;
        this.generateWind();
        
        // Particules d'ambiance (feuilles, poussière)
        for (let i = 0; i < 20; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * 2,
                vy: Math.random() * 1 + 0.5,
                size: Math.random() * 3 + 1,
                color: `hsla(${60 + Math.random() * 60}, 70%, 50%, 0.6)`,
                type: 'leaf',
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.1
            });
        }
    }

    generateTargetRings(size, baseColor) {
        const rings = [];
        const numRings = 3;
        for (let i = 0; i < numRings; i++) {
            const ringSize = size * (1 - i * 0.25);
            const alpha = 0.8 - i * 0.2;
            rings.push({
                size: ringSize,
                color: this.adjustColorAlpha(baseColor, alpha)
            });
        }
        return rings;
    }

    adjustColorAlpha(color, alpha) {
        if (color.startsWith('#')) {
            const r = parseInt(color.slice(1, 3), 16);
            const g = parseInt(color.slice(3, 5), 16);
            const b = parseInt(color.slice(5, 7), 16);
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        }
        return color;
    }

    generateWind() {
        this.wind.strength = Math.random() * 4 + 1;
        this.wind.direction = Math.random() > 0.5 ? 1 : -1;
        
        // Ajouter des particules de vent
        for (let i = 0; i < 10; i++) {
            this.particles.push({
                x: -10,
                y: Math.random() * this.canvas.height,
                vx: this.wind.strength * this.wind.direction * 2,
                vy: (Math.random() - 0.5) * 2,
                size: Math.random() * 2 + 1,
                color: 'rgba(200, 200, 255, 0.4)',
                type: 'wind',
                life: 100,
                maxLife: 100
            });
        }
    }

    update(deltaTime) {
        if (!this.gameRunning) return;
        
        this.time += deltaTime || 16;
        
        // Contrôles de visée simplifiés (AZERTY/QWERTY + tactile)
        if (this.controls.isPressed('up')) {
            this.player.aimDirection = Math.max(this.player.aimDirection - 0.03, -Math.PI/4);
        }
        if (this.controls.isPressed('down')) {
            this.player.aimDirection = Math.min(this.player.aimDirection + 0.03, Math.PI/6);
        }
        
        // Tir simplifié - maintenir pour charger, relâcher pour tirer
        if (this.controls.isPressed('shift')) {
            if (!this.charging) {
                this.charging = true;
                this.power = 0;
            } else if (this.power < this.maxPower) {
                this.power += 3; // Charge plus rapide
            }
        } else if (this.charging) {
            this.shootArrow();
            this.charging = false;
            this.power = 0;
        }
        
        // Mise à jour des flèches
        this.updateArrows();
        
        // Mise à jour des particules
        this.updateParticles();
        
        // Mise à jour des cibles (animation)
        this.updateTargets();
        
        // Vérifier fin de niveau
        if (this.targetsHit >= this.totalTargets) {
            this.nextLevel();
        }
    }

    shootArrow() {
        if (this.arrows.length < 3 && this.power > 20) { // Puissance minimum plus basse
            const speed = (this.power / this.maxPower) * 12 + 8; // Vitesse plus élevée
            const angle = this.player.aimDirection;
            
            this.arrows.push({
                x: this.player.x + this.player.width,
                y: this.player.y + this.player.height / 2,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                width: 25,
                height: 4,
                angle: angle,
                trail: [],
                stuck: false
            });
            
            // Effet de tir
            this.createShootEffect();
        }
    }

    shootArrow() {
        if (this.arrows.length < 5 && this.power > 10) {
            const speed = (this.power / this.maxPower) * 15 + 5;
            const angle = this.player.aimDirection;
            
            this.arrows.push({
                x: this.player.x + this.player.width,
                y: this.player.y + this.player.height / 2,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                width: 20,
                height: 3,
                angle: angle,
                trail: [],
                stuck: false
            });
            
            // Effet de tir
            this.createShootEffect();
        }
    }

    createShootEffect() {
        // Particules d'effet de tir
        for (let i = 0; i < 10; i++) {
            this.particles.push({
                x: this.player.x + this.player.width,
                y: this.player.y + this.player.height / 2,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                size: Math.random() * 3 + 1,
                color: `hsl(${30 + Math.random() * 30}, 70%, 60%)`,
                type: 'shoot',
                life: 30,
                maxLife: 30
            });
        }
    }

    updateArrows() {
        this.arrows.forEach((arrow, index) => {
            if (!arrow.stuck) {
                // Physique simplifiée de la flèche
                arrow.vy += 0.15; // Gravité réduite
                arrow.vx += this.wind.strength * this.wind.direction * 0.01; // Vent réduit
                
                arrow.x += arrow.vx;
                arrow.y += arrow.vy;
                
                // Angle de la flèche selon sa trajectoire
                arrow.angle = Math.atan2(arrow.vy, arrow.vx);
                
                // Trail de la flèche
                arrow.trail.push({ x: arrow.x, y: arrow.y });
                if (arrow.trail.length > 6) arrow.trail.shift();
                
                // Collision avec les cibles (zone plus généreuse)
                this.checkArrowTargetCollision(arrow, index);
                
                // Suppression si hors écran
                if (arrow.x > this.canvas.width + 50 || arrow.y > this.canvas.height + 50) {
                    this.arrows.splice(index, 1);
                }
            }
        });
    }

    updateParticles() {
        this.particles.forEach((particle, index) => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            
            if (particle.type === 'leaf') {
                particle.rotation += particle.rotationSpeed;
                particle.vy += 0.01; // Gravité légère
                
                // Réapparition en haut
                if (particle.y > this.canvas.height + 10) {
                    particle.y = -10;
                    particle.x = Math.random() * this.canvas.width;
                }
            } else if (particle.type === 'wind') {
                particle.life--;
                if (particle.life <= 0) {
                    this.particles.splice(index, 1);
                }
            } else if (particle.type === 'shoot' || particle.type === 'hit') {
                particle.life--;
                if (particle.life <= 0) {
                    this.particles.splice(index, 1);
                }
            }
        });
    }

    updateTargets() {
        this.targets.forEach(target => {
            if (!target.hit) {
                target.pulse += 0.1;
            } else {
                target.hitTime++;
                if (target.hitTime < 30) {
                    // Animation de rétrécissement quand touché
                    target.width = target.originalSize * (1 - target.hitTime / 30);
                    target.height = target.originalSize * (1 - target.hitTime / 30);
                }
            }
        });
    }

    checkArrowTargetCollision(arrow, arrowIndex) {
        this.targets.forEach(target => {
            if (!target.hit) {
                // Zone de collision plus généreuse
                const margin = 15;
                if (arrow.x < target.x + target.width + margin &&
                    arrow.x + arrow.width > target.x - margin &&
                    arrow.y < target.y + target.height + margin &&
                    arrow.y + arrow.height > target.y - margin) {
                    
                    target.hit = true;
                    arrow.stuck = true;
                    this.score += target.points;
                    this.targetsHit++;
                    
                    // Effet de frappe
                    this.createHitEffect(target.x + target.width/2, target.y + target.height/2, target.color);
                }
            }
        });
    }

    createHitEffect(x, y, color) {
        for (let i = 0; i < 15; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                size: Math.random() * 4 + 1,
                color: color,
                type: 'hit',
                life: 40,
                maxLife: 40
            });
        }
    }

    nextLevel() {
        this.level++;
        this.targetsHit = 0;
        
        // Augmenter la difficulté
        this.initLevel();
        
        // Plus de cibles et de vent
        if (this.level > 1) {
            for (let i = 0; i < this.level; i++) {
                this.targets.push({
                    x: 300 + Math.random() * 400,
                    y: 50 + Math.random() * 250,
                    width: 20 + Math.random() * 30,
                    height: 20 + Math.random() * 30,
                    originalSize: 25,
                    hit: false,
                    points: 150,
                    color: '#FF1493',
                    pulse: 0,
                    hitTime: 0,
                    rings: this.generateTargetRings(25, '#FF1493')
                });
            }
            this.totalTargets = this.targets.length;
        }
    }

    render() {
        // Ciel avec dégradé
        this.drawGradientRect(0, 0, this.canvas.width, this.canvas.height * 0.3, 
            '#87CEEB', '#E0F6FF', 'vertical');
        
        // Montagnes en arrière-plan
        this.drawMountains();
        
        // Forêt
        this.drawGradientRect(0, this.canvas.height * 0.3, this.canvas.width, this.canvas.height * 0.7, 
            '#228B22', '#32CD32', 'vertical');
        
        // Arbres
        this.drawTrees();
        
        // Particules d'ambiance
        this.drawParticles();
        
        // Archer
        this.drawPlayer();
        
        // Cibles
        this.drawTargets();
        
        // Flèches
        this.drawArrows();
        
        // Interface
        this.drawUI();
        
        // Indicateur de vent
        this.drawWindIndicator();
    }

    drawMountains() {
        this.ctx.fillStyle = '#696969';
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.canvas.height * 0.3);
        for (let i = 0; i <= this.canvas.width; i += 50) {
            const height = Math.sin(i * 0.01) * 50 + this.canvas.height * 0.2;
            this.ctx.lineTo(i, height);
        }
        this.ctx.lineTo(this.canvas.width, this.canvas.height * 0.3);
        this.ctx.fill();
    }

    drawTrees() {
        for (let i = 0; i < 15; i++) {
            const x = 120 + i * 45 + (i % 3) * 20;
            const y = this.canvas.height * 0.6 + Math.sin(i * 0.5) * 30;
            const height = 80 + Math.random() * 40;
            
            // Tronc avec dégradé
            this.drawGradientRect(x, y, 15, height, '#8B4513', '#654321', 'horizontal');
            
            // Feuillage
            this.ctx.fillStyle = `hsl(${100 + Math.sin(this.time * 0.001 + i) * 20}, 60%, 30%)`;
            this.ctx.beginPath();
            this.ctx.arc(x + 7.5, y - 10, 25 + Math.sin(this.time * 0.002 + i) * 5, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Effet de profondeur
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
            this.ctx.beginPath();
            this.ctx.arc(x + 10, y - 7, 20, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    drawParticles() {
        this.particles.forEach(particle => {
            this.ctx.save();
            this.ctx.globalAlpha = particle.type === 'wind' ? particle.life / particle.maxLife : 
                                   particle.type === 'hit' || particle.type === 'shoot' ? particle.life / particle.maxLife : 1;
            
            if (particle.type === 'leaf') {
                this.ctx.translate(particle.x, particle.y);
                this.ctx.rotate(particle.rotation);
                this.ctx.fillStyle = particle.color;
                this.ctx.fillRect(-particle.size/2, -particle.size/4, particle.size, particle.size/2);
            } else {
                this.drawParticle(particle.x, particle.y, particle.size, particle.color, 
                    this.ctx.globalAlpha);
            }
            this.ctx.restore();
        });
    }

    drawPlayer() {
        const x = this.player.x;
        const y = this.player.y;
        
        // Corps de l'archer
        this.drawGradientRect(x + 5, y + 20, 15, 30, '#D2691E', '#8B4513', 'vertical');
        
        // Tête
        this.ctx.fillStyle = '#FDBCB4';
        this.ctx.beginPath();
        this.ctx.arc(x + 12, y + 15, 8, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Cheveux
        this.ctx.fillStyle = '#8B4513';
        this.ctx.beginPath();
        this.ctx.arc(x + 12, y + 10, 10, Math.PI, Math.PI * 2);
        this.ctx.fill();
        
        // Bras et arc
        this.ctx.strokeStyle = '#654321';
        this.ctx.lineWidth = 4;
        this.ctx.beginPath();
        
        const bowX = x + 25;
        const bowY = y + 25;
        const bowRadius = 20;
        
        // Arc
        this.ctx.arc(bowX, bowY, bowRadius, -Math.PI/4, Math.PI/4);
        this.ctx.stroke();
        
        // Corde
        this.ctx.lineWidth = 2;
        this.ctx.strokeStyle = '#DDD';
        this.ctx.beginPath();
        const topString = {
            x: bowX + Math.cos(-Math.PI/4) * bowRadius,
            y: bowY + Math.sin(-Math.PI/4) * bowRadius
        };
        const bottomString = {
            x: bowX + Math.cos(Math.PI/4) * bowRadius,
            y: bowY + Math.sin(Math.PI/4) * bowRadius
        };
        
        if (this.charging) {
            // Corde tendue
            const pullBack = this.power / this.maxPower * 15;
            this.ctx.moveTo(topString.x, topString.y);
            this.ctx.lineTo(bowX - pullBack, bowY);
            this.ctx.lineTo(bottomString.x, bottomString.y);
        } else {
            // Corde normale
            this.ctx.moveTo(topString.x, topString.y);
            this.ctx.lineTo(bottomString.x, bottomString.y);
        }
        this.ctx.stroke();
        
        // Ligne de visée
        if (this.charging) {
            this.ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
            this.ctx.lineWidth = 2;
            this.ctx.setLineDash([5, 5]);
            this.ctx.beginPath();
            this.ctx.moveTo(bowX, bowY);
            this.ctx.lineTo(bowX + Math.cos(this.player.aimDirection) * 200, 
                           bowY + Math.sin(this.player.aimDirection) * 200);
            this.ctx.stroke();
            this.ctx.setLineDash([]);
        }
    }

    drawTargets() {
        this.targets.forEach(target => {
            if (!target.hit || target.hitTime < 30) {
                const x = target.x;
                const y = target.y;
                const size = target.width;
                
                // Pulsation
                const pulse = Math.sin(target.pulse) * 0.1 + 1;
                const currentSize = size * pulse;
                
                // Ombre
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
                this.ctx.beginPath();
                this.ctx.arc(x + size/2 + 3, y + size/2 + 3, currentSize/2, 0, Math.PI * 2);
                this.ctx.fill();
                
                // Anneaux de la cible
                target.rings.forEach((ring, index) => {
                    this.ctx.fillStyle = ring.color;
                    this.ctx.beginPath();
                    this.ctx.arc(x + size/2, y + size/2, ring.size * pulse / 2, 0, Math.PI * 2);
                    this.ctx.fill();
                });
                
                // Centre brillant
                this.ctx.fillStyle = '#FFFF00';
                this.ctx.beginPath();
                this.ctx.arc(x + size/2, y + size/2, 3 * pulse, 0, Math.PI * 2);
                this.ctx.fill();
                
                // Points au-dessus
                this.drawText(`+${target.points}`, x + size/2, y - 10, {
                    font: '14px Arial',
                    color: target.color,
                    align: 'center',
                    shadow: true
                });
            }
        });
    }

    drawArrows() {
        this.arrows.forEach(arrow => {
            this.ctx.save();
            this.ctx.translate(arrow.x, arrow.y);
            this.ctx.rotate(arrow.angle);
            
            // Trail
            if (arrow.trail && arrow.trail.length > 1) {
                this.ctx.strokeStyle = 'rgba(139, 69, 19, 0.6)';
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                arrow.trail.forEach((point, index) => {
                    if (index === 0) {
                        this.ctx.moveTo(point.x - arrow.x, point.y - arrow.y);
                    } else {
                        this.ctx.lineTo(point.x - arrow.x, point.y - arrow.y);
                    }
                });
                this.ctx.stroke();
            }
            
            // Corps de la flèche
            this.drawGradientRect(-10, -1, 20, 2, '#8B4513', '#654321', 'horizontal');
            
            // Pointe
            this.ctx.fillStyle = '#C0C0C0';
            this.ctx.beginPath();
            this.ctx.moveTo(10, 0);
            this.ctx.lineTo(15, -2);
            this.ctx.lineTo(15, 2);
            this.ctx.fill();
            
            // Empennage
            this.ctx.fillStyle = '#FFD700';
            this.ctx.beginPath();
            this.ctx.moveTo(-10, -2);
            this.ctx.lineTo(-15, -4);
            this.ctx.lineTo(-15, 4);
            this.ctx.lineTo(-10, 2);
            this.ctx.fill();
            
            this.ctx.restore();
        });
    }

    drawUI() {
        // Panneau de score avec style moderne
        this.drawRoundedRect(20, 20, 200, 100, 10, 'rgba(0, 0, 0, 0.8)');
        
        this.drawText(`Score: ${this.score}`, 40, 40, {
            font: '20px Arial',
            color: '#FFD700',
            shadow: true
        });
        
        this.drawText(`Niveau: ${this.level}`, 40, 65, {
            font: '16px Arial',
            color: '#87CEEB',
            shadow: true
        });
        
        this.drawText(`Cibles: ${this.targetsHit}/${this.totalTargets}`, 40, 85, {
            font: '16px Arial',
            color: '#98FB98',
            shadow: true
        });
        
        // Barre de puissance
        if (this.charging) {
            const barWidth = 200;
            const barHeight = 20;
            const barX = this.canvas.width / 2 - barWidth / 2;
            const barY = this.canvas.height - 60;
            
            // Fond de la barre
            this.drawRoundedRect(barX, barY, barWidth, barHeight, 10, 'rgba(0, 0, 0, 0.5)');
            
            // Barre de puissance
            const powerWidth = (this.power / this.maxPower) * (barWidth - 4);
            const powerColor = this.power < 30 ? '#FF6B6B' : 
                              this.power < 70 ? '#FFD93D' : '#6BCF7F';
            
            this.drawRoundedRect(barX + 2, barY + 2, powerWidth, barHeight - 4, 8, powerColor);
            
            this.drawText('PUISSANCE', barX + barWidth/2, barY - 10, {
                font: '14px Arial',
                color: '#FFF',
                align: 'center',
                shadow: true
            });
        }
        
        // Instructions
        const instructions = this.controls.touchControls ? 
            'Utilisez les contrôles tactiles pour viser et tirer' :
            'Z/S: Viser | Maintenir MAJ: Charger | Relâcher: Tirer';
            
        this.drawText(instructions, this.canvas.width/2, this.canvas.height - 20, {
            font: '14px Arial',
            color: '#DDD',
            align: 'center',
            shadow: true
        });
    }

    drawWindIndicator() {
        const x = this.canvas.width - 150;
        const y = 30;
        
        // Fond
        this.drawRoundedRect(x, y, 120, 60, 10, 'rgba(0, 0, 0, 0.7)');
        
        this.drawText('VENT', x + 60, y + 15, {
            font: '14px Arial',
            color: '#87CEEB',
            align: 'center',
            shadow: true
        });
        
        // Flèche de direction
        this.ctx.save();
        this.ctx.translate(x + 30, y + 40);
        if (this.wind.direction < 0) this.ctx.scale(-1, 1);
        
        this.ctx.fillStyle = '#FFD700';
        this.ctx.beginPath();
        this.ctx.moveTo(0, -5);
        this.ctx.lineTo(15, 0);
        this.ctx.lineTo(0, 5);
        this.ctx.lineTo(5, 0);
        this.ctx.fill();
        this.ctx.restore();
        
        // Force du vent
        const windBars = Math.ceil(this.wind.strength);
        for (let i = 0; i < 5; i++) {
            const barColor = i < windBars ? '#FF6B6B' : 'rgba(255, 255, 255, 0.3)';
            this.drawRoundedRect(x + 70 + i * 8, y + 35 - i * 2, 6, 10 + i * 2, 3, barColor);
        }
    }
}
