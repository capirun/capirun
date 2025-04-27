// --- Cena Inicial ---
class StartScene extends Phaser.Scene {
    constructor() {
        super({ key: 'StartScene' });
    }

    preload() {
        // Pré-carregar assets da tela inicial (se houver)
        // this.load.image('background_start', 'assets/background_start.png'); // Exemplo
        // this.load.image('logo', 'assets/logo.png'); // Exemplo
    }

    create() {
        console.log("StartScene create() called.");
        // Adiciona um fundo simples (cor)
        this.cameras.main.setBackgroundColor('#a0d4a1'); // Verde claro

        // Adiciona texto do título
        this.add.text(400, 200 - 50, 'CapiRun', { // Usei valores fixos baseados no config
            fontSize: '48px',
            fill: '#5c3e30', // Marrom
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Cria o botão "Jogar"
        const playButton = this.add.text(400, 200 + 50, 'Jogar!', { // Usei valores fixos
            fontSize: '32px',
            fill: '#ffffff', // Branco
            backgroundColor: '#7a5f4e', // Marrom botão
            padding: { x: 20, y: 10 },
            fontStyle: 'bold'
        }).setOrigin(0.5).setInteractive(); // Torna o texto clicável

        // Muda de cor ao passar o mouse (feedback visual)
        playButton.on('pointerover', () => playButton.setBackgroundColor('#9c7b68'));
        playButton.on('pointerout', () => playButton.setBackgroundColor('#7a5f4e'));

        // Ação ao clicar: Inicia a cena do jogo
        playButton.on('pointerdown', () => {
            console.log('Iniciando o jogo...');
            this.scene.start('GameScene');
        });
    }
}
// --- Cena Principal do Jogo ---
class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });

        // Variáveis da cena
        this.capivara = null;
        this.cursors = null;
        this.keyW = null;
        this.keyS = null;
        this.obstacles = null;
        this.score = 0;
        this.scoreText = null;
        this.gameSpeed = 300;
        this.gameSpeedIncreaseTimer = null;
        this.obstacleSpawnTimer = null;
        this.isCrouching = false;
        this.isGameOver = false;
        // this.ground = null; // <<<=== REMOVIDO: Substituído por visual e físico
        this.groundVisual = null; // <<<=== ADICIONADO: Para o TileSprite do chão
        this.groundCollider = null; // <<<=== ADICIONADO: Para a colisão física invisível
        this.startTime = 0;
        this.sky = null;
        this.backgroundMusic = null;
    }

    preload() {
        this.load.image('sky', 'assets/placeholder_sky.png');
        this.load.image('ground', 'assets/placeholder_ground.png'); // <<<=== Precisamos saber a altura desta imagem
        this.load.image('capivara', 'assets/placeholder_capivara.png');
        this.load.image('obstacle_rock', 'assets/placeholder_rock.png');
        this.load.audio('gameMusic', [
            'assets/trilha_sonora.ogg'
        ]);
    }

    create() {
        this.isGameOver = false;
        this.score = 0;
        this.gameSpeed = 300;
        this.isCrouching = false;
        this.startTime = this.time.now;

        // --- Configuração ---
        const gameWidth = this.sys.game.config.width; // 800
        const gameHeight = this.sys.game.config.height; // 400

        // 1. Fundo e Chão
        this.sky = this.add.tileSprite(gameWidth / 2, gameHeight / 2, gameWidth, gameHeight, 'sky');

        // Assumindo que a imagem 'ground' tenha 50px de altura (AJUSTE SE NECESSÁRIO!)
        const groundHeight = 50; // Altura da imagem do chão
        this.groundVisual = this.add.tileSprite(
            gameWidth / 2,                    // Centro X
            gameHeight - (groundHeight / 2),  // Posição Y (metade da altura para cima a partir da base)
            gameWidth,                        // Largura igual à do jogo
            groundHeight,                     // Altura da imagem
            'ground'
        );

        // Cria um corpo estático invisível para a colisão
        // Um pouco abaixo da base do TileSprite para garantir contato
        const colliderYOffset = 0; // Pequeno ajuste para garantir colisão
        this.groundCollider = this.physics.add.staticImage(
            gameWidth / 2,
            gameHeight - (groundHeight / 2) + colliderYOffset
        );
        // Redimensiona o corpo físico para cobrir a largura e ter uma altura mínima
        this.groundCollider.setSize(gameWidth, groundHeight - colliderYOffset); // Largura total, altura ajustada
        this.groundCollider.setVisible(false); // Torna o colisor invisível
        this.groundCollider.body.immovable = true; // Garante que é estático

        // 2. Capivara
        // Posiciona a capivara um pouco acima da linha do chão visual
        const capivaraY = gameHeight - groundHeight - 50; // Ex: 50 pixels acima do chão
        this.capivara = this.physics.add.sprite(100, capivaraY, 'capivara');
        this.capivara.setCollideWorldBounds(true);
        this.capivara.setBounce(0.1);
        this.capivara.setTint(0xffff00);
        this.capivara.setScale(2, 2);

        // ajustar a hitbox
        // Valores de exemplo - ajuste olhando o debug!
        const capWidth = this.capivara.width;   // Largura atual (escalada)
        const capHeight = this.capivara.height; // Altura atual (escalada)

        // Reduz o tamanho (ex: 70% da largura, 80% da altura)
        const bodyWidth = capWidth * 0.65;
        const bodyHeight = capHeight * 0.8;
        this.capivara.body.setSize(bodyWidth, bodyHeight);

        // Calcula o offset para centralizar a nova hitbox (aproximadamente)
        // Offset X: Metade da diferença entre largura original e nova largura
        const offsetX = (capWidth - bodyWidth) / 2 - 8;
        const offsetY = (capHeight - bodyHeight);
        this.capivara.body.setOffset(offsetX, offsetY);
        // Guardar os valores normais para usar ao levantar
        this.capivara.setData('normalBodySize', { width: bodyWidth, height: bodyHeight });
        this.capivara.setData('normalBodyOffset', { x: offsetX, y: offsetY });

        this.physics.add.collider(this.capivara, this.groundCollider);

        // 3. Controles
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
        this.keyS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);

        // 4. Grupo de Obstáculos
        this.obstacles = this.physics.add.group({
            allowGravity: false,
            immovable: true
        });

        this.physics.add.collider(this.obstacles, this.groundCollider); // Para que pedras fiquem "no chão" se tivessem gravidade
        this.physics.add.collider(this.capivara, this.obstacles, this.gameOver, null, this);

        // 5. Pontuação
        this.scoreText = this.add.text(16, 16, 'Tempo: 0', {
            fontSize: '24px',
            fill: '#fff',
            backgroundColor: 'rgba(0,0,0,0.5)',
            padding: { x: 5, y: 2 }
        }).setScrollFactor(0);

        // 6. Timers
        this.scheduleObstacleSpawn();
        this.scheduleDifficultyIncrease();

        if (!this.backgroundMusic || !this.backgroundMusic.isPlaying) {
            this.backgroundMusic = this.sound.add('gameMusic', {
                loop: true,  // Tocar em loop
                volume: 0.4  // Volume (0 a 1) - ajuste conforme necessário
            });
            this.backgroundMusic.play();
       }
    }

    update(time, delta) {
        if (this.isGameOver) {
            return;
        }

        // Converte delta de ms para segundos para cálculos de velocidade
        const deltaSeconds = delta / 1000;

        // Movimentar o fundo (céu)
        const backgroundScrollSpeed = this.gameSpeed * 0.1; // Velocidade mais lenta
        this.sky.tilePositionX += backgroundScrollSpeed * deltaSeconds;

        // <<<=== ADICIONADO: Movimentar o chão visual
        // O chão geralmente se move na mesma velocidade dos obstáculos
        this.groundVisual.tilePositionX += this.gameSpeed * deltaSeconds;

        // Atualiza Pontuação
        this.score = Math.floor((time - this.startTime) / 1000);
        this.scoreText.setText('Tempo: ' + this.score);

        // Controle da Capivara
        // <<<=== MODIFICADO: Verifica colisão com groundCollider
        const onGround = this.capivara.body.touching.down || this.capivara.body.blocked.down;

        const jumpKeyPressed = Phaser.Input.Keyboard.JustDown(this.cursors.space) || Phaser.Input.Keyboard.JustDown(this.cursors.up) || Phaser.Input.Keyboard.JustDown(this.keyW);
        const jumpKeyReleased = Phaser.Input.Keyboard.JustUp(this.cursors.space) || Phaser.Input.Keyboard.JustUp(this.cursors.up) || Phaser.Input.Keyboard.JustUp(this.keyW);
        const crouchKeyPressed = this.cursors.down.isDown || this.keyS.isDown;

        // --- LÓGICA DO PULO VARIÁVEL ---
        if (jumpKeyPressed && onGround) {
            this.capivara.setVelocityY(-500);
            this.isCrouching = false;
            this.capivara.setScale(2, 2);
        }
        if (jumpKeyReleased && this.capivara.body.velocity.y < 0) {
            this.capivara.setVelocityY(this.capivara.body.velocity.y * 0.4);
        }

        // --- LÓGICA DE AGACHAR ---
        // (A lógica de agachar pode precisar de ajustes na posição Y se a origem/escala mudar muito)
        if (crouchKeyPressed && onGround && !this.isCrouching) {
            this.isCrouching = true;
            const originalHeight = this.capivara.displayHeight;
            this.capivara.setScale(2, 1.4);
            const newHeight = this.capivara.displayHeight;
            // Ajuste para manter a base no chão
            this.capivara.y += (originalHeight - newHeight) / 2;
             // this.capivara.body.setSize(...).setOffset(...); // Ajustar hitbox se necessário
        } else if (!crouchKeyPressed && this.isCrouching && onGround) {
             this.isCrouching = false;
             const originalHeight = this.capivara.displayHeight; // Altura agachada
             this.capivara.setScale(2, 2);
             const newHeight = this.capivara.displayHeight;
             // Ajuste para manter a base no chão
             this.capivara.y -= (newHeight - originalHeight) / 2;
             // this.capivara.body.setSize(...); // Restaurar hitbox se necessário
        }

        // Movimentação e Remoção de Obstáculos
        this.obstacles.children.iterate(obstacle => {
            if (obstacle) {
                obstacle.body.velocity.x = -this.gameSpeed;
                if (obstacle.getBounds().right < 0) {
                    obstacle.destroy();
                }
            }
        });
    }

    // --- Funções de Spawn e Dificuldade ---

    scheduleObstacleSpawn() {
        if (this.isGameOver) return;
        const speedFactor = Math.max(0.1, this.gameSpeed / 300);
        const delay = Phaser.Math.Between(1200, 2800) / speedFactor;
        this.obstacleSpawnTimer = this.time.delayedCall(delay, this.spawnObstacle, [], this);
    }

    spawnObstacle() {
        if (this.isGameOver) return;

        const gameWidth = this.sys.game.config.width;
        const gameHeight = this.sys.game.config.height;
        const groundImageHeight = 50; // <<<=== Use a mesma altura da imagem do chão definida em create

        const spawnX = gameWidth + 50;
        const obstacleHeight = 30;
        const spawnY = gameHeight - groundImageHeight - (obstacleHeight / 2) + 5; // 5 = pequeno ajuste para parecer em cima do chão

        const obstacle = this.obstacles.create(spawnX, spawnY, 'obstacle_rock');
        const obsWidth = obstacle.width;
        const obsHeight = obstacle.height;

        // Ex: Deixar um pouco mais estreito e baixo
        const obsBodyWidth = obsWidth * 0.8;
        const obsBodyHeight = obsHeight * 0.75;
        obstacle.body.setSize(obsBodyWidth, obsBodyHeight);

        // Centralizar a hitbox menor
        const obsOffsetX = (obsWidth - obsBodyWidth) / 2;
        const obsOffsetY = (obsHeight - obsBodyHeight) / 2; // Centraliza verticalmente
        obstacle.body.setOffset(obsOffsetX, obsOffsetY);

        obstacle.setVelocityX(-this.gameSpeed);

        this.scheduleObstacleSpawn();
    }

    scheduleDifficultyIncrease() {
        if (this.isGameOver) return;
        this.gameSpeedIncreaseTimer = this.time.delayedCall(1000, () => {
            this.gameSpeed += 10;
            this.scheduleDifficultyIncrease();
        }, [], this);
    }

    // --- Game Over ---
    gameOver(capivara, obstacle) {
        if (this.isGameOver) return;

        console.log('Game Over!');
        this.isGameOver = true;
        this.physics.pause();

        // Parar timers
        if (this.obstacleSpawnTimer) this.obstacleSpawnTimer.remove(false);
        if (this.gameSpeedIncreaseTimer) this.gameSpeedIncreaseTimer.remove(false);

        this.capivara.setTint(0xff0000);

        // Textos e Botão de Game Over (adicionado setScrollFactor(0))
        const gameWidth = this.sys.game.config.width;
        const gameHeight = this.sys.game.config.height;
        this.add.text(gameWidth/2, gameHeight/2 - 30, 'GAME OVER', {
            fontSize: '48px', fill: '#ff0000', fontStyle: 'bold'
        }).setOrigin(0.5).setScrollFactor(0);

        const restartButton = this.add.text(gameWidth/2, gameHeight/2 + 30, 'Reiniciar', {
             fontSize: '24px', fill: '#ffffff', backgroundColor: '#555', padding: { x: 10, y: 5 }
        }).setOrigin(0.5).setInteractive().setScrollFactor(0);

        restartButton.on('pointerdown', () => {
            this.gameSpeed = 300;
            this.score = 0;
            // Resetar tilePosition ao reiniciar (opcional, mas bom para consistência)
            // this.sky.tilePositionX = 0;
            // this.groundVisual.tilePositionX = 0;
            this.scene.restart();
        });
         restartButton.on('pointerover', () => restartButton.setBackgroundColor('#777'));
         restartButton.on('pointerout', () => restartButton.setBackgroundColor('#555'));
    }

    shutdown() {
        console.log("GameScene shutdown called.");
        // Para a música quando a cena é parada ou reiniciada
        if (this.backgroundMusic && this.backgroundMusic.isPlaying) {
            this.backgroundMusic.stop();
        }
    }

}

// --- Configuração do Phaser ---
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 400,
    parent: 'phaser-game',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 1000 },
            debug: false // Mude para true para ver o colisor do chão invisível
        }
    },
    scene: [StartScene, GameScene]
};

const game = new Phaser.Game(config);
console.log("Phaser Game instance created.");