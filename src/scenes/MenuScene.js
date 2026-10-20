import { WIDTH, HEIGHT, GROUND_TOP, GROUND_HEIGHT, FONT } from '../config/constants.js';
import { makeButton, makeMuteButton } from '../ui/buttons.js';
import Storage from '../systems/Storage.js';

export default class MenuScene extends Phaser.Scene {
    constructor() {
        super('MenuScene');
    }

    create() {
        this.starting = false;
        this.sky = this.add.tileSprite(WIDTH / 2, HEIGHT / 2, WIDTH, HEIGHT, 'sky');
        this.ground = this.add.tileSprite(WIDTH / 2, GROUND_TOP + GROUND_HEIGHT / 2, WIDTH, GROUND_HEIGHT, 'ground');
        this.add.image(170, GROUND_TOP + 4, 'capi_stopped').setOrigin(0.5, 1).setScale(0.45);

        const centerX = WIDTH / 2 + 60;
        this.add
            .text(centerX, 100, 'CapiRun 3.0', {
                fontFamily: FONT,
                fontSize: '56px',
                color: '#5c3e30',
                stroke: '#ffffff',
                strokeThickness: 6,
            })
            .setOrigin(0.5);
        makeButton(this, centerX, 190, 'Jogar!', () => this.startGame(), { fontSize: '32px' });
        this.add
            .text(centerX, 245, `Recorde: ${Storage.getBest()}`, { fontFamily: FONT, fontSize: '20px', color: '#5c3e30' })
            .setOrigin(0.5);
        this.add
            .text(
                centerX,
                300,
                'Pular: Espaço / ↑ / W  ·  Agachar: ↓ / S  ·  Pausa: P\nCelular: toque à direita pula, à esquerda agacha',
                { fontFamily: 'Arial, sans-serif', fontSize: '14px', color: '#ffffff', align: 'center', stroke: '#5c3e30', strokeThickness: 3 },
            )
            .setOrigin(0.5);
        makeMuteButton(this, WIDTH - 36, 30);

        this.input.keyboard.on('keydown-SPACE', this.startGame, this);
        this.input.keyboard.on('keydown-ENTER', this.startGame, this);
    }

    update(time, delta) {
        this.sky.tilePositionX += delta * 0.01;
        this.ground.tilePositionX += delta * 0.05;
    }

    startGame() {
        if (this.starting) return;
        this.starting = true;
        this.scene.start('GameScene');
    }
}
