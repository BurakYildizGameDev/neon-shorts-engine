// tests/modeManager.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import { GAME_MODES, getModeInstance } from '../src/modes/ModeManager.js';
import { DSPSoundSynth } from '../src/core/SoundSynth.js';

const EXPECTED_25_MODES = [
    'territory', 'multiplier', 'hexagonescape', 'circle', 'plinko',
    'battleroyale', 'towercrush', 'blackhole', 'stairrace', 'lasercrossfire',
    'sawblade', 'domino', 'pendulum', 'tugofwar', 'timebomb',
    'wallclimb', 'icevslava', 'mitosis', 'magnetic', 'pachinko',
    'portal', 'gravityflip', 'spiral', 'pinball', 'helix'
];

function createMockCanvasContext() {
    const dummyGradient = {
        addColorStop: () => {}
    };
    return {
        save: () => {},
        restore: () => {},
        translate: () => {},
        rotate: () => {},
        scale: () => {},
        beginPath: () => {},
        closePath: () => {},
        moveTo: () => {},
        lineTo: () => {},
        arc: () => {},
        ellipse: () => {},
        roundRect: () => {},
        rect: () => {},
        fillRect: () => {},
        strokeRect: () => {},
        stroke: () => {},
        fill: () => {},
        fillText: () => {},
        strokeText: () => {},
        setLineDash: () => {},
        getLineDash: () => [],
        createLinearGradient: () => dummyGradient,
        createRadialGradient: () => dummyGradient,
        measureText: (text) => ({ width: text.length * 10 }),
        fillStyle: '#000000',
        strokeStyle: '#000000',
        lineWidth: 1,
        lineCap: 'butt',
        lineJoin: 'miter',
        shadowBlur: 0,
        shadowColor: 'transparent',
        shadowOffsetX: 0,
        shadowOffsetY: 0,
        font: '10px sans-serif',
        textAlign: 'start',
        textBaseline: 'alphabetic',
        globalAlpha: 1.0
    };
}

test('ModeManager - 25 Oyun Modunun Eksiksiz Tanımlanması', () => {
    assert.equal(GAME_MODES.length, 25, 'Tam olarak 25 oyun modu tanımlı olmalı');

    EXPECTED_25_MODES.forEach(id => {
        const found = GAME_MODES.find(m => m.id === id);
        assert.ok(found, `Oyun modu '${id}' GAME_MODES listesinde bulunamadı`);
        assert.ok(found.name, `Mod '${id}' isim içermiyor`);
        assert.ok(found.sub, `Mod '${id}' alt başlık içermiyor`);
        assert.ok(found.desc, `Mod '${id}' açıklama içermiyor`);
        assert.ok(found.icon, `Mod '${id}' ikon içermiyor`);
        assert.ok(typeof found.create === 'function', `Mod '${id}' create fonksiyonu içermiyor`);
    });
});

test('ModeManager - Tüm 25 Modun Başlatılması, 60 Kare Simülasyonu ve Render Testi', () => {
    const synth = new DSPSoundSynth(44100, 2.0);
    const mockCtx = createMockCanvasContext();
    const DT = 1 / 60;

    EXPECTED_25_MODES.forEach(modeId => {
        const mode = getModeInstance(modeId, 42, {});
        assert.ok(mode, `${modeId} örneği oluşturulamadı`);
        assert.ok(typeof mode.update === 'function', `${modeId} update metodu içermiyor`);
        assert.ok(typeof mode.render === 'function', `${modeId} render metodu içermiyor`);
        assert.ok(mode.duration > 0, `${modeId} duration geçerli bir süre içermiyor`);

        // 60 Adım fizik güncellemesi ve render testi
        for (let frame = 0; frame < 60; frame++) {
            const currentTime = frame * DT;
            assert.doesNotThrow(() => {
                mode.update(currentTime, DT, synth);
            }, `${modeId} modu update() ${frame}. karede hata fırlattı`);

            assert.doesNotThrow(() => {
                mode.render(mockCtx, currentTime);
            }, `${modeId} modu render() ${frame}. karede hata fırlattı`);
        }
    });
});

test('ModeManager - Farklı Seed ile Determinizm ve Başlatma Testi', () => {
    const mode1 = getModeInstance('plinko', 101);
    const mode2 = getModeInstance('plinko', 202);

    assert.ok(mode1);
    assert.ok(mode2);
    assert.notEqual(mode1.seed, mode2.seed, 'Farklı seed değerleri saklanmalı');
});
