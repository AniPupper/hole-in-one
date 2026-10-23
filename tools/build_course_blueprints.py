"""Compile the curated 250-hole plan into literal browser data.

The browser reads the checked-in output. Nothing is randomized at runtime.
Run this only when editing the authored route/obstacle families below.
"""

import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
START_Z = 2.65

CHAPTERS = [
    "Sunrise", "Clover", "Copper", "Driftwood", "Bluebird", "Moonbeam",
    "Wildflower", "Starlight", "Golden", "Tangerine", "Willow", "Firefly",
    "Cloudburst", "Amber", "Seabreeze", "Silver", "Comet", "Canyon",
    "Aurora", "Thunder", "Marigold", "Velvet", "Solstice", "Meteor", "Legend",
]
ROUTES = [
    # Opening/exit slopes are world z per world x. These seven introductions
    # keep their authored silhouette while later holes use the larger set.
    (-.22, -.18, []),
    (.42, -.24, [[.43, .26, 1.25]]),
    (-.54, .12, [[.43, .27, -1.45]]),
    (.34, .10, [[.29, .23, 1.42], [.68, .24, -1.30]]),
    (-.42, -.30, [[.28, .23, -1.48], [.68, .25, 1.42]]),
    (.52, -.43, [[.52, .30, 1.75]]),
    (-.12, .47, [[.48, .27, -1.55]]),
]
# Beyond the seven teaching holes, use a larger authored set of silhouettes.
# Entries are (title, route description, opening tangent, exit tangent, bends).
# Monotone x and broad bend widths keep the rails readable and avoid hairpins.
LATE_ROUTES = [
    ("Crescent Left", "long left crescent", .31, -.08, [[.47, .30, 1.95]]),
    ("Crescent Right", "long right crescent", -.33, .10, [[.46, .30, -2.0]]),
    ("Early Hook", "early left hook", .47, -.26, [[.28, .19, 1.72]]),
    ("Reverse Hook", "early right hook", -.49, .27, [[.27, .19, -1.78]]),
    ("Late Sweep", "late left sweep", -.07, .43, [[.68, .20, 1.88]]),
    ("Late Return", "late right sweep", .08, -.45, [[.69, .20, -1.82]]),
    ("Double S", "left-right S curve", .34, -.31, [[.28, .18, 1.55], [.71, .19, -1.68]]),
    ("Reverse S", "right-left S curve", -.33, .32, [[.29, .18, -1.62], [.70, .19, 1.58]]),
    ("Three-Beat Slalom", "three sweeping turns", .22, -.22, [[.24, .16, 1.32], [.51, .17, -1.64], [.77, .16, 1.34]]),
    ("Mirror Slalom", "three reverse turns", -.23, .24, [[.24, .16, -1.38], [.51, .17, 1.68], [.76, .16, -1.29]]),
    ("High Outside", "wide outside arc", .51, -.39, [[.45, .25, 1.73]]),
    ("Low Outside", "wide reverse arc", -.52, .40, [[.45, .25, -1.78]]),
    ("Left Stair", "two leftward bends", .32, -.05, [[.31, .17, 1.15], [.69, .20, 1.18]]),
    ("Right Stair", "two rightward bends", -.34, .06, [[.31, .17, -1.19], [.68, .20, -1.20]]),
    ("Crosswind Turn", "left bend then a late right", .41, -.39, [[.23, .17, 1.70], [.76, .16, -1.43]]),
    ("Tailwind Turn", "right bend then a late left", -.42, .38, [[.23, .17, -1.68], [.76, .16, 1.48]]),
    ("Long Swoop", "single deep left bend", -.12, -.28, [[.56, .29, 2.35]]),
    ("Long Dive", "single deep right bend", .14, .30, [[.55, .29, -2.32]]),
    ("Copper Chicane", "tight-spaced S curve", .35, .14, [[.37, .17, 1.82], [.62, .17, -1.82]]),
    ("Silver Chicane", "tight-spaced reverse S", -.35, -.14, [[.37, .17, -1.80], [.62, .17, 1.82]]),
    ("Summit Bend", "climbing left turn", .25, .36, [[.34, .21, 1.45], [.72, .20, -.82]]),
    ("Valley Bend", "descending right turn", -.24, -.37, [[.34, .21, -1.48], [.72, .20, .85]]),
    ("Far Side Run", "late left double bend", -.15, .32, [[.55, .18, .82], [.78, .17, 1.48]]),
    ("Far Side Return", "late right double bend", .16, -.33, [[.55, .18, -.85], [.78, .17, -1.46]]),
]
# These sequences vary what happens as the ball travels forward. Length and
# spacing are assigned separately so the geometry grows more playful over time.
FEATURE_SEQUENCES = [
    ("bumper", "pad", "cannon", "windmill", "loop"),
    ("pad", "bridge", "bumper", "cannon", "windmill"),
    ("loop", "bumper", "windmill", "cannon", "pad"),
    ("cannon", "pad", "bumper", "loop", "bridge"),
    ("windmill", "bumper", "loop", "pad", "cannon"),
    ("bridge", "loop", "pad", "windmill", "bumper"),
    ("bumper", "cannon", "windmill", "pad", "loop"),
    ("pad", "loop", "bridge", "bumper", "cannon"),
    ("windmill", "loop", "cannon", "bumper", "pad"),
    ("loop", "pad", "bumper", "cannon", "windmill"),
    ("cannon", "bumper", "windmill", "loop", "pad"),
    ("cannon", "bridge", "loop", "pad", "bumper"),
    ("bumper", "windmill", "pad", "bridge", "cannon"),
    ("pad", "cannon", "loop", "bumper", "bridge"),
    ("loop", "pad", "bumper", "windmill", "cannon"),
    ("windmill", "pad", "cannon", "bridge", "loop"),
    ("pad", "cannon", "windmill", "bumper", "loop"),
    ("cannon", "bumper", "pad", "bridge", "windmill"),
    ("bumper", "loop", "cannon", "windmill", "pad"),
    ("pad", "windmill", "bumper", "loop", "bridge"),
    ("loop", "cannon", "bridge", "pad", "windmill"),
    ("windmill", "loop", "pad", "bumper", "bridge"),
    ("windmill", "pad", "loop", "cannon", "bumper"),
    ("cannon", "windmill", "bridge", "loop", "pad"),
]
FEATURE_PLANS = [
    [],
    [["bumper", .36, .48]],
    [["pad", .31, 0], ["bumper", .68, -.65]],
    [["loop", .32, 0], ["windmill", .67, -1.25], ["bumper", .85, .65]],
    [["bumper", .24, .70], ["bridge", .56, 0], ["pad", .82, 0]],
    [["cannon", .25, 0], ["windmill", .53, -1.15], ["pad", .81, 0]],
    [["bumper", .13, .75], ["pad", .35, 0], ["loop", .53, 0], ["bridge", .70, 0], ["cannon", .86, -.4]],
]

