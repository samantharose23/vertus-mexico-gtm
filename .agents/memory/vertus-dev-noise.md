---
name: Vertus animation vs React DOM ownership
description: The vertus-mexico "removeChild"/"Invalid hook call" console crash came from animations mutating React-owned nodes; how it was resolved.
---

# vertus-mexico "removeChild" / "Invalid hook call" crash

The landing page could surface a React crash overlay logging "Failed to execute
'removeChild' on 'Node': The node to be removed is not a child of this node"
plus an "Invalid hook call" warning. It was most visible on HMR updates to
`App.tsx`, but it is the same class of React-vs-external-DOM reconciliation
conflict that can bite in prod during interactions.

**Root cause:** animation code in `src/lib/animations.ts` mutated DOM nodes React
owns. `initFibTiles` did `innerHTML=""` + `appendChild` of `<rect>`s straight
into the React-rendered `<g id="vx-grow">`, and `initApproachSquares` pinned a
React-owned node via GSAP ScrollTrigger (which reparents it into a `.pin-spacer`).

**GSAP `pin` is the durable trap:** any GSAP ScrollTrigger with `pin:` wraps the
pinned element in a `.pin-spacer` and reparents it (`_swapPinIn`/`_swapPinOut`),
regardless of `pinType`/`pinSpacing`. When that pinned node is React-owned, the
canvas element picker / HMR / any reconcile that removes or reorders siblings in
that region throws "removeChild ... not a child of this node". The fix is to
**never pin a React-owned node with GSAP** — hold it in place with CSS
`position: sticky` (a tall relative track of `100 + endPct` vh containing a
`sticky; top:0; height:100vh` stage) and make the ScrollTrigger progress-only
(`trigger` = the track, `start:"top top"`, `end:"bottom bottom"`, drive via
`onUpdate`/`onRefresh`). Active scroll distance then equals the track's extra
`endPct` vh, matching the old `end:"+=endPct%"` pin duration. The lock-step
engine (`st.start/end/progress/isActive`, `jumpTo`) works unchanged on a
non-pinning trigger.

**Sticky gotcha after the pin→sticky swap:** the root wrapper had
`overflow-x: hidden`, which per CSS spec forces `overflow-y` to compute to
`auto`, turning that ancestor into a scroll container. `position: sticky` then
sticks relative to *that* div (which never scrolls — the window does) instead of
the viewport, so the stage scrolled away and left a tall blank track. GSAP `pin`
never cared (fixed/transform positioning ignores ancestor overflow), so this only
surfaced after switching to sticky. Fix: use `overflow-x: clip` — it clips
horizontally without creating a scroll container or forcing `overflow-y: auto`,
so sticky keeps working. Rule: any ancestor with `overflow` hidden/auto/scroll
breaks descendant `position: sticky`; prefer `clip` for horizontal-overflow
containment on scroll ancestors.

**Why it matters:** any imperative code that adds/removes/reparents children of a
node React also renders desyncs React's fiber tree, so React's later commit-phase
child removal throws "removeChild ... not a child of this node".

**How it was resolved (durable lessons):**
- Animations must mutate only dedicated DOM nodes they create themselves, never a
  React-rendered element's children. `initFibTiles` now builds rects into a `<g>`
  it creates + appends, and removes it on cleanup.
- Don't re-init a pinned ScrollTrigger on state that the animation doesn't read.
  The approach squares are geometry-only; `lang` was removed from that effect's
  deps so language toggles stop tearing down/rebuilding the pin (which churns the
  pin-spacer and is a real crash surface).
- A root `ErrorBoundary` (`src/components/ErrorBoundary.tsx`, wired in `main.tsx`)
  guarantees a graceful bilingual fallback instead of a raw crash overlay.
- Validated: fresh loads clean, four consecutive App.tsx HMR updates clean, and an
  e2e pass across rapid ES/EN toggles + scroll through the pinned section with no
  console errors and no fallback shown.

## initFloat reveal/parallax contract (single-wrapper rule)

`initFloat` in `src/lib/animations.ts` applies the scroll reveal (opacity 0→1) and
parallax to **exactly one node per section: the section's first direct child div**
(`sec.querySelector(":scope > div")`). So every animating `section[data-screen-label]`
must wrap ALL its content (eyebrow + h2 + body) in a single direct child div, or the
uncovered elements silently never animate.

**Trap:** to make a heading full-width, don't lift the `<h2>` out to be a direct
child of `<section>` — that leaves multiple direct children, `:scope > div` grabs
only the first (the eyebrow), and the h2 is dropped from the animation. The Team
section (`#equipo`) hit exactly this. Fix: keep one wrapper div (no `maxWidth` when
full-width is desired) and constrain width on the inner columns instead
(`twoColStyle`), so the heading stays full-width AND inside the animated wrapper.

**Why:** the reveal targets a single wrapper by design; full-width layout and
animation coverage are only compatible if width is constrained below the wrapper,
not by pulling elements out of it.

## Parallax travel must be capped by section padding; never hide in-view content

Two layout-breaking traps in the section reveal/parallax system:

- **Parallax > padding = visual overlap.** A fixed scroll translate (was ±72px)
  lets section content escape its section wherever padding is smaller (the
  Team↔For Founders seam is deliberately ~8–16px). Rule: derive each wrapper's
  travel from its own computed padding (enter capped by padding-bottom, exit by
  padding-top), via GSAP function-based values + `invalidateOnRefresh: true` so
  resize/refresh re-evaluates against responsive `clamp()` padding.
- **opacity:0 + IntersectionObserver = blank sections.** Hiding wrappers that are
  already inside the viewport at init makes tall viewports/slow devices show
  blank areas until the IO or a slow fallback fires. Rule: check
  `getBoundingClientRect()` at init and never hide in-view content; keep the
  safety reveal fallback short (<1s).

**How to apply:** any new scroll reveal/parallax on this site must scale motion
from the section's real padding and must not hide content already on screen.
