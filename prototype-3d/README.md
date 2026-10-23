# Course object design lab

With the existing repository server on port 8000, open `http://127.0.0.1:8000/prototype-3d/index.html`. Select an object, drag to orbit it, scroll to zoom, and reset the view from the canvas control. This is a self-contained WebGL2 reference gallery; production pages do not load it.

## Geometry contract

- One model unit equals one game world unit; Y points up. Each prop uses local +X along the route tangent and local +Z across the lane.
- Ball radius is `0.19`. The three family studies use pale pearl shells and conforming Rebound, Whirl, and Glide emblems. The club heads are closed extrusions with distinct driver, wedge, and iron profiles.
- The revised launch pad is circular, radius `0.78`, with its whole raised top as the proposed contact surface. This replaces the earlier `0.82 × 0.71` ellipse **in the prototype only**; production collider geometry has not changed.
- The bumper keeps body radius `0.37` and now has a pinball-style cylindrical crown and spring base. The mole keeps body radius `0.33` with lighter earth materials.
- The windmill tower tapers from X/Z ellipse `0.54 × 0.39` to `0.33 × 0.20` at Y `2.1`. Rotor hub is `(0, 1.72, +0.32)`, blades span `0.15–0.93`. The standalone phase is illustrative; production uses each feature's phase and simulation clock.
- Bridge deck top is `ground + 0.18` for local `|X| ≤ 1.08`. A smoothstep ramp joins the ground at `|X| = 1.36`. Inner rail faces are at local Z `±0.82` and top at `ground + 0.74`. The separate gallery ball rolls over that shared height profile. In the full assembly, the bridge and water follow a slight host-terrain grade so both ramp ends meet the neighboring turf.
- The river is cut below adjacent ground, with water near `ground − 0.10` and channel bed near `ground − 0.18`. Its local X center meanders across local Z: `0.18 sin(πZ/3.2) + 0.07 sin(3πZ/3.2)`, for `|Z| ≤ 3.2`. The animated surface follows this same centerline. A future current should use the same function and only act when the ball touches the water.
- Cup mouth half-axes are `0.51 × 0.49`; flagpole is local X `+0.72`. A terrain cutout leaves the dark cup inner wall and floor visibly recessed. The shallow bowl and contour rings extend to radius `3.3`, depth `0.12`, with the closer heading-correction region inside `2.3`.
- The proposed fixed timber backstop is a shallow parabola across local Z `±1.8`: inner face `X = 1.25 − 0.18 Z²`, height `ground + 0.55`, thickness `0.14` outward. Its center retains the old X `1.25` reference. The gallery ball strikes the tee-facing surface at Z≈1, reflects along its local normal with restitution `0.82`, then drops into the cup. Production still uses its existing hinged wall; the curved mesh and matching collider require a separate integration decision.
- The loop lies in the local Y/Z plane, across radius `0.82` and center Y `1.1`; the cannon points along local +X. In the Loop & cannon scene, a ball rolls into the rear feed, becomes visible in the recessed muzzle, pauses, and fires along the barrel. The loading sequence is a visual study, not production launch logic.

The static wall can trap an airborne ball that lands directly behind its center. A visible exterior return gutter or a verified taller wall would be needed before using this fixed-wall design in gameplay. The gallery intentionally demonstrates the front-side bank only; it does not conceal this rear-overflight case.

The gallery caches static mesh data and uploads only the windmill rotor, river surface, and demonstration balls each frame. Its directional light and material highlights are a reference; full cast shadows and authored textures would be a later production step.

## Review steps

1. Orbit each club through front, side, and rear views. Check that no head face disappears, the shaft meets the hosel, and the three silhouettes remain distinct.
2. In Ball families, compare the pale shells and conforming symbols. The shallow dimples are geometry, not painted white dots.
3. In River & bridge, watch the water flow below turf grade and the demonstration ball cross ramp, deck, and exit ramp without a step.
4. In Flag & cup, watch a ball hit the fixed wall from the tee side, bank toward the cup, then settle above the dark cup floor. Orbit to confirm that both the terrain surface and cup are genuinely cut out.
5. In Loop & cannon, watch the load, brief seat, and launch sequence. The cannon barrel design remains the same apart from an opened, recessed bore.
