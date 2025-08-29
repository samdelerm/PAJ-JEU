// Nouveau Pacman moderne, responsive et simple

class PacmanGame extends BaseGame {
    generateRandomMaze() {
        // Génère une grille avec un chemin aléatoire entre le départ et tous les points
        // Simple : on part d'une grille pleine, on creuse un chemin, puis on ajoute des branches
        let width = 20, height = 17;
        let grid = Array.from({length: height}, () => Array(width).fill('#'));
        let start = {x:1, y:1};
        let end = {x:width-2, y:height-2};
        let stack = [start];
        grid[start.y][start.x] = ' ';
        while (stack.length) {
            let {x, y} = stack[stack.length-1];
            let dirs = [
                {dx:0,dy:-2}, {dx:0,dy:2}, {dx:-2,dy:0}, {dx:2,dy:0}
            ].sort(()=>Math.random()-0.5);
            let carved = false;
            for (let {dx,dy} of dirs) {
                let nx = x+dx, ny = y+dy;
                if (nx>0 && nx<width-1 && ny>0 && ny<height-1 && grid[ny][nx]==='#') {
                    grid[ny][nx] = ' ';
                    grid[y+dy/2][x+dx/2] = ' ';
                    stack.push({x:nx,y:ny});
                    carved = true;
                    break;
                }
            }
            if (!carved) stack.pop();
        }
        // Place dots et power pellets
        for (let y=0; y<height; y++) for (let x=0; x<width; x++) {
            if (grid[y][x]===' ') grid[y][x]='.';
        }
        grid[start.y][start.x] = ' ';
        grid[end.y][end.x] = ' ';
        // Place 4 power pellets dans les coins
        grid[1][1]='o'; grid[1][width-2]='o'; grid[height-2][1]='o'; grid[height-2][width-2]='o';
        // Convertit en tableau de string
        return grid.map(row=>row.join(''));
    }

    areAllDotsAccessible() {
        // BFS depuis Pacman pour vérifier que tous les points sont accessibles
        let visited = Array.from({length:this.grid.length},()=>Array(this.grid[0].length).fill(false));
        let queue = [[this.player.x, this.player.y]];
        visited[this.player.y][this.player.x]=true;
        while(queue.length) {
            let [x,y]=queue.shift();
            for(let {dx,dy} of [{dx:0,dy:1},{dx:0,dy:-1},{dx:1,dy:0},{dx:-1,dy:0}]) {
                let nx=x+dx, ny=y+dy;
                if(ny>=0&&ny<this.grid.length&&nx>=0&&nx<this.grid[0].length&&!visited[ny][nx]&&this.grid[ny][nx]!=='#') {
                    visited[ny][nx]=true; queue.push([nx,ny]);
                }
            }
        }
        for(let dot of this.dots.concat(this.powerPellets)) {
            if(!visited[dot.y][dot.x]) return false;
        }
        return true;
    }
    constructor(canvas, ctx) {
        super(canvas, ctx);
        // Grille classique Pacman
        this.grid = [
            '####################',
            '#........#.........#',
            '#.####.#.#.####.#..#',
            '#o#  #.#.#.#  #.#o.#',
            '#.####.#.#.####.#..#',
            '#..................#',
            '####.#.#####.#.#####',
            '   #.#...#...#.#   ',
            '####.### # ###.#####',
            '     #   G   #     ',
            '####.### # ###.#####',
            '   #.#.......#.#   ',
            '####.#.#####.#.#####',
            '#........#.........#',
            '#.####.#.#.####.#..#',
            '#o...#.#.#.#...#o..#',
            '####################'
        ];
        this.cellSize = Math.floor(Math.min(canvas.width, canvas.height) / this.grid.length);
        // Pacman position d'origine (1,1)
        this.player = { x: 1, y: 1, dir: 'right', nextDir: 'right', lives: 3, score: 0, power: 0 };
        // Fantômes aux positions classiques
        this.ghosts = [
            { x: 9, y: 9, dir: 'left', color: '#e74c3c', scatter: false, dead: false, home: {x:9,y:9}, sprite: 0 },
            { x: 8, y: 9, dir: 'right', color: '#00bfff', scatter: false, dead: false, home: {x:8,y:9}, sprite: 1 },
            { x: 10, y: 9, dir: 'left', color: '#ffb347', scatter: false, dead: false, home: {x:10,y:9}, sprite: 2 },
            { x: 9, y: 8, dir: 'down', color: '#ad7aff', scatter: false, dead: false, home: {x:9,y:8}, sprite: 3 }
        ];
        this.gameOver = false;
        this.win = false;
        this.lastUpdate = 0;
        this.pacmanImg = new window.Image();
        this.pacmanImg.src = '/static/assets/sprites/pacman.png';
        this.ghostImgs = [0,1,2,3].map(i => {
            let img = new window.Image();
            img.src = `/static/assets/sprites/100001777${6+i}.png`;
            return img;
        });
        this.initGrid();
    }

