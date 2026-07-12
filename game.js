/* ============================================================================
   Echoes of the Aether Crystal — Idle Defense
   Game engine (Agent E). Design formulas from Agent B, sprites from Agent C,
   audio from audio.js. Skills + visible attack FX added in the feature update.
   ========================================================================== */
'use strict';

// ------------------------------------------------------------------ constants
const SAVE_KEY = 'aether_crystal_save_v1';
const OFFLINE_CAP_S = 8 * 3600;        // offline earnings capped at 8h
const SPAWN_INTERVAL = 0.8;            // seconds between enemy spawns
const BOSS_EVERY = 5;                  // boss on every 5th wave (mini-boss w5, stage boss w10)
// Progression: 10 waves per stage, up to stage 99. `wave` stays a global 1.. counter
// (drives all scaling); stage/wave-in-stage are derived for display and unlocks.
const STAGE_WAVES = 10;
const STAGE_MAX = 99;
const stageOf     = w => Math.floor((w - 1) / STAGE_WAVES) + 1;
const waveInStage = w => ((w - 1) % STAGE_WAVES) + 1;
const dispStage   = w => Math.min(STAGE_MAX, stageOf(w));

// Hero definitions (bases per Agent B's spec). Each hero has ONE auto-cast AoE
// skill with its own cooldown, damage multiplier and a distinct visible effect.
const HERO_DEFS = [
  { id:'garran', name:'Sir Garran', role:'Bulwark Knight · Tank',
    baseDmg:8,  baseCost:15, atkInterval:1.0,  target:'single', unlockWave:1,
    draw:'drawKnight', color:'#5b8dff',
    skill:{ name:'Seismic Slam',   icon:'🌋', cd:8,  mult:3.5, kind:'shock',    fx:'#ffcc66' } },
  { id:'mira',   name:'Mira',       role:'Emberwind Mage · AoE',
    baseDmg:4,  baseCost:20, atkInterval:1.4,  target:'all',    unlockWave:10,
    draw:'drawMage', color:'#c76bff',
    skill:{ name:'Frost Nova',     icon:'❄️', cd:7,  mult:3.0, kind:'frost',    fx:'#8fe0ff' } },
  { id:'faye',   name:'Faye',       role:'Gale Archer · Fast',
    baseDmg:2,  baseCost:12, atkInterval:0.333, target:'single', unlockWave:25,
    draw:'drawArcher', color:'#5be18a',
    skill:{ name:'Explosive Arrow', icon:'💥', cd:6, mult:5.0, kind:'explode',  fx:'#ff9d3c' } },
  { id:'rai',    name:'Rai',        role:'Storm Ronin · Chain',
    baseDmg:6,  baseCost:40, atkInterval:0.7,  target:'single', unlockWave:50,
    draw:'drawRonin', color:'#7ad0ff',
    skill:{ name:'Chain Lightning', icon:'⚡', cd:5, mult:4.0, kind:'chain',    fx:'#bff0ff' } },
  { id:'aunel',  name:'Aunel',      role:'Dawn Healer · Support',
    baseDmg:0,  baseCost:25, atkInterval:1.0,  target:'support', unlockWave:100,
    draw:'drawHealer', color:'#ffe08a',
    skill:{ name:'Dawn Blessing',   icon:'🌅', cd:12, mult:0,   kind:'blessing', fx:'#ffe9a0' } },
];

// Enemy archetypes: hp/speed/render-size multipliers, gold bonus, slow immunity,
// element (drives weakness/resist) and armor (flat damage reduction).
const ENEMY_TYPES = {
  normal:  { hp:1.0, spd:26, size:1.0,  gold:1, element:'earth'  },
  fast:    { hp:0.6, spd:46, size:0.9,  gold:1, element:'poison' },
  runner:  { hp:0.4, spd:62, size:0.85, gold:1, element:'poison' },
  tank:    { hp:2.2, spd:18, size:1.5,  gold:2, element:'dark',  armor:0.25 },
  golem:   { hp:4.5, spd:13, size:2.0,  gold:4, element:'earth', armor:0.40 },
  wraith:  { hp:1.3, spd:34, size:1.1,  gold:2, element:'dark', slowImmune:true, float:true },
  // ---- later-stage variants (reuse sprites, distinct element/behaviour) ----
  imp:     { hp:0.7, spd:44, size:0.85, gold:1, element:'fire',   sprite:'slime'    },
  frostkin:{ hp:1.3, spd:24, size:1.0,  gold:2, element:'frost',  sprite:'specter'  },
  venom:   { hp:1.5, spd:30, size:1.1,  gold:2, element:'poison', sprite:'zombie'   },
  shade:   { hp:0.9, spd:54, size:0.95, gold:2, element:'void',   sprite:'specter', slowImmune:true, float:true },
  brute:   { hp:3.2, spd:17, size:1.6,  gold:3, element:'physical', armor:0.20, sprite:'skeleton' },
  revenant:{ hp:2.6, spd:21, size:1.4,  gold:3, element:'lightning', sprite:'skeleton' },
};
// Element matchups: attacking an enemy with its `weak` element deals +60%,
// with its `resist` element deals -50%. Bosses: dragon=fire, elderghost=void.
const ELEM_MATCH = {
  earth:    { weak:'fire',      resist:'physical'  },
  poison:   { weak:'fire',      resist:'poison'    },
  dark:     { weak:'holy',      resist:'dark'      },
  fire:     { weak:'frost',     resist:'fire'      },
  void:     { weak:'holy',      resist:'dark'      },
  frost:    { weak:'fire',      resist:'frost'     },
  lightning:{ weak:'earth',     resist:'lightning' },
  physical: { weak:'lightning', resist:'physical'  },
};
const ELEM_ICON = { physical:'⚔️', fire:'🔥', frost:'❄️', lightning:'⚡', holy:'✨', earth:'🪨', dark:'🌑', poison:'☠️', void:'🌀' };
const ELEM_COLOR = { physical:'#cdd6f4', fire:'#ff7a3c', frost:'#7bd3ff', lightning:'#ffe066', holy:'#fff0b0', earth:'#8fd07a', dark:'#b07bff', poison:'#9be36a', void:'#c58bff' };
// hero attack elements (one per hero, used for basic + skill)
const HERO_ELEM = { garran:'physical', mira:'frost', faye:'fire', rai:'lightning', aunel:'holy' };
function bossElement(kind){ return kind === 'dragon' ? 'fire' : 'void'; }
// returns {mult, kind} for an attack element vs an enemy's element
// Keystones: pick ONE build-defining perk (mutually exclusive, free to switch).
const KEYSTONES = {
  cannon:     { name:'Glass Cannon', icon:'💥', color:'#ff6b6b', desc:'+100% damage dealt, but the Crystal takes +60% damage.' },
  fortress:   { name:'Fortress',     icon:'🛡️', color:'#5bc8ff', desc:'Crystal takes −60% damage, but you deal −30% damage.' },
  momentum:   { name:'Momentum',     icon:'🔥', color:'#ffb93c', desc:'Your kill-streak also boosts damage (up to +100%) and doubles the combo gold bonus.' },
  avarice:    { name:'Avarice',      icon:'🪙', color:'#ffd75e', desc:'+150% gold from kills, but every enemy has +35% HP.' },
  attunement: { name:'Attunement',   icon:'🌈', color:'#c58bff', desc:'Elemental weakness hits deal ×2.2 (up from ×1.6) and you ignore enemy resistances.' },
};
function ksIs(id){ return S && S.keystone === id; }
function enemyHpMul(){ return ksIs('avarice') ? 1.35 : 1; }     // Avarice: tougher enemies

function elemVs(enemyEl, atkEl){
  const m = ELEM_MATCH[enemyEl];
  if (!m || !atkEl) return { mult:1, kind:null };
  const att = ksIs('attunement');
  if (m.weak === atkEl)   return { mult: att ? 2.2 : 1.6, kind:'weak' };
  if (m.resist === atkEl) return { mult: att ? 1 : 0.5, kind: att ? null : 'resist' };
  return { mult:1, kind:null };
}
// which bestiary monster each enemy type uses (falls back to canvas art)
const ENEMY_SPRITE = { normal:'slime', fast:'zombie', runner:'zombie', tank:'skeleton', golem:'skeleton', wraith:'specter',
  imp:'slime', frostkin:'specter', venom:'zombie', shade:'specter', brute:'skeleton', revenant:'skeleton' };
const SLOW_FACTOR = 0.42;              // movement multiplier while frozen
const BURN_DUR = 1.6;                  // seconds an enemy shows the burning FX
const PARTY_BUFF_MUL = 1.30;           // Aunel's Dawn Blessing damage buff

// Permanent shard-shop upgrades (persist through prestige)
const SHARD_UPGRADES = [
  { id:'power', name:'Aether Power', desc:'+2% global hero damage', base:1, growth:1.6,
    max:50, effect:l=>1+0.02*l, fmt:l=>`+${l*2}% dmg` },
  { id:'gold',  name:'Golden Fortune', desc:'+5% gold from kills', base:2, growth:1.7,
    max:40, effect:l=>1+0.05*l, fmt:l=>`+${l*5}% gold` },
  { id:'speed', name:'Time Dilation', desc:'+3% game speed', base:3, growth:1.8,
    max:20, effect:l=>1+0.03*l, fmt:l=>`+${l*3}% speed` },
  { id:'ward',  name:'Crystal Ward', desc:'+20% crystal max HP', base:2, growth:1.65,
    max:30, effect:l=>1+0.20*l, fmt:l=>`+${l*20}% HP` },
  { id:'crit',  name:'Keen Edge', desc:'+3% critical hit chance', base:2, growth:1.7,
    max:20, effect:l=>1, fmt:l=>`${(3+3*l)}% crit` },
];

const CRIT_MULT = 2.5;                  // base critical hit damage multiplier
function critChance(){ return Math.min(0.75, 0.03 + 0.03 * S.shardUpg.crit + relicBonus('crit')); }
function critMultiplier(){ return CRIT_MULT + 0.1 * talent('precision'); }
function critRoll(dmg){
  return Math.random() < critChance() ? { dmg: dmg * critMultiplier(), crit:true } : { dmg, crit:false };
}

// --- Talent tree: spent with Talent Points (earned from prestige + achievements)
const TALENTS = [
  { id:'might',     branch:'⚔️ Offense', name:'Might',        desc:'+5% all damage',          max:10, cost:2, fmt:l=>`+${5*l}% dmg` },
  { id:'precision', branch:'⚔️ Offense', name:'Precision',    desc:'+0.1× critical damage',   max:5,  cost:2, fmt:l=>`×${(CRIT_MULT+0.1*l).toFixed(1)} crit` },
  { id:'haste',     branch:'⚔️ Offense', name:'Haste',        desc:'+5% attack speed',        max:8,  cost:2, fmt:l=>`+${5*l}% spd` },
  { id:'bulwark',   branch:'🛡️ Defense', name:'Bulwark',      desc:'+10% crystal defense',    max:8,  cost:1, fmt:l=>`+${10*l}% def` },
  { id:'regen',     branch:'🛡️ Defense', name:'Regeneration', desc:'+0.5%/s crystal regen',   max:6,  cost:1, fmt:l=>`+${(0.5*l).toFixed(1)}%/s` },
  { id:'greed',     branch:'💰 Economy', name:'Greed',        desc:'+8% gold from kills',     max:8,  cost:1, fmt:l=>`+${8*l}% gold` },
  { id:'fortune',   branch:'💰 Economy', name:'Fortune',      desc:'+1% golden enemy chance', max:5,  cost:2, fmt:l=>`+${l}% golden` },
  { id:'focus',     branch:'✨ Skills',  name:'Focus',        desc:'-4% skill cooldown',      max:8,  cost:2, fmt:l=>`-${4*l}% CD` },
  { id:'empower',   branch:'✨ Skills',  name:'Empower',      desc:'+10% skill damage',       max:8,  cost:2, fmt:l=>`+${10*l}% skill` },
  { id:'grace',     branch:'✨ Skills',  name:'Grace',        desc:'+1s party buff',          max:5,  cost:1, fmt:l=>`+${l}s buff` },
];
const talent = id => (S.talents[id] || 0);

// talent-derived modifiers
function effInterval(def){ return Math.max(0.05, def.atkInterval * (1 - 0.05 * talent('haste')) / (odActive() ? OD_RATE : 1)); }
function effSkillCd(def){ return def.skill.cd * (1 - 0.04 * talent('focus')); }
function wardMul(){ return shardMul('ward') * (1 + 0.10 * talent('bulwark')); }
function goldMulAll(){ return shardMul('gold') * (1 + 0.08 * talent('greed')) * (1 + relicBonus('gold')) * (ksIs('avarice') ? 2.5 : 1); }
function goldenChance(){ return 0.03 + 0.01 * talent('fortune'); }

// --- Relics: boss drops that grant a global bonus. Rarity scales the roll.
const RELIC_SLOTS = 4;
const RELIC_TYPES = {
  power:   { name:'Ember Sigil',    icon:'🔥', stat:'dmg',  per:0.08, fmt:v=>`+${Math.round(v*100)}% damage` },
  fortune: { name:'Gilded Idol',    icon:'🪙', stat:'gold', per:0.12, fmt:v=>`+${Math.round(v*100)}% gold` },
  edge:    { name:'Keen Talisman',  icon:'🗡️', stat:'crit', per:0.05, fmt:v=>`+${Math.round(v*100)}% crit chance` },
  bulwark: { name:'Aegis Rune',     icon:'🛡️', stat:'ward', per:0.10, fmt:v=>`+${Math.round(v*100)}% crystal HP` },
};
const RELIC_RARITY = [
  { id:'common',    name:'Common',    color:'#9fb0d8', mul:1 },
  { id:'rare',      name:'Rare',      color:'#5bc8ff', mul:2 },
  { id:'epic',      name:'Epic',      color:'#c58bff', mul:3.2 },
  { id:'legendary', name:'Legendary', color:'#ffb93c', mul:5 },
  // Mythic: ultra-rare (0.1%) golden relic that carries TWO stats at once.
  { id:'mythic',    name:'Mythic',    color:'#ffd75e', mul:6, dual:true },
];
const MYTHIC_CHANCE = 0.001;   // 0.1% chance for a dual-stat golden relic
function rollRarity(wave){
  const r = Math.random() + Math.min(0.25, wave/800);   // deeper waves skew higher
  return r>1.15 ? RELIC_RARITY[3] : r>0.9 ? RELIC_RARITY[2] : r>0.55 ? RELIC_RARITY[1] : RELIC_RARITY[0];
}
function rarityMul(id){ return RELIC_RARITY.find(r=>r.id===id)?.mul || 1; }
function relicValue(rel){ return RELIC_TYPES[rel.type].per * rarityMul(rel.rarity); }        // primary stat
function relicValue2(rel){ return rel.type2 ? RELIC_TYPES[rel.type2].per * rarityMul(rel.rarity) : 0; }  // 2nd stat
// summed bonus of equipped relics for a given stat (counts both stats of a Mythic)
function relicBonus(stat){
  let v = 0;
  for (const id of (S.equipped||[])){
    const rel = (S.relics||[]).find(r=>r.id===id);
    if (!rel) continue;
    if (RELIC_TYPES[rel.type].stat === stat) v += relicValue(rel);
    if (rel.type2 && RELIC_TYPES[rel.type2].stat === stat) v += relicValue2(rel);
  }
  return v;
}
function grantRelic(wave){
  const types = Object.keys(RELIC_TYPES);
  if (Math.random() < MYTHIC_CHANCE){           // 0.1% golden dual-stat Mythic
    const a = (Math.random()*types.length)|0;
    const b = (a + 1 + ((Math.random()*(types.length-1))|0)) % types.length;   // distinct, no loop
    const rel = { id: ++S.relicSeq, type: types[a], type2: types[b], rarity:'mythic' };
    S.relics.push(rel);
    if (S.equipped.length < RELIC_SLOTS) S.equipped.push(rel.id);
    const ta = RELIC_TYPES[types[a]], tb = RELIC_TYPES[types[b]];
    toast(`🌟 MYTHIC RELIC! ${ta.icon}${tb.icon} ${ta.fmt(relicValue(rel))} & ${tb.fmt(relicValue2(rel))}`);
    spawnParticles(view.w/2, view.h*0.4, 'holy', 2.4);
    GA('prestige');
    return;
  }
  const type = types[(Math.random()*types.length)|0];
  const rar = rollRarity(wave);
  const rel = { id: ++S.relicSeq, type, rarity: rar.id };
  S.relics.push(rel);
  if (S.equipped.length < RELIC_SLOTS) S.equipped.push(rel.id);   // auto-equip while slots free
  const t = RELIC_TYPES[type];
  toast(`${t.icon} ${rar.name} ${t.name} dropped! (${t.fmt(relicValue(rel))})`);
  GA('prestige');
}

