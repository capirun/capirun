import {
    PLAYER,
    JUMP_VELOCITY,
    JUMP_CUT,
    FAST_FALL_SPEED,
    COYOTE_MS,
    JUMP_BUFFER_MS,
    BASE_SPEED,
    DEPTH,
    GROUND_TOP,
} from '../config/constants.js';

const GROUND_SNAP = 4;

/**
 * A capivara. Estados: run, crouch, jump, fall. Modos: run (chão) e swim (água: o sprite
 * afunda mantendo a hitbox na superfície). Origem na base, então mudar a escala não a tira do chão.
 */
export default class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'capi_moving_1');
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setOrigin(0.5, 1).setScale(PLAYER.scale).setTint(PLAYER.tint).setDepth(DEPTH.player);
        this.setCollideWorldBounds(true);

        const { w, h } = PLAYER.frame;
        const bodyWidth = w * PLAYER.body.w;
        const bodyHeight = h * PLAYER.body.h;
        this.body.setSize(bodyWidth, bodyHeight, false);
        this.baseOffset = { x: (w - bodyWidth) / 2 + PLAYER.body.shiftX, y: h - bodyHeight };

        this.mode = 'run';
        this.state = 'run';
        this.crouching = false;
        this.lastGroundedAt = -Infinity;
        this.jumpBufferedAt = -Infinity;
        this.applyOffset();
        this.play('capivara_run');
    }

    setMode(mode) {
        this.mode = mode;
        this.applyOffset();
    }

    applyOffset() {
        // O offset é multiplicado pela escala atual; dividir mantém o afundamento constante na tela
        // (senão agachar na água desloca a hitbox para dentro do chão).
        const sinkPx = this.mode === 'swim' ? PLAYER.swimSink * PLAYER.scale : 0;
        this.body.setOffset(this.baseOffset.x, this.baseOffset.y - sinkPx / this.scaleY);
    }

    get isGrounded() {
        if (this.body.blocked.down || this.body.touching.down) return true;
        // Os frames da corrida têm alturas diferentes (36 e 35 px) e agachar muda a escala: a hitbox
        // sobe 1–2 px e ficaria "no ar" por um frame. Perto do chão e descendo conta como chão.
        return this.body.velocity.y >= 0 && this.body.bottom >= GROUND_TOP - GROUND_SNAP;
    }

    setCrouching(crouching) {
        if (crouching === this.crouching) return;
        this.crouching = crouching;
        this.setScale(PLAYER.scale, PLAYER.scale * (crouching ? PLAYER.crouchScaleY : 1));
        this.applyOffset();
    }

    /** Aplica as ações do frame. Retorna 'jump', 'land' ou null. */
    step(time, input, speed) {
        this.anims.timeScale = speed / BASE_SPEED;

        const grounded = this.isGrounded;
        const wasAirborne = this.state === 'jump' || this.state === 'fall';
        if (grounded) this.lastGroundedAt = time;
        if (input.jumpPressed) this.jumpBufferedAt = time;

        // Coyote time + jump buffer: aceita o pulo um pouco antes de pousar ou logo após sair do chão.
        const canJump = this.state !== 'jump' && time - this.lastGroundedAt <= COYOTE_MS;
        if (canJump && time - this.jumpBufferedAt <= JUMP_BUFFER_MS) {
            this.setCrouching(false);
            this.setVelocityY(JUMP_VELOCITY);
            this.state = 'jump';
            this.jumpBufferedAt = -Infinity;
            this.lastGroundedAt = -Infinity;
            return 'jump';
        }

        if (input.jumpReleased && this.body.velocity.y < 0) {
            this.setVelocityY(this.body.velocity.y * JUMP_CUT);
        }

        if (grounded) {
            this.setCrouching(input.crouchHeld);
            this.state = this.crouching ? 'crouch' : 'run';
            return wasAirborne ? 'land' : null;
        }

        this.setCrouching(false);
        if (input.crouchHeld && this.body.velocity.y < FAST_FALL_SPEED) {
            this.setVelocityY(FAST_FALL_SPEED);
        }
        this.state = this.body.velocity.y < 0 ? 'jump' : 'fall';
        return null;
    }

    die() {
        this.setTint(0xff0000);
        this.anims.stop();
        this.setVelocity(0, 0);
    }
}
