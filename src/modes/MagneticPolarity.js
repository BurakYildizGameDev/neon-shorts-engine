// src/modes/MagneticPolarity.js
import { SAFE_ZONE } from '../config/SafeZone.js';
import { PRNG } from '../generator/PRNG.js';

/**
 * 🧲 MANYETİK KUTUPLAR (MAGNETIC POLARITY)
 * Pozitif (+) ve Negatif (-) yüklü manyetik küreler.
 * Aynı kutuplar birbirini iter, zıt kutuplar çeker ve aralarında neon elektrik arkları oluşur!
 * Merkezde dönen dev iki kutuplu elektromanyetik çekirdek.
 */
export class MagneticPolarityMode {
    constructor(seed = 1) {
        this.name = 'Magnetic Polarity';
        this.seed = seed;
        this.rng = new PRNG(seed * 631 + 19);
        this.duration = 28.0;

        this.balls = [];
        this.magneticCores = [];
        this.arcs = [];
        this.particles = [];
        this.screenShake = 0;
        this.totalClashes = 0;

        this.initCores();
        this.initBalls();
    }

    initCores() {
        // İki dönen manyetik kutup çekirdeği
        this.magneticCores = [
            { polarity: 1, angle: 0, radius: 36, orbitR: 160, color: '#ff0055', label: '+' },
            { polarity: -1, angle: Math.PI, radius: 36, orbitR: 160, color: '#00d2ff', label: '-' }
        ];
    }

    initBalls() {
        const count = 18;
        this.balls = [];

        for (let i = 0; i < count; i++) {
            const polarity = (i % 2 === 0) ? 1 : -1;
            this.balls.push({
                id: i,
                polarity: polarity, // 1: Pozitif (Kırmızı/Pembe), -1: Negatif (Mavi/Camgöbeği)
                x: SAFE_ZONE.startX + 80 + this.rng.next() * (SAFE_ZONE.width - 160),
                y: SAFE_ZONE.startY + 80 + this.rng.next() * (SAFE_ZONE.height - 160),
                vx: (this.rng.next() - 0.5) * 200,
                vy: (this.rng.next() - 0.5) * 200,
                radius: 15,
                color: polarity === 1 ? '#ff007f' : '#00f2fe',
                sparkCooldown: 0
            });
        }
    }

