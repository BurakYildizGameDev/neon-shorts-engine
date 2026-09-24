// src/config/SafeZone.js
/**
 * TikTok, YouTube Shorts ve Instagram Reels UI butonlarıyla çakışmayan
 * matematiksel olarak hesaplanmış güvenli çekirdek koordinatları.
 */
export const CANVAS_WIDTH = 1080;
export const CANVAS_HEIGHT = 1920;

export const SAFE_ZONE = {
    // Boşluklar
    paddingLeft: 70,
    paddingRight: 140, // Beğen, Yorum, Paylaş butonları
    paddingTop: 160,   // Arama çubuğu ve başlık
    paddingBottom: 400,// Kanal profili, video başlığı, ses künyesi

    // Aktif Koordinat Sınırları
    startX: 70,
    endX: 940,
    startY: 160,
    endY: 1520,

    // Aktif Çekirdek Boyutları
    width: 870,   // 940 - 70 = 870 px
    height: 1360  // 1520 - 160 = 1360 px
};

export function isInsideSafeZone(x, y, radius = 0) {
    return (
        x - radius >= SAFE_ZONE.startX &&
        x + radius <= SAFE_ZONE.endX &&
        y - radius >= SAFE_ZONE.startY &&
        y + radius <= SAFE_ZONE.endY
    );
}
