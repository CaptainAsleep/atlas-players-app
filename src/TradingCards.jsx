// Player Trading Cards (2026-11-08). Scope: project doc
// claude/atlas-trading-cards-scope.md. Prototype the visuals came from:
// https://claude.ai/artifact/5L16KqMkjpQbRyTyKGkATV
//
// v1 is visible only to CARD_BETA_UIDS (Michael's account). The same list is
// enforced server-side in functions/cards.js — keep them in sync.
//
// What's here: the card itself (3D spin / flip / idle sway), My Card, the
// share QR (refreshes every 30s), the "Collected" arrival, the deck (swipe,
// tap to view, shuffle with sound) and the photo prompt.
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useHideBottomNav } from "./lib/hideNav";
import QRCode from "qrcode";
import { collection, doc, getDoc, onSnapshot, query, where } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions as firebaseFunctions } from "./lib/firebase";
import { useTheme } from "./hooks/useTheme";
import { cropBackground, CARD_ASPECT } from "./lib/cardCrop";

export const CARD_BETA_UIDS = new Set([
  "lg4HMLTJvsPfSEN1pvNhMV4fbct1", // Atlas
  "4gaohQb6ddMvdSNdhlDp75eMZke2", // Rogue (2026-11-08)
]);
export const FOUNDER_UID = "lg4HMLTJvsPfSEN1pvNhMV4fbct1";
export const isCardBeta = (uid) => !!uid && CARD_BETA_UIDS.has(uid);

const W = 300;
const H = 420;
const QR_REFRESH_S = 30;

const LOGO_VB = "29 60 252 198";
const LOGO_OUTLINE = "M126.1 62.5 L31.2 254.4 L31.2 255.4 L32.0 255.9 L95.2 255.8 L96.5 254.5 L99.4 249.4 L104.2 243.1 L113.2 234.1 L121.4 227.4 L132.6 219.1 L144.5 211.4 L162.4 200.9 L175.4 193.9 L177.2 193.2 L178.2 194.0 L200.9 241.2 L207.5 254.9 L208.2 255.6 L274.2 255.8 L274.8 255.1 L274.6 254.4 L230.9 170.0 L230.8 168.8 L231.6 167.9 L258.9 157.1 L271.6 152.8 L274.5 151.4 L277.2 148.9 L278.9 145.2 L278.8 140.9 L277.2 137.9 L275.8 136.4 L273.6 135.1 L270.8 134.4 L268.5 134.4 L246.5 137.4 L232.0 140.2 L221.5 142.9 L218.6 143.1 L217.9 142.5 L176.1 62.4 L175.1 62.0 L127.2 62.0ZM154.4 137.1 L155.1 137.9 L164.1 156.1 L165.0 159.1 L163.9 160.1 L140.8 168.9 L139.6 169.0 L139.0 168.2 L141.9 161.6 L153.0 137.9 L153.8 137.1Z";
const LOGO_FILL = "M190.0 188.2 L189.6 189.8 L190.2 191.5 L215.6 243.6 L217.1 244.2 L253.9 244.2 L254.9 243.8 L254.9 242.4 L224.4 183.4 L219.6 175.0 L218.8 174.6 L217.1 174.8 L212.4 176.2 L195.0 184.4ZM238.1 151.8 L236.5 151.6 L229.6 153.1 L223.4 155.0 L220.1 155.5 L210.5 158.0 L192.4 163.2 L173.6 169.4 L154.9 176.1 L139.5 182.2 L124.6 189.4 L116.1 194.0 L114.4 194.5 L113.9 193.9 L114.4 192.1 L152.9 109.9 L153.5 109.2 L154.8 109.9 L174.0 149.4 L175.6 152.0 L177.8 152.0 L192.9 148.0 L204.4 145.8 L205.1 145.1 L205.1 144.2 L169.2 74.9 L167.9 74.0 L134.4 74.1 L133.0 75.4 L72.0 199.4 L59.0 225.1 L50.4 243.4 L51.4 244.2 L88.0 244.1 L89.2 243.1 L96.1 234.1 L103.5 226.8 L108.6 222.2 L120.1 213.2 L139.2 200.5 L158.4 189.4 L178.0 179.0 L187.8 174.5 L194.4 170.4 L199.0 168.0 L206.0 165.1 L212.4 163.1 L237.0 152.8Z";

const TIER_STYLE = {
  unranked:  { label: "UNRANKED",  c: ["#6b7280", "#4b5563", "#9ca3af", "#374151"], ink: "#fff" },
  common:    { label: "COMMON",    c: ["#9ca3af", "#d1d5db", "#6b7280", "#e5e7eb"], ink: "#111" },
  rare:      { label: "RARE",      c: ["#60a5fa", "#93c5fd", "#2563eb", "#bfdbfe"], ink: "#0b1f4d" },
  epic:      { label: "EPIC",      c: ["#c084fc", "#f0abfc", "#7c3aed", "#e9d5ff"], ink: "#2e1065" },
  legendary: { label: "LEGENDARY", c: ["#f6d365", "#fda085", "#c084fc", "#60a5fa"], ink: "#111" },
  // Diamond (Michael, 2026-11-08): hand-set only — the Founder card and
  // TIER_OVERRIDES in functions/cards.js. Never reached through circulation.
  diamond:   { label: "DIAMOND",   c: ["#e8fbff", "#9be7ff", "#f4f0ff", "#b9c8ff"], ink: "#0b1f4d" },
  founder:   { label: "FOUNDER",   c: ["#e8fbff", "#9be7ff", "#f4f0ff", "#b9c8ff"], ink: "#0b1f4d" },
};
const TITLE_LABEL = { most_popular: "MOST POPULAR", rarest: "RAREST" };

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

export function toCard(kind, id, d) {
  if (!d) return null;
  const hasCardPhoto = !!d.cardPhotoUrl;
  const tier = kind === "adult" && id === FOUNDER_UID ? "founder" : d.cardTier || "unranked";
  return {
    kind, id,
    callsign: d.callsign || "Player",
    serial: Number.isInteger(d.signupNumber) ? d.signupNumber : null,
    tier: TIER_STYLE[tier] ? tier : "unranked",
    title: d.cardTitle || null,
    circ: d.circulation || 0,
    ops: d.cardStats?.ops ?? 0,
    fields: d.cardStats?.fields ?? 0,
    photoUrl: d.cardPhotoUrl || d.avatarUrl || null,
    aspect: hasCardPhoto ? d.cardPhotoAspect || 1 : 1,
    crop: hasCardPhoto ? d.cardCrop || null : null,
    hiRes: hasCardPhoto,
  };
}

const ownerRef = (kind, id) => doc(db, kind === "child" ? "childPublicProfiles" : "publicProfiles", id);

export function useCardOwner(kind, id) {
  const [state, setState] = useState({ card: null, loading: !!id });
  useEffect(() => {
    if (!id) { setState({ card: null, loading: false }); return undefined; }
    return onSnapshot(ownerRef(kind, id), (snap) => setState({ card: snap.exists() ? toCard(kind, id, snap.data()) : null, loading: false }),
      () => setState({ card: null, loading: false }));
  }, [kind, id]);
  return state;
}

export function useCardsTotal() {
  const [total, setTotal] = useState(null);
  useEffect(() => onSnapshot(doc(db, "counters", "players"), (s) => setTotal(s.exists() ? s.data().total || null : null), () => {}), []);
  return total;
}

