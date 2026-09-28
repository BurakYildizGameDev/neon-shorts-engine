// src/modes/BlackHole.js
import { SAFE_ZONE } from '../config/SafeZone.js';
import { PRNG } from '../generator/PRNG.js';

/**
 * 🕳️ KARA DELİK ÇEKİM GİRDABI (BLACK HOLE GRAVITY VORTEX)
 * 28 top kaçış roketleriyle (thrusters) kara deliğin amansız çekiminden kaçmaya çalışır.
 * Yaklaşan topların iticileri alev püskürtür, çekim kuvvetine karşı titrer ve
 * olay ufkuna kapılanlar uzayı bükerek (spaghettification) kara deliğe yutulur!
 */
export class BlackHoleMode {
    constructor(seed = 1) {
        this.name = 'Black Hole Vortex';
        this.seed = seed;
        this.rng = new PRNG(seed * 444 + 91);

        this.centerX = 540;
        this.centerY = 850;
        this.holeRadius = 48;
        this.maxHoleRadius = 125;
        this.gravityConstant = 2400000;

        this.totalBalls = 28;
        this.balls = [];
        this.particles = [];
        this.shockwaves = [];
        this.accretionRays = [];
        this.swallowedCount = 0;
        this.duration = 28.0;

        this.initAccretionRays();
        this.initOrbiters();
    }

    initAccretionRays() {
        this.accretionRays = [];
        for (let i = 0; i < 40; i++) {
            this.accretionRays.push({
                angle: this.rng.range(0, Math.PI * 2),
                dist: this.rng.range(120, 480),
                speed: this.rng.range(1.2, 2.5),
                size: this.rng.range(1.5, 3.5),
                color: this.rng.next() < 0.6 ? '#a855f7' : '#00f0ff'
            });
        }
    }

    initOrbiters() {
        this.balls = [];
        const colors = [
            '#00f0ff', '#ff0055', '#00ff88', '#ffd700',
            '#a855f7', '#ff7700', '#ffffff', '#38bdf8'
        ];

        for (let i = 0; i < this.totalBalls; i++) {
            const orbitRadius = this.rng.range(190, 420);
            const angle = (i / this.totalBalls) * Math.PI * 2 + this.rng.range(-0.2, 0.2);

            // Başlangıç yörünge hızı
            const speed = Math.sqrt(this.gravityConstant / orbitRadius) * this.rng.range(0.85, 1.15);

            // Teğetsel hız vektörü
            const vx = -Math.sin(angle) * speed;
            const vy = Math.cos(angle) * speed;

            this.balls.push({
                id: i + 1,
                x: this.centerX + Math.cos(angle) * orbitRadius,
                y: this.centerY + Math.sin(angle) * orbitRadius,
                vx,
                vy,
                radius: 14,
                color: colors[i % colors.length],
                isAlive: true,
                strain: 0, // Çekim alanında gerilme/titreme oranı (0..1)
                thrusterIntensity: 0,
                trail: []
            });
        }
    }

    update(currentTime, dt, soundSynth) {
        // 1. Kozmik Toz ve İçe Çekilen Akresyon Işınları
        for (let i = 0; i < this.accretionRays.length; i++) {
            const ray = this.accretionRays[i];
            ray.angle += ray.speed * dt;
            ray.dist -= (45 + (400 / Math.max(50, ray.dist)) * 25) * dt; // Merkeze doğru spiral çekilme

            if (ray.dist <= this.holeRadius) {
                // Merkeze yutuldu, dışarıdan tekrar doğur
                ray.dist = this.rng.range(380, 500);
                ray.angle = this.rng.range(0, Math.PI * 2);
            }
        }

        // 2. Şok Dalgaları
        for (let i = this.shockwaves.length - 1; i >= 0; i--) {
            const sw = this.shockwaves[i];
            sw.radius += sw.speed * dt;
            sw.alpha -= dt * 1.8;
            if (sw.alpha <= 0) this.shockwaves.splice(i, 1);
        }

        // 3. Parçacıklar (Roket alevleri & patlamalar)
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.life -= dt * (p.decay || 2.5);
            if (p.life <= 0) this.particles.splice(i, 1);
        }

