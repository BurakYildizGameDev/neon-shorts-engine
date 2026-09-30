// src/modes/MultiplierGates.js
import { SAFE_ZONE } from '../config/SafeZone.js';
import { PRNG } from '../generator/PRNG.js';

/**
 * 🔢 ÇARPANLI GEÇİŞ KAPILARI (MULTIPLIER GATES CASCADE)
 * Yukarıdan dökülen neon toplar x2, x3, +20, -5 gibi çarpan kapılarından geçer.
 * Doğru kapılara giren toplar yüzlerce topa katlanarak aşağıdaki dev Jackpot havuzuna akar!
 * Shorts & TikTok'un en çok izlenen tatmin edici (satisfying) sayı katlama türü.
 */
export class MultiplierGatesMode {
    constructor(seed = 1) {
        this.name = 'Multiplier Gates';
        this.seed = seed;
        this.rng = new PRNG(seed * 789 + 13);

        this.duration = 28.0;
        this.balls = [];
        this.gates = [];
        this.particles = [];
        this.jackpotBuckets = [];
        this.collectedCount = 0;
        this.targetJackpot = 600;
        this.screenShake = 0;
        this.spawnTimer = 0;

        this.initGates();
        this.initBuckets();
        this.initInitialBalls();
    }

    initGates() {
        this.gates = [];
        // 4 Kademe Çarpan Kapısı Sırası
        const rows = [
            { y: 520, count: 2, w: 260 },
            { y: 760, count: 3, w: 180 },
            { y: 1000, count: 2, w: 280 },
            { y: 1220, count: 3, w: 180 }
        ];

        rows.forEach((row, rIdx) => {
            const totalW = SAFE_ZONE.width - 60;
            const stepX = totalW / row.count;
            const startX = SAFE_ZONE.startX + 30;

            for (let c = 0; c < row.count; c++) {
                const x = startX + c * stepX + (stepX - row.w) * 0.5;
                // Rastgele avantajlı ve riskli kapılar
                let type = 'mult';
                let value = 2;
                let text = 'x2';
                let color = '#00ff88';

                const roll = this.rng.next();
                if (rIdx === 0) {
                    if (c === 0) { type = 'mult'; value = 2; text = 'x2'; color = '#00ff88'; }
                    else { type = 'add'; value = 15; text = '+15'; color = '#00f0ff'; }
                } else if (rIdx === 1) {
                    if (c === 1) { type = 'mult'; value = 3; text = 'x3'; color = '#ffd700'; }
                    else if (c === 0) { type = 'add'; value = 25; text = '+25'; color = '#00ff88'; }
                    else { type = 'sub'; value = 10; text = '-10'; color = '#ff0055'; }
                } else if (rIdx === 2) {
                    if (c === 0) { type = 'mult'; value = 2; text = 'x2'; color = '#00f0ff'; }
                    else { type = 'mult'; value = 3; text = 'x3'; color = '#ffd700'; }
                } else {
                    if (c === 1) { type = 'mult'; value = 4; text = 'x4'; color = '#ffd700'; }
                    else if (c === 0) { type = 'add'; value = 30; text = '+30'; color = '#00ff88'; }
                    else { type = 'sub'; value = 15; text = '-15'; color = '#ff0055'; }
                }

                this.gates.push({
                    id: `${rIdx}_${c}`,
                    x,
                    y: row.y,
                    w: row.w,
                    h: 42,
                    type,
                    value,
                    text,
                    color,
                    pulse: 0,
                    cooldown: 0
                });
            }
        });
    }

    initBuckets() {
        this.jackpotBuckets = [
            { x: SAFE_ZONE.startX + 20, w: 240, label: '50X', mult: 50, color: '#00d2ff', count: 0 },
            { x: 540 - 150, w: 300, label: '⚡ MEGA JACKPOT ⚡', mult: 500, color: '#ffd700', count: 0 },
            { x: SAFE_ZONE.endX - 260, w: 240, label: '100X', mult: 100, color: '#ff0055', count: 0 }
        ];
    }

    initInitialBalls() {
        this.balls = [];
        for (let i = 0; i < 6; i++) {
            this.balls.push(this._createBall(540 + (i - 2.5) * 18, 280 + i * 15, (Math.random() - 0.5) * 60, 200 + Math.random() * 80));
        }
    }

    _createBall(x, y, vx, vy, color = null) {
        const colors = ['#00f0ff', '#ffd700', '#00ff88', '#ff0055', '#a855f7'];
        return {
            x,
            y,
            vx,
            vy,
            radius: 8.5,
            color: color || colors[Math.floor(Math.random() * colors.length)],
            passedGates: new Set(),
            isAlive: true
        };
    }