// A player's deck: cards they've collected, newest first. Cards whose owner
// went private or deleted their account are left out (Michael, 2026-11-08).
export function useDeck(collectorUid) {
  const [state, setState] = useState({ cards: [], loading: !!collectorUid });
  useEffect(() => {
    if (!collectorUid) { setState({ cards: [], loading: false }); return undefined; }
    let alive = true;
    const q = query(collection(db, "cardCollections"), where("collectorUid", "==", collectorUid));
    const unsub = onSnapshot(q, async (snap) => {
      const rows = snap.docs.map((d) => d.data()).sort((a, b) => (b.collectedAt?.toMillis?.() || 0) - (a.collectedAt?.toMillis?.() || 0));
      const cards = await Promise.all(rows.map(async (r) => {
        const s = await getDoc(ownerRef(r.ownerKind, r.ownerId)).catch(() => null);
        return s?.exists() ? toCard(r.ownerKind, r.ownerId, s.data()) : null;
      }));
      if (alive) setState({ cards: cards.filter(Boolean), loading: false });
    }, () => alive && setState({ cards: [], loading: false }));
    return () => { alive = false; unsub(); };
  }, [collectorUid]);
  return state;
}

// ---------------------------------------------------------------------------
// Scanner + deep link
// ---------------------------------------------------------------------------

// A card QR is the app's own URL with ?card=<token>, so a phone camera opens
// the app straight to collecting. The in-app scanner reads the same link.
export function parseCardToken(text) {
  if (typeof text !== "string") return null;
  const m = text.match(/[?&]card=([0-9a-f]{32})\b/) || text.match(/^atlas:card:([0-9a-f]{32})$/);
  return m ? m[1] : null;
}
export function cardShareUrl(token) {
  return `${window.location.origin}${import.meta.env.BASE_URL}?card=${token}`;
}

export async function collectCardCode(token) {
  try {
    const res = await httpsCallable(firebaseFunctions, "collectCard")({ token });
    return { ok: true, ...res.data };
  } catch (err) {
    return { ok: false, message: err?.message || "That isn't a valid card code." };
  }
}

// ---------------------------------------------------------------------------
// Sound + haptics (sound only ever starts from a tap; iPhone web apps have
// no vibration)
// ---------------------------------------------------------------------------

const MUTE_KEY = "atlasCardsMuted";
export const CardSound = {
  ctx: null,
  buf: null,
  get muted() { try { return localStorage.getItem(MUTE_KEY) === "1"; } catch { return false; } },
  set muted(v) { try { localStorage.setItem(MUTE_KEY, v ? "1" : "0"); } catch { /* private mode */ } },
  ac() {
    if (this.muted) return null;
    try {
      if (!this.ctx) {
        const C = window.AudioContext || window.webkitAudioContext;
        if (!C) return null;
        this.ctx = new C();
        const b = this.ctx.createBuffer(1, this.ctx.sampleRate, this.ctx.sampleRate);
        const d = b.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
        this.buf = b;
      }
      if (this.ctx.state === "suspended") this.ctx.resume();
      return this.ctx;
    } catch { return null; }
  },
  noise(t, dur, type, f, q, g) {
    const c = this.ctx, s = c.createBufferSource(), fl = c.createBiquadFilter(), gn = c.createGain();
    s.buffer = this.buf; s.playbackRate.value = 0.8 + Math.random() * 0.4;
    fl.type = type; fl.frequency.value = f; fl.Q.value = q;
    gn.gain.setValueAtTime(0, t); gn.gain.linearRampToValueAtTime(g, t + 0.003); gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(fl).connect(gn).connect(c.destination); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
    return fl;
  },
  flick(at = 0) { const c = this.ac(); if (c) this.noise(c.currentTime + at, 0.03, "bandpass", 2200 + Math.random() * 1800, 1.4, 0.35); },
  thump(at = 0) { const c = this.ac(); if (!c) return; this.noise(c.currentTime + at, 0.12, "lowpass", 260, 1, 0.9); this.noise(c.currentTime + at, 0.05, "bandpass", 1500, 1, 0.25); },
  whoosh(len = 0.6) {
    const c = this.ac(); if (!c) return;
    const t = c.currentTime, f = this.noise(t, len, "bandpass", 300, 0.8, 0.22);
    f.frequency.setValueAtTime(300, t); f.frequency.exponentialRampToValueAtTime(2600, t + len * 0.8);
  },
  chime() {
    const c = this.ac(); if (!c) return;
    const t = c.currentTime;
    [[784, 0], [1175, 0.09], [1568, 0.18]].forEach(([f, d]) => {
      const o = c.createOscillator(), g = c.createGain();
      o.type = "triangle"; o.frequency.value = f;
      g.gain.setValueAtTime(0, t + d); g.gain.linearRampToValueAtTime(0.18, t + d + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.7);
      o.connect(g).connect(c.destination); o.start(t + d); o.stop(t + d + 0.75);
    });
  },
};
const buzz = (p) => { try { navigator.vibrate && navigator.vibrate(p); } catch { /* not supported */ } };

// ---------------------------------------------------------------------------
// Card visuals
// ---------------------------------------------------------------------------

