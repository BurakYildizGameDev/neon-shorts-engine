// src/modes/PortalParadox.js
import { SAFE_ZONE } from '../config/SafeZone.js';
import { PRNG } from '../generator/PRNG.js';

/**
 * 🌀 BOYUT KAPILARI (PORTAL PARADOX)
 * Mavi ve Turuncu kuantum portalları!
 * Toplar bir portala yüksek hızla girip diğerinden momentumunu koruyarak fırlar.
 * Sonsuz döngü yerçekimi sapanları ve portal warp efektleri!
 */
export class PortalParadoxMode {
    constructor(seed = 1) {
        this.name = 'Portal Paradox';
        this.seed = seed;
        this.rng = new PRNG(seed * 347 + 73);
        this.duration = 28.0;

        this.portals = [];
        this.balls = [];
        this.particles = [];
        this.totalWarps = 0;
        this.screenShake = 0;

        this.initPortals();
        this.initBalls();
    }

    initPortals() {
        this.portals = [
            // Çift 1: Mavi Giriş (Altta) -> Turuncu Çıkış (Üstte)
            {
                id: 'blue1',
                pairId: 'orange1',
                x: SAFE_ZONE.startX + 220,
                y: SAFE_ZONE.endY - 120,
                angle: -Math.PI / 4, // 45 derece yukarı-sağa doğru
                radius: 42,
                color: '#00d2ff',
                glow: '#0055ff'
            },
            {
                id: 'orange1',
                pairId: 'blue1',
                x: SAFE_ZONE.endX - 220,
                y: SAFE_ZONE.startY + 220,
                angle: Math.PI * 0.75, // Aşağı-sola fırlatış
                radius: 42,
                color: '#ff8800',
                glow: '#ff3300'
            },
            // Çift 2: Mor Giriş -> Yeşil Çıkış
            {
                id: 'purple2',
                pairId: 'green2',
                x: SAFE_ZONE.endX - 160,
                y: SAFE_ZONE.endY - 180,
                angle: -Math.PI * 0.65,
                radius: 38,
                color: '#b000ff',
                glow: '#7a00ff'
            },
            {
                id: 'green2',
                pairId: 'purple2',
                x: SAFE_ZONE.startX + 180,
                y: SAFE_ZONE.startY + 300,
                angle: Math.PI * 0.25,
                radius: 38,
                color: '#00ff66',
                glow: '#00b33c'
            }
        ];
    }

    initBalls() {
        this.balls = [];
        const count = 12;
        for (let i = 0; i < count; i++) {
            this.balls.push({
                id: i,
                x: SAFE_ZONE.startX + 120 + this.rng.next() * (SAFE_ZONE.width - 240),
                y: SAFE_ZONE.startY + 60 + this.rng.next() * 180,
                vx: (this.rng.next() - 0.5) * 250,
                vy: 50 + this.rng.next() * 100,
                radius: 16,
                color: '#f8fafc',
                cooldown: 0,
                warpCount: 0,
                trail: []
            });
        }
    }

