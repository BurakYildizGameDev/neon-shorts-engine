// tests/i18n.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import { TRANSLATIONS, SUPPORTED_LANGUAGES } from '../src/i18n/translations.js';
import { i18n } from '../src/i18n/i18n.js';

const EXPECTED_25_MODES = [
    'territory', 'multiplier', 'hexagonescape', 'circle', 'plinko',
    'battleroyale', 'towercrush', 'blackhole', 'stairrace', 'lasercrossfire',
    'sawblade', 'domino', 'pendulum', 'tugofwar', 'timebomb',
    'wallclimb', 'icevslava', 'mitosis', 'magnetic', 'pachinko',
    'portal', 'gravityflip', 'spiral', 'pinball', 'helix'
];

test('i18n - 5 Dil Desteği ve 25 Modluk Sözlük Bütünlüğü', () => {
    assert.equal(SUPPORTED_LANGUAGES.length, 5, 'Tam olarak 5 dil desteklenmeli');

    const expectedLangs = ['tr', 'en', 'es', 'pt', 'de'];
    expectedLangs.forEach(lang => {
        assert.ok(TRANSLATIONS[lang], `'${lang}' dili sözlükte tanımlı değil`);

        // Temel UI anahtarları kontrolü
        const dict = TRANSLATIONS[lang];
        assert.ok(dict.badge, `'${lang}' için badge çevirisi eksik`);
        assert.ok(dict.gameType, `'${lang}' için gameType çevirisi eksik`);
        assert.ok(dict.renderBtn, `'${lang}' için renderBtn çevirisi eksik`);
        assert.ok(dict.batchBtn, `'${lang}' için batchBtn çevirisi eksik`);
        assert.ok(dict.modes, `'${lang}' için modes nesnesi eksik`);

        // 25 Modun tamamının çevirisi var mı?
        EXPECTED_25_MODES.forEach(mKey => {
            assert.ok(dict.modes[mKey], `'${lang}' dilinde '${mKey}' modu çevirisi eksik`);
            assert.ok(dict.modes[mKey].title, `'${lang}' dilinde '${mKey}.title' eksik`);
            assert.ok(dict.modes[mKey].sub, `'${lang}' dilinde '${mKey}.sub' eksik`);
        });
    });
});

test('i18n - Parametre İnterpolasyonu ve Dil Değişimi', () => {
    i18n.setLanguage('en');
    assert.equal(i18n.getLanguage(), 'en');

    const renderedBtn = i18n.t('renderBtn', { mode: 'MULTIPLIER' });
    assert.equal(renderedBtn, '🎬 RENDER MULTIPLIER (MP4)');

    i18n.setLanguage('de');
    assert.equal(i18n.getLanguage(), 'de');
    const deBatch = i18n.t('batchBtn');
    assert.equal(deBatch, '⚡ 7-TAGE-PAKET RENDERN');

    // 25. Mod Çevirisi Testi
    const helixTitle = i18n.t('modes.helix.title');
    assert.equal(helixTitle, 'Helix-Absturz');

    // Varsayılana geri dön
    i18n.setLanguage('tr');
    assert.equal(i18n.getLanguage(), 'tr');
});