const CSS = `
.ac-sizer{position:relative;flex-shrink:0}
.ac-scale{position:absolute;left:0;top:0;width:${W}px;height:${H}px;transform-origin:0 0;perspective:1200px}
.ac-bob{animation:ac-bob 4.5s ease-in-out infinite}
@keyframes ac-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
.ac-card{position:relative;width:${W}px;height:${H}px;transform-style:preserve-3d;will-change:transform;font-family:Inter,system-ui,sans-serif}
.ac-face,.ac-edge{position:absolute;inset:0;border-radius:16px;backface-visibility:hidden;-webkit-backface-visibility:hidden;overflow:hidden}
.ac-edge{backface-visibility:visible;-webkit-backface-visibility:visible;background:linear-gradient(135deg,#3b3f4a,#1a1c22)}
.ac-front{transform:translateZ(2px)}
.ac-back{transform:rotateY(180deg) translateZ(2px)}
.ac-flat .ac-front{transform:none}
.ac-frame{position:absolute;inset:0;padding:9px;border-radius:16px;background:linear-gradient(var(--foil-angle,135deg),var(--r1),var(--r2),var(--r3),var(--r4),var(--r1));background-size:300% 300%;background-position:var(--foil-pos,50%) 50%}
.ac-inner{position:relative;width:100%;height:100%;border-radius:10px;overflow:hidden;background:#0b0f1a}
.ac-photo{position:absolute;inset:0;border-radius:10px;background-color:#1f2937}
.ac-photo::after{content:"";position:absolute;inset:0;border-radius:10px;background:linear-gradient(180deg,rgba(5,8,18,.5) 0%,rgba(5,8,18,0) 18%,rgba(5,8,18,0) 58%,rgba(5,8,18,.9) 82%,#060912 100%)}
.ac-nophoto{position:absolute;inset:0;border-radius:10px;display:flex;align-items:center;justify-content:center;font:700 120px/1 Oswald,sans-serif;color:rgba(255,255,255,.12);background:radial-gradient(80% 60% at 50% 35%,#334155,#0f172a)}
.ac-top{position:absolute;top:0;left:0;right:0;display:flex;justify-content:space-between;align-items:center;padding:10px 12px;z-index:3}
.ac-rarity{font:800 9.5px/1 Inter,sans-serif;letter-spacing:.18em;padding:5px 8px;border-radius:999px;color:var(--ink);background:linear-gradient(90deg,var(--r1),var(--r2),var(--r3));box-shadow:0 2px 8px rgba(0,0,0,.4)}
.ac-serial{font:700 10px/1 Oswald,sans-serif;letter-spacing:.12em;color:#fff;opacity:.9;text-shadow:0 1px 3px #000}
.ac-title{position:absolute;top:36px;left:12px;font:800 8px/1 Inter,sans-serif;letter-spacing:.2em;color:#fff;background:rgba(0,0,0,.45);border:1px solid rgba(255,255,255,.25);padding:4px 7px;border-radius:999px;z-index:3}
.ac-bottom{position:absolute;left:0;right:0;bottom:0;padding:0 14px 14px;z-index:3}
.ac-edition{font:800 8.5px/1 Inter;letter-spacing:.3em;color:var(--r1);margin-bottom:5px}
.ac-name{font:700 34px/1 Oswald,sans-serif;letter-spacing:.04em;color:#fff;text-transform:uppercase;text-shadow:0 2px 10px rgba(0,0,0,.6);margin-bottom:10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ac-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}
.ac-stat{background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);border-radius:8px;padding:6px 2px;text-align:center}
.ac-stat b{display:block;font:700 17px/1 Oswald,sans-serif;color:#fff}
.ac-stat span{display:block;font:700 7.5px/1 Inter,sans-serif;letter-spacing:.14em;color:#8a96b4;margin-top:3px}
/* own corners */ .ac-holo{position:absolute;inset:0;border-radius:16px;z-index:4;pointer-events:none;mix-blend-mode:color-dodge;opacity:var(--holo-o,.3);background:repeating-linear-gradient(var(--foil-angle,135deg),rgba(255,0,140,0) 0px,rgba(255,0,140,.22) 12px,rgba(0,255,220,.22) 24px,rgba(255,240,0,.22) 36px,rgba(120,80,255,.22) 48px,rgba(255,0,140,0) 60px);background-size:200% 200%;background-position:var(--foil-pos,50%) var(--foil-pos-y,50%)}
.ac-glare{position:absolute;inset:0;border-radius:16px;z-index:5;pointer-events:none;mix-blend-mode:overlay;opacity:var(--glare-o,.5);background:radial-gradient(circle at var(--gx,50%) var(--gy,30%),rgba(255,255,255,.75) 0%,rgba(255,255,255,.12) 28%,rgba(0,0,0,.25) 75%)}
.ac-card[data-tier=unranked] .ac-holo{display:none}
.ac-card[data-tier=diamond] .ac-front .ac-holo,.ac-card[data-tier=founder] .ac-front .ac-holo{opacity:calc(var(--holo-o,.3)*1.35)}
.ac-card[data-tier=diamond] .ac-frame::after,.ac-card[data-tier=founder] .ac-frame::after,.ac-card[data-tier=founder] .ac-emb::after{content:"";position:absolute;inset:0;border-radius:16px;pointer-events:none;mix-blend-mode:screen;animation:ac-twinkle 2.4s ease-in-out infinite;background:radial-gradient(circle at 12% 1.2%,#fff 0 1.6px,transparent 3.5px),radial-gradient(circle at 86% 1%,#fff 0 1.2px,transparent 3px),radial-gradient(circle at 98.6% 38%,#fff 0 1.6px,transparent 3.5px),radial-gradient(circle at 1.4% 63%,#fff 0 1.3px,transparent 3px),radial-gradient(circle at 71% 99%,#fff 0 1.6px,transparent 3.5px),radial-gradient(circle at 24% 98.8%,#fff 0 1.1px,transparent 2.6px),radial-gradient(circle at 99% 83%,#fff 0 1.1px,transparent 2.6px)}
@keyframes ac-twinkle{0%,100%{opacity:.35}50%{opacity:1}}
.ac-card[data-tier=common] .ac-holo{opacity:calc(var(--holo-o,.3)*.35)}
.ac-bk{position:absolute;inset:0;border-radius:16px;padding:9px;background:linear-gradient(160deg,#3b82f6,#1e3a8a 60%,#0b1f4d)}
.ac-bk-in{position:relative;width:100%;height:100%;border-radius:10px;overflow:hidden;background:radial-gradient(90% 60% at 50% 42%,#2563eb 0%,#1e40af 40%,#0b1f4d 100%);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px}
.ac-grid{position:absolute;inset:0;border-radius:10px;opacity:.18;background-image:linear-gradient(rgba(255,255,255,.35) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.35) 1px,transparent 1px);background-size:22px 22px;-webkit-mask-image:radial-gradient(circle at 50% 45%,#000 0%,transparent 75%);mask-image:radial-gradient(circle at 50% 45%,#000 0%,transparent 75%)}
.ac-logo{width:58%;filter:drop-shadow(0 8px 24px rgba(0,0,0,.45));position:relative;z-index:1}
.ac-word{font:700 26px/1 Oswald,sans-serif;letter-spacing:.32em;color:#eff6ff;padding-left:.32em;position:relative;z-index:1}
.ac-tag{position:absolute;bottom:14px;left:0;right:0;text-align:center;font:700 8px/1 Inter,sans-serif;letter-spacing:.24em;color:rgba(191,219,254,.75)}
.ac-back .ac-holo{opacity:calc(var(--holo-o,.3)*.6)}
.ac-emb{position:absolute;inset:0;border-radius:16px;padding:9px;background:linear-gradient(var(--foil-angle,135deg),var(--r1),var(--r2),var(--r3),var(--r4),var(--r1));background-size:300% 300%;background-position:var(--foil-pos,50%) 50%}
.ac-emb-in{position:relative;width:100%;height:100%;border-radius:10px;overflow:hidden;background:radial-gradient(80% 60% at 50% 42%,rgba(255,255,255,.06),rgba(0,0,0,0) 60%,rgba(0,0,0,.45) 100%),repeating-linear-gradient(45deg,rgba(255,255,255,.035) 0 2px,rgba(0,0,0,0) 2px 4px),repeating-linear-gradient(-45deg,rgba(0,0,0,.18) 0 1px,rgba(0,0,0,0) 1px 3px),#0c2a45;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px}
.ac-emb-in::before{content:"";position:absolute;inset:9px;border-radius:7px;border:2px dashed rgba(214,244,255,.6);pointer-events:none}
.ac-patch{width:68%;filter:drop-shadow(0 2px 1px rgba(0,0,0,.55)) drop-shadow(0 10px 14px rgba(0,0,0,.5));position:relative;z-index:1;margin-top:-6px}
.ac-emb-ed{font:800 8.5px/1 Inter;letter-spacing:.34em;padding-left:.34em;color:#d6f4ff;margin-top:-8px}
.ac-emb-tag{position:absolute;bottom:20px;left:0;right:0;text-align:center;font:700 8px/1 Inter,sans-serif;letter-spacing:.24em;color:rgba(214,244,255,.8)}
.ac-card[data-tier=founder] .ac-back .ac-holo{opacity:calc(var(--holo-o,.3)*.35)}
.ac-stage{touch-action:none;cursor:grab;display:flex;justify-content:center}
.ac-stage:active{cursor:grabbing}
.ac-burst{position:absolute;left:50%;top:50%;width:40px;height:40px;margin:-20px;border-radius:50%;border:3px solid #60a5fa;opacity:0;pointer-events:none}
.ac-burst.go{animation:ac-burst .8s ease-out}
@keyframes ac-burst{0%{opacity:.9;transform:scale(.5)}100%{opacity:0;transform:scale(9)}}
.ac-stamp{position:absolute;left:50%;top:44%;transform:translate(-50%,-50%) rotate(-12deg) scale(3);opacity:0;pointer-events:none;z-index:30;font:700 28px/1 Oswald,sans-serif;letter-spacing:.18em;color:#22d3ee;border:3px solid #22d3ee;border-radius:8px;padding:6px 12px 6px 18px;background:rgba(6,20,40,.6);text-shadow:0 0 12px rgba(34,211,238,.6);box-shadow:0 0 24px rgba(34,211,238,.35);white-space:nowrap}
.ac-stamp.go{animation:ac-stamp .45s cubic-bezier(.2,1.6,.4,1) forwards}
@keyframes ac-stamp{to{opacity:1;transform:translate(-50%,-50%) rotate(-12deg) scale(1)}}
.ac-dc{position:absolute;left:50%;top:0;width:${W}px;height:${H}px;margin-left:-${W / 2}px;transform-origin:50% 50%;transition:transform .35s cubic-bezier(.2,.8,.2,1);border-radius:16px;box-shadow:0 6px 18px rgba(0,0,0,.45)}
.ac-dc.dragging{transition:none}
.ac-dc.glow{animation:ac-glow 1.6s ease-out 1}
@keyframes ac-glow{0%{box-shadow:0 0 0 0 rgba(96,165,250,.9),0 6px 18px rgba(0,0,0,.45)}100%{box-shadow:0 0 0 26px rgba(96,165,250,0),0 6px 18px rgba(0,0,0,.45)}}
`;

