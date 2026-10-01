// src/modes/IceVsLava.js
import { SAFE_ZONE } from '../config/SafeZone.js';
import { PRNG } from '../generator/PRNG.js';

/**
 * ❄️🔥 BUZ VE LAV ARENASI (ICE VS LAVA)
 * Sol taraf dondurucu buz diyarı (kaygan, sıfır sürtünme, donma kristalleri),
 * Sağ taraf kaynayan lav diyarı (viskoz, alev patlamaları, lav gayzerleri).
 * Buz topları ve Lav topları ortadaki nötr sınırda çarpışır ve alanı fetheder!
 */
export class IceVsLavaMode {
    constructor(seed = 1) {
        this.name = 'Ice vs Lava';
        this.seed = seed;
        this.rng = new PRNG(seed * 719 + 42);
        this.duration = 28.0;

        this.midX = (SAFE_ZONE.startX + SAFE_ZONE.endX) / 2;
        this.boundaryX = this.midX; // Hareketli sınır
        this.balls = [];
        this.particles = [];
        this.geysers = [];
        this.screenShake = 0;

        this.scoreIce = 50;
        this.scoreLava = 50;
        this.winner = null;

        this.initBalls();
        this.initGeysers();
    }

    initBalls() {
        const totalPerSide = 14;
        this.balls = [];

        // Buz Takımı (Mavi / Turkuaz)
        for (let i = 0; i < totalPerSide; i++) {
            this.balls.push({
                id: `ice_${i}`,
                team: 'ice',
                x: SAFE_ZONE.startX + 60 + this.rng.next() * (this.midX - SAFE_ZONE.startX - 120),
                y: SAFE_ZONE.startY + 100 + this.rng.next() * (SAFE_ZONE.height - 200),
                vx: 150 + this.rng.next() * 200,
                vy: (this.rng.next() - 0.5) * 300,
                radius: 16,
                color: '#00e5ff',
                coreColor: '#ffffff',
                temp: -50,
                trail: []
            });
        }

        // Lav Takımı (Kırmızı / Altın Alev)
        for (let i = 0; i < totalPerSide; i++) {
            this.balls.push({
                id: `lava_${i}`,
                team: 'lava',
                x: this.midX + 60 + this.rng.next() * (SAFE_ZONE.endX - this.midX - 120),
                y: SAFE_ZONE.startY + 100 + this.rng.next() * (SAFE_ZONE.height - 200),
                vx: -(150 + this.rng.next() * 200),
                vy: (this.rng.next() - 0.5) * 300,
                radius: 16,
                color: '#ff3d00',
                coreColor: '#ffea00',
                temp: 150,
                trail: []
            });
        }
    }

    initGeysers() {
        this.geysers = [
            { x: SAFE_ZONE.startX + 180, y: SAFE_ZONE.endY - 40, type: 'ice', timer: 1.5, active: false },
            { x: SAFE_ZONE.endX - 180, y: SAFE_ZONE.endY - 40, type: 'lava', timer: 2.2, active: false }
        ];
    }