    update(currentTime, dt, soundSynth) {
        // Ekran sarsıntısını söndür
        if (this.screenShake > 0) {
            this.screenShake = Math.max(0, this.screenShake - dt * 5);
        }

        // Parçacıklar
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.life -= dt * 2.2;
            if (p.life <= 0) this.particles.splice(i, 1);
        }

        // Kapı parlamaları
        for (let i = 0; i < this.gates.length; i++) {
            if (this.gates[i].pulse > 0) this.gates[i].pulse -= dt * 3;
        }

        // Üstten periyodik top akışı (İlk 14 saniye boyunca sürekli besle)
        if (currentTime < 15.0) {
            this.spawnTimer += dt;
            if (this.spawnTimer >= 0.22) {
                this.spawnTimer = 0;
                const spread = (Math.random() - 0.5) * 80;
                this.balls.push(this._createBall(540 + spread, 260, (Math.random() - 0.5) * 80, 220));
            }
        }

        // Son 3 saniye gerilim müziği & kalp atışı
        if (soundSynth && currentTime > 24.5 && Math.floor(currentTime * 2) !== Math.floor((currentTime - dt) * 2)) {
            soundSynth.addHeartbeat(currentTime, 0.8);
        }

        // Topları güncelle (Yerçekimi ve Kapı Çarpışmaları)
        const newBalls = [];
        const bucketY = SAFE_ZONE.endY - 70;

        for (let i = 0; i < this.balls.length; i++) {
            const b = this.balls[i];
            if (!b.isAlive) continue;

            b.vy += 680 * dt; // Yerçekimi
            b.x += b.vx * dt;
            b.y += b.vy * dt;

            // Yan duvarlar
            const minX = SAFE_ZONE.startX + b.radius;
            const maxX = SAFE_ZONE.endX - b.radius;
            if (b.x <= minX) { b.x = minX; b.vx = Math.abs(b.vx) * 0.8; }
            if (b.x >= maxX) { b.x = maxX; b.vx = -Math.abs(b.vx) * 0.8; }

            // Çarpan Kapılarından Geçiş Kontrolü
            for (let g = 0; g < this.gates.length; g++) {
                const gate = this.gates[g];
                if (!b.passedGates.has(gate.id)) {
                    if (b.x >= gate.x && b.x <= gate.x + gate.w && Math.abs(b.y - gate.y) < 18) {
                        b.passedGates.add(gate.id);
                        gate.pulse = 1.0;

                        // Kapı Etkisi (Çarpma, Ekleme, Çıkarma)
                        if (gate.type === 'mult') {
                            const extra = Math.min(6, gate.value - 1);
                            for (let k = 0; k < extra; k++) {
                                if (this.balls.length + newBalls.length < 350) {
                                    newBalls.push(this._createBall(
                                        b.x + (Math.random() - 0.5) * 20,
                                        b.y + (Math.random() - 0.5) * 10,
                                        b.vx + (Math.random() - 0.5) * 160,
                                        b.vy * 0.9,
                                        gate.color
                                    ));
                                }
                            }
                            this.screenShake = 3.0;
                            if (soundSynth) soundSynth.addGateDing(currentTime, gate.value);
                        } else if (gate.type === 'add') {
                            const addCount = Math.min(8, Math.floor(gate.value / 3));
                            for (let k = 0; k < addCount; k++) {
                                if (this.balls.length + newBalls.length < 350) {
                                    newBalls.push(this._createBall(
                                        b.x + (Math.random() - 0.5) * 25,
                                        b.y + (Math.random() - 0.5) * 15,
                                        b.vx + (Math.random() - 0.5) * 180,
                                        b.vy * 0.9,
                                        gate.color
                                    ));
                                }
                            }
                            if (soundSynth) soundSynth.addGateDing(currentTime, 1.5);
                        } else if (gate.type === 'sub') {
                            // Tehlikeli kapı: Topu yok et!
                            b.isAlive = false;
                            this._createSparks(b.x, b.y, '#ff0055', 6);
                            break;
                        }

                        this._createSparks(b.x, b.y, gate.color, 5);
                    }
                }
            }

            // Alt Havuzlara Düşme (Jackpot Buckets)
            if (b.y >= bucketY) {
                b.isAlive = false;
                this.collectedCount++;

                // Hangi sepete girdi?
                for (let k = 0; k < this.jackpotBuckets.length; k++) {
                    const bkt = this.jackpotBuckets[k];
                    if (b.x >= bkt.x && b.x <= bkt.x + bkt.w) {
                        bkt.count++;
                        break;
                    }
                }

                if (soundSynth && Math.random() < 0.3) {
                    const pitch = soundSynth.getFrequency(this.collectedCount % 11);
                    soundSynth.addPlink(currentTime, pitch, (b.x - 540) / 470, 0.25);
                }
            }
        }