function useCardStyles() {
  useEffect(() => {
    if (document.getElementById("atlas-card-css")) return;
    const st = document.createElement("style");
    st.id = "atlas-card-css";
    st.textContent = CSS;
    document.head.appendChild(st);
    if (!document.getElementById("atlas-card-fonts")) {
      const l = document.createElement("link");
      l.id = "atlas-card-fonts";
      l.rel = "stylesheet";
      l.href = "https://fonts.googleapis.com/css2?family=Oswald:wght@500;700&display=swap";
      document.head.appendChild(l);
    }
  }, []);
}

function tierVars(tier) {
  const t = TIER_STYLE[tier] || TIER_STYLE.unranked;
  return { "--r1": t.c[0], "--r2": t.c[1], "--r3": t.c[2], "--r4": t.c[3], "--ink": t.ink };
}

function AtlasLogo({ className, fill = "url(#ac-lg)", outline = "#050b18" }) {
  return (
    <svg className={className} viewBox={LOGO_VB} aria-label="Atlas">
      <defs>
        <linearGradient id="ac-lg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" />
          <stop offset=".7" stopColor="#f0f8ff" />
          <stop offset="1" stopColor="#cfe6ff" />
        </linearGradient>
      </defs>
      <path d={LOGO_OUTLINE} fill={outline} fillRule="evenodd" />
      <path d={LOGO_FILL} fill={fill} fillRule="evenodd" />
    </svg>
  );
}

// The card, at design size 300x420. `flat` = front only (deck stacks).
export const TradingCardFaces = React.forwardRef(function TradingCardFaces({ card, total, flat = false, tierOverride }, ref) {
  useCardStyles();
  const tier = tierOverride || card?.tier || "unranked";
  const isFounder = tier === "founder";
  const photoStyle = card?.photoUrl ? cropBackground(card.photoUrl, card.aspect, CARD_ASPECT, card.crop) : null;
  const serial = `#${card?.serial ? card.serial.toLocaleString() : "—"} / ${total ? total.toLocaleString() : "—"}`;
  return (
    <div ref={ref} className={`ac-card${flat ? " ac-flat" : ""}`} data-tier={tier} style={tierVars(tier)}>
      {!flat && Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="ac-edge" style={{ transform: `translateZ(${-2 + (4 * (i + 0.5)) / 8}px)` }} />
      ))}
      <div className="ac-face ac-front">
        <div className="ac-frame">
          <div className="ac-inner">
            {photoStyle ? <div className="ac-photo" style={photoStyle} /> : <div className="ac-nophoto">{(card?.callsign || "?").charAt(0).toUpperCase()}</div>}
            <div className="ac-top">
              <div className="ac-rarity">{(TIER_STYLE[tier] || TIER_STYLE.unranked).label}</div>
              <div className="ac-serial">{serial}</div>
            </div>
            {card?.title && TITLE_LABEL[card.title] && <div className="ac-title">★ {TITLE_LABEL[card.title]}</div>}
            <div className="ac-bottom">
              {isFounder && <div className="ac-edition">FOUNDER EDITION</div>}
              <div className="ac-name">{card?.callsign || "Player"}</div>
              <div className="ac-stats">
                <div className="ac-stat"><b>{card?.circ ?? 0}</b><span>CIRCULATION</span></div>
                <div className="ac-stat"><b>{card?.ops ?? 0}</b><span>OPS</span></div>
                <div className="ac-stat"><b>{card?.fields ?? 0}</b><span>FIELDS</span></div>
              </div>
            </div>
          </div>
        </div>
        <div className="ac-holo" />
        <div className="ac-glare" />
      </div>
      {!flat && (
        <div className="ac-face ac-back">
          {isFounder ? (
            <div className="ac-emb">
              <div className="ac-emb-in">
                <img className="ac-patch" src={`${import.meta.env.BASE_URL}card-patch.webp`} alt="Atlas patch" draggable={false} />
                <div className="ac-word">ATLAS</div>
                <div className="ac-emb-ed">FOUNDER EDITION</div>
                <div className="ac-emb-tag">WELCOME TO THE FUTURE OF AIRSOFT</div>
              </div>
            </div>
          ) : (
            <div className="ac-bk">
              <div className="ac-bk-in">
                <div className="ac-grid" />
                <AtlasLogo className="ac-logo" />
                <div className="ac-word">ATLAS</div>
                <div className="ac-tag">WELCOME TO THE FUTURE OF AIRSOFT</div>
              </div>
            </div>
          )}
          <div className="ac-holo" />
          <div className="ac-glare" />
        </div>
      )}
    </div>
  );
});

