/* ============================================================================
   Echoes of the Aether Crystal — Idle Defense
   Game engine (Agent E). Design formulas from Agent B, sprites from Agent C,
   audio from audio.js. Skills + visible attack FX added in the feature update.
   ========================================================================== */
'use strict';

// ------------------------------------------------------------------ i18n
const LANG_DEFS = [ { id:'en', name:'English' }, { id:'ko', name:'한국어' }, { id:'ja', name:'日本語' } ];
const LANG = {
  en: {
    'btn.prestige':'💠 Reseal Crystal (Prestige)', 'btn.shop':'💠 Shard Shop', 'btn.talents':'🌳 Talents',
    'btn.race':'🧬 Race', 'btn.ach':'🏆 Achievements', 'btn.bestiary':'📖 Bestiary', 'btn.relics':'🗡️ Relics',
    'btn.fortify':'🏰 Fortify', 'btn.stats':'📊 Stats', 'btn.saves':'💾 Saves', 'btn.newstart':'🆕 New Start',
    'btn.keystone':'⭐ Keystone', 'btn.keystoneLocked':'🔒 Keystone',
    'btn.autoOn':'🅰️ Auto: On', 'btn.autoOff':'🅰️ Auto', 'btn.buy':'🛒 Buy', 'buy.max':'Max',
    'lbl.speed':'Speed', 'hero.recruit':'Recruit', 'hero.upgrade':'Upgrade',
    'set.title':'⚙️ Settings', 'set.close':'Close', 'set.lang':'Language', 'btn.menu':'⚙️ Settings', 'menu.title':'Settings & More', 'menu.music':'♪ Music', 'menu.sound':'🔊 Sound', 'menu.display':'🎨 Display & Language', 'shop.tp':'Talent Point', 'shop.tp.d':'Convert Aether Shards into a Talent Point.', 'shop.have':'You have', 'shop.convert':'Convert shards',
    'set.dmgNums':'Damage numbers', 'set.dmgNums.d':'Show floating damage numbers over enemies.',
    'set.fx':'Particle effects', 'set.fx.d':'Elemental bursts, embers and sparkles. Turn off to boost performance.',
    'set.shake':'Screen shake', 'set.shake.d':'Camera shake on big hits, explosions and boss deaths.',
    'on':'ON', 'off':'OFF', 'race.permanent':'This choice is <b>permanent</b>.', 'race.req':'required',
    'relic.autofuse':'Common & Rare relics fuse automatically.',
    'relic.fuse.title':'🧪 Fusion — pick 3 Epic+ relics to gamble upward',
    'relic.fuse.hint':'Common & Rare auto-fuse. Tap 🧪 on <b>3</b> Epic (or Legendary) relics of the same rarity to gamble them upward.',
    'relic.fuse.success':'success (fail keeps one)', 'relic.fuse.picked':'Picked',
    'confirm':'Confirm', 'cancel':'Cancel', 'back':'Back',
    'lbl.stage':'Stage', 'lbl.wave':'Wave', 'lbl.now':'now', 'lbl.level':'Level', 'lbl.power':'Power', 'lbl.support':'Support',
    'hero.unlock':'Unlocks at Stage {n}',
    'shop.desc':'Permanent upgrades bought with Aether Shards. These persist through every reseal. You have <b style="color:var(--shard)">{n}</b>💠.',
    'off.title':'🌙 Welcome back, guardian',
    'off.desc':'Your heroes held the line for <b>{t}</b> while you were away (progress is capped at 8h and stops where your damage can no longer keep up).',
    'off.waves':'waves cleared', 'off.gold':'gold earned', 'off.collect':'Collect',
    'intro.title':'⟡ Defend the Aether Crystal',
    'intro.p1':'Endless waves of monsters march from the right toward your Crystal on the left. Your heroes attack on their own — you grow the defense.',
    'intro.p2':'• <b>Buy &amp; upgrade heroes</b> with 🪙 gold (cards below). More heroes unlock as you reach new waves.<br>• Each hero has an <b>auto-casting skill</b> — <b>tap a hero</b> to fire it early.<br>• <b>New systems unlock as you clear stages</b> — Fortify &amp; Bestiary at Stage 3, Overdrive &amp; Relics at Stage 5, Auto at Stage 6, Reseal &amp; Talents at Stage 8, and more beyond.<br>• Hit a wall? Once <b>💠 Reseal (Prestige)</b> opens, it trades your run for permanent power — that\'s how you break through.',
    'intro.btn':'Begin the defense ⚔️',
    'sv.title':'💾 Save Slots', 'sv.desc':'Store up to {n} games and load any of them anytime. Your game also autosaves on its own.',
    'sv.slot':'Slot', 'sv.empty':'— Empty —', 'sv.save':'💾 Save', 'sv.load':'📂 Load',
    'sv.loadQ':'Load <b>Slot {n}</b>? Your current game will be replaced — save it to a slot first if you want to keep it.',
    'sv.overQ':'Overwrite <b>Slot {n}</b> with your current game? The old save there is lost.',
    'sv.delQ':'Delete <b>Slot {n}</b>? This can\'t be undone.',
    'sv.saved':'💾 Saved to Slot {n}', 'sv.fail':'⚠️ Save failed', 'sv.deleted':'🗑 Slot {n} deleted',
    'ago.now':'just now', 'ago.m':'{n}m ago', 'ago.h':'{n}h ago', 'ago.d':'{n}d ago',
    'ns.title':'🆕 New Start?',
    'ns.desc':'This permanently deletes <b>all</b> progress — waves, gold, shards, heroes, talents, relics and upgrades — and begins a brand-new game from Wave 1. This cannot be undone.',
    'ns.do':'Delete &amp; Start Over',
    'st.title':'📊 Guardian\'s Record', 'st.cur':'Current Stage', 'st.best':'Best Stage', 'st.mile':'Next Milestone',
    'st.mile.d':'🏅 Clear Stage {n} — reward {r}',
    'st.kills':'Enemies Defeated', 'st.gold':'Lifetime Gold', 'st.shards':'Shards Earned', 'st.crit':'Critical Chance',
    'st.combo':'Best Combo', 'st.streak':'× streak', 'st.chart':'Gold income per wave',
    'st.empty':'Clear a few waves to chart your gold income…',
    'tal.title':'🌳 Talent Tree',
    'tal.desc':'Spend Talent Points on permanent bonuses. Earn <b>+2 TP</b> per reseal and more from achievements. You have <b style="color:var(--hp)">{n} TP</b>.',
    'race.asc':'🧬 Ascendancy', 'race.lockmsg':'Choose a Race at <b>Stage {n}</b>.', 'race.locksub':'Best so far: <b>Stage {n}</b> — keep climbing.',
    'race.choose':'🧬 Choose your Race',
    'race.choose.d':'A <b>permanent</b> mid-game identity — each race unlocks its own tech tree (spent with 🌳 Talent Points). Choose wisely; it persists through Reseal.',
    'race.tree':'Tree:', 'race.later':'Decide later', 'race.become':'Become {n}?',
    'race.spend':'Spend 🌳 on your race tree — you have <b style="color:var(--hp)">{n} TP</b>.',
    'race.tap':'Tap a node to view & upgrade it.', 'race.lockedbtn':'Locked',
    'race.change':'🔄 Change Race — {c}💠 (refunds 🌳)', 'race.changeQ':'🔄 Change Race?',
    'race.change.d':'Costs <b>{c}💠</b> and refunds every 🌳 spent in your race tree, then lets you choose a new race.',
    'ks.lockmsg':'Keystones unlock at <b>Stage {n}</b>.', 'ks.locksub':'Best so far: <b>Stage {s} · Wave {w}/{z}</b> — keep climbing.',
    'ks.unlockat':'Unlocks at <b>Stage {n}</b>', 'ks.active':'ACTIVE',
    'ks.multi':'All keystones unlocked — <b>activate as many as you like</b> at once (tap to toggle). Currently <b>{n}</b> active.',
    'ks.single':'Choose <b>one</b> build-defining keystone (only one active — tap it again to clear). A new keystone unlocks every stage from {s}; <b>{a}/{t}</b> available so far — unlock them all to stack multiple.',
    'ks.persist':'They persist through Reseal.',
    'ach.title':'🏆 Achievements', 'ach.desc':'One-time milestones that reward Talent Points and Aether Shards.',
    'ach.reward':'Reward:', 'ach.done':'DONE',
    'bst.title':'⚔ Bestiary: Monster Entries ⚔', 'bst.disc':'Discovered', 'bst.sub':'defeat a monster to unlock its entry',
    'bst.el':'ELEMENT', 'bst.weak':'WEAK', 'bst.resist':'RESIST',
    'el.earth':'EARTH', 'el.poison':'POISON', 'el.dark':'DARK', 'el.fire':'FIRE', 'el.void':'VOID', 'el.frost':'FROST', 'el.lightning':'LIGHTNING', 'el.physical':'PHYSICAL', 'el.holy':'HOLY',
    'rel.desc':'Bosses drop relics that grant permanent global bonuses. Equip up to <b>{n}</b>. Tap a relic to equip / unequip, or 🧪 to pick for fusion.',
    'rel.none':'No relics yet. Defeat bosses (every {n} waves) to find them.',
    'rel.eq':'EQUIPPED', 'rel.picked':'PICKED',
    'tw.title':'🏰 Fortify Tower',
    'tw.desc':'Reinforce the Crystal Tower to raise its maximum HP — each level adds <b>+15% effective HP</b>, so enemies chip away less with every hit. Fortify levels reset when you reseal the Crystal.',
    'tw.lv':'Tower Level', 'tw.hp':'Effective Max HP', 'tw.buy':'🏰 Fortify — 🪙 {c}',
    'pr.title':'💠 Reseal the Crystal',
    'pr.d1':'Reset your waves, gold, and hero levels to permanently reinforce the seal.',
    'pr.d2':'You will gain <b style="color:var(--shard)">+{g} Aether Shards</b> (you\'d hold {h}). Every shard earned grants <b>+2% permanent global damage</b> and can be spent in the Shard Shop.',
    'pr.go':'Reseal Now', 'pr.notyet':'Not enough progress to gain shards yet.',
    'ad.dev.title':'Test ad — real ads appear on the game portal',
    'ad.fail':'📺 Ad not available right now',
    'ad.off2':'📺 Watch an ad — collect ×2',
    'ad.off2.done':'💰 Offline reward doubled: +{g}',
    'ad.boost.btn':'📺 ×2', 'ad.boost.left':'💰 {m}m',
    'ad.boost.go':'💰 Double gold for 30 minutes!',
    'ad.boost.active':'💰 Gold ×2 active — {m}m left',
    'ad.revive.title':'💥 The Crystal shattered!',
    'ad.revive.d':'Watch an ad to revive with <b>50% HP</b> and keep your wave — or fall back 3 waves.',
    'ad.revive.go':'📺 Revive (50% HP)', 'ad.revive.no':'Fall back (−3 waves)',
    'ad.revive.done':'✨ The Crystal endures! Revived at 50% HP.',
    'crys.broke':'💥 The Crystal shattered! Fell back to Wave {w}',
  },
  ko: {
    'btn.prestige':'💠 크리스탈 재봉인', 'btn.shop':'💠 샤드 상점', 'btn.talents':'🌳 특성',
    'btn.race':'🧬 종족', 'btn.ach':'🏆 업적', 'btn.bestiary':'📖 도감', 'btn.relics':'🗡️ 유물',
    'btn.fortify':'🏰 요새화', 'btn.stats':'📊 통계', 'btn.saves':'💾 저장', 'btn.newstart':'🆕 새 게임',
    'btn.keystone':'⭐ 키스톤', 'btn.keystoneLocked':'🔒 키스톤',
    'btn.autoOn':'🅰️ 자동: 켜짐', 'btn.autoOff':'🅰️ 자동', 'btn.buy':'🛒 구매', 'buy.max':'최대',
    'lbl.speed':'속도', 'hero.recruit':'모집', 'hero.upgrade':'강화',
    'set.title':'⚙️ 설정', 'set.close':'닫기', 'set.lang':'언어', 'btn.menu':'⚙️ 설정', 'menu.title':'설정 및 기타', 'menu.music':'♪ 음악', 'menu.sound':'🔊 효과음', 'menu.display':'🎨 화면 및 언어', 'shop.tp':'특성 포인트', 'shop.tp.d':'샤드를 특성 포인트로 전환합니다.', 'shop.have':'보유', 'shop.convert':'샤드 전환',
    'set.dmgNums':'데미지 숫자', 'set.dmgNums.d':'적 위에 떠오르는 데미지 숫자를 표시합니다.',
    'set.fx':'파티클 효과', 'set.fx.d':'속성 폭발·불티·반짝임. 성능 향상을 위해 끌 수 있습니다.',
    'set.shake':'화면 흔들림', 'set.shake.d':'큰 타격·폭발·보스 처치 시 화면이 흔들립니다.',
    'on':'켜짐', 'off':'꺼짐', 'race.permanent':'이 선택은 <b>영구적</b>입니다.', 'race.req':'필요',
    'relic.autofuse':'일반·희귀 유물은 자동으로 합성됩니다.',
    'relic.fuse.title':'🧪 합성 — 에픽 이상 유물 3개를 골라 상위 도전',
    'relic.fuse.hint':'일반·희귀는 자동 합성됩니다. 같은 등급의 에픽(또는 전설) 유물 <b>3개</b>에 🧪를 눌러 상위 등급에 도전하세요.',
    'relic.fuse.success':'성공 (실패 시 1개 유지)', 'relic.fuse.picked':'선택됨',
    'confirm':'확인', 'cancel':'취소', 'back':'뒤로',
    'lbl.stage':'스테이지', 'lbl.wave':'웨이브', 'lbl.now':'현재', 'lbl.level':'레벨', 'lbl.power':'공격력', 'lbl.support':'지원',
    'hero.unlock':'스테이지 {n} 해금',
    'shop.desc':'에테르 샤드로 사는 영구 강화 — 재봉인해도 유지됩니다. 보유: <b style="color:var(--shard)">{n}</b>💠',
    'off.title':'🌙 어서 오세요, 수호자님',
    'off.desc':'자리를 비운 동안 영웅들이 <b>{t}</b> 동안 전선을 지켰습니다 (진행은 8시간까지, 화력이 못 버티는 지점에서 멈춥니다).',
    'off.waves':'웨이브 클리어', 'off.gold':'골드 획득', 'off.collect':'수령',
    'intro.title':'⟡ 에테르 크리스탈을 지켜라',
    'intro.p1':'끝없는 몬스터 무리가 오른쪽에서 왼쪽 크리스탈로 몰려옵니다. 영웅은 스스로 싸우고 — 당신은 방어를 키웁니다.',
    'intro.p2':'• 🪙 골드로 <b>영웅 모집·강화</b> (아래 카드). 웨이브를 진행하면 더 많은 영웅이 해금됩니다.<br>• 영웅마다 <b>자동 시전 스킬</b>이 있습니다 — <b>영웅을 탭</b>하면 즉시 발동.<br>• <b>스테이지를 깰수록 새 시스템 해금</b> — 3: 요새화·도감, 5: 오버드라이브·유물, 6: 자동, 8: 재봉인·특성, 그 너머도.<br>• 벽에 막혔다면? <b>💠 재봉인(프레스티지)</b>이 열리면 이번 판을 영구 성장과 맞바꿉니다 — 그것이 돌파구입니다.',
    'intro.btn':'방어 시작 ⚔️',
    'sv.title':'💾 저장 슬롯', 'sv.desc':'최대 {n}개의 게임을 저장하고 언제든 불러올 수 있습니다. 게임은 자동 저장도 됩니다.',
    'sv.slot':'슬롯', 'sv.empty':'— 비어 있음 —', 'sv.save':'💾 저장', 'sv.load':'📂 불러오기',
    'sv.loadQ':'<b>슬롯 {n}</b>을 불러올까요? 현재 게임은 대체됩니다 — 남기려면 먼저 슬롯에 저장하세요.',
    'sv.overQ':'<b>슬롯 {n}</b>에 현재 게임을 덮어쓸까요? 기존 저장은 사라집니다.',
    'sv.delQ':'<b>슬롯 {n}</b>을 삭제할까요? 되돌릴 수 없습니다.',
    'sv.saved':'💾 슬롯 {n}에 저장됨', 'sv.fail':'⚠️ 저장 실패', 'sv.deleted':'🗑 슬롯 {n} 삭제됨',
    'ago.now':'방금 전', 'ago.m':'{n}분 전', 'ago.h':'{n}시간 전', 'ago.d':'{n}일 전',
    'ns.title':'🆕 새 게임?',
    'ns.desc':'웨이브·골드·샤드·영웅·특성·유물·강화까지 <b>모든</b> 진행이 영구 삭제되고 웨이브 1부터 새로 시작합니다. 되돌릴 수 없습니다.',
    'ns.do':'삭제하고 새로 시작',
    'st.title':'📊 수호자의 기록', 'st.cur':'현재 스테이지', 'st.best':'최고 스테이지', 'st.mile':'다음 이정표',
    'st.mile.d':'🏅 스테이지 {n} 클리어 — 보상 {r}',
    'st.kills':'처치한 적', 'st.gold':'누적 골드', 'st.shards':'획득 샤드', 'st.crit':'치명타 확률',
    'st.combo':'최고 콤보', 'st.streak':'× 연속', 'st.chart':'웨이브당 골드 수입',
    'st.empty':'웨이브를 몇 개 깨면 골드 수입 그래프가 그려집니다…',
    'tal.title':'🌳 특성 트리',
    'tal.desc':'특성 포인트로 영구 보너스를 구매하세요. 재봉인마다 <b>+2 TP</b>, 업적으로 추가 획득. 보유: <b style="color:var(--hp)">{n} TP</b>',
    'race.asc':'🧬 초월', 'race.lockmsg':'<b>스테이지 {n}</b>에서 종족을 선택합니다.', 'race.locksub':'최고 기록: <b>스테이지 {n}</b> — 계속 올라가세요.',
    'race.choose':'🧬 종족 선택',
    'race.choose.d':'<b>영구적인</b> 중반 정체성 — 종족마다 고유 기술 트리가 열립니다(🌳 특성 포인트 사용). 신중히 고르세요; 재봉인 후에도 유지됩니다.',
    'race.tree':'트리:', 'race.later':'나중에 결정', 'race.become':'{n}이(가) 될까요?',
    'race.spend':'종족 트리에 🌳를 투자하세요 — 보유 <b style="color:var(--hp)">{n} TP</b>',
    'race.tap':'노드를 탭하면 확인·강화할 수 있습니다.', 'race.lockedbtn':'잠김',
    'race.change':'🔄 종족 변경 — {c}💠 (🌳 환급)', 'race.changeQ':'🔄 종족을 변경할까요?',
    'race.change.d':'<b>{c}💠</b>를 소모하고 종족 트리에 쓴 🌳를 전부 환급한 뒤 새 종족을 고릅니다.',
    'ks.lockmsg':'키스톤은 <b>스테이지 {n}</b>에 해금됩니다.', 'ks.locksub':'최고 기록: <b>스테이지 {s} · 웨이브 {w}/{z}</b> — 계속 올라가세요.',
    'ks.unlockat':'<b>스테이지 {n}</b> 해금', 'ks.active':'활성',
    'ks.multi':'모든 키스톤 해금 — <b>원하는 만큼 동시 활성화</b>(탭으로 전환). 현재 <b>{n}</b>개 활성.',
    'ks.single':'빌드를 결정짓는 키스톤을 <b>하나</b> 선택하세요(하나만 활성 — 다시 탭하면 해제). 스테이지 {s}부터 매 스테이지 하나씩 해금; 현재 <b>{a}/{t}</b> — 전부 해금하면 중첩 가능.',
    'ks.persist':'재봉인 후에도 유지됩니다.',
    'ach.title':'🏆 업적', 'ach.desc':'특성 포인트와 에테르 샤드를 주는 일회성 이정표.',
    'ach.reward':'보상:', 'ach.done':'달성',
    'bst.title':'⚔ 도감: 몬스터 목록 ⚔', 'bst.disc':'발견', 'bst.sub':'몬스터를 처치하면 항목이 해금됩니다',
    'bst.el':'속성', 'bst.weak':'약점', 'bst.resist':'저항',
    'el.earth':'대지', 'el.poison':'독', 'el.dark':'암흑', 'el.fire':'화염', 'el.void':'공허', 'el.frost':'냉기', 'el.lightning':'번개', 'el.physical':'물리', 'el.holy':'신성',
    'rel.desc':'보스가 영구 전역 보너스를 주는 유물을 떨어뜨립니다. 최대 <b>{n}</b>개 장착. 유물을 탭해 장착/해제, 🧪로 합성 선택.',
    'rel.none':'아직 유물이 없습니다. 보스({n}웨이브마다)를 처치해 획득하세요.',
    'rel.eq':'장착중', 'rel.picked':'선택됨',
    'tw.title':'🏰 타워 요새화',
    'tw.desc':'크리스탈 타워를 보강해 최대 체력을 올립니다 — 레벨당 <b>유효 체력 +15%</b>. 요새화 레벨은 재봉인 시 초기화됩니다.',
    'tw.lv':'타워 레벨', 'tw.hp':'유효 최대 체력', 'tw.buy':'🏰 요새화 — 🪙 {c}',
    'pr.title':'💠 크리스탈 재봉인',
    'pr.d1':'웨이브·골드·영웅 레벨을 초기화하고 봉인을 영구히 강화합니다.',
    'pr.d2':'<b style="color:var(--shard)">+{g} 에테르 샤드</b>를 얻습니다(총 {h}개). 샤드 1개당 <b>영구 전역 피해 +2%</b>, 샤드 상점에서 사용할 수 있습니다.',
    'pr.go':'지금 재봉인', 'pr.notyet':'아직 샤드를 얻을 만큼 진행하지 못했습니다.',
    'ad.dev.title':'테스트 광고 — 실제 광고는 게임 포털에서 나옵니다',
    'ad.fail':'📺 지금은 광고를 불러올 수 없습니다',
    'ad.off2':'📺 광고 보고 2배 받기',
    'ad.off2.done':'💰 오프라인 보상 2배: +{g}',
    'ad.boost.btn':'📺 ×2', 'ad.boost.left':'💰 {m}분',
    'ad.boost.go':'💰 30분 동안 골드 2배!',
    'ad.boost.active':'💰 골드 2배 발동 중 — {m}분 남음',
    'ad.revive.title':'💥 크리스탈이 파괴되었습니다!',
    'ad.revive.d':'광고를 보면 <b>체력 50%</b>로 부활하고 웨이브를 유지합니다 — 아니면 3웨이브 후퇴합니다.',
    'ad.revive.go':'📺 광고 보고 부활 (체력 50%)', 'ad.revive.no':'포기 (웨이브 −3)',
    'ad.revive.done':'✨ 크리스탈이 버텨냈습니다! 체력 50%로 부활.',
    'crys.broke':'💥 크리스탈 파괴! 웨이브 {w}로 후퇴',
  },
  ja: {
    'btn.prestige':'💠 クリスタル再封印', 'btn.shop':'💠 シャードショップ', 'btn.talents':'🌳 才能',
    'btn.race':'🧬 種族', 'btn.ach':'🏆 実績', 'btn.bestiary':'📖 図鑑', 'btn.relics':'🗡️ 遺物',
    'btn.fortify':'🏰 要塞化', 'btn.stats':'📊 統計', 'btn.saves':'💾 セーブ', 'btn.newstart':'🆕 ニューゲーム',
    'btn.keystone':'⭐ キーストーン', 'btn.keystoneLocked':'🔒 キーストーン',
    'btn.autoOn':'🅰️ オート: ON', 'btn.autoOff':'🅰️ オート', 'btn.buy':'🛒 購入', 'buy.max':'最大',
    'lbl.speed':'速度', 'hero.recruit':'雇用', 'hero.upgrade':'強化',
    'set.title':'⚙️ 設定', 'set.close':'閉じる', 'set.lang':'言語', 'btn.menu':'⚙️ 設定', 'menu.title':'設定・その他', 'menu.music':'♪ 音楽', 'menu.sound':'🔊 効果音', 'menu.display':'🎨 表示・言語', 'shop.tp':'才能ポイント', 'shop.tp.d':'シャードを才能ポイントに変換します。', 'shop.have':'所持', 'shop.convert':'シャード変換',
    'set.dmgNums':'ダメージ数値', 'set.dmgNums.d':'敵の上にダメージ数値を表示します。',
    'set.fx':'パーティクル効果', 'set.fx.d':'属性の爆発・火花・きらめき。オフで性能向上。',
    'set.shake':'画面の揺れ', 'set.shake.d':'大ヒット・爆発・ボス撃破時に画面が揺れます。',
    'on':'ON', 'off':'OFF', 'race.permanent':'この選択は<b>永続的</b>です。', 'race.req':'が必要',
    'relic.autofuse':'コモン・レアの遺物は自動で合成されます。',
    'relic.fuse.title':'🧪 合成 — エピック以上の遺物を3つ選んで上位に挑戦',
    'relic.fuse.hint':'コモン・レアは自動合成されます。同じレアリティのエピック（または伝説）遺物<b>3つ</b>の🧪を押して上位に挑戦。',
    'relic.fuse.success':'成功（失敗時は1つ保持）', 'relic.fuse.picked':'選択中',
    'confirm':'確認', 'cancel':'キャンセル', 'back':'戻る',
    'lbl.stage':'ステージ', 'lbl.wave':'ウェーブ', 'lbl.now':'現在', 'lbl.level':'レベル', 'lbl.power':'攻撃力', 'lbl.support':'支援',
    'hero.unlock':'ステージ{n}で解禁',
    'shop.desc':'エーテルシャードで買う永続強化 — 再封印後も維持されます。所持: <b style="color:var(--shard)">{n}</b>💠',
    'off.title':'🌙 おかえりなさい、守護者様',
    'off.desc':'離れている間、ヒーローが<b>{t}</b>戦線を守りました（進行は8時間まで、火力が保てない地点で停止）。',
    'off.waves':'ウェーブクリア', 'off.gold':'ゴールド獲得', 'off.collect':'受け取る',
    'intro.title':'⟡ エーテルクリスタルを守れ',
    'intro.p1':'果てなきモンスターの波が右から左のクリスタルへ押し寄せます。ヒーローは自動で戦い — あなたは防衛を育てます。',
    'intro.p2':'• 🪙ゴールドで<b>ヒーローを雇用・強化</b>（下のカード）。ウェーブを進めると新ヒーロー解禁。<br>• 各ヒーローは<b>自動発動スキル</b>持ち — <b>タップ</b>で即発動。<br>• <b>ステージクリアで新システム解禁</b> — 3: 要塞化・図鑑、5: オーバードライブ・遺物、6: オート、8: 再封印・才能、さらに先も。<br>• 壁に当たったら? <b>💠再封印(プレステージ)</b>が開けば、今回の進行を永続の力に変えられます — それが突破口です。',
    'intro.btn':'防衛開始 ⚔️',
    'sv.title':'💾 セーブスロット', 'sv.desc':'最大{n}件保存していつでもロードできます。オートセーブも作動します。',
    'sv.slot':'スロット', 'sv.empty':'— 空き —', 'sv.save':'💾 保存', 'sv.load':'📂 ロード',
    'sv.loadQ':'<b>スロット{n}</b>をロードしますか? 現在のゲームは置き換わります — 残すなら先にスロットへ保存を。',
    'sv.overQ':'<b>スロット{n}</b>に現在のゲームを上書きしますか? 元のセーブは失われます。',
    'sv.delQ':'<b>スロット{n}</b>を削除しますか? 元に戻せません。',
    'sv.saved':'💾 スロット{n}に保存', 'sv.fail':'⚠️ 保存失敗', 'sv.deleted':'🗑 スロット{n}削除',
    'ago.now':'たった今', 'ago.m':'{n}分前', 'ago.h':'{n}時間前', 'ago.d':'{n}日前',
    'ns.title':'🆕 ニューゲーム?',
    'ns.desc':'ウェーブ・ゴールド・シャード・ヒーロー・才能・遺物・強化まで<b>すべて</b>の進行が完全に消え、ウェーブ1から新規開始します。元に戻せません。',
    'ns.do':'削除して最初から',
    'st.title':'📊 守護者の記録', 'st.cur':'現在ステージ', 'st.best':'最高ステージ', 'st.mile':'次のマイルストーン',
    'st.mile.d':'🏅 ステージ{n}クリア — 報酬 {r}',
    'st.kills':'撃破数', 'st.gold':'累計ゴールド', 'st.shards':'獲得シャード', 'st.crit':'クリティカル率',
    'st.combo':'最高コンボ', 'st.streak':'× 連続', 'st.chart':'ウェーブごとのゴールド収入',
    'st.empty':'ウェーブをいくつかクリアすると収入グラフが描かれます…',
    'tal.title':'🌳 才能ツリー',
    'tal.desc':'才能ポイントで永続ボーナスを購入。再封印ごとに<b>+2 TP</b>、実績でも獲得。所持: <b style="color:var(--hp)">{n} TP</b>',
    'race.asc':'🧬 超越', 'race.lockmsg':'<b>ステージ{n}</b>で種族を選択します。', 'race.locksub':'最高記録: <b>ステージ{n}</b> — さらに登ろう。',
    'race.choose':'🧬 種族を選ぶ',
    'race.choose.d':'<b>永続的な</b>中盤のアイデンティティ — 種族ごとに固有ツリーが解放（🌳才能ポイントを使用）。慎重に; 再封印後も維持。',
    'race.tree':'ツリー:', 'race.later':'後で決める', 'race.become':'{n}になりますか?',
    'race.spend':'種族ツリーに🌳を注ぎましょう — 所持 <b style="color:var(--hp)">{n} TP</b>',
    'race.tap':'ノードをタップで確認・強化。', 'race.lockedbtn':'ロック',
    'race.change':'🔄 種族変更 — {c}💠 (🌳返還)', 'race.changeQ':'🔄 種族を変更?',
    'race.change.d':'<b>{c}💠</b>を消費し、種族ツリーの🌳を全額返還して新しい種族を選べます。',
    'ks.lockmsg':'キーストーンは<b>ステージ{n}</b>で解禁。', 'ks.locksub':'最高記録: <b>ステージ{s}・ウェーブ{w}/{z}</b> — さらに登ろう。',
    'ks.unlockat':'<b>ステージ{n}</b>で解禁', 'ks.active':'有効',
    'ks.multi':'全キーストーン解禁 — <b>好きなだけ同時に有効化</b>(タップで切替)。現在<b>{n}</b>個有効。',
    'ks.single':'ビルドを決めるキーストーンを<b>1つ</b>選択(有効は1つ — 再タップで解除)。ステージ{s}から毎ステージ1つ解禁; 現在<b>{a}/{t}</b> — 全解禁で複数重ねがけ可能。',
    'ks.persist':'再封印後も維持されます。',
    'ach.title':'🏆 実績', 'ach.desc':'才能ポイントとシャードがもらえる一回限りの目標。',
    'ach.reward':'報酬:', 'ach.done':'達成',
    'bst.title':'⚔ 図鑑: モンスター一覧 ⚔', 'bst.disc':'発見', 'bst.sub':'モンスターを倒すと項目が解放されます',
    'bst.el':'属性', 'bst.weak':'弱点', 'bst.resist':'耐性',
    'el.earth':'大地', 'el.poison':'毒', 'el.dark':'闇', 'el.fire':'炎', 'el.void':'虚空', 'el.frost':'氷', 'el.lightning':'雷', 'el.physical':'物理', 'el.holy':'神聖',
    'rel.desc':'ボスが永続ボーナスを持つ遺物を落とします。最大<b>{n}</b>個装備。タップで装備/解除、🧪で合成選択。',
    'rel.none':'まだ遺物がありません。ボス({n}ウェーブごと)を倒して入手。',
    'rel.eq':'装備中', 'rel.picked':'選択中',
    'tw.title':'🏰 タワー要塞化',
    'tw.desc':'クリスタルタワーを補強し最大HPを上昇 — 1レベルごとに<b>有効HP+15%</b>。要塞化レベルは再封印でリセット。',
    'tw.lv':'タワーレベル', 'tw.hp':'有効最大HP', 'tw.buy':'🏰 要塞化 — 🪙 {c}',
    'pr.title':'💠 クリスタル再封印',
    'pr.d1':'ウェーブ・ゴールド・ヒーローレベルをリセットし、封印を永続強化します。',
    'pr.d2':'<b style="color:var(--shard)">+{g} エーテルシャード</b>獲得(合計{h})。シャード1つにつき<b>永続全体ダメージ+2%</b>、シャードショップで使用可。',
    'pr.go':'今すぐ再封印', 'pr.notyet':'まだシャードを得るほど進行していません。',
    'ad.dev.title':'テスト広告 — 実際の広告はゲームポータルで表示されます',
    'ad.fail':'📺 現在広告を読み込めません',
    'ad.off2':'📺 広告を見て2倍受け取る',
    'ad.off2.done':'💰 オフライン報酬2倍: +{g}',
    'ad.boost.btn':'📺 ×2', 'ad.boost.left':'💰 {m}分',
    'ad.boost.go':'💰 30分間ゴールド2倍!',
    'ad.boost.active':'💰 ゴールド2倍発動中 — 残り{m}分',
    'ad.revive.title':'💥 クリスタルが砕けました!',
    'ad.revive.d':'広告を見ると<b>HP50%</b>で復活しウェーブを維持 — 見ない場合は3ウェーブ後退。',
    'ad.revive.go':'📺 広告を見て復活 (HP50%)', 'ad.revive.no':'あきらめる (−3ウェーブ)',
    'ad.revive.done':'✨ クリスタルは耐えた! HP50%で復活。',
    'crys.broke':'💥 クリスタル破壊! ウェーブ{w}へ後退',
  },
};
function t(k){ const l = (S && S.lang) || 'ko'; return (LANG[l] && LANG[l][k] != null) ? LANG[l][k] : (LANG.en[k] != null ? LANG.en[k] : k); }
// t() + {placeholder} interpolation: tf('sv.saved', {n:3})
function tf(k, vars){ let str = t(k); for (const [kk, v] of Object.entries(vars)) str = str.split('{'+kk+'}').join(v); return str; }
// localized field on a data object: L(obj,'desc') → obj.descKo / obj.descJa / obj.desc
function langSuf(){ const l = (S && S.lang) || 'ko'; return l === 'ko' ? 'Ko' : l === 'ja' ? 'Ja' : ''; }
// Localized data field: proper NAMES stay English; descriptions/roles/tags come
// from the I18N table (keyed by item id), falling back to the object's own field.
function Ld(id, field, fallback){
  const l = (S && S.lang) || 'ko';
  const tab = I18N[l];
  return (tab && tab[id] && tab[id][field] != null) ? tab[id][field] : fallback;
}
function L(obj, field){ return obj ? Ld(obj.id, field, obj[field]) : ''; }
const BRANCH_L = { '⚔️ Offense':{ko:'⚔️ 공격',ja:'⚔️ 攻撃'}, '🛡️ Defense':{ko:'🛡️ 방어',ja:'🛡️ 防御'},
  '💰 Economy':{ko:'💰 경제',ja:'💰 経済'}, '✨ Skills':{ko:'✨ 스킬',ja:'✨ スキル'} };
