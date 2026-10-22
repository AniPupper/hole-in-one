"""Compile the curated 250-hole plan into literal browser data.

The browser reads the checked-in output. Nothing is randomized at runtime.
Run this only when editing the authored route/obstacle families below.
"""

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
START_Z = 2.65

CHAPTERS = [
    "Sunrise", "Clover", "Copper", "Driftwood", "Bluebird", "Moonbeam",
    "Wildflower", "Starlight", "Golden", "Tangerine", "Willow", "Firefly",
    "Cloudburst", "Amber", "Seabreeze", "Silver", "Comet", "Canyon",
    "Aurora", "Thunder", "Marigold", "Velvet", "Solstice", "Meteor", "Legend",
]
SUFFIXES = [
    "The Open Green", "Leftward Leap", "Rightward Rush", "Double Back",
    "Reverse Ripple", "High Arc", "Hidden Hook", "The Switchback",
    "Slalom Run", "The Long Bend",
]
ROUTES = [
    # Opening/exit slopes are world z per world x. Bends use broad Gaussian
    # humps so the offset timber rails stay smooth, even on shorter courses.
    (-.22, -.18, []),
    (.42, -.24, [[.43, .26, 1.25]]),
    (-.54, .12, [[.43, .27, -1.45]]),
    (.34, .10, [[.29, .23, 1.42], [.68, .24, -1.30]]),
    (-.42, -.30, [[.28, .23, -1.48], [.68, .25, 1.42]]),
    (.52, -.43, [[.52, .30, 1.75]]),
    (-.12, .47, [[.48, .27, -1.55]]),
    (.43, .26, [[.25, .20, 1.12], [.53, .20, -1.35], [.78, .20, .95]]),
    (-.48, -.12, [[.24, .20, -1.12], [.51, .20, 1.37], [.78, .20, -1.08]]),
    (.16, -.49, [[.48, .31, 1.80]]),
]
FEATURE_PLANS = [
    [],
    [["bumper", .36, .48]],
    [["pad", .31, 0], ["bumper", .68, -.65]],
    [["loop", .32, 0], ["windmill", .67, -1.25], ["bumper", .85, .65]],
    [["bumper", .24, .70], ["bridge", .56, 0], ["pad", .82, 0]],
    [["cannon", .25, 0], ["windmill", .53, -1.15], ["pad", .81, 0]],
    [["bumper", .13, .75], ["pad", .35, 0], ["loop", .53, 0], ["bridge", .70, 0], ["cannon", .86, -.4]],
    [["bumper", .15, -.65], ["loop", .36, 0], ["bridge", .58, 0], ["cannon", .82, .3]],
    [["pad", .15, 0], ["windmill", .36, 1.12], ["bumper", .59, -.6], ["bridge", .82, 0]],
    [["cannon", .14, 0], ["bumper", .34, .58], ["loop", .56, 0], ["windmill", .80, -1.1]],
    [["windmill", .15, -1.15], ["pad", .36, 0], ["bridge", .57, 0], ["bumper", .80, .6]],
    [["bumper", .14, .7], ["bridge", .35, 0], ["cannon", .59, 0], ["loop", .82, 0]],
    [["loop", .15, 0], ["bumper", .36, -.6], ["pad", .58, 0], ["windmill", .82, 1.14]],
    [["pad", .14, 0], ["bridge", .36, 0], ["loop", .59, 0], ["cannon", .82, 0]],
    [["bumper", .14, -.7], ["cannon", .35, 0], ["windmill", .57, 1.1], ["bridge", .82, 0]],
    [["windmill", .14, 1.12], ["loop", .36, 0], ["bridge", .59, 0], ["pad", .82, 0]],
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
ROUTE_LABELS = [
    "open fairway", "left dogleg", "right dogleg", "double S", "reverse S",
    "sweeping climb", "hooking turn", "switchback", "slalom", "high arc",
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
    opening, exit_slope, template_bends = ROUTES[family]
    # Each ten-hole chapter has a planned scale/elevation, not an unbounded
    # increase. Courses after the introductory seven have long readable runs.
    span = ([8.18, 11.3, 14.2, 17.5, 20.3, 23.5, 26.4][level - 1]
            if early else 25.0 + min(chapter, 12) * .72 + (family % 3) * .34)
    cup_z = (-2.35 if level == 1 else
             -2.35 + (hash_unit(chapter + 9, family + 5) - .5) * (1.2 if early else 4.4))
    if early:
        opening *= .52
        exit_slope *= .6
        bends = [[t, w, round(a * .53, 3)] for t, w, a in template_bends]
    else:
        flip = -1 if chapter % 4 == 3 else 1
        variation = .84 + hash_unit(chapter, family, 7) * .28
        opening = round(opening * variation * flip, 3)
        exit_slope = round(exit_slope * variation * flip, 3)
        bends = [[round(t + (hash_unit(chapter, family, i) - .5) * .085, 3),
                  w, round(a * variation * flip, 3)]
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
        hills = [[.42, .13, round(.17 + (level - 3) * .095, 3)]]
        if level >= 6:
            hills.append([.77, .11, .27])
    else:
        hill_t = .30 + hash_unit(chapter, family, 21) * .20
        hills = [[round(hill_t, 3), .13, round(.38 + .045 * (chapter % 5), 3)]]
        if family in (3, 4, 5, 7, 8, 9):
            hills.append([round(.68 + hash_unit(chapter, family, 22) * .12, 3),
                          .12, round(.21 + .05 * (chapter % 4), 3)])
    if early:
        specs = FEATURE_PLANS[level - 1]
    else:
        plan = FEATURE_PLANS[7 + (chapter * 7 + family * 3) % 9]
        # A fifth prop on some later holes forms a brisk, spaced sequence.
        specs = [list(item) for item in plan]
        if level > 80 and family in (0, 4, 7) and all(abs(item[1] - .965) > .13 for item in specs):
            specs.append(["bumper", .965, .55 if chapter % 2 else -.55])
    features = []
    for i, (kind, t, across) in enumerate(specs):
        side = -1 if not early and (chapter + family) % 2 else 1
        shifted_t = t if early else round(t + (hash_unit(chapter, family, 40 + i) - .5) * .025, 3)
        features.append({
            "kind": kind, "t": shifted_t, "across": round(across * side, 3),
            "phase": round(hash_unit(level, i, 53) * 6.283185, 4),
            "move": round(.22 + hash_unit(level, i, 54) * .12, 3) if kind == "bumper" else 0,
            "rate": round(.8 + hash_unit(level, i, 55) * .5, 3),
        })
    bridge = next((f for f in features if f["kind"] == "bridge"), None)
    river_t = bridge["t"] if bridge else None
    title = FIRST_TITLES[level - 1] if early else f"{CHAPTERS[chapter]} · {SUFFIXES[family]}"
    subtitle = FIRST_SUBTITLES[level - 1] if early else f"A new {ROUTE_LABELS[family]} awaits. Take the shot."
    return {
        "number": level, "title": title, "subtitle": subtitle,
        "span": round(span, 3), "cupZ": round(cup_z, 3), "route": route,
        "hills": hills, "features": features, "riverT": river_t,
    }


def main():
    courses = [build(level) for level in range(1, 251)]
    assert len({c["title"] for c in courses}) == 250
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