function paintCard(el, rotY, rotX) {
  if (!el) return;
  el.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg)`;
  const ny = ((rotY % 360) + 360) % 360;
  const a = ny > 180 ? ny - 360 : ny;
  const l = Math.abs(a) < 90 ? a : a > 0 ? a - 180 : a + 180;
  const st = el.style;
  st.setProperty("--gx", `${50 - l * 0.9}%`);
  st.setProperty("--gy", `${35 + rotX * 1.6}%`);
  st.setProperty("--foil-pos", `${50 + l * 0.8}%`);
  st.setProperty("--foil-pos-y", `${50 + rotX * 2}%`);
  st.setProperty("--foil-angle", `${120 + l * 0.6}deg`);
  const tilt = Math.min(1, Math.abs(l) / 45 + Math.abs(rotX) / 30);
  st.setProperty("--holo-o", (0.18 + tilt * 0.45).toFixed(3));
  st.setProperty("--glare-o", (0.35 + tilt * 0.4).toFixed(3));
}

// Drag to spin (with inertia), double-tap to flip, idle sway when left alone.
// Returns a controls ref: { flip(), spin(), setIdle(bool) }.
function useSpinner(stageRef, cardRef, { idle = true, startY = -18 } = {}) {
  const controls = useRef({ flip() {}, spin() {}, setIdle() {} });
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return undefined;
    const S = { rotY: startY, rotX: 6, vY: 0, vX: 0, drag: false, idle, idleT: 0, anim: null, last: 0, lastTap: 0, lx: 0, ly: 0, lt: 0 };
    const to = (target, dur) => { S.anim = { from: S.rotY, to: target, start: performance.now(), dur }; S.last = performance.now(); };
    controls.current = {
      flip() { to(Math.round(S.rotY / 180) * 180 + 180, 800); CardSound.whoosh(0.5); },
      spin() { to(Math.round(S.rotY / 180) * 180 + 720, 1800); CardSound.whoosh(1); },
      setIdle(v) { S.idle = v; },
    };
    const down = (e) => { S.drag = true; S.anim = null; S.lx = e.clientX; S.ly = e.clientY; S.lt = performance.now(); S.vX = S.vY = 0; stage.setPointerCapture?.(e.pointerId); };
    const move = (e) => {
      if (!S.drag) return;
      const n = performance.now(), dx = e.clientX - S.lx, dy = e.clientY - S.ly, dt = Math.max(1, n - S.lt);
      S.rotY += dx * 0.55; S.rotX = Math.max(-35, Math.min(35, S.rotX - dy * 0.35));
      S.vY = (dx * 0.55 * 16) / dt; S.vX = ((-dy * 0.35 * 16) / dt) * 0.5;
      S.lx = e.clientX; S.ly = e.clientY; S.lt = n; S.last = n;
    };
    const up = () => {
      if (!S.drag) return;
      S.drag = false;
      const n = performance.now();
      S.last = n;
      if (n - S.lastTap < 280) controls.current.flip();
      S.lastTap = n;
    };
    stage.addEventListener("pointerdown", down);
    stage.addEventListener("pointermove", move);
    stage.addEventListener("pointerup", up);
    stage.addEventListener("pointercancel", up);
    let raf = 0;
    const tick = (t) => {
      if (S.anim) {
        const a = S.anim, p = Math.min(1, (t - a.start) / a.dur), e = 1 - Math.pow(1 - p, 3);
        S.rotY = a.from + (a.to - a.from) * e; S.rotX += (0 - S.rotX) * 0.08;
        if (p >= 1) { S.anim = null; S.vY = 0; }
      } else if (!S.drag) {
        S.rotY += S.vY; S.rotX += S.vX; S.vY *= 0.95; S.vX *= 0.9; S.rotX += (4 - S.rotX) * 0.04;
        if (S.idle && Math.abs(S.vY) < 0.05 && t - S.last > 1500) {
          S.idleT += 0.016;
          const base = Math.round(S.rotY / 180) * 180;
          S.rotY += (base + Math.sin(S.idleT * 0.9) * 22 - S.rotY) * 0.03;
          S.rotX += (5 + Math.sin(S.idleT * 1.3) * 4 - S.rotX) * 0.03;
        }
      }
      paintCard(cardRef.current, S.rotY, S.rotX);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      stage.removeEventListener("pointerdown", down);
      stage.removeEventListener("pointermove", move);
      stage.removeEventListener("pointerup", up);
      stage.removeEventListener("pointercancel", up);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stageRef, cardRef]);
  useEffect(() => { controls.current.setIdle(idle); }, [idle]);
  return controls;
}

function useScaleFor(maxWFrac, maxHFrac, cap = 1.1) {
  const calc = () => Math.min(cap, (window.innerWidth * maxWFrac) / W, (window.innerHeight * maxHFrac) / H);
  const [s, setS] = useState(calc);
  useEffect(() => {
    const on = () => setS(calc());
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return s;
}

function Scaled({ scale, bob, children, style }) {
  return (
    <div className={`ac-sizer${bob ? " ac-bob" : ""}`} style={{ width: W * scale, height: H * scale, ...style }}>
      <div className="ac-scale" style={{ transform: `scale(${scale})` }}>{children}</div>
    </div>
  );
}

// A spinnable 3D card.
export function SpinCard({ card, total, scale, idle = true, controlsRef, startY }) {
  useCardStyles();
  const stageRef = useRef(null);
  const cardRef = useRef(null);
  const controls = useSpinner(stageRef, cardRef, { idle, startY });
  useEffect(() => { if (controlsRef) controlsRef.current = controls.current; });
  return (
    <div ref={stageRef} className="ac-stage" style={{ padding: "12px 0" }}>
      <Scaled scale={scale} bob>
        <TradingCardFaces ref={cardRef} card={card} total={total} />
      </Scaled>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared UI bits
// ---------------------------------------------------------------------------

function Header({ title, onBack, right }) {
  const { T, display } = useTheme();
  return (
    <div className="px-6 pt-2 pb-4 flex items-center" style={{ borderBottom: `1px solid ${T.line}` }}>
      <button onClick={onBack} className="w-9 h-9 -ml-2 flex items-center justify-center text-[20px]" style={{ color: T.ash }} aria-label="Back">‹</button>
      <h1 className="flex-1 text-center text-[18px] font-semibold" style={{ ...display, color: T.ash }}>{title}</h1>
      <div className="w-9 flex justify-end">{right}</div>
    </div>
  );
}

function Pill({ children, onClick, primary, disabled }) {
  const { T, display, body } = useTheme();
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="px-4 py-2.5 text-[12px] font-semibold"
      style={primary
        ? { ...display, background: T.cta, color: T.inverse, borderRadius: T.rPill, opacity: disabled ? 0.5 : 1 }
        : { ...body, border: `1px solid ${T.line}`, color: T.ash, borderRadius: T.rPill, opacity: disabled ? 0.5 : 1 }}
    >
      {children}
    </button>
  );
}

let toastTimer;
function useToast() {
  const [msg, setMsg] = useState(null);
  const show = useCallback((m) => { setMsg(m); clearTimeout(toastTimer); toastTimer = setTimeout(() => setMsg(null), 3200); }, []);
  const { T, body } = useTheme();
  const node = msg ? (
    <div className="fixed left-1/2 px-4 py-2.5 text-[13px] font-medium" style={{ ...body, zIndex: 2200, top: 70, transform: "translateX(-50%)", background: T.panel, color: T.ash, border: `1px solid ${T.line}`, borderRadius: 12, boxShadow: T.shadowMd, maxWidth: "90vw", width: "max-content" }}>
      {msg}
    </div>
  ) : null;
  return [node, show];
}

// Shown on the Profile tab when a player's card would use an old low-res
// photo (anything uploaded before the 1,200px crop tool).
export function CardPhotoPrompt({ onUpload }) {
  const { T, display, body } = useTheme();
  return (
    <div className="p-3 mb-4 flex items-center gap-3" style={{ background: T.panel, borderRadius: T.rCard, boxShadow: T.shadowMd, border: `1px solid ${T.line}` }}>
      <div className="flex-1">
        <div className="text-[13px] font-semibold" style={{ ...display, color: T.ash }}>Your card needs a sharper photo</div>
        <div className="text-[12px]" style={{ ...body, color: T.ashDim }}>Upload a new one and line it up for your trading card.</div>
      </div>
      <Pill primary onClick={onUpload}>Upload</Pill>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Card viewer (full screen 3D)
// ---------------------------------------------------------------------------

export function CardViewer({ card, total, onClose }) {
  const { T, body } = useTheme();
  const scale = useScaleFor(0.82, 0.62);
  const ctl = useRef(null);
  // Opens on the back, then flips to the face.
  useEffect(() => { const t = setTimeout(() => ctl.current?.flip(), 120); return () => clearTimeout(t); }, []);
  useHideBottomNav();
  return createPortal(
    <div className="fixed inset-0 flex flex-col items-center justify-center" style={{ background: "rgba(3,5,10,0.92)", zIndex: 2100 }}>
      <button onClick={onClose} className="absolute top-4 right-4 w-10 h-10 text-[18px]" style={{ color: "#fff", border: "1px solid rgba(255,255,255,0.25)", borderRadius: 999 }} aria-label="Close">✕</button>
      <div className="text-[11px] uppercase mb-1" style={{ ...body, color: "rgba(255,255,255,0.55)", letterSpacing: "0.14em" }}>Drag to spin · double-tap to flip</div>
      <SpinCard card={card} total={total} scale={scale} controlsRef={ctl} startY={-180} />
      <div className="flex gap-2 mt-3">
        <button onClick={() => ctl.current?.flip()} className="px-4 py-2.5 text-[12px] font-semibold" style={{ color: "#fff", border: "1px solid rgba(255,255,255,0.3)", borderRadius: T.rPill }}>Flip</button>
        <button onClick={() => ctl.current?.spin()} className="px-4 py-2.5 text-[12px] font-semibold" style={{ color: "#fff", border: "1px solid rgba(255,255,255,0.3)", borderRadius: T.rPill }}>Spin</button>
      </div>
    </div>,
    document.body
  );
}

// ---------------------------------------------------------------------------
// Share (show QR) — your card or one of your public kids' cards
// ---------------------------------------------------------------------------

function ShareCardSheet({ card, total, childPublicId, onClose }) {
  const { T, display, body, mono } = useTheme();
  const [qr, setQr] = useState(null);
  const [error, setError] = useState("");
  const [left, setLeft] = useState(QR_REFRESH_S);
  const [collectors, setCollectors] = useState([]);
  const [flying, setFlying] = useState(false);
  const [toastNode, toast] = useToast();
  const unsubs = useRef([]);
  const seen = useRef(new Set());
  const scale = useScaleFor(0.42, 0.3, 0.8);

  const issue = useCallback(async () => {
    try {
      const res = await httpsCallable(firebaseFunctions, "issueCardToken")(childPublicId ? { childPublicId } : {});
      const { token } = res.data;
      const dataUrl = await QRCode.toDataURL(cardShareUrl(token), { width: 480, margin: 1, errorCorrectionLevel: "H", color: { dark: "#0b1f4d", light: "#ffffff" } });
      setQr(dataUrl);
      setError("");
      setLeft(QR_REFRESH_S);
      // Watch this code for scans (the phone that showed it can read it).
      const un = onSnapshot(doc(db, "cardShares", token), (snap) => {
        const d = snap.data();
        const at = d?.lastCollectedAt?.toMillis?.();
        if (!at) return;
        const key = `${token}:${d.collects}`;
        if (seen.current.has(key)) return;
        seen.current.add(key);
        const who = d.lastCollectorCallsign || "Someone";
        if (d.lastAlready) { toast(`${who} already has this card`); return; }
        setCollectors((c) => [who, ...c]);
        setFlying(true);
        CardSound.whoosh(0.7);
        buzz(30);
        setTimeout(() => { setFlying(false); toast(`${who} collected ${childPublicId ? `${card.callsign}'s` : "your"} card`); }, 900);
      }, () => {});
      unsubs.current.push(un);
    } catch (err) {
      setError(err?.message || "Couldn't make a code. Check your connection.");
    }
  }, [childPublicId, card?.callsign, toast]);

  useEffect(() => {
    issue();
    const t = setInterval(() => setLeft((s) => (s <= 1 ? 0 : s - 1)), 1000);
    return () => { clearInterval(t); unsubs.current.forEach((u) => u()); unsubs.current = []; };
  }, [issue]);
  useEffect(() => { if (left === 0) issue(); }, [left, issue]);

  useHideBottomNav();
  return createPortal(
    <div className="fixed inset-0 flex flex-col items-center justify-center px-6 text-center overflow-hidden" style={{ background: T.void, zIndex: 2000 }}>
      {toastNode}
      <button onClick={onClose} className="absolute top-4 right-4 w-10 h-10 text-[18px]" style={{ color: T.ash, border: `1px solid ${T.line}`, borderRadius: 999 }} aria-label="Close">✕</button>
      <div className="text-[11px] font-semibold uppercase" style={{ ...mono, color: T.accent, letterSpacing: "0.2em" }}>{childPublicId ? `${card.callsign}'s card` : "Your card"}</div>
      <div className="text-[22px] font-semibold mt-1" style={{ ...display, color: T.ash }}>Give your card</div>
      <p className="text-[13px] mt-1 mb-5" style={{ ...body, color: T.ashDim, maxWidth: 300 }}>
        Another player scans this to collect {childPublicId ? "it" : "your card"}. The code changes every {QR_REFRESH_S} seconds, so cards can only be collected in person.
      </p>
      <div className="relative" style={{ width: 236, height: 236 }}>
        <div className="w-full h-full grid place-items-center" style={{ background: "#fff", borderRadius: 22, boxShadow: "0 20px 50px rgba(37,99,235,.35)" }}>
          {qr ? <img src={qr} alt="Card code" style={{ width: 200, height: 200, imageRendering: "pixelated" }} /> : <span className="text-[12px]" style={{ ...body, color: "#64748b" }}>{error || "Making a code…"}</span>}
          {qr && (
            <div className="absolute grid place-items-center" style={{ width: 44, height: 44, borderRadius: 10, background: "#1e40af", boxShadow: "0 0 0 4px #fff" }}>
              <AtlasLogo className="" fill="#fff" />
            </div>
          )}
        </div>
        {flying && (
          <div className="absolute left-1/2 top-0" style={{ transform: "translateX(-50%)", animation: "ac-fly .9s cubic-bezier(.5,0,.75,0) forwards" }}>
            <style>{"@keyframes ac-fly{0%{transform:translate(-50%,0) rotate(0) scale(1);opacity:1}25%{transform:translate(-50%,-24px) rotate(-3deg) scale(1.05);opacity:1}100%{transform:translate(-30%,-140vh) rotate(14deg) scale(.7);opacity:.9}}"}</style>
            <Scaled scale={scale}><TradingCardFaces card={card} total={total} flat /></Scaled>
          </div>
        )}
      </div>
      {error && qr && <div className="mt-3 text-[12px]" style={{ ...body, color: T.alert }}>{error}</div>}
      <div className="flex items-center gap-2 mt-4 text-[12px]" style={{ ...body, color: T.ashDim }}>
        <svg viewBox="0 0 36 36" width="22" height="22" style={{ transform: "rotate(-90deg)" }}>
          <circle cx="18" cy="18" r="15" fill="none" stroke={T.line} strokeWidth="4" />
          <circle cx="18" cy="18" r="15" fill="none" stroke={T.accent} strokeWidth="4" strokeLinecap="round" strokeDasharray="94.25" strokeDashoffset={94.25 * (1 - left / QR_REFRESH_S)} />
        </svg>
        New code in {left}s
      </div>
      {collectors.length > 0 && (
        <div className="mt-4 text-[12px]" style={{ ...body, color: T.ashDim }}>Collected just now by {collectors.join(", ")}</div>
      )}
    </div>,
    document.body
  );
}

