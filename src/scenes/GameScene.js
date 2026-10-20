import {
    WIDTH,
    HEIGHT,
    GROUND_TOP,
    GROUND_HEIGHT,
    SPAWN_X,
    BASE_SPEED,
    PX_PER_METER,
    COLLECTIBLE_POINTS,
    PHASE_GRACE_PX,
    PLAYER,
    DEPTH,
    FONT,
} from '../config/constants.js';
import { PHASES } from '../config/phases.js';
import Player from '../entities/Player.js';
import Obstacle from '../entities/Obstacle.js';
import PhaseManager from '../systems/PhaseManager.js';
import Spawner from '../systems/Spawner.js';
import InputController from '../systems/InputController.js';
import AudioManager from '../systems/AudioManager.js';
import Storage from '../systems/Storage.js';
import { speedAt } from '../systems/Difficulty.js';

/**
 * Orquestra a corrida. Emite em `this.events`: 'score' (score, meters), 'phase' (phase), 'gameover'.
 * A HUD (HudScene) e a tela de fim (GameOverScene) rodam por cima como cenas paralelas.
 */
export default class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    create() {
        this.state = 'playing';
        this.elapsed = 0;
        this.distancePx = 0;
        this.bonus = 0;
        this.speed = BASE_SPEED;
        this.lastScore = -1;

        this.sky = this.add.tileSprite(WIDTH / 2, HEIGHT / 2, WIDTH, HEIGHT, 'sky').setDepth(DEPTH.sky);
        this.groundVisual = this.add
            .tileSprite(WIDTH / 2, GROUND_TOP + GROUND_HEIGHT / 2, WIDTH, GROUND_HEIGHT, 'ground')
            .setDepth(DEPTH.ground);
        const ground = this.add.zone(WIDTH / 2, GROUND_TOP + GROUND_HEIGHT / 2, WIDTH, GROUND_HEIGHT);
        this.physics.add.existing(ground, true);

        this.player = new Player(this, PLAYER.x, GROUND_TOP);
        this.physics.add.collider(this.player, ground);

        this.obstacles = this.physics.add.group({ classType: Obstacle, allowGravity: false, immovable: true });
        this.collectibles = this.physics.add.group({ allowGravity: false });
        this.physics.add.overlap(this.player, this.obstacles, this.onHit, null, this);
        this.physics.add.overlap(this.player, this.collectibles, this.onCollect, null, this);

        const burst = (tint, extra = {}) =>
            this.add
                .particles(0, 0, 'particle', {
                    lifespan: 450,
                    speed: { min: 60, max: 160 },
                    angle: { min: 200, max: 340 },
                    gravityY: 600,
                    scale: { start: 1, end: 0 },
                    tint,
                    emitting: false,
                    ...extra,
                })
                .setDepth(DEPTH.fx);
        this.fx = {
            dust: burst(0xc8a27a),
            splash: burst(0x9fd8ff, { speed: { min: 100, max: 220 } }),
            sparkle: burst(0xf2c14e, { angle: { min: 0, max: 360 }, gravityY: 0 }),
        };

        this.controls = new InputController(this);
        this.audioManager = new AudioManager(this);
        this.spawner = new Spawner({
            spawnObstacle: (type, dx) => this.obstacles.get(SPAWN_X, 0).spawn(SPAWN_X + dx, type),
            spawnCollectible: (dx, height) => this.spawnCollectible(SPAWN_X + dx, height),
        });
        this.phases = new PhaseManager(PHASES, (phase, previous) => this.enterPhase(phase, previous));
        this.enterPhase(this.phases.current, null);

        const onPause = () => this.audioManager.pauseMusic();
        const onResume = () => {
            this.audioManager.resumeMusic();
            this.controls.reset();
        };
        this.events.on('pause', onPause);
        this.events.on('resume', onResume);
        this.events.once('shutdown', () => {
            this.events.off('pause', onPause);
            this.events.off('resume', onResume);
        });

