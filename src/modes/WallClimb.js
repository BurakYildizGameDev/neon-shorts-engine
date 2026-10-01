// src/modes/WallClimb.js
import { SAFE_ZONE } from '../config/SafeZone.js';
import { PRNG } from '../generator/PRNG.js';

/**
 * 🧗 DİKEY DUVAR TIRMANIŞI (NINJA WALL CLIMB)
 * Yan yana iki dar neon tırmanış koridoru.
 * İki yarışçı top zikzak sekerek duvarlar arasında yukarı doğru tırmanır.
 * Zirvedeki altın zili ilk çalan kazanır!
 */
export class WallClimbMode {
    constructor(seed = 1) {
        this.name = 'Ninja Wall Climb';
        this.seed = seed;
        this.rng = new PRNG(seed * 543 + 28);
        this.duration = 28.0;

        this.climbers = [];
        this.particles = [];
        this.winner = null;
        this.screenShake = 0;
        this.summitY = SAFE_ZONE.startY + 60;

        this.initClimbers();
    }

    initClimbers() {
        this.climbers = [
            {
                id: 1,
                name: '🔴 RED CLIMBER',
                color: '#ff0055',
                wallMinX: 130,
                wallMaxX: 470,
                x: SAFE_ZONE.startX + 120,
                y: SAFE_ZONE.endY - 60,
                vx: 380,
                vy: -320,
                radius: 16,
                score: 0,
                trail: []
            },
            {
                id: 2,
                name: '🔵 BLUE CLIMBER',
                color: '#00d2ff',
                wallMinX: 610,
                wallMaxX: 950,
                x: 540 + 120,
                y: SAFE_ZONE.endY - 60,
                vx: -380,
                vy: -300,
                radius: 16,
                score: 0,
                trail: []
            }
        ];
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

        if (this.winner) return;

        for (let i = 0; i < this.climbers.length; i++) {
            const c = this.climbers[i];

            c.vy += 680 * dt; // Yerçekimi
            c.x += c.vx * dt;
            c.y += c.vy * dt;

            // Yan duvarlardan yukarı açılı sekme (Tırmanma İvmesi)
            if (c.x <= c.wallMinX + c.radius) {
                c.x = c.wallMinX + c.radius;
                c.vx = Math.abs(c.vx) || 380;
                c.vy = -(260 + this.rng.next() * 80); // Yukarı zıpla
                this.screenShake = 1.5;
                this._createWallSparks(c.x, c.y, c.color);
                if (soundSynth) soundSynth.addPlink(currentTime, soundSynth.getFrequency(Math.floor((SAFE_ZONE.endY - c.y) / 80)), -0.5, 0.35);
            }
            if (c.x >= c.wallMaxX - c.radius) {
                c.x = c.wallMaxX - c.radius;
                c.vx = -(Math.abs(c.vx) || 380);
                c.vy = -(260 + this.rng.next() * 80);
                this.screenShake = 1.5;
                this._createWallSparks(c.x, c.y, c.color);
                if (soundSynth) soundSynth.addPlink(currentTime, soundSynth.getFrequency(Math.floor((SAFE_ZONE.endY - c.y) / 80)), 0.5, 0.35);
            }

            // Alt taban sekmesi
            if (c.y >= SAFE_ZONE.endY - c.radius) {
                c.y = SAFE_ZONE.endY - c.radius;
                c.vy = -450;
            }
        }

        // Zirve kontrolü (aynı karede geçerlerse y değeri daha düşük olan kazanır)
        const winners = this.climbers.filter(c => c.y <= this.summitY);
        if (winners.length > 0) {
            this.winner = winners.length > 1
                ? (winners[0].y < winners[1].y ? winners[0] : winners[1])
                : winners[0];
            this.screenShake = 6.0;
            this._createSummitGlow(this.winner.x, this.summitY);
            if (soundSynth) soundSynth.addBassDrop(currentTime, 180, 40, 1.0);
        }
    }

    _createWallSparks(x, y, color) {
        for (let i = 0; i < 6; i++) {
            const a = -Math.PI / 2 + (this.rng.next() - 0.5) * 1.5;
            const spd = 60 + this.rng.next() * 140;
            this.particles.push({
                x, y,
                vx: Math.cos(a) * spd,
                vy: Math.sin(a) * spd,
                color,
                radius: 2.5,
                life: 0.55
            });
        }
    }

