import { MUSIC_VOLUME, SFX_VOLUME } from '../config/constants.js';

// Efeitos sonoros sintetizados (sem arquivos): frequência inicial/final, duração e forma de onda.
const SFX = {
    jump: { duration: 0.15, from: 320, to: 720, wave: 'sine', volume: 0.5 },
    coin: { duration: 0.12, from: 900, to: 1500, wave: 'square', volume: 0.2 },
    hit: { duration: 0.35, wave: 'noise', volume: 0.5 },
    splash: { duration: 0.25, wave: 'noise', volume: 0.2 },
    phase: { duration: 0.45, from: 440, to: 990, wave: 'square', volume: 0.2 },
};

function synth(ctx, { duration, from = 0, to = from, wave, volume }) {
    const rate = ctx.sampleRate;
    const length = Math.floor(rate * duration);
    const buffer = ctx.createBuffer(1, length, rate);
    const data = buffer.getChannelData(0);
    let phase = 0;
    for (let i = 0; i < length; i++) {
        const t = i / length;
        phase += (from + (to - from) * t) / rate;
        let sample;
        if (wave === 'noise') sample = Math.random() * 2 - 1;
        else if (wave === 'square') sample = phase % 1 < 0.5 ? 1 : -1;
        else sample = Math.sin(2 * Math.PI * phase);
        const attack = Math.min(1, i / (rate * 0.005));
        data[i] = sample * attack * (1 - t) ** 2 * volume;
    }
    return buffer;
}

/** Música com crossfade + efeitos. Uma instância por cena; tudo para quando a cena encerra. */
export default class AudioManager {
    /** Gera os efeitos no cache de áudio (só com Web Audio; em HTML5 Audio eles ficam mudos). */
    static createSfx(scene) {
        const ctx = scene.sound.context;
        if (!ctx) return;
        for (const [key, spec] of Object.entries(SFX)) {
            if (!scene.cache.audio.exists(key)) scene.cache.audio.add(key, synth(ctx, spec));
        }
    }

    constructor(scene) {
        this.scene = scene;
        this.music = null;
        this.musicKey = null;
        this.owned = new Set();
        scene.events.once('shutdown', this.destroy, this);
    }

    playMusic(key, fadeMs = 800) {
        if (key === this.musicKey) return;
        this.stopMusic(fadeMs);
        const music = this.scene.sound.add(key, { loop: true, volume: 0 });
        this.owned.add(music);
        music.play();
        this.scene.tweens.add({ targets: music, volume: MUSIC_VOLUME, duration: fadeMs });
        this.music = music;
        this.musicKey = key;
    }

    stopMusic(fadeMs = 0) {
        const old = this.music;
        this.music = null;
        this.musicKey = null;
        if (!old) return;
        const finish = () => {
            old.stop();
            old.destroy();
            this.owned.delete(old);
        };
        this.scene.tweens.killTweensOf(old);
        if (fadeMs > 0) {
            this.scene.tweens.add({ targets: old, volume: 0, duration: fadeMs, onComplete: finish });
        } else {
            finish();
        }
    }

    pauseMusic() {
        this.owned.forEach((sound) => sound.isPlaying && sound.pause());
    }

    resumeMusic() {
        this.owned.forEach((sound) => sound.isPaused && sound.resume());
    }

    play(key) {
        if (this.scene.cache.audio.exists(key)) this.scene.sound.play(key, { volume: SFX_VOLUME });
    }

    destroy() {
        // Os tweens morrem com a cena; sem isto, uma faixa em fade-out tocaria para sempre.
        this.owned.forEach((sound) => {
            sound.stop();
            sound.destroy();
        });
        this.owned.clear();
        this.music = null;
        this.musicKey = null;
    }
}