const trBranch = b => { const l=(S&&S.lang)||'ko'; return (BRANCH_L[b]&&BRANCH_L[b][l])||b; };
const I18N = {
  ko: {
    // keystones
    cannon:{desc:'입히는 피해 +100%, 대신 크리스탈 피해 +60%.'}, fortress:{desc:'크리스탈 피해 −60%, 대신 입히는 피해 −30%.'},
    momentum:{desc:'킬 연속이 피해도 올리고(최대 +100%) 콤보 골드 보너스를 2배로.'}, avarice:{desc:'처치 골드 +150%, 대신 모든 적 체력 +35%.'},
    attunement:{desc:'속성 약점 타격 ×2.2(기본 ×1.6), 적 저항 무시.'},
    // shard shop
    power:{desc:'전체 영웅 피해 +2%'}, gold:{desc:'처치 골드 +5%'}, speed:{desc:'게임 속도 +3%'}, ward:{desc:'크리스탈 최대 체력 +20%'}, crit:{desc:'치명타 확률 +3%'},
    // talents
    might:{desc:'모든 피해 +5%'}, precision:{desc:'치명타 피해 +0.1×'}, haste:{desc:'공격 속도 +5%'}, bulwark:{desc:'크리스탈 방어 +10%'},
    regen:{desc:'크리스탈 재생 +0.1%/초'}, greed:{desc:'처치 골드 +8%'}, fortune:{desc:'황금 적 확률 +1%'}, focus:{desc:'스킬 쿨다운 −4%'},
    empower:{desc:'스킬 피해 +10%'}, grace:{desc:'파티 버프 +1초'},
    // achievements
    ach_w25:{desc:'웨이브 25 도달'}, ach_w50:{desc:'웨이브 50 도달'}, ach_w100:{desc:'웨이브 100 도달'}, ach_w200:{desc:'웨이브 200 도달'},
    ach_k1k:{desc:'적 1,000 처치'}, ach_k10k:{desc:'적 10,000 처치'}, ach_g1m:{desc:'누적 골드 100만 획득'}, ach_g1b:{desc:'누적 골드 10억 획득'},
    ach_gold:{desc:'황금 적 처치'}, ach_team:{desc:'영웅 5명 모두 모집'}, ach_p1:{desc:'프레스티지 1회'}, ach_p10:{desc:'프레스티지 10회'},
    // hero roles
    garran:{role:'수호 기사 · 탱커'}, mira:{role:'엠버윈드 마법사 · 광역'}, faye:{role:'질풍 궁수 · 신속'}, rai:{role:'폭풍 낭인 · 연쇄'}, aunel:{role:'여명 치유사 · 지원'},
    // races
    abyss:{tag:'포식자',desc:'공허의 공격 — 압도적 피해와 보스 학살.'}, revenant:{tag:'불사',desc:'언데드 — 끈질긴 지속력과 영혼으로 얻는 부.'},
    celestial:{tag:'광휘',desc:'신성한 행운 — 완벽한 치명타·골드·프레스티지.'}, human:{tag:'만능',desc:'적응형 — 공격·방어·경제의 균형.'},
    // race nodes
    ab_dmg:{desc:'영웅 피해 +4%'}, ab_boss:{desc:'보스 피해 +8%'}, ab_crit:{desc:'치명타 확률 +3%'}, ab_od:{desc:'오버드라이브 +0.5초'}, ab_rage:{desc:'영웅 피해 +3%'}, ab_sing:{desc:'보스 피해 +6%'},
    rv_ward:{desc:'크리스탈 최대 체력 +10%'}, rv_reduce:{desc:'크리스탈 피해 −4%'}, rv_regen:{desc:'크리스탈 재생 +0.3%/초'}, rv_gold:{desc:'처치 골드 +8%'}, rv_hp:{desc:'크리스탈 최대 체력 +8%'}, rv_eter:{desc:'크리스탈 재생 +0.3%/초'},
    ce_crit:{desc:'치명타 확률 +3%'}, ce_judge:{desc:'치명타 확률 +4%'}, ce_gold:{desc:'처치 골드 +8%'}, ce_luck:{desc:'황금 적 확률 +1%'}, ce_dmg:{desc:'영웅 피해 +4%'}, ce_shrd:{desc:'재봉인 샤드 +8%'},
    hu_dmg:{desc:'영웅 피해 +4%'}, hu_ward:{desc:'크리스탈 최대 체력 +8%'}, hu_gold:{desc:'처치 골드 +6%'}, hu_slow:{desc:'둔화 효과 +12%'}, hu_crit:{desc:'치명타 확률 +3%'}, hu_rally:{desc:'영웅 피해 +5%'},
    ab_r2a:{desc:'영웅 피해 +6%'}, ab_r2b:{desc:'치명타 확률 +4%'}, ab_r2c:{desc:'보스 피해 +10%'}, ab_cap:{desc:'치명타 피해 +0.2×'},
    rv_r2a:{desc:'크리스탈 최대 체력 +12%'}, rv_r2b:{desc:'크리스탈 재생 +0.4%/초'}, rv_r2c:{desc:'크리스탈 피해 −3%'}, rv_cap:{desc:'크리스탈 재생 +0.5%/초'},
    ce_r2a:{desc:'치명타 확률 +4%'}, ce_r2b:{desc:'처치 골드 +10%'}, ce_r2c:{desc:'영웅 피해 +5%'}, ce_cap:{desc:'재봉인 샤드 +15%'},
    hu_r2a:{desc:'영웅 피해 +5%'}, hu_r2b:{desc:'처치 골드 +8%'}, hu_r2c:{desc:'치명타 확률 +4%'}, hu_cap:{desc:'영웅 피해 +8%'},
    ab_r2d:{desc:'보스 피해 +8%'}, ab_r2e:{desc:'오버드라이브 +0.5초'}, ab_r2f:{desc:'영웅 피해 +5%'},
    rv_r2d:{desc:'크리스탈 피해 −3%'}, rv_r2e:{desc:'처치 골드 +10%'}, rv_r2f:{desc:'크리스탈 재생 +0.3%/초'},
    ce_r2d:{desc:'치명타 확률 +4%'}, ce_r2e:{desc:'황금 적 확률 +1%'}, ce_r2f:{desc:'재봉인 샤드 +8%'},
    hu_r2d:{desc:'크리스탈 최대 체력 +8%'}, hu_r2e:{desc:'둔화 효과 +12%'}, hu_r2f:{desc:'영웅 피해 +5%'},
    // relic rarities
    common:{name:'일반'}, rare:{name:'희귀'}, epic:{name:'영웅'}, legendary:{name:'전설'}, mythic:{name:'신화'},
    // bestiary abilities
    bst_slime:{desc:'파괴 시 미니 슬라임 2기로 분열 (웨이브 15+)'}, bst_skel:{desc:'장갑 보유; 골렘 변종은 방패도 장비'},
    bst_wraith:{desc:'빙결 면역'}, bst_imp:{desc:'빠른 화염 슬라임 — 스테이지 5부터 등장'},
    bst_frost:{desc:'냉기의 그림자 — 스테이지 7부터 등장'}, bst_venom:{desc:'맹독 싸움꾼 — 스테이지 9부터 등장'},
    bst_shade:{desc:'매우 빠름, 빙결 면역 — 스테이지 11부터'}, bst_brute:{desc:'중장갑 헤비 — 스테이지 14부터 등장'},
    bst_rev:{desc:'전기를 두른 해골 — 스테이지 18부터 등장'}, bst_harpy:{desc:'재빠른 폭풍 비행체 — 스테이지 15부터 등장'},
    bst_ogre:{desc:'곤봉 휘두르는 거한 — 스테이지 15부터 등장'},
  },
  ja: {
    cannon:{desc:'与ダメージ+100%、ただしクリスタル被ダメ+60%。'}, fortress:{desc:'クリスタル被ダメ−60%、ただし与ダメージ−30%。'},
    momentum:{desc:'キル連鎖が与ダメも上昇(最大+100%)、コンボ金ボーナス2倍。'}, avarice:{desc:'撃破ゴールド+150%、ただし全敵HP+35%。'},
    attunement:{desc:'属性弱点ヒット×2.2(通常×1.6)、敵の耐性を無視。'},
    power:{desc:'全ヒーローダメージ+2%'}, gold:{desc:'撃破ゴールド+5%'}, speed:{desc:'ゲーム速度+3%'}, ward:{desc:'クリスタル最大HP+20%'}, crit:{desc:'クリティカル率+3%'},
    might:{desc:'全ダメージ+5%'}, precision:{desc:'クリティカルダメージ+0.1×'}, haste:{desc:'攻撃速度+5%'}, bulwark:{desc:'クリスタル防御+10%'},
    regen:{desc:'クリスタル再生+0.1%/秒'}, greed:{desc:'撃破ゴールド+8%'}, fortune:{desc:'黄金の敵確率+1%'}, focus:{desc:'スキルCD−4%'},
    empower:{desc:'スキルダメージ+10%'}, grace:{desc:'パーティバフ+1秒'},
    ach_w25:{desc:'ウェーブ25到達'}, ach_w50:{desc:'ウェーブ50到達'}, ach_w100:{desc:'ウェーブ100到達'}, ach_w200:{desc:'ウェーブ200到達'},
    ach_k1k:{desc:'敵1,000体撃破'}, ach_k10k:{desc:'敵10,000体撃破'}, ach_g1m:{desc:'累計ゴールド100万獲得'}, ach_g1b:{desc:'累計ゴールド10億獲得'},
    ach_gold:{desc:'黄金の敵を撃破'}, ach_team:{desc:'ヒーロー5人全員雇用'}, ach_p1:{desc:'プレステージ1回'}, ach_p10:{desc:'プレステージ10回'},
    garran:{role:'守護の騎士 · タンク'}, mira:{role:'エンバーメイジ · 範囲'}, faye:{role:'疾風の弓 · 高速'}, rai:{role:'嵐の浪人 · 連鎖'}, aunel:{role:'暁の癒し手 · サポート'},
    abyss:{tag:'捕食者',desc:'虚空の攻撃 — 圧倒的ダメージとボス殲滅。'}, revenant:{tag:'不死',desc:'アンデッド — 執拗な持続力と魂の富。'},
    celestial:{tag:'光輝',desc:'神聖な幸運 — 完璧なクリ・ゴールド・プレステージ。'}, human:{tag:'万能',desc:'適応型 — 攻撃・防御・経済のバランス。'},
    ab_dmg:{desc:'ヒーローダメージ+4%'}, ab_boss:{desc:'ボスダメージ+8%'}, ab_crit:{desc:'クリティカル率+3%'}, ab_od:{desc:'オーバードライブ+0.5秒'}, ab_rage:{desc:'ヒーローダメージ+3%'}, ab_sing:{desc:'ボスダメージ+6%'},
    rv_ward:{desc:'クリスタル最大HP+10%'}, rv_reduce:{desc:'クリスタル被ダメ−4%'}, rv_regen:{desc:'クリスタル再生+0.3%/秒'}, rv_gold:{desc:'撃破ゴールド+8%'}, rv_hp:{desc:'クリスタル最大HP+8%'}, rv_eter:{desc:'クリスタル再生+0.3%/秒'},
    ce_crit:{desc:'クリティカル率+3%'}, ce_judge:{desc:'クリティカル率+4%'}, ce_gold:{desc:'撃破ゴールド+8%'}, ce_luck:{desc:'黄金の敵確率+1%'}, ce_dmg:{desc:'ヒーローダメージ+4%'}, ce_shrd:{desc:'再封印シャード+8%'},
    hu_dmg:{desc:'ヒーローダメージ+4%'}, hu_ward:{desc:'クリスタル最大HP+8%'}, hu_gold:{desc:'撃破ゴールド+6%'}, hu_slow:{desc:'スロー効果+12%'}, hu_crit:{desc:'クリティカル率+3%'}, hu_rally:{desc:'ヒーローダメージ+5%'},
    ab_r2a:{desc:'ヒーローダメージ+6%'}, ab_r2b:{desc:'クリティカル率+4%'}, ab_r2c:{desc:'ボスダメージ+10%'}, ab_cap:{desc:'クリティカルダメージ+0.2×'},
    rv_r2a:{desc:'クリスタル最大HP+12%'}, rv_r2b:{desc:'クリスタル再生+0.4%/秒'}, rv_r2c:{desc:'クリスタル被ダメ−3%'}, rv_cap:{desc:'クリスタル再生+0.5%/秒'},
    ce_r2a:{desc:'クリティカル率+4%'}, ce_r2b:{desc:'撃破ゴールド+10%'}, ce_r2c:{desc:'ヒーローダメージ+5%'}, ce_cap:{desc:'再封印シャード+15%'},
    hu_r2a:{desc:'ヒーローダメージ+5%'}, hu_r2b:{desc:'撃破ゴールド+8%'}, hu_r2c:{desc:'クリティカル率+4%'}, hu_cap:{desc:'ヒーローダメージ+8%'},
    ab_r2d:{desc:'ボスダメージ+8%'}, ab_r2e:{desc:'オーバードライブ+0.5秒'}, ab_r2f:{desc:'ヒーローダメージ+5%'},
    rv_r2d:{desc:'クリスタル被ダメ−3%'}, rv_r2e:{desc:'撃破ゴールド+10%'}, rv_r2f:{desc:'クリスタル再生+0.3%/秒'},
    ce_r2d:{desc:'クリティカル率+4%'}, ce_r2e:{desc:'黄金の敵確率+1%'}, ce_r2f:{desc:'再封印シャード+8%'},
    hu_r2d:{desc:'クリスタル最大HP+8%'}, hu_r2e:{desc:'スロー効果+12%'}, hu_r2f:{desc:'ヒーローダメージ+5%'},
    common:{name:'コモン'}, rare:{name:'レア'}, epic:{name:'エピック'}, legendary:{name:'レジェンダリー'}, mythic:{name:'ミシック'},
    // bestiary abilities
    bst_slime:{desc:'破壊時にミニスライム2体に分裂（ウェーブ15+）'}, bst_skel:{desc:'装甲持ち。ゴーレム変種は盾も装備'},
    bst_wraith:{desc:'凍結無効'}, bst_imp:{desc:'素早い炎スライム — ステージ5から出現'},
    bst_frost:{desc:'冷気の影 — ステージ7から出現'}, bst_venom:{desc:'猛毒の乱闘者 — ステージ9から出現'},
    bst_shade:{desc:'非常に速く凍結無効 — ステージ11から'}, bst_brute:{desc:'重装甲ヘビー — ステージ14から出現'},
    bst_rev:{desc:'帯電した骸骨 — ステージ18から出現'}, bst_harpy:{desc:'素早い嵐の飛行体 — ステージ15から出現'},
    bst_ogre:{desc:'棍棒を振り回す巨漢 — ステージ15から出現'},
  },
};

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
  // ---- Stage 15+ monsters (own sprites) ----
  harpy:    { hp:2.4, spd:26, size:1.2,  gold:4, element:'lightning', float:true, fly:0.55, sprite:'harpy' },  // slow glide through the air
  ogre:     { hp:7.5, spd:13, size:1.95, gold:6, element:'earth',     armor:0.38, sprite:'ogre'  },
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
function ksIs(id){ return !!(S && S.keystones && S.keystones.includes(id)); }
function enemyHpMul(){ return ksIs('avarice') ? 1.35 : 1; }     // Avarice: tougher enemies

