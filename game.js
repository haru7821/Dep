/* ============================================================================
   Echoes of the Aether Crystal — Idle Defense
   Game engine (Agent E). Design formulas from Agent B, sprites from Agent C.
   ========================================================================== */
'use strict';

// ------------------------------------------------------------------ constants
const SAVE_KEY = 'aether_crystal_save_v1';
const OFFLINE_CAP_S = 8 * 3600;        // offline earnings capped at 8h
const SPAWN_INTERVAL = 0.8;            // seconds between enemy spawns
const BOSS_EVERY = 5;                  // boss on every 5th wave

// Hero definitions (bases per Agent B's spec)
const HERO_DEFS = [
  { id:'garran', name:'Sir Garran', role:'Bulwark Knight · Tank',
    baseDmg:8,  baseCost:15, atkInterval:1.0, target:'single', unlockWave:1,
    draw:'drawKnight', color:'#5b8dff' },
  { id:'mira',   name:'Mira',       role:'Emberwind Mage · AoE',
    baseDmg:4,  baseCost:20, atkInterval:1.4, target:'all',    unlockWave:10,
    draw:'drawMage', color:'#c76bff' },
  { id:'faye',   name:'Faye',       role:'Gale Archer · Fast',
    baseDmg:2,  baseCost:12, atkInterval:0.333, target:'single', unlockWave:25,
    draw:'drawArcher', color:'#5be18a' },
  { id:'aunel',  name:'Aunel',      role:'Dawn Healer · Support',
    baseDmg:0,  baseCost:25, atkInterval:1.0, target:'support', unlockWave:100,
    draw:'drawHealer', color:'#ffe08a' },
];

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
];

// ------------------------------------------------------------------ formulas
const enemyHP    = w => 10 * Math.pow(1.12, w - 1);
const enemyCount = w => Math.min(5 + Math.floor(w / 3), 20);
const goldPerKill= w => Math.ceil(2 * Math.pow(1.10, w - 1));
const isBossWave = w => w % BOSS_EVERY === 0;
const heroDmg    = (def, lvl) => def.baseDmg * (1 + 0.25 * lvl);
const heroCost   = (def, lvl) => Math.ceil(def.baseCost * Math.pow(1.15, lvl));
const prestigeShards = totalGold => Math.floor(Math.sqrt(totalGold / 1e6));

function fmt(n){
  if (!isFinite(n)) return '∞';
  n = Math.floor(n);
  if (n < 1000) return '' + n;
  const units = ['','K','M','B','T','Qa','Qi','Sx','Sp'];
  let u = 0;
  while (n >= 1000 && u < units.length - 1){ n /= 1000; u++; }
  return n.toFixed(n < 10 ? 2 : n < 100 ? 1 : 0) + units[u];
}

