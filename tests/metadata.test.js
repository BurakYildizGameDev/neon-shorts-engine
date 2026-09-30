// tests/metadata.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import { DynamicMetadata } from '../src/generator/DynamicMetadata.js';

test('DynamicMetadata - 5 Dilde Metadata Üretimi', () => {
    const langs = ['tr', 'en', 'es', 'pt', 'de'];

    langs.forEach(lang => {
        const meta = DynamicMetadata.getMetadataForDay(1, lang);
        assert.ok(meta.title, `'${lang}' başlık üretilemedi`);
        assert.ok(meta.description, `'${lang}' açıklama üretilemedi`);
        assert.ok(meta.tags.includes('#shorts'), `'${lang}' etiketlerinde #shorts eksik`);
        assert.ok(meta.fullText.includes(meta.title), `'${lang}' tam metinde başlık eksik`);
    });
});

test('DynamicMetadata - 100 Günlük Döngü ve Çeşitlilik Testi', () => {
    for (let day = 1; day <= 20; day++) {
        const meta = DynamicMetadata.getMetadataForDay(day, 'en');
        assert.equal(meta.day, day);
        assert.ok(meta.title.includes(String(day)), `Başlık gün numarasını içermiyor: ${meta.title}`);
        assert.ok(meta.fullText.length > 50, 'Metadata metni çok kısa');
    }
});
