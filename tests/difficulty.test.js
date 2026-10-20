import { test } from 'node:test';
import assert from 'node:assert/strict';
import { speedAt, minGap, randomGap, clearableSpan } from '../src/systems/Difficulty.js';
import { BASE_SPEED, MAX_SPEED, JUMP_AIRTIME } from '../src/config/constants.js';

test('velocidade começa na base, cresce e respeita o teto', () => {
    assert.equal(speedAt(0), BASE_SPEED);
    let previous = 0;
    for (let t = 0; t <= 600; t += 5) {
        const speed = speedAt(t);
        assert.ok(speed >= previous);
        assert.ok(speed <= MAX_SPEED);
        previous = speed;
    }
    assert.equal(speedAt(10_000), MAX_SPEED);
});

test('vão sorteado fica entre o mínimo e pouco mais que o dobro', () => {
    for (const speed of [BASE_SPEED, 600, MAX_SPEED]) {
        assert.equal(randomGap(speed, () => 0), minGap(speed));
        assert.ok(randomGap(speed, () => 0.999) <= minGap(speed) * 2.2);
    }
});

test('o vão mínimo deixa tempo no chão entre dois pulos', () => {
    for (let speed = BASE_SPEED; speed <= MAX_SPEED; speed += 50) {
        // pior caso: pousa no meio do vão depois de meio pulo; sobra ≥ 0,25 s para reagir
        const groundTime = (minGap(speed) - (speed * JUMP_AIRTIME) / 2) / speed;
        assert.ok(groundTime >= 0.25, `speed ${speed}: ${groundTime.toFixed(2)}s`);
    }
});

test('clearableSpan: altura zero cobre o pulo inteiro e altura inalcançável cobre nada', () => {
    assert.equal(clearableSpan(0, BASE_SPEED), BASE_SPEED * JUMP_AIRTIME);
    assert.equal(clearableSpan(1000, BASE_SPEED), 0);
});
