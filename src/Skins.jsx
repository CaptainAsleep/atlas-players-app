import React, { useEffect, useMemo, useState } from "react";
import { ChevronLeft, Check, Eye, X, Lock, ExternalLink, Bell, BellOff } from "lucide-react";
import { useTheme } from "./hooks/useTheme";
import { resolveLook, SKIN_FONT_URLS } from "./theme";
import SkinTexture, { withAlpha } from "./SkinTexture";
import { FREE_LOOKS, SKINS, COLLECTIONS, skinById, isOnSale, bundleOffer, fmtSkinPrice } from "./skins";
import { startSkinCheckout } from "./hooks/useSkins";

// Paid skins (2026-11-09). Scope: project doc claude/atlas-skins-scope.md.
// Screens: Appearance (Profile → Appearance), the preview chrome shown
// while a skin is being tried on, the purchase sheet (checkout → waiting on
// the webhook → unlocked), and the booking add-on panel.

const asFont = (f) => (typeof f === "string" ? { fontFamily: f } : f);
const FRIENDLY = ["failed-precondition", "already-exists", "invalid-argument", "unauthenticated"];
const friendlyError = (err, fallback) => {
  const code = String(err?.code || "").replace(/^functions\//, "");
  return FRIENDLY.includes(code) && err?.message ? err.message : fallback;
};

// The display fonts of every skin, so Appearance thumbnails render right.
function useAllSkinFonts() {
  useEffect(() => {
    for (const [id, href] of Object.entries(SKIN_FONT_URLS)) {
      if (document.querySelector(`link[data-skin-font="${id}"]`) || document.querySelector(`link[href="${href}"]`)) continue;
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = href;
      link.setAttribute("data-skin-font", id);
      document.head.appendChild(link);
    }
  }, []);
}

// A tiny static drawing of the Explore screen in any look — used for the
// Appearance tiles and the purchase sheet. Drawn from tokens, not a
// screenshot, so it's always accurate to the look.
// compact: no text, for thumbnails too narrow to hold it.
export function MiniPreview({ lookId, height = 160, radius = 10, compact = false }) {
  const { T, fonts } = resolveLook(lookId);
  const display = asFont(fonts.display);
  return (
    <div aria-hidden="true" style={{ position: "relative", width: "100%", height, overflow: "hidden", borderRadius: radius, background: T.void }}>
      {T.texture && (
        <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 74, overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, opacity: T.bandOpacity ?? 0.6 }}>
            <SkinTexture T={T} width={200} height={74} withBase />
          </div>
          <div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, ${withAlpha(T.void, 0.2)} 0%, ${T.void} 100%)` }} />
        </div>
      )}
      <div style={{ position: "relative", padding: "12px 10px 0", display: "flex", flexDirection: "column", gap: 7 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {compact ? <span style={{ width: "55%", height: 6, borderRadius: 99, background: T.ash }} /> : <span style={{ ...display, fontSize: 12, fontWeight: 700, color: T.ash, lineHeight: 1 }}>Welcome back</span>}
          <span style={{ width: 14, height: 14, borderRadius: 4, background: T.cta }} />
        </div>
        <div style={{ position: "relative", height: Math.round(height * 0.34), borderRadius: 9, overflow: "hidden", background: T.heroBg, border: T.heroBorder }}>
          {T.texture && <SkinTexture T={T} width={200} height={60} seedOffset={7} />}
          {T.heroScrim && <div style={{ position: "absolute", inset: 0, background: T.heroScrim }} />}
          <div style={{ position: "relative", padding: 7, display: "flex", flexDirection: "column", gap: 5 }}>
            <span style={{ width: 34, height: 6, borderRadius: 99, background: T.alert }} />
            {compact ? <span style={{ width: "60%", height: 5, borderRadius: 99, background: T.ash }} /> : <span style={{ ...display, fontSize: 10, fontWeight: 700, color: T.ash, lineHeight: 1 }}>Open Play</span>}
            <span style={{ width: 44, height: 11, borderRadius: 99, background: T.cta }} />
          </div>
        </div>
        {[0, 1].map((i) => (
          <div key={i} style={{ display: "flex", gap: 6, alignItems: "center", padding: 5, borderRadius: 7, background: T.panel, boxShadow: T.shadowSm }}>
            <span style={{ width: 16, height: 16, borderRadius: 4, background: T.panelAlt }} />
            <span style={{ display: "flex", flexDirection: "column", gap: 3, flex: 1 }}>
              <span style={{ width: "70%", height: 5, borderRadius: 99, background: T.ash, opacity: 0.85 }} />
              <span style={{ width: "45%", height: 4, borderRadius: 99, background: T.accent }} />
            </span>
          </div>
        ))}
      </div>
      <div style={{ position: "absolute", left: 8, right: 8, bottom: 6, height: 16, borderRadius: 99, background: T.glassFill, border: T.glassBorder, display: "flex", alignItems: "center", padding: "0 5px", gap: 4 }}>
        <span style={{ width: 20, height: 8, borderRadius: 99, background: T.navActive }} />
      </div>
    </div>
  );
}

function Eyebrow({ children, right }) {
  const { T, mono } = useTheme();
  return (
    <div className="flex justify-between items-baseline mb-2.5">
      <span className="text-[11px] font-semibold" style={{ ...mono, color: T.ashFaint, letterSpacing: "0.14em" }}>{children}</span>
      {right}
    </div>
  );
}

const fmtSaleEnd = (iso) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });

// ── Profile → Appearance ────────────────────────────────────────────────
export function AppearanceScreen({ owned, ownedLoaded, onBack, onPreview, onBuy, onEquip, equipBusy, equipError, dropAlerts, onToggleDropAlerts }) {
  const { T, display, body, mono, savedTheme } = useTheme();
  useAllSkinFonts();
  const ownedSet = useMemo(() => new Set(owned), [owned]);
  const onSale = SKINS.filter((s) => isOnSale(s));
  const core = onSale.filter((s) => s.collection === "core");
  const drops = onSale.filter((s) => s.collection !== "core");
  const dropGroups = [...new Set(drops.map((s) => s.collection))].map((c) => ({ id: c, skins: drops.filter((s) => s.collection === c) }));
  const mine = SKINS.filter((s) => ownedSet.has(s.id));
  const offer = ownedLoaded ? bundleOffer(owned) : null;
  const card = { background: T.panel, borderRadius: T.rCard, boxShadow: T.shadowMd };

  const SkinCard = ({ s }) => {
    const isOwned = ownedSet.has(s.id);
    return (
      <button
        type="button"
        onClick={() => onPreview(s.id)}
        aria-label={`Preview ${s.name}`}
        className="p-2 flex flex-col gap-2.5 text-left transition-transform duration-100 active:scale-[0.98]"
        style={card}
      >
        <div className="relative w-full">
          <MiniPreview lookId={s.id} height={150} />
          <span className="absolute left-2 bottom-2 flex items-center gap-1 px-2 py-1 text-[11px] font-semibold" style={{ background: "rgba(10,12,15,0.74)", color: "#FFFFFF", borderRadius: 999, ...body }}>
            <Eye size={12} /> Preview
          </span>
        </div>
        <div className="flex justify-between items-center gap-1.5 px-1 pb-0.5 w-full">
          <span className="text-[14px] font-semibold leading-tight" style={{ ...display, color: T.ash }}>{s.name}</span>
          <span className="flex-shrink-0 text-[11px] font-semibold px-2 py-1" style={{ ...mono, borderRadius: 999, background: isOwned ? T.tintGood : T.tint, color: isOwned ? T.good : T.accent }}>
            {isOwned ? "OWNED" : fmtSkinPrice(s.priceCents)}
          </span>
        </div>
      </button>
    );
  };

  return (
    <div className="h-full overflow-y-auto pb-28" style={{ background: T.void }}>
      <div className="px-4 pt-3 pb-2 flex items-center gap-3">
        <button onClick={onBack} aria-label="Back to Profile" className="w-11 h-11 flex items-center justify-center" style={{ background: T.panel, borderRadius: 999, boxShadow: T.shadowMd }}>
          <ChevronLeft size={20} color={T.ash} />
        </button>
        <h1 className="text-[22px] font-semibold" style={{ ...display, color: T.ash }}>Appearance</h1>
      </div>

      <div className="px-4 flex flex-col gap-6 mt-2">
        {equipError && <p className="text-[12px] px-3 py-2" style={{ ...body, color: T.alert, background: T.panel, borderRadius: T.rTight, border: `1px solid ${T.alert}` }}>{equipError}</p>}

        <section>
          <Eyebrow right={<span className="text-[11px]" style={{ ...mono, color: T.good }}>ALWAYS FREE</span>}>MODE</Eyebrow>
          <div className="grid grid-cols-2 gap-3">
            {FREE_LOOKS.map((l) => {
              const on = savedTheme === l.id;
              return (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => onEquip(l.id)}
                  disabled={equipBusy}
                  aria-pressed={on}
                  className="p-2 flex flex-col gap-2.5 text-left"
                  style={{ ...card, border: `2px solid ${on ? T.accent : "transparent"}` }}
                >
                  <MiniPreview lookId={l.id} height={140} />
                  <span className="flex justify-between items-center w-full px-1 pb-0.5">
                    <span className="flex flex-col">
                      <span className="text-[15px] font-semibold" style={{ ...display, color: T.ash }}>{l.name}</span>
                      <span className="text-[11px]" style={{ ...body, color: T.ashFaint }}>{l.sub}</span>
                    </span>
                    {on && (
                      <span className="w-[22px] h-[22px] flex items-center justify-center" style={{ background: T.accent, borderRadius: 999 }}>
                        <Check size={13} color={T.inverse} strokeWidth={3} />
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {mine.length > 0 && (
          <section>
            <Eyebrow right={<span className="text-[11px]" style={{ ...mono, color: T.ashFaint }}>KEPT FOREVER</span>}>YOUR SKINS</Eyebrow>
            <div className="flex flex-col gap-2.5">
              {mine.map((s) => {
                const on = savedTheme === s.id;
                return (
                  <div key={s.id} className="p-2 flex items-center gap-3" style={card}>
                    <div className="w-14 flex-shrink-0"><MiniPreview lookId={s.id} height={72} radius={8} compact /></div>
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="text-[15px] font-semibold" style={{ ...display, color: T.ash }}>{s.name}</span>
                      <span className="text-[12px]" style={{ ...body, color: T.ashFaint }}>{COLLECTIONS[s.collection]?.name || "Limited drop"}</span>
                    </div>
                    {on ? (
                      <span className="px-3 py-2 text-[12px] font-semibold flex items-center gap-1" style={{ ...body, color: T.good }}><Check size={14} /> Equipped</span>
                    ) : (
                      <button type="button" onClick={() => onEquip(s.id)} disabled={equipBusy} className="h-10 px-4 text-[13px] font-semibold" style={{ ...display, background: T.cta, color: T.inverse, borderRadius: 999, opacity: equipBusy ? 0.6 : 1 }}>
                        Equip
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {core.length > 0 && (
          <section>
            <Eyebrow>AVAILABLE NOW</Eyebrow>
            <div className="p-4 mb-3 flex flex-col gap-3.5" style={{ background: "#002C48", color: "#FFFFFF", borderRadius: T.rHero, boxShadow: T.shadowLg }}>
              <div className="flex justify-between items-center gap-3">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px]" style={{ ...mono, letterSpacing: "0.14em", color: "rgba(255,255,255,0.72)" }}>CORE COLLECTION</span>
                  <span className="text-[20px] font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{COLLECTIONS.core.name}</span>
                  <span className="text-[12px]" style={{ ...body, color: "rgba(255,255,255,0.8)" }}>{core.length} skins · $0.99 each · yours to keep</span>
                </div>
                <div aria-hidden="true" className="flex">
                  {core.map((s) => <span key={s.id} style={{ width: 22, height: 22, borderRadius: 999, marginLeft: -6, border: "2px solid #002C48", background: s.swatch }} />)}
                </div>
              </div>
              {offer && (
                <button type="button" onClick={() => onBuy({ bundle: true })} className="flex items-center justify-between gap-2.5 min-h-[48px] pl-4 pr-1.5 text-left" style={{ background: "#FFFFFF", color: "#002C48", borderRadius: 999 }}>
                  <span className="flex flex-col">
                    <span className="text-[14px] font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{offer.complete ? `Get all ${offer.skinIds.length}` : "Complete the set"}</span>
                    <span className="text-[11px]" style={{ ...body, color: "#4E5257" }}>{offer.complete ? "One purchase, every Core skin" : `The ${offer.skinIds.length} you don't own yet`}</span>
                  </span>
                  <span className="text-[12px] font-semibold px-3 py-2" style={{ ...mono, background: "#002C48", color: "#FFFFFF", borderRadius: 999 }}>{fmtSkinPrice(offer.priceCents)}</span>
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {core.map((s) => <SkinCard key={s.id} s={s} />)}
            </div>
          </section>
        )}

        {dropGroups.map((g) => {
          const ends = g.skins.map((s) => s.saleEnd).filter(Boolean).sort()[0];
          return (
            <section key={g.id}>
              <Eyebrow right={ends ? <span className="text-[11px] font-semibold px-2 py-1" style={{ ...mono, background: T.alert, color: T.inverse, borderRadius: 999 }}>LEAVES {fmtSaleEnd(ends).toUpperCase()}</span> : null}>
                {(COLLECTIONS[g.id]?.name || "Limited drop").toUpperCase()}
              </Eyebrow>
              <div className="grid grid-cols-2 gap-3">
                {g.skins.map((s) => <SkinCard key={s.id} s={s} />)}
              </div>
            </section>
          );
        })}

        <section className="p-4 flex flex-col items-center gap-2 text-center" style={{ border: `1.5px dashed ${T.line}`, borderRadius: T.rCard }}>
          <Lock size={22} color={T.ashFaint} />
          <span className="text-[10px]" style={{ ...mono, letterSpacing: "0.14em", color: T.ashFaint }}>NEXT DROP · LIMITED</span>
          <span className="text-[13px]" style={{ ...body, color: T.ashDim }}>Limited skins drop through the year and leave the shop when they end.</span>
          <button
            type="button"
            onClick={() => onToggleDropAlerts(!dropAlerts)}
            aria-pressed={!!dropAlerts}
            className="mt-1 h-10 px-4 flex items-center gap-1.5 text-[13px] font-semibold"
            style={{ ...body, borderRadius: 999, border: `1px solid ${dropAlerts ? T.good : T.line}`, color: dropAlerts ? T.good : T.accent, background: dropAlerts ? T.tintGood : "transparent" }}
          >
            {dropAlerts ? <><Bell size={14} /> We'll email you · Turn off</> : <><Bell size={14} /> Notify me</>}
          </button>
        </section>

        <p className="text-[12px] leading-relaxed" style={{ ...body, color: T.ashFaint }}>
          Skins belong to your Atlas account and follow you to every device you sign in on. Light and Dark are always free. Core Collection skins are always available; limited drops leave the shop when they end, but any skin you've bought stays in Your Skins for good. A skin only changes how Atlas looks, never what you can do in it.
        </p>
      </div>
    </div>
  );
}

