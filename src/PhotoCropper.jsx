// Photo crop / reposition tool (2026-11-08). Shown after a player picks a
// profile photo, so a face never ends up cut off:
//   step 1 "profile": the round photo everyone sees (baked into profile.jpg,
//          so every other screen and app keeps working unchanged)
//   step 2 "card":    the trading-card framing (stored as numbers on the
//          public profile; can be changed later without re-uploading)
// mode "card" opens straight on step 2 for an already-uploaded photo.
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "./hooks/useTheme";
import { DEFAULT_CROP, MIN_ZOOM, MAX_ZOOM, CARD_ASPECT, clampCrop, cropBackground, cropRect, loadImageFile, renderCrop, renderScaled } from "./lib/cardCrop";

const PROFILE_OUT = 800;   // round profile photo, px square
const ORIGINAL_MAX = 1200; // the stored full photo (card source), long side

function CropFrame({ url, aspect, frameAspect, crop, setCrop, round, width }) {
  const ref = useRef(null);
  const pointers = useRef(new Map());
  const pinch = useRef(null);
  const height = width / frameAspect;

  const onDown = (e) => {
    ref.current?.setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinch.current = { dist: Math.hypot(a.x - b.x, a.y - b.y), zoom: crop.zoom };
    }
  };
  const onMove = (e) => {
    const prev = pointers.current.get(e.pointerId);
    if (!prev) return;
    const next = { x: e.clientX, y: e.clientY };
    pointers.current.set(e.pointerId, next);
    if (pointers.current.size >= 2 && pinch.current) {
      const [a, b] = [...pointers.current.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      const zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, pinch.current.zoom * (d / Math.max(1, pinch.current.dist))));
      setCrop((c) => clampCrop(aspect, frameAspect, { ...c, zoom }));
      return;
    }
    const { sw, sh } = cropRect(aspect, 1, frameAspect, crop);
    const dx = ((next.x - prev.x) / width) * sw;
    const dy = ((next.y - prev.y) / height) * sh;
    setCrop((c) => clampCrop(aspect, frameAspect, { ...c, x: c.x - dx / aspect, y: c.y - dy }));
  };
  const onUp = (e) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
  };

  return (
    <div
      ref={ref}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      style={{
        width, height, position: "relative", overflow: "hidden", touchAction: "none", cursor: "grab",
        borderRadius: round ? 0 : 14, background: "#111",
        ...cropBackground(url, aspect, frameAspect, crop),
      }}
    >
      {round ? (
        <div style={{ position: "absolute", inset: 0, borderRadius: "50%", boxShadow: "0 0 0 9999px rgba(0,0,0,0.55)", border: "2px solid rgba(255,255,255,0.85)", pointerEvents: "none" }} />
      ) : (
        <div style={{ position: "absolute", inset: 0, borderRadius: 14, border: "2px solid rgba(255,255,255,0.85)", pointerEvents: "none" }} />
      )}
    </div>
  );
}

