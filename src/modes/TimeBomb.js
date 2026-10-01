// src/modes/TimeBomb.js
import { SAFE_ZONE } from '../config/SafeZone.js';
import { PRNG } from '../generator/PRNG.js';

/**
 * 💣 SAATLİ BOMBA (HOT POTATO TIME BOMB)
 * 18 top ekranda serbestçe dolaşır. Bir topun üzerinde patlamaya hazır saatli bomba vardır.
 * Çarpışan toplar bombayı birbirine devreder. Süre dolduğunda bomba patlar ve top yok olur!
 * Son hayatta kalan 1 şampiyon top kazanır.
 */
export class TimeBombMode {
    constructor(seed = 1) {
        this.name = 'Time Bomb';
        this.seed = seed;
        this.rng = new PRNG(seed * 621 + 59);
        this.duration = 28.0;

        this.balls = [];
        this.particles = [];
        this.totalBalls = 18;
        this.bombTimer = 3.8; // Her 3.8 saniyede bir patlar
        this.currentBombTime = 3.8;
        this.bombHolderIndex = 0;
        this.screenShake = 0;

        this.initBalls();
    }

    initBalls() {
        this.balls = [];
        const colors = ['#00f0ff', '#ffd700', '#00ff88', '#a855f7', '#ffffff', '#38bdf8', '#ff7700'];

        for (let i = 0; i < this.totalBalls; i++) {
            const angle = (i / this.totalBalls) * Math.PI * 2;
            const speed = this.rng.range(360, 520);
            this.balls.push({
                id: i + 1,
                x: 540 + Math.cos(angle) * 260,
                y: 850 + Math.sin(angle) * 320,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                radius: 16,
                color: colors[i % colors.length],
                isAlive: true,
                hasBomb: (i === 0),
                trail: []
            });
        }
        this.bombHolderIndex = 0;
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

        const aliveBalls = this.balls.filter(b => b.isAlive);
        if (aliveBalls.length <= 1) return;

        // Bomba zamanlayıcısı
        this.currentBombTime -= dt;

        // Bip sesi (Hızlanan tempo)
        if (soundSynth && this.currentBombTime > 0) {
            const beepRate = Math.max(0.12, this.currentBombTime * 0.18);
            if (Math.floor(currentTime / beepRate) !== Math.floor((currentTime - dt) / beepRate)) {
                soundSynth.addPlink(currentTime, 880, 0, 0.35);
            }
        }

        // BOMBA PATLADI!
        if (this.currentBombTime <= 0) {
            const victim = this.balls[this.bombHolderIndex];
            if (victim && victim.isAlive) {
                victim.isAlive = false;
                victim.hasBomb = false;
                this.screenShake = 6.0;
                this._createBombExplosion(victim.x, victim.y);
                if (soundSynth) soundSynth.addBassDrop(currentTime, 220, 30, 1.0);
            }

            // Yeni bir yaşayan topa bomba ver
            const remaining = this.balls.filter(b => b.isAlive);
            if (remaining.length > 0) {
                const nextVictim = this.rng.choice(remaining);
                this.bombHolderIndex = this.balls.indexOf(nextVictim);
                nextVictim.hasBomb = true;
                this.currentBombTime = Math.max(2.4, this.bombTimer * 0.9);
            }
        }

        // Topları güncelle
        for (let i = 0; i < this.balls.length; i++) {
            const b = this.balls[i];
            if (!b.isAlive) continue;

            b.x += b.vx * dt;
            b.y += b.vy * dt;

            // Yan duvarlar
            const minX = SAFE_ZONE.startX + b.radius;
            const maxX = SAFE_ZONE.endX - b.radius;
            const minY = SAFE_ZONE.startY + 90 + b.radius;
            const maxY = SAFE_ZONE.endY - b.radius;

            if (b.x <= minX) { b.x = minX; b.vx = Math.abs(b.vx); }
            if (b.x >= maxX) { b.x = maxX; b.vx = -Math.abs(b.vx); }
            if (b.y <= minY) { b.y = minY; b.vy = Math.abs(b.vy); }
            if (b.y >= maxY) { b.y = maxY; b.vy = -Math.abs(b.vy); }

            // Toplar arası çarpışma (Bomba Devri)
            for (let j = i + 1; j < this.balls.length; j++) {
                const b2 = this.balls[j];
                if (!b2.isAlive) continue;

                const dx = b2.x - b.x;
                const dy = b2.y - b.y;
                const dist = Math.hypot(dx, dy);
                const minDist = b.radius + b2.radius;

                if (dist < minDist && dist > 0.001) {
                    const nx = dx / dist;
                    const ny = dy / dist;

                    const overlap = (minDist - dist) * 0.5;
                    b.x -= nx * overlap; b.y -= ny * overlap;
                    b2.x += nx * overlap; b2.y += ny * overlap;

                    const kx = b.vx - b2.vx;
                    const ky = b.vy - b2.vy;
                    const p = 2 * (nx * kx + ny * ky) / 2;
                    b.vx -= p * nx; b.vy -= p * ny;
                    b2.vx += p * nx; b2.vy += p * ny;

                    // BOMBA DEVREDİLDİ Mİ?
                    if (b.hasBomb && !b2.hasBomb) {
                        b.hasBomb = false;
                        b2.hasBomb = true;
                        this.bombHolderIndex = j;
                        this._createSparks(b2.x, b2.y, '#ff0055');
                        if (soundSynth) soundSynth.addGateDing(currentTime, 1.5);
                    } else if (!b.hasBomb && b2.hasBomb) {
                        b2.hasBomb = false;
                        b.hasBomb = true;
                        this.bombHolderIndex = i;
                        this._createSparks(b.x, b.y, '#ff0055');
                        if (soundSynth) soundSynth.addGateDing(currentTime, 1.5);
                    }
                }
            }
        }
    }

