# Testing Hole in One

Run the automated integration smoke suite from the project folder:

```sh
python3 tests/run_smoke.py
```

For a first-shot trace through every planned course, run:

```sh
python3 tests/run_smoke.py --full
```

The Python launcher chooses a working Node.js binary, including the bundled runtime when the system `node` cannot run. `HOLE_IN_ONE_NODE=/path/to/node` overrides it. The suite loads the real `gear-progression.js`, `ball-upgrades.js`, `course-blueprints.js`, `script.js`, and `game.js` into isolated JavaScript contexts with in-memory storage. It does not change the player's saved game.

## Automated coverage

- All 1,000 club tiers and 1,000 ball tiers have rising XP prices, three unique valid choices, and stable IDs. Tier 7 and tier 1,000 combined cart purchases equip both items, deduct both prices, persist on reload, and stop cleanly after the final tier. Locked tiers cannot be purchased.
- Every club choice resolves to a driver, wedge, or iron course appearance instead of Rookie fallback. Generated gear at tiers 7, 500, and 1,000 participates in shot traces.
- All 250 checked-in blueprints have unique titles and route/prop signatures, deterministic same-level layouts, sampled route variety, smooth centerline turns, valid rail heights, and at least 1.5 world units between prop centers. Holes 251 and 501 have stable Encore titles and routes visibly different from the first blueprint.
- The standard sweep simulates 99 first shots across early, middle, and late courses. It includes Rookie/Classic and tier 7/500/1,000 gear, 0%, 58%, and 100% power, and forward, sideways, and backward aim. Every trace must finish within a minute near the cup, award XP once, and increment the hole-in-one count once. `--full` adds one Rookie/Classic shot for each of the 250 blueprints.
- Targeted contacts verify an off-course tree trunk repels without penetration and an overshot flagpole reflects softly toward the cup without repeated callouts or added speed. The flag scenario must still sink and reward once.
- Focused cup checks verify the near-cup heading change preserves planar speed after normal acceleration, the front backstop banks at its visible face, and a rear arrival triggers the timed flap and still reaches the cup. Stale club-only and ball-only shop tabs must retain newer XP, shot count, unlocks, and equipment for the item they did not purchase. The local reset helper must clear XP, gear, claimed tiers, course completion, and the tutorial seen flag on its isolated test origin.

Latest full run: 349 traces passed, including all 250 blueprints; longest simulated flight 33.4 seconds, maximum frame movement 0.17 world units at 120 Hz, final cup distance at most 0.47 world units. The 250 plans yielded 239 sampled route shapes across 14 turn patterns; minimum prop-center gap was 3.87 world units. The focused rear flap scenario sank in 2.5 seconds; the flag overshoot sank in 0.5 seconds after a damped reflection. The subsequent standard run also passed the inverse stale ball-only cart regression.

## In-app browser QA

Use disposable local HTTP origins for browser testing. Do not open the QA launchers on the user's `file://` site. `tests/preview-hole.html` selects a course from 1–501 or resets the tutorial seen flag. `tests/preview-shop.html` seeds the XP and prior unlocks for a chosen tier from 1–1,000. Both modify only the local test origin; the course launcher does not alter XP or equipment.

To reset the local browser instance after a high-tier preview, open `tests/preview-shop.html` on that same local origin and click **Reset to starter gear + Hole 1**. On `localhost`, `tests/preview-shop.html?reset=starter` performs that reset on opening. It sets XP and shot count to zero, equips the Rookie club and Classic White ball, clears claimed tiers, returns the course to hole 1, and makes the tutorial appear again. Reload other open local game tabs afterward so their in-memory progress does not restore the old state.

1. At 320px and 390px, check shop navigation, bright spendable XP balance, readable three-choice club and ball cards, artwork, rarity, comparison, no horizontal overflow, and the fixed cart summary. Add a club, close and reopen the cart modal, then reload to confirm that only that club stays in the cart. Use the optional pairing suggestion to add a ball, remove and swap items in the modal, and confirm the header count and summary update. Buy a club and ball together, confirm `XP AFTER` equals the balance minus both prices, watch the reveal, then follow **Play a hole** and verify HUD and rendered gear.
2. On course, press on the canvas and the shot panel, pull back, and release over different parts of the screen. Each release should start the player's own shot; buttons and links should still work. Try weak, sideways, backward, and strong shots. The ball should begin on the player's line, show a visible wind/rail/mole/prop cause when redirected, reach the dark cup mouth, and celebrate once. Inspect the open tee, rails, bank, pad, loop, windmill, river, bridge, cannon, flag, and trees on desktop and mobile.
3. Inspect early and late blueprints such as 1, 4, 8, 20, 100, 250, and Encore 251. Confirm varied route silhouettes, clear current hole/title, visible near props and cup, no rail cusp, no terrain seam, and no club, dock, HUD, or control overlap. Reload the same hole to confirm its plan stays fixed.
4. On a fresh origin, open the Pro Shop first and confirm the tutorial appears before the shop. Use **Explore the shop**, then reload to verify persistence. Reset the tutorial flag, open the course directly, and verify its first-visit tutorial, Start/Skip/Close/Escape, focus cycling, and **How to Play** replay. With a completed hole and reset seen flag, dismissal must focus **Next Hole**. At 320px, scroll the tutorial body while its action buttons stay visible.
5. Scan normal and late shop/course/tutorial states for visible finite totals (`/1000`, `/250`) or “collection complete” copy. Current tier and hole numbers should still be clear.

Observed in browser before the latest control changes: tier-1 and tier-1,000 combined purchases equipped distinct club and ball art; the final-tier cart and reveal fit 320px. Hole 4 and 8 mobile tee views framed the cup and interactive props, with the club/ball clear above the dock. The previous dock controls fit at 320px on holes 1/2/4 and at 390px on holes 2/8 without covering the cup, props, or strike point. Hole 250 and Encore 251 titles fit the mobile HUD. The 320px shop progress label wrapped instead of clipping. Course tutorial first visit, reload persistence, replay, Escape, keyboard focus loop, completed-hole exit, 320px scroll, and post-dismiss hole-in-one passed. The new spendable XP flow, shop-first tutorial, and shot-panel pullback still need visual browser review; the VM smoke suite covers the pullback and release event path. Earlier passes also covered hole-1 weak rescue, level-7 sideways rail bank, level-8 off-course mole rescue, and hole-5 near-cup framing.

The VM suite checks simulation and data invariants; it does not prove every frame of visual rendering or every possible stroke. Rerun focused browser checks after camera, art, or UI edits.

The current Codex browser surface is blocked, so this testing pass uses only the isolated VM suite. The browser checklist and observations above are from the earlier accessible build; visual confirmation of the new backstop flap, cup approach, and recent shop changes remains pending in an approved browser session.
