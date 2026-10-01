// src/modes/CyberPinball.js
import { SAFE_ZONE } from '../config/SafeZone.js';
import { PRNG } from '../generator/PRNG.js';

/**
 * 🕹️ SİBER PİNBALL (CYBER PINBALL)
 * Klasik arcade pinball makinesinin neon siberpunk versiyonu!
 * Altta otomatik tetiklenen çift mekanik flipper (kanatçık).
 * Üstte yüksek geri tepmeli neon tamponlar (bumpers) ve kombo çarpanları.
 */
export class CyberPinballMode {
    constructor(seed = 1) {
        this.name = 'Cyber Pinball';
        this.seed = seed;
        this.rng = new PRNG(seed * 521 + 103);
        this.duration = 28.0;

        this.balls = [];
        this.bumpers = [];
        this.flippers = [];
        this.particles = [];
        this.score = 0;
        this.multiplier = 1;
        this.screenShake = 0;

        this.initBumpers();
        this.initFlippers();
        this.spawnBall();
    }

    initBumpers() {
        this.bumpers = [
            { x: 540, y: SAFE_ZONE.startY + 260, radius: 46, color: '#ff0055', scoreVal: 250, hitAnim: 0 },
            { x: SAFE_ZONE.startX + 220, y: SAFE_ZONE.startY + 380, radius: 40, color: '#00f2fe', scoreVal: 150, hitAnim: 0 },
            { x: SAFE_ZONE.endX - 220, y: SAFE_ZONE.startY + 380, radius: 40, color: '#ffd700', scoreVal: 150, hitAnim: 0 },
            { x: 540, y: SAFE_ZONE.startY + 520, radius: 36, color: '#a855f7', scoreVal: 300, hitAnim: 0 }
        ];
    }

    initFlippers() {
        const flipperY = SAFE_ZONE.endY - 140;
        this.flippers = [
            {
                id: 'left',
                x: 540 - 160,
                y: flipperY,
                length: 120,
                baseAngle: 0.45,
                currentAngle: 0.45,
                targetAngle: 0.45,
                restAngle: 0.45,
                flippedAngle: -0.55
            },
            {
                id: 'right',
                x: 540 + 160,
                y: flipperY,
                length: 120,
                baseAngle: Math.PI - 0.45,
                currentAngle: Math.PI - 0.45,
                targetAngle: Math.PI - 0.45,
                restAngle: Math.PI - 0.45,
                flippedAngle: Math.PI + 0.55
            }
        ];
    }

    spawnBall() {
        this.balls.push({
            x: 540 + (this.rng.next() - 0.5) * 80,
            y: SAFE_ZONE.startY + 60,
            vx: (this.rng.next() - 0.5) * 200,
            vy: 120,
            radius: 16,
            color: '#f8fafc',
            trail: []
        });
    }