    update(currentTime, dt, soundSynth) {
        if (soundSynth) soundSynth.currentTime = currentTime;
        if (this.screenShake > 0) this.screenShake = Math.max(0, this.screenShake - dt * 20);

        const centerX = 540;
        const centerY = (SAFE_ZONE.startY + SAFE_ZONE.endY) / 2;

        // Çekirdeklerin dönüşü
        this.magneticCores.forEach(core => {
            core.angle += dt * 1.8;
            core.x = centerX + Math.cos(core.angle) * core.orbitR;
            core.y = centerY + Math.sin(core.angle) * core.orbitR;
        });

        this.arcs = [];

        // Toplar arası ve Çekirdek Manyetik Kuvvetleri
        for (let i = 0; i < this.balls.length; i++) {
            const b = this.balls[i];
            if (b.sparkCooldown > 0) b.sparkCooldown -= dt;

            // 1. Çekirdeklerin topa uyguladığı manyetik alan
            this.magneticCores.forEach(core => {
                const dx = core.x - b.x;
                const dy = core.y - b.y;
                const dist = Math.hypot(dx, dy) || 1;
                const force = (b.polarity * core.polarity < 0 ? 1 : -1) * (28000 / Math.max(80, dist * 0.8));

                b.vx += (dx / dist) * force * dt;
                b.vy += (dy / dist) * force * dt;
            });

            // 2. Diğer toplarla Coulomb manyetik etkileşimi
            for (let j = i + 1; j < this.balls.length; j++) {
                const b2 = this.balls[j];
                const dx = b2.x - b.x;
                const dy = b2.y - b.y;
                const dist = Math.hypot(dx, dy) || 1;

                if (dist < 260) {
                    const attract = (b.polarity * b2.polarity < 0);
                    const forceMag = (attract ? 12000 : -9000) / Math.max(60, dist);
                    const nx = dx / dist;
                    const ny = dy / dist;

                    b.vx += nx * forceMag * dt;
                    b.vy += ny * forceMag * dt;
                    b2.vx -= nx * forceMag * dt;
                    b2.vy -= ny * forceMag * dt;

                    // Zıt kutuplar yakınsa elektrik arkı çiz
                    if (attract && dist < 160) {
                        this.arcs.push({ x1: b.x, y1: b.y, x2: b2.x, y2: b2.y, alpha: 1 - dist / 160 });
                    }

                    // Çarpışma
                    const minDist = b.radius + b2.radius;
                    if (dist < minDist) {
                        const overlap = minDist - dist;
                        b.x -= nx * overlap * 0.5;
                        b.y -= ny * overlap * 0.5;
                        b2.x += nx * overlap * 0.5;
                        b2.y += ny * overlap * 0.5;

                        // Sekme
                        const p = 2 * (nx * (b.vx - b2.vx) + ny * (b.vy - b2.vy)) / 2;
                        b.vx -= p * nx;
                        b.vy -= p * ny;
                        b2.vx += p * nx;
                        b2.vy += p * ny;

                        if (attract && b.sparkCooldown <= 0) {
                            b.sparkCooldown = 0.2;
                            this.totalClashes++;
                            this.screenShake = 5;

                            // Elektrik kıvılcımları
                            for (let k = 0; k < 6; k++) {
                                this.particles.push({
                                    x: (b.x + b2.x) / 2,
                                    y: (b.y + b2.y) / 2,
                                    vx: (this.rng.next() - 0.5) * 220,
                                    vy: (this.rng.next() - 0.5) * 220,
                                    size: 3 + this.rng.next() * 5,
                                    color: '#ffffff',
                                    life: 0.4
                                });
                            }
                            soundSynth?.playBleep(520 + Math.random() * 200, 0.05, 'triangle');
                        }
                    }
                }
            }

            // Hız sönümleme ve hareket
            b.vx *= 0.985;
            b.vy *= 0.985;
            b.x += b.vx * dt;
            b.y += b.vy * dt;

            // Sınır duvarları sekmesi
            if (b.x - b.radius < SAFE_ZONE.startX + 20) {
                b.x = SAFE_ZONE.startX + 20 + b.radius;
                b.vx = Math.abs(b.vx) * 0.85;
            } else if (b.x + b.radius > SAFE_ZONE.endX - 20) {
                b.x = SAFE_ZONE.endX - 20 - b.radius;
                b.vx = -Math.abs(b.vx) * 0.85;
            }

            if (b.y - b.radius < SAFE_ZONE.startY + 20) {
                b.y = SAFE_ZONE.startY + 20 + b.radius;
                b.vy = Math.abs(b.vy) * 0.85;
            } else if (b.y + b.radius > SAFE_ZONE.endY - 20) {
                b.y = SAFE_ZONE.endY - 20 - b.radius;
                b.vy = -Math.abs(b.vy) * 0.85;
            }
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

        const centerX = 540;
        const centerY = (SAFE_ZONE.startY + SAFE_ZONE.endY) / 2;

        // 1. Manyetik Alan Yörünge Halkası
        ctx.beginPath();
        ctx.arc(centerX, centerY, 160, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.setLineDash([8, 8]);
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.setLineDash([]);

        // 2. Elektrik Arkları (Zıt Kutuplar Arası Şimşekler)
        this.arcs.forEach(arc => {
            ctx.beginPath();
            ctx.moveTo(arc.x1, arc.y1);
            // Zikzak kırılma noktası
            const midX = (arc.x1 + arc.x2) / 2 + (Math.random() - 0.5) * 20;
            const midY = (arc.y1 + arc.y2) / 2 + (Math.random() - 0.5) * 20;
            ctx.lineTo(midX, midY);
            ctx.lineTo(arc.x2, arc.y2);
            ctx.strokeStyle = `rgba(255, 255, 255, ${arc.alpha * 0.8})`;
            ctx.lineWidth = 2;
            ctx.shadowColor = '#00f2fe';
            ctx.shadowBlur = 8;
            ctx.stroke();
            ctx.shadowBlur = 0;
        });

        // 3. Manyetik Çekirdekler
        this.magneticCores.forEach(core => {
            ctx.beginPath();
            ctx.arc(core.x, core.y, core.radius, 0, Math.PI * 2);
            ctx.fillStyle = core.color;
            ctx.shadowColor = core.color;
            ctx.shadowBlur = 24;
            ctx.fill();
            ctx.shadowBlur = 0;

            // Beyaz sembol
            ctx.font = '900 36px monospace';
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(core.label, core.x, core.y);
        });

        // 4. Manyetik Küreler
        this.balls.forEach(b => {
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
            ctx.fillStyle = b.color;
            ctx.shadowColor = b.color;
            ctx.shadowBlur = 10;
            ctx.fill();
            ctx.shadowBlur = 0;

            // Kutupluluk sembolü (+ veya -)
            ctx.font = '900 16px monospace';
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(b.polarity === 1 ? '+' : '-', b.x, b.y);
        });

        // 5. Partiküller
        this.particles.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * (p.life / 0.4), 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.fill();
        });

        // 6. HUD
        ctx.fillStyle = 'rgba(10, 10, 20, 0.75)';
        ctx.roundRect(540 - 220, SAFE_ZONE.startY + 24, 440, 50, 12);
        ctx.fill();
        ctx.strokeStyle = '#00f2fe';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.font = '900 22px system-ui, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`⚡ MAGNETIC DISCHARGES: ${this.totalClashes}`, 540, SAFE_ZONE.startY + 49);

        ctx.restore();
    }
}
