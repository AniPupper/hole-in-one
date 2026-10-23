# Hole in One

A dopamine-forward mini golf game where **every first stroke is a hole-in-one**. The fun comes from the spectacle of *how* the ball reaches the cup, no matter how the player aims or how far they pull back.

## Game concept

- The home screen is a playable mini golf course. Click or press and hold, pull back to aim and set power, then release to swing.
- Every first shot reaches the hole. A weak shot might get a visible gust of wind; later holes can use loops, launch pads, cannons, lazy rivers, and increasingly elaborate chain reactions.
- Each hole-in-one ends with confetti and awards XP. Later levels should build toward a roughly minute-long sequence of quick, surprising events before the ball drops.
- The game HUD can show the level, equipped club, wind, and swing power.
- A side button opens the Pro Shop. At XP milestones, the player chooses **one of three** clubs and **one of three** balls to replace current gear. Later clubs improve distance, height, and trick potential; later balls improve bounce, spin, and roll.

## Implemented now: Pro Shop

The Pro Shop is a responsive screen with three club and three ball choices per reward tier, stat comparisons, bright XP price tags, one-time purchases, current gear, and browser-local saved progress. Clicking a club or ball card adds it to a single cart. The cart can hold one club and one ball, lets the player switch or remove either item, and completes both upgrades in one purchase. A single item takes two clicks from its card: **Add to cart**, then **Purchase**. The cart shows each price, their sum, and the remaining XP balance. When the balance covers both items, the current club and ball choices are added together automatically so buying both still takes two clicks. Purchase immediately equips the gear and starts an animated reveal with confetti; it respects reduced-motion settings. The reveal leads straight to **Play a hole**, while the close button returns to browsing. The prominent **Play a hole** links open `game.html`, the full-screen course; its **Pro Shop** link returns to `index.html`.

Open `index.html` in a browser. The project currently has no build step or package dependencies. If local file restrictions interfere with fonts or storage, serve the directory with `python3 -m http.server 8000` and open `http://localhost:8000`.

Run the automated progression and physics smoke suite with `python3 tests/run_smoke.py`. See [TESTING.md](TESTING.md) for coverage, browser checks, and current visual polish priorities.

## Deployment

