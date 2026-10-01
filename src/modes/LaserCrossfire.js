// src/modes/LaserCrossfire.js
import { SAFE_ZONE } from '../config/SafeZone.js';
import { PRNG } from '../generator/PRNG.js';

/**
 * ⚡ LAZER ÇAPRAZ ATEŞİ (LASER CROSSFIRE)
 * Ekranı tarayan dönen ve yanıp sönen neon lazer bariyerleri.
 * 24 top lazer ızgarasını aşarak alt güvenli bölgeye ulaşmaya çalışır.
 * Lazere temas eden top yüksek enerjili kıvılcımlarla buharlaşır!
 */
export class LaserCrossfireMode {
    constructor(seed = 1) {
        this.name = 'Laser Crossfire';
        this.seed = seed;
        this.rng = new PRNG(seed * 711 + 33);
        this.duration = 28.0;

        this.balls = [];
        this.lasers = [];
        this.particles = [];
        this.survivorsCount = 0;
        this.totalBalls = 24;
        this.screenShake = 0;

        this.initLasers();
        this.initBalls();
    }

    initLasers() {
        this.lasers = [
            { y: 520, angle: 0, speed: 1.2, length: 750, color: '#ff0055', active: true, pulse: 1.0 },
            { y: 760, angle: Math.PI / 4, speed: -1.6, length: 700, color: '#00f0ff', active: true, pulse: 1.0 },
            { y: 1000, angle: Math.PI / 2, speed: 1.4, length: 780, color: '#ffd700', active: true, pulse: 1.0 },
            { y: 1240, angle: -Math.PI / 3, speed: -1.8, length: 720, color: '#00ff88', active: true, pulse: 1.0 }
        ];
    }

