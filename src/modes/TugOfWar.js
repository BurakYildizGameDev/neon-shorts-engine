// src/modes/TugOfWar.js
import { SAFE_ZONE } from '../config/SafeZone.js';
import { PRNG } from '../generator/PRNG.js';

/**
 * 🪢 ENERJİ HALAT ÇEKMECE (ENERGY TUG OF WAR)
 * Kırmızı ve Mavi takımlar (veya seçilen ülkeler/derbiler).
 * Toplar kendi taraflarındaki enerji tamponlarına vurdukça
 * ortadaki devasa parlayan enerji düğümünü kendi tarafına çeker!
 */
export class TugOfWarMode {
    constructor(seed = 1, options = {}) {
        this.name = 'Tug of War';
        this.seed = seed;
        this.rng = new PRNG(seed * 432 + 19);
        this.duration = 28.0;

        this.teams = (options.teams && options.teams.length >= 2) ? options.teams : [
            { id: 'red', name: 'RED TEAM', flag: '🔴', color: '#ff0055' },
            { id: 'blue', name: 'BLUE TEAM', flag: '🔵', color: '#00d2ff' }
        ];

        this.balls = [];
        this.particles = [];
        this.knotX = 540; // Ortadaki enerji düğümü
        this.knotTargetX = 540;
        this.knotY = 850;
        this.winThreshold = 320; // 540 +- 320 piksel çekince zafer
        this.winner = null;
        this.screenShake = 0;

        this.initBalls();
    }

    initBalls() {
        this.balls = [];
        // Her takım için 5 dinamik top
        for (let t = 0; t < 2; t++) {
            const team = this.teams[t];
            const startX = t === 0 ? 320 : 760;

            for (let i = 0; i < 5; i++) {
                const angle = this.rng.range(0, Math.PI * 2);
                const speed = this.rng.range(440, 620);
                this.balls.push({
                    id: `${team.id}_${i}`,
                    teamIndex: t,
                    team,
                    x: startX + (Math.random() - 0.5) * 60,
                    y: 850 + (i - 2) * 80,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    radius: 16,
                    color: team.color,
                    flag: team.flag,
                    trail: []
                });
            }
        }
    }

    update(currentTime, dt, soundSynth) {
        if (this.screenShake > 0) this.screenShake = Math.max(0, this.screenShake - dt * 5);

        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.life -= dt * 2.5;
            if (p.life <= 0) this.particles.splice(i, 1);
        }

        // Düğüm yumuşak kayma
        this.knotX += (this.knotTargetX - this.knotX) * dt * 5;

        // Kazanan kontrolü
        if (this.knotX <= 540 - this.winThreshold && !this.winner) {
            this.winner = this.teams[0];
            if (soundSynth) soundSynth.addBassDrop(currentTime, 180, 40, 1.0);
        } else if (this.knotX >= 540 + this.winThreshold && !this.winner) {
            this.winner = this.teams[1];
            if (soundSynth) soundSynth.addBassDrop(currentTime, 180, 40, 1.0);
        }