    initGrid() {
        this.dots = [];
        this.powerPellets = [];
        for (let y = 0; y < this.grid.length; y++) {
            for (let x = 0; x < this.grid[y].length; x++) {
                if (this.grid[y][x] === '.') this.dots.push({x, y});
                if (this.grid[y][x] === 'o') this.powerPellets.push({x, y});
            }
        }
    }

    canMove(x, y) {
        if (y < 0 || y >= this.grid.length) return false;
        if (x < 0 || x >= this.grid[0].length) return false;
        return this.grid[y][x] !== '#';
    }

    update(now) {
        if (this.gameOver || this.win) return;
        if (!this.lastStep) this.lastStep = now;
        // On n'update la logique que toutes les 18000ms (vitesse divisée par 100)
        if (now - this.lastStep < 18000) return;
        this.lastStep = now;
        // Pacman direction
        let dx = 0, dy = 0;
        if (this.player.nextDir) {
            ({dx, dy} = this.dirToDelta(this.player.nextDir));
            if (this.canMove(this.player.x+dx, this.player.y+dy)) {
                this.player.dir = this.player.nextDir;
            }
        }
        ({dx, dy} = this.dirToDelta(this.player.dir));
        if (this.canMove(this.player.x+dx, this.player.y+dy)) {
            this.player.x += dx;
            this.player.y += dy;
        }
        // Manger les points
        for (let i = 0; i < this.dots.length; i++) {
            if (this.dots[i].x === this.player.x && this.dots[i].y === this.player.y) {
                this.dots.splice(i, 1);
                this.player.score += 10;
                break;
            }
        }
        // Manger les power pellets
        for (let i = 0; i < this.powerPellets.length; i++) {
            if (this.powerPellets[i].x === this.player.x && this.powerPellets[i].y === this.player.y) {
                this.powerPellets.splice(i, 1);
                this.player.power = 30;
                break;
            }
        }
        if (this.player.power > 0) this.player.power--;
        // Déplacement des fantômes
        for (let ghost of this.ghosts) {
            if (ghost.dead) continue;
            let dirs = ['up','down','left','right'];
            let opposites = {up:'down',down:'up',left:'right',right:'left'};
            let possibleDirs = dirs.filter(dir => {
                let {dx,dy} = this.dirToDelta(dir);
                let nx = ghost.x+dx, ny = ghost.y+dy;
                if (opposites[dir] === ghost.dir) return false;
                return this.canMove(nx,ny);
            });
            if (possibleDirs.length === 0) {
                possibleDirs = dirs.filter(dir => {
                    let {dx,dy} = this.dirToDelta(dir);
                    let nx = ghost.x+dx, ny = ghost.y+dy;
                    return this.canMove(nx,ny);
                });
            }
            let newDir = ghost.dir;
            if (possibleDirs.length > 0) {
                if (possibleDirs.length > 1) {
                    newDir = possibleDirs[Math.floor(Math.random()*possibleDirs.length)];
                } else {
                    newDir = possibleDirs[0];
                }
            }
            let {dx:gx,dy:gy} = this.dirToDelta(newDir);
            if (this.canMove(ghost.x+gx, ghost.y+gy)) {
                ghost.x += gx; ghost.y += gy; ghost.dir = newDir;
            }
            // Collision Pacman/ghost
            if (ghost.x === this.player.x && ghost.y === this.player.y) {
                if (this.player.power>0) {
                    ghost.dead = true; this.player.score += 200;
                } else {
                    this.player.lives--;
                    if (this.player.lives<=0) this.gameOver = true;
                    else { this.player.x=1; this.player.y=1; ghost.x=ghost.home.x; ghost.y=ghost.home.y; }
                }
            }
        }
        // Victoire
        if (this.dots.length===0 && this.powerPellets.length===0) {
            this.win = true;
        }
    }

