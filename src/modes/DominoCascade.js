// src/modes/DominoCascade.js
import { SAFE_ZONE } from '../config/SafeZone.js';
import { PRNG } from '../generator/PRNG.js';

/**
 * 🧱 DOMİNO ZİNCİRİ YIKIMI (DOMINO CASCADE)
 * SafeZone boyunca kıvrılan 240 neon domino taşı.
 * Yukarıdan düşen top ilk taşı devirir ve hipnotik ASMR tıkırtılarıyla
 * tüm ekran zincirleme yıkılarak alttaki dev gongu patlatır!
 */
export class DominoCascadeMode {
    constructor(seed = 1) {
        this.name = 'Domino Cascade';
        this.seed = seed;
        this.rng = new PRNG(seed * 345 + 67);
        this.duration = 28.0;

        this.dominoes = [];
        this.triggerBall = null;
        this.particles = [];
        this.toppledCount = 0;
        this.screenShake = 0;
        this.finalBellHit = false;

        this.initDominoTrack();
        this.initTriggerBall();
    }

    initDominoTrack() {
        this.dominoes = [];
        const count = 220;
        const colors = ['#00f0ff', '#ff0055', '#00ff88', '#ffd700', '#a855f7', '#ff7700'];

        // S-şeklinde kıvrılan spiral parkur
        for (let i = 0; i < count; i++) {
            const t = i / count;
            const y = SAFE_ZONE.startY + 120 + t * (SAFE_ZONE.height - 240);
            const wave = Math.sin(t * Math.PI * 6);
            const x = 540 + wave * (SAFE_ZONE.width * 0.38);

            this.dominoes.push({
                index: i + 1,
                x,
                y,
                w: 12,
                h: 38,
                angle: 0,
                targetAngle: Math.PI * 0.38,
                isToppled: false,
                color: colors[Math.floor(i / 10) % colors.length]
            });
        }
    }

    initTriggerBall() {
        this.triggerBall = {
            x: 540,
            y: SAFE_ZONE.startY + 40,
            vx: 0,
            vy: 240,
            radius: 16,
            color: '#ffffff',
            trail: []
        };
    }

    update(currentTime, dt, soundSynth) {
        if (this.screenShake > 0) this.screenShake = Math.max(0, this.screenShake - dt * 5);

        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.life -= dt * 2.2;
            if (p.life <= 0) this.particles.splice(i, 1);
        }

        // Tetikleyici top
        if (this.triggerBall) {
            this.triggerBall.vy += 650 * dt;
            this.triggerBall.y += this.triggerBall.vy * dt;

            // İlk domino taşına vurdu mu?
            const d1 = this.dominoes[0];
            if (d1 && !d1.isToppled && this.triggerBall.y >= d1.y - d1.h) {
                d1.isToppled = true;
                this.toppledCount++;
                this.triggerBall = null;
                if (soundSynth) {
                    const freq = typeof soundSynth.getFrequency === 'function' ? soundSynth.getFrequency(4) : 440;
                    soundSynth.addPlink(currentTime, freq, 0, 0.4);
                }
            }
        }

        // Domino zincirleme devrilme dalgası
        for (let i = 0; i < this.dominoes.length; i++) {
            const d = this.dominoes[i];
            if (d.isToppled) {
                if (d.angle < d.targetAngle) {
                    d.angle += dt * 14;
                    // Bir sonraki dominoyu devir
                    const next = this.dominoes[i + 1];
                    if (next && !next.isToppled && d.angle > d.targetAngle * 0.45) {
                        next.isToppled = true;
                        this.toppledCount++;

                        if (soundSynth) {
                            const pitch = typeof soundSynth.getFrequency === 'function' ? soundSynth.getFrequency(i % 11 + 3) : 440 * Math.pow(1.05946, i % 12);
                            soundSynth.addPlink(currentTime, pitch, (d.x - 540) / 470, 0.28);
                        }

                        if (this.rng.next() < 0.2) {
                            this._createSpark(d.x, d.y, d.color);
                        }
                    }
                }
            }
        }

