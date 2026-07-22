import { MX_PATHS } from "../lib/mexicoGeo";

const CDMX = { x: 597.6, y: 458 };

const CONNECTORS = [
  { x: 742, y: 372 },
  { x: 705, y: 452 },
  { x: 512, y: 486 },
];

export default function MexicoMap({ label }: { label?: string }) {
  return (
    <svg
      viewBox="25 10 950 610"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={label}
      style={{ width: "100%", height: "100%", display: "block" }}
    >
      <defs>
        <radialGradient
          id="mxFill"
          gradientUnits="userSpaceOnUse"
          cx={CDMX.x}
          cy={CDMX.y}
          r={430}
        >
          <stop offset="0%" stopColor="#F2EEDF" />
          <stop offset="46%" stopColor="#E8E3D2" />
          <stop offset="100%" stopColor="#D6CFBA" />
        </radialGradient>

        <radialGradient
          id="mxHalo"
          gradientUnits="userSpaceOnUse"
          cx={CDMX.x}
          cy={CDMX.y}
          r={165}
        >
          <stop offset="0%" stopColor="#8BC53F" stopOpacity="0.55" />
          <stop offset="55%" stopColor="#8BC53F" stopOpacity="0.14" />
          <stop offset="100%" stopColor="#8BC53F" stopOpacity="0" />
        </radialGradient>

        <filter id="mxSoft" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
      </defs>

      <style>{`
        .mx-pulse { transform-box: fill-box; transform-origin: center; animation: mxPulse 3.2s ease-out infinite; }
        @keyframes mxPulse {
          0%   { transform: scale(1);   opacity: .7; }
          70%  { transform: scale(3.4); opacity: 0;  }
          100% { transform: scale(3.4); opacity: 0;  }
        }
        @media (prefers-reduced-motion: reduce) {
          .mx-pulse { animation: none; opacity: 0; }
        }
      `}</style>

      {/* Country silhouette with unified glow toward Mexico City */}
      <g
        fill="url(#mxFill)"
        stroke="rgba(26,46,26,0.35)"
        strokeWidth={0.8}
        strokeLinejoin="round"
        strokeLinecap="round"
      >
        {MX_PATHS.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>

      {/* Soft halo behind the pin */}
      <circle cx={CDMX.x} cy={CDMX.y} r={150} fill="url(#mxHalo)" filter="url(#mxSoft)" />

      {/* Thin connector lines radiating from Mexico City */}
      <g stroke="#2A4A2A" strokeWidth={1.1} strokeOpacity={0.6} strokeLinecap="round">
        {CONNECTORS.map((p, i) => (
          <line key={i} x1={CDMX.x} y1={CDMX.y} x2={p.x} y2={p.y} />
        ))}
      </g>
      <g fill="#2A4A2A" fillOpacity={0.85}>
        {CONNECTORS.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={2.6} />
        ))}
      </g>

      {/* Mexico City pin */}
      <g>
        <circle
          className="mx-pulse"
          cx={CDMX.x}
          cy={CDMX.y}
          r={7}
          fill="none"
          stroke="#8BC53F"
          strokeWidth={1.4}
        />
        <circle
          cx={CDMX.x}
          cy={CDMX.y}
          r={7}
          fill="none"
          stroke="#2A4A2A"
          strokeWidth={1.8}
        />
        <circle cx={CDMX.x} cy={CDMX.y} r={3.2} fill="#8BC53F" />
      </g>
    </svg>
  );
}