// ------------------------------------------------------------------ state
let S = null;
function freshState(){
  return {
    wave: 1,
    gold: 0,
    shards: 0,              // spendable shard balance
    shardsEarned: 0,        // lifetime shards ever awarded (monotonic)
    totalGoldEarned: 0,     // lifetime gold, drives prestige payout
    heroLevels: { garran:1, mira:0, faye:0, aunel:0 },
    shardUpg: { power:0, gold:0, speed:0, ward:0 },
    crystalHp: 1,           // fraction 0..1
    speed: 1,
    lastSeen: Date.now(),
    recentGoldRate: [],     // gold/sec samples of recent waves (for offline calc)
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
  if (aunelLv > 0) m *= 1 + 0.03 * aunelLv;          // Aunel damage aura
  return m;
}
function crystalMaxHp(){ return 100 * shardMul('ward'); }
function gameSpeed(){ return S.speed * shardMul('speed'); }

// ------------------------------------------------------------------ combat sim
const enemies = [];          // {x, y, hp, maxHp, type, speed, frame, boss}
let spawnTimer = 0, spawnedThisWave = 0, waveKills = 0, waveGoldAccum = 0, waveTime = 0;
const heroTimers = {};       // cooldown per hero
const floaters = [];         // damage/gold popups {x,y,txt,color,life}

// Layout (in canvas coords, set on resize)
const view = { w: 900, h: 460, ground: 380, crystalX: 90, laneRight: 880 };

function heroSlots(){
  // unlocked heroes get x positions near the crystal
  const unlocked = HERO_DEFS.filter(d => S.heroLevels[d.id] > 0 || d.unlockWave <= 1);
  const startX = view.crystalX + 70;
  return HERO_DEFS.map((d, i) => ({
    def: d,
    x: startX + i * 62,
    y: view.ground,
    active: S.heroLevels[d.id] > 0,
  }));
}

function spawnEnemy(w){
  const boss = isBossWave(w);
  let hp = enemyHP(w), type = 'normal', speed = 26;
  if (boss){ hp *= 8; type = 'boss'; speed = 18; }
  else {
    const r = Math.random();
    if (r < 0.22){ type = 'fast'; hp *= 0.6; speed = 46; }
    else if (r < 0.40){ type = 'tank'; hp *= 2.2; speed = 18; }
  }
  enemies.push({
    x: view.laneRight + Math.random()*40, y: view.ground,
    hp, maxHp: hp, type, speed, frame:0, boss,
    atkTimer: 0,
  });
}

function startWave(w){
  spawnTimer = 0; spawnedThisWave = 0; waveKills = 0;
  waveGoldAccum = 0; waveTime = 0;
}

function addFloater(x, y, txt, color){
  floaters.push({ x, y, txt, color, life: 1 });
}

function grantGold(amount){
  S.gold += amount;
  S.totalGoldEarned += amount;
  waveGoldAccum += amount;
}

// Deal damage to a specific enemy; returns true if it died
function damageEnemy(e, dmg){
  e.hp -= dmg;
  if (e.hp <= 0){
    const g = goldPerKill(S.wave) * (e.boss ? 10 : e.type==='tank'?2 : 1) * shardMul('gold');
    grantGold(g);
    waveKills++;
    addFloater(e.x, e.y - 30*(view.h/460), '+' + fmt(g), '#ffd75e');
    return true;
  }
  return false;
}

// ------------------------------------------------------------------ main tick
function simulate(dt){
  const w = S.wave;
  const slots = heroSlots();
  const count = enemyCount(w);
  const totalToSpawn = isBossWave(w) ? 1 : count;
  waveTime += dt;

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
    const reach = view.crystalX + 34*px;
    if (e.x > reach){
      e.x -= e.speed * px * dt;
    } else {
      // attacking the crystal
      e.atkTimer += dt;
      if (e.atkTimer >= 1){
        e.atkTimer -= 1;
        const dmgFrac = (e.boss ? 0.20 : 0.05) / shardMul('ward');
        S.crystalHp = Math.max(0, S.crystalHp - dmgFrac);
        addFloater(view.crystalX, view.ground - 60*px, '-' + Math.round(dmgFrac*100) + '%', '#ff6b6b');
      }
    }
  }

  // heroes attack
  for (const slot of slots){
    if (!slot.active) continue;
    const def = slot.def, lvl = S.heroLevels[def.id];
    const interval = def.atkInterval;
    heroTimers[def.id] = (heroTimers[def.id] || 0) + dt;
    // drain the cooldown in a loop so fast heroes don't lose ticks on big dt
    while (heroTimers[def.id] >= interval){
      heroTimers[def.id] -= interval;

      if (def.target === 'support'){
        // Aunel: heal crystal (aura handled in globalDmgMul)
        S.crystalHp = Math.min(1, S.crystalHp + 0.01 * lvl);
        continue;
      }
      const dmg = heroDmg(def, lvl) * globalDmgMul();
      if (dmg <= 0) continue;

      if (def.target === 'all'){
        // Mira splash: hit every enemy
        for (let i = enemies.length - 1; i >= 0; i--){
          if (damageEnemy(enemies[i], dmg)) enemies.splice(i, 1);
        }
        if (enemies.length) slot.flash = 0.15;
      } else {
        // single target: closest enemy to crystal
        let target = null, best = Infinity;
        for (const e of enemies){ if (e.x < best){ best = e.x; target = e; } }
        if (target){
          const idx = enemies.indexOf(target);
          if (damageEnemy(target, dmg)) enemies.splice(idx, 1);
          slot.flash = 0.15;
        }
      }
    }
  }

  // crystal broken -> fall back a few waves, restore
  if (S.crystalHp <= 0){
    S.wave = Math.max(1, S.wave - 3);
    S.crystalHp = 1;
    enemies.length = 0;
    startWave(S.wave);
    toast('💥 The Crystal shattered! Fell back to Wave ' + S.wave);
    return;
  }

  // wave clear
  if (spawnedThisWave >= totalToSpawn && enemies.length === 0){
    // record gold/sec sample for offline calc
    if (waveTime > 0){
      S.recentGoldRate.push(waveGoldAccum / waveTime);
      if (S.recentGoldRate.length > 10) S.recentGoldRate.shift();
    }
    // small heal between waves
    S.crystalHp = Math.min(1, S.crystalHp + 0.05);
    S.wave++;
    checkUnlocks(S.wave);
    startWave(S.wave);
    showWaveBanner(S.wave);
  }

  // floaters
  for (let i = floaters.length - 1; i >= 0; i--){
    floaters[i].life -= dt * 1.2;
    floaters[i].y -= dt * 18;
    if (floaters[i].life <= 0) floaters.splice(i, 1);
  }
  for (const slot of slots){ if (slot.flash) slot.flash -= dt; }
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

const Spr = () => (window.Sprites || {});
function draw(now){
  const px = view.w / 900;
  const size = Math.max(2, Math.round(3 * (view.h/460)));

  // background
  if (Spr().drawBackground) Spr().drawBackground(ctx, view.w, view.h, now);
  else { ctx.fillStyle = '#0a0e24'; ctx.fillRect(0,0,view.w,view.h); }

  // crystal
  const pulse = 0.5 + 0.5*Math.sin(now/500);
  if (Spr().drawCrystal) Spr().drawCrystal(ctx, view.crystalX, view.ground - size*10, size*3, pulse, S.crystalHp);
  else { ctx.fillStyle = `rgba(123,211,255,${0.5+0.4*pulse})`; ctx.fillRect(view.crystalX-14, view.ground-70, 28, 44); }

  // enemies
  for (const e of enemies){
    const es = size * (e.boss ? 3 : e.type==='tank'?1.5:1) ;
    if (e.boss && Spr().drawBoss) Spr().drawBoss(ctx, e.x, e.y, es, e.frame);
    else if (Spr().drawEnemy) Spr().drawEnemy(ctx, e.x, e.y, es, e.type, e.frame);
    else drawFallbackChar(e.x, e.y, es, '#b3407a');
    // hp bar
    const bw = 22*px * (e.boss?2.2:1);
    ctx.fillStyle = '#000a'; ctx.fillRect(e.x-bw/2, e.y - es*15 - 8, bw, 4);
    ctx.fillStyle = e.boss ? '#ff5db1' : '#ff6b6b';
    ctx.fillRect(e.x-bw/2, e.y - es*15 - 8, bw*(e.hp/e.maxHp), 4);
  }

  // heroes
  const slots = heroSlots();
  for (const slot of slots){
    if (!slot.active) continue;
    const frame = slot.flash > 0 ? 1 : (Math.floor(now/350)%2);
    const fn = Spr()[slot.def.draw];
    if (fn) fn(ctx, slot.x, slot.y, size, frame);
    else drawFallbackChar(slot.x, slot.y, size, slot.def.color);
  }

  // floaters
  for (const f of floaters){
    ctx.globalAlpha = Math.max(0, Math.min(1, f.life));
    ctx.fillStyle = f.color;
    ctx.font = `bold ${Math.round(12*(view.h/460))}px system-ui`;
    ctx.textAlign = 'center';
    ctx.fillText(f.txt, f.x, f.y);
    ctx.globalAlpha = 1;
  }
}

// ------------------------------------------------------------------ loop
let lastT = performance.now();
let acc = 0;
function frame(now){
  let dt = (now - lastT) / 1000;
  lastT = now;
  if (dt > 0.25) dt = 0.25;           // clamp after tab-away
  const steps = gameSpeed();
  simulate(dt * steps);
  draw(now);
  acc += dt;
  if (acc > 5){ acc = 0; save(); updateHud(); }
  updateHud();
  requestAnimationFrame(frame);
}

// ------------------------------------------------------------------ HUD / UI
const el = id => document.getElementById(id);
function updateHud(){
  el('s-wave').textContent = S.wave;
  el('s-gold').textContent = fmt(S.gold);
  el('s-shard').textContent = fmt(S.shards);
  el('s-crystal').textContent = Math.round(S.crystalHp*100) + '%';
  el('btnPrestige').disabled = prestigeShards(S.totalGoldEarned) <= S.shardsEarned;
  // refresh buy buttons cheaply
  for (const def of HERO_DEFS){
    const btn = el('buy-'+def.id);
    if (!btn) continue;
    const lvl = S.heroLevels[def.id];
    const cost = heroCost(def, lvl);
    btn.disabled = S.gold < cost;
    const lvEl = el('lv-'+def.id), dmgEl = el('dmg-'+def.id);
    if (lvEl) lvEl.textContent = lvl;
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
      <button class="buy" id="buy-${def.id}">
        ${lvl===0 ? 'Recruit' : 'Upgrade'} <small>🪙 ${fmt(cost)}</small>
      </button>`;
    panel.appendChild(card);
    card.querySelector('.buy').addEventListener('click', () => buyHero(def));
  }
}

function buyHero(def){
  const lvl = S.heroLevels[def.id];
  // don't allow recruiting a still-locked hero (e.g. after a crystal-break fallback)
  if (lvl === 0 && S.wave < def.unlockWave){ buildHeroPanel(); return; }
  const cost = heroCost(def, lvl);
  if (S.gold < cost) return;
  S.gold -= cost;
  S.heroLevels[def.id]++;
  // update just this card's dmg text
  const dmgEl = el('dmg-'+def.id);
  if (dmgEl){
    dmgEl.textContent = def.target==='support'
      ? `+${(3*S.heroLevels[def.id]).toFixed(0)}% aura / heal`
      : `${fmt(heroDmg(def,S.heroLevels[def.id])*globalDmgMul())} dmg`;
  }
  const btn = el('buy-'+def.id);
  const newCost = heroCost(def, S.heroLevels[def.id]);
  btn.innerHTML = `Upgrade <small>🪙 ${fmt(newCost)}</small>`;
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
    // preserve lifetime gold + shard economy; reset the run
    const keep = {
      shards: S.shards + gain,
      shardsEarned: S.shardsEarned + gain,
      shardUpg: S.shardUpg,
      totalGoldEarned: S.totalGoldEarned,
    };
    S = freshState();
    S.shards = keep.shards;
    S.shardsEarned = keep.shardsEarned;
    S.shardUpg = keep.shardUpg;
    S.totalGoldEarned = keep.totalGoldEarned;
    startWave(1);
    buildHeroPanel(); updateHud(); save();
    closeModal();
    toast('💠 The Crystal is resealed. +' + gain + ' shards.');
  };
  el('cancPrestige').onclick = closeModal;
}

function openShardShop(){
  let rows = SHARD_UPGRADES.map(u => {
    const lvl = S.shardUpg[u.id];
    const cost = Math.ceil(u.base * Math.pow(u.growth, lvl));
    const maxed = lvl >= u.max;
    return `<div class="shard-item">
      <div class="info">
        <b>${u.name}</b> — ${u.desc}
        <div class="lv">Lv ${lvl}/${u.max} · now ${u.fmt(lvl)}</div>
      </div>
      <button class="btn" data-up="${u.id}" ${maxed||S.shards<cost?'disabled':''}>
        ${maxed?'MAX':'💠 '+cost}
      </button>
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
      S.shards -= cost; S.shardUpg[u.id]++;
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
    document.querySelectorAll('[data-spd]').forEach(x=>x.style.outline='');
    b.style.outline = '2px solid var(--accent)';
  };
});

// ------------------------------------------------------------------ boot
function boot(){
  S = load() || freshState();
  resize();
  applyOffline();
  startWave(S.wave);
  buildHeroPanel();
  showWaveBanner(S.wave);
  updateHud();
  document.querySelector('[data-spd="1"]').style.outline = '2px solid var(--accent)';
  window.addEventListener('beforeunload', save);
  setInterval(save, 15000);
  requestAnimationFrame(frame);
}
boot();