// --- Achievements: one-time unlocks that pay Talent Points + spendable Shards
const ACHIEVEMENTS = [
  { id:'w25',  name:'Rising Tide',      desc:'Reach Wave 25',            tp:1, shards:1, check:()=>S.bestWave>=25 },
  { id:'w50',  name:'Half a Hundred',   desc:'Reach Wave 50',            tp:1, shards:2, check:()=>S.bestWave>=50 },
  { id:'w100', name:'Centurion',        desc:'Reach Wave 100',           tp:2, shards:3, check:()=>S.bestWave>=100 },
  { id:'w200', name:'Unbroken',         desc:'Reach Wave 200',           tp:3, shards:5, check:()=>S.bestWave>=200 },
  { id:'k1k',  name:'Monster Hunter',   desc:'Defeat 1,000 enemies',     tp:1, shards:1, check:()=>S.totalKills>=1000 },
  { id:'k10k', name:'Legion Breaker',   desc:'Defeat 10,000 enemies',    tp:2, shards:3, check:()=>S.totalKills>=10000 },
  { id:'g1m',  name:'Treasurer',        desc:'Earn 1M total gold',       tp:1, shards:1, check:()=>S.totalGoldEarned>=1e6 },
  { id:'g1b',  name:'Tycoon',           desc:'Earn 1B total gold',       tp:2, shards:3, check:()=>S.totalGoldEarned>=1e9 },
  { id:'gold', name:'Lucky Strike',     desc:'Slay a golden enemy',      tp:1, shards:1, check:()=>S.goldenKills>=1 },
  { id:'team', name:'Fellowship',       desc:'Recruit all 5 heroes',     tp:2, shards:2, check:()=>HERO_DEFS.every(d=>S.heroLevels[d.id]>0) },
  { id:'p1',   name:'First Reseal',     desc:'Prestige once',            tp:1, shards:0, check:()=>S.prestiges>=1 },
  { id:'p10',  name:'Eternal Guardian', desc:'Prestige 10 times',        tp:3, shards:5, check:()=>S.prestiges>=10 },
];
function checkAchievements(){
  for (const a of ACHIEVEMENTS){
    if (!S.achievements[a.id] && a.check()){
      S.achievements[a.id] = true;
      S.talentPoints += a.tp;
      S.shards += a.shards;
      const reward = [a.tp?`+${a.tp} TP`:'', a.shards?`+${a.shards}💠`:''].filter(Boolean).join(', ');
      toast('🏆 ' + a.name + (reward ? ' — ' + reward : ''));
      GA('prestige');
    }
  }
}

// --- Endless milestones: every 25 waves of a NEW best pays shards (+TP each 100)
const MILESTONE_STEP = 10;    // reward on each stage clear (10 waves)
const nextMilestone = () => Math.floor(S.bestWave / MILESTONE_STEP) * MILESTONE_STEP + MILESTONE_STEP;
function awardMilestones(from, to){
  let sh = 0, tp = 0, n = 0, top = 0;
  for (let m = Math.floor(from/MILESTONE_STEP)*MILESTONE_STEP + MILESTONE_STEP; m <= to; m += MILESTONE_STEP){
    sh += 1 + Math.floor(m/100); if (m % 100 === 0) tp += 1; n++; top = m;
  }
  if (!n) return;
  S.shards += sh; S.talentPoints += tp;
  toast(`🏅 Stage ${dispStage(top)} cleared${n>1?` (×${n})`:''}! +${sh}💠${tp?` +${tp}🌳`:''}`);
  GA('prestige');
}
// advance the lifetime best wave, paying any milestones crossed
function reachWave(w){ if (w > S.bestWave){ awardMilestones(S.bestWave, w); S.bestWave = w; } }

// ------------------------------------------------------------------ formulas
const enemyHP    = w => 10 * Math.pow(1.12, w - 1);
const enemyCount = w => Math.min(5 + Math.floor(w / 3), 20);
// gold now grows with the HP wall (was 1.10 — income fell behind every wave)
const goldPerKill= w => Math.ceil(2 * Math.pow(1.12, w - 1));
const isBossWave = w => w % BOSS_EVERY === 0;
// linear per level + a ×2 milestone every 25 levels, so leveling keeps pace
// with exponential enemy HP instead of decaying to worthless mid-game
const heroDmg    = (def, lvl) => def.baseDmg * (1 + 0.25 * lvl) * Math.pow(2, Math.floor(lvl / 25));
const heroCost   = (def, lvl) => Math.ceil(def.baseCost * Math.pow(1.15, lvl));
const prestigeShards = totalGold => Math.floor(Math.sqrt(totalGold / 1e6));
// support heroes (baseDmg 0) still get a scaling number for their skill
const skillBase  = (def, lvl) => def.baseDmg > 0 ? heroDmg(def, lvl) : (8 + 6 * lvl);

function fmt(n){
  if (!isFinite(n)) return '∞';
  n = Math.floor(n);
  if (n < 1000) return '' + n;
  const units = ['','K','M','B','T','Qa','Qi','Sx','Sp'];
  let u = 0;
  while (n >= 1000 && u < units.length - 1){ n /= 1000; u++; }
  return n.toFixed(n < 10 ? 2 : n < 100 ? 1 : 0) + units[u];
}

// ------------------------------------------------------------------ audio helper
function GA(name){
  const A = window.GameAudio;
  if (A && A.sfx && A.sfx[name]) A.sfx[name]();
}
let sfxGap = 0;                        // throttle for frequent basic-attack sfx
function basicSfx(name){ if (sfxGap <= 0){ GA(name); sfxGap = 0.10; } }

// ------------------------------------------------------------------ state
let S = null;
function freshState(){
  return {
    wave: 1,
    gold: 0,
    shards: 0,              // spendable shard balance
    shardsEarned: 0,        // lifetime shards ever awarded (monotonic)
    totalGoldEarned: 0,     // lifetime gold, drives prestige payout
    heroLevels: { garran:1, mira:0, faye:0, rai:0, aunel:0 },
    shardUpg: { power:0, gold:0, speed:0, ward:0, crit:0 },
    crystalHp: 1,           // fraction 0..1
    speed: 1,
    lastSeen: Date.now(),
    recentGoldRate: [],     // gold/sec samples of recent waves (for offline calc)
    goldHistory: [],        // {w,r} gold/sec per cleared wave (Stats chart, last 60)
    bestWave: 1,            // lifetime best wave reached
    totalKills: 0,          // lifetime enemies defeated
    goldenKills: 0,         // golden enemies slain (lifetime)
    prestiges: 0,           // number of reseals performed
    achievements: {},       // id -> true when unlocked
    talents: {},            // talent node id -> level
    talentPoints: 0,        // spendable talent points
    kills: {},              // bestiary sprite id -> lifetime kill count
    bestCombo: 0,           // highest kill-streak combo reached
    relics: [],             // owned relics [{id,type,rarity}]
    equipped: [],           // relic ids equipped (max RELIC_SLOTS)
    relicSeq: 0,            // running id counter for relics
    towerLv: 0,             // gold-bought Fortify Tower level (resets on reseal)
    autoUp: false,          // auto-buy the cheapest affordable hero upgrade
    seenIntro: false,       // shown the first-run tutorial yet?
    keystone: null,         // chosen build-defining keystone id (or null)
    settings: { dmgNums:true, fx:true, shake:true },   // display/perf toggles
    buyMode: 1,             // hero bulk-buy amount: 1, 10, or 'max'
  };
}

function load(){
  try{
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const d = JSON.parse(raw);
    const base = freshState();
    return Object.assign(base, d, {
      heroLevels: Object.assign(base.heroLevels, d.heroLevels || {}),
      shardUpg:   Object.assign(base.shardUpg,   d.shardUpg   || {}),
      kills:      Object.assign(base.kills,      d.kills      || {}),
      settings:   Object.assign(base.settings,   d.settings   || {}),
      relics:   Array.isArray(d.relics)   ? d.relics   : [],
      equipped: Array.isArray(d.equipped) ? d.equipped : [],
    });
  }catch(e){ return null; }
}
function save(){
  S.lastSeen = Date.now();
  try{ localStorage.setItem(SAVE_KEY, JSON.stringify(S)); }catch(e){}
}

// ------------------------------------------------------------ derived getters
const shardMul = id => {
  const def = SHARD_UPGRADES.find(u => u.id === id);
  return def.effect(S.shardUpg[id]);
};
function globalDmgMul(){
  // shard power + earned-shard aura (+2% per shard ever earned) + Aunel aura
  let m = shardMul('power') * (1 + 0.02 * S.shardsEarned);
  const aunelLv = S.heroLevels.aunel;
  if (aunelLv > 0) m *= 1 + 0.03 * aunelLv;          // Aunel passive damage aura
  m *= 1 + relicBonus('dmg');                         // equipped relics
  return m;
}
function ksDmgMul(){
  let m = ksIs('cannon') ? 2 : ksIs('fortress') ? 0.7 : 1;
  if (ksIs('momentum')) m *= 1 + Math.min(combo, COMBO_MAX) / COMBO_MAX;   // damage scales with streak
  return m;
}
function combatMul(){ return globalDmgMul() * (partyBuffT > 0 ? PARTY_BUFF_MUL : 1) * (1 + 0.05 * talent('might')) * (odActive() ? OD_DMG : 1) * ksDmgMul(); }
function towerHpMul(){ return 1 + 0.15 * S.towerLv; }          // Fortify Tower (gold)
function towerCost(){ return Math.ceil(60 * Math.pow(1.55, S.towerLv)); }
function crystalMaxHp(){ return 100 * wardMul() * (1 + relicBonus('ward')) * towerHpMul(); }
function gameSpeed(){ return S.speed * shardMul('speed'); }

// ------------------------------------------------------------------ combat sim
const enemies = [];          // {x,y,hp,maxHp,type,speed,frame,boss,slow,goldMul,atkTimer}
const fx = [];               // visible attack effects
const floaters = [];         // damage/gold popups {x,y,txt,color,life}
const heroTimers = {};       // basic-attack cooldown per hero
const skillTimers = {};      // skill cooldown accumulator per hero
const heroFlash = {};        // attack-flash timer per hero id (survives heroSlots rebuilds)
const heroAnim = {};         // per-hero sprite-sheet animation state {name, t}
let spawnTimer = 0, spawnedThisWave = 0, waveKills = 0, waveGoldAccum = 0, waveTime = 0;
let partyBuffT = 0;          // remaining seconds of Aunel's damage buff
let shakeT = 0, shakeAmt = 0;   // screen-shake timer + magnitude
function shake(amt){ if (S && S.settings && S.settings.shake){ shakeAmt = Math.max(shakeAmt, amt); shakeT = 0.22; } }
// kill-streak combo: rapid consecutive kills build a gold bonus
let combo = 0, comboT = 0;   // current streak + seconds left before it resets
const COMBO_WINDOW = 2.6;    // seconds to land the next kill and keep the streak
const COMBO_MAX = 60;        // combo count where the gold bonus caps
// gold bonus from the current streak: up to +150% at COMBO_MAX
function comboMul(){ return 1 + Math.min(combo, COMBO_MAX) / COMBO_MAX * 1.5 * (ksIs('momentum') ? 2 : 1); }
function comboTier(){ return combo>=50?4 : combo>=30?3 : combo>=15?2 : combo>=5?1 : 0; }
// Overdrive: kills charge a gauge; when full, activate for a burst of power
let odCharge = 0, odT = 0;         // gauge 0..1, active seconds remaining
const OD_KILLS = 45;               // kills to fully charge
const OD_DUR = 8;                  // active duration (s)
const OD_DMG = 2.0, OD_RATE = 1.5; // damage ×2, attack speed ×1.5 while active
function odActive(){ return odT > 0; }
// auto-upgrade: periodically buy the single cheapest affordable hero upgrade
let autoUpT = 0;
function autoUpgradeStep(){
  let best = null, bestCost = Infinity;
  for (const def of HERO_DEFS){
    const lvl = S.heroLevels[def.id];
    const unlocked = lvl > 0 || def.unlockWave <= 1 || S.wave >= def.unlockWave;
    if (!unlocked) continue;
    const cost = heroCost(def, lvl);
    if (cost <= S.gold && cost < bestCost){ best = def; bestCost = cost; }
  }
  if (best) buyHero(best);
}
function tryOverdrive(){
  if (odActive() || odCharge < 1) return false;
  odCharge = 0; odT = OD_DUR;
  toast('⚡ OVERDRIVE! ×2 damage, ×1.5 attack speed');
  spawnParticles(view.w/2, view.ground - 60, 'holy', 2.2);
  GA('prestige');
  return true;
}

// Layout (in canvas coords, set on resize)
const view = { w: 900, h: 460, ground: 380, crystalX: 90, laneRight: 880 };

function heroSlots(){
  const px = view.w / 900;
  const startX = view.crystalX + 58 * px;
  const gap = 56 * px;
  return HERO_DEFS.map((d, i) => ({
    def: d,
    x: startX + i * gap,
    y: view.ground,
    active: S.heroLevels[d.id] > 0,
  }));
}

// Monster roster grows with the stage: each tier introduces new archetypes.
function pickType(w){
  const st = stageOf(w);
  const pool = ['normal', 'normal', 'fast'];
  if (st >= 2)  pool.push('runner');
  if (st >= 3)  pool.push('tank');
  if (st >= 4)  pool.push('wraith');
  if (st >= 5)  pool.push('golem', 'imp');
  if (st >= 7)  pool.push('frostkin');
  if (st >= 9)  pool.push('venom');
  if (st >= 11) pool.push('shade');
  if (st >= 14) pool.push('brute');
  if (st >= 18) pool.push('revenant');
  return pool[Math.floor(Math.random() * pool.length)];
}

// Wave events: random modifiers on ordinary waves (never boss waves)
const WAVE_EVENTS = {
  swarm:  { name:'Swarm',     icon:'🐛', desc:'Double the horde!',    color:'#7CFC55', count:2.0, hp:0.6, spd:1.0, gold:1.0 },
  elite:  { name:'Elite Wave',icon:'💀', desc:'Few, but deadly',      color:'#ff5db1', count:0.5, hp:2.8, spd:0.9, gold:3.5 },
  rush:   { name:'Gold Rush', icon:'🪙', desc:'Every foe is golden!', color:'#ffd75e', count:1.0, hp:1.0, spd:1.1, gold:1.0, golden:true },
  frenzy: { name:'Frenzy',    icon:'⚡', desc:'They charge fast!',     color:'#7bd3ff', count:1.2, hp:0.9, spd:1.7, gold:1.5 },
};
let curEvent = null;   // active wave event def (or null)
function waveSpawnCount(w){
  if (isBossWave(w)) return 1;
  return Math.max(1, Math.round(enemyCount(w) * (curEvent ? curEvent.count : 1)));
}

function spawnEnemy(w){
  if (isBossWave(w)){
    const hp = enemyHP(w) * 8 * enemyHpMul();
    const bossKind = (Math.floor(w / BOSS_EVERY) % 2 === 0) ? 'elderghost' : 'dragon';
    enemies.push({ x: view.laneRight, y: view.ground, hp, maxHp: hp,
      type:'boss', speed:18, frame:0, boss:true, bossKind, element: bossElement(bossKind),
      slow:0, goldMul:10, atkTimer:0, age:0 });
    return;
  }
  const ev = curEvent;
  const type = pickType(w);
  const t = ENEMY_TYPES[type];
  const hp = enemyHP(w) * t.hp * (ev ? ev.hp : 1) * enemyHpMul();
  const golden = (ev && ev.golden) || (w >= 8 && Math.random() < goldenChance());
  let goldMul = t.gold * (ev ? ev.gold : 1);
  if (golden) goldMul *= 30;
  // special abilities: slimes split (from wave 15), golems carry a shield
  const split = type === 'normal' && w >= 15 && !golden;
  const shield = type === 'golem' ? hp * 0.5 : 0;
  enemies.push({
    x: view.laneRight + Math.random()*40, y: view.ground,
    hp, maxHp: hp, type, speed: t.spd * (ev ? ev.spd : 1), frame:0, boss:false,
    element: t.element, armor: t.armor || 0, split, shield, maxShield: shield,
    slow:0, goldMul, golden, atkTimer:0, age:0,
  });
}