    initBalls() {
        this.balls = [];
        const colors = ['#00f0ff', '#ffd700', '#00ff88', '#a855f7', '#ffffff', '#ff7700'];

        for (let i = 0; i < this.totalBalls; i++) {
            const x = this.rng.range(SAFE_ZONE.startX + 60, SAFE_ZONE.endX - 60);
            const y = this.rng.range(SAFE_ZONE.startY + 60, SAFE_ZONE.startY + 180);
            const speed = this.rng.range(280, 420);
            const angle = this.rng.range(Math.PI * 0.2, Math.PI * 0.8);

            this.balls.push({
                id: i + 1,
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
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

        // Parçacıklar
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.life -= dt * 2.5;
            if (p.life <= 0) this.particles.splice(i, 1);
        }

        // Lazerleri döndür
        for (let i = 0; i < this.lasers.length; i++) {
            const l = this.lasers[i];
            l.angle += l.speed * dt;
            // Periyodik nabız
            l.pulse = 0.8 + Math.sin(currentTime * 10 + i) * 0.2;
        }

        // Topları güncelle
        const finishY = SAFE_ZONE.endY - 60;

        for (let i = 0; i < this.balls.length; i++) {
            const b = this.balls[i];
            if (!b.isAlive) continue;

            b.vy += 320 * dt; // Hafif yerçekimi
            b.x += b.vx * dt;
            b.y += b.vy * dt;

            // Yan duvarlar
            const minX = SAFE_ZONE.startX + b.radius;
            const maxX = SAFE_ZONE.endX - b.radius;
            const minY = SAFE_ZONE.startY + 90 + b.radius;

            if (b.x <= minX) { b.x = minX; b.vx = Math.abs(b.vx); }
            if (b.x >= maxX) { b.x = maxX; b.vx = -Math.abs(b.vx); }
            if (b.y <= minY) { b.y = minY; b.vy = Math.abs(b.vy); }

            // Bitiş çizgisine ulaştı mı?
            if (b.y >= finishY && !b.isSafe) {
                b.isSafe = true;
                this.survivorsCount++;
                b.vy = -Math.abs(b.vy) * 0.8;
                if (soundSynth) soundSynth.addGateDing(currentTime, 2.0);
            }

            // Güvenli bölgede kalan topları zeminde tut
            const floorY = SAFE_ZONE.endY - b.radius;
            if (b.isSafe && b.y >= floorY) {
                b.y = floorY;
                b.vy = -Math.abs(b.vy) * 0.5;
            }

            // Trail güncelle
            b.trail.push({ x: b.x, y: b.y });
            if (b.trail.length > 8) b.trail.shift();

            // Lazer Çarpışma Kontrolü (Nokta - Doğru Parçası Mesafesi)
            if (!b.isSafe) {
                for (let j = 0; j < this.lasers.length; j++) {
                    const l = this.lasers[j];
                    const lx1 = 540 - Math.cos(l.angle) * (l.length / 2);
                    const ly1 = l.y - Math.sin(l.angle) * (l.length / 2);
                    const lx2 = 540 + Math.cos(l.angle) * (l.length / 2);
                    const ly2 = l.y + Math.sin(l.angle) * (l.length / 2);

                    const dist = this._pointToSegmentDist(b.x, b.y, lx1, ly1, lx2, ly2);
                    if (dist < b.radius + 6) {
                        // LAZERE ÇARPTI! BUHARLAŞTIR
                        b.isAlive = false;
                        this.screenShake = 3.5;
                        this._createLaserVaporize(b.x, b.y, l.color);
                        if (soundSynth) soundSynth.addGlassShatter(currentTime, (b.x - 540) / 470, 0.6);
                        break;
                    }
                }
            }
        }
    }

    _pointToSegmentDist(px, py, x1, y1, x2, y2) {
        const l2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
        if (l2 === 0) return Math.hypot(px - x1, py - y1);
        let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
        t = Math.max(0, Math.min(1, t));
        return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
    }

    _createLaserVaporize(x, y, color) {
        for (let i = 0; i < 16; i++) {
            const a = Math.random() * Math.PI * 2;
            const spd = 90 + Math.random() * 220;
            this.particles.push({
                x, y,
                vx: Math.cos(a) * spd,
                vy: Math.sin(a) * spd,
                color,
                radius: 2 + Math.random() * 3,
                life: 0.8
            });
        }
    }

    render(ctx, currentTime) {
        ctx.save();
        if (this.screenShake > 0) {
            ctx.translate((Math.random() - 0.5) * this.screenShake, (Math.random() - 0.5) * this.screenShake);
        }

        ctx.fillStyle = '#030206';
        ctx.fillRect(0, 0, 1080, 1920);

        // Üst HUD
        const alive = this.balls.filter(b => b.isAlive).length;
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 28px "Orbitron", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('⚡ LASER CROSSFIRE • DODGE OR VAPORIZE!', 540, SAFE_ZONE.startY + 20);

        ctx.font = '900 32px "Orbitron", sans-serif';
        ctx.fillStyle = alive <= 5 ? '#ff0055' : '#00f0ff';
        ctx.fillText(`ALIVE: ${alive} / ${this.totalBalls} (SAVED: ${this.survivorsCount})`, 540, SAFE_ZONE.startY + 65);

        // Lazer Işınları
        ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < this.lasers.length; i++) {
            const l = this.lasers[i];
            const lx1 = 540 - Math.cos(l.angle) * (l.length / 2);
            const ly1 = l.y - Math.sin(l.angle) * (l.length / 2);
            const lx2 = 540 + Math.cos(l.angle) * (l.length / 2);
            const ly2 = l.y + Math.sin(l.angle) * (l.length / 2);

            // Dış Işıma
            ctx.strokeStyle = l.color;
            ctx.lineWidth = 14 * l.pulse;
            ctx.globalAlpha = 0.35;
            ctx.beginPath(); ctx.moveTo(lx1, ly1); ctx.lineTo(lx2, ly2); ctx.stroke();

            // İç Çekirdek
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 3.5;
            ctx.globalAlpha = 1.0;
            ctx.beginPath(); ctx.moveTo(lx1, ly1); ctx.lineTo(lx2, ly2); ctx.stroke();
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

        // Alt Güvenli Bölge
        ctx.globalCompositeOperation = 'source-over';
        const finishY = SAFE_ZONE.endY - 60;
        ctx.fillStyle = 'rgba(0, 255, 136, 0.15)';
        ctx.fillRect(SAFE_ZONE.startX + 20, finishY, SAFE_ZONE.width - 40, 50);

        ctx.strokeStyle = '#00ff88';
        ctx.lineWidth = 2.5;
        ctx.strokeRect(SAFE_ZONE.startX + 20, finishY, SAFE_ZONE.width - 40, 50);

        ctx.fillStyle = '#00ff88';
        ctx.font = '900 16px "Orbitron", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🛡️ SAFE ZONE 🛡️', 540, finishY + 32);

        // Zafer Ekranı
        if (currentTime >= 26.5) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.78)';
            ctx.fillRect(0, 0, 1080, 1920);

            ctx.fillStyle = '#00ff88';
            ctx.font = '900 76px "Orbitron", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('SURVIVED!', 540, 840);

            ctx.fillStyle = '#ffffff';
            ctx.font = '900 38px "Orbitron", sans-serif';
            ctx.fillText(`${this.survivorsCount} BALLS SURVIVED THE LASERS!`, 540, 930);
        }

        ctx.restore();
    }
}
