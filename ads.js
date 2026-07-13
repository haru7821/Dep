/* ============================================================================
   Echoes of the Aether Crystal — Rewarded-ads layer (portal monetisation)
   ----------------------------------------------------------------------------
   One thin abstraction over the big web-game portal SDKs. The game only ever
   calls Ads.rewarded(cb) — this file figures out which portal it's running on:

     • Poki           — include their SDK; we call PokiSDK.rewardedBreak()
     • CrazyGames     — include their SDK; we call SDK.ad.requestAd('rewarded')
     • GameDistribution — include their SDK; we call gdsdk.showAd('rewarded')
     • anywhere else  — a built-in DEV overlay simulates a 3s ad so the whole
       reward flow is playable/testable without any SDK (itch.io, local, etc.)

   To ship on a portal: add its <script> tag to index.html (see the commented
   block there) — no game-code changes needed.

   While an ad runs, Ads.isBusy() is true: game.js pauses the sim and we mute
   the audio (portals require both), restoring everything afterwards.
   ========================================================================== */
'use strict';
window.Ads = (function () {
  let provider = 'dev', busy = false, ready = false;

  async function init() {
    try {
      if (window.PokiSDK) {
        provider = 'poki';
        await PokiSDK.init();
        PokiSDK.gameLoadingFinished();
      } else if (window.CrazyGames && CrazyGames.SDK) {
        provider = 'crazygames';
        await CrazyGames.SDK.init();
      } else if (window.gdsdk && gdsdk.showAd) {
        provider = 'gd';
      }
    } catch (e) { /* SDK failed → keep dev fallback */ }
    ready = true;
  }

  // pause-proof wrapper: mute for the ad, restore after
  function guard() {
    busy = true;
    const wasMuted = !!(window.GameAudio && GameAudio.isMuted());
    if (window.GameAudio && !wasMuted) GameAudio.toggleMute();
    return () => {
      busy = false;
      if (window.GameAudio && !wasMuted && GameAudio.isMuted()) GameAudio.toggleMute();
    };
  }

  // cb(true) = user earned the reward; cb(false) = failed/aborted/no fill
  function rewarded(cb) {
    if (!ready || busy) { cb(false); return; }
    const done = guard();
    const finish = ok => { done(); try { cb(!!ok); } catch (e) {} };
    if (provider === 'poki') {
      PokiSDK.rewardedBreak().then(withReward => finish(withReward)).catch(() => finish(false));
    } else if (provider === 'crazygames') {
      CrazyGames.SDK.ad.requestAd('rewarded', {
        adFinished: () => finish(true),
        adError:    () => finish(false),
        adStarted:  () => {},
      });
    } else if (provider === 'gd') {
      gdsdk.showAd('rewarded').then(() => finish(true)).catch(() => finish(false));
    } else {
      devOverlay(finish);
    }
  }

  // DEV/no-SDK fallback: a 3-second fake ad so the reward loop always works.
  function devOverlay(finish) {
    const tt = k => (window.t ? t(k) : k);
    const ov = document.createElement('div');
    ov.style.cssText = 'position:fixed;inset:0;z-index:99;background:rgba(4,6,15,.94);' +
      'display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;color:#e8ecff';
    ov.innerHTML = `<div style="font-size:38px">📺</div>
      <div style="font-size:16px;font-weight:700">${tt('ad.dev.title')}</div>
      <div id="adCount" style="font-size:30px;font-weight:800;color:#7bd3ff">3</div>
      <button id="adSkip" style="background:none;border:1px solid #2a3160;color:#8b93c4;
        border-radius:8px;padding:6px 14px;cursor:pointer">✕ ${tt('cancel')}</button>`;
    document.body.appendChild(ov);
    let n = 3;
    const iv = setInterval(() => {
      n--;
      const c = ov.querySelector('#adCount');
      if (c) c.textContent = n;
      if (n <= 0) { clearInterval(iv); ov.remove(); finish(true); }
    }, 1000);
    ov.querySelector('#adSkip').onclick = () => { clearInterval(iv); ov.remove(); finish(false); };
  }

  return { init, rewarded, isBusy: () => busy, canReward: () => ready && !busy, provider: () => provider };
})();
