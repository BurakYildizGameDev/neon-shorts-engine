// src/modes/CircleEscape.js
import { SAFE_ZONE } from '../config/SafeZone.js';
import { PRNG } from '../generator/PRNG.js';

/**
 * DÖNEN HALKA KAÇIŞI (NEON CIRCLE ESCAPE)
 * İç içe dönen neon halkalar. Her sekmede hızlanan top, yükselen ASMR ses perdesi
 * ve dışarı kaçtıkça parçalanan halkalar (High Retention / Watch Time).
 */
export class CircleEscapeMode {
    constructor(seed = 1) {
        this.name = 'Circle Escape';
        this.seed = seed;
        this.rng = new PRNG(seed * 999 + 42);

        this.centerX = 540;
        this.centerY = 850;
        this.duration = 28.0;

        // 4 Katmanlı Dönen Halka
        this.rings = [
            { radius: 130, angle: 0, speed: 1.8, gapSize: 0.55, color: '#ff0055', broken: false },
            { radius: 210, angle: Math.PI * 0.5, speed: -1.4, gapSize: 0.50, color: '#a855f7', broken: false },
            { radius: 290, angle: Math.PI, speed: 1.1, gapSize: 0.45, color: '#00f0ff', broken: false },
            { radius: 370, angle: Math.PI * 1.5, speed: -0.9, gapSize: 0.40, color: '#00ff88', broken: false }
        ];

        // Zıplayan Neon Top
        this.ball = {
            x: this.centerX,
            y: this.centerY - 40,
            vx: 380,
            vy: 260,
            radius: 18,
            color: '#ffd700',
            trail: [],
            bounceCount: 0
        };

        this.particles = [];
        this.escaped = false;
        this.escapeTime = 0;
    }

    update(currentTime, dt, soundSynth) {
        // Halkaları döndür
        for (let i = 0; i < this.rings.length; i++) {
            const r = this.rings[i];
            r.angle += r.speed * dt;
        }

        // Parçacıkları güncelle
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.life -= dt * 2.0;
            if (p.life <= 0) this.particles.splice(i, 1);
        }

        if (this.escaped) {
            // Kaçıştan sonra dışarı doğru fırla
            this.ball.x += this.ball.vx * dt * 1.5;
            this.ball.y += this.ball.vy * dt * 1.5;
            return;
        }

        // Top hareketi
        this.ball.x += this.ball.vx * dt;
        this.ball.y += this.ball.vy * dt;

        // Merkezden uzaklık
        const dx = this.ball.x - this.centerX;
        const dy = this.ball.y - this.centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const ballAngle = Math.atan2(dy, dx);

