# Hole in One

A dopamine-forward mini golf game where **every first stroke is a hole-in-one**. The fun comes from the spectacle of *how* the ball reaches the cup, no matter how the player aims or how far they pull back.

## Game concept

- The home screen is a playable mini golf course. Click or press and hold, pull back to aim and set power, then release to swing.
- Every first shot reaches the hole. A weak shot might get a visible gust of wind; later holes can use loops, launch pads, cannons, lazy rivers, and increasingly elaborate chain reactions.
- Each hole-in-one ends with confetti and awards XP. Later levels should build toward a roughly minute-long sequence of quick, surprising events before the ball drops.
- The game HUD can show the level, equipped club, wind, and swing power.
- A side button opens the Pro Shop. At XP milestones, the player chooses **one of three** clubs to replace the current club. Later clubs look more elaborate and improve stats such as distance, height, and trick potential.

## Implemented now: Pro Shop

The Pro Shop is a responsive screen with three club choices per reward tier, club stat comparisons, bright XP price tags, one-time unlocks, a current-club panel, and browser-local saved progress. Choosing a club includes an XP checkout summary, an animated equip and reveal, and confetti. The celebration respects reduced-motion settings. The prominent **Play a hole** links open `game.html`, the full-screen course; its **Pro Shop** link returns to `index.html`.

Open `index.html` in a browser. The project currently has no build step or package dependencies. If local file restrictions interfere with fonts or storage, serve the directory with `python3 -m http.server 8000` and open `http://localhost:8000`.

## Progress data

Progress is stored in `localStorage` under `hole-in-one-progress-v1`. It includes cumulative XP, hole-in-one count, equipped club ID, owned club IDs, and claimed reward tiers. New visitors start with 1,240 preview XP so the first reward is ready to choose. Each tier offers a one-of-three club at an escalating XP requirement: 1,000, 2,600, then 5,200 XP. Choosing one club closes that tier; the other two cannot be claimed later. **XP never decreases** when a club is chosen, equipped, or claimed. The shop's club and tier data live in `script.js`.

## Shared game progress

The course view awards XP by increasing `xp` and increments `holeCount` in the same saved object, preserving the shop's equipped club, owned clubs, and claimed tiers. It stores course progress separately under `hole-in-one-course-v1` as `{ level, completed }`. The shop reads the shared progress each time it opens.

## Visual direction

Use green as the grounding course and clubhouse palette, with burnt orange for energetic actions and club price tags. Show total XP on a bright warm surface with a large, high-contrast number. Favor flashy titles, large important numbers, and very little explanatory copy. Choosing a club should feel like an event: select one of three, review the XP requirement, confirm, then reveal the equipped club with motion and confetti.