    dirToDelta(dir) {
        switch(dir) {
            case 'up': return {dx:0,dy:-1};
            case 'down': return {dx:0,dy:1};
            case 'left': return {dx:-1,dy:0};
            case 'right': return {dx:1,dy:0};
        }
        return {dx:0,dy:0};
    }

    render() {
        this.cellSize = Math.floor(Math.min(this.canvas.width, this.canvas.height) / this.grid.length);
        this.clearCanvas('#222');
        for (let y = 0; y < this.grid.length; y++) {
            for (let x = 0; x < this.grid[y].length; x++) {
                let cx = x*this.cellSize, cy = y*this.cellSize;
                if (this.grid[y][x] === '#') {
                    this.ctx.fillStyle = '#1976d2';
                    this.ctx.fillRect(cx, cy, this.cellSize, this.cellSize);
                }
            }
        }
        for (let dot of this.dots) {
            let cx = dot.x*this.cellSize+this.cellSize/2, cy = dot.y*this.cellSize/2;
            this.ctx.beginPath();
            this.ctx.arc(cx, cy, this.cellSize*0.13, 0, 2*Math.PI);
            this.ctx.fillStyle = '#fffde4';
            this.ctx.fill();
        }
        for (let pellet of this.powerPellets) {
            let cx = pellet.x*this.cellSize+this.cellSize/2, cy = pellet.y*this.cellSize/2;
            this.ctx.beginPath();
            this.ctx.arc(cx, cy, this.cellSize*0.25, 0, 2*Math.PI);
            this.ctx.fillStyle = '#ffe66d';
            this.ctx.fill();
        }
        let px = this.player.x*this.cellSize, py = this.player.y*this.cellSize;
        if (this.pacmanImg.complete && this.pacmanImg.naturalWidth > 0) {
            let angle = 0;
            switch(this.player.dir) {
                case 'right': angle = 0; break;
                case 'left': angle = Math.PI; break;
                case 'up': angle = -Math.PI/2; break;
                case 'down': angle = Math.PI/2; break;
            }
            this.ctx.save();
            this.ctx.translate(px+this.cellSize/2, py+this.cellSize/2);
            this.ctx.rotate(angle);
            this.ctx.drawImage(this.pacmanImg, -this.cellSize/2, -this.cellSize/2, this.cellSize, this.cellSize);
            this.ctx.restore();
        } else {
            this.ctx.save();
            this.ctx.beginPath();
            let mouth = Math.abs(Math.sin(Date.now()/120))*0.4+0.2;
            let start = mouth*Math.PI, end = (2-mouth)*Math.PI;
            let angle = 0;
            switch(this.player.dir) {
                case 'right': angle = 0; break;
                case 'left': angle = Math.PI; break;
                case 'up': angle = -Math.PI/2; break;
                case 'down': angle = Math.PI/2; break;
            }
            this.ctx.arc(px+this.cellSize/2, py+this.cellSize/2, this.cellSize*0.38, start+angle, end+angle, false);
            this.ctx.lineTo(px+this.cellSize/2, py+this.cellSize/2);
            this.ctx.closePath();
            this.ctx.fillStyle = '#ffe66d';
            this.ctx.shadowColor = '#fffde4';
            this.ctx.shadowBlur = 8;
            this.ctx.fill();
            this.ctx.restore();
        }
        for (let ghost of this.ghosts) {
            if (ghost.dead) continue;
            let gx = ghost.x*this.cellSize, gy = ghost.y*this.cellSize;
            let img = this.ghostImgs[ghost.sprite||0];
            if (img && img.complete && img.naturalWidth > 0) {
                this.ctx.drawImage(img, gx, gy, this.cellSize, this.cellSize);
            } else {
                this.ctx.save();
                this.ctx.beginPath();
                this.ctx.arc(gx+this.cellSize/2, gy+this.cellSize/2, this.cellSize*0.36, Math.PI, 0, false);
                this.ctx.lineTo(gx+this.cellSize/2+this.cellSize*0.36, gy+this.cellSize/2+this.cellSize*0.36);
                for(let i=1;i>=-1;i-=0.5) {
                    this.ctx.arc(gx+this.cellSize/2+i*this.cellSize*0.24, gy+this.cellSize/2+this.cellSize*0.36, this.cellSize*0.12, 0, Math.PI, true);
                }
                this.ctx.closePath();
                this.ctx.fillStyle = this.player.power>0 ? '#b2bec3' : ghost.color;
                this.ctx.shadowColor = '#fff';
                this.ctx.shadowBlur = 6;
                this.ctx.fill();
                this.ctx.restore();
            }
        }
        this.ctx.save();
        this.ctx.font = `${Math.floor(this.cellSize*0.7)}px Arial`;
        this.ctx.fillStyle = '#fff';
        this.ctx.fillText('Score: '+this.player.score, 12, this.cellSize*1.1);
        this.ctx.fillText('Vies: '+this.player.lives, 12, this.cellSize*2.1);
        this.ctx.restore();
        if (this.gameOver || this.win) {
            this.ctx.save();
            this.ctx.globalAlpha = 0.92;
            this.ctx.fillStyle = '#222';
            this.ctx.fillRect(this.canvas.width/2-180, this.canvas.height/2-60, 360, 120);
            this.ctx.globalAlpha = 1;
            this.ctx.font = 'bold 38px Arial';
            this.ctx.fillStyle = this.win ? '#ffe66d' : '#e74c3c';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(this.win ? 'VICTOIRE !' : 'GAME OVER', this.canvas.width/2, this.canvas.height/2);
            this.ctx.font = '20px Arial';
            this.ctx.fillStyle = '#fff';
            this.ctx.fillText('Appuie sur R pour rejouer', this.canvas.width/2, this.canvas.height/2+38);
            this.ctx.restore();
        }
    }