// ── Preview chrome (shown over the real app while trying a skin on) ────
// Fixed neutral styling on purpose: it must read as "not part of the skin".
// Everything lives in one bar above the bottom nav, so it never covers the
// screen's own header and the nav stays usable for tapping around.
export function SkinPreviewChrome({ owned, onExit, onBuy, onEquip }) {
  const { previewTheme, setPreviewTheme } = useTheme();
  const onSale = SKINS.filter((s) => isOnSale(s));
  const current = skinById(previewTheme);
  if (!current) return null;
  const isOwned = owned.includes(current.id);
  const glass = { background: "rgba(12,13,15,0.90)", border: "1px solid rgba(255,255,255,0.16)", backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)", color: "#FFFFFF" };
  return (
    <>
      <div className="fixed left-3 right-3 z-[65] p-3.5 flex flex-col gap-3" style={{ ...glass, bottom: 92, borderRadius: 22, boxShadow: "0 24px 48px -12px rgba(0,0,0,0.6)" }}>
        <div className="flex items-center justify-between -mt-1 -mr-1">
          <span className="flex items-center gap-1.5 text-[11px] font-semibold" style={{ fontFamily: "'IBM Plex Mono', monospace", letterSpacing: "0.12em", color: "rgba(255,255,255,0.8)" }}>
            <Eye size={14} /> PREVIEW
          </span>
          <button type="button" onClick={onExit} className="h-9 pl-3 pr-2 flex items-center gap-1 text-[13px] font-semibold" style={{ borderRadius: 999, background: "rgba(255,255,255,0.12)", color: "#FFFFFF", fontFamily: "'Inter', sans-serif" }}>
            Exit <X size={15} strokeWidth={2.4} />
          </button>
        </div>
        <div role="radiogroup" aria-label="Choose a skin to preview" className="flex justify-between">
          {onSale.map((s) => {
            const on = s.id === current.id;
            return (
              <button key={s.id} type="button" role="radio" aria-checked={on} aria-label={s.name} onClick={() => setPreviewTheme(s.id)} className="w-11 h-11 p-[3px] flex items-center justify-center" style={{ borderRadius: 999, border: `2px solid ${on ? "#FFFFFF" : "rgba(255,255,255,0)"}` }}>
                <span className="block w-full h-full" style={{ borderRadius: 999, background: s.swatch }} />
              </button>
            );
          })}
        </div>
        <div className="flex justify-between items-end">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px]" style={{ fontFamily: "'IBM Plex Mono', monospace", letterSpacing: "0.14em", color: "rgba(255,255,255,0.62)" }}>{(COLLECTIONS[current.collection]?.name || "Limited drop").toUpperCase()}</span>
            <span className="text-[20px] font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{current.name}</span>
          </div>
          <span className="text-[18px] font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{isOwned ? "Owned" : fmtSkinPrice(current.priceCents)}</span>
        </div>
        <button
          type="button"
          onClick={() => (isOwned ? onEquip(current.id) : onBuy({ skinIds: [current.id] }))}
          className="h-12 flex items-center justify-center text-[15px] font-semibold"
          style={{ background: "#FFFFFF", color: "#0C0D0F", borderRadius: 999, fontFamily: "'Space Grotesk', sans-serif" }}
        >
          {isOwned ? `Equip ${current.name}` : `Unlock for ${fmtSkinPrice(current.priceCents)}`}
        </button>
        <span className="text-center text-[12px]" style={{ color: "rgba(255,255,255,0.66)", fontFamily: "'Inter', sans-serif" }}>Tap around — nothing changes until you unlock.</span>
      </div>
    </>
  );
}

