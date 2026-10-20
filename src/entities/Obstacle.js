import { OBSTACLE_TYPES, baselineY, bodyBox } from '../config/obstacles.js';
import { DEPTH } from '../config/constants.js';

/** Obstáculo reutilizável (pool): `spawn` reconfigura textura, hitbox e animação conforme o tipo. */
export default class Obstacle extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'obstacle_rock');
    }

    /** Posiciona com a borda esquerda em x e devolve a largura na tela. */
    spawn(x, type) {
        const def = OBSTACLE_TYPES[type];
        this.anims.stop();
        this.setTexture(def.texture).setOrigin(0, 1).setScale(def.scale ?? 1).setDepth(DEPTH.obstacle);
        this.enableBody(false, 0, 0, true, true);
        this.body.setAllowGravity(false);
        this.body.setImmovable(true);

        if (this.frame.width !== def.frame.w || this.frame.height !== def.frame.h) {
            console.warn(`Obstáculo "${type}": textura ${this.frame.width}x${this.frame.height} difere de frame em obstacles.js`);
        }
        const { size, offset } = bodyBox(def);
        this.body.setSize(size.w, size.h, false);
        this.body.setOffset(offset.x, offset.y);
        this.body.reset(x, baselineY(def));

        if (def.anim) this.play(def.anim);
        return this.displayWidth;
    }
}
