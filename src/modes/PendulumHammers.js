// src/modes/PendulumHammers.js
import { SAFE_ZONE } from '../config/SafeZone.js';
import { PRNG } from '../generator/PRNG.js';

/**
 * 🔨 SARKAÇ TOKMAKLARI (PENDULUM HAMMERS)
 * Tavandan asılı sağa-sola salınan dev neon tokmaklar.
 * 22 top tokmakların ölümcül darbesinden kaçarak alt güvenli hedefe inmeye çalışır.
 */
export class PendulumHammersMode {
    constructor(seed = 1) {
        this.name = 'Pendulum Hammers';
        this.seed = seed;
        this.rng = new PRNG(seed * 921 + 84);
        this.duration = 28.0;

        this.balls = [];
        this.hammers = [];
        this.particles = [];
        this.survivors = 0;
        this.totalBalls = 22;
        this.screenShake = 0;

        this.initHammers();
        this.initBalls();
    }

    initHammers() {
        this.hammers = [
            { anchorX: 420, anchorY: 380, length: 220, angle: -0.9, maxAngle: 1.1, speed: 2.8, headR: 38, color: '#ff0055' },
            { anchorX: 660, anchorY: 620, length: 240, angle: 0.9, maxAngle: 1.2, speed: -2.6, headR: 42, color: '#ffd700' },
            { anchorX: 380, anchorY: 880, length: 230, angle: -1.0, maxAngle: 1.1, speed: 3.1, headR: 40, color: '#00f0ff' },
            { anchorX: 680, anchorY: 1140, length: 250, angle: 0.8, maxAngle: 1.3, speed: -3.3, headR: 44, color: '#00ff88' }
        ];
    }

    initBalls() {
        this.balls = [];
        const colors = ['#00f0ff', '#ff0055', '#00ff88', '#ffd700', '#ffffff', '#a855f7'];

        for (let i = 0; i < this.totalBalls; i++) {
            this.balls.push({
                id: i + 1,
                x: 540 + (i - this.totalBalls / 2) * 26 + (Math.random() - 0.5) * 15,
                y: SAFE_ZONE.startY + 60 + Math.random() * 50,
                vx: (Math.random() - 0.5) * 120,
                vy: 100 + Math.random() * 80,
                radius: 12,
                color: colors[i % colors.length],
                isAlive: true,
                isSafe: false,
                trail: []
            });
        }
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

        // Sarkaçları salındır
        for (let i = 0; i < this.hammers.length; i++) {
            const h = this.hammers[i];
            h.angle = Math.sin(currentTime * h.speed) * h.maxAngle;
            h.headX = h.anchorX + Math.sin(h.angle) * h.length;
            h.headY = h.anchorY + Math.cos(h.angle) * h.length;
        }

        const safeY = SAFE_ZONE.endY - 60;

        for (let i = 0; i < this.balls.length; i++) {
            const b = this.balls[i];
            if (!b.isAlive) continue;

            b.vy += 480 * dt;
            b.x += b.vx * dt;
            b.y += b.vy * dt;

            const minX = SAFE_ZONE.startX + b.radius;
            const maxX = SAFE_ZONE.endX - b.radius;
            if (b.x <= minX) { b.x = minX; b.vx = Math.abs(b.vx) * 0.85; }
            if (b.x >= maxX) { b.x = maxX; b.vx = -Math.abs(b.vx) * 0.85; }

            // Hedefe ulaştı mı?
            if (b.y >= safeY && !b.isSafe) {
                b.isSafe = true;
                this.survivors++;
                b.vy = -Math.abs(b.vy) * 0.6;
                if (soundSynth) soundSynth.addGateDing(currentTime, 2.0);
            }

            // Tokmak çarpışması
            if (!b.isSafe) {
                for (let j = 0; j < this.hammers.length; j++) {
                    const h = this.hammers[j];
                    const dx = b.x - h.headX;
                    const dy = b.y - h.headY;
                    const dist = Math.hypot(dx, dy);

                    if (dist < h.headR + b.radius) {
                        b.isAlive = false;
                        this.screenShake = 3.5;
                        this._createSparks(b.x, b.y, h.color);
                        if (soundSynth) soundSynth.addGlassShatter(currentTime, (b.x - 540) / 470, 0.5);
                        break;
                    }
                }
            }
        }
    }

