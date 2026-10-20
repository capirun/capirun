/**
 * Junta teclado, mouse e toque em três ações por frame: jumpPressed, jumpReleased, crouchHeld.
 * No toque, a metade esquerda da tela agacha e a direita pula; no mouse, qualquer clique pula.
 */
export default class InputController {
    constructor(scene) {
        const K = Phaser.Input.Keyboard.KeyCodes;
        const keyboard = scene.input.keyboard;
        this.scene = scene;
        this.jumpKeys = [K.SPACE, K.UP, K.W].map((code) => keyboard.addKey(code));
        this.crouchKeys = [K.DOWN, K.S].map((code) => keyboard.addKey(code));
        this.jumpPointers = new Set();
        this.crouchPointers = new Set();
        this.pointerJumpPressed = false;
        this.pointerJumpReleased = false;

        scene.input.on('pointerdown', this.onPointerDown, this);
        scene.input.on('pointerup', this.onPointerUp, this);
        scene.events.once('shutdown', this.destroy, this);
    }

    onPointerDown(pointer) {
        if (pointer.wasTouch && pointer.x < this.scene.scale.width / 2) {
            this.crouchPointers.add(pointer.id);
            return;
        }
        this.jumpPointers.add(pointer.id);
        this.pointerJumpPressed = true;
    }

    onPointerUp(pointer) {
        this.crouchPointers.delete(pointer.id);
        if (this.jumpPointers.delete(pointer.id)) this.pointerJumpReleased = true;
    }

    poll() {
        const { JustDown, JustUp } = Phaser.Input.Keyboard;
        // map antes de some: todas as teclas precisam ser lidas para consumir os flags Just*.
        const keyPressed = this.jumpKeys.map((key) => JustDown(key)).some(Boolean);
        const keyReleased = this.jumpKeys.map((key) => JustUp(key)).some(Boolean);
        const actions = {
            jumpPressed: keyPressed || this.pointerJumpPressed,
            jumpReleased: keyReleased || this.pointerJumpReleased,
            crouchHeld: this.crouchKeys.some((key) => key.isDown) || this.crouchPointers.size > 0,
        };
        this.pointerJumpPressed = false;
        this.pointerJumpReleased = false;
        return actions;
    }

    /** Descarta entradas acumuladas (ex.: teclas pressionadas durante a pausa). */
    reset() {
        [...this.jumpKeys, ...this.crouchKeys].forEach((key) => key.reset());
        this.jumpPointers.clear();
        this.crouchPointers.clear();
        this.pointerJumpPressed = false;
        this.pointerJumpReleased = false;
    }

    destroy() {
        this.scene.input.off('pointerdown', this.onPointerDown, this);
        this.scene.input.off('pointerup', this.onPointerUp, this);
    }
}
