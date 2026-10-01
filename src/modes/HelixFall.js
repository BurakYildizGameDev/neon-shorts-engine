// src/modes/HelixFall.js
import { SAFE_ZONE } from '../config/SafeZone.js';
import { PRNG } from '../generator/PRNG.js';

/**
 * 🌀 SARMAL KULE İNİŞİ (HELIX FALL)
 * Dönen 3D silindirik kule ve katmanlı sarmal diskler (Helix Jump).
 * Disk boşluklarından aşağı süzülen neon top, kombo yaptıkça Fireball moduna geçer!
 * Tehlikeli kırmızı bölgeler, yaylı sıçramalar ve taban zemin zaferi!
 */
export class HelixFallMode {
    constructor(seed = 1) {
        this.name = 'Helix Fall';
        this.seed = seed;
        this.rng = new PRNG(seed * 661 + 107);
        this.duration = 28.0;

        this.centerX = 540;
        this.towerRadius = 240;
        this.layers = [];
        this.totalLayers = 9;
        this.layerSpacing = 130;

        this.ball = null;
        this.particles = [];
        this.towerAngle = 0;
        this.streak = 0;
        this.isFireball = false;
        this.screenShake = 0;
        this.winner = null;

        this.initTower();
        this.initBall();
    }

    initTower() {
        this.layers = [];
        const startY = SAFE_ZONE.startY + 160;

        for (let i = 0; i < this.totalLayers; i++) {
            // Her katman için boşluk açısı ve genişliği
            const gapAngle = this.rng.next() * Math.PI * 2;
            const gapWidth = 0.85 + this.rng.next() * 0.35; // Radyan cinsinden boşluk genişliği

            this.layers.push({
                level: i + 1,
                y: startY + i * this.layerSpacing,
                gapAngle: gapAngle,
                gapWidth: gapWidth,
                dangerAngle: (gapAngle + Math.PI) % (Math.PI * 2),
                dangerWidth: 0.6,
                color: i % 2 === 0 ? '#00e5ff' : '#a855f7'
            });
        }
    }

    initBall() {
        this.ball = {
            x: 540,
            y: SAFE_ZONE.startY + 60,
            vy: 100,
            radius: 16,
            color: '#ffea00',
            trail: []
        };
    }

    update(currentTime, dt, soundSynth) {
        if (soundSynth) soundSynth.currentTime = currentTime;
        if (this.screenShake > 0) this.screenShake = Math.max(0, this.screenShake - dt * 25);

        // Kule dönüşü (Sürekli ve sinüsoidal hız değişimi)
        this.towerAngle += dt * (1.2 + 0.5 * Math.sin(currentTime * 1.5));

        const b = this.ball;
        b.vy += 700 * dt; // Yerçekimi
        b.y += b.vy * dt;

        // Katmanlarla çarpışma ve delikten geçiş
        this.layers.forEach((layer, idx) => {
            const diskY = layer.y;
            // Top diskin yüzeyine ulaştığında
            if (b.y + b.radius >= diskY - 6 && b.y - b.radius <= diskY + 8 && b.vy > 0) {
                // Topun kule merkezine göre açısı (X pozisyonu merkezde 540, kule açısı dönüyor)
                const currentRelAngle = (this.towerAngle + Math.PI / 2) % (Math.PI * 2);

                // Boşlukta mı?
                const diffGap = Math.abs(this.angleDiff(currentRelAngle, layer.gapAngle));
                if (diffGap < layer.gapWidth / 2) {
                    // Delikten aşağı düştü!
                    this.streak++;
                    if (this.streak >= 2) this.isFireball = true;

                    // Geçiş partikülleri
                    for (let p = 0; p < 8; p++) {
                        this.particles.push({
                            x: b.x,
                            y: diskY,
                            vx: (this.rng.next() - 0.5) * 160,
                            vy: -100 - this.rng.next() * 100,
                            size: 4 + this.rng.next() * 4,
                            color: '#00f2fe',
                            life: 0.4
                        });
                    }

                    soundSynth?.playBleep(600 + this.streak * 120, 0.08, 'triangle');
                } else {
                    // Boşlukta değil, zemine çarptı!
                    if (this.isFireball) {
                        // Fireball katmanı kırar geçer!
                        this.isFireball = false;
                        this.streak = 0;
                        this.screenShake = 10;
                        layer.broken = true;

                        for (let p = 0; p < 20; p++) {
                            this.particles.push({
                                x: b.x + (this.rng.next() - 0.5) * 60,
                                y: diskY,
                                vx: (this.rng.next() - 0.5) * 350,
                                vy: (this.rng.next() - 0.5) * 350,
                                size: 5 + this.rng.next() * 6,
                                color: '#ff3d00',
                                life: 0.7
                            });
                        }
                        soundSynth?.playBleep(280, 0.15, 'sawtooth');
                    } else {
                        // Normal sıçrama
                        b.y = diskY - b.radius - 2;
                        b.vy = -450;
                        this.streak = 0;

                        // Tehlikeli kırmızı bölge mi?
                        const diffDanger = Math.abs(this.angleDiff(currentRelAngle, layer.dangerAngle));
                        if (diffDanger < layer.dangerWidth / 2) {
                            this.screenShake = 6;
                            soundSynth?.playBleep(180, 0.1, 'sawtooth');
                        } else {
                            soundSynth?.playBleep(440, 0.06, 'sine');
                        }
                    }
                }
            }
        });

        // Taban zemin (Kule Sonu)
        const groundY = SAFE_ZONE.endY - 60;
        if (b.y + b.radius >= groundY) {
            b.y = groundY - b.radius;
            b.vy = -350;
            if (!this.winner) {
                this.winner = '🏆 HELIX DESCENT COMPLETE!';
                this.screenShake = 12;

                for (let p = 0; p < 30; p++) {
                    this.particles.push({
                        x: b.x,
                        y: groundY,
                        vx: (this.rng.next() - 0.5) * 400,
                        vy: -(200 + this.rng.next() * 300),
                        size: 5 + this.rng.next() * 6,
                        color: '#ffd700',
                        life: 1.0
                    });
                }
                soundSynth?.playBleep(1200, 0.25, 'sawtooth');
            }
        }

        // Trail
        b.trail.push({ x: b.x, y: b.y, alpha: 0.8 });
        if (b.trail.length > 8) b.trail.shift();
        b.trail.forEach(t => t.alpha -= dt * 2.5);

        // Partikülleri güncelle
        this.particles.forEach(p => {
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.life -= dt;
        });
        this.particles = this.particles.filter(p => p.life > 0);
    }

