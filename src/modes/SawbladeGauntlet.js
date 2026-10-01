// src/modes/SawbladeGauntlet.js
import { SAFE_ZONE } from '../config/SafeZone.js';
import { PRNG } from '../generator/PRNG.js';

/**
 * ⚙️ DEV TESTERE TÜNELİ (SAWBLADE GAUNTLET)
 * Dönen dişli neon testerelerin arasından aşağı inmeye çalışan 20 top.
 * Testerelerin dişlerine çarpan toplar parçalanır, alt hedefe ulaşanlar kazanır.
 */
export class SawbladeGauntletMode {
    constructor(seed = 1) {
        this.name = 'Sawblade Gauntlet';
        this.seed = seed;
        this.rng = new PRNG(seed * 812 + 45);
        this.duration = 28.0;

        this.balls = [];
        this.saws = [];
        this.particles = [];
        this.survivors = 0;
        this.totalBalls = 20;
        this.screenShake = 0;

        this.initSaws();
        this.initBalls();
    }

    initSaws() {
        this.saws = [
            { x: 380, y: 550, radius: 65, teeth: 10, angle: 0, speed: 4.5, color: '#ff0055' },
            { x: 700, y: 550, radius: 65, teeth: 10, angle: 0, speed: -4.5, color: '#ff0055' },
            { x: 540, y: 800, radius: 85, teeth: 12, angle: 0, speed: 5.0, color: '#ffd700' },
            { x: 340, y: 1050, radius: 70, teeth: 10, angle: 0, speed: -4.2, color: '#00f0ff' },
            { x: 740, y: 1050, radius: 70, teeth: 10, angle: 0, speed: 4.2, color: '#00f0ff' },
            { x: 540, y: 1300, radius: 90, teeth: 14, angle: 0, speed: -6.0, color: '#ff0055' }
        ];
    }

