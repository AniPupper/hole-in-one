# Hole in One: Product Requirements Document

**Product:** Hole in One, a mini golf website
**Owner:** Anika Kumar
**Status:** In development. A live build is available at [hole-in-one-roan.vercel.app](https://hole-in-one-roan.vercel.app/).
**Built with:** AI coding assistants (OpenAI Codex, Anthropic Claude Code), deployed as a static site on Vercel

**Design claim:** My site makes quick-break players feel satisfied and eager to keep playing when each first swing produces a hole-in-one and reveals a different course.

**Three must-haves for this release:** A guaranteed first-shot hole-in-one with a varied visible route; a persistent XP, gear, and cart loop; and a quick gear purchase with a celebratory reveal. **Outside this release:** accounts, real payments, and publishing player-made levels. The separate level editor is a future project, not a shipped feature.

---

## Product Goal

After a five-minute session, a player should feel satisfied by every hole-in-one and want to keep playing. The immediate reason to continue is the next course's distinct layout: different hills, turns, and placements of course elements to discover. The guaranteed result should make a quick break feel rewarding, while the player's aim and equipped gear make each route feel distinct.

## 1. Primary Users

**Casual players looking for a short break.** This is the primary audience for the first public version: people who want a short, low-effort activity they can start immediately in a web browser. Examples include students between classes and office workers on a break. They do not want to learn complex controls or risk failing. They play in sessions of one to ten minutes and may return several times a day.

**Players motivated by collecting and progression.** A second group is drawn to unlocking, collecting, and equipping items. These players value visible progress: a growing XP balance, new gear, and courses that become more elaborate. They are the main audience for the Pro Shop.

**Fans of "dopamine sites."** These players are familiar with websites built around simulated purchasing and reward loops, where the satisfaction comes from the act of buying and revealing items rather than from their real-world value. They expect quick feedback, celebratory animations, and a polished checkout experience.

No accounts, payment, or prior gaming experience are required. Hole in One is a website, not a mobile app: there is nothing to download or install, and it is played at its web address. The site is designed primarily for desktop browsers with a mouse or trackpad. Its layout also adapts to narrower browser windows, so it remains usable when opened in a phone or tablet browser.

## 2. Problems to Solve

1. **Casual games often punish failure.** Many quick browser games depend on skill and repeated failure, which frustrates players who want a relaxing, rewarding break. Hole in One guarantees a hole-in-one on every first stroke. Player input changes how the ball reaches the cup, not whether it does.

2. **Guaranteed success can feel empty.** If every shot succeeds, the route must still feel shaped by the player's decision. Aim direction should strongly change how the ball travels and which visible assists it encounters, while every first stroke still reaches the cup. Spectacle comes from wind gusts, launch pads, cannons, loops, rivers, and moles. The next course should promise a visibly different route through its hills, turns, and element positions.

3. **Progress in short sessions is hard to feel.** Players need a clear sense of advancement even when they play for only a minute. Each hole awards XP, and the Pro Shop turns XP into visible, equippable upgrades.

4. **Simulated purchasing needs to feel satisfying.** For dopamine-site users, a purchase must feel quick, clear, and rewarding. The shop opens details and comparison from a card, then lets the player add and purchase in two more clicks, ending with a reveal.

5. **Content must stay fresh without manual authoring.** A handmade set of holes and items would be exhausted quickly. The product uses a fixed, deterministically generated catalog of courses and gear tiers. This keeps content effectively endless while remaining reproducible and testable.

## 3. Capabilities

**Gameplay**
- Aim and shoot by pressing, pulling back, and releasing. Pull distance sets power from 0 to 100 percent.
- Aim should strongly affect the shot's visible route through the course, including its interactions with obstacles, without removing the guaranteed first-stroke hole-in-one.
- Every first stroke ends in the cup, helped by course features and environmental rescues. Keep the current rescue sequence and brief event pop-ups that explain what happened.
- A fixed catalog of 250 course plans with bends, hills, and obstacles. Consecutive holes should feel distinct through different hill shapes, turns, and positions of their elements. Elements include launch pads, windmills, loops, cannons, bumpers, bridges, rivers, and moles. After hole 250, encore holes reuse the catalog with mirrored turns; mirroring is sufficient variety for this stage of the product.
- Difficulty and spectacle increase over time. The first seven holes introduce elements gently, and later holes build longer chain reactions.
- A typical swing-to-cup sequence should take about 10–20 seconds, leaving time for a satisfying route within a short play session.
- A celebration with confetti and an XP award after each hole-in-one. The course supplies the main reward, with a small bonus for a distinctive route. Passing all the way through a windmill tunnel currently earns a one-time 75 XP bonus; other route bonuses still need definition. The existing power-based bonus remains until route scoring is designed.
- **Trial feature:** each windmill faces the local course direction, with its blade face across the fairway and a widened ground-level tunnel aligned with travel. A ball approaching close to the opening gets a gentle pull toward it. Entering the near end and exiting the far end earns a one-time 75 XP bonus and a forward speed boost; passing alongside or above it does not count. The bonus appears in an event callout and the hole-in-one reward breakdown. Keep or remove this feature after player testing.
- When a ball enters a cannon, the barrel briefly turns toward a safe point farther along the course before firing. Its visible aim and launch velocity match, and the ball stays within the playable lane during the launch.
- Equipped club and ball visibly affect the shot, including launch speed, height, bounce, spin, and roll. Classic White has a slower full-power launch; buying a ball gives a clear speed improvement, including for first-tier balls with a low roll stat. As courses advance, an unchanged loadout loses launch pace very gradually, capped at six percent; purchasing and equipping newer gear restores that pace. A player who keeps Classic White on later courses must still finish every hole, but their shot should feel noticeably slower than with upgraded gear. The first club upgrade should feel subtly but noticeably faster than the Rookie; later upgrades should also improve how quickly the ball moves through obstacles. The ball shows its equipped skin on the course. All gear must preserve the guaranteed first-stroke hole-in-one.
- A WebGL2 3D course by default, with the classic canvas view as an automatic fallback when WebGL is unavailable.

**Pro Shop**
- Displays the XP balance as a large hero number, alongside the currently equipped gear.
- Offers three club choices and three ball choices per reward tier, with stats and XP prices.
- Uses a right-side cart drawer that holds up to one club and one ball, with a combined total and the remaining balance shown. Players can keep browsing while it is open; the cart shows only selected items and a subtle, optional pairing suggestion.
- Purchases equip the gear immediately and lead into an animated reveal.
- Allows only one purchase per tier. Prices rise steadily across tiers.
- A new player should usually be able to afford either a club or a ball after two or three completed holes. Validate this against actual course rewards before changing the economy.

**Onboarding**
- A single-screen tutorial on first visit explains aiming, the guaranteed hole-in-one, and the shop. Players can reopen it from the course.

**Sound**
- Distinct golf club strikes, ball movement, course interactions including a small river-entry splash, cup, and a restrained win cue. A short party horn marks shop purchases. The player can mute sound on either screen, and that choice persists locally.

**Course preview**
- A **View course** button opens a pre-shot camera preview. Players drag to rotate, scroll or use buttons to zoom, shift-drag to pan, and move between tee and cup with buttons or arrow/WASD keys. Back to Shot returns to the tee without swinging. During the shot, the camera follows the ball automatically; a held drag changes the view angle.

**Planned capabilities (in development)**
- A separate level editor for player-made courses, including validation, local drafts, and a publishing approach.
- Further Pro Shop polish, including a receipt and a locker of owned items.
- A rolling animation for the ball.
- Retuned shot power, so full power feels proportionally stronger.
- Moles rise in response to a ball that is heading off course, moving away from the cup, or nearly stopped away from the cup. They stay up long enough to be seen, and their predicted meeting point must clear course rails and nearby obstacles. If that point is unsafe or the ball is too high, a wind rescue takes over.
- Courses becoming progressively hillier and more complex.

## 4. Required Inputs

**From the player**
- Pointer or touch input for the shot: press, drag direction and distance, release.
- Clicks or taps in the Pro Shop: add to cart, remove from cart, purchase, close the reveal, navigate to the course.
- Optional inputs: reopening the tutorial, moving the preview camera, changing the follow camera angle, and muting sound.

**From the system**
- Saved progress in browser storage (`hole-in-one-progress-v1`): XP balance, hole count, equipped and owned club and ball IDs, and claimed tiers.
- Saved course state (`hole-in-one-course-v1`): current level and completion state.
- Saved Pro Shop cart (`hole-in-one-cart-v1`): selected club and ball until purchase or explicit removal.
- Tutorial state (`hole-in-one-tutorial-seen-v1`).
- The course catalog (`course-blueprints.js`), generated ahead of time by a build script. It is not generated randomly at runtime.
- Gear definitions: hand-designed data for the first six tiers, plus deterministic generated tiers beyond them.

The product collects no personal information. No account, email address, or payment details are required.

## 5. User Flows

**Flow A: First visit**
1. The player opens the site, and the tutorial appears.
2. The player selects **Play a hole** (or explores the shop first).
3. On the course, the player presses, pulls back to aim and set power, and releases.
4. The ball travels through visible assists and drops into the cup.
5. A celebration shows the XP earned. **Next course** is the main action. When the player can afford a new item, **Next course** and **Visit the shop** have equal prominence, without naming specific gear on the celebration.

**Flow B: Purchasing gear**
1. The player opens the site at the Pro Shop, or returns to it from the course.
2. The player browses the current tier's three clubs and three balls, with future tiers teased without item details. Cards prioritize artwork and rarity. The equipped club and ball appear beside the XP balance; owned items live in **My Gear**.
3. Each available item has separate **Add to cart** and **View details** actions. View details opens a side panel with artwork and visual, exact stat comparisons; the player can choose equipped gear or another same-tier choice as the comparison. Locked gear remains viewable with its purchase action disabled.
4. A right-side cart drawer opens with a large view of the selected gear, its price, the total, and the remaining XP. It holds one club and one ball, replacing a same-type selection immediately. The player can continue browsing; a matching item may be suggested, but is added only on confirmation. Cart selections remain when the drawer closes or the player leaves and returns.
5. The player selects **Purchase**. The gear is equipped and a reveal animation plays.
6. The reveal offers **Play a hole**, which returns the player to the course with the new gear.

**Flow C: Returning player**
1. The player opens the site, and saved XP, gear, and course level load from browser storage.
2. The player resumes the next saved hole or visits the shop to spend accumulated XP. Completed courses are not available for replay; progression moves forward only.

**Flow D: Viewing the course**
1. Before the first stroke, the player may select **View course** to explore the hole and return to the tee without swinging.
2. The player returns to the tee and takes the shot.
3. The camera follows the moving ball automatically. Hold and drag on the course to change the viewing angle; that angle persists until the shot ends.

## 6. Constraints

- **The guaranteed outcome is fixed.** The first stroke on every hole must reach the cup. No feature, tuning change, or new element may break this.
- **No real money.** All currency is XP earned in the game. The product must not offer real purchases or collect payment information.
- **Visible causes only.** Course rescues and assists must be visible on screen. Walls must follow the fairway with matching collision, and there must be no invisible boundaries or unexplained curves.
- **Forward-only course progression.** The player advances to the next course after a hole-in-one and cannot select or replay earlier courses.
- **Saves must stay compatible.** Changes must keep existing saved progress working, including storage keys, data shape, gear IDs, and prices.
- **No visible content cap.** Players must never see the total number of tiers or holes, even though the catalog has internal limits (1,000 gear tiers per type, 250 base holes).
- **Purchases stay quick.** Viewing an item, adding it to the cart, and purchasing it should take three clear clicks from its card.
- **Accessibility.** Animations must respect the operating system's reduced-motion setting. Meaningful text must be at least 13px and remain readable in narrow browser windows.
- **Progress is per browser.** Progress is stored only in the visitor's browser and does not sync across devices.

## 7. Interface Requirements

**Course screen**
- A full-screen course with a minimal HUD: level, equipped club, wind indicator, and power percentage with a fill bar.
- An aim preview while dragging, and short callouts for events such as "CANNON FIRED" and "RIGHT IN THE CUP!"
- The hole-in-one celebration leads primarily to the next course. When the XP balance can buy a current gear item, the next-course and Pro Shop actions have equal visual weight; the celebration need not name the available item.
- Clear access to the Pro Shop and to **How to play**.
- A broad, colorful palette, with navigation and XP still easy to find.

**Pro Shop**
- Brand colors: green as the grounding clubhouse color, burnt orange for actions and selected gear, and yellow (`--xp-yellow`) for XP figures, price badges, and progress.
- The XP balance is the most prominent number on the screen.
- Bold titles, large key numbers, and very little explanatory copy.
- Item cards emphasize artwork first, then rarity, name, price, and state. Clicking a card opens a detail side panel with artwork, exact stats, visual comparison bars, a player-selected comparison item, and **Add to cart**. Unaffordable items remain viewable with disabled purchase controls.
- The XP balance, current equipped club and ball, and accessible **My Gear** entry sit together near the top of the shop. Later tiers appear as teasers with their item details hidden until unlocked.
- The cart always shows each item's price, the total, and the balance after purchase.
- Use **cart** consistently for items being considered; the cart header includes a small decorative golf cart illustration. **Bag** remains the term for gear already owned or equipped.
- The cart suggests a matching club or ball when affordable, but adding the suggested item requires the player's confirmation.
- Opening the right-side cart uses a brief slide-in animation, with an immediate appearance when reduced motion is preferred. The page remains browsable while the cart is open.
- The purchase reveal uses confetti and motion, and has a reduced-motion alternative.

**General**
- Responsive web layouts that work in wide desktop browser windows and narrow ones (such as a phone browser), with no horizontal scrolling.
- Input works with mouse and trackpad, and with touch when the site is opened on a touchscreen.
- The tutorial is a single screen with a clear dismiss action, and can be closed with Escape.

## 8. Technical Constraints

- **Static site with no build step.** The site is plain HTML, CSS, and JavaScript files served as-is. There are no package dependencies or frameworks.
- **Hosting.** The site is deployed on Vercel at hole-in-one-roan.vercel.app. Source control is GitHub (AniPupper/hole-in-one), managed through GitHub Desktop.
- **Storage.** The site uses browser `localStorage` only. There is no backend, database, or server-side logic.
- **Rendering.** `game.html` starts the WebGL2 3D renderer by default. The classic 2D canvas takes over automatically if WebGL2 cannot initialize or rendering fails.
- **Physics.** The simulation runs at a fixed 120 Hz step. The ball's top speed must stay below one ball radius of travel per step, or the step rate must be raised, so that collisions with thin objects are always detected.
- **Deterministic content.** Courses come from a checked-in catalog generated by `tools/build_course_blueprints.py`, and gear tiers come from deterministic generation in `gear-progression.js`. Regenerating content is a deliberate source change.
- **Testing.** An automated smoke suite (`tests/run_smoke.py`) checks shop progression, persistence, course shot traces, layout uniqueness, and physics timing. 3D contract tests check mesh and collision consistency. Changes must pass the suite before release.
- **Development process.** Features are built with AI coding agents working on separate branches. Changes are reviewed before being merged into `main`, and a backup tag preserves known-good states.

---

## Success Criteria

- 100 percent of first strokes reach the cup across the full course catalog in automated tests.
- Consecutive courses show visibly different hill and turn shapes and different element placements; review the first-session sequence and catalog samples for repetition.
- Across representative aim directions on each course, the ball takes meaningfully different visible routes while still reaching the cup. Define a route-diversity measure before using this as a release gate.
- The median swing-to-cup time across representative holes is 10–20 seconds; unusually long courses are reviewed for pacing.
- A first-time visitor completes their first hole within 60 seconds of opening the site.
- In a representative first-session progression check, the first gear purchase is affordable after two or three holes.
- A distinctive-route XP bonus remains small relative to the course's base reward, so a player is not penalized for exploring different shots.
- Players can identify a subtle but noticeable speed increase after the first club upgrade and visible behavior changes from later gear; define concrete before-and-after cases for acceptance testing.
- On later courses, Classic White remains viable for a guaranteed hole-in-one but feels noticeably slower than upgraded balls under comparable shots.
- A single-item purchase takes no more than two clicks, and a club plus ball together takes no more than three.
- Existing saved progress loads without loss after every release.
- The course and shop render without layout breakage in standard desktop browser windows and in narrow 375px-wide browser windows.

## Near-Term Product Priorities

1. Make gear upgrades noticeably affect play, particularly club speed and agility, while preserving the guaranteed hole-in-one.
2. Review the new cannon turn and course-directed launch in play, and fix any off-course cases players find.
3. Continue honing the Pro Shop experience.