This is a static site with no build step. For a direct Vercel deployment, upload only `index.html`, `game.html`, `styles.css`, `game.css`, `game-3d.js`, `tutorial.css`, `script.js`, `game.js`, `tutorial.js`, `shop-tutorial.js`, `gear-progression.js`, `ball-upgrades.js`, and `course-blueprints.js` as a folder or ZIP through [Vercel Drop](https://vercel.com/drop). Keep these files at the upload root so `/` opens `index.html` and `/game.html` opens the course. Do not include `.git`, tests, or project notes in the site upload.

Choose a Vercel team and project name, then deploy. Vercel Drop creates a production project without a Git commit. For later edits, upload the refreshed folder to the existing project in its Vercel dashboard; a new drop from `/drop` creates a separate project. The deployed game saves XP and gear in each visitor's browser `localStorage`, so progress stays with that browser and does not sync across devices.

**Publication status:** The site is live at [hole-in-one-roan.vercel.app](https://hole-in-one-roan.vercel.app/). The public shop and `/game.html` course both opened successfully on October 22, 2026. The current Vercel deployment method and its GitHub auto-deploy connection have not been independently verified; check the project's Vercel dashboard before assuming future commits publish automatically.

## Progress data

Progress is stored in `localStorage` under `hole-in-one-progress-v1`. It includes a spendable XP balance, hole-in-one count, equipped/owned club IDs and ball IDs, and purchased club/ball tier arrays. The ball fields are `equippedBall`, `ownedBalls`, and `claimedBallTiers`; existing saves without them are normalized to the Classic White starter ball. New visitors start with 0 XP, the Rookie club, the Classic White ball, and Hole 1. There are **1,000 sequential club tiers and 1,000 sequential ball tiers**, each with three choices. This is an internal cap: player-facing screens show only the current tier or hole, never a finite content total. The first six tiers are hand designed; the remaining 994 tiers per gear type are generated deterministically by `gear-progression.js`, with stable IDs, changing colors and patterns, rising stats, and steadily increasing XP prices. Club prices begin at 1,000, 2,600, 5,200, 9,000, 15,000, and 24,000 XP; ball prices begin at 900, 2,400, 5,000, 8,500, 14,500, and 23,000 XP. Only one choice may be purchased at each tier. Buying gear spends its listed price; a combined cart spends the sum of the club and ball prices. Curated club data lives in `script.js`; curated ball data and ball artwork live in `ball-upgrades.js`.

## Shared game progress

The course view awards XP by increasing `xp` and increments `holeCount` in the same saved object, preserving the shop's equipped gear, ownership, and claimed tiers. It stores course progress separately under `hole-in-one-course-v1` as `{ level, completed }`. The shop reads the shared progress each time it opens. The equipped ball has a visible skin in the course and modest bounce, spin, and roll effects while every shot still reaches the cup.

The course should have an open tee so the first shot cannot get trapped between starting walls. Side walls should then follow the fairway, including its turns and hills, with visible art and matching collision shapes. Off-course shots should meet those walls or an obvious environmental rescue, never an invisible boundary or unexplained curve.

Near the cup, the current game turns the ball gently toward the hole only inside the visible bowl while preserving its horizontal speed through that turn. A timber backstop sits behind the hole along the final route tangent; its rear flap opens visibly before a ball can pass back through. The backstop reduces near-cup mole rescues. See [COURSE_QA.md](COURSE_QA.md) for the remaining off-route, cup-lip, cannon-collider, and projected-overlap findings.

## First-visit tutorial

The first screen opened, Pro Shop or course, shows the single-screen tutorial for a new visitor. It shows how to hold, pull back, aim, and release; explains visible course assists and the guaranteed first-shot hole-in-one; and points to spendable XP and the Pro Shop's cart and Purchase step for club and ball upgrades. **Play a hole** enters the course. The shop's **Explore the shop** action, the close button, and Escape dismiss it. **How to play** on the course reopens it. Shots require the player's pointer or touch pullback and release; there is no automatic swing button. Only `hole-in-one-tutorial-seen-v1` is stored for tutorial state. The tutorial files are `tutorial.css`, `tutorial.js`, and `shop-tutorial.js`.

## Course catalog

`course-blueprints.js` contains **250 fixed course plans**. Each plan specifies its title, route control points and bends, hill positions, and obstacle locations and motion. The first seven holes introduce the game gently; later holes use 24 route silhouettes, 51 obstacle orders, broad low hills, and changing mixes of launch pads, windmills, loops, cannons, bumpers, bridges, and rivers. The current catalog has 249 distinct rounded route shapes and rivers on 114 holes. The game uses the stored plan directly, so reloading a hole reproduces it. After hole 250, encore holes reuse the catalog with alternating mirrored turns so play can continue. The editable plan families and compiler are in `tools/build_course_blueprints.py`; regenerating the checked-in catalog is a deliberate source change, never a runtime random roll. `tests/preview-hole.html` is a disposable local HTTP launcher for visually reviewing a particular hole without playing through the entire catalog.

## Visual direction

In the Pro Shop, use green as a grounding clubhouse color, burnt orange for energetic actions and selected gear, and yellow for XP. Use `--xp-yellow` for the large balance card, price badges, and progress fill; use `--xp-yellow-text` for plain inline XP phrases without highlight blocks. Show the XP balance as a large, high-contrast hero number. Favor flashy titles, large important numbers, and very little explanatory copy. Keep labels, stats, prices, and actions comfortably readable on mobile as well as desktop, with meaningful text generally at least 13px. The two-click cart and purchase flow should lead straight into the gear reveal. The course can use a broader, more colorful palette while keeping navigation and XP easy to spot.

## 3D element prototype

`prototype-3d/index.html` is a local, self-contained WebGL2 gallery for reviewing course and equipment elements from multiple angles. It covers the fairway, rails, lighter ball families, closed vertical clubs, circular pad, pinball bumper, mole, windmill, animated below-grade river, smooth bridge, recessed cup, curved static backstop, loop, and loading cannon. Its geometry contract and review steps are in `prototype-3d/README.md`. An opt-in WebGL2 trial uses `game-3d.js` at `game.html?render=3d`; the normal game keeps its existing renderer. `prototypes/ball-upgrades-preview.js` preserves a draft of later-tier ball artwork for that review without changing the production ball catalog.

The gallery now includes the revised clubs, balls, cup, pinball bumper, mole, and Review 04 river motion. The opt-in playable 3D trial uses matching WebGL terrain and objects while retaining the original view as the default. The pad has a matching circular collider, the river and bridge share graded physics support, the cup has a physical bowl, and the cannon briefly loads before firing. Automated mesh and contact checks are in `tests/three_d_contract.cjs` and `tests/three_d_physics_contract.cjs`. Browser visual review remains useful before making the 3D trial the default.