// ---- Races: a mid-game identity choice. Each race grants a different tech
// tree; nodes are bought with talent points (🌳) and fold into the same
// multipliers via raceBonus(stat).
const RACE_STAGE = 7;   // race choice unlocks at Stage 7
// Each race's tree is a radial hex layout: 6 nodes around a central race node.
// `ang` = position angle (deg); `req` gates a node until a sibling is levelled.
const RACES = {
  abyss: { name:'Abyss', icon:'🌀', color:'#b07bff', tag:'Devourer',
    desc:'Void aggression — overwhelming damage and boss annihilation.',
    nodes:[
      { id:'ab_dmg',  name:'Void Might',   icon:'⚔️', desc:'+4% hero damage',       stat:'dmg',     per:0.04, max:10, cost:1, ang:270 },
      { id:'ab_boss', name:'Devourer',     icon:'💀', desc:'+8% damage to bosses',  stat:'bossDmg', per:0.08, max:5,  cost:2, ang:330 },
      { id:'ab_crit', name:'Abyssal Eye',  icon:'🎯', desc:'+3% critical chance',   stat:'crit',    per:0.03, max:5,  cost:2, ang:30  },
      { id:'ab_od',   name:'Void Surge',   icon:'⚡', desc:'Overdrive lasts +0.5s', stat:'odDur',   per:0.5,  max:4,  cost:2, ang:90  },
      { id:'ab_rage', name:'Dread Edge',   icon:'🔥', desc:'+3% hero damage',       stat:'dmg',     per:0.03, max:8,  cost:2, ang:150 },
      { id:'ab_sing', name:'Singularity',  icon:'🕳️', desc:'+6% damage to bosses',  stat:'bossDmg', per:0.06, max:5,  cost:3, ang:210, req:{id:'ab_boss',lv:3} },
      { id:'ab_r2a', name:'Rift Edge',   icon:'⚔️', desc:'+6% hero damage',      stat:'dmg',     per:0.06, max:5, cost:3, ring:2, ang:270, req:{id:'ab_dmg',lv:3} },
      { id:'ab_r2b', name:'Death Gaze',  icon:'🎯', desc:'+4% critical chance',  stat:'crit',    per:0.04, max:4, cost:3, ring:2, ang:30,  req:{id:'ab_crit',lv:3} },
      { id:'ab_r2c', name:'World Ender', icon:'💀', desc:'+10% damage to bosses',stat:'bossDmg', per:0.10, max:4, cost:3, ring:2, ang:150, req:{id:'ab_rage',lv:3} },
      { id:'ab_r2d', name:'Dread Maw',    icon:'💀', desc:'+8% damage to bosses', stat:'bossDmg', per:0.08, max:4, cost:3, ring:2, ang:330, req:{id:'ab_boss',lv:3} },
      { id:'ab_r2e', name:'Chaos Vent',   icon:'⚡', desc:'Overdrive lasts +0.5s', stat:'odDur',   per:0.5,  max:3, cost:3, ring:2, ang:90,  req:{id:'ab_od',lv:3} },
      { id:'ab_r2f', name:'Endless Hate', icon:'🔥', desc:'+5% hero damage',      stat:'dmg',     per:0.05, max:5, cost:3, ring:2, ang:210, req:{id:'ab_sing',lv:3} },
      { id:'ab_cap', name:'⭐ Oblivion', icon:'🌑', desc:'+0.2× critical damage', stat:'critDmg', per:0.2, max:4, cost:5, ring:3, ang:270, req:{id:'ab_r2a',lv:2}, cap:true },
    ] },
  revenant: { name:'Revenant', icon:'💀', color:'#5be18a', tag:'Undying',
    desc:'Undeath — relentless sustain and soul-fed wealth.',
    nodes:[
      { id:'rv_ward', name:'Bone Aegis',    icon:'🛡️', desc:'+10% Crystal max HP',      stat:'ward',      per:0.10, max:8, cost:1, ang:270 },
      { id:'rv_reduce',name:'Grave Ward',   icon:'🧱', desc:'Crystal takes -4% damage', stat:'dmgReduce', per:0.04, max:6, cost:2, ang:330 },
      { id:'rv_regen',name:'Undying',       icon:'♻️', desc:'+0.3%/s Crystal regen',    stat:'regen',     per:0.003,max:4, cost:2, ang:30  },
      { id:'rv_gold', name:'Soul Harvest',  icon:'🪙', desc:'+8% gold from kills',      stat:'gold',      per:0.08, max:8, cost:2, ang:90  },
      { id:'rv_hp',   name:'Rotten Heart',  icon:'❤️', desc:'+8% Crystal max HP',       stat:'ward',      per:0.08, max:6, cost:2, ang:150 },
      { id:'rv_eter', name:'Eternal Return',icon:'🩸', desc:'+0.3%/s Crystal regen',    stat:'regen',     per:0.003,max:4, cost:3, ang:210, req:{id:'rv_regen',lv:2} },
      { id:'rv_r2a', name:'Iron Tomb', icon:'🛡️', desc:'+12% Crystal max HP',      stat:'ward',      per:0.12, max:5, cost:3, ring:2, ang:270, req:{id:'rv_ward',lv:3} },
      { id:'rv_r2b', name:'Soul Font', icon:'♻️', desc:'+0.4%/s Crystal regen',     stat:'regen',     per:0.004,max:4, cost:3, ring:2, ang:30,  req:{id:'rv_regen',lv:2} },
      { id:'rv_r2c', name:'Deathless', icon:'🧱', desc:'Crystal takes -3% damage',  stat:'dmgReduce', per:0.03, max:5, cost:3, ring:2, ang:150, req:{id:'rv_hp',lv:3} },
      { id:'rv_r2d', name:'Tombward',    icon:'🧱', desc:'Crystal takes -3% damage', stat:'dmgReduce', per:0.03, max:5, cost:3, ring:2, ang:330, req:{id:'rv_reduce',lv:3} },
      { id:'rv_r2e', name:'Grave Greed', icon:'🪙', desc:'+10% gold from kills',    stat:'gold',      per:0.10, max:5, cost:3, ring:2, ang:90,  req:{id:'rv_gold',lv:3} },
      { id:'rv_r2f', name:'Revenance',   icon:'🩸', desc:'+0.3%/s Crystal regen',   stat:'regen',     per:0.003,max:4, cost:3, ring:2, ang:210, req:{id:'rv_eter',lv:3} },
      { id:'rv_cap', name:'⭐ Immortal Coil', icon:'💀', desc:'+0.5%/s Crystal regen', stat:'regen', per:0.005, max:4, cost:5, ring:3, ang:270, req:{id:'rv_r2a',lv:2}, cap:true },
    ] },
  celestial: { name:'Celestial', icon:'✨', color:'#ffd75e', tag:'Radiant',
    desc:'Divine fortune — pristine crits, gold and prestige gains.',
    nodes:[
      { id:'ce_crit', name:'Divine Focus', icon:'🎯', desc:'+3% critical chance',     stat:'crit',      per:0.03, max:6, cost:1, ang:270 },
      { id:'ce_judge',name:'Judgment',     icon:'🌟', desc:'+4% critical chance',     stat:'crit',      per:0.04, max:4, cost:3, ang:330, req:{id:'ce_crit',lv:3} },
      { id:'ce_gold', name:'Blessing',     icon:'🪙', desc:'+8% gold from kills',     stat:'gold',      per:0.08, max:8, cost:2, ang:30  },
      { id:'ce_luck', name:'Fortune',      icon:'🍀', desc:'+1% golden-enemy chance', stat:'golden',    per:0.01, max:5, cost:2, ang:90  },
      { id:'ce_dmg',  name:'Radiance',     icon:'⚔️', desc:'+4% hero damage',         stat:'dmg',       per:0.04, max:8, cost:2, ang:150 },
      { id:'ce_shrd', name:'Ascension',    icon:'💠', desc:'+8% shards from Reseal',  stat:'shardGain', per:0.08, max:5, cost:3, ang:210, req:{id:'ce_gold',lv:3} },
      { id:'ce_r2a', name:'Sanctify',   icon:'🎯', desc:'+4% critical chance', stat:'crit', per:0.04, max:5, cost:3, ring:2, ang:270, req:{id:'ce_crit',lv:3} },
      { id:'ce_r2b', name:'Golden Halo',icon:'🪙', desc:'+10% gold from kills',stat:'gold', per:0.10, max:5, cost:3, ring:2, ang:30,  req:{id:'ce_gold',lv:3} },
      { id:'ce_r2c', name:'Holy Wrath', icon:'⚔️', desc:'+5% hero damage',     stat:'dmg',  per:0.05, max:5, cost:3, ring:2, ang:150, req:{id:'ce_dmg',lv:3} },
      { id:'ce_r2d', name:'Verdict',    icon:'⚖️', desc:'+4% critical chance',     stat:'crit',      per:0.04, max:4, cost:3, ring:2, ang:330, req:{id:'ce_judge',lv:3} },
      { id:'ce_r2e', name:'Cornucopia', icon:'🍀', desc:'+1% golden-enemy chance', stat:'golden',    per:0.01, max:5, cost:3, ring:2, ang:90,  req:{id:'ce_luck',lv:3} },
      { id:'ce_r2f', name:'Zenith',     icon:'💠', desc:'+8% shards from Reseal',  stat:'shardGain', per:0.08, max:4, cost:3, ring:2, ang:210, req:{id:'ce_shrd',lv:3} },
      { id:'ce_cap', name:'⭐ Apotheosis', icon:'🌟', desc:'+15% shards from Reseal', stat:'shardGain', per:0.15, max:4, cost:5, ring:3, ang:270, req:{id:'ce_r2a',lv:2}, cap:true },
    ] },
  human: { name:'Human', icon:'⚜️', color:'#7bd3ff', tag:'Versatile',
    desc:'Adaptable — a balanced hand in offense, defense and economy.',
    nodes:[
      { id:'hu_dmg',  name:'Discipline', icon:'⚔️', desc:'+4% hero damage',    stat:'dmg',   per:0.04, max:8, cost:1, ang:270 },
      { id:'hu_ward', name:'Bastion',    icon:'🛡️', desc:'+8% Crystal max HP', stat:'ward',  per:0.08, max:6, cost:2, ang:330 },
      { id:'hu_gold', name:'Trade',      icon:'🪙', desc:'+6% gold from kills',stat:'gold',  per:0.06, max:8, cost:2, ang:30  },
      { id:'hu_slow', name:'Tactics',    icon:'❄️', desc:'+12% slow potency',  stat:'slow',  per:0.12, max:4, cost:2, ang:90  },
      { id:'hu_crit', name:'Precision',  icon:'🎯', desc:'+3% critical chance',stat:'crit',  per:0.03, max:5, cost:2, ang:150 },
      { id:'hu_rally',name:'Rally',      icon:'🎖️', desc:'+5% hero damage',    stat:'dmg',   per:0.05, max:5, cost:3, ang:210, req:{id:'hu_dmg',lv:3} },
      { id:'hu_r2a', name:'Vanguard',      icon:'⚔️', desc:'+5% hero damage',     stat:'dmg',  per:0.05, max:5, cost:3, ring:2, ang:270, req:{id:'hu_dmg',lv:3} },
      { id:'hu_r2b', name:'Merchant Guild',icon:'🪙', desc:'+8% gold from kills', stat:'gold', per:0.08, max:5, cost:3, ring:2, ang:30,  req:{id:'hu_gold',lv:3} },
      { id:'hu_r2c', name:'Sharpshooter',  icon:'🎯', desc:'+4% critical chance', stat:'crit', per:0.04, max:4, cost:3, ring:2, ang:150, req:{id:'hu_crit',lv:3} },
      { id:'hu_r2d', name:'Rampart',   icon:'🛡️', desc:'+8% Crystal max HP', stat:'ward', per:0.08, max:5, cost:3, ring:2, ang:330, req:{id:'hu_ward',lv:3} },
      { id:'hu_r2e', name:'Stratagem', icon:'❄️', desc:'+12% slow potency',  stat:'slow', per:0.12, max:4, cost:3, ring:2, ang:90,  req:{id:'hu_slow',lv:3} },
      { id:'hu_r2f', name:'Warcry',    icon:'🎖️', desc:'+5% hero damage',    stat:'dmg',  per:0.05, max:5, cost:3, ring:2, ang:210, req:{id:'hu_rally',lv:3} },
      { id:'hu_cap', name:'⭐ Grand Strategy', icon:'🎖️', desc:'+8% hero damage', stat:'dmg', per:0.08, max:5, cost:5, ring:3, ang:270, req:{id:'hu_r2a',lv:2}, cap:true },
    ] },
};
const raceUnlocked = () => dispStage(S.bestWave) >= RACE_STAGE;
const raceValid = () => !!(S && S.race && RACES[S.race]);
const raceNodes = () => raceValid() ? RACES[S.race].nodes : [];
const raceLvl = id => (S && S.raceTree && S.raceTree[id]) || 0;
const raceNodeLocked = n => n.req && raceLvl(n.req.id) < n.req.lv;
function raceBonus(stat){
  let v = 0;
  for (const n of raceNodes()) if (n.stat === stat) v += n.per * raceLvl(n.id);
  return v;
}