    angleDiff(a, b) {
        let diff = (a - b) % (Math.PI * 2);
        if (diff < -Math.PI) diff += Math.PI * 2;
        if (diff > Math.PI) diff -= Math.PI * 2;
        return diff;
    }

    render(ctx, currentTime) {
        ctx.save();

        if (this.screenShake > 0) {
            ctx.translate((Math.random() - 0.5) * this.screenShake, (Math.random() - 0.5) * this.screenShake);
        }

        // 1. Merkez Silindir Gövdesi
        const cylinderGrad = ctx.createLinearGradient(this.centerX - 40, 0, this.centerX + 40, 0);
        cylinderGrad.addColorStop(0, '#1e293b');
        cylinderGrad.addColorStop(0.5, '#475569');
        cylinderGrad.addColorStop(1, '#0f172a');
        ctx.fillStyle = cylinderGrad;
        ctx.fillRect(this.centerX - 40, SAFE_ZONE.startY + 40, 80, SAFE_ZONE.height - 80);

        // 2. Kule Katman Diskleri (3D eliptik projeksiyon)
        this.layers.forEach(layer => {
            if (layer.broken) return;

            ctx.save();
            ctx.translate(this.centerX, layer.y);

            // Disk elipsi
            ctx.beginPath();
            ctx.ellipse(0, 0, this.towerRadius, 32, 0, 0, Math.PI * 2);
            ctx.strokeStyle = layer.color;
            ctx.lineWidth = 8;
            ctx.shadowColor = layer.color;
            ctx.shadowBlur = 10;
            ctx.stroke();
            ctx.shadowBlur = 0;

            // Boşluk sektörü (Koyu arka plan ile silme)
            const gapScreenAngle = layer.gapAngle - this.towerAngle;
            ctx.beginPath();
            ctx.ellipse(0, 0, this.towerRadius + 8, 36, 0, gapScreenAngle - layer.gapWidth / 2, gapScreenAngle + layer.gapWidth / 2);
            ctx.strokeStyle = '#050510';
            ctx.lineWidth = 14;
            ctx.stroke();

            // Tehlikeli kırmızı bölge
            const dangerScreenAngle = layer.dangerAngle - this.towerAngle;
            ctx.beginPath();
            ctx.ellipse(0, 0, this.towerRadius, 32, 0, dangerScreenAngle - layer.dangerWidth / 2, dangerScreenAngle + layer.dangerWidth / 2);
            ctx.strokeStyle = '#ff0055';
            ctx.lineWidth = 8;
            ctx.stroke();

            ctx.restore();
        });

        // 3. Zemin Platformu
        const groundY = SAFE_ZONE.endY - 60;
        ctx.beginPath();
        ctx.ellipse(this.centerX, groundY, this.towerRadius + 20, 36, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#10b981';
        ctx.shadowColor = '#10b981';
        ctx.shadowBlur = 16;
        ctx.fill();
        ctx.shadowBlur = 0;

        // 4. Bouncing Ball & Trail
        const b = this.ball;
        b.trail.forEach(t => {
            if (t.alpha <= 0) return;
            ctx.beginPath();
            ctx.arc(t.x, t.y, b.radius * 0.7, 0, Math.PI * 2);
            ctx.fillStyle = this.isFireball
                ? `rgba(255, 60, 0, ${t.alpha * 0.5})`
                : `rgba(255, 234, 0, ${t.alpha * 0.35})`;
            ctx.fill();
        });

        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.isFireball ? '#ff3d00' : b.color;
        ctx.shadowColor = this.isFireball ? '#ff0000' : '#ffea00';
        ctx.shadowBlur = 18;
        ctx.fill();
        ctx.shadowBlur = 0;

        // 5. Partiküller
        this.particles.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * (p.life / 0.7), 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.fill();
        });

        // 6. HUD
        ctx.fillStyle = 'rgba(10, 15, 30, 0.85)';
        ctx.roundRect(540 - 240, SAFE_ZONE.startY + 30, 480, 56, 12);
        ctx.fill();
        ctx.strokeStyle = this.isFireball ? '#ff3d00' : '#00e5ff';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        ctx.font = '900 22px system-ui, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        if (this.winner) {
            ctx.fillText(this.winner, 540, SAFE_ZONE.startY + 58);
        } else if (this.isFireball) {
            ctx.fillStyle = '#ff3d00';
            ctx.fillText(`🔥 FIREBALL COMBO x${this.streak}!`, 540, SAFE_ZONE.startY + 58);
        } else {
            ctx.fillText(`🌀 HELIX DESCENT (STREAK: ${this.streak})`, 540, SAFE_ZONE.startY + 58);
        }

        ctx.restore();
    }
}
