import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PHASES } from '../src/config/phases.js';
import { OBSTACLE_TYPES } from '../src/config/obstacles.js';
import PhaseManager, { phaseIndexAt } from '../src/systems/PhaseManager.js';

test('fases têm limites crescentes e a última é infinita', () => {
    for (let i = 1; i < PHASES.length; i++) assert.ok(PHASES[i].until > PHASES[i - 1].until);
    assert.equal(PHASES.at(-1).until, Infinity);
});

test('todo padrão usa tipos de obstáculo existentes e toda fase tem um padrão liberado desde o início', () => {
    for (const phase of PHASES) {
        assert.ok(phase.patterns.some((p) => !p.minMeters), `${phase.id} sem padrão inicial`);
        for (const pattern of phase.patterns) {
            for (const item of pattern.items) assert.ok(OBSTACLE_TYPES[item.type], `${phase.id}: tipo ${item.type}`);
        }
    }
});

test('phaseIndexAt nas fronteiras', () => {
    assert.equal(phaseIndexAt(0, PHASES), 0);
    assert.equal(phaseIndexAt(PHASES[0].until - 1, PHASES), 0);
    assert.equal(phaseIndexAt(PHASES[0].until, PHASES), 1);
    assert.equal(phaseIndexAt(1e9, PHASES), PHASES.length - 1);
});

test('PhaseManager avisa cada transição uma única vez e em ordem', () => {
    const changes = [];
    const manager = new PhaseManager(PHASES, (phase, previous) => changes.push([previous.id, phase.id]));
    for (let meters = 0; meters < 2000; meters++) manager.update(meters);
    assert.deepEqual(changes, [
        ['campo', 'rio'],
        ['rio', 'noite'],
    ]);
});
