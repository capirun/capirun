import { WIDTH, HEIGHT, FONT } from '../config/constants.js';
import { makeButton, makeMuteButton } from '../ui/buttons.js';
import Storage from '../systems/Storage.js';

/** Pontuação, recorde, aviso de fase e pausa. Roda em paralelo, acima da GameScene. */
export default class HudScene extends Phaser.Scene {
    constructor() {
        super('HudScene');
    }

    create() {
        this.gameScene = this.scene.get('GameScene');
        this.paused = false;

        const style = { fontFamily: FONT, fontSize: '22px', color: '#ffffff', backgroundColor: 'rgba(0,0,0,0.45)', padding: { x: 8, y: 4 } };
        this.scoreText = this.add.text(16, 14, '0 pts · 0 m', style);
        this.add.text(16, 52, `Recorde: ${Storage.getBest()}`, { ...style, fontSize: '14px' });

        this.pauseButton = makeButton(this, WIDTH - 36, 30, 'II', () => this.togglePause(), {
            fontSize: '18px',
            bg: 'rgba(0,0,0,0.45)',
            hover: 'rgba(0,0,0,0.7)',
        });
        makeMuteButton(this, WIDTH - 96, 30);

        this.banner = this.add
            .text(WIDTH / 2, 110, '', { fontFamily: FONT, fontSize: '32px', color: '#ffffff', stroke: '#5c3e30', strokeThickness: 6 })
            .setOrigin(0.5)
            .setAlpha(0);
        this.showBanner(this.gameScene.phases.current);

        this.pauseOverlay = this.add.container(0, 0, [
            this.add.rectangle(WIDTH / 2, HEIGHT / 2, WIDTH, HEIGHT, 0x000000, 0.5),
            this.add
                .text(WIDTH / 2, HEIGHT / 2, 'PAUSADO\n\nP / Esc ou toque para continuar', {
                    fontFamily: FONT,
                    fontSize: '24px',
                    color: '#ffffff',
                    align: 'center',
                })
                .setOrigin(0.5),
        ]);
        this.pauseOverlay.setVisible(false);
        this.pauseOverlay.list[0].setInteractive().on('pointerdown', (pointer, x, y, event) => {
            event.stopPropagation();
            this.togglePause();
        });

        const events = this.gameScene.events;
        events.on('score', this.onScore, this);
        events.on('phase', this.showBanner, this);
        events.on('gameover', this.onGameOver, this);
        this.input.keyboard.on('keydown-P', this.togglePause, this);
        this.input.keyboard.on('keydown-ESC', this.togglePause, this);
        this.game.events.on(Phaser.Core.Events.BLUR, this.onBlur, this);

        // Os emissores da GameScene e do jogo sobrevivem a esta cena: remover tudo ao encerrar.
        this.events.once('shutdown', () => {
            events.off('score', this.onScore, this);
            events.off('phase', this.showBanner, this);
            events.off('gameover', this.onGameOver, this);
            this.game.events.off(Phaser.Core.Events.BLUR, this.onBlur, this);
        });
    }

    onScore(score, meters) {
        this.scoreText.setText(`${score} pts · ${meters} m`);
    }

    showBanner(phase) {
        const number = this.gameScene.phases.phases.indexOf(phase) + 1;
        this.banner.setText(`Fase ${number}: ${phase.name}`).setAlpha(1);
        this.tweens.killTweensOf(this.banner);
        this.tweens.add({ targets: this.banner, alpha: 0, delay: 1400, duration: 600 });
    }

    togglePause() {
        if (this.gameScene.state !== 'playing') return;
        this.paused = !this.paused;
        if (this.paused) this.scene.pause('GameScene');
        else this.scene.resume('GameScene');
        this.pauseOverlay.setVisible(this.paused);
        this.pauseButton.setText(this.paused ? '▶' : 'II');
    }

    onBlur() {
        if (!this.paused) this.togglePause();
    }

    onGameOver() {
        this.pauseButton.setVisible(false);
    }
}
