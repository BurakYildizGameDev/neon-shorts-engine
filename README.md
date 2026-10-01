# ⚡ Neon Shorts Engine (100-Day Content Factory)

[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![WebCodecs](https://img.shields.io/badge/WebCodecs-H.264%20%2B%20AAC-00f0ff)](https://w3c.github.io/webcodecs/)
[![60 FPS](https://img.shields.io/badge/Render-60FPS%201080x1920-ff0055)](#)
[![License: MIT](https://img.shields.io/badge/License-MIT-00ff88.svg)](LICENSE)

YouTube Shorts, TikTok ve Instagram Reels için **100 gün boyunca kesintisiz, tökezlemeden ve izleyiciyi ekrana kilitleyecek** fizik tabanlı simülasyon videoları üreten otonom içerik fabrikası.

---

## 🌟 Temel Özellikler

* **Kusursuz H.264 + AAC MP4 İhracı:** Tarayıcının donanım hızlandırmalı `WebCodecs` API'si ve `mp4-muxer` ile doğrudan saf `.mp4` çıktısı.
* **Web Worker & OffscreenCanvas İzolasyonu:** 1680 karelik 1080x1920 render işlemi arka planda işlenir; kullanıcı arayüzü 60 FPS canlı ve akıcı kalır.
* **Saf Matematiksel DSP Ses Motoru:** `Float32Array` üzerinde çalışan ASMR pentatonik melodi dizisi, cam kırılma efektleri ve tok bas patlamaları (sıfır harici ses dosyası, %100 telifsiz).
* **480 Hz Sub-Stepping Fizik Motoru:** Her kare 8 alt adıma (`dt/8`) bölünerek hesaplanır; 6000 px/s hızda bile tünelleme yaşanmaz.
* **3 Aşamalı V-Huni (Stage-Gating) Mimarisi:** Top 12.0s ve 22.0s'de açılan V-şekilli huni kapılarından geçerek 24.0s'deki çevresel zemin eğimine ulaşır; 28.0s kaçışı fiziksel olarak garanti edilir.
* **Kusursuz Döngü (Seamless Loop):** Çıkış anındaki zoom efekti videonun ilk karesine bağlanır; izleyici videonun bittiğini fark etmeden tekrar izler (%120+ izlenme oranı).
* **Safe Zone Koruması:** TikTok/Reels butonlarının altına yazı veya kritik aksiyon kaçmaz ($870 \times 1360\text{ px}$ güvenli çekirdek).
* **Anti-Spam Dinamik Metadata:** 10 farklı viral kanca formülü her gün dönüşümlü kullanılır.

---

## 🚀 Hızlı Başlangıç

### Gereksinimler
* Node.js v18+ ve modern bir Chromium tarayıcı (Google Chrome, Microsoft Edge, Brave).

### Kurulum
```bash
# Bağımlılıkları yükle
npm install

# Yerel stüdyoyu başlat
npm run dev
```

Tarayıcınızda otomatik olarak `http://localhost:5173` adresi açılacaktır.

---

## 🎮 Stüdyo Nasıl Kullanılır?

1. **Günü Seçin:** Sol panelden `[ ◀ ] Gün X [ ▶ ]` oklarıyla veya doğrudan numara girerek istediğiniz günü (1-100) seçin.
2. **Önizleyin:** Sağdaki telefonda parkurun canlı simülasyonunu ve ASMR fiziğini anlık olarak izleyin.
3. **Çıktı Klasörünü Seçin:** `[ 📁 Çıktı Klasörünü Seç ]` butonuna basarak videoların indirileceği hedef klasörü (örn: `Videos/Shorts`) bir kez onaylayın.
4. **Tek Tıkla Üret:** 
   - `[ 🎬 GÜNÜN VİDEOSUNU ÜRET ]`: O güne ait 1080x1920 60FPS sesli MP4 ve `Day_X_info.txt` başlık/açıklama dosyasını diske kaydeder.
   - `[ ⚡ SIRADAKİ 7 GÜNÜ TOPLU ÜRET ]`: Bir haftalık içerik stoğunu (7 videoyu) arka arkaya otomatik render eder.

---

## 📁 Proje Dizin Mimarisi

```text
/Shorts
├── public/fonts/          # Orbitron-Black.ttf yerel başlık fontu
├── src/
│   ├── config/            # SafeZone, PaletteConfig, VideoConfig
│   ├── core/              # Physics (480Hz), SoundSynth (DSP), Renderer, SpatialGrid
│   ├── obstacles/         # Spinner, MultiplierGate, DestructibleTile, FunnelGate, Tilter
│   ├── generator/         # PRNG (Mulberry32), LevelBuilder, SimulationDirector, Metadata
│   ├── exporter/          # RenderWorker, AudioEncoderPipe, Backpressure, FileSystemSync
│   └── ui/                # Studio Kontrol Paneli (app.js, style.css)
├── output/                # Üretilen MP4 ve metadata dosyaları (.gitignore)
├── Plan.md                # 100 Günlük Şartname ve Matematiksel Modeller
└── vite.config.js         # Localhost güvenli bağlam konfigürasyonu
```

---

## 📄 Lisans
Bu proje [MIT Lisansı](LICENSE) altında geliştirilmiştir.