        // Yeni çoğalan topları ekle
        if (newBalls.length > 0) {
            this.balls.push(...newBalls);
        }

        // Ölü topları temizle
        this.balls = this.balls.filter(b => b.isAlive);
    }

    _createSparks(x, y, color, count = 6) {
        for (let i = 0; i < count; i++) {
            const a = Math.random() * Math.PI * 2;
            const spd = 60 + Math.random() * 140;
            this.particles.push({
                x, y,
                vx: Math.cos(a) * spd,
                vy: Math.sin(a) * spd,
                color,
                radius: 2 + Math.random() * 2.5,
                life: 0.65
            });
        }
    }

    render(ctx, currentTime) {
        ctx.save();

        // Ekran sarsıntısı
        if (this.screenShake > 0) {
            const sx = (Math.random() - 0.5) * this.screenShake;
            const sy = (Math.random() - 0.5) * this.screenShake;
            ctx.translate(sx, sy);
        }

        // 1. Zemin
        ctx.fillStyle = '#030308';
        ctx.fillRect(0, 0, 1080, 1920);

        // 2. Üst Skor ve Sayaç Başlığı
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 28px "Orbitron", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🔢 MULTIPLIER GATES • CAN WE REACH 500?', 540, SAFE_ZONE.startY + 20);

        ctx.font = '900 36px "Orbitron", sans-serif';
        ctx.fillStyle = this.collectedCount >= 500 ? '#ffd700' : '#00ff88';
        ctx.fillText(`COLLECTED: ${this.collectedCount} / ${this.targetJackpot}`, 540, SAFE_ZONE.startY + 65);

        // 3. Çarpan Kapıları (Neon Gates)
        for (let i = 0; i < this.gates.length; i++) {
            const g = this.gates[i];

            ctx.save();
            ctx.fillStyle = g.color + (g.pulse > 0.1 ? 'dd' : '33');
            ctx.fillRect(g.x, g.y - g.h / 2, g.w, g.h);

            ctx.strokeStyle = g.color;
            ctx.lineWidth = 3;
            ctx.strokeRect(g.x, g.y - g.h / 2, g.w, g.h);

            ctx.fillStyle = '#ffffff';
            ctx.font = '900 22px "Orbitron", sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(g.text, g.x + g.w / 2, g.y);
            ctx.restore();
        }

        // 4. Parçacıklar
        ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];
            ctx.fillStyle = p.color;
            ctx.globalAlpha = Math.max(0, p.life);
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1.0;

        // 5. Akan Neon Toplar
        for (let i = 0; i < this.balls.length; i++) {
            const b = this.balls[i];

            ctx.fillStyle = b.color;
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.radius * 0.45, 0, Math.PI * 2);
            ctx.fill();
        }

        // 6. Alt Jackpot Havuzları (Collector Buckets)
        ctx.globalCompositeOperation = 'source-over';
        const bucketY = SAFE_ZONE.endY - 70;

        for (let i = 0; i < this.jackpotBuckets.length; i++) {
            const bkt = this.jackpotBuckets[i];
            ctx.fillStyle = bkt.color + '22';
            ctx.fillRect(bkt.x, bucketY, bkt.w, 65);

            ctx.strokeStyle = bkt.color;
            ctx.lineWidth = 3;
            ctx.strokeRect(bkt.x, bucketY, bkt.w, 65);

            ctx.fillStyle = bkt.color;
            ctx.font = '900 16px "Orbitron", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(bkt.label, bkt.x + bkt.w / 2, bucketY + 25);

            ctx.fillStyle = '#ffffff';
            ctx.font = '900 18px "Orbitron", sans-serif';
            ctx.fillText(`COUNT: ${bkt.count}`, bkt.x + bkt.w / 2, bucketY + 50);
        }

        // 7. Zafer Ekranı (Climax Finish)
        if (currentTime >= 26.5) {
            ctx.globalCompositeOperation = 'source-over';
            ctx.fillStyle = 'rgba(0, 0, 0, 0.78)';
            ctx.fillRect(0, 0, 1080, 1920);

            ctx.fillStyle = '#ffd700';
            ctx.font = '900 80px "Orbitron", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('JACKPOT!', 540, 840);

            ctx.fillStyle = '#ffffff';
            ctx.font = '900 42px "Orbitron", sans-serif';
            ctx.fillText(`${this.collectedCount} BALLS MULTIPLIED!`, 540, 930);

            ctx.fillStyle = '#00ff88';
            ctx.font = '700 28px "Orbitron", sans-serif';
            ctx.fillText('COMMENT "BALL" FOR NEXT MULTIPLIER! 👇', 540, 1000);
        }

        ctx.restore();
    }
}
