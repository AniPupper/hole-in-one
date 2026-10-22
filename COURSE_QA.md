# Course QA

Source-based findings and acceptance checks for the first-person course. Visual browser inspection is handled by the parent agent; this subagent's attempt to open `file://` in the in-app browser was blocked by the browser URL policy.

## Findings to verify after the layout and physics revision

| Severity | Reproduction | Finding / acceptance check |
| --- | --- | --- |
| P1 | Level 1, 60% power, aim 45° right of cup | Pre-revision horizontal z velocity changes from +0.96 to -0.04 in 0.5 s with no wind or contact. Cup attraction acts globally. Initial heading should persist until a visible force or collision; any near-cup slope should match its visible bowl. |
| P1 | Level 5, desktop 1280×720 | Cup (640,268), bridge (633,265), loop (638,240) project into nearly the same screen location. World layout, camera and depth ordering must preserve a readable route. |
| P1 | Level 4–5, mobile 360×640 | Intro card is approximately x12–185/y101–277; current windmill hub (109,177), loop (178,213), bridge (174,236), cup (180,238) sit under it. Keep interactive route and target outside HUD occlusion. |
| P1 | Level 5, any shot behind bridge or windmill | Feature/cup/ball rendering is currently fixed by type rather than camera depth. Ball must appear behind nearer rails or blades, and distant flag must not paint over nearer bridge. |
| P2 | Bank into any perimeter wall | Pre-revision ball center clamps to the visible wall plane; account for ball radius in contact, without penetration. |
| P2 | Levels 3–7, contact with pads/loop/river/bridge/windmill | Pre-revision pad boost circle, loop ground trigger, river current, bridge railings and windmill did not all match drawn footprints. Check collider against the visible, moving surface at contact time. |
| P2 | Compare levels 2, 4, 5, 7, 10 and reload each | Later levels need distinct, growing routes, elevation, moving elements, spaced props and cup arrangements. Same level should remain deterministic across reloads. |
| P1 | Hole 10 / hole 12 | Procedural feature spacing is too small: hole 10 loop (13.81,-1.94) vs bridge (14.16,-1.93), 0.35 units; hole 12 bridge (14.06,-2.61) vs bumper (14.17,-2.28), 0.35 units. Hole 8 loop/bridge gap is 1.28; hole 15 pad/bridge gap is 0.91. Add deterministic minimum clearance or deliberately designed shared collision geometry. |
| P1 | Equip a tier-4–6 shop club, then open/reload game | Club HUD and vertical render must use the equipped ID. Initial game catalog omitted wildfire through kaleido, causing Rookie fallback; name/color mapping has since been added, but distinct silhouettes/detail and IAB visual check remain. |

## Source pass update

- New `courseLayout(level)` is deterministic on repeat calls and grows from about 9.6 world units at hole 1 to 34.1 at hole 15, with turns and raised sections. The later-hole spacing exceptions above still need correction.
- Programmer removed the far-field cup attraction that caused the 45°/60% level-1 unexplained turn; verify with a new shot sweep. Early tee is open, and curved fairway rails are being aligned to a shared `corridorHalfWidth(t)` geometry.
- Source now maps all current club names/colors, matches flag art to the flag collider, and uses feature-centered windmill/bridge/pad geometry. Final render depth, moving-prop clock synchronization, hill/rail surface agreement, and guaranteed completion still require integrated verification.

## Shot sweep after revision

- On levels 2, 4, 5, 7 and 10, try 5%, 60% and 100% power, aimed toward cup, 45° off-axis, sideways and backward. Every first shot should finish, visibly earn one hole-in-one, and increase lifetime XP once.
- Track heading and speed before/after every contact. Bounces, gusts, pads, windmill, bridge, mole and cup slope should have visible causes and surfaces that match their collision geometry.
- On mobile and desktop, verify the club remains vertical and visible while aiming, the ball and cup stay in frame, and HUD/popup text does not cover essential course features.