// Progressive feature reveal — systems stay hidden until you clear the stage
// that unlocks them, so a fresh run starts simple (just recruit + fight) and
// opens up as you climb. Gate is on lifetime best stage (dispStage(S.bestWave)).
// A run stays lean early — only recruit + fight — and reveals systems deeper in.
// `also` is a soft-lock safety: it opens the meta layer the moment a Reseal is
// possible even if the stage gate hasn't been met, so a player can never wall
// out with no way forward.
const FEATURE_UNLOCKS = [
  { sel:'#btnTower',      stage:3,  name:'🏰 Fortify' },
  { sel:'#btnBestiary',   stage:3,  name:'📖 Bestiary' },
  { sel:'[data-spd="2"]', stage:3,  name:'2× Speed' },
  { sel:'#odBtn',         stage:5,  name:'⚡ Overdrive' },
  { sel:'#btnBuyMode',    stage:5,  name:'🛒 Bulk Buy' },
  { sel:'#btnRelics',     stage:5,  name:'🗡️ Relics', flag:'relics' },
  { sel:'#btnAuto',       stage:6,  name:'🅰️ Auto-Upgrade' },
  { sel:'#btnAch',        stage:6,  name:'🏆 Achievements' },
  { sel:'#btnRace',       stage:7,  name:'🧬 Race' },
  { sel:'#btnPrestige',   stage:8,  name:'💠 Reseal (Prestige)', also:()=>prestigeShards(S.totalGoldEarned) >= 1 },
  { sel:'#btnShop',       stage:8,  name:'💠 Shard Shop',        also:()=>prestigeShards(S.totalGoldEarned) >= 1 },
  { sel:'#btnTalents',    stage:8,  name:'🌳 Talents' },
  { sel:'#btnKeystone',   stage:10, name:'⭐ Keystone' },
];
const bestStage = () => dispStage(S ? S.bestWave : 1);
const featureIsOpen = u => bestStage() >= u.stage || (u.also && u.also());
function featureOpen(flag){                    // gate for non-DOM systems (e.g. relic drops)
  const f = FEATURE_UNLOCKS.find(u => u.flag === flag);
  return !f || featureIsOpen(f);
}
// Grey out (not hide) every not-yet-unlocked control, so players can see what's
// coming. `announce` shows a popup for anything newly opened; on the seeding
// call (boot) we pass false so we don't re-announce systems already earned.
const announcedFeatures = new Set();
function refreshFeatureLocks(announce){
  const justOpened = [];
  for (const u of FEATURE_UNLOCKS){
    const open = featureIsOpen(u);
    document.querySelectorAll(u.sel).forEach(nEl => {
      nEl.style.display = '';                                   // always visible
      nEl.classList.toggle('feat-locked', !open);
      if (!open){
        nEl.dataset.unlockStage = u.stage;
        if (!nEl.dataset.origTitle && nEl.title) nEl.dataset.origTitle = nEl.title;
        nEl.title = `🔒 Unlocks at Stage ${u.stage}`;
      } else {
        delete nEl.dataset.unlockStage;
        if (nEl.dataset.origTitle){ nEl.title = nEl.dataset.origTitle; delete nEl.dataset.origTitle; }
        else if ((nEl.title||'').startsWith('🔒')) nEl.removeAttribute('title');
      }
    });
    if (open && !announcedFeatures.has(u.sel)){
      announcedFeatures.add(u.sel);
      justOpened.push(u);
    }
  }
  if (announce && justOpened.length) showUnlockPopup(justOpened);
}
// A tap on a locked control explains itself instead of doing nothing. Capture
// phase so it runs before the control's own click handler and can cancel it.
document.addEventListener('click', e => {
  const locked = e.target.closest && e.target.closest('.feat-locked');
  if (locked){
    e.preventDefault(); e.stopImmediatePropagation();
    toast(`🔒 Unlocks at Stage ${locked.dataset.unlockStage}`);
    GA('hit');
  }
}, true);
// Popup announcing newly-unlocked systems. Queued so it waits its turn behind
// any modal already on screen (e.g. the offline "welcome back" panel).
let unlockQueue = [];
function showUnlockPopup(list){ unlockQueue.push(...list); flushUnlockPopup(); }
function flushUnlockPopup(){
  if (!unlockQueue.length || el('modal').classList.contains('show')) return;
  const list = unlockQueue; unlockQueue = [];
  const rows = list.map(u => `<div class="shard-item"><div class="info"><b>${u.name}</b></div>
    <div class="lv">Stage ${u.stage}</div></div>`).join('');
  openModal(`<h2>🔓 New Systems Unlocked!</h2>
    <p>Your climb opened ${list.length>1?'these new systems':'a new system'} — find ${list.length>1?'them':'it'} in the controls bar:</p>
    <div class="shard-shop">${rows}</div>
    <button class="btn" id="unlockOk" style="width:100%;margin-top:6px">Continue ⚔️</button>`);
  GA('prestige');
  el('unlockOk').onclick = closeModal;
}

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
  imp:'slime', frostkin:'specter', venom:'zombie', shade:'specter', brute:'skeleton', revenant:'skeleton',
  harpy:'harpy', ogre:'ogre' };
const SLOW_FACTOR = 0.42;              // movement multiplier while frozen
const BURN_DUR = 1.6;                  // seconds an enemy shows the burning FX
const PARTY_BUFF_MUL = 1.30;           // Aunel's Dawn Blessing damage buff
// Cap on crystal damage-reduction (wardMul × towerHpMul). Without this, stacking
// Ward/Fortify pushes the heal break-even past the 24-enemy wave cap and the
// Crystal becomes unbreakable. At 3.3 a full wave can always threaten it.
const DMG_MITIGATION_CAP = 3.3;

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
function critChance(){ return Math.min(0.75, 0.03 + 0.03 * S.shardUpg.crit + relicBonus('crit') + raceBonus('crit')); }
function critMultiplier(){ return CRIT_MULT + 0.1 * talent('precision') + raceBonus('critDmg'); }
function critRoll(dmg){
  return Math.random() < critChance() ? { dmg: dmg * critMultiplier(), crit:true } : { dmg, crit:false };
}

