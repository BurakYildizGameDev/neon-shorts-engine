// src/exporter/Backpressure.js
/**
 * WebCodecs GPU encoder kuyruk yöneticisi.
 * Kilitlenmeleri (deadlock) önlemek için hem ondequeue hem de zaman aşımı (timeout) güvenlik sigortası barındırır.
 */
export async function waitEncoderBackpressure(videoEncoder, maxQueue = 6) {
    if (!videoEncoder || videoEncoder.encodeQueueSize <= maxQueue) {
        return;
    }

    // Kuyruk maxQueue altına düşene kadar bekle
    await new Promise((resolve) => {
        let isResolved = false;

        const cleanup = () => {
            if (!isResolved) {
                isResolved = true;
                videoEncoder.ondequeue = null;
                resolve();
            }
        };

        // 1. Standart WebCodecs ondequeue olayı
        videoEncoder.ondequeue = () => {
            if (videoEncoder.encodeQueueSize <= Math.floor(maxQueue / 2)) {
                cleanup();
            }
        };

        // 2. [KRİTİK]: Asla kilitlenmemesi (deadlock olmaması) için 12ms güvenlik zaman aşımı
        setTimeout(cleanup, 12);
    });
}
