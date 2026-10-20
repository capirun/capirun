import { test } from 'node:test';
import assert from 'node:assert/strict';
import Spawner, { pickPattern } from '../src/systems/Spawner.js';
import { speedAt, minGap } from '../src/systems/Difficulty.js';
import { phaseIndexAt } from '../src/systems/PhaseManager.js';
import { PHASES } from '../src/config/phases.js';
import { OBSTACLE_TYPES, bodyBox } from '../src/config/obstacles.js';
import { PX_PER_METER } from '../src/config/constants.js';

// PRNG determinístico para os testes serem reproduzíveis.
function mulberry32(seed) {
    return () => {
        seed = (seed + 0x6d2b79f5) | 0;
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/** Simula `seconds` de corrida a 60 fps e devolve cada padrão gerado com posição no mundo. */
function simulate(seed, seconds) {
    const patterns = [];
    let distance = 0;
    let current = null;
    const spawner = new Spawner({
        rng: mulberry32(seed),
        spawnObstacle: (type, dx) => {
            const width = bodyBox(OBSTACLE_TYPES[type]).width;
            current.items.push(type);
            current.end = Math.max(current.end, distance + dx + width);
            return width;
        },
        spawnCollectible: () => {},
    });
    for (let frame = 0, elapsed = 0; frame < seconds * 60; frame++) {
        elapsed += 1 / 60;
        const speed = speedAt(elapsed);
        const dx = speed / 60;
        distance += dx;
        const meters = distance / PX_PER_METER;
        current = { start: distance, end: distance, speed, meters, items: [] };
        spawner.update(dx, speed, meters, PHASES[phaseIndexAt(meters, PHASES)]);
        if (current.items.length) patterns.push(current);
    }
    return patterns;
}

test('vão entre padrões nunca fica abaixo do mínimo', () => {
    for (const seed of [1, 2, 3, 42, 1234]) {
        const patterns = simulate(seed, 180);
        assert.ok(patterns.length > 50);
        for (let i = 1; i < patterns.length; i++) {
            const gap = patterns[i].start - patterns[i - 1].end;
            assert.ok(gap >= minGap(patterns[i - 1].speed) - 1e-6, `seed ${seed}, padrão ${i}: vão ${gap.toFixed(1)}`);
        }
    }
});

test('padrões só aparecem depois do seu minMeters e na fase certa', () => {
    for (const pattern of simulate(7, 180)) {
        const phase = PHASES[phaseIndexAt(pattern.meters, PHASES)];
        const allowed = phase.patterns.filter((p) => (p.minMeters ?? 0) <= pattern.meters).map((p) => p.items.map((i) => i.type).join('+'));
        assert.ok(allowed.includes(pattern.items.join('+')), `${pattern.items} em ${phase.id} @${pattern.meters.toFixed(0)}m`);
    }
});

test('pickPattern respeita os pesos', () => {
    const patterns = [
        { weight: 3, items: [{ type: 'a' }] },
        { weight: 1, items: [{ type: 'b' }] },
    ];
    const rng = mulberry32(99);
    let a = 0;
    for (let i = 0; i < 10_000; i++) if (pickPattern(patterns, 0, rng).items[0].type === 'a') a++;
    assert.ok(Math.abs(a / 10_000 - 0.75) < 0.02);
});
