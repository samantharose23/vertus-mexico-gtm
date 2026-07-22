import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// Recompute all ScrollTrigger start/end positions. Call after a layout change
// alters section heights so pinned triggers below stay in sync.
export function refreshScrollTriggers(): void {
  try {
    ScrollTrigger.refresh();
  } catch {
    /* no-op when no triggers are registered (e.g. reduced motion) */
  }
}

const PHI = 1.618033988749895;

function prefersReduced(): boolean {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

// ── Fibonacci-spiral backdrop ───────────────────────────────────────────────
export function initFibTiles(): () => void {
  const grp = document.getElementById("vx-grow");
  if (!grp) return () => {};
  const reduce = prefersReduced();

  const N = 30;
  let x = 0,
    y = 0,
    w = 12000 * PHI,
    h = 12000,
    dir = 0;
  const raw: { x: number; y: number; s: number }[] = [];
  for (let i = 0; i < N; i++) {
    let s: number;
    if (dir === 0) {
      s = h;
      raw.push({ x: x + w - s, y, s });
      w -= s;
    } else if (dir === 1) {
      s = w;
      raw.push({ x, y: y + h - s, s });
      h -= s;
    } else if (dir === 2) {
      s = h;
      raw.push({ x, y, s });
      x += s;
      w -= s;
    } else {
      s = w;
      raw.push({ x, y, s });
      y += s;
      h -= s;
    }
    dir = (dir + 1) % 4;
  }
  const ox0 = x + w / 2,
    oy0 = y + h / 2;
  const sq = raw.map((r) => ({ x: r.x - ox0, y: r.y - oy0, s: r.s }));

  const RAMP = ["#152615", "#1B311B", "#213C20", "#2A4A2A"];
  const NS = "http://www.w3.org/2000/svg";
  // Mutate a dedicated group we own — never React's <g id="vx-grow"> children —
  // so imperative rect injection can't desync React's reconciliation.
  const inner = document.createElementNS(NS, "g");
  const els = sq.map((r, i) => {
    const el = document.createElementNS(NS, "rect");
    el.setAttribute("x", r.x.toFixed(2));
    el.setAttribute("y", r.y.toFixed(2));
    el.setAttribute("width", r.s.toFixed(2));
    el.setAttribute("height", r.s.toFixed(2));
    el.setAttribute("fill", RAMP[i % RAMP.length]);
    el.setAttribute("stroke", "#3A5E38");
    el.setAttribute("stroke-width", Math.max(0.6, r.s * 0.004).toFixed(2));
    el.setAttribute("stroke-opacity", "0.6");
    if (!reduce)
      el.style.transition = "fill 480ms cubic-bezier(0.22,0.61,0.36,1)";
    inner.appendChild(el);
    return el;
  });
  grp.appendChild(inner);
  const baseFill = els.map((_, i) => RAMP[i % RAMP.length]);

  const RAMP_ACCENT = "#3F6631";
  const VBOX = 1120;
  const BASE = 14;
  const STEPS = 5.9;
  const TAIL = 1.9;
  const SIDE_X = 500;
  const SIDE_Y = -70;
  const TARGET = VBOX * 0.8;

  let fibActive = -1;
  let ticking = false;

  const applyZoom = () => {
    ticking = false;
    const se = document.scrollingElement || document.documentElement;
    const max = se.scrollHeight - se.clientHeight || 1;
    const p = Math.min(1, Math.max(0, se.scrollTop / max));
    const pe = 1 - Math.pow(1 - p, TAIL);
    const t = pe * STEPS;
    const phase = t;
    const scale = BASE * Math.pow(PHI, -phase);
    const foc = 1 - pe;
    const tx = SIDE_X * foc;
    const ty = SIDE_Y * foc;
    grp.setAttribute(
      "transform",
      "translate(" +
        tx.toFixed(2) +
        "," +
        ty.toFixed(2) +
        ") scale(" +
        scale.toFixed(5) +
        ")",
    );
    let bestI = 0,
      bestD = Infinity;
    for (let i = 0; i < sq.length; i++) {
      const d = Math.abs(sq[i].s * scale - TARGET);
      if (d < bestD) {
        bestD = d;
        bestI = i;
      }
    }
    if (bestI !== fibActive) {
      fibActive = bestI;
      for (let i = 0; i < els.length; i++)
        els[i].setAttribute("fill", baseFill[i]);
      if (els[bestI]) els[bestI].setAttribute("fill", RAMP_ACCENT);
      if (els[bestI + 1]) els[bestI + 1].setAttribute("fill", RAMP_ACCENT);
    }
  };

  if (reduce) {
    grp.setAttribute(
      "transform",
      "translate(" + SIDE_X + "," + SIDE_Y + ") scale(" + BASE.toFixed(5) + ")",
    );
    return () => {
      inner.remove();
    };
  }

  const onScroll = () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(applyZoom);
    }
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  applyZoom();

  return () => {
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", onScroll);
    inner.remove();
  };
}

