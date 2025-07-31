// Script pour générer des sprites manquants en tant que fichiers data URL
// À exécuter dans la console du navigateur pour créer les sprites

function generateAndDownloadSprites() {
    // Générer les sprites
    const sprites = {
        'ghost': SpriteGenerator.generateSprite('ghost', 32),
        'dot': SpriteGenerator.generateSprite('dot', 16),
        'power-pellet': SpriteGenerator.generateSprite('power-pellet', 24)
    };
    
    // Pour chaque sprite, créer un lien de téléchargement
    Object.keys(sprites).forEach(name => {
        const canvas = sprites[name];
        const link = document.createElement('a');
        link.download = `${name}.png`;
        link.href = canvas.toDataURL();
        
        // Simuler un clic pour télécharger
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        console.log(`Sprite ${name}.png généré et prêt au téléchargement`);
    });
}

// Pour créer les sprites directement dans le dossier assets/sprites (simulation)
function createSpritesAsBase64() {
    const sprites = {
        'ghost': SpriteGenerator.generateSprite('ghost', 32),
        'dot': SpriteGenerator.generateSprite('dot', 16),
        'power-pellet': SpriteGenerator.generateSprite('power-pellet', 24)
    };
    
    console.log('Base64 des sprites générés:');
    Object.keys(sprites).forEach(name => {
        console.log(`${name}.png:`, sprites[name].toDataURL());
    });
    
    return sprites;
}

// Export pour utilisation dans le jeu
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { generateAndDownloadSprites, createSpritesAsBase64 };
}