FIRST_TITLES = [
    "The First Green", "The Friendly Bumper", "Little Launch", "The Sky Loop",
    "Driftwood River", "Cannonball Corner", "The Grand Detour",
]
FIRST_SUBTITLES = [
    "One little green. One perfectly impossible shot.",
    "A gentle nudge in exactly the right direction.",
    "The sky is just another shortcut.",
    "Round and round, then straight to glory.",
    "The current has excellent aim.",
    "Some shots call for a cannon.",
    "Every shortcut in the world, all at once.",
]


def hash_unit(a, b, c=0):
    value = (a * 73856093 ^ b * 19349663 ^ c * 83492791) & 0xFFFFFFFF
    value ^= value >> 16
    value = value * 0x7FEB352D & 0xFFFFFFFF
    value ^= value >> 15
    return (value & 0xFFFFFF) / 0x1000000


def build(level):
    chapter = (level - 1) // 10
    family = (level - 1) % 10
    early = level <= 7
    route_index = (chapter * 7 + family * 13) % len(LATE_ROUTES)
    if early:
        opening, exit_slope, template_bends = ROUTES[family]
    else:
        route_name, route_label, opening, exit_slope, template_bends = LATE_ROUTES[route_index]
    # Every route remains long enough for the largest five-prop sequence. The
    # progression levels off rather than turning into an empty, giant green.
    span = ([8.18, 11.3, 14.2, 17.5, 20.3, 23.5, 26.4][level - 1]
            if early else 25.2 + min(chapter, 14) * .59 + (route_index % 4) * .32)
    cup_z = (-2.35 if level == 1 else
             -2.35 + (hash_unit(chapter + 9, family + 5) - .5) * (1.2 if early else 4.4))
    if early:
        opening *= .52
        exit_slope *= .6
        bends = [[t, w, round(a * .53, 3)] for t, w, a in template_bends]
    else:
        opening = round(opening * (.84 + hash_unit(chapter, family, 7) * .32), 3)
        exit_slope = round(exit_slope * (.84 + hash_unit(chapter, family, 8) * .32), 3)
        bends = [[round(t + (hash_unit(chapter, family, 9 + i) - .5) * .075, 3),
                  round(w * (.91 + hash_unit(chapter, family, 15 + i) * .18), 3),
                  round(a * (.84 + hash_unit(chapter, family, 22 + i) * .32), 3)]
                 for i, (t, w, a) in enumerate(template_bends)]
    c1 = round(START_Z + opening * span / 3, 3)
    c2 = round(cup_z - exit_slope * span / 3, 3)
    if level == 1:
        c1 = round(START_Z + (cup_z - START_Z) / 3, 3)
        c2 = round(START_Z + 2 * (cup_z - START_Z) / 3, 3)
        bends = []
    route = {"c1": c1, "c2": c2, "bends": bends}
    if level < 3:
        hills = []
    elif early:
        hills = [[.42, .21, round(.12 + (level - 3) * .03, 3)]]
        if level >= 6:
            hills.append([.77, .18, .11])
    else:
        hill_t = .27 + hash_unit(chapter, family, 31) * .18
        hills = [[round(hill_t, 3),
                  round(.18 + hash_unit(chapter, family, 32) * .06, 3),
                  round(.13 + hash_unit(chapter, family, 33) * .12, 3)]]
        if level > 20 or (chapter + family) % 3 == 0:
            hills.append([round(.62 + hash_unit(chapter, family, 34) * .16, 3),
                          round(.18 + hash_unit(chapter, family, 35) * .07, 3),
                          round(.12 + hash_unit(chapter, family, 36) * .11, 3)])
        if level > 100 and (chapter + family) % 3 == 1:
            hills.append([round(.47 + hash_unit(chapter, family, 37) * .06, 3),
                          .17, round(.07 + hash_unit(chapter, family, 38) * .07, 3)])
    if early:
        specs = FEATURE_PLANS[level - 1]
    else:
        plan = FEATURE_SEQUENCES[(chapter * 17 + family * 7) % len(FEATURE_SEQUENCES)]
        count = (3 if level <= 20 else 4 if level <= 100 else
                 4 + ((chapter + family) % 2))
        positions = {3: (.23, .51, .78), 4: (.17, .38, .60, .81),
                     5: (.13, .30, .47, .64, .81)}[count]
        specs = []
        for i, kind in enumerate(plan[:count]):
            sign = -1 if hash_unit(level, i, 40) < .5 else 1
            unit = hash_unit(level, i, 41)
            across = (sign * (.48 + unit * .27) if kind == "bumper" else
                      sign * (.92 + unit * .22) if kind == "windmill" else
                      (unit - .5) * .24 if kind in ("pad", "cannon") else 0)
            specs.append([kind, positions[i], across])
    features = []
    for i, (kind, t, across) in enumerate(specs):
        shifted_t = t if early else round(t + (hash_unit(chapter, family, 50 + i) - .5) * .028, 3)
        features.append({
            "kind": kind, "t": shifted_t, "across": round(across, 3),
            "phase": round(hash_unit(level, i, 53) * 6.283185, 4),
            "move": round(.22 + hash_unit(level, i, 54) * .12, 3) if kind == "bumper" else 0,
            "rate": round(.8 + hash_unit(level, i, 55) * .5, 3),
        })
    bridge = next((f for f in features if f["kind"] == "bridge"), None)
    river_t = bridge["t"] if bridge else None
    title = FIRST_TITLES[level - 1] if early else f"{CHAPTERS[chapter]} · {route_name}"
    subtitle = FIRST_SUBTITLES[level - 1] if early else f"A new {route_label} awaits. Take the shot."
    return {
        "number": level, "title": title, "subtitle": subtitle,
        "span": round(span, 3), "cupZ": round(cup_z, 3), "route": route,
        "hills": hills, "features": features, "riverT": river_t,
    }