// ── Floating-field parallax + settle-in reveal ──────────────────────────────
export function initFloat(): () => void {
  if (prefersReduced()) return () => {};
  const g = gsap,
    ST = ScrollTrigger;
  g.registerPlugin(ST);

  const EASE = "none";
  const created: gsap.core.Tween[] = [];
  const add = (tw: gsap.core.Tween) => {
    created.push(tw);
    return tw;
  };

  const field = document.getElementById("vx-field");
  let drift: gsap.core.Tween | undefined;
  if (field) {
    drift = g.to(field, {
      y: 22,
      scale: 1.04,
      duration: 15,
      ease: "sine.inOut",
      yoyo: true,
      repeat: -1,
      transformOrigin: "50% 50%",
    });
  }

  const sections = Array.prototype.slice.call(
    document.querySelectorAll("section[data-screen-label]"),
  ) as HTMLElement[];
  const revealTargets: HTMLElement[] = [];
  sections.forEach((sec) => {
    const inner = sec.querySelector(":scope > div") as HTMLElement | null;
    if (!inner) return;
    if (sec.id === "enfoque") return;
    const isHero = sec.id === "top";
    // Cap the parallax travel by the section's own padding so content can
    // never visually escape its section (entering shifts down → limited by
    // padding-bottom; leaving shifts up → limited by padding-top).
    // Function-based values + invalidateOnRefresh keep the caps in sync with
    // responsive padding on resize (ScrollTrigger.refresh re-evaluates them).
    const enterY = () => {
      if (isHero) return 0;
      const pb = parseFloat(getComputedStyle(sec).paddingBottom) || 0;
      return Math.min(32, pb * 0.5);
    };
    const exitY = () => {
      if (isHero) return -110;
      const pt = parseFloat(getComputedStyle(sec).paddingTop) || 0;
      return -Math.min(32, pt * 0.5);
    };
    add(
      g.fromTo(
        inner,
        { y: enterY },
        {
          y: exitY,
          ease: EASE,
          scrollTrigger: {
            trigger: sec,
            start: "top bottom",
            end: "bottom top",
            scrub: 0.7,
            invalidateOnRefresh: true,
          },
        },
      ),
    );
    if (!isHero) {
      // Never hide content that is already on screen at init — hiding it and
      // waiting for the IntersectionObserver produces blank sections on tall
      // viewports / slow devices.
      const r = inner.getBoundingClientRect();
      const inViewNow = r.top < window.innerHeight && r.bottom > 0;
      if (!inViewNow) {
        g.set(inner, { opacity: 0 });
        revealTargets.push(inner);
      }
    }
  });

  const revealIO = new IntersectionObserver(
    (ents) => {
      ents.forEach((e) => {
        if (e.isIntersecting) {
          g.to(e.target, { opacity: 1, duration: 0.7, ease: "power2.out" });
          revealIO.unobserve(e.target);
        }
      });
    },
    { rootMargin: "0px 0px -12% 0px", threshold: 0.08 },
  );
  revealTargets.forEach((el) => revealIO.observe(el));

  const safety = window.setTimeout(() => {
    revealTargets.forEach((el) => {
      if (parseFloat(getComputedStyle(el).opacity) < 1)
        g.to(el, { opacity: 1, duration: 0.4 });
    });
  }, 900);

  const refreshT = window.setTimeout(() => {
    try {
      ST.refresh();
    } catch {
      /* noop */
    }
  }, 400);

  return () => {
    try {
      created.forEach((tw) => {
        if (tw && tw.scrollTrigger) tw.scrollTrigger.kill();
        if (tw) tw.kill();
      });
    } catch {
      /* noop */
    }
    try {
      if (drift) drift.kill();
    } catch {
      /* noop */
    }
    try {
      revealIO.disconnect();
    } catch {
      /* noop */
    }
    clearTimeout(safety);
    clearTimeout(refreshT);
    try {
      revealTargets.forEach((el) => g.set(el, { clearProps: "opacity" }));
    } catch {
      /* noop */
    }
    try {
      if (field) g.set(field, { clearProps: "transform" });
    } catch {
      /* noop */
    }
  };
}

