# Configuration des sprites pour Pacman

## Sprites requis

Pour utiliser des sprites personnalisés dans le jeu Pacman, placez les fichiers PNG suivants dans le dossier `assets/sprites/` :

### 1. pacman.png
- Taille recommandée : 50x50 pixels
- Format : PNG avec transparence
- Description : Sprite du joueur Pacman

### 2. ghost.png  
- Taille recommandée : 40x40 pixels
- Format : PNG avec transparence
- Description : Sprite des fantômes ennemis

### 3. dot.png
- Taille recommandée : 20x20 pixels  
- Format : PNG avec transparence
- Description : Sprite des petits points à collecter

### 4. power-pellet.png
- Taille recommandée : 30x30 pixels
- Format : PNG avec transparence  
- Description : Sprite des gros power-pellets

## Fonctionnement

- Le jeu essaie de charger automatiquement tous les sprites au démarrage
- Si un sprite n'est pas trouvé, un message d'avertissement s'affiche dans la console
- Le jeu utilise automatiquement le rendu par défaut si les sprites ne sont pas disponibles
- Aucune erreur ne bloque le jeu, il fonctionne avec ou sans sprites

## Test

Actuellement, le jeu fonctionne parfaitement avec le rendu par défaut. 
Les sprites sont optionnels et amélioreront seulement l'apparence visuelle.

Pour tester rapidement, vous pouvez :
1. Créer des images PNG simples de couleur unie
2. Les nommer selon la liste ci-dessus  
3. Les placer dans `assets/sprites/`
4. Relancer le niveau Pacman pour voir les sprites se charger