function startWave(w){
  spawnTimer = 0; spawnedThisWave = 0; waveKills = 0;
  waveGoldAccum = 0; waveTime = 0;
  // roll a random event on ordinary waves from wave 6 on (~22% of them)
  curEvent = null;
  if (!isBossWave(w) && w >= 6 && Math.random() < 0.22){
    const keys = Object.keys(WAVE_EVENTS);
    curEvent = WAVE_EVENTS[keys[(Math.random()*keys.length)|0]];
    toast(`${curEvent.icon} ${curEvent.name} — ${curEvent.desc}`);
    GA('boss');
  }
}

function addFloater(x, y, txt, color){ floaters.push({ x, y, txt, color, life: 1 }); }
function addFx(o){ o.t = 0; if (o.dur == null) o.dur = 0.3; fx.push(o); if (fx.length > 140) fx.shift(); }

// ---------------------------------------------------- glowing particle system
const PI2 = Math.PI * 2;
const particles = [];
const MAX_PARTICLES = 340;
// Element presets — colors + motion shape the look of each spell (fire/ice/…)
const PARTICLE_PRESETS = {
  fire:   { n:26, colors:['#ffe27a','#ff9d3c','#ff5a1a','#ff2d0a'], shape:'circle', spMin:40,  spMax:180, sizeMin:2, sizeMax:5, life:[0.4,0.9], grav:-46, drag:0.90, rise:26, glow:true },
  smoke:  { n:8,  colors:['#3a2418','#241812'],                     shape:'circle', spMin:10,  spMax:60,  sizeMin:5, sizeMax:9, life:[0.6,1.1], grav:-30, drag:0.9,  rise:18, glow:false },
  ice:    { n:22, colors:['#d6f6ff','#8fe0ff','#5fd0ff','#bfefff'], shape:'shard',  spMin:30,  spMax:160, sizeMin:2, sizeMax:5, life:[0.5,1.0], grav:34,  drag:0.92, rise:0,  glow:true },
  frost:  { n:16, colors:['#eaffff','#bfefff','#8fe0ff'],           shape:'star',   spMin:10,  spMax:80,  sizeMin:2, sizeMax:4, life:[0.6,1.3], grav:10,  drag:0.94, rise:0,  glow:true },
  spark:  { n:20, colors:['#ffffff','#bff0ff','#7ad0ff'],           shape:'spark',  spMin:130, spMax:300, sizeMin:6, sizeMax:13,life:[0.12,0.34],grav:0,  drag:0.80, rise:0,  glow:true },
  poison: { n:16, colors:['#c8ff8a','#7CFC55','#3fae2a'],           shape:'bubble', spMin:10,  spMax:64,  sizeMin:2, sizeMax:6, life:[0.8,1.7], grav:-30, drag:0.93, rise:22, glow:true },
  holy:   { n:18, colors:['#fff6c0','#ffe9a0','#ffd75e'],           shape:'star',   spMin:20,  spMax:130, sizeMin:2, sizeMax:5, life:[0.6,1.2], grav:-48, drag:0.9,  rise:20, glow:true },
  earth:  { n:18, colors:['#e0b877','#a06a34','#ffcc66'],           shape:'shard',  spMin:40,  spMax:180, sizeMin:2, sizeMax:5, life:[0.35,0.8],grav:150, drag:0.9,  rise:0,  glow:false },
};
function spawnParticles(x, y, name, scale = 1){
  if (S && S.settings && !S.settings.fx) return;      // "reduced effects" perf toggle
  const p = PARTICLE_PRESETS[name]; if (!p) return;
  const n = Math.max(1, Math.round(p.n * scale));
  for (let i = 0; i < n; i++){
    if (particles.length >= MAX_PARTICLES) particles.shift();
    const ang = Math.random() * PI2;
    const sp = p.spMin + Math.random() * (p.spMax - p.spMin);
    const life = p.life[0] + Math.random() * (p.life[1] - p.life[0]);
    particles.push({
      x, y,
      vx: Math.cos(ang) * sp,
      vy: Math.sin(ang) * sp - (p.rise || 0),
      life, max: life,
      size: (p.sizeMin + Math.random() * (p.sizeMax - p.sizeMin)) * scale,
      color: p.colors[(Math.random() * p.colors.length) | 0],
      shape: p.shape, grav: p.grav, drag: p.drag, glow: p.glow,
    });
  }
}
function updateParticles(dt){
  for (let i = particles.length - 1; i >= 0; i--){
    const q = particles[i];
    q.life -= dt;
    if (q.life <= 0){ particles.splice(i, 1); continue; }
    const df = Math.pow(q.drag, dt * 60);
    q.vx *= df; q.vy *= df;
    q.vy += q.grav * dt;
    q.x += q.vx * dt; q.y += q.vy * dt;
  }
}
function drawParticles(){
  if (!particles.length) return;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const q of particles){
    const a = Math.max(0, Math.min(1, q.life / q.max));
    ctx.globalAlpha = a;
    ctx.fillStyle = q.color; ctx.strokeStyle = q.color;
    ctx.shadowColor = q.glow ? q.color : 'transparent';
    ctx.shadowBlur = q.glow ? 8 : 0;
    if (q.shape === 'circle'){
      ctx.beginPath(); ctx.arc(q.x, q.y, q.size, 0, PI2); ctx.fill();
    } else if (q.shape === 'shard'){
      ctx.fillRect(q.x - q.size/2, q.y - q.size/2, q.size, q.size * 1.7);
    } else if (q.shape === 'spark'){
      const m = Math.hypot(q.vx, q.vy) || 1;
      ctx.lineWidth = 2; ctx.beginPath();
      ctx.moveTo(q.x, q.y); ctx.lineTo(q.x - q.vx/m*q.size, q.y - q.vy/m*q.size); ctx.stroke();
    } else if (q.shape === 'star'){
      const s = q.size * 1.7; ctx.lineWidth = 1.5; ctx.beginPath();
      ctx.moveTo(q.x - s, q.y); ctx.lineTo(q.x + s, q.y);
      ctx.moveTo(q.x, q.y - s); ctx.lineTo(q.x, q.y + s); ctx.stroke();
    } else if (q.shape === 'bubble'){
      ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(q.x, q.y, q.size, 0, PI2); ctx.stroke();
    }
  }
  ctx.restore();
  ctx.globalAlpha = 1; ctx.shadowBlur = 0; ctx.globalCompositeOperation = 'source-over';
}

function grantGold(amount){
  S.gold += amount;
  S.totalGoldEarned += amount;
  waveGoldAccum += amount;
}

// spawn two smaller, faster copies when a splitter dies (they don't split again)
function spawnChildren(e){
  const t = ENEMY_TYPES[e.type] || ENEMY_TYPES.normal;
  const chp = Math.max(1, e.maxHp * 0.30);
  for (let k = 0; k < 2; k++){
    enemies.push({
      x: e.x + (k ? 20 : -20) * (view.w/900), y: view.ground,
      hp: chp, maxHp: chp, type: e.type, speed: t.spd * 1.3, frame: 0, boss: false,
      element: e.element, armor: 0, mini: true, split: false,
      slow: 0, goldMul: Math.max(1, Math.round(e.goldMul * 0.4)), atkTimer: 0, age: 0,
    });
  }
  spawnParticles(e.x, e.y - 14, 'earth', 0.8);
}

// floating combat number: crit = red, normal = orange; 1000+ shown as K/M… by fmt
function addDamageNumber(e, dmg, crit, kind){
  if (dmg <= 0 || !S.settings.dmgNums) return;
  const jx = (Math.random() - 0.5) * 14;
  const s = view.h / 460;
  const color = kind === 'weak' ? '#7CFC55' : kind === 'resist' ? '#9aa4c4' : (crit ? '#ff3b3b' : '#ff9d3c');
  const pre = kind === 'weak' ? '▲' : kind === 'resist' ? '▼' : '';
  addFloater(e.x + jx, e.y - 28 * s, pre + fmt(dmg), color);
}

// Deal damage to a specific enemy; returns true if it died.
// `element` (attacker's element) applies weakness/resist; enemy armor reduces further.
function damageEnemy(e, dmg, crit, element){
  const vs = elemVs(e.element, element);
  dmg *= vs.mult;
  if (e.armor) dmg *= (1 - e.armor);
  addDamageNumber(e, dmg, crit, vs.kind);
  if (e.shield > 0){                       // shield soaks damage before HP
    if (dmg <= e.shield){ e.shield -= dmg; dmg = 0; }
    else { dmg -= e.shield; e.shield = 0; }
  }
  e.hp -= dmg;
  if (e.hp <= 0){
    if (e.split) spawnChildren(e);         // slimes split into two on death
    // extend the kill-streak combo (bosses give a bigger jump)
    combo += e.boss ? 5 : 1; comboT = COMBO_WINDOW;
    if (combo > S.bestCombo) S.bestCombo = combo;
    if (!odActive()) odCharge = Math.min(1, odCharge + (e.boss ? 6 : 1) / OD_KILLS);
    const g = goldPerKill(S.wave) * e.goldMul * goldMulAll() * comboMul();
    grantGold(g);
    waveKills++;
    S.totalKills++;
    // record the kill in the bestiary (discovers the monster on first slay)
    const monId = e.boss ? (e.bossKind || 'dragon') : ENEMY_SPRITE[e.type];
    if (monId) S.kills[monId] = (S.kills[monId] || 0) + 1;
    if (e.golden){
      S.goldenKills++;
      addFloater(e.x, e.y - 34*(view.h/460), '💰 +' + fmt(g), '#ffe14d'); GA('prestige');
      spawnParticles(e.x, e.y - 14, 'holy', 1.4);
      checkAchievements();
    }
    else addFloater(e.x, e.y - 30*(view.h/460), '+' + fmt(g), '#ffd75e');
    // element-themed death burst
    if (e.boss){ spawnParticles(e.x, e.y - 24, 'fire', 2.2); spawnParticles(e.x, e.y - 24, 'earth', 1.4); GA('explosion'); shake(9);
      grantRelic(S.wave); spawnParticles(e.x, e.y - 24, 'holy', 1.6); }
    else if (e.type === 'wraith') spawnParticles(e.x, e.y - 16, 'poison', 1.3);   // 독 cloud
    return true;
  }
  return false;
}

// Engagement delay: heroes hold fire on an enemy until it has been on the map
// for a moment (so freshly-spawned enemies aren't hit the instant they appear).
const ENGAGE_DELAY = 1;   // seconds after spawn before an enemy can be targeted
function engaged(e){ return (e.age || 0) >= ENGAGE_DELAY; }
function nearestEnemy(){
  let target = null, best = Infinity;
  for (const e of enemies){ if (engaged(e) && e.x < best){ best = e.x; target = e; } }
  return target;
}
function removeEnemy(e){ const i = enemies.indexOf(e); if (i >= 0) enemies.splice(i, 1); }

// ------------------------------------------------------------------ skills
function castSkill(def, slot, lvl){
  const s = def.skill;
  const roll = critRoll(skillBase(def, lvl) * combatMul() * s.mult * (1 + 0.10 * talent('empower')));
  const dmg = roll.dmg;
  const hx = slot.x, hy = slot.y - 22;
  heroAnim[def.id] = { name:'cast', t:0.6 };

  if (s.kind === 'shock'){
    // earthen shockwave: dust + amber debris
    addFx({ kind:'nova', x: hx + 34, y: slot.y - 12, r0:8, r:150, dur:0.5, color:s.fx });
    spawnParticles(hx + 34, slot.y - 8, 'earth', 1.3);
    spawnParticles(hx + 34, slot.y - 8, 'fire', 0.5);
    for (let i = enemies.length - 1; i >= 0; i--) if (engaged(enemies[i]) && damageEnemy(enemies[i], dmg, roll.crit, HERO_ELEM[def.id])) enemies.splice(i, 1);
    GA('explosion');
  }
  else if (s.kind === 'frost'){
    // ICE: white ring + crystalline shards + twinkling frost sparkles
    const cx = (view.crystalX + view.laneRight) / 2, cy = slot.y - 16;
    addFx({ kind:'nova', x: cx, y: cy, r0:8, r:190, dur:0.6, color:s.fx });
    spawnParticles(cx, cy, 'ice', 1.4);
    spawnParticles(cx, cy, 'frost', 1.3);
    for (let i = enemies.length - 1; i >= 0; i--){
      const e = enemies[i];
      if (!engaged(e)) continue;
      if (!ENEMY_TYPES[e.type] || !ENEMY_TYPES[e.type].slowImmune){ e.slow = 3; spawnParticles(e.x, e.y-14, 'frost', 0.4); }  // freeze
      if (damageEnemy(e, dmg, roll.crit, HERO_ELEM[def.id])) enemies.splice(i, 1);
    }
    GA('ice');
  }
  else if (s.kind === 'explode'){
    // FIRE: arrow → fireball + embers + smoke
    const t = nearestEnemy(); if (!t) return;
    const R = 95;
    addFx({ kind:'arrow', x: hx, y: hy, x2: t.x, y2: t.y - 14, dur:0.22, color:s.fx });
    addFx({ kind:'nova', x: t.x, y: t.y - 14, r0:6, r:R, dur:0.45, color:s.fx });
    spawnParticles(t.x, t.y - 14, 'fire', 1.6);
    spawnParticles(t.x, t.y - 14, 'smoke', 1.0);
    for (let i = enemies.length - 1; i >= 0; i--){
      if (engaged(enemies[i]) && Math.abs(enemies[i].x - t.x) <= R){ enemies[i].burn = BURN_DUR; if (damageEnemy(enemies[i], dmg, roll.crit, HERO_ELEM[def.id])) enemies.splice(i, 1); }
    }
    GA('explosion'); shake(5);
  }
  else if (s.kind === 'chain'){
    // LIGHTNING: arcs + electric sparks at each struck enemy
    const targets = enemies.filter(engaged).sort((a,b) => a.x - b.x).slice(0, 5);
    if (!targets.length) return;
    const segs = []; let px = hx, py = hy;
    for (const e of targets){ segs.push([px, py, e.x, e.y - 14]); px = e.x; py = e.y - 14; spawnParticles(e.x, e.y-14, 'spark', 0.7); }
    addFx({ kind:'chain', segs, dur:0.3, color:s.fx });
    for (const e of targets) if (damageEnemy(e, dmg, roll.crit, HERO_ELEM[def.id])) removeEnemy(e);
    GA('lightning');
  }
  else if (s.kind === 'blessing'){
    // HOLY: golden sparkles + heal
    S.crystalHp = Math.min(1, S.crystalHp + 0.25);
    partyBuffT = 5 + talent('grace');
    const holy = skillBase(def, lvl) * combatMul() * 2.5;
    addFx({ kind:'nova', x: view.crystalX, y: slot.y - 18, r0:8, r:220, dur:0.7, color:s.fx });
    addFx({ kind:'heal', x: view.crystalX, y: view.ground - 40, dur:0.9, color:s.fx });
    spawnParticles(view.crystalX, slot.y - 18, 'holy', 1.6);
    for (let i = enemies.length - 1; i >= 0; i--) if (engaged(enemies[i]) && damageEnemy(enemies[i], holy, HERO_ELEM[def.id])) enemies.splice(i, 1);
    GA('heal');
  }
  heroFlash[def.id] = 0.22;
}

