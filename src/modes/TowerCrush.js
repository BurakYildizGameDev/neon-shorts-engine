// src/modes/TowerCrush.js
import { SAFE_ZONE } from '../config/SafeZone.js';
import { PRNG } from '../generator/PRNG.js';

/**
 * 🏰 KULE PARÇALAMA (TOWER CRUSH PRO)
 * Ekranın ortasındaki dev neon piramidi parçalayan yüksek enerjili yıkım topları.
 * Alttaki neon fırlatıcı trambolin sayesinde toplar sürekli yukarı fırlatılır,
 * tüm kuleye rahatça ulaşır ve zincirleme bomba patlamalarıyla kuleyi yerle bir eder.
 */
export class TowerCrushMode {
    constructor(seed = 1) {
        this.name = 'Tower Crush';
        this.seed = seed;
        this.rng = new PRNG(seed * 654 + 21);

        this.duration = 28.0;
        this.bricks = [];
        this.balls = [];
        this.particles = [];
        this.totalBricks = 0;
        this.destroyedCount = 0;

        // Taban süper-trambolin konumu
        this.trampolineY = SAFE_ZONE.endY - 40;

        this.initTower();
        this.initWreckers();
    }

    initTower() {
        this.bricks = [];
        const rows = 15;
        const brickW = 50;
        const brickH = 22;
        // Kuleyi daha rahat ulaşılacak şekilde y: 320 .. 1050 arasına yerleştir
        const startY = 340;
        const colors = ['#00f0ff', '#ff0055', '#ffd700', '#00ff88', '#a855f7', '#ff7700'];

        for (let r = 0; r < rows; r++) {
            // Piramit mimarisi: Üstte 4 tuğla, altta 14 tuğla
            const cols = 4 + Math.floor(r * 0.7);
            const rowW = cols * (brickW + 4);
            const startX = 540 - rowW / 2;

            for (let c = 0; c < cols; c++) {
                // Rastgele bomba tuğlalar (Zincirleme reaksiyon)
                const isBomb = (r > 2 && this.rng.next() < 0.15);
                this.bricks.push({
                    x: startX + c * (brickW + 4),
                    y: startY + r * (brickH + 4),
                    w: brickW,
                    h: brickH,
                    color: isBomb ? '#ffffff' : colors[r % colors.length],
                    isBomb,
                    hp: 1,
                    active: true
                });
            }
        }
        this.totalBricks = this.bricks.length;
    }

    initWreckers() {
        // 4 Yüksek Hızlı Yıkıcı Top (Farklı açılardan kuleye hücum)
        this.balls = [
            { id: 1, x: 380, y: 1320, vx: -360, vy: -1050, radius: 18, color: '#ff0055', trail: [] },
            { id: 2, x: 500, y: 1350, vx: 120, vy: -1150, radius: 20, color: '#ffd700', trail: [] },
            { id: 3, x: 620, y: 1340, vx: -180, vy: -1100, radius: 18, color: '#00f0ff', trail: [] },
            { id: 4, x: 740, y: 1320, vx: 380, vy: -1080, radius: 19, color: '#00ff88', trail: [] }
        ];
    }

    update(currentTime, dt, soundSynth) {
        // Parçacıklar
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.life -= dt * 2.2;
            if (p.life <= 0) this.particles.splice(i, 1);
        }