// --- Talent tree: spent with Talent Points (earned from prestige + achievements)
const TALENTS = [
  { id:'might',     branch:'⚔️ Offense', name:'Might',        desc:'+5% all damage',          max:10, cost:2, fmt:l=>`+${5*l}% dmg` },
  { id:'precision', branch:'⚔️ Offense', name:'Precision',    desc:'+0.1× critical damage',   max:5,  cost:2, fmt:l=>`×${(CRIT_MULT+0.1*l).toFixed(1)} crit` },
  { id:'haste',     branch:'⚔️ Offense', name:'Haste',        desc:'+5% attack speed',        max:8,  cost:2, fmt:l=>`+${5*l}% spd` },
  { id:'bulwark',   branch:'🛡️ Defense', name:'Bulwark',      desc:'+10% crystal defense',    max:8,  cost:1, fmt:l=>`+${10*l}% def` },
  { id:'regen',     branch:'🛡️ Defense', name:'Regeneration', desc:'+0.1%/s crystal regen',   max:6,  cost:1, fmt:l=>`+${(0.1*l).toFixed(1)}%/s` },
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
const adBoostMul = () => ((S && S.adBoostUntil) || 0) > Date.now() ? 2 : 1;   // 📺 rewarded-ad gold boost
function goldMulAll(){ return shardMul('gold') * (1 + 0.08 * talent('greed')) * (1 + relicBonus('gold')) * (1 + raceBonus('gold')) * (ksIs('avarice') ? 2.5 : 1) * adBoostMul(); }
function goldenChance(){ return 0.03 + 0.01 * talent('fortune') + raceBonus('golden'); }

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
  if (!featureOpen('relics')) return;          // relics start dropping once the system unlocks
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
  const grad = autoFuse();                          // Common/Rare auto-combine upward
  if (grad){ const gt = RELIC_TYPES[grad.type];
    toast(`♻️ Auto-fused → ${gt.icon} ${relicRarityName(grad)} ${gt.name}!`); }
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
function reachWave(w){
  if (w > S.bestWave){
    awardMilestones(S.bestWave, w);
    S.bestWave = w;                    // feature reveal happens in checkUnlocks
  }
}

// ------------------------------------------------------------------ formulas
// Early monsters hit +50% HP, tapering linearly back to normal by wave 40
// (end of Stage 4), so the opening is tougher without touching late scaling.
const EARLY_HP_WAVES = 40;
const earlyHpMul = w => 1 + 0.5 * Math.max(0, (EARLY_HP_WAVES - (w - 1)) / EARLY_HP_WAVES);
const enemyHP    = w => 12 * Math.pow(1.12, w - 1) * earlyHpMul(w);
const enemyCount = w => Math.min(6 + Math.floor(w / 2.7), 24);
// gold now grows with the HP wall (was 1.10 — income fell behind every wave)
const goldPerKill= w => Math.ceil(2 * Math.pow(1.12, w - 1));
const isBossWave = w => w % BOSS_EVERY === 0;
// linear per level + a ×2 milestone every 25 levels, so leveling keeps pace
// with exponential enemy HP instead of decaying to worthless mid-game
const heroDmg    = (def, lvl) => def.baseDmg * (1 + 0.25 * lvl) * Math.pow(2, Math.floor(lvl / 25));
const heroCost   = (def, lvl) => Math.ceil(def.baseCost * 1.2 * Math.pow(1.15, lvl));
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
    keystones: [],          // active keystone ids (1 until all unlocked, then multi)
    race: null,             // chosen race id (mid-game) — drives a race-specific tech tree
    raceTree: {},           // race tech node id -> level
    lang: 'ko',             // UI language: en / ko / ja
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
      keystones: Array.isArray(d.keystones) ? d.keystones : (d.keystone ? [d.keystone] : []),  // migrate single→multi
      raceTree: Object.assign(base.raceTree, d.raceTree || {}),
    });
  }catch(e){ return null; }
}
let skipSave = false;   // set before a New Start so the unload handler can't re-write the save
function save(){
  if (skipSave) return;
  S.lastSeen = Date.now();
  try{ localStorage.setItem(SAVE_KEY, JSON.stringify(S)); return true; }catch(e){ return false; }
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
  m *= 1 + raceBonus('dmg');                          // race tech tree
  return m;
}
function ksDmgMul(){
  let m = ksIs('cannon') ? 2 : ksIs('fortress') ? 0.7 : 1;
  if (ksIs('momentum')) m *= 1 + Math.min(combo, COMBO_MAX) / COMBO_MAX;   // damage scales with streak
  return m;
}
function combatMul(){ return globalDmgMul() * (partyBuffT > 0 ? PARTY_BUFF_MUL : 1) * (1 + 0.05 * talent('might')) * (odActive() ? OD_DMG : 1) * ksDmgMul(); }
function towerHpMul(){ return 1 + 0.15 * S.towerLv; }          // Fortify Tower (gold)
// Fortify is a premium sink: first upgrade costs 50K, then climbs steeply.
function towerCost(){ return Math.ceil(50000 * Math.pow(1.6, S.towerLv)); }
function crystalMaxHp(){ return 100 * wardMul() * (1 + relicBonus('ward')) * (1 + raceBonus('ward')) * towerHpMul(); }
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
// boss entrance cinematic: full-screen flash + name banner + brief slow-mo
let sweepT = 0; const SWEEP_DUR = 0.55;   // wave-clear light-sweep flourish
let bossIntroT = 0, bossIntroName = '', bossIntroRGB = '';
const BOSS_INTRO_DUR = 1.7;
const BOSS_INFO = { dragon:{ name:'INFERNAL DRAGON', rgb:'255,122,60' }, elderghost:{ name:'ELDER GHOST', rgb:'197,139,255' } };
function startBossIntro(kind){ const b = BOSS_INFO[kind] || BOSS_INFO.dragon; bossIntroT = BOSS_INTRO_DUR; bossIntroName = b.name; bossIntroRGB = b.rgb; GA('boss'); shake(7); }
// kill-streak combo: rapid consecutive kills build a gold bonus
let combo = 0, comboT = 0;   // current streak + seconds left before it resets
const COMBO_WINDOW = 2.6;    // seconds to land the next kill and keep the streak
const COMBO_MAX = 10;        // combo caps at 10 (both the count and its bonus)
// gold bonus from the current streak: up to +50% at COMBO_MAX (Momentum doubles it)
function comboMul(){ return 1 + Math.min(combo, COMBO_MAX) / COMBO_MAX * 0.5 * (ksIs('momentum') ? 2 : 1); }
function comboTier(){ return combo>=10?4 : combo>=8?3 : combo>=6?2 : combo>=3?1 : 0; }
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
  odCharge = 0; odT = OD_DUR + raceBonus('odDur');   // Emberkin Overload extends it
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
  if (st >= 15) pool.push('harpy', 'ogre');
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
    const hp = enemyHP(w) * 10 * enemyHpMul();
    const bossKind = (Math.floor(w / BOSS_EVERY) % 2 === 0) ? 'elderghost' : 'dragon';
    enemies.push({ x: view.laneRight, y: view.ground, hp, maxHp: hp,
      type:'boss', speed:18, frame:0, boss:true, bossKind, element: bossElement(bossKind),
      slow:0, goldMul:10, atkTimer:0, age:0 });
    startBossIntro(bossKind);
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
// Death shatter: enemy bursts into element-coloured pixel shards that arc + fade.
function spawnShatter(e){
  if (S && S.settings && !S.settings.fx) return;
  const col = ELEM_COLOR[e.element] || '#cdd6f4', sc = view.h/460;
  const n = e.boss ? 22 : 10, cy = e.y - 16*sc;
  for (let i = 0; i < n; i++){
    if (particles.length >= MAX_PARTICLES) particles.shift();
    const ang = Math.random()*Math.PI*2, sp = (40 + Math.random()*130) * sc, life = 0.35 + Math.random()*0.4;
    particles.push({ x: e.x + (Math.random()-0.5)*12*sc, y: cy + (Math.random()-0.5)*16*sc,
      vx: Math.cos(ang)*sp, vy: Math.sin(ang)*sp - 40*sc, life, max: life,
      size: (1.4 + Math.random()*2.2) * sc, color: col, shape:'shard', grav: 120*sc, drag: 0.9, glow: true });
  }
}
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
  if (e.boss) dmg *= 1 + raceBonus('bossDmg');        // Emberkin: anti-boss
  if (e.armor) dmg *= (1 - e.armor);
  addDamageNumber(e, dmg, crit, vs.kind);
  if (e.shield > 0){                       // shield soaks damage before HP
    if (dmg <= e.shield){ e.shield -= dmg; dmg = 0; }
    else { dmg -= e.shield; e.shield = 0; }
  }
  e.hp -= dmg;
  if (e.hp <= 0){
    if (e.split) spawnChildren(e);         // slimes split into two on death
    // extend the kill-streak combo (bosses give a bigger jump), capped at COMBO_MAX
    combo = Math.min(combo + (e.boss ? 5 : 1), COMBO_MAX); comboT = COMBO_WINDOW;
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
    spawnShatter(e);                          // pixel-shatter dissolve in the enemy's element colour
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
      if (!ENEMY_TYPES[e.type] || !ENEMY_TYPES[e.type].slowImmune){ e.slow = 3 * (1 + raceBonus('slow')); spawnParticles(e.x, e.y-14, 'frost', 0.4); }  // freeze
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
    // HOLY: golden sparkles + heal (Dawn Blessing restores 12% per cast)
    S.crystalHp = Math.min(1, S.crystalHp + 0.12);
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

// crystal broke and no revive: the old fall-back-3-waves path
function crystalFallback(brokeWave){
  S.wave = Math.max(1, brokeWave - 3);
  S.crystalHp = 1;
  startWave(S.wave);
  toast(tf('crys.broke', { w: S.wave }));
  maybeWallHint(brokeWave);
}
// rewarded ad: revive at 50% HP on the same wave
function offerRevive(brokeWave){
  openModal(`<h2>${t('ad.revive.title')}</h2>
    <p>${t('ad.revive.d')}</p>
    <div style="display:flex;gap:8px;margin-top:14px">
      <button class="btn" id="advYes" style="flex:1;background:linear-gradient(#3a2f12,#26200e);border-color:#ffd75e;color:#ffd75e">${t('ad.revive.go')}</button>
      <button class="btn" id="advNo" style="flex:1">${t('ad.revive.no')}</button></div>`);
  const settle = revived => {
    simHold = false; closeModal();
    if (revived){
      S.crystalHp = 0.5;
      S.reviveCdUntil = Date.now() + 5 * 60000;
      startWave(brokeWave);
      toast(t('ad.revive.done')); GA('heal');
    } else crystalFallback(brokeWave);
    save(); updateHud();
  };
  el('advYes').onclick = () => Ads.rewarded(ok => { if (!ok) toast(t('ad.fail')); settle(ok); });
  el('advNo').onclick = () => settle(false);
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
    S.crystalHp = Math.min(1, S.crystalHp + 0.001 * talent('regen') * dt);
  if (raceBonus('regen') > 0 && S.crystalHp > 0)                 // Frostborn Everfrost
    S.crystalHp = Math.min(1, S.crystalHp + raceBonus('regen') * dt);

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
        const mitig = Math.min(DMG_MITIGATION_CAP, wardMul() * towerHpMul());
        const dmgFrac = (e.boss ? 0.20 : 0.05) * ksTake / mitig * (1 - Math.min(0.75, raceBonus('dmgReduce')));
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
    enemies.length = 0; fx.length = 0; particles.length = 0;
    // rewarded ad: offer a 50%-HP revive that keeps the wave (max 1 per 5 min)
    if (window.Ads && Ads.canReward() && Date.now() >= (S.reviveCdUntil || 0)){
      S.crystalHp = 0.01; simHold = true;
      offerRevive(brokeWave);
      return;
    }
    crystalFallback(brokeWave);
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
    const clearedWave = S.wave;
    S.crystalHp = Math.min(1, S.crystalHp + 0.05);
    S.wave++;
    sweepT = SWEEP_DUR;                        // light sweep flourish on every wave clear
    // clearing the last wave of a stage fully restores the Crystal
    if (clearedWave % STAGE_WAVES === 0){
      S.crystalHp = 1;
      toast(`🛡️ Stage ${dispStage(clearedWave)} cleared — Crystal fully restored!`);
    }
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
  if (sweepT > 0) sweepT = Math.max(0, sweepT - dt);
  if (shakeT > 0){ shakeT -= dt; if (shakeT <= 0){ shakeT = 0; shakeAmt = 0; } }
  if (wallHintT > 0) wallHintT -= dt;
  // auto-upgrade: buy one cheapest affordable upgrade a few times per second,
  // and auto-trigger Overdrive whenever it's charged and there are foes to hit
  if (S.autoUp){
    autoUpT -= dt; if (autoUpT <= 0){ autoUpT = 0.3; autoUpgradeStep(); }
    if (odCharge >= 1 && !odActive() && enemies.length > 0) tryOverdrive();
  }

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
    // heal is a per-SECOND rate (× tick interval) so Haste/Overdrive can't inflate
    // its effective HPS; capped at 5%/s, and cut to 25% while a boss is on the
    // field so bosses always out-damage the healer.
    const rate = Math.min(0.05, 0.0025 * lvl);
    let heal = rate * effInterval(def);
    if (enemies.some(e => e.boss)) heal *= 0.25;
    S.crystalHp = Math.min(1, S.crystalHp + heal);
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
  refreshFeatureLocks(true);   // reveal + popup-announce any systems the new best stage unlocked
}

// ------------------------------------------------------------------ rendering
const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d');
let dpr = 1;
// While an HD sheet is still decoding, skip its low-res canvas fallback so the
// crystal/heroes/enemies don't flash in at low resolution on first load.
const sheetPending = id => !!(window.Sheets && Sheets.pending && Sheets.pending(id));

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
// orientation flips can fire before the new viewport size settles — resize again after it does
window.addEventListener('orientationchange', () => setTimeout(resize, 250));

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
// blue=true swaps the warm palette for a cool aether flame (full-HP crown).
let _towerEmberT = 0;
function drawTowerFire(cx, topY, tH, level, now, blue){
  if (level <= 0) return;
  const dw = tH * 0.602;                 // on-screen tower width (cell 153/254)
  const baseY = topY + tH * 0.30;        // flames sit at the top battlement
  const scale = [0, 0.72, 1.0, 1.3][level];
  const spread = dw * 0.30 * (0.7 + 0.3*level);
  const t = now / 1000;

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  // pulsing glow behind the flames
  const gy = baseY - tH*0.08;
  const glowR = tH * (0.15 + 0.05*level) * (0.9 + 0.12*Math.sin(now/110));
  const gg = ctx.createRadialGradient(cx, gy, 0, cx, gy, glowR);
  if (blue){
    gg.addColorStop(0,   'rgba(120,205,255,0.5)');
    gg.addColorStop(0.5, 'rgba(80,145,255,0.24)');
    gg.addColorStop(1,   'rgba(60,100,255,0)');
  } else {
    gg.addColorStop(0,   'rgba(255,180,70,0.5)');
    gg.addColorStop(0.5, 'rgba(255,110,30,0.24)');
    gg.addColorStop(1,   'rgba(255,80,20,0)');
  }
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
    if (blue){
      grad.addColorStop(0,   'rgba(235,250,255,0.85)');
      grad.addColorStop(0.35,'rgba(140,215,255,0.8)');
      grad.addColorStop(0.7, 'rgba(70,135,255,0.6)');
      grad.addColorStop(1,   'rgba(35,60,220,0)');
    } else {
      grad.addColorStop(0,   'rgba(255,255,225,0.85)');
      grad.addColorStop(0.35,'rgba(255,196,80,0.8)');
      grad.addColorStop(0.7, 'rgba(255,110,30,0.6)');
      grad.addColorStop(1,   'rgba(210,45,10,0)');
    }
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
        color: (blue ? ['#bfe6ff','#7bd3ff','#4a86ff'] : ['#ffe27a','#ff9d3c','#ff5a1a'])[(Math.random()*3)|0],
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
// ---- Atmosphere: per-stage biome tint, cinematic vignette, drifting motes ----
// Each 10-stage band gets its own colour grade + ambient particle colour, so
// climbing the stages reads visually as moving through new biomes.
const BIOMES = [
  { name:'Verdant Halls', tint:null,      mote:'#9be36a', wx:null    },  // Stage 1–10
  { name:'Frostspire',    tint:'#3a6bd0', mote:'#cbeaff', wx:'snow'  },  // 11–20
  { name:'Emberdepths',   tint:'#c0392b', mote:'#ff9d3c', wx:'ash'   },  // 21–30
  { name:'Blightmarsh',   tint:'#2f9e5a', mote:'#b6ff8a', wx:'spore' },  // 31–40
  { name:'Voidreach',     tint:'#7a3cc0', mote:'#d9a6ff', wx:'void'  },  // 41–50
  { name:'Sunscorch',     tint:'#c58b2e', mote:'#ffd98a', wx:'sand'  },  // 51–60
  { name:'Abyssal Tide',  tint:'#2b8fb0', mote:'#bff0ff', wx:'rain'  },  // 61–70
  { name:'Duskvault',     tint:'#b0347a', mote:'#ffb3e6', wx:'petal' },  // 71–80
];
const WEATHER = {
  snow:  { color:'#dff0ff', speed:0.10, sway:1.2, amp:16, size:1.6, alpha:0.7 },
  ash:   { color:'#ff9d3c', speed:0.08, sway:1.6, amp:20, size:1.4, alpha:0.55, add:true },
  spore: { color:'#b6ff8a', speed:0.05, sway:1.8, amp:22, size:1.3, alpha:0.5,  add:true },
  void:  { color:'#d9a6ff', speed:0.07, sway:1.0, amp:14, size:1.5, alpha:0.55, add:true },
  sand:  { color:'#ffd98a', speed:0.22, sway:0.8, amp:10, size:1.0, alpha:0.4 },
  rain:  { color:'#9fd0ff', speed:0.55, sway:0.3, amp:5,  size:2.2, alpha:0.5, line:true },
  petal: { color:'#ffb3e6', speed:0.09, sway:2.0, amp:24, size:1.8, alpha:0.6 },
};
const WDROPS = Array.from({ length: 70 }, () => ({ x: Math.random(), y: Math.random(), ph: Math.random()*Math.PI*2, z: Math.random() }));
function drawWeather(now){
  if (!S.settings.fx) return;
  const wx = biomeOf(S.wave).wx; if (!wx) return;
  const w = WEATHER[wx], sc = view.h/460, t = now/1000;
  ctx.save(); if (w.add) ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = w.color;
  for (const d of WDROPS){
    const y = ((((d.y + t*w.speed) % 1) + 1) % 1) * (view.h + 40) - 20;
    const x = d.x*view.w + Math.sin(t*w.sway + d.ph) * w.amp * sc;
    ctx.globalAlpha = w.alpha * (0.55 + 0.45*d.z);
    const s = w.size * sc * (0.6 + d.z);
    if (w.line){ ctx.fillRect(x, y, Math.max(1, s*0.35), s*3.2); }
    else { ctx.beginPath(); ctx.arc(x, y, s, 0, Math.PI*2); ctx.fill(); }
  }
  ctx.restore();
}
const biomeOf = w => BIOMES[Math.floor((dispStage(w) - 1) / 10) % BIOMES.length];
const MOTES = Array.from({ length: 30 }, () => ({
  x: Math.random(), y: Math.random(), r: 0.6 + Math.random() * 1.8,
  sx: (Math.random() - 0.5) * 0.006, sy: -(0.004 + Math.random() * 0.010),
  ph: Math.random() * Math.PI * 2, tw: 0.5 + Math.random() * 1.5,
}));
function drawMotes(now){
  if (!S.settings.fx) return;                       // respect the particle-effects toggle
  const col = biomeOf(S.wave).mote, sc = view.h / 460;
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = col;
  for (const m of MOTES){
    const mx = ((((m.x + m.sx * now / 1000) % 1) + 1) % 1) * view.w;
    const my = ((((m.y + m.sy * now / 1000) % 1) + 1) % 1) * view.h;
    ctx.globalAlpha = 0.10 + 0.30 * (0.5 + 0.5 * Math.sin(now / 700 * m.tw + m.ph));
    ctx.beginPath(); ctx.arc(mx, my, m.r * sc * 1.4, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}
// Parallax depth: soft fog puffs drifting at varied speeds behind the action.
const FOG = Array.from({ length: 11 }, () => ({
  x: Math.random(), y: 0.55 + Math.random()*0.4, r: 0.16 + Math.random()*0.22,
  sp: (0.004 + Math.random()*0.012) * (Math.random() < 0.5 ? -1 : 1), ph: Math.random()*9,
}));
function drawFog(now){
  if (!S.settings.fx) return;
  const col = biomeOf(S.wave).mote, t = now/1000;
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (const f of FOG){
    const x = ((((f.x + f.sp*t) % 1) + 1) % 1) * view.w, y = f.y*view.h, r = f.r*view.w;
    ctx.globalAlpha = 0.035 + 0.025 * Math.sin(t*0.5 + f.ph);
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r*2, r*2);
  }
  ctx.restore();
}
function drawAtmosphere(now){
  const tint = biomeOf(S.wave).tint;
  if (tint){ ctx.save(); ctx.globalAlpha = 0.07; ctx.fillStyle = tint; ctx.fillRect(0, 0, view.w, view.h); ctx.restore(); }
  const vg = ctx.createRadialGradient(view.w/2, view.h*0.52, view.h*0.30, view.w/2, view.h*0.52, view.h*0.90);
  vg.addColorStop(0, 'transparent'); vg.addColorStop(1, 'rgba(0,0,0,0.38)');
  ctx.save(); ctx.fillStyle = vg; ctx.fillRect(0, 0, view.w, view.h); ctx.restore();
}

// Translucent energy dome over the Crystal — colour + flicker track its HP
// (green → amber → red), and a low shield stutters like it's failing.
function drawCrystalShield(cx, groundY, towerH, now){
  const hp = Math.max(0, Math.min(1, S.crystalHp));
  const rx = towerH * 0.64, ry = towerH * 0.92, cy = groundY - towerH * 0.30;
  const rgb = hp > 0.5 ? '91,225,138' : hp > 0.25 ? '255,215,94' : '255,107,107';
  const pulse = 0.5 + 0.5 * Math.sin(now / 420);
  const glow = 0.08 + 0.08 * pulse + (1 - hp) * 0.05;
  ctx.save();
  ctx.beginPath(); ctx.rect(0, 0, view.w, groundY); ctx.clip();      // dome sits on the ground
  ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createRadialGradient(cx, cy, ry * 0.35, cx, cy, ry);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(0.8, `rgba(${rgb},${glow * 0.5})`);
  g.addColorStop(1, `rgba(${rgb},${glow * 1.6})`);
  ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
  let a = 0.30 + 0.25 * pulse;
  if (hp < 0.5 && Math.sin(now / 80) < -(1 - 2 * hp)) a *= 0.2;       // failing-shield stutter
  ctx.strokeStyle = `rgba(${rgb},${a})`; ctx.lineWidth = Math.max(1.5, towerH * 0.010);
  ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();
}

// Wave-clear flourish: a soft diagonal band of light sweeps across the screen.
function drawSweep(){
  if (sweepT <= 0) return;
  const p = 1 - sweepT / SWEEP_DUR;              // 0 → 1 sweep progress
  const cx = -0.3*view.w + p*1.6*view.w, bw = view.w*0.28;
  const g = ctx.createLinearGradient(cx - bw, 0, cx + bw, 0);
  const a = Math.sin(Math.min(1,p)*Math.PI) * 0.22;   // fade in/out
  g.addColorStop(0, 'rgba(255,255,255,0)');
  g.addColorStop(0.5, `rgba(210,240,255,${a})`);
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = g; ctx.fillRect(0, 0, view.w, view.h); ctx.restore();
}
function drawBossIntro(now){
  if (bossIntroT <= 0) return;
  const t = bossIntroT / BOSS_INTRO_DUR, s = view.h / 460, rgb = bossIntroRGB;
  const fl = Math.max(0, (t - 0.7) / 0.3);                 // opening colour flash
  if (fl > 0){ ctx.save(); ctx.globalAlpha = 0.5 * fl; ctx.fillStyle = `rgb(${rgb})`; ctx.fillRect(0, 0, view.w, view.h); ctx.restore(); }
  const alpha = Math.min(Math.min(1, (1 - t) * 4), Math.min(1, t * 4));   // fade in then out
  const bh = 46 * s, y = view.h / 2 - bh / 2;
  ctx.save();
  ctx.globalAlpha = alpha * 0.55; ctx.fillStyle = '#05060f'; ctx.fillRect(0, y, view.w, bh);
  ctx.globalAlpha = alpha; ctx.fillStyle = `rgb(${rgb})`;
  ctx.fillRect(0, y, view.w, 2); ctx.fillRect(0, y + bh - 2, view.w, 2);
  ctx.textAlign = 'center';
  ctx.font = `bold ${Math.round(11 * s)}px system-ui`;
  ctx.fillText('⚔  BOSS APPROACHING  ⚔', view.w / 2, y + 14 * s);
  ctx.font = `900 ${Math.round(26 * s)}px system-ui`;
  ctx.shadowColor = `rgb(${rgb})`; ctx.shadowBlur = 18; ctx.fillStyle = '#fff';
  ctx.fillText(bossIntroName, view.w / 2, y + 38 * s);
  ctx.restore();
}

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
  drawFog(now);                                     // parallax fog depth (drifts at varied speeds)
  drawMotes(now);                                   // ambient drifting light motes (behind characters)

  // crystal tower — static; the 4 frames are burning states chosen by remaining
  // HP: 100% = no fire, 70% = small, 30% = medium, 10% = big fire. size per user edit
  const towerH = size * 60;
  const hp = S.crystalHp;
  const towerFrame = hp >= 0.70 ? 0 : hp >= 0.30 ? 1 : hp >= 0.10 ? 2 : 3;
  const drewTower = window.Sheets && Sheets.draw(ctx, 'tower', view.crystalX, view.ground, towerH, 'idle', towerFrame * 1000);
  if (drewTower){
    // animate the burning tower's fire (more intense as HP drops).
    // At full HP the crystal wears a calm BLUE aether flame instead.
    if (hp >= 0.995) drawTowerFire(view.crystalX, view.ground - towerH, towerH, 1, now, true);
    else drawTowerFire(view.crystalX, view.ground - towerH, towerH, towerFrame, now);
  } else if (!sheetPending('tower')){        // skip low-res fallback while the HD sheet is still loading
    const pulse = 0.5 + 0.5*Math.sin(now/500);
    if (Spr().drawCrystal) Spr().drawCrystal(ctx, view.crystalX, view.ground - size*10, size*3, pulse, S.crystalHp);
    else { ctx.fillStyle = `rgba(123,211,255,${0.5+0.4*pulse})`; ctx.fillRect(view.crystalX-14, view.ground-70, 28, 44); }
  }
  drawCrystalShield(view.crystalX, view.ground, towerH, now);

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
    // airborne lift (fly = fraction of sprite height; float = small hover).
    // Flyers ride a wave: phase follows x so the path undulates as they travel.
    const floatOff = t.fly ? (th*t.fly + Math.sin(now/650 + e.x*0.045)*th*0.18
                                       + Math.sin(now/240 + e.x*0.11)*th*0.05)
                   : (t.float ? (10 + Math.sin(now/300)*4) : 0);
    if (window.Sheets && sid){
      let ax = e.x, aby = e.y - floatOff, ath = th;
      by = aby;                                   // keep hp-bar / overlays with the sprite
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
    if (!drew && !sheetPending(sid)){        // skip low-res fallback while the HD sheet is still loading
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
    if (e.golden && Number.isFinite(e.x)){
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const gy = by - spH*0.5, gr = spH*0.72, a = 0.22 + 0.10*Math.sin(now/120 + e.x);
      const gg = ctx.createRadialGradient(e.x, gy, 0, e.x, gy, gr);   // soft round glow (no square edges)
      gg.addColorStop(0, `rgba(255,225,77,${a})`);
      gg.addColorStop(0.6, `rgba(255,215,94,${a*0.5})`);
      gg.addColorStop(1, 'rgba(255,215,94,0)');
      ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(e.x, gy, gr, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#fff6c0'; ctx.globalAlpha = 0.9;               // orbiting sparkles
      for (let k = 0; k < 3; k++){ const aa = now/200 + k*2.1;
        ctx.fillRect(e.x + Math.cos(aa)*ow*0.5 - 1, by - spH*0.5 + Math.sin(aa)*spH*0.4 - 1, 3, 3); }
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
    if (!drewSheet && !sheetPending(slot.def.id)){    // skip low-res fallback while the HD sheet is still loading
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
  drawAtmosphere(now);                               // biome colour grade + vignette (under HUD/floaters)
  drawWeather(now);                                  // biome weather: snow / ash / rain / …

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

  drawSweep();                 // wave-clear light sweep
  drawBossIntro(now);          // boss entrance flash + name banner (on top)
  if (_shk) ctx.restore();     // end screen-shake transform
}

// ------------------------------------------------------------------ loop
let lastT = performance.now();
let acc = 0;
const CATCHUP_MAX = 25;   // seconds of real time to live-simulate in one go; beyond → fast estimate
// Consume `dt` seconds of real time so no progress is lost when the frame loop
// was throttled or paused (minimised / backgrounded window). Big gaps use the
// offline estimator; smaller ones are stepped live in fixed slices.
function catchUp(dt){
  if (dt <= 0) return;
  if (dt > CATCHUP_MAX){ runOfflineSim(dt); return; }
  let rem = dt;
  while (rem > 1e-3){ const s = Math.min(rem, 0.1); simulate(s * gameSpeed()); rem -= s; }
}
let simHold = false;   // true while the revive offer is open (sim frozen)
const adPaused = () => simHold || (window.Ads && Ads.isBusy());
function frame(now){
  let dt = (now - lastT) / 1000;
  lastT = now;
  if (dt < 0) dt = 0;
  if (adPaused()){ draw(now); updateHud(); requestAnimationFrame(frame); return; }
  if (bossIntroT > 0) bossIntroT = Math.max(0, bossIntroT - dt);   // real-time countdown
  if (dt > 0.25){
    catchUp(dt);                                                    // fell behind → don't drop the time
  } else {
    simulate(dt * gameSpeed() * (bossIntroT > 0 ? 0.35 : 1));       // dramatic slow entry when a boss lands
  }
  draw(now);
  acc += dt;
  if (acc > 5){ acc = 0; save(); }
  updateHud();
  requestAnimationFrame(frame);
}
// Background driver: keeps the sim advancing while the window is minimised or
// hidden and requestAnimationFrame is paused/throttled. Fires ~1×/s (browsers
// throttle it when hidden, but it still ticks); each tick advances the real
// elapsed time and saves periodically.
let bgSaveAcc = 0;
setInterval(() => {
  if (!S) return;
  const nowP = performance.now(), behind = (nowP - lastT) / 1000;
  if (adPaused()){ lastT = nowP; return; }        // ad break / revive offer → hold the clock
  if (!document.hidden && behind < 1.2) return;   // rAF is driving; nothing to do
  lastT = nowP;
  if (bossIntroT > 0) bossIntroT = Math.max(0, bossIntroT - behind);
  catchUp(behind);
  bgSaveAcc += behind;
  if (bgSaveAcc > 15){ bgSaveAcc = 0; save(); }
}, 1000);

// ------------------------------------------------------------------ HUD / UI
const el = id => document.getElementById(id);
function updateHud(){
  const bb = el('btnBoost');
  if (bb){
    const left = ((S.adBoostUntil || 0) - Date.now()) / 60000;
    bb.textContent = left > 0 ? tf('ad.boost.left', { m: Math.ceil(left) }) : t('ad.boost.btn');
    bb.classList.toggle('sel', left > 0);
  }
  // overdrive gauge button
  const ob = el('odBtn');
  if (ob){
    const pct = odActive() ? odT/OD_DUR : odCharge;
    el('odFill').style.width = Math.round(pct*100) + '%';
    el('odTxt').textContent = odActive() ? odT.toFixed(1)+'s' : Math.round(odCharge*100)+'%';
    ob.classList.toggle('ready', !odActive() && odCharge >= 1);
    ob.classList.toggle('active', odActive());
  }
  const kb = el('btnKeystone');
  if (kb){
    const unlocked = keystonesUnlocked();
    kb.classList.toggle('locked', !unlocked);
    kb.textContent = unlocked ? t('btn.keystone') : t('btn.keystoneLocked');
  }
  el('s-wave').textContent = dispStage(S.wave) + '-' + waveInStage(S.wave);
  el('s-gold').textContent = fmt(S.gold);
  el('s-shard').textContent = fmt(S.shards);
  if (el('s-tp')) el('s-tp').textContent = fmt(S.talentPoints);
  // Crystal HP — bar (graph) + numbers
  const hpFrac = Math.max(0, Math.min(1, S.crystalHp));
  const hpMax = Math.round(crystalMaxHp());
  const hpCur = Math.max(0, Math.ceil(hpFrac * hpMax));
  el('s-crystal').textContent = Math.round(hpFrac*100) + '%';
  const fill = el('s-crystal-fill');
  if (fill){
    fill.style.width = (hpFrac*100) + '%';
    const col = hpFrac > 0.5 ? 'linear-gradient(90deg,#3fbf6f,#57e18a)'
              : hpFrac > 0.25 ? 'linear-gradient(90deg,#e0a72e,#ffd75e)'
              : 'linear-gradient(90deg,#c0392b,#ff6b6b)';
    fill.style.background = col;
  }
  if (el('s-crystal-num')) el('s-crystal-num').textContent = hpCur + '/' + hpMax;
  el('btnPrestige').disabled = prestigeShards(S.totalGoldEarned) <= S.shardsEarned;
  for (const def of HERO_DEFS){
    const btn = el('buy-'+def.id);
    if (btn){
      const lvl = S.heroLevels[def.id];
      const aff = bulkBuyPlan(def);
      const showN = aff.count > 0 ? aff.count : 1;
      const showCost = aff.count > 0 ? aff.cost : heroCost(def, lvl);
      const verb = lvl === 0 ? t('hero.recruit') : (S.buyMode === 1 ? t('hero.upgrade') : `${t('hero.upgrade')} ×${showN}`);
      // update in place (stable DOM) so a rebuild never cancels an in-flight tap
      const vEl = btn.querySelector('.buy-verb'), cEl = btn.querySelector('.buy-cost');
      if (vEl && vEl.textContent !== verb) vEl.textContent = verb;
      const costTxt = '🪙 ' + fmt(showCost);
      if (cEl && cEl.textContent !== costTxt) cEl.textContent = costTxt;
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
      card.innerHTML = `<div class="lock-tag">🔒 ${def.name}<br>${tf('hero.unlock',{n:dispStage(def.unlockWave)})}</div>`;
      panel.appendChild(card);
      continue;
    }
    const dmgTxt = def.target==='support' ? `+${(3*lvl).toFixed(0)}% aura / heal`
                 : `${fmt(heroDmg(def,lvl)*globalDmgMul())} dmg`;
    const aff = bulkBuyPlan(def);                       // levels affordable right now
    const showN = aff.count > 0 ? aff.count : 1;
    const showCost = aff.count > 0 ? aff.cost : heroCost(def, lvl);
    const verb = lvl === 0 ? t('hero.recruit') : (S.buyMode === 1 ? t('hero.upgrade') : `${t('hero.upgrade')} ×${showN}`);
    card.innerHTML = `
      <h3><span style="color:${def.color}">◆</span> ${def.name}</h3>
      <div class="role">${L(def,'role')}</div>
      <div class="stat-row"><span>${t('lbl.level')}</span><b id="lv-${def.id}">${lvl}</b></div>
      <div class="stat-row"><span>${def.target==='support'?t('lbl.support'):t('lbl.power')}</span><b id="dmg-${def.id}">${dmgTxt}</b></div>
      <div class="skill-row" title="Auto-cast area skill">${def.skill.icon} ${def.skill.name}</div>
      <div class="cd-bar"><div class="cd-fill" id="cd-${def.id}" style="background:${def.color}"></div></div>
      <button class="buy" id="buy-${def.id}" ${aff.count>0?'':'disabled'}>
        <span class="buy-verb">${verb}</span> <small class="buy-cost">🪙 ${fmt(showCost)}</small>
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
  const label = `${t('lbl.stage')} ${dispStage(w)} · ${t('lbl.wave')} ${waveInStage(w)}/${STAGE_WAVES}`;
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
function closeModal(){
  el('modal').classList.remove('show'); el('modalBox').classList.remove('wide','racebig');
  if (unlockQueue.length) setTimeout(flushUnlockPopup, 80);   // show any queued unlock popup next
}
el('modal').addEventListener('click', e => { if (e.target.id === 'modal') closeModal(); });

function doPrestige(){
  const gain = prestigeShards(S.totalGoldEarned) - S.shardsEarned;
  if (gain <= 0){ toast(t('pr.notyet')); return; }
  openModal(`
    <h2>${t('pr.title')}</h2>
    <p>${t('pr.d1')}</p>
    <p>${tf('pr.d2',{g:gain, h:S.shards + gain})}</p>
    <div style="display:flex;gap:8px;margin-top:14px">
      <button class="btn prestige" id="confPrestige" style="flex:1">${t('pr.go')}</button>
      <button class="btn" id="cancPrestige" style="flex:1">${t('cancel')}</button>
    </div>`);
  el('confPrestige').onclick = () => {
    const shardBonus = Math.floor(gain * raceBonus('shardGain'));   // race shard bonus (Celestial Ascension)
    if (shardBonus > 0) toast(`💠 Race bonus: +${shardBonus} shards`);
    const keep = {
      shards: S.shards + gain + shardBonus, shardsEarned: S.shardsEarned + gain,
      shardUpg: S.shardUpg, totalGoldEarned: S.totalGoldEarned,
      bestWave: S.bestWave, totalKills: S.totalKills, goldenKills: S.goldenKills,
      prestiges: S.prestiges + 1, achievements: S.achievements,
      talents: S.talents, talentPoints: S.talentPoints + 2,   // +2 TP per reseal
      relics: S.relics, equipped: S.equipped, relicSeq: S.relicSeq,
      kills: S.kills, bestCombo: S.bestCombo,                 // lifetime records
      autoUp: S.autoUp, seenIntro: S.seenIntro,               // keep QoL/tutorial flags
      keystones: S.keystones,                                 // keep the build choice(s)
      race: S.race, raceTree: S.raceTree,                     // keep race + its tech tree
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
      <div class="info"><b>${u.name}</b> — ${L(u,'desc')}
        <div class="lv">Lv ${lvl}/${u.max} · ${t('lbl.now')} ${u.fmt(lvl)}</div></div>
      <button class="btn" data-up="${u.id}" ${maxed||S.shards<cost?'disabled':''}>${maxed?'MAX':'💠 '+cost}</button>
    </div>`;
  }).join('');
  // Convert shards into Talent Points (100 💠 → 1 🌳)
  const tpAfford = S.shards >= TP_SHARD_COST;
  const tpRow = `<div class="shard-item">
      <div class="info"><b>🌳 ${t('shop.tp')}</b> — ${t('shop.tp.d')}
        <div class="lv">${TP_SHARD_COST}💠 → 1🌳 · ${t('shop.have')} ${S.talentPoints}🌳</div></div>
      <button class="btn" id="buyTp" ${tpAfford?'':'disabled'}>💠 ${TP_SHARD_COST}</button>
    </div>`;
  openModal(`
    <h2>${t('btn.shop')}</h2>
    <p>${tf('shop.desc',{n:S.shards})}</p>
    <div class="shard-shop">${rows}</div>
    <div class="branch-title">🌳 ${t('shop.convert')}</div>
    ${tpRow}
    <button class="btn" id="closeShop" style="width:100%;margin-top:8px">${t('set.close')}</button>`);
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
  el('buyTp').onclick = () => {
    if (S.shards < TP_SHARD_COST) return;
    S.shards -= TP_SHARD_COST; S.talentPoints += 1; GA('prestige');
    toast(`🌳 +1 TP (−${TP_SHARD_COST}💠)`);
    save(); openShardShop(); updateHud();
  };
}
const TP_SHARD_COST = 100;   // shards to buy one Talent Point

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
    <h2>${t('off.title')}</h2>
    <p>${tf('off.desc',{t:fmtDur(r.seconds)})}</p>
    <div style="display:flex;gap:10px;justify-content:center;margin:16px 0;text-align:center">
      <div style="flex:1"><div style="font-size:22px">🌊 <b style="color:var(--accent)">+${r.waves}</b></div><div style="font-size:11px;color:var(--muted)">${t('off.waves')}</div></div>
      <div style="flex:1"><div style="font-size:22px">🪙 <b style="color:var(--gold)">+${fmt(r.gold)}</b></div><div style="font-size:11px;color:var(--muted)">${t('off.gold')}</div></div>
    </div>
    ${r.gold > 0 && window.Ads ? `<button class="btn" id="collectOff2" style="width:100%;margin-bottom:8px;background:linear-gradient(#3a2f12,#26200e);border-color:#ffd75e;color:#ffd75e">${t('ad.off2')}</button>` : ''}
    <button class="btn" id="collectOff" style="width:100%">${t('off.collect')}</button>`);
  el('collectOff').onclick = closeModal;
  if (el('collectOff2')) el('collectOff2').onclick = () => Ads.rewarded(ok => {
    if (ok){ S.gold += r.gold; S.totalGoldEarned += r.gold; toast(tf('ad.off2.done', { g: fmt(r.gold) })); GA('prestige'); save(); updateHud(); }
    else toast(t('ad.fail'));
    closeModal();
  });
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
    <h2>${t('intro.title')}</h2>
    <p>${t('intro.p1')}</p>
    <p style="margin-top:10px">${t('intro.p2')}</p>
    <button class="btn" id="introOk" style="width:100%;margin-top:12px">${t('intro.btn')}</button>`);
  el('introOk').onclick = () => { S.seenIntro = true; save(); closeModal(); };
}

// Catch up when a backgrounded tab regains focus (rAF is paused while hidden).
// The background driver + frame catch-up keep progress running while hidden, so
// here we only persist on the way out and refresh the panel on the way back.
document.addEventListener('visibilitychange', () => {
  if (document.hidden){ save(); return; }
  buildHeroPanel(); updateHud();
});

// ------------------------------------------------------------------ wiring
el('btnPrestige').onclick = doPrestige;
el('btnShop').onclick = openShardShop;
// ---- Save slots: up to 5 named saves you can store into and load from.
// The game still autosaves continuously to SAVE_KEY; slots are explicit copies.
const SLOT_COUNT = 5;
const SLOT_KEY = n => 'aether_crystal_slot_' + n;
function slotInfo(n){
  try{
    const raw = localStorage.getItem(SLOT_KEY(n));
    if (!raw) return null;
    const d = JSON.parse(raw);
    return { best:d.bestWave||1, wave:d.wave||1, prestiges:d.prestiges||0,
             gold:d.totalGoldEarned||0, savedAt:d.savedAt||0 };
  }catch(e){ return null; }
}
function writeSlot(n){
  try{ localStorage.setItem(SLOT_KEY(n), JSON.stringify(Object.assign({}, S, { savedAt: Date.now() }))); return true; }
  catch(e){ return false; }
}
function loadSlot(n){
  const raw = localStorage.getItem(SLOT_KEY(n));
  if (!raw) return;
  skipSave = true;                         // stop autosave/beforeunload clobbering during reload
  try{ localStorage.setItem(SAVE_KEY, raw); }catch(e){}
  location.reload();                       // clean boot loads the slot as the active game
}
function saveAgo(ts){
  if (!ts) return '';
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return t('ago.now');
  if (s < 3600) return tf('ago.m',{n:Math.floor(s/60)});
  if (s < 86400) return tf('ago.h',{n:Math.floor(s/3600)});
  return tf('ago.d',{n:Math.floor(s/86400)});
}
let savePending = null;                    // {act:'load'|'overwrite'|'delete', slot}
function openSaves(){
  let head = '';
  if (savePending){
    const { act, slot } = savePending;
    const label = act === 'load' ? tf('sv.loadQ',{n:slot})
      : act === 'overwrite' ? tf('sv.overQ',{n:slot})
      : tf('sv.delQ',{n:slot});
    const danger = act !== 'overwrite';
    head = `<div class="save-confirm"><p style="margin:0 0 8px">${label}</p>
      <div style="display:flex;gap:8px">
        <button class="btn" id="saveYes" style="flex:1${danger?';background:var(--danger);border-color:var(--danger)':''}">${t('confirm')}</button>
        <button class="btn" id="saveNo" style="flex:1">${t('cancel')}</button></div></div>`;
  }
  const rows = [];
  for (let n = 1; n <= SLOT_COUNT; n++){
    const s = slotInfo(n);
    if (!s){
      rows.push(`<div class="shard-item"><div class="info"><b>${t('sv.slot')} ${n}</b>
        <div class="lv">${t('sv.empty')}</div></div>
        <button class="btn slot-save" data-n="${n}">${t('sv.save')}</button></div>`);
    } else {
      rows.push(`<div class="shard-item"><div class="info"><b>${t('sv.slot')} ${n}</b>
        <div class="lv">${t('lbl.stage')} ${dispStage(s.best)} · ${t('lbl.wave')} ${waveInStage(s.wave)}/${STAGE_WAVES} · 💠${s.prestiges} · ${saveAgo(s.savedAt)}</div></div>
        <div style="display:flex;gap:4px">
          <button class="btn slot-load" data-n="${n}">${t('sv.load')}</button>
          <button class="btn slot-save" data-n="${n}">💾</button>
          <button class="btn slot-del"  data-n="${n}">🗑</button></div></div>`);
    }
  }
  openModal(`<h2>${t('sv.title')}</h2>
    <p>${tf('sv.desc',{n:SLOT_COUNT})}</p>
    ${head}
    <div class="shard-shop">${rows.join('')}</div>
    <button class="btn" id="closeSaves" style="width:100%;margin-top:6px">${t('set.close')}</button>`);
  el('closeSaves').onclick = () => { savePending = null; closeModal(); };
  const box = el('modalBox');
  if (savePending){
    el('saveYes').onclick = () => {
      const { act, slot } = savePending; savePending = null;
      if (act === 'load'){ loadSlot(slot); return; }              // reloads the page
      if (act === 'overwrite'){ toast(writeSlot(slot) ? tf('sv.saved',{n:slot}) : t('sv.fail')); }
      else { try{ localStorage.removeItem(SLOT_KEY(slot)); }catch(e){} toast(tf('sv.deleted',{n:slot})); }
      openSaves();
    };
    el('saveNo').onclick = () => { savePending = null; openSaves(); };
  }
  box.querySelectorAll('.slot-save').forEach(b => b.onclick = () => {
    const n = +b.dataset.n;
    if (slotInfo(n)){ savePending = { act:'overwrite', slot:n }; openSaves(); }   // occupied → confirm
    else { toast(writeSlot(n) ? tf('sv.saved',{n}) : t('sv.fail')); openSaves(); }
  });
  box.querySelectorAll('.slot-load').forEach(b => b.onclick = () => { savePending = { act:'load',   slot:+b.dataset.n }; openSaves(); });
  box.querySelectorAll('.slot-del').forEach(b => b.onclick  = () => { savePending = { act:'delete', slot:+b.dataset.n }; openSaves(); });
}
if (el('btnSave')) el('btnSave').onclick = () => { savePending = null; openSaves(); };
// New Start — wipe the save and reload into a fresh game. skipSave stops the
// beforeunload handler from writing the current state back on the way out.
function confirmNewStart(){
  openModal(`<h2>${t('ns.title')}</h2>
    <p>${t('ns.desc')}</p>
    <div style="display:flex;gap:8px;margin-top:14px">
      <button class="btn" id="doNewStart" style="flex:1;background:var(--danger);border-color:var(--danger)">${t('ns.do')}</button>
      <button class="btn" id="noNewStart" style="flex:1">${t('cancel')}</button></div>`);
  el('doNewStart').onclick = () => {
    skipSave = true;                       // block any further writes (incl. beforeunload)
    try{ localStorage.removeItem(SAVE_KEY); }catch(e){}
    location.reload();
  };
  el('noNewStart').onclick = closeModal;
}
if (el('btnNewStart')) el('btnNewStart').onclick = confirmNewStart;

// ⚙️ Settings menu — collapses the utility buttons (Stats / Saves / New Start /
// Music / Mute / Display+Language) into one panel to declutter the control bar.
function openMenu(){
  const A = window.GameAudio;
  const musicOn = !!(A && A.isMusicOn && A.isMusicOn());
  const muted = !!(A && A.isMuted && A.isMuted());
  const row = (id, label, state) => `<button class="btn menu-item" id="${id}">${label}${state!=null?`<span class="mi-state">${state}</span>`:''}</button>`;
  openModal(`<h2>⚙️ ${t('menu.title')}</h2>
    <div class="menu-list">
      ${row('mStats',   t('btn.stats'))}
      ${row('mSaves',   t('btn.saves'))}
      ${row('mDisplay', t('menu.display'))}
      ${row('mMusic',   t('menu.music'), musicOn ? t('on') : t('off'))}
      ${row('mSound',   t('menu.sound'), muted ? t('off') : t('on'))}
      ${row('mNew',     t('btn.newstart'))}
    </div>
    <button class="btn" id="closeMenu" style="width:100%">${t('set.close')}</button>`);
  el('closeMenu').onclick = closeModal;
  el('mStats').onclick   = openStats;
  el('mSaves').onclick   = openSaves;
  el('mDisplay').onclick = openSettings;
  el('mNew').onclick     = confirmNewStart;
  el('mMusic').onclick = () => { const bm = el('btnMusic'); if (bm) bm.onclick(); openMenu(); };
  el('mSound').onclick = () => { const bt = el('btnMute'); if (bt) bt.onclick(); openMenu(); };
}
if (el('btnMenu')) el('btnMenu').onclick = openMenu;
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
    <h2>${t('st.title')}</h2>
    <div class="shard-shop">
      <div class="shard-item"><div class="info"><b>${t('st.cur')}</b><div class="lv">${t('lbl.stage')} ${dispStage(S.wave)} · ${t('lbl.wave')} ${waveInStage(S.wave)}/${STAGE_WAVES}</div></div></div>
      <div class="shard-item"><div class="info"><b>${t('st.best')}</b><div class="lv">${t('lbl.stage')} ${dispStage(S.bestWave)} · ${t('lbl.wave')} ${waveInStage(S.bestWave)}/${STAGE_WAVES}</div></div></div>
      <div class="shard-item"><div class="info"><b>${t('st.mile')}</b><div class="lv">${tf('st.mile.d',{n:dispStage(nextMilestone()), r:'💠'+(1 + Math.floor(nextMilestone()/100))+(nextMilestone()%100===0?' + 🌳1':'')})}</div></div></div>
      <div class="shard-item"><div class="info"><b>${t('st.kills')}</b><div class="lv">${fmt(S.totalKills)}</div></div></div>
      <div class="shard-item"><div class="info"><b>${t('st.gold')}</b><div class="lv">🪙 ${fmt(S.totalGoldEarned)}</div></div></div>
      <div class="shard-item"><div class="info"><b>${t('st.shards')}</b><div class="lv">💠 ${S.shardsEarned}</div></div></div>
      <div class="shard-item"><div class="info"><b>${t('st.crit')}</b><div class="lv">${Math.round(critChance()*100)}%</div></div></div>
      <div class="shard-item"><div class="info"><b>${t('st.combo')}</b><div class="lv">🔥 ${S.bestCombo}${t('st.streak')}</div></div></div>
    </div>
    <div class="branch-title">${t('st.chart')}</div>
    <canvas id="statChart" width="800" height="220"
      style="width:100%;height:110px;background:#0d1128;border:1px solid var(--line);border-radius:8px"></canvas>
    <button class="btn" id="closeStats" style="width:100%;margin-top:12px">${t('set.close')}</button>`);
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
    g.fillText(t('st.empty'), W/2, H/2);
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
        <div class="info"><b>${t.name}</b> — ${L(t,'desc')}
          <div class="lv">Lv ${lvl}/${t.max} · ${window.t('lbl.now')} ${t.fmt(lvl)}</div></div>
        <button class="btn" data-tal="${t.id}" ${afford?'':'disabled'}>${maxed?'MAX':'🌳 '+t.cost}</button>
      </div>`;
    }).join('');
    return `<div class="branch-title">${trBranch(b)}</div>${rows}`;
  }).join('');
  openModal(`
    <h2>${t('tal.title')}</h2>
    <p>${tf('tal.desc',{n:S.talentPoints})}</p>
    <div class="shard-shop">${body}</div>
    <button class="btn" id="closeTal" style="width:100%">${t('set.close')}</button>`);
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

