import { GROUND_TOP } from './constants.js';

// frame: tamanho da textura em px; body: hitbox em fração do frame.
// sink: quanto a base do sprite fica abaixo do chão; lift: quanto fica acima.
export const OBSTACLE_TYPES = {
    rock: {
        texture: 'obstacle_rock',
        frame: { w: 59, h: 50 },
        body: { w: 0.8, h: 0.75, align: 'bottom' },
        sink: 5,
    },
    croc: {
        texture: 'crocodile_closed_mouth',
        anim: 'crocodile_anim',
        frame: { w: 191, h: 41 },
        body: { w: 0.6, h: 0.6, align: 'top' },
        sink: 19,
    },
    crocSmall: {
        texture: 'crocodile_closed_mouth',
        anim: 'crocodile_anim',
        frame: { w: 191, h: 41 },
        scale: 0.65,
        body: { w: 0.6, h: 0.6, align: 'top' },
        sink: 12,
    },
    bird: {
        texture: 'bird_1',
        anim: 'bird_flap',
        frame: { w: 44, h: 28 },
        body: { w: 0.8, h: 0.6, align: 'center' },
        lift: 45, // alto o bastante para passar agachado, baixo o bastante para acertar em pé
    },
};

/** Y da base do sprite (origem 0,1). */
export function baselineY(def) {
    return GROUND_TOP + (def.sink ?? 0) - (def.lift ?? 0);
}

/** Hitbox do obstáculo: tamanho/offset no frame e caixa no mundo com a borda esquerda em x. */
export function bodyBox(def, x = 0) {
    const scale = def.scale ?? 1;
    const { w: fw, h: fh } = def.frame;
    const bw = fw * def.body.w;
    const bh = fh * def.body.h;
    const ox = (fw - bw) / 2;
    const oy = def.body.align === 'top' ? 0 : def.body.align === 'center' ? (fh - bh) / 2 : fh - bh;
    const top = baselineY(def) - fh * scale + oy * scale;
    return {
        size: { w: bw, h: bh },
        offset: { x: ox, y: oy },
        left: x + ox * scale,
        right: x + (ox + bw) * scale,
        top,
        bottom: top + bh * scale,
        width: fw * scale,
    };
}
