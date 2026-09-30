// tests/prng.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import { PRNG } from '../src/generator/PRNG.js';

test('PRNG - Determinizm Testi (Aynı seed aynı sayıları üretmeli)', () => {
    const rng1 = new PRNG(42);
    const rng2 = new PRNG(42);

    for (let i = 0; i < 50; i++) {
        assert.equal(rng1.next(), rng2.next(), `Adım ${i}'de PRNG değerleri eşleşmedi`);
    }
});

test('PRNG - Farklı seedler farklı sayılar üretmeli', () => {
    const rng1 = new PRNG(101);
    const rng2 = new PRNG(202);

    const val1 = rng1.next();
    const val2 = rng2.next();
    assert.notEqual(val1, val2, 'Farklı seedler aynı ilk değeri üretti');
});

test('PRNG - range(), rangeInt() ve choice() kontrolü', () => {
    const rng = new PRNG(999);

    for (let i = 0; i < 100; i++) {
        const floatVal = rng.range(10.5, 25.5);
        assert.ok(floatVal >= 10.5 && floatVal <= 25.5, `range sınır aşıldı: ${floatVal}`);

        const intVal = rng.rangeInt(5, 15);
        assert.ok(Number.isInteger(intVal), 'rangeInt() tam sayı döndürmedi');
        assert.ok(intVal >= 5 && intVal <= 15, `rangeInt() sınır aşıldı: ${intVal}`);
    }

    const items = ['A', 'B', 'C'];
    const chosen = rng.choice(items);
    assert.ok(items.includes(chosen), 'choice geçerli bir eleman seçmedi');
});