// ---------------------------------------------------------------------------
// My Card
// ---------------------------------------------------------------------------

export function MyCardScreen({ user, publicChildren = [], onBack, onOpenDeck, onUploadPhoto, onAdjustCardPhoto }) {
  const { T, display, body, mono } = useTheme();
  const { card, loading } = useCardOwner("adult", user?.uid);
  const total = useCardsTotal();
  const scale = useScaleFor(0.8, 0.5);
  const ctl = useRef(null);
  const [idle, setIdle] = useState(true);
  const [sharing, setSharing] = useState(null); // { card, childPublicId }

  return (
    <div className="h-full overflow-y-auto pb-24" style={{ backgroundColor: T.void }}>
      <Header title="My Card" onBack={onBack} />
      {loading || !card ? (
        <p className="px-6 pt-6 text-[13px]" style={{ ...body, color: T.ashFaint }}>{loading ? "Loading…" : "Card not found."}</p>
      ) : (
        <div className="flex flex-col items-center pt-3 px-5">
          <div className="text-[11px] uppercase" style={{ ...body, color: T.ashFaint, letterSpacing: "0.14em" }}>Drag to spin · double-tap to flip</div>
          <SpinCard card={card} total={total} scale={scale} idle={idle} controlsRef={ctl} />
          <div className="flex gap-2 flex-wrap justify-center mt-2">
            <Pill onClick={() => ctl.current?.flip()}>Flip</Pill>
            <Pill onClick={() => ctl.current?.spin()}>Spin</Pill>
            <Pill onClick={() => setIdle((v) => !v)}>{idle ? "Sway: on" : "Sway: off"}</Pill>
          </div>
          <div className="flex gap-2 flex-wrap justify-center mt-3">
            <Pill primary disabled={!card.photoUrl} onClick={() => setSharing({ card })}>Share my card</Pill>
            <Pill onClick={onOpenDeck}>My deck</Pill>
          </div>
          {!card.photoUrl && (
            <p className="text-[12px] mt-3 text-center" style={{ ...body, color: T.ashDim }}>Add a photo to share your card. <button onClick={onUploadPhoto} className="underline" style={{ color: T.accent }}>Upload one</button></p>
          )}
          {card.photoUrl && !card.hiRes && <div className="w-full mt-4"><CardPhotoPrompt onUpload={onUploadPhoto} /></div>}
          {card.hiRes && (
            <button onClick={onAdjustCardPhoto} className="mt-3 text-[12px] underline" style={{ ...body, color: T.accent }}>Adjust card photo</button>
          )}
          <div className="w-full mt-6 p-3" style={{ background: T.panel, borderRadius: T.rCard, boxShadow: T.shadowMd }}>
            <div className="text-[11px] font-semibold uppercase mb-1" style={{ ...mono, color: T.ashFaint, letterSpacing: "0.1em" }}>How rarity works</div>
            <p className="text-[12px]" style={{ ...body, color: T.ashDim }}>
              Circulation is how many players have collected your card. Cards in fewer than 5 decks are Unranked; after that, the least-circulated cards are the rarest. Most Popular and Rarest are titles that move as cards change hands.
            </p>
          </div>
          {publicChildren.length > 0 && (
            <div className="w-full mt-6">
              <div className="text-[11px] font-semibold uppercase mb-2" style={{ ...mono, color: T.ashFaint, letterSpacing: "0.1em" }}>Your kids' cards</div>
              {publicChildren.map((c) => <ChildCardRow key={c.publicId} child={c} total={total} onShare={(childCard) => setSharing({ card: childCard, childPublicId: c.publicId })} />)}
            </div>
          )}
        </div>
      )}
      {sharing && <ShareCardSheet card={sharing.card} total={total} childPublicId={sharing.childPublicId} onClose={() => setSharing(null)} />}
    </div>
  );
}

