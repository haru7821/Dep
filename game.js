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
const BOSS_EVERY = 5;                  // boss on every 5th wave

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

// Enemy archetypes: hp/speed/render-size multipliers, gold bonus, slow immunity.
const ENEMY_TYPES = {
  normal: { hp:1.0, spd:26, size:1.0,  gold:1 },
  fast:   { hp:0.6, spd:46, size:0.9,  gold:1 },
  runner: { hp:0.4, spd:62, size:0.85, gold:1 },
  tank:   { hp:2.2, spd:18, size:1.5,  gold:2 },
  golem:  { hp:4.5, spd:13, size:2.0,  gold:4 },
  wraith: { hp:1.3, spd:34, size:1.1,  gold:2, slowImmune:true, float:true },
};
const SLOW_FACTOR = 0.42;              // movement multiplier while frozen
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
function critChance(){ return Math.min(0.75, 0.03 + 0.03 * S.shardUpg.crit); }
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
function effInterval(def){ return Math.max(0.05, def.atkInterval * (1 - 0.05 * talent('haste'))); }
function effSkillCd(def){ return def.skill.cd * (1 - 0.04 * talent('focus')); }
function wardMul(){ return shardMul('ward') * (1 + 0.10 * talent('bulwark')); }
function goldMulAll(){ return shardMul('gold') * (1 + 0.08 * talent('greed')); }
function goldenChance(){ return 0.03 + 0.01 * talent('fortune'); }

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

// ------------------------------------------------------------------ formulas
const enemyHP    = w => 10 * Math.pow(1.12, w - 1);
const enemyCount = w => Math.min(5 + Math.floor(w / 3), 20);
const goldPerKill= w => Math.ceil(2 * Math.pow(1.10, w - 1));
const isBossWave = w => w % BOSS_EVERY === 0;
const heroDmg    = (def, lvl) => def.baseDmg * (1 + 0.25 * lvl);
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
    bestWave: 1,            // lifetime best wave reached
    totalKills: 0,          // lifetime enemies defeated
    goldenKills: 0,         // golden enemies slain (lifetime)
    prestiges: 0,           // number of reseals performed
    achievements: {},       // id -> true when unlocked
    talents: {},            // talent node id -> level
    talentPoints: 0,        // spendable talent points
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
  return m;
}
function combatMul(){ return globalDmgMul() * (partyBuffT > 0 ? PARTY_BUFF_MUL : 1) * (1 + 0.05 * talent('might')); }
function crystalMaxHp(){ return 100 * wardMul(); }
function gameSpeed(){ return S.speed * shardMul('speed'); }

// ------------------------------------------------------------------ combat sim
const enemies = [];          // {x,y,hp,maxHp,type,speed,frame,boss,slow,goldMul,atkTimer}
const fx = [];               // visible attack effects
const floaters = [];         // damage/gold popups {x,y,txt,color,life}
const heroTimers = {};       // basic-attack cooldown per hero
const skillTimers = {};      // skill cooldown accumulator per hero
const heroFlash = {};        // attack-flash timer per hero id (survives heroSlots rebuilds)
let spawnTimer = 0, spawnedThisWave = 0, waveKills = 0, waveGoldAccum = 0, waveTime = 0;
let partyBuffT = 0;          // remaining seconds of Aunel's damage buff

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

function pickType(w){
  const pool = ['normal', 'normal', 'fast'];
  if (w >= 5)  pool.push('runner');
  if (w >= 6)  pool.push('tank');
  if (w >= 8)  pool.push('wraith');
  if (w >= 12) pool.push('golem');
  return pool[Math.floor(Math.random() * pool.length)];
}

