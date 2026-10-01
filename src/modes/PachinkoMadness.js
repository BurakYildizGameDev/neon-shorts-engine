// src/modes/PachinkoMadness.js
import { SAFE_ZONE } from '../config/SafeZone.js';
import { PRNG } from '../generator/PRNG.js';

/**
 * 🎰 ÇILGIN PACHINKO (PACHINKO MADNESS)
 * Yüzlerce pirinç pin arasında şangırdayarak düşen gümüş pachinko bilyeleri!
 * Ortadaki açılıp kapanan Lale (Tulip) ve Jackpot kapıları.
 * ASMR metalik tınılar, Fever Modu ve altın yağmuru!
 */
export class PachinkoMadnessMode {
    constructor(seed = 1) {
        this.name = 'Pachinko Madness';
        this.seed = seed;
        this.rng = new PRNG(seed * 919 + 63);
        this.duration = 28.0;

        this.pins = [];
        this.balls = [];
        this.tulips = [];
        this.particles = [];
        this.score = 0;
        this.feverActive = false;
        this.feverTimer = 0;
        this.spawnTimer = 0;
        this.screenShake = 0;

        this.initPins();
        this.initTulips();
    }

    initPins() {
        this.pins = [];
        const rows = 12;
        const startY = SAFE_ZONE.startY + 180;
        const rowSpacing = 85;

        for (let r = 0; r < rows; r++) {
            const count = (r % 2 === 0) ? 9 : 8;
            const y = startY + r * rowSpacing;
            const stepX = (SAFE_ZONE.width - 120) / (count + 1);

            for (let c = 1; c <= count; c++) {
                this.pins.push({
                    x: SAFE_ZONE.startX + 60 + c * stepX + (this.rng.next() - 0.5) * 6,
                    y: y + (this.rng.next() - 0.5) * 6,
                    radius: 7,
                    hitAnim: 0
                });
            }
        }
    }

    initTulips() {
        this.tulips = [
            { id: 'left', x: SAFE_ZONE.startX + 180, y: SAFE_ZONE.endY - 140, width: 80, multiplier: 20, isOpen: true, color: '#00e5ff' },
            { id: 'center', x: 540, y: SAFE_ZONE.endY - 110, width: 100, multiplier: 100, isOpen: true, color: '#ffea00' },
            { id: 'right', x: SAFE_ZONE.endX - 180, y: SAFE_ZONE.endY - 140, width: 80, multiplier: 20, isOpen: true, color: '#ff0055' }
        ];
    }

    spawnBall(x, vx) {
        this.balls.push({
            x: x ?? (540 + (this.rng.next() - 0.5) * 120),
            y: SAFE_ZONE.startY + 40,
            vx: vx ?? (this.rng.next() - 0.5) * 100,
            vy: 80 + this.rng.next() * 60,
            radius: 10,
            color: '#f8fafc',
            trail: []
        });
    }