    _createSummitGlow(x, y) {
        for (let i = 0; i < 30; i++) {
            const a = this.rng.next() * Math.PI * 2;
            const spd = 80 + this.rng.next() * 240;
            this.particles.push({
                x, y,
                vx: Math.cos(a) * spd,
                vy: Math.sin(a) * spd,
                color: '#ffd700',
                radius: 3 + this.rng.next() * 3,
                life: 0.95
            });
        }
    }

    render(ctx, currentTime) {
        ctx.save();
        if (this.screenShake > 0) ctx.translate((Math.random() - 0.5) * this.screenShake, (Math.random() - 0.5) * this.screenShake);

        ctx.fillStyle = '#020206';
        ctx.fillRect(0, 0, 1080, 1920);

        ctx.fillStyle = '#ffffff';
        ctx.font = '900 28px "Orbitron", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🧗 NINJA WALL CLIMB • RACE TO THE SUMMIT!', 540, SAFE_ZONE.startY + 20);

        const r1 = this.climbers[0];
        const r2 = this.climbers[1];
        const height1 = Math.min(100, Math.max(0, Math.round(((SAFE_ZONE.endY - r1.y) / (SAFE_ZONE.height - 120 || 1)) * 100)));
        const height2 = Math.min(100, Math.max(0, Math.round(((SAFE_ZONE.endY - r2.y) / (SAFE_ZONE.height - 120 || 1)) * 100)));

        ctx.font = '900 26px "Orbitron", sans-serif';
        ctx.fillStyle = height1 > height2 ? r1.color : r2.color;
        ctx.fillText(`🔴 ${height1}%   ⚔️   ${height2}% 🔵`, 540, SAFE_ZONE.startY + 65);

        // Duvar Çizimleri
        ctx.globalCompositeOperation = 'lighter';
        this.climbers.forEach(c => {
            ctx.strokeStyle = c.color;
            ctx.lineWidth = 4;
            // Sol Duvar
            ctx.beginPath();
            ctx.moveTo(c.wallMinX, this.summitY);
            ctx.lineTo(c.wallMinX, SAFE_ZONE.endY);
            ctx.stroke();

            // Sağ Duvar
            ctx.beginPath();
            ctx.moveTo(c.wallMaxX, this.summitY);
            ctx.lineTo(c.wallMaxX, SAFE_ZONE.endY);
            ctx.stroke();
        });

        // Zirve Zilleri
        ctx.fillStyle = '#ffd700';
        ctx.font = '900 28px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🔔', (r1.wallMinX + r1.wallMaxX) / 2, this.summitY + 10);
        ctx.fillText('🔔', (r2.wallMinX + r2.wallMaxX) / 2, this.summitY + 10);

        // Parçacıklar
        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];
            ctx.fillStyle = p.color;
            ctx.globalAlpha = Math.max(0, p.life);
            ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalAlpha = 1.0;

        // Tırmanıcılar
        this.climbers.forEach(c => {
            c.trail.push({ x: c.x, y: c.y });
            if (c.trail.length > 8) c.trail.shift();

            for (let k = 0; k < c.trail.length; k++) {
                const tr = c.trail[k];
                ctx.fillStyle = c.color;
                ctx.globalAlpha = (k / c.trail.length) * 0.4;
                ctx.beginPath(); ctx.arc(tr.x, tr.y, c.radius * (0.3 + k * 0.08), 0, Math.PI * 2); ctx.fill();
            }
            ctx.globalAlpha = 1.0;

            ctx.fillStyle = c.color;
            ctx.beginPath(); ctx.arc(c.x, c.y, c.radius, 0, Math.PI * 2); ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.beginPath(); ctx.arc(c.x, c.y, c.radius * 0.45, 0, Math.PI * 2); ctx.fill();
        });

        // Zafer Ekranı
        if (this.winner || currentTime >= 26.5) {
            const champ = this.winner || (height1 > height2 ? r1 : r2);
            ctx.globalCompositeOperation = 'source-over';
            ctx.fillStyle = 'rgba(0, 0, 0, 0.78)';
            ctx.fillRect(0, 0, 1080, 1920);

            ctx.fillStyle = champ.color;
            ctx.font = '900 76px "Orbitron", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('CLIMBED!', 540, 840);

            ctx.fillStyle = '#ffd700';
            ctx.font = '900 48px "Orbitron", sans-serif';
            ctx.fillText(`${champ.name} REACHED THE TOP! 🏆`, 540, 930);
        }

        ctx.restore();
    }
}
