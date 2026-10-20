import { WIDTH, HEIGHT, FONT } from '../config/constants.js';
import { makeButton } from '../ui/buttons.js';

const RESTART_KEYS = ['Space', 'Enter', 'ArrowUp', 'KeyW'];
const MENU_KEYS = ['Escape', 'KeyM'];

export default class GameOverScene extends Phaser.Scene {
    constructor() {
        super('GameOverScene');
    }

    create({ score, meters, best, isRecord, phase }) {
        this.leaving = false;
        const cx = WIDTH / 2;
        const text = (y, value, size, color = '#ffffff') =>
            this.add.text(cx, y, value, { fontFamily: FONT, fontSize: size, color }).setOrigin(0.5);

        this.add.rectangle(cx, HEIGHT / 2, WIDTH, HEIGHT, 0x000000, 0.35);
        this.add.rectangle(cx, HEIGHT / 2, 440, 280, 0x2b1d14, 0.92).setStrokeStyle(3, 0xf2c14e);
        text(95, 'BATEU AS BOTAS', '40px', '#ff4d4d');
        text(150, `${score} pontos · ${meters} m`, '24px');
        text(182, `Fase: ${phase}`, '16px', '#d9c7b8');
        const record = text(215, isRecord ? 'NOVO RECORDE!' : `Recorde: ${best}`, '20px', '#f2c14e');
        if (isRecord) this.tweens.add({ targets: record, scale: 1.15, yoyo: true, repeat: -1, duration: 400 });

        makeButton(this, cx - 95, 275, 'Reiniciar', () => this.restart(), { fontSize: '22px' });
        makeButton(this, cx + 95, 275, 'Menu', () => this.toMenu(), { fontSize: '22px', bg: '#555555', hover: '#777777' });

        // Pequeno atraso para que a tecla de pulo ainda pressionada não reinicie sem querer.
        this.time.delayedCall(400, () => {
            this.input.keyboard.on('keydown', (event) => {
                if (RESTART_KEYS.includes(event.code)) this.restart();
                else if (MENU_KEYS.includes(event.code)) this.toMenu();
            });
        });
    }

    restart() {
        if (this.leaving) return;
        this.leaving = true;
        this.scene.start('GameScene');
    }

    toMenu() {
        if (this.leaving) return;
        this.leaving = true;
        this.scene.stop('HudScene');
        this.scene.stop('GameScene');
        this.scene.start('MenuScene');
    }
}
