// src/modes/TerritoryWar.js
import { SAFE_ZONE } from '../config/SafeZone.js';
import { PRNG } from '../generator/PRNG.js';

/**
 * 🇹🇷 vs 🇧🇷 DEVLET BÖLGE SAVAŞI (NATION TERRITORY CONQUEST)
 * Ekrandaki 748 neon bloğu kendi bayrağına/rengine boyama savaşı.
 * Varsayılan: Türkiye vs Brezilya (veya UI'dan seçilen herhangi 2 ya da 4 ülke).
 * Topların üstünde canlı bayraklar, gerçek zamanlı yüzdelik HUD ve ASMR vuruş sesleri.
 */
export class TerritoryWarMode {
    constructor(seed = 1, options = {}) {
        this.name = 'Territory War';
        this.seed = seed;
        this.rng = new PRNG(seed * 4321 + 17);

        // Varsayılan Devletler (Kullanıcı seçimi yoksa 🇹🇷 vs 🇧🇷)
        this.teams = (options.teams && options.teams.length >= 2) ? options.teams : [
            { id: 'tr', name: 'TÜRKİYE', flag: '🇹🇷', color: '#e30a17', accent: '#ffffff', score: 0 },
            { id: 'br', name: 'BREZİLYA', flag: '🇧🇷', color: '#009c3b', accent: '#ffdf00', score: 0 }
        ];

        // Izgara Yapılandırması (SafeZone içine oturan yüksek çözünürlüklü neon grid)
        this.cols = 22;
        this.rows = 34;
        this.gridStartX = SAFE_ZONE.startX + 20;
        this.gridStartY = SAFE_ZONE.startY + 80;
        this.gridWidth = SAFE_ZONE.width - 40;
        this.gridHeight = SAFE_ZONE.height - 120;
        this.cellW = this.gridWidth / this.cols;
        this.cellH = this.gridHeight / this.rows;

        this.tiles = [];
        this.balls = [];
        this.particles = [];
        this.totalTiles = this.cols * this.rows;
        this.winner = null;
        this.duration = 28.0;

        this.initGrid();
        this.initBalls();
    }

