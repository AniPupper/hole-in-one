# Hole in One - Playtest Notes

**Site:** https://hole-in-one-roan.vercel.app/

**Design claim:** *Hole in One makes quick-break players feel satisfied by every guaranteed hole-in-one and eager to keep playing because the next course promises a new spectacle.*

**Testing status:** This document contains the test plan and owner QA findings. It is **not yet a complete CP5 submission**: add a classmate's real session notes and the full external AI user-test output before committing `CP5: playtest notes`.

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

## Classmate session - required for CP5

**Tester name or initials:** `PENDING`

**Date and browser/device:** `PENDING`

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
| `PENDING` | `PENDING` | `PENDING` | `PENDING` |

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

## Changes after the classmate / AI test - required for CP6

Fill this in only after reviewing the real classmate and AI test results. Each entry should connect a finding to a specific change and reason.

| Evidence from test | Change made | Why this response was chosen | Verification |
| --- | --- | --- | --- |
| `PENDING` | `PENDING` | `PENDING` | `PENDING` |

## Ship checklist

- [ ] Classmate session completed and documented above.
- [ ] Full external AI User Test Prompt output pasted above.
- [ ] At least two test problems selected and addressed, or a written reason explains why no change was needed.
- [ ] Automated smoke and 3D physics checks pass.
- [ ] Production Vercel URL tested after the final push.
- [ ] Commit `CP5: playtest notes` created after the evidence is added.
- [ ] `Changes after the classmate / AI test` completed.
- [ ] Commit `CP6: ship` created after fixes, documentation, and deployment verification.
