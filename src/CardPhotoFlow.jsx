// Card photo choice + paid card photo changes + photo reports (2026-11-26).
// Scope: project doc claude/atlas-card-photo-change-scope.md.
//
// Profile photos are free and unlimited (useAuth.uploadAvatar). After one is
// saved the app asks "use this for your trading card, or a different photo?".
// The first card photo is free; every change after that is $3.99 (one Stripe
// payment = one change). The server (setCardPhoto) decides what's free and
// what needs paying; the app only reads the same numbers to explain it.
// Payment opens Stripe in a new tab; the credit only exists once the webhook
// has run, and the photo is saved the moment it shows up.
import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { collection, doc, onSnapshot, query, where, limit } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { auth, db, functions as firebaseFunctions } from "./lib/firebase";
import { useTheme } from "./hooks/useTheme";
import { useHideBottomNav } from "./lib/hideNav";
import { onCardPhotoOffer } from "./lib/cardPhotoBus";
import { loadImageFile, renderScaled } from "./lib/cardCrop";
import PhotoCropper from "./PhotoCropper";

export const CARD_PHOTO_PRICE = "$3.99";
const CARD_SOURCE_MAX = 1200; // long side, same as the old card-photo.jpg

const FRIENDLY = ["failed-precondition", "invalid-argument", "already-exists", "not-found", "permission-denied", "unauthenticated"];
const friendlyError = (err, fallback) => {
  const code = String(err?.code || "").replace(/^functions\//, "");
  return FRIENDLY.includes(code) && err?.message ? err.message : fallback;
};

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] || "");
    reader.onerror = () => reject(reader.error || new Error("Couldn't read the image."));
    reader.readAsDataURL(blob);
  });
}

// How many card photos this card has had (0 = the free one is still unused).
function useCardPhotoChanges(uid, dependentId) {
  const [state, setState] = useState({ changes: null, hasPhoto: false });
  useEffect(() => {
    if (!uid) return undefined;
    const ref = dependentId ? doc(db, "users", uid, "dependents", dependentId) : doc(db, "publicProfiles", uid);
    return onSnapshot(ref, (s) => {
      const d = s.exists() ? s.data() : {};
      setState({ changes: Number.isInteger(d.cardPhotoChanges) ? d.cardPhotoChanges : 0, hasPhoto: !!d.cardPhotoUrl });
    }, () => setState({ changes: 0, hasPhoto: false }));
  }, [uid, dependentId]);
  return state;
}

// A paid, unused change (created only by the Stripe webhook).
function useUnusedCredit(uid) {
  const [has, setHas] = useState(false);
  useEffect(() => {
    if (!uid) return undefined;
    const q = query(collection(db, "cardPhotoCredits"), where("uid", "==", uid), where("used", "==", false), limit(1));
    return onSnapshot(q, (s) => setHas(!s.empty), () => setHas(false));
  }, [uid]);
  return has;
}

export function cardPhotoCostLine(changes) {
  return changes > 0
    ? `Your free card photo is used. Each change is ${CARD_PHOTO_PRICE}.`
    : `Your first card photo is free. Each change after that is ${CARD_PHOTO_PRICE}.`;
}

// Mounted once in App. Opens when something calls offerCardPhoto().
export function CardPhotoChooser({ uid }) {
  const [offer, setOffer] = useState(null);
  useEffect(() => onCardPhotoOffer((o) => setOffer({ ...o, key: Date.now() })), []);
  if (!uid || !offer) return null;
  return <ChooserFlow key={offer.key} uid={uid} offer={offer} onClose={() => setOffer(null)} />;
}