    update(currentTime, dt, soundSynth) {
        if (soundSynth) soundSynth.currentTime = currentTime;
        if (this.screenShake > 0) this.screenShake = Math.max(0, this.screenShake - dt * 20);

        for (let i = 0; i < this.balls.length; i++) {
            const b = this.balls[i];
            if (b.cooldown > 0) b.cooldown -= dt;

            // Ağır yerçekimi
            b.vy += 550 * dt;
            b.x += b.vx * dt;
            b.y += b.vy * dt;

            // Yan sınırlar
            if (b.x - b.radius < SAFE_ZONE.startX + 10) {
                b.x = SAFE_ZONE.startX + 10 + b.radius;
                b.vx = Math.abs(b.vx) * 0.8;
            } else if (b.x + b.radius > SAFE_ZONE.endX - 10) {
                b.x = SAFE_ZONE.endX - 10 - b.radius;
                b.vx = -Math.abs(b.vx) * 0.8;
            }

            if (b.y - b.radius < SAFE_ZONE.startY) {
                b.y = SAFE_ZONE.startY + b.radius;
                b.vy = Math.abs(b.vy) * 0.8;
            } else if (b.y + b.radius > SAFE_ZONE.endY) {
                b.y = SAFE_ZONE.endY - b.radius;
                b.vy = -Math.abs(b.vy) * 0.75;
                if (Math.abs(b.vy) < 120) {
                    b.vy = -520;
                }
            }

            // Portal Geçiş Kontrolü
            if (b.cooldown <= 0) {
                for (let pIdx = 0; pIdx < this.portals.length; pIdx++) {
                    const pIn = this.portals[pIdx];
                    const dist = Math.hypot(b.x - pIn.x, b.y - pIn.y);

                    if (dist < pIn.radius) {
                        // Çıkış portalını bul
                        const pOut = this.portals.find(p => p.id === pIn.pairId);
                        if (pOut) {
                            // Hız büyüklüğünü koru ve hafif hızlandır (üst sınırla sınırlı)
                            const speed = Math.min(1200, Math.max(450, Math.hypot(b.vx, b.vy) * 1.12));
                            b.x = pOut.x + Math.cos(pOut.angle) * (pOut.radius + b.radius + 5);
                            b.y = pOut.y + Math.sin(pOut.angle) * (pOut.radius + b.radius + 5);
                            b.vx = Math.cos(pOut.angle) * speed;
                            b.vy = Math.sin(pOut.angle) * speed;
                            b.cooldown = 0.45;
                            b.warpCount++;
                            this.totalWarps++;
                            this.screenShake = 6;

                            // Işınlanma partikülleri
                            for (let k = 0; k < 12; k++) {
                                this.particles.push({
                                    x: pOut.x,
                                    y: pOut.y,
                                    vx: (this.rng.next() - 0.5) * 280,
                                    vy: (this.rng.next() - 0.5) * 280,
                                    size: 4 + this.rng.next() * 5,
                                    color: pOut.color,
                                    life: 0.6
                                });
                            }

                            // Kuantum ses efekti
                            soundSynth?.playBleep(880 + (b.warpCount % 6) * 110, 0.08, 'sine');
                            break;
                        }
                    }
                }
            }

            // Trail
            b.trail.push({ x: b.x, y: b.y, alpha: 0.7 });
            if (b.trail.length > 8) b.trail.shift();
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

        // 1. Portalların Çizimi (Dönen Kuantum Halka)
        this.portals.forEach(p => {
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(currentTime * 2.5);

            // Dış Portal Haresi
            ctx.beginPath();
            ctx.ellipse(0, 0, p.radius, p.radius * 0.65, 0, 0, Math.PI * 2);
            ctx.strokeStyle = p.color;
            ctx.lineWidth = 6;
            ctx.shadowColor = p.glow;
            ctx.shadowBlur = 18;
            ctx.stroke();

            // İç Girdap
            ctx.fillStyle = 'rgba(10, 10, 25, 0.9)';
            ctx.fill();
            ctx.shadowBlur = 0;

            // Fırlatma Yön Oku (İç eksende)
            ctx.beginPath();
            ctx.arc(0, 0, p.radius * 0.35, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.fill();

            ctx.restore();
        });

        // 2. Toplar ve Işık İzi (Trail)
        this.balls.forEach(b => {
            b.trail.forEach(t => {
                if (t.alpha <= 0) return;
                ctx.beginPath();
                ctx.arc(t.x, t.y, b.radius * 0.7, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(0, 210, 255, ${t.alpha * 0.4})`;
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

        // 3. Partiküller
        this.particles.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * (p.life / 0.6), 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.fill();
        });

        // 4. HUD
        ctx.beginPath();
        ctx.fillStyle = 'rgba(5, 5, 20, 0.8)';
        ctx.roundRect(540 - 220, SAFE_ZONE.startY + 30, 440, 52, 12);
        ctx.fill();
        ctx.strokeStyle = '#00d2ff';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.font = '900 22px system-ui, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`🌀 QUANTUM WARPS: ${this.totalWarps}`, 540, SAFE_ZONE.startY + 56);

        ctx.restore();
    }
}
