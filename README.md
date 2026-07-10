# ⟡ Echoes of the Aether Crystal

A browser-based **idle / incremental defense game** (방치형 디펜스 게임) with a
Japanese-RPG flavor. Four heroes hold the line at the village of Luminel,
auto-battling endless waves of the Umbral Tide to protect the Aether Crystal.
No installs, no build step — open `index.html` and play.

![screenshot](screenshot.png)

## How to play

Just open **`index.html`** in any modern browser. Everything is self-contained
(pure HTML + canvas + JavaScript, no external assets or libraries). Progress is
saved automatically to `localStorage`, including offline earnings while the tab
is closed.

The game plays itself — the only decision is **where to spend your gold**:

- Waves auto-advance; heroes auto-attack; gold accrues per kill.
- Tap a hero card to **recruit / upgrade** them.
- Every **5th wave** is a **boss** (8× HP, 10× gold) that acts as a soft wall.
- Come back later to collect **offline earnings** (50% rate, capped at 8h).
- When progress stalls, **Reseal the Crystal (Prestige)** for permanent **Aether
  Shards**, then spend them in the **Shard Shop** for permanent boosts.

## Heroes

| Hero | Archetype | Role |
|------|-----------|------|
| **Sir Garran** | Bulwark Knight | High single-target damage (tank) |
| **Mira** | Emberwind Mage | AoE splash — hits every enemy (unlocks W10) |
| **Faye** | Gale Archer | Rapid single-target fire (unlocks W25) |
| **Aunel** | Dawn Healer | Heals the Crystal + global damage aura (unlocks W100) |

## Design & balance

Core formulas (wave index `w`):

- **Enemy HP:** `10 × 1.12^(w-1)`
- **Enemies per wave:** `min(5 + ⌊w/3⌋, 20)`, one spawn / 0.8s
- **Gold per kill:** `⌈2 × 1.10^(w-1)⌉` (reward growth trails HP growth → upgrading is mandatory)
- **Hero damage:** `base × (1 + 0.25 × level)`
- **Upgrade cost:** `⌈base × 1.15^level⌉` (geometric curve)
- **Prestige shards:** `⌊√(lifetimeGold / 1,000,000)⌋`, +2% permanent damage each

Milestones: W10 unlock Mira · W25 Faye · W100 Aunel · W500 fully reseals the
Crystal (endless mode continues).

## Files

| File | Contents |
|------|----------|
| `index.html` | Markup, HUD, styling |
| `game.js` | Game engine: waves, combat, economy, save/load, offline, prestige, shop |
| `sprites.js` | Pure canvas pixel-art renderers for every hero, enemy, boss, the Crystal, and the parallax night background |

## Built with a multi-agent workflow

- **Agent A** — researched the genre (reference: *The Tower – Idle Tower Defense*) and core idle-defense mechanics.
- **Agent B** — designed the scenario, difficulty curve, and all balance formulas.
- **Agent C** — created the JRPG pixel-art sprite module (`sprites.js`).
- **Agent D** — code review; caught 5 correctness bugs (all fixed).
- **Agent E** — built the engine and integrated everything.

## Development / verification

The game needs no dependencies to run. The `*.mjs` scripts drive a headless
Chromium (via `playwright-core`) to smoke-test the game loop, economy, prestige,
and the specific bug fixes:

```
npm install playwright-core
node verify.mjs    # full smoke test (waves, upgrades, prestige, shop)
node verify2.mjs   # targeted regression tests for fixed bugs
```