    initGrid() {
        this.tiles = [];
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                // Başlangıçta ekranı takımlar arasında adil böl
                let teamIndex = 0;
                if (this.teams.length === 2) {
                    teamIndex = (c < this.cols / 2) ? 0 : 1;
                } else if (this.teams.length === 4) {
                    const left = c < this.cols / 2;
                    const top = r < this.rows / 2;
                    teamIndex = top ? (left ? 0 : 1) : (left ? 2 : 3);
                } else {
                    teamIndex = Math.floor((c / this.cols) * this.teams.length);
                }

                this.tiles.push({
                    col: c,
                    row: r,
                    x: this.gridStartX + c * this.cellW,
                    y: this.gridStartY + r * this.cellH,
                    team: teamIndex,
                    pulse: 0
                });
            }
        }
        this.updateScores();
    }

    initBalls() {
        this.balls = [];
        // Her ülke için 2 enerjik boyama topu
        this.teams.forEach((team, tIdx) => {
            let startX = this.gridStartX + this.gridWidth * 0.5;
            let startY = this.gridStartY + this.gridHeight * 0.5;

            if (this.teams.length === 2) {
                startX = (tIdx === 0) ? this.gridStartX + this.gridWidth * 0.25 : this.gridStartX + this.gridWidth * 0.75;
            } else if (this.teams.length === 4) {
                const isLeft = (tIdx % 2 === 0);
                const isTop = (tIdx < 2);
                startX = isLeft ? this.gridStartX + this.gridWidth * 0.25 : this.gridStartX + this.gridWidth * 0.75;
                startY = isTop ? this.gridStartY + this.gridHeight * 0.25 : this.gridStartY + this.gridHeight * 0.75;
            }

            for (let b = 0; b < 2; b++) {
                const angle = this.rng.range(0, Math.PI * 2);
                const speed = this.rng.range(560, 720);
                this.balls.push({
                    id: `${team.id}_${b}`,
                    teamIndex: tIdx,
                    team: team,
                    x: startX + (b * 32 - 16),
                    y: startY + (b * 36 - 18),
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    radius: 17,
                    color: team.color,
                    flag: team.flag || '🏳️',
                    name: team.name,
                    trail: []
                });
            }
        });
    }

    updateScores() {
        this.teams.forEach(t => t.score = 0);
        for (let i = 0; i < this.tiles.length; i++) {
            const tile = this.tiles[i];
            if (this.teams[tile.team]) {
                this.teams[tile.team].score++;
            }
        }
    }

    update(currentTime, dt, soundSynth) {
        if (currentTime >= this.duration) {
            if (!this.winner) {
                let maxScore = -1;
                this.teams.forEach(t => {
                    if (t.score > maxScore) {
                        maxScore = t.score;
                        this.winner = t;
                    }
                });
                if (soundSynth) {
                    soundSynth.addBassDrop(currentTime, 160, 40, 1.0);
                }
            }
            return;
        }

        // Parçacıkları güncelle
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.life -= dt * 2.5;
            if (p.life <= 0) this.particles.splice(i, 1);
        }

        // Kiremit vuruş darbelerini söndür
        for (let i = 0; i < this.tiles.length; i++) {
            if (this.tiles[i].pulse > 0) {
                this.tiles[i].pulse = Math.max(0, this.tiles[i].pulse - dt * 4);
            }
        }

        // Topları güncelle ve çarpışmaları çöz
        for (let i = 0; i < this.balls.length; i++) {
            const b = this.balls[i];

            b.x += b.vx * dt;
            b.y += b.vy * dt;

            // Sınır Çarpışmaları (SafeZone Grid sınırları)
            const minX = this.gridStartX + b.radius;
            const maxX = this.gridStartX + this.gridWidth - b.radius;
            const minY = this.gridStartY + b.radius;
            const maxY = this.gridStartY + this.gridHeight - b.radius;

            if (b.x <= minX) { b.x = minX; b.vx = Math.abs(b.vx); this._onHit(b, b.x, b.y, soundSynth, currentTime); }
            if (b.x >= maxX) { b.x = maxX; b.vx = -Math.abs(b.vx); this._onHit(b, b.x, b.y, soundSynth, currentTime); }
            if (b.y <= minY) { b.y = minY; b.vy = Math.abs(b.vy); this._onHit(b, b.x, b.y, soundSynth, currentTime); }
            if (b.y >= maxY) { b.y = maxY; b.vy = -Math.abs(b.vy); this._onHit(b, b.x, b.y, soundSynth, currentTime); }

            // Kiremit boyama kontrolü
            const col = Math.floor((b.x - this.gridStartX) / this.cellW);
            const row = Math.floor((b.y - this.gridStartY) / this.cellH);

            if (col >= 0 && col < this.cols && row >= 0 && row < this.rows) {
                const idx = row * this.cols + col;
                const tile = this.tiles[idx];
                if (tile && tile.team !== b.teamIndex) {
                    tile.team = b.teamIndex;
                    tile.pulse = 1.0;
                    this._onHit(b, tile.x + this.cellW / 2, tile.y + this.cellH / 2, soundSynth, currentTime, true);
                    this.updateScores();
                }
            }
        }
    }

    _onHit(ball, x, y, soundSynth, currentTime, isTile = false) {
        for (let k = 0; k < (isTile ? 3 : 2); k++) {
            const angle = Math.random() * Math.PI * 2;
            const spd = 60 + Math.random() * 140;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * spd,
                vy: Math.sin(angle) * spd,
                color: ball.color,
                radius: 2 + Math.random() * 2,
                life: 0.75
            });
        }

        if (soundSynth) {
            const pan = (x - 540) / 470;
            const pitch = soundSynth.getFrequency(Math.floor(x / 40) + Math.floor(y / 40));
            soundSynth.addPlink(currentTime, pitch, pan, 0.35);
        }
    }

    render(ctx, currentTime) {
        ctx.save();

        // 1. Zemin
        ctx.fillStyle = '#030408';
        ctx.fillRect(0, 0, 1080, 1920);

        // 2. Üst Canlı Skor ve Yüzde HUD'ı
        this._renderHUD(ctx);

        // 3. Neon Izgara Blokları
        for (let i = 0; i < this.tiles.length; i++) {
            const t = this.tiles[i];
            const team = this.teams[t.team];
            const baseColor = team ? team.color : '#222';

            ctx.fillStyle = baseColor + (t.pulse > 0.05 ? 'ee' : '48');
            ctx.fillRect(t.x + 1, t.y + 1, this.cellW - 2, this.cellH - 2);

            if (t.pulse > 0.1) {
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 1.5;
                ctx.strokeRect(t.x + 1, t.y + 1, this.cellW - 2, this.cellH - 2);
            }
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

        // 5. Ülke Bayraklı Toplar
        for (let i = 0; i < this.balls.length; i++) {
            const b = this.balls[i];

            // Hareket Kuyruğu
            b.trail.push({ x: b.x, y: b.y });
            if (b.trail.length > 10) b.trail.shift();

            for (let k = 0; k < b.trail.length; k++) {
                const tr = b.trail[k];
                ctx.fillStyle = b.color;
                ctx.globalAlpha = (k / b.trail.length) * 0.4;
                ctx.beginPath();
                ctx.arc(tr.x, tr.y, b.radius * (0.35 + k * 0.06), 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1.0;

            // Dış Parlama
            ctx.fillStyle = b.color;
            ctx.globalAlpha = 0.45;
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.radius * 1.7, 0, Math.PI * 2);
            ctx.fill();

            ctx.globalAlpha = 1.0;
            ctx.fillStyle = b.color;
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
            ctx.fill();

            // Beyaz Dış Halka
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
            ctx.stroke();

            // Bayrak / Simge Topun Ortasında
            ctx.font = '15px "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(b.flag || '⚔️', b.x, b.y + 1);

            // [VİRAL ÖZELLİK]: Top Üzerinde İsim Etiketi (Takipçi/Takım Adı)
            if (b.name) {
                ctx.font = '900 12px "Orbitron", sans-serif';
                ctx.fillStyle = '#ffffff';
                ctx.fillText(b.name, b.x, b.y - b.radius - 6);
            }
        }

        // 6. Zafer Ekranı (Climax Finish)
        if (currentTime >= 26.5 && this.winner) {
            ctx.globalCompositeOperation = 'source-over';
            ctx.fillStyle = 'rgba(0, 0, 0, 0.78)';
            ctx.fillRect(0, 0, 1080, 1920);

            ctx.fillStyle = this.winner.color;
            ctx.font = '900 80px "Orbitron", sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('VICTORY!', 540, 860);

            ctx.font = '900 52px "Orbitron", sans-serif';
            ctx.fillStyle = '#ffffff';
            ctx.fillText(`${this.winner.flag} ${this.winner.name}`, 540, 960);

            const pct = Math.round((this.winner.score / this.totalTiles) * 100);
            ctx.font = '700 32px "Orbitron", sans-serif';
            ctx.fillStyle = '#ffd700';
            ctx.fillText(`DOMINATION: ${pct}%`, 540, 1040);
        }

        ctx.restore();
    }

    _renderHUD(ctx) {
        ctx.globalCompositeOperation = 'source-over';
        const hudY = SAFE_ZONE.startY + 10;
        const total = this.totalTiles || 1;

        // Üst Kanca Başlığı
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 28px "Orbitron", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('⚡ NATION WAR ⚔️ WHO WILL CONQUER?', 540, hudY);

        // Canlı Yüzde Çubukları
        const barY = hudY + 22;
        const barW = SAFE_ZONE.width - 40;
        const barH = 28;
        const barX = SAFE_ZONE.startX + 20;

        let accumulatedX = barX;
        this.teams.forEach(t => {
            const pct = t.score / total;
            const w = barW * pct;
            ctx.fillStyle = t.color;
            ctx.fillRect(accumulatedX, barY, w, barH);
            accumulatedX += w;
        });

        // Çerçeve
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.strokeRect(barX, barY, barW, barH);

        // Yüzde ve Bayrak Yazıları
        ctx.font = '900 17px "Orbitron", sans-serif';
        ctx.fillStyle = '#ffffff';

        if (this.teams.length === 2) {
            const p1 = Math.round((this.teams[0].score / total) * 100);
            const p2 = Math.round((this.teams[1].score / total) * 100);
            ctx.textAlign = 'left';
            ctx.fillText(`${this.teams[0].flag} ${this.teams[0].name}: ${p1}%`, barX + 12, barY + 20);
            ctx.textAlign = 'right';
            ctx.fillText(`${p2}% :${this.teams[1].name} ${this.teams[1].flag}`, barX + barW - 12, barY + 20);
        } else {
            // 4 Takım Durumu
            ctx.font = '900 13px "Orbitron", sans-serif';
            ctx.textAlign = 'center';
            const segW = barW / this.teams.length;
            this.teams.forEach((t, idx) => {
                const pct = Math.round((t.score / total) * 100);
                ctx.fillText(`${t.flag} ${pct}%`, barX + segW * (idx + 0.5), barY + 19);
            });
        }
    }
}