function spawnEnemy(w){
  if (isBossWave(w)){
    const hp = enemyHP(w) * 8;
    enemies.push({ x: view.laneRight, y: view.ground, hp, maxHp: hp,
      type:'boss', speed:18, frame:0, boss:true, slow:0, goldMul:10, atkTimer:0 });
    return;
  }
  const type = pickType(w);
  const t = ENEMY_TYPES[type];
  const hp = enemyHP(w) * t.hp;
  const golden = w >= 8 && Math.random() < goldenChance();   // rare high-gold enemy
  enemies.push({
    x: view.laneRight + Math.random()*40, y: view.ground,
    hp, maxHp: hp, type, speed: t.spd, frame:0, boss:false,
    slow:0, goldMul: golden ? t.gold * 30 : t.gold, golden, atkTimer:0,
  });
}

function startWave(w){
  spawnTimer = 0; spawnedThisWave = 0; waveKills = 0;
  waveGoldAccum = 0; waveTime = 0;
}

function addFloater(x, y, txt, color){ floaters.push({ x, y, txt, color, life: 1 }); }
function addFx(o){ o.t = 0; if (o.dur == null) o.dur = 0.3; fx.push(o); if (fx.length > 140) fx.shift(); }

function grantGold(amount){
  S.gold += amount;
  S.totalGoldEarned += amount;
  waveGoldAccum += amount;
}

// Deal damage to a specific enemy; returns true if it died
function damageEnemy(e, dmg){
  e.hp -= dmg;
  if (e.hp <= 0){
    const g = goldPerKill(S.wave) * e.goldMul * goldMulAll();
    grantGold(g);
    waveKills++;
    S.totalKills++;
    if (e.golden){
      S.goldenKills++;
      addFloater(e.x, e.y - 34*(view.h/460), '💰 +' + fmt(g), '#ffe14d'); GA('prestige');
      checkAchievements();
    }
    else addFloater(e.x, e.y - 30*(view.h/460), '+' + fmt(g), '#ffd75e');
    return true;
  }
  return false;
}

function nearestEnemy(){
  let target = null, best = Infinity;
  for (const e of enemies){ if (e.x < best){ best = e.x; target = e; } }
  return target;
}
function removeEnemy(e){ const i = enemies.indexOf(e); if (i >= 0) enemies.splice(i, 1); }

// ------------------------------------------------------------------ skills
function castSkill(def, slot, lvl){
  const s = def.skill;
  const roll = critRoll(skillBase(def, lvl) * combatMul() * s.mult * (1 + 0.10 * talent('empower')));
  const dmg = roll.dmg;
  const hx = slot.x, hy = slot.y - 22;
  if (roll.crit && s.kind !== 'blessing') addFloater(hx, hy - 20, 'CRIT!', '#ffa03c');

  if (s.kind === 'shock'){
    addFx({ kind:'nova', x: hx + 34, y: slot.y - 12, r0:8, r:150, dur:0.5, color:s.fx });
    for (let i = enemies.length - 1; i >= 0; i--) if (damageEnemy(enemies[i], dmg)) enemies.splice(i, 1);
    GA('explosion');
  }
  else if (s.kind === 'frost'){
    const cx = (view.crystalX + view.laneRight) / 2, cy = slot.y - 16;
    addFx({ kind:'nova', x: cx, y: cy, r0:8, r:190, dur:0.6, color:s.fx });
    for (let i = enemies.length - 1; i >= 0; i--){
      const e = enemies[i];
      if (!ENEMY_TYPES[e.type] || !ENEMY_TYPES[e.type].slowImmune) e.slow = 3;   // freeze
      if (damageEnemy(e, dmg)) enemies.splice(i, 1);
    }
    GA('ice');
  }
  else if (s.kind === 'explode'){
    const t = nearestEnemy(); if (!t) return;
    const R = 95;
    addFx({ kind:'arrow', x: hx, y: hy, x2: t.x, y2: t.y - 14, dur:0.22, color:s.fx });
    addFx({ kind:'nova', x: t.x, y: t.y - 14, r0:6, r:R, dur:0.45, color:s.fx });
    for (let i = enemies.length - 1; i >= 0; i--){
      if (Math.abs(enemies[i].x - t.x) <= R){ if (damageEnemy(enemies[i], dmg)) enemies.splice(i, 1); }
    }
    GA('explosion');
  }
  else if (s.kind === 'chain'){
    const targets = [...enemies].sort((a,b) => a.x - b.x).slice(0, 5);
    if (!targets.length) return;
    const segs = []; let px = hx, py = hy;
    for (const e of targets){ segs.push([px, py, e.x, e.y - 14]); px = e.x; py = e.y - 14; }
    addFx({ kind:'chain', segs, dur:0.3, color:s.fx });
    for (const e of targets) if (damageEnemy(e, dmg)) removeEnemy(e);
    GA('lightning');
  }
  else if (s.kind === 'blessing'){
    S.crystalHp = Math.min(1, S.crystalHp + 0.25);
    partyBuffT = 5 + talent('grace');
    const holy = skillBase(def, lvl) * combatMul() * 2.5;
    addFx({ kind:'nova', x: view.crystalX, y: slot.y - 18, r0:8, r:220, dur:0.7, color:s.fx });
    addFx({ kind:'heal', x: view.crystalX, y: view.ground - 40, dur:0.9, color:s.fx });
    for (let i = enemies.length - 1; i >= 0; i--) if (damageEnemy(enemies[i], holy)) enemies.splice(i, 1);
    GA('heal');
  }
  heroFlash[def.id] = 0.22;
}