// ------------------------------------------------------------------ main tick
function simulate(dt){
  const w = S.wave;
  const slots = heroSlots();
  const totalToSpawn = waveSpawnCount(w);
  waveTime += dt;
  sfxGap -= dt;
  if (partyBuffT > 0) partyBuffT -= dt;
  if (talent('regen') > 0 && S.crystalHp > 0)
    S.crystalHp = Math.min(1, S.crystalHp + 0.005 * talent('regen') * dt);

  // spawn
  if (spawnedThisWave < totalToSpawn){
    spawnTimer += dt;
    while (spawnTimer >= SPAWN_INTERVAL && spawnedThisWave < totalToSpawn){
      spawnTimer -= SPAWN_INTERVAL;
      spawnEnemy(w);
      spawnedThisWave++;
    }
  }

  // move enemies toward crystal + attack crystal
  const px = view.w / 900;
  for (let i = enemies.length - 1; i >= 0; i--){
    const e = enemies[i];
    e.frame = (Math.floor(waveTime*4) % 2);
    e.age = (e.age || 0) + dt;                       // time alive (drives engage delay)
    if (e.slow > 0) e.slow -= dt;
    if (e.burn > 0) e.burn -= dt;
    if (e.lunge > 0) e.lunge -= dt * 4;              // dragon attack-lunge decay
    if (e.type === 'wraith' && Math.random() < dt * 2.5) spawnParticles(e.x, e.y - 20, 'poison', 0.25);  // 독 trail
    // big bosses stop further right so their wide sprite halts at the tower's
    // entrance instead of sliding across it (dragon is the widest)
    const reachOff = e.boss ? (e.bossKind === 'dragon' ? 150 : 80) : 34;
    const reach = view.crystalX + reachOff*px;
    if (e.x > reach){
      const sp = e.speed * (e.slow > 0 ? SLOW_FACTOR : 1);
      e.x -= sp * px * dt;
    } else {
      e.atkTimer += dt;
      if (e.atkTimer >= 1){
        e.atkTimer -= 1;
        const ksTake = ksIs('cannon') ? 1.6 : ksIs('fortress') ? 0.4 : 1;
        const dmgFrac = (e.boss ? 0.20 : 0.05) * ksTake / (wardMul() * towerHpMul());
        S.crystalHp = Math.max(0, S.crystalHp - dmgFrac);
        if (e.boss) shake(6);
        addFloater(view.crystalX, view.ground - 60*px, '-' + Math.round(dmgFrac*100) + '%', '#ff6b6b');
        if (e.boss && e.bossKind === 'dragon'){       // lunge + fire breath toward the crystal
          e.lunge = 1;
          const mx = e.x - 46*px, my = e.y - 52*px;
          spawnParticles(mx, my, 'fire', 1.7);
          spawnParticles(mx - 20*px, my, 'smoke', 0.6);
          addFx({ kind:'nova', x: mx - 14*px, y: my, r0:5, r:70, dur:0.35, color:'#ff9d3c' });
          GA('explosion');
        }
      }
    }
  }

  // heroes: basic auto-attack (with visible FX) + auto-cast skill
  for (const slot of slots){
    if (!slot.active) continue;
    const def = slot.def, lvl = S.heroLevels[def.id];

    // --- basic attack ---
    const interval = effInterval(def);
    heroTimers[def.id] = (heroTimers[def.id] || 0) + dt;
    while (heroTimers[def.id] >= interval){
      heroTimers[def.id] -= interval;
      basicAttack(def, slot, lvl);
    }

    // --- skill (auto-cast on cooldown) ---
    const cd = effSkillCd(def);
    skillTimers[def.id] = (skillTimers[def.id] || 0) + dt;
    if (skillTimers[def.id] >= cd){
      const wantsHeal = def.skill.kind === 'blessing' && S.crystalHp < 0.98;
      if (enemies.some(engaged) || wantsHeal){
        skillTimers[def.id] = 0;
        castSkill(def, slot, lvl);
      } else {
        skillTimers[def.id] = cd;      // hold ready until there's something to hit
      }
    }
  }

  // crystal broken -> fall back a few waves, restore
  if (S.crystalHp <= 0){
    const brokeWave = S.wave;
    if (brokeWave === lastBreakWave) breakStreak++; else { breakStreak = 1; lastBreakWave = brokeWave; }
    S.wave = Math.max(1, S.wave - 3);
    S.crystalHp = 1;
    enemies.length = 0; fx.length = 0; particles.length = 0;
    startWave(S.wave);
    toast('💥 The Crystal shattered! Fell back to Wave ' + S.wave);
    maybeWallHint(brokeWave);
    return;
  }

  // wave clear
  if (spawnedThisWave >= totalToSpawn && enemies.length === 0){
    if (waveTime > 0){
      const rate = waveGoldAccum / waveTime;
      S.recentGoldRate.push(rate);
      if (S.recentGoldRate.length > 10) S.recentGoldRate.shift();
      S.goldHistory.push({ w: S.wave, r: Math.round(rate) });   // for the Stats chart
      if (S.goldHistory.length > 60) S.goldHistory.shift();
    }
    S.crystalHp = Math.min(1, S.crystalHp + 0.05);
    S.wave++;
    reachWave(S.wave);
    checkUnlocks(S.wave);
    checkAchievements();
    startWave(S.wave);
    showWaveBanner(S.wave);
    GA(isBossWave(S.wave) ? 'boss' : 'wave');
  }

  // kill-streak combo decay
  if (comboT > 0){ comboT -= dt; if (comboT <= 0){ combo = 0; comboT = 0; } }
  if (odT > 0) odT = Math.max(0, odT - dt);
  if (shakeT > 0){ shakeT -= dt; if (shakeT <= 0){ shakeT = 0; shakeAmt = 0; } }
  if (wallHintT > 0) wallHintT -= dt;
  // auto-upgrade: buy one cheapest affordable upgrade a few times per second
  if (S.autoUp){ autoUpT -= dt; if (autoUpT <= 0){ autoUpT = 0.3; autoUpgradeStep(); } }

  // fx + particles + floaters
  updateParticles(dt);
  for (let i = fx.length - 1; i >= 0; i--){ fx[i].t += dt; if (fx[i].t >= fx[i].dur) fx.splice(i, 1); }
  for (let i = floaters.length - 1; i >= 0; i--){
    floaters[i].life -= dt * 1.2;
    floaters[i].y -= dt * 18;
    if (floaters[i].life <= 0) floaters.splice(i, 1);
  }
  for (const k in heroFlash){ if (heroFlash[k] > 0) heroFlash[k] -= dt; }
  for (const k in heroAnim){ if (heroAnim[k].t > 0) heroAnim[k].t -= dt; }
}

function basicAttack(def, slot, lvl){
  const hx = slot.x, hy = slot.y - 22;
  if (!(heroAnim[def.id] && heroAnim[def.id].name === 'cast')) heroAnim[def.id] = { name:'attack', t:0.35 };
  if (def.target === 'support'){
    S.crystalHp = Math.min(1, S.crystalHp + 0.01 * lvl);
    return;
  }
  const dmg = heroDmg(def, lvl) * combatMul();
  if (dmg <= 0) return;

  if (def.target === 'all'){
    // Mira splash: hit every enemy + purple pulse (one crit roll for the volley)
    const r = critRoll(dmg);
    addFx({ kind:'nova', x: hx, y: hy, r0:4, r:60, dur:0.3, color:def.color });
    for (let i = enemies.length - 1; i >= 0; i--) if (engaged(enemies[i]) && damageEnemy(enemies[i], r.dmg, r.crit, HERO_ELEM[def.id])) enemies.splice(i, 1);
    basicSfx('shoot');
    heroFlash[def.id] = 0.15;
  } else {
    const t = nearestEnemy();
    if (!t) return;
    // distinct projectile per hero
    if (def.id === 'faye')      { addFx({ kind:'arrow', x:hx, y:hy, x2:t.x, y2:t.y-14, dur:0.14, color:def.color }); basicSfx('arrow'); }
    else if (def.id === 'rai')  { addFx({ kind:'bolt',  x:hx, y:hy, x2:t.x, y2:t.y-14, dur:0.12, color:def.color }); basicSfx('shoot'); }
    else                        { addFx({ kind:'slash', x:t.x, y:t.y-14, dur:0.16, color:'#dfe7ff' }); basicSfx('slash'); }
    const r = critRoll(dmg);
    if (damageEnemy(t, r.dmg, r.crit, HERO_ELEM[def.id])) removeEnemy(t);
    heroFlash[def.id] = 0.15;
  }
}

function checkUnlocks(w){
  for (const def of HERO_DEFS){
    if (def.unlockWave === w && S.heroLevels[def.id] === 0){
      toast('✨ New hero available: ' + def.name + '!');
      buildHeroPanel();
    }
  }
  if (w === STAGE_MAX * STAGE_WAVES) toast('🏆 Stage 99 cleared! The Crystal is fully resealed. Endless mode continues!');
}

// ------------------------------------------------------------------ rendering
const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d');
let dpr = 1;

function resize(){
  const wrap = canvas.parentElement;
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  const cw = wrap.clientWidth, ch = wrap.clientHeight;
  canvas.width = cw * dpr; canvas.height = ch * dpr;
  ctx.setTransform(dpr,0,0,dpr,0,0);
  view.w = cw; view.h = ch;
  view.ground = ch * 0.78;
  view.crystalX = cw * 0.14;
  view.laneRight = cw - 20;
}
window.addEventListener('resize', resize);

function drawFallbackChar(x, y, size, color){
  ctx.fillStyle = color;
  ctx.fillRect(x - size*3, y - size*12, size*6, size*12);
  ctx.fillStyle = '#ffe0b0';
  ctx.fillRect(x - size*2.5, y - size*16, size*5, size*4);
}

function pathRoundRect(x, y, w, h, r){
  r = Math.min(r, w/2, h/2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y,     x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x,     y + h, r);
  ctx.arcTo(x,     y + h, x,     y,     r);
  ctx.arcTo(x,     y,     x + w, y,     r);
  ctx.closePath();
}

// Encase a frozen enemy in ice. Prefer the uploaded ice-crystal art; if it
// hasn't loaded, fall back to the procedural crystal cube below.
let _iceImg = null, _iceOk = false;
function iceImage(){ if (!_iceImg){ _iceImg = new Image(); _iceImg.onload = () => _iceOk = true; _iceImg.src = 'assets/ice.png'; } return _iceOk ? _iceImg : null; }

// Burning FX for fire-damaged enemies: the fire sprite at 50% alpha, animated
// (flicker + scale pulse + bob + subtle horizontal flip) over the enemy.
let _fireImg = null, _fireOk = false;
function fireImage(){ if (!_fireImg){ _fireImg = new Image(); _fireImg.onload = () => _fireOk = true; _fireImg.src = 'assets/fire.png'; } return _fireOk ? _fireImg : null; }
function drawBurnFire(cx, feetY, h, now, seed){
  const img = fireImage(); if (!img) return;
  const t = now / 1000;
  const flick = 0.82 + 0.18*Math.sin(t*15 + seed) + 0.08*Math.sin(t*27 + seed*1.7);
  const dh = h * 1.3 * (1 + 0.08*Math.sin(t*9 + seed));
  const dw = dh * (img.width / img.height);
  const bob = Math.sin(t*6 + seed) * h * 0.03;
  const dx = cx - dw/2, dy = feetY - dh + h*0.14 + bob;
  const flip = Math.sin(t*8 + seed) > 0 ? 1 : -1;      // occasional mirror for life
  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, 0.5 * flick));
  ctx.imageSmoothingEnabled = false;
  ctx.translate(cx, 0); ctx.scale(flip, 1); ctx.translate(-cx, 0);
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.restore();
}
function drawIceBlock(cx, topY, w, h, now){
  const img = iceImage();
  if (img){
    const dh = h * 1.42, dw = dh * (img.width / img.height);
    const dx = cx - dw/2, dy = (topY + h) - dh + h*0.05;   // crystal base near the feet
    ctx.save();
    ctx.globalAlpha = 0.5; ctx.imageSmoothingEnabled = true;
    ctx.drawImage(img, dx, dy, dw, dh);
    ctx.restore();
    // twinkling frost sparkles orbiting the crystal
    ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,0.92)'; ctx.lineWidth = 1.4;
    for (let k = 0; k < 4; k++){
      const a = now/600 + k*1.7 + cx;
      const px = cx + Math.cos(a) * dw*0.5, py = dy + dh*0.42 + Math.sin(a*1.3) * dh*0.42;
      const s = 2 + 1.6*Math.abs(Math.sin(now/300 + k));
      ctx.beginPath(); ctx.moveTo(px-s,py); ctx.lineTo(px+s,py); ctx.moveTo(px,py-s); ctx.lineTo(px,py+s); ctx.stroke();
    }
    ctx.restore();
    return;
  }
  const pad = Math.max(4, w * 0.16);
  const x0 = cx - w/2 - pad, y0 = topY - pad*0.7;
  const bw = w + pad*2, bh = h + pad*1.2, r = Math.min(bw, bh) * 0.14;
  ctx.save();
  // frosty body — lighter at the top, deeper blue at the base
  const g = ctx.createLinearGradient(0, y0, 0, y0 + bh);
  g.addColorStop(0,   'rgba(224,248,255,0.60)');
  g.addColorStop(0.5, 'rgba(150,214,245,0.42)');
  g.addColorStop(1,   'rgba(116,186,232,0.55)');
  pathRoundRect(x0, y0, bw, bh, r);
  ctx.fillStyle = g; ctx.fill();
  // bright rim
  ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(236,251,255,0.9)'; ctx.stroke();
  // internal facet / crack highlights
  ctx.save(); ctx.clip();
  ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x0 + bw*0.18, y0);        ctx.lineTo(x0 + bw*0.52, y0 + bh*0.58);
  ctx.moveTo(x0 + bw*0.72, y0);        ctx.lineTo(x0 + bw*0.46, y0 + bh);
  ctx.moveTo(x0,           y0 + bh*0.42); ctx.lineTo(x0 + bw*0.4, y0 + bh*0.72);
  ctx.stroke();
  ctx.restore();
  // jagged ice shards jutting from the base
  ctx.fillStyle = 'rgba(206,240,255,0.9)';
  const baseY = y0 + bh;
  for (const t of [0.12, 0.34, 0.55, 0.74, 0.9]){
    const sx = x0 + bw*t, hh = pad*(0.7 + 0.5*Math.abs(Math.sin(t*9)));
    ctx.beginPath(); ctx.moveTo(sx - pad*0.5, baseY); ctx.lineTo(sx, baseY + hh); ctx.lineTo(sx + pad*0.5, baseY); ctx.closePath(); ctx.fill();
  }
  // twinkling frost sparkles orbiting the cube
  ctx.strokeStyle = 'rgba(255,255,255,0.92)'; ctx.lineWidth = 1.4;
  for (let k = 0; k < 4; k++){
    const a = now/600 + k*1.7 + cx;
    const px = cx + Math.cos(a) * bw*0.6;
    const py = y0 + bh*0.4 + Math.sin(a*1.3) * bh*0.42;
    const s = 2 + 1.6*Math.abs(Math.sin(now/300 + k));
    ctx.beginPath();
    ctx.moveTo(px - s, py); ctx.lineTo(px + s, py);
    ctx.moveTo(px, py - s); ctx.lineTo(px, py + s);
    ctx.stroke();
  }
  ctx.restore();
}

