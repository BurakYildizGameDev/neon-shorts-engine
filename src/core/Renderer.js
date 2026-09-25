// src/core/Renderer.js
import { CANVAS_WIDTH, CANVAS_HEIGHT, SAFE_ZONE } from '../config/SafeZone.js';

/**
 * 1080x1920 (9:16) Çok Katmanlı Neon Glow ve Additive Blending Renderer.
 */
export class NeonRenderer {
    constructor() {
        this.shakeAmount = 0;
        this.shakeDecay = 0.92;
    }

    addScreenShake(intensity = 15) {
        this.shakeAmount = Math.min(40, this.shakeAmount + intensity);
    }

    render(ctx, world, director, frameIndex, palette) {
        // 1. Ekran Sarsıntısı (Screen Shake) Hesabı
        let offsetX = 0;
        let offsetY = 0;
        if (this.shakeAmount > 0.1) {
            offsetX = (Math.random() - 0.5) * this.shakeAmount * 2;
            offsetY = (Math.random() - 0.5) * this.shakeAmount * 2;
            this.shakeAmount *= this.shakeDecay;
        }

        ctx.save();
        ctx.translate(offsetX, offsetY);

        // 2. [KRİTİK]: clearRect YASAKTIR. Opak siyah zemin çizilir (Anti-Fringe):
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = palette ? palette.background : '#030305';
        ctx.fillRect(-50, -50, CANVAS_WIDTH + 100, CANVAS_HEIGHT + 100);

        // 3. Arka Plan İnce Siber Izgara (Ambient Tech Grid)
        this._drawBackgroundGrid(ctx, palette);

        // 4. Safe Zone Dış Çerçeve Sınırları (Neon Glow Duvarlar)
        this._drawSafeZoneBorders(ctx, palette);

        // 5. [KRİTİK]: Neon Parlaması İçin Additive Blending Açılır
        ctx.globalCompositeOperation = 'lighter';

        // 6. V-Huni Rampaları Çiz
        this._drawFunnels(ctx, world.funnels, palette);

        // 7. Engelleri Çiz (Spinner, Multiplier, Tile, Tilter)
        for (let i = 0; i < world.obstacles.length; i++) {
            const obs = world.obstacles[i];
            if (obs.draw) {
                obs.draw(ctx, palette);
            }
        }

        // 8. Parçacık Patlamalarını Çiz
        this._drawParticles(ctx, world.particles);

        // 9. Topları ve Hareket Kuyruklarını (Motion Trails) Çiz
        this._drawBalls(ctx, world.balls, palette);

        // 10. UI ve Kanca Banner Katmanı (Director Kontrolünde)
        ctx.globalCompositeOperation = 'source-over';
        if (director && director.drawUI) {
            director.drawUI(ctx, frameIndex, palette);
        }

        ctx.restore();
    }

    _drawBackgroundGrid(ctx, palette) {
        ctx.strokeStyle = palette ? palette.walls + '08' : 'rgba(255, 255, 255, 0.03)';
        ctx.lineWidth = 1;
        const step = 80;
        for (let x = 0; x < CANVAS_WIDTH; x += step) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, CANVAS_HEIGHT);
            ctx.stroke();
        }
        for (let y = 0; y < CANVAS_HEIGHT; y += step) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(CANVAS_WIDTH, y);
            ctx.stroke();
        }
    }

    _drawSafeZoneBorders(ctx, palette) {
        const wallColor = palette ? palette.walls : '#00f0ff';

        // 3 Geçişli Neon Işıma Tekniği (CPU'yu kasmayan additive glow)
        // Katman 1: Geniş Saydam Dış Işıma
        ctx.strokeStyle = wallColor + '22';
        ctx.lineWidth = 14;
        ctx.strokeRect(SAFE_ZONE.startX, SAFE_ZONE.startY, SAFE_ZONE.width, SAFE_ZONE.height);

        // Katman 2: Orta Yoğunluk Işıma
        ctx.strokeStyle = wallColor + '66';
        ctx.lineWidth = 6;
        ctx.strokeRect(SAFE_ZONE.startX, SAFE_ZONE.startY, SAFE_ZONE.width, SAFE_ZONE.height);

        // Katman 3: Keskin Çekirdek Beyaz/Parlak Hat
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(SAFE_ZONE.startX, SAFE_ZONE.startY, SAFE_ZONE.width, SAFE_ZONE.height);
    }

    _drawFunnels(ctx, funnels, palette) {
        const glowColor = palette ? palette.secondary : '#00f0ff';

        for (let i = 0; i < funnels.length; i++) {
            const f = funnels[i];
            if (!f.active) continue;

            // Dış Işıma
            ctx.strokeStyle = glowColor + '44';
            ctx.lineWidth = 10;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(f.x1, f.y1);
            ctx.lineTo(f.x2, f.y2);
            ctx.stroke();

            // Çekirdek Hat
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(f.x1, f.y1);
            ctx.lineTo(f.x2, f.y2);
            ctx.stroke();
        }
    }

    _drawParticles(ctx, particles) {
        for (let i = 0; i < particles.length; i++) {
            const p = particles[i];
            const alpha = Math.max(0, Math.min(1, p.life));

            ctx.fillStyle = p.color;
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1.0;
    }

    _drawBalls(ctx, balls, palette) {
        for (let i = 0; i < balls.length; i++) {
            const b = balls[i];
            if (!b.isAlive) continue;

            // Hareket Kuyruğu Kaydı
            b.trail.push({ x: b.x, y: b.y });
            if (b.trail.length > 12) {
                b.trail.shift();
            }

            // Kuyruk Çizimi
            for (let t = 0; t < b.trail.length; t++) {
                const tr = b.trail[t];
                const trAlpha = (t / b.trail.length) * 0.45;
                const trRadius = b.radius * (0.3 + (t / b.trail.length) * 0.7);

                ctx.fillStyle = b.color;
                ctx.globalAlpha = trAlpha;
                ctx.beginPath();
                ctx.arc(tr.x, tr.y, trRadius, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1.0;

            // Top Gövdesi (3 Katmanlı Neon)
            // 1. Dış Halka Parlaması
            ctx.fillStyle = b.color;
            ctx.globalAlpha = 0.35;
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.radius * 1.7, 0, Math.PI * 2);
            ctx.fill();

            // 2. Ana Neon Gövde
            ctx.globalAlpha = 0.9;
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
            ctx.fill();

            // 3. Parlak Beyaz/Altın Çekirdek (Hero ball ise parlak altın sarısı)
            ctx.fillStyle = b.isHero ? '#ffe600' : '#ffffff';
            ctx.globalAlpha = 1.0;
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.radius * 0.45, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}
