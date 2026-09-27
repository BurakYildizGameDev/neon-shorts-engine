// src/modes/BattleRoyale.js
import { SAFE_ZONE } from '../config/SafeZone.js';
import { PRNG } from '../generator/PRNG.js';

/**
 * 💀 BATTLE ROYALE / SURVIVAL ARENA
 * 25-30 farklı neon top daralan elektrikli çemberde ve dönen testereler arasında
 * hayatta kalmaya çalışır. Son kalan top şampiyon olur (Yüksek etkileşim ve yorum).
 */
export class BattleRoyaleMode {
    constructor(seed = 1) {
        this.name = 'Battle Royale';
        this.seed = seed;
        this.rng = new PRNG(seed * 711 + 33);

        this.centerX = 540;
        this.centerY = 850;
        this.initialRadius = 380;
        this.currentRadius = this.initialRadius;
        this.minRadius = 140;

        // Dönen Çiftli Merkez Testereleri
        this.spinnerAngle = 0;
        this.spinnerRadius = 65;

        // 25 Yarışmacı Top
        this.totalBalls = 25;
        this.balls = [];
        this.particles = [];
        this.duration = 28.0;
        this.winner = null;

        this.initBalls();
    }

    initBalls() {
        this.balls = [];
        const neonColors = ['#ff0055', '#00f0ff', '#00ff88', '#ffd700', '#a855f7', '#ff7700', '#ec4899', '#38bdf8', '#39ff14', '#ffffff'];

        for (let i = 0; i < this.totalBalls; i++) {
            const angle = (i / this.totalBalls) * Math.PI * 2;
            const dist = this.rng.range(60, this.initialRadius - 50);
            const speed = this.rng.range(380, 560);
            const moveAngle = this.rng.range(0, Math.PI * 2);

            this.balls.push({
                id: i + 1,
                name: `#${i + 1}`,
                x: this.centerX + Math.cos(angle) * dist,
                y: this.centerY + Math.sin(angle) * dist,
                vx: Math.cos(moveAngle) * speed,
                vy: Math.sin(moveAngle) * speed,
                radius: 14,
                color: neonColors[i % neonColors.length],
                isAlive: true,
                trail: []
            });
        }
    }

    update(currentTime, dt, soundSynth) {
        // Dönen testere açısı
        this.spinnerAngle += 3.6 * dt;

        // Çemberi 24 saniye boyunca daralt (Safe Zone Daralması)
        if (currentTime < 24.0) {
            const progress = currentTime / 24.0;
            this.currentRadius = this.initialRadius - (this.initialRadius - this.minRadius) * Math.pow(progress, 1.2);
        }

        // Parçacıkları güncelle
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.life -= dt * 2.2;
            if (p.life <= 0) this.particles.splice(i, 1);
        }

        const aliveBalls = this.balls.filter(b => b.isAlive);

        // Son 1 top kaldıysa kazanan ilan et
        if (aliveBalls.length === 1 && !this.winner) {
            this.winner = aliveBalls[0];
            if (soundSynth) soundSynth.addBassDrop(currentTime, 180, 36, 1.0);
        }

