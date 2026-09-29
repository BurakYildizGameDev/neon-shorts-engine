// src/exporter/FileSystemSync.js
/**
 * File System Access API ile yerel diske doğrudan dosya yazıcı.
 * Tarayıcı izin kısıtlamalarına karşı yedek (blob download) mekanizması barındırır.
 */
export class FileSystemSync {
    static async saveVideo(directoryHandle, dayNumber, arrayBuffer) {
        const fileName = `Day_${String(dayNumber).padStart(3, '0')}.mp4`;

        if (directoryHandle && directoryHandle.getFileHandle) {
            try {
                const fileHandle = await directoryHandle.getFileHandle(fileName, { create: true });
                const writable = await fileHandle.createWritable();
                await writable.write(arrayBuffer);
                await writable.close();
                console.log(`[Diske Yazıldı]: ${fileName}`);
                return fileName;
            } catch (err) {
                console.warn('DirectoryHandle yazım hatası, blob indirmeye geçiliyor:', err);
            }
        }

        // Yedek Mekanizma: Blob İndirici
        this._fallbackDownload(fileName, arrayBuffer, 'video/mp4');
        return fileName;
    }

    static async saveMetadata(directoryHandle, dayNumber, metadataText) {
        const fileName = `Day_${String(dayNumber).padStart(3, '0')}_info.txt`;
        const encoder = new TextEncoder();
        const buffer = encoder.encode(metadataText);

        if (directoryHandle && directoryHandle.getFileHandle) {
            try {
                const fileHandle = await directoryHandle.getFileHandle(fileName, { create: true });
                const writable = await fileHandle.createWritable();
                await writable.write(buffer);
                await writable.close();
                console.log(`[Diske Yazıldı]: ${fileName}`);
                return fileName;
            } catch (err) {
                console.warn('Metadata yazım hatası:', err);
            }
        }

        this._fallbackDownload(fileName, buffer, 'text/plain');
        return fileName;
    }

    static _fallbackDownload(fileName, buffer, mimeType) {
        const blob = new Blob([buffer], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 15000);
    }
}