// Race panel — pick a race (once), then spend Talent Points on its tech tree.
function pickRace(id){
  if (!RACES[id] || raceValid()) return;          // raceValid guards a stale/old race id too
  S.race = id; S.raceTree = {};
  GA('prestige'); spawnParticles(view.w/2, view.h*0.4, 'holy', 2.2);
  toast(`${RACES[id].icon} You are now ${RACES[id].name}!`);
  save(); openRace(); updateHud();
}
let raceSel = null;   // focused tree node id (for the radial UI)
function buyRaceNode(nid){
  const n = raceNodes().find(x => x.id === nid); if (!n) return;
  const lvl = raceLvl(nid);
  if (raceNodeLocked(n) || lvl >= n.max || S.talentPoints < n.cost) return;
  S.talentPoints -= n.cost;
  S.raceTree[nid] = lvl + 1;
  GA('upgrade'); save(); openRace(); updateHud();
}
const RACE_RESPEC_COST = 3;   // shards to switch race (refunds all race-tree TP)
function respecRace(){
  if (!S.race || S.shards < RACE_RESPEC_COST) return;
  let refund = 0;
  for (const n of raceNodes()) refund += raceLvl(n.id) * n.cost;   // give back everything spent
  S.talentPoints += refund; S.shards -= RACE_RESPEC_COST;
  S.race = null; S.raceTree = {};
  toast(`🔄 Race reset — refunded ${refund}🌳 (−${RACE_RESPEC_COST}💠)`);
  GA('prestige'); save(); openRace(); updateHud();
}
function openRace(){
  if (!raceUnlocked()){
    openModal(`<h2>${t('race.asc')}</h2>
      <div class="ks-lock"><div class="ks-lock-ic">🔒</div>
        <div class="ks-lock-msg">${tf('race.lockmsg',{n:RACE_STAGE})}</div>
        <div class="ks-lock-sub">${tf('race.locksub',{n:dispStage(S.bestWave)})}</div></div>
      <button class="btn" id="closeRace" style="width:100%;margin-top:12px">${t('set.close')}</button>`);
    el('modalBox').classList.add('racebig');
    el('closeRace').onclick = closeModal; return;
  }
  if (!raceValid()){                              // no race yet (or stale id) → picker
    const cards = Object.entries(RACES).map(([id, r]) => `
      <div class="ks" style="--kc:${r.color}" data-race="${id}">
        <span class="ks-ic">${r.icon}</span>
        <div class="ks-info"><div class="ks-nm">${r.name} · ${Ld(id,'tag',r.tag)}</div>
          <div class="ks-desc">${Ld(id,'desc',r.desc)}<br><span style="opacity:.8">${t('race.tree')} ${r.nodes.map(n=>n.name).join(' · ')}</span></div></div>
      </div>`).join('');
    openModal(`<h2>${t('race.choose')}</h2>
      <p>${t('race.choose.d')}</p>
      <div class="ks-list">${cards}</div>
      <button class="btn" id="closeRace" style="width:100%;margin-top:8px">${t('race.later')}</button>`);
    el('modalBox').classList.add('racebig');
    el('closeRace').onclick = closeModal;
    el('modalBox').querySelectorAll('[data-race]').forEach(n => n.onclick = () => {
      const id = n.dataset.race;
      openModal(`<h2>${RACES[id].icon} ${tf('race.become',{n:RACES[id].name})}</h2>
        <p>${Ld(id,'desc',RACES[id].desc)}<br><br>${t('race.permanent')}</p>
        <div style="display:flex;gap:8px;margin-top:12px">
          <button class="btn" id="raceYes" style="flex:1;background:${RACES[id].color};border-color:${RACES[id].color};color:#111">${t('confirm')}</button>
          <button class="btn" id="raceNo" style="flex:1">${t('back')}</button></div>`);
      el('raceYes').onclick = () => pickRace(id);
      el('raceNo').onclick = openRace;
    });
    return;
  }
  // ---- radial hex tree ----
  const r = RACES[S.race];
  if (!r.nodes.some(n => n.id === raceSel)) raceSel = null;
  const C = 180, DEG = Math.PI/180, RING_R = { 1:54, 2:98, 3:144 };   // per-ring radius (spaced so hexes never overlap)
  const pos = n => { const R = RING_R[n.ring || 1]; return { x: C + R*Math.cos(n.ang*DEG), y: C + R*Math.sin(n.ang*DEG) }; };
  const byId = id => r.nodes.find(n => n.id === id);
  // connectors: ring-1 nodes link to the centre; gated (outer) nodes link to their prerequisite
  const lines = r.nodes.map(n => {
    const p = pos(n);
    if (!n.req) return `<line x1="${C}" y1="${C}" x2="${p.x}" y2="${p.y}" class="rt-link ${raceLvl(n.id)>0?'on':''}"/>`;
    const q = pos(byId(n.req.id));
    return `<line x1="${q.x}" y1="${q.y}" x2="${p.x}" y2="${p.y}" class="rt-link ${raceNodeLocked(n)?'':'on'}" stroke-dasharray="4 3"/>`;
  }).join('');
  const nodes = r.nodes.map(n => {
    const p = pos(n), lvl = raceLvl(n.id), maxed = lvl>=n.max, locked = raceNodeLocked(n);
    const cls = ['rt-node', n.cap?'rt-cap':'', lvl>0?'has':'', maxed?'max':'', locked?'locked':'', raceSel===n.id?'sel':''].join(' ');
    return `<div class="${cls}" style="left:${p.x/3.6}%;top:${p.y/3.6}%;--rc:${r.color}" data-rn="${n.id}">
      <div class="rt-hex"></div><span class="rt-ic">${locked?'🔒':n.icon}</span>
      <span class="rt-badge">${lvl}${maxed?'':'/'+n.max}</span></div>`;
  }).join('');
  // info panel for the focused node
  const sel = raceSel && byId(raceSel);
  let info;
  if (sel){
    const lvl = raceLvl(sel.id), maxed = lvl>=sel.max, locked = raceNodeLocked(sel);
    const canBuy = !locked && !maxed && S.talentPoints >= sel.cost;
    info = `<div class="rt-info"><div><b>${sel.name}</b> <span style="color:var(--muted)">Lv ${lvl}/${sel.max}</span>
        <div style="font-size:13.5px;color:var(--muted)">${locked?`🔒 <b>${byId(sel.req.id).name}</b> Lv ${sel.req.lv} ${t('race.req')}`:L(sel,'desc')}</div></div>
      <button class="btn" id="rtBuy" ${canBuy?'':'disabled'} style="min-width:96px;font-size:14px">${maxed?'MAX':(locked?t('race.lockedbtn'):'🌳 '+sel.cost)}</button></div>`;
  } else {
    info = `<div class="rt-info" style="color:var(--muted);justify-content:center">${t('race.tap')}</div>`;
  }
  openModal(`<h2>${r.icon} ${r.name} <span style="font-size:13px;color:var(--muted)">· ${Ld(S.race,'tag',r.tag)}</span></h2>
    <p style="margin:0 0 4px">${tf('race.spend',{n:S.talentPoints})}</p>
    <div class="racetree">
      <svg class="rt-links" viewBox="0 0 360 360" preserveAspectRatio="xMidYMid meet">${lines}</svg>
      <div class="rt-center" style="--rc:${r.color}"><span style="font-size:28px">${r.icon}</span><span style="font-size:11px">${r.name}</span></div>
      ${nodes}
    </div>
    ${info}
    <button class="btn" id="respecRace" ${S.shards>=RACE_RESPEC_COST?'':'disabled'}
      style="width:100%;margin-top:8px;background:#2c1a3a;border-color:#7a3cc0;color:#e0c6ff">${tf('race.change',{c:RACE_RESPEC_COST})}</button>
    <button class="btn" id="closeRace" style="width:100%;margin-top:6px">${t('set.close')}</button>`);
  el('modalBox').classList.add('racebig');
  el('closeRace').onclick = () => { raceSel = null; closeModal(); };
  el('modalBox').querySelectorAll('[data-rn]').forEach(nd => nd.onclick = () => { raceSel = nd.dataset.rn; openRace(); });
  if (el('rtBuy')) el('rtBuy').onclick = () => buyRaceNode(raceSel);
  el('respecRace').onclick = () => {
    openModal(`<h2>${t('race.changeQ')}</h2>
      <p>${tf('race.change.d',{c:RACE_RESPEC_COST})}</p>
      <div style="display:flex;gap:8px;margin-top:12px">
        <button class="btn" id="ryes" style="flex:1;background:#7a3cc0;border-color:#7a3cc0">${t('confirm')}</button>
        <button class="btn" id="rno" style="flex:1">${t('back')}</button></div>`);
    el('ryes').onclick = respecRace;
    el('rno').onclick = openRace;
  };
}
if (el('btnRace')) el('btnRace').onclick = openRace;

