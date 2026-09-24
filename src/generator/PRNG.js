// src/generator/PRNG.js
/**
 * Mulberry32 algoritması tabanlı, 32-bit deterministik rastgele sayı üreteci.
 * Aynı tohum (seed) değeri verildiğinde her zaman %100 birebir aynı sayı dizisini üretir.
 */
export class PRNG {
    constructor(seed = 1) {
        this.s = Math.floor(seed);
    }

    next() {
        let t = (this.s += 0x6D2B79F5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }

    range(min, max) {
        return min + this.next() * (max - min);
    }

    rangeInt(min, max) {
        return Math.floor(this.range(min, max + 1));
    }

    choice(array) {
        const idx = Math.floor(this.next() * array.length);
        return array[idx];
    }
}
