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

// ── Lock-step scroll engine ─────────────────────────────────────────────────
function setupLockStep(
  st: ScrollTrigger,
  N: number,
): () => void {
  const g = gsap;
  if (!st || !N || N < 2) return () => {};
  const N1 = N - 1;
  const DUR = 0.4,
    COOLDOWN = 70;
  const proxy = { y: 0 };
  let animating = false;

  const segTo = (i: number) => {
    const s = st.start != null ? st.start : 0;
    const e = st.end != null ? st.end : s;
    return s + (Math.max(0, Math.min(N1, i)) / N1) * (e - s);
  };
  const curStep = () =>
    Math.round(Math.max(0, Math.min(1, st.progress || 0)) * N1);
  const go = (target: number) => {
    animating = true;
    proxy.y =
      window.pageYOffset || document.documentElement.scrollTop || 0;
    const toY = segTo(target);
    try {
      g.killTweensOf(proxy);
    } catch {
      /* noop */
    }
    g.to(proxy, {
      y: toY,
      duration: DUR,
      ease: "power2.out",
      onUpdate() {
        window.scrollTo(0, proxy.y);
      },
      onComplete() {
        window.scrollTo(0, toY);
        window.setTimeout(() => {
          animating = false;
        }, COOLDOWN);
      },
    });
  };
  const step = (dir: number) => {
    if (!st.isActive || !dir) return false;
    if (animating) return true;
    const target = curStep() + dir;
    if (target < 0 || target > N1) return false;
    go(target);
    return true;
  };

  const onWheel = (e: WheelEvent) => {
    if (!st.isActive) return;
    if (animating) {
      e.preventDefault();
      return;
    }
    if (Math.abs(e.deltaY) < 3) return;
    if (step(e.deltaY > 0 ? 1 : -1)) e.preventDefault();
  };
  let touchY: number | null = null;
  const onTouchStart = (e: TouchEvent) => {
    touchY = e.touches && e.touches[0] ? e.touches[0].clientY : null;
  };
  const onTouchMove = (e: TouchEvent) => {
    if (!st.isActive || touchY == null) return;
    if (animating) {
      e.preventDefault();
      return;
    }
    const yy = e.touches && e.touches[0] ? e.touches[0].clientY : null;
    if (yy == null) return;
    const dy = touchY - yy;
    if (Math.abs(dy) < 10) return;
    if (step(dy > 0 ? 1 : -1)) {
      touchY = yy;
      e.preventDefault();
    }
  };
  const onTouchEnd = () => {
    touchY = null;
  };
  const onKey = (e: KeyboardEvent) => {
    if (!st.isActive) return;
    let dir = 0;
    if (
      e.key === "ArrowDown" ||
      e.key === "PageDown" ||
      e.key === " " ||
      e.key === "Spacebar"
    )
      dir = 1;
    else if (e.key === "ArrowUp" || e.key === "PageUp") dir = -1;
    else return;
    if (animating) {
      e.preventDefault();
      return;
    }
    if (step(dir)) e.preventDefault();
  };

  window.addEventListener("wheel", onWheel, { passive: false });
  window.addEventListener("touchstart", onTouchStart, { passive: true });
  window.addEventListener("touchmove", onTouchMove, { passive: false });
  window.addEventListener("touchend", onTouchEnd, { passive: true });
  window.addEventListener("keydown", onKey);

  return () => {
    window.removeEventListener("wheel", onWheel);
    window.removeEventListener("touchstart", onTouchStart);
    window.removeEventListener("touchmove", onTouchMove);
    window.removeEventListener("touchend", onTouchEnd);
    window.removeEventListener("keydown", onKey);
    try {
      g.killTweensOf(proxy);
    } catch {
      /* noop */
    }
  };
}

// ── Fibonacci-square build-up (approach) ────────────────────────────────────
type Anchor = "fixed" | "grow";

interface SquaresHandle {
  cleanup: () => void;
  ok: boolean;
  jumpTo: (i: number) => void;
}

