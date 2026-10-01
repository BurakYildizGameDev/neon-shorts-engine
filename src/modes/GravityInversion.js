// src/modes/GravityInversion.js
import { SAFE_ZONE } from '../config/SafeZone.js';
import { PRNG } from '../generator/PRNG.js';

/**
 * 🔄 YERÇEKİMİ KAOSU (GRAVITY INVERSION)
 * Yerçekimi her 2.8 saniyede bir yön değiştirir: AŞAĞI -> SAĞA -> YUKARI -> SOLA!
 * Toplar 4 duvar arasındaki trambolinlerde çılgınca fırlar ve savrulur!
 * Dev yön pusulası, sesli uyarı sireni ve yerçekimi dalgası.
 */
export class GravityInversionMode {
    constructor(seed = 1) {
        this.name = 'Gravity Inversion';
        this.seed = seed;
        this.rng = new PRNG(seed * 457 + 89);
        this.duration = 28.0;

        // Yerçekimi yönleri (gx, gy, arrow, label)
        this.directions = [
            { gx: 0, gy: 650, angle: Math.PI / 2, label: 'DOWN ⬇️' },
            { gx: 650, gy: 0, angle: 0, label: 'RIGHT ➡️' },
            { gx: 0, gy: -650, angle: -Math.PI / 2, label: 'UP ⬆️' },
            { gx: -650, gy: 0, angle: Math.PI, label: 'LEFT ⬅️' }
        ];

        this.currentDirIndex = 0;
        this.flipTimer = 2.8;
        this.balls = [];
        this.particles = [];
        this.screenShake = 0;

        this.initBalls();
    }

    initBalls() {
        const count = 16;
        this.balls = [];
        const colors = ['#ff0055', '#00f2fe', '#ffd700', '#10b981', '#a855f7'];

        for (let i = 0; i < count; i++) {
            this.balls.push({
                id: i,
                x: SAFE_ZONE.startX + 100 + this.rng.next() * (SAFE_ZONE.width - 200),
                y: SAFE_ZONE.startY + 100 + this.rng.next() * (SAFE_ZONE.height - 200),
                vx: (this.rng.next() - 0.5) * 200,
                vy: (this.rng.next() - 0.5) * 200,
                radius: 18,
                color: colors[i % colors.length],
                trail: []
            });
        }
    }

    update(currentTime, dt, soundSynth) {
        if (soundSynth) soundSynth.currentTime = currentTime;
        if (this.screenShake > 0) this.screenShake = Math.max(0, this.screenShake - dt * 25);

        // Zamanlayıcı ve yerçekimi değişimi
        this.flipTimer -= dt;
        if (this.flipTimer <= 0) {
            this.flipTimer = 2.8;
            this.currentDirIndex = (this.currentDirIndex + 1) % this.directions.length;
            this.screenShake = 8;

            // Flip patlama partikülleri
            for (let i = 0; i < 24; i++) {
                this.particles.push({
                    x: 540,
                    y: (SAFE_ZONE.startY + SAFE_ZONE.endY) / 2,
                    vx: (this.rng.next() - 0.5) * 400,
                    vy: (this.rng.next() - 0.5) * 400,
                    size: 4 + this.rng.next() * 6,
                    color: '#ffffff',
                    life: 0.6
                });
            }

            soundSynth?.playBleep(320, 0.15, 'sawtooth');
        }

        const curDir = this.directions[this.currentDirIndex];

        // Top Fizik ve Duvar Sekmesi
        for (let i = 0; i < this.balls.length; i++) {
            const b = this.balls[i];

            b.vx += curDir.gx * dt;
            b.vy += curDir.gy * dt;

            b.x += b.vx * dt;
            b.y += b.vy * dt;

            // Sınır Duvar Trambolinleri (Yüksek Geri Tepme)
            if (b.x - b.radius < SAFE_ZONE.startX + 20) {
                b.x = SAFE_ZONE.startX + 20 + b.radius;
                b.vx = Math.abs(b.vx) * 0.95;
            } else if (b.x + b.radius > SAFE_ZONE.endX - 20) {
                b.x = SAFE_ZONE.endX - 20 - b.radius;
                b.vx = -Math.abs(b.vx) * 0.95;
            }

            if (b.y - b.radius < SAFE_ZONE.startY + 40) {
                b.y = SAFE_ZONE.startY + 40 + b.radius;
                b.vy = Math.abs(b.vy) * 0.95;
            } else if (b.y + b.radius > SAFE_ZONE.endY - 20) {
                b.y = SAFE_ZONE.endY - 20 - b.radius;
                b.vy = -Math.abs(b.vy) * 0.95;
            }

            // Toplar arası basit sekme
            for (let j = i + 1; j < this.balls.length; j++) {
                const b2 = this.balls[j];
                const dx = b2.x - b.x;
                const dy = b2.y - b.y;
                const dist = Math.hypot(dx, dy);
                const minDist = b.radius + b2.radius;

                if (dist < minDist && dist > 0.001) {
                    const nx = dx / dist;
                    const ny = dy / dist;
                    const overlap = minDist - dist;
                    b.x -= nx * overlap * 0.5;
                    b.y -= ny * overlap * 0.5;
                    b2.x += nx * overlap * 0.5;
                    b2.y += ny * overlap * 0.5;

                    const p = nx * (b.vx - b2.vx) + ny * (b.vy - b2.vy);
                    if (p > 0) {
                        b.vx -= p * nx;
                        b.vy -= p * ny;
                        b2.vx += p * nx;
                        b2.vy += p * ny;
                    }
                }
            }

            // Trail
            if (this.rng.next() < 0.4) {
                b.trail.push({ x: b.x, y: b.y, alpha: 0.6 });
            }
            if (b.trail.length > 7) b.trail.shift();
            b.trail.forEach(t => t.alpha -= dt * 2);
        }

        // Partikülleri güncelle
        this.particles.forEach(p => {
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.life -= dt;
        });
        this.particles = this.particles.filter(p => p.life > 0);
    }

