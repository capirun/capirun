import { randomGap } from './Difficulty.js';
import { START_GRACE_PX } from '../config/constants.js';

/** Sorteia um padrão (ponderado por `weight`) entre os já liberados para a distância atual. */
export function pickPattern(patterns, meters, rng = Math.random) {
    const available = patterns.filter((p) => (p.minMeters ?? 0) <= meters);
    const total = available.reduce((sum, p) => sum + p.weight, 0);
    let roll = rng() * total;
    for (const pattern of available) {
        roll -= pattern.weight;
        if (roll < 0) return pattern;
    }
    return available[available.length - 1];
}

/**
 * Decide quando e o que gerar, medindo distância em px (não tempo), para que o vão entre
 * padrões nunca fique abaixo de minGap(). Não depende do Phaser: quem cria os objetos são
 * os callbacks `spawnObstacle(type, dx) → largura` e `spawnCollectible(dx, 'low'|'high')`.
 */
export default class Spawner {
    constructor({ spawnObstacle, spawnCollectible, rng = Math.random }) {
        this.spawnObstacle = spawnObstacle;
        this.spawnCollectible = spawnCollectible;
        this.rng = rng;
        this.reset(START_GRACE_PX);
    }

    reset(gracePx) {
        this.untilNext = gracePx;
    }

    update(dx, speed, meters, phase) {
        this.untilNext -= dx;
        if (this.untilNext > 0) return;

        const pattern = pickPattern(phase.patterns, meters, this.rng);
        let span = 0;
        for (const item of pattern.items) {
            const offset = item.dx ?? 0;
            span = Math.max(span, offset + this.spawnObstacle(item.type, offset));
        }

        const gap = randomGap(speed, this.rng);
        if (this.rng() < (phase.collectibleChance ?? 0)) {
            this.spawnCollectible(span + gap / 2, this.rng() < 0.5 ? 'low' : 'high');
        }
        this.untilNext = span + gap;
    }
}
