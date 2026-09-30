// src/modes/HexagonEscape.js
import { SAFE_ZONE } from '../config/SafeZone.js';
import { PRNG } from '../generator/PRNG.js';

/**
 * 🌀 DÖNEN ALTIGEN KAÇIŞ LABİRENTİ (HEXAGON ESCAPE LABYRINTH)
 * İç içe 5 dönen neon altıgen. Her birinin bir kaçış boşluğu (kapısı) vardır.
 * Toplar sürekli duvarlardan sekerek doğru anda dış katmana kaçmaya çalışır.
 * 5. katmandan kaçmayı başaran toplar özgürlüğe kavuşur! (Hipnotik ASMR)
 */
export class HexagonEscapeMode {
    constructor(seed = 1) {
        this.name = 'Hexagon Escape';
        this.seed = seed;
        this.rng = new PRNG(seed * 555 + 23);

        this.centerX = 540;
        this.centerY = 850;
        this.duration = 28.0;

        this.layers = [];
        this.balls = [];
        this.particles = [];
        this.escapedCount = 0;
        this.totalBalls = 14;
        this.screenShake = 0;

        this.initHexagons();
        this.initBalls();
    }

    initHexagons() {
        this.layers = [];
        const radii = [100, 170, 240, 310, 390];
        const colors = ['#00f0ff', '#ff0055', '#00ff88', '#ffd700', '#a855f7'];

        radii.forEach((r, idx) => {
            this.layers.push({
                index: idx + 1,
                radius: r,
                color: colors[idx % colors.length],
                angle: (idx * Math.PI) / 3,
                speed: (idx % 2 === 0 ? 1 : -1) * (0.8 + idx * 0.25),
                gapAngle: 0.65, // Kaçış boşluğu genişliği (radyan)
                pulse: 0
            });
        });
    }

    initBalls() {
        this.balls = [];
        const ballColors = ['#00f0ff', '#ff0055', '#00ff88', '#ffd700', '#ffffff', '#ff7700'];

        for (let i = 0; i < this.totalBalls; i++) {
            const angle = (i / this.totalBalls) * Math.PI * 2;
            const dist = this.rng.range(20, 60);
            const speed = this.rng.range(320, 480);
            const moveAngle = this.rng.range(0, Math.PI * 2);

            this.balls.push({
                id: i + 1,
                x: this.centerX + Math.cos(angle) * dist,
                y: this.centerY + Math.sin(angle) * dist,
                vx: Math.cos(moveAngle) * speed,
                vy: Math.sin(moveAngle) * speed,
                radius: 12,
                color: ballColors[i % ballColors.length],
                currentLayer: 0, // 0: Merkez, 1..5: Katmanlar, 6: Kaçtı!
                isEscaped: false,
                trail: []
            });
        }
    }

    update(currentTime, dt, soundSynth) {
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

        // Altıgenleri döndür
        for (let i = 0; i < this.layers.length; i++) {
            const layer = this.layers[i];
            layer.angle += layer.speed * dt;
            if (layer.pulse > 0) layer.pulse -= dt * 3;
        }

        // Kalp atışı ASMR (Bitişe doğru gerilim)
        if (soundSynth && currentTime > 24.5 && Math.floor(currentTime * 2) !== Math.floor((currentTime - dt) * 2)) {
            soundSynth.addHeartbeat(currentTime, 0.8);
        }

        // Topları güncelle (Fizik ve Altıgen Çarpışmaları)
        for (let i = 0; i < this.balls.length; i++) {
            const b = this.balls[i];

            b.x += b.vx * dt;
            b.y += b.vy * dt;

            // Merkeze göre mesafe ve açı
            const dx = b.x - this.centerX;
            const dy = b.y - this.centerY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            let ballAngle = Math.atan2(dy, dx);
            if (ballAngle < 0) ballAngle += Math.PI * 2;

            if (b.isEscaped) {
                // Kaçmış top: Dış duvardan sekip dans eder
                const minX = SAFE_ZONE.startX + b.radius;
                const maxX = SAFE_ZONE.endX - b.radius;
                const minY = SAFE_ZONE.startY + 90 + b.radius;
                const maxY = SAFE_ZONE.endY - b.radius;

                if (b.x <= minX) { b.x = minX; b.vx = Math.abs(b.vx); }
                if (b.x >= maxX) { b.x = maxX; b.vx = -Math.abs(b.vx); }
                if (b.y <= minY) { b.y = minY; b.vy = Math.abs(b.vy); }
                if (b.y >= maxY) { b.y = maxY; b.vy = -Math.abs(b.vy); }
                continue;
            }

            // Hangi katmandaysa bir sonraki çemberle etkileşime girer
            const targetLayerIdx = b.currentLayer;
            if (targetLayerIdx < this.layers.length) {
                const layer = this.layers[targetLayerIdx];
                const r = layer.radius;

                // Top katman çemberine vurdu mu?
                if (dist + b.radius >= r) {
                    // Kaçış boşluğu kontrolü
                    let normLayerAngle = layer.angle % (Math.PI * 2);
                    if (normLayerAngle < 0) normLayerAngle += Math.PI * 2;

                    let angleDiff = Math.abs(ballAngle - normLayerAngle);
                    if (angleDiff > Math.PI) angleDiff = Math.PI * 2 - angleDiff;

                    // Eğer kaçış kapısındaysa: BİR ÜST KATMANA GEÇİŞ!
                    if (angleDiff < layer.gapAngle * 0.5) {
                        b.currentLayer++;
                        layer.pulse = 1.0;
                        this.screenShake = 2.0;
                        this._createBreakParticles(b.x, b.y, layer.color);

                        if (b.currentLayer >= this.layers.length) {
                            // TAMAMEN KAÇTI!
                            b.isEscaped = true;
                            this.escapedCount++;
                            if (soundSynth) soundSynth.addBassDrop(currentTime, 160, 42, 0.7);
                        } else {
                            if (soundSynth) {
                                const pitch = soundSynth.getFrequency(b.currentLayer + 3);
                                soundSynth.addPlink(currentTime, pitch, (b.x - 540) / 470, 0.45);
                            }
                        }
                    } else {
                        // Kapı değil, duvara çarptı: İÇE DOĞRU GERİ SEK!
                        const nx = dx / dist;
                        const ny = dy / dist;

                        b.x = this.centerX + nx * (r - b.radius);
                        const dot = b.vx * nx + b.vy * ny;
                        if (dot > 0) {
                            b.vx -= 1.9 * dot * nx;
                            b.vy -= 1.9 * dot * ny;
                        }

                        if (soundSynth && Math.random() < 0.25) {
                            soundSynth.addPlink(currentTime, soundSynth.getFrequency(targetLayerIdx), (b.x - 540) / 470, 0.25);
                        }
                    }
                }
            }
        }
    }

