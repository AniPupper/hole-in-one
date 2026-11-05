# Hole in One - Playtest Notes

**Site:** https://hole-in-one-roan.vercel.app/

**Design claim:** *Hole in One makes quick-break players feel satisfied by every guaranteed hole-in-one and eager to keep playing because the next course promises a new spectacle.*

**Testing status (November 4, 2026):** Maddy provided classmate feedback on the purchasing and gameplay-upgrade flows, and both reported problems have been addressed in the local build. The complete task-by-task classmate record, full external AI user-test output, and post-fix production retest are still missing. The `CP5: playtest notes` commit exists, but its evidence is incomplete. Do not describe the final submission or deployment as verified until these gaps are resolved.

## What I am testing

The main question is whether a new player understands the loop without coaching:

1. Play a spectacular, guaranteed hole-in-one.
2. Feel interested in the next course.
3. Notice earned XP and understand that gear can improve the next shot.
4. Browse, compare, add, and purchase gear without losing their place.

Two project mechanics are included in the test:

| Mechanic | Intended effect | What to watch for |
| --- | --- | --- |
| **Manipulation: XP-gated gear progression** | Earned XP and the next available upgrade create anticipation and make another hole feel worthwhile. | Does the player notice XP, understand why an item is locked, and want to earn enough for a choice? |
| **Self-binding: Cart cost preview** | The right-side cart shows the item price, cart total, XP balance, and XP after purchase before checkout. It makes the trade-off visible before the player commits. | Does the player notice the balance-after-purchase information and use it to decide whether to buy now? |

## October 29 — individual testing and debugging

I worked through the shopping flow and improved the cart so players could review a club and ball together, see the XP cost, and keep browsing while the cart stayed available on the right. I also debugged course elements, including the windmill's direction, camera controls, and the way hills affect the ball and nearby rails. This was individual testing and development, not a classmate playtest.

## Classmate session - required for CP5

**Tester name or initials:** Maddy

**Date and browser/device:** November 4, 2026; browser/device not recorded

**Session record:** Maddy's two findings were captured after using the purchasing and gameplay-upgrade flows. A complete task-by-task observation record was not captured, so a second, fully documented pass is still needed for the final submission.

**Starting state:** Use a fresh browser profile or clear this site's local storage. Test the live Vercel URL, not a local file.

### Moderator script

Say only this at the start: **“Please explore this site and say out loud what you think is happening. I will not explain unless the site blocks you.”**

Do not teach the controls or explain the shop. Ask follow-up questions only after the participant tries a task.

### Tasks

| Task | What a successful experience looks like | Tester notes |
| --- | --- | --- |
| 1. Explore the opening screen. | The participant identifies that this is a mini-golf game and can find Play a hole / the Pro Shop. | `PENDING` |
| 2. Play a hole. | The participant can aim and release a shot, sees a clear route, and understands that the first shot is guaranteed to sink. | `PENDING` |
| 3. React to the win screen. | The participant sees the numeric XP reward and chooses the next action without confusion. If gear is affordable, they recognize Next Hole and Visit the Shop as equal choices. | `PENDING` |
| 4. Find current gear and XP in the Pro Shop. | The participant can identify their equipped club, ball, and XP balance. | `PENDING` |
| 5. Compare two items. | The participant uses View details, recognizes the two visual gear depictions, selects a comparison item, and can tell which stat bars are better or worse. | `PENDING` |
| 6. Add one item and inspect the cart. | Add to cart immediately opens the right-side cart; the participant notices price, total, balance after purchase, remove, and continue-browsing behavior. | `PENDING` |
| 7. Purchase when affordable. | The participant completes checkout, sees the reveal, and expects the new gear to matter in the next hole. | `PENDING` |

### Questions after the tasks

1. What did you think this site was trying to make you feel?
2. After one or two holes, did you want to play another? Why or why not?
3. What did XP mean to you? What did you think buying gear would change?
4. Was any action, number, or screen confusing?
5. Did the shop make choosing gear feel meaningful, or did it feel like decoration?
6. What is one thing you would change first?

### Observations and quotes

Record what the tester actually did and said here. Do not replace these with conclusions.

| Moment | Observation or direct quote | Severity | Follow-up |
| --- | --- | --- | --- |
| Cart add-on suggestion | Maddy said the optional extra club or ball was easy to overlook while purchasing. | High | Make the recommendation visually dominant and make its action explicit. |
| Upgrade impact | Maddy said that faster or trickier clubs and balls were not noticeably different during play. | High | Increase the visible effects of speed, lift, bounce, and spin. |

## External AI user test - required for CP5

The assignment asks for the full output from the course's User Test Prompt. Run it against the live Vercel URL, answer its setup questions, and paste the unedited result below.

```text
PENDING: Paste the complete external AI user-test output here.
```

## Owner QA findings already fixed

These are real issues found during an internal review of the current build. They support the next classmate test, but they do **not** replace the required classmate notes above.

