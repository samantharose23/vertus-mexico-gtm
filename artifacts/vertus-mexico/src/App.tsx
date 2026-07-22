import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { CSSProperties } from "react";
import {
  CONTENT,
  WHATSAPP_URL,
  MARIA_EMAIL_URL,
  MARIA_LINKEDIN_URL,
  type Lang,
  type Testimonial,
} from "./lib/content";
import mariaPhoto from "@assets/maria_1783541627435.png";
import { applySeo } from "./lib/seo";
import { trackEvent } from "./lib/analytics";
import { captureAttribution, getAttribution } from "./lib/attribution";
import {
  initApproachStepper,
  initFibTiles,
  initFloat,
  refreshScrollTriggers,
} from "./lib/animations";
import MexicoMap from "./components/MexicoMap";

const CookieConsent = lazy(() => import("./components/cookie-consent"));

// ── Testimonial avatar (photo with silhouette fallback) ─────────────────────
function TestimonialAvatar({
  photoUrl,
  slotHint,
  size = 54,
}: {
  photoUrl?: string;
  slotHint: string;
  size?: number;
}) {
  const [failed, setFailed] = useState(false);
  const px = `${size}px`;
  if (photoUrl && !failed) {
    return (
      <img
        src={photoUrl}
        alt={slotHint}
        loading="lazy"
        width={size}
        height={size}
        onError={() => setFailed(true)}
        style={{
          width: px,
          height: px,
          flex: "none",
          objectFit: "cover",
          border: "1px solid var(--th-card-border,#2A4A2A)",
          borderRadius: "999px",
          display: "block",
        }}
      />
    );
  }
  const icon = Math.round(size * 0.44);
  return (
    <div
      role="img"
      aria-label={slotHint}
      style={{
        width: px,
        height: px,
        flex: "none",
        border: "1px solid var(--th-card-border,#2A4A2A)",
        borderRadius: "999px",
        background:
          "linear-gradient(135deg,rgba(139,197,63,.18),rgba(21,38,21,.35))",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg
        width={icon}
        height={icon}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <circle cx="12" cy="9" r="4" stroke="#8BC53F" strokeWidth="1.5" />
        <path
          d="M5 20c0-3.3 3.1-6 7-6s7 2.7 7 6"
          stroke="#8BC53F"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

// ── Company logo (optional clickable link to the company website) ────────────
function TestimonialLogo({
  q,
  size = 26,
  lang,
}: {
  q: Testimonial;
  size?: number;
  lang: "es" | "en";
}) {
  if (!q.logoUrl) return null;
  const visit = lang === "es" ? "visitar sitio web" : "visit website";
  const logoH = q.logoHeight ?? size;
  const img = (
    <img
      src={q.logoUrl}
      alt={q.logoAlt || ""}
      loading="lazy"
      style={{
        height: `${logoH}px`,
        width: "auto",
        maxWidth: "240px",
        objectFit: "contain",
        display: "block",
      }}
    />
  );
  if (!q.companyUrl) return img;
  return (
    <a
      href={q.companyUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={q.logoAlt ? `${q.logoAlt} — ${visit}` : visit}
      style={{
        display: "inline-flex",
        alignItems: "center",
        opacity: 0.88,
        transition: "opacity .2s",
        flex: "none",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
      onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.88")}
    >
      {img}
    </a>
  );
}

// ── Testimonial card (equal + featured variants) ─────────────────────────────
function TestimonialCard({
  q,
  featured = false,
  lang,
}: {
  q: Testimonial;
  featured?: boolean;
  lang: "es" | "en";
}) {
  return (
    <figure
      style={{
        border: "1px solid var(--th-card-border,#2A4A2A)",
        borderRadius: "13px",
        padding: featured ? "clamp(30px,3vw,46px)" : "clamp(26px,2.2vw,34px)",
        background: "var(--th-card-bg,#163016)",
        margin: 0,
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
      <span
        style={{
          alignSelf: "flex-start",
          fontFamily: "'Prompt',sans-serif",
          fontWeight: 500,
          fontSize: "12px",
          letterSpacing: ".12em",
          textTransform: "uppercase",
          color: "#1A2E1A",
          background: "#8BC53F",
          borderRadius: "999px",
          padding: "4px 10px",
          marginBottom: "20px",
          opacity: 0.9,
        }}
      >
        {q.tag}
      </span>
      <blockquote
        style={{
          fontFamily: "'Newsreader',Georgia,serif",
          fontStyle: "normal",
          fontWeight: 500,
          fontSize: featured ? "clamp(22px,2.2vw,28px)" : "20px",
          lineHeight: 1.45,
          color: "var(--th-quote,#D9E0D9)",
          margin: "0 0 24px",
          maxWidth: featured ? "48ch" : undefined,
        }}
      >
        {q.quote}
      </blockquote>
      <figcaption
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
          marginTop: "auto",
          flexWrap: "wrap",
        }}
      >
        <span
          style={{
            display: "flex",
            alignItems: "center",
            gap: "14px",
            minWidth: 0,
          }}
        >
          {q.photoUrl && (
            <TestimonialAvatar
              photoUrl={q.photoUrl}
              slotHint={q.slotHint}
              size={featured ? 64 : 54}
            />
          )}
          <span
            style={{
              fontFamily: "'Prompt',sans-serif",
              fontWeight: 500,
              fontSize: "12.5px",
              letterSpacing: ".04em",
              color: "var(--th-muted,#AFBEAF)",
              lineHeight: 1.4,
            }}
          >
            {q.name}
          </span>
        </span>
        <TestimonialLogo q={q} size={featured ? 30 : 26} lang={lang} />
      </figcaption>
    </figure>
  );
}

// ── Theme variable objects ──────────────────────────────────────────────────
const VELLUM: CSSProperties = {
  ["--th-bg" as string]: "#E8E3D2",
  ["--th-line" as string]: "rgba(26,46,26,.28)",
  ["--th-eyebrow" as string]: "#2A4A2A",
  ["--th-head" as string]: "#1A2E1A",
  ["--th-body" as string]: "#33402F",
  ["--th-muted" as string]: "#4A5642",
  ["--th-text" as string]: "#1A2E1A",
  ["--th-quote" as string]: "#2A3A26",
  ["--th-accent" as string]: "#2A4A2A",
  ["--th-card-bg" as string]: "rgba(255,255,255,.45)",
  ["--th-card-border" as string]: "rgba(26,46,26,.22)",
};

const DARKX: CSSProperties = {
  ["--th-bg" as string]: "rgba(21,38,21,.6)",
  ["--th-line" as string]: "#2A4A2A",
  ["--th-eyebrow" as string]: "#8BC53F",
  ["--th-head" as string]: "#E8E3D2",
  ["--th-body" as string]: "#AFBEAF",
  ["--th-muted" as string]: "#AFBEAF",
  ["--th-text" as string]: "#E8E3D2",
  ["--th-quote" as string]: "#D9E0D9",
  ["--th-accent" as string]: "#8BC53F",
  ["--th-card-bg" as string]: "#163016",
  ["--th-card-border" as string]: "#2A4A2A",
  ["--th-us-bg" as string]: "#E8E3D2",
  ["--th-us-border" as string]: "#2A4A2A",
  ["--th-us-label" as string]: "#2A4A2A",
  ["--th-us-head" as string]: "#1A2E1A",
  ["--th-us-body" as string]: "#33402F",
};

// ── Static style fragments ──────────────────────────────────────────────────
const eyebrowText: CSSProperties = {
  fontFamily: "'Prompt',sans-serif",
  fontWeight: 500,
  fontSize: "14px",
  letterSpacing: ".14em",
  textTransform: "uppercase",
};

const ctaBase: CSSProperties = {
  fontFamily: "'Prompt',sans-serif",
  fontWeight: 600,
  fontSize: "15px",
  letterSpacing: ".04em",
  color: "#1A2E1A",
  background: "#E8E3D2",
  borderRadius: "22px",
  padding: "0 32px",
  height: "50px",
  whiteSpace: "nowrap",
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "opacity .2s",
};

const inputBase: CSSProperties = {
  fontFamily: "'Lato',sans-serif",
  fontSize: "15px",
  color: "#E8E3D2",
  background: "#152615",
  border: "1px solid #5F7A5F",
  borderRadius: "4px",
  padding: "12px 14px",
  width: "100%",
  outline: "none",
};

const labelSpan: CSSProperties = {
  fontFamily: "'Prompt',sans-serif",
  fontWeight: 500,
  fontSize: "12px",
  letterSpacing: ".08em",
  textTransform: "uppercase",
  color: "#AFBEAF",
};

const errSpan: CSSProperties = {
  fontFamily: "'Lato',sans-serif",
  fontSize: "14px",
  color: "#E2B48F",
};

function detectLang(): Lang {
  try {
    const param = new URLSearchParams(window.location.search)
      .get("lang")
      ?.toLowerCase();
    if (param === "es" || param === "en") return param;
  } catch {
    /* noop */
  }
  try {
    const stored = localStorage.getItem("vx-lang");
    if (stored === "es" || stored === "en") return stored;
  } catch {
    /* noop */
  }
  try {
    const nav = (navigator.language || "es").toLowerCase();
    return nav.startsWith("en") ? "en" : "es";
  } catch {
    return "es";
  }
}

const SECTION_IDS = [
  "top",
  "permanece",
  "capital",
  "mexico",
  "fundadores",
  "enfoque",
  "contacto",
];

export default function App() {
  const [lang, setLang] = useState<Lang>(() => detectLang());
  const [openFaq, setOpenFaq] = useState<number>(-1);
  const [activeSection, setActiveSection] = useState<string>("top");
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<{
    name?: boolean;
    email?: boolean;
    message?: boolean;
  }>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isNarrow, setIsNarrow] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [approachForceGrid, setApproachForceGrid] = useState(false);

  const nameRef = useRef<HTMLInputElement>(null);
  const companyRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);
  const hpRef = useRef<HTMLInputElement>(null);
  const stepperRootRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const menuPanelRef = useRef<HTMLDivElement>(null);
  const stepperHandleRef = useRef<ReturnType<typeof initApproachStepper> | null>(
    null,
  );

  const c = CONTENT[lang];

  const showApproachGrid = reduced || isNarrow || approachForceGrid;

  // Scroll-track height for the approach section. The stage is held via CSS
  // `position: sticky`, so this track's extra height (added to the 100vh stage)
  // defines how much scroll the stepper spans. ~420vh of travel for 8 steps
  // matches the design export's 520vh driver.
  const approachEndPct = useMemo(
    () => Math.max(360, Math.round(c.steps.length * 52)),
    [c.steps.length],
  );

  // Persist language + sync SEO head (title, meta, canonical, hreflang, JSON-LD)
  useEffect(() => {
    try {
      localStorage.setItem("vx-lang", lang);
    } catch {
      /* noop */
    }
    applySeo(lang, c);
  }, [lang, c]);

  // Record first-touch campaign attribution (UTM params) on initial load.
  useEffect(() => {
    captureAttribution();
  }, []);

  const changeLang = useCallback((next: Lang) => {
    setLang((prev) => {
      if (prev !== next) trackEvent("language_switch", { language: next });
      return next;
    });
  }, []);

  // Responsive + reduced-motion listeners
  useEffect(() => {
    const narrowMq = window.matchMedia("(max-width: 860px)");
    const reduceMq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onNarrow = () => setIsNarrow(narrowMq.matches);
    const onReduce = () => setReduced(reduceMq.matches);
    onNarrow();
    onReduce();
    narrowMq.addEventListener("change", onNarrow);
    reduceMq.addEventListener("change", onReduce);
    return () => {
      narrowMq.removeEventListener("change", onNarrow);
      reduceMq.removeEventListener("change", onReduce);
    };
  }, []);

  // Mobile menu: close when leaving narrow layout, lock scroll while open,
  // and allow closing with the Escape key.
  useEffect(() => {
    if (!isNarrow && menuOpen) setMenuOpen(false);
  }, [isNarrow, menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const getFocusables = (): HTMLElement[] => {
      const inPanel = menuPanelRef.current
        ? Array.from(
            menuPanelRef.current.querySelectorAll<HTMLElement>(
              "a[href],button",
            ),
          )
        : [];
      return menuButtonRef.current
        ? [menuButtonRef.current, ...inPanel]
        : inPanel;
    };
    // Move focus into the menu when it opens.
    const firstLink = menuPanelRef.current?.querySelector<HTMLElement>(
      "a[href]",
    );
    firstLink?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        return;
      }
      if (e.key === "Tab") {
        const els = getFocusables();
        if (els.length === 0) return;
        const first = els[0];
        const last = els[els.length - 1];
        const active = document.activeElement as HTMLElement | null;
        if (e.shiftKey) {
          if (active === first || !active || !els.includes(active)) {
            e.preventDefault();
            last.focus();
          }
        } else if (active === last || !active || !els.includes(active)) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
      // Restore focus to the toggle button when the menu closes.
      menuButtonRef.current?.focus();
    };
  }, [menuOpen]);

  // Active-section spy
  useEffect(() => {
    const els = SECTION_IDS.map((id) => document.getElementById(id)).filter(
      Boolean,
    ) as HTMLElement[];
    if (!els.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActiveSection(e.target.id);
        });
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  // Fibonacci backdrop + float — run once after mount
  useLayoutEffect(() => {
    const cleanupFib = initFibTiles();
    const cleanupFloat = initFloat();
    return () => {
      cleanupFib();
      cleanupFloat();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Approach stepper — re-init when layout mode changes. The rail/card text is
  // React-owned (updated in place on language switch), so the driver's node
  // references stay valid without a re-init.
  useLayoutEffect(() => {
    if (showApproachGrid) return;
    const root = stepperRootRef.current;
    if (!root) return;
    const handle = initApproachStepper(root, c.steps.length);
    stepperHandleRef.current = handle;
    if (!handle.ok) {
      setApproachForceGrid(true);
      handle.cleanup();
      stepperHandleRef.current = null;
      return;
    }
    return () => {
      handle.cleanup();
      stepperHandleRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showApproachGrid, isNarrow, reduced, lang]);

  const jumpToCard = useCallback((i: number) => {
    stepperHandleRef.current?.jumpTo(i);
  }, []);

  const onSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (hpRef.current && hpRef.current.value.trim() !== "") {
        setSubmitted(true);
        return;
      }
      const name = nameRef.current?.value.trim() ?? "";
      const email = emailRef.current?.value.trim() ?? "";
      const message = messageRef.current?.value.trim() ?? "";
      const company = companyRef.current?.value.trim() ?? "";
      const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      const nextErrors = {
        name: !name,
        email: !emailOk,
        message: !message,
      };
      setErrors(nextErrors);
      if (nextErrors.name) {
        nameRef.current?.focus();
        return;
      }
      if (nextErrors.email) {
        emailRef.current?.focus();
        return;
      }
      if (nextErrors.message) {
        messageRef.current?.focus();
        return;
      }
      setSubmitError(null);
      setSubmitting(true);
      try {
        const res = await fetch(`${import.meta.env.BASE_URL}api/contact`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            company,
            email,
            message,
            lang,
            website: hpRef.current?.value ?? "",
            ...getAttribution(),
          }),
        });
        if (!res.ok) throw new Error("bad status");
        setSubmitted(true);
        trackEvent("contact_submit", { status: "success", language: lang });
      } catch {
        trackEvent("contact_submit", { status: "error", language: lang });
        setSubmitError(
          lang === "es"
            ? "No pudimos enviar tu mensaje. Intenta de nuevo o escríbenos por WhatsApp."
            : "We couldn't send your message. Please try again or reach us on WhatsApp.",
        );
      } finally {
        setSubmitting(false);
      }
    },
    [lang],
  );

  const navLinkStyle = useCallback(
    (href: string): CSSProperties => {
      const id = href.replace("#", "");
      const active = activeSection === id;
      return {
        fontFamily: "'Prompt',sans-serif",
        fontWeight: 500,
        fontSize: "12.5px",
        letterSpacing: ".04em",
        textTransform: "uppercase",
        textDecoration: "none",
        color: active ? "#E8E3D2" : "#8FA88F",
        transition: "color .2s",
        whiteSpace: "nowrap",
      };
    },
    [activeSection],
  );

  const langBtn = (active: boolean): CSSProperties => ({
    fontFamily: "'Prompt',sans-serif",
    fontWeight: 600,
    fontSize: "12px",
    letterSpacing: ".08em",
    padding: "7px 15px",
    border: "none",
    cursor: "pointer",
    background: active ? "#8BC53F" : "transparent",
    color: active ? "#151515" : "#AFBEAF",
    transition: "all .2s",
  });

  const heroGridStyle: CSSProperties = useMemo(
    () => ({
      position: "relative",
      zIndex: 2,
      width: "100%",
      maxWidth: "1240px",
      margin: "0 auto",
    }),
    [],
  );

  const twoColStyle = (min: string): CSSProperties => ({
    display: "grid",
    gridTemplateColumns: isNarrow ? "1fr" : min,
    gap: "clamp(28px,4vw,64px)",
    maxWidth: "1240px",
    margin: "0 auto",
    alignItems: "start",
  });

  return (
    <div
      data-screen-label="Vertus Mexico — Landing"
      lang={lang}
      style={{
        position: "relative",
        minHeight: "100vh",
        background: "#1A2E1A",
        color: "#E8E3D2",
        fontFamily: "'Lato',sans-serif",
        lineHeight: 1.6,
        overflowX: "clip",
        WebkitFontSmoothing: "antialiased",
        MozOsxFontSmoothing: "grayscale",
      }}
    >
      <a href="#main-content" className="vx-skip">
        {c.skipLink}
      </a>
      {/* Fibonacci-square field backdrop */}
      <div
        id="vx-field-wrap"
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          pointerEvents: "none",
          overflow: "hidden",
        }}
      >
        <div
          id="vx-field"
          style={{ position: "absolute", inset: 0, willChange: "transform" }}
        >
          <svg
            id="vx-fib-svg"
            width="100%"
            height="100%"
            preserveAspectRatio="xMidYMid slice"
            viewBox="-560 -560 1120 1120"
            style={{
              position: "absolute",
              inset: 0,
              opacity: 0.62,
              transform: "rotate(1.5deg)",
              transformOrigin: "50% 50%",
            }}
          >
            <rect x="-560" y="-560" width="1120" height="1120" fill="#16281A" />
            <g id="vx-grow" />
          </svg>
        </div>
      </div>
      {/* HEADER */}
      <header
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 30,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
          padding: "8px clamp(18px,3.4vw,44px)",
          background: "rgba(21,38,21,.78)",
          WebkitBackdropFilter: "saturate(150%) blur(11px)",
          backdropFilter: "saturate(150%) blur(11px)",
          borderBottom: "1px solid #2A4A2A",
        }}
      >
        <a
          href="#top"
          aria-label="Vertus Group Mexico"
          style={{
            display: "flex",
            alignItems: "center",
            textDecoration: "none",
            flex: "none",
          }}
        >
          <img
            src="/assets/vertus-logo.png"
            alt="Vertus Group Mexico"
            style={{ height: "68px", width: "auto", display: "block" }}
          />
        </a>
        {isNarrow ? (
          <button
            type="button"
            ref={menuButtonRef}
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-controls="vx-mobile-menu"
            aria-label={menuOpen ? c.menuCloseLabel : c.menuOpenLabel}
            data-testid="button-mobile-menu"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "44px",
              height: "44px",
              flex: "none",
              background: "transparent",
              border: "1px solid #2A4A2A",
              borderRadius: "10px",
              cursor: "pointer",
              color: "#E8E3D2",
              padding: 0,
            }}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              {menuOpen ? (
                <path
                  d="M6 6l12 12M18 6L6 18"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              ) : (
                <path
                  d="M4 7h16M4 12h16M4 17h16"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              )}
            </svg>
          </button>
        ) : (
          <nav
            aria-label={c.navLabel}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "clamp(8px,1.2vw,16px)",
              flexWrap: "wrap",
              justifyContent: "flex-end",
            }}
          >
            {c.nav.map((n) => (
              <a
                key={n.href}
                href={n.href}
                className="vx-navlink"
                style={navLinkStyle(n.href)}
              >
                {n.label}
              </a>
            ))}
            <a
              href="#contacto"
              className="vx-navlink"
              data-testid="link-nav-cta"
              style={navLinkStyle("#contacto")}
            >
              {c.navContact}
            </a>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                border: "1px solid #2A4A2A",
                borderRadius: "999px",
                overflow: "hidden",
                marginLeft: "4px",
                flex: "none",
              }}
            >
              <button
                type="button"
                onClick={() => changeLang("es")}
                aria-pressed={lang === "es"}
                aria-label="Español"
                style={langBtn(lang === "es")}
              >
                {c.langES}
              </button>
              <button
                type="button"
                onClick={() => changeLang("en")}
                aria-pressed={lang === "en"}
                aria-label="English"
                style={langBtn(lang === "en")}
              >
                {c.langEN}
              </button>
            </span>
          </nav>
        )}
      </header>
      {/* MOBILE MENU OVERLAY */}
      {isNarrow && menuOpen && (
        <div
          id="vx-mobile-menu"
          data-testid="panel-mobile-menu"
          ref={menuPanelRef}
          role="dialog"
          aria-modal="true"
          aria-label={c.navLabel}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 29,
            paddingTop: "92px",
            background: "rgba(15,30,15,.97)",
            WebkitBackdropFilter: "blur(14px)",
            backdropFilter: "blur(14px)",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <nav
            aria-label={c.navLabel}
            style={{
              display: "flex",
              flexDirection: "column",
              padding: "12px clamp(20px,6vw,40px) 24px",
            }}
          >
            {c.nav.map((n) => (
              <a
                key={n.href}
                href={n.href}
                className="vx-navlink"
                onClick={() => setMenuOpen(false)}
                style={{
                  ...navLinkStyle(n.href),
                  fontSize: "17px",
                  padding: "16px 0",
                  borderBottom: "1px solid #2A4A2A",
                }}
              >
                {n.label}
              </a>
            ))}
            <a
              href="#contacto"
              className="vx-cta"
              data-testid="link-mobile-nav-cta"
              onClick={() => setMenuOpen(false)}
              style={{
                ...ctaBase,
                height: "46px",
                marginTop: "22px",
                alignSelf: "flex-start",
                flex: "none",
              }}
            >
              {c.ctaStart}
            </a>
          </nav>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "14px",
              padding: "8px clamp(20px,6vw,40px) 40px",
            }}
          >
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                border: "1px solid #2A4A2A",
                borderRadius: "999px",
                overflow: "hidden",
                flex: "none",
              }}
            >
              <button
                type="button"
                onClick={() => {
                  changeLang("es");
                  setMenuOpen(false);
                }}
                aria-pressed={lang === "es"}
                aria-label="Español"
                style={{ ...langBtn(lang === "es"), padding: "10px 20px" }}
              >
                {c.langES}
              </button>
              <button
                type="button"
                onClick={() => {
                  changeLang("en");
                  setMenuOpen(false);
                }}
                aria-pressed={lang === "en"}
                aria-label="English"
                style={{ ...langBtn(lang === "en"), padding: "10px 20px" }}
              >
                {c.langEN}
              </button>
            </span>
          </div>
        </div>
      )}
      <main id="main-content">
        {/* HERO */}
        <section
          id="top"
          data-screen-label="01 Hero"
          style={{
            position: "relative",
            zIndex: 2,
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding:
              "clamp(140px,18vh,180px) clamp(20px,7vw,110px) clamp(80px,10vh,110px)",
          }}
        >
          <div style={heroGridStyle}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "9px",
                marginBottom: "22px",
              }}
            >
              <span
                style={{
                  ...eyebrowText,
                  color: "#8BC53F",
                  marginLeft: "5px",
                }}
              >
                {c.heroEyebrow}
              </span>
            </div>
            <h1
              style={{
                fontFamily: "Georgia,'Newsreader',serif",
                fontWeight: 900,
                fontSize: "clamp(32px,6vw,116px)",
                lineHeight: 1.02,
                letterSpacing: "-0.03em",
                color: "#E8E3D2",
                margin: 0,
                whiteSpace: "pre-line",
              }}
            >
              {c.heroTitle}
            </h1>
            <p
              style={{
                fontFamily: "'Lato',sans-serif",
                fontSize: "clamp(17px,1.15vw,22px)",
                lineHeight: 1.7,
                color: "#E8E3D2",
                margin: "clamp(24px,3vh,36px) 0 0",
                maxWidth: "36em",
              }}
            >
              {c.heroLead}
            </p>
            <a
              href="#contacto"
              className="vx-cta"
              style={{ ...ctaBase, marginTop: "clamp(28px,3vh,42px)" }}
            >
              {c.ctaStart}
            </a>
            <p
              style={{
                fontFamily: "'Lato',sans-serif",
                fontSize: "clamp(13.5px,0.85vw,16px)",
                lineHeight: 1.6,
                color: "#B7C4B7",
                margin: "clamp(40px,6vh,64px) 0 0",
                paddingTop: "22px",
                borderTop: "1px solid #2A4A2A",
                maxWidth: "60ch",
              }}
            >
              {c.heroParent}
            </p>
          </div>
        </section>

        {/* STAYS THE SAME */}
        <div style={VELLUM}>
          <section
            id="permanece"
            data-screen-label="02 What stays the same"
            style={{
              position: "relative",
              zIndex: 2,
              padding: "clamp(56px,8vw,96px) clamp(20px,7vw,110px)",
              scrollMarginTop: "80px",
              borderTop: "1px solid var(--th-line,#2A4A2A)",
              background: "var(--th-bg,rgba(21,38,21,.55))",
            }}
          >
            <div style={{ maxWidth: "1240px", margin: "0 auto" }}>
              <div
                style={{
                  ...eyebrowText,
                  color: "var(--th-eyebrow,#8BC53F)",
                  marginBottom: "18px",
                }}
              >
                {c.stayEyebrow}
              </div>
              <h2
                style={{
                  fontFamily: "'Newsreader',Georgia,serif",
                  fontWeight: 600,
                  fontSize: "clamp(32px,4.6vw,62px)",
                  lineHeight: 1.08,
                  letterSpacing: "-0.01em",
                  color: "var(--th-head,#E8E3D2)",
                  margin: 0,
                  textWrap: "balance",
                  maxWidth: "18ch",
                }}
              >
                {c.stayTitle}
              </h2>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit,minmax(238px,1fr))",
                  gap: "18px",
                  marginTop: "36px",
                }}
              >
                {c.stayCards.map((card, i) => (
                  <article
                    key={i}
                    className="vx-hovercard"
                    style={{
                      border: "1px solid var(--th-card-border,#2A4A2A)",
                      borderRadius: "13px",
                      padding: "clamp(26px,2.2vw,34px)",
                      background: "var(--th-card-bg,#163016)",
                      display: "flex",
                      flexDirection: "column",
                      minHeight: "240px",
                    }}
                  >
                    <div
                      style={{
                        fontFamily: "'Prompt',sans-serif",
                        fontWeight: 500,
                        fontSize: "12px",
                        letterSpacing: ".13em",
                        textTransform: "uppercase",
                        color: "var(--th-muted,#AFBEAF)",
                      }}
                    >
                      {card.tag}
                    </div>
                    <h3
                      style={{
                        fontFamily: "'Newsreader',Georgia,serif",
                        fontWeight: 600,
                        fontSize: "25px",
                        lineHeight: 1.2,
                        letterSpacing: "-0.01em",
                        color: "var(--th-text,#E8E3D2)",
                        margin: "14px 0 14px",
                        // Reserve two lines so the body copy aligns across the
                        // row whether a title is one or two lines.
                        minHeight: "2.4em",
                      }}
                    >
                      {card.title}
                    </h3>
                    <p
                      style={{
                        fontFamily: "'Lato',sans-serif",
                        fontSize: "15.5px",
                        lineHeight: 1.65,
                        color: "var(--th-muted,#AFBEAF)",
                        margin: 0,
                      }}
                    >
                      {card.body}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </section>
        </div>

        {/* THE DIFFERENCE */}
        <div style={DARKX}>
          <section
            id="capital"
            data-screen-label="03 Why permanent capital"
            style={{
              position: "relative",
              zIndex: 2,
              padding: "clamp(56px,8vw,96px) clamp(20px,7vw,110px)",
              scrollMarginTop: "80px",
              background: "var(--th-bg,#E8E3D2)",
              borderTop: "1px solid var(--th-line,#2A4A2A)",
            }}
          >
            <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
              <div
                style={{
                  ...eyebrowText,
                  fontWeight: 600,
                  color: "var(--th-eyebrow,#2A4A2A)",
                  marginBottom: "18px",
                }}
              >
                {c.diffEyebrow}
              </div>
              <h2
                style={{
                  fontFamily: "'Newsreader',Georgia,serif",
                  fontWeight: 600,
                  fontSize: "clamp(32px,4.8vw,64px)",
                  lineHeight: 1.07,
                  letterSpacing: "-0.01em",
                  color: "var(--th-head,#1A2E1A)",
                  margin: 0,
                  textWrap: "balance",
                  maxWidth: "16ch",
                }}
              >
                {c.diffTitle}
              </h2>
              <p
                style={{
                  fontFamily: "'Lato',sans-serif",
                  fontWeight: 400,
                  fontSize: "clamp(17px,1.5vw,20px)",
                  lineHeight: 1.7,
                  color: "var(--th-body,#33402F)",
                  margin: "34px 0 0",
                  maxWidth: "60ch",
                }}
              >
                {c.diffBody}
              </p>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: isNarrow ? "1fr" : "1fr 1fr",
                  gap: "18px",
                  marginTop: "34px",
                }}
              >
                <div
                  style={{
                    border: "1px solid var(--th-card-border,rgba(26,46,26,.22))",
                    borderRadius: "13px",
                    padding: "clamp(26px,2.4vw,38px)",
                    background: "var(--th-card-bg,rgba(255,255,255,.4))",
                  }}
                >
                  <div
                    style={{
                      fontFamily: "'Prompt',sans-serif",
                      fontWeight: 600,
                      fontSize: "12px",
                      letterSpacing: ".13em",
                      textTransform: "uppercase",
                      color: "var(--th-muted,#4A5642)",
                      marginBottom: "16px",
                    }}
                  >
                    {c.diffThemLabel}
                  </div>
                  <div
                    style={{
                      fontFamily: "'Newsreader',Georgia,serif",
                      fontWeight: 600,
                      fontSize: "24px",
                      color: "var(--th-text,#2A3A26)",
                      marginBottom: "10px",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {c.diffThemHead}
                  </div>
                  <p
                    style={{
                      fontFamily: "'Lato',sans-serif",
                      fontSize: "15px",
                      lineHeight: 1.6,
                      color: "var(--th-muted,#4A5642)",
                      margin: 0,
                    }}
                  >
                    {c.diffThemBody}
                  </p>
                </div>
                <div
                  style={{
                    border: "1px solid var(--th-us-border,#2A4A2A)",
                    borderRadius: "13px",
                    padding: "clamp(26px,2.4vw,38px)",
                    background: "var(--th-us-bg,#E8E3D2)",
                    position: "relative",
                  }}
                  className="bg-[color:var(--th-us-bg)] text-[color:var(--th-us-head)] border-t-[color:var(--th-card-bg)] border-r-[color:var(--th-card-bg)] border-b-[color:var(--th-card-bg)] border-l-[color:var(--th-card-bg)] border-t-[0px] border-r-[0px] border-b-[0px] border-l-[0px]">
                  <div
                    style={{
                      fontFamily: "'Prompt',sans-serif",
                      fontWeight: 600,
                      fontSize: "12px",
                      letterSpacing: ".13em",
                      textTransform: "uppercase",
                      color: "var(--th-us-label,#2A4A2A)",
                      marginBottom: "16px",
                    }}
                    className="text-[color:var(--th-us-label)]">
                    {c.diffUsLabel}
                  </div>
                  <div
                    style={{
                      fontFamily: "'Newsreader',Georgia,serif",
                      fontWeight: 600,
                      fontSize: "24px",
                      color: "var(--th-us-head,#1A2E1A)",
                      marginBottom: "10px",
                      letterSpacing: "-0.01em",
                    }}
                    className="text-[color:var(--th-us-head)]">
                    {c.diffUsHead}
                  </div>
                  <p
                    style={{
                      fontFamily: "'Lato',sans-serif",
                      fontSize: "15px",
                      lineHeight: 1.6,
                      color: "var(--th-us-body,#33402F)",
                      margin: 0,
                    }}
                    className="text-[color:var(--th-us-body)]">
                    {c.diffUsBody}
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* ESTABLISHED IN MEXICO */}
        <div style={VELLUM}>
          <section
            id="mexico"
            data-screen-label="04 Established in Mexico"
            style={{
              position: "relative",
              zIndex: 2,
              padding: "clamp(56px,8vw,96px) clamp(20px,7vw,110px)",
              paddingBottom: "clamp(24px,4vw,40px)",
              scrollMarginTop: "80px",
              borderTop: "1px solid var(--th-line,#2A4A2A)",
              background: "var(--th-bg,transparent)",
              overflow: "hidden",
            }}
          >
            <div
              style={{ maxWidth: "1240px", margin: "0 auto", position: "relative" }}
            >
              <div
                style={{
                  ...eyebrowText,
                  color: "var(--th-eyebrow,#8BC53F)",
                  marginBottom: "18px",
                }}
              >
                {c.mxEyebrow}
              </div>
              <h2
                style={{
                  fontFamily: "'Newsreader',Georgia,serif",
                  fontWeight: 600,
                  fontSize: "clamp(32px,4.8vw,64px)",
                  lineHeight: 1.07,
                  letterSpacing: "-0.01em",
                  color: "var(--th-head,#E8E3D2)",
                  margin: 0,
                  textWrap: "balance",
                }}
              >
                {c.mxTitle}
              </h2>
              <p
                style={{
                  fontFamily: "'Lato',sans-serif",
                  fontSize: "18px",
                  lineHeight: 1.7,
                  color: "var(--th-body,#AFBEAF)",
                  margin: "28px 0 0",
                  maxWidth: "62ch",
                }}
              >
                {c.mxBody}
              </p>
              <div
                style={{ display: "grid", gap: "18px", marginTop: "36px" }}
              >
                {c.testimonials
                  .filter((q) => q.slotId === "vx-test-nadia")
                  .map((q) => (
                    <TestimonialCard key={q.slotId} q={q} featured lang={lang} />
                  ))}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fit,minmax(280px,1fr))",
                    gap: "18px",
                  }}
                >
                  {c.testimonials
                    .filter((q) => q.slotId !== "vx-test-nadia")
                    .map((q) => (
                      <TestimonialCard key={q.slotId} q={q} lang={lang} />
                    ))}
                </div>
              </div>
            </div>
          </section>

          {/* MEXICO CITY MAP */}
          <section
            data-screen-label="04b Mexico City"
            style={{
              position: "relative",
              zIndex: 2,
              padding: "clamp(56px,8vw,96px) clamp(20px,7vw,110px)",
              paddingTop: "clamp(24px,4vw,40px)",
              // Section stays transparent; the vellum fill is painted by the map
              // window's large box-shadow spread (clipped by overflow:hidden),
              // leaving a rounded cutout where the fixed Fibonacci field leaks
              // through behind the map.
              background: "transparent",
              overflow: "hidden",
            }}
          >
            <div style={{ ...twoColStyle("1fr 1fr"), alignItems: "stretch" }}>
              <div
                style={{
                  position: "relative",
                  zIndex: 2,
                  order: 2,
                  background: "var(--th-bg,#E8E3D2)",
                  borderRadius: "13px",
                  padding: "clamp(28px,3.4vw,48px)",
                }}
              >
                <div
                  style={{
                    ...eyebrowText,
                    color: "var(--th-eyebrow,#8BC53F)",
                    marginBottom: "18px",
                  }}
                >
                  {c.mapEyebrow}
                </div>
                <h2
                  style={{
                    fontFamily: "'Newsreader',Georgia,serif",
                    fontWeight: 600,
                    fontSize: "clamp(32px,4.8vw,64px)",
                    lineHeight: 1.07,
                    letterSpacing: "-0.01em",
                    color: "var(--th-head,#E8E3D2)",
                    margin: 0,
                    textWrap: "balance",
                  }}
                >
                  {c.mapTitle}
                </h2>
                <p
                  style={{
                    fontFamily: "'Lato',sans-serif",
                    fontSize: "18px",
                    lineHeight: 1.7,
                    color: "var(--th-body,#AFBEAF)",
                    margin: "28px 0 0",
                    maxWidth: "52ch",
                  }}
                >
                  {c.mapBody}
                </p>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    marginTop: "28px",
                    fontFamily: "'Prompt',sans-serif",
                    fontWeight: 500,
                    fontSize: "13px",
                    letterSpacing: ".04em",
                    color: "var(--th-muted,#AFBEAF)",
                  }}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M12 21s7-6.3 7-11a7 7 0 1 0-14 0c0 4.7 7 11 7 11Z"
                      stroke="var(--th-accent,#8BC53F)"
                      strokeWidth="1.6"
                      strokeLinejoin="round"
                    />
                    <circle
                      cx="12"
                      cy="10"
                      r="2.4"
                      stroke="var(--th-accent,#8BC53F)"
                      strokeWidth="1.6"
                    />
                  </svg>
                  {c.mapCaption}
                </div>
              </div>
              <div
                style={{
                  position: "relative",
                  zIndex: 1,
                  order: 1,
                  height: "clamp(320px,42vw,480px)",
                  borderRadius: "13px",
                  overflow: "hidden",
                  padding: "clamp(16px,2.4vw,34px)",
                  // Transparent window: the fixed Fibonacci field leaks through
                  // here, while the huge spread paints the surrounding section
                  // vellum (clipped by the section's overflow:hidden).
                  background: "transparent",
                  border: "1px solid var(--th-card-border,rgba(26,46,26,.22))",
                  boxShadow:
                    "0 0 0 9999px var(--th-bg,#E8E3D2), inset 0 2px 26px rgba(0,0,0,.28)",
                }}
              >
                <MexicoMap label={c.mapAria} />
              </div>
            </div>
          </section>

        {/* THE TEAM */}
        <section
          id="equipo"
          data-screen-label="04c Team"
          style={{
            position: "relative",
            zIndex: 2,
            padding: "clamp(56px,8vw,96px) clamp(20px,7vw,110px)",
            scrollMarginTop: "80px",
            background: "rgba(21,38,21,.6)",
            borderTop: "1px solid #2A4A2A",
            paddingBottom: "clamp(8px,2vw,16px)",
          }}
        >
          <div style={{ maxWidth: "1240px", margin: "0 auto" }}>
          <div
            style={{
              ...eyebrowText,
              color: "#8BC53F",
              marginBottom: "18px",
            }}
          >
            {c.teamEyebrow}
          </div>
          <h2
            style={{
              fontFamily: "'Newsreader',Georgia,serif",
              fontWeight: 600,
              fontSize: "clamp(30px,4vw,54px)",
              lineHeight: 1.08,
              letterSpacing: "-0.01em",
              color: "#E8E3D2",
              margin: 0,
              marginBottom: "clamp(32px,4vw,48px)",
              textWrap: "balance",
            }}
          >
            {c.teamTitle}
          </h2>
          <div style={twoColStyle("1fr 1fr")}>
            <div>
              <p
                style={{
                  fontFamily: "'Lato',sans-serif",
                  fontSize: "18px",
                  lineHeight: 1.7,
                  color: "#AFBEAF",
                  margin: "28px 0 0",
                  maxWidth: "60ch",
                }}
              >
                {c.teamBody}
              </p>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "12px",
                  marginTop: "28px",
                }}
              >
                {c.teamLinks.map((l, i) => (
                  <a
                    key={i}
                    href={l.href}
                    target="_blank"
                    rel="noopener"
                    className="vx-link"
                    style={{
                      fontFamily: "'Prompt',sans-serif",
                      fontWeight: 600,
                      fontSize: "15px",
                      letterSpacing: ".02em",
                      color: "#A7D56F",
                      background: "transparent",
                      border: "1px solid #4A6A4A",
                      borderRadius: "22px",
                      padding: "0 22px",
                      height: "50px",
                      whiteSpace: "nowrap",
                      textDecoration: "none",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "opacity .2s",
                    }}
                  >
                    {l.label}
                  </a>
                ))}
              </div>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "1px",
                background: "#2A4A2A",
                border: "1px solid #2A4A2A",
                borderRadius: "13px",
                overflow: "hidden",
              }}
            >
              {c.stats.map((s, i) => (
                <div
                  key={i}
                  className="vx-hovercard"
                  style={{ padding: "26px 22px", background: "#E8E3D2" }}
                >
                  <div
                    style={{
                      fontFamily: "Georgia,serif",
                      fontWeight: 900,
                      fontSize: "clamp(38px,4vw,56px)",
                      lineHeight: 0.9,
                      letterSpacing: "-0.03em",
                      color: s.color,
                    }}
                  >
                    {s.value}
                  </div>
                  <div
                    style={{
                      fontFamily: "'Prompt',sans-serif",
                      fontWeight: 500,
                      fontSize: "12px",
                      letterSpacing: ".1em",
                      textTransform: "uppercase",
                      color: "#2A4A2A",
                      marginTop: "14px",
                      lineHeight: 1.4,
                    }}
                  >
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
          </div>
        </section>
        </div>

        {/* FOR FOUNDERS */}
        <section
          id="fundadores"
          data-screen-label="05 For founders"
          style={{
            position: "relative",
            zIndex: 2,
            padding:
              "clamp(24px,4vw,48px) clamp(20px,7vw,110px) clamp(56px,8vw,96px)",
            scrollMarginTop: "80px",
            background: "rgba(21,38,21,.6)",
            paddingTop: "clamp(8px,2vw,16px)",
          }}
        >
          <div style={{ maxWidth: "1240px", margin: "0 auto" }}>
            <div
              style={{
                ...eyebrowText,
                color: "#8BC53F",
                marginBottom: "18px",
              }}
            >
              {c.foundEyebrow}
            </div>
            <h2
              style={{
                fontFamily: "'Newsreader',Georgia,serif",
                fontWeight: 600,
                fontSize: "clamp(32px,4.8vw,64px)",
                lineHeight: 1.07,
                letterSpacing: "-0.01em",
                color: "#E8E3D2",
                margin: 0,
              }}
            >
              {c.foundTitle}
            </h2>
            <p
              style={{
                fontFamily: "'Lato',sans-serif",
                fontSize: "18px",
                lineHeight: 1.7,
                color: "#AFBEAF",
                margin: "24px 0 0",
                maxWidth: "60ch",
              }}
            >
              {c.foundBody}
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isNarrow ? "1fr" : "1fr 1fr",
                gap: "18px",
                marginTop: "32px",
              }}
            >
              <div
                className="vx-hovercard"
                style={{
                  border: "1px solid #2A4A2A",
                  borderRadius: "13px",
                  padding: "clamp(26px,2.4vw,40px)",
                  background: "#E8E3D2",
                }}
              >
                <div
                  style={{
                    fontFamily: "'Prompt',sans-serif",
                    fontWeight: 600,
                    fontSize: "19px",
                    letterSpacing: ".09em",
                    textTransform: "uppercase",
                    color: "#2A4A2A",
                    marginBottom: "22px",
                  }}
                >
                  {c.bizHead}
                </div>
                <ul
                  style={{
                    listStyle: "none",
                    margin: 0,
                    padding: 0,
                    display: "flex",
                    flexDirection: "column",
                    gap: "15px",
                  }}
                >
                  {c.bizItems.map((b, i) => (
                    <li
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "13px",
                        fontFamily: "'Lato',sans-serif",
                        fontSize: "16px",
                        color: "#1A2E1A",
                      }}
                    >
                      <span
                        style={{
                          width: "7px",
                          height: "7px",
                          borderRadius: "999px",
                          background: "#8BC53F",
                          flex: "none",
                          display: "block",
                        }}
                      />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
              <div
                className="vx-hovercard"
                style={{
                  border: "1px solid #2A4A2A",
                  borderRadius: "13px",
                  padding: "clamp(26px,2.4vw,40px)",
                  background: "#E8E3D2",
                }}
              >
                <div
                  style={{
                    fontFamily: "'Prompt',sans-serif",
                    fontWeight: 600,
                    fontSize: "19px",
                    letterSpacing: ".09em",
                    textTransform: "uppercase",
                    color: "#2A4A2A",
                    marginBottom: "22px",
                  }}
                >
                  {c.finHead}
                </div>
                <ul
                  style={{
                    listStyle: "none",
                    margin: 0,
                    padding: 0,
                    display: "flex",
                    flexDirection: "column",
                    gap: "15px",
                  }}
                >
                  {c.finItems.map((f, i) => (
                    <li
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "13px",
                        fontFamily: "'Lato',sans-serif",
                        fontSize: "16px",
                        color: "#1A2E1A",
                      }}
                    >
                      <span
                        style={{
                          width: "7px",
                          height: "7px",
                          borderRadius: "999px",
                          background: "#8BC53F",
                          flex: "none",
                          display: "block",
                        }}
                      />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div
              style={{
                marginTop: "18px",
                border: "1px solid #2A4A2A",
                borderRadius: "13px",
                padding: "clamp(30px,4vw,56px)",
                background: "#152615",
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "28px",
              }}
            >
              <div style={{ maxWidth: "46ch" }}>
                <div
                  style={{
                    fontFamily: "'Newsreader',Georgia,serif",
                    fontWeight: 600,
                    fontSize: "clamp(22px,2.4vw,30px)",
                    lineHeight: 1.25,
                    letterSpacing: "-0.01em",
                    color: "#E8E3D2",
                  }}
                >
                  {c.foundCtaQ}
                </div>
                <p
                  style={{
                    fontFamily: "'Lato',sans-serif",
                    fontSize: "15px",
                    lineHeight: 1.6,
                    color: "#AFBEAF",
                    margin: "14px 0 0",
                  }}
                >
                  {c.foundCtaNote}
                </p>
              </div>
              <a
                href="#contacto"
                className="vx-cta"
                style={{ ...ctaBase, flex: "none" }}
              >
                {c.ctaStart}
              </a>
            </div>
          </div>
        </section>


        {/* OUR APPROACH */}
        <section
          id="enfoque"
          data-screen-label="06 Our approach"
          style={{
            position: "relative",
            zIndex: 2,
            scrollMarginTop: "80px",
            borderTop: "1px solid #2A4A2A",
            // Opaque so the fixed global Fibonacci backdrop (#vx-field) doesn't
            // show through behind the approach card — leaving only the stepper's
            // own number-zoom visible here. Other sections keep the backdrop.
            background: "#152615",
          }}
        >
          <div
            style={{
              maxWidth: "1240px",
              margin: "0 auto",
              padding:
                "clamp(56px,8vw,96px) clamp(20px,7vw,110px) clamp(24px,4vw,48px)",
            }}
          >
            <div
              style={{ ...eyebrowText, color: "#8BC53F", marginBottom: "18px" }}
            >
              {c.appEyebrow}
            </div>
            <h2
              style={{
                fontFamily: "'Newsreader',Georgia,serif",
                fontWeight: 600,
                fontSize: "clamp(30px,4.4vw,60px)",
                lineHeight: 1.07,
                letterSpacing: "-0.01em",
                color: "#E8E3D2",
                margin: 0,
                textWrap: "balance",
                maxWidth: "20ch",
              }}
            >
              {c.appTitle}
            </h2>
            <p
              style={{
                fontFamily: "'Lato',sans-serif",
                fontSize: "18px",
                lineHeight: 1.7,
                color: "#AFBEAF",
                margin: "26px 0 0",
                maxWidth: "64ch",
              }}
            >
              {c.appBody}
            </p>
          </div>

          {!showApproachGrid && (
            <div
              ref={stepperRootRef}
              data-ap-driver="true"
              style={{
                position: "relative",
                zIndex: 2,
                height: `${100 + approachEndPct}vh`,
              }}
            >
              <div
                style={{
                  position: "sticky",
                  top: 0,
                  height: "100vh",
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {/* Fibonacci board — the camera zooms through these squares */}
                <div
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    inset: 0,
                    zIndex: 0,
                    overflow: "hidden",
                    pointerEvents: "none",
                  }}
                >
                  <div
                    data-ap-board="true"
                    className="vx-ap-board"
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 0,
                      width: 0,
                      height: 0,
                      transformOrigin: "0 0",
                      willChange: "transform",
                    }}
                  >
                    {c.steps.map((s, i) => (
                      <div
                        key={i}
                        data-ap-square="true"
                        data-index={i}
                        className="vx-ap-square"
                      >
                        <span data-ap-num="true">
                          {s.n.padStart(2, "0")}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Left-in scrim so numbers fade into the section edge */}
                <div
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    inset: 0,
                    zIndex: 1,
                    pointerEvents: "none",
                    background:
                      "linear-gradient(to right,#1A2E1A 0%,#1A2E1A 12%,rgba(26,46,26,0) 22%)",
                  }}
                />

                {/* Rail (clickable step index) + active-step card */}
                <div className="vx-ap-grid">
                  <div className="vx-ap-rail" data-ap-rail="true">
                    {c.steps.map((s, i) => (
                      <div
                        key={i}
                        className="vx-ap-rail-row"
                        data-ap-rail-row="true"
                        data-index={i}
                        role="button"
                        tabIndex={0}
                        aria-label={`${s.n}. ${s.title}`}
                        onClick={() => jumpToCard(i)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            jumpToCard(i);
                          }
                        }}
                      >
                        <div className="vx-ap-rail-box" data-ap-rail-box="true">
                          {s.n.padStart(2, "0")}
                        </div>
                        <div
                          className="vx-ap-rail-label"
                          data-ap-rail-label="true"
                        >
                          {s.title}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="vx-ap-cards" data-ap-cards="true">
                    {c.steps.map((s, i) => (
                      <div
                        key={i}
                        className="vx-ap-card"
                        data-ap-card="true"
                        data-index={i}
                        style={{ opacity: 0, filter: "blur(7px)" }}
                      >
                        <h2>{s.title}</h2>
                        <p>{s.body}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Keep-scrolling hint (fades out once the visitor advances) */}
                <div
                  data-ap-hint="true"
                  className="vx-sqhint"
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    bottom: "28px",
                    right: "clamp(20px,6vw,90px)",
                    zIndex: 3,
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    pointerEvents: "none",
                    transition: "opacity .5s ease",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'Prompt',sans-serif",
                      fontSize: "12px",
                      letterSpacing: ".12em",
                      textTransform: "uppercase",
                      color: "#9AAA9A",
                    }}
                  >
                    {c.appScrollHint}
                  </span>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M6 9l6 6 6-6"
                      stroke="#8BC53F"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>
            </div>
          )}

          {showApproachGrid && (
            <div
              style={{
                maxWidth: "1240px",
                margin: "0 auto",
                padding:
                  "0 clamp(20px,7vw,110px) clamp(56px,8vw,96px)",
              }}
            >
              <div
                style={{
                  borderRadius: "13px",
                  overflow: "hidden",
                  background: "#163016",
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
                    borderTop: "1px solid #2A4A2A",
                    borderLeft: "1px solid #2A4A2A",
                  }}
                >
                  {c.steps.map((s, i) => (
                    <div
                      key={i}
                      className="vx-hovercard"
                      style={{
                        borderRight: "1px solid #2A4A2A",
                        borderBottom: "1px solid #2A4A2A",
                        padding: "clamp(22px,1.9vw,30px)",
                        background: "#163016",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "baseline",
                          gap: "12px",
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "Georgia,serif",
                            fontWeight: 900,
                            fontSize: "29px",
                            letterSpacing: "-0.03em",
                            color: "#8BC53F",
                            lineHeight: 1,
                          }}
                        >
                          {s.n}
                        </span>
                        <h3
                          style={{
                            fontFamily: "'Newsreader',Georgia,serif",
                            fontWeight: 600,
                            fontSize: "18px",
                            letterSpacing: "-0.005em",
                            color: "#E8E3D2",
                            margin: 0,
                          }}
                        >
                          {s.title}
                        </h3>
                      </div>
                      <p
                        style={{
                          fontFamily: "'Lato',sans-serif",
                          fontSize: "14px",
                          lineHeight: 1.6,
                          color: "#AFBEAF",
                          margin: "13px 0 0",
                        }}
                      >
                        {s.body}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div
            style={{
              maxWidth: "1240px",
              margin: "0 auto",
              padding:
                "0 clamp(20px,7vw,110px) clamp(32px,5vw,56px)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              gap: "12px",
            }}
          >
            <span
              style={{
                fontFamily: "'Newsreader',Georgia,serif",
                fontWeight: 600,
                fontSize: "clamp(20px,2.4vw,28px)",
                letterSpacing: "-0.01em",
                color: "#E8E3D2",
                margin: 0,
              }}
            >
              {c.appResourcesTitle}
            </span>
            <a
              href={c.appResourcesHref}
              target="_blank"
              rel="noopener"
              className="vx-resource-cta"
              style={{
                fontFamily: "'Prompt',sans-serif",
                fontWeight: 600,
                fontSize: "15px",
                letterSpacing: ".02em",
                color: "#A7D56F",
                background: "transparent",
                border: "1px solid #4A6A4A",
                borderRadius: "22px",
                padding: "0 22px",
                height: "50px",
                whiteSpace: "nowrap",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {c.appResourcesLabel}
            </a>
          </div>
        </section>

        {/* FAQ */}
        <div style={VELLUM}>
          <section
            data-screen-label="07 FAQ"
            style={{
              position: "relative",
              zIndex: 2,
              padding: "clamp(56px,8vw,96px) clamp(20px,7vw,110px)",
              background: "var(--th-bg,#152615)",
              borderTop: "1px solid var(--th-line,#2A4A2A)",
            }}
          >
            <div style={{ maxWidth: "900px", margin: "0 auto" }}>
              <div
                style={{
                  ...eyebrowText,
                  color: "var(--th-eyebrow,#8BC53F)",
                  marginBottom: "18px",
                }}
              >
                {c.faqEyebrow}
              </div>
              <h2
                style={{
                  fontFamily: "'Newsreader',Georgia,serif",
                  fontWeight: 600,
                  fontSize: "clamp(30px,4vw,56px)",
                  lineHeight: 1.08,
                  letterSpacing: "-0.01em",
                  color: "var(--th-head,#E8E3D2)",
                  margin: "0 0 44px",
                  textWrap: "balance",
                  maxWidth: "18ch",
                }}
              >
                {c.faqTitle}
              </h2>
              <div style={{ borderTop: "1px solid var(--th-card-border,#2A4A2A)" }}>
                {c.faq.map((f, i) => {
                  const open = openFaq === i;
                  return (
                    <div
                      key={i}
                      style={{
                        borderBottom: "1px solid var(--th-card-border,#2A4A2A)",
                      }}
                    >
                      <button
                        type="button"
                        className="vx-faqbtn"
                        onClick={() => setOpenFaq(open ? -1 : i)}
                        aria-expanded={open}
                        aria-controls={`vx-faq-panel-${i}`}
                        style={{
                          width: "100%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: "20px",
                          textAlign: "left",
                          background: "transparent",
                          border: "none",
                          cursor: "pointer",
                          padding: "24px 0",
                          fontFamily: "'Newsreader',Georgia,serif",
                          fontWeight: 600,
                          fontSize: "clamp(18px,2vw,23px)",
                          letterSpacing: "-0.005em",
                          color: "var(--th-head,#E8E3D2)",
                          transition: "color .2s",
                        }}
                      >
                        <span>{f.q}</span>
                        <span
                          aria-hidden="true"
                          style={{
                            flex: "none",
                            width: "26px",
                            height: "26px",
                            borderRadius: "999px",
                            border: "1px solid var(--th-card-border,#2A4A2A)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontFamily: "'Prompt',sans-serif",
                            fontWeight: 500,
                            fontSize: "18px",
                            color: "var(--th-accent,#8BC53F)",
                            lineHeight: 1,
                          }}
                        >
                          {open ? "–" : "+"}
                        </span>
                      </button>
                      {open && (
                        <p
                          id={`vx-faq-panel-${i}`}
                          style={{
                            fontFamily: "'Lato',sans-serif",
                            fontSize: "16.5px",
                            lineHeight: 1.7,
                            color: "var(--th-muted,#AFBEAF)",
                            margin: 0,
                            padding: "0 0 28px",
                            maxWidth: "64ch",
                          }}
                        >
                          {f.a}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        </div>

        {/* MARIA BIO + FINAL CTA + CONTACT */}
        <div style={VELLUM}>
          <section
            id="maria"
            data-screen-label="08 Your contact"
            style={{
              position: "relative",
              zIndex: 2,
              padding: "clamp(56px,8vw,96px) clamp(20px,7vw,110px)",
              scrollMarginTop: "70px",
              background: "var(--th-bg,#E8E3D2)",
              borderTop: "1px solid var(--th-line,rgba(26,46,26,.28))",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                ...twoColStyle("2fr 3fr"),
                alignItems: "center",
              }}
            >
              <div
                style={{
                  position: "relative",
                  maxWidth: isNarrow ? "360px" : "480px",
                  margin: isNarrow ? "0 auto" : undefined,
                }}
              >
                <img
                  src={mariaPhoto}
                  alt={`${c.mariaFirst} ${c.mariaLast} — ${c.mariaRole}`}
                  loading="lazy"
                  style={{
                    width: "100%",
                    display: "block",
                    borderRadius: "13px",
                    filter: "grayscale(1)",
                  }}
                />
              </div>
              <div
                style={{
                  textAlign: isNarrow ? "center" : "left",
                }}
              >
                <span
                  style={{
                    ...eyebrowText,
                    color: "var(--th-head,#1A2E1A)",
                    display: "block",
                  }}
                >
                  {c.mariaEyebrow}
                </span>
                <h2
                  style={{
                    fontFamily: "Georgia,'Newsreader',serif",
                    fontWeight: 900,
                    fontSize: "clamp(34px,4.6vw,64px)",
                    lineHeight: 1.05,
                    letterSpacing: "-0.03em",
                    margin: "18px 0 0",
                  }}
                >
                  <span style={{ display: "block", color: "var(--th-head,#1A2E1A)" }}>
                    {c.mariaFirst}
                  </span>
                  <span style={{ display: "block", color: "var(--th-head,#1A2E1A)" }}>
                    {c.mariaLast}
                  </span>
                </h2>
                <span
                  style={{
                    fontFamily: "'Prompt',sans-serif",
                    fontWeight: 500,
                    fontSize: "13px",
                    letterSpacing: ".12em",
                    textTransform: "uppercase",
                    color: "var(--th-muted,#4A5642)",
                    display: "block",
                    margin: "14px 0 0",
                  }}
                >
                  {c.mariaRole}
                </span>
                <p
                  style={{
                    fontFamily: "'Lato',sans-serif",
                    fontSize: "17px",
                    lineHeight: 1.7,
                    color: "var(--th-body,#33402F)",
                    margin: "18px 0 0",
                    maxWidth: "58ch",
                  }}
                >
                  {c.mariaBio}
                </p>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: isNarrow ? "center" : "flex-start",
                    gap: "14px",
                    flexWrap: "wrap",
                    marginTop: "28px",
                  }}
                >
                  <a
                    href={MARIA_EMAIL_URL}
                    className="vx-cta"
                    onClick={() => trackEvent("maria_email_click")}
                    style={{
                      ...ctaBase,
                      color: "#1A2E1A",
                      background: "#8BC53F",
                      textTransform: "uppercase",
                      letterSpacing: ".06em",
                    }}
                  >
                    {c.mariaButton}
                  </a>
                  <a
                    href={MARIA_LINKEDIN_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={c.mariaLinkedInAria}
                    className="vx-link"
                    onClick={() => trackEvent("maria_linkedin_click")}
                    style={{
                      width: "50px",
                      height: "50px",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "1px solid var(--th-accent,#2A4A2A)",
                      borderRadius: "10px",
                      color: "var(--th-accent,#2A4A2A)",
                    }}
                  >
                    <svg
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path d="M4.98 3.5C4.98 4.88 3.87 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM.24 8.31h4.52V23H.24V8.31zM8.34 8.31h4.33v2.01h.06c.6-1.14 2.08-2.34 4.28-2.34 4.57 0 5.42 3.01 5.42 6.92V23h-4.52v-7.13c0-1.7-.03-3.89-2.37-3.89-2.37 0-2.73 1.85-2.73 3.76V23H8.34V8.31z" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </section>

          <section
            id="contacto"
            data-screen-label="09 Get in touch"
            style={{
              position: "relative",
              zIndex: 2,
              padding: "clamp(56px,8vw,96px) clamp(20px,7vw,110px)",
              scrollMarginTop: "70px",
              background: "#8BC53F",
              overflow: "hidden",
            }}
          >
            <div style={twoColStyle("1.1fr 1fr")}>
              <div>
                <h2
                  style={{
                    fontFamily: "Georgia,'Newsreader',serif",
                    fontWeight: 900,
                    fontSize: "clamp(34px,4.6vw,68px)",
                    lineHeight: 1.02,
                    letterSpacing: "-0.03em",
                    color: "var(--th-head,#E8E3D2)",
                    margin: 0,
                    textWrap: "balance",
                  }}
                >
                  {c.finalTitle}
                </h2>
                <p
                  style={{
                    fontFamily: "'Lato',sans-serif",
                    fontSize: "18px",
                    lineHeight: 1.7,
                    color: "var(--th-body,#AFBEAF)",
                    margin: "28px 0 0",
                    maxWidth: "48ch",
                  }}
                >
                  {c.finalBody}
                </p>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    marginTop: "34px",
                    flexWrap: "wrap",
                  }}
                >
                  <a
                    href={WHATSAPP_URL}
                    target="_blank"
                    rel="noopener"
                    className="vx-wa"
                    style={{
                      fontFamily: "'Prompt',sans-serif",
                      fontWeight: 600,
                      fontSize: "14px",
                      letterSpacing: ".03em",
                      color: "#E8E3D2",
                      textDecoration: "none",
                      background: "#1A2E1A",
                      border: "1px solid #2A4A2A",
                      borderRadius: "22px",
                      padding: "0 24px",
                      height: "50px",
                      whiteSpace: "nowrap",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "10px",
                      transition: "opacity .2s",
                    }}
                  >
                    <span
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "999px",
                        background: "#8BC53F",
                        display: "block",
                      }}
                    />
                    {c.whatsappLabel}
                  </a>
                </div>
              </div>

              <form
                onSubmit={onSubmit}
                noValidate
                className="vx-hovercard"
                style={{
                  border: "1px solid #2A4A2A",
                  borderRadius: "16px",
                  padding: "clamp(26px,2.6vw,40px)",
                  background: "#163016",
                  boxShadow: "0 18px 44px rgba(6,14,6,0.30)",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    left: "-9999px",
                    width: "1px",
                    height: "1px",
                    overflow: "hidden",
                  }}
                  aria-hidden="true"
                >
                  <label>
                    Don't fill this out
                    <input
                      type="text"
                      tabIndex={-1}
                      autoComplete="off"
                      ref={hpRef}
                    />
                  </label>
                </div>
                {submitted ? (
                  <div
                    role="status"
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-start",
                      gap: "16px",
                      padding: "30px 4px",
                    }}
                  >
                    <span
                      style={{
                        width: "38px",
                        height: "38px",
                        borderRadius: "999px",
                        background: "#8BC53F",
                        color: "#151515",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontFamily: "'Prompt',sans-serif",
                        fontWeight: 700,
                        fontSize: "20px",
                      }}
                    >
                      ✓
                    </span>
                    <p
                      style={{
                        fontFamily: "'Newsreader',Georgia,serif",
                        fontWeight: 600,
                        fontSize: "22px",
                        color: "#E8E3D2",
                        margin: 0,
                      }}
                    >
                      {c.formSuccess}
                    </p>
                  </div>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "18px",
                    }}
                  >
                    <p
                      style={{
                        fontFamily: "'Lato',sans-serif",
                        fontSize: "12.5px",
                        lineHeight: 1.5,
                        color: "#AFBEAF",
                        margin: 0,
                      }}
                    >
                      {c.requiredNote}
                    </p>
                    <label
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "7px",
                      }}
                    >
                      <span style={labelSpan}>
                        {c.formName}
                        <span
                          aria-hidden="true"
                          style={{ color: "#8BC53F", marginLeft: "3px" }}
                        >
                          *
                        </span>
                      </span>
                      <input
                        type="text"
                        ref={nameRef}
                        name="name"
                        required
                        aria-required="true"
                        aria-invalid={errors.name ? "true" : "false"}
                        aria-describedby={errors.name ? "vx-err-name" : undefined}
                        className="vx-input"
                        style={inputBase}
                      />
                      {errors.name && (
                        <span id="vx-err-name" role="alert" style={errSpan}>
                          {c.errName}
                        </span>
                      )}
                    </label>
                    <label
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "7px",
                      }}
                    >
                      <span style={labelSpan}>{c.formCompany}</span>
                      <input
                        type="text"
                        ref={companyRef}
                        name="company"
                        className="vx-input"
                        style={inputBase}
                      />
                    </label>
                    <label
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "7px",
                      }}
                    >
                      <span style={labelSpan}>
                        {c.formEmail}
                        <span
                          aria-hidden="true"
                          style={{ color: "#8BC53F", marginLeft: "3px" }}
                        >
                          *
                        </span>
                      </span>
                      <input
                        type="email"
                        ref={emailRef}
                        name="email"
                        required
                        aria-required="true"
                        aria-invalid={errors.email ? "true" : "false"}
                        aria-describedby={
                          errors.email ? "vx-err-email" : undefined
                        }
                        className="vx-input"
                        style={inputBase}
                      />
                      {errors.email && (
                        <span id="vx-err-email" role="alert" style={errSpan}>
                          {c.errEmail}
                        </span>
                      )}
                    </label>
                    <label
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "7px",
                      }}
                    >
                      <span style={labelSpan}>
                        {c.formMessage}
                        <span
                          aria-hidden="true"
                          style={{ color: "#8BC53F", marginLeft: "3px" }}
                        >
                          *
                        </span>
                      </span>
                      <textarea
                        rows={4}
                        ref={messageRef}
                        name="message"
                        required
                        aria-required="true"
                        aria-invalid={errors.message ? "true" : "false"}
                        aria-describedby={
                          errors.message ? "vx-err-message" : undefined
                        }
                        className="vx-input"
                        style={{
                          ...inputBase,
                          resize: "vertical",
                          minHeight: "104px",
                        }}
                      />
                      {errors.message && (
                        <span id="vx-err-message" role="alert" style={errSpan}>
                          {c.errMessage}
                        </span>
                      )}
                    </label>
                    <button
                      type="submit"
                      className="vx-cta"
                      disabled={submitting}
                      style={{
                        fontFamily: "'Prompt',sans-serif",
                        fontWeight: 600,
                        fontSize: "15px",
                        letterSpacing: ".04em",
                        color: "#1A2E1A",
                        background: "#8BC53F",
                        border: "none",
                        borderRadius: "22px",
                        padding: "0 30px",
                        height: "50px",
                        whiteSpace: "nowrap",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: submitting ? "wait" : "pointer",
                        alignSelf: "flex-start",
                        transition: "opacity .2s",
                        opacity: submitting ? 0.7 : 1,
                      }}
                    >
                      {c.formSend}
                    </button>
                    {submitError && (
                      <p role="alert" style={{ ...errSpan, margin: 0 }}>
                        {submitError}
                      </p>
                    )}
                    <p
                      style={{
                        fontFamily: "'Lato',sans-serif",
                        fontSize: "13px",
                        lineHeight: 1.5,
                        color: "#AFBEAF",
                        margin: "2px 0 0",
                      }}
                    >
                      {c.formNote}
                    </p>
                  </div>
                )}
              </form>
            </div>
          </section>
        </div>
      </main>
      {/* FOOTER */}
      <footer
        style={{
          position: "relative",
          zIndex: 2,
          padding: "clamp(48px,6vw,72px) clamp(20px,7vw,110px)",
          borderTop: "1px solid #2A4A2A",
          background: "#0F1E0F",
        }}
      >
        <div
          style={{
            maxWidth: "1240px",
            margin: "0 auto",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: "30px",
          }}
        >
          <div style={{ maxWidth: "54ch" }}>
            <img
              src="/assets/vertus-icon.png"
              alt="Vertus"
              style={{
                height: "56px",
                width: "auto",
                display: "block",
                marginBottom: "22px",
              }}
            />
            <p
              style={{
                fontFamily: "'Lato',sans-serif",
                fontSize: "14.5px",
                lineHeight: 1.6,
                color: "#B7C4B7",
                margin: 0,
              }}
            >
              {c.heroParent}
            </p>
          </div>
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener"
            className="vx-link"
            style={{
              fontFamily: "'Prompt',sans-serif",
              fontWeight: 500,
              fontSize: "13px",
              letterSpacing: ".03em",
              color: "#A7D56F",
              textDecoration: "none",
              transition: "opacity .2s",
            }}
          >
            {c.whatsappLabel} →
          </a>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              window.dispatchEvent(new CustomEvent("open-cookie-settings"));
            }}
            className="vx-link"
            data-testid="link-footer-cookie-settings"
            style={{
              fontFamily: "'Prompt',sans-serif",
              fontWeight: 500,
              fontSize: "13px",
              letterSpacing: ".03em",
              color: "#B7C4B7",
              textDecoration: "none",
              transition: "opacity .2s",
            }}
          >
            {c.cookieSettingsLabel}
          </a>
        </div>
      </footer>
      <Suspense fallback={null}>
        <CookieConsent c={c} />
      </Suspense>
    </div>
  );
}
