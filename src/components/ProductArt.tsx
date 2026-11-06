import { useId, useMemo } from "react";
import type { ProductArtSpec } from "../lib/types.ts";

/** Seeded PRNG so each product's illustration is stable between renders. */
function rng(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Props {
  art: ProductArtSpec;
  seed: string;
  className?: string;
  showBg?: boolean;
  title?: string;
}

/**
 * Illustrated product packshot (SVG). Placeholder for real product photography —
 * swap for <img src="/products/{id}.jpg"> once licensed photos are available.
 */
export function ProductArt({ art, seed, className = "", showBg = true, title }: Props) {
  const uid = useId().replace(/:/g, "");
  const body = useMemo(() => geometry(art.container), [art.container]);

  const pattern = useMemo(() => {
    const r = rng(seed);
    const { x, y, w, h } = body.inner;
    const els: React.ReactNode[] = [];
    switch (art.pattern) {
      case "shreds":
        for (let i = 0; i < 70; i++) {
          const sx = x + r() * w, sy = y + r() * h, len = 8 + r() * 14, a = r() * Math.PI;
          els.push(
            <path key={i} d={`M${sx} ${sy} q ${Math.cos(a) * len * 0.5} ${Math.sin(a) * len * 0.5 - 3} ${Math.cos(a) * len} ${Math.sin(a) * len}`}
              stroke={i % 3 ? art.fillDetail : "#fff"} strokeOpacity={i % 3 ? 0.8 : 0.35} strokeWidth={1.6} fill="none" strokeLinecap="round" />,
          );
        }
        break;
      case "gherkins":
        for (let i = 0; i < 9; i++) {
          const cx = x + 10 + (i % 3) * (w / 3) + r() * 6, cy = y + 12 + Math.floor(i / 3) * (h / 3) + r() * 8;
          els.push(
            <g key={i} transform={`rotate(${-70 + r() * 40} ${cx} ${cy})`}>
              <ellipse cx={cx} cy={cy} rx={20} ry={8.5} fill={art.fillDetail} />
              <ellipse cx={cx - 2} cy={cy - 2.5} rx={15} ry={3} fill="#fff" opacity={0.18} />
              {[...Array(5)].map((_, j) => (
                <circle key={j} cx={cx - 12 + j * 6} cy={cy + (j % 2 ? 2 : -1)} r={0.9} fill="#2f4415" />
              ))}
            </g>,
          );
        }
        for (let i = 0; i < 6; i++) els.push(<path key={`d${i}`} d={`M${x + r() * w} ${y + r() * h} l 6 -8 m -3 4 l 5 1`} stroke="#3e5a1e" strokeWidth={1.2} fill="none" />);
        break;
      case "sticks":
        for (let i = 0; i < 8; i++) {
          const sx = x + 4 + i * (w / 8);
          els.push(<rect key={i} x={sx} y={y + 6 + r() * 10} width={w / 9} height={h - 10} rx={4} fill={i % 2 ? art.fillDetail : art.fill} stroke="#3e5a1e" strokeOpacity={0.3} />);
        }
        break;
      case "slices":
        for (let i = 0; i < 8; i++) {
          const cx = x + 14 + (i % 2) * (w / 2) + r() * 10, cy = y + 10 + Math.floor(i / 2) * (h / 4) + r() * 4;
          els.push(
            <g key={i}>
              <ellipse cx={cx} cy={cy} rx={20} ry={9} fill={art.fillDetail} />
              <ellipse cx={cx} cy={cy} rx={13} ry={5.5} fill="none" stroke="#c43b62" strokeOpacity={0.6} />
              <ellipse cx={cx} cy={cy} rx={6} ry={2.5} fill="none" stroke="#c43b62" strokeOpacity={0.5} />
            </g>,
          );
        }
        break;
      case "onions":
        for (let i = 0; i < 22; i++) {
          const cx = x + 8 + r() * (w - 16), cy = y + 8 + r() * (h - 16), rr = 7 + r() * 3;
          els.push(
            <g key={i}>
              <circle cx={cx} cy={cy} r={rr} fill="#fbfaf3" stroke={art.fillDetail} />
              <path d={`M${cx - rr * 0.5} ${cy - rr * 0.2} q ${rr * 0.5} ${-rr * 0.6} ${rr} 0`} stroke={art.fillDetail} fill="none" />
            </g>,
          );
        }
        break;
      case "mixed": {
        const cols = ["#E07A1F", "#F6F1DE", "#6E8B3D", "#C8102E", "#F6C945"];
        for (let i = 0; i < 26; i++) {
          const cx = x + 6 + r() * (w - 12), cy = y + 6 + r() * (h - 12), c = cols[i % cols.length];
          els.push(
            i % 5 === 1 ? <circle key={i} cx={cx} cy={cy} r={6 + r() * 3} fill={c} stroke="#d8cfae" />
              : <rect key={i} x={cx} y={cy} width={9 + r() * 6} height={6 + r() * 4} rx={3} fill={c} transform={`rotate(${r() * 90} ${cx} ${cy})`} />,
          );
        }
        break;
      }
      case "liquid":
        els.push(<rect key="l" x={x} y={y + h * 0.12} width={w} height={h} fill={art.fillDetail} opacity={0.35} />);
        for (let i = 0; i < 6; i++) els.push(<circle key={i} cx={x + 8 + r() * (w - 16)} cy={y + 20 + r() * (h - 30)} r={1 + r() * 1.6} fill="#fff" opacity={0.5} />);
        break;
    }
    return els;
  }, [art, seed, body]);

  const { x, y, w, h } = body.inner;
  const label = body.label;

  return (
    <svg viewBox="0 0 200 200" className={className} role="img" aria-label={title ?? "Product illustration"}>
      <defs>
        <clipPath id={`clip-${uid}`}>
          <path d={body.path} />
        </clipPath>
        <clipPath id={`win-${uid}`}>
          <rect x={x + 10} y={y + 22} width={w - 20} height={56} rx={12} />
        </clipPath>
        <linearGradient id={`glass-${uid}`} x1="0" x2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.55" />
          <stop offset="0.18" stopColor="#fff" stopOpacity="0.08" />
          <stop offset="0.75" stopColor="#000" stopOpacity="0.0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.22" />
        </linearGradient>
        <linearGradient id={`lid-${uid}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.35" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.25" />
        </linearGradient>
        <radialGradient id={`bg-${uid}`} cx="0.5" cy="0.45" r="0.6">
          <stop offset="0" stopColor="#fff" stopOpacity="0.9" />
          <stop offset="1" stopColor={art.bg} />
        </radialGradient>
      </defs>

      {showBg && <circle cx="100" cy="100" r="92" fill={`url(#bg-${uid})`} />}
      <ellipse cx="100" cy={body.bottom + 4} rx={body.shadowRx} ry="6" fill="#103D2B" opacity="0.16" />

      {/* contents behind the glass */}
      <g clipPath={`url(#clip-${uid})`}>
        <rect x={x - 20} y={y - 30} width={w + 40} height={h + 60} fill={art.container === "pouch" ? art.label : art.fill} />
        {art.container !== "pouch" && pattern}
        {art.container === "pouch" && (
          <g>
            <g clipPath={`url(#win-${uid})`}>
              <rect x={x} y={y} width={w} height={h} fill={art.fill} />
              {pattern}
            </g>
            <rect x={x + 10} y={y + 22} width={w - 20} height={56} rx={12} fill="none" stroke="#103D2B" strokeOpacity={0.15} />
            <rect x={x - 20} y={y - 30} width={w + 40} height={40} fill={art.lid} />
          </g>
        )}
        <rect x={x - 20} y={y - 30} width={w + 40} height={h + 60} fill={`url(#glass-${uid})`} />
      </g>
      <path d={body.path} fill="none" stroke="#103D2B" strokeOpacity="0.18" strokeWidth="1.2" />

      {/* label */}
      <g>
        <rect x={label.x} y={label.y} width={label.w} height={label.h} rx={label.rx} fill={art.label} />
        <rect x={label.x} y={label.y + label.h - 7} width={label.w} height={7} fill={art.accent} opacity={0.95} />
        <rect x={label.x} y={label.y} width={label.w} height={label.h} rx={label.rx} fill={`url(#glass-${uid})`} opacity={0.6} />
        <circle cx={label.x + 9} cy={label.y + 9} r={3.2} fill="#C8102E" />
        <text
          x={100}
          y={label.y + label.h / 2 + 2}
          textAnchor="middle"
          fontFamily="Fraunces, Georgia, serif"
          fontWeight={700}
          fontSize={art.labelText.length > 9 ? 11 : 16}
          fill={art.label === "#F7D23E" ? "#103D2B" : art.accent === "#8BC34A" ? "#103D2B" : art.accent}
          letterSpacing={art.labelText === "KNAX" ? 2 : 0}
        >
          {art.labelText}
        </text>
        <text x={100} y={label.y + label.h - 12} textAnchor="middle" fontFamily="Plus Jakarta Sans, sans-serif" fontWeight={700} fontSize={5.5} fill="#103D2B" letterSpacing={1.4} opacity={0.75}>
          HENGSTENBERG
        </text>
      </g>

      {/* lid / cap */}
      {body.lid && (
        <g>
          <rect x={body.lid.x} y={body.lid.y} width={body.lid.w} height={body.lid.h} rx={body.lid.rx} fill={art.lid} />
          <rect x={body.lid.x} y={body.lid.y} width={body.lid.w} height={body.lid.h} rx={body.lid.rx} fill={`url(#lid-${uid})`} />
          {[...Array(Math.floor(body.lid.w / 6))].map((_, i) => (
            <line key={i} x1={body.lid!.x + 4 + i * 6} x2={body.lid!.x + 4 + i * 6} y1={body.lid!.y + 3} y2={body.lid!.y + body.lid!.h - 3} stroke="#000" strokeOpacity="0.12" />
          ))}
        </g>
      )}
      {/* highlight streak */}
      <path d={body.highlight} stroke="#fff" strokeOpacity="0.55" strokeWidth="4" strokeLinecap="round" fill="none" />
    </svg>
  );
}

function geometry(c: ProductArtSpec["container"]) {
  switch (c) {
    case "tall-jar":
      return {
        path: "M64 46 h72 a10 10 0 0 1 10 10 v108 a14 14 0 0 1 -14 14 h-64 a14 14 0 0 1 -14 -14 v-108 a10 10 0 0 1 10 -10 z",
        inner: { x: 54, y: 46, w: 92, h: 132 },
        label: { x: 58, y: 92, w: 84, h: 56, rx: 4 },
        lid: { x: 62, y: 28, w: 76, h: 22, rx: 5 },
        highlight: "M64 62 v92",
        bottom: 178,
        shadowRx: 52,
      };
    case "pouch":
      return {
        path: "M58 34 h84 l4 10 c6 40 8 80 6 124 a10 10 0 0 1 -10 10 h-84 a10 10 0 0 1 -10 -10 c-2 -44 0 -84 6 -124 z",
        inner: { x: 48, y: 34, w: 104, h: 144 },
        label: { x: 60, y: 118, w: 80, h: 44, rx: 6 },
        lid: null,
        highlight: "M60 56 c-3 30 -4 60 -3 96",
        bottom: 178,
        shadowRx: 58,
      };
    case "bottle":
      return {
        path: "M88 22 h24 v26 c0 8 22 14 22 34 v84 a12 12 0 0 1 -12 12 h-44 a12 12 0 0 1 -12 -12 v-84 c0 -20 22 -26 22 -34 z",
        inner: { x: 66, y: 22, w: 68, h: 156 },
        label: { x: 68, y: 100, w: 64, h: 52, rx: 4 },
        lid: { x: 86, y: 10, w: 28, h: 16, rx: 3 },
        highlight: "M74 92 v66",
        bottom: 178,
        shadowRx: 40,
      };
    default:
      return {
        path: "M58 58 h84 a12 12 0 0 1 12 12 v92 a16 16 0 0 1 -16 16 h-76 a16 16 0 0 1 -16 -16 v-92 a12 12 0 0 1 12 -12 z",
        inner: { x: 46, y: 58, w: 108, h: 120 },
        label: { x: 50, y: 98, w: 100, h: 52, rx: 4 },
        lid: { x: 56, y: 38, w: 88, h: 24, rx: 6 },
        highlight: "M58 74 v80",
        bottom: 178,
        shadowRx: 60,
      };
  }
}