    _createBreakParticles(x, y, color) {
        for (let i = 0; i < 10; i++) {
            const a = Math.random() * Math.PI * 2;
            const spd = 80 + Math.random() * 160;
            this.particles.push({
                x, y,
                vx: Math.cos(a) * spd,
                vy: Math.sin(a) * spd,
                color,
                radius: 2.5 + Math.random() * 2,
                life: 0.7
            });
        }
    }

    render(ctx, currentTime) {
        ctx.save();

        if (this.screenShake > 0) {
            ctx.translate((Math.random() - 0.5) * this.screenShake, (Math.random() - 0.5) * this.screenShake);
        }

        // 1. Zemin
        ctx.fillStyle = '#020206';
        ctx.fillRect(0, 0, 1080, 1920);

        // 2. Üst Skor ve Kaçış Başlığı
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 28px "Orbitron", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🌀 HEXAGON ESCAPE • 5 ROTATING GATES!', 540, SAFE_ZONE.startY + 20);

        ctx.font = '900 34px "Orbitron", sans-serif';
        ctx.fillStyle = this.escapedCount >= 5 ? '#00ff88' : '#ffd700';
        ctx.fillText(`ESCAPED: ${this.escapedCount} / ${this.totalBalls}`, 540, SAFE_ZONE.startY + 65);

        // 3. Dönen Altıgen Katmanları
        for (let i = 0; i < this.layers.length; i++) {
            const layer = this.layers[i];
            const r = layer.radius;

            ctx.save();
            ctx.translate(this.centerX, this.centerY);
            ctx.rotate(layer.angle);

            // Yay veya kesik altıgen çizimi (Açık kapı)
            ctx.strokeStyle = layer.color;
            ctx.lineWidth = layer.pulse > 0.1 ? 6 : 3.5;
            ctx.beginPath();
            ctx.arc(0, 0, r, layer.gapAngle * 0.5, Math.PI * 2 - layer.gapAngle * 0.5);
            ctx.stroke();

            // Kapı uç noktalarına neon parıltı topları
            ctx.fillStyle = '#ffffff';
            const x1 = Math.cos(layer.gapAngle * 0.5) * r;
            const y1 = Math.sin(layer.gapAngle * 0.5) * r;
            const x2 = Math.cos(Math.PI * 2 - layer.gapAngle * 0.5) * r;
            const y2 = Math.sin(Math.PI * 2 - layer.gapAngle * 0.5) * r;

            ctx.beginPath(); ctx.arc(x1, y1, 4, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(x2, y2, 4, 0, Math.PI * 2); ctx.fill();

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

        // 5. Kaçmaya Çalışan Toplar
        for (let i = 0; i < this.balls.length; i++) {
            const b = this.balls[i];

            b.trail.push({ x: b.x, y: b.y });
            if (b.trail.length > 8) b.trail.shift();

            for (let k = 0; k < b.trail.length; k++) {
                const tr = b.trail[k];
                ctx.fillStyle = b.color;
                ctx.globalAlpha = (k / b.trail.length) * 0.35;
                ctx.beginPath();
                ctx.arc(tr.x, tr.y, b.radius * (0.3 + k * 0.08), 0, Math.PI * 2);
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

        // 6. Zafer Ekranı
        if (currentTime >= 26.5) {
            ctx.globalCompositeOperation = 'source-over';
            ctx.fillStyle = 'rgba(0, 0, 0, 0.78)';
            ctx.fillRect(0, 0, 1080, 1920);

            ctx.fillStyle = '#00f0ff';
            ctx.font = '900 80px "Orbitron", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('ESCAPED!', 540, 840);

            ctx.fillStyle = '#ffffff';
            ctx.font = '900 42px "Orbitron", sans-serif';
            ctx.fillText(`${this.escapedCount} / ${this.totalBalls} ESCAPED THE LABYRINTH!`, 540, 930);

            ctx.fillStyle = '#ffd700';
            ctx.font = '700 28px "Orbitron", sans-serif';
            ctx.fillText('CAN YOU ESCAPE? COMMENT! 👇', 540, 1000);
        }

        ctx.restore();
    }
}
