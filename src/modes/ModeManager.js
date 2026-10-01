// src/modes/ModeManager.js
import { TerritoryWarMode } from './TerritoryWar.js';
import { MultiplierGatesMode } from './MultiplierGates.js';
import { HexagonEscapeMode } from './HexagonEscape.js';
import { CircleEscapeMode } from './CircleEscape.js';
import { PlinkoCascadeMode } from './PlinkoCascade.js';
import { BattleRoyaleMode } from './BattleRoyale.js';
import { TowerCrushMode } from './TowerCrush.js';
import { BlackHoleMode } from './BlackHole.js';
import { StairRaceMode } from './StairRace.js';
import { LaserCrossfireMode } from './LaserCrossfire.js';
import { SawbladeGauntletMode } from './SawbladeGauntlet.js';
import { DominoCascadeMode } from './DominoCascade.js';
import { PendulumHammersMode } from './PendulumHammers.js';
import { TugOfWarMode } from './TugOfWar.js';
import { TimeBombMode } from './TimeBomb.js';
import { WallClimbMode } from './WallClimb.js';
import { IceVsLavaMode } from './IceVsLava.js';
import { CellMitosisMode } from './CellMitosis.js';
import { MagneticPolarityMode } from './MagneticPolarity.js';
import { PachinkoMadnessMode } from './PachinkoMadness.js';
import { PortalParadoxMode } from './PortalParadox.js';
import { GravityInversionMode } from './GravityInversion.js';
import { ArchimedesSpiralMode } from './ArchimedesSpiral.js';
import { CyberPinballMode } from './CyberPinball.js';
import { HelixFallMode } from './HelixFall.js';

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
    },
    {
        id: 'lasercrossfire',
        icon: '⚡',
        name: 'Lazer Çapraz Ateş',
        sub: 'Dönen Ölüm Işınları',
        desc: 'Dönen neon lazer ışınları arasından sekerek kaçan toplar.',
        create: (seed, options) => new LaserCrossfireMode(seed, options)
    },
    {
        id: 'sawblade',
        icon: '🪚',
        name: 'Testere Parkuru',
        sub: 'Dönen Dişli Engeller',
        desc: 'Dönen dişli neon testerelerin arasından aşağı inen heyecanlı yarış.',
        create: (seed, options) => new SawbladeGauntletMode(seed, options)
    },
    {
        id: 'domino',
        icon: '🀄',
        name: 'Domino Şelalesi',
        sub: '220 Taşlık Zincirleme Yıkım',
        desc: 'Zincirleme devrilen 220 neon domino taşı ve final altın çanı.',
        create: (seed, options) => new DominoCascadeMode(seed, options)
    },
    {
        id: 'pendulum',
        icon: '🔨',
        name: 'Sarkaç Çekiçleri',
        sub: 'Dev Salınan Çekiçler',
        desc: 'Sağa sola salınan dev neon çekiçlerden kaçarak tabana inme mücadelesi.',
        create: (seed, options) => new PendulumHammersMode(seed, options)
    },
    {
        id: 'tugofwar',
        icon: '🪢',
        name: 'Halat Çekme Savaşı',
        sub: 'Enerji Düğümü Düellosu',
        desc: 'İki rakip takım enerji halatını kendi sınırına çekmek için çarpışır.',
        create: (seed, options) => new TugOfWarMode(seed, options)
    },
    {
        id: 'timebomb',
        icon: '💣',
        name: 'Saatli Bomba',
        sub: 'Sıcak Patates Kaosu',
        desc: 'Çarpışmayla el değiştiren fitilli saatli bomba. Geri sayım bitince patlar!',
        create: (seed, options) => new TimeBombMode(seed, options)
    },
    {
        id: 'wallclimb',
        icon: '🧗',
        name: 'Duvar Tırmanışı',
        sub: 'Zikzak Tırmanma Yarışı',
        desc: 'Yan duvarlara zikzak sekerek en tepedeki altın zile ilk ulaşan kazanır.',
        create: (seed, options) => new WallClimbMode(seed, options)
    },
    {
        id: 'icevslava',
        icon: '❄️',
        name: 'Buz vs Lav',
        sub: 'Termal Alan Savaşı',
        desc: 'Kaygan dondurucu buz diyarı ve kaynayan lav diyarı arasındaki büyük çarpışma.',
        create: (seed, options) => new IceVsLavaMode(seed, options)
    },
    {
        id: 'mitosis',
        icon: '🦠',
        name: 'Hücre Bölünmesi',
        sub: 'Mitoz Çoğalma Zinciri',
        desc: 'Prizmalara çarptıkça 2ye katlanan hücreler. ASMR pentatonik tonlar.',
        create: (seed, options) => new CellMitosisMode(seed, options)
    },
    {
        id: 'magnetic',
        icon: '🧲',
        name: 'Manyetik Kutuplar',
        sub: 'Artı Eksi Çekim Alanı',
        desc: 'Dönen manyetik kutuplar, elektrik arkları ve zıt kutup çekimi.',
        create: (seed, options) => new MagneticPolarityMode(seed, options)
    },
    {
        id: 'pachinko',
        icon: '🪙',
        name: 'Çılgın Pachinko',
        sub: 'Pirinç Pinler & Fever',
        desc: 'Tokyo usulü pirinç çivili pachinko masası, lale hazneleri ve altın fever.',
        create: (seed, options) => new PachinkoMadnessMode(seed, options)
    },
    {
        id: 'portal',
        icon: '🌀',
        name: 'Boyut Kapıları',
        sub: 'Kuantum Işınlanma',
        desc: 'Mavi ve turuncu portallarla hızlanan sonsuz döngü yerçekimi sapanı.',
        create: (seed, options) => new PortalParadoxMode(seed, options)
    },
    {
        id: 'gravityflip',
        icon: '🔄',
        name: 'Yerçekimi Kaosu',
        sub: '4 Yönlü Ters Dönüş',
        desc: 'Her 3 saniyede yön değiştiren yerçekimi ve 4 duvar trambolini.',
        create: (seed, options) => new GravityInversionMode(seed, options)
    },
    {
        id: 'spiral',
        icon: '🌀',
        name: 'Arşimet Spirali',
        sub: 'Sarmal Girdap Yarışı',
        desc: 'Merkeze yaklaştıkça hızlanan 5 turlu Arşimet spiral kaydırağı.',
        create: (seed, options) => new ArchimedesSpiralMode(seed, options)
    },
    {
        id: 'pinball',
        icon: '🕹️',
        name: 'Siber Pinball',
        sub: 'Otomatik Flipper & Bumper',
        desc: 'Retro siberpunk pinball masası, mekanik flipperlar ve dev tamponlar.',
        create: (seed, options) => new CyberPinballMode(seed, options)
    },
    {
        id: 'helix',
        icon: '🗼',
        name: 'Sarmal Kule İnişi',
        sub: 'Helix Jump & Fireball',
        desc: 'Dönen 3D sarmal kuleden aşağı kademeli süzülüş ve Fireball komboları.',
        create: (seed, options) => new HelixFallMode(seed, options)
    }
];

export function getModeInstance(modeId, seed = 1, options = {}) {
    const found = GAME_MODES.find(m => m.id === modeId) || GAME_MODES[0];
    return found.create(seed, options);
}
