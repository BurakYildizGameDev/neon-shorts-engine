// src/config/VideoConfig.js
/**
 * WebCodecs VideoEncoder ve mp4-muxer konfigürasyonu.
 */
export const VIDEO_CONFIG = {
    codec: 'avc1.640033', // H.264 High Profile, Level 5.1 (1080p60 için endüstri standardı)
    width: 1080,
    height: 1920,
    bitrate: 18_000_000,  // 18 Mbps ultra net kristal kalite
    framerate: 60,
    colorSpace: {
        matrix: 'bt709',
        primaries: 'bt709',
        transfer: 'bt709',
        fullRange: true   // Tam aralık (Siyahlar derin, neonlar parlak)
    },
    avc: { 
        format: 'avc'     // [KRİTİK]: mp4-muxer için 'annexb' DEĞİL 'avc' (sample format) şarttır!
    }
};

export const AUDIO_CONFIG = {
    codec: 'mp4a.40.2',   // AAC-LC (Low Complexity)
    numberOfChannels: 2,  // Stereo
    sampleRate: 44100,
    bitrate: 192_000      // 192 kbps stüdyo kalitesi ASMR
};

export const RENDER_DURATION_SECONDS = 28.0;
export const TOTAL_FRAMES = Math.round(RENDER_DURATION_SECONDS * VIDEO_CONFIG.framerate); // 1680 kare
export const TOTAL_AUDIO_SAMPLES = Math.round(RENDER_DURATION_SECONDS * AUDIO_CONFIG.sampleRate); // 1.234.800 örnek
