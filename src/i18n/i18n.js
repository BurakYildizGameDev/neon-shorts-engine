// src/i18n/i18n.js
import { TRANSLATIONS, SUPPORTED_LANGUAGES } from './translations.js';

class I18nManager {
    constructor() {
        this.currentLang = 'tr';
        this.listeners = new Set();
    }

    setLanguage(lang) {
        if (TRANSLATIONS[lang]) {
            this.currentLang = lang;
            this.notify();
        }
    }

    getLanguage() {
        return this.currentLang;
    }

    getSupportedLanguages() {
        return SUPPORTED_LANGUAGES;
    }

    t(keyPath, params = {}) {
        const keys = keyPath.split('.');
        let obj = TRANSLATIONS[this.currentLang];

        for (const k of keys) {
            if (obj && obj[k] !== undefined) {
                obj = obj[k];
            } else {
                // Fallback to English, then Turkish
                let fallback = TRANSLATIONS['en'];
                for (const fk of keys) {
                    if (fallback && fallback[fk] !== undefined) fallback = fallback[fk];
                    else fallback = null;
                }
                if (fallback !== null) {
                    obj = fallback;
                    break;
                }
                return keyPath;
            }
        }

        if (typeof obj === 'string') {
            let res = obj;
            for (const [pKey, pVal] of Object.entries(params)) {
                res = res.replace(new RegExp(`\\{${pKey}\\}`, 'g'), String(pVal));
            }
            return res;
        }

        return obj;
    }

    subscribe(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    notify() {
        this.listeners.forEach(fn => fn(this.currentLang));
    }
}

export const i18n = new I18nManager();
