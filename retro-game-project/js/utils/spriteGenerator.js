// Générateur de sprites de secours pour les fichiers manquants
class SpriteGenerator {
    static generateSprite(type, size = 32) {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        switch(type) {
            case 'ghost':
                return this.generateGhost(ctx, size);
            case 'dot':
                return this.generateDot(ctx, size);
            case 'power-pellet':
                return this.generatePowerPellet(ctx, size);
            default:
                return this.generateDefault(ctx, size);
        }
    }
    
    static generateGhost(ctx, size) {
        const centerX = size / 2;
        const centerY = size / 2;
        const radius = size * 0.4;
        
        // Corps du fantôme
        ctx.fillStyle = '#FF6B6B';
        ctx.beginPath();
        ctx.arc(centerX, centerY - radius * 0.2, radius, 0, Math.PI, true);
        ctx.rect(centerX - radius, centerY - radius * 0.2, radius * 2, radius * 1.2);
        ctx.fill();
        
        // Ondulations du bas
        ctx.fillStyle = '#FF6B6B';
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const x = centerX - radius + (radius * 2 / 5) * i;
            const y = centerY + radius;
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y - (i % 2 === 0 ? 4 : -4));
            }
        }
        ctx.lineTo(centerX + radius, centerY + radius * 0.2);
        ctx.lineTo(centerX - radius, centerY + radius * 0.2);
        ctx.closePath();
        ctx.fill();
        
        // Yeux
        ctx.fillStyle = 'white';
        ctx.fillRect(centerX - radius * 0.4, centerY - radius * 0.4, radius * 0.3, radius * 0.4);
        ctx.fillRect(centerX + radius * 0.1, centerY - radius * 0.4, radius * 0.3, radius * 0.4);
        
        ctx.fillStyle = 'black';
        ctx.fillRect(centerX - radius * 0.3, centerY - radius * 0.3, radius * 0.15, radius * 0.2);
        ctx.fillRect(centerX + radius * 0.2, centerY - radius * 0.3, radius * 0.15, radius * 0.2);
        
        return canvas;
    }
    
    static generateDot(ctx, size) {
        const centerX = size / 2;
        const centerY = size / 2;
        const radius = size * 0.2;
        
        // Aura
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius * 2);
        gradient.addColorStop(0, 'rgba(255, 255, 0, 0.8)');
        gradient.addColorStop(1, 'rgba(255, 255, 0, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius * 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Point principal
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Reflet
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.beginPath();
        ctx.arc(centerX - radius * 0.3, centerY - radius * 0.3, radius * 0.4, 0, Math.PI * 2);
        ctx.fill();
        
        return canvas;
    }
    
    static generatePowerPellet(ctx, size) {
        const centerX = size / 2;
        const centerY = size / 2;
        const radius = size * 0.3;
        
        // Aura pulsante
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius * 2);
        gradient.addColorStop(0, 'rgba(255, 215, 0, 0.9)');
        gradient.addColorStop(0.5, 'rgba(255, 140, 0, 0.6)');
        gradient.addColorStop(1, 'rgba(255, 69, 0, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius * 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Pellet principal
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Anneaux d'énergie
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius * 0.7, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius * 1.3, 0, Math.PI * 2);
        ctx.stroke();
        
        return canvas;
    }
    
    static generateDefault(ctx, size) {
        const centerX = size / 2;
        const centerY = size / 2;
        
        ctx.fillStyle = '#00F2FE';
        ctx.fillRect(0, 0, size, size);
        
        ctx.fillStyle = 'white';
        ctx.font = `${size * 0.5}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('?', centerX, centerY);
        
        return canvas;
    }
    
    static createImageFromCanvas(canvas) {
        const img = new Image();
        img.src = canvas.toDataURL();
        return img;
    }
}
