// src/modes/StairRace.js
import { SAFE_ZONE } from '../config/SafeZone.js';
import { PRNG } from '../generator/PRNG.js';

/**
 * 🪜 32 BASAMAKLI DEV MERDİVEN YARIŞI (EPIC 32-STEP STAIR CLIMB)
 * Ekranın en altından en tepedeki altın kupaya uzanan 32 devasa basamak.
 * Süper trambolin basamaklar, hızlandırıcılar, nefes kesen liderlik değişimleri
 * ve zirvede 1080x1920 dikey ekrana tam oturan ASMR tırmanış düellosu.
 */
export class StairRaceMode {
    constructor(seed = 1) {
        this.name = 'Stair Race';
        this.seed = seed;
        this.rng = new PRNG(seed * 321 + 55);

        this.duration = 28.0;
        this.totalSteps = 32; // [GÜNCELLEME]: 18'den 32 basamağa çıkarıldı
        this.stairs = [];
        this.racers = [];
        this.particles = [];
        this.trophy = { x: 540, y: 250, radius: 46 };
        this.winner = null;

        this.initStairs();
        this.initRacers();
    }

    initStairs() {
        this.stairs = [];
        const count = this.totalSteps;
        const startY = 1480;
        const endY = 320;
        const stepY = (startY - endY) / count; // Yaklaşık 36.25 px aralık
        const colors = ['#00f0ff', '#ff0055', '#00ff88', '#a855f7', '#38bdf8', '#ff7700'];

        for (let i = 0; i < count; i++) {
            const y = startY - i * stepY;

            // Zig-zag ve dinamik genişlik
            const isLeft = (i % 2 === 0);
            const w = this.rng.range(170, 240);
            const x = isLeft ? 540 - w * 0.95 : 540 + w * 0.05;

            // Özel Basamaklar: 
            // Her 5-6 basamakta bir Altın Zıplama Trambolini (Spring)
            const isSpring = (i > 1 && i < count - 1 && (i % 5 === 0 || this.rng.next() < 0.18));
            // Hızlandırıcı basamak (Boost)
            const isBoost = (!isSpring && this.rng.next() < 0.15);

            this.stairs.push({
                index: i + 1,
                x,
                y,
                w,
                h: 15,
                color: isSpring ? '#ffd700' : (isBoost ? '#ff0055' : colors[i % colors.length]),
                isSpring,
                isBoost,
                pulse: 0
            });
        }
    }

    initRacers() {
        this.racers = [
            {
                id: 1,
                name: '🔴 RED ROCKET',
                color: '#ff0055',
                x: 430,
                y: 1500,
                vx: 130,
                vy: -580,
                currentStep: 0,
                leadTime: 0,
                trail: []
            },
            {
                id: 2,
                name: '🔵 BLUE BOLT',
                color: '#00d2ff',
                x: 650,
                y: 1500,
                vx: -130,
                vy: -560,
                currentStep: 0,
                leadTime: 0,
                trail: []
            }
        ];
    }

    update(currentTime, dt, soundSynth) {
        // 1. Parçacıklar
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.life -= dt * 2.2;
            if (p.life <= 0) this.particles.splice(i, 1);
        }

        // 2. Basamak parlamalarını söndür
        for (let i = 0; i < this.stairs.length; i++) {
            if (this.stairs[i].pulse > 0) this.stairs[i].pulse -= dt * 3.5;
        }

        if (this.winner) return;