export function initApproachSquares(
  track: HTMLElement,
  field: HTMLElement,
  anchor: Anchor,
): SquaresHandle {
  const reduce = prefersReduced();
  if (reduce) return { cleanup: () => {}, ok: false, jumpTo: () => {} };

  const g = gsap,
    ST = ScrollTrigger;
  g.registerPlugin(ST);
  const cards = Array.prototype.slice.call(
    field.querySelectorAll("[data-sq-card]"),
  ) as HTMLElement[];
  if (!cards.length)
    return { cleanup: () => {}, ok: false, jumpTo: () => {} };

  // Scroll-cue hint: fully visible at the start of the sequence, fades out
  // as soon as the visitor advances (style-only mutation, no reparenting).
  const hint = track.querySelector("[data-sq-hint]") as HTMLElement | null;
  const applyHint = (p: number) => {
    if (!hint) return;
    const o = Math.max(0, Math.min(1, 1 - (p - 0.02) / 0.08));
    hint.style.opacity = o.toFixed(2);
  };

  const sqN = cards.length;
  const N = sqN;

  const fib = [1, 1];
  while (fib.length < N) fib.push(fib[fib.length - 1] + fib[fib.length - 2]);
  const sides = ["right", "bottom", "left", "top"] as const;
  const box = { L: 0, T: 0, R: fib[0], B: fib[0] };
  const sq = [{ x: 0, y: 0, s: fib[0] }];
  const boxes = [{ L: box.L, T: box.T, R: box.R, B: box.B }];
  for (let i = 1; i < N; i++) {
    const s = fib[i];
    const side = sides[(i - 1) % 4];
    if (side === "right") {
      sq.push({ x: box.R, y: box.T, s });
      box.R += s;
    } else if (side === "bottom") {
      sq.push({ x: box.L, y: box.B, s });
      box.B += s;
    } else if (side === "left") {
      sq.push({ x: box.L - s, y: box.T, s });
      box.L -= s;
    } else {
      sq.push({ x: box.L, y: box.T - s, s });
      box.T -= s;
    }
    boxes.push({ L: box.L, T: box.T, R: box.R, B: box.B });
  }

  const clampNum = (v: number, lo: number, hi: number) =>
    Math.max(lo, Math.min(hi, v));

  const setSquareTier = (el: HTMLElement, size: number, target: number) => {
    const r = size / (target || 1);
    const inner = el.querySelector("[data-sq-inner]") as HTMLElement | null;
    const num = el.querySelector("[data-sq-num]") as HTMLElement | null;
    const title = el.querySelector("[data-sq-title]") as HTMLElement | null;
    const body = el.querySelector("[data-sq-body]") as HTMLElement | null;
    if (num) num.style.opacity = r >= 0.24 ? "1" : "0";
    if (title) title.style.opacity = r >= 0.42 ? "1" : "0";
    if (body) body.style.opacity = r >= 0.72 ? "1" : "0";
    // Scale padding + typography from the card's own current pixel size
    // (rather than independent viewport-width units) so text always fits
    // inside the card at every point in the animation, on any screen size.
    if (inner) inner.style.padding = clampNum(size * 0.09, 8, 36) + "px";
    if (num) num.style.fontSize = clampNum(size * 0.16, 14, 52) + "px";
    if (title) title.style.fontSize = clampNum(size * 0.1, 13, 30) + "px";
    if (body) body.style.fontSize = clampNum(size * 0.055, 12, 16) + "px";
  };

  const applySquares = (p: number) => {
    const vw = window.innerWidth || 1;
    const vh = window.innerHeight || 1;
    const FW = Math.min(field.clientWidth || 1, vw);
    const FH = Math.min(field.clientHeight || 1, vh);
    const TARGET = Math.min(FW, FH) * 0.58;
    const rawP = Math.min(1, Math.max(0, p)) * (N - 1);
    const k = Math.min(N - 2, Math.floor(rawP));
    const f = rawP - k;
    const ef = f * f * f * (f * (f * 6 - 15) + 10);
    const effIndex = rawP >= N - 1 ? N - 1 : k + ef;
    const kk = Math.min(N - 1, Math.floor(effIndex));
    let effSide: number;
    if (kk >= N - 1) effSide = fib[N - 1];
    else {
      const fr = effIndex - kk;
      effSide = fib[kk] * Math.pow(fib[kk + 1] / fib[kk], fr);
    }
    const scale = TARGET / effSide;

    let ox: number, oy: number;
    if (anchor === "fixed") {
      const cx = (i: number) => sq[i].x + fib[i] / 2;
      const cy = (i: number) => sq[i].y + fib[i] / 2;
      if (kk >= N - 1) {
        ox = cx(N - 1);
        oy = cy(N - 1);
      } else {
        const fr = effIndex - kk;
        ox = cx(kk) + (cx(kk + 1) - cx(kk)) * fr;
        oy = cy(kk) + (cy(kk + 1) - cy(kk)) * fr;
      }
    } else {
      const bx = (i: number) => (boxes[i].L + boxes[i].R) / 2;
      const by = (i: number) => (boxes[i].T + boxes[i].B) / 2;
      if (kk >= N - 1) {
        ox = bx(N - 1);
        oy = by(N - 1);
      } else {
        const fr = effIndex - kk;
        ox = bx(kk) + (bx(kk + 1) - bx(kk)) * fr;
        oy = by(kk) + (by(kk + 1) - by(kk)) * fr;
      }
    }

    const apx = FW / 2,
      apy = FH / 2;
    for (let j = 0; j < N; j++) {
      const el = cards[j];
      const size = fib[j] * scale;
      const sx = apx + (sq[j].x - ox) * scale;
      const sy = apy + (sq[j].y - oy) * scale;
      const op = Math.max(0, Math.min(1, effIndex - j + 1));
      el.style.width = size.toFixed(1) + "px";
      el.style.height = size.toFixed(1) + "px";
      el.style.transform =
        "translate(" + sx.toFixed(1) + "px," + sy.toFixed(1) + "px)";
      el.style.opacity = op.toFixed(3);
      el.style.zIndex = String(100 + j);
      el.style.pointerEvents = op < 0.05 ? "none" : "auto";
      el.style.borderColor = size >= TARGET * 0.86 ? "#4C7A38" : "#2A4A2A";
      setSquareTier(el, size, TARGET);
    }
  };

  // Progress-only ScrollTrigger. The visible stage is held in place with CSS
  // `position: sticky` in the markup rather than GSAP's `pin`, so GSAP never
  // reparents a React-owned node into a `.pin-spacer` (which desyncs React's
  // DOM tree and throws "removeChild ... not a child of this node").
  const st = ST.create({
    trigger: track,
    start: "top top",
    end: "bottom bottom",
    onUpdate: (self) => {
      applySquares(self.progress);
      applyHint(self.progress);
    },
    onRefresh: (self) => {
      applySquares(self.progress);
      applyHint(self.progress);
    },
  });
  applySquares(0);
  applyHint(0);
  const lockCleanup = setupLockStep(st, N);
  const refreshT = window.setTimeout(() => {
    try {
      ST.refresh();
    } catch {
      /* noop */
    }
  }, 300);

  return {
    ok: true,
    jumpTo: (i: number) => {
      const frac = N > 1 ? Math.max(0, Math.min(N - 1, i)) / (N - 1) : 0;
      const s = st.start != null ? st.start : 0;
      const e = st.end != null ? st.end : s;
      const target = s + frac * (e - s);
      window.scrollTo({
        top: target,
        behavior: prefersReduced() ? "auto" : "smooth",
      });
    },
    cleanup: () => {
      clearTimeout(refreshT);
      try {
        lockCleanup();
      } catch {
        /* noop */
      }
      try {
        st.kill();
      } catch {
        /* noop */
      }
    },
  };
}