        // Topları güncelle
        for (let bIdx = 0; bIdx < this.balls.length; bIdx++) {
            const b = this.balls[bIdx];
            b.vy += 480 * dt; // Dengelenmiş yerçekimi
            b.x += b.vx * dt;
            b.y += b.vy * dt;

            // Yan Duvarlar & Yan Trambolin Fırlatıcıları
            const minX = SAFE_ZONE.startX + b.radius;
            const maxX = SAFE_ZONE.endX - b.radius;
            const minY = SAFE_ZONE.startY + 90 + b.radius;

            if (b.x <= minX) {
                b.x = minX;
                b.vx = Math.abs(b.vx) * 1.05;
                // Yan duvardan yukarı açılı sekme (kulenin tepesine fırlatma)
                if (b.y > 600) b.vy -= 120;
            }
            if (b.x >= maxX) {
                b.x = maxX;
                b.vx = -Math.abs(b.vx) * 1.05;
                if (b.y > 600) b.vy -= 120;
            }
            if (b.y <= minY) {
                b.y = minY;
                b.vy = Math.abs(b.vy);
            }

            // [ÇÖZÜM]: Taban Süper-Trambolini (Tüm kuleyi aşacak devasa fırlatma)
            if (b.y + b.radius >= this.trampolineY) {
                b.y = this.trampolineY - b.radius;
                // 1100-1250 px/s fırlatma gücü: Kulenin en tepesine (y: 340) ve üstüne rahatça ulaşır
                b.vy = -(1120 + Math.random() * 180);
                b.vx = (b.vx > 0 ? 1 : -1) * (220 + Math.random() * 260);

                this._createBounceSparkles(b.x, this.trampolineY, '#00ff88');
                if (soundSynth) {
                    soundSynth.addPlink(currentTime, soundSynth.getFrequency(8), (b.x - 540) / 470, 0.45);
                }
            }

            // Tuğlalarla çarpışma
            for (let i = 0; i < this.bricks.length; i++) {
                const brick = this.bricks[i];
                if (!brick.active) continue;

                // Kutuya en yakın nokta
                const cx = Math.max(brick.x, Math.min(b.x, brick.x + brick.w));
                const cy = Math.max(brick.y, Math.min(b.y, brick.y + brick.h));

                const dx = b.x - cx;
                const dy = b.y - cy;
                const distSq = dx * dx + dy * dy;

                if (distSq < b.radius * b.radius && distSq > 0.001) {
                    const dist = Math.sqrt(distSq);
                    const nx = dx / dist;
                    const ny = dy / dist;

                    b.x += nx * (b.radius - dist);
                    b.y += ny * (b.radius - dist);

                    const dot = b.vx * nx + b.vy * ny;
                    if (dot < 0) {
                        b.vx -= 1.85 * dot * nx;
                        b.vy -= 1.85 * dot * ny;
                    }

                    brick.active = false;
                    this.destroyedCount++;

                    this._shatterBrick(brick.x + brick.w / 2, brick.y + brick.h / 2, brick.color);

                    // Bomba tuğla ise zincirleme patlat
                    if (brick.isBomb) {
                        this._explodeNeighbors(brick);
                    }

                    if (soundSynth) {
                        soundSynth.addGlassShatter(currentTime, (b.x - 540) / 470, 0.45);
                    }
                    break;
                }
            }
        }
    }

    _explodeNeighbors(bombBrick) {
        for (let i = 0; i < this.bricks.length; i++) {
            const br = this.bricks[i];
            if (!br.active) continue;
            const dx = (br.x + br.w / 2) - (bombBrick.x + bombBrick.w / 2);
            const dy = (br.y + br.h / 2) - (bombBrick.y + bombBrick.h / 2);
            if (dx * dx + dy * dy < 140 * 140) {
                br.active = false;
                this.destroyedCount++;
                this._shatterBrick(br.x + br.w / 2, br.y + br.h / 2, br.color);
            }
        }
    }

    _shatterBrick(x, y, color) {
        for (let i = 0; i < 9; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 90 + Math.random() * 220;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color,
                radius: 2 + Math.random() * 3,
                life: 0.95
            });
        }
    }

    _createBounceSparkles(x, y, color) {
        for (let i = 0; i < 7; i++) {
            const a = -Math.PI / 2 + (Math.random() - 0.5) * 1.5;
            const spd = 120 + Math.random() * 200;
            this.particles.push({
                x, y,
                vx: Math.cos(a) * spd,
                vy: Math.sin(a) * spd,
                color,
                radius: 3,
                life: 0.7
            });
        }
    }

    render(ctx, currentTime) {
        ctx.save();

        // 1. Zemin
        ctx.fillStyle = '#030207';
        ctx.fillRect(0, 0, 1080, 1920);

        // 2. Üst Skor ve Kalan Blok Sayacı
        const remaining = Math.max(0, this.totalBricks - this.destroyedCount);
        const percent = Math.min(100, Math.round((this.destroyedCount / this.totalBricks) * 100));

        ctx.fillStyle = '#ffffff';
        ctx.font = '900 32px "Orbitron", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🏰 TOWER CRUSH • 100% COLLAPSE?', 540, SAFE_ZONE.startY + 20);

        ctx.font = '900 36px "Orbitron", sans-serif';
        ctx.fillStyle = percent > 80 ? '#00ff88' : '#ffd700';
        ctx.fillText(`BLOCKS: ${remaining} (${percent}% CRUSHED)`, 540, SAFE_ZONE.startY + 65);

        // 3. Alt Süper Trambolin Çizimi
        ctx.strokeStyle = '#00ff88';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(SAFE_ZONE.startX + 20, this.trampolineY);
        ctx.lineTo(SAFE_ZONE.endX - 20, this.trampolineY);
        ctx.stroke();

        ctx.fillStyle = '#00ff88';
        ctx.font = '900 14px "Orbitron", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('⚡ MEGA TRAMPOLINE LAUNCHER ⚡', 540, this.trampolineY + 24);

        // 4. Neon Tuğlalar
        ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < this.bricks.length; i++) {
            const b = this.bricks[i];
            if (!b.active) continue;

            ctx.fillStyle = b.color + '44';
            ctx.fillRect(b.x, b.y, b.w, b.h);

            ctx.strokeStyle = b.color;
            ctx.lineWidth = 2;
            ctx.strokeRect(b.x, b.y, b.w, b.h);

            if (b.isBomb) {
                ctx.fillStyle = '#ffffff';
                ctx.font = '900 12px "Orbitron", sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('💣', b.x + b.w / 2, b.y + b.h / 2 + 4);
            }
        }

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

        // 6. Yıkıcı Toplar
        for (let i = 0; i < this.balls.length; i++) {
            const b = this.balls[i];

            b.trail.push({ x: b.x, y: b.y });
            if (b.trail.length > 12) b.trail.shift();

            for (let k = 0; k < b.trail.length; k++) {
                const tr = b.trail[k];
                ctx.fillStyle = b.color;
                ctx.globalAlpha = (k / b.trail.length) * 0.45;
                ctx.beginPath();
                ctx.arc(tr.x, tr.y, b.radius * (0.3 + k * 0.07), 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1.0;

            ctx.fillStyle = b.color;
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.radius * 0.45, 0, Math.PI * 2);
            ctx.fill();
        }

        // 7. Zafer Ekranı
        if (percent >= 90 || currentTime >= 26.5) {
            ctx.globalCompositeOperation = 'source-over';
            ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
            ctx.fillRect(0, 0, 1080, 1920);

            ctx.fillStyle = '#ff0055';
            ctx.font = '900 80px "Orbitron", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('CRUSHED!', 540, 840);

            ctx.fillStyle = '#ffffff';
            ctx.font = '900 38px "Orbitron", sans-serif';
            ctx.fillText(`TOTAL DESTRUCTION: ${percent}%`, 540, 930);

            ctx.fillStyle = '#ffd700';
            ctx.font = '700 28px "Orbitron", sans-serif';
            ctx.fillText('CAN YOU BEAT THIS? COMMENT! 👇', 540, 1000);
        }

        ctx.restore();
    }
}