    render(ctx, currentTime) {
        ctx.save();

        if (this.screenShake > 0) {
            ctx.translate((Math.random() - 0.5) * this.screenShake, (Math.random() - 0.5) * this.screenShake);
        }

        const curDir = this.directions[this.currentDirIndex];
        const centerY = (SAFE_ZONE.startY + SAFE_ZONE.endY) / 2;

        // 1. Merkez Devasa Pusula Oku (Dinamik Yön Göstergesi)
        ctx.save();
        ctx.translate(540, centerY);
        ctx.rotate(curDir.angle);

        ctx.beginPath();
        ctx.moveTo(90, 0);
        ctx.lineTo(-40, -50);
        ctx.lineTo(-20, 0);
        ctx.lineTo(-40, 50);
        ctx.closePath();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.restore();

        // 2. Trambolin Duvarları
        ctx.strokeStyle = '#00f2fe';
        ctx.lineWidth = 4;
        ctx.strokeRect(SAFE_ZONE.startX + 18, SAFE_ZONE.startY + 38, SAFE_ZONE.width - 36, SAFE_ZONE.height - 56);

        // 3. Toplar ve İtme Kuyrukları
        this.balls.forEach(b => {
            b.trail.forEach(t => {
                if (t.alpha <= 0) return;
                ctx.beginPath();
                ctx.arc(t.x, t.y, b.radius * 0.7, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 255, 255, ${t.alpha * 0.3})`;
                ctx.fill();
            });

            ctx.beginPath();
            ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
            ctx.fillStyle = b.color;
            ctx.shadowColor = b.color;
            ctx.shadowBlur = 12;
            ctx.fill();
            ctx.shadowBlur = 0;
        });

        // 4. Partiküller
        this.particles.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * (p.life / 0.6), 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.fill();
        });

        // 5. HUD Uyarı Göstergesi
        ctx.beginPath();
        ctx.fillStyle = 'rgba(15, 10, 30, 0.85)';
        ctx.roundRect(540 - 240, SAFE_ZONE.startY + 40, 480, 56, 12);
        ctx.fill();
        ctx.strokeStyle = (this.flipTimer < 0.8) ? '#ff0055' : '#00e5ff';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        ctx.font = '900 22px system-ui, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`GRAVITY: ${curDir.label} (FLIP IN ${this.flipTimer.toFixed(1)}s)`, 540, SAFE_ZONE.startY + 68);

        ctx.restore();
    }
}
