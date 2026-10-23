# Course QA — 2026-10-22

This is a source and deterministic VM audit of the production `game.js` course. Browser visual inspection is handled by the parent agent; this subagent's direct `file://` browser access was blocked by URL policy. Screen positions below are projections, not verified screenshots.

## Verified current behavior

- **First shot:** 108/108 Rookie shots sank after the full-width hinged backstop change (holes 1, 2, 4, 5, 7, 10; powers 5%, 60%, 100%; aims 0°, 45°, 90°, 135°, 180°, 270° relative to the tee tangent). Longest: hole 7, 45°/60%, 28.17 s. Simulated at 120 physics steps/s.
- **Near-cup steering:** Instrumenting 5,520 steering steps found maximum horizontal speed difference of `1.78e-15` before versus after the heading rotation (floating-point noise). The largest turn was 0.00662 rad/step; the turn occurred only inside 2.3 world units of the cup. The painted contour/slope force extends to radius 3.3.
- **Backstop:** It uses shared art/collision geometry: front face 1.25 units beyond the cup along the final path tangent, span ±1.8, top ground +0.55, thickness 0.14. In 30 synthetic overshoots (holes 1/4/10/100/250, across offsets 0/0.6/1.5, incoming speeds 5/7), all sank with 0 mole contacts and maximum duration 4.28 s. The same current code with only backstop collision disabled still sank all 30 but required 11 mole contacts and up to 6.53 s; this is an ablation, not a historical build comparison. Rear arrivals at speeds 2/5/8 remain against the rear face while its visible hinged panel opens for 0.22 s, then are released.
- **Route variety:** All 250 authored blueprints have different adjacent route/feature signatures. The closest feature-center pair is 3.87 world units apart (hole 4, windmill/bumper). Route span grows from 8.18 (hole 1) to 33.64 (hole 250).
- **Height-gated contacts:** Earlier elevated-ball river and pad contact repros on hole 5 now return no current or boost after the fix.

## Open findings and visual checks

| Priority | Reproduction | Finding |
| --- | --- | --- |
| P1 | Hole 4/10/20/100/250, 45° aim, 60% power | In the final baseline after an experimental loft was reverted, the ball spent about 9.0/12.7/13.3/14.1/11.1 s more than 3.2 units from the centerline. Max offsets were about 6.4/8.2/5.9/6.8/6.3 world units; the holes still sank, but the ball visibly risks roaming through empty space for too long. |
| P2 | Cup lip, ball center 0.42 units from cup | The painted mouth has half-axes 0.51 × 0.49 and ball radius is 0.19, yet sinking starts at center distance <0.43. The ball can overlap the visible lip by roughly 0.1 world unit as it begins to fall. This is a source geometry mismatch; verify visually. |
| P2 | Cannon contact outside central 0.64 × 0.50 boost ellipse | Production cannon has a central boost trigger but no matching solid body/wheel collider. A ball can pass through decorative cannon parts. |
| Visual | 390×844 hole 4 / 8 | Projected hole-4 windmill center is x≈28 px and may clip the left edge. Hole-8 bridge/bumper/cup crowd x≈45–70 px. Inspect in the existing authorized IAB preview. |
| Visual | 1280×720 hole 20 / 100 / 250 | Hole-20 cannon/windmill projected centers are ≈28 px apart; hole-100 loop/bridge and hole-250 bridge/loop project into overlapping vertical ranges. Inspect depth and occlusion in IAB. |
| Visual | Equipped tier 7, 100, 250 club | Source maps generated clubs to distinct names, color, family silhouette, tier inlays, and vertical head/shaft art. Check in IAB that HUD and rendered club visibly update and persist after reload. |

## Isolated 3D gallery review

`prototype-3d/gallery.js` is separate from production. Its pad outer half-axes, windmill tower and rotor span, bridge deck and rails, cup mouth, and backstop nominal dimensions closely match production. The designer aligned the gallery's pad lighting across the full contact disc, rail cap to 0.74, and bowl contour to radius 3.3, and documented its rotor phase as a sample to replace with each production feature's phase on integration. Gallery visuals were source-reviewed only.

## Opt-in playable 3D trial — latest source/VM checks

- `tests/three_d_contract.cjs` passes headless WebGL2 mesh/API checks on holes 1/2/4/5/6/20/100/250. Static and dynamic vertex uploads, moving props, the hinged backstop, mole, upgraded gear, and animated bridge water all produce finite triangle geometry and camera matrices. The test ran after the richer river animation was ported.
- `tests/three_d_physics_contract.cjs` passes local river contact/current/dry exit and bridge ramp/deck checks on holes 5/20/100/250. The cup support drops 0.12 at center and a near-cup test shot sinks in 1.04 s. The center-to-±1.7 fairway height difference across holes 4/5/100/250 is at most 0.041 after the cross-slope fix.
- The 100% launch speed and first 0.2 s travel are each 2.58× the 50% values. Thirty 100% shot traces across holes 1/4/5/10/100/250 and aims 0°/45°/90°/180°/270° all sink; the longest takes 18.37 s. This is a targeted post-patch check, not a full-catalog guarantee.
- Remaining visual concern: hole 250, 270° aim, 100% power reaches about 12.3 world units from the centerline before recovery. The ball still sinks, but it can leave the visible course context. Browser confirmation of water and cup appearance is delegated to the parent agent because this subagent's local browser URL was policy-blocked.