// Living fire on the burning tower: flickering flame tongues + pulsing glow +
// rising embers, layered over the static sprite. level 1..3 = small/med/big.
let _towerEmberT = 0;
function drawTowerFire(cx, topY, tH, level, now){
  if (level <= 0) return;
  const dw = tH * 0.602;                 // on-screen tower width (cell 153/254)
  const baseY = topY + tH * 0.30;        // flames sit at the top battlement
  const scale = [0, 0.72, 1.0, 1.3][level];
  const spread = dw * 0.30 * (0.7 + 0.3*level);
  const t = now / 1000;

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  // pulsing warm glow behind the flames
  const gy = baseY - tH*0.08;
  const glowR = tH * (0.15 + 0.05*level) * (0.9 + 0.12*Math.sin(now/110));
  const gg = ctx.createRadialGradient(cx, gy, 0, cx, gy, glowR);
  gg.addColorStop(0,   'rgba(255,180,70,0.5)');
  gg.addColorStop(0.5, 'rgba(255,110,30,0.24)');
  gg.addColorStop(1,   'rgba(255,80,20,0)');
  ctx.fillStyle = gg;
  ctx.beginPath(); ctx.arc(cx, gy, glowR, 0, PI2); ctx.fill();

  // flame tongues — taller in the middle, each with its own flicker/sway
  const flames = 3 + level;
  for (let i = 0; i < flames; i++){
    const fp = flames > 1 ? i/(flames-1) - 0.5 : 0;    // -0.5..0.5 across the top
    const flick = 0.7 + 0.3*Math.sin(t*(7+i*1.3) + i*2);
    const fh = tH * (0.14 + 0.13*(1 - Math.abs(fp*1.5))) * scale * flick;
    const fw = dw * 0.11 * scale * (0.82 + 0.18*Math.sin(t*5 + i));
    const fx = cx + fp*spread + Math.sin(t*3 + i)*dw*0.03;
    const by = baseY - Math.abs(fp)*tH*0.03;
    const sway = Math.sin(t*4 + i*1.7) * fw*0.7;        // flame tip leans
    const grad = ctx.createLinearGradient(0, by - fh, 0, by);
    grad.addColorStop(0,   'rgba(255,255,225,0.85)');
    grad.addColorStop(0.35,'rgba(255,196,80,0.8)');
    grad.addColorStop(0.7, 'rgba(255,110,30,0.6)');
    grad.addColorStop(1,   'rgba(210,45,10,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(fx - fw, by);
    ctx.quadraticCurveTo(fx - fw*0.85, by - fh*0.5, fx + sway, by - fh);
    ctx.quadraticCurveTo(fx + fw*0.85, by - fh*0.5, fx + fw, by);
    ctx.quadraticCurveTo(fx, by + fh*0.06, fx - fw, by);
    ctx.closePath(); ctx.fill();
  }
  ctx.restore();

  // rising embers — throttled so the rate is framerate-independent
  if (now - _towerEmberT > 55){
    _towerEmberT = now;
    for (let k = 0; k < level; k++){
      if (particles.length >= MAX_PARTICLES) particles.shift();
      const life = 0.5 + Math.random()*0.6;
      particles.push({
        x: cx + (Math.random()-0.5)*spread*1.2,
        y: baseY - Math.random()*tH*0.05,
        vx: (Math.random()-0.5)*22,
        vy: -(55 + Math.random()*75),
        life, max: life,
        size: 1.6 + Math.random()*2.4,
        color: ['#ffe27a','#ff9d3c','#ff5a1a'][(Math.random()*3)|0],
        shape:'circle', grav:-26, drag:0.93, glow:true,
      });
    }
  }
}

function jaggedLine(x1, y1, x2, y2){
  const segs = 5;
  ctx.beginPath(); ctx.moveTo(x1, y1);
  for (let i = 1; i < segs; i++){
    const t = i / segs;
    const mx = x1 + (x2-x1)*t + (Math.random()-0.5)*14;
    const my = y1 + (y2-y1)*t + (Math.random()-0.5)*14;
    ctx.lineTo(mx, my);
  }
  ctx.lineTo(x2, y2); ctx.stroke();
}

function drawFx(o, now){
  const p = Math.min(1, o.t / o.dur);
  ctx.save();
  if (o.kind === 'slash'){
    ctx.globalAlpha = 1 - p; ctx.strokeStyle = o.color; ctx.lineWidth = 3;
    const r = 12 + 16*p;
    ctx.beginPath(); ctx.arc(o.x, o.y, r, -1.0 + p, 0.8 + p); ctx.stroke();
  } else if (o.kind === 'bolt'){
    ctx.globalAlpha = 1 - p; ctx.strokeStyle = o.color; ctx.lineWidth = 3;
    ctx.shadowColor = o.color; ctx.shadowBlur = 8;
    jaggedLine(o.x, o.y, o.x2, o.y2);
  } else if (o.kind === 'arrow'){
    const ax = o.x + (o.x2 - o.x) * p, ay = o.y + (o.y2 - o.y) * p;
    ctx.strokeStyle = o.color; ctx.lineWidth = 3;
    const dx = (o.x2 - o.x), dy = (o.y2 - o.y), len = Math.hypot(dx,dy) || 1;
    ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax - dx/len*10, ay - dy/len*10); ctx.stroke();
  } else if (o.kind === 'nova'){
    const r = (o.r0 || 4) + (o.r - (o.r0 || 4)) * p;
    ctx.globalAlpha = (1 - p) * 0.85; ctx.strokeStyle = o.color; ctx.lineWidth = 3 + 5*(1-p);
    ctx.beginPath(); ctx.arc(o.x, o.y, r, 0, Math.PI*2); ctx.stroke();
    ctx.globalAlpha = (1 - p) * 0.16; ctx.fillStyle = o.color;
    ctx.beginPath(); ctx.arc(o.x, o.y, r, 0, Math.PI*2); ctx.fill();
  } else if (o.kind === 'chain'){
    ctx.globalAlpha = 1 - p*0.7; ctx.strokeStyle = o.color; ctx.lineWidth = 2.5;
    ctx.shadowColor = o.color; ctx.shadowBlur = 10;
    for (const s of o.segs) jaggedLine(s[0], s[1], s[2], s[3]);
  } else if (o.kind === 'heal'){
    ctx.globalAlpha = 1 - p; ctx.fillStyle = o.color;
    for (let i = 0; i < 7; i++){
      const a = i/7*Math.PI*2 + now/260;
      ctx.fillRect(o.x + Math.cos(a)*22 - 2, o.y - 34*p + Math.sin(a)*10, 4, 4);
    }
  }
  ctx.restore();
}

const Spr = () => (window.Sprites || {});
function draw(now){
  const px = view.w / 900;
  const size = Math.max(2, Math.round(3 * (view.h/460)));

  // screen shake: cover the frame then offset the whole scene by a decaying jitter
  let _shk = false;
  if (shakeT > 0){
    const k = shakeAmt * (shakeT / 0.22);
    ctx.fillStyle = '#05060f'; ctx.fillRect(0, 0, view.w, view.h);
    ctx.save(); ctx.translate((Math.random()-0.5)*k, (Math.random()-0.5)*k); _shk = true;
  }

  if (Spr().drawBackground) Spr().drawBackground(ctx, view.w, view.h, now);
  else { ctx.fillStyle = '#0a0e24'; ctx.fillRect(0,0,view.w,view.h); }

  // crystal tower — static; the 4 frames are burning states chosen by remaining
  // HP: 100% = no fire, 70% = small, 30% = medium, 10% = big fire. size per user edit
  const towerH = size * 60;
  const hp = S.crystalHp;
  const towerFrame = hp >= 0.70 ? 0 : hp >= 0.30 ? 1 : hp >= 0.10 ? 2 : 3;
  const drewTower = window.Sheets && Sheets.draw(ctx, 'tower', view.crystalX, view.ground, towerH, 'idle', towerFrame * 1000);
  if (!drewTower){
    const pulse = 0.5 + 0.5*Math.sin(now/500);
    if (Spr().drawCrystal) Spr().drawCrystal(ctx, view.crystalX, view.ground - size*10, size*3, pulse, S.crystalHp);
    else { ctx.fillStyle = `rgba(123,211,255,${0.5+0.4*pulse})`; ctx.fillRect(view.crystalX-14, view.ground-70, 28, 44); }
  } else {
    // animate the burning tower's fire (more intense as HP drops)
    drawTowerFire(view.crystalX, view.ground - towerH, towerH, towerFrame, now);
  }

  // enemies
  for (const e of enemies){
    const t = ENEMY_TYPES[e.type] || ENEMY_TYPES.normal;
    const es = size * (e.boss ? 3 : t.size) * (e.mini ? 0.58 : 1);
    const sid = e.boss ? (e.bossKind || 'dragon') : ENEMY_SPRITE[e.type];
    const th = es * (e.boss ? (e.bossKind === 'elderghost' ? 15 : 24) : 14);   // dragon 2x, elder ghost a bit smaller
    // element aura (ground glow) distinguishes archetypes that share a sprite
    if (!e.boss && S.settings.fx && e.element && Number.isFinite(e.x)){
      const col = ELEM_COLOR[e.element] || '#8fd07a';
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const gy = e.y - th*0.14, gr = th*0.5;
      const gg = ctx.createRadialGradient(e.x, gy, 0, e.x, gy, gr);
      gg.addColorStop(0, col); gg.addColorStop(1, 'transparent');
      ctx.globalAlpha = 0.22 + 0.06*Math.sin(now/260 + e.x);
      ctx.fillStyle = gg; ctx.beginPath(); ctx.ellipse(e.x, gy, gr, gr*0.5, 0, 0, PI2); ctx.fill();
      ctx.restore();
    }
    const atCrystal = e.x <= view.crystalX + 42 * px;
    const anim = atCrystal ? 'attack' : 'idle';       // play the attack animation at the crystal
    let drew = false, by = e.y;
    // fade in over the first second so it reads as "arriving" (not yet targetable)
    ctx.save();
    ctx.globalAlpha = Math.min(1, 0.3 + 0.7 * ((e.age || 0) / ENGAGE_DELAY));
    if (window.Sheets && sid){
      let ax = e.x, aby = e.y, ath = th;
      if (e.boss && e.bossKind === 'dragon'){
        aby = e.y + Math.sin(now/320 + e.x*0.05) * es * 0.45;      // gentle hover
        ath = th * (1 + 0.03*Math.sin(now/260) + 0.14*(e.lunge||0)); // breathing + lunge grow
        ax  = e.x - (e.lunge||0) * 16 * px;                         // thrust toward the crystal
        by  = aby;
        if (now - (e.emberT||0) > 70){                              // rising embers off the mane
          e.emberT = now;
          for (let k=0;k<2;k++){
            if (particles.length >= MAX_PARTICLES) particles.shift();
            const life = 0.4 + Math.random()*0.4;
            particles.push({ x: e.x + (Math.random()-0.5)*th*0.5, y: aby - th*(0.35+Math.random()*0.4),
              vx:(Math.random()-0.5)*20, vy:-(40+Math.random()*55), life, max:life,
              size:1.4+Math.random()*2, color:['#ffe27a','#ff9d3c','#ff5a1a'][(Math.random()*3)|0], shape:'circle', grav:-24, drag:0.93, glow:true });
          }
        }
      }
      drew = Sheets.draw(ctx, sid, ax, aby, ath, anim, now);
      // twinkling glints over the dragon's fiery mane/tail
      if (drew && e.boss && e.bossKind === 'dragon' && S.settings.fx){
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        const top = aby - ath, dw = ath * 1.05, sScale = view.h/460;
        const pts = [[-0.14,0.30],[0.05,0.22],[0.25,0.30],[0.41,0.42],[-0.28,0.44],[0.16,0.52]];
        pts.forEach((p, i) => {
          const tw = 0.5 + 0.5*Math.sin(now/180 + i*1.7 + e.x*0.02);
          if (tw < 0.18) return;
          const sx = ax + p[0]*dw, sy = top + p[1]*ath, s = (2 + 2.3*tw) * sScale, d = s*0.5;
          const col = i % 2 ? '#fff2a0' : '#ffd75e';
          ctx.globalAlpha = tw; ctx.strokeStyle = col; ctx.lineWidth = 1.6;
          ctx.shadowColor = col; ctx.shadowBlur = 6;
          ctx.beginPath();
          ctx.moveTo(sx-s,sy); ctx.lineTo(sx+s,sy); ctx.moveTo(sx,sy-s); ctx.lineTo(sx,sy+s);
          ctx.moveTo(sx-d,sy-d); ctx.lineTo(sx+d,sy+d); ctx.moveTo(sx-d,sy+d); ctx.lineTo(sx+d,sy-d);
          ctx.stroke();
        });
        ctx.restore();
      }
    }
    if (!drew){
      const floatOff = t.float ? (10 + Math.sin(now/300)*4) : 0;
      by = e.y - floatOff;
      if (e.boss){ if (Spr().drawBoss) Spr().drawBoss(ctx, e.x, by, es, e.frame); else drawFallbackChar(e.x, by, es, '#b3407a'); }
      else if (Spr().drawEnemy) Spr().drawEnemy(ctx, e.x, by, es, e.type, e.frame, e.hp/e.maxHp);
      else drawFallbackChar(e.x, by, es, '#b3407a');
    }
    ctx.restore();     // end spawn fade-in
    const spH = drew ? th : es*15;                    // overlays/hp-bar sized to the sprite
    const ow = spH * 0.62;
    if (e.slow > 0) drawIceBlock(e.x, by - spH, ow, spH, now);
    if (e.burn > 0) drawBurnFire(e.x, by, spH, now, e.x);
    if (e.golden){
      ctx.save();
      ctx.globalAlpha = 0.28 + 0.12*Math.sin(now/120 + e.x);
      ctx.fillStyle = '#ffe14d'; ctx.fillRect(e.x - ow/2, by - spH, ow, spH);
      ctx.globalAlpha = 0.9; ctx.fillStyle = '#fff6c0';
      for (let k = 0; k < 3; k++){ const a = now/200 + k*2.1;
        ctx.fillRect(e.x + Math.cos(a)*ow*0.5 - 1, by - spH*0.5 + Math.sin(a)*spH*0.4 - 1, 3, 3); }
      ctx.restore();
    }
    const bw = 22*px * (e.boss ? 2.2 : t.size) * (e.mini ? 0.6 : 1);
    ctx.fillStyle = '#000a'; ctx.fillRect(e.x-bw/2, by - spH - 6, bw, 4);
    ctx.fillStyle = e.boss ? '#ff5db1' : '#ff6b6b';
    ctx.fillRect(e.x-bw/2, by - spH - 6, bw*(e.hp/e.maxHp), 4);
    if (e.shield > 0 && e.maxShield > 0){        // cyan shield bar above the HP bar
      ctx.fillStyle = '#000a'; ctx.fillRect(e.x-bw/2, by - spH - 11, bw, 3);
      ctx.fillStyle = '#7bd3ff'; ctx.fillRect(e.x-bw/2, by - spH - 11, bw*(e.shield/e.maxShield), 3);
    }
  }

  // heroes
  for (const slot of heroSlots()){
    if (!slot.active) continue;
    // skill-ready glow ring under the hero (also the tap-to-cast target)
    if ((skillTimers[slot.def.id] || 0) >= effSkillCd(slot.def)){
      ctx.save();
      ctx.globalAlpha = 0.35 + 0.2*Math.sin(now/180);
      ctx.strokeStyle = slot.def.color; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(slot.x, slot.y - 2, size*4, size*1.8, 0, 0, Math.PI*2); ctx.stroke();
      ctx.restore();
    }
    // prefer an image sprite-sheet if one is loaded; otherwise canvas pixel-art
    const st = heroAnim[slot.def.id];
    const animName = (st && st.t > 0) ? st.name : 'idle';
    const drewSheet = window.Sheets && Sheets.draw(ctx, slot.def.id, slot.x, slot.y, size*20, animName, now);
    if (!drewSheet){
      const frame = (heroFlash[slot.def.id] > 0) ? 1 : (Math.floor(now/350)%2);
      const fn = Spr()[slot.def.draw];
      if (fn){
        // scale the canvas art up so it matches the (larger) sheet heroes
        ctx.save();
        ctx.translate(slot.x, slot.y); ctx.scale(1.0, 1.0);
        fn(ctx, 0, 0, size, frame);
        ctx.restore();
      } else drawFallbackChar(slot.x, slot.y, size, slot.def.color);
    }
  }

  // boss health bar across the top during boss waves
  const bossE = enemies.find(e => e.boss);
  if (bossE){
    const bw = view.w * 0.6, bx = (view.w - bw)/2, byy = 12;
    ctx.save();
    ctx.fillStyle = 'rgba(10,12,26,.85)'; ctx.fillRect(bx-3, byy-3, bw+6, 16);
    ctx.fillStyle = '#3a1030'; ctx.fillRect(bx, byy, bw, 10);
    ctx.fillStyle = '#ff4fa0'; ctx.fillRect(bx, byy, bw * Math.max(0, bossE.hp/bossE.maxHp), 10);
    ctx.fillStyle = '#ffd7ef'; ctx.font = 'bold 10px system-ui'; ctx.textAlign = 'center';
    ctx.fillText('⚔ BOSS', view.w/2, byy + 9);
    ctx.restore();
  }

  // attack effects + glowing particles on top
  for (const o of fx) drawFx(o, now);
  drawParticles();

  // floaters
  for (const f of floaters){
    ctx.globalAlpha = Math.max(0, Math.min(1, f.life));
    ctx.fillStyle = f.color;
    ctx.font = `bold ${Math.round(12*(view.h/460))}px system-ui`;
    ctx.textAlign = 'center';
    ctx.fillText(f.txt, f.x, f.y);
    ctx.globalAlpha = 1;
  }

  // party-buff banner glow
  if (partyBuffT > 0){
    ctx.save(); ctx.globalAlpha = 0.10 + 0.05*Math.sin(now/120);
    ctx.fillStyle = '#ffe9a0'; ctx.fillRect(0, 0, view.w, view.h); ctx.restore();
  }
  // overdrive: electric blue edge glow while active
  if (odActive()){
    ctx.save(); ctx.globalAlpha = 0.14 + 0.07*Math.sin(now/90);
    const eg = ctx.createLinearGradient(0,0,0,view.h);
    eg.addColorStop(0,'#7bd3ff'); eg.addColorStop(0.5,'transparent'); eg.addColorStop(1,'#7bd3ff');
    ctx.fillStyle = eg; ctx.fillRect(0,0,view.w,view.h); ctx.restore();
  }

  // active wave-event badge (top-left)
  if (curEvent && enemies.length){
    const s = view.h/460, bx = 12, by = 12*s;
    ctx.save();
    ctx.font = `bold ${Math.round(13*s)}px system-ui`; ctx.textAlign = 'left';
    const label = `${curEvent.icon} ${curEvent.name}`, tw = ctx.measureText(label).width;
    ctx.fillStyle = 'rgba(10,12,26,.8)';
    ctx.fillRect(bx-6, by-3, tw+16, 22*s);
    ctx.fillStyle = curEvent.color; ctx.fillRect(bx-6, by-3, 4, 22*s);
    ctx.fillStyle = curEvent.color; ctx.fillText(label, bx+4, by + 13*s);
    ctx.restore();
  }

  // kill-streak combo meter (top-right), grows/colours with the streak tier
  if (combo >= 3){
    const tier = comboTier();
    const cols = ['#ffd75e','#ff9d3c','#ff6b6b','#ff4fa0','#c58bff'];
    const col = cols[tier];
    const s = view.h/460, pop = 1 + 0.10*Math.max(0, comboT/COMBO_WINDOW - 0.78)*4.5;
    const cx = view.w - 14, cy = 26*s;
    ctx.save();
    ctx.textAlign = 'right';
    ctx.fillStyle = col;
    ctx.shadowColor = col; ctx.shadowBlur = 10;
    ctx.font = `900 ${Math.round((15 + tier*3) * s * pop)}px system-ui`;
    ctx.fillText(`${combo}× COMBO`, cx, cy);
    ctx.shadowBlur = 0;
    ctx.font = `bold ${Math.round(10*s)}px system-ui`;
    ctx.fillStyle = '#e8ecff';
    ctx.fillText(`+${Math.round((comboMul()-1)*100)}% gold`, cx, cy + 13*s);
    // streak timer bar
    const bw = 104*s, bx = cx - bw, byy = cy + 19*s;
    ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fillRect(bx, byy, bw, 4*s);
    ctx.fillStyle = col; ctx.fillRect(bx, byy, bw * Math.max(0, comboT/COMBO_WINDOW), 4*s);
    ctx.restore();
  }

  if (_shk) ctx.restore();     // end screen-shake transform
}