function ChooserFlow({ uid, offer, onClose }) {
  const { T, display, body, mono } = useTheme();
  useHideBottomNav();
  const dependentId = offer.dependentId || null;
  const { changes, hasPhoto } = useCardPhotoChanges(uid, dependentId);
  const hasCredit = useUnusedCredit(uid);
  const free = changes === 0;
  const canChange = free || hasCredit;
  // pending = the photo picked for the card: { blob, aspect, url, cardCrop? }
  const [pending, setPending] = useState(null);
  const [stage, setStage] = useState(offer.blob ? "choose" : "pick"); // choose | pick | crop | pay | ready | waiting | saving | done
  const [error, setError] = useState("");
  const [checkoutUrl, setCheckoutUrl] = useState(null);
  const fileRef = useRef(null);
  const offerUrl = useRef(null);
  const submitting = useRef(false);

  useEffect(() => {
    if (offer.blob) offerUrl.current = URL.createObjectURL(offer.blob);
    return () => { if (offerUrl.current) URL.revokeObjectURL(offerUrl.current); };
  }, [offer.blob]);

  const submit = async (p) => {
    if (submitting.current) return;
    submitting.current = true;
    setStage("saving");
    setError("");
    try {
      const imageBase64 = await blobToBase64(p.blob);
      await httpsCallable(firebaseFunctions, "setCardPhoto")({ imageBase64, aspect: p.aspect, cardCrop: p.cardCrop || null, dependentId });
      setStage("done");
    } catch (err) {
      console.error("setCardPhoto failed:", err);
      if (err?.details?.needsPayment) { setStage("pay"); }
      else { setError(friendlyError(err, "Couldn't save your card photo. Try again.")); setStage("crop-or-retry"); }
    } finally {
      submitting.current = false;
    }
  };

  // A kid's card has no crop step (centered, as in v1).
  const afterPick = (p) => {
    setPending(p);
    if (dependentId) { if (canChange) submit(p); else setStage("pay"); }
    else setStage("crop");
  };

  // Once a paid change shows up (webhook ran), save the waiting photo.
  useEffect(() => {
    if (stage === "waiting" && hasCredit && pending) submit(pending);
  }, [stage, hasCredit, pending]); // eslint-disable-line react-hooks/exhaustive-deps

  const loaded = changes != null;
  const useOffered = () => afterPick({ blob: offer.blob, aspect: Number(offer.aspect) || 1, url: offerUrl.current });

  const pickFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Please choose an image file."); return; }
    setError("");
    try {
      const { img, url } = await loadImageFile(file);
      const scaled = await renderScaled(img, CARD_SOURCE_MAX);
      URL.revokeObjectURL(url);
      afterPick({ blob: scaled.blob, aspect: scaled.width / scaled.height, url: URL.createObjectURL(scaled.blob) });
    } catch (err) {
      setError(err?.message || "Couldn't read that image.");
    }
  };

  const startCheckout = async () => {
    setError("");
    setStage("loading");
    try {
      const res = await httpsCallable(firebaseFunctions, "createCardPhotoCheckout")({});
      setCheckoutUrl(res.data.url);
      setStage("ready");
    } catch (err) {
      const code = String(err?.code || "").replace(/^functions\//, "");
      if (code === "already-exists" && pending) { setStage("waiting"); return; } // already paid for one
      setError(friendlyError(err, "Couldn't start checkout. Try again."));
      setStage("pay");
    }
  };

  const who = dependentId ? `${offer.callsign || "your child"}'s card` : "your trading card";
  const sheet = (children) => createPortal(
    <div className="fixed inset-0 flex flex-col justify-end" style={{ zIndex: 2050 }} role="dialog" aria-label="Card photo">
      <button type="button" aria-label="Close" onClick={stage === "saving" ? undefined : onClose} className="absolute inset-0 w-full h-full" style={{ background: "rgba(0,0,0,0.6)" }} />
      <div className="relative px-5 pt-3 pb-8 flex flex-col gap-3" style={{ background: T.panel, borderRadius: "22px 22px 0 0", boxShadow: T.shadowMd }}>
        <span aria-hidden="true" className="self-center" style={{ width: 40, height: 5, borderRadius: 999, background: T.line }} />
        {children}
        {error && <div className="text-[12px] text-center" style={{ ...body, color: T.alert }}>{error}</div>}
      </div>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={pickFile} />
    </div>,
    document.body
  );
  const primary = { ...display, background: T.cta, color: T.inverse, borderRadius: T.rPill };
  const secondary = { ...body, border: `1px solid ${T.line}`, color: T.ash, borderRadius: T.rPill };
  const cost = changes == null ? "" : canChange && !free ? `You have a paid card photo change ready to use.` : cardPhotoCostLine(changes);
  const Eyebrow = ({ children }) => <div className="text-[11px] font-semibold uppercase text-center" style={{ ...mono, color: T.ashFaint, letterSpacing: "0.12em" }}>{children}</div>;

  if (stage === "crop" && pending) {
    return (
      <PhotoCropper
        mode="card"
        imageUrl={pending.url}
        imageAspect={pending.aspect}
        onCancel={() => { setPending(null); setStage(offer.blob ? "choose" : "pick"); }}
        onSave={async ({ cardCrop }) => {
          const p = { ...pending, cardCrop };
          setPending(p);
          if (canChange) await submit(p); else setStage("pay");
        }}
      />
    );
  }

  if (stage === "choose") {
    return sheet(
      <>
        <Eyebrow>Trading card photo</Eyebrow>
        <div className="flex justify-center">
          <div style={{ width: 96, height: 96, borderRadius: 999, backgroundImage: `url("${offerUrl.current}")`, backgroundSize: "cover", backgroundPosition: "center", border: `1px solid ${T.line}` }} />
        </div>
        <div className="text-[18px] font-semibold text-center" style={{ ...display, color: T.ash }}>Use this photo on your trading card?</div>
        <div className="text-[13px] text-center" style={{ ...body, color: T.ashDim }}>
          Your profile photo is saved. You can change it any time for free. {cost}
        </div>
        <button onClick={useOffered} disabled={!loaded} className="h-12 text-[15px] font-semibold" style={{ ...primary, opacity: loaded ? 1 : 0.6 }}>
          Use this as my card photo{!canChange && changes != null ? ` · ${CARD_PHOTO_PRICE}` : ""}
        </button>
        <button onClick={() => fileRef.current?.click()} disabled={!loaded} className="h-11 text-[14px] font-semibold" style={secondary}>Use a different photo</button>
        <button onClick={onClose} className="h-10 text-[13px] font-semibold" style={{ ...body, color: T.ashDim }}>
          {hasPhoto ? "Keep my current card photo" : "Not now"}
        </button>
      </>
    );
  }

  if (stage === "pick" || stage === "crop-or-retry") {
    return sheet(
      <>
        <Eyebrow>Trading card photo</Eyebrow>
        <div className="text-[18px] font-semibold text-center" style={{ ...display, color: T.ash }}>Choose a photo for {who}</div>
        <div className="text-[13px] text-center" style={{ ...body, color: T.ashDim }}>
          {dependentId ? "It must be a clear photo of your child. " : "It must be a clear photo of you. "}{cost}
        </div>
        {stage === "crop-or-retry" && pending ? (
          <button onClick={() => submit(pending)} className="h-12 text-[15px] font-semibold" style={primary}>Try again</button>
        ) : (
          <button onClick={() => fileRef.current?.click()} disabled={!loaded} className="h-12 text-[15px] font-semibold" style={{ ...primary, opacity: loaded ? 1 : 0.6 }}>Choose a photo</button>
        )}
        <button onClick={onClose} className="h-10 text-[13px] font-semibold" style={{ ...body, color: T.ashDim }}>Cancel</button>
      </>
    );
  }

  if (stage === "pay" || stage === "loading" || stage === "ready") {
    return sheet(
      <>
        <Eyebrow>Card photo change</Eyebrow>
        <div className="text-[22px] font-semibold text-center" style={{ ...display, color: T.ash }}>{CARD_PHOTO_PRICE}</div>
        <div className="text-[13px] text-center" style={{ ...body, color: T.ashDim }}>
          Your free card photo has been used. Each new card photo is {CARD_PHOTO_PRICE}. Your new photo goes on {who} as soon as the payment goes through.
        </div>
        {stage === "ready" && checkoutUrl ? (
          <a href={checkoutUrl} target="_blank" rel="noopener noreferrer" onClick={() => setStage("waiting")}
            className="h-12 flex items-center justify-center text-[15px] font-semibold" style={primary}>Pay {CARD_PHOTO_PRICE}</a>
        ) : (
          <button onClick={startCheckout} disabled={stage === "loading"} className="h-12 text-[15px] font-semibold" style={{ ...primary, opacity: stage === "loading" ? 0.6 : 1 }}>
            {stage === "loading" ? "Starting checkout…" : "Continue to payment"}
          </button>
        )}
        <button onClick={onClose} className="h-10 text-[13px] font-semibold" style={{ ...body, color: T.ashDim }}>Cancel</button>
      </>
    );
  }

  if (stage === "waiting") {
    return sheet(
      <>
        <Eyebrow>Card photo change</Eyebrow>
        <div className="text-[18px] font-semibold text-center" style={{ ...display, color: T.ash }}>Confirming your payment</div>
        <div className="text-[13px] text-center" style={{ ...body, color: T.ashDim }}>
          Finish checking out in the tab that opened. Your photo is saved the moment Stripe confirms it, usually a few seconds. Keep this open until then.
        </div>
        {checkoutUrl && <a href={checkoutUrl} target="_blank" rel="noopener noreferrer" className="h-11 flex items-center justify-center text-[13px] font-semibold" style={{ ...body, color: T.accent }}>Closed the checkout tab? Reopen it</a>}
        <button onClick={onClose} className="h-10 text-[13px] font-semibold" style={{ ...body, color: T.ashDim }}>Close</button>
        <div className="text-[11px] text-center" style={{ ...body, color: T.ashFaint }}>If you close this, the payment still counts. Pick your photo again and it's used then.</div>
      </>
    );
  }

  if (stage === "saving") {
    return sheet(<div className="text-[15px] font-semibold text-center py-6" style={{ ...display, color: T.ash }}>Saving your card photo…</div>);
  }

  // done
  return sheet(
    <>
      <div className="text-[18px] font-semibold text-center" style={{ ...display, color: T.ash }}>Card photo updated</div>
      <div className="text-[13px] text-center" style={{ ...body, color: T.ashDim }}>It's on {who} now.</div>
      <button onClick={onClose} className="h-12 text-[15px] font-semibold" style={primary}>Done</button>
    </>
  );
}

