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

function assertFinite(...args) {
    for (let i = 0; i < args.length; i++) {
        const val = args[i];
        if (typeof val !== 'number' || !Number.isFinite(val)) {
            throw new TypeError(`Canvas argument ${i} is not a finite number: ${val}`);
        }
    }
}

function createMockCanvasContext() {
    const dummyGradient = {
        addColorStop: () => {}
    };
    return {
        save: () => {},
        restore: () => {},
        translate: (x, y) => { assertFinite(x, y); },
        rotate: (angle) => { assertFinite(angle); },
        scale: (x, y) => { assertFinite(x, y); },
        beginPath: () => {},
        closePath: () => {},
        moveTo: (x, y) => { assertFinite(x, y); },
        lineTo: (x, y) => { assertFinite(x, y); },
        arc: (x, y, r, sa, ea) => { assertFinite(x, y, r, sa, ea); },
        ellipse: (x, y, rx, ry, rot, sa, ea) => { assertFinite(x, y, rx, ry, rot, sa, ea); },
        roundRect: (x, y, w, h, r) => { assertFinite(x, y, w, h); },
        rect: (x, y, w, h) => { assertFinite(x, y, w, h); },
        fillRect: (x, y, w, h) => { assertFinite(x, y, w, h); },
        strokeRect: (x, y, w, h) => { assertFinite(x, y, w, h); },
        stroke: () => {},
        fill: () => {},
        fillText: (text, x, y) => { assertFinite(x, y); },
        strokeText: (text, x, y) => { assertFinite(x, y); },
        setLineDash: () => {},
        getLineDash: () => [],
        createLinearGradient: (x0, y0, x1, y1) => { assertFinite(x0, y0, x1, y1); return dummyGradient; },
        createRadialGradient: (x0, y0, r0, x1, y1, r1) => { assertFinite(x0, y0, r0, x1, y1, r1); return dummyGradient; },
        measureText: (text) => ({ width: (text ? text.length : 0) * 10 }),
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
        globalAlpha: 1.0,
        globalCompositeOperation: 'source-over'
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

test('ModeManager - Tüm 25 Modun Başlatılması, İlk Kare (Frame 0) Render ve 120 Kare Simülasyonu', () => {
    const synth = new DSPSoundSynth(44100, 2.0);
    const mockCtx = createMockCanvasContext();
    const DT = 1 / 60;

    EXPECTED_25_MODES.forEach(modeId => {
        const mode = getModeInstance(modeId, 42, {});
        assert.ok(mode, `${modeId} örneği oluşturulamadı`);
        assert.ok(typeof mode.update === 'function', `${modeId} update metodu içermiyor`);
        assert.ok(typeof mode.render === 'function', `${modeId} render metodu içermiyor`);
        assert.ok(mode.duration > 0, `${modeId} duration geçerli bir süre içermiyor`);

        // Frame 0 Testi: Update çağrılmadan önce doğrudan render (önizleme güvenliği)
        assert.doesNotThrow(() => {
            mode.render(mockCtx, 0);
        }, `${modeId} modu henüz update çağrılmadan ilk karede (frame 0) render hatası verdi (NaN/undefined)`);

        // 120 Adım fizik güncellemesi ve render testi
        for (let frame = 1; frame <= 120; frame++) {
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
