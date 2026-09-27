// src/generator/DynamicMetadata.js
/**
 * 5 Dilde (TR, EN, ES, PT, DE) YouTube Shorts ve TikTok spam filtrelerine takılmayan
 * dinamik başlık, kanca ve etiket (metadata) üreteci.
 */
export class DynamicMetadata {
    static getMetadataForDay(day, lang = 'tr') {
        const templates = {
            tr: {
                header: `YOUTUBE SHORTS & TIKTOK PAYLAŞIM BİLGİSİ (GÜN ${day})`,
                lblTitle: '📌 BAŞLIK:',
                lblDesc: '📝 AÇIKLAMA:',
                lblTags: '🏷️ HASHTAGLER:',
                formulas: [
                    {
                        title: `Gün ${day}: Neon Top Bu Seviyeden Kaçabilecek mi? 😱⚡ #shorts`,
                        desc: `100 Günlük İmkansız Kaçış Meydan Okumasında ${day}. Gündeyiz! Son 27. saniyeye dikkatle bakın! Tahminini yoruma yaz! 👇`,
                        hook: `GÜN ${day}: KAÇABİLECEK Mİ? 🟢`
                    },
                    {
                        title: `Sadece %1'i Gün ${day}'in Nasıl Biteceğini Tahmin Edebilir... 🧠🔴 #gaming #shorts`,
                        desc: `Gün ${day} tam bir akıl oyunu! 26. saniyedeki inanılmaz geri dönüşe inanamayacaksınız! Gün ${day + 1} için takip etmeyi unutma! 🚀`,
                        hook: `GÜN ${day}: SADECE %1 BİLİR 💀`
                    },
                    {
                        title: `26. Saniyeyi Bekleyin... (Bölüm ${day}) 💀⚡ #satisfying #shorts`,
                        desc: `Bölüm ${day} ASMR fizik tatmini tavan yaptı! Doğru tahmin ettiysen beğenmeyi unutma! 🔴🔵 Yarın yeni bölüm yayında!`,
                        hook: `GÜN ${day}: BEKLEYİN... 😱`
                    }
                ],
                tags: ['#shorts', `#gun${day}`, '#oyun', '#neon', '#satisfying', '#asmr', '#fizik', '#meydanokuma', '#viral']
            },
            en: {
                header: `YOUTUBE SHORTS & TIKTOK POSTING DATA (DAY ${day})`,
                lblTitle: '📌 TITLE:',
                lblDesc: '📝 DESCRIPTION:',
                lblTags: '🏷️ HASHTAGS:',
                formulas: [
                    {
                        title: `Day ${day}: Can The Neon Ball Actually Escape Level ${day}? 😱⚡ #shorts`,
                        desc: `Welcome to Day ${day} of the 100-Day Impossible Escape Challenge! Watch till the 27th second for pure ASMR satisfaction! Drop your guess below! 👇`,
                        hook: `DAY ${day}: CAN IT ESCAPE? 🟢`
                    },
                    {
                        title: `Only 1% Can Predict How Day ${day} Ends... 🧠🔴 #gaming #shorts`,
                        desc: `Day ${day} is an absolute mind-bender! Did you see that clutch finish? Subscribe for Day ${day + 1}! 🚀`,
                        hook: `DAY ${day}: ONLY 1% WIN THIS 💀`
                    },
                    {
                        title: `Wait for the 26th second... (Level ${day}) 💀⚡ #satisfying #shorts`,
                        desc: `Did you catch that comeback on Day ${day}?! Drop a like if you guessed right! 🔴🔵 New level drops tomorrow!`,
                        hook: `DAY ${day}: WAIT FOR IT... 😱`
                    }
                ],
                tags: ['#shorts', `#day${day}`, '#gaming', '#neon', '#satisfying', '#asmr', '#physics', '#challenge', '#viral']
            },
            es: {
                header: `DATOS DE PUBLICACIÓN YOUTUBE SHORTS Y TIKTOK (DÍA ${day})`,
                lblTitle: '📌 TÍTULO:',
                lblDesc: '📝 DESCRIPCIÓN:',
                lblTags: '🏷️ HASHTAGS:',
                formulas: [
                    {
                        title: `Día ${day}: ¿Podrá la bola de neón escapar del Nivel ${day}? 😱⚡ #shorts`,
                        desc: `¡Bienvenidos al Día ${day} del Desafío Imposible! ¡Mira el segundo 27 para el escape más satisfactorio! ¡Comenta tu país! 👇`,
                        hook: `DÍA ${day}: ¿PODRÁ ESCAPAR? 🟢`
                    },
                    {
                        title: `Solo el 1% puede predecir cómo termina el Día ${day}... 🧠🔴 #gaming #shorts`,
                        desc: `¡El Día ${day} es una locura total! ¿Viste ese giro inesperado? ¡Suscríbete para el Día ${day + 1}! 🚀`,
                        hook: `DÍA ${day}: SOLO EL 1% ACIERTA 💀`
                    },
                    {
                        title: `Espera al segundo 26... (Nivel ${day}) 💀⚡ #satisfying #shorts`,
                        desc: `¡La física ASMR del Día ${day} es adictiva! ¡Dale like si adivinaste el ganador! 🔴🔵 ¡Mañana nuevo nivel!`,
                        hook: `DÍA ${day}: ESPERA EL FINAL... 😱`
                    }
                ],
                tags: ['#shorts', `#dia${day}`, '#gaming', '#neon', '#satisfying', '#asmr', '#fisica', '#reto', '#viral']
            },
            pt: {
                header: `DADOS DE PUBLICAÇÃO YOUTUBE SHORTS E TIKTOK (DIA ${day})`,
                lblTitle: '📌 TÍTULO:',
                lblDesc: '📝 DESCRIÇÃO:',
                lblTags: '🏷️ HASHTAGS:',
                formulas: [
                    {
                        title: `Dia ${day}: A Bola Neon Consegue Escapar do Nível ${day}? 😱⚡ #shorts`,
                        desc: `Bem-vindo ao Dia ${day} do Desafio Impossível! Assista até o segundo 27 para ver essa loucura ASMR! Comente sua aposta! 👇`,
                        hook: `DIA ${day}: CONSEGUE ESCAPAR? 🟢`
                    },
                    {
                        title: `Apenas 1% consegue adivinhar o final do Dia ${day}... 🧠🔴 #gaming #shorts`,
                        desc: `O Dia ${day} foi surreal! Você acertou quem ia vencer? Inscreva-se para o Dia ${day + 1}! 🚀`,
                        hook: `DIA ${day}: APENAS 1% ACERTA 💀`
                    },
                    {
                        title: `Espere até o segundo 26... (Nível ${day}) 💀⚡ #satisfying #shorts`,
                        desc: `Que reviravolta no Dia ${day}! Deixe o like se você torceu certo! 🔴🔵 Novo nível amanhã!`,
                        hook: `DIA ${day}: ESPERA O FINAL... 😱`
                    }
                ],
                tags: ['#shorts', `#dia${day}`, '#gaming', '#neon', '#satisfying', '#asmr', '#fisica', '#desafio', '#viral']
            },
            de: {
                header: `YOUTUBE SHORTS & TIKTOK VERÖFFENTLICHUNGSDATEN (TAG ${day})`,
                lblTitle: '📌 TITEL:',
                lblDesc: '📝 BESCHREIBUNG:',
                lblTags: '🏷️ HASHTAGS:',
                formulas: [
                    {
                        title: `Tag ${day}: Kann der Neonball aus Level ${day} entkommen? 😱⚡ #shorts`,
                        desc: `Willkommen zu Tag ${day} der 100-Tage-Challenge! Schau bis Sekunde 27 für pures ASMR-Glück! Schreibe deinen Tipp in die Kommentare! 👇`,
                        hook: `TAG ${day}: SCHAFFT ER ES? 🟢`
                    },
                    {
                        title: `Nur 1% kann das Ende von Tag ${day} vorhersagen... 🧠🔴 #gaming #shorts`,
                        desc: `Tag ${day} ist der absolute Wahnsinn! Hast du dieses unglaubliche Finale gesehen? Abonniere für Tag ${day + 1}! 🚀`,
                        hook: `TAG ${day}: NUR 1% SCHAFFT DAS 💀`
                    },
                    {
                        title: `Warte auf Sekunde 26... (Level ${day}) 💀⚡ #satisfying #shorts`,
                        desc: `Die ASMR-Physik an Tag ${day} ist pure Befriedigung! Lass ein Like da, wenn du richtig lagst! 🔴🔵 Morgen neues Level!`,
                        hook: `TAG ${day}: WARTE DARAUF... 😱`
                    }
                ],
                tags: ['#shorts', `#tag${day}`, '#gaming', '#neon', '#satisfying', '#asmr', '#physik', '#challenge', '#viral']
            }
        };

        const activeDict = templates[lang] || templates['tr'];
        const formula = activeDict.formulas[(day - 1) % activeDict.formulas.length];

        return {
            day,
            lang,
            title: formula.title,
            description: formula.desc,
            hookText: formula.hook,
            tags: activeDict.tags.join(' '),
            fullText: `=============================================================\n${activeDict.header}\n=============================================================\n${activeDict.lblTitle}\n${formula.title}\n\n${activeDict.lblDesc}\n${formula.desc}\n\n${activeDict.lblTags}\n${activeDict.tags.join(' ')}\n=============================================================\n`
        };
    }
}
