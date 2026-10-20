// Cada fase dura até `until` metros. Padrões são combinações de obstáculos que saem juntas;
// `dx` é o deslocamento em px a partir do primeiro item e `minMeters` libera o padrão mais tarde.
export const PHASES = [
    {
        id: 'campo',
        name: 'Campo',
        until: 300,
        ground: 'ground',
        music: 'track1',
        playerMode: 'run',
        collectibleChance: 0.35,
        patterns: [
            { weight: 5, items: [{ type: 'rock' }] },
            { weight: 2, minMeters: 80, items: [{ type: 'rock' }, { type: 'rock', dx: 52 }] },
            { weight: 2, minMeters: 150, items: [{ type: 'bird' }] },
        ],
    },
    {
        id: 'rio',
        name: 'Rio',
        until: 800,
        ground: 'water',
        music: 'track2',
        playerMode: 'swim',
        collectibleChance: 0.4,
        patterns: [
            { weight: 4, items: [{ type: 'croc' }] },
            { weight: 3, items: [{ type: 'crocSmall' }] },
            { weight: 2, minMeters: 450, items: [{ type: 'bird' }] },
        ],
    },
    {
        id: 'noite',
        name: 'Noite no Pantanal',
        until: Infinity,
        ground: 'ground',
        music: 'track1',
        playerMode: 'run',
        skyTint: 0x4a5a8a,
        groundTint: 0x7a7a9a,
        collectibleChance: 0.3,
        patterns: [
            { weight: 3, items: [{ type: 'rock' }] },
            { weight: 2, items: [{ type: 'rock' }, { type: 'rock', dx: 52 }] },
            { weight: 3, items: [{ type: 'bird' }] },
        ],
    },
];