    update(currentTime, dt, soundSynth) {
        if (soundSynth) soundSynth.currentTime = currentTime;
        if (this.screenShake > 0) this.screenShake = Math.max(0, this.screenShake - dt * 25);

        // Bumper animasyonları
        this.bumpers.forEach(b => {
            if (b.hitAnim > 0) b.hitAnim = Math.max(0, b.hitAnim - dt * 4);
        });

        // Flipper yumuşatma
        this.flippers.forEach(f => {
            f.currentAngle += (f.targetAngle - f.currentAngle) * Math.min(1, dt * 25);
            // Tetiklendikten sonra geri dönme
            if (Math.abs(f.currentAngle - f.targetAngle) < 0.1 && f.targetAngle === f.flippedAngle) {
                f.targetAngle = f.restAngle;
            }
        });

        // Top yoksa fırlat
        if (this.balls.length === 0) {
            this.spawnBall();
        }

        // Top Fizik ve Etkileşimler
        for (let i = this.balls.length - 1; i >= 0; i--) {
            const b = this.balls[i];
            b.vy += 800 * dt; // Güçlü pinball yerçekimi
            b.x += b.vx * dt;
            b.y += b.vy * dt;

            // Yan duvarlar
            if (b.x - b.radius < SAFE_ZONE.startX + 20) {
                b.x = SAFE_ZONE.startX + 20 + b.radius;
                b.vx = Math.abs(b.vx) * 0.85;
            } else if (b.x + b.radius > SAFE_ZONE.endX - 20) {
                b.x = SAFE_ZONE.endX - 20 - b.radius;
                b.vx = -Math.abs(b.vx) * 0.85;
            }

            if (b.y - b.radius < SAFE_ZONE.startY) {
                b.y = SAFE_ZONE.startY + b.radius;
                b.vy = Math.abs(b.vy) * 0.85;
            }

            // Bumper Çarpışması
            this.bumpers.forEach(bumper => {
                const dx = b.x - bumper.x;
                const dy = b.y - bumper.y;
                const dist = Math.hypot(dx, dy);
                const minDist = b.radius + bumper.radius;

                if (dist < minDist) {
                    const nx = dx / (dist || 1);
                    const ny = dy / (dist || 1);
                    b.x = bumper.x + nx * minDist;
                    b.y = bumper.y + ny * minDist;

                    // Güçlü neon geri tepme
                    const bounceSpeed = 650;
                    b.vx = nx * bounceSpeed;
                    b.vy = ny * bounceSpeed;

                    bumper.hitAnim = 1.0;
                    this.score += bumper.scoreVal * this.multiplier;
                    this.screenShake = 6;

                    // Kıvılcımlar
                    for (let p = 0; p < 10; p++) {
                        this.particles.push({
                            x: bumper.x + nx * bumper.radius,
                            y: bumper.y + ny * bumper.radius,
                            vx: (this.rng.next() - 0.5) * 300,
                            vy: (this.rng.next() - 0.5) * 300,
                            size: 4 + this.rng.next() * 5,
                            color: bumper.color,
                            life: 0.5
                        });
                    }

                    soundSynth?.playBleep(880 + this.rng.next() * 300, 0.08, 'sawtooth');
                }
            });

            // Flipper Çarpışma ve Otomatik Tetikleme
            this.flippers.forEach(f => {
                const tipX = f.x + Math.cos(f.currentAngle) * f.length;
                const tipY = f.y + Math.sin(f.currentAngle) * f.length;

                // Top flipper çizgisine yakınsa, pivotun önündeyse ve top aşağı düşüyorsa vur
                const distToFlipper = Math.hypot(b.x - f.x, b.y - f.y);
                const isFront = f.id === 'left' ? b.x >= f.x - 10 : b.x <= f.x + 10;
                if (distToFlipper < f.length + 30 && b.y > f.y - 40 && b.y < f.y + 40 && b.vy > 0 && isFront) {
                    f.targetAngle = f.flippedAngle;

                    // Topu güçlüce yukarı fırlat (sadece düşerken tetikle)
                    b.vy = -750 - this.rng.next() * 200;
                    b.vx += (f.id === 'left' ? 250 : -250);
                    this.screenShake = 8;
                    soundSynth?.playBleep(440, 0.1, 'square');
                }
            });

            // Alt delikten düşme kontrolü (Drain)
            if (b.y > SAFE_ZONE.endY + 30) {
                this.balls.splice(i, 1);
                this.multiplier = 1;
            }

            // Trail
            b.trail.push({ x: b.x, y: b.y, alpha: 0.7 });
            if (b.trail.length > 7) b.trail.shift();
            b.trail.forEach(t => t.alpha -= dt * 2.5);
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

        // 1. Masa Kenarlıkları (Neon Bezel)
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 4;
        ctx.strokeRect(SAFE_ZONE.startX + 16, SAFE_ZONE.startY + 20, SAFE_ZONE.width - 32, SAFE_ZONE.height - 40);

        // 2. Bumper Tamponları
        this.bumpers.forEach(bm => {
            const rad = bm.radius + bm.hitAnim * 6;
            ctx.beginPath();
            ctx.arc(bm.x, bm.y, rad, 0, Math.PI * 2);
            ctx.fillStyle = bm.color;
            ctx.shadowColor = bm.color;
            ctx.shadowBlur = 20;
            ctx.fill();
            ctx.shadowBlur = 0;

            // İç çember
            ctx.beginPath();
            ctx.arc(bm.x, bm.y, rad * 0.5, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();
        });

        // 3. Flipper Kolları
        this.flippers.forEach(f => {
            const tipX = f.x + Math.cos(f.currentAngle) * f.length;
            const tipY = f.y + Math.sin(f.currentAngle) * f.length;

            ctx.beginPath();
            ctx.moveTo(f.x, f.y);
            ctx.lineTo(tipX, tipY);
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 14;
            ctx.lineCap = 'round';
            ctx.shadowColor = '#ffd700';
            ctx.shadowBlur = 10;
            ctx.stroke();
            ctx.shadowBlur = 0;

            // Pivot menteşe
            ctx.beginPath();
            ctx.arc(f.x, f.y, 10, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();
        });

        // 4. Pinball Topları
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
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = '#00f2fe';
            ctx.shadowBlur = 14;
            ctx.fill();
            ctx.shadowBlur = 0;
        });

        // 5. Partiküller
        this.particles.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * (p.life / 0.5), 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.fill();
        });

        // 6. HUD Skor
        ctx.beginPath();
        ctx.fillStyle = 'rgba(10, 15, 30, 0.85)';
        ctx.roundRect(540 - 200, SAFE_ZONE.startY + 35, 400, 56, 12);
        ctx.fill();
        ctx.strokeStyle = '#00f2fe';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        ctx.font = '900 24px monospace';
        ctx.fillStyle = '#00f2fe';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`SCORE: ${this.score}`, 540, SAFE_ZONE.startY + 63);

        ctx.restore();
    }
}