def main():
    courses = [build(level) for level in range(1, 251)]
    assert len({c["title"] for c in courses}) == 250
    # These checks keep future catalog edits from drifting back to a handful
    # of repeated silhouettes, crowded props, or steep fairway grades.
    route_shapes = set()
    prop_orders = set()
    for course in courses:
        span, route = course["span"], course["route"]
        start_z, cup_z = START_Z, course["cupZ"]
        prop_orders.add(tuple(f["kind"] for f in course["features"]))
        features = course["features"]
        assert all((b["t"] - a["t"]) * span > 3.0
                   for a, b in zip(features, features[1:])), course["number"]
        assert course["riverT"] == next(
            (f["t"] for f in features if f["kind"] == "bridge"), None)

        def profile(t):
            u = 1 - t
            z = (u**3 * start_z + 3 * u * u * t * route["c1"] +
                 3 * u * t * t * route["c2"] + t**3 * cup_z)
            z += math.sin(math.pi * t)**2 * sum(
                a * math.exp(-((t - center) / width)**2)
                for center, width, a in route["bends"])
            y = math.sin(math.pi * t)**2 * sum(
                height * math.exp(-((t - center) / width)**2)
                for center, width, height in course["hills"])
            return z, y

        route_shapes.add(tuple(round(profile(t)[0] - (start_z + (cup_z - start_z) * t), 1)
                               for t in (.2, .4, .6, .8)))
        heights = [profile(i / 200)[1] for i in range(201)]
        assert max(heights) < .5, course["number"]
        assert max(abs(b - a) * 200 / span for a, b in zip(heights, heights[1:])) < .08, course["number"]
    assert len(route_shapes) >= 220, len(route_shapes)
    assert len(prop_orders) >= 40, len(prop_orders)
    payload = "[\n" + ",\n".join(
        "  " + json.dumps(course, separators=(",", ":"), ensure_ascii=False)
        for course in courses
    ) + "\n]"
    output = (
        "// Authored 250-hole plan. Rebuild with tools/build_course_blueprints.py.\n"
        "// Each literal entry fixes the route, elevations, props and title for a hole.\n"
        "const COURSE_BLUEPRINTS = " + payload + ";\n"
        "window.CourseBlueprints = Object.freeze({courses:COURSE_BLUEPRINTS,\n"
        "  get(level){const n=Math.max(1,Math.floor(Number(level)||1));"
        "const base=COURSE_BLUEPRINTS[(n-1)%250];const cycle=Math.floor((n-1)/250);"
        "if(!cycle)return base;const mirror=cycle%2?-1:1;const cupZ=base.cupZ+(cycle%2?.9:-.9);"
        "return {...base,number:n,title:`${base.title} · Encore ${cycle+1}`,"
        "subtitle:`A fresh angle on a legendary green.`,"
        "cupZ,"
        "route:{c1:2.65+(cupZ-2.65)/3+mirror*(base.route.c1-(2.65+(base.cupZ-2.65)/3)),"
        "c2:2.65+2*(cupZ-2.65)/3+mirror*(base.route.c2-(2.65+2*(base.cupZ-2.65)/3)),"
        "bends:base.route.bends.map(([t,w,a])=>[t,w,a*mirror])},"
        "features:base.features.map(f=>({...f,across:f.across*mirror}))};}\n"
        "});\n"
    )
    (ROOT / "course-blueprints.js").write_text(output, encoding="utf-8")


if __name__ == "__main__":
    main()