        // Her bir halka ile çarpışma kontrolü
        for (let i = 0; i < this.rings.length; i++) {
            const ring = this.rings[i];
            if (ring.broken) continue;

            const ringInner = ring.radius - 12;
            const ringOuter = ring.radius + 12;

            if (dist + this.ball.radius >= ringInner && dist - this.ball.radius <= ringOuter) {
                // Halkanın çıkış deliğinde mi?
                let normalizedAngle = (ballAngle - ring.angle) % (Math.PI * 2);
                if (normalizedAngle < 0) normalizedAngle += Math.PI * 2;

                const halfGap = ring.gapSize / 2;
                const isInGap = (normalizedAngle < halfGap || normalizedAngle > Math.PI * 2 - halfGap);

                if (isInGap) {
                    // Delikten geçti! Halka kırılır ve patlar
                    ring.broken = true;
                    this.ball.bounceCount++;
                    this._shatterRing(ring);

                    if (soundSynth) {
                        soundSynth.addGlassShatter(currentTime, (this.ball.x - 540) / 470, 0.85);
                    }

                    // En dış halkadan çıktıysa kazandı!
                    if (i === this.rings.length - 1) {
                        this.escaped = true;
                        this.escapeTime = currentTime;
                        if (soundSynth) {
                            soundSynth.addBassDrop(currentTime, 180, 36, 1.0);
                        }
                    }
                } else {
                    // Duvara çarptı -> Sekme ve Hızlanma (+%1.5 hız artışı)
                    const nx = dx / dist;
                    const ny = dy / dist;

                    // Hız vektörünü ters çevir
                    const dot = this.ball.vx * nx + this.ball.vy * ny;
                    if (dot > 0) { // Dışa doğru hareket ediyorsa içeri sektir
                        this.ball.vx = (this.ball.vx - 2 * dot * nx) * 1.015;
                        this.ball.vy = (this.ball.vy - 2 * dot * ny) * 1.015;

                        // Penetrasyon düzelt
                        this.ball.x = this.centerX + nx * (ringInner - this.ball.radius);
                        this.ball.y = this.centerY + ny * (ringInner - this.ball.radius);

                        this.ball.bounceCount++;
                        this._createBounceSparkles(this.ball.x, this.ball.y, ring.color);

                        if (soundSynth) {
                            // Her sekmede yükselen pentatonik melodi (ASMR Gerilim)
                            const pitch = soundSynth.getFrequency(this.ball.bounceCount);
                            soundSynth.addPlink(currentTime, pitch, (this.ball.x - 540) / 470, 0.45);
                        }
                    }
                }
                break;
            }
        }
    }

    _shatterRing(ring) {
        const count = 40;
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            const speed = 120 + Math.random() * 260;
            this.particles.push({
                x: this.centerX + Math.cos(angle) * ring.radius,
                y: this.centerY + Math.sin(angle) * ring.radius,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: ring.color,
                radius: 3 + Math.random() * 3,
                life: 1.2
            });
        }
    }

    _createBounceSparkles(x, y, color) {
        for (let i = 0; i < 6; i++) {
            const a = Math.random() * Math.PI * 2;
            const spd = 80 + Math.random() * 180;
            this.particles.push({
                x, y,
                vx: Math.cos(a) * spd,
                vy: Math.sin(a) * spd,
                color,
                radius: 2 + Math.random() * 2,
                life: 0.6
            });
        }
    }

    render(ctx, currentTime) {
        ctx.save();

        // 1. Opak Zemin
        ctx.fillStyle = '#020306';
        ctx.fillRect(0, 0, 1080, 1920);

        // 2. Üst Kanca Başlığı
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 32px "Orbitron", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🌀 CIRCLE ESCAPE • CAN IT BREAK FREE?', 540, SAFE_ZONE.startY + 20);

        // Sekme Sayacı & Hız
        const currentSpeed = Math.round(Math.sqrt(this.ball.vx * this.ball.vx + this.ball.vy * this.ball.vy));
        ctx.font = '700 20px "Orbitron", sans-serif';
        ctx.fillStyle = '#00f0ff';
        ctx.fillText(`BOUNCES: ${this.ball.bounceCount}  |  SPEED: ${currentSpeed} PX/S`, 540, SAFE_ZONE.startY + 60);

        // 3. Dönen Neon Halkalar
        ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < this.rings.length; i++) {
            const r = this.rings[i];
            if (r.broken) continue;

            const startAngle = r.angle + r.gapSize / 2;
            const endAngle = r.angle + Math.PI * 2 - r.gapSize / 2;

            // Dış Parlama
            ctx.strokeStyle = r.color + '44';
            ctx.lineWidth = 14;
            ctx.beginPath();
            ctx.arc(this.centerX, this.centerY, r.radius, startAngle, endAngle);
            ctx.stroke();

            // Çekirdek Hat
            ctx.strokeStyle = r.color;
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.arc(this.centerX, this.centerY, r.radius, startAngle, endAngle);
            ctx.stroke();

            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.centerX, this.centerY, r.radius, startAngle, endAngle);
            ctx.stroke();
        }

        // 4. Parçacıklar
        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];
            ctx.fillStyle = p.color;
            ctx.globalAlpha = Math.max(0, p.life);
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1.0;

        // 5. Top ve Kuyruk
        this.ball.trail.push({ x: this.ball.x, y: this.ball.y });
        if (this.ball.trail.length > 14) this.ball.trail.shift();

        for (let k = 0; k < this.ball.trail.length; k++) {
            const tr = this.ball.trail[k];
            ctx.fillStyle = this.ball.color;
            ctx.globalAlpha = (k / this.ball.trail.length) * 0.5;
            ctx.beginPath();
            ctx.arc(tr.x, tr.y, this.ball.radius * (0.3 + k * 0.05), 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1.0;

        // Top Gövdesi
        ctx.fillStyle = this.ball.color;
        ctx.globalAlpha = 0.4;
        ctx.beginPath();
        ctx.arc(this.ball.x, this.ball.y, this.ball.radius * 1.8, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalAlpha = 1.0;
        ctx.fillStyle = this.ball.color;
        ctx.beginPath();
        ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(this.ball.x, this.ball.y, this.ball.radius * 0.45, 0, Math.PI * 2);
        ctx.fill();

        // 6. Zafer Ekranı
        if (this.escaped) {
            ctx.globalCompositeOperation = 'source-over';
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(0, 0, 1080, 1920);

            ctx.fillStyle = '#00ff88';
            ctx.font = '900 80px "Orbitron", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('ESCAPED!', 540, 840);

            ctx.fillStyle = '#ffffff';
            ctx.font = '900 36px "Orbitron", sans-serif';
            ctx.fillText(`TIME: ${this.escapeTime.toFixed(1)}s • ${this.ball.bounceCount} BOUNCES`, 540, 930);

            ctx.fillStyle = '#ffd700';
            ctx.font = '700 28px "Orbitron", sans-serif';
            ctx.fillText('SUBSCRIBE FOR NEXT STAGE! 🚀', 540, 1000);
        }

        ctx.restore();
    }
}
