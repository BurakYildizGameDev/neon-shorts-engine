// src/exporter/EncoderValidator.js
/**
 * Tarayıcının donanım video kodlayıcısını test eden ve gerektiğinde Main Profile'a düşüren doğrulayıcı.
 */
export async function getValidatedVideoConfig(baseConfig) {
    if (typeof VideoEncoder === 'undefined' || !VideoEncoder.isConfigSupported) {
        return baseConfig;
    }

    try {
        const support = await VideoEncoder.isConfigSupported(baseConfig);
        if (support.supported) {
            return baseConfig;
        }

        console.warn('High Profile 5.1 (avc1.640033) desteklenmiyor. Main Profile (avc1.4d002a) geçiliyor.');
        return {
            ...baseConfig,
            codec: 'avc1.4d002a' // Main Profile, Level 4.2 Fallback
        };
    } catch (err) {
        console.warn('Encoder profil kontrol hatası, varsayılan profil kullanılıyor:', err);
        return baseConfig;
    }
}