// ------------------------------------------------------------------ loop
let lastT = performance.now();
let acc = 0;
function frame(now){
  let dt = (now - lastT) / 1000;
  lastT = now;
  if (dt > 0.25) dt = 0.25;
  simulate(dt * gameSpeed());
  draw(now);
  acc += dt;
  if (acc > 5){ acc = 0; save(); }
  updateHud();
  requestAnimationFrame(frame);
}

// ------------------------------------------------------------------ HUD / UI
const el = id => document.getElementById(id);
function updateHud(){
  // overdrive gauge button
  const ob = el('odBtn');
  if (ob){
    const pct = odActive() ? odT/OD_DUR : odCharge;
    el('odFill').style.width = Math.round(pct*100) + '%';
    el('odTxt').textContent = odActive() ? odT.toFixed(1)+'s' : Math.round(odCharge*100)+'%';
    ob.classList.toggle('ready', !odActive() && odCharge >= 1);
    ob.classList.toggle('active', odActive());
  }
  el('s-wave').textContent = dispStage(S.wave) + '-' + waveInStage(S.wave);
  el('s-gold').textContent = fmt(S.gold);
  el('s-shard').textContent = fmt(S.shards);
  if (el('s-tp')) el('s-tp').textContent = fmt(S.talentPoints);
  el('s-crystal').textContent = Math.round(S.crystalHp*100) + '%';
  el('btnPrestige').disabled = prestigeShards(S.totalGoldEarned) <= S.shardsEarned;
  for (const def of HERO_DEFS){
    const btn = el('buy-'+def.id);
    if (btn){
      const lvl = S.heroLevels[def.id];
      const aff = bulkBuyPlan(def);
      const showN = aff.count > 0 ? aff.count : 1;
      const showCost = aff.count > 0 ? aff.cost : heroCost(def, lvl);
      const verb = lvl === 0 ? 'Recruit' : (S.buyMode === 1 ? 'Upgrade' : `Upgrade ×${showN}`);
      btn.innerHTML = `${verb} <small>🪙 ${fmt(showCost)}</small>`;
      btn.disabled = aff.count <= 0;
      const lvEl = el('lv-'+def.id);
      if (lvEl) lvEl.textContent = lvl;
    }
    // skill cooldown bar
    const bar = el('cd-'+def.id);
    if (bar && S.heroLevels[def.id] > 0){
      const frac = Math.min(1, (skillTimers[def.id] || 0) / effSkillCd(def));
      bar.style.width = (frac*100) + '%';
      bar.style.opacity = frac >= 1 ? '1' : '0.7';
    }
  }
}

function buildHeroPanel(){
  const panel = el('heroPanel');
  panel.innerHTML = '';
  for (const def of HERO_DEFS){
    const lvl = S.heroLevels[def.id];
    const unlocked = lvl > 0 || def.unlockWave <= 1 || S.wave >= def.unlockWave;
    const card = document.createElement('div');
    card.className = 'hero-card' + (unlocked ? '' : ' locked');
    if (!unlocked){
      card.innerHTML = `<div class="lock-tag">🔒 ${def.name}<br>Unlocks at Stage ${dispStage(def.unlockWave)}</div>`;
      panel.appendChild(card);
      continue;
    }
    const dmgTxt = def.target==='support' ? `+${(3*lvl).toFixed(0)}% aura / heal`
                 : `${fmt(heroDmg(def,lvl)*globalDmgMul())} dmg`;
    const aff = bulkBuyPlan(def);                       // levels affordable right now
    const showN = aff.count > 0 ? aff.count : 1;
    const showCost = aff.count > 0 ? aff.cost : heroCost(def, lvl);
    const verb = lvl === 0 ? 'Recruit' : (S.buyMode === 1 ? 'Upgrade' : `Upgrade ×${showN}`);
    card.innerHTML = `
      <h3><span style="color:${def.color}">◆</span> ${def.name}</h3>
      <div class="role">${def.role}</div>
      <div class="stat-row"><span>Level</span><b id="lv-${def.id}">${lvl}</b></div>
      <div class="stat-row"><span>${def.target==='support'?'Support':'Power'}</span><b id="dmg-${def.id}">${dmgTxt}</b></div>
      <div class="skill-row" title="Auto-cast area skill">${def.skill.icon} ${def.skill.name}</div>
      <div class="cd-bar"><div class="cd-fill" id="cd-${def.id}" style="background:${def.color}"></div></div>
      <button class="buy" id="buy-${def.id}" ${aff.count>0?'':'disabled'}>
        ${verb} <small>🪙 ${fmt(showCost)}</small>
      </button>`;
    panel.appendChild(card);
    card.querySelector('.buy').addEventListener('click', () => buyHero(def));
  }
}

// How many levels the current buy-mode can afford for a hero, and their cost.
function bulkBuyPlan(def, mode = S.buyMode){
  const start = S.heroLevels[def.id];
  if (start === 0 && S.wave < def.unlockWave) return { count:0, cost:0 };
  const cap = mode === 'max' ? Infinity : mode;
  let lvl = start, cost = 0, count = 0;
  while (count < cap){
    const c = heroCost(def, lvl);
    if (cost + c > S.gold) break;
    cost += c; lvl++; count++;
    if (count > 100000) break;   // safety
  }
  return { count, cost };
}
function buyHero(def){
  const lvl = S.heroLevels[def.id];
  if (lvl === 0 && S.wave < def.unlockWave){ buildHeroPanel(); return; }
  const plan = bulkBuyPlan(def);
  if (plan.count <= 0) return;
  S.gold -= plan.cost;
  S.heroLevels[def.id] += plan.count;
  GA('upgrade');
  checkAchievements();
  buildHeroPanel();            // refresh labels/costs (levels may jump by many)
  updateHud();
}

// ------------------------------------------------------------------ toasts / banner
let toastTimer;
function toast(msg){
  const t = el('toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(()=>t.classList.remove('show'), 2600);
}
let bannerTimer;
function showWaveBanner(w){
  const b = el('wavebanner');
  const label = `Stage ${dispStage(w)} · Wave ${waveInStage(w)}/${STAGE_WAVES}`;
  b.textContent = isBossWave(w) ? `⚔️ BOSS — ${label}` : label;
  b.style.opacity = '1';
  clearTimeout(bannerTimer); bannerTimer = setTimeout(()=>b.style.opacity='0.35', 1400);
}

// ------------------------------------------------------------------ modals
function openModal(html){
  const box = el('modalBox');
  // preserve scroll when re-rendering an already-open modal (e.g. destroying a relic)
  const keep = el('modal').classList.contains('show') ? box.scrollTop : 0;
  box.innerHTML = html;
  el('modal').classList.add('show');
  box.scrollTop = keep;
}
function closeModal(){ el('modal').classList.remove('show'); el('modalBox').classList.remove('wide'); }
el('modal').addEventListener('click', e => { if (e.target.id === 'modal') closeModal(); });

function doPrestige(){
  const gain = prestigeShards(S.totalGoldEarned) - S.shardsEarned;
  if (gain <= 0){ toast('Not enough progress to gain shards yet.'); return; }
  openModal(`
    <h2>💠 Reseal the Crystal</h2>
    <p>Reset your waves, gold, and hero levels to permanently reinforce the seal.</p>
    <p>You will gain <b style="color:var(--shard)">+${gain} Aether Shards</b>
       (you'd hold ${S.shards + gain}). Every shard earned grants
       <b>+2% permanent global damage</b> and can be spent in the Shard Shop.</p>
    <div style="display:flex;gap:8px;margin-top:14px">
      <button class="btn prestige" id="confPrestige" style="flex:1">Reseal Now</button>
      <button class="btn" id="cancPrestige" style="flex:1">Cancel</button>
    </div>`);
  el('confPrestige').onclick = () => {
    const keep = {
      shards: S.shards + gain, shardsEarned: S.shardsEarned + gain,
      shardUpg: S.shardUpg, totalGoldEarned: S.totalGoldEarned,
      bestWave: S.bestWave, totalKills: S.totalKills, goldenKills: S.goldenKills,
      prestiges: S.prestiges + 1, achievements: S.achievements,
      talents: S.talents, talentPoints: S.talentPoints + 2,   // +2 TP per reseal
      relics: S.relics, equipped: S.equipped, relicSeq: S.relicSeq,
      kills: S.kills, bestCombo: S.bestCombo,                 // lifetime records
      autoUp: S.autoUp, seenIntro: S.seenIntro,               // keep QoL/tutorial flags
      keystone: S.keystone,                                   // keep the build choice
    };
    S = freshState();
    Object.assign(S, keep);
    enemies.length = 0; fx.length = 0; particles.length = 0; partyBuffT = 0;
    for (const k in skillTimers) skillTimers[k] = 0;
    breakStreak = 0; lastBreakWave = 0;
    const pb = el('btnPrestige'); if (pb) pb.classList.remove('nudge');
    startWave(1);
    checkAchievements();
    buildHeroPanel(); updateHud(); save();
    closeModal(); GA('prestige');
    toast('💠 The Crystal is resealed. +' + gain + ' shards, +2 TP.');
  };
  el('cancPrestige').onclick = closeModal;
}

function openShardShop(){
  let rows = SHARD_UPGRADES.map(u => {
    const lvl = S.shardUpg[u.id];
    const cost = Math.ceil(u.base * Math.pow(u.growth, lvl));
    const maxed = lvl >= u.max;
    return `<div class="shard-item">
      <div class="info"><b>${u.name}</b> — ${u.desc}
        <div class="lv">Lv ${lvl}/${u.max} · now ${u.fmt(lvl)}</div></div>
      <button class="btn" data-up="${u.id}" ${maxed||S.shards<cost?'disabled':''}>${maxed?'MAX':'💠 '+cost}</button>
    </div>`;
  }).join('');
  openModal(`
    <h2>💠 Shard Shop</h2>
    <p>Permanent upgrades bought with Aether Shards. These persist through every reseal.
       You have <b style="color:var(--shard)">${S.shards}</b> shards.</p>
    <div class="shard-shop">${rows}</div>
    <button class="btn" id="closeShop" style="width:100%">Close</button>`);
  el('closeShop').onclick = closeModal;
  el('modalBox').querySelectorAll('[data-up]').forEach(b => {
    b.onclick = () => {
      const u = SHARD_UPGRADES.find(x => x.id === b.dataset.up);
      const lvl = S.shardUpg[u.id];
      const cost = Math.ceil(u.base * Math.pow(u.growth, lvl));
      if (S.shards < cost || lvl >= u.max) return;
      S.shards -= cost; S.shardUpg[u.id]++; GA('upgrade');
      save(); openShardShop(); updateHud();
    };
  });
}

// ------------------------------------------------------------------ offline
// ---- Idle progression: simulate wave clears while the player is away ----
function fmtDur(s){ s = Math.floor(s); return s < 60 ? s+'s' : s < 3600 ? Math.floor(s/60)+'m' : (s/3600).toFixed(1)+'h'; }
// rough total hero DPS (single + AoE approx, small fudge for skills/crits)
function heroDPS(){
  let d = 0;
  for (const def of HERO_DEFS){
    const lvl = S.heroLevels[def.id];
    if (lvl <= 0 || def.baseDmg <= 0) continue;
    const perHit = heroDmg(def, lvl) * combatMul();
    const mult = def.target === 'all' ? 4 : 1;      // AoE hits several foes
    d += perHit / effInterval(def) * mult;
  }
  return d * 1.3;
}
const owHP   = w => (isBossWave(w) ? enemyHP(w) * 8 : enemyCount(w) * enemyHP(w) * 1.3) * enemyHpMul();
const owGold = w => Math.ceil((isBossWave(w) ? goldPerKill(w) * 10 : enemyCount(w) * goldPerKill(w)) * goldMulAll());

// Advance waves for `seconds` of absence, stopping at the DPS sustain wall.
function runOfflineSim(seconds){
  const budgetTotal = Math.min(seconds, OFFLINE_CAP_S);
  let budget = budgetTotal, waves = 0, gold = 0, kills = 0, it = 0;
  const dps = heroDPS();
  if (dps <= 0){
    if (S.recentGoldRate.length){
      const rate = S.recentGoldRate.reduce((a,b)=>a+b,0) / S.recentGoldRate.length;
      gold = Math.floor(rate * budget * 0.5);
    }
  } else {
    while (budget > 0 && it++ < 5000){
      const w = S.wave;
      const combatT = owHP(w) / dps;
      if (combatT > 40) break;                        // can't burn them down → wall
      const total = combatT + (isBossWave(w) ? 3 : enemyCount(w) * SPAWN_INTERVAL * 0.6);
      if (total > budget) break;
      budget -= total;
      gold += owGold(w); kills += isBossWave(w) ? 1 : enemyCount(w);
      S.wave++; waves++;
    }
    reachWave(S.wave);                                 // award all crossed milestones at once
  }
  gold = Math.floor(gold);
  if (gold > 0){ S.gold += gold; S.totalGoldEarned += gold; }
  if (kills > 0) S.totalKills += kills;
  if (waves > 0){ S.crystalHp = 1; enemies.length = 0; startWave(S.wave); checkUnlocks(S.wave); }
  checkAchievements();
  return { waves, gold, seconds: budgetTotal };
}

function applyOffline(){
  const away = (Date.now() - S.lastSeen) / 1000;
  if (away < 60) return;
  const r = runOfflineSim(away);
  if (r.waves <= 0 && r.gold <= 0) return;
  openModal(`
    <h2>🌙 Welcome back, guardian</h2>
    <p>Your heroes held the line for <b>${fmtDur(r.seconds)}</b> while you were away
       (progress is capped at 8h and stops where your damage can no longer keep up).</p>
    <div style="display:flex;gap:10px;justify-content:center;margin:16px 0;text-align:center">
      <div style="flex:1"><div style="font-size:22px">🌊 <b style="color:var(--accent)">+${r.waves}</b></div><div style="font-size:11px;color:var(--muted)">waves cleared</div></div>
      <div style="flex:1"><div style="font-size:22px">🪙 <b style="color:var(--gold)">+${fmt(r.gold)}</b></div><div style="font-size:11px;color:var(--muted)">gold earned</div></div>
    </div>
    <button class="btn" id="collectOff" style="width:100%">Collect</button>`);
  el('collectOff').onclick = closeModal;
}

// ---- Wall signposting: nudge toward Reseal after repeated crystal breaks ----
let lastBreakWave = 0, breakStreak = 0, wallHintT = 0;
function prestigeGain(){ return prestigeShards(S.totalGoldEarned) - S.shardsEarned; }
function maybeWallHint(brokeWave){
  if (breakStreak < 2 || wallHintT > 0) return;
  wallHintT = 40;                                   // cooldown before it can fire again
  const gain = prestigeGain();
  if (gain > 0){
    toast(`🧱 Wall at Wave ${brokeWave}. Reseal the Crystal for +${gain}💠 to grow permanently stronger!`);
    const pb = el('btnPrestige'); if (pb) pb.classList.add('nudge');
  } else {
    toast(`🧱 Stuck at Wave ${brokeWave}? Upgrade your heroes and Fortify the tower, then farm gold for your first Reseal.`);
  }
}

// ---- First-run tutorial ----
function showIntro(){
  openModal(`
    <h2>⟡ Defend the Aether Crystal</h2>
    <p>Endless waves of monsters march from the right toward your Crystal on the left.
       Your heroes attack on their own — you grow the defense.</p>
    <p style="margin-top:10px">
      • <b>Buy &amp; upgrade heroes</b> with 🪙 gold (cards below). More heroes unlock as you reach new waves.<br>
      • Each hero has an <b>auto-casting skill</b> — <b>tap a hero</b> to fire it early.<br>
      • ⚡ <b>Overdrive</b> charges from kills for a burst; 🅰️ <b>Auto</b> spends gold for you.<br>
      • Hit a wall? <b>💠 Reseal (Prestige)</b> trades your run for permanent power — that's how you break through.
    </p>
    <button class="btn" id="introOk" style="width:100%;margin-top:12px">Begin the defense ⚔️</button>`);
  el('introOk').onclick = () => { S.seenIntro = true; save(); closeModal(); };
}

// Catch up when a backgrounded tab regains focus (rAF is paused while hidden).
let hiddenAt = 0;
document.addEventListener('visibilitychange', () => {
  if (document.hidden){ hiddenAt = Date.now(); save(); return; }
  if (!hiddenAt) return;
  const away = (Date.now() - hiddenAt) / 1000; hiddenAt = 0;
  lastT = performance.now();                          // avoid a huge dt spike
  if (away < 20) return;
  const r = runOfflineSim(away);
  if (r.waves > 0 || r.gold > 0){
    buildHeroPanel(); updateHud(); save();
    toast(`🌙 Away ${fmtDur(r.seconds)} — +${r.waves} waves, 🪙 +${fmt(r.gold)}`);
  }
});

// ------------------------------------------------------------------ wiring
el('btnPrestige').onclick = doPrestige;
el('btnShop').onclick = openShardShop;
el('btnReset').onclick = () => {
  openModal(`<h2>Reset Save?</h2><p>This permanently deletes all progress, shards, and upgrades.</p>
    <div style="display:flex;gap:8px;margin-top:14px">
      <button class="btn" id="doReset" style="flex:1;background:var(--danger);border-color:var(--danger)">Delete Everything</button>
      <button class="btn" id="noReset" style="flex:1">Cancel</button></div>`);
  el('doReset').onclick = () => { localStorage.removeItem(SAVE_KEY); location.reload(); };
  el('noReset').onclick = closeModal;
};
document.querySelectorAll('[data-spd]').forEach(b => {
  b.onclick = () => {
    S.speed = +b.dataset.spd;
    document.querySelectorAll('[data-spd]').forEach(x=>x.classList.remove('sel'));
    b.classList.add('sel');
  };
});

if (el('odBtn')) el('odBtn').onclick = tryOverdrive;

// tap a hero on the battlefield to instantly cast their ready skill
canvas.addEventListener('pointerdown', e => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left, y = e.clientY - rect.top;
  let best = null, bd = Infinity;
  for (const slot of heroSlots()){
    if (!slot.active) continue;
    const d = Math.hypot(slot.x - x, (slot.y - 30) - y);
    if (d < bd){ bd = d; best = slot; }
  }
  if (best && bd < 48){
    const def = best.def;
    const ready = (skillTimers[def.id] || 0) >= effSkillCd(def);
    if (ready && (enemies.some(engaged) || def.skill.kind === 'blessing')){
      skillTimers[def.id] = 0;
      castSkill(def, best, S.heroLevels[def.id]);
    }
  }
});

