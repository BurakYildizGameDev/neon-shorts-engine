// src/modes/PlinkoCascade.js
import { SAFE_ZONE } from '../config/SafeZone.js';
import { PRNG } from '../generator/PRNG.js';

/**
 * PLİNKO & ÇARPAN KAOSU (PLINKO CASCADE ASMR)
 * Yüzlerce neon çivi, x2 / x5 çoğaltıcı kapılar ve alttaki Jackpot ödül kutuları.
 * Yoğun ASMR tıkırtıları ve ekranda 100+ neon topun akışı.
 */
export class PlinkoCascadeMode {
    constructor(seed = 1) {
        this.name = 'Plinko Cascade';
        this.seed = seed;
        this.rng = new PRNG(seed * 888 + 19);

        this.duration = 28.0;
        this.pegs = [];
        this.balls = [];
        this.particles = [];
        this.totalPrize = 0;

        // Ödül Kutuları
        this.slots = [
            { label: '$100', val: 100, color: '#94a3b8', count: 0 },
            { label: '$1K', val: 1000, color: '#38bdf8', count: 0 },
            { label: '$10K', val: 10000, color: '#a855f7', count: 0 },
            { label: '$100K', val: 100000, color: '#ff0055', count: 0 },
            { label: 'JACKPOT', val: 1000000, color: '#ffd700', count: 0 },
            { label: '$100K', val: 100000, color: '#ff0055', count: 0 },
            { label: '$10K', val: 10000, color: '#a855f7', count: 0 },
            { label: '$1K', val: 1000, color: '#38bdf8', count: 0 },
            { label: '$100', val: 100, color: '#94a3b8', count: 0 }
        ];

        this.slotY = SAFE_ZONE.endY - 60;
        this.slotW = (SAFE_ZONE.width - 20) / this.slots.length;

        // Çoğaltıcı Kapılar
        this.gates = [
            { x: 380, y: 750, w: 120, h: 36, mult: 2, label: 'x2', color: '#00ff88' },
            { x: 700, y: 750, w: 120, h: 36, mult: 3, label: 'x3', color: '#00f0ff' }
        ];

        this.initPegs();
        this.spawnTimer = 0;
        this.totalSpawned = 0;
    }

    initPegs() {
        this.pegs = [];
        const rows = 16;
        const startY = SAFE_ZONE.startY + 140;
        const endY = this.slotY - 100;
        const rowStep = (endY - startY) / rows;

        for (let r = 0; r < rows; r++) {
            const count = 5 + (r % 2 === 0 ? 0 : 1);
            const y = startY + r * rowStep;
            const w = SAFE_ZONE.width - 120;
            const stepX = w / (count - 1);

            for (let c = 0; c < count; c++) {
                const x = SAFE_ZONE.startX + 60 + c * stepX + (r % 2 === 1 ? stepX * 0.5 : 0);
                if (x > SAFE_ZONE.startX + 40 && x < SAFE_ZONE.endX - 40) {
                    this.pegs.push({
                        x,
                        y,
                        radius: 7,
                        pulse: 0,
                        color: (r % 3 === 0) ? '#00f0ff' : ((r % 3 === 1) ? '#ff0055' : '#ffd700')
                    });
                }
            }
        }
    }

    spawnBall() {
        if (this.balls.length > 90) return;
        const startX = 540 + (this.rng.range(-1, 1)) * 120;
        this.balls.push({
            id: Math.random(),
            x: startX,
            y: SAFE_ZONE.startY + 60,
            vx: (Math.random() - 0.5) * 120,
            vy: 80,
            radius: 12,
            color: '#00ff88',
            trail: []
        });
        this.totalSpawned++;
    }

    update(currentTime, dt, soundSynth) {
        // Düzenli aralıklarla top fırlat
        if (currentTime < 18.0) {
            this.spawnTimer += dt;
            if (this.spawnTimer > 0.28) {
                this.spawnTimer = 0;
                this.spawnBall();
            }
        }

        // Çivi darbelerini söndür
        for (let i = 0; i < this.pegs.length; i++) {
            if (this.pegs[i].pulse > 0) this.pegs[i].pulse -= dt * 4;
        }

        // Parçacıkları güncelle
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.life -= dt * 2.5;
            if (p.life <= 0) this.particles.splice(i, 1);
        }

