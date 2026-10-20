import { WIDTH, HEIGHT, GRAVITY } from './config/constants.js';
import PreloadScene from './scenes/PreloadScene.js';
import MenuScene from './scenes/MenuScene.js';
import GameScene from './scenes/GameScene.js';
import HudScene from './scenes/HudScene.js';
import GameOverScene from './scenes/GameOverScene.js';

// ?debug na URL mostra as hitboxes e expõe o jogo em window.game.
const debug = new URLSearchParams(window.location.search).has('debug');

const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'phaser-game',
    backgroundColor: '#222222',
    physics: {
        default: 'arcade',
        arcade: { gravity: { y: GRAVITY }, debug },
    },
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: WIDTH,
        height: HEIGHT,
    },
    input: { activePointers: 3 }, // pular e agachar ao mesmo tempo no toque
    // A ordem define a sobreposição: HUD e fim de jogo ficam acima da GameScene.
    scene: [PreloadScene, MenuScene, GameScene, HudScene, GameOverScene],
});

if (debug) window.game = game;