    _createSparks(x, y, color) {
        for (let i = 0; i < 14; i++) {
            const a = Math.random() * Math.PI * 2;
            const spd = 80 + Math.random() * 200;
            this.particles.push({
                x, y,
                vx: Math.cos(a) * spd,
                vy: Math.sin(a) * spd,
                color,
                radius: 2 + Math.random() * 2.5,
                life: 0.7
            });
        }
    }

    render(ctx, currentTime) {
        ctx.save();
        if (this.screenShake > 0) ctx.translate((Math.random() - 0.5) * this.screenShake, (Math.random() - 0.5) * this.screenShake);

        ctx.fillStyle = '#020205';
        ctx.fillRect(0, 0, 1080, 1920);

        const alive = this.balls.filter(b => b.isAlive).length;
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 28px "Orbitron", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🔨 PENDULUM HAMMERS • DODGE THE CRUSH!', 540, SAFE_ZONE.startY + 20);

        ctx.font = '900 32px "Orbitron", sans-serif';
        ctx.fillStyle = alive <= 4 ? '#ff0055' : '#00ff88';
        ctx.fillText(`ALIVE: ${alive} / ${this.totalBalls} (SAVED: ${this.survivors})`, 540, SAFE_ZONE.startY + 65);

        // Sarkaç Tokmakları
        ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < this.hammers.length; i++) {
            const h = this.hammers[i];

            // Halat / Çubuk
            ctx.strokeStyle = h.color;
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(h.anchorX, h.anchorY);
            ctx.lineTo(h.headX, h.headY);
            ctx.stroke();

            // Askı Noktası
            ctx.fillStyle = '#ffffff';
            ctx.beginPath(); ctx.arc(h.anchorX, h.anchorY, 6, 0, Math.PI * 2); ctx.fill();

            // Tokmak Başı
            ctx.fillStyle = h.color + '44';
            ctx.beginPath(); ctx.arc(h.headX, h.headY, h.headR, 0, Math.PI * 2); ctx.fill();

            ctx.strokeStyle = h.color;
            ctx.lineWidth = 3;
            ctx.stroke();

            ctx.fillStyle = '#ffffff';
            ctx.beginPath(); ctx.arc(h.headX, h.headY, h.headR * 0.4, 0, Math.PI * 2); ctx.fill();
        }

        // Parçacıklar
        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];
            ctx.fillStyle = p.color;
            ctx.globalAlpha = Math.max(0, p.life);
            ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalAlpha = 1.0;

        // Toplar
        for (let i = 0; i < this.balls.length; i++) {
            const b = this.balls[i];
            if (!b.isAlive) continue;

            b.trail.push({ x: b.x, y: b.y });
            if (b.trail.length > 8) b.trail.shift();

            for (let k = 0; k < b.trail.length; k++) {
                const tr = b.trail[k];
                ctx.fillStyle = b.color;
                ctx.globalAlpha = (k / b.trail.length) * 0.35;
                ctx.beginPath(); ctx.arc(tr.x, tr.y, b.radius * (0.3 + k * 0.08), 0, Math.PI * 2); ctx.fill();
            }
            ctx.globalAlpha = 1.0;

            ctx.fillStyle = b.color;
            ctx.beginPath(); ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2); ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.beginPath(); ctx.arc(b.x, b.y, b.radius * 0.45, 0, Math.PI * 2); ctx.fill();
        }

        // Alt Güvenli Çıkış
        ctx.globalCompositeOperation = 'source-over';
        const safeY = SAFE_ZONE.endY - 60;
        ctx.fillStyle = 'rgba(0, 255, 136, 0.15)';
        ctx.fillRect(SAFE_ZONE.startX + 20, safeY, SAFE_ZONE.width - 40, 50);
        ctx.strokeStyle = '#00ff88';
        ctx.lineWidth = 2;
        ctx.strokeRect(SAFE_ZONE.startX + 20, safeY, SAFE_ZONE.width - 40, 50);

        ctx.fillStyle = '#00ff88';
        ctx.font = '900 16px "Orbitron", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🛡️ HAVEN GATE 🛡️', 540, safeY + 32);

        // Zafer Ekranı
        if (currentTime >= 26.5) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.78)';
            ctx.fillRect(0, 0, 1080, 1920);

            ctx.fillStyle = '#00f0ff';
            ctx.font = '900 76px "Orbitron", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('SURVIVED!', 540, 840);

            ctx.fillStyle = '#ffffff';
            ctx.font = '900 38px "Orbitron", sans-serif';
            ctx.fillText(`${this.survivors} SURVIVED THE HEAVY HAMMERS! 🏆`, 540, 930);
        }

        ctx.restore();
    }
}
