// tests/soundSynth.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import { DSPSoundSynth } from '../src/core/SoundSynth.js';

test('DSPSoundSynth - Tampon Boyutları ve Planar Bellek Yerleşimi', () => {
    const sampleRate = 44100;
    const duration = 2.0; // 2 saniyelik test sentezi
    const synth = new DSPSoundSynth(sampleRate, duration);

    assert.equal(synth.totalSamples, 88200, 'Toplam örnek sayısı 44100 * 2 olmalı');
    assert.equal(synth.leftChannel.length, 88200);
    assert.equal(synth.rightChannel.length, 88200);

    const planar = synth.finalize();
    assert.equal(planar.length, 88200 * 2, 'Planar tampon tam olarak sol + sağ kanal uzunluğunda olmalı');
    assert.ok(planar instanceof Float32Array, 'Planar tampon Float32Array olmalı');
});

test('DSPSoundSynth - Tanh Limiter Sınır Güvenliği [-1.0, 1.0]', () => {
    const synth = new DSPSoundSynth(44100, 1.0);

    // Aşırı yüksek sesli olaylar ekleyip clipping testi yap
    for (let t = 0.1; t < 0.9; t += 0.05) {
        synth.addPlink(t, 440, 0, 5.0); // Normalin 10 katı genlik
        synth.addBassDrop(t, 200, 40, 8.0);
        synth.addHeartbeat(t, 6.0);
    }

    const planar = synth.finalize();

    let maxSample = -Infinity;
    let minSample = Infinity;

    for (let i = 0; i < planar.length; i++) {
        const val = planar[i];
        if (val > maxSample) maxSample = val;
        if (val < minSample) minSample = val;
    }

    assert.ok(maxSample <= 1.0, `Örnek 1.0 sınırını aştı: ${maxSample}`);
    assert.ok(minSample >= -1.0, `Örnek -1.0 sınırının altına indi: ${minSample}`);
});

test('DSPSoundSynth - Sıfır Klik (Zero-Click) Fade-In ve Fade-Out', () => {
    const synth = new DSPSoundSynth(44100, 1.0);
    // Tam t=0 anında yüksek genlikli ses ekle
    synth.addPlink(0.0, 440, 0, 1.0);

    const planar = synth.finalize();

    // 0. örnek tam olarak 0.0 olmalı (Açılış DC patlamasını engeller)
    assert.equal(planar[0], 0.0, 'İlk sol örnek 0.0 olmalı');
    assert.equal(planar[synth.totalSamples], 0.0, 'İlk sağ örnek 0.0 olmalı');

    // Son örnek sıfıra yakın sönümlenmiş olmalı
    const lastLeft = planar[synth.totalSamples - 1];
    const lastRight = planar[planar.length - 1];
    assert.ok(Math.abs(lastLeft) < 0.01, 'Son sol örnek sıfıra sönümlenmemiş');
    assert.ok(Math.abs(lastRight) < 0.01, 'Son sağ örnek sıfıra sönümlenmemiş');
});