// ---------------------------------------------------------------------------
// Reports: profile photos, cards and public child photos. A photo is hidden
// after reports from 3 different players until Atlas looks at it.
// ---------------------------------------------------------------------------

export function ReportPhotoButton({ ownerKind, ownerId, target, label, light = false }) {
  const { T, display, body } = useTheme();
  const [open, setOpen] = useState(false);
  const [state, setState] = useState("idle"); // idle | sending | sent
  const [error, setError] = useState("");
  const me = auth.currentUser?.uid;
  if (!ownerId || !me || (ownerKind === "adult" && ownerId === me)) return null;
  const send = async () => {
    setState("sending");
    setError("");
    try {
      await httpsCallable(firebaseFunctions, "reportPhoto")({ ownerKind, ownerId, target });
      setState("sent");
    } catch (err) {
      console.error("reportPhoto failed:", err);
      setError(friendlyError(err, "Couldn't send that. Try again."));
      setState("idle");
    }
  };
  return (
    <>
      <button onClick={() => { setOpen(true); setState("idle"); setError(""); }} className="text-[11px] font-semibold underline"
        style={{ ...body, color: light ? "rgba(255,255,255,0.6)" : T.ashFaint }}>
        {label || "Report photo"}
      </button>
      {open && createPortal(
        <div className="fixed inset-0 flex items-center justify-center px-6" style={{ zIndex: 2300, background: "rgba(0,0,0,0.6)" }} role="dialog" aria-label="Report photo">
          <div className="w-full p-5 flex flex-col gap-3" style={{ maxWidth: 360, background: T.panel, borderRadius: T.rCard, boxShadow: T.shadowMd }}>
            {state === "sent" ? (
              <>
                <div className="text-[16px] font-semibold" style={{ ...display, color: T.ash }}>Thanks, we got it</div>
                <div className="text-[13px]" style={{ ...body, color: T.ashDim }}>If more players report this photo, it's hidden until Atlas looks at it.</div>
                <button onClick={() => setOpen(false)} className="h-11 text-[14px] font-semibold" style={{ ...display, background: T.cta, color: T.inverse, borderRadius: T.rPill }}>OK</button>
              </>
            ) : (
              <>
                <div className="text-[16px] font-semibold" style={{ ...display, color: T.ash }}>Report this photo?</div>
                <div className="text-[13px]" style={{ ...body, color: T.ashDim }}>
                  Report a photo that's inappropriate or isn't a photo of the player. A photo is hidden after reports from 3 different players until Atlas looks at it. The player isn't told who reported it.
                </div>
                {error && <div className="text-[12px]" style={{ ...body, color: T.alert }}>{error}</div>}
                <div className="flex gap-2">
                  <button onClick={() => setOpen(false)} className="flex-1 h-11 text-[14px] font-semibold" style={{ ...body, border: `1px solid ${T.line}`, color: T.ash, borderRadius: T.rPill }}>Cancel</button>
                  <button onClick={send} disabled={state === "sending"} className="flex-1 h-11 text-[14px] font-semibold" style={{ ...display, background: T.alert, color: T.onAlert || "#fff", borderRadius: T.rPill, opacity: state === "sending" ? 0.6 : 1 }}>
                    {state === "sending" ? "Sending…" : "Report"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