        // 3. Yarışçıları güncelle (Fizik, Tırmanma & Trambolin Zıplamaları)
        for (let rIdx = 0; rIdx < this.racers.length; rIdx++) {
            const r = this.racers[rIdx];

            r.vy += 780 * dt; // Dengelenmiş yerçekimi
            r.x += r.vx * dt;
            r.y += r.vy * dt;

            // Yan duvar sınırları (Ekrandan düşmeyi engelle)
            if (r.x < SAFE_ZONE.startX + 25) {
                r.x = SAFE_ZONE.startX + 25;
                r.vx = Math.abs(r.vx) * 0.95;
            }
            if (r.x > SAFE_ZONE.endX - 25) {
                r.x = SAFE_ZONE.endX - 25;
                r.vx = -Math.abs(r.vx) * 0.95;
            }

            // Basamaklarla temas (Aşağı düşerken ayağı basamağa basar)
            if (r.vy > 0) {
                for (let i = 0; i < this.stairs.length; i++) {
                    const st = this.stairs[i];
                    if (r.x >= st.x - 5 && r.x <= st.x + st.w + 5 && Math.abs(r.y + 13 - st.y) < 16) {
                        r.y = st.y - 13;

                        // Zıplama Gücü: Normal basamak -510, Spring basamak -760 (3 basamak birden fırlar)
                        let bounce = -510;
                        if (st.isSpring) bounce = -750;
                        if (st.isBoost) bounce = -620;

                        r.vy = bounce;

                        // Zig-zag rotayı devam ettirecek yatay hız
                        const dir = (st.x < 540) ? 1 : -1;
                        r.vx = dir * (170 + Math.random() * 90);

                        r.currentStep = Math.max(r.currentStep, st.index);
                        st.pulse = 1.0;

                        this._createStepParticles(r.x, st.y, st.color, st.isSpring ? 10 : 5);

                        if (soundSynth) {
                            const pitch = soundSynth.getFrequency(st.index + 4);
                            soundSynth.addPlink(currentTime, pitch, (r.x - 540) / 470, st.isSpring ? 0.5 : 0.35);
                        }
                        break;
                    }
                }
            }

            // Kupaya ulaştı mı?
            const dx = r.x - this.trophy.x;
            const dy = r.y - this.trophy.y;
            if (dx * dx + dy * dy < (this.trophy.radius + 18) * (this.trophy.radius + 18)) {
                this.winner = r;
                if (soundSynth) {
                    soundSynth.addBassDrop(currentTime, 180, 40, 1.0);
                }
                break;
            }
        }
    }

    _createStepParticles(x, y, color, count = 6) {
        for (let i = 0; i < count; i++) {
            const a = -Math.PI / 2 + (Math.random() - 0.5) * 1.8;
            const spd = 70 + Math.random() * 160;
            this.particles.push({
                x, y,
                vx: Math.cos(a) * spd,
                vy: Math.sin(a) * spd,
                color,
                radius: 2 + Math.random() * 2.5,
                life: 0.7
            });
        }
    }

    render(ctx, currentTime) {
        ctx.save();

        // 1. Zemin
        ctx.fillStyle = '#030207';
        ctx.fillRect(0, 0, 1080, 1920);

        // 2. Üst Skor ve Liderlik HUD'ı
        const r1 = this.racers[0];
        const r2 = this.racers[1];
        const leader = (r1.currentStep >= r2.currentStep) ? r1 : r2;

        ctx.fillStyle = '#ffffff';
        ctx.font = '900 28px "Orbitron", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🪜 EPIC 32-STEP STAIR CLIMB 🏆', 540, SAFE_ZONE.startY + 20);

        ctx.font = '900 26px "Orbitron", sans-serif';
        ctx.fillStyle = leader.color;
        ctx.fillText(
            `🔴 ${r1.currentStep}/${this.totalSteps}   ⚔️   🔵 ${r2.currentStep}/${this.totalSteps}  (${leader.name.split(' ')[0]} LEADS!)`,
            540,
            SAFE_ZONE.startY + 65
        );

        // 3. Zirvedeki Altın Kupa (Summit Trophy)
        ctx.save();
        const pulse = 1.0 + Math.sin(currentTime * 8) * 0.08;
        ctx.translate(this.trophy.x, this.trophy.y);
        ctx.scale(pulse, pulse);

        // Kupa Arkası Altın Işıma
        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.45)';
        ctx.lineWidth = 18;
        ctx.beginPath();
        ctx.arc(0, 0, this.trophy.radius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#ffd700';
        ctx.font = '900 52px "Orbitron", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🏆', 0, 0);
        ctx.restore();

        // 4. 32 Adet Neon Basamak
        ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < this.stairs.length; i++) {
            const st = this.stairs[i];

            ctx.fillStyle = st.color + (st.pulse > 0.1 ? 'ff' : '40');
            ctx.fillRect(st.x, st.y, st.w, st.h);

            ctx.strokeStyle = st.color;
            ctx.lineWidth = 2.2;
            ctx.strokeRect(st.x, st.y, st.w, st.h);

            // Zıplama Trambolin İkonu
            if (st.isSpring) {
                ctx.fillStyle = '#ffffff';
                ctx.font = '900 11px "Orbitron", sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('⚡ SPRING ⚡', st.x + st.w / 2, st.y + 11);
            }
        }

        // 5. Parçacıklar
        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];
            ctx.fillStyle = p.color;
            ctx.globalAlpha = Math.max(0, p.life);
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1.0;

        // 6. Yarışçılar (Yüksek hızlı neon toplar)
        for (let i = 0; i < this.racers.length; i++) {
            const r = this.racers[i];

            r.trail.push({ x: r.x, y: r.y });
            if (r.trail.length > 10) r.trail.shift();

            for (let k = 0; k < r.trail.length; k++) {
                const tr = r.trail[k];
                ctx.fillStyle = r.color;
                ctx.globalAlpha = (k / r.trail.length) * 0.4;
                ctx.beginPath();
                ctx.arc(tr.x, tr.y, 14 * (0.3 + k * 0.07), 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1.0;

            ctx.fillStyle = r.color;
            ctx.beginPath();
            ctx.arc(r.x, r.y, 16, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(r.x, r.y, 7, 0, Math.PI * 2);
            ctx.fill();
        }

        // 7. Zafer Ekranı
        if (this.winner || currentTime >= 26.5) {
            const champ = this.winner || (r1.currentStep > r2.currentStep ? r1 : r2);
            ctx.globalCompositeOperation = 'source-over';
            ctx.fillStyle = 'rgba(0, 0, 0, 0.78)';
            ctx.fillRect(0, 0, 1080, 1920);

            ctx.fillStyle = champ.color;
            ctx.font = '900 80px "Orbitron", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('WINNER!', 540, 840);

            ctx.fillStyle = '#ffffff';
            ctx.font = '900 48px "Orbitron", sans-serif';
            ctx.fillText(`${champ.name} WINS THE CUP! 🏆`, 540, 930);

            ctx.fillStyle = '#ffd700';
            ctx.font = '700 28px "Orbitron", sans-serif';
            ctx.fillText(`CONQUERED ALL ${this.totalSteps} STEPS! 👇`, 540, 1000);
        }

        ctx.restore();
    }
}