// Keystone panel — pick ONE build-defining perk (mutually exclusive).
// From Stage 10 the keystones unlock one at a time, one per stage
// (Stage 10 → 1st, Stage 11 → 2nd, … Stage 14 → 5th), so the choice pool
// grows as you climb. You still keep only one active at a time.
const KEYSTONE_STAGE = 10;
const KEYSTONE_IDS = Object.keys(KEYSTONES);
const keystoneStage = id => KEYSTONE_STAGE + KEYSTONE_IDS.indexOf(id);      // stage this keystone unlocks at
const keystoneAvail = id => dispStage(S.bestWave) >= keystoneStage(id);     // is it selectable yet?
const keystonesUnlocked = () => dispStage(S.bestWave) >= KEYSTONE_STAGE;    // at least the first is available
const allKeystonesOpen = () => KEYSTONE_IDS.every(keystoneAvail);           // every keystone unlocked?
const keystoneCap = () => allKeystonesOpen() ? KEYSTONE_IDS.length : 1;     // multi-select once all are open
function pickKeystone(id){
  if (!keystoneAvail(id)) return;
  const arr = S.keystones, i = arr.indexOf(id);
  if (i >= 0){ arr.splice(i, 1); }                 // tap active one to clear
  else if (keystoneCap() === 1){ S.keystones = [id]; }   // single-select: replace
  else arr.push(id);                               // multi-select: add another
  GA('upgrade'); save(); openKeystones(); updateHud();
}
function openKeystones(){
  if (!keystonesUnlocked()){
    openModal(`
      <h2>${t('btn.keystone')}</h2>
      <div class="ks-lock">
        <div class="ks-lock-ic">🔒</div>
        <div class="ks-lock-msg">${tf('ks.lockmsg',{n:KEYSTONE_STAGE})}</div>
        <div class="ks-lock-sub">${tf('ks.locksub',{s:dispStage(S.bestWave), w:waveInStage(S.bestWave), z:STAGE_WAVES})}</div>
      </div>
      <button class="btn" id="closeKs" style="width:100%;margin-top:12px">${t('set.close')}</button>`);
    el('closeKs').onclick = closeModal;
    return;
  }
  const availN = KEYSTONE_IDS.filter(keystoneAvail).length;
  const rows = Object.entries(KEYSTONES).map(([id, k]) => {
    if (!keystoneAvail(id)){                        // still locked — greyed, not clickable
      return `<div class="ks ks-locked" style="--kc:${k.color}">
        <span class="ks-ic">🔒</span>
        <div class="ks-info"><div class="ks-nm">${k.name}</div>
          <div class="ks-desc">${tf('ks.unlockat',{n:keystoneStage(id)})}</div></div>
      </div>`;
    }
    const on = S.keystones.includes(id);
    return `<div class="ks ${on?'on':''}" style="--kc:${k.color}" data-ks="${id}">
      <span class="ks-ic">${k.icon}</span>
      <div class="ks-info"><div class="ks-nm">${k.name}${on?' · '+t('ks.active'):''}</div>
        <div class="ks-desc">${Ld(id,'desc',k.desc)}</div></div>
    </div>`;
  }).join('');
  const multi = allKeystonesOpen();
  const intro = multi
    ? tf('ks.multi',{n:S.keystones.length})
    : tf('ks.single',{s:KEYSTONE_STAGE, a:availN, t:KEYSTONE_IDS.length});
  openModal(`
    <h2>${t('btn.keystone')}</h2>
    <p>${intro} ${t('ks.persist')}</p>
    <div class="ks-list">${rows}</div>
    <button class="btn" id="closeKs" style="width:100%;margin-top:12px">${t('set.close')}</button>`);
  el('closeKs').onclick = closeModal;
  el('modalBox').querySelectorAll('[data-ks]').forEach(n => n.onclick = () => pickKeystone(n.dataset.ks));
}
if (el('btnKeystone')) el('btnKeystone').onclick = openKeystones;

// Settings — display / performance toggles
const SETTING_DEFS = [
  { id:'dmgNums', k:'set.dmgNums' },
  { id:'fx',      k:'set.fx' },
  { id:'shake',   k:'set.shake' },
];
// Set the language, re-skin the persistent UI, and reopen the panel.
function setLang(id){ S.lang = id; save(); applyLang(); openSettings(); }
function openSettings(){
  const langBtns = LANG_DEFS.map(L => {
    const on = (S.lang || 'ko') === L.id;
    return `<button class="btn" data-lang="${L.id}" style="flex:1;${on?'background:var(--accent);border-color:var(--accent);color:#062':''}">${L.name}</button>`;
  }).join('');
  const rows = SETTING_DEFS.map(s => {
    const on = !!S.settings[s.id];
    return `<div class="shard-item">
      <div class="info"><b>${t(s.k)}</b> — ${t(s.k+'.d')}</div>
      <button class="btn" data-set="${s.id}" style="min-width:56px;${on?'background:var(--hp);border-color:var(--hp);color:#062':''}">${on?t('on'):t('off')}</button>
    </div>`;
  }).join('');
  openModal(`
    <h2>${t('set.title')}</h2>
    <div class="branch-title">🌐 ${t('set.lang')}</div>
    <div style="display:flex;gap:8px;margin:6px 0 4px">${langBtns}</div>
    <div class="shard-shop">${rows}</div>
    <button class="btn" id="closeSet" style="width:100%">${t('set.close')}</button>`);
  el('closeSet').onclick = closeModal;
  el('modalBox').querySelectorAll('[data-lang]').forEach(b => b.onclick = () => setLang(b.dataset.lang));
  el('modalBox').querySelectorAll('[data-set]').forEach(b => b.onclick = () => {
    S.settings[b.dataset.set] = !S.settings[b.dataset.set]; save(); openSettings();
  });
}
// Re-skin all persistent (non-modal) UI text for the current language.
function applyLang(){
  const map = { btnPrestige:'btn.prestige', btnShop:'btn.shop', btnTalents:'btn.talents', btnRace:'btn.race',
    btnAch:'btn.ach', btnBestiary:'btn.bestiary', btnRelics:'btn.relics', btnTower:'btn.fortify',
    btnStats:'btn.stats', btnSave:'btn.saves', btnNewStart:'btn.newstart', btnMenu:'btn.menu' };
  for (const id in map){ const e = el(id); if (e) e.textContent = t(map[id]); }
  const sp = el('lblSpeed'); if (sp) sp.textContent = t('lbl.speed');
  refreshAutoBtn(); refreshBuyModeBtn();
  if (S) buildHeroPanel();
}
if (el('btnSettings')) el('btnSettings').onclick = openSettings;