    update(currentTime, dt, soundSynth) {
        if (soundSynth) soundSynth.currentTime = currentTime;
        if (this.screenShake > 0) this.screenShake = Math.max(0, this.screenShake - dt * 20);

        // Bilye fırlatıcı zamanlayıcısı
        this.spawnTimer += dt;
        const spawnInterval = this.feverActive ? 0.15 : 0.45;
        if (this.spawnTimer >= spawnInterval && this.balls.length < 50) {
            this.spawnTimer = 0;
            this.spawnBall();
        }

        // Fever modu
        if (this.feverActive) {
            this.feverTimer -= dt;
            if (this.feverTimer <= 0) this.feverActive = false;
        }

        // Pin animasyonları
        this.pins.forEach(pin => {
            if (pin.hitAnim > 0) pin.hitAnim = Math.max(0, pin.hitAnim - dt * 5);
        });

        // Top Fizik & Pin Çarpışması
        for (let i = this.balls.length - 1; i >= 0; i--) {
            const b = this.balls[i];
            b.vy += 650 * dt; // Yerçekimi
            b.x += b.vx * dt;
            b.y += b.vy * dt;

            // Yan duvarlar ve tavan
            if (b.x - b.radius < SAFE_ZONE.startX + 20) {
                b.x = SAFE_ZONE.startX + 20 + b.radius;
                b.vx = Math.abs(b.vx) * 0.75;
            } else if (b.x + b.radius > SAFE_ZONE.endX - 20) {
                b.x = SAFE_ZONE.endX - 20 - b.radius;
                b.vx = -Math.abs(b.vx) * 0.75;
            }
            if (b.y - b.radius < SAFE_ZONE.startY + 20) {
                b.y = SAFE_ZONE.startY + 20 + b.radius;
                b.vy = Math.abs(b.vy) * 0.75;
            }

            // Pin çarpışmaları
            for (let pIdx = 0; pIdx < this.pins.length; pIdx++) {
                const pin = this.pins[pIdx];
                const dx = b.x - pin.x;
                const dy = b.y - pin.y;
                const dist = Math.hypot(dx, dy);
                const minDist = b.radius + pin.radius;

                if (dist < minDist) {
                    const nx = dx / (dist || 1);
                    const ny = dy / (dist || 1);
                    b.x = pin.x + nx * minDist;
                    b.y = pin.y + ny * minDist;

                    // Yüksek sekme & saçılma (sadece yaklaşırken yansıt)
                    const dot = b.vx * nx + b.vy * ny;
                    if (dot < 0) {
                        b.vx = (b.vx - 1.85 * dot * nx) + (this.rng.next() - 0.5) * 50;
                        b.vy = (b.vy - 1.85 * dot * ny);
                    }

                    pin.hitAnim = 1.0;

                    // ASMR metalik tını
                    const pitch = 900 + (pIdx % 8) * 150 + this.rng.next() * 80;
                    soundSynth?.playBleep(pitch, 0.04, 'sine');
                }
            }

            // Tulip (Lale Hazneleri) Yakalama Kontrolü
            let caught = false;
            for (let tIdx = 0; tIdx < this.tulips.length; tIdx++) {
                const t = this.tulips[tIdx];
                if (Math.abs(b.x - t.x) < t.width / 2 && Math.abs(b.y - t.y) < 25) {
                    caught = true;
                    this.score += t.multiplier;
                    this.screenShake = 6;

                    // Eğer merkez Jackpot ise FEVER MODU başlat!
                    if (t.id === 'center') {
                        this.feverActive = true;
                        this.feverTimer = 4.0;
                        for (let k = 0; k < 6; k++) {
                            this.spawnBall(540 + (k - 2.5) * 30, (k - 2.5) * 60);
                        }
                    }

                    // Altın partiküller
                    for (let k = 0; k < 12; k++) {
                        this.particles.push({
                            x: t.x,
                            y: t.y,
                            vx: (this.rng.next() - 0.5) * 300,
                            vy: -(150 + this.rng.next() * 250),
                            size: 4 + this.rng.next() * 5,
                            color: t.color,
                            life: 0.8
                        });
                    }

                    soundSynth?.playBleep(1400, 0.12, 'sawtooth');
                    break;
                }
            }

            // Alt boşluktan düşme veya yakalanma
            if (caught || b.y > SAFE_ZONE.endY + 20) {
                this.balls.splice(i, 1);
            }
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

        // 1. Arka Plan Kavisli Çerçeve (Arcade Cabinet)
        ctx.strokeStyle = 'rgba(255, 234, 0, 0.2)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.roundRect(SAFE_ZONE.startX + 10, SAFE_ZONE.startY + 20, SAFE_ZONE.width - 20, SAFE_ZONE.height - 40, 24);
        ctx.stroke();

        // 2. Tulip Hazneleri
        this.tulips.forEach(t => {
            ctx.save();
            ctx.translate(t.x, t.y);

            // Hazne Gövdesi
            ctx.beginPath();
            ctx.moveTo(-t.width / 2, -15);
            ctx.lineTo(-t.width / 2 + 10, 15);
            ctx.lineTo(t.width / 2 - 10, 15);
            ctx.lineTo(t.width / 2, -15);
            ctx.closePath();
            ctx.fillStyle = t.color;
            ctx.shadowColor = t.color;
            ctx.shadowBlur = 12;
            ctx.fill();
            ctx.shadowBlur = 0;

            // Yazı
            ctx.font = '900 16px monospace';
            ctx.fillStyle = '#000000';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`+${t.multiplier}`, 0, 2);

            ctx.restore();
        });

        // 3. Pirinç Pinler (Pins)
        this.pins.forEach(pin => {
            ctx.beginPath();
            ctx.arc(pin.x, pin.y, pin.radius + pin.hitAnim * 4, 0, Math.PI * 2);
            ctx.fillStyle = pin.hitAnim > 0 ? '#ffffff' : '#ffd700';
            if (pin.hitAnim > 0) {
                ctx.shadowColor = '#ffffff';
                ctx.shadowBlur = 12;
            }
            ctx.fill();
            ctx.shadowBlur = 0;

            // Pin merkezi küçük nokta
            ctx.beginPath();
            ctx.arc(pin.x, pin.y, 2, 0, Math.PI * 2);
            ctx.fillStyle = '#1e1b4b';
            ctx.fill();
        });

        // 4. Pachinko Bilyeleri
        this.balls.forEach(b => {
            // Parlak gümüş top
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
            const grad = ctx.createRadialGradient(b.x - 3, b.y - 3, 1, b.x, b.y, b.radius);
            grad.addColorStop(0, '#ffffff');
            grad.addColorStop(0.5, '#cbd5e1');
            grad.addColorStop(1, '#64748b');
            ctx.fillStyle = grad;
            ctx.shadowColor = '#ffffff';
            ctx.shadowBlur = 6;
            ctx.fill();
            ctx.shadowBlur = 0;
        });

        // 5. Partiküller
        this.particles.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * (p.life / 0.8), 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.fill();
        });

        // 6. HUD Skor Tablosu
        ctx.beginPath();
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.roundRect(540 - 200, SAFE_ZONE.startY + 40, 400, 56, 12);
        ctx.fill();
        ctx.strokeStyle = this.feverActive ? '#ff0055' : '#ffea00';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.font = '900 24px monospace';
        ctx.fillStyle = this.feverActive ? '#ff0055' : '#ffea00';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.feverActive ? `🔥 FEVER JACKPOT: ${this.score}` : `🪙 SCORE: ${this.score}`, 540, SAFE_ZONE.startY + 68);

        ctx.restore();
    }
}