        // Topları güncelle
        for (let i = 0; i < this.balls.length; i++) {
            const b = this.balls[i];

            b.x += b.vx * dt;
            b.y += b.vy * dt;

            // Yan duvarlar (Takım tamponları)
            const minX = SAFE_ZONE.startX + b.radius;
            const maxX = SAFE_ZONE.endX - b.radius;
            const minY = SAFE_ZONE.startY + 90 + b.radius;
            const maxY = SAFE_ZONE.endY - b.radius;

            if (b.x <= minX) {
                b.x = minX; b.vx = Math.abs(b.vx);
                if (b.teamIndex === 0) {
                    this.knotTargetX = Math.max(540 - this.winThreshold, this.knotTargetX - 12);
                    this.screenShake = 2.0;
                    this._createSparks(b.x, b.y, b.color);
                    if (soundSynth) soundSynth.addPlink(currentTime, soundSynth.getFrequency(7), -0.7, 0.4);
                }
            }
            if (b.x >= maxX) {
                b.x = maxX; b.vx = -Math.abs(b.vx);
                if (b.teamIndex === 1) {
                    this.knotTargetX = Math.min(540 + this.winThreshold, this.knotTargetX + 12);
                    this.screenShake = 2.0;
                    this._createSparks(b.x, b.y, b.color);
                    if (soundSynth) soundSynth.addPlink(currentTime, soundSynth.getFrequency(9), 0.7, 0.4);
                }
            }
            if (b.y <= minY) { b.y = minY; b.vy = Math.abs(b.vy); }
            if (b.y >= maxY) { b.y = maxY; b.vy = -Math.abs(b.vy); }

            // Ortadaki düğümle çarpışma
            const kdx = b.x - this.knotX;
            const kdy = b.y - this.knotY;
            const kdist = Math.hypot(kdx, kdy);
            if (kdist < b.radius + 32) {
                const knx = kdx / kdist;
                const kny = kdy / kdist;
                b.vx = knx * (450 + Math.random() * 150);
                b.vy = kny * (450 + Math.random() * 150);

                // Düğümü kendi tarafına çek
                const pullDir = (b.teamIndex === 0) ? -16 : 16;
                this.knotTargetX = Math.max(540 - this.winThreshold, Math.min(540 + this.winThreshold, this.knotTargetX + pullDir));
                this._createSparks(this.knotX, this.knotY, '#ffd700');
                if (soundSynth) soundSynth.addGateDing(currentTime, 1.8);
            }
        }
    }

    _createSparks(x, y, color) {
        for (let i = 0; i < 8; i++) {
            const a = Math.random() * Math.PI * 2;
            const spd = 70 + Math.random() * 150;
            this.particles.push({
                x, y,
                vx: Math.cos(a) * spd,
                vy: Math.sin(a) * spd,
                color,
                radius: 2.5,
                life: 0.6
            });
        }
    }

    render(ctx, currentTime) {
        ctx.save();
        if (this.screenShake > 0) ctx.translate((Math.random() - 0.5) * this.screenShake, (Math.random() - 0.5) * this.screenShake);

        ctx.fillStyle = '#030207';
        ctx.fillRect(0, 0, 1080, 1920);

        // Üst HUD
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 28px "Orbitron", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🪢 TUG OF WAR • PULL THE CORE!', 540, SAFE_ZONE.startY + 20);

        const t1 = this.teams[0];
        const t2 = this.teams[1];
        const pullPct1 = Math.round(((540 - this.knotX + this.winThreshold) / (this.winThreshold * 2)) * 100);
        const pullPct2 = 100 - pullPct1;

        ctx.font = '900 26px "Orbitron", sans-serif';
        ctx.fillStyle = pullPct1 > pullPct2 ? t1.color : t2.color;
        ctx.fillText(`${t1.flag} ${t1.name}: ${pullPct1}%   ⚔️   ${pullPct2}% :${t2.name} ${t2.flag}`, 540, SAFE_ZONE.startY + 65);

        // Halat Çizgisi
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(SAFE_ZONE.startX + 20, this.knotY);
        ctx.lineTo(SAFE_ZONE.endX - 20, this.knotY);
        ctx.stroke();

        // Enerji Düğümü
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(this.knotX, this.knotY, 32, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(this.knotX, this.knotY, 38 + Math.sin(currentTime * 10) * 4, 0, Math.PI * 2);
        ctx.stroke();

        // Parçacıklar
        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];
            ctx.fillStyle = p.color;
            ctx.globalAlpha = Math.max(0, p.life);
            ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalAlpha = 1.0;

        // Toplar
        for (let i = 0; i < this.balls.length; i++) {
            const b = this.balls[i];

            b.trail.push({ x: b.x, y: b.y });
            if (b.trail.length > 8) b.trail.shift();

            for (let k = 0; k < b.trail.length; k++) {
                const tr = b.trail[k];
                ctx.fillStyle = b.color;
                ctx.globalAlpha = (k / b.trail.length) * 0.35;
                ctx.beginPath(); ctx.arc(tr.x, tr.y, b.radius * (0.3 + k * 0.08), 0, Math.PI * 2); ctx.fill();
            }
            ctx.globalAlpha = 1.0;

            ctx.fillStyle = b.color;
            ctx.beginPath(); ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2); ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.font = '14px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(b.flag, b.x, b.y);
        }

        // Zafer Ekranı
        if (this.winner || currentTime >= 26.5) {
            const champ = this.winner || (pullPct1 > pullPct2 ? t1 : t2);
            ctx.globalCompositeOperation = 'source-over';
            ctx.fillStyle = 'rgba(0, 0, 0, 0.78)';
            ctx.fillRect(0, 0, 1080, 1920);

            ctx.fillStyle = champ.color;
            ctx.font = '900 76px "Orbitron", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('PULL VICTORY!', 540, 840);

            ctx.fillStyle = '#ffffff';
            ctx.font = '900 48px "Orbitron", sans-serif';
            ctx.fillText(`${champ.flag} ${champ.name} WINS! 🏆`, 540, 930);
        }

        ctx.restore();
    }
}
