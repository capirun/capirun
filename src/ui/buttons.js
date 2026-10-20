import { FONT } from '../config/constants.js';
import Storage from '../systems/Storage.js';

/** Botão de texto. O clique não vaza para as cenas de baixo (ex.: não faz a capivara pular). */
export function makeButton(scene, x, y, label, onClick, { fontSize = '28px', bg = '#7a5f4e', hover = '#9c7b68' } = {}) {
    const button = scene.add
        .text(x, y, label, { fontFamily: FONT, fontSize, color: '#ffffff', backgroundColor: bg, padding: { x: 18, y: 8 } })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });
    button.on('pointerover', () => button.setBackgroundColor(hover));
    button.on('pointerout', () => button.setBackgroundColor(bg));
    button.on('pointerdown', (pointer, localX, localY, event) => {
        event.stopPropagation();
        onClick();
    });
    return button;
}

/** Liga/desliga todo o som do jogo e lembra a escolha. */
export function makeMuteButton(scene, x, y) {
    const label = () => (scene.sound.mute ? '🔇' : '🔊');
    const button = makeButton(
        scene,
        x,
        y,
        label(),
        () => {
            scene.sound.mute = !scene.sound.mute;
            Storage.setMuted(scene.sound.mute);
            button.setText(label());
        },
        { fontSize: '18px', bg: 'rgba(0,0,0,0.45)', hover: 'rgba(0,0,0,0.7)' },
    );
    return button;
}