// ------------------------------------------------------------------ main tick
function simulate(dt){
  const w = S.wave;
  const slots = heroSlots();
  const totalToSpawn = isBossWave(w) ? 1 : enemyCount(w);
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
    if (e.slow > 0) e.slow -= dt;
    const reach = view.crystalX + 34*px;
    if (e.x > reach){
      const sp = e.speed * (e.slow > 0 ? SLOW_FACTOR : 1);
      e.x -= sp * px * dt;
    } else {
      e.atkTimer += dt;
      if (e.atkTimer >= 1){
        e.atkTimer -= 1;
        const dmgFrac = (e.boss ? 0.20 : 0.05) / wardMul();
        S.crystalHp = Math.max(0, S.crystalHp - dmgFrac);
        addFloater(view.crystalX, view.ground - 60*px, '-' + Math.round(dmgFrac*100) + '%', '#ff6b6b');
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
      if (enemies.length > 0 || wantsHeal){
        skillTimers[def.id] = 0;
        castSkill(def, slot, lvl);
      } else {
        skillTimers[def.id] = cd;      // hold ready until there's something to hit
      }
    }
  }

  // crystal broken -> fall back a few waves, restore
  if (S.crystalHp <= 0){
    S.wave = Math.max(1, S.wave - 3);
    S.crystalHp = 1;
    enemies.length = 0; fx.length = 0;
    startWave(S.wave);
    toast('💥 The Crystal shattered! Fell back to Wave ' + S.wave);
    return;
  }

  // wave clear
  if (spawnedThisWave >= totalToSpawn && enemies.length === 0){
    if (waveTime > 0){
      S.recentGoldRate.push(waveGoldAccum / waveTime);
      if (S.recentGoldRate.length > 10) S.recentGoldRate.shift();
    }
    S.crystalHp = Math.min(1, S.crystalHp + 0.05);
    S.wave++;
    if (S.wave > S.bestWave) S.bestWave = S.wave;
    checkUnlocks(S.wave);
    checkAchievements();
    startWave(S.wave);
    showWaveBanner(S.wave);
    GA(isBossWave(S.wave) ? 'boss' : 'wave');
  }

  // fx + floaters
  for (let i = fx.length - 1; i >= 0; i--){ fx[i].t += dt; if (fx[i].t >= fx[i].dur) fx.splice(i, 1); }
  for (let i = floaters.length - 1; i >= 0; i--){
    floaters[i].life -= dt * 1.2;
    floaters[i].y -= dt * 18;
    if (floaters[i].life <= 0) floaters.splice(i, 1);
  }
  for (const k in heroFlash){ if (heroFlash[k] > 0) heroFlash[k] -= dt; }
}

