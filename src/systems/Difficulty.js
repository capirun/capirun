import {
    BASE_SPEED,
    MAX_SPEED,
    SPEED_PER_SECOND,
    JUMP_AIRTIME,
    JUMP_VELOCITY,
    GRAVITY,
} from '../config/constants.js';

/** Velocidade do jogo (px/s) após `elapsedSec` segundos, com teto. */
export function speedAt(elapsedSec) {
    return Math.min(MAX_SPEED, BASE_SPEED + SPEED_PER_SECOND * Math.max(0, elapsedSec));
}

/** 0 na velocidade inicial, 1 na velocidade máxima. */
export function progressOf(speed) {
    return Math.min(1, Math.max(0, (speed - BASE_SPEED) / (MAX_SPEED - BASE_SPEED)));
}

/** Menor vão (px) entre o fim de um padrão e o início do próximo: dá para pousar e reagir. */
export function minGap(speed) {
    return speed * JUMP_AIRTIME * 0.75 + 150;
}

/** Vão sorteado; quanto mais rápido o jogo, menor a variação acima do mínimo. */
export function randomGap(speed, rng = Math.random) {
    const spread = 1.2 - 0.7 * progressOf(speed);
    return minGap(speed) * (1 + spread * rng());
}

/** Distância horizontal (px) que a capivara passa acima de `height` px num pulo completo. */
export function clearableSpan(height, speed) {
    const v = -JUMP_VELOCITY;
    const disc = v * v - 2 * GRAVITY * height;
    if (disc <= 0) return 0;
    return (speed * 2 * Math.sqrt(disc)) / GRAVITY;
}