    initBalls() {
        this.balls = [];
        const colors = ['#00f0ff', '#00ff88', '#ffd700', '#a855f7', '#ffffff', '#ff7700'];

        for (let i = 0; i < this.totalBalls; i++) {
            const x = 540 + (i - this.totalBalls / 2) * 28 + (this.rng.next() - 0.5) * 20;
            const y = SAFE_ZONE.startY + 60 + this.rng.next() * 60;
            this.balls.push({
                id: i + 1,
                x,
                y,
                vx: (this.rng.next() - 0.5) * 160,
                vy: 120 + this.rng.next() * 80,
                radius: 12,
                color: colors[i % colors.length],
                isAlive: true,
                isEscaped: false,
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

        for (let i = 0; i < this.saws.length; i++) {
            this.saws[i].angle += this.saws[i].speed * dt;
        }

        const exitY = SAFE_ZONE.endY - 60;

        for (let i = 0; i < this.balls.length; i++) {
            const b = this.balls[i];
            if (!b.isAlive) continue;

            b.vy += 540 * dt;
            b.x += b.vx * dt;
            b.y += b.vy * dt;

            const minX = SAFE_ZONE.startX + b.radius;
            const maxX = SAFE_ZONE.endX - b.radius;
            const minY = SAFE_ZONE.startY + b.radius;
            if (b.x <= minX) { b.x = minX; b.vx = Math.abs(b.vx) * 0.85; }
            if (b.x >= maxX) { b.x = maxX; b.vx = -Math.abs(b.vx) * 0.85; }
            if (b.y <= minY) { b.y = minY; b.vy = Math.abs(b.vy) * 0.85; }

            // Çıkışa ulaştı mı?
            if (b.y >= exitY && !b.isEscaped) {
                b.isEscaped = true;
                this.survivors++;
                b.vy = -Math.abs(b.vy) * 0.6;
                if (soundSynth) soundSynth.addGateDing(currentTime, 2.5);
            }

            // Çıkış alanında kalan topları zeminde tut
            const floorY = SAFE_ZONE.endY - b.radius;
            if (b.isEscaped && b.y >= floorY) {
                b.y = floorY;
                b.vy = -Math.abs(b.vy) * 0.5;
            }

            // Trail güncelle
            b.trail.push({ x: b.x, y: b.y });
            if (b.trail.length > 8) b.trail.shift();

            // Testere çarpışması
            if (!b.isEscaped) {
                for (let j = 0; j < this.saws.length; j++) {
                    const s = this.saws[j];
                    const dx = b.x - s.x;
                    const dy = b.y - s.y;
                    const dist = Math.hypot(dx, dy);

                    if (dist < s.radius + b.radius) {
                        b.isAlive = false;
                        this.screenShake = 3.0;
                        this._createSparks(b.x, b.y, s.color);
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
        ctx.fillText('⚙️ SAWBLADE GAUNTLET • ESCAPE THE BLADES!', 540, SAFE_ZONE.startY + 20);

        ctx.font = '900 32px "Orbitron", sans-serif';
        ctx.fillStyle = alive <= 4 ? '#ff0055' : '#00ff88';
        ctx.fillText(`ALIVE: ${alive} / ${this.totalBalls} (ESCAPED: ${this.survivors})`, 540, SAFE_ZONE.startY + 65);

        // Testereler
        ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < this.saws.length; i++) {
            const s = this.saws[i];
            ctx.save();
            ctx.translate(s.x, s.y);
            ctx.rotate(s.angle);

            // Testere Gövdesi
            ctx.fillStyle = s.color + '33';
            ctx.beginPath(); ctx.arc(0, 0, s.radius * 0.85, 0, Math.PI * 2); ctx.fill();

            // Dişler
            ctx.fillStyle = s.color;
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.5;
            for (let t = 0; t < s.teeth; t++) {
                const a = (t / s.teeth) * Math.PI * 2;
                const nextA = ((t + 0.5) / s.teeth) * Math.PI * 2;
                ctx.beginPath();
                ctx.moveTo(Math.cos(a) * (s.radius * 0.8), Math.sin(a) * (s.radius * 0.8));
                ctx.lineTo(Math.cos(nextA) * s.radius, Math.sin(nextA) * s.radius);
                ctx.lineTo(Math.cos(a + 0.3) * (s.radius * 0.75), Math.sin(a + 0.3) * (s.radius * 0.75));
                ctx.fill(); ctx.stroke();
            }

            ctx.fillStyle = '#ffffff';
            ctx.beginPath(); ctx.arc(0, 0, 10, 0, Math.PI * 2); ctx.fill();
            ctx.restore();
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

        // Alt Çıkış
        ctx.globalCompositeOperation = 'source-over';
        const exitY = SAFE_ZONE.endY - 60;
        ctx.fillStyle = 'rgba(0, 255, 136, 0.15)';
        ctx.fillRect(SAFE_ZONE.startX + 20, exitY, SAFE_ZONE.width - 40, 50);
        ctx.strokeStyle = '#00ff88';
        ctx.lineWidth = 2;
        ctx.strokeRect(SAFE_ZONE.startX + 20, exitY, SAFE_ZONE.width - 40, 50);

        ctx.fillStyle = '#00ff88';
        ctx.font = '900 16px "Orbitron", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🏁 FINISH GATE 🏁', 540, exitY + 32);

        // Zafer Ekranı
        if (currentTime >= 26.5) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.78)';
            ctx.fillRect(0, 0, 1080, 1920);

            ctx.fillStyle = '#ffd700';
            ctx.font = '900 76px "Orbitron", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('CLEARED!', 540, 840);

            ctx.fillStyle = '#ffffff';
            ctx.font = '900 38px "Orbitron", sans-serif';
            ctx.fillText(`${this.survivors} SURVIVORS CONQUERED THE GAUNTLET!`, 540, 930);
        }

        ctx.restore();
    }
}