    handleInput(key) {
        if (this.gameOver || this.win) {
            if (key==='r') window.location.reload();
            return;
        }
        if (['up','down','left','right'].includes(key)) {
            this.player.nextDir = key;
        }
    }
}

// Lancement auto sur la page
document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.getElementById('gameCanvas');
    canvas.width = Math.min(window.innerWidth*0.98, 800);
    canvas.height = Math.min(window.innerHeight*0.7, 600);
    const ctx = canvas.getContext('2d');
    const game = new PacmanGame(canvas, ctx);
    game.start();
    window.addEventListener('keydown', e => {
        let key = e.key.toLowerCase();
        if (key==='arrowup') key='up';
        if (key==='arrowdown') key='down';
        if (key==='arrowleft') key='left';
        if (key==='arrowright') key='right';
        game.handleInput(key);
    });
    window.addEventListener('resize', () => {
        canvas.width = Math.min(window.innerWidth*0.98, 800);
        canvas.height = Math.min(window.innerHeight*0.7, 600);
    });
    setupMobileControls(game);
});

// --- Contrôles tactiles pour mobile ---
// Doit être globale pour être accessible au lancement
function setupMobileControls(game) {
    let startX=0, startY=0;
    window.addEventListener('touchstart', function(e) {
        if(e.touches.length===1) {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        }
    });
    window.addEventListener('touchend', function(e) {
        if(e.changedTouches.length===1) {
            let dx = e.changedTouches[0].clientX - startX;
            let dy = e.changedTouches[0].clientY - startY;
            if(Math.abs(dx)>Math.abs(dy)) {
                if(dx>20) game.handleInput('right');
                else if(dx<-20) game.handleInput('left');
            } else {
                if(dy>20) game.handleInput('down');
                else if(dy<-20) game.handleInput('up');
            }
        }
    });
}
