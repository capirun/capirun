import { WIDTH, HEIGHT, FONT } from '../config/constants.js';
import AudioManager from '../systems/AudioManager.js';
import Storage from '../systems/Storage.js';

/** Carrega tudo com barra de progresso e cria texturas/animações uma única vez. */
export default class PreloadScene extends Phaser.Scene {
    constructor() {
        super('PreloadScene');
    }

    preload() {
        this.cameras.main.setBackgroundColor('#a0d4a1');
        this.add
            .text(WIDTH / 2, HEIGHT / 2 - 40, 'Carregando...', { fontFamily: FONT, fontSize: '24px', color: '#5c3e30' })
            .setOrigin(0.5);
        const bar = this.add.graphics();
        this.load.on('progress', (value) => {
            bar.clear();
            bar.fillStyle(0x5c3e30).fillRect(WIDTH / 2 - 152, HEIGHT / 2 - 10, 304, 20);
            bar.fillStyle(0xf2c14e).fillRect(WIDTH / 2 - 150, HEIGHT / 2 - 8, 300 * value, 16);
        });

        this.load.image('sky', 'assets/placeholder_sky.png');
        this.load.image('ground', 'assets/placeholder_ground.png');
        this.load.image('water', 'assets/water.png');
        this.load.image('capi_moving_1', 'assets/capi_moving_1.png');
        this.load.image('capi_moving_2', 'assets/capi_moving_2.png');
        this.load.image('capi_stopped', 'assets/capi_stopped.png');
        this.load.image('obstacle_rock', 'assets/placeholder_rock.png');
        this.load.image('crocodile_closed_mouth', 'assets/crocodile_closed_mouth_192.png');
        this.load.image('crocodile_open_mouth', 'assets/crocodile_open_mouth_192.png');
        this.load.audio('track1', 'assets/trilha_sonora.ogg');
        this.load.audio('track2', 'assets/two_steps_from_hell.ogg');
    }

    create() {
        this.makeTextures();
        this.makeAnimations();
        AudioManager.createSfx(this);
        this.sound.mute = Storage.isMuted();
        this.scene.start('MenuScene');
    }

    // Texturas desenhadas em código enquanto não há arte final.
    makeTextures() {
        const g = this.make.graphics({ x: 0, y: 0 }, false);

        const drawBird = (key, wingUp) => {
            g.clear();
            g.fillStyle(0x3b3b4f);
            g.fillEllipse(24, 16, 28, 12);
            g.fillCircle(10, 12, 6);
            g.fillTriangle(36, 14, 44, 10, 44, 20);
            g.fillStyle(0xf2a03d);
            g.fillTriangle(0, 12, 6, 10, 6, 14);
            g.fillStyle(0x24243a);
            if (wingUp) g.fillTriangle(18, 14, 34, 14, 30, 0);
            else g.fillTriangle(18, 16, 34, 16, 30, 28);
            g.fillStyle(0xffffff);
            g.fillCircle(9, 10, 1.5);
            g.generateTexture(key, 44, 28);
        };
        drawBird('bird_1', true);
        drawBird('bird_2', false);

        g.clear();
        g.fillStyle(0x4caf50);
        g.fillTriangle(2, 24, 8, 24, 4, 4);
        g.fillTriangle(7, 24, 14, 24, 11, 0);
        g.fillTriangle(12, 24, 20, 24, 18, 6);
        g.fillStyle(0x2e7d32);
        g.fillTriangle(16, 24, 23, 24, 22, 10);
        g.generateTexture('capim', 24, 24);

        g.clear();
        g.fillStyle(0xffffff);
        g.fillCircle(4, 4, 4);
        g.generateTexture('particle', 8, 8);

        g.destroy();
    }

    makeAnimations() {
        this.anims.create({
            key: 'capivara_run',
            frames: [{ key: 'capi_moving_1' }, { key: 'capi_moving_2' }],
            frameRate: 6,
            repeat: -1,
        });
        this.anims.create({
            key: 'crocodile_anim',
            frames: [{ key: 'crocodile_closed_mouth' }, { key: 'crocodile_open_mouth' }],
            frameRate: 2,
            repeat: -1,
        });
        this.anims.create({
            key: 'bird_flap',
            frames: [{ key: 'bird_1' }, { key: 'bird_2' }],
            frameRate: 8,
            repeat: -1,
        });
    }
}