function ChildCardRow({ child, total, onShare }) {
  const { T, display, body } = useTheme();
  const { card } = useCardOwner("child", child.publicId);
  useCardStyles();
  if (!card) return null;
  return (
    <div className="p-3 mb-2 flex items-center gap-3" style={{ background: T.panel, borderRadius: T.rCard, boxShadow: T.shadowMd }}>
      <Scaled scale={0.16}><TradingCardFaces card={card} total={total} flat /></Scaled>
      <div className="flex-1 min-w-0">
        <div className="text-[14px] font-semibold" style={{ ...display, color: T.ash }}>{card.callsign}</div>
        <div className="text-[12px]" style={{ ...body, color: T.ashDim }}>
          {card.photoUrl ? `In ${card.circ} deck${card.circ === 1 ? "" : "s"}` : "Add a photo in Child Profiles to share"}
        </div>
      </div>
      <Pill primary disabled={!card.photoUrl} onClick={() => onShare(card)}>Share</Pill>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Collected (after a scan)
// ---------------------------------------------------------------------------

export function CardCollectedOverlay({ result, onClose, onOpenDeck }) {
  const { T, display, body } = useTheme();
  const { card } = useCardOwner(result.ownerKind, result.ownerId);
  const total = useCardsTotal();
  const scale = useScaleFor(0.6, 0.42);
  const [phase, setPhase] = useState("drop"); // drop → landed → ready
  const [viewing, setViewing] = useState(false);
  const burstRef = useRef(null);
  const wrapRef = useRef(null);
  useCardStyles();

  useEffect(() => {
    if (!card) return undefined;
    CardSound.whoosh(0.9);
    const t1 = setTimeout(() => {
      setPhase("landed");
      if (!result.already) { CardSound.thump(); CardSound.chime(); buzz([20, 40, 60]); }
      const b = burstRef.current;
      if (b) { b.classList.remove("go"); void b.offsetWidth; b.classList.add("go"); }
    }, 1050);
    const t2 = setTimeout(() => setPhase("ready"), 2300);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [!!card]); // eslint-disable-line react-hooks/exhaustive-deps

  const addToDeck = () => {
    const el = wrapRef.current;
    CardSound.whoosh(0.5);
    if (el?.animate) {
      el.animate([{ transform: "translateY(0) scale(1)", opacity: 1 }, { transform: "translateY(20px) scale(.95)", opacity: 1, offset: 0.2 }, { transform: "translate(40vw, 60vh) scale(.06) rotate(-20deg)", opacity: 0.4 }],
        { duration: 650, easing: "cubic-bezier(.6,0,.3,1)", fill: "forwards" }).onfinish = () => { CardSound.thump(); onOpenDeck(); };
    } else onOpenDeck();
  };

  useHideBottomNav();
  return createPortal(
    <div className="fixed inset-0 flex flex-col items-center justify-center px-6 text-center overflow-hidden" style={{ background: "radial-gradient(120% 80% at 50% 30%,#1b2440 0%,#0a0d18 60%,#05060b 100%)", zIndex: 2000 }}>
      <style>{"@keyframes ac-drop{0%{transform:translateY(-110vh) rotate(-25deg)}80%{transform:translateY(12px) rotate(3deg)}100%{transform:translateY(0) rotate(0)}}@keyframes ac-dropspin{0%{transform:rotateY(900deg) rotateX(20deg)}100%{transform:rotateY(0) rotateX(0)}}"}</style>
      <div className="relative flex justify-center" style={{ minHeight: H * scale + 20 }}>
        <div ref={burstRef} className="ac-burst" />
        <div className={`ac-stamp${phase === "landed" ? " go" : ""}`}>{result.already ? "ALREADY YOURS" : "COLLECTED"}</div>
        {card && (
          <div ref={wrapRef} style={{ animation: "ac-drop 1.1s cubic-bezier(.2,.7,.3,1)" }}>
            <Scaled scale={scale}>
              <div style={{ animation: "ac-dropspin 1.1s cubic-bezier(.15,.7,.3,1)", transformStyle: "preserve-3d" }}>
                <TradingCardFaces card={card} total={total} />
              </div>
            </Scaled>
          </div>
        )}
      </div>
      <div style={{ opacity: phase === "ready" ? 1 : 0, transition: "opacity .4s" }}>
        <div className="text-[18px] font-semibold mt-4" style={{ ...display, color: "#fff" }}>
          {result.already ? `You already have ${result.callsign}` : `You collected ${result.callsign}`}
        </div>
        {card && (
          <div className="text-[12px] mt-1 mb-4" style={{ ...body, color: "rgba(255,255,255,0.65)" }}>
            #{card.serial ?? "—"} · {card.tier === "founder" ? "Founder Edition" : ((t) => t.charAt(0) + t.slice(1).toLowerCase())((TIER_STYLE[card.tier] || TIER_STYLE.unranked).label)} · in {card.circ} deck{card.circ === 1 ? "" : "s"}
          </div>
        )}
        <div className="flex gap-2 justify-center">
          <button onClick={() => setViewing(true)} className="px-4 py-2.5 text-[12px] font-semibold" style={{ color: "#fff", border: "1px solid rgba(255,255,255,0.3)", borderRadius: T.rPill }}>View card</button>
          <button onClick={addToDeck} className="px-4 py-2.5 text-[12px] font-semibold" style={{ ...display, background: T.cta, color: T.inverse, borderRadius: T.rPill }}>{result.already ? "Open deck" : "Add to deck"}</button>
        </div>
        <button onClick={onClose} className="mt-3 text-[12px] underline" style={{ ...body, color: "rgba(255,255,255,0.6)" }}>Done</button>
      </div>
      {viewing && card && <CardViewer card={card} total={total} onClose={() => setViewing(false)} />}
    </div>,
    document.body
  );
}

// ---------------------------------------------------------------------------
// Deck
// ---------------------------------------------------------------------------

export function DeckScreen({ collectorUid, title, onBack, highlightOwnerId }) {
  const { T, display, body, mono } = useTheme();
  useCardStyles();
  const { cards: loaded, loading } = useDeck(collectorUid);
  const total = useCardsTotal();
  const [order, setOrder] = useState([]); // keys in stack order, top first
  const [viewing, setViewing] = useState(null);
  const [muted, setMuted] = useState(CardSound.muted);
  const [busy, setBusy] = useState(false);
  const els = useRef({});
  const areaRef = useRef(null);
  const drag = useRef(null);
  const dS = useScaleFor(0.66, 0.48);

  const byKey = useMemo(() => Object.fromEntries(loaded.map((c) => [`${c.kind}:${c.id}`, c])), [loaded]);
  useEffect(() => {
    setOrder((prev) => {
      const keys = loaded.map((c) => `${c.kind}:${c.id}`);
      const kept = prev.filter((k) => keys.includes(k));
      const added = keys.filter((k) => !kept.includes(k));
      return [...added, ...kept];
    });
  }, [loaded]);

  const posFor = (i, key) => {
    const d = Math.min(i, 6);
    const r = i ? (((byKey[key]?.serial || 0) % 7) - 3) * 0.6 : 0;
    return `translateY(${d * 4}px) rotate(${r}deg) scale(${dS * (1 - d * 0.015)})`;
  };
  const off = (H * dS - H) / 2;

  useEffect(() => {
    order.forEach((k, i) => {
      const el = els.current[k];
      if (!el) return;
      el.style.zIndex = String(100 - i);
      el.style.top = `${off}px`;
      if (!el.classList.contains("dragging")) el.style.transform = posFor(i, k);
    });
  });

  useEffect(() => {
    if (!highlightOwnerId || !order.length) return;
    const k = order.find((x) => x.endsWith(`:${highlightOwnerId}`));
    const el = k && els.current[k];
    if (el) { el.classList.remove("glow"); void el.offsetWidth; el.classList.add("glow"); }
  }, [highlightOwnerId, order.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const onDown = (e) => {
    if (busy || !order.length) return;
    drag.current = { x: e.clientX, y: e.clientY, t: performance.now(), dx: 0 };
    els.current[order[0]]?.classList.add("dragging");
    areaRef.current?.setPointerCapture?.(e.pointerId);
  };
  const onMove = (e) => {
    const d = drag.current;
    if (!d) return;
    d.dx = e.clientX - d.x;
    const el = els.current[order[0]];
    if (el) el.style.transform = `translateX(${d.dx}px) rotate(${d.dx / 18}deg) scale(${dS})`;
  };
  const onUp = (e) => {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    const topKey = order[0];
    const el = els.current[topKey];
    el?.classList.remove("dragging");
    const moved = Math.hypot(e.clientX - d.x, e.clientY - d.y);
    if (Math.abs(d.dx) > 70 && order.length > 1) {
      setBusy(true);
      CardSound.flick(0); CardSound.flick(0.03);
      const side = Math.sign(d.dx);
      if (el) el.style.transform = `translateX(${side * window.innerWidth * 0.7}px) rotate(${side * 25}deg) scale(${dS})`;
      setTimeout(() => {
        if (el) {
          el.style.transition = "none";
          el.style.zIndex = "0";
          el.style.transform = `translateX(${side * window.innerWidth * 0.35}px) translateY(24px) scale(${dS * 0.9})`;
          void el.offsetWidth;
          el.style.transition = "";
        }
        setOrder((o) => [...o.slice(1), o[0]]);
        setTimeout(() => setBusy(false), 350);
      }, 280);
    } else {
      if (el) el.style.transform = posFor(0, topKey);
      if (moved < 8 && performance.now() - d.t < 350 && byKey[topKey]) setViewing(byKey[topKey]);
    }
  };

  // Split into two halves, riffle back in a new order, square up.
  const shuffle = () => {
    if (busy || order.length < 2) return;
    setBusy(true);
    CardSound.ac();
    const n = order.length;
    order.forEach((k, i) => {
      const el = els.current[k];
      if (!el) return;
      const side = i % 2 ? 1 : -1;
      el.style.transitionDelay = `${i * 12}ms`;
      el.style.transform = `translateX(${side * W * dS * 0.27}px) translateY(${i * 1.5}px) rotate(${side * 9}deg) scale(${dS * 0.96})`;
    });
    CardSound.whoosh(0.35);
    setTimeout(() => {
      const next = [...order];
      for (let i = n - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [next[i], next[j]] = [next[j], next[i]]; }
      const gap = 55;
      buzz(Array.from({ length: Math.min(n, 10) }, (_, i) => (i % 2 ? gap - 8 : 8)));
      next.forEach((k, i) => {
        const el = els.current[k];
        if (!el) return;
        const step = n - 1 - i;
        el.style.zIndex = String(100 - i);
        el.style.transitionDelay = `${step * gap}ms`;
        el.style.transform = `translateY(${Math.min(i, 6) * 4 - 10}px) rotate(0deg) scale(${dS * (1 - Math.min(i, 6) * 0.015)})`;
        CardSound.flick((step * gap) / 1000 + 0.03);
      });
      setTimeout(() => {
        next.forEach((k) => { const el = els.current[k]; if (el) el.style.transitionDelay = "0ms"; });
        CardSound.thump();
        buzz(25);
        setOrder(next);
        setTimeout(() => setBusy(false), 380);
      }, n * gap + 300);
    }, 420);
  };

  const toggleMute = () => { const v = !muted; CardSound.muted = v; setMuted(v); };

  return (
    <div className="h-full overflow-y-auto pb-24" style={{ backgroundColor: T.void }}>
      <Header title={title || "Deck"} onBack={onBack} />
      <div className="flex items-center justify-between px-6 pt-4">
        <div className="text-[18px] font-semibold" style={{ ...display, color: T.ash }}>{loading ? "…" : `${loaded.length} card${loaded.length === 1 ? "" : "s"}`}</div>
        <button onClick={toggleMute} className="px-3 py-2 text-[11px] font-semibold uppercase" style={{ ...mono, color: T.ashDim, border: `1px solid ${T.line}`, borderRadius: T.rPill, letterSpacing: "0.08em" }}>
          {muted ? "Sound off" : "Sound on"}
        </button>
      </div>
      {!loading && loaded.length === 0 ? (
        <p className="px-6 pt-6 text-[13px]" style={{ ...body, color: T.ashDim }}>No cards yet. Scan another player's card QR at your next game to start a deck.</p>
      ) : (
        <>
          <div
            ref={areaRef}
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
            className="relative w-full mt-4"
            style={{ height: H * dS + 44, touchAction: "none" }}
          >
            {order.map((k) => byKey[k] && (
              <div key={k} ref={(el) => { if (el) els.current[k] = el; else delete els.current[k]; }} className="ac-dc">
                <TradingCardFaces card={byKey[k]} total={total} flat />
              </div>
            ))}
          </div>
          <div className="text-center text-[11px] uppercase mt-1" style={{ ...body, color: T.ashFaint, letterSpacing: "0.14em" }}>Swipe to flip through · tap to view</div>
          <div className="flex justify-center mt-3"><Pill primary disabled={busy || order.length < 2} onClick={shuffle}>Shuffle</Pill></div>
        </>
      )}
      {viewing && <CardViewer card={viewing} total={total} onClose={() => setViewing(null)} />}
    </div>
  );
}

// Count for a "Deck (N)" button on a public profile.
export function useDeckCount(collectorUid) {
  const [n, setN] = useState(null);
  useEffect(() => {
    if (!collectorUid) return undefined;
    return onSnapshot(query(collection(db, "cardCollections"), where("collectorUid", "==", collectorUid)), (s) => setN(s.size), () => setN(null));
  }, [collectorUid]);
  return n;
}
