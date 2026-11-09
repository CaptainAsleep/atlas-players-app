import React, { useMemo } from "react";

// Paid skins (2026-11-09): the decorative layer some skins draw behind the
// Explore header band and the next-game hero card. Pure SVG, generated
// from the skin's tokens (theme.js): T.texture = "camo" | "brushed" |
// "grid". The camo is Atlas's own procedural pattern (seeded blobs), not a
// copy of any commercial pattern. aria-hidden, pointer-events off.

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function blobPath(r, cx, cy, rx, ry, n = 9) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const k = 0.5 + r() * 0.7;
    pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
  }
  const mid = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
  const f = (v) => v.toFixed(1);
  const start = mid(pts[n - 1], pts[0]);
  let d = `M${f(start[0])} ${f(start[1])} `;
  for (let i = 0; i < n; i++) {
    const p = pts[i];
    const m = mid(p, pts[(i + 1) % n]);
    d += `Q${f(p[0])} ${f(p[1])} ${f(m[0])} ${f(m[1])} `;
  }
  return d + "Z";
}

export function camoBlobs(camo, W, H, seedOffset = 0) {
  const r = rng((camo?.seed || 1) + seedOffset);
  const out = [];
  for (const [color, count, rx, ry] of camo?.layers || []) {
    for (let i = 0; i < count; i++) {
      const cx = -20 + r() * (W + 40);
      const cy = -20 + r() * (H + 40);
      out.push({ d: blobPath(r, cx, cy, rx * (0.6 + r() * 0.8), ry * (0.6 + r() * 0.8)), fill: color });
    }
  }
  return out;
}

function brushedLines(H, seed) {
  const r = rng(seed);
  const out = [];
  for (let y = 0; y < H; y += 2) out.push({ y: y + 0.5, o: (0.03 + r() * 0.09).toFixed(3), c: r() > 0.5 ? "#FFFFFF" : "#000000" });
  return out;
}

const BASE = { brushed: "#2A2F36", grid: "#0B0816" };

// withBase: paint the texture's own background (the header band needs it;
// the hero card already has T.heroBg underneath).
export default function SkinTexture({ T, width = 400, height = 240, seedOffset = 0, withBase = false, style }) {
  const kind = T?.texture;
  const camo = T?.camo;
  const parts = useMemo(() => {
    if (kind === "camo") return { blobs: camoBlobs(camo, width, height, seedOffset) };
    if (kind === "brushed") return { lines: brushedLines(height, 5 + seedOffset) };
    if (kind === "grid") {
      const step = 24;
      const xs = [];
      const ys = [];
      for (let p = step; p < width; p += step) xs.push(p + 0.5);
      for (let p = step; p < height; p += step) ys.push(p + 0.5);
      return { xs, ys };
    }
    return null;
  }, [kind, camo, width, height, seedOffset]);
  if (!parts) return null;
  return (
    <svg
      aria-hidden="true"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMidYMid slice"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", ...style }}
    >
      {kind === "camo" && (
        <>
          <rect width={width} height={height} fill={camo.base} />
          {parts.blobs.map((b, i) => <path key={i} d={b.d} fill={b.fill} />)}
        </>
      )}
      {kind === "brushed" && (
        <>
          {withBase && <rect width={width} height={height} fill={BASE.brushed} />}
          {parts.lines.map((l, i) => <line key={i} x1="0" x2={width} y1={l.y} y2={l.y} stroke={l.c} strokeOpacity={l.o} strokeWidth="1" />)}
        </>
      )}
      {kind === "grid" && (
        <>
          {withBase && <rect width={width} height={height} fill={BASE.grid} />}
          {parts.xs.map((x) => <line key={`x${x}`} x1={x} x2={x} y1="0" y2={height} stroke="#19F0FF" strokeOpacity="0.14" />)}
          {parts.ys.map((y) => <line key={`y${y}`} x1="0" x2={width} y1={y} y2={y} stroke="#FF3DDB" strokeOpacity="0.12" />)}
          <circle cx={width * 0.85} cy={height * 0.15} r={height * 0.45} fill="#FF3DDB" fillOpacity="0.14" />
          <circle cx={width * 0.1} cy={height * 0.45} r={height * 0.35} fill="#19F0FF" fillOpacity="0.09" />
        </>
      )}
    </svg>
  );
}

// "#RRGGBB" -> "rgba(r,g,b,a)" (non-hex values pass through unchanged).
export function withAlpha(hex, a) {
  if (typeof hex !== "string" || !/^#[0-9a-f]{6}$/i.test(hex)) return hex;
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

// The Explore screen's header band: the texture, faded into the page.
// z -1 inside a scroll container that sets position:relative + zIndex 0,
// so it paints over the page color but under every bit of content.
export function SkinHeaderBand({ T, height = 230 }) {
  if (!T?.texture) return null;
  return (
    <div aria-hidden="true" style={{ position: "absolute", left: 0, right: 0, top: 0, height, overflow: "hidden", pointerEvents: "none", zIndex: -1 }}>
      <div style={{ position: "absolute", inset: 0, opacity: T.bandOpacity ?? 0.6 }}>
        <SkinTexture T={T} width={400} height={height} withBase />
      </div>
      <div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, ${withAlpha(T.void, 0.25)} 0%, ${withAlpha(T.void, 0.55)} 55%, ${T.void} 100%)` }} />
    </div>
  );
}