    _createBombExplosion(x, y) {
        for (let i = 0; i < 28; i++) {
            const a = Math.random() * Math.PI * 2;
            const spd = 90 + Math.random() * 260;
            this.particles.push({
                x, y,
                vx: Math.cos(a) * spd,
                vy: Math.sin(a) * spd,
                color: Math.random() < 0.5 ? '#ff0055' : '#ffd700',
                radius: 3 + Math.random() * 4,
                life: 0.95
            });
        }
    }

    _createSparks(x, y, color) {
        for (let i = 0; i < 6; i++) {
            const a = Math.random() * Math.PI * 2;
            const spd = 60 + Math.random() * 140;
            this.particles.push({
                x, y,
                vx: Math.cos(a) * spd,
                vy: Math.sin(a) * spd,
                color,
                radius: 2,
                life: 0.5
            });
        }
    }

    render(ctx, currentTime) {
        ctx.save();
        if (this.screenShake > 0) ctx.translate((Math.random() - 0.5) * this.screenShake, (Math.random() - 0.5) * this.screenShake);

        ctx.fillStyle = '#030206';
        ctx.fillRect(0, 0, 1080, 1920);

        const alive = this.balls.filter(b => b.isAlive);
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 28px "Orbitron", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('💣 TIME BOMB • PASS IT BEFORE IT DETONATES!', 540, SAFE_ZONE.startY + 20);

        ctx.font = '900 32px "Orbitron", sans-serif';
        ctx.fillStyle = this.currentBombTime < 1.0 ? '#ff0055' : '#ffd700';
        ctx.fillText(`FUSE: ${Math.max(0, this.currentBombTime).toFixed(1)}s (ALIVE: ${alive.length}/${this.totalBalls})`, 540, SAFE_ZONE.startY + 65);

        // Parçacıklar
        ctx.globalCompositeOperation = 'lighter';
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
                ctx.fillStyle = b.hasBomb ? '#ff0055' : b.color;
                ctx.globalAlpha = (k / b.trail.length) * 0.35;
                ctx.beginPath(); ctx.arc(tr.x, tr.y, b.radius * (0.3 + k * 0.08), 0, Math.PI * 2); ctx.fill();
            }
            ctx.globalAlpha = 1.0;

            // Bombalı top kırmızı titreşir
            if (b.hasBomb) {
                const pulse = 1.0 + Math.sin(currentTime * 20) * 0.25;
                ctx.fillStyle = 'rgba(255, 0, 85, 0.4)';
                ctx.beginPath(); ctx.arc(b.x, b.y, b.radius * 2.0 * pulse, 0, Math.PI * 2); ctx.fill();

                ctx.fillStyle = '#ff0055';
                ctx.beginPath(); ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2); ctx.fill();

                ctx.fillStyle = '#ffffff';
                ctx.font = '16px sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('💣', b.x, b.y);
            } else {
                ctx.fillStyle = b.color;
                ctx.beginPath(); ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2); ctx.fill();

                ctx.fillStyle = '#ffffff';
                ctx.beginPath(); ctx.arc(b.x, b.y, b.radius * 0.45, 0, Math.PI * 2); ctx.fill();
            }
        }

        // Zafer Ekranı
        if (alive.length === 1 || currentTime >= 26.5) {
            const winner = alive[0] || this.balls[0];
            ctx.globalCompositeOperation = 'source-over';
            ctx.fillStyle = 'rgba(0, 0, 0, 0.78)';
            ctx.fillRect(0, 0, 1080, 1920);

            ctx.fillStyle = winner.color;
            ctx.font = '900 76px "Orbitron", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('LAST SURVIVOR!', 540, 840);

            ctx.fillStyle = '#ffd700';
            ctx.font = '900 48px "Orbitron", sans-serif';
            ctx.fillText(`BALL #${winner.id} SURVIVED THE BOMB! 🏆`, 540, 930);
        }

        ctx.restore();
    }
}
