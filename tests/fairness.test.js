import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PHASES } from '../src/config/phases.js';
import { OBSTACLE_TYPES, bodyBox } from '../src/config/obstacles.js';
import { GROUND_TOP, BASE_SPEED, playerBody } from '../src/config/constants.js';
import { clearableSpan } from '../src/systems/Difficulty.js';

const standingTop = GROUND_TOP - playerBody(false).height;
const crouchingTop = GROUND_TOP - playerBody(true).height;

test('todo obstáculo acerta a capivara em pé (nenhum é decorativo)', () => {
    for (const [type, def] of Object.entries(OBSTACLE_TYPES)) {
        const box = bodyBox(def);
        assert.ok(box.top < GROUND_TOP && box.bottom > standingTop, type);
    }
});

test('todo padrão de toda fase pode ser pulado ou passado agachado na velocidade inicial', () => {
    for (const phase of PHASES) {
        for (const pattern of phase.patterns) {
            const boxes = pattern.items.map((item) => bodyBox(OBSTACLE_TYPES[item.type], item.dx ?? 0));
            const left = Math.min(...boxes.map((b) => b.left));
            const right = Math.max(...boxes.map((b) => b.right));
            const top = Math.min(...boxes.map((b) => b.top));
            const bottom = Math.max(...boxes.map((b) => b.bottom));

            const duckable = bottom < crouchingTop;
            const jumpable = clearableSpan(GROUND_TOP - top, BASE_SPEED) >= right - left + playerBody().width;
            const name = `${phase.id}: ${pattern.items.map((i) => i.type).join('+')}`;
            assert.ok(duckable || jumpable, name);
        }
    }
});
