// src/core/SoundSynth.js
/**
 * Web Worker içinde çalışan, Web Audio API'ye bağımlılığı olmayan,
 * tamamen matematiksel DSP (Dijital Sinyal İşleme) stereo ses motoru.
 */
export class DSPSoundSynth {
    constructor(sampleRate = 44100, durationSeconds = 28.0) {
        this.sampleRate = sampleRate;
        this.duration = durationSeconds;
        this.totalSamples = Math.round(sampleRate * durationSeconds);
        // Stereo Kanallar (Sol ve Sağ)
        this.leftChannel = new Float32Array(this.totalSamples);
        this.rightChannel = new Float32Array(this.totalSamples);
    }

    /**
     * Pentatonik Gam Frekansları (C Major / A Minor Pentatonic ASMR Tınılar)
     */
    getFrequency(noteIndex) {
        const pentatonicScale = [
            261.63, // C4
            293.66, // D4
            329.63, // E4
            392.00, // G4
            440.00, // A4
            523.25, // C5
            587.33, // D5
            659.25, // E5
            783.99, // G5
            880.00, // A5
            1046.50 // C6
        ];
        return pentatonicScale[Math.abs(noteIndex) % pentatonicScale.length];
    }

    /**
     * Çarpışma / Sekme (ASMR Crystal Plink)
     */
    addPlink(timeSeconds, frequency, pan = 0.0, volume = 0.5) {
        const startSample = Math.round(timeSeconds * this.sampleRate);
        const durationSamples = Math.round(0.065 * this.sampleRate); // 65ms kristal tını
        const decayRate = 55.0;

        // Stereo panlama (Sol: -1.0, Orta: 0.0, Sağ: +1.0)
        const clampedPan = Math.max(-1.0, Math.min(1.0, pan));
        const leftGain = Math.cos((clampedPan + 1) * Math.PI / 4);
        const rightGain = Math.sin((clampedPan + 1) * Math.PI / 4);

        for (let i = 0; i < durationSamples; i++) {
            const idx = startSample + i;
            if (idx >= this.totalSamples) break;

            const t = i / this.sampleRate;
            // Hafif armonik zenginlik için 2. oktav harmonik ekle
            const fundamental = Math.sin(2 * Math.PI * frequency * t);
            const harmonic = 0.25 * Math.sin(4 * Math.PI * frequency * t);
            const envelope = Math.exp(-decayRate * t);
            const sampleValue = (fundamental + harmonic) * envelope * volume;

            this.leftChannel[idx] += sampleValue * leftGain;
            this.rightChannel[idx] += sampleValue * rightGain;
        }
    }

    /**
     * Parçalanma / Cam Kırılması Sesi
     */
    addGlassShatter(timeSeconds, pan = 0.0, volume = 0.6) {
        const startSample = Math.round(timeSeconds * this.sampleRate);
        const durationSamples = Math.round(0.12 * this.sampleRate);

        const clampedPan = Math.max(-1.0, Math.min(1.0, pan));
        const leftGain = Math.cos((clampedPan + 1) * Math.PI / 4);
        const rightGain = Math.sin((clampedPan + 1) * Math.PI / 4);

        for (let i = 0; i < durationSamples; i++) {
            const idx = startSample + i;
            if (idx >= this.totalSamples) break;

            const t = i / this.sampleRate;
            // Çınlama + yüksek frekanslı beyaz gürültü patlaması
            const chime1 = Math.sin(2 * Math.PI * 1800 * t);
            const chime2 = Math.sin(2 * Math.PI * 2400 * t);
            const noise = (Math.random() * 2 - 1) * 0.4;
            const envelope = Math.exp(-35.0 * t);
            const sampleValue = (chime1 * 0.4 + chime2 * 0.3 + noise) * envelope * volume;

            this.leftChannel[idx] += sampleValue * leftGain;
            this.rightChannel[idx] += sampleValue * rightGain;
        }
    }

    /**
     * Derin Bas Darbesi (Bitiş veya Büyük Kırılma)
     */
    addBassDrop(timeSeconds, startFreq = 140, endFreq = 38, volume = 0.85) {
        const startSample = Math.round(timeSeconds * this.sampleRate);
        const durationSamples = Math.round(0.55 * this.sampleRate);

        for (let i = 0; i < durationSamples; i++) {
            const idx = startSample + i;
            if (idx >= this.totalSamples) break;

            const t = i / this.sampleRate;
            const progress = i / durationSamples;
            const currentFreq = startFreq - (startFreq - endFreq) * Math.sqrt(progress);
            const envelope = Math.sin(Math.PI * Math.pow(1 - progress, 0.7));
            const sampleValue = Math.sin(2 * Math.PI * currentFreq * t) * envelope * volume;

            this.leftChannel[idx] += sampleValue * 0.707;
            this.rightChannel[idx] += sampleValue * 0.707;
        }
    }

