// Gestionnaire de sons pour les jeux
class SoundManager {
    constructor() {
        this.sounds = {};
        this.enabled = true;
    }

    // Charger un son
    loadSound(name, url) {
        if (!this.enabled) return;
        
        try {
            this.sounds[name] = new Audio(url);
            this.sounds[name].preload = 'auto';
        } catch (e) {
            console.warn(`Impossible de charger le son ${name}:`, e);
        }
    }

    // Jouer un son
    play(name, volume = 1, loop = false) {
        if (!this.enabled || !this.sounds[name]) return;
        
        try {
            const sound = this.sounds[name].cloneNode();
            sound.volume = volume;
            sound.loop = loop;
            sound.play();
            return sound;
        } catch (e) {
            console.warn(`Impossible de jouer le son ${name}:`, e);
        }
    }

    // Arrêter un son
    stop(name) {
        if (!this.sounds[name]) return;
        
        try {
            this.sounds[name].pause();
            this.sounds[name].currentTime = 0;
        } catch (e) {
            console.warn(`Impossible d'arrêter le son ${name}:`, e);
        }
    }

    // Activer/désactiver les sons
    setEnabled(enabled) {
        this.enabled = enabled;
        if (!enabled) {
            Object.values(this.sounds).forEach(sound => {
                try {
                    sound.pause();
                } catch (e) {
                    // Ignorer les erreurs de pause
                }
            });
        }
    }
}

// Instance globale
const soundManager = new SoundManager();