export default function PhotoCropper({ file, mode = "full", imageUrl, imageAspect, initialCardCrop, onCancel, onSave }) {
  const { T, display, body, mono } = useTheme();
  const [img, setImg] = useState(null);
  const [url, setUrl] = useState(mode === "card" ? imageUrl : null);
  const [aspect, setAspect] = useState(mode === "card" ? (Number(imageAspect) > 0 ? Number(imageAspect) : 1) : 1);
  const [step, setStep] = useState(mode === "card" ? "card" : "profile");
  const [profileCrop, setProfileCrop] = useState(DEFAULT_CROP);
  const [cardCrop, setCardCrop] = useState(initialCardCrop || DEFAULT_CROP);
  const [cardTouched, setCardTouched] = useState(!!initialCardCrop);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [vw, setVw] = useState(() => (typeof window !== "undefined" ? window.innerWidth : 390));

  useEffect(() => {
    const onResize = () => setVw(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (mode === "card" || !file) return undefined;
    let objUrl = null;
    let cancelled = false;
    loadImageFile(file)
      .then(({ img: loaded, url: u }) => {
        objUrl = u;
        if (cancelled) return;
        setImg(loaded);
        setUrl(u);
        setAspect((loaded.naturalWidth || 1) / (loaded.naturalHeight || 1));
      })
      .catch((err) => setError(err.message || "Couldn't read that image."));
    return () => { cancelled = true; if (objUrl) URL.revokeObjectURL(objUrl); };
  }, [file, mode]);

  // The card starts where the profile photo was centered, until adjusted.
  const goToCard = () => {
    if (!cardTouched) setCardCrop(clampCrop(aspect, CARD_ASPECT, { x: profileCrop.x, y: profileCrop.y, zoom: 1 }));
    setStep("card");
  };

  const setCard = (fn) => { setCardTouched(true); setCardCrop(fn); };

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      if (mode === "card") {
        await onSave({ cardCrop: clampCrop(aspect, CARD_ASPECT, cardCrop) });
      } else {
        const [profileBlob, original] = await Promise.all([
          renderCrop(img, 1, profileCrop, PROFILE_OUT),
          renderScaled(img, ORIGINAL_MAX),
        ]);
        await onSave({
          profileBlob,
          originalBlob: original.blob,
          aspect: original.width / original.height,
          cardCrop: clampCrop(aspect, CARD_ASPECT, cardCrop),
        });
      }
    } catch (err) {
      setError(err?.message || "Couldn't save that photo — try again.");
      setSaving(false);
    }
  };

  const frameAspect = step === "profile" ? 1 : CARD_ASPECT;
  const crop = step === "profile" ? profileCrop : cardCrop;
  const setCrop = step === "profile" ? setProfileCrop : setCard;
  const width = useMemo(() => {
    const maxW = Math.min(vw - 48, 340);
    const maxH = (typeof window !== "undefined" ? window.innerHeight : 700) * 0.52;
    return Math.max(180, Math.min(maxW, maxH * frameAspect));
  }, [vw, frameAspect]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center px-6" style={{ background: "rgba(0,0,0,0.92)" }}>
      <div className="text-[11px] font-semibold uppercase mb-1" style={{ ...mono, color: T.ashFaint, letterSpacing: "0.12em" }}>
        {mode === "card" ? "Card photo" : step === "profile" ? "Step 1 of 2 · Profile photo" : "Step 2 of 2 · Card photo"}
      </div>
      <div className="text-[17px] font-semibold mb-1 text-center" style={{ ...display, color: "#fff" }}>
        {step === "profile" ? "Position your profile photo" : "Position your trading card photo"}
      </div>
      <div className="text-[12px] mb-4 text-center" style={{ ...body, color: "rgba(255,255,255,0.65)" }}>
        Drag to move · pinch or use the slider to zoom
      </div>

      {url ? (
        <CropFrame url={url} aspect={aspect} frameAspect={frameAspect} crop={crop} setCrop={setCrop} round={step === "profile"} width={width} />
      ) : (
        <div style={{ width, height: width / frameAspect, background: "#111", borderRadius: 14 }} />
      )}

      <input
        type="range"
        min={MIN_ZOOM}
        max={MAX_ZOOM}
        step={0.01}
        value={crop.zoom}
        onChange={(e) => { const zoom = Number(e.target.value); setCrop((c) => clampCrop(aspect, frameAspect, { ...c, zoom })); }}
        className="mt-4"
        style={{ width, accentColor: T.accent }}
        aria-label="Zoom"
      />

      {error && <div className="mt-3 text-[12px] text-center" style={{ ...body, color: T.alert }}>{error}</div>}

      <div className="flex gap-2 mt-5" style={{ width }}>
        <button
          onClick={step === "card" && mode !== "card" ? () => setStep("profile") : onCancel}
          disabled={saving}
          className="flex-1 py-2.5 text-[13px] font-semibold"
          style={{ ...body, border: "1px solid rgba(255,255,255,0.3)", color: "#fff", borderRadius: T.rPill }}
        >
          {step === "card" && mode !== "card" ? "Back" : "Cancel"}
        </button>
        <button
          onClick={step === "profile" ? goToCard : save}
          disabled={saving || !url}
          className="flex-1 py-2.5 text-[13px] font-semibold"
          style={{ ...display, background: T.cta, color: T.inverse, borderRadius: T.rPill, opacity: saving || !url ? 0.6 : 1 }}
        >
          {saving ? "Saving…" : step === "profile" ? "Next" : "Save"}
        </button>
      </div>
    </div>
  );
}