// ── Purchase sheet: review → secure checkout (new tab) → waiting → unlocked
export function SkinPurchaseSheet({ req, owned, onClose, onEquip }) {
  // Frozen when the sheet opens, so the "done" check doesn't move.
  const [target] = useState(() => {
    if (req?.bundle) {
      const offer = bundleOffer(owned);
      return offer ? { ids: offer.skinIds, totalCents: offer.priceCents, title: offer.complete ? "The Originals" : "Complete the set", bundle: true } : null;
    }
    const skins = (req?.skinIds || []).map(skinById).filter(Boolean);
    return skins.length ? { ids: skins.map((s) => s.id), totalCents: skins.reduce((a, s) => a + s.priceCents, 0), title: skins.map((s) => s.name).join(" + "), bundle: false } : null;
  });
  const [stage, setStage] = useState("review"); // review | loading | ready | waiting
  const [url, setUrl] = useState(null);
  const [error, setError] = useState("");
  const done = !!target && target.ids.every((id) => owned.includes(id));
  const primary = target?.ids[0];

  if (!target) return null;

  const begin = async () => {
    setStage("loading");
    setError("");
    try {
      const u = await startSkinCheckout(target.bundle ? { bundle: true } : { skinIds: target.ids });
      setUrl(u);
      setStage("ready");
    } catch (err) {
      console.error("startSkinCheckout:", err);
      setError(friendlyError(err, "Couldn't start checkout — try again."));
      setStage("review");
    }
  };

  if (done) {
    const { T, fonts } = resolveLook(primary);
    const display = asFont(fonts.display);
    return (
      <div className="fixed inset-0 z-[80] flex flex-col items-center text-center px-7 pt-20 pb-10 gap-5" style={{ background: withAlpha(T.void, 0.96) || T.void }} role="dialog" aria-label="Skin unlocked">
        <div className="w-44 flex-shrink-0" style={{ borderRadius: 18, overflow: "hidden", boxShadow: "0 30px 60px -20px rgba(0,0,0,0.6)" }}>
          <MiniPreview lookId={primary} height={260} radius={18} />
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <span className="text-[11px] font-semibold" style={{ fontFamily: "'IBM Plex Mono', monospace", letterSpacing: "0.18em", color: T.alert }}>{target.ids.length > 1 ? "SKINS UNLOCKED" : "SKIN UNLOCKED"}</span>
          <span className="text-[36px] font-bold leading-none" style={{ ...display, color: T.ash }}>{target.ids.length > 1 ? `${target.ids.length} new skins` : skinById(primary)?.name}</span>
          <span className="text-[14px] max-w-[280px]" style={{ fontFamily: "'Inter', sans-serif", color: T.ashDim }}>Yours to keep. Switch any time from Profile → Appearance.</span>
        </div>
        <div className="mt-auto w-full flex flex-col gap-1.5">
          <button type="button" onClick={() => { onEquip(primary); onClose(); }} className="h-[52px] text-[17px] font-semibold" style={{ ...display, background: T.cta, color: T.inverse, borderRadius: 999 }}>
            Equip {target.ids.length > 1 ? skinById(primary)?.name : "now"}
          </button>
          <button type="button" onClick={onClose} className="h-11 text-[14px] font-semibold" style={{ fontFamily: "'Inter', sans-serif", color: T.ash }}>Not now</button>
        </div>
      </div>
    );
  }

  const navy = "#002C48";
  return (
    <div className="fixed inset-0 z-[80] flex flex-col justify-end" role="dialog" aria-label={`Unlock ${target.title}`}>
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 w-full h-full" style={{ background: "rgba(0,0,0,0.55)" }} />
      <div className="relative px-5 pt-2.5 pb-7 flex flex-col gap-4" style={{ background: "#FFFFFF", color: navy, borderRadius: "24px 24px 0 0", fontFamily: "'Inter', sans-serif" }}>
        <span aria-hidden="true" className="self-center" style={{ width: 40, height: 5, borderRadius: 999, background: "#D2D2CB" }} />
        {stage === "waiting" ? (
          <div role="status" className="flex flex-col items-center gap-3 text-center py-4">
            <span className="w-12 h-12 rounded-full ptr-spin" style={{ border: "4px solid #E7E7E1", borderTopColor: "#1554B8" }} />
            <span className="text-[20px] font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Confirming your purchase</span>
            <span className="text-[14px] leading-relaxed" style={{ color: "#4E5257" }}>{target.title} unlocks the moment Stripe confirms your payment — usually a few seconds. You can keep using Atlas meanwhile.</span>
            <div className="w-full flex flex-col gap-1 mt-1">
              <button type="button" onClick={onClose} className="h-12 text-[14px] font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif", background: navy, color: "#FFFFFF", borderRadius: 999 }}>Back to Atlas</button>
              {url && <a href={url} target="_blank" rel="noopener noreferrer" className="h-11 flex items-center justify-center text-[13px] font-semibold" style={{ color: "#1554B8" }}>Closed the checkout tab? Reopen it</a>}
            </div>
          </div>
        ) : (
          <>
            <div className="flex gap-3.5 items-center">
              <div className="w-16 flex-shrink-0" style={{ borderRadius: 10, overflow: "hidden", boxShadow: "0 6px 14px rgba(0,44,72,0.18)" }}>
                <MiniPreview lookId={primary} height={96} radius={10} compact />
              </div>
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-[10px]" style={{ fontFamily: "'IBM Plex Mono', monospace", letterSpacing: "0.14em", color: "#686C72" }}>{target.bundle ? `CORE COLLECTION · ${target.ids.length} SKINS` : "CORE COLLECTION"}</span>
                <span className="text-[20px] font-semibold leading-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{target.title}</span>
              </div>
            </div>
            <ul className="flex flex-col gap-2.5 text-[14px]" style={{ color: "#4E5257" }}>
              {["Restyles every screen in the player app", "Yours to keep, on every device you sign in on", "One-time purchase, no subscription"].map((t) => (
                <li key={t} className="flex gap-2.5 items-start"><Check size={17} color="#0F7A52" strokeWidth={2.6} className="flex-shrink-0 mt-0.5" />{t}</li>
              ))}
            </ul>
            <div className="flex justify-between items-baseline pt-3.5" style={{ borderTop: "1px solid #E7E7E1" }}>
              <span className="text-[14px] font-semibold">Total</span>
              <span className="text-[22px] font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{fmtSkinPrice(target.totalCents)}</span>
            </div>
            {error && <p className="text-[12px]" style={{ color: "#BC3327" }}>{error}</p>}
            <div className="flex flex-col gap-2">
              {stage === "ready" && url ? (
                <a href={url} target="_blank" rel="noopener noreferrer" onClick={() => setStage("waiting")} className="h-[52px] flex items-center justify-center gap-2 text-[15px] font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif", background: navy, color: "#FFFFFF", borderRadius: 999 }}>
                  Open secure checkout <ExternalLink size={16} />
                </a>
              ) : (
                <button type="button" onClick={begin} disabled={stage === "loading"} className="h-[52px] flex items-center justify-center gap-2 text-[15px] font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif", background: navy, color: "#FFFFFF", borderRadius: 999, opacity: stage === "loading" ? 0.6 : 1 }}>
                  {stage === "loading" ? "Preparing checkout…" : "Continue to secure checkout"}
                </button>
              )}
              <span className="text-center text-[12px]" style={{ color: "#686C72" }}>Opens Stripe in a new tab. Atlas stays open right here.</span>
            </div>
            <button type="button" onClick={onClose} className="self-center h-11 text-[14px] font-semibold" style={{ color: "#1554B8" }}>Keep previewing</button>
          </>
        )}
      </div>
    </div>
  );
}

