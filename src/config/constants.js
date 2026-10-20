// --- Mundo ---
export const WIDTH = 800;
export const HEIGHT = 400;
export const GRAVITY = 1000;
export const GROUND_HEIGHT = 50;
export const GROUND_TOP = HEIGHT - GROUND_HEIGHT;
export const SPAWN_X = WIDTH + 40;

// --- Velocidade / dificuldade ---
export const BASE_SPEED = 300;
export const MAX_SPEED = 900;
export const SPEED_PER_SECOND = 6;
export const START_GRACE_PX = 700; // distância livre no início da corrida
export const PHASE_GRACE_PX = 600; // distância livre logo após trocar de fase

// --- Pulo ---
export const JUMP_VELOCITY = -500;
export const JUMP_CUT = 0.4; // fator aplicado ao soltar o pulo (pulo variável)
export const FAST_FALL_SPEED = 450; // agachar no ar acelera a queda
export const COYOTE_MS = 80;
export const JUMP_BUFFER_MS = 100;
export const JUMP_AIRTIME = (2 * -JUMP_VELOCITY) / GRAVITY;

// --- Pontuação ---
export const PX_PER_METER = 20;
export const COLLECTIBLE_POINTS = 10;

// --- Áudio ---
export const MUSIC_VOLUME = 0.4;
export const SFX_VOLUME = 0.5;

// --- Capivara ---
export const PLAYER = {
    x: 100,
    frame: { w: 58, h: 36 }, // tamanho de capi_moving_1.png
    scale: 2,
    body: { w: 0.65, h: 0.8, shiftX: -8 }, // hitbox relativa ao frame (sem a cabeça)
    crouchScaleY: 0.7,
    swimSink: 10, // px (no frame) que a capivara afunda ao nadar
    tint: 0xffff00,
};

/** Tamanho da hitbox da capivara na tela. */
export function playerBody(crouching = false) {
    const scaleY = PLAYER.scale * (crouching ? PLAYER.crouchScaleY : 1);
    return {
        width: PLAYER.frame.w * PLAYER.body.w * PLAYER.scale,
        height: PLAYER.frame.h * PLAYER.body.h * scaleY,
    };
}

// --- Renderização ---
export const DEPTH = { sky: 0, obstacle: 3, collectible: 3, player: 4, ground: 5, fx: 6 };
export const FONT = '"Arial Black", Arial, sans-serif';