        // 4. Topları Güncelle (Kara Delik Çekimi vs Kaçış Roketleri)
        for (let i = 0; i < this.balls.length; i++) {
            const b = this.balls[i];
            if (!b.isAlive) continue;

            const dx = this.centerX - b.x;
            const dy = this.centerY - b.y;
            const distSq = dx * dx + dy * dy;
            const dist = Math.sqrt(distSq);

            // [OLAY UFKU]: Kara Delik Tarafından Tamamen Yutulma
            if (dist <= this.holeRadius + b.radius * 0.4) {
                b.isAlive = false;
                this.swallowedCount++;
                this.holeRadius = Math.min(this.maxHoleRadius, this.holeRadius + 2.2);

                // Yutulma Şok Dalgası ve Patlama Parçacıkları
                this.shockwaves.push({
                    x: this.centerX,
                    y: this.centerY,
                    radius: this.holeRadius,
                    speed: 260,
                    color: b.color,
                    alpha: 1.0
                });

                this._createSwallowParticles(b.x, b.y, b.color);

                if (soundSynth) {
                    soundSynth.addBassDrop(currentTime, 180, 32, 0.7);
                }
                continue;
            }

            // Normallendirilmiş yön vektörleri
            const nx = dx / dist; // Merkeze doğru
            const ny = dy / dist;

            // --- A) KARA DELİĞİN ÇEKİM KUVVETİ (Relativistik Güç) ---
            // Yaklaştıkça katlanarak artan acımasız çekim
            const gravityPower = (this.gravityConstant / Math.pow(Math.max(60, dist), 1.75));
            const gravAx = nx * gravityPower;
            const gravAy = ny * gravityPower;

            // Girdap Dönme Sürtünmesi (Vortex Swirl: saat yönünde çekim girdabı)
            const swirlPower = (140000 / Math.max(4000, distSq));
            const swirlAx = -ny * swirlPower;
            const swirlAy = nx * swirlPower;

            // --- B) TOPUN KAÇIŞ MOTORLARI (ESCAPE THRUSTERS) ---
            // Toplar kara deliğin çekimini algılar ve ters yöne TAM GÜÇ roket ateşler!
            const escapeUrgency = Math.max(0, Math.min(1, (380 - dist) / 280));
            b.strain = escapeUrgency; // Titreme ve gerilim katsayısı
            b.thrusterIntensity = 0.3 + escapeUrgency * 0.7;

            // Roket itiş kuvveti: Dışarı doğru fırlar (-nx, -ny)
            const thrusterBaseForce = 520 + escapeUrgency * 750;
            const thrustAx = -nx * thrusterBaseForce;
            const thrustAy = -ny * thrusterBaseForce;

            // Net ivme
            b.vx += (gravAx + swirlAx + thrustAx) * dt;
            b.vy += (gravAy + swirlAy + thrustAy) * dt;

            // Hız sönümleme (Yörünge stabilitesi için hafif frenleme)
            b.vx *= 0.998;
            b.vy *= 0.998;

            // Titreme (Strain Jitter) ekle (Çekimle mücadele anı)
            const jitter = escapeUrgency > 0.4 ? (Math.random() - 0.5) * escapeUrgency * 5 : 0;
            b.x += (b.vx + jitter) * dt;
            b.y += (b.vy + jitter) * dt;

            // --- C) ROKET ALEVİ PARÇACIKLARI PÜSKÜRT (Thruster Flame Exhaust) ---
            // Alevler roket motorundan kara deliğe doğru (veya hareket yönünün tersine) püskürür
            if (Math.random() < 0.85) {
                const exhaustDirX = nx + (Math.random() - 0.5) * 0.4;
                const exhaustDirY = ny + (Math.random() - 0.5) * 0.4;
                const flameSpeed = 70 + escapeUrgency * 180;

                this.particles.push({
                    x: b.x - nx * b.radius * 0.8,
                    y: b.y - ny * b.radius * 0.8,
                    vx: exhaustDirX * flameSpeed + (Math.random() - 0.5) * 40,
                    vy: exhaustDirY * flameSpeed + (Math.random() - 0.5) * 40,
                    color: escapeUrgency > 0.5 ? (Math.random() < 0.6 ? '#ff5500' : '#ffd700') : '#00f0ff',
                    radius: 2 + Math.random() * (escapeUrgency * 3 + 1.5),
                    life: 0.35 + escapeUrgency * 0.25,
                    decay: 3.5
                });
            }

            // Dış SafeZone sınırlarından yumuşak sekme
            const minX = SAFE_ZONE.startX + b.radius;
            const maxX = SAFE_ZONE.endX - b.radius;
            const minY = SAFE_ZONE.startY + 90 + b.radius;
            const maxY = SAFE_ZONE.endY - b.radius;

            if (b.x <= minX) { b.x = minX; b.vx = Math.abs(b.vx) * 0.85; }
            if (b.x >= maxX) { b.x = maxX; b.vx = -Math.abs(b.vx) * 0.85; }
            if (b.y <= minY) { b.y = minY; b.vy = Math.abs(b.vy) * 0.85; }
            if (b.y >= maxY) { b.y = maxY; b.vy = -Math.abs(b.vy) * 0.85; }

            // Toplar arası elastik çarpışma (Momentum transferi)
            for (let j = i + 1; j < this.balls.length; j++) {
                const b2 = this.balls[j];
                if (!b2.isAlive) continue;

                const cdx = b2.x - b.x;
                const cdy = b2.y - b.y;
                const cdistSq = cdx * cdx + cdy * cdy;
                const minDist = b.radius + b2.radius;

                if (cdistSq < minDist * minDist && cdistSq > 0.001) {
                    const cdist = Math.sqrt(cdistSq);
                    const cnx = cdx / cdist;
                    const cny = cdy / cdist;

                    const overlap = (minDist - cdist) * 0.5;
                    b.x -= cnx * overlap;
                    b.y -= cny * overlap;
                    b2.x += cnx * overlap;
                    b2.y += cny * overlap;

                    const kx = b.vx - b2.vx;
                    const ky = b.vy - b2.vy;
                    const p = 2 * (cnx * kx + cny * ky) / 2;
                    b.vx -= p * cnx * 0.85;
                    b.vy -= p * cny * 0.85;
                    b2.vx += p * cnx * 0.85;
                    b2.vy += p * cny * 0.85;

                    if (soundSynth && Math.random() < 0.25) {
                        soundSynth.addPlink(currentTime, soundSynth.getFrequency(i + j), (b.x - 540) / 470, 0.25);
                    }
                }
            }
        }
    }

    _createSwallowParticles(x, y, color) {
        for (let i = 0; i < 24; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 60 + Math.random() * 180;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color,
                radius: 2 + Math.random() * 4,
                life: 0.9,
                decay: 2.0
            });
        }
    }

    render(ctx, currentTime) {
        ctx.save();

        // 1. Zemin (Derin Kozmik Boşluk)
        ctx.fillStyle = '#020108';
        ctx.fillRect(0, 0, 1080, 1920);

        // 2. Üst Skor ve Hayatta Kalma Başlığı
        const survivors = this.balls.filter(b => b.isAlive).length;

        ctx.fillStyle = '#ffffff';
        ctx.font = '900 30px "Orbitron", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🕳️ BLACK HOLE GRAVITY • ESCAPE OR DIE!', 540, SAFE_ZONE.startY + 20);

        ctx.font = '900 34px "Orbitron", sans-serif';
        ctx.fillStyle = survivors <= 3 ? '#ff0055' : (survivors <= 10 ? '#ffd700' : '#00f0ff');
        ctx.fillText(`THRUSTING: ${survivors} / ${this.totalBalls} (SWALLOWED: ${this.swallowedCount})`, 540, SAFE_ZONE.startY + 65);

        // 3. Kara Delik Çekim Akresyon Işınları (İçeri Çekilen Spiral Tozlar)
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < this.accretionRays.length; i++) {
            const ray = this.accretionRays[i];
            const rx = this.centerX + Math.cos(ray.angle) * ray.dist;
            const ry = this.centerY + Math.sin(ray.angle) * ray.dist;

            ctx.fillStyle = ray.color;
            ctx.globalAlpha = Math.min(0.6, (500 - ray.dist) / 300);
            ctx.beginPath();
            ctx.arc(rx, ry, ray.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();

        // 4. Şok Dalgaları
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < this.shockwaves.length; i++) {
            const sw = this.shockwaves[i];
            ctx.strokeStyle = sw.color;
            ctx.globalAlpha = Math.max(0, sw.alpha);
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
            ctx.stroke();
        }
        ctx.restore();

        // 5. Merkezdeki Kara Delik (Pulsing Black Hole & Event Horizon)
        ctx.save();
        const pulse = 1.0 + Math.sin(currentTime * 9) * 0.07;

        // Dış Işıma Halkası (Accretion Glowing Disk)
        ctx.globalCompositeOperation = 'lighter';
        const grad = ctx.createRadialGradient(
            this.centerX, this.centerY, this.holeRadius * 0.8,
            this.centerX, this.centerY, this.holeRadius * 2.2 * pulse
        );
        grad.addColorStop(0, 'rgba(217, 70, 239, 0.85)');
        grad.addColorStop(0.4, 'rgba(168, 85, 247, 0.4)');
        grad.addColorStop(0.8, 'rgba(56, 189, 248, 0.2)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(this.centerX, this.centerY, this.holeRadius * 2.2 * pulse, 0, Math.PI * 2);
        ctx.fill();

        // Dönen Neon İnce Çemberler
        ctx.strokeStyle = '#f43f5e';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(this.centerX, this.centerY, this.holeRadius * 1.35 * pulse, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(this.centerX, this.centerY, this.holeRadius * 1.15 * pulse, 0, Math.PI * 2);
        ctx.stroke();

        // Olay Ufku (Simsiyah Çekirdek - Singularity)
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(this.centerX, this.centerY, this.holeRadius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.restore();

        // 6. Roket Parçacıkları (Alevler)
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];
            ctx.fillStyle = p.color;
            ctx.globalAlpha = Math.max(0, p.life);
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();

        // 7. Yörünge Topları & Kaçış Roketleri
        for (let i = 0; i < this.balls.length; i++) {
            const b = this.balls[i];
            if (!b.isAlive) continue;

            const dx = this.centerX - b.x;
            const dy = this.centerY - b.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const nx = dx / dist;
            const ny = dy / dist;

            // Kuyruk Çizimi
            b.trail.push({ x: b.x, y: b.y });
            if (b.trail.length > 10) b.trail.shift();

            for (let k = 0; k < b.trail.length; k++) {
                const tr = b.trail[k];
                ctx.fillStyle = b.color;
                ctx.globalAlpha = (k / b.trail.length) * 0.35;
                ctx.beginPath();
                ctx.arc(tr.x, tr.y, b.radius * (0.3 + k * 0.07), 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1.0;

            // [GÖRSEL EFEKT]: Roket İticisi (Thruster Jet Flame)
            // Kara deliğin aksi yönüne alev jeti çiz
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            const flameLen = 14 + b.strain * 24;
            const flameX = b.x - nx * (b.radius + flameLen);
            const flameY = b.y - ny * (b.radius + flameLen);

            ctx.strokeStyle = b.strain > 0.5 ? '#ff5500' : '#00f0ff';
            ctx.lineWidth = 4 + b.strain * 4;
            ctx.beginPath();
            ctx.moveTo(b.x - nx * b.radius, b.y - ny * b.radius);
            ctx.lineTo(flameX, flameY);
            ctx.stroke();

            // İtici iç çekirdek beyaz alevi
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(b.x - nx * b.radius, b.y - ny * b.radius);
            ctx.lineTo(b.x - nx * (b.radius + flameLen * 0.5), b.y - ny * (b.radius + flameLen * 0.5));
            ctx.stroke();
            ctx.restore();

            // [SPAGHETTIFICATION]: Çekim alanında uzama deformasyonu
            ctx.save();
            ctx.translate(b.x, b.y);
            const stretchAngle = Math.atan2(dy, dx);
            ctx.rotate(stretchAngle);

            const stretchFactor = 1.0 + b.strain * 0.5; // Kara deliğe doğru uzama
            const squashFactor = 1.0 / Math.sqrt(stretchFactor);

            ctx.scale(stretchFactor, squashFactor);

            // Top Gövdesi
            ctx.fillStyle = b.color;
            ctx.beginPath();
            ctx.arc(0, 0, b.radius, 0, Math.PI * 2);
            ctx.fill();

            // Beyaz Parlak Çekirdek
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(0, 0, b.radius * 0.45, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        }

        // 8. Zafer Ekranı
        if (survivors <= 1 || currentTime >= 26.5) {
            ctx.globalCompositeOperation = 'source-over';
            ctx.fillStyle = 'rgba(0, 0, 0, 0.78)';
            ctx.fillRect(0, 0, 1080, 1920);

            ctx.fillStyle = '#a855f7';
            ctx.font = '900 76px "Orbitron", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('ESCAPE!', 540, 840);

            ctx.fillStyle = '#ffffff';
            ctx.font = '900 36px "Orbitron", sans-serif';
            ctx.fillText(`GRAVITATIONAL SLINGSHOT VICTORY!`, 540, 930);

            ctx.fillStyle = '#ffd700';
            ctx.font = '700 28px "Orbitron", sans-serif';
            ctx.fillText('COMMENT FOR NEXT VORTEX! 👇', 540, 1000);
        }

        ctx.restore();
    }
}