        // Topları güncelle
        for (let i = this.balls.length - 1; i >= 0; i--) {
            const b = this.balls[i];
            b.vy += 850 * dt; // Yerçekimi
            b.x += b.vx * dt;
            b.y += b.vy * dt;

            // Yan duvarlar
            if (b.x - b.radius < SAFE_ZONE.startX + 20) {
                b.x = SAFE_ZONE.startX + 20 + b.radius;
                b.vx = -b.vx * 0.7;
            }
            if (b.x + b.radius > SAFE_ZONE.endX - 20) {
                b.x = SAFE_ZONE.endX - 20 - b.radius;
                b.vx = -b.vx * 0.7;
            }

            // Çivilerle çarpışma
            for (let pIdx = 0; pIdx < this.pegs.length; pIdx++) {
                const p = this.pegs[pIdx];
                const dx = b.x - p.x;
                const dy = b.y - p.y;
                const distSq = dx * dx + dy * dy;
                const minDist = b.radius + p.radius;

                if (distSq < minDist * minDist && distSq > 0.001) {
                    const dist = Math.sqrt(distSq);
                    const nx = dx / dist;
                    const ny = dy / dist;

                    b.x = p.x + nx * minDist;
                    b.y = p.y + ny * minDist;

                    const dot = b.vx * nx + b.vy * ny;
                    b.vx = (b.vx - 1.7 * dot * nx) + (Math.random() - 0.5) * 40;
                    b.vy = (b.vy - 1.7 * dot * ny);

                    p.pulse = 1.0;

                    if (soundSynth) {
                        const note = pIdx % 10;
                        soundSynth.addPlink(currentTime, soundSynth.getFrequency(note), (p.x - 540) / 470, 0.25);
                    }
                    break;
                }
            }

            // Çoğaltıcı kapılar
            for (let g = 0; g < this.gates.length; g++) {
                const gate = this.gates[g];
                if (b.x > gate.x - gate.w / 2 && b.x < gate.x + gate.w / 2 && Math.abs(b.y - gate.y) < 15 && !b.multiplied) {
                    b.multiplied = true;
                    if (this.balls.length < 80) {
                        for (let k = 0; k < gate.mult - 1; k++) {
                            this.balls.push({
                                id: Math.random(),
                                x: b.x + (k * 20 - 10),
                                y: b.y + 10,
                                vx: b.vx + (Math.random() - 0.5) * 160,
                                vy: b.vy + 20,
                                radius: 11,
                                color: gate.color,
                                multiplied: true,
                                trail: []
                            });
                        }
                    }
                }
            }

            // Alttaki ödül kutularına düşüş
            if (b.y >= this.slotY - 10) {
                const slotIdx = Math.floor((b.x - (SAFE_ZONE.startX + 10)) / this.slotW);
                if (slotIdx >= 0 && slotIdx < this.slots.length) {
                    const slot = this.slots[slotIdx];
                    slot.count++;
                    this.totalPrize += slot.val;

                    if (soundSynth && slot.val >= 100000) {
                        soundSynth.addBassDrop(currentTime, 180, 50, 0.9);
                    }
                }
                this.balls.splice(i, 1);
            }
        }
    }

    render(ctx, currentTime) {
        ctx.save();

        // 1. Zemin
        ctx.fillStyle = '#030307';
        ctx.fillRect(0, 0, 1080, 1920);

        // 2. Üst Skor Başlığı
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 30px "Orbitron", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🎰 PLINKO CASCADE • WIN JACKPOT! 🏆', 540, SAFE_ZONE.startY + 20);

        ctx.font = '900 36px "Orbitron", sans-serif';
        ctx.fillStyle = '#ffd700';
        ctx.fillText(`TOTAL: $${this.totalPrize.toLocaleString()}`, 540, SAFE_ZONE.startY + 65);

        // 3. Çoğaltıcı Kapılar
        for (let g = 0; g < this.gates.length; g++) {
            const gate = this.gates[g];
            ctx.fillStyle = gate.color + '33';
            ctx.fillRect(gate.x - gate.w / 2, gate.y - gate.h / 2, gate.w, gate.h);

            ctx.strokeStyle = gate.color;
            ctx.lineWidth = 3;
            ctx.strokeRect(gate.x - gate.w / 2, gate.y - gate.h / 2, gate.w, gate.h);

            ctx.fillStyle = '#ffffff';
            ctx.font = '900 22px "Orbitron", sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(gate.label, gate.x, gate.y);
        }

        // 4. Çiviler (Pegs)
        ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < this.pegs.length; i++) {
            const p = this.pegs[i];
            ctx.fillStyle = p.pulse > 0.1 ? '#ffffff' : p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius * (1.0 + p.pulse * 0.4), 0, Math.PI * 2);
            ctx.fill();

            // Parlama
            ctx.strokeStyle = p.color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius * 1.6, 0, Math.PI * 2);
            ctx.stroke();
        }

        // 5. Toplar
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

        // 6. Alttaki Ödül Kutuları
        ctx.globalCompositeOperation = 'source-over';
        for (let s = 0; s < this.slots.length; s++) {
            const slot = this.slots[s];
            const x = SAFE_ZONE.startX + 10 + s * this.slotW;
            const y = this.slotY;

            ctx.fillStyle = slot.color + '22';
            ctx.fillRect(x + 2, y, this.slotW - 4, 110);

            ctx.strokeStyle = slot.color;
            ctx.lineWidth = 2.5;
            ctx.strokeRect(x + 2, y, this.slotW - 4, 110);

            ctx.fillStyle = '#ffffff';
            ctx.font = '900 13px "Orbitron", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(slot.label, x + this.slotW / 2, y + 30);

            ctx.fillStyle = slot.color;
            ctx.font = '700 12px "Orbitron", sans-serif';
            ctx.fillText(`x${slot.count}`, x + this.slotW / 2, y + 65);
        }

        ctx.restore();
    }
}
