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
        this.gameSpeed = 300; // Velocidade inicial dos obstáculos (pixels por segundo)
        this.gameSpeedIncreaseTimer = null;
        this.obstacleSpawnTimer = null;
        this.isCrouching = false;
        this.isGameOver = false;
        this.ground = null;
        this.startTime = 0;
    }

    preload() {
        // --- SUBSTITUIR POR IMAGENS REAIS ---
        // Usando retângulos coloridos como placeholders
        // Certifique-se que a pasta 'assets' existe e contém estas imagens!
        this.load.image('sky', 'assets/placeholder_sky.png');
        this.load.image('ground', 'assets/placeholder_ground.png');
        this.load.image('capivara', 'assets/placeholder_capivara.png');
        this.load.image('obstacle_rock', 'assets/placeholder_rock.png');
    }

    create() {
        this.isGameOver = false;
        this.score = 0;
        this.gameSpeed = 300;
        this.isCrouching = false;
        this.startTime = this.time.now;

        // 1. Fundo e Chão
        // Use config.width e config.height aqui se config estiver acessível
        // Ou use os valores fixos 800 e 400 se preferir
        this.add.image(400, 200, 'sky').setScrollFactor(0);
        this.ground = this.physics.add.staticImage(400, 400 - 25, 'ground');

        // 2. Capivara
        this.capivara = this.physics.add.sprite(100, 400 - 100, 'capivara');
        this.capivara.setCollideWorldBounds(true);
        this.capivara.setBounce(0.1);
        // Ajuste o tamanho do corpo físico se a imagem placeholder for muito diferente
        // this.capivara.body.setSize(this.capivara.width * 0.8, this.capivara.height * 0.9);
        this.capivara.setTint(0xffff00); // Placeholder amarelo
        this.capivara.setScale(2, 2); // Garante tamanho normal ao pular

        this.physics.add.collider(this.capivara, this.ground);

        // 3. Controles
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
        this.keyS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);

        // 4. Grupo de Obstáculos
        this.obstacles = this.physics.add.group({
            allowGravity: false,
            immovable: true
        });

        this.physics.add.collider(this.capivara, this.obstacles, this.gameOver, null, this);

        // 5. Pontuação
        this.scoreText = this.add.text(16, 16, 'Tempo: 0', {
            fontSize: '24px',
            fill: '#fff',
            backgroundColor: 'rgba(0,0,0,0.5)',
            padding: { x: 5, y: 2 }
        });

        // 6. Timers
        this.scheduleObstacleSpawn();
        this.scheduleDifficultyIncrease();
    }

    update(time, delta) {
        if (this.isGameOver) {
            return;
        }

        // Atualiza Pontuação
        this.score = Math.floor((time - this.startTime) / 1000);
        this.scoreText.setText('Tempo: ' + this.score);

        // Controle da Capivara
        const onGround = this.capivara.body.touching.down || this.capivara.body.blocked.down;

        // Verifica o estado das teclas de pulo
        const jumpKeyPressed = Phaser.Input.Keyboard.JustDown(this.cursors.space) || Phaser.Input.Keyboard.JustDown(this.cursors.up) || Phaser.Input.Keyboard.JustDown(this.keyW);
        const jumpKeyReleased = Phaser.Input.Keyboard.JustUp(this.cursors.space) || Phaser.Input.Keyboard.JustUp(this.cursors.up) || Phaser.Input.Keyboard.JustUp(this.keyW);
        // Não precisamos mais de jumpKeyDown (isDown) para esta lógica específica

        const crouchKeyPressed = this.cursors.down.isDown || this.keyS.isDown;

        // --- LÓGICA DO PULO VARIÁVEL ---

        // 1. Iniciar o Pulo (com velocidade MÁXIMA potencial)
        if (jumpKeyPressed && onGround) {
            // Use um valor maior aqui para a altura máxima do pulo (quando segura a tecla)
            this.capivara.setVelocityY(-500); // Ex: -500 (ajuste conforme necessário)
            this.isCrouching = false;
            this.capivara.setScale(2, 2);
            // Pequeno ajuste para evitar ficar preso se estava agachado
            if (this.capivara.scaleY !== 1) this.capivara.y -= this.capivara.displayHeight * 0.15 / 0.7;

        }

        // 2. Cortar o Pulo se a tecla for solta cedo
        // Verificamos se a tecla foi SOLTA (JustUp) E se a capivara AINDA ESTÁ SUBINDO (velocity.y < 0)
        if (jumpKeyReleased && this.capivara.body.velocity.y < 0) {
            // Reduz a velocidade vertical atual. Multiplicar por um fator < 1 é comum.
            // Quanto menor o fator, mais curto será o pulo mínimo (tapinha na tecla).
            this.capivara.setVelocityY(this.capivara.body.velocity.y * 0.4); // Ex: Multiplica por 0.4 (ajuste!)
        }

        // Abaixar / Levantar
        if (crouchKeyPressed && onGround && !this.isCrouching) {
             // Só entra aqui se estiver no chão E NÃO estiver agachado ainda
            this.isCrouching = true;
            this.capivara.setScale(2,2);
            this.capivara.y += this.capivara.displayHeight * 0.15; // Ajuste baseado na esc

             // Idealmente, ajustar o body.setSize aqui também para a hitbox diminuir
             // this.capivara.body.setSize(this.capivara.width, this.capivara.height * 0.7).setOffset(0, ...);

        } else if (!crouchKeyPressed && this.isCrouching && onGround) {
             // Só levanta se a tecla for solta E estava agachado E está no chão
            this.isCrouching = false;
            this.capivara.y -= this.capivara.displayHeight * 0.15 / 0.7; // Reverte o ajuste Y
            this.capivara.setScale(2, 2);
             // Reajustar o body.setSize para o normal
             // this.capivara.body.setSize(this.capivara.width, this.capivara.height);
        }

        // Cor padrão no chão
        if(onGround && !this.isCrouching && !jumpKeyPressed && this.capivara.body.velocity.y == 0) {
             // Se está no chão, não está agachado, não acabou de pular E não está caindo
             this.capivara.setTint(0xffff00); // Amarelo
        }


        // Movimentação e Remoção de Obstáculos
        this.obstacles.children.iterate(obstacle => {
            if (obstacle) {
                obstacle.setVelocityX(-this.gameSpeed);
                if (obstacle.getBounds().right < 0) {
                    obstacle.destroy();
                }
            }
        });
    }

    scheduleObstacleSpawn() {
        if (this.isGameOver) return;
        // Garante que a velocidade mínima não deixe o delay negativo ou zero
        const speedFactor = Math.max(0.1, this.gameSpeed / 300);
        const delay = Phaser.Math.Between(1200, 2800) / speedFactor;
        this.obstacleSpawnTimer = this.time.delayedCall(delay, this.spawnObstacle, [], this);
    }

    spawnObstacle() {
        if (this.isGameOver) return;

        const spawnX = 800 + 50; // Usa valor fixo da largura
        // Usa valor fixo da altura
        const spawnY = 400 - 25 - (30 / 2); // Altura do chão - (altura estimada da pedra / 2)

        // Adiciona o obstáculo ao grupo
        const obstacle = this.obstacles.create(spawnX, spawnY, 'obstacle_rock');
        // Ajuste o tamanho do corpo se necessário
        // obstacle.body.setSize(obstacle.width * 0.8, obstacle.height * 0.9);

        // Precisamos definir a velocidade aqui também, pois o update só afeta os já existentes
        obstacle.setVelocityX(-this.gameSpeed);

        this.scheduleObstacleSpawn(); // Reagenda o próximo
    }

    scheduleDifficultyIncrease() {
        if (this.isGameOver) return;
        this.gameSpeedIncreaseTimer = this.time.delayedCall(1000, () => {
            this.gameSpeed += 10;
            this.scheduleDifficultyIncrease();
        }, [], this);
    }

    gameOver(capivara, obstacle) {
        if (this.isGameOver) return;

        console.log('Game Over!');
        this.isGameOver = true;
        this.physics.pause();

        if (this.obstacleSpawnTimer) this.obstacleSpawnTimer.remove(false); // Usa remove(false) para não disparar se estiver pendente
        if (this.gameSpeedIncreaseTimer) this.gameSpeedIncreaseTimer.remove(false);

        this.capivara.setTint(0xff0000);

        this.add.text(400, 200 - 30, 'GAME OVER', {
            fontSize: '48px', fill: '#ff0000', fontStyle: 'bold'
        }).setOrigin(0.5);

        const restartButton = this.add.text(400, 200 + 30, 'Reiniciar', {
             fontSize: '24px', fill: '#ffffff', backgroundColor: '#555', padding: { x: 10, y: 5 }
        }).setOrigin(0.5).setInteractive();

        restartButton.on('pointerdown', () => {
            // Precisamos resetar as variáveis antes de reiniciar
            this.gameSpeed = 300; // Reset velocidade
            this.score = 0;      // Reset score
            // Outras variáveis que precisam ser resetadas
            this.scene.restart();
        });
         restartButton.on('pointerover', () => restartButton.setBackgroundColor('#777'));
         restartButton.on('pointerout', () => restartButton.setBackgroundColor('#555'));
    }
}


// --- Configuração do Phaser ---
// Agora que as classes estão definidas, podemos usá-las aqui
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 400,
    parent: 'phaser-game',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 1000 },
            debug: false // Mude para true para ver hitboxes
        }
    },
    scene: [StartScene, GameScene] // Agora isso funciona!
};

// Cria a instância do jogo
const game = new Phaser.Game(config);
console.log("Phaser Game instance created.");