function basicAttack(def, slot, lvl){
  const hx = slot.x, hy = slot.y - 22;
  if (def.target === 'support'){
    S.crystalHp = Math.min(1, S.crystalHp + 0.01 * lvl);
    return;
  }
  const dmg = heroDmg(def, lvl) * combatMul();
  if (dmg <= 0) return;

  if (def.target === 'all'){
    // Mira splash: hit every enemy + purple pulse (one crit roll for the volley)
    const r = critRoll(dmg);
    if (r.crit) addFloater(hx, hy - 18, 'CRIT!', '#ffa03c');
    addFx({ kind:'nova', x: hx, y: hy, r0:4, r:60, dur:0.3, color:def.color });
    for (let i = enemies.length - 1; i >= 0; i--) if (damageEnemy(enemies[i], r.dmg)) enemies.splice(i, 1);
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
    if (r.crit) addFloater(t.x, t.y - 40, 'CRIT!', '#ffa03c');
    if (damageEnemy(t, r.dmg)) removeEnemy(t);
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
  if (w === 500) toast('🏆 Wave 500! The Crystal is fully resealed. Endless mode continues!');
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
  view.crystalX = cw * 0.10;
  view.laneRight = cw - 20;
}
window.addEventListener('resize', resize);

function drawFallbackChar(x, y, size, color){
  ctx.fillStyle = color;
  ctx.fillRect(x - size*3, y - size*12, size*6, size*12);
  ctx.fillStyle = '#ffe0b0';
  ctx.fillRect(x - size*2.5, y - size*16, size*5, size*4);
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

  if (Spr().drawBackground) Spr().drawBackground(ctx, view.w, view.h, now);
  else { ctx.fillStyle = '#0a0e24'; ctx.fillRect(0,0,view.w,view.h); }

  const pulse = 0.5 + 0.5*Math.sin(now/500);
  if (Spr().drawCrystal) Spr().drawCrystal(ctx, view.crystalX, view.ground - size*10, size*3, pulse, S.crystalHp);
  else { ctx.fillStyle = `rgba(123,211,255,${0.5+0.4*pulse})`; ctx.fillRect(view.crystalX-14, view.ground-70, 28, 44); }

  // enemies
  for (const e of enemies){
    const t = ENEMY_TYPES[e.type] || ENEMY_TYPES.normal;
    const es = size * (e.boss ? 3 : t.size);
    const floatOff = t.float ? (10 + Math.sin(now/300)*4) : 0;
    const by = e.y - floatOff;
    if (e.boss && Spr().drawBoss) Spr().drawBoss(ctx, e.x, by, es, e.frame);
    else if (Spr().drawEnemy) Spr().drawEnemy(ctx, e.x, by, es, e.type, e.frame, e.hp/e.maxHp);
    else drawFallbackChar(e.x, by, es, '#b3407a');
    // frozen overlay
    if (e.slow > 0){
      ctx.save(); ctx.globalAlpha = 0.35; ctx.fillStyle = '#9fe4ff';
      ctx.fillRect(e.x - es*7, by - es*17, es*14, es*17); ctx.restore();
    }
    // golden shimmer overlay
    if (e.golden){
      ctx.save();
      ctx.globalAlpha = 0.28 + 0.12*Math.sin(now/120 + e.x);
      ctx.fillStyle = '#ffe14d';
      ctx.fillRect(e.x - es*7, by - es*17, es*14, es*17);
      ctx.globalAlpha = 0.9; ctx.fillStyle = '#fff6c0';
      for (let k = 0; k < 3; k++){
        const a = now/200 + k*2.1;
        ctx.fillRect(e.x + Math.cos(a)*es*8 - 1, by - es*9 + Math.sin(a)*es*8 - 1, 3, 3);
      }
      ctx.restore();
    }
    // hp bar
    const bw = 22*px * (e.boss ? 2.2 : t.size);
    ctx.fillStyle = '#000a'; ctx.fillRect(e.x-bw/2, by - es*15 - 8, bw, 4);
    ctx.fillStyle = e.boss ? '#ff5db1' : '#ff6b6b';
    ctx.fillRect(e.x-bw/2, by - es*15 - 8, bw*(e.hp/e.maxHp), 4);
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
    const frame = (heroFlash[slot.def.id] > 0) ? 1 : (Math.floor(now/350)%2);
    const fn = Spr()[slot.def.draw];
    if (fn) fn(ctx, slot.x, slot.y, size, frame);
    else drawFallbackChar(slot.x, slot.y, size, slot.def.color);
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

  // attack effects on top
  for (const o of fx) drawFx(o, now);

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
  el('s-wave').textContent = S.wave;
  el('s-gold').textContent = fmt(S.gold);
  el('s-shard').textContent = fmt(S.shards);
  if (el('s-tp')) el('s-tp').textContent = fmt(S.talentPoints);
  el('s-crystal').textContent = Math.round(S.crystalHp*100) + '%';
  el('btnPrestige').disabled = prestigeShards(S.totalGoldEarned) <= S.shardsEarned;
  for (const def of HERO_DEFS){
    const btn = el('buy-'+def.id);
    if (btn){
      const lvl = S.heroLevels[def.id];
      btn.disabled = S.gold < heroCost(def, lvl);
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
      card.innerHTML = `<div class="lock-tag">🔒 ${def.name}<br>Unlocks at Wave ${def.unlockWave}</div>`;
      panel.appendChild(card);
      continue;
    }
    const cost = heroCost(def, lvl);
    const dmgTxt = def.target==='support' ? `+${(3*lvl).toFixed(0)}% aura / heal`
                 : `${fmt(heroDmg(def,lvl)*globalDmgMul())} dmg`;
    card.innerHTML = `
      <h3><span style="color:${def.color}">◆</span> ${def.name}</h3>
      <div class="role">${def.role}</div>
      <div class="stat-row"><span>Level</span><b id="lv-${def.id}">${lvl}</b></div>
      <div class="stat-row"><span>${def.target==='support'?'Support':'Power'}</span><b id="dmg-${def.id}">${dmgTxt}</b></div>
      <div class="skill-row" title="Auto-cast area skill">${def.skill.icon} ${def.skill.name}</div>
      <div class="cd-bar"><div class="cd-fill" id="cd-${def.id}" style="background:${def.color}"></div></div>
      <button class="buy" id="buy-${def.id}">
        ${lvl===0 ? 'Recruit' : 'Upgrade'} <small>🪙 ${fmt(cost)}</small>
      </button>`;
    panel.appendChild(card);
    card.querySelector('.buy').addEventListener('click', () => buyHero(def));
  }
}

function buyHero(def){
  const lvl = S.heroLevels[def.id];
  if (lvl === 0 && S.wave < def.unlockWave){ buildHeroPanel(); return; }
  const cost = heroCost(def, lvl);
  if (S.gold < cost) return;
  S.gold -= cost;
  S.heroLevels[def.id]++;
  GA('upgrade');
  const dmgEl = el('dmg-'+def.id);
  if (dmgEl){
    dmgEl.textContent = def.target==='support'
      ? `+${(3*S.heroLevels[def.id]).toFixed(0)}% aura / heal`
      : `${fmt(heroDmg(def,S.heroLevels[def.id])*globalDmgMul())} dmg`;
  }
  const btn = el('buy-'+def.id);
  btn.innerHTML = `Upgrade <small>🪙 ${fmt(heroCost(def, S.heroLevels[def.id]))}</small>`;
  checkAchievements();
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
  b.textContent = isBossWave(w) ? `⚔️ BOSS — Wave ${w}` : `Wave ${w}`;
  b.style.opacity = '1';
  clearTimeout(bannerTimer); bannerTimer = setTimeout(()=>b.style.opacity='0.35', 1400);
}

// ------------------------------------------------------------------ modals
function openModal(html){ el('modalBox').innerHTML = html; el('modal').classList.add('show'); }
function closeModal(){ el('modal').classList.remove('show'); }
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
    };
    S = freshState();
    Object.assign(S, keep);
    enemies.length = 0; fx.length = 0; partyBuffT = 0;
    for (const k in skillTimers) skillTimers[k] = 0;
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
function applyOffline(){
  const away = (Date.now() - S.lastSeen) / 1000;
  if (away < 60 || S.recentGoldRate.length === 0) return;
  const rate = S.recentGoldRate.reduce((a,b)=>a+b,0) / S.recentGoldRate.length;
  const effective = Math.min(away, OFFLINE_CAP_S);
  const earned = Math.floor(rate * effective * 0.5);
  if (earned <= 0) return;
  S.gold += earned; S.totalGoldEarned += earned;
  const mins = Math.floor(effective/60);
  openModal(`
    <h2>🌙 Welcome back, guardian</h2>
    <p>Your heroes held the line for <b>${mins < 60 ? mins+' min' : (mins/60).toFixed(1)+' h'}</b>
       while you were away (offline earns 50%, capped at 8h).</p>
    <p style="font-size:22px;text-align:center;margin:16px 0">
       🪙 <b style="color:var(--gold)">+${fmt(earned)}</b></p>
    <button class="btn" id="collectOff" style="width:100%">Collect</button>`);
  el('collectOff').onclick = closeModal;
}

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
    if (ready && (enemies.length > 0 || def.skill.kind === 'blessing')){
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
      <div class="shard-item"><div class="info"><b>Current Wave</b><div class="lv">${S.wave}</div></div></div>
      <div class="shard-item"><div class="info"><b>Best Wave</b><div class="lv">${S.bestWave}</div></div></div>
      <div class="shard-item"><div class="info"><b>Enemies Defeated</b><div class="lv">${fmt(S.totalKills)}</div></div></div>
      <div class="shard-item"><div class="info"><b>Lifetime Gold</b><div class="lv">🪙 ${fmt(S.totalGoldEarned)}</div></div></div>
      <div class="shard-item"><div class="info"><b>Shards Earned</b><div class="lv">💠 ${S.shardsEarned}</div></div></div>
      <div class="shard-item"><div class="info"><b>Critical Chance</b><div class="lv">${Math.round(critChance()*100)}%</div></div></div>
    </div>
    <button class="btn" id="closeStats" style="width:100%">Close</button>`);
  el('closeStats').onclick = closeModal;
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

// audio buttons + unlock-on-first-gesture
const btnMute = el('btnMute'), btnMusic = el('btnMusic');
if (btnMute) btnMute.onclick = () => { const m = window.GameAudio && GameAudio.toggleMute(); btnMute.textContent = m ? '🔇' : '🔊'; };
if (btnMusic) btnMusic.onclick = () => { const on = window.GameAudio && GameAudio.toggleMusic(); btnMusic.textContent = on ? '♪' : '♪̶'; btnMusic.style.opacity = on ? '1' : '0.5'; };
function audioUnlock(){ if (window.GameAudio) GameAudio.unlock(); window.removeEventListener('pointerdown', audioUnlock); window.removeEventListener('keydown', audioUnlock); window.removeEventListener('touchstart', audioUnlock); }
window.addEventListener('pointerdown', audioUnlock);
window.addEventListener('touchstart', audioUnlock);
window.addEventListener('keydown', audioUnlock);

// ------------------------------------------------------------------ boot
function boot(){
  S = load() || freshState();
  resize();
  applyOffline();
  checkAchievements();
  startWave(S.wave);
  buildHeroPanel();
  showWaveBanner(S.wave);
  updateHud();
  document.querySelector('[data-spd="1"]').classList.add('sel');
  window.addEventListener('beforeunload', save);
  setInterval(save, 15000);
  requestAnimationFrame(frame);
}
boot();
