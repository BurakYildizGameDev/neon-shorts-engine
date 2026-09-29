// src/modes/ModeManager.js
import { TerritoryWarMode } from './TerritoryWar.js';
import { CircleEscapeMode } from './CircleEscape.js';
import { PlinkoCascadeMode } from './PlinkoCascade.js';
import { BattleRoyaleMode } from './BattleRoyale.js';
import { TowerCrushMode } from './TowerCrush.js';
import { BlackHoleMode } from './BlackHole.js';
import { StairRaceMode } from './StairRace.js';
import { MultiplierGatesMode } from './MultiplierGates.js';
import { HexagonEscapeMode } from './HexagonEscape.js';

export const GAME_MODES = [
    {
        id: 'territory',
        icon: '⚔️',
        name: 'Bölge Savaşı',
        sub: '700+ Blok Boyama',
        desc: 'Takımlar veya ülke bayrakları blokları boyar. Canlı yüzde sayaçları.',
        create: (seed, options) => new TerritoryWarMode(seed, options)
    },
    {
        id: 'multiplier',
        icon: '🔢',
        name: 'Çarpan Kapıları',
        sub: 'x2, x3 & +25 Şelalesi',
        desc: 'Çarpan kapılarından geçip yüzlerce topa katlanan dev Jackpot yarışı.',
        create: (seed, options) => new MultiplierGatesMode(seed, options)
    },
    {
        id: 'hexagonescape',
        icon: '🌀',
        name: 'Altıgen Labirent',
        sub: '5 Dönen Katman',
        desc: '5 iç içe dönen altıgen kapısından dışarı kaçış. Hipnotik ASMR.',
        create: (seed, options) => new HexagonEscapeMode(seed, options)
    },
    {
        id: 'circle',
        icon: '⭕',
        name: 'Dönen Halka',
        sub: 'Hızlanan Kaçış',
        desc: 'İç içe dönen neon halkalar. Her sekmede hızlanan top ve kırılan segmentler.',
        create: (seed, options) => new CircleEscapeMode(seed, options)
    },
    {
        id: 'plinko',
        icon: '🎰',
        name: 'Plinko Kaosu',
        sub: 'ASMR Çivi & Jackpot',
        desc: 'Yüzlerce çivi, çoğaltıcı kapılar ve 80+ topun Jackpot ödül yarışı.',
        create: (seed, options) => new PlinkoCascadeMode(seed, options)
    },
    {
        id: 'battleroyale',
        icon: '💀',
        name: 'Battle Royale',
        sub: '25 Top Hayatta Kalma',
        desc: 'Daralan ölümcül elektrik çemberi ve testereler. Son kalan top kazanır.',
        create: (seed, options) => new BattleRoyaleMode(seed, options)
    },
    {
        id: 'towercrush',
        icon: '🏰',
        name: 'Kule Parçalama',
        sub: '150+ Tuğla Yıkımı',
        desc: 'Dev neon piramidi parçalayan toplar, bombalı bloklar ve kule çöküşü.',
        create: (seed, options) => new TowerCrushMode(seed, options)
    },
    {
        id: 'blackhole',
        icon: '🕳️',
        name: 'Kara Delik',
        sub: 'Yerçekimi Yörüngesi',
        desc: 'Büyüyen neon kara deliğin yörüngesinde dönen 30 top. Yutulmadan kaçış.',
        create: (seed, options) => new BlackHoleMode(seed, options)
    },
    {
        id: 'stairrace',
        icon: '🪜',
        name: 'Merdiven Yarışı',
        sub: '32 Basamak Tırmanış',
        desc: '32 basamaklı merdivende trambolinler ve en tepedeki kupa için düello.',
        create: (seed, options) => new StairRaceMode(seed, options)
    }
];

export function getModeInstance(modeId, seed = 1, options = {}) {
    const found = GAME_MODES.find(m => m.id === modeId) || GAME_MODES[0];
    return found.create(seed, options);
}
