# Hole in One: Product Requirements Document

**Product:** Hole in One, a mini golf website
**Owner:** Anika Kumar
**Status:** In development. A live build is available at [hole-in-one-roan.vercel.app](https://hole-in-one-roan.vercel.app/).
**Built with:** AI coding assistants (OpenAI Codex, Anthropic Claude Code), deployed as a static site on Vercel

---

## 1. Primary Users

**Casual players looking for a short break.** The main audience is people who want a short, low-effort activity they can start immediately in a web browser. Examples include students between classes and office workers on a break. They do not want to learn complex controls or risk failing. They play in sessions of one to ten minutes and may return several times a day.

**Players motivated by collecting and progression.** A second group is drawn to unlocking, collecting, and equipping items. These players value visible progress: a growing XP balance, new gear, and courses that become more elaborate. They are the main audience for the Pro Shop.

**Fans of "dopamine sites."** These players are familiar with websites built around simulated purchasing and reward loops, where the satisfaction comes from the act of buying and revealing items rather than from their real-world value. They expect quick feedback, celebratory animations, and a polished checkout experience.

No accounts, payment, or prior gaming experience are required. Hole in One is a website, not a mobile app: there is nothing to download or install, and it is played at its web address. The site is designed primarily for desktop browsers with a mouse or trackpad. Its layout also adapts to narrower browser windows, so it remains usable when opened in a phone or tablet browser.

## 2. Problems to Solve

1. **Casual games often punish failure.** Many quick browser games depend on skill and repeated failure, which frustrates players who want a relaxing, rewarding break. Hole in One guarantees a hole-in-one on every first stroke. Player input changes how the ball reaches the cup, not whether it does.

2. **Guaranteed success can feel empty.** If every shot succeeds, the outcome must still feel earned and interesting. The game addresses this through spectacle: visible assists such as wind gusts, launch pads, cannons, loops, rivers, and moles. These become longer and more surprising chain reactions as the player progresses.

3. **Progress in short sessions is hard to feel.** Players need a clear sense of advancement even when they play for only a minute. Each hole awards XP, and the Pro Shop turns XP into visible, equippable upgrades.

4. **Simulated purchasing needs to feel satisfying.** For dopamine-site users, a purchase must feel quick, clear, and rewarding. The shop must reduce friction (at most two clicks per item) and end each purchase with a reveal.

5. **Content must stay fresh without manual authoring.** A handmade set of holes and items would be exhausted quickly. The product uses a fixed, deterministically generated catalog of courses and gear tiers. This keeps content effectively endless while remaining reproducible and testable.

## 3. Capabilities

**Gameplay**
- Aim and shoot by pressing, pulling back, and releasing. Pull distance sets power from 0 to 100 percent.
- Every first stroke ends in the cup, helped by visible course features and environmental rescues.
- A fixed catalog of 250 course plans with bends, hills, and obstacles. These include launch pads, windmills, loops, cannons, bumpers, bridges, rivers, and moles. After hole 250, encore holes reuse the catalog with mirrored turns.
- Difficulty and spectacle increase over time. The first seven holes introduce elements gently, and later holes build longer chain reactions.
- A celebration with confetti and an XP award after each hole-in-one.
- Equipped club and ball affect launch speed, height, bounce, spin, and roll, and the ball shows its equipped skin on the course.
- Two renderers: the default classic view and an opt-in WebGL2 3D view.

**Pro Shop**
- Displays the XP balance as a large hero number, alongside the currently equipped gear.
- Offers three club choices and three ball choices per reward tier, with stats and XP prices.
- Uses one cart that holds up to one club and one ball, with a combined total and the remaining balance shown.
- Purchases equip the gear immediately and lead into an animated reveal.
- Allows only one purchase per tier. Prices rise steadily across tiers.

**Onboarding**
- A single-screen tutorial on first visit explains aiming, the guaranteed hole-in-one, and the shop. Players can reopen it from the course.

**Planned capabilities (in development)**
- A full Pro Shop redesign with a persistent cart drawer, rarity tags, comparison against equipped gear, a receipt, and a locker of owned items.
- "View the Course": a free-look camera before the first stroke, and a mouse- or touch-controlled orbit camera around the ball after the shot.
- A rolling animation for the ball.
- Retuned shot power, so full power feels proportionally stronger.
- Cannons that turn to aim toward the hole before firing.
- Mole pop-up animations, and a fix for moles appearing outside the course.
- A new tunnel element, with courses becoming progressively hillier and more complex.

## 4. Required Inputs

**From the player**
- Pointer or touch input for the shot: press, drag direction and distance, release.
- Clicks or taps in the Pro Shop: add to cart, remove from cart, purchase, close the reveal, navigate to the course.
- Optional inputs: reopening the tutorial, and camera movement once View the Course ships.

**From the system**
- Saved progress in browser storage (`hole-in-one-progress-v1`): XP balance, hole count, equipped and owned club and ball IDs, and claimed tiers.
- Saved course state (`hole-in-one-course-v1`): current level and completion state.
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
5. A celebration shows the XP earned, and the player continues to the next hole.

**Flow B: Purchasing gear**
1. The player opens the Pro Shop from the course.
2. The player reviews the current tier's three clubs and three balls, with stats and prices.
3. The player selects **Add to cart** on an item. If the balance covers both a club and a ball, both may be added together.
4. The cart shows the item prices, the total, and the remaining XP.
5. The player selects **Purchase**. The gear is equipped and a reveal animation plays.
6. The reveal offers **Play a hole**, which returns the player to the course with the new gear.

**Flow C: Returning player**
1. The player opens the site, and saved XP, gear, and course level load from browser storage.
2. The player either resumes at the saved hole or visits the shop to spend accumulated XP.

**Flow D: Viewing the course (planned)**
1. Before the first stroke, the player selects **View course**. Shooting is disabled.
2. The player drags to pan or orbit and scrolls or pinches to zoom. An optional flyover runs from tee to cup.
3. The player selects **Back to tee** and takes the shot.
4. During the shot, the player can drag to orbit the camera around the ball, and can reset the view at any time.

## 6. Constraints

- **The guaranteed outcome is fixed.** The first stroke on every hole must reach the cup. No feature, tuning change, or new element may break this.
- **No real money.** All currency is XP earned in the game. The product must not offer real purchases or collect payment information.
- **Visible causes only.** Course rescues and assists must be visible on screen. Walls must follow the fairway with matching collision, and there must be no invisible boundaries or unexplained curves.
- **Saves must stay compatible.** Changes must keep existing saved progress working, including storage keys, data shape, gear IDs, and prices.
- **No visible content cap.** Players must never see the total number of tiers or holes, even though the catalog has internal limits (1,000 gear tiers per type, 250 base holes).
- **Purchases stay quick.** Buying a single item must take no more than two clicks from its card.
- **Accessibility.** Animations must respect the operating system's reduced-motion setting. Meaningful text must be at least 13px and remain readable in narrow browser windows.
- **Progress is per browser.** Progress is stored only in the visitor's browser and does not sync across devices.

## 7. Interface Requirements

**Course screen**
- A full-screen course with a minimal HUD: level, equipped club, wind indicator, and power percentage with a fill bar.
- An aim preview while dragging, and short callouts for events such as "CANNON FIRED" and "RIGHT IN THE CUP!"
- Clear access to the Pro Shop and to **How to play**.
- A broad, colorful palette, with navigation and XP still easy to find.

**Pro Shop**
- Brand colors: green as the grounding clubhouse color, burnt orange for actions and selected gear, and yellow (`--xp-yellow`) for XP figures, price badges, and progress.
- The XP balance is the most prominent number on the screen.
- Bold titles, large key numbers, and very little explanatory copy.
- Item cards show name, stats, price, and state (available, in cart, owned, or unaffordable).
- The cart always shows each item's price, the total, and the balance after purchase.
- The purchase reveal uses confetti and motion, and has a reduced-motion alternative.

**General**
- Responsive web layouts that work in wide desktop browser windows and narrow ones (such as a phone browser), with no horizontal scrolling.
- Input works with mouse and trackpad, and with touch when the site is opened on a touchscreen.
- The tutorial is a single screen with a clear dismiss action, and can be closed with Escape.

## 8. Technical Constraints

- **Static site with no build step.** The site is plain HTML, CSS, and JavaScript files served as-is. There are no package dependencies or frameworks.
- **Hosting.** The site is deployed on Vercel at hole-in-one-roan.vercel.app. Source control is GitHub (AniPupper/hole-in-one), managed through GitHub Desktop.
- **Storage.** The site uses browser `localStorage` only. There is no backend, database, or server-side logic.
- **Rendering.** The classic renderer uses the 2D canvas. The 3D renderer requires WebGL2 and is currently opt-in at `game.html?render=3d`. The classic view remains the default until the 3D view is verified across devices.
- **Physics.** The simulation runs at a fixed 120 Hz step. The ball's top speed must stay below one ball radius of travel per step, or the step rate must be raised, so that collisions with thin objects are always detected.
- **Deterministic content.** Courses come from a checked-in catalog generated by `tools/build_course_blueprints.py`, and gear tiers come from deterministic generation in `gear-progression.js`. Regenerating content is a deliberate source change.
- **Testing.** An automated smoke suite (`tests/run_smoke.py`) checks shop progression, persistence, course shot traces, layout uniqueness, and physics timing. 3D contract tests check mesh and collision consistency. Changes must pass the suite before release.
- **Development process.** Features are built with AI coding agents working on separate branches. Changes are reviewed before being merged into `main`, and a backup tag preserves known-good states.

---

## Success Criteria

- 100 percent of first strokes reach the cup across the full course catalog in automated tests.
- A first-time visitor completes their first hole within 60 seconds of opening the site.
- A single-item purchase takes no more than two clicks, and a club plus ball together takes no more than three.
- Existing saved progress loads without loss after every release.
- The course and shop render without layout breakage in standard desktop browser windows and in narrow 375px-wide browser windows.
