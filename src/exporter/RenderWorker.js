// src/exporter/RenderWorker.js
import { Muxer, ArrayBufferTarget } from 'mp4-muxer';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../config/SafeZone.js';
import { VIDEO_CONFIG, AUDIO_CONFIG, TOTAL_FRAMES, TOTAL_AUDIO_SAMPLES } from '../config/VideoConfig.js';
import { DSPSoundSynth } from '../core/SoundSynth.js';
import { getModeInstance } from '../modes/ModeManager.js';
import { DynamicMetadata } from '../generator/DynamicMetadata.js';
import { waitEncoderBackpressure } from './Backpressure.js';
import { getValidatedVideoConfig } from './EncoderValidator.js';
import { AudioEncoderPipe } from './AudioEncoderPipe.js';

let isFontLoaded = false;

async function initWorkerTypography() {
    if (isFontLoaded) return;
    try {
        const response = await fetch('/fonts/Orbitron-Black.ttf');
        const fontData = await response.arrayBuffer();
        const font = new FontFace('Orbitron', fontData, {
            weight: '900',
            style: 'normal'
        });
        await font.load();
        self.fonts.add(font);
        isFontLoaded = true;
    } catch (e) {
        console.warn('[Worker] Font yüklenemedi:', e);
    }
}

self.onmessage = async (e) => {
    const { type, day, modeId, options } = e.data;
    if (type !== 'START') return;

    try {
        await initWorkerTypography();
        await renderVideo(day || 1, modeId || 'territory', options || {});
    } catch (err) {
        console.error('[Worker Render Hatası]:', err);
        self.postMessage({ type: 'ERROR', error: err.message });
    }
};

async function renderVideo(dayNumber, modeId, options) {
    const canvas = new OffscreenCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    const ctx = canvas.getContext('2d', { alpha: false });

    // 1. MP4 Muxer Kurulumu
    const muxer = new Muxer({
        target: new ArrayBufferTarget(),
        video: { codec: 'avc', width: CANVAS_WIDTH, height: CANVAS_HEIGHT },
        audio: { codec: 'aac', sampleRate: AUDIO_CONFIG.sampleRate, numberOfChannels: AUDIO_CONFIG.numberOfChannels },
        fastStart: 'in-memory'
    });

    // 2. Video Encoder
    const validatedVideoConfig = await getValidatedVideoConfig(VIDEO_CONFIG);
    const videoEncoder = new VideoEncoder({
        output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
        error: (e) => console.error('[VideoEncoder Hatası]:', e)
    });
    videoEncoder.configure(validatedVideoConfig);

    // 3. Audio Encoder
    const audioEncoder = new AudioEncoder({
        output: (chunk, meta) => muxer.addAudioChunk(chunk, meta),
        error: (e) => console.error('[AudioEncoder Hatası]:', e)
    });
    audioEncoder.configure(AUDIO_CONFIG);

    // 4. PAS 1: Fizik & Ses Olayları Ön-Hesaplaması (Deterministik)
    const soundSynth = new DSPSoundSynth(AUDIO_CONFIG.sampleRate, 28.0);
    const preMode = getModeInstance(modeId, dayNumber, options);
    const DT = 1 / 60;

    for (let f = 0; f < TOTAL_FRAMES; f++) {
        const currentTime = f * DT;
        preMode.update(currentTime, DT, soundSynth);
    }

    const planarAudioBuffer = soundSynth.finalize();
    const audioPipe = new AudioEncoderPipe(audioEncoder, planarAudioBuffer, TOTAL_AUDIO_SAMPLES, AUDIO_CONFIG.sampleRate);

    // 5. PAS 2: Gerçek Çizim & VideoFrame Kodlaması
    const renderMode = getModeInstance(modeId, dayNumber, options);
    const metadata = DynamicMetadata.getMetadataForDay(dayNumber, options?.lang || 'tr');

    for (let frameIndex = 0; frameIndex < TOTAL_FRAMES; frameIndex++) {
        const currentTime = frameIndex * DT;

        // Modu güncelle ve çiz
        renderMode.update(currentTime, DT, null);
        renderMode.render(ctx, currentTime);

        // Dinamik tam sayı mikrosaniye ve süre hesabı
        const timestampMicros = Math.round(frameIndex * (1_000_000 / 60));
        const nextTimestampMicros = Math.round((frameIndex + 1) * (1_000_000 / 60));
        const frameDuration = nextTimestampMicros - timestampMicros;

        const videoFrame = new VideoFrame(canvas, {
            timestamp: timestampMicros,
            duration: frameDuration
        });

        // 0. karede ve her 120 karede bir keyFrame
        const isKeyFrame = (frameIndex === 0) || (frameIndex % 120 === 0);
        videoEncoder.encode(videoFrame, { keyFrame: isKeyFrame });
        videoFrame.close();

        // Eşzamanlı ses interleaving
        audioPipe.interleaveUpToFrame(frameIndex, TOTAL_FRAMES);

        // Kuyruk kontrolü (Timeout korumalı, asla kilitlenmez)
        await waitEncoderBackpressure(videoEncoder);

        // İlerleme bildirimi (Her 15 karede bir)
        if (frameIndex % 15 === 0 || frameIndex === TOTAL_FRAMES - 1) {
            const percent = Math.round(((frameIndex + 1) / TOTAL_FRAMES) * 100);
            self.postMessage({
                type: 'PROGRESS',
                day: dayNumber,
                percent,
                currentFrame: frameIndex + 1,
                totalFrames: TOTAL_FRAMES
            });
        }
    }

    // 6. Sıralı Mühürleme
    await videoEncoder.flush();
    await audioEncoder.flush();
    muxer.finalize();

    // 7. Transferable ArrayBuffer ile Ana Thread'e Aktar
    const mp4Buffer = muxer.target.buffer;
    self.postMessage({
        type: 'COMPLETE',
        day: dayNumber,
        buffer: mp4Buffer,
        metadata
    }, [mp4Buffer]);
}