// ── Our Approach — scroll-driven Fibonacci-spiral stepper ───────────────────
// Ported from the "our-approach-vanilla" design export. A sticky section pins
// while the camera zooms INWARD through eight golden-ratio squares (one per
// step). React renders the square/rail/card nodes (with the step content, so
// it stays bilingual); this driver positions the squares and animates the
// camera, rail state, and per-step cards as the visitor scrolls.
export interface StepperHandle {
  ok: boolean;
  cleanup: () => void;
  jumpTo: (i: number) => void;
}

export function initApproachStepper(
  root: HTMLElement,
  stepCount: number,
): StepperHandle {
  const noop: StepperHandle = {
    ok: false,
    cleanup: () => {},
    jumpTo: () => {},
  };
  if (prefersReduced()) return noop;
  if (!root || stepCount < 2) return noop;

  const board = root.querySelector("[data-ap-board]") as HTMLElement | null;
  const squareEls = Array.prototype.slice.call(
    root.querySelectorAll("[data-ap-square]"),
  ) as HTMLElement[];
  const railRows = Array.prototype.slice.call(
    root.querySelectorAll("[data-ap-rail-row]"),
  ) as HTMLElement[];
  const cardEls = Array.prototype.slice.call(
    root.querySelectorAll("[data-ap-card]"),
  ) as HTMLElement[];
  const hint = root.querySelector("[data-ap-hint]") as HTMLElement | null;

  const N = stepCount;
  const lastIdx = N - 1;

  // Spiral geometry below is hand-authored for exactly eight squares. If the
  // step count ever changes, fall back to the static grid rather than render a
  // broken spiral.
  const FIB = [1, 1, 2, 3, 5, 8, 13, 21]; // square sizes (Fibonacci units)
  if (
    N !== FIB.length ||
    !board ||
    squareEls.length !== N ||
    cardEls.length !== N
  ) {
    return noop;
  }

  const ACCENT = "#8BC53F";
  const K = 200; // px per Fibonacci unit
  const PLACE = [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 0, y: -2 },
    { x: -3, y: -2 },
    { x: -3, y: 1 },
    { x: 2, y: -2 },
    { x: -3, y: -15 },
    { x: -24, y: -15 },
  ]; // spiral positions
  const ORDER = [7, 6, 5, 4, 3, 2, 1, 0]; // step 1 = outermost (largest) square
  const FILL = 1.08; // active square fills this × min(vw,vh)
  const ANCHOR_X = 0.52; // horizontal anchor for the active number
  const HOLD_A = 0.4,
    HOLD_B = 0.6; // dwell below A / arrive above B / snap between
  const PROG_END = 0.9; // scroll fraction at which the last step is reached
  const TINTS = [
    "rgba(255,255,255,0.02)",
    "rgba(0,0,0,0.12)",
    "rgba(139,197,63,0.03)",
    "rgba(255,255,255,0.015)",
  ];

  const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
  const clampN = (v: number, lo: number, hi: number) =>
    Math.max(lo, Math.min(hi, v));

  // Each step -> a spiral square (centre in Fibonacci units).
  const SQ = Array.from({ length: N }, (_, i) => {
    const k = ORDER[i];
    const s = FIB[k];
    const pl = PLACE[k];
    return { s, cx: pl.x + s / 2, cy: pl.y + s / 2, gx: pl.x, gy: pl.y };
  });

  // Size + position the (React-rendered) square nodes once.
  squareEls.forEach((el, i) => {
    const q = SQ[i];
    el.style.left = q.gx * K + "px";
    el.style.top = q.gy * K + "px";
    el.style.width = q.s * K + "px";
    el.style.height = q.s * K + "px";
    el.style.background = TINTS[i % TINTS.length];
    const span = el.querySelector("[data-ap-num]") as HTMLElement | null;
    if (span) span.style.fontSize = q.s * K * 0.6 + "px";
  });

  // ── State ───────────────────────────────────────────────────────────────
  let progress = 0; // 0..1 scroll through the driver section
  let anim: { from: number; to: number; u: number } | null = null;
  let suppressScroll = false;
  let fIdxDisplayed = 0;
  let rafPending = false;

  // Map scroll progress -> effective index with a dwell/snap plateau.
  const plateauIndex = (p: number) => {
    const raw = clampN((p / PROG_END) * lastIdx, 0, lastIdx);
    const seg = Math.min(lastIdx - 1, Math.floor(raw));
    const fr = raw - seg;
    let sm =
      fr <= HOLD_A ? 0 : fr >= HOLD_B ? 1 : (fr - HOLD_A) / (HOLD_B - HOLD_A);
    if (sm > 0 && sm < 1) sm = sm * sm * (3 - 2 * sm); // smoothstep the snap
    return { fIdx: seg + sm, settled: sm <= 0 || sm >= 1 };
  };

  const render = () => {
    const p = progress;
    const pl = plateauIndex(p);
    const animating = !!anim;

    // Effective index: during a jump, ease from -> to through the spiral.
    const effIdx = animating ? lerp(anim!.from, anim!.to, anim!.u) : pl.fIdx;
    fIdxDisplayed = effIdx;
    const active = animating
      ? anim!.to
      : clampN(Math.round(pl.fIdx), 0, lastIdx);

    // Camera: frame the square at effIdx, zoom inward as the index grows.
    const W = window.innerWidth,
      H = window.innerHeight;
    const j0 = clampN(Math.floor(effIdx), 0, lastIdx);
    const j1 = Math.min(lastIdx, j0 + 1);
    const jt = effIdx - j0;
    const cx = lerp(SQ[j0].cx, SQ[j1].cx, jt);
    const cy = lerp(SQ[j0].cy, SQ[j1].cy, jt);
    const S = lerp(SQ[j0].s, SQ[j1].s, jt);
    const camScale = (FILL * Math.min(W, H)) / (S * K);
    const tx = W * ANCHOR_X - camScale * (cx * K);
    const ty = H * 0.5 - camScale * (cy * K);
    board!.style.transition = animating ? "none" : "transform .12s linear";
    board!.style.transform =
      "translate(" + tx + "px," + ty + "px) scale(" + camScale + ")";

    // Square number brightness + border strengthen near the focused index.
    for (let i = 0; i < squareEls.length; i++) {
      const strong = Math.max(0, 1 - Math.abs(i - effIdx));
      const num = squareEls[i].querySelector(
        "[data-ap-num]",
      ) as HTMLElement | null;
      if (num)
        num.style.color =
          "rgba(139,197,63," + (0.05 + strong * 0.21).toFixed(3) + ")";
      squareEls[i].style.borderColor =
        "rgba(167,213,111," + (0.14 + strong * 0.2).toFixed(3) + ")";
    }

    // Rail: done / active / upcoming states.
    for (let r = 0; r < railRows.length; r++) {
      const st = r < active ? "done" : r === active ? "active" : "up";
      const box = railRows[r].querySelector(
        "[data-ap-rail-box]",
      ) as HTMLElement | null;
      const label = railRows[r].querySelector(
        "[data-ap-rail-label]",
      ) as HTMLElement | null;
      if (!box || !label) continue;
      if (st === "active") {
        box.style.background = ACCENT;
        box.style.color = "#151515";
        box.style.border = "1px solid " + ACCENT;
        box.style.transform = "scale(1.5)";
        box.style.boxShadow = "0 0 0 5px rgba(139,197,63,.16)";
        label.style.font = "700 16px 'Prompt',sans-serif";
        label.style.color = "#E8E3D2";
        label.style.letterSpacing = ".08em";
        label.style.textTransform = "uppercase";
      } else {
        box.style.background = st === "done" ? "transparent" : "#152615";
        box.style.color =
          st === "done" ? "rgba(232,227,210,.62)" : "rgba(232,227,210,.4)";
        box.style.border =
          "1px solid " +
          (st === "done" ? "rgba(139,197,63,.38)" : "rgba(232,227,210,.16)");
        box.style.transform = "scale(1)";
        box.style.boxShadow = "none";
        label.style.font = "500 13px 'Prompt',sans-serif";
        label.style.color =
          st === "done" ? "rgba(232,227,210,.6)" : "rgba(232,227,210,.34)";
        label.style.letterSpacing = ".1em";
        label.style.textTransform = "uppercase";
      }
    }

    // Cards: only the active one shows, and only once movement has SETTLED
    // (and not mid-jump), so no text flashes while the numbers move.
    const showActive = pl.settled && !animating;
    for (let cI = 0; cI < cardEls.length; cI++) {
      const show = showActive && cI === active;
      const off = show ? 0 : 34;
      cardEls[cI].style.opacity = show ? "1" : "0";
      cardEls[cI].style.filter = show ? "blur(0px)" : "blur(7px)";
      cardEls[cI].style.pointerEvents = show ? "auto" : "none";
      cardEls[cI].style.transform =
        "translateY(-50%) translateX(" + off + "px)";
    }

    if (hint) hint.style.opacity = p < 0.02 ? "1" : "0";
  };

  // ── Scroll ────────────────────────────────────────────────────────────────
  const readProgress = () => {
    const rect = root.getBoundingClientRect();
    const scrollable = rect.height - window.innerHeight;
    return scrollable > 0 ? clampN(-rect.top / scrollable, 0, 1) : 0;
  };
  const onScroll = () => {
    if (suppressScroll || anim) return;
    if (rafPending) return;
    rafPending = true;
    requestAnimationFrame(() => {
      rafPending = false;
      progress = readProgress();
      render();
    });
  };
  const onResize = () => {
    progress = readProgress();
    render();
  };

  // Scroll position (px) that centres a given step.
  const scrollForIndex = (i: number) => {
    const rect = root.getBoundingClientRect();
    const top = rect.top + window.scrollY;
    const scrollable = root.offsetHeight - window.innerHeight;
    let pp = lastIdx > 0 ? ((i + 0.22) / lastIdx) * PROG_END : 0;
    if (i >= lastIdx) pp = 0.95;
    return Math.round(top + clampN(pp, 0, 1) * scrollable);
  };

  // Rail click: animate the camera through the numbers to the target (like
  // scrolling), then silently sync the scroll position.
  const jumpTo = (i: number) => {
    const from = fIdxDisplayed;
    if (Math.abs(from - i) < 0.01) return;
    const dist = Math.abs(i - from);
    const DUR = Math.min(1700, 340 + 190 * dist);
    const start = performance.now();
    const easeInOut = (t: number) =>
      t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    anim = { from, to: i, u: 0 };

    const tick = () => {
      const u = Math.min(1, (performance.now() - start) / DUR);
      anim!.u = easeInOut(u);
      render();
      if (u < 1) {
        requestAnimationFrame(tick);
      } else {
        // Land: sync scroll silently, then release so normal scrolling resumes.
        suppressScroll = true;
        window.scrollTo(0, scrollForIndex(i));
        anim = null;
        requestAnimationFrame(() => {
          suppressScroll = false;
          progress = readProgress();
          render();
        });
      }
    };
    requestAnimationFrame(tick);
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onResize);
  progress = readProgress();
  render();

  return {
    ok: true,
    jumpTo,
    cleanup: () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    },
  };
}