// ── Event booking add-on ────────────────────────────────────────────────
// value: { bundle: boolean, skinIds: string[] }. Only rendered on bookings
// that go through Stripe (EventDetailScreen decides that).
export const EMPTY_SKIN_PICK = { bundle: false, skinIds: [] };

export function skinPickTotalCents(pick, owned) {
  if (pick?.bundle) return bundleOffer(owned)?.priceCents || 0;
  return (pick?.skinIds || []).reduce((sum, id) => sum + (skinById(id)?.priceCents || 0), 0);
}

export function skinPickRequest(pick) {
  if (pick?.bundle) return { bundle: true };
  return pick?.skinIds?.length ? { skinIds: pick.skinIds } : null;
}

export function SkinAddonPanel({ owned, value, onChange }) {
  const { T, display, body, mono } = useTheme();
  const available = SKINS.filter((s) => isOnSale(s) && !owned.includes(s.id));
  const offer = bundleOffer(owned);
  if (available.length === 0) return null;
  const pick = value || EMPTY_SKIN_PICK;
  const total = skinPickTotalCents(pick, owned);
  const toggle = (id) => {
    const cur = pick.bundle ? [] : pick.skinIds;
    onChange({ bundle: false, skinIds: cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id] });
  };
  return (
    <div className="p-4 flex flex-col gap-3" style={{ background: T.panel, borderRadius: T.rCard, boxShadow: T.shadowMd }}>
      <span className="text-[11px] font-semibold" style={{ ...mono, color: T.ashFaint, letterSpacing: "0.14em" }}>ADD A SKIN · OPTIONAL</span>
      <span className="text-[12px] leading-snug -mt-1.5" style={{ ...body, color: T.ashDim }}>Restyles the whole app. Unlocks as soon as this booking is paid — same checkout, no extra step.</span>
      <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${Math.min(available.length, 5)}, minmax(0, 1fr))` }}>
        {available.map((s) => {
          const on = pick.bundle ? !!offer?.skinIds.includes(s.id) : pick.skinIds.includes(s.id);
          return (
            <button key={s.id} type="button" aria-pressed={on} aria-label={`Add ${s.name} for ${fmtSkinPrice(s.priceCents)}`} onClick={() => toggle(s.id)} className="relative pt-2 pb-1.5 px-0.5 flex flex-col items-center gap-1" style={{ borderRadius: 12, background: on ? T.tint : T.panelAlt, border: `2px solid ${on ? T.accent : "transparent"}` }}>
              <span className="block" style={{ width: 38, height: 38, borderRadius: 999, background: s.swatch }} />
              <span className="text-[10px] font-semibold leading-tight text-center min-h-[23px]" style={{ ...body, color: T.ash }}>{s.name}</span>
              <span className="text-[10px]" style={{ ...mono, color: T.ashDim }}>{fmtSkinPrice(s.priceCents)}</span>
              {on && (
                <span className="absolute top-1 right-1 w-4 h-4 flex items-center justify-center" style={{ background: T.accent, borderRadius: 999 }}>
                  <Check size={10} color={T.inverse} strokeWidth={3.4} />
                </span>
              )}
            </button>
          );
        })}
      </div>
      {offer && (
        <button
          type="button"
          aria-pressed={!!pick.bundle}
          onClick={() => onChange(pick.bundle ? EMPTY_SKIN_PICK : { bundle: true, skinIds: [] })}
          className="flex items-center gap-2.5 min-h-[52px] px-3 py-2 text-left"
          style={{ borderRadius: 12, background: pick.bundle ? T.tint : T.panelAlt, border: `2px solid ${pick.bundle ? T.accent : "transparent"}` }}
        >
          <span className="w-5 h-5 flex-shrink-0 flex items-center justify-center" style={{ borderRadius: 5, border: `1.5px solid ${pick.bundle ? T.accent : T.line}`, background: pick.bundle ? T.accent : "transparent" }}>
            {pick.bundle && <Check size={13} color={T.inverse} strokeWidth={3} />}
          </span>
          <span className="flex flex-col flex-1">
            <span className="text-[14px] font-semibold" style={{ ...display, color: T.ash }}>{offer.complete ? "All 5 — The Originals" : `The other ${offer.skinIds.length} — The Originals`}</span>
            <span className="text-[11px]" style={{ ...body, color: T.ashDim }}>Bundle price</span>
          </span>
          <span className="text-[12px] font-semibold" style={{ ...mono, color: T.ash }}>{fmtSkinPrice(offer.priceCents)}</span>
        </button>
      )}
      <span className="text-[11px] leading-snug" style={{ ...body, color: T.ashFaint }}>
        {total > 0 ? `Adds ${fmtSkinPrice(total)} to this checkout. ` : ""}Skins are non-refundable and stay yours if this booking is canceled.
      </span>
    </div>
  );
}