        // Son domino devrildiğinde devasa final gongu
        const last = this.dominoes[this.dominoes.length - 1];
        if (last && last.isToppled && !this.finalBellHit && last.angle > last.targetAngle * 0.8) {
            this.finalBellHit = true;
            this.screenShake = 6.0;
            this._createBigExplosion(last.x, last.y);
            if (soundSynth) {
                soundSynth.addBassDrop(currentTime, 180, 35, 1.0);
            }
        }
    }

    _createSpark(x, y, color) {
        for (let i = 0; i < 4; i++) {
            const a = Math.random() * Math.PI * 2;
            const spd = 60 + Math.random() * 120;
            this.particles.push({
                x, y,
                vx: Math.cos(a) * spd,
                vy: Math.sin(a) * spd,
                color,
                radius: 2,
                life: 0.5
            });
        }
    }

    _createBigExplosion(x, y) {
        for (let i = 0; i < 30; i++) {
            const a = Math.random() * Math.PI * 2;
            const spd = 90 + Math.random() * 260;
            this.particles.push({
                x, y,
                vx: Math.cos(a) * spd,
                vy: Math.sin(a) * spd,
                color: '#ffd700',
                radius: 3 + Math.random() * 3,
                life: 0.95
            });
        }
    }

    render(ctx, currentTime) {
        ctx.save();
        if (this.screenShake > 0) ctx.translate((Math.random() - 0.5) * this.screenShake, (Math.random() - 0.5) * this.screenShake);

        ctx.fillStyle = '#030207';
        ctx.fillRect(0, 0, 1080, 1920);

        const pct = Math.round((this.toppledCount / this.dominoes.length) * 100);
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 28px "Orbitron", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🧱 DOMINO CASCADE • 100% COLLAPSE WAVE', 540, SAFE_ZONE.startY + 20);

        ctx.font = '900 32px "Orbitron", sans-serif';
        ctx.fillStyle = pct === 100 ? '#ffd700' : '#00ff88';
        ctx.fillText(`TOPPLED: ${this.toppledCount} / ${this.dominoes.length} (${pct}%)`, 540, SAFE_ZONE.startY + 65);

        // Domino Taşları
        ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < this.dominoes.length; i++) {
            const d = this.dominoes[i];
            ctx.save();
            ctx.translate(d.x, d.y);
            ctx.rotate(d.angle);

            ctx.fillStyle = d.color + (d.isToppled ? 'dd' : '66');
            ctx.fillRect(-d.w / 2, -d.h, d.w, d.h);

            ctx.strokeStyle = d.color;
            ctx.lineWidth = 1.8;
            ctx.strokeRect(-d.w / 2, -d.h, d.w, d.h);

            ctx.restore();
        }

        // Tetikleyici top
        if (this.triggerBall) {
            ctx.fillStyle = this.triggerBall.color;
            ctx.beginPath();
            ctx.arc(this.triggerBall.x, this.triggerBall.y, this.triggerBall.radius, 0, Math.PI * 2);
            ctx.fill();
        }

        // Parçacıklar
        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];
            ctx.fillStyle = p.color;
            ctx.globalAlpha = Math.max(0, p.life);
            ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalAlpha = 1.0;
        ctx.globalCompositeOperation = 'source-over';

        // Zafer Ekranı
        if (currentTime >= 26.5) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.78)';
            ctx.fillRect(0, 0, 1080, 1920);

            ctx.fillStyle = '#ffd700';
            ctx.font = '900 76px "Orbitron", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('COLLAPSED!', 540, 840);

            ctx.fillStyle = '#ffffff';
            ctx.font = '900 38px "Orbitron", sans-serif';
            ctx.fillText(`ALL ${this.dominoes.length} DOMINOES FALLEN! 🏆`, 540, 930);
        }

        ctx.restore();
    }
}