        // launch reinicia a HUD se ela já estiver rodando (ex.: ao jogar de novo).
        this.scene.launch('HudScene');
    }

    get meters() {
        return Math.floor(this.distancePx / PX_PER_METER);
    }

    get score() {
        return this.meters + this.bonus;
    }

    update(time, delta) {
        if (this.state !== 'playing') return;

        const dt = Math.min(delta, 50) / 1000;
        this.elapsed += dt;
        this.speed = speedAt(this.elapsed);
        const dx = this.speed * dt;
        this.distancePx += dx;
        this.sky.tilePositionX += dx * 0.1;
        this.groundVisual.tilePositionX += dx;

        this.phases.update(this.meters);

        const event = this.player.step(time, this.controls.poll(), this.speed);
        if (event) this.onPlayerEvent(event);

        this.scroll(this.obstacles);
        this.scroll(this.collectibles);
        this.spawner.update(dx, this.speed, this.meters, this.phases.current);

        const score = this.score;
        if (score !== this.lastScore) {
            this.lastScore = score;
            this.events.emit('score', score, this.meters);
        }
    }

    scroll(group) {
        for (const object of group.getChildren()) {
            if (!object.active) continue;
            object.body.setVelocityX(-this.speed);
            if (object.getBounds().right < -20) this.despawn(object);
        }
    }

    despawn(object) {
        object.anims.stop();
        object.disableBody(true, true);
    }

    spawnCollectible(x, height) {
        const y = height === 'high' ? GROUND_TOP - 110 : GROUND_TOP - 22;
        const item = this.collectibles.get(x, y, 'capim');
        item.setTexture('capim').setDepth(DEPTH.collectible);
        item.enableBody(true, x, y, true, true);
        item.body.setAllowGravity(false);
    }

    enterPhase(phase, previous) {
        this.sky.setTint(phase.skyTint ?? 0xffffff);
        this.groundVisual.setTexture(phase.ground).setTint(phase.groundTint ?? 0xffffff);
        this.player.setMode(phase.playerMode);
        this.audioManager.playMusic(phase.music);
        if (!previous) return;

        // O flash esconde a troca de cenário e a limpeza dos obstáculos da fase anterior.
        this.cameras.main.flash(400, 255, 255, 255);
        [...this.obstacles.getChildren(), ...this.collectibles.getChildren()]
            .filter((object) => object.active)
            .forEach((object) => this.despawn(object));
        this.spawner.reset(PHASE_GRACE_PX);
        this.audioManager.play('phase');
        this.events.emit('phase', phase);
    }

    onPlayerEvent(event) {
        const x = this.player.x;
        const y = GROUND_TOP;
        const swimming = this.player.mode === 'swim';
        if (event === 'jump') this.audioManager.play(swimming ? 'splash' : 'jump');
        const fx = swimming ? this.fx.splash : this.fx.dust;
        fx.explode(event === 'land' ? 10 : 6, x, y);
    }

    onCollect(player, item) {
        if (this.state !== 'playing') return;
        this.despawn(item);
        this.bonus += COLLECTIBLE_POINTS;
        this.audioManager.play('coin');
        this.fx.sparkle.explode(12, item.x, item.y);
        const label = this.add
            .text(item.x, item.y - 10, `+${COLLECTIBLE_POINTS}`, { fontFamily: FONT, fontSize: '18px', color: '#f2c14e', stroke: '#5c3e30', strokeThickness: 4 })
            .setOrigin(0.5)
            .setDepth(DEPTH.fx);
        this.tweens.add({ targets: label, y: label.y - 40, alpha: 0, duration: 700, onComplete: () => label.destroy() });
    }

    onHit() {
        if (this.state !== 'playing') return;
        this.state = 'over';
        this.physics.pause();
        this.player.die();
        this.cameras.main.shake(250, 0.01);
        this.audioManager.play('hit');
        this.audioManager.stopMusic(600);

        const score = this.score;
        const previousBest = Storage.getBest();
        const isRecord = score > previousBest;
        if (isRecord) Storage.setBest(score);

        this.events.emit('gameover');
        this.scene.launch('GameOverScene', {
            score,
            meters: this.meters,
            best: Math.max(previousBest, score),
            isRecord,
            phase: this.phases.current.name,
        });
    }
}