// Hero bulk-buy mode: cycle ×1 → ×10 → Max
const BUY_CYCLE = [1, 10, 'max'];
function refreshBuyModeBtn(){
  const b = el('btnBuyMode'); if (!b) return;
  b.textContent = t('btn.buy') + ' ' + (S.buyMode === 'max' ? t('buy.max') : '×' + S.buyMode);
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
      <div class="info"><b>${got?'🏆':'🔒'} ${a.name}</b> — ${Ld('ach_'+a.id,'desc',a.desc)}
        <div class="lv">${t('ach.reward')} ${reward}</div></div>
      <div class="lv">${got?t('ach.done'):''}</div>
    </div>`;
  }).join('');
  openModal(`
    <h2>${t('ach.title')} <span style="font-size:13px;color:var(--muted)">(${done}/${ACHIEVEMENTS.length})</span></h2>
    <p>${t('ach.desc')}</p>
    <div class="shard-shop">${rows}</div>
    <button class="btn" id="closeAch" style="width:100%">${t('set.close')}</button>`);
  el('closeAch').onclick = closeModal;
}
if (el('btnAch')) el('btnAch').onclick = openAchievements;

// ------------------------------------------------------------------ bestiary
// One codex entry per in-game monster sprite. Lore stats (LV/HP/MP/ELEMENT)
// styled like a classic RPG bestiary; portraits render the real sprite art.
const BESTIARY = [
  { bid:'bst_slime', sprite:'slime',      name:'Slime',            lv:1,  hp:10,  mp:2,  el:'EARTH',  fc:'#5aa03a',
    ability:'Splits into two minis when destroyed (Wave 15+)',
    lore:'A gelatinous crystal-eater. Slow, but they swarm the front line.' },
  { sprite:'zombie',     name:'Rotting Zombie',   lv:2,  hp:18,  mp:4,  el:'POISON', fc:'#6cbf3a',
    lore:'Reanimated fodder that leaves a toxic cloud when destroyed.' },
  { bid:'bst_skel', sprite:'skeleton',   name:'Skeleton Warrior', lv:3,  hp:45,  mp:10, el:'DARK',   fc:'#9a6bd0',
    ability:'Armoured; the Golem variant also carries a shield',
    lore:'Armoured bonelord. High HP — a proper tank of the horde.' },
  { bid:'bst_wraith', sprite:'specter',    name:'Wraith',           lv:4,  hp:26,  mp:12, el:'DARK',   fc:'#8f8be0',
    ability:'Immune to freeze', lore:'A floating shade, immune to frost and hard to pin down.' },
  { sprite:'dragon',     name:'Red Dragon',       lv:5,  hp:150, mp:30, el:'FIRE',   fc:'#e0632a', boss:true,
    lore:'Boss. Wreathed in flame; appears on the fifth-wave assaults.' },
  { sprite:'elderghost', name:'Elder Ghost',      lv:10, hp:300, mp:60, el:'VOID',   fc:'#a05ad0', boss:true,
    lore:'Boss. An ancient void-spirit that commands the darker waves.' },
  // later-stage variants — share a sprite but tinted by their element in the codex
  { bid:'bst_imp', sprite:'slime',    variant:true, tint:'#ff7a3c', name:'Ember Imp',   lv:6,  hp:8,  mp:3,  el:'FIRE',      fc:'#e0632a',
    ability:'Fast fiery slime — appears from Stage 5' },
  { bid:'bst_frost', sprite:'specter',  variant:true, tint:'#7bd3ff', name:'Frostkin',    lv:7,  hp:14, mp:8,  el:'FROST',     fc:'#5bc8ff',
    ability:'A chilling shade — appears from Stage 7' },
  { bid:'bst_venom', sprite:'zombie',   variant:true, tint:'#9be36a', name:'Venomspawn',  lv:9,  hp:16, mp:6,  el:'POISON',    fc:'#6cbf3a',
    ability:'A toxic brawler — appears from Stage 9' },
  { bid:'bst_shade', sprite:'specter',  variant:true, tint:'#c58bff', name:'Void Shade',  lv:11, hp:12, mp:14, el:'VOID',      fc:'#a05ad0',
    ability:'Very fast, immune to freeze — from Stage 11' },
  { bid:'bst_brute', sprite:'skeleton', variant:true, tint:'#cdd6f4', name:'Bone Brute',  lv:14, hp:60, mp:8,  el:'PHYSICAL',  fc:'#aab4d8',
    ability:'Armoured heavy — appears from Stage 14' },
  { bid:'bst_rev', sprite:'skeleton', variant:true, tint:'#ffe066', name:'Revenant',    lv:18, hp:52, mp:16, el:'LIGHTNING', fc:'#ffd75e',
    ability:'A charged skeleton — appears from Stage 18' },
  // Stage 15+ monsters with their own sprites
  { bid:'bst_harpy', sprite:'harpy',     name:'Harpy',     lv:15, hp:70,  mp:20, el:'LIGHTNING', fc:'#c9a24a',
    ability:'Swift storm flyer — appears from Stage 15',
    lore:'A winged predator that dives from above on howling winds. Fast and slippery.' },
  { bid:'bst_ogre', sprite:'ogre',      name:'Ogre',      lv:16, hp:155, mp:10, el:'EARTH',     fc:'#c39a6a',
    ability:'Club-swinging brute — appears from Stage 15',
    lore:'A hulking brute whose massive club shatters the front line.' },
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
    if (entry.tint && discovered){            // element tint so variants look distinct
      ctx2.save(); ctx2.globalCompositeOperation = 'source-atop';
      ctx2.globalAlpha = 0.45; ctx2.fillStyle = entry.tint;
      ctx2.fillRect(0, 0, W, H); ctx2.restore();
    }
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
    const elm = disc ? t('el.'+m.el.toLowerCase()) : '?????';
    const mm = ELEM_MATCH[m.el.toLowerCase()];
    const wr = disc && mm
      ? `<div class="wr">${t('bst.weak')} ${ELEM_ICON[mm.weak]||''}${t('el.'+mm.weak)} · ${t('bst.resist')} ${ELEM_ICON[mm.resist]||''}${t('el.'+mm.resist)}</div>`
      : '';
    const ab = disc && m.ability ? `<div class="ab">✦ ${Ld(m.bid,'desc',m.ability)}</div>` : '';
    return `
    <div class="mon-card${disc ? '' : ' locked'}" style="--fc:${m.fc}">
      <div class="mon-frame" style="--fc:${m.fc}">
        <canvas class="mon-portrait" width="220" height="130" data-i="${i}"></canvas>
        ${disc && !m.variant ? `<span class="mon-kills">☠ ${fmt(n)}</span>` : ''}
      </div>
      <div class="mon-plaque">
        <div class="nm">LV ${disc ? m.lv : '?'}&nbsp; ${nm}</div>
        <div class="st">HP: ${hp}&nbsp;&nbsp; MP: ${mp}</div>
        <div class="el">${t('bst.el')}: ${elm}</div>
        ${wr}
        ${ab}
      </div>
    </div>`;
  }).join('');
  openModal(`
    <div class="bestiary">
      <div class="bestiary-title">${t('bst.title')}</div>
      <div class="bestiary-sub">${t('bst.disc')} ${seen}/${BESTIARY.length} · ${t('bst.sub')}</div>
      <div class="bestiary-grid">${cards}</div>
      <button class="btn bestiary-close" id="closeBest">${t('set.close')}</button>
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
function relicRarityName(rel){ const r=RELIC_RARITY.find(r=>r.id===rel.rarity)||RELIC_RARITY[0]; return Ld(r.id,'name',r.name); }
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
// ---- Relic fusion (gacha): combine 3 of one rarity for a chance at the next.
// Higher rarities are riskier; on failure you keep just one of the same rarity.
const FUSE_COUNT = 3;
// keyed by INPUT rarity → chance to reach the next tier
const FUSE_CHANCE = { common:0.80, rare:0.50, epic:0.10, legendary:0.05 };
const relicsOfRarity = rar => S.relics.filter(r => r.rarity === rar);
const nextRarity = rar => RELIC_RARITY[RELIC_RARITY.findIndex(r => r.id === rar) + 1];
// Common & Rare auto-fuse (declutter low tiers); Epic+ are fused manually by choice.
const AUTO_FUSE = ['common', 'rare'];
const canManualFuse = rar => rar === 'epic' || rar === 'legendary';
// Repeatedly fuse any 3 unequipped Common/Rare relics upward. Common→Rare feeds
// Rare→Epic in the same pass. Returns the best relic that "graduated" to Epic+.
function autoFuse(){
  let graduate = null;
  for (const rar of AUTO_FUSE){
    while (true){
      const pool = S.relics.filter(r => r.rarity === rar && !S.equipped.includes(r.id));
      if (pool.length < FUSE_COUNT) break;
      const ids = pool.slice(0, FUSE_COUNT).map(r => r.id);
      S.relics = S.relics.filter(r => !ids.includes(r.id));
      const next = nextRarity(rar);
      const success = Math.random() < (FUSE_CHANCE[rar] || 0.5);
      const rel = makeRelic(success ? next.id : rar);
      S.relics.push(rel);   // stays unequipped so it keeps chaining up through the tiers
      if (success && !AUTO_FUSE.includes(rel.rarity)) graduate = rel;   // reached Epic+
    }
  }
  return graduate;
}
function makeRelic(rarId){
  const types = Object.keys(RELIC_TYPES);
  if (rarId === 'mythic'){
    const a = (Math.random()*types.length)|0, b = (a + 1 + ((Math.random()*(types.length-1))|0)) % types.length;
    return { id: ++S.relicSeq, type: types[a], type2: types[b], rarity:'mythic' };
  }
  return { id: ++S.relicSeq, type: types[(Math.random()*types.length)|0], rarity: rarId };
}
// player-picked fusion selection (relic ids, all same rarity, up to FUSE_COUNT)
let fuseSel = [];
function fuseSelRarity(){ const r = S.relics.find(x => x.id === fuseSel[0]); return r ? r.rarity : null; }
function fuseSelToggle(id){
  const rel = S.relics.find(r => r.id === id); if (!rel) return;
  if (rel.rarity === 'mythic'){ toast('Mythic relics can\'t be fused further'); return; }
  if (!canManualFuse(rel.rarity)){ toast(t('relic.autofuse')); return; }   // Common/Rare fuse automatically
  const i = fuseSel.indexOf(id);
  if (i >= 0){ fuseSel.splice(i, 1); }
  else {
    if (fuseSel.length && rel.rarity !== fuseSelRarity()){ fuseSel = [id]; openRelics(); return; }  // new rarity → restart pick
    if (fuseSel.length >= FUSE_COUNT){ toast(`Pick only ${FUSE_COUNT} to fuse`); return; }
    fuseSel.push(id);
  }
  openRelics();
}
function fuseSelected(){
  if (fuseSel.length !== FUSE_COUNT) return;
  const ids = fuseSel.slice();
  const rar = fuseSelRarity(), next = nextRarity(rar);
  if (!next) return;
  S.relics = S.relics.filter(r => !ids.includes(r.id));               // consume the picked relics
  ids.forEach(id => { const ei = S.equipped.indexOf(id); if (ei >= 0) S.equipped.splice(ei, 1); });
  fuseSel = [];
  const success = Math.random() < (FUSE_CHANCE[rar] || 0.5);
  const rel = makeRelic(success ? next.id : rar);
  S.relics.push(rel);
  if (S.equipped.length < RELIC_SLOTS) S.equipped.push(rel.id);
  if (success){
    toast(`✨ Fusion SUCCESS! ${RELIC_TYPES[rel.type].icon} ${relicRarityName(rel)} ${RELIC_TYPES[rel.type].name}`);
    GA('prestige'); spawnParticles(view.w/2, view.h*0.4, 'holy', 2.2);
  } else {
    toast(`💢 Fusion failed — kept one ${relicRarityName(rel)}`); GA('hit');
  }
  save(); openRelics(); updateHud();
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
  // keep the fusion selection valid if relics changed
  fuseSel = fuseSel.filter(id => S.relics.some(r => r.id === id));
  const list = owned.length ? owned.map(rel => {
    const t = RELIC_TYPES[rel.type], eq = S.equipped.includes(rel.id);
    const t2 = rel.type2 ? RELIC_TYPES[rel.type2] : null;
    const myth = rel.rarity === 'mythic';
    const sel = fuseSel.includes(rel.id);
    const name = t2 ? `${t.name} + ${t2.name}` : t.name;
    const stats = t2
      ? `${t.fmt(relicValue(rel))} · ${t2.fmt(relicValue2(rel))}`
      : t.fmt(relicValue(rel));
    return `<div class="relic ${eq?'eq':''} ${myth?'mythic':''} ${sel?'fsel':''}" style="--rc:${relicColor(rel)}">
      <span class="ic" data-rel="${rel.id}">${t.icon}${t2?t2.icon:''}</span>
      <div style="flex:1" data-rel="${rel.id}"><div class="rn">${name}</div><div class="rd">${stats}</div>
        <div class="rr">${relicRarityName(rel)}${eq?' · '+window.t('rel.eq'):''}${sel?' · '+window.t('rel.picked'):''}</div></div>
      <div class="relic-acts">
        ${canManualFuse(rel.rarity)?`<button class="relic-del" data-pick="${rel.id}" title="Select for fusion" style="color:${sel?'#7bffb0':'#8fd0ff'}">🧪</button>`:''}
        <button class="relic-del" data-del="${rel.id}" title="Destroy (salvage ${relicSalvage(rel)}💠)">🗑️</button>
      </div>
    </div>`;
  }).join('') : `<p style="grid-column:1/-1;color:var(--muted)">${tf('rel.none',{n:BOSS_EVERY})}</p>`;
  // fusion: pick relics with the 🧪 button, then fuse the chosen set
  const selRar = fuseSelRarity();
  const selRarDef = selRar && RELIC_RARITY.find(r => r.id === selRar);
  const next = selRar && nextRarity(selRar);
  const pct = selRar ? Math.round((FUSE_CHANCE[selRar] || 0.5) * 100) : 0;
  const ready = fuseSel.length === FUSE_COUNT;
  const fuseInfo = fuseSel.length === 0
    ? t('relic.fuse.hint')
    : ready
      ? `<b style="color:${selRarDef.color}">${FUSE_COUNT}× ${Ld(selRar,'name',selRarDef.name)}</b> → <b style="color:${next.color}">${Ld(next.id,'name',next.name)}</b> · <b>${pct}%</b> ${t('relic.fuse.success')}`
      : `${t('relic.fuse.picked')} <b>${fuseSel.length}/${FUSE_COUNT}</b> <b style="color:${selRarDef.color}">${Ld(selRar,'name',selRarDef.name)}</b>`;
  const fuseSection = `<div class="branch-title">${t('relic.fuse.title')}</div>
    <div class="shard-item"><div class="info">${fuseInfo}</div>
      <button class="btn" id="doFuse" ${ready?'':'disabled'} style="min-width:96px">🧪 ${ready?`Fuse ${pct}%`:`${fuseSel.length}/${FUSE_COUNT}`}</button></div>`;
  openModal(`
    <h2>${t('btn.relics')}</h2>
    <p>${tf('rel.desc',{n:RELIC_SLOTS})}</p>
    <div class="relic-slots">${slots}</div>
    <div class="relic-list">${list}</div>
    ${fuseSection}
    <button class="btn" id="closeRelic" style="width:100%;margin-top:12px">${t('set.close')}</button>`);
  el('closeRelic').onclick = () => { fuseSel = []; closeModal(); };
  el('modalBox').querySelectorAll('[data-rel]').forEach(n => n.onclick = () => toggleEquip(+n.dataset.rel));
  el('modalBox').querySelectorAll('[data-eq]').forEach(n => n.onclick = () => toggleEquip(+n.dataset.eq));
  el('modalBox').querySelectorAll('[data-pick]').forEach(n => n.onclick = e => { e.stopPropagation(); fuseSelToggle(+n.dataset.pick); });
  el('modalBox').querySelectorAll('[data-del]').forEach(n => n.onclick = e => { e.stopPropagation(); destroyRelic(+n.dataset.del); });
  if (el('doFuse')) el('doFuse').onclick = fuseSelected;
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
    <h2>${t('tw.title')}</h2>
    <p>${t('tw.desc')}</p>
    <div class="shard-shop">
      <div class="shard-item"><div class="info"><b>${t('tw.lv')}</b>
        <div class="lv">Lv ${S.towerLv} · +${Math.round((towerHpMul()-1)*100)}% HP</div></div></div>
      <div class="shard-item"><div class="info"><b>${t('tw.hp')}</b>
        <div class="lv">💎 ${fmt(Math.round(crystalMaxHp()))}</div></div></div>
    </div>
    <button class="btn" id="buyTower" ${afford?'':'disabled'}
      style="width:100%;background:linear-gradient(#f2c14a,#e0a72e);color:#3a2a00;border:0">
      ${tf('tw.buy',{c:fmt(c)})}</button>
    <button class="btn" id="closeTower" style="width:100%;margin-top:8px">${t('set.close')}</button>`);
  el('buyTower').onclick = buyTower;
  el('closeTower').onclick = closeModal;
}
if (el('btnTower')) el('btnTower').onclick = openTower;

// Auto-upgrade toggle
function refreshAutoBtn(){
  const b = el('btnAuto'); if (!b) return;
  b.classList.toggle('sel', !!S.autoUp);
  b.textContent = S.autoUp ? t('btn.autoOn') : t('btn.autoOff');
}
if (el('btnAuto')) el('btnAuto').onclick = () => {
  S.autoUp = !S.autoUp; refreshAutoBtn();
  toast(S.autoUp ? '🅰️ Auto ON — buys cheapest upgrades + auto-fires Overdrive'
                 : '🅰️ Auto OFF');
  save();
};

// 📺 rewarded ad → 30 minutes of double gold
if (el('btnBoost')) el('btnBoost').onclick = () => {
  const left = ((S.adBoostUntil || 0) - Date.now()) / 60000;
  if (left > 0){ toast(tf('ad.boost.active', { m: Math.ceil(left) })); return; }
  Ads.rewarded(ok => {
    if (!ok){ toast(t('ad.fail')); return; }
    S.adBoostUntil = Date.now() + 30 * 60000;
    toast(t('ad.boost.go')); GA('prestige'); save(); updateHud();
  });
};

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
  if (window.Ads) Ads.init();
  autoFuse();                             // migrate old saves: collapse piled Common/Rare relics
  if (window.Sheets && Sheets.preload) Sheets.preload();   // avoid canvas→sheet size pop
  resize();
  refreshFeatureLocks(false);         // seed: hide locked systems, mark earned ones as already-known
  if (!S.seenIntro) showIntro();      // first-run tutorial (before any offline popup)
  else applyOffline();                // offline gains may cross a stage → queues an unlock popup
  checkAchievements();
  startWave(S.wave);
  buildHeroPanel();
  showWaveBanner(S.wave);
  updateHud();
  refreshAutoBtn();
  refreshBuyModeBtn();
  applyLang();                        // skin the persistent UI to the saved language
  if (S.speed > 2) S.speed = 2;       // speed caps at 2× now (was 3×)
  const spBtn = document.querySelector(`[data-spd="${S.speed}"]`) || document.querySelector('[data-spd="1"]');
  spBtn.classList.add('sel');
  window.addEventListener('beforeunload', save);
  setInterval(save, 15000);
  requestAnimationFrame(frame);
}
boot();
