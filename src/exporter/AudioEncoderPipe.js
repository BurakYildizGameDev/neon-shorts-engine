// src/exporter/AudioEncoderPipe.js
/**
 * WebCodecs AudioEncoder için katı 1024-örnek f32-planar dilimleyici,
 * kronolojik interleaving ve son paket zero-padding yöneticisi.
 */
export class AudioEncoderPipe {
    constructor(audioEncoder, planarAudioBuffer, totalAudioSamples, sampleRate = 44100) {
        this.audioEncoder = audioEncoder;
        this.planarAudioBuffer = planarAudioBuffer; // [0..total-1]: Sol, [total..total*2-1]: Sağ
        this.totalAudioSamples = totalAudioSamples;
        this.sampleRate = sampleRate;

        this.chunkSize = 1024;
        this.currentSampleOffset = 0;
    }

    /**
     * O anki video karesinin süresine kadar olan ses dilimlerini kronolojik olarak kodlar.
     */
    interleaveUpToFrame(frameIndex, totalFrames) {
        const currentTimeSec = (frameIndex + 1) / 60;
        const targetSample = Math.min(Math.round(currentTimeSec * this.sampleRate), this.totalAudioSamples);

        while (this.currentSampleOffset + this.chunkSize <= targetSample) {
            this._encodeChunk(this.currentSampleOffset, this.chunkSize);
            this.currentSampleOffset += this.chunkSize;
        }

        // Eğer son video karesindeysek, geriye kalan artıkları zero-padding ile paketle
        if (frameIndex === totalFrames - 1) {
            this.flushRemaining();
        }
    }

    _encodeChunk(offset, size) {
        // f32-planar format: chunkSize kadar Sol kanal, ardından chunkSize kadar Sağ kanal
        const chunkPlanar = new Float32Array(size * 2);

        // Sol Kanal Dilimi
        chunkPlanar.set(this.planarAudioBuffer.subarray(offset, offset + size), 0);
        // Sağ Kanal Dilimi (Offset + totalAudioSamples)
        chunkPlanar.set(this.planarAudioBuffer.subarray(this.totalAudioSamples + offset, this.totalAudioSamples + offset + size), size);

        const timestampMicros = Math.round((offset * 1_000_000) / this.sampleRate);

        const audioData = new AudioData({
            format: 'f32-planar',
            numberOfChannels: 2,
            numberOfFrames: size,
            sampleRate: this.sampleRate,
            timestamp: timestampMicros,
            data: chunkPlanar
        });

        this.audioEncoder.encode(audioData);
        audioData.close();
    }

    /**
     * [KRİTİK]: 880 örnek artık sesin çöpe gitmesini önleyen Zero-Padding (Sıfır Dolgu) fonksiyonu.
     */
    flushRemaining() {
        const remainingSamples = this.totalAudioSamples - this.currentSampleOffset;
        if (remainingSamples > 0 && remainingSamples < this.chunkSize) {
            const finalChunk = new Float32Array(this.chunkSize * 2); // Varsayılan 0.0 (tam sessizlik)

            // Kalan gerçek ses verisini kopyala
            for (let i = 0; i < remainingSamples; i++) {
                // Sol Kanal
                finalChunk[i] = this.planarAudioBuffer[this.currentSampleOffset + i];
                // Sağ Kanal
                finalChunk[this.chunkSize + i] = this.planarAudioBuffer[this.totalAudioSamples + this.currentSampleOffset + i];
            }

            const timestampMicros = Math.round((this.currentSampleOffset * 1_000_000) / this.sampleRate);

            const lastAudioData = new AudioData({
                format: 'f32-planar',
                numberOfChannels: 2,
                numberOfFrames: this.chunkSize,
                sampleRate: this.sampleRate,
                timestamp: timestampMicros,
                data: finalChunk
            });

            this.audioEncoder.encode(lastAudioData);
            lastAudioData.close();
            this.currentSampleOffset = this.totalAudioSamples;
        }
    }
}