// stats panel
function openStats(){
  openModal(`
    <h2>📊 Guardian's Record</h2>
    <div class="shard-shop">
      <div class="shard-item"><div class="info"><b>Current Stage</b><div class="lv">Stage ${dispStage(S.wave)} · Wave ${waveInStage(S.wave)}/${STAGE_WAVES}</div></div></div>
      <div class="shard-item"><div class="info"><b>Best Stage</b><div class="lv">Stage ${dispStage(S.bestWave)} · Wave ${waveInStage(S.bestWave)}/${STAGE_WAVES}</div></div></div>
      <div class="shard-item"><div class="info"><b>Next Milestone</b><div class="lv">🏅 Clear Stage ${dispStage(nextMilestone())} — reward 💠${1 + Math.floor(nextMilestone()/100)}${nextMilestone()%100===0?' + 🌳1':''}</div></div></div>
      <div class="shard-item"><div class="info"><b>Enemies Defeated</b><div class="lv">${fmt(S.totalKills)}</div></div></div>
      <div class="shard-item"><div class="info"><b>Lifetime Gold</b><div class="lv">🪙 ${fmt(S.totalGoldEarned)}</div></div></div>
      <div class="shard-item"><div class="info"><b>Shards Earned</b><div class="lv">💠 ${S.shardsEarned}</div></div></div>
      <div class="shard-item"><div class="info"><b>Critical Chance</b><div class="lv">${Math.round(critChance()*100)}%</div></div></div>
      <div class="shard-item"><div class="info"><b>Best Combo</b><div class="lv">🔥 ${S.bestCombo}× streak</div></div></div>
    </div>
    <div class="branch-title">Gold income per wave</div>
    <canvas id="statChart" width="800" height="220"
      style="width:100%;height:110px;background:#0d1128;border:1px solid var(--line);border-radius:8px"></canvas>
    <button class="btn" id="closeStats" style="width:100%;margin-top:12px">Close</button>`);
  el('closeStats').onclick = closeModal;
  drawGoldChart(el('statChart'));
}
// simple gold/sec line chart (last cleared waves) in the game's palette
function drawGoldChart(cv){
  if (!cv) return;
  const g = cv.getContext('2d'); const W = cv.width, H = cv.height;
  g.clearRect(0, 0, W, H);
  const data = S.goldHistory || [];
  if (data.length < 2){
    g.fillStyle = '#8b93c4'; g.font = '20px system-ui'; g.textAlign = 'center';
    g.fillText('Clear a few waves to chart your gold income…', W/2, H/2);
    return;
  }
  const pad = { l: 64, r: 12, t: 14, b: 26 };
  const max = Math.max(...data.map(d => d.r), 1), min = 0;
  const x = i => pad.l + (W - pad.l - pad.r) * (i / (data.length - 1));
  const y = v => pad.t + (H - pad.t - pad.b) * (1 - (v - min) / (max - min || 1));
  // gridlines + y labels
  g.strokeStyle = 'rgba(255,255,255,.08)'; g.fillStyle = '#8b93c4';
  g.font = '13px system-ui'; g.textAlign = 'right'; g.lineWidth = 1;
  for (let k = 0; k <= 3; k++){
    const v = max * k/3, yy = y(v);
    g.beginPath(); g.moveTo(pad.l, yy); g.lineTo(W - pad.r, yy); g.stroke();
    g.fillText(fmt(v) + '/s', pad.l - 6, yy + 4);
  }
  // x labels (first / last wave)
  g.textAlign = 'center';
  g.fillText('W' + data[0].w, x(0), H - 8);
  g.fillText('W' + data[data.length-1].w, x(data.length-1), H - 8);
  // area fill + line
  g.beginPath(); g.moveTo(x(0), y(data[0].r));
  data.forEach((d, i) => g.lineTo(x(i), y(d.r)));
  g.lineTo(x(data.length-1), y(0)); g.lineTo(x(0), y(0)); g.closePath();
  const grad = g.createLinearGradient(0, pad.t, 0, H - pad.b);
  grad.addColorStop(0, 'rgba(255,215,94,.35)'); grad.addColorStop(1, 'rgba(255,215,94,0)');
  g.fillStyle = grad; g.fill();
  g.beginPath(); g.moveTo(x(0), y(data[0].r));
  data.forEach((d, i) => g.lineTo(x(i), y(d.r)));
  g.strokeStyle = '#ffd75e'; g.lineWidth = 2.5; g.stroke();
  // last point dot
  const li = data.length - 1;
  g.fillStyle = '#ffe9a0'; g.beginPath(); g.arc(x(li), y(data[li].r), 4, 0, Math.PI*2); g.fill();
}
if (el('btnStats')) el('btnStats').onclick = openStats;

// talent tree panel
function openTalents(){
  const branches = [...new Set(TALENTS.map(t => t.branch))];
  let body = branches.map(b => {
    const rows = TALENTS.filter(t => t.branch === b).map(t => {
      const lvl = talent(t.id), maxed = lvl >= t.max;
      const afford = S.talentPoints >= t.cost && !maxed;
      return `<div class="shard-item">
        <div class="info"><b>${t.name}</b> — ${t.desc}
          <div class="lv">Lv ${lvl}/${t.max} · now ${t.fmt(lvl)}</div></div>
        <button class="btn" data-tal="${t.id}" ${afford?'':'disabled'}>${maxed?'MAX':'🌳 '+t.cost}</button>
      </div>`;
    }).join('');
    return `<div class="branch-title">${b}</div>${rows}`;
  }).join('');
  openModal(`
    <h2>🌳 Talent Tree</h2>
    <p>Spend Talent Points on permanent bonuses. Earn <b>+2 TP</b> per reseal and
       more from achievements. You have <b style="color:var(--hp)">${S.talentPoints} TP</b>.</p>
    <div class="shard-shop">${body}</div>
    <button class="btn" id="closeTal" style="width:100%">Close</button>`);
  el('closeTal').onclick = closeModal;
  el('modalBox').querySelectorAll('[data-tal]').forEach(btn => {
    btn.onclick = () => {
      const t = TALENTS.find(x => x.id === btn.dataset.tal);
      const lvl = talent(t.id);
      if (S.talentPoints < t.cost || lvl >= t.max) return;
      S.talentPoints -= t.cost;
      S.talents[t.id] = lvl + 1;
      GA('upgrade'); save(); openTalents(); updateHud();
    };
  });
}
if (el('btnTalents')) el('btnTalents').onclick = openTalents;

// Keystone panel — pick ONE build-defining perk (mutually exclusive)
function pickKeystone(id){
  S.keystone = (S.keystone === id) ? null : id;   // tap active one to clear
  GA('upgrade'); save(); openKeystones(); updateHud();
}
function openKeystones(){
  const rows = Object.entries(KEYSTONES).map(([id, k]) => {
    const on = S.keystone === id;
    return `<div class="ks ${on?'on':''}" style="--kc:${k.color}" data-ks="${id}">
      <span class="ks-ic">${k.icon}</span>
      <div class="ks-info"><div class="ks-nm">${k.name}${on?' · ACTIVE':''}</div>
        <div class="ks-desc">${k.desc}</div></div>
    </div>`;
  }).join('');
  openModal(`
    <h2>⭐ Keystone</h2>
    <p>Choose <b>one</b> build-defining keystone. Only one can be active — switch
       any time (tap the active one to clear it). They persist through Reseal.</p>
    <div class="ks-list">${rows}</div>
    <button class="btn" id="closeKs" style="width:100%;margin-top:12px">Close</button>`);
  el('closeKs').onclick = closeModal;
  el('modalBox').querySelectorAll('[data-ks]').forEach(n => n.onclick = () => pickKeystone(n.dataset.ks));
}
if (el('btnKeystone')) el('btnKeystone').onclick = openKeystones;

// Settings — display / performance toggles
const SETTING_DEFS = [
  { id:'dmgNums', name:'Damage numbers', desc:'Show floating damage numbers over enemies.' },
  { id:'fx',      name:'Particle effects', desc:'Elemental bursts, embers and sparkles. Turn off to boost performance.' },
  { id:'shake',   name:'Screen shake',    desc:'Camera shake on big hits, explosions and boss deaths.' },
];
function openSettings(){
  const rows = SETTING_DEFS.map(s => {
    const on = !!S.settings[s.id];
    return `<div class="shard-item">
      <div class="info"><b>${s.name}</b> — ${s.desc}</div>
      <button class="btn" data-set="${s.id}" style="min-width:56px;${on?'background:var(--hp);border-color:var(--hp);color:#062':''}">${on?'ON':'OFF'}</button>
    </div>`;
  }).join('');
  openModal(`
    <h2>⚙️ Settings</h2>
    <div class="shard-shop">${rows}</div>
    <button class="btn" id="closeSet" style="width:100%">Close</button>`);
  el('closeSet').onclick = closeModal;
  el('modalBox').querySelectorAll('[data-set]').forEach(b => b.onclick = () => {
    S.settings[b.dataset.set] = !S.settings[b.dataset.set]; save(); openSettings();
  });
}
if (el('btnSettings')) el('btnSettings').onclick = openSettings;

// Hero bulk-buy mode: cycle ×1 → ×10 → Max
const BUY_CYCLE = [1, 10, 'max'];
function refreshBuyModeBtn(){
  const b = el('btnBuyMode'); if (!b) return;
  b.textContent = '🛒 Buy ' + (S.buyMode === 'max' ? 'Max' : '×' + S.buyMode);
}
if (el('btnBuyMode')) el('btnBuyMode').onclick = () => {
  const i = BUY_CYCLE.indexOf(S.buyMode);
  S.buyMode = BUY_CYCLE[(i + 1) % BUY_CYCLE.length];
  refreshBuyModeBtn(); buildHeroPanel(); save();
};