        // Topları güncelle
        for (let i = 0; i < this.balls.length; i++) {
            const b = this.balls[i];
            if (!b.isAlive) continue;

            b.x += b.vx * dt;
            b.y += b.vy * dt;

            // Merkezden mesafe
            const dx = b.x - this.centerX;
            const dy = b.y - this.centerY;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // 1. Daralan Dış Çember ile Çarpışma / Elenme
            if (dist + b.radius >= this.currentRadius) {
                // Zaman ilerledikçe çember ölümcül hale gelir
                if (currentTime > 6.0 && aliveBalls.length > 2 && Math.random() < 0.08) {
                    this._eliminateBall(b, currentTime, soundSynth);
                    continue;
                } else {
                    // Sekme
                    const nx = dx / dist;
                    const ny = dy / dist;
                    b.x = this.centerX + nx * (this.currentRadius - b.radius);
                    b.y = this.centerY + ny * (this.currentRadius - b.radius);
                    const dot = b.vx * nx + b.vy * ny;
                    b.vx -= 1.8 * dot * nx;
                    b.vy -= 1.8 * dot * ny;
                }
            }

            // 2. Ortadaki Dönen Testere ile Çarpışma (Ölümcül Tuzak)
            if (dist - b.radius <= this.spinnerRadius) {
                if (aliveBalls.length > 1) {
                    this._eliminateBall(b, currentTime, soundSynth);
                    continue;
                } else {
                    // Son top testereden seker
                    const nx = dx / dist;
                    const ny = dy / dist;
                    b.x = this.centerX + nx * (this.spinnerRadius + b.radius);
                    b.y = this.centerY + ny * (this.spinnerRadius + b.radius);
                    b.vx = nx * 500;
                    b.vy = ny * 500;
                }
            }

            // 3. Toplar arası itme ve çarpışma
            for (let j = i + 1; j < this.balls.length; j++) {
                const b2 = this.balls[j];
                if (!b2.isAlive) continue;

                const cdx = b2.x - b.x;
                const cdy = b2.y - b.y;
                const cdistSq = cdx * cdx + cdy * cdy;
                const minDist = b.radius + b2.radius;

                if (cdistSq < minDist * minDist && cdistSq > 0.001) {
                    const cdist = Math.sqrt(cdistSq);
                    const nx = cdx / cdist;
                    const ny = cdy / cdist;

                    // Ayrıştır
                    const overlap = (minDist - cdist) * 0.5;
                    b.x -= nx * overlap;
                    b.y -= ny * overlap;
                    b2.x += nx * overlap;
                    b2.y += ny * overlap;

                    // Sekme
                    const kx = b.vx - b2.vx;
                    const ky = b.vy - b2.vy;
                    const p = 2 * (nx * kx + ny * ky) / 2;
                    b.vx -= p * nx;
                    b.vy -= p * ny;
                    b2.vx += p * nx;
                    b2.vy += p * ny;

                    if (soundSynth && Math.random() < 0.25) {
                        soundSynth.addPlink(currentTime, soundSynth.getFrequency(b.id + b2.id), (b.x - 540) / 470, 0.2);
                    }
                }
            }
        }
    }

    _eliminateBall(ball, currentTime, soundSynth) {
        ball.isAlive = false;

        // Patlama parçacıkları
        for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 80 + Math.random() * 240;
            this.particles.push({
                x: ball.x,
                y: ball.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: ball.color,
                radius: 2 + Math.random() * 3,
                life: 1.0
            });
        }

        if (soundSynth) {
            soundSynth.addGlassShatter(currentTime, (ball.x - 540) / 470, 0.5);
        }
    }

    render(ctx, currentTime) {
        ctx.save();

        // 1. Zemin
        ctx.fillStyle = '#030206';
        ctx.fillRect(0, 0, 1080, 1920);

        // 2. Üst Skor ve Hayatta Kalan Sayacı
        const aliveCount = this.balls.filter(b => b.isAlive).length;

        ctx.fillStyle = '#ffffff';
        ctx.font = '900 32px "Orbitron", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('💀 BATTLE ROYALE • SURVIVE OR DIE!', 540, SAFE_ZONE.startY + 20);

        ctx.font = '900 34px "Orbitron", sans-serif';
        ctx.fillStyle = aliveCount <= 3 ? '#ff0055' : '#00ff88';
        ctx.fillText(`ALIVE: ${aliveCount} / ${this.totalBalls}`, 540, SAFE_ZONE.startY + 65);

        // 3. Daralan Dış Elektrikli Çember (The Storm Zone)
        ctx.globalCompositeOperation = 'lighter';

        ctx.strokeStyle = 'rgba(255, 0, 85, 0.3)';
        ctx.lineWidth = 18;
        ctx.beginPath();
        ctx.arc(this.centerX, this.centerY, this.currentRadius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = '#ff0055';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(this.centerX, this.centerY, this.currentRadius, 0, Math.PI * 2);
        ctx.stroke();

        // 4. Ortadaki Dönen Ölümcül Testere
        ctx.save();
        ctx.translate(this.centerX, this.centerY);
        ctx.rotate(this.spinnerAngle);

        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 6;
        for (let i = 0; i < 4; i++) {
            ctx.rotate(Math.PI / 2);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(this.spinnerRadius, 0);
            ctx.stroke();

            ctx.fillStyle = '#ff0055';
            ctx.beginPath();
            ctx.arc(this.spinnerRadius, 0, 8, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();

        // 5. Parçacıklar
        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];
            ctx.fillStyle = p.color;
            ctx.globalAlpha = Math.max(0, p.life);
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1.0;

        // 6. Toplar
        for (let i = 0; i < this.balls.length; i++) {
            const b = this.balls[i];
            if (!b.isAlive) continue;

            // Hareket Kuyruğu
            b.trail.push({ x: b.x, y: b.y });
            if (b.trail.length > 8) b.trail.shift();

            for (let k = 0; k < b.trail.length; k++) {
                const tr = b.trail[k];
                ctx.fillStyle = b.color;
                ctx.globalAlpha = (k / b.trail.length) * 0.35;
                ctx.beginPath();
                ctx.arc(tr.x, tr.y, b.radius * 0.7, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1.0;

            // Top
            ctx.fillStyle = b.color;
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.radius * 0.4, 0, Math.PI * 2);
            ctx.fill();

            // Top Numarası
            ctx.fillStyle = '#ffffff';
            ctx.font = '900 10px "Orbitron", sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(b.name, b.x, b.y - b.radius - 8);
        }

        // 7. Şampiyon Zafer Ekranı
        if (this.winner || (currentTime >= 26.0 && aliveCount === 1)) {
            const champ = this.winner || aliveBalls[0];
            ctx.globalCompositeOperation = 'source-over';
            ctx.fillStyle = 'rgba(0, 0, 0, 0.78)';
            ctx.fillRect(0, 0, 1080, 1920);

            ctx.fillStyle = '#ffd700';
            ctx.font = '900 80px "Orbitron", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('WINNER!', 540, 840);

            if (champ) {
                ctx.fillStyle = champ.color;
                ctx.font = '900 56px "Orbitron", sans-serif';
                ctx.fillText(`CHAMPION ${champ.name}`, 540, 930);
            }

            ctx.fillStyle = '#00ff88';
            ctx.font = '700 28px "Orbitron", sans-serif';
            ctx.fillText('WHO DID YOU GUESS? COMMENT! 👇', 540, 1010);
        }

        ctx.restore();
    }
}
