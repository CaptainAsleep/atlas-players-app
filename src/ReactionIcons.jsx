// Atlas Feed reaction icons (2026-11-22). 24x24 grid, 2px stroke,
// round caps/joins — same construction as the lucide-react icons used
// elsewhere in the app, so they sit naturally next to Users/Shield/etc.
//
// Usage:
//   <ReactionIcon kind="heart" active={mine === "heart"}
//     color={mine === "heart" ? T.accent : T.ashDim} knockout={T.panel} size={20} />
//
// `knockout` must be the color of whatever the icon sits on (the card's
// background). Filled (active) icons cut their inner details out in that
// color.

import React from "react";

export const REACTION_KINDS = ["thumbsUp", "fire", "heart", "niceShot"];

export const REACTION_LABELS = {
  thumbsUp: "Thumbs up",
  fire: "Fire",
  heart: "Heart",
  niceShot: "Nice shot",
};

const SW = { strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" };

function Shapes({ kind, active, color, knockout }) {
  const fill = active ? color : "none";
  const detail = active ? knockout : color;

  switch (kind) {
    case "thumbsUp":
      return (
        <>
          <path fill={fill} stroke={color} {...SW}
            d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z" />
          <path fill="none" stroke={detail} {...SW} d="M7 10v12" />
        </>
      );

    case "fire":
      return (
        <>
          <path fill={fill} stroke={color} {...SW}
            d="M12 2.5c.6 2.8 2.6 4.6 4.3 6.4C18 10.7 19 12.6 19 15a7 7 0 0 1-14 0c0-2.3 1-4.1 2.4-5.4.3 1.6 1 2.6 2.1 3.1C9.3 9 10.2 5.4 12 2.5Z" />
          <path
            fill={active ? knockout : "none"}
            stroke={detail}
            strokeWidth={active ? 1 : 2}
            strokeLinejoin="round"
            d="M12 13.2c1.2 1.3 2.2 2.4 2.2 3.8a2.2 2.2 0 0 1-4.4 0c0-1.4 1-2.5 2.2-3.8Z" />
        </>
      );

    case "heart":
      return <path fill={fill} stroke={color} {...SW}
        d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />;

    case "niceShot":
      return (
        <>
          <circle cx="12" cy="12" r="7.5" fill={fill} stroke={color} {...SW} />
          <path fill="none" stroke={detail} {...SW}
            d="M9.2 9.2l1.4 1.4M14.8 9.2l-1.4 1.4M9.2 14.8l1.4-1.4M14.8 14.8l-1.4-1.4" />
          <path fill="none" stroke={color} {...SW} d="M12 1.5v3M12 19.5v3M1.5 12h3M19.5 12h3" />
        </>
      );

    default:
      return null;
  }
}

export function ReactionIcon({ kind, active = false, color = "currentColor", knockout = "#fff", size = 20, title }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" role="img"
      aria-label={title || REACTION_LABELS[kind] || kind} style={{ display: "block", flexShrink: 0 }}>
      <Shapes kind={kind} active={active} color={color} knockout={knockout} />
    </svg>
  );
}

export default ReactionIcon;
