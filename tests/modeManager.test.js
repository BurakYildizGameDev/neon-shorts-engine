// tests/modeManager.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import { GAME_MODES, getModeInstance } from '../src/modes/ModeManager.js';
import { DSPSoundSynth } from '../src/core/SoundSynth.js';

test('ModeManager - 9 Oyun Modunun Eksiksiz Tanımlanması', () => {
    assert.equal(GAME_MODES.length, 9, 'Tam olarak 9 oyun modu bulunmalı');

    const expectedIds = [
        'territory', 'multiplier', 'hexagonescape',
        'circle', 'plinko', 'battleroyale',
        'towercrush', 'blackhole', 'stairrace'
    ];

    expectedIds.forEach(id => {
        const found = GAME_MODES.find(m => m.id === id);
        assert.ok(found, `Oyun modu '${id}' bulunamadı`);
        assert.ok(found.name, `Mod '${id}' isim içermiyor`);
        assert.ok(typeof found.create === 'function', `Mod '${id}' create fonksiyonu içermiyor`);
    });
});

test('ModeManager - Tüm Modların Başlatılması ve 60 Kare Simülasyon Testi', () => {
    const synth = new DSPSoundSynth(44100, 2.0);
    const DT = 1 / 60;

    GAME_MODES.forEach(modeDef => {
        const mode = getModeInstance(modeDef.id, 1, {});
        assert.ok(mode, `${modeDef.id} örneği oluşturulamadı`);
        assert.ok(typeof mode.update === 'function', `${modeDef.id} update metodu içermiyor`);
        assert.ok(typeof mode.render === 'function', `${modeDef.id} render metodu içermiyor`);

        // 60 Adım fizik güncellemesi çalıştır
        for (let frame = 0; frame < 60; frame++) {
            const currentTime = frame * DT;
            assert.doesNotThrow(() => {
                mode.update(currentTime, DT, synth);
            }, `${modeDef.id} modu ${frame}. karede hata verdi`);
        }
    });
});
