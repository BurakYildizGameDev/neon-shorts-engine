// tests/safeZone.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import { CANVAS_WIDTH, CANVAS_HEIGHT, SAFE_ZONE } from '../src/config/SafeZone.js';

test('SafeZone - 9:16 Dikey Çözünürlük ve Boyut Standartları', () => {
    assert.equal(CANVAS_WIDTH, 1080, 'Canvas genişliği 1080 olmalı');
    assert.equal(CANVAS_HEIGHT, 1920, 'Canvas yüksekliği 1920 olmalı');
    assert.equal(CANVAS_WIDTH / CANVAS_HEIGHT, 9 / 16, 'En-boy oranı tam 9:16 olmalı');
});

test('SafeZone - TikTok & Shorts Güvenli Alan Matematiksel Doğruluğu', () => {
    // 1080 - 70 (sol) - 140 (sağ) = 870 aktif çekirdek genişliği
    assert.equal(SAFE_ZONE.width, 870, 'SafeZone genişliği 870 olmalı');
    // 1920 - 160 (üst) - 400 (alt) = 1360 aktif çekirdek yüksekliği
    assert.equal(SAFE_ZONE.height, 1360, 'SafeZone yüksekliği 1360 olmalı');

    assert.equal(SAFE_ZONE.startX, 70);
    assert.equal(SAFE_ZONE.endX, 940);
    assert.equal(SAFE_ZONE.startY, 160);
    assert.equal(SAFE_ZONE.endY, 1520);
});