    /**
     * Kalp Atışı ASMR (Heartbeat Lub-Dub - Zirve Anı Gerilimi)
     */
    addHeartbeat(timeSeconds, volume = 0.75) {
        // Çift vuruş: Lub (t) ve Dub (t + 0.13s)
        const pulses = [
            { offset: 0.0, freq: 52, dur: 0.09, vol: volume },
            { offset: 0.13, freq: 44, dur: 0.11, vol: volume * 0.85 }
        ];

        pulses.forEach(p => {
            const startSample = Math.round((timeSeconds + p.offset) * this.sampleRate);
            const durationSamples = Math.round(p.dur * this.sampleRate);

            for (let i = 0; i < durationSamples; i++) {
                const idx = startSample + i;
                if (idx >= this.totalSamples) break;

                const t = i / this.sampleRate;
                const env = Math.sin(Math.PI * (i / durationSamples));
                const sampleValue = Math.sin(2 * Math.PI * p.freq * t) * env * p.vol;

                this.leftChannel[idx] += sampleValue * 0.707;
                this.rightChannel[idx] += sampleValue * 0.707;
            }
        });
    }

    /**
     * Gerilim Yükseltici Bas Süpürmesi (Rising Tension Sweep)
     */
    addTensionSweep(startTime, duration = 2.5, volume = 0.6) {
        const startSample = Math.round(startTime * this.sampleRate);
        const durationSamples = Math.round(duration * this.sampleRate);

        for (let i = 0; i < durationSamples; i++) {
            const idx = startSample + i;
            if (idx >= this.totalSamples) break;

            const progress = i / durationSamples;
            const currentFreq = 40 + Math.pow(progress, 2) * 160; // 40Hz -> 200Hz hızlanan bas
            const t = i / this.sampleRate;
            const pulse = (Math.sin(2 * Math.PI * (2 + progress * 8) * t) + 1) * 0.5; // Ritmik nabız
            const env = progress * volume * pulse;
            const sampleValue = Math.sin(2 * Math.PI * currentFreq * t) * env;

            this.leftChannel[idx] += sampleValue * 0.707;
            this.rightChannel[idx] += sampleValue * 0.707;
        }
    }

    /**
     * Çarpan Kapısı Zili (Multiplier Gate Ding / Ascension Chord)
     */
    addGateDing(timeSeconds, multiplier = 2, volume = 0.5) {
        const startSample = Math.round(timeSeconds * this.sampleRate);
        const durationSamples = Math.round(0.12 * this.sampleRate);
        const baseFreq = 523.25 * (multiplier > 1 ? 1.25 : 0.75); // C5 tabanlı akor

        for (let i = 0; i < durationSamples; i++) {
            const idx = startSample + i;
            if (idx >= this.totalSamples) break;

            const t = i / this.sampleRate;
            const chord = Math.sin(2 * Math.PI * baseFreq * t) +
                          0.5 * Math.sin(2 * Math.PI * baseFreq * 1.5 * t) +
                          0.3 * Math.sin(2 * Math.PI * baseFreq * 2.0 * t);
            const env = Math.exp(-30.0 * t);
            const sampleValue = chord * env * volume * 0.5;

            this.leftChannel[idx] += sampleValue * 0.707;
            this.rightChannel[idx] += sampleValue * 0.707;
        }
    }

    /**
     * Master Sınırlayıcı (Limiter) ve Zero-Click Başlangıç/Bitiş Yumuşatması
     * @returns {Float32Array} WebCodecs 'f32-planar' için tek birleşik Float32Array (Left + Right)
     */
    finalize() {
        const fadeInSamples = Math.round(0.01 * this.sampleRate);  // İlk 10ms mikro fade-in (Sıfır Klik)
        const fadeOutSamples = Math.round(0.05 * this.sampleRate); // Son 50ms mikro fade-out (Kusursuz Loop)
        const fadeStartIndex = this.totalSamples - fadeOutSamples;

        for (let i = 0; i < this.totalSamples; i++) {
            let gain = 1.0;

            // Açılış yumuşatması (t=0 anındaki ani DC offset patlamasını önler)
            if (i < fadeInSamples) {
                gain = i / fadeInSamples;
            } 
            // Bitiş yumuşatması (28.0s başa sararken çıt sesini sıfırlar)
            else if (i >= fadeStartIndex) {
                gain = (this.totalSamples - i) / fadeOutSamples;
            }

            // Tanh Soft Clipping Limiter (Sinyal asla -1.0 veya +1.0 dışına çıkamaz)
            this.leftChannel[i] = Math.tanh(this.leftChannel[i]) * gain;
            this.rightChannel[i] = Math.tanh(this.rightChannel[i]) * gain;
        }

        // [KRİTİK]: WebCodecs f32-planar tek birleşik Float32Array talep eder:
        // [0 .. totalSamples - 1]: Sol Kanal
        // [totalSamples .. totalSamples * 2 - 1]: Sağ Kanal
        const planarBuffer = new Float32Array(this.totalSamples * 2);
        planarBuffer.set(this.leftChannel, 0);
        planarBuffer.set(this.rightChannel, this.totalSamples);

        return planarBuffer;
    }
}