// achievements panel
function openAchievements(){
  const done = ACHIEVEMENTS.filter(a => S.achievements[a.id]).length;
  const rows = ACHIEVEMENTS.map(a => {
    const got = !!S.achievements[a.id];
    const reward = [a.tp?`+${a.tp} TP`:'', a.shards?`+${a.shards}💠`:''].filter(Boolean).join(' · ') || '—';
    return `<div class="shard-item" style="${got?'':'opacity:.6'}">
      <div class="info"><b>${got?'🏆':'🔒'} ${a.name}</b> — ${a.desc}
        <div class="lv">Reward: ${reward}</div></div>
      <div class="lv">${got?'DONE':''}</div>
    </div>`;
  }).join('');
  openModal(`
    <h2>🏆 Achievements <span style="font-size:13px;color:var(--muted)">(${done}/${ACHIEVEMENTS.length})</span></h2>
    <p>One-time milestones that reward Talent Points and Aether Shards.</p>
    <div class="shard-shop">${rows}</div>
    <button class="btn" id="closeAch" style="width:100%">Close</button>`);
  el('closeAch').onclick = closeModal;
}
if (el('btnAch')) el('btnAch').onclick = openAchievements;

// ------------------------------------------------------------------ bestiary
// One codex entry per in-game monster sprite. Lore stats (LV/HP/MP/ELEMENT)
// styled like a classic RPG bestiary; portraits render the real sprite art.
const BESTIARY = [
  { sprite:'slime',      name:'Slime',            lv:1,  hp:10,  mp:2,  el:'EARTH',  fc:'#5aa03a',
    ability:'Splits into two minis when destroyed (Wave 15+)',
    lore:'A gelatinous crystal-eater. Slow, but they swarm the front line.' },
  { sprite:'zombie',     name:'Rotting Zombie',   lv:2,  hp:18,  mp:4,  el:'POISON', fc:'#6cbf3a',
    lore:'Reanimated fodder that leaves a toxic cloud when destroyed.' },
  { sprite:'skeleton',   name:'Skeleton Warrior', lv:3,  hp:45,  mp:10, el:'DARK',   fc:'#9a6bd0',
    ability:'Armoured; the Golem variant also carries a shield',
    lore:'Armoured bonelord. High HP — a proper tank of the horde.' },
  { sprite:'specter',    name:'Wraith',           lv:4,  hp:26,  mp:12, el:'DARK',   fc:'#8f8be0',
    ability:'Immune to freeze', lore:'A floating shade, immune to frost and hard to pin down.' },
  { sprite:'dragon',     name:'Red Dragon',       lv:5,  hp:150, mp:30, el:'FIRE',   fc:'#e0632a', boss:true,
    lore:'Boss. Wreathed in flame; appears on the fifth-wave assaults.' },
  { sprite:'elderghost', name:'Elder Ghost',      lv:10, hp:300, mp:60, el:'VOID',   fc:'#a05ad0', boss:true,
    lore:'Boss. An ancient void-spirit that commands the darker waves.' },
];

// draw the monster's real sprite (sheet frame 0) into a codex portrait canvas.
// undiscovered monsters render as a black silhouette.
function drawMonThumb(cv, entry, discovered){
  const ctx2 = cv.getContext('2d');
  const W = cv.width, H = cv.height;
  ctx2.clearRect(0, 0, W, H);
  ctx2.imageSmoothingEnabled = false;
  const fallback = () => {
    const S2 = window.Sprites;
    if (entry.boss && S2 && S2.drawBoss) S2.drawBoss(ctx2, W/2, H-10, 6, 0);
    else if (S2 && S2.drawEnemy) S2.drawEnemy(ctx2, W/2, H-10, 6, 'normal', 0, 1);
    if (!discovered) silhouette();
  };
  const silhouette = () => {          // paint every opaque pixel solid black
    try {
      const d = ctx2.getImageData(0, 0, W, H); const p = d.data;
      for (let i = 0; i < p.length; i += 4){ if (p[i+3] > 20){ p[i]=8; p[i+1]=8; p[i+2]=14; p[i+3]=255; } }
      ctx2.putImageData(d, 0, 0);
    } catch (e) {                      // tainted canvas (file://): just veil it
      ctx2.fillStyle = 'rgba(6,6,12,.9)'; ctx2.fillRect(0, 0, W, H);
    }
    ctx2.fillStyle = '#d9c491'; ctx2.textAlign = 'center';
    ctx2.font = '900 64px system-ui'; ctx2.fillText('?', W/2, H/2 + 24);
  };
  const cfg = window.Sheets && Sheets.CONFIG && Sheets.CONFIG[entry.sprite];
  if (!cfg){ fallback(); return; }
  const img = new Image();
  img.onload = () => {
    const cw = img.width / cfg.cols, ch = img.height / cfg.rows;
    const scale = Math.min((W-14) / cw, (H-14) / ch);
    const dw = cw * scale, dh = ch * scale;
    ctx2.imageSmoothingEnabled = false;
    ctx2.drawImage(img, 0, 0, cw, ch, (W-dw)/2, (H-dh)/2, dw, dh);
    if (!discovered) silhouette();
  };
  img.onerror = fallback;
  img.src = 'assets/' + cfg.file;
}

function openBestiary(){
  const seen = BESTIARY.filter(m => (S.kills[m.sprite] || 0) > 0).length;
  const cards = BESTIARY.map((m, i) => {
    const n = S.kills[m.sprite] || 0, disc = n > 0;
    const nm  = disc ? `${m.name.toUpperCase()}${m.boss ? ' 👑' : ''}` : '??? ??? ???';
    const hp  = disc ? `${m.hp}/${m.hp}` : '???';
    const mp  = disc ? `${m.mp}/${m.mp}` : '???';
    const elm = disc ? m.el : '?????';
    const mm = ELEM_MATCH[m.el.toLowerCase()];
    const wr = disc && mm
      ? `<div class="wr">WEAK ${ELEM_ICON[mm.weak]||''}${mm.weak.toUpperCase()} · RESIST ${ELEM_ICON[mm.resist]||''}${mm.resist.toUpperCase()}</div>`
      : '';
    const ab = disc && m.ability ? `<div class="ab">✦ ${m.ability}</div>` : '';
    return `
    <div class="mon-card${disc ? '' : ' locked'}" style="--fc:${m.fc}">
      <div class="mon-frame" style="--fc:${m.fc}">
        <canvas class="mon-portrait" width="220" height="130" data-i="${i}"></canvas>
        ${disc ? `<span class="mon-kills">☠ ${fmt(n)}</span>` : ''}
      </div>
      <div class="mon-plaque">
        <div class="nm">LV ${disc ? m.lv : '?'}&nbsp; ${nm}</div>
        <div class="st">HP: ${hp}&nbsp;&nbsp; MP: ${mp}</div>
        <div class="el">ELEMENT: ${elm}</div>
        ${wr}
        ${ab}
      </div>
    </div>`;
  }).join('');
  openModal(`
    <div class="bestiary">
      <div class="bestiary-title">⚔ Bestiary: Monster Entries ⚔</div>
      <div class="bestiary-sub">Discovered ${seen}/${BESTIARY.length} · defeat a monster to unlock its entry</div>
      <div class="bestiary-grid">${cards}</div>
      <button class="btn bestiary-close" id="closeBest">Close</button>
    </div>`);
  el('modalBox').classList.add('wide');
  el('closeBest').onclick = closeModal;
  el('modalBox').querySelectorAll('.mon-portrait').forEach(cv => {
    const m = BESTIARY[+cv.dataset.i];
    drawMonThumb(cv, m, (S.kills[m.sprite] || 0) > 0);
  });
}
if (el('btnBestiary')) el('btnBestiary').onclick = openBestiary;

// ------------------------------------------------------------------ relics
function relicColor(rel){ return (RELIC_RARITY.find(r=>r.id===rel.rarity)||RELIC_RARITY[0]).color; }
function relicRarityName(rel){ return (RELIC_RARITY.find(r=>r.id===rel.rarity)||RELIC_RARITY[0]).name; }
function toggleEquip(id){
  const i = S.equipped.indexOf(id);
  if (i >= 0) S.equipped.splice(i, 1);
  else { if (S.equipped.length >= RELIC_SLOTS){ toast('All relic slots full — unequip one first'); return; } S.equipped.push(id); }
  save(); openRelics();
}
function relicSalvage(rel){ return Math.ceil((RELIC_RARITY.find(r=>r.id===rel.rarity)?.mul || 1) / 2); }
function destroyRelic(id){
  const rel = S.relics.find(r => r.id === id);
  if (!rel) return;
  const salv = relicSalvage(rel);
  S.relics = S.relics.filter(r => r.id !== id);
  const ei = S.equipped.indexOf(id); if (ei >= 0) S.equipped.splice(ei, 1);
  S.shards += salv;
  toast(`🗑️ Destroyed ${RELIC_TYPES[rel.type].name} — salvaged ${salv}💠`);
  GA('upgrade'); save(); openRelics(); updateHud();
}
function openRelics(){
  // the relic list is its own scroll container — preserve its position across re-renders
  const prevScroll = el('modalBox').querySelector('.relic-list')?.scrollTop || 0;
  const slots = Array.from({length:RELIC_SLOTS}, (_,i) => {
    const id = S.equipped[i]; const rel = id && S.relics.find(r=>r.id===id);
    if (!rel) return `<div class="relic-slot">＋</div>`;
    return `<div class="relic-slot filled" style="border-color:${relicColor(rel)}" data-eq="${rel.id}">${RELIC_TYPES[rel.type].icon}</div>`;
  }).join('');
  const owned = [...S.relics].sort((a,b)=>{
    const ra = RELIC_RARITY.findIndex(r=>r.id===a.rarity), rb = RELIC_RARITY.findIndex(r=>r.id===b.rarity);
    return rb-ra || b.id-a.id;
  });
  const list = owned.length ? owned.map(rel => {
    const t = RELIC_TYPES[rel.type], eq = S.equipped.includes(rel.id);
    const t2 = rel.type2 ? RELIC_TYPES[rel.type2] : null;
    const myth = rel.rarity === 'mythic';
    const name = t2 ? `${t.name} + ${t2.name}` : t.name;
    const stats = t2
      ? `${t.fmt(relicValue(rel))} · ${t2.fmt(relicValue2(rel))}`
      : t.fmt(relicValue(rel));
    return `<div class="relic ${eq?'eq':''} ${myth?'mythic':''}" style="--rc:${relicColor(rel)}">
      <span class="ic" data-rel="${rel.id}">${t.icon}${t2?t2.icon:''}</span>
      <div style="flex:1" data-rel="${rel.id}"><div class="rn">${name}</div><div class="rd">${stats}</div>
        <div class="rr">${relicRarityName(rel)}${eq?' · EQUIPPED':''}</div></div>
      <button class="relic-del" data-del="${rel.id}" title="Destroy (salvage ${relicSalvage(rel)}💠)">🗑️</button>
    </div>`;
  }).join('') : `<p style="grid-column:1/-1;color:var(--muted)">No relics yet. Defeat bosses (every ${BOSS_EVERY} waves) to find them.</p>`;
  openModal(`
    <h2>🗡️ Relics</h2>
    <p>Bosses drop relics that grant permanent global bonuses. Equip up to
       <b>${RELIC_SLOTS}</b>. Tap a relic to equip / unequip.</p>
    <div class="relic-slots">${slots}</div>
    <div class="relic-list">${list}</div>
    <button class="btn" id="closeRelic" style="width:100%;margin-top:12px">Close</button>`);
  el('closeRelic').onclick = closeModal;
  el('modalBox').querySelectorAll('[data-rel]').forEach(n => n.onclick = () => toggleEquip(+n.dataset.rel));
  el('modalBox').querySelectorAll('[data-eq]').forEach(n => n.onclick = () => toggleEquip(+n.dataset.eq));
  el('modalBox').querySelectorAll('[data-del]').forEach(n => n.onclick = e => { e.stopPropagation(); destroyRelic(+n.dataset.del); });
  const newList = el('modalBox').querySelector('.relic-list');
  if (newList) newList.scrollTop = prevScroll;
}
if (el('btnRelics')) el('btnRelics').onclick = openRelics;

// Fortify Tower — repeatable gold upgrade that raises the crystal's max HP
function buyTower(){
  const c = towerCost();
  if (S.gold < c){ toast('Not enough gold to fortify the tower'); return; }
  S.gold -= c; S.towerLv++;
  S.crystalHp = Math.min(1, S.crystalHp + 0.04);   // small repair on fortify
  GA('upgrade'); save(); openTower(); updateHud();
}
function openTower(){
  const c = towerCost(), afford = S.gold >= c;
  openModal(`
    <h2>🏰 Fortify Tower</h2>
    <p>Reinforce the Crystal Tower to raise its maximum HP — each level adds
       <b>+15% effective HP</b>, so enemies chip away less with every hit.
       Fortify levels reset when you reseal the Crystal.</p>
    <div class="shard-shop">
      <div class="shard-item"><div class="info"><b>Tower Level</b>
        <div class="lv">Lv ${S.towerLv} · +${Math.round((towerHpMul()-1)*100)}% HP</div></div></div>
      <div class="shard-item"><div class="info"><b>Effective Max HP</b>
        <div class="lv">💎 ${fmt(Math.round(crystalMaxHp()))}</div></div></div>
    </div>
    <button class="btn" id="buyTower" ${afford?'':'disabled'}
      style="width:100%;background:linear-gradient(#f2c14a,#e0a72e);color:#3a2a00;border:0">
      🏰 Fortify — 🪙 ${fmt(c)}</button>
    <button class="btn" id="closeTower" style="width:100%;margin-top:8px">Close</button>`);
  el('buyTower').onclick = buyTower;
  el('closeTower').onclick = closeModal;
}
if (el('btnTower')) el('btnTower').onclick = openTower;

// Auto-upgrade toggle
function refreshAutoBtn(){
  const b = el('btnAuto'); if (!b) return;
  b.classList.toggle('sel', !!S.autoUp);
  b.textContent = S.autoUp ? '🅰️ Auto: On' : '🅰️ Auto';
}
if (el('btnAuto')) el('btnAuto').onclick = () => {
  S.autoUp = !S.autoUp; refreshAutoBtn();
  toast(S.autoUp ? '🅰️ Auto-upgrade ON — spending gold on the cheapest upgrade'
                 : '🅰️ Auto-upgrade OFF');
  save();
};

// audio buttons + unlock-on-first-gesture
const btnMute = el('btnMute'), btnMusic = el('btnMusic');
if (btnMute) btnMute.onclick = () => { const m = window.GameAudio && GameAudio.toggleMute(); btnMute.textContent = m ? '🔇' : '🔊'; };
if (btnMusic) btnMusic.onclick = () => { const on = window.GameAudio && GameAudio.toggleMusic(); btnMusic.textContent = on ? '♪' : '♪̶'; btnMusic.style.opacity = on ? '1' : '0.5'; };
// HD sprite-sheet toggle (uses assets/*.png if present; reloads to apply)
const btnSheets = el('btnSheets');
if (btnSheets){
  if (window.Sheets && Sheets.isEnabled()) btnSheets.classList.add('sel');
  btnSheets.onclick = () => {
    if (!window.Sheets) return;
    const on = !Sheets.isEnabled();
    Sheets.setEnabled(on);
    toast(on ? '🎨 HD sprites ON — place PNGs in assets/ (reloading…)' : '🎨 HD sprites off (reloading…)');
    setTimeout(() => location.reload(), 700);
  };
}

function audioUnlock(){ if (window.GameAudio) GameAudio.unlock(); window.removeEventListener('pointerdown', audioUnlock); window.removeEventListener('keydown', audioUnlock); window.removeEventListener('touchstart', audioUnlock); }
window.addEventListener('pointerdown', audioUnlock);
window.addEventListener('touchstart', audioUnlock);
window.addEventListener('keydown', audioUnlock);

// ------------------------------------------------------------------ boot
function boot(){
  S = load() || freshState();
  if (window.Sheets && Sheets.preload) Sheets.preload();   // avoid canvas→sheet size pop
  resize();
  if (!S.seenIntro) showIntro();      // first-run tutorial (before any offline popup)
  else applyOffline();
  checkAchievements();
  startWave(S.wave);
  buildHeroPanel();
  showWaveBanner(S.wave);
  updateHud();
  refreshAutoBtn();
  refreshBuyModeBtn();
  document.querySelector('[data-spd="1"]').classList.add('sel');
  window.addEventListener('beforeunload', save);
  setInterval(save, 15000);
  requestAnimationFrame(frame);
}
boot();