    update(currentTime, dt, soundSynth) {
        if (soundSynth) soundSynth.currentTime = currentTime;
        if (this.screenShake > 0) this.screenShake = Math.max(0, this.screenShake - dt * 25);

        // Gayzer zamanlayıcıları
        this.geysers.forEach(g => {
            g.timer -= dt;
            if (g.timer <= 0) {
                g.active = true;
                g.timer = 2.5 + this.rng.next() * 1.5;
                // Patlama partikülleri
                for (let i = 0; i < 20; i++) {
                    this.particles.push({
                        x: g.x + (this.rng.next() - 0.5) * 40,
                        y: g.y,
                        vx: (this.rng.next() - 0.5) * 160,
                        vy: -(250 + this.rng.next() * 350),
                        size: 4 + this.rng.next() * 6,
                        color: g.type === 'ice' ? '#a7f3d0' : '#ff9100',
                        life: 1.2
                    });
                }
                soundSynth?.playBleep(g.type === 'ice' ? 620 : 180, 0.08, 'sawtooth');
            }
        });

        // Top Fizik & Biyom Etkileşimi
        for (let i = 0; i < this.balls.length; i++) {
            const b = this.balls[i];

            // Biyom kuralları: Sınırın solunda buz sürtünmesi (kayma), sağında lav viskozitesi (direnç + itme)
            if (b.x < this.boundaryX) {
                // Ice territory
                b.vx += (b.team === 'ice' ? -40 : 40) * dt;
            } else {
                // Lava territory  
                b.vx += (b.team === 'lava' ? 40 : -40) * dt;
            }

            b.x += b.vx * dt;
            b.y += b.vy * dt;

            // Sınır duvarları sekmesi
            if (b.x - b.radius < SAFE_ZONE.startX) {
                b.x = SAFE_ZONE.startX + b.radius;
                b.vx = Math.abs(b.vx) * 0.9;
            } else if (b.x + b.radius > SAFE_ZONE.endX) {
                b.x = SAFE_ZONE.endX - b.radius;
                b.vx = -Math.abs(b.vx) * 0.9;
            }

            if (b.y - b.radius < SAFE_ZONE.startY + 40) {
                b.y = SAFE_ZONE.startY + 40 + b.radius;
                b.vy = Math.abs(b.vy) * 0.85;
            } else if (b.y + b.radius > SAFE_ZONE.endY) {
                b.y = SAFE_ZONE.endY - b.radius;
                b.vy = -Math.abs(b.vy) * 0.85;
            }

            // Gayzer itkisi
            this.geysers.forEach(g => {
                const distG = Math.hypot(b.x - g.x, b.y - g.y);
                if (distG < 90) {
                    b.vy -= 400 * dt;
                }
            });

            // Trail
            if (this.rng.next() < 0.3) {
                b.trail.push({ x: b.x, y: b.y, alpha: 0.6 });
            }
            if (b.trail.length > 8) b.trail.shift();
            b.trail.forEach(t => t.alpha -= dt * 1.5);
        }

        // Toplar arası çarpışma (Buz vs Lav Termal Çatışması)
        for (let i = 0; i < this.balls.length; i++) {
            for (let j = i + 1; j < this.balls.length; j++) {
                const b1 = this.balls[i];
                const b2 = this.balls[j];
                const dx = b2.x - b1.x;
                const dy = b2.y - b1.y;
                const dist = Math.hypot(dx, dy);
                const minDist = b1.radius + b2.radius;

                if (dist < minDist && dist > 0.001) {
                    const nx = dx / dist;
                    const ny = dy / dist;
                    const overlap = minDist - dist;

                    b1.x -= nx * overlap * 0.5;
                    b1.y -= ny * overlap * 0.5;
                    b2.x += nx * overlap * 0.5;
                    b2.y += ny * overlap * 0.5;

                    // Hız değişimi
                    const kx = b1.vx - b2.vx;
                    const ky = b1.vy - b2.vy;
                    const relDot = nx * kx + ny * ky;
                    if (relDot <= 0) continue; // Already separating, skip
                    const p = relDot;
                    b1.vx -= p * nx;
                    b1.vy -= p * ny;
                    b2.vx += p * nx;
                    b2.vy += p * ny;

                    // Takımlar farklıysa termal buharlaşma patlaması
                    if (b1.team !== b2.team) {
                        this.screenShake = 6;
                        // Sınır itmesi
                        const clashWinner = this.rng.next() < 0.5 ? 'ice' : 'lava';
                        if (clashWinner === 'ice') {
                            this.boundaryX += 3;
                        } else {
                            this.boundaryX -= 3;
                        }

                        // Buhar partikülleri
                        for (let pIdx = 0; pIdx < 8; pIdx++) {
                            this.particles.push({
                                x: (b1.x + b2.x) / 2,
                                y: (b1.y + b2.y) / 2,
                                vx: (this.rng.next() - 0.5) * 200,
                                vy: (this.rng.next() - 0.5) * 200,
                                size: 5 + this.rng.next() * 8,
                                color: '#e0e7ff',
                                life: 0.6
                            });
                        }
                        soundSynth?.playBleep(320 + this.rng.next() * 200, 0.05, 'triangle');
                    }
                }
            }
        }

        // Sınır kontrolü
        this.boundaryX = Math.max(SAFE_ZONE.startX + 100, Math.min(SAFE_ZONE.endX - 100, this.boundaryX));
        this.scoreIce = Math.round(((this.boundaryX - SAFE_ZONE.startX) / SAFE_ZONE.width) * 100);
        this.scoreLava = 100 - this.scoreIce;

        if (this.scoreIce >= 85) this.winner = '❄️ FROST DOMINATION!';
        if (this.scoreLava >= 85) this.winner = '🔥 MAGMA DOMINATION!';

        // Partikül güncelleme
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

        // 1. Zemin: Sol Buz, Sağ Lav
        // Sol Buz Bölgesi
        const iceGrad = ctx.createLinearGradient(SAFE_ZONE.startX, 0, this.boundaryX, 0);
        iceGrad.addColorStop(0, 'rgba(0, 180, 255, 0.22)');
        iceGrad.addColorStop(1, 'rgba(0, 240, 255, 0.08)');
        ctx.fillStyle = iceGrad;
        ctx.fillRect(SAFE_ZONE.startX, SAFE_ZONE.startY + 40, this.boundaryX - SAFE_ZONE.startX, SAFE_ZONE.height - 40);

        // Sağ Lav Bölgesi
        const lavaGrad = ctx.createLinearGradient(this.boundaryX, 0, SAFE_ZONE.endX, 0);
        lavaGrad.addColorStop(0, 'rgba(255, 60, 0, 0.12)');
        lavaGrad.addColorStop(1, 'rgba(255, 10, 0, 0.32)');
        ctx.fillStyle = lavaGrad;
        ctx.fillRect(this.boundaryX, SAFE_ZONE.startY + 40, SAFE_ZONE.endX - this.boundaryX, SAFE_ZONE.height - 40);

        // 2. Termal Ayrım Çizgisi (Clash Frontier)
        ctx.beginPath();
        ctx.moveTo(this.boundaryX, SAFE_ZONE.startY + 40);
        for (let y = SAFE_ZONE.startY + 40; y <= SAFE_ZONE.endY; y += 30) {
            const wave = Math.sin(currentTime * 8 + y * 0.05) * 8;
            ctx.lineTo(this.boundaryX + wave, y);
        }
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.shadowColor = '#ffff00';
        ctx.shadowBlur = 15;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // 3. Gayzerler
        this.geysers.forEach(g => {
            ctx.beginPath();
            ctx.ellipse(g.x, g.y, 45, 14, 0, 0, Math.PI * 2);
            ctx.fillStyle = g.type === 'ice' ? 'rgba(0, 229, 255, 0.5)' : 'rgba(255, 80, 0, 0.6)';
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();
        });

        // 4. Toplar ve Kuyrukları
        this.balls.forEach(b => {
            // Trail
            b.trail.forEach(t => {
                if (t.alpha <= 0) return;
                ctx.beginPath();
                ctx.arc(t.x, t.y, b.radius * 0.7, 0, Math.PI * 2);
                ctx.fillStyle = b.team === 'ice'
                    ? `rgba(0, 229, 255, ${t.alpha * 0.4})`
                    : `rgba(255, 61, 0, ${t.alpha * 0.4})`;
                ctx.fill();
            });

            // Ball Body
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
            ctx.fillStyle = b.color;
            ctx.shadowColor = b.color;
            ctx.shadowBlur = 12;
            ctx.fill();
            ctx.shadowBlur = 0;

            // Ball Core
            ctx.beginPath();
            ctx.arc(b.x - 3, b.y - 3, b.radius * 0.45, 0, Math.PI * 2);
            ctx.fillStyle = b.coreColor;
            ctx.fill();
        });

        // 5. Partiküller
        this.particles.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * (p.life / 1.2), 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.fill();
        });

        // 6. HUD & Skor Barı
        const barWidth = 600;
        const barHeight = 24;
        const barX = 540 - barWidth / 2;
        const barY = SAFE_ZONE.startY + 60;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.roundRect(barX - 4, barY - 4, barWidth + 8, barHeight + 8, 8);
        ctx.fill();

        // Ice bar
        const iceW = (this.scoreIce / 100) * barWidth;
        ctx.fillStyle = '#00e5ff';
        ctx.fillRect(barX, barY, iceW, barHeight);

        // Lava bar
        ctx.fillStyle = '#ff3d00';
        ctx.fillRect(barX + iceW, barY, barWidth - iceW, barHeight);

        ctx.font = '900 22px system-ui, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'left';
        ctx.fillText(`❄️ ICE ${this.scoreIce}%`, barX, barY - 12);
        ctx.textAlign = 'right';
        ctx.fillText(`🔥 LAVA ${this.scoreLava}%`, barX + barWidth, barY - 12);

        // Winner overlay
        if (this.winner) {
            ctx.font = '900 48px system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#ffff00';
            ctx.shadowColor = '#000000';
            ctx.shadowBlur = 16;
            ctx.fillText(this.winner, 540, 960);
        }

        ctx.restore();
    }
}
