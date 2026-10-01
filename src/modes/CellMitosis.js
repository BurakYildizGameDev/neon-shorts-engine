// src/modes/CellMitosis.js
import { SAFE_ZONE } from '../config/SafeZone.js';
import { PRNG } from '../generator/PRNG.js';

/**
 * 🦠 HÜCRE BÖLÜNMESİ (CELL MITOSIS)
 * Düşen biyo-ışıldayan hücreler mitoz prizmalarına çarptıkça 2'ye bölünür.
 * 1 -> 2 -> 4 -> 8 -> 16... Geometrik çoğalma ile ekranda devasa bir hücre ordusu!
 * Pentatonik ASMR tonları ve hücre çekirdeği animasyonları.
 */
export class CellMitosisMode {
    constructor(seed = 1) {
        this.name = 'Cell Mitosis';
        this.seed = seed;
        this.rng = new PRNG(seed * 883 + 51);
        this.duration = 28.0;

        this.cells = [];
        this.splitters = [];
        this.particles = [];
        this.screenShake = 0;
        this.maxCells = 140;
        this.generationCount = 1;

        this.pentatonicScale = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25];

        this.initSplitters();
        this.spawnInitialCells();
    }

    initSplitters() {
        this.splitters = [];
        // Kademeli mitoz prizmaları
        const rows = 5;
        const startY = SAFE_ZONE.startY + 220;
        const rowSpacing = 200;

        for (let r = 0; r < rows; r++) {
            const count = 3 + (r % 2);
            const y = startY + r * rowSpacing;
            const stepX = (SAFE_ZONE.width - 160) / (count + 1);

            for (let c = 1; c <= count; c++) {
                this.splitters.push({
                    x: SAFE_ZONE.startX + 80 + c * stepX,
                    y: y + (this.rng.next() - 0.5) * 20,
                    radius: 18,
                    glowPhase: this.rng.next() * Math.PI * 2,
                    cooldown: 0
                });
            }
        }
    }

    spawnInitialCells() {
        this.cells = [
            {
                id: 1,
                x: 540 - 80,
                y: SAFE_ZONE.startY + 60,
                vx: 60,
                vy: 80,
                radius: 36,
                generation: 1,
                color: '#10b981', // Emerald Mother Cell
                coreColor: '#ffffff',
                splitCooldown: 0.5
            },
            {
                id: 2,
                x: 540 + 80,
                y: SAFE_ZONE.startY + 60,
                vx: -60,
                vy: 80,
                radius: 36,
                generation: 1,
                color: '#06b6d4', // Cyan Mother Cell
                coreColor: '#ffffff',
                splitCooldown: 0.5
            }
        ];
    }

    update(currentTime, dt, soundSynth) {
        if (soundSynth) soundSynth.currentTime = currentTime;
        if (this.screenShake > 0) this.screenShake = Math.max(0, this.screenShake - dt * 20);

        // Splitter cooldowns and glow
        this.splitters.forEach(sp => {
            sp.glowPhase += dt * 4;
            if (sp.cooldown > 0) sp.cooldown -= dt;
        });

        const newCells = [];

        // Hücre Fizik ve Mitoz Çarpışması
        for (let i = 0; i < this.cells.length; i++) {
            const c = this.cells[i];
            if (c.splitCooldown > 0) c.splitCooldown -= dt;

            c.vy += 380 * dt; // Yerçekimi
            c.x += c.vx * dt;
            c.y += c.vy * dt;

            // Sınırlar
            if (c.x - c.radius < SAFE_ZONE.startX + 20) {
                c.x = SAFE_ZONE.startX + 20 + c.radius;
                c.vx = Math.abs(c.vx) * 0.8;
            } else if (c.x + c.radius > SAFE_ZONE.endX - 20) {
                c.x = SAFE_ZONE.endX - 20 - c.radius;
                c.vx = -Math.abs(c.vx) * 0.8;
            }

            if (c.y - c.radius < SAFE_ZONE.startY) {
                c.y = SAFE_ZONE.startY + c.radius;
                c.vy = Math.abs(c.vy) * 0.8;
            } else if (c.y + c.radius > SAFE_ZONE.endY - 20) {
                c.y = SAFE_ZONE.endY - 20 - c.radius;
                c.vy = -Math.abs(c.vy) * 0.75;
                // Tabandan hafif yukarı zıplat
                if (Math.abs(c.vy) < 60) c.vy = -(150 + this.rng.next() * 150);
            }

            // Prizma Mitoz Çarpışması
            for (let sIdx = 0; sIdx < this.splitters.length; sIdx++) {
                const sp = this.splitters[sIdx];
                const dx = c.x - sp.x;
                const dy = c.y - sp.y;
                const dist = Math.hypot(dx, dy);

                if (dist < c.radius + sp.radius) {
                    // Sekme fiziği
                    const nx = dx / (dist || 1);
                    const ny = dy / (dist || 1);
                    c.vx = nx * 220;
                    c.vy = ny * 220;

                    // Bölünme Kontrolü (Hücre sayısı limiti ve minimum boyut)
                    if (c.splitCooldown <= 0 && this.cells.length + newCells.length < this.maxCells && c.radius >= 11) {
                        c.splitCooldown = 0.6;
                        c.radius = Math.max(9, c.radius * 0.78);
                        c.generation += 1;
                        if (c.generation > this.generationCount) this.generationCount = c.generation;

                        // İkinci hücreyi doğur (Daughter cell)
                        const daughter = {
                            id: Date.now() + Math.random(),
                            x: c.x + nx * (c.radius + 4),
                            y: c.y + ny * (c.radius + 4),
                            vx: -c.vx * 0.9 + (this.rng.next() - 0.5) * 80,
                            vy: c.vy * 0.9 + (this.rng.next() - 0.5) * 80,
                            radius: c.radius,
                            generation: c.generation,
                            color: this.getCellColor(c.generation),
                            coreColor: '#ffffff',
                            splitCooldown: 0.6
                        };
                        newCells.push(daughter);

                        // Partiküller
                        for (let p = 0; p < 6; p++) {
                            this.particles.push({
                                x: sp.x,
                                y: sp.y,
                                vx: (this.rng.next() - 0.5) * 200,
                                vy: (this.rng.next() - 0.5) * 200,
                                size: 3 + this.rng.next() * 4,
                                color: '#a7f3d0',
                                life: 0.5
                            });
                        }

                        // Pentatonik ASMR tonu
                        const note = this.pentatonicScale[(c.generation + sIdx) % this.pentatonicScale.length];
                        soundSynth?.playBleep(note, 0.08, 'sine');
                    }
                }
            }
        }

        // Yeni hücreleri listeye ekle
        if (newCells.length > 0) {
            this.cells.push(...newCells);
        }

        // Partikülleri güncelle
        this.particles.forEach(p => {
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.life -= dt;
        });
        this.particles = this.particles.filter(p => p.life > 0);
    }

    getCellColor(gen) {
        const colors = [
            '#10b981', // 1: Emerald
            '#06b6d4', // 2: Cyan
            '#3b82f6', // 3: Blue
            '#8b5cf6', // 4: Purple
            '#ec4899', // 5: Pink
            '#f59e0b', // 6: Amber
            '#ef4444'  // 7+: Red
        ];
        return colors[(gen - 1) % colors.length];
    }

    render(ctx, currentTime) {
        ctx.save();

        // 1. Arka Plan Şebekesi (Mikroskop Petrisi Efekti)
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.06)';
        ctx.lineWidth = 1;
        for (let x = SAFE_ZONE.startX; x <= SAFE_ZONE.endX; x += 60) {
            ctx.beginPath();
            ctx.moveTo(x, SAFE_ZONE.startY);
            ctx.lineTo(x, SAFE_ZONE.endY);
            ctx.stroke();
        }
        for (let y = SAFE_ZONE.startY; y <= SAFE_ZONE.endY; y += 60) {
            ctx.beginPath();
            ctx.moveTo(SAFE_ZONE.startX, y);
            ctx.lineTo(SAFE_ZONE.endX, y);
            ctx.stroke();
        }

        // 2. Mitoz Prizmaları / İğneleri
        this.splitters.forEach(sp => {
            const glow = 0.5 + 0.5 * Math.sin(sp.glowPhase);
            ctx.beginPath();
            ctx.arc(sp.x, sp.y, sp.radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${0.15 + glow * 0.2})`;
            ctx.fill();

            // Dış neon halka
            ctx.beginPath();
            ctx.arc(sp.x, sp.y, sp.radius + 3, 0, Math.PI * 2);
            ctx.strokeStyle = '#00f2fe';
            ctx.lineWidth = 2.5;
            ctx.shadowColor = '#00f2fe';
            ctx.shadowBlur = 10;
            ctx.stroke();
            ctx.shadowBlur = 0;

            // Merkez prizma üçgeni
            ctx.beginPath();
            ctx.moveTo(sp.x, sp.y - sp.radius * 0.6);
            ctx.lineTo(sp.x + sp.radius * 0.5, sp.y + sp.radius * 0.5);
            ctx.lineTo(sp.x - sp.radius * 0.5, sp.y + sp.radius * 0.5);
            ctx.closePath();
            ctx.fillStyle = '#ffffff';
            ctx.fill();
        });

        // 3. Hücreler
        this.cells.forEach(c => {
            // Hücre Zarı (Membrane)
            ctx.beginPath();
            ctx.arc(c.x, c.y, c.radius, 0, Math.PI * 2);
            ctx.fillStyle = c.color;
            ctx.shadowColor = c.color;
            ctx.shadowBlur = 12;
            ctx.fill();
            ctx.shadowBlur = 0;

            // Hücre Çekirdeği (Nucleus)
            ctx.beginPath();
            ctx.arc(c.x - c.radius * 0.2, c.y - c.radius * 0.2, c.radius * 0.35, 0, Math.PI * 2);
            ctx.fillStyle = c.coreColor;
            ctx.fill();
        });

        // 4. Partiküller
        this.particles.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * (p.life / 0.5), 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.fill();
        });

        // 5. HUD Bilgileri
        ctx.fillStyle = 'rgba(5, 5, 15, 0.75)';
        ctx.roundRect(540 - 240, SAFE_ZONE.startY + 30, 480, 52, 12);
        ctx.fill();
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.font = '900 24px system-ui, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText(`🦠 POPULATION: ${this.cells.length} / ${this.maxCells} (GEN ${this.generationCount})`, 540, SAFE_ZONE.startY + 65);

        ctx.restore();
    }
}