| Finding | Change made | Why it matters |
| --- | --- | --- |
| Reopening a completed hole displayed “PERFECT SHOT” instead of a numeric reward. | Persisted the final reward with course state and added a numeric fallback for older saves. | XP needs to be concrete and believable. |
| Classic White appeared dark grey in the 3D course. | Brightened the Classic White material and pale-surface lighting. | The starter item's visual should match its name and shop artwork. |
| Visit the Shop was visually weaker than Next Hole after a player could afford gear. | When any gear is affordable, both celebration actions use equal-sized, equal-weight buttons. | The choice between another spectacle and shopping should be intentional. |
| Future gear exposed too much information. | Future cards now show anonymous locked drops and no item name, stats, or price. | Mystery supports anticipation without spoiling the catalog. |
| Important labels fell below the 13px readability requirement. | Raised the named HUD and celebration labels, including Your Shot, Shot Reward, and In Your Bag, to 13px or larger. | Small labels made core feedback easy to miss. |
| The gear comparison did not clearly connect each bar to its club or ball. | Added Selected and Compared labels to the gear artwork, printed both item names and exact values beside every color-matched stat bar, and replaced symbol-only stat labels with words. | Players can tell which gear owns each bar, even after switching the comparison item. Checked club and ball panels locally. |

## Instructor feedback - Mr. Kiang

| Feedback | Response | Status |
| --- | --- | --- |
| Add sound to make the course feel more responsive. | Replaced most generated effects with edited CC0 recordings. Drivers, wedges, and irons use distinct strikes, while the cup, wind, obstacles, and cannon retain their own sounds. Wins have a short, quiet clap; a quieter party horn is the only purchase sound. The rolling texture still reacts to ball speed. A Sound on/off control remembers the player's preference. | Implemented locally; listen and tune on the live build. |
| Add a separate level editor so players can create and publish their own maps. | This is the next major feature after sound. It needs a dedicated editor, map validation, local draft saving, and a publishing approach; public sharing cannot be claimed until that workflow is built. | Planned. |
| Make the course more varied. | Continue expanding course silhouettes, terrain shapes, and obstacle combinations so the next hole has a more distinct visual route and surprise. | Planned follow-up; use the level editor work to support broader course variety. |

## Changes after the classmate / AI test - required for CP6

The first two entries are based on Maddy's reported findings. The AI test has not been provided, so no AI findings or retest results are claimed here. Each entry connects an actual finding to a specific change and reason.

| Evidence from test | Change made | Why this response was chosen | Verification |
| --- | --- | --- | --- |
| Maddy: the extra club or ball suggestion was easy to overlook. | Rebuilt the suggestion as a highlighted recommended add-on card with a large icon, clear label, visible item name, and full-width Add to cart action. | The original small, low-contrast strip blended into the cart's other details. The revised treatment makes the optional add-on a deliberate decision. | Live cart retest is pending: add one item, then confirm the suggestion is noticed and remains optional. |
| Maddy: faster or trickier gear did not feel different enough in play. | Increased ball launch, roll, bounce, and spin effects, and increased club speed, height, and trick/spin effects. Classic White remains the slow baseline. | Gear should change the route and movement enough to validate the purchase, while preserving the guaranteed hole-in-one. | Automated physics checks pass; compare the same course and shot with starter and upgraded gear on the final live build. |
| Mr. Kiang: add sound feedback. | Added optional course sounds with a persistent mute preference, then replaced the dull synthetic effects with edited CC0 recordings. Driver, wedge, and iron strikes differ; rolling, wind, river entry, cannon, cup, and obstacles have separate cues. The river plays one quiet splash on entry with a short repeat guard. Applause is shorter and quieter; the purchase reveal is visually celebratory but plays only a lowered-volume party horn, without the former clank or confetti pop. Buttons give a slight hover bump. | The course should sound like golf while the reward moments remain exciting without repeated loud applause. | Sound files and JavaScript passed local checks; final listening pass on the live build is pending, including the mute toggle, river entry, and purchase reveal. |
| Mr. Kiang: make courses more varied and support player-made maps. | Documented as the next product area after the current sound pass. | A separate editor and publishing workflow need their own design, validation, and storage work rather than a rushed in-game toggle. | Pending level-editor design and implementation. |

## Ship checklist

- [ ] Complete a full task-by-task classmate session; Maddy's feedback is recorded above, but the full observation record is still needed.
- [ ] Full external AI User Test Prompt output pasted above.
- [x] Two reported classmate problems selected and addressed in the local build; production retest still pending.
- [x] Automated smoke, 3D geometry, and 3D physics checks passed locally on November 4, 2026.
- [ ] Production Vercel URL tested after the final push.
- [x] Commit `CP5: playtest notes` exists (`66a7e1f`); its underlying classmate and AI evidence remains incomplete.
- [x] Changes made in response to Maddy's two findings are documented above with reasons.
- [ ] Record of Thinking written from actual commits, chats, and playtest evidence.
- [ ] Checkpoint history: `CP0: Initial setup of repo` is absent. The exact CP1–CP5 messages exist, but the counts of own commits before CP3, CP4, and CP5 are 2, 2, and 1 rather than the requested 3. Do not invent or backdate missing work.
- [ ] The required three descriptive commits between CP5 and CP6 are absent; CP6 follows CP5 directly.
- [x] The exact `CP6: ship` commit exists (`a8273e7`); final deployment verification remains pending.

**Deployment check on November 4:** The public shop and course opened, but the sound toggle from this local version was absent. The latest sound changes, including the purchase party horn, therefore have not been verified on the production site. Check both pages again after deployment.
