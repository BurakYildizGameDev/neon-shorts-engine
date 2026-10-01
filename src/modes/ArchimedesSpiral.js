// src/modes/ArchimedesSpiral.js
import { SAFE_ZONE } from '../config/SafeZone.js';
import { PRNG } from '../generator/PRNG.js';

/**
 * 🌀 ARŞİMET SPİRAL KAYDIRAĞI (ARCHIMEDES SPIRAL)
 * Dış çemberden başlayıp merkeze doğru daralan 5 turlu Arşimet sarmalı ($r = a \cdot \theta$).
 * Toplar içe girdikçe açısal hızları katlanarak artar!
 * Merkezdeki altın çekirdeğe ilk ulaşan kazanır.
 */
export class ArchimedesSpiralMode {
    constructor(seed = 1) {
        this.name = 'Archimedes Spiral';
        this.seed = seed;
        this.rng = new PRNG(seed * 787 + 97);
        this.duration = 28.0;

        this.centerX = 540;
        this.centerY = (SAFE_ZONE.startY + SAFE_ZONE.endY) / 2;
        this.maxTheta = 10 * Math.PI; // 5 tam tur
        this.spiralA = 12.5; // r = a * theta (max radius ~390px)

        this.racers = [];
        this.particles = [];
        this.winner = null;
        this.screenShake = 0;

        this.initRacers();
    }

    initRacers() {
        const colors = [
            { name: '🔴 RED', color: '#ff0055' },
            { name: '🔵 BLUE', color: '#00d2ff' },
            { name: '🟡 GOLD', color: '#ffd700' },
            { name: '🟢 LIME', color: '#10b981' }
        ];

        this.racers = colors.map((c, i) => {
            const theta = this.maxTheta - i * 0.45;
            return {
                id: i,
                name: c.name,
                color: c.color,
                theta: theta,
                speed: 1.8 + this.rng.next() * 0.4,
                radius: 14,
                rank: i + 1,
                finished: false,
                x: this.centerX + Math.cos(theta) * (theta * this.spiralA),
                y: this.centerY + Math.sin(theta) * (theta * this.spiralA),
                trail: []
            };
        });
    }

    update(currentTime, dt, soundSynth) {
        if (soundSynth) soundSynth.currentTime = currentTime;
        if (this.screenShake > 0) this.screenShake = Math.max(0, this.screenShake - dt * 20);

        this.racers.forEach(r => {
            if (!r.finished) {
                // Merkeze yaklaştıkça açısal hız artışı (Conservation of angular momentum)
                const rDist = Math.max(30, r.theta * this.spiralA);
                const speedMultiplier = 280 / rDist;
                r.theta -= r.speed * speedMultiplier * dt;

                // Rastgele ivmelenme
                if (this.rng.next() < 0.05) {
                    r.speed += (this.rng.next() - 0.45) * 0.3;
                    r.speed = Math.max(1.2, Math.min(3.2, r.speed));
                }

                // Kartopik / Spiral pozisyon hesaplama
                r.x = this.centerX + Math.cos(r.theta) * (r.theta * this.spiralA);
                r.y = this.centerY + Math.sin(r.theta) * (r.theta * this.spiralA);

                // Merkeze ulaştı mı?
                if (r.theta <= 1.2) {
                    r.finished = true;
                    if (!this.winner) {
                        this.winner = `${r.name} TAKES THE CORE!`;
                        this.screenShake = 12;

                        // Zafer havai fişekleri
                        for (let p = 0; p < 35; p++) {
                            this.particles.push({
                                x: this.centerX,
                                y: this.centerY,
                                vx: (this.rng.next() - 0.5) * 350,
                                vy: (this.rng.next() - 0.5) * 350,
                                size: 4 + this.rng.next() * 6,
                                color: r.color,
                                life: 1.2
                            });
                        }

                        soundSynth?.playBleep(1100, 0.25, 'sawtooth');
                    }
                }

                // Trail
                r.trail.push({ x: r.x, y: r.y, alpha: 0.8 });
                if (r.trail.length > 10) r.trail.shift();
            }
            r.trail.forEach(t => t.alpha -= dt * 2.5);
            r.trail = r.trail.filter(t => t.alpha > 0);
        });

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

        // 1. Arşimet Spirali Rayı (Glow Spiral Track)
        ctx.beginPath();
        for (let th = 1.0; th <= this.maxTheta; th += 0.05) {
            const r = th * this.spiralA;
            const px = this.centerX + Math.cos(th) * r;
            const py = this.centerY + Math.sin(th) * r;
            if (th === 1.0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.strokeStyle = 'rgba(0, 229, 255, 0.25)';
        ctx.lineWidth = 14;
        ctx.stroke();

        ctx.strokeStyle = '#00e5ff';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#00e5ff';
        ctx.shadowBlur = 10;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // 2. Merkez Altın Çekirdek (Golden Vortex Core)
        ctx.beginPath();
        ctx.arc(this.centerX, this.centerY, 28, 0, Math.PI * 2);
        ctx.fillStyle = '#ffea00';
        ctx.shadowColor = '#ffea00';
        ctx.shadowBlur = 20;
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.font = '900 20px monospace';
        ctx.fillStyle = '#000000';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('CORE', this.centerX, this.centerY);

        // 3. Yarışçılar
        this.racers.forEach(r => {
            // Trail
            r.trail.forEach(t => {
                if (t.alpha <= 0) return;
                ctx.beginPath();
                ctx.arc(t.x, t.y, r.radius * 0.7, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 255, 255, ${t.alpha * 0.35})`;
                ctx.fill();
            });

            // Ball
            ctx.beginPath();
            ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
            ctx.fillStyle = r.color;
            ctx.shadowColor = r.color;
            ctx.shadowBlur = 12;
            ctx.fill();
            ctx.shadowBlur = 0;

            // Highlight
            ctx.beginPath();
            ctx.arc(r.x - 3, r.y - 3, r.radius * 0.35, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();
        });

        // 4. Partiküller
        this.particles.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * (p.life / 1.2), 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.fill();
        });

        // 5. HUD & Sıralama
        ctx.beginPath();
        ctx.fillStyle = 'rgba(10, 15, 30, 0.85)';
        ctx.roundRect(540 - 240, SAFE_ZONE.startY + 30, 480, 56, 12);
        ctx.fill();
        ctx.strokeStyle = '#ffea00';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.font = '900 22px system-ui, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.winner ? `🏆 ${this.winner}` : '🌀 SPIRAL VORTEX RACE', 540, SAFE_ZONE.startY + 58);

        ctx.restore();
    }
}
