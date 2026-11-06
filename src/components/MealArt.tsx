import { useId } from "react";

/** Top-down bowl illustration built from a recipe's ingredient colours. */
export function MealArt({ colors, className = "", seed = "" }: { colors: string[]; className?: string; seed?: string }) {
  const uid = useId().replace(/:/g, "");
  const n = Math.max(3, colors.length);
  const rot = (seed.length * 37) % 360;
  const sector = (i: number) => {
    const a0 = ((i / n) * 2 * Math.PI) + (rot * Math.PI) / 180;
    const a1 = (((i + 1) / n) * 2 * Math.PI) + (rot * Math.PI) / 180;
    const r = 58;
    const p0 = [100 + r * Math.cos(a0), 100 + r * Math.sin(a0)];
    const p1 = [100 + r * Math.cos(a1), 100 + r * Math.sin(a1)];
    return `M100 100 L${p0[0]} ${p0[1]} A${r} ${r} 0 0 1 ${p1[0]} ${p1[1]} Z`;
  };
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden="true">
      <defs>
        <radialGradient id={`plate-${uid}`} cx="0.45" cy="0.4" r="0.7">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#ebe6d8" />
        </radialGradient>
        <radialGradient id={`shade-${uid}`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0.75" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.18" />
        </radialGradient>
        <clipPath id={`bowl-${uid}`}>
          <circle cx="100" cy="100" r="58" />
        </clipPath>
      </defs>
      <circle cx="104" cy="106" r="80" fill="#103D2B" opacity="0.12" />
      <circle cx="100" cy="100" r="80" fill={`url(#plate-${uid})`} />
      <circle cx="100" cy="100" r="64" fill="#f3efe4" />
      <g clipPath={`url(#bowl-${uid})`}>
        {colors.map((c, i) => (
          <path key={i} d={sector(i)} fill={c} stroke="#fff" strokeOpacity="0.5" strokeWidth="1.5" />
        ))}
        {colors.map((c, i) =>
          [...Array(6)].map((_, j) => {
            const a = ((i + 0.2 + (j % 3) * 0.3) / n) * 2 * Math.PI + (rot * Math.PI) / 180;
            const r = 18 + (j * 7) % 36;
            return <circle key={`${i}-${j}`} cx={100 + r * Math.cos(a)} cy={100 + r * Math.sin(a)} r={2.4 + (j % 3)} fill="#fff" opacity={c === "#FFFFFF" || c === "#F4F1E8" ? 0.0 : 0.22} />;
          }),
        )}
        <circle cx="100" cy="100" r="58" fill={`url(#shade-${uid})`} />
      </g>
      {/* garnish */}
      <g transform={`rotate(${rot} 100 100)`}>
        <path d="M100 62 c8 -6 18 -4 22 2 c-8 6 -18 4 -22 -2 z" fill="#5f9e3a" />
        <path d="M100 62 l20 2" stroke="#3e7d32" strokeWidth="1" />
        <circle cx="128" cy="120" r="4" fill="#C8102E" opacity="0.9" />
      </g>
    </svg>
  );
}
