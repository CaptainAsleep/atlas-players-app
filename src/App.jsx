import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Compass, Heart, Calendar, Inbox, User, ChevronLeft, Share2, Users, Shield,
  Search, SlidersHorizontal, MapPin, Star, Check, Plus, Crosshair,
  ArrowRight, ChevronRight, LogOut, MessageCircle, Ticket, Radio, Camera, Phone, BadgeCheck, FileSignature, RefreshCw, Maximize2, X, TreePine, ChevronsUp, Home, Trophy
} from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import QRCode from "qrcode";
import { useFields } from "./hooks/useFields";
import { useEvents } from "./hooks/useEvents";
import { useAuth } from "./hooks/useAuth";
import { useFavorites, useEventInterested } from "./hooks/useFavorites";
import { usePatches } from "./hooks/usePatches";
import { useSWUpdate } from "./hooks/useSWUpdate";
import { useAllTeams, useTeam, useTeamActions, useMyOfficerRequest, useOfficerRequests } from "./hooks/useTeams";
import { usePublicProfile, useAllPublicProfiles } from "./hooks/usePublicProfiles";
import { useFriends, useIncomingRequests, useOutgoingRequestUids, useFriendActions } from "./hooks/useFriends";
import { CURRENT_TERMS_VERSION, TERMS_OF_USE, PRIVACY_POLICY, EULA } from "./legalText";
import { useAchievementCatalog, redeemPatchCode } from "./hooks/useAchievementCatalog";
import { evaluateAchievements } from "./achievementEngine";
import { useWaiverSignature } from "./hooks/useWaiverSignature";
import { useMyBooking, useEventBookings, useMyBookings, useBookingActions } from "./hooks/useBookings";
import { useMyVouchers, useCancellationNotices, useVoucherRedemption } from "./hooks/useVouchersAndNotices";
import { FONTS } from "./theme";
import { ThemeProvider, useTheme } from "./hooks/useTheme";

/* ---------- design tokens ---------- */
// Theme-aware now — see src/theme.js (LIGHT_T/DARK_T) and
// src/hooks/useTheme.jsx. Every component that needs T/display/body/mono
// pulls the active set via useTheme() rather than a module-level constant.

/* ---------- helpers ---------- */
// Deterministic placeholder gradient per field/event until real photos exist.
const GRADIENTS = [
  "linear-gradient(160deg,#1b3a56,#0a2138 65%,#081a2c)",
  "linear-gradient(160deg,#3a5170,#1c3550 65%,#122840)",
  "linear-gradient(160deg,#254768,#0e2c47 65%,#081a2c)",
  "linear-gradient(160deg,#2c4a6b,#12314f 65%,#0a2138)",
  "linear-gradient(160deg,#1f3f5e,#0c2740 65%,#081a2c)",
];
function gradFor(seed = "") {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return GRADIENTS[h % GRADIENTS.length];
}
// Real photo when we have one, dark overlay for text legibility; falls back
// to the deterministic gradient when no imageUrl exists yet.
function heroStyle(imageUrl, seed) {
  if (!imageUrl) return { background: gradFor(seed) };
  return {
    backgroundImage: `linear-gradient(180deg, rgba(10,10,11,0.15), rgba(10,10,11,0.85)), url("${imageUrl}")`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  };
}
// Full US state list — built in now so the state picker is ready to go the
// moment we have field data beyond Michigan, without any rework later.
const US_STATES = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
  CO: "Colorado", CT: "Connecticut", DE: "Delaware", FL: "Florida", GA: "Georgia",
  HI: "Hawaii", ID: "Idaho", IL: "Illinois", IN: "Indiana", IA: "Iowa",
  KS: "Kansas", KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland",
  MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi", MO: "Missouri",
  MT: "Montana", NE: "Nebraska", NV: "Nevada", NH: "New Hampshire", NJ: "New Jersey",
  NM: "New Mexico", NY: "New York", NC: "North Carolina", ND: "North Dakota", OH: "Ohio",
  OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina",
  SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont",
  VA: "Virginia", WA: "Washington", WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming",
};
// Fields store city as "City, ST" — pull the state out of that rather than
// requiring a schema change across every existing record.
function stateNameFromCity(city) {
  if (!city) return null;
  const match = city.match(/,\s*([A-Z]{2})\s*$/);
  if (match) return US_STATES[match[1]] || null;
  const trimmed = city.trim();
  return Object.values(US_STATES).includes(trimmed) ? trimmed : null; // handles a bare state name like Sektor7's "Michigan"
}
// Combines a field's street address with its city/state for display,
// without duplicating — older scraped addresses already have city/state
// baked into the string (e.g. "1154 W Seidlers Rd, Auburn, MI 48611"),
// while newly owner-entered addresses may just be the street part now that
// city/state are separate fields in the owner app. Checking whether the
// city already appears in the address avoids showing it twice either way.
function fullAddress(field) {
  if (!field?.address) return field?.city || "";
  if (!field?.city) return field.address;
  const cityPart = field.city.split(",")[0]?.trim().toLowerCase();
  if (cityPart && field.address.toLowerCase().includes(cityPart)) {
    return field.address;
  }
  return `${field.address}, ${field.city}`;
}
// Optional `url` lets a caller share a deep link (e.g. a field's
// ?field=<slug> page, which App() reads back out of the URL on load) —
// callers that don't pass one still get the app's general link, not a
// broken link that looks like it should open straight to something but
// doesn't. Native share sheet where available (uses navigator.share, real
// support on iOS/Android); falls back to copying text to the clipboard on
// desktop browsers that don't support it. Returns "shared", "copied", or
// "cancelled" so the caller can decide whether to show a confirmation.
//
// On whether the shared link opens the installed PWA or a browser tab:
// Android Chrome will capture it into the installed app, now that
// handle_links is set in vite.config.js's manifest — but only if the PWA
// was originally installed via Chrome specifically; Edge/Firefox installs
// fall back to an in-app browser instead. On iOS, this is a real,
// confirmed platform wall, not a missing setting — Safari opens every
// link itself regardless of PWA install status, and there is currently no
// workaround (confirmed on Apple's own developer forums, still true as of
// iOS 18). No code change here or anywhere else can fix that half of it.
async function shareContent(title, text, url) {
  const shareUrl = url || "https://playerapp.airsoftatlas.app";
  if (navigator.share) {
    try {
      await navigator.share({ title, text, url: shareUrl });
      return "shared";
    } catch (err) {
      return "cancelled"; // person backed out of the share sheet — not an error
    }
  }
  if (navigator.clipboard) {
    await navigator.clipboard.writeText(`${text} ${shareUrl}`);
    return "copied";
  }
  return "unsupported";
}
// The one hardcoded gate for the Secret Agent QR button — replace with
// the real UID from Firebase console → Authentication → Users before this
// goes live. Everything else in the redemption flow is generic; this is
// the only spot identity actually matters.
const ATLAS_OWNER_UID = "lg4HMLTJvsPfSEN1pvNhMV4fbct1";
const NEARBY_RADIUS_MILES = 50;
// Prices come from real scraped listings as free text ("$20", "$20/person",
// "varies") — pull out the first number we can find. Events with no
// parseable number (e.g. "varies") are treated as unknown and always pass
// the price filter rather than being hidden just because we can't read them.
function parsePrice(str) {
  const m = (str || "").match(/[\d.]+/);
  return m ? parseFloat(m[0]) : null;
}
// A bare "varies" reads as a typo or unfinished UI out of context (event
// cards, lists) — spelling out "Price varies" only where there's no
// surrounding label to make that clear. The event's own detail page already
// has "Entry Cost" right above it, so it stays as the raw value there.
function displayPrice(price) {
  return price && price.trim().toLowerCase() === "varies" ? "Price varies" : price;
}
// Haversine formula — straight-line distance between two lat/lng points,
// accurate enough for "how far is this field" without needing a routing API.
// new Date().toISOString() converts to UTC before formatting, which silently
// rolls "today" over to tomorrow during evening hours in US timezones (UTC
// is ahead of local time). This uses the browser's own local date fields
// instead, so "today" always matches what's actually on the user's device.
function localDateStr(d = new Date()) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
function distanceMiles(lat1, lng1, lat2, lng2) {
  const R = 3958.8;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
function timeBasedGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}
// Best-effort location for the Walk-On Survivor check — resolves to null
// (never rejects) on missing geolocation support, a denied/dismissed
// permission prompt, or a timeout, so a booking never waits on or fails
// because of this. A short timeout on purpose: this only matters for
// someone's very first booking, so it's fine to just skip the patch
// rather than make them wait on a slow GPS fix.
function getQuickLocation(timeoutMs = 4000) {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(null),
      { timeout: timeoutMs, maximumAge: 60000 }
    );
  });
}
// Native <input type="time"> (owner app) stores/emits 24-hour "HH:MM".
// Older events may still carry a free-text value like "9:00 AM (gates)"
// from before that field was a time picker — that won't match the
// pattern below, so it's returned as-is rather than mangled.
function formatTimeStr(t) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(t || "");
  if (!m) return t || "";
  let h = parseInt(m[1], 10);
  const suffix = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m[2]} ${suffix}`;
}
function formatDate(dateStr, endDateStr) {
  if (!dateStr) return "";
  const opts = { weekday: "short", month: "short", day: "numeric" };
  const start = new Date(dateStr + "T00:00:00");
  const startFmt = start.toLocaleDateString("en-US", opts);
  if (!endDateStr) return startFmt;
  const end = new Date(endDateStr + "T00:00:00");
  return `${startFmt} – ${end.toLocaleDateString("en-US", opts)}`;
}
// Downscales/compresses a picked photo client-side before it ever leaves the
// device — phone camera photos can be 10MB+, and an avatar only ever needs
// to be a few hundred pixels. Keeps uploads fast and Storage costs near zero.
function resizeImageFile(file, maxSize = 400, quality = 0.85) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Couldn't read that file."));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error("That doesn't look like a valid image."));
      img.onload = () => {
        let { width, height } = img;
        if (width > height && width > maxSize) {
          height = Math.round((height * maxSize) / width);
          width = maxSize;
        } else if (height >= width && height > maxSize) {
          width = Math.round((width * maxSize) / height);
          height = maxSize;
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Couldn't process that image."))), "image/jpeg", quality);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}
const STATUS_LABEL = {
  active: null,
  closing: "FIELD CLOSING",
  closed: "FIELD CLOSED",
  relocated: "RELOCATED",
  rebranded: "REBRANDED",
  unscrapable: null,
  facebook_only: null,
  "no-airsoft": "NOT AN AIRSOFT FIELD",
  // Deliberately NOT in this map — private-booking isn't a problem worth an
  // alert-red banner, just a different (and fully legitimate) business
  // model. It gets its own neutral tag + copy below instead.
};

/* ---------- primitives ---------- */
function Tag({ children, tone = "neutral" }) {
  const { T, display, body, mono } = useTheme();
  const map = {
    neutral: { border: "transparent", color: "#FFFFFF", bg: "rgba(255,255,255,0.16)" },
    accent: { border: "transparent", color: T.inverse, bg: T.cta },
    good: { border: "transparent", color: T.inverse, bg: T.good },
    live: { border: "transparent", color: T.inverse, bg: T.alert },
    alert: { border: "transparent", color: T.inverse, bg: T.alert },
  };
  const s = map[tone];
  return (
    <span
      className="text-[10px] font-semibold px-2.5 py-1.5 inline-flex items-center"
      style={{
        ...mono,
        letterSpacing: "0.04em",
        border: s.bg ? "none" : `1px solid ${s.border}`,
        background: s.bg || "transparent",
        color: s.color,
        borderRadius: T.rPill,
      }}
    >
      {children}
    </span>
  );
}

function ScreenHeader({ title }) {
  const { T, display, body, mono } = useTheme();
  return (
    <div className="px-6 pt-2 pb-4 text-center border-b" style={{ borderColor: T.line }}>
      <h1 className="text-[18px] font-semibold" style={{ ...display, color: T.ash, letterSpacing: "-0.01em" }}>
        {title}
      </h1>
    </div>
  );
}

function Eyebrow({ children }) {
  const { T, display, body, mono } = useTheme();
  return (
    <div className="text-[10px] font-semibold uppercase mb-2" style={{ ...mono, color: T.ashFaint, letterSpacing: "0.08em" }}>
      {children}
    </div>
  );
}

function BottomNav({ active, onNavigate }) {
  const { T, display, body, mono } = useTheme();
  const tabs = [
    { key: "home", label: "Explore", icon: Compass },
    { key: "favorites", label: "Favorites", icon: Heart },
    { key: "schedule", label: "Schedule", icon: Calendar },
    { key: "inbox", label: "Social", icon: Users },
    { key: "profile", label: "Profile", icon: User },
  ];
  return (
    <div className="absolute bottom-4 left-4 right-4" style={{ background: T.glassFill, backdropFilter: T.glassBlur, WebkitBackdropFilter: T.glassBlur, border: T.glassBorder, borderRadius: T.rPill, boxShadow: T.shadowFloat, zIndex: 1000 }}>
      <div className="flex justify-between px-4 pt-2.5 pb-3">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = active === t.key;
          return (
            <button key={t.key} onClick={() => onNavigate(t.key)} className="flex flex-col items-center gap-1 flex-1 transition-transform duration-100 active:scale-90">
              <div className="flex items-center justify-center" style={{ width: 38, height: 26, borderRadius: T.rPill, background: isActive ? "rgba(0,44,72,0.08)" : "transparent" }}>
                <Icon size={18} strokeWidth={isActive ? 2.1 : 1.6} color={isActive ? T.ash : T.ashFaint} />
              </div>
              <span className="text-[9px] font-medium" style={{ ...body, color: isActive ? T.ash : T.ashFaint }}>
                {t.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- screens ---------- */
function LoginScreen({ signIn, signUp, signInWithGoogle, referralCode }) {
  const { T, display, body, mono } = useTheme();
  const [mode, setMode] = useState("signin"); // "signin" | "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [callsign, setCallsign] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const friendlyError = (code) => {
    if (code === "auth/email-already-in-use") return "That email already has an account — try signing in instead.";
    if (code === "auth/invalid-email") return "That doesn't look like a valid email address.";
    if (code === "auth/weak-password") return "Password needs to be at least 6 characters.";
    if (code === "auth/invalid-credential" || code === "auth/wrong-password") return "Incorrect email or password.";
    if (code === "auth/user-not-found") return "No account found with that email.";
    return "Something went wrong — try again.";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (mode === "signup") {
        await signUp(email.trim(), password, callsign.trim(), referralCode);
        localStorage.removeItem("atlas_referral"); // spent, don't keep applying it to future signups on this device
      } else {
        await signIn(email.trim(), password);
      }
    } catch (err) {
      setError(friendlyError(err.code));
    } finally {
      setBusy(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setBusy(true);
    try {
      await signInWithGoogle(referralCode);
      localStorage.removeItem("atlas_referral"); // spent, don't keep applying it to future signups on this device
    } catch (err) {
      // A user closing the Google popup themselves isn't a real error —
      // nothing to show them for it.
      if (err.code !== "auth/popup-closed-by-user" && err.code !== "auth/cancelled-popup-request") {
        setError(friendlyError(err.code));
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="h-full flex flex-col px-6 overflow-y-auto" style={{ backgroundColor: T.void }}>
      <div className="flex flex-col items-center mt-12 mb-8">
        <div className="w-14 h-14 flex items-center justify-center mb-3 overflow-hidden" style={{ borderRadius: 8 }}>
          <img src={`${import.meta.env.BASE_URL}logo.jpg`} alt="Atlas" className="w-full h-full" style={{ objectFit: "cover" }} />
        </div>
        <span className="text-lg font-semibold" style={{ ...display, color: T.ash, letterSpacing: "0.14em" }}>ATLAS</span>
      </div>

      <h1 className="text-[23px] font-semibold mb-2" style={{ ...display, color: T.ash, letterSpacing: "-0.01em" }}>
        {mode === "signup" ? "Create your account" : "Welcome back"}
      </h1>
      <p className="text-[14px] leading-relaxed mb-6" style={{ ...body, color: T.ashDim }}>
        Discover local fields, RSVP to upcoming rec games or milsim events, and track your gameplay roster profile.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
        {mode === "signup" && (
          <input
            value={callsign}
            onChange={(e) => setCallsign(e.target.value)}
            placeholder="Callsign / Username"
            className="px-4 py-3.5 text-[15px] bg-transparent outline-none"
            style={{ ...body, background: T.panel, border: `1px solid ${T.line}`, borderRadius: 4, color: T.ash }}
          />
        )}
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          autoComplete="email"
          placeholder="Email"
          className="px-4 py-3.5 text-[15px] bg-transparent outline-none"
          style={{ ...body, background: T.panel, border: `1px solid ${T.line}`, borderRadius: 4, color: T.ash }}
        />
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          placeholder="Password"
          className="px-4 py-3.5 text-[15px] bg-transparent outline-none"
          style={{ ...body, background: T.panel, border: `1px solid ${T.line}`, borderRadius: 4, color: T.ash }}
        />

        {error && (
          <p className="text-[12px]" style={{ ...body, color: T.alert }}>{error}</p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="w-full py-3.5 font-semibold text-[14px] flex items-center justify-center gap-2 mt-2 transition-transform duration-100 active:scale-[0.98]"
          style={{ ...display, background: T.cta, color: T.inverse, borderRadius: T.rPill, boxShadow: T.shadowMd, opacity: busy ? 0.6 : 1 }}
        >
          {busy ? "Please wait…" : mode === "signup" ? "Create Account" : "Sign In"} <ArrowRight size={16} />
        </button>
      </form>

      <button
        onClick={() => { setMode(mode === "signup" ? "signin" : "signup"); setError(""); }}
        className="text-center text-[13px] font-medium mt-4"
        style={{ ...body, color: T.accent }}
      >
        {mode === "signup" ? "Already have an account? Sign in" : "New here? Create an account"}
      </button>

      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px" style={{ background: T.line }} />
        <span className="text-[11px]" style={{ ...body, color: T.ashFaint }}>or</span>
        <div className="flex-1 h-px" style={{ background: T.line }} />
      </div>

      <div className="flex flex-col gap-2.5 mb-6">
        <button
          onClick={handleGoogleSignIn}
          disabled={busy}
          className="w-full py-3 font-medium text-[13px] flex items-center justify-center gap-2 transition-transform duration-100 active:scale-[0.98]"
          style={{ ...body, border: `1px solid ${T.line}`, color: T.ash, borderRadius: T.rPill, opacity: busy ? 0.6 : 1, cursor: busy ? "default" : "pointer" }}
        >
          Continue with Google
        </button>
        {["Continue with Apple", "Continue with Facebook"].map((label) => (
          <button
            key={label}
            disabled
            className="w-full py-3 font-medium text-[13px] flex items-center justify-center gap-2"
            style={{ ...body, border: `1px solid ${T.line}`, color: T.ashFaint, borderRadius: T.rPill, opacity: 0.5, cursor: "not-allowed" }}
          >
            {label}
            <span className="text-[10px]" style={{ ...mono }}>(soon)</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function EventCard({ ev, fallbackImageUrl, distanceMi, onClick }) {
  const { T, display, body, mono } = useTheme();
  const isToday = ev.date === localDateStr();
  return (
    <button
      onClick={onClick}
      className="text-left w-full mb-4 p-2.5 transition-transform duration-100 active:scale-[0.98]"
      style={{ background: T.panel, borderRadius: T.rHero, boxShadow: T.shadowMd }}
    >
      <div className="h-40 relative mb-2.5" style={{ ...heroStyle(ev.imageUrl || fallbackImageUrl, ev.id || ev.title), borderRadius: T.rMedia, overflow: "hidden" }}>
        <div className="absolute top-3 left-3 flex gap-2">
          {ev.type && <Tag>{ev.type}</Tag>}
          {isToday && <Tag tone="live">TODAY</Tag>}
        </div>
        {ev.price && (
          <div
            className="absolute bottom-2.5 left-3 text-[13px] font-semibold px-2.5 py-1.5"
            style={{ ...mono, background: "rgba(21,84,184,0.85)", color: "#fff", borderRadius: T.rPill }}
          >
            {displayPrice(ev.price)}
          </div>
        )}
        {ev.checkInPatch?.imageUrl && (
          <div
            className="absolute bottom-2.5 right-3 flex items-center gap-1.5 pl-1 pr-2.5 py-1"
            style={{ background: "rgba(10,10,11,0.8)", borderRadius: T.rPill }}
            title={`Check-in reward: ${ev.checkInPatch.name}`}
          >
            <img src={ev.checkInPatch.imageUrl} alt="" className="w-6 h-6 flex-shrink-0" style={{ objectFit: "cover", borderRadius: 999 }} />
            <span className="text-[11px] font-semibold" style={{ ...mono, color: "#fff" }}>Patch</span>
          </div>
        )}
      </div>
      <div className="text-[11px] font-medium" style={{ ...body, color: T.ashFaint }}>{ev.fieldName}</div>
      <div className="text-[16px] font-semibold" style={{ ...display, color: T.ash }}>{ev.title}</div>
      <div className="text-[12px]" style={{ ...mono, color: T.ashDim }}>{formatDate(ev.date, ev.endDate)}{ev.startTime ? ` · ${formatTimeStr(ev.startTime)}` : ""}</div>
      <div className="flex items-center justify-between mt-1.5">
        {typeof distanceMi === "number" ? (
          <div className="text-[11px] font-medium flex items-center gap-1" style={{ ...mono, color: T.ashFaint }}>
            <MapPin size={11} /> {distanceMi < 1 ? "<1 mi" : `${Math.round(distanceMi)} mi`}
          </div>
        ) : ev.interestCount > 0 ? (
          <div className="text-[11px] font-medium flex items-center gap-1" style={{ ...mono, color: T.ashFaint }}>
            <Heart size={11} /> {ev.interestCount} interested
          </div>
        ) : <div />}
      </div>
    </button>
  );
}

/* ---------- map ---------- */
// Custom pin matching the app's palette instead of Leaflet's default blue
// teardrop marker, which would clash badly with the dark theme.
function makePinIcon(color) {
  return L.divIcon({
    className: "",
    html: `<svg width="28" height="36" viewBox="0 0 28 36" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 0C6.3 0 0 6.3 0 14c0 10.5 14 22 14 22s14-11.5 14-22C28 6.3 21.7 0 14 0z" fill="${color}"/>
      <circle cx="14" cy="14" r="5.5" fill="#0A0A0B"/>
    </svg>`,
    iconSize: [28, 36],
    iconAnchor: [14, 36],
    popupAnchor: [0, -32],
  });
}
// Fixed regardless of theme — Leaflet icons are plain JS objects
// outside React's reactivity, and this is a small, low-visibility map
// marker, not worth wiring up to the theme for. Matches LIGHT_T.alert.
const fieldPinIcon = makePinIcon("#BC3327");

// Recenters the map whenever the set of visible pins changes (e.g. after a
// search or category filter), instead of leaving the view stuck wherever it
// started.
function FitToPins({ points }) {
  const map = useMap();
  React.useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView([points[0].lat, points[0].lng], 11);
    } else {
      map.fitBounds(points.map((p) => [p.lat, p.lng]), { padding: [40, 40] });
    }
  }, [points, map]);
  return null;
}

function FieldsMap({ fields, onOpenField, userLocation }) {
  const { T, display, body, mono, theme } = useTheme();
  const pins = fields.filter((f) => typeof f.lat === "number" && typeof f.lng === "number");
  const center = pins.length
    ? [pins[0].lat, pins[0].lng]
    : userLocation
    ? [userLocation.lat, userLocation.lng] // no pins for this filter, but at least center on where the player actually is
    : [43.3, -84.5]; // last resort only — no pins and no known location

  if (pins.length === 0) {
    return (
      <div className="mx-6 mb-4 h-72 flex items-center justify-center" style={{ background: T.panel, borderRadius: T.rCard, boxShadow: T.shadowMd }}>
        <p className="text-[12px] text-center px-6" style={{ ...body, color: T.ashFaint }}>
          None of the fields matching your current filter have map coordinates yet.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-6 mb-4 h-72 overflow-hidden" style={{ borderRadius: 6, border: `1px solid ${T.line}` }}>
      <MapContainer center={center} zoom={9} style={{ width: "100%", height: "100%", background: T.void }} zoomControl={false} markerZoomAnimation={false}>
        <TileLayer
          url={theme === "dark" ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" : "https://tile.openstreetmap.org/{z}/{x}/{y}.png"}
          attribution={theme === "dark" ? "&copy; OpenStreetMap contributors &copy; CARTO" : "&copy; OpenStreetMap contributors"}
        />
        <FitToPins points={pins} />
        <MarkerClusterGroup chunkedLoading spiderfyOnMaxZoom={false} showCoverageOnHover={false} maxClusterRadius={60}>
          {pins.map((f) => (
            <Marker key={f.id} position={[f.lat, f.lng]} icon={fieldPinIcon} eventHandlers={{ click: () => onOpenField(f) }}>
              <Popup>
                <div style={{ ...body, fontSize: 12, fontWeight: 600 }}>{f.name}</div>
                <div style={{ ...body, fontSize: 11, color: "#666" }}>{f.city}</div>
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>
      </MapContainer>
    </div>
  );
}

// Shared location card used on both Field Detail and Event Detail. An event
// can carry its own venueName/address/lat/lng, which take priority — this is
// what makes an org-hosted event (like a MilSim West game with no home
// field) show its actual game location instead of nothing, or a field's
// location when that's genuinely what applies.
// DEMO/PLACEHOLDER DATA — not scraped or owner-provided yet. Same content
// shown on both the event page and the field page, since amenities/rules/
// chrono limits are genuinely field-level facts, not per-event ones. Each
// section independently uses real field-owner data when present (field.amenities/
// rules/chrono) and only falls back to demo placeholder content — with an
// explicit "DEMO DATA" tag — where a field hasn't provided that section yet.
function FieldFacts({ field }) {
  const { T, display, body, mono } = useTheme();
  const hasRealAmenities = Array.isArray(field?.amenities) && field.amenities.length > 0;
  const hasRealRules = Array.isArray(field?.rules) && field.rules.length > 0;
  // field.chrono may be the current list shape (an array of { label, value }
  // pairs an owner can now add to freely) or the older fixed { aeg, sniper,
  // dmr } shape from before that flexibility existed — normalize to a list
  // here so the rendering below doesn't need to care which shape a given
  // field has.
  const chronoItems = Array.isArray(field?.chrono)
    ? field.chrono.filter((ch) => ch?.value)
    : field?.chrono
    ? [
        { label: "AEG", value: field.chrono.aeg },
        { label: "Sniper", value: field.chrono.sniper },
        { label: "DMR", value: field.chrono.dmr },
      ].filter((ch) => ch.value)
    : [];
  const hasRealChrono = chronoItems.length > 0;

  const demoAmenities = ["Pro Shop", "HPA Fill Station", "Rentals Available", "Food & Drinks", "Restrooms"];
  const demoRules = [
    "Full-seal eye protection required at all times on the field.",
    "Barrel bags/plugs required in all staging areas.",
    "Blind fire and physical contact are not permitted.",
    "Minimum engagement distances enforced per game mode.",
  ];

  return (
    <>
      <div className="p-4" style={{ background: T.panel, borderRadius: T.rCard, boxShadow: T.shadowMd }}>
        <div className="flex items-center justify-between mb-2">
          <Eyebrow>Amenities</Eyebrow>
          {!hasRealAmenities && (
            <span className="text-[9px] font-semibold px-1.5 py-0.5" style={{ ...mono, color: T.ashFaint, border: `1px solid ${T.line}`, borderRadius: T.rPill }}>DEMO DATA</span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {(hasRealAmenities ? field.amenities : demoAmenities).map((a) => (
            <span
              key={a}
              className="text-[11px] font-semibold px-3 py-1.5 flex items-center gap-1.5"
              style={{ ...body, background: "rgba(15,122,82,0.12)", color: T.good, borderRadius: 999 }}
            >
              <Check size={12} strokeWidth={3} /> {a}
            </span>
          ))}
        </div>
      </div>

      <div className="p-4" style={{ background: T.panel, borderRadius: T.rCard, boxShadow: T.shadowMd }}>
        <div className="flex items-center justify-between mb-2">
          <Eyebrow>Field Rules</Eyebrow>
          {!hasRealRules && (
            <span className="text-[9px] font-semibold px-1.5 py-0.5" style={{ ...mono, color: T.ashFaint, border: `1px solid ${T.line}`, borderRadius: T.rPill }}>DEMO DATA</span>
          )}
        </div>
        <ul className="text-[12px] leading-relaxed pl-4" style={{ ...body, color: T.ashDim, listStyle: "disc" }}>
          {(hasRealRules ? field.rules : demoRules).map((r) => <li key={r}>{r}</li>)}
        </ul>
      </div>

      <div className="p-4" style={{ background: T.panel, borderRadius: T.rCard, boxShadow: T.shadowMd }}>
        <div className="flex items-center justify-between mb-2">
          <Eyebrow>Chrono Limits</Eyebrow>
          {!hasRealChrono && (
            <span className="text-[9px] font-semibold px-1.5 py-0.5" style={{ ...mono, color: T.ashFaint, border: `1px solid ${T.line}`, borderRadius: T.rPill }}>DEMO DATA</span>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3 text-[12px]" style={{ ...body, color: T.ashDim }}>
          {hasRealChrono ? (
            chronoItems.map((ch, i) => (
              <div key={`${ch.label}-${i}`}>
                <div style={{ color: T.ashFaint }}>{ch.label || "Limit"}</div>
                <div style={{ ...mono, color: T.ash }}>{ch.value}</div>
              </div>
            ))
          ) : (
            <>
              <div>
                <div style={{ color: T.ashFaint }}>AEG</div>
                <div style={{ ...mono, color: T.ash }}>400 FPS max (0.20g)</div>
              </div>
              <div>
                <div style={{ color: T.ashFaint }}>Sniper</div>
                <div style={{ ...mono, color: T.ash }}>500 FPS max (0.20g)</div>
              </div>
            </>
          )}
        </div>
      </div>

      {Array.isArray(field?.rentals) && field.rentals.length > 0 && (
        <div className="p-4" style={{ background: T.panel, borderRadius: T.rCard, boxShadow: T.shadowMd }}>
          <Eyebrow>Rental Gear</Eyebrow>
          <div className="flex flex-col gap-3 mt-2">
            {field.rentals.map((r) => (
              <div key={r.name} className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[13px] font-semibold" style={{ ...display, color: T.ash }}>{r.name}</div>
                  <div className="text-[12px]" style={{ ...body, color: T.ashDim }}>{r.includes}</div>
                  {r.availability && (
                    <div className="text-[11px]" style={{ ...body, color: T.ashFaint }}>{r.availability}</div>
                  )}
                </div>
                <div className="text-[13px] font-semibold flex-shrink-0" style={{ ...mono, color: T.accent }}>{r.price}</div>
              </div>
            ))}
          </div>
          <p className="text-[11px] mt-3" style={{ ...body, color: T.ashFaint }}>
            Selecting and paying for rentals happens during checkout.
          </p>
        </div>
      )}
    </>
  );
}

function LocationCard({ label, name, address, lat, lng, phone }) {
  const { T, display, body, mono, theme } = useTheme();
  if (!address) return null;
  const hasCoords = typeof lat === "number" && typeof lng === "number";
  const destination = hasCoords ? `${lat},${lng}` : encodeURIComponent(address);
  const mapsHref = /iPad|iPhone|iPod/.test(navigator.userAgent)
    ? `https://maps.apple.com/?daddr=${destination}`
    : `https://www.google.com/maps/dir/?api=1&destination=${destination}`;

  return (
    <a
      href={mapsHref}
      target="_blank"
      rel="noreferrer"
      className="block overflow-hidden"
      style={{ background: T.panel, borderRadius: T.rCard, boxShadow: T.shadowMd }}
    >
      <div className="p-4 pb-3">
        <Eyebrow>{label}</Eyebrow>
        {name && (
          <div className="text-[13px] font-medium mb-1" style={{ ...display, color: T.ash }}>{name}</div>
        )}
        <div className="flex items-center gap-2 text-[12px] mb-1" style={{ ...body, color: T.ashDim }}>
          <MapPin size={13} color={T.ashFaint} /> {address}
        </div>
        {phone && (
          <div className="flex items-center gap-2 text-[12px]" style={{ ...mono, color: T.ashFaint }}>
            <Phone size={12} /> {phone}
          </div>
        )}
      </div>

      {hasCoords ? (
        <div className="h-36 pointer-events-none">
          <MapContainer
            center={[lat, lng]}
            zoom={13}
            style={{ width: "100%", height: "100%" }}
            zoomControl={false}
            dragging={false}
            scrollWheelZoom={false}
            doubleClickZoom={false}
            touchZoom={false}
          >
            <TileLayer
              url={theme === "dark" ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" : "https://tile.openstreetmap.org/{z}/{x}/{y}.png"}
              attribution={theme === "dark" ? "&copy; OpenStreetMap contributors &copy; CARTO" : "&copy; OpenStreetMap contributors"}
            />
            <Marker position={[lat, lng]} icon={fieldPinIcon} />
          </MapContainer>
        </div>
      ) : (
        <div className="h-16 flex items-center justify-center border-t" style={{ borderColor: T.line }}>
          <span className="text-[11px] font-semibold flex items-center gap-1.5" style={{ ...display, color: T.accent }}>
            Get Directions <ArrowRight size={13} />
          </span>
        </div>
      )}
    </a>
  );
}

function HomeScreen({
  onOpenEvent, onNavigate, events, eventsLoading, fields, profile, onOpenField, favorites, user, myBookings,
  // Filter/view state below is owned by AppShell, not local to this screen
  // — HomeScreen unmounts every time the player drills into a field/event
  // (screen leaves "home") and remounts fresh on the way back, so a local
  // useState here would silently reset every filter/view choice on every
  // drill-down. See AppShell's "Explore filter/view state" block.
  search, setSearch,
  activeCat, setActiveCat,
  viewMode, setViewMode,
  activeTodayOnly, setActiveTodayOnly,
  nearbyOnly, setNearbyOnly,
  userLocation, setUserLocation,
  locationStatus, setLocationStatus,
  selectedState, setSelectedState,
  stateDetectAttempted, setStateDetectAttempted,
  dateFrom, setDateFrom,
  dateTo, setDateTo,
  maxPrice, setMaxPrice,
  radiusMiles, setRadiusMiles,
  sortBy, setSortBy,
}) {
  const { T, display, body, mono, theme } = useTheme();

  // Pull-to-refresh. Fields/events are already live via Firestore listeners
  // — nothing here is genuinely stale — so this is honestly about the
  // gesture itself (the interaction people expect from a feed) rather than
  // fixing real staleness. Still gives real, deliberate visual feedback
  // instead of faking an instant flash.
  const PULL_THRESHOLD = 70;
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const pullStartY = useRef(null);
  const scrollRef = useRef(null);

  const handleTouchStart = (e) => {
    if (scrollRef.current && scrollRef.current.scrollTop <= 0 && !refreshing) {
      pullStartY.current = e.touches[0].clientY;
    } else {
      pullStartY.current = null;
    }
  };
  const handleTouchMove = (e) => {
    if (pullStartY.current === null || refreshing) return;
    const delta = e.touches[0].clientY - pullStartY.current;
    if (delta > 0 && scrollRef.current && scrollRef.current.scrollTop <= 0) {
      setPullDistance(Math.min(delta * 0.5, 100)); // damped, so it doesn't feel like 1:1 dragging
    }
  };
  const handleTouchEnd = async () => {
    if (pullStartY.current === null) return;
    if (pullDistance >= PULL_THRESHOLD) {
      setRefreshing(true);
      setPullDistance(PULL_THRESHOLD);
      await new Promise((r) => setTimeout(r, 600)); // real listeners are already current; this is a deliberate, honest pause, not a fake instant flash
      setRefreshing(false);
    }
    setPullDistance(0);
    pullStartY.current = null;
  };

  // State picker for the Fields view — auto-detects once via reverse
  // geocoding (reusing userLocation if Nearby already granted it, so this
  // doesn't trigger a second permission prompt), then falls back to
  // Michigan if detection fails or the browser has no geolocation at all.
  // A manual pick always overrides the auto-detected one.
  const reverseGeocodeState = async (loc) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${loc.lat}&lon=${loc.lng}`);
      const data = await res.json();
      return data?.address?.state || null;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    if (viewMode === "map" || stateDetectAttempted) return;
    setStateDetectAttempted(true);
    if (userLocation) {
      reverseGeocodeState(userLocation).then((name) => setSelectedState(name && Object.values(US_STATES).includes(name) ? name : "Michigan"));
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserLocation(loc); // shared with Nearby — no reason to ask twice
          reverseGeocodeState(loc).then((name) => setSelectedState(name && Object.values(US_STATES).includes(name) ? name : "Michigan"));
        },
        () => setSelectedState("Michigan"),
        { timeout: 8000 }
      );
    } else {
      setSelectedState("Michigan");
    }
  }, [viewMode, stateDetectAttempted, userLocation]);

  const today = localDateStr();
  const isLiveToday = (ev) => ev.date <= today && (ev.endDate || ev.date) >= today;

  // The player's real next game — their soonest real booking that hasn't
  // ended yet. Booking exists now, so this uses that as the actual "I'm
  // going" signal instead of favorites — a merely-favorited event was
  // never actually booked, and the check-in scanner would correctly
  // reject a QR code generated for one, since there's no real booking to
  // check in against.
  const myEventBookingIds = myBookings.map((b) => b.eventId);
  const nextGame = events
    .filter((e) => myEventBookingIds.includes(e.id) && !e.canceled && (e.endDate || e.date) >= today)
    .sort((a, b) => a.date.localeCompare(b.date))[0] || null;
  const nextGameIsToday = nextGame ? isLiveToday(nextGame) : false;

  const [showCheckIn, setShowCheckIn] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState(null);
  // Live, not a one-time fetch — this is what makes instant confirmation
  // possible at all. The player is actively looking at this exact screen
  // at the moment they're scanned (they're holding the QR code up right
  // now), so a real-time listener catches the change the instant it
  // happens — no push notifications needed, no reload, nothing to poll.
  const { booking: nextGameBooking } = useMyBooking(user?.uid, nextGame?.id);

  const handleCheckIn = async () => {
    if (!nextGame || !user) return;
    // Minimal payload by design — just enough for a future field-owner
    // scanner to look up the event and player in Firestore. No callsign,
    // email, or other personal info gets embedded in a scannable code.
    const payload = `atlas:checkin:${nextGame.id}:${user.uid}`;
    const dataUrl = await QRCode.toDataURL(payload, {
      width: 280,
      // 4 modules is the actual QR code standard's minimum quiet zone
      // (ISO/IEC 18004) — 1 was well under that, which genuinely does
      // slow down real-world scanning, since the scanning algorithm needs
      // that clear border to isolate the code from its surroundings.
      margin: 4,
      color: { dark: "#002C48", light: "#FFFFFF" } /* fixed — always scannable regardless of theme */, // standard dark-on-white — most reliably scannable, and correct for the light theme (this was inverted, a leftover from before the palette flip)
    });
    setQrDataUrl(dataUrl);
    setShowCheckIn(true);
  };

  const fieldDistance = (field) => {
    if (!userLocation || !field || typeof field.lat !== "number" || typeof field.lng !== "number") return null;
    return distanceMiles(userLocation.lat, userLocation.lng, field.lat, field.lng);
  };

  const handleNearbyToggle = () => {
    if (nearbyOnly) {
      setNearbyOnly(false);
      return;
    }
    if (userLocation) {
      setNearbyOnly(true);
      return;
    }
    if (!navigator.geolocation) {
      setLocationStatus("error");
      return;
    }
    setLocationStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationStatus("idle");
        setNearbyOnly(true);
      },
      () => setLocationStatus("error"),
      { timeout: 10000 }
    );
  };

  // Advanced filters (behind the sliders icon). dateFrom/dateTo/maxPrice/
  // radiusMiles/sortBy are lifted to AppShell (see HomeScreen's props
  // above); showFilters is just this panel's own open/closed UI state,
  // which is fine to reset on every visit.
  const [showFilters, setShowFilters] = useState(false);
  const advancedFiltersActive = dateFrom || dateTo || maxPrice !== null || radiusMiles !== NEARBY_RADIUS_MILES || sortBy !== "date";
  const clearAdvancedFilters = () => {
    setDateFrom("");
    setDateTo("");
    setMaxPrice(null);
    setRadiusMiles(NEARBY_RADIUS_MILES);
    setSortBy("date");
  };
  const eventPassesAdvanced = (ev) => {
    if (dateFrom && (ev.endDate || ev.date) < dateFrom) return false;
    if (dateTo && ev.date > dateTo) return false;
    if (maxPrice !== null) {
      const p = parsePrice(ev.price);
      if (p !== null && p > maxPrice) return false;
    }
    return true;
  };

  const cats = [
    { key: "Featured", icon: Star },
    { key: "Outdoor", icon: TreePine, type: "OUTDOOR", fieldProp: "outdoor" },
    { key: "MilSim", icon: ChevronsUp, type: "MILSIM" },
    { key: "Indoor", icon: Home, type: "INDOOR", fieldProp: "indoor" },
    { key: "Tournament", icon: Trophy, type: "TOURNAMENT" },
  ];

  let filteredEvents = events.filter((ev) => {
    // Base rule for the whole feed, independent of any toggle: something
    // that's already over never belongs on a discovery page. Multi-day
    // events stay visible through their endDate, not just their start.
    if ((ev.endDate || ev.date) < today) return false;
    if (ev.canceled) return false; // canceled events stay real data (existing bookings/favorites still reference them), just not browsable as if they were still happening
    const cat = cats.find((c) => c.key === activeCat);
    if (cat?.type && ev.type !== cat.type) return false;
    if (activeTodayOnly && !isLiveToday(ev)) return false;
    if (!eventPassesAdvanced(ev)) return false;
    if (nearbyOnly) {
      const dist = fieldDistance(fields.find((f) => f.id === ev.fieldId));
      if (dist === null || dist > radiusMiles) return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      const haystack = `${ev.title} ${ev.fieldName}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    if (selectedState) {
      const evField = fields.find((f) => f.id === ev.fieldId);
      if (stateNameFromCity(evField?.city) !== selectedState) return false;
    }
    return true;
  });

  if (sortBy === "distance" && userLocation) {
    filteredEvents = [...filteredEvents].sort(
      (a, b) => (fieldDistance(fields.find((f) => f.id === a.fieldId)) ?? Infinity) -
                (fieldDistance(fields.find((f) => f.id === b.fieldId)) ?? Infinity)
    );
  } else if (sortBy === "price") {
    filteredEvents = [...filteredEvents].sort(
      (a, b) => (parsePrice(a.price) ?? Infinity) - (parsePrice(b.price) ?? Infinity)
    );
  } else if (nearbyOnly) {
    // No explicit sort chosen, but Nearby is on — nearest-first is still the
    // more useful default than insertion order.
    filteredEvents = [...filteredEvents].sort(
      (a, b) => (fieldDistance(fields.find((f) => f.id === a.fieldId)) ?? Infinity) -
                (fieldDistance(fields.find((f) => f.id === b.fieldId)) ?? Infinity)
    );
  } else {
    filteredEvents = [...filteredEvents].sort((a, b) => a.date.localeCompare(b.date));
  }

  // Every field, filtered by the same criteria as the events feed — this is
  // what makes a field with zero scheduled events still show up here, in
  // the Fields list and on the Map, instead of only being reachable through
  // an event that happens to link to it.
  const filteredFields = fields
    .filter((f) => {
      // A relocated field has no location worth showing — its old address
      // is defunct, and surfacing it here would send someone toward a
      // place that no longer runs games. It's still reachable directly
      // (e.g. from a favorite or old link) where the relocation notice
      // and redirect to its new home actually shows.
      // "closed" (confirmed shut down / sold, per a 2026-09-08 pass) and
      // "no-airsoft" (an operating business that just doesn't run airsoft,
      // e.g. a paintball-only field) get the same treatment — nothing
      // bookable to send a player toward either way.
      if (["relocated", "closed", "no-airsoft"].includes(f.status)) return false;
      const cat = cats.find((c) => c.key === activeCat);
      if (cat?.fieldProp && !(f.indoorOutdoor || "").toLowerCase().includes(cat.fieldProp)) return false;
      if (cat?.type && !cat.fieldProp && !events.some((ev) => ev.fieldId === f.id && ev.type === cat.type)) return false;
      if (activeTodayOnly && !events.some((ev) => ev.fieldId === f.id && isLiveToday(ev))) return false;
      if ((dateFrom || dateTo || maxPrice !== null) && !events.some((ev) => ev.fieldId === f.id && eventPassesAdvanced(ev))) return false;
      if (nearbyOnly) {
        const dist = fieldDistance(f);
        if (dist === null || dist > radiusMiles) return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        if (!`${f.name} ${f.city || ""}`.toLowerCase().includes(q)) return false;
      }
      // The state filter only applies to the list view — the Map tab always
      // shows every matching pin nationwide, regardless of which state is
      // selected in the (hidden-while-on-map) dropdown. Every other filter
      // above (category, search, nearby, date/price) still applies to the
      // map exactly as before.
      if (viewMode !== "map" && selectedState && stateNameFromCity(f.city) !== selectedState) return false;
      return true;
    })
    .sort((a, b) =>
      nearbyOnly ? (fieldDistance(a) ?? Infinity) - (fieldDistance(b) ?? Infinity) : a.name.localeCompare(b.name)
    );

  return (
    <div
      ref={scrollRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="h-full overflow-y-auto pb-24"
      style={{ backgroundColor: T.void }}
    >
      <div
        className="flex items-center justify-center overflow-hidden"
        style={{ height: pullDistance, transition: refreshing ? "none" : "height 200ms ease-out" }}
      >
        <RefreshCw size={18} color={T.ashDim} className={refreshing ? "ptr-spin" : ""} style={{ transform: refreshing ? "none" : `rotate(${pullDistance * 3}deg)` }} />
      </div>
      <div className="px-6 pt-2 pb-4 flex items-center justify-between">
        <div>
          <div className="text-[12px]" style={{ ...body, color: T.ashDim }}>{timeBasedGreeting()},</div>
          <div className="text-[20px] font-semibold" style={{ ...display, color: T.ash }}>{profile?.callsign || "Player"}</div>
        </div>
        <button onClick={() => onNavigate("profile")}>
          {profile?.avatarUrl ? (
            <div
              className="w-10 h-10"
              style={{ backgroundImage: `url("${profile.avatarUrl}")`, backgroundSize: "cover", backgroundPosition: "center", borderRadius: 4, border: `1px solid ${T.line}` }}
            />
          ) : (
            <div
              className="w-10 h-10 flex items-center justify-center text-[14px] font-semibold"
              style={{ ...display, background: T.panelAlt, border: `1px solid ${T.line}`, borderRadius: 4, color: T.ash }}
            >
              {(profile?.callsign || "?").charAt(0).toUpperCase()}
            </div>
          )}
        </button>
      </div>

      {nextGame ? (
        <div
          className="mx-6 p-4 mb-4"
          style={{
            background: theme === "dark"
              ? "linear-gradient(155deg, rgba(255,255,255,0.07), rgba(255,255,255,0.02))"
              : "linear-gradient(155deg, #FFFFFF 0%, #EEF2F8 100%)",
            borderRadius: T.rHero,
            boxShadow: T.shadowLg,
            border: theme === "dark" ? "1px solid rgba(255,255,255,0.12)" : "none",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div style={{ position: "absolute", top: -30, right: -30, width: 110, height: 110, borderRadius: "50%", background: theme === "dark" ? "rgba(182,255,61,0.14)" : "rgba(21,84,184,0.08)" }} />
          {theme === "dark" && (
            // Night Ops radar motif — dark mode only, matches the concept
            // artboard's hero card. Purely decorative, pointer-events off.
            <svg width="180" height="180" viewBox="0 0 180 180" style={{ position: "absolute", right: -50, top: -30, opacity: 0.4, pointerEvents: "none" }}>
              <circle cx="90" cy="90" r="82" stroke="#B6FF3D" strokeWidth="1" strokeDasharray="2 6" fill="none" opacity="0.5" />
              <circle cx="90" cy="90" r="54" stroke="#B6FF3D" strokeWidth="1" strokeDasharray="2 6" fill="none" opacity="0.4" />
              <circle cx="90" cy="90" r="26" stroke="#B6FF3D" strokeWidth="1" fill="none" opacity="0.3" />
            </svg>
          )}
          <div className="flex items-center justify-between mb-3">
            {nextGameIsToday ? <Tag tone="good">LIVE EVENT</Tag> : <Tag tone="live">UPCOMING EVENT</Tag>}
            {nextGameIsToday && (
              nextGameBooking?.checkedIn ? (
                <span className="text-[11px] font-medium flex items-center gap-1" style={{ ...body, color: T.good }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: T.good, display: "inline-block" }} /> Checked in
                </span>
              ) : (
                <span className="text-[11px] font-medium flex items-center gap-1" style={{ ...body, color: T.good }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: T.good, display: "inline-block" }} /> Check-in available
                </span>
              )
            )}
          </div>
          <div className="flex items-center justify-between gap-2">
            <div className="font-semibold text-[17px]" style={{ ...display, color: T.ash }}>{nextGame.title}</div>
            {nextGame.checkInPatch?.imageUrl && (
              <img
                src={nextGame.checkInPatch.imageUrl}
                alt={nextGame.checkInPatch.name}
                title={`Check-in reward: ${nextGame.checkInPatch.name}`}
                className="w-8 h-8 flex-shrink-0"
                style={{ objectFit: "cover", borderRadius: 999, background: T.panelAlt, border: `1px solid ${T.line}` }}
              />
            )}
          </div>
          <div className="text-[12px] mb-4" style={{ ...body, color: T.ashDim }}>
            {nextGame.fieldName} — {formatDate(nextGame.date, nextGame.endDate)}{nextGame.startTime ? ` · ${formatTimeStr(nextGame.startTime)}` : ""}
          </div>

          {nextGameIsToday ? (
            nextGameBooking?.checkedIn ? (
              // Checked first, independent of showCheckIn — that's just
              // local UI state for revealing the QR code, and resets to
              // false on every refresh. Gating this behind it was the
              // actual bug: after a refresh, a genuinely checked-in player
              // would still see "Check In Now" again, since the real
              // checked-in status was never even being looked at.
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 flex items-center justify-center" style={{ background: T.good, borderRadius: 999 }}>
                    <Check size={14} color={T.inverse} strokeWidth={3} />
                  </div>
                  <span className="text-[12px] font-semibold" style={{ ...display, color: T.ash }}>Check-In Complete</span>
                </div>
              </div>
            ) : showCheckIn ? (
              <div className="flex flex-col items-center pt-1">
                {qrDataUrl && <img src={qrDataUrl} alt="Check-in QR code" className="mb-2" style={{ width: 160, height: 160, borderRadius: 4 }} />}
                <p className="text-[11px] text-center mb-2" style={{ ...body, color: T.ashFaint }}>Show this to field staff to check in.</p>
                <button onClick={() => setShowCheckIn(false)} className="text-[11px] font-medium" style={{ ...body, color: T.accent }}>
                  Hide
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-[11px]" style={{ ...body, color: T.ashFaint }}>Ready when you are</span>
                <button
                  onClick={handleCheckIn}
                  className="px-4 py-2 text-[11px] font-semibold transition-transform duration-100 active:scale-95"
                  style={{ ...display, background: T.cta, color: T.inverse, borderRadius: T.rPill, boxShadow: T.shadowMd }}
                >
                  Check In Now
                </button>
              </div>
            )
          ) : (
            <button
              onClick={() => onOpenEvent(nextGame)}
              className="w-full py-2.5 text-[12px] font-semibold"
              style={{ ...body, border: `1px solid ${T.line}`, color: T.ash, borderRadius: T.rPill }}
            >
              View Details
            </button>
          )}
        </div>
      ) : (
        <div className="mx-6 p-4 mb-4" style={{ background: T.panel, borderRadius: T.rCard, boxShadow: T.shadowMd }}>
          <div className="text-[13px] font-semibold mb-1" style={{ ...display, color: T.ash }}>No upcoming games reserved</div>
          <p className="text-[12px]" style={{ ...body, color: T.ashDim }}>
            Reserve a spot at an event and it'll show up here as your next game.
          </p>
        </div>
      )}

      <div className="mx-6 mb-4 flex items-center gap-2 px-4 py-3" style={{ background: T.panel, borderRadius: T.rPill, boxShadow: T.shadowMd }}>
        <Search size={16} color={T.ashFaint} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Where would you like to pew?"
          className="flex-1 text-[13px] bg-transparent outline-none"
          style={{ ...body, color: T.ash }}
        />
        <button onClick={() => setShowFilters(!showFilters)} className="relative flex items-center justify-center flex-shrink-0" style={{ width: 26, height: 26, borderRadius: T.rPill, background: T.tint }}>
          <SlidersHorizontal size={14} color={advancedFiltersActive ? T.accent : T.ashDim} />
          {advancedFiltersActive && (
            <span style={{ position: "absolute", top: -2, right: -2, width: 6, height: 6, borderRadius: "50%", background: T.accent }} />
          )}
        </button>
      </div>

      {showFilters && (
        <div className="mx-6 mb-4 p-4 flex flex-col gap-4 overflow-hidden" style={{ background: T.panel, borderRadius: T.rCard, boxShadow: T.shadowMd }}>
          <div>
            <div className="text-[11px] font-semibold uppercase mb-2" style={{ ...mono, color: T.ashFaint, letterSpacing: "0.04em" }}>Date Range</div>
            <div className="flex flex-col gap-2">
              <div>
                <label className="text-[10px] block mb-1" style={{ ...body, color: T.ashFaint }}>Start Date</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full px-3 py-2 text-[13px] bg-transparent outline-none"
                  // iOS Safari lays out a native date control's segments
                  // using its own intrinsic sizing that can beat a plain
                  // width:100%, regardless of box-sizing/min-width —
                  // appearance:none is what actually makes it respect the
                  // box (same fix as the owner app's event editor). That
                  // native appearance also enforces a touch-friendly
                  // minimum height, so an explicit height compensates.
                  style={{ ...body, background: T.panelAlt, border: `1px solid ${T.line}`, borderRadius: 4, color: T.ash, colorScheme: "light", boxSizing: "border-box", minWidth: 0, maxWidth: "100%", display: "block", WebkitAppearance: "none", appearance: "none", height: "48px" }}
                />
              </div>
              <div>
                <label className="text-[10px] block mb-1" style={{ ...body, color: T.ashFaint }}>End Date</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full px-3 py-2 text-[13px] bg-transparent outline-none"
                  style={{ ...body, background: T.panelAlt, border: `1px solid ${T.line}`, borderRadius: 4, color: T.ash, colorScheme: "light", boxSizing: "border-box", minWidth: 0, maxWidth: "100%", display: "block", WebkitAppearance: "none", appearance: "none", height: "48px" }}
                />
              </div>
            </div>
          </div>

          <div>
            <div className="text-[11px] font-semibold uppercase mb-2" style={{ ...mono, color: T.ashFaint, letterSpacing: "0.04em" }}>Max Price</div>
            <div className="flex gap-2 flex-wrap">
              {[
                { label: "Any", value: null },
                { label: "Under $25", value: 25 },
                { label: "Under $50", value: 50 },
                { label: "Under $100", value: 100 },
              ].map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => setMaxPrice(opt.value)}
                  className="px-3 py-1.5 text-[12px] font-medium"
                  style={{
                    ...body,
                    border: `1px solid ${maxPrice === opt.value ? T.accent : T.line}`,
                    background: maxPrice === opt.value ? T.accent : "transparent",
                    color: maxPrice === opt.value ? T.inverse : T.ashDim,
                    borderRadius: T.rPill,
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-[11px] font-semibold uppercase mb-2" style={{ ...mono, color: T.ashFaint, letterSpacing: "0.04em" }}>Sort By</div>
            <div className="flex gap-2 flex-wrap">
              {[
                { key: "date", label: "Soonest" },
                { key: "price", label: "Price" },
              ].map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => !opt.disabled && setSortBy(opt.key)}
                  disabled={opt.disabled}
                  className="px-3 py-1.5 text-[12px] font-medium"
                  style={{
                    ...body,
                    border: `1px solid ${sortBy === opt.key ? T.accent : T.line}`,
                    background: sortBy === opt.key ? T.accent : "transparent",
                    color: opt.disabled ? T.ashFaint : sortBy === opt.key ? T.inverse : T.ashDim,
                    borderRadius: T.rPill,
                    opacity: opt.disabled ? 0.5 : 1,
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {advancedFiltersActive && (
            <button onClick={clearAdvancedFilters} className="text-[12px] font-medium text-center" style={{ ...body, color: T.alert }}>
              Clear all filters
            </button>
          )}

          <div className="flex gap-2 pt-1">
            <button
              onClick={() => setShowFilters(false)}
              className="flex-1 py-2.5 text-[13px] font-medium"
              style={{ ...body, border: `1px solid ${T.line}`, color: T.ash, borderRadius: T.rPill }}
            >
              Close
            </button>
            <button
              onClick={() => setShowFilters(false)}
              className="flex-1 py-2.5 text-[13px] font-semibold"
              style={{ ...display, background: T.cta, color: T.inverse, borderRadius: T.rPill, boxShadow: T.shadowMd }}
            >
              Run Search
            </button>
          </div>
        </div>
      )}

      <div className="mx-6 mb-2 flex items-center gap-2">
        <button
          onClick={() => setActiveTodayOnly(!activeTodayOnly)}
          className="px-3.5 py-2 text-[12px] font-semibold transition-transform duration-100 active:scale-95"
          style={{
            ...body,
            border: activeTodayOnly ? "none" : `1px solid ${T.line}`,
            background: activeTodayOnly ? T.alert : T.panel,
            color: activeTodayOnly ? T.inverse : T.ashDim,
            borderRadius: T.rPill,
            boxShadow: activeTodayOnly ? "0 3px 10px -3px rgba(188,51,39,0.4)" : T.shadowSm,
          }}
        >
          Active Today
        </button>
        <div className="flex-1" />
        <div className="flex" style={{ background: T.panelAlt, borderRadius: T.rPill, padding: 3 }}>
          <button
            onClick={() => setViewMode("list")}
            className="px-3.5 py-1.5 text-[12px] font-semibold transition-transform duration-100 active:scale-95"
            style={{ ...body, background: viewMode === "list" ? T.cta : "transparent", color: viewMode === "list" ? T.inverse : T.ashDim, borderRadius: T.rPill, boxShadow: viewMode === "list" ? "0 1px 3px rgba(0,44,72,0.25)" : "none" }}
          >
            Events
          </button>
          <button
            onClick={() => setViewMode("fields")}
            className="px-3.5 py-1.5 text-[12px] font-medium transition-transform duration-100 active:scale-95"
            style={{ ...body, background: viewMode === "fields" ? T.cta : "transparent", color: viewMode === "fields" ? T.inverse : T.ashDim, borderRadius: T.rPill, boxShadow: viewMode === "fields" ? "0 1px 3px rgba(0,44,72,0.25)" : "none" }}
          >
            Fields
          </button>
          <button
            onClick={() => setViewMode("map")}
            className="px-3.5 py-1.5 text-[12px] font-medium transition-transform duration-100 active:scale-95"
            style={{ ...body, background: viewMode === "map" ? T.cta : "transparent", color: viewMode === "map" ? T.inverse : T.ashDim, borderRadius: T.rPill, boxShadow: viewMode === "map" ? "0 1px 3px rgba(0,44,72,0.25)" : "none" }}
          >
            Map
          </button>
        </div>
      </div>

      {locationStatus === "error" && (
        <div className="mx-6 mb-4 px-3 py-2" style={{ background: "rgba(240,85,74,0.1)", border: `1px solid ${T.alert}`, borderRadius: 4 }}>
          <p className="text-[11px]" style={{ ...body, color: T.ashDim }}>
            Couldn't get your location — check that location access is allowed for this site in your browser settings.
          </p>
        </div>
      )}

      <div className="flex gap-2 px-6 mb-5 overflow-x-auto">
        {cats.map((cat) => {
          const Icon = cat.icon;
          const active = activeCat === cat.key;
          return (
            <button
              key={cat.key}
              onClick={() => setActiveCat(cat.key)}
              className="flex items-center gap-1.5 flex-shrink-0 px-3.5 py-2.5 transition-transform duration-100 active:scale-95"
              style={{ background: active ? T.cta : T.panel, borderRadius: T.rPill, boxShadow: active ? "0 3px 10px -3px rgba(0,44,72,0.35)" : T.shadowSm }}
            >
              <Icon size={15} color={active ? T.inverse : T.ashDim} strokeWidth={1.9} />
              <span className="text-[12px] font-medium" style={{ ...body, color: active ? T.inverse : T.ashDim }}>{cat.key}</span>
            </button>
          );
        })}
      </div>

      <div className="px-6 flex items-center justify-between mb-3">
        <span className="text-[15px] font-semibold" style={{ ...display, color: T.ash }}>
          {viewMode === "map" ? "Fields on Map" : viewMode === "fields" ? "All Fields" : "Events Feed"}
        </span>
        {viewMode !== "map" && (
          <select
            value={selectedState || ""}
            onChange={(e) => setSelectedState(e.target.value)}
            className="text-[12px] font-medium px-2 py-1 outline-none"
            style={{ ...body, background: T.panel, border: `1px solid ${T.line}`, borderRadius: 4, color: T.ash, colorScheme: "light" }}
          >
            {!selectedState && <option value="">Detecting…</option>}
            {Object.values(US_STATES)
              .sort()
              .map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
          </select>
        )}
      </div>

      {viewMode === "map" ? (
        <FieldsMap fields={filteredFields} onOpenField={onOpenField} userLocation={userLocation} />
      ) : viewMode === "fields" ? (
        <div className="px-6">
          {filteredFields.length === 0 ? (
            <div className="text-[13px] py-6 text-center px-6" style={{ ...body, color: T.ashFaint }}>
              {selectedState && selectedState !== "Michigan" && !search.trim() && activeCat === "Featured"
                ? `No fields loaded for ${selectedState} yet — coverage starts with Michigan and is expanding.`
                : `No fields match "${search || activeCat}".`}
            </div>
          ) : (
            filteredFields.map((f) => {
              const dist = nearbyOnly ? fieldDistance(f) : null;
              return (
                <button
                  key={f.id}
                  onClick={() => onOpenField(f)}
                  className="w-full mb-3 p-3 flex items-center gap-3 text-left transition-transform duration-100 active:scale-[0.98]"
                  style={{ background: T.panel, borderRadius: T.rCard, boxShadow: T.shadowMd }}
                >
                  <div className="w-14 h-14 flex-shrink-0" style={{ ...heroStyle(f.imageUrl, f.id), borderRadius: 4 }} />
                  <div className="flex-1">
                    <div className="text-[14px] font-semibold" style={{ ...display, color: T.ash }}>{f.name}</div>
                    <div className="text-[12px]" style={{ ...body, color: T.ashFaint }}>{f.city}</div>
                    {typeof dist === "number" && (
                      <div className="text-[11px] font-medium flex items-center gap-1 mt-0.5" style={{ ...mono, color: T.ashDim }}>
                        <MapPin size={10} /> {dist < 1 ? "<1 mi" : `${Math.round(dist)} mi`}
                      </div>
                    )}
                  </div>
                  <ChevronRight size={16} color={T.ashFaint} />
                </button>
              );
            })
          )}
        </div>
      ) : (
      <div className="px-6">
        {eventsLoading ? (
          <div className="text-[13px] py-6 text-center" style={{ ...body, color: T.ashFaint }}>Loading events…</div>
        ) : events.length === 0 ? (
          <div className="text-[13px] py-6 text-center" style={{ ...body, color: T.ashFaint }}>
            No events loaded yet — check the Firestore connection.
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-[13px] py-6 text-center" style={{ ...body, color: T.ashFaint }}>
            No events match "{search || activeCat}".
          </div>
        ) : (
          filteredEvents.map((ev) => (
            <EventCard
              key={ev.id}
              ev={ev}
              fallbackImageUrl={fields.find((f) => f.id === ev.fieldId)?.imageUrl}
              distanceMi={nearbyOnly ? fieldDistance(fields.find((f) => f.id === ev.fieldId)) ?? undefined : undefined}
              onClick={() => onOpenEvent(ev)}
            />
          ))
        )}
      </div>
      )}
      <BottomNav active="home" onNavigate={onNavigate} />
    </div>
  );
}

function EventDetailScreen({ ev, field, onBack, onOpenField, favorited, onToggleFavorite, user, profile, signature, signWaiver,
  myBooking, myBookingLoading, whosGoing, whosGoingLoading, whosInterested, whosInterestedLoading, bookEvent, cancelBooking, createBookingCheckout,
  fieldVouchers, redeemVoucher }) {
  const { T, display, body, mono, theme } = useTheme();
  const statusLabel = field ? STATUS_LABEL[field.status] : null;
  const isPast = (ev.endDate || ev.date) < localDateStr();
  // Still needed to determine whether this is a paid event at all (for
  // routing to the right booking flow) — the fee/total display itself
  // was removed from the button, so only this piece survives.
  const basePriceCents = Math.round(parseFloat(String(ev.price || "").replace(/[^0-9.]/g, "")) * 100) || 0;

  const [showWaiver, setShowWaiver] = useState(false);
  // Price Options — a group of player-picked, differently-priced choices
  // (weapon class, BB weight, etc.), set by the field owner on the event.
  // Absent for a normal flat-price or free event.
  const [selectedChoiceId, setSelectedChoiceId] = useState(null);
  const priceOptions = ev.priceOptions;
  const selectedChoice = priceOptions?.choices?.find((c) => c.id === selectedChoiceId) || null;
  const entryPriceCents = basePriceCents + (selectedChoice?.priceCents || 0);
  const choiceMissing = !!priceOptions?.required && !selectedChoice;
  // Booking-bar price label. basePriceCents/entryPriceCents already treat
  // any non-numeric ev.price (blank, or owner text with no digits) as $0 —
  // but $0 is ambiguous on its own: it could mean "genuinely free" or "no
  // price text was ever set, we don't actually know." Only call it "Free"
  // once nothing is left unresolved (no required Price Options still
  // needing a pick) and ev.price isn't owner-authored ambiguous text like
  // "Price varies" (has no digits, but isn't empty either).
  const priceTextHasDigits = /\d/.test(String(ev.price || ""));
  const priceIsAmbiguousText = !!ev.price && !priceTextHasDigits;
  const formattedEntryPrice = entryPriceCents % 100 === 0 ? `$${entryPriceCents / 100}` : `$${(entryPriceCents / 100).toFixed(2)}`;
  const priceDisplayText = choiceMissing
    ? (ev.price || field?.admission || "Choose an option above")
    : entryPriceCents > 0
      ? formattedEntryPrice
      : priceIsAmbiguousText
        ? ev.price
        : "Free";
  // Rental gear selection — an owner-defined catalog on the field itself
  // (field.rentals), not the event. On/off only (no quantity): rentals
  // have no stock/inventory concept today, just a free-text "availability
  // note", so letting a player pick a quantity would silently invite
  // overselling gear with no way to detect it. Only items with a real
  // priceCents (set by the owner app at save time) are selectable — an
  // item saved before this feature shipped, with no priceCents yet, isn't
  // offered here until its owner re-saves it.
  const rentalOptions = (field?.rentals || []).filter((r) => typeof r.priceCents === "number" && r.priceCents > 0);
  const [selectedRentalIds, setSelectedRentalIds] = useState([]);
  const toggleRental = (id) => setSelectedRentalIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  const rentalsCents = rentalOptions.filter((r) => selectedRentalIds.includes(r.id)).reduce((sum, r) => sum + r.priceCents, 0);
  const [showPatchViewer, setShowPatchViewer] = useState(false);
  const [scrolledToEnd, setScrolledToEnd] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [signing, setSigning] = useState(false);
  const [signError, setSignError] = useState("");
  const [bookingBusy, setBookingBusy] = useState(false);
  const [bookingError, setBookingError] = useState("");
  // Whether the player has opted to apply their voucher to THIS booking —
  // a single toggle inline with the normal reserve flow, not a separate
  // button/action. One shared busy/error state (bookingBusy/bookingError
  // above) covers both the voucher and normal-payment paths now, since
  // there's only ever one primary action button below.
  const [applyVoucher, setApplyVoucher] = useState(false);
  // Tracks whether the currently-open waiver sheet was opened while the
  // voucher toggle was on, so handleSign (below) knows which action to
  // resume once the signature saves — signing is a shared first step for
  // either path.
  const [pendingVoucherRedeem, setPendingVoucherRedeem] = useState(false);
  // Best-fit voucher for this event's field — largest balance first, since
  // that's the one most likely to cover this event's ticket price. A
  // voucher never has a fee added back onto what it needs to cover (the
  // player already paid Atlas's fee once, on the original canceled
  // booking), so unlike the real Stripe total, "does it cover this?" is
  // exact, client-computable math — no server round-trip needed just to
  // decide whether to show the option.
  const bestFieldVoucher = fieldVouchers && fieldVouchers.length > 0
    ? [...fieldVouchers].sort((a, b) => b.amountCents - a.amountCents)[0]
    : null;
  const voucherCoversCost = !!bestFieldVoucher && entryPriceCents > 0 && bestFieldVoucher.amountCents >= entryPriceCents;
  const usingVoucher = applyVoucher && voucherCoversCost;
  const [checkoutOpenedInfo, setCheckoutOpenedInfo] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [showAttendees, setShowAttendees] = useState(false);
  const [shareState, setShareState] = useState(null); // "copied" briefly, to confirm the clipboard fallback

  const isFull = ev.maxCapacity && (ev.bookedCount || 0) >= ev.maxCapacity && !myBooking;
  const waiverBlocking = ev.waiver && !signature;

  // Extracted so both a normal "Reserve This Event" tap AND a just-completed
  // waiver signature can trigger the same real booking action — signing is
  // now step one of booking, not a separate standalone thing on this page.
  const proceedToBook = async () => {
    setBookingBusy(true);
    setBookingError("");
    // A real, priced event goes through actual Stripe Checkout — the
    // booking itself only gets created server-side once payment succeeds,
    // not here. A free event (no real price set) keeps the original,
    // instant flow, since there's no payment to wait on at all.
    // Combined, not entry-only — a free event with a rental selected still
    // needs real payment, so it routes to Stripe checkout too, exactly
    // like a normally-priced event. See createBookingCheckout's own
    // combined chargeableCents guard on the Cloud Function side.
    const isPaidEvent = entryPriceCents + rentalsCents > 0;
    // Grabbed once, up front, for either path — best-effort only (resolves
    // to null rather than blocking or failing booking if location isn't
    // available or granted). The server decides whether it's actually
    // close enough and whether this is even a first-ever booking; this is
    // just the one thing only the client can supply, and it applies to a
    // walk-on paying at the gate in cash just as much as one booking free.
    const location = await getQuickLocation();
    try {
      if (isPaidEvent) {
        const url = await createBookingCheckout(ev.id, selectedChoiceId, location, selectedRentalIds);
        // Opens in a genuinely separate tab rather than navigating this
        // app's own window away — a real, confirmed WebKit bug can
        // corrupt this PWA's own rendering after returning from an
        // external site through the same tab (found and fixed on the
        // owner app's Payouts flow first). Opening separately also means
        // this tab's own live listener on the booking never drops — the
        // "Reserved" state below will pick it up automatically the moment
        // the webhook confirms payment, whichever tab that happens in.
        window.open(url, "_blank");
        setCheckoutOpenedInfo(true);
        setBookingBusy(false);
      } else {
        await bookEvent(user.uid, profile, ev, selectedChoice, location);
        setBookingBusy(false);
      }
    } catch (err) {
      // Every HttpsError createBookingCheckout/bookFreeEvent actually
      // throw (failed-precondition, already-exists, not-found,
      // invalid-argument, unauthenticated) is already a complete,
      // player-facing sentence — "This field hasn't finished payment
      // setup yet.", "This event is full.", "Waiver must be signed
      // before booking.", etc. Surfacing those beats a one-size-fits-all
      // "try again" that can't tell a player whether retrying will ever
      // help. Only truly unexpected failures (offline, functions/internal,
      // functions/unavailable, or anything with no message at all) fall
      // back to the generic text, since those aren't written to be shown.
      const errCode = String(err.code || "").replace(/^functions\//, "");
      const knownFriendlyCode = ["failed-precondition", "already-exists", "not-found", "invalid-argument", "unauthenticated"].includes(errCode);
      console.error("booking failed:", err.code || err.message || err);
      setBookingError(
        knownFriendlyCode && err.message
          ? err.message
          : (isPaidEvent ? "Couldn't start checkout — try again." : "Couldn't reserve this event — try again.")
      );
      setBookingBusy(false);
    }
  };

  // Redeems the best-fit field voucher instead of going through
  // bookEvent/createBookingCheckout — no Stripe involved at all here, so
  // there's no checkout tab to open and no webhook to wait on, and no
  // platform fee gets added either (the player already paid one, on the
  // original canceled booking). A successful call means the booking
  // already exists by the time this returns. A voucher that doesn't
  // cover this event's ticket price throws failed-precondition with a
  // message that's safe to show as-is.
  //
  // Split the same way proceedToBook is: this half does the actual work
  // with no gating re-checks, so handleSign below can resume straight
  // into it right after a waiver signature saves without racing the
  // `signature` prop's own listener catching up.
  const proceedToRedeemVoucher = async () => {
    if (!bestFieldVoucher) return;
    setBookingBusy(true);
    setBookingError("");
    const location = await getQuickLocation();
    try {
      await redeemVoucher(ev.id, bestFieldVoucher.id, selectedChoiceId, location);
      setBookingBusy(false);
    } catch (err) {
      console.error("voucher redemption failed:", err.code || err.message || err);
      setBookingError(err.message || "Couldn't apply that voucher — try again, or book normally.");
      setBookingBusy(false);
    }
  };

  // The single primary-action handler for the bottom bar's one button —
  // this is the "one flow" unification: applying a voucher isn't a
  // separate action anymore, it's a toggle (applyVoucher/usingVoucher)
  // that this same Reserve/Redeem button reacts to at the moment it's
  // tapped, exactly like a real checkout's "apply promo code" would feed
  // into its one "Complete Purchase" button rather than needing a second
  // button of its own.
  const handlePrimaryAction = () => {
    if (choiceMissing) return; // button is already disabled for this case — just a defensive no-op
    if (usingVoucher) {
      if (waiverBlocking) {
        setPendingVoucherRedeem(true);
        setShowWaiver(true);
        return;
      }
      proceedToRedeemVoucher();
      return;
    }
    setPendingVoucherRedeem(false); // defensive — a stale voucher-toggle-on-waiver-open shouldn't hijack a normal Reserve
    if (waiverBlocking) {
      setShowWaiver(true);
      return;
    }
    proceedToBook();
  };

  const handleCancel = async () => {
    // Defensive, not just the UI gate above — this function should never
    // silently cancel a paid booking, regardless of how it gets called.
    if (myBooking?.paid) return;
    setBookingBusy(true);
    try {
      await cancelBooking(user.uid, ev.id);
      setConfirmCancel(false);
    } catch (err) {
      setBookingError("Couldn't cancel — try again.");
    } finally {
      setBookingBusy(false);
    }
  };

  const handleShare = async () => {
    const result = await shareContent(ev.title, `${ev.title} at ${ev.fieldName} — ${formatDate(ev.date, ev.endDate)}.`);
    if (result === "copied") {
      setShareState("copied");
      setTimeout(() => setShareState(null), 2000);
    }
  };

  // Pulled straight from the account, not typed — this is what makes it
  // meaningful as a security measure: a player can only ever sign as
  // themselves, never anyone else, because there's nowhere to type a
  // different name.
  const legalName = profile?.firstName && profile?.lastName ? `${profile.firstName} ${profile.lastName}` : profile?.callsign || "";

  const handleWaiverScroll = (e) => {
    const el = e.target;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 20) setScrolledToEnd(true);
  };

  const handleSign = async () => {
    if (!legalName.trim() || !agreed || !user) return;
    setSigning(true);
    setSignError("");
    try {
      await signWaiver({
        uid: user.uid,
        eventId: ev.id,
        fieldId: ev.fieldId,
        signedName: legalName.trim(),
        waiverVersion: ev.waiver.version,
      });
      setShowWaiver(false);
      // Signing is step one of booking now, not a standalone action —
      // proceed straight into the real booking (or voucher redemption,
      // whichever this signature was actually for) the moment the
      // signature saves, rather than making the player tap a second time.
      if (pendingVoucherRedeem) {
        setPendingVoucherRedeem(false);
        await proceedToRedeemVoucher();
      } else {
        await proceedToBook();
      }
    } catch (err) {
      setSignError("Couldn't save your signature — try again.");
    } finally {
      setSigning(false);
    }
  };

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: T.void }}>
      <div className="flex-1 overflow-y-auto pb-24">
        <div className="h-60 relative" style={heroStyle(ev.imageUrl || field?.imageUrl, ev.id || ev.title)}>
          {theme === "dark" && (
            // Night Ops radar motif — dark mode only, matches the concept
            // artboard's Event Detail hero. Purely decorative.
            <svg width="300" height="300" viewBox="0 0 300 300" style={{ position: "absolute", left: "50%", top: -20, transform: "translateX(-50%)", opacity: 0.3, pointerEvents: "none" }}>
              <circle cx="150" cy="150" r="140" stroke="#B6FF3D" strokeWidth="1" strokeDasharray="2 7" fill="none" />
              <circle cx="150" cy="150" r="98" stroke="#B6FF3D" strokeWidth="1" strokeDasharray="2 7" fill="none" opacity="0.7" />
              <circle cx="150" cy="150" r="56" stroke="#B6FF3D" strokeWidth="1" fill="none" opacity="0.5" />
            </svg>
          )}
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-5 pt-3">
            <button onClick={onBack} className="w-9 h-9 flex items-center justify-center" style={{ background: "rgba(255,255,255,0.92)", borderRadius: T.rPill, boxShadow: "0 2px 8px rgba(0,0,0,0.18)" }}>
              <ChevronLeft color={T.ash} size={19} />
            </button>
            <div className="flex gap-2">
              <button onClick={onToggleFavorite} className="w-9 h-9 flex items-center justify-center transition-transform duration-100 active:scale-90" style={{ background: "rgba(255,255,255,0.92)", borderRadius: T.rPill, boxShadow: "0 2px 8px rgba(0,0,0,0.18)" }}>
                <Heart size={17} color={favorited ? T.alert : T.ash} fill={favorited ? T.alert : "none"} />
              </button>
              <button onClick={handleShare} className="w-9 h-9 flex items-center justify-center transition-transform duration-100 active:scale-90" style={{ background: "rgba(255,255,255,0.92)", borderRadius: T.rPill, boxShadow: "0 2px 8px rgba(0,0,0,0.18)" }}>
                {shareState === "copied" ? <Check size={17} color={T.good} /> : <Share2 size={16} color={T.ash} />}
              </button>
            </div>
          </div>
          <div className="absolute bottom-4 left-5 right-5">
            <div className="flex gap-2 mb-2">
              {ev.type && <Tag>{ev.type}</Tag>}
              {statusLabel && <Tag tone="live">{statusLabel}</Tag>}
            </div>
            <div
              className="text-[24px] font-semibold"
              style={{ ...display, color: "#FFFFFF", textShadow: "0 1px 4px rgba(0,0,0,0.65)", WebkitTextStroke: "0.4px rgba(0,0,0,0.35)" }}
            >
              {ev.title}
            </div>
          </div>
        </div>

        <div className="px-5 mt-4 flex flex-col gap-3">
          {!ev.canceled && ev.bookingOpensAt && (
            localDateStr() < ev.bookingOpensAt ? (
              <div className="p-4" style={{ background: "rgba(21,84,184,0.08)", border: `1px solid ${T.accent}`, borderRadius: 6 }}>
                <p className="text-[13px] font-medium" style={{ ...body, color: T.accent }}>
                  Bookings will begin starting {formatDate(ev.bookingOpensAt)}.
                </p>
              </div>
            ) : (
              <div className="p-4 flex items-center gap-2" style={{ background: "rgba(52,211,153,0.08)", border: `1px solid ${T.good}`, borderRadius: 6 }}>
                <Check size={15} color={T.good} />
                <p className="text-[13px] font-medium" style={{ ...body, color: T.good }}>
                  Bookings are now open for this event.
                </p>
              </div>
            )
          )}
          {ev.canceled && (
            <div className="p-4" style={{ background: "rgba(188,51,39,0.1)", border: `1px solid ${T.alert}`, borderRadius: 6 }}>
              <div className="text-[13px] font-semibold mb-1" style={{ ...display, color: T.alert }}>This event has been canceled</div>
              <p className="text-[12px] leading-relaxed" style={{ ...body, color: T.ashDim }}>The field owner has canceled this event. If you had reserved or were interested, no action is needed on your end.</p>
            </div>
          )}
          {statusLabel && field?.notes && (
            <div className="p-4" style={{ background: "rgba(240,85,74,0.1)", border: `1px solid ${T.alert}`, borderRadius: 6 }}>
              <div className="text-[12px] font-semibold mb-1" style={{ ...display, color: T.alert }}>{statusLabel}</div>
              <p className="text-[12px] leading-relaxed" style={{ ...body, color: T.ashDim }}>{field.notes}</p>
            </div>
          )}

          <div className="p-4 flex flex-col gap-3" style={{ background: T.panel, borderRadius: T.rCard, boxShadow: T.shadowMd }}>
            <div className="flex gap-3 items-start">
              <Calendar size={17} color={T.ashDim} className="mt-0.5" />
              <div>
                <div className="text-[14px] font-medium" style={{ ...body, color: T.ash }}>{formatDate(ev.date, ev.endDate)}</div>
                {(ev.startTime || ev.endTime) && (
                  <div className="text-[12px]" style={{ ...mono, color: T.ashDim }}>
                    {formatTimeStr(ev.startTime)}{ev.endTime ? ` – ${formatTimeStr(ev.endTime)}` : ""}
                  </div>
                )}
              </div>
            </div>
            <div className="h-px" style={{ background: T.line }} />
            <button onClick={onOpenField} className="flex gap-3 items-start text-left" disabled={!field}>
              <MapPin size={17} color={T.ashDim} className="mt-0.5" />
              <div>
                <div className="text-[14px] font-medium" style={{ ...body, color: T.ash }}>{ev.fieldName}</div>
                {field?.city && <div className="text-[12px]" style={{ ...body, color: T.ashFaint }}>{field.city}</div>}
              </div>
            </button>
            {ev.interestCount > 0 && (
              <>
                <div className="h-px" style={{ background: T.line }} />
                <button onClick={() => setShowAttendees(true)} className="flex gap-3 items-center text-left w-full">
                  <Heart size={17} color={T.ashDim} />
                  <div className="text-[14px] font-medium flex-1" style={{ ...body, color: T.ash }}>
                    {ev.interestCount} {ev.interestCount === 1 ? "player" : "players"} interested
                  </div>
                  <ChevronRight size={16} color={T.ashFaint} />
                </button>
              </>
            )}
          </div>

          <LocationCard
            label="Event Location"
            name={ev.venueName || field?.name}
            address={ev.address || fullAddress(field)}
            lat={typeof ev.lat === "number" ? ev.lat : field?.lat}
            lng={typeof ev.lng === "number" ? ev.lng : field?.lng}
          />

          {!whosGoingLoading && whosGoing.length > 0 && (
            <button onClick={() => setShowAttendees(true)} className="p-4 text-left w-full" style={{ background: T.panel, borderRadius: T.rCard, boxShadow: T.shadowMd }}>
              <Eyebrow>Who's Going ({whosGoing.length})</Eyebrow>
              <div className="flex flex-wrap gap-2 mt-1">
                {whosGoing.slice(0, 12).map((b) => (
                  b.avatarUrl ? (
                    <div key={b.uid} title={b.callsign} className="w-9 h-9" style={{ backgroundImage: `url("${b.avatarUrl}")`, backgroundSize: "cover", backgroundPosition: "center", borderRadius: 999, border: `1px solid ${T.line}` }} />
                  ) : (
                    <div key={b.uid} title={b.callsign} className="w-9 h-9 flex items-center justify-center text-[12px] font-semibold" style={{ ...display, background: T.panelAlt, borderRadius: 999, color: T.ash }}>
                      {b.callsign.charAt(0).toUpperCase()}
                    </div>
                  )
                ))}
                {whosGoing.length > 12 && (
                  <div className="w-9 h-9 flex items-center justify-center text-[11px] font-semibold" style={{ ...body, background: T.panelAlt, borderRadius: 999, color: T.ashFaint }}>
                    +{whosGoing.length - 12}
                  </div>
                )}
              </div>
            </button>
          )}

          {priceOptions?.choices?.length > 0 && !myBooking && !isPast && !ev.canceled && (
            <div className="p-4" style={{ background: T.panel, borderRadius: T.rCard, boxShadow: T.shadowMd, outline: choiceMissing ? `1.5px solid ${T.accent}` : "none", outlineOffset: -1 }}>
              <Eyebrow>{priceOptions.label}{priceOptions.required ? "" : " (optional)"}</Eyebrow>
              <div className="flex flex-wrap gap-2">
                {priceOptions.choices.map((c) => {
                  const picked = selectedChoiceId === c.id;
                  const priceLabel = c.priceCents === 0 ? "Free" : c.priceCents % 100 === 0 ? `$${c.priceCents / 100}` : `$${(c.priceCents / 100).toFixed(2)}`;
                  return (
                    <button
                      key={c.id}
                      onClick={() => setSelectedChoiceId(picked ? (priceOptions.required ? c.id : null) : c.id)}
                      className="px-3 py-2 text-[12px] font-semibold"
                      style={{ ...body, color: picked ? T.inverse : T.ashDim, background: picked ? T.cta : T.panelAlt, borderRadius: 999 }}
                    >
                      {c.label} — {priceLabel}
                    </button>
                  );
                })}
              </div>
              {choiceMissing && (
                <p className="text-[11px] mt-2" style={{ ...body, color: T.accent }}>Choose one to continue.</p>
              )}
            </div>
          )}

          {rentalOptions.length > 0 && !myBooking && !isPast && !ev.canceled && !usingVoucher && (
            <div className="p-4" style={{ background: T.panel, borderRadius: T.rCard, boxShadow: T.shadowMd }}>
              <Eyebrow>Rental Gear (optional)</Eyebrow>
              <div className="flex flex-wrap gap-2">
                {rentalOptions.map((r) => {
                  const picked = selectedRentalIds.includes(r.id);
                  const priceLabel = r.priceCents % 100 === 0 ? `$${r.priceCents / 100}` : `$${(r.priceCents / 100).toFixed(2)}`;
                  return (
                    <button
                      key={r.id}
                      onClick={() => toggleRental(r.id)}
                      className="px-3 py-2 text-[12px] font-semibold"
                      style={{ ...body, color: picked ? T.inverse : T.ashDim, background: picked ? T.cta : T.panelAlt, borderRadius: 999 }}
                    >
                      {r.name} — {priceLabel}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {bestFieldVoucher && !myBooking && !isPast && !ev.canceled && (
            voucherCoversCost ? (
              // A toggle, not a second action button — applying the
              // voucher is now a single step inside the one Reserve/
              // Redeem flow below, the same way a real checkout's promo-
              // code field feeds into its one "Complete Purchase" button
              // rather than needing a purchase button of its own.
              <button
                onClick={() => setApplyVoucher((v) => !v)}
                disabled={bookingBusy}
                className="w-full p-4 flex items-center gap-3 text-left"
                style={{ background: usingVoucher ? T.tintGood : T.panel, borderRadius: T.rCard, boxShadow: T.shadowMd, outline: usingVoucher ? `1.5px solid ${T.good}` : "none", outlineOffset: -1 }}
              >
                <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center" style={{ borderRadius: 5, border: `1.5px solid ${usingVoucher ? T.good : T.line}`, background: usingVoucher ? T.good : "transparent" }}>
                  {usingVoucher && <Check size={13} color={T.inverse} strokeWidth={3} />}
                </div>
                <Ticket size={16} color={T.good} className="flex-shrink-0" />
                <div className="text-[12px] font-medium flex-1 min-w-0" style={{ ...body, color: T.ash }}>
                  Apply my {bestFieldVoucher.amountCents % 100 === 0 ? `$${bestFieldVoucher.amountCents / 100}` : `$${(bestFieldVoucher.amountCents / 100).toFixed(2)}`} voucher for this field — covers this event in full, no fee
                </div>
              </button>
            ) : (
              // Exists but doesn't fully cover this particular selection
              // (e.g. a pricier event, or a Price Options choice that
              // pushed the cost up) — v1 doesn't combine a voucher with a
              // card charge, so it's just not offered here, but the
              // player should still know why their voucher isn't showing
              // up as usable rather than wondering where it went.
              <div className="p-3 flex items-center gap-2" style={{ background: T.panel, borderRadius: T.rCard, boxShadow: T.shadowMd }}>
                <Ticket size={14} color={T.ashFaint} className="flex-shrink-0" />
                <p className="text-[11px]" style={{ ...body, color: T.ashFaint }}>
                  You have a {bestFieldVoucher.amountCents % 100 === 0 ? `$${bestFieldVoucher.amountCents / 100}` : `$${(bestFieldVoucher.amountCents / 100).toFixed(2)}`} voucher for this field, but it doesn't cover this event's price — it's still saved for a future event here.
                </p>
              </div>
            )
          )}

          {ev.waiver && (
            signature ? (
              <div className="p-3 flex items-center gap-2" style={{ background: "rgba(52,211,153,0.08)", border: `1px solid ${T.good}`, borderRadius: 6 }}>
                <Check size={15} color={T.good} />
                <div className="text-[12px] font-medium" style={{ ...body, color: T.ash }}>Waiver signed as {signature.signedName}</div>
              </div>
            ) : !isPast && (
              <div className="p-3 flex items-center gap-2" style={{ background: T.panel, borderRadius: T.rCard, boxShadow: T.shadowMd }}>
                <FileSignature size={15} color={T.ashDim} />
                <div className="text-[12px]" style={{ ...body, color: T.ashDim }}>This event requires a signed waiver — you'll sign it when you reserve.</div>
              </div>
            )
          )}

          {ev.description && (
            <div className="p-4" style={{ background: T.panel, borderRadius: T.rCard, boxShadow: T.shadowMd }}>
              <Eyebrow>Event Details</Eyebrow>
              <p className="text-[13px] leading-relaxed" style={{ ...body, color: T.ashDim }}>{ev.description}</p>
            </div>
          )}

          {field?.about && (
            <div className="p-4" style={{ background: T.panel, borderRadius: T.rCard, boxShadow: T.shadowMd }}>
              <Eyebrow>About {field.name}</Eyebrow>
              <p className="text-[13px] leading-relaxed" style={{ ...body, color: T.ashDim }}>{field.about}</p>
            </div>
          )}

          {ev.checkInPatch?.imageUrl && (
            <div className="p-4 flex items-center gap-3" style={{ background: T.panel, borderRadius: T.rCard, boxShadow: T.shadowMd }}>
              <button onClick={() => setShowPatchViewer(true)} className="w-14 h-14 flex-shrink-0 flex items-center justify-center overflow-hidden" style={{ background: T.panelAlt, borderRadius: T.rPill }}>
                <img src={ev.checkInPatch.imageUrl} alt={ev.checkInPatch.name} className="w-full h-full" style={{ objectFit: "cover" }} />
              </button>
              <div className="flex-1">
                <Eyebrow>Check-In Reward</Eyebrow>
                <div className="text-[13px] font-semibold" style={{ ...display, color: T.ash }}>{ev.checkInPatch.name}</div>
                <p className="text-[11px]" style={{ ...body, color: T.ashFaint }}>You'll earn this automatically once you're checked in at this event.</p>
              </div>
            </div>
          )}

          {/* DEMO/PLACEHOLDER DATA — not scraped or owner-provided yet.
              Kept here for showcase purposes per explicit request; swap for
              real field-owner-entered data once that flow exists. */}
          <FieldFacts field={field} />

          {ev.sourceUrl && (
            <a
              href={ev.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="p-4 flex items-center justify-between"
              style={{ background: T.panel, borderRadius: T.rCard, boxShadow: T.shadowMd }}
            >
              <span className="text-[13px] font-medium" style={{ ...body, color: T.ash }}>View original listing</span>
              <ArrowRight size={16} color={T.ashDim} />
            </a>
          )}
        </div>
      </div>

      <div className="absolute bottom-4 left-4 right-4 px-5 py-3 flex items-center justify-between" style={{ background: T.glassFill, backdropFilter: T.glassBlur, WebkitBackdropFilter: T.glassBlur, border: T.glassBorder, borderRadius: T.rFloat, boxShadow: T.shadowFloat, zIndex: 1000 }}>
        <div>
          <div className="text-[10px]" style={{ ...body, color: T.ashFaint }}>Entry Cost</div>
          <div className="text-[18px] font-semibold" style={{ ...mono, color: usingVoucher ? T.good : T.ash }}>
            {usingVoucher ? "$0 (voucher)" : priceDisplayText}
          </div>
          {typeof ev.maxCapacity === "number" && (
            <div className="text-[10px]" style={{ ...mono, color: T.ashFaint }}>{ev.bookedCount || 0} / {ev.maxCapacity} reserved</div>
          )}
        </div>
        {ev.canceled ? (
          <span className="px-6 py-3 font-semibold text-[13px]" style={{ ...display, color: T.alert, border: `1px solid ${T.alert}`, borderRadius: T.rPill }}>
            Event Canceled
          </span>
        ) : isPast ? (
          <span className="px-6 py-3 font-semibold text-[13px]" style={{ ...display, color: T.ashFaint, border: `1px solid ${T.line}`, borderRadius: T.rPill }}>
            Event Ended
          </span>
        ) : myBooking ? (
          confirmCancel ? (
            myBooking.paid ? (
              // Self-serve cancellation isn't safe to offer yet for a
              // paid booking — the old cancel flow was just a Firestore
              // delete with zero Stripe awareness, meaning a player could
              // cancel and their money would just sit wherever it was
              // paid, with no refund, no voucher, and no signal to either
              // side that anything needed attention. Blocking this
              // outright until the real voucher/refund design exists is
              // safer than quietly letting that happen.
              <div className="px-4 py-3 max-w-xs" style={{ background: T.panel, borderRadius: T.rTight, boxShadow: T.shadowSm }}>
                <p className="text-[12px] mb-2" style={{ ...body, color: T.ashDim }}>
                  Canceling a paid booking isn't self-serve yet. Reach out on Discord and we'll take care of it directly.
                </p>
                <button onClick={() => setConfirmCancel(false)} className="text-[12px] font-medium" style={{ ...body, color: T.accent }}>
                  Never mind
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <button onClick={() => setConfirmCancel(false)} disabled={bookingBusy} className="px-3 py-3 text-[12px] font-medium" style={{ ...body, border: `1px solid ${T.line}`, color: T.ashDim, borderRadius: T.rPill }}>
                  Never mind
                </button>
                <button onClick={handleCancel} disabled={bookingBusy} className="px-4 py-3 font-semibold text-[13px]" style={{ ...display, background: T.alert, color: T.inverse, borderRadius: T.rPill, boxShadow: T.shadowSm, opacity: bookingBusy ? 0.6 : 1 }}>
                  {bookingBusy ? "…" : "Cancel Reservation"}
                </button>
              </div>
            )
          ) : (
            <button onClick={() => setConfirmCancel(true)} className="px-6 py-3 font-semibold text-[13px] flex items-center gap-2" style={{ ...display, background: T.good, color: T.inverse, borderRadius: T.rPill, boxShadow: T.shadowSm }}>
              <Check size={15} /> Reserved
            </button>
          )
        ) : isFull ? (
          <span className="px-6 py-3 font-semibold text-[13px]" style={{ ...display, color: T.ashFaint, border: `1px solid ${T.line}`, borderRadius: T.rPill }}>
            Event Full
          </span>
        ) : checkoutOpenedInfo ? (
          // Real gap this closes: bookingBusy clears the instant the Stripe
          // tab opens, so without this branch "Reserve This Event" goes right
          // back to being a live, clickable button while myBooking is
          // still null (webhook hasn't landed yet) — nothing stopped a
          // second real charge from an impatient re-tap. The idempotency
          // key on the backend is the actual hard guarantee against that;
          // this is the UI half, so it doesn't even look tappable in the
          // meantime. "Didn't finish, try again?" below is the escape
          // hatch for someone who genuinely canceled on Stripe's page.
          <span className="px-6 py-3 font-semibold text-[13px]" style={{ ...display, color: T.ashFaint, border: `1px solid ${T.line}`, borderRadius: T.rPill }}>
            Confirming Payment…
          </span>
        ) : (
          <button
            onClick={handlePrimaryAction}
            disabled={bookingBusy || choiceMissing}
            className="px-6 py-3 font-semibold text-[13px] transition-transform duration-100 active:scale-95"
            style={{ ...display, background: usingVoucher ? T.good : T.cta, color: T.inverse, borderRadius: T.rPill, boxShadow: T.shadowMd, opacity: bookingBusy || choiceMissing ? 0.6 : 1 }}
          >
            {bookingBusy ? "…" : choiceMissing ? `Choose ${priceOptions.label}` : waiverBlocking ? "Sign Waiver to Reserve" : usingVoucher ? "Redeem Voucher" : "Reserve This Event"}
          </button>
        )}
      </div>
      {bookingError && (
        <div className="absolute bottom-20 left-0 right-0 px-5">
          <p className="text-[12px] text-center py-2" style={{ ...body, color: T.alert, background: T.panel, borderRadius: 4, border: `1px solid ${T.alert}` }}>{bookingError}</p>
        </div>
      )}
      {checkoutOpenedInfo && !myBooking && (
        <div className="absolute bottom-20 left-0 right-0 px-5">
          <p className="text-[12px] text-center py-2" style={{ ...body, color: T.ash, background: T.panel, borderRadius: 4, border: `1px solid ${T.line}` }}>
            Complete your payment in the new tab — this page will update on its own once it's confirmed.
          </p>
          <button
            onClick={() => setCheckoutOpenedInfo(false)}
            className="w-full text-center text-[11px] font-medium mt-1.5"
            style={{ ...body, color: T.accent }}
          >
            Didn't finish, or need to try again?
          </button>
        </div>
      )}

      {showWaiver && ev.waiver && (
        <div
          onClick={() => !signing && setShowWaiver(false)}
          className="fixed inset-0 flex items-end"
          style={{ background: "rgba(0,0,0,0.5)", zIndex: 1500 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-h-[85vh] overflow-y-auto"
            style={{ background: T.void, borderTopLeftRadius: 16, borderTopRightRadius: 16 }}
          >
            <div className="sticky top-0 px-5 pt-4 pb-3 flex items-center justify-between" style={{ background: T.void, borderBottom: `1px solid ${T.line}` }}>
              <div>
                <h2 className="text-[16px] font-semibold" style={{ ...display, color: T.ash }}>Sign to Reserve</h2>
                <p className="text-[11px]" style={{ ...body, color: T.ashFaint }}>{field?.name || ev.fieldName} Waiver</p>
              </div>
              <button onClick={() => !signing && setShowWaiver(false)} className="w-8 h-8 flex items-center justify-center">
                <X size={18} color={T.ashDim} />
              </button>
            </div>
            <div className="px-5 py-4">
              {ev.waiver.isDemo !== false && (
                <span className="inline-block text-[9px] font-semibold px-1.5 py-0.5 mb-3" style={{ ...mono, color: T.ashFaint, border: `1px solid ${T.line}`, borderRadius: T.rPill }}>DEMO DATA</span>
              )}
              <div
                onScroll={handleWaiverScroll}
                className="text-[12px] leading-relaxed p-3 mb-3"
                style={{ ...body, color: T.ashDim, background: T.panelAlt, borderRadius: 4, maxHeight: 220, overflowY: "auto", whiteSpace: "pre-wrap" }}
              >
                {ev.waiver.text}
              </div>
              {!scrolledToEnd && (
                <p className="text-[11px] mb-3" style={{ ...body, color: T.ashFaint }}>Scroll to the bottom to continue.</p>
              )}
              {scrolledToEnd && (
                <>
                  <label className="flex items-start gap-2 mb-3 text-[12px]" style={{ ...body, color: T.ashDim }}>
                    <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5" />
                    I have read and agree to the terms above.
                  </label>
                  <div className="mb-3">
                    <div className="text-[10px] font-semibold uppercase mb-1" style={{ ...mono, color: T.ashFaint, letterSpacing: "0.04em" }}>Signing As</div>
                    <div
                      className="px-3 py-2.5 text-[14px] font-medium"
                      style={{ ...display, background: T.panelAlt, border: `1px solid ${T.line}`, borderRadius: 4, color: legalName ? T.ash : T.alert }}
                    >
                      {legalName || "Add your name in My Account to sign"}
                    </div>
                    <p className="text-[10px] mt-1" style={{ ...body, color: T.ashFaint }}>
                      Matches your account — this can't be changed here.
                    </p>
                  </div>
                  {signError && <p className="text-[11px] mb-2" style={{ ...body, color: T.alert }}>{signError}</p>}
                  <button
                    onClick={handleSign}
                    disabled={!agreed || !legalName.trim() || signing}
                    className="w-full py-3 text-[13px] font-semibold"
                    style={{ ...display, background: T.cta, color: T.inverse, borderRadius: T.rPill, boxShadow: T.shadowMd, opacity: !agreed || !legalName.trim() || signing ? 0.5 : 1 }}
                  >
                    {signing ? "Signing & Reserving…" : "Sign & Reserve"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {showAttendees && (
        <div
          onClick={() => setShowAttendees(false)}
          className="fixed inset-0 flex items-end"
          style={{ background: "rgba(0,0,0,0.5)", zIndex: 1500 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-h-[75vh] overflow-y-auto"
            style={{ background: T.void, borderTopLeftRadius: 16, borderTopRightRadius: 16 }}
          >
            <div className="sticky top-0 px-5 pt-4 pb-3 flex items-center justify-between" style={{ background: T.void, borderBottom: `1px solid ${T.line}` }}>
              <h2 className="text-[16px] font-semibold" style={{ ...display, color: T.ash }}>Who's In</h2>
              <button onClick={() => setShowAttendees(false)} className="w-8 h-8 flex items-center justify-center">
                <X size={18} color={T.ashDim} />
              </button>
            </div>
            <div className="px-5 py-4">
              {whosGoingLoading || whosInterestedLoading ? (
                <p className="text-[13px] py-6 text-center" style={{ ...body, color: T.ashFaint }}>Loading…</p>
              ) : (
                <>
                  {whosGoing.length > 0 && (
                    <>
                      <Eyebrow>Reserved ({whosGoing.length})</Eyebrow>
                      <div className="flex flex-col gap-2 mb-5 mt-1">
                        {whosGoing.map((b) => (
                          <div key={b.uid} className="flex items-center gap-3">
                            {b.avatarUrl ? (
                              <div className="w-9 h-9 flex-shrink-0" style={{ backgroundImage: `url("${b.avatarUrl}")`, backgroundSize: "cover", backgroundPosition: "center", borderRadius: 999, border: `1px solid ${T.line}` }} />
                            ) : (
                              <div className="w-9 h-9 flex-shrink-0 flex items-center justify-center text-[13px] font-semibold" style={{ ...display, background: T.panelAlt, borderRadius: 999, color: T.ash }}>
                                {b.callsign.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div className="text-[14px] font-medium" style={{ ...body, color: T.ash }}>{b.callsign}</div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                  {whosInterested.length > 0 && (
                    <>
                      <Eyebrow>Interested ({whosInterested.length})</Eyebrow>
                      <div className="flex flex-col gap-2 mt-1">
                        {whosInterested.map((p) => (
                          <div key={p.uid} className="flex items-center gap-3">
                            {p.avatarUrl ? (
                              <div className="w-9 h-9 flex-shrink-0" style={{ backgroundImage: `url("${p.avatarUrl}")`, backgroundSize: "cover", backgroundPosition: "center", borderRadius: 999, border: `1px solid ${T.line}` }} />
                            ) : (
                              <div className="w-9 h-9 flex-shrink-0 flex items-center justify-center text-[13px] font-semibold" style={{ ...display, background: T.panelAlt, borderRadius: 999, color: T.ash }}>
                                {p.callsign.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div className="text-[14px] font-medium" style={{ ...body, color: T.ash }}>{p.callsign}</div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                  {whosGoing.length === 0 && whosInterested.length === 0 && (
                    <p className="text-[13px] py-6 text-center" style={{ ...body, color: T.ashFaint }}>No one yet.</p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {showPatchViewer && ev.checkInPatch?.imageUrl && (
        <div
          onClick={() => setShowPatchViewer(false)}
          className="fixed inset-0 flex flex-col items-center justify-center px-6"
          style={{ background: "rgba(0,0,0,0.88)", zIndex: 2000 }}
        >
          <button
            onClick={(e) => { e.stopPropagation(); setShowPatchViewer(false); }}
            className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.15)", borderRadius: 999 }}
          >
            <X size={20} color="#FFFFFF" />
          </button>
          <img
            src={ev.checkInPatch.imageUrl}
            alt={ev.checkInPatch.name}
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "78%", maxHeight: "55vh", objectFit: "contain" }}
          />
          <div className="text-[17px] font-semibold mt-4" style={{ ...display, color: "#FFFFFF" }}>
            {ev.checkInPatch.name}
          </div>
        </div>
      )}
    </div>
  );
}

function FieldDetailScreen({ field, fieldEvents, pastFieldEvents, relocatedField, onBack, onNavigate, onOpenEvent, onOpenField, favorited, onToggleFavorite, fieldsLoading }) {
  const { T, display, body, mono } = useTheme();
  const [showPastEvents, setShowPastEvents] = useState(false);
  const [shareState, setShareState] = useState(null);
  const handleShare = async () => {
    const fieldShareUrl = field?.id ? `https://playerapp.airsoftatlas.app/?field=${field.id}` : undefined;
    const result = await shareContent(field?.name, `${field?.name}${field?.city ? ` — ${field.city}` : ""}.`, fieldShareUrl);
    if (result === "copied") {
      setShareState("copied");
      setTimeout(() => setShareState(null), 2000);
    }
  };
  if (!field) {
    // A deep link (?field=<slug>) can land here before useFields()'s
    // real-time listener has resolved its first snapshot — don't flash
    // "not found" while that's still in flight.
    return (
      <div className="h-full flex flex-col items-center justify-center" style={{ backgroundColor: T.void }}>
        <p className="text-[13px]" style={{ ...body, color: T.ashDim }}>
          {fieldsLoading ? "Loading field…" : "Field not found."}
        </p>
        <BottomNav active="home" onNavigate={onNavigate} />
      </div>
    );
  }
  const statusLabel = STATUS_LABEL[field.status];
  const links = [
    { label: "Website", url: field.website },
    { label: "Facebook", url: field.facebook },
    { label: "Instagram", url: field.instagram },
    { label: "Discord", url: field.discord },
    { label: "YouTube", url: field.youtube },
    { label: "TikTok", url: field.tiktok },
  ].filter((l) => l.url);

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: T.void }}>
      <div className="flex-1 overflow-y-auto pb-24">
        <div className="h-60 relative" style={heroStyle(field.imageUrl, field.id)}>
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-5 pt-3">
            <button onClick={onBack} className="w-9 h-9 flex items-center justify-center" style={{ background: "rgba(255,255,255,0.92)", borderRadius: T.rPill, boxShadow: "0 2px 8px rgba(0,0,0,0.18)" }}>
              <ChevronLeft color={T.ash} size={19} />
            </button>
            <div className="flex gap-2">
              <button onClick={onToggleFavorite} className="w-9 h-9 flex items-center justify-center transition-transform duration-100 active:scale-90" style={{ background: "rgba(255,255,255,0.92)", borderRadius: T.rPill, boxShadow: "0 2px 8px rgba(0,0,0,0.18)" }}>
                <Heart size={17} color={favorited ? T.alert : T.ash} fill={favorited ? T.alert : "none"} />
              </button>
              <button onClick={handleShare} className="w-9 h-9 flex items-center justify-center transition-transform duration-100 active:scale-90" style={{ background: "rgba(255,255,255,0.92)", borderRadius: T.rPill, boxShadow: "0 2px 8px rgba(0,0,0,0.18)" }}>
                {shareState === "copied" ? <Check size={17} color={T.good} /> : <Share2 size={16} color={T.ash} />}
              </button>
            </div>
          </div>
          <div className="absolute bottom-4 left-5 right-5">
            <div className="flex gap-2 mb-2">
              {field.indoorOutdoor && <Tag>{field.indoorOutdoor.toUpperCase()}</Tag>}
              {statusLabel && <Tag tone="live">{statusLabel}</Tag>}
              {!statusLabel && field.status === "active" && <Tag tone="good">ACTIVE</Tag>}
              {!statusLabel && field.status === "private-booking" && <Tag tone="accent">PRIVATE BOOKING</Tag>}
            </div>
            <div
              className="text-[24px] font-semibold"
              style={{ ...display, color: "#FFFFFF", textShadow: "0 1px 4px rgba(0,0,0,0.65)", WebkitTextStroke: "0.4px rgba(0,0,0,0.35)" }}
            >
              {field.name}
            </div>
          </div>
        </div>

        <div className="px-5 mt-4 flex flex-col gap-3">
          {field.notes && (
            <div className="p-4" style={{ background: statusLabel ? "rgba(240,85,74,0.1)" : T.panel, border: `1px solid ${statusLabel ? T.alert : T.line}`, borderRadius: 6 }}>
              <p className="text-[12px] leading-relaxed mb-2" style={{ ...body, color: T.ashDim }}>{field.notes}</p>
              {relocatedField && (
                <button
                  onClick={() => onOpenField(relocatedField)}
                  className="flex items-center justify-between w-full mt-1 px-3 py-2"
                  style={{ background: T.panelAlt, borderRadius: T.rPill }}
                >
                  <span className="text-[12px] font-semibold" style={{ ...display, color: T.ash }}>
                    View events at {relocatedField.name}
                  </span>
                  <ArrowRight size={14} color={T.ashDim} />
                </button>
              )}
            </div>
          )}

          {field.homeTeam && (
            <div className="p-4 flex items-center gap-3" style={{ background: T.panel, borderRadius: T.rCard, boxShadow: T.shadowMd }}>
              <div className="w-14 h-14 flex-shrink-0 flex items-center justify-center" style={{ background: T.panelAlt, borderRadius: 4 }}>
                <img
                  src={field.homeTeam.patchUrl}
                  alt={`${field.homeTeam.name} team patch`}
                  className="w-full h-full"
                  style={{ objectFit: "contain" }}
                />
              </div>
              <div className="flex-1">
                <div className="text-[11px] font-medium" style={{ ...body, color: T.ashFaint }}>Home Field Of</div>
                <div className="text-[16px] font-semibold" style={{ ...display, color: T.ash }}>{field.homeTeam.name}</div>
              </div>
            </div>
          )}

          {field.about && (
            <div className="p-4" style={{ background: T.panel, borderRadius: T.rCard, boxShadow: T.shadowMd }}>
              <Eyebrow>About the Field</Eyebrow>
              <p className="text-[13px] leading-relaxed" style={{ ...body, color: T.ashDim }}>{field.about}</p>
            </div>
          )}

          <FieldFacts field={field} />

          <div className="p-4" style={{ background: T.panel, borderRadius: T.rCard, boxShadow: T.shadowMd }}>
            <Eyebrow>Scheduled Events</Eyebrow>
            {fieldEvents.length === 0 ? (
              field.status === "private-booking" ? (
                <div>
                  <p className="text-[12px] leading-relaxed mb-2" style={{ ...body, color: T.ashFaint }}>
                    This field runs private group bookings rather than public open-play events — reserve directly with them.
                  </p>
                  {field.website && (
                    <a
                      href={field.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between w-full mt-1 px-3 py-2"
                      style={{ background: T.panelAlt, borderRadius: T.rPill }}
                    >
                      <span className="text-[12px] font-semibold" style={{ ...display, color: T.ash }}>Book on their website</span>
                      <ArrowRight size={14} color={T.ashDim} />
                    </a>
                  )}
                </div>
              ) : (
                <p className="text-[12px]" style={{ ...body, color: T.ashFaint }}>No upcoming events loaded for this field yet.</p>
              )
            ) : (
              <div className="flex flex-col">
                {fieldEvents.map((s, i) => (
                  <button
                    key={s.id}
                    onClick={() => onOpenEvent(s)}
                    className="flex items-center gap-3 py-2.5 text-left"
                    style={{ borderTop: i > 0 ? `1px solid ${T.line}` : "none" }}
                  >
                    <div className="w-11 h-11" style={{ ...heroStyle(s.imageUrl || field.imageUrl, s.id || s.title), borderRadius: 4 }} />
                    <div className="flex-1">
                      <div className="text-[13px] font-medium" style={{ ...body, color: T.ash }}>{s.title}</div>
                      <div className="text-[11px]" style={{ ...mono, color: T.ashFaint }}>{formatDate(s.date, s.endDate)}</div>
                    </div>
                    {s.checkInPatch?.imageUrl && (
                      <div
                        className="flex items-center gap-1 pl-1 pr-2 py-0.5 flex-shrink-0"
                        style={{ background: T.panelAlt, borderRadius: T.rPill }}
                        title={`Check-in reward: ${s.checkInPatch.name}`}
                      >
                        <img src={s.checkInPatch.imageUrl} alt="" className="w-4 h-4" style={{ objectFit: "cover", borderRadius: 999 }} />
                        <span className="text-[10px] font-semibold" style={{ ...mono, color: T.ashDim }}>Patch</span>
                      </div>
                    )}
                    {s.price && <div className="text-[13px] font-semibold" style={{ ...mono, color: T.accent }}>{displayPrice(s.price)}</div>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {pastFieldEvents.length > 0 && (
            <div style={{ background: T.panel, borderRadius: T.rCard, boxShadow: T.shadowMd, overflow: "hidden" }}>
              <button
                onClick={() => setShowPastEvents(!showPastEvents)}
                className="w-full p-4 flex items-center justify-between transition-transform duration-100 active:scale-[0.99]"
              >
                <span className="text-[12px] font-medium" style={{ ...body, color: T.ashFaint }}>
                  Past Events ({pastFieldEvents.length})
                </span>
                <ChevronRight size={14} color={T.ashFaint} style={{ transform: showPastEvents ? "rotate(90deg)" : "none" }} />
              </button>
              {showPastEvents && (
                <div className="px-4 pb-2" style={{ borderTop: `1px solid ${T.line}` }}>
                  {pastFieldEvents.map((s, i) => (
                    <button
                      key={s.id}
                      onClick={() => onOpenEvent(s)}
                      className="flex items-center gap-3 py-2.5 text-left w-full"
                      style={{ borderTop: i > 0 ? `1px solid ${T.line}` : "none", opacity: 0.65 }}
                    >
                      <div className="w-11 h-11" style={{ ...heroStyle(s.imageUrl || field.imageUrl, s.id || s.title), borderRadius: 4 }} />
                      <div className="flex-1">
                        <div className="text-[13px] font-medium" style={{ ...body, color: T.ash }}>{s.title}</div>
                        <div className="text-[11px]" style={{ ...mono, color: T.ashFaint }}>{formatDate(s.date, s.endDate)}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <LocationCard label="Field Location" address={fullAddress(field)} lat={field.lat} lng={field.lng} />

          {field.phone && (
            <a
              href={`tel:${field.phone.replace(/[^\d+]/g, "")}`}
              className="p-4 flex items-center justify-between"
              style={{ background: T.panel, borderRadius: T.rCard, boxShadow: T.shadowMd }}
            >
              <span className="flex items-center gap-2 text-[13px] font-medium" style={{ ...mono, color: T.ash }}>
                <Phone size={14} color={T.ashFaint} /> {field.phone}
              </span>
              <span className="text-[11px] font-semibold" style={{ ...display, color: T.accent }}>Call</span>
            </a>
          )}

          {links.length > 0 && (
            <div className="flex flex-col gap-2">
              {links.map((l) => (
                <a
                  key={l.label}
                  href={l.url}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-3 font-medium text-[13px] text-center"
                  style={{ ...body, border: `1px solid ${T.line}`, color: T.ash, borderRadius: T.rPill }}
                >
                  {l.label}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
      <BottomNav active="home" onNavigate={onNavigate} />
    </div>
  );
}

function FavoritesScreen({ onNavigate, favorites, favoritesLoading, fields, onOpenField }) {
  const { T, display, body, mono } = useTheme();
  const savedFieldIds = favorites.filter((f) => f.type === "field").map((f) => f.refId);
  const savedFields = fields.filter((f) => savedFieldIds.includes(f.id));

  return (
    <div className="h-full overflow-y-auto pb-24" style={{ backgroundColor: T.void }}>
      <ScreenHeader title="Favorites" />
      <div className="px-6 pt-5">
        {favoritesLoading ? (
          <div className="text-[13px] py-6 text-center" style={{ ...body, color: T.ashFaint }}>Loading favorites…</div>
        ) : (
          <>
            <Eyebrow>Saved Fields</Eyebrow>
            <p className="text-[11px] mb-3 -mt-1" style={{ ...body, color: T.ashFaint }}>
              Quick access to fields you like. Saved events live in Schedule now, under Interested.
            </p>
            {savedFields.length === 0 ? (
              <p className="text-[13px]" style={{ ...body, color: T.ashFaint }}>
                No fields saved yet — tap the heart on any field's page to save it here.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {savedFields.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => onOpenField(f)}
                    className="p-3 flex items-center gap-3 text-left"
                    style={{ background: T.panel, borderRadius: T.rCard, boxShadow: T.shadowMd }}
                  >
                    <div className="w-14 h-14" style={{ ...heroStyle(f.imageUrl, f.id), borderRadius: 4 }} />
                    <div className="flex-1">
                      <div className="text-[14px] font-semibold" style={{ ...display, color: T.ash }}>{f.name}</div>
                      <div className="text-[12px]" style={{ ...body, color: T.ashFaint }}>{f.city}</div>
                    </div>
                    <ChevronRight size={16} color={T.ashFaint} />
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
      <BottomNav active="favorites" onNavigate={onNavigate} />
    </div>
  );
}

function ScheduleScreen({ onNavigate, favorites, events, onOpenEvent, myBookings, myBookingsLoading, tab, setTab, fields }) {
  const { T, display, body, mono } = useTheme();
  // tab (booked | interested | past) now lives in AppShell as scheduleTab,
  // passed down as a prop — see the homeSearch/homeActiveCat/etc. pattern
  // above for why: this component only renders while screen === "schedule",
  // so a local useState here would reset every time a player opened an
  // event from this list and came back.
  const today = localDateStr();
  const savedEventIds = favorites.filter((f) => f.type === "event").map((f) => f.refId);

  const interested = events
    .filter((e) => savedEventIds.includes(e.id) && (e.endDate || e.date) >= today)
    .sort((a, b) => a.date.localeCompare(b.date));
  // Real bookings, cross-referenced against the live events list so
  // capacity/details stay current. Filters out any booking whose event no
  // longer exists. Carries the booking's own checkedIn flag onto the event
  // object — it lives on the booking, not the event, but this list is the
  // one place a player would want to see it reflected.
  const bookedAll = myBookings
    .map((b) => {
      const ev = events.find((e) => e.id === b.eventId);
      return ev ? { ...ev, checkedIn: b.checkedIn } : null;
    })
    .filter(Boolean);
  // Reserved is strictly upcoming, per Michael — a reserved game that's
  // already happened belongs in Past, not lingering here with a "PAST" tag.
  const booked = bookedAll
    .filter((ev) => (ev.endDate || ev.date) >= today)
    .sort((a, b) => a.date.localeCompare(b.date));
  const bookedPast = bookedAll.filter((ev) => (ev.endDate || ev.date) < today);
  // Past = anything that's over and was either favorited or actually
  // reserved, deduped by event id so a game that was both doesn't show up
  // twice — the booked copy wins when both exist, since it carries the
  // real checkedIn status a plain favorite never has.
  const pastMap = new Map();
  events
    .filter((e) => savedEventIds.includes(e.id) && (e.endDate || e.date) < today)
    .forEach((ev) => pastMap.set(ev.id, ev));
  bookedPast.forEach((ev) => pastMap.set(ev.id, ev));
  const past = [...pastMap.values()].sort((a, b) => b.date.localeCompare(a.date));

  const TABS = [
    { key: "booked", label: "Reserved" },
    { key: "interested", label: "Interested" },
    { key: "past", label: "Past" },
  ];

  const renderList = (list, dim) => (
    <div className="flex flex-col gap-3">
      {list.map((ev) => {
        const isPastEv = dim === "auto" ? (ev.endDate || ev.date) < today : dim;
        return (
          <button
            key={ev.id}
            onClick={() => onOpenEvent(ev)}
            className="p-3 flex items-center gap-3 text-left w-full"
            style={{ background: T.panel, borderRadius: T.rCard, boxShadow: T.shadowMd, opacity: isPastEv ? 0.65 : 1 }}
          >
            <div className="w-12 h-12" style={{ ...heroStyle(ev.imageUrl || fields.find((f) => f.id === ev.fieldId)?.imageUrl, ev.id || ev.title), borderRadius: 4 }} />
            <div className="flex-1">
              <div className="text-[13px] font-medium" style={{ ...body, color: T.ash }}>{ev.title}</div>
              <div className="text-[11px]" style={{ ...body, color: T.ashFaint }}>{ev.fieldName}</div>
              <div className="text-[11px] font-medium" style={{ ...mono, color: isPastEv ? T.ashFaint : T.accent }}>{formatDate(ev.date, ev.endDate)}</div>
            </div>
            {ev.canceled ? <Tag tone="alert">CANCELED</Tag> : ev.checkedIn ? <Tag tone="good">CHECKED IN</Tag> : isPastEv ? <Tag tone="good">PAST</Tag> : <ChevronRight size={16} color={T.ashFaint} />}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="h-full overflow-y-auto pb-24" style={{ backgroundColor: T.void }}>
      <ScreenHeader title="Schedule" />

      <div className="px-6 pt-3 pb-1 flex gap-1" style={{ borderBottom: `1px solid ${T.line}` }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="px-3 py-2 text-[13px] font-semibold"
            style={{ ...body, color: tab === t.key ? T.ash : T.ashFaint, borderBottom: tab === t.key ? `2px solid ${T.ash}` : "2px solid transparent" }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="px-6 pt-4">
        {tab === "booked" && (
          myBookingsLoading ? (
            <p className="text-[13px] py-6 text-center" style={{ ...body, color: T.ashFaint }}>Loading…</p>
          ) : booked.length === 0 ? (
            <div className="p-6 flex flex-col items-center text-center" style={{ background: T.panel, borderRadius: T.rCard, boxShadow: T.shadowMd }}>
              <div className="w-14 h-14 flex items-center justify-center mb-3" style={{ background: T.panelAlt, borderRadius: 4 }}>
                <Calendar size={22} color={T.ashDim} strokeWidth={1.7} />
              </div>
              <div className="text-[16px] font-semibold mb-1" style={{ ...display, color: T.ash }}>No reserved games</div>
              <p className="text-[13px]" style={{ ...body, color: T.ashDim }}>
                Reserve an event from its detail page and it'll show up here — separate from what you're just interested in.
              </p>
            </div>
          ) : renderList(booked, false)
        )}

        {tab === "interested" && (
          interested.length === 0 ? (
            <div className="p-6 flex flex-col items-center text-center" style={{ background: T.panel, borderRadius: T.rCard, boxShadow: T.shadowMd }}>
              <div className="w-14 h-14 flex items-center justify-center mb-3" style={{ background: T.panelAlt, borderRadius: 4 }}>
                <Calendar size={22} color={T.ashDim} strokeWidth={1.7} />
              </div>
              <div className="text-[16px] font-semibold mb-1" style={{ ...display, color: T.ash }}>Nothing here yet</div>
              <p className="text-[13px] mb-4" style={{ ...body, color: T.ashDim }}>
                Save an event's heart on its detail page and it'll show up here.
              </p>
              <button
                onClick={() => onNavigate("home")}
                className="w-full py-3 font-semibold text-[13px]"
                style={{ ...display, background: T.cta, color: T.inverse, borderRadius: T.rPill, boxShadow: T.shadowMd }}
              >
                Start your search
              </button>
            </div>
          ) : renderList(interested, false)
        )}

        {tab === "past" && (
          past.length === 0 ? (
            <p className="text-[13px] py-6 text-center" style={{ ...body, color: T.ashFaint }}>
              Events you've favorited or reserved will move here once they're over.
            </p>
          ) : renderList(past, true)
        )}
      </div>
      <BottomNav active="schedule" onNavigate={onNavigate} />
    </div>
  );
}


function SocialScreen({ onNavigate, onOpenTeam, onOpenPlayer, profile, user, teams, teamsLoading, createTeam,
  allProfiles, friends, friendsLoading, incomingRequests, outgoingRequestUids, sendRequest, acceptRequest, declineRequest, cancelOrUnfriend,
  tab, setTab }) {
  const { T, display, body, mono } = useTheme();
  // tab (friends | teams) now lives in AppShell as socialTab, passed down
  // as a prop — same fix as scheduleTab/homeSearch etc. above: this
  // component only renders while screen === "inbox", so a local useState
  // here would reset every time a player opened a friend/team and came back.

  return (
    <div className="h-full overflow-y-auto pb-24" style={{ backgroundColor: T.void }}>
      <ScreenHeader title="Social" />
      <div className="px-6 pt-3 pb-1 flex gap-1" style={{ borderBottom: `1px solid ${T.line}` }}>
        {[["friends", "Friends"], ["teams", "Teams"]].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className="px-3 py-2 text-[13px] font-semibold"
            style={{ ...body, color: tab === key ? T.ash : T.ashFaint, borderBottom: tab === key ? `2px solid ${T.ash}` : "2px solid transparent" }}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "friends" ? (
        <FriendsTabContent
          onOpenPlayer={onOpenPlayer}
          user={user}
          allProfiles={allProfiles}
          friends={friends}
          friendsLoading={friendsLoading}
          incomingRequests={incomingRequests}
          outgoingRequestUids={outgoingRequestUids}
          sendRequest={sendRequest}
          acceptRequest={acceptRequest}
          declineRequest={declineRequest}
          cancelOrUnfriend={cancelOrUnfriend}
          profile={profile}
        />
      ) : (
        <TeamsTabContent onOpenTeam={onOpenTeam} profile={profile} user={user} teams={teams} teamsLoading={teamsLoading} createTeam={createTeam} />
      )}

      <BottomNav active="inbox" onNavigate={onNavigate} />
    </div>
  );
}

function FriendsTabContent({ onOpenPlayer, user, allProfiles, friends, friendsLoading, incomingRequests, outgoingRequestUids,
  sendRequest, acceptRequest, declineRequest, cancelOrUnfriend, profile }) {
  const { T, display, body, mono } = useTheme();
  const [search, setSearch] = useState("");
  const friendUids = new Set(friends.map((f) => f.uid));

  const searchResults = search.trim()
    ? allProfiles.filter((p) => p.uid !== user?.uid && p.callsign.toLowerCase().includes(search.toLowerCase()))
    : [];

  const relationshipBadge = (otherUid) => {
    if (friendUids.has(otherUid)) return "friends";
    if (outgoingRequestUids.has(otherUid)) return "pending";
    return "none";
  };

  const handleAdd = async (other) => {
    await sendRequest(user.uid, profile, other.uid, other);
  };

  return (
    <div className="px-6 pt-4">
      <div className="mb-4 flex items-center gap-2 px-4 py-2.5" style={{ background: T.panel, borderRadius: T.rPill, boxShadow: T.shadowMd }}>
        <Search size={15} color={T.ashFaint} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search players by callsign"
          className="flex-1 text-[13px] bg-transparent outline-none"
          style={{ ...body, color: T.ash }}
        />
      </div>

      {search.trim() ? (
        <div className="mb-6">
          {searchResults.length === 0 ? (
            <p className="text-[13px] py-4 text-center" style={{ ...body, color: T.ashFaint }}>No players match "{search}".</p>
          ) : (
            searchResults.map((p) => {
              const rel = relationshipBadge(p.uid);
              return (
                <div key={p.uid} className="mb-2 p-3 flex items-center gap-3" style={{ background: T.panel, borderRadius: T.rCard, boxShadow: T.shadowMd }}>
                  <button onClick={() => onOpenPlayer(p.uid)} className="flex-1 flex items-center gap-3 text-left">
                    {p.avatarUrl ? (
                      <div className="w-10 h-10 flex-shrink-0" style={{ backgroundImage: `url("${p.avatarUrl}")`, backgroundSize: "cover", backgroundPosition: "center", borderRadius: 999 }} />
                    ) : (
                      <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center text-[13px] font-semibold" style={{ ...display, background: T.panelAlt, borderRadius: 999, color: T.ash }}>
                        {p.callsign.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="text-[13px] font-semibold" style={{ ...display, color: T.ash }}>{p.callsign}</span>
                  </button>
                  {rel === "friends" ? (
                    <span className="text-[11px] font-medium" style={{ ...body, color: T.good }}>Friends</span>
                  ) : rel === "pending" ? (
                    <span className="text-[11px] font-medium" style={{ ...body, color: T.ashFaint }}>Request Sent</span>
                  ) : (
                    <button onClick={() => handleAdd(p)} className="px-2.5 py-1.5 text-[11px] font-semibold" style={{ ...display, background: T.cta, color: T.inverse, borderRadius: T.rPill, boxShadow: T.shadowSm }}>
                      Add Friend
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      ) : (
        <>
          {incomingRequests.length > 0 && (
            <>
              <Eyebrow>Friend Requests</Eyebrow>
              <div className="mb-5 flex flex-col gap-2">
                {incomingRequests.map((r) => (
                  <div key={r.id} className="p-3 flex items-center gap-3" style={{ background: T.panel, borderRadius: T.rCard, boxShadow: T.shadowMd, outline: `1.5px solid ${T.accent}`, outlineOffset: -1 }}>
                    <button onClick={() => onOpenPlayer(r.fromUid)} className="flex-1 flex items-center gap-3 text-left">
                      {r.fromAvatarUrl ? (
                        <div className="w-10 h-10 flex-shrink-0" style={{ backgroundImage: `url("${r.fromAvatarUrl}")`, backgroundSize: "cover", backgroundPosition: "center", borderRadius: 999 }} />
                      ) : (
                        <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center text-[13px] font-semibold" style={{ ...display, background: T.panelAlt, borderRadius: 999, color: T.ash }}>
                          {r.fromCallsign.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="text-[13px] font-semibold" style={{ ...display, color: T.ash }}>{r.fromCallsign}</span>
                    </button>
                    <button onClick={() => declineRequest(r.id)} className="px-2.5 py-1.5 text-[11px] font-semibold" style={{ ...body, border: `1px solid ${T.line}`, color: T.ashDim, borderRadius: T.rPill }}>
                      Decline
                    </button>
                    <button onClick={() => acceptRequest(r.id)} className="px-2.5 py-1.5 text-[11px] font-semibold" style={{ ...display, background: T.good, color: T.inverse, borderRadius: T.rPill, boxShadow: T.shadowSm }}>
                      Accept
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}

          <Eyebrow>My Friends</Eyebrow>
          {friendsLoading ? (
            <p className="text-[13px] py-4 text-center" style={{ ...body, color: T.ashFaint }}>Loading…</p>
          ) : friends.length === 0 ? (
            <p className="text-[13px] py-4 text-center" style={{ ...body, color: T.ashFaint }}>
              No friends yet — search for a callsign above to find someone.
            </p>
          ) : (
            friends.map((f) => (
              <button
                key={f.uid}
                onClick={() => onOpenPlayer(f.uid)}
                className="w-full mb-2 p-3 flex items-center gap-3 text-left"
                style={{ background: T.panel, borderRadius: T.rCard, boxShadow: T.shadowMd }}
              >
                {f.avatarUrl ? (
                  <div className="w-10 h-10 flex-shrink-0" style={{ backgroundImage: `url("${f.avatarUrl}")`, backgroundSize: "cover", backgroundPosition: "center", borderRadius: 999 }} />
                ) : (
                  <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center text-[13px] font-semibold" style={{ ...display, background: T.panelAlt, borderRadius: 999, color: T.ash }}>
                    {f.callsign.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="text-[13px] font-semibold flex-1" style={{ ...display, color: T.ash }}>{f.callsign}</span>
                <ChevronRight size={15} color={T.ashFaint} />
              </button>
            ))
          )}
        </>
      )}
    </div>
  );
}

function PlayerProfileScreen({ uid, onBack, currentUser, currentProfile, currentUserFriendUids, outgoingRequestUids,
  sendRequest, cancelOrUnfriend, events, onOpenEvent }) {
  const { T, display, body, mono } = useTheme();
  const { profile, profileLoading } = usePublicProfile(uid);
  const { favorites: theirFavorites } = useFavorites(uid);
  const { patches: theirPatches } = usePatches(uid);
  const [tab, setTab] = useState("interested");
  const [confirmUnfriend, setConfirmUnfriend] = useState(false);

  const today = localDateStr();
  const savedEventIds = theirFavorites.filter((f) => f.type === "event").map((f) => f.refId);
  const interested = events.filter((e) => savedEventIds.includes(e.id) && (e.endDate || e.date) >= today);
  const past = events.filter((e) => savedEventIds.includes(e.id) && (e.endDate || e.date) < today);

  const isFriend = currentUserFriendUids.has(uid);
  const isPending = outgoingRequestUids.has(uid);
  const isSelf = uid === currentUser?.uid;

  // Only actually queries when they're a real, confirmed friend — the
  // rules enforce this too, but gating the call itself avoids a doomed
  // request and console noise for anyone who isn't. Friends-only, on
  // purpose: a booking is a real commitment ("I will be at this specific
  // place, on this date"), not a soft signal like a favorite, and that's
  // real physical-location information worth keeping away from strangers.
  const { bookings: theirBookings, bookingsLoading: theirBookingsLoading } = useMyBookings(isFriend || isSelf ? uid : null);
  const booked = theirBookings
    .map((b) => events.find((e) => e.id === b.eventId))
    .filter(Boolean)
    .sort((a, b) => a.date.localeCompare(b.date));

  if (profileLoading) {
    return (
      <div className="h-full flex items-center justify-center" style={{ backgroundColor: T.void }}>
        <p className="text-[13px]" style={{ ...body, color: T.ashDim }}>Loading…</p>
      </div>
    );
  }
  if (!profile) {
    return (
      <div className="h-full flex flex-col items-center justify-center" style={{ backgroundColor: T.void }}>
        <p className="text-[13px]" style={{ ...body, color: T.ashDim }}>Player not found.</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto pb-6" style={{ backgroundColor: T.void }}>
      <div className="px-6 pt-2 pb-4 flex items-center" style={{ borderBottom: `1px solid ${T.line}` }}>
        <button onClick={onBack} className="w-9 h-9 -ml-2 flex items-center justify-center">
          <ChevronLeft size={20} color={T.ash} />
        </button>
        <h1 className="flex-1 text-center text-[18px] font-semibold mr-9" style={{ ...display, color: T.ash }}>{profile.callsign}</h1>
      </div>

      <div className="px-6 pt-5 flex flex-col items-center text-center">
        {profile.avatarUrl ? (
          <div className="w-20 h-20 mb-3" style={{ backgroundImage: `url("${profile.avatarUrl}")`, backgroundSize: "cover", backgroundPosition: "center", borderRadius: 999, border: `1px solid ${T.line}` }} />
        ) : (
          <div className="w-20 h-20 mb-3 flex items-center justify-center text-[24px] font-semibold" style={{ ...display, background: T.panelAlt, borderRadius: 999, color: T.ash }}>
            {profile.callsign.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-[18px] font-semibold" style={{ ...display, color: T.ash }}>{profile.callsign}</span>
          {profile.verified && <BadgeCheck size={16} color={T.accent} />}
        </div>
        {profile.teamName && <div className="text-[12px] mb-3" style={{ ...body, color: T.ashDim }}>{profile.teamName}</div>}

        {!isSelf && (
          <>
            {isFriend ? (
              confirmUnfriend ? (
                <div className="flex gap-2 mb-4" style={{ maxWidth: 280 }}>
                  <button onClick={() => setConfirmUnfriend(false)} className="flex-1 py-2 text-[12px] font-medium" style={{ ...body, border: `1px solid ${T.line}`, color: T.ashDim, borderRadius: T.rPill }}>Cancel</button>
                  <button onClick={() => { cancelOrUnfriend(currentUser.uid, uid); setConfirmUnfriend(false); }} className="flex-1 py-2 text-[12px] font-semibold" style={{ ...display, background: T.alert, color: T.inverse, borderRadius: T.rPill, boxShadow: T.shadowSm }}>Unfriend</button>
                </div>
              ) : (
                <button onClick={() => setConfirmUnfriend(true)} className="px-4 py-2 mb-4 text-[13px] font-semibold" style={{ ...body, border: `1px solid ${T.line}`, color: T.ashDim, borderRadius: T.rPill }}>Friends ✓</button>
              )
            ) : isPending ? (
              <span className="px-4 py-2 mb-4 text-[13px] font-medium" style={{ ...body, color: T.ashFaint }}>Request Sent</span>
            ) : (
              <button onClick={() => sendRequest(currentUser.uid, currentProfile, uid, profile)} className="px-4 py-2 mb-4 text-[13px] font-semibold" style={{ ...display, background: T.cta, color: T.inverse, borderRadius: T.rPill, boxShadow: T.shadowSm }}>
                + Add Friend
              </button>
            )}
          </>
        )}
      </div>

      <div className="px-6">
        <div className="grid grid-cols-2 gap-2 mb-5">
          <div className="p-3 text-center" style={{ background: T.panel, borderRadius: T.rCard, boxShadow: T.shadowMd }}>
            <div className="text-[16px] font-semibold" style={{ ...display, color: T.ash }}>
              {profile.createdAt?.toDate ? profile.createdAt.toDate().getFullYear() : "—"}
            </div>
            <div className="text-[10px]" style={{ ...body, color: T.ashFaint }}>Member Since</div>
          </div>
          <div className="p-3 text-center" style={{ background: T.panel, borderRadius: T.rCard, boxShadow: T.shadowMd }}>
            <div className="text-[16px] font-semibold" style={{ ...display, color: T.ash }}>{theirPatches.length}</div>
            <div className="text-[10px]" style={{ ...body, color: T.ashFaint }}>Patches</div>
          </div>
        </div>

        {theirPatches.length > 0 && (
          <>
            <Eyebrow>Patches</Eyebrow>
            <div className="grid grid-cols-4 gap-2 mb-5">
              {theirPatches.map((p) => (
                <div key={p.id} className="aspect-square flex items-center justify-center" style={{ background: T.panel, borderRadius: T.rCard, boxShadow: T.shadowMd }}>
                  <img src={p.imageUrl} alt={p.name} className="w-full h-full" style={{ objectFit: "contain", padding: 6 }} />
                </div>
              ))}
            </div>
          </>
        )}

        <div className="flex gap-1 mb-3" style={{ borderBottom: `1px solid ${T.line}` }}>
          {[["booked", "Reserved"], ["interested", "Interested"], ["past", "Past"]].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className="px-3 py-2 text-[12px] font-semibold"
              style={{ ...body, color: tab === key ? T.ash : T.ashFaint, borderBottom: tab === key ? `2px solid ${T.ash}` : "2px solid transparent" }}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "booked" && (
          !isFriend && !isSelf ? (
            <p className="text-[12px] py-4 text-center" style={{ ...body, color: T.ashFaint }}>Only visible to friends.</p>
          ) : theirBookingsLoading ? (
            <p className="text-[12px] py-4 text-center" style={{ ...body, color: T.ashFaint }}>Loading…</p>
          ) : booked.length === 0 ? (
            <p className="text-[12px] py-4 text-center" style={{ ...body, color: T.ashFaint }}>No reserved games.</p>
          ) : (
            booked.map((ev) => (
              <button key={ev.id} onClick={() => onOpenEvent(ev)} className="mb-2 p-3 w-full text-left" style={{ background: T.panel, borderRadius: T.rCard, boxShadow: T.shadowMd }}>
                <div className="text-[13px] font-medium" style={{ ...body, color: T.ash }}>{ev.title}</div>
                <div className="text-[11px]" style={{ ...body, color: T.ashFaint }}>{ev.fieldName}</div>
              </button>
            ))
          )
        )}
        {tab === "interested" && (
          interested.length === 0 ? <p className="text-[12px] py-4 text-center" style={{ ...body, color: T.ashFaint }}>Nothing upcoming.</p> :
          interested.map((ev) => (
            <button key={ev.id} onClick={() => onOpenEvent(ev)} className="mb-2 p-3 w-full text-left" style={{ background: T.panel, borderRadius: T.rCard, boxShadow: T.shadowMd }}>
              <div className="text-[13px] font-medium" style={{ ...body, color: T.ash }}>{ev.title}</div>
              <div className="text-[11px]" style={{ ...body, color: T.ashFaint }}>{ev.fieldName}</div>
            </button>
          ))
        )}
        {tab === "past" && (
          past.length === 0 ? <p className="text-[12px] py-4 text-center" style={{ ...body, color: T.ashFaint }}>No past events.</p> :
          past.map((ev) => (
            <button key={ev.id} onClick={() => onOpenEvent(ev)} className="mb-2 p-3 w-full text-left" style={{ background: T.panel, borderRadius: T.rCard, boxShadow: T.shadowMd, opacity: 0.7 }}>
              <div className="text-[13px] font-medium" style={{ ...body, color: T.ash }}>{ev.title}</div>
              <div className="text-[11px]" style={{ ...body, color: T.ashFaint }}>{ev.fieldName}</div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

function TeamsTabContent({ onOpenTeam, profile, user, teams, teamsLoading, createTeam }) {
  const { T, display, body, mono } = useTheme();
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [teamDesc, setTeamDesc] = useState("");
  const fileInputRef = useRef(null);
  const [pickedFile, setPickedFile] = useState(null);
  const [pickedPreview, setPickedPreview] = useState(null);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const myTeam = profile?.teamId ? teams.find((t) => t.id === profile.teamId) : null;
  const filteredTeams = teams.filter((t) => t.name.toLowerCase().includes(search.toLowerCase()));

  const handlePick = () => fileInputRef.current?.click();
  const handleFileSelected = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setPickedFile(file);
    setPickedPreview(URL.createObjectURL(file));
  };

  const handleCreate = async () => {
    if (!teamName.trim()) return;
    setCreating(true);
    setCreateError("");
    try {
      const patchBlob = pickedFile ? await resizeImageFile(pickedFile, 400, 0.9) : null;
      const teamId = await createTeam(user.uid, profile, { name: teamName.trim(), description: teamDesc.trim(), patchBlob });
      setShowCreate(false);
      setTeamName("");
      setTeamDesc("");
      setPickedFile(null);
      setPickedPreview(null);
      onOpenTeam(teamId);
    } catch (err) {
      setCreateError(err.message || "Couldn't create that team — try again.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="px-6 pt-4">
        {myTeam && (
          <>
            <Eyebrow>My Team</Eyebrow>
            <button
              onClick={() => onOpenTeam(myTeam.id)}
              className="w-full mb-5 p-3 flex items-center gap-3 text-left transition-transform duration-100 active:scale-[0.98]"
              style={{ background: T.panel, borderRadius: T.rCard, boxShadow: T.shadowMd, outline: `1.5px solid ${T.accent}`, outlineOffset: -1 }}
            >
              <div className="w-14 h-14 flex-shrink-0 flex items-center justify-center" style={{ background: T.panelAlt, borderRadius: 4 }}>
                {myTeam.patchUrl ? (
                  <img src={myTeam.patchUrl} alt={myTeam.name} className="w-full h-full" style={{ objectFit: "contain" }} />
                ) : (
                  <Shield size={22} color={T.ashDim} />
                )}
              </div>
              <div className="flex-1">
                <div className="text-[15px] font-semibold" style={{ ...display, color: T.ash }}>{myTeam.name}</div>
                <div className="text-[11px]" style={{ ...body, color: T.ashFaint }}>View roster & team info</div>
              </div>
              <ChevronRight size={16} color={T.ashFaint} />
            </button>
          </>
        )}

        <div className="mb-4 flex items-center justify-between">
          <Eyebrow>{myTeam ? "Other Teams" : "Find a Team"}</Eyebrow>
          <button onClick={() => setShowCreate(!showCreate)} className="text-[12px] font-semibold" style={{ ...body, color: T.accent }}>
            {showCreate ? "Cancel" : "+ Create a Team"}
          </button>
        </div>

        {showCreate && (
          <div className="mb-4 p-4" style={{ background: T.panel, borderRadius: T.rCard, boxShadow: T.shadowMd }}>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelected} className="hidden" />
            <div className="flex items-center gap-3 mb-3">
              <button onClick={handlePick} className="w-14 h-14 flex-shrink-0 flex items-center justify-center" style={{ background: T.panelAlt, borderRadius: T.rPill }}>
                {pickedPreview ? (
                  <img src={pickedPreview} alt="Preview" className="w-full h-full" style={{ objectFit: "contain" }} />
                ) : (
                  <Camera size={18} color={T.ashDim} />
                )}
              </button>
              <input
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="Team name"
                className="flex-1 px-3 py-2.5 text-[14px] bg-transparent outline-none"
                style={{ ...body, background: T.panelAlt, border: `1px solid ${T.line}`, borderRadius: 4, color: T.ash }}
              />
            </div>
            <textarea
              value={teamDesc}
              onChange={(e) => setTeamDesc(e.target.value)}
              placeholder="Short description (optional)"
              rows={2}
              className="w-full px-3 py-2.5 text-[13px] bg-transparent outline-none mb-3"
              style={{ ...body, background: T.panelAlt, border: `1px solid ${T.line}`, borderRadius: 4, color: T.ash, resize: "none" }}
            />
            {createError && <p className="text-[11px] mb-2" style={{ ...body, color: T.alert }}>{createError}</p>}
            <button
              onClick={handleCreate}
              disabled={!teamName.trim() || creating}
              className="w-full py-2.5 text-[13px] font-semibold"
              style={{ ...display, background: T.cta, color: T.inverse, borderRadius: T.rPill, boxShadow: T.shadowMd, opacity: !teamName.trim() || creating ? 0.5 : 1 }}
            >
              {creating ? "Creating…" : "Create Team"}
            </button>
          </div>
        )}

        <div className="mb-4 flex items-center gap-2 px-4 py-2.5" style={{ background: T.panel, borderRadius: T.rPill, boxShadow: T.shadowMd }}>
          <Users size={15} color={T.ashFaint} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search teams"
            className="flex-1 text-[13px] bg-transparent outline-none"
            style={{ ...body, color: T.ash }}
          />
        </div>

        {teamsLoading ? (
          <div className="text-[13px] py-6 text-center" style={{ ...body, color: T.ashFaint }}>Loading teams…</div>
        ) : filteredTeams.length === 0 ? (
          <div className="text-[13px] py-6 text-center" style={{ ...body, color: T.ashFaint }}>
            {teams.length === 0 ? "No teams yet — be the first to create one." : `No teams match "${search}".`}
          </div>
        ) : (
          filteredTeams.map((t) => (
            <button
              key={t.id}
              onClick={() => onOpenTeam(t.id)}
              className="w-full mb-3 p-3 flex items-center gap-3 text-left transition-transform duration-100 active:scale-[0.98]"
              style={{ background: T.panel, borderRadius: T.rCard, boxShadow: T.shadowMd }}
            >
              <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center" style={{ background: T.panelAlt, borderRadius: 4 }}>
                {t.patchUrl ? (
                  <img src={t.patchUrl} alt={t.name} className="w-full h-full" style={{ objectFit: "contain" }} />
                ) : (
                  <Shield size={18} color={T.ashDim} />
                )}
              </div>
              <div className="flex-1">
                <div className="text-[14px] font-semibold" style={{ ...display, color: T.ash }}>{t.name}</div>
                {t.description && <div className="text-[11px]" style={{ ...body, color: T.ashFaint }}>{t.description}</div>}
              </div>
              <ChevronRight size={16} color={T.ashFaint} />
            </button>
          ))
        )}
    </div>
  );
}

function TeamScreen({ team, members, teamLoading, myOfficerRequest, officerRequests, profile, user, onBack, onNavigate, fields, onOpenPlayer,
  joinTeam, leaveTeam, updateTeamInfo, setHomeField, updateTeamPatch, setMemberRole, removeMember,
  requestOfficer, deleteOfficerRequest, approveOfficerRequest }) {
  const { T, display, body, mono } = useTheme();
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState("");
  const fileInputRef = useRef(null);
  const [patchUploading, setPatchUploading] = useState(false);
  const [showFieldPicker, setShowFieldPicker] = useState(false);
  const [fieldSearch, setFieldSearch] = useState("");
  const [officerRequestBusy, setOfficerRequestBusy] = useState(false);

  const myMembership = members.find((m) => m.uid === user?.uid);
  const isOfficer = myMembership?.role === "officer";
  const isMember = !!myMembership;
  const alreadyOnAnotherTeam = !isMember && profile?.teamId && profile.teamId !== team?.id;

  const startEdit = () => {
    setEditName(team?.name || "");
    setEditDesc(team?.description || "");
    setEditing(true);
  };

  const handleSaveInfo = async () => {
    if (!editName.trim()) return;
    setSaving(true);
    setActionError("");
    try {
      await updateTeamInfo(team.id, { name: editName.trim(), description: editDesc.trim() });
      setEditing(false);
    } catch (err) {
      setActionError("Couldn't save changes — try again.");
    } finally {
      setSaving(false);
    }
  };

  const handlePatchPick = () => fileInputRef.current?.click();
  const handlePatchSelected = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setPatchUploading(true);
    setActionError("");
    try {
      const resized = await resizeImageFile(file, 400, 0.9);
      await updateTeamPatch(team.id, resized);
    } catch (err) {
      setActionError("Couldn't upload patch — try again.");
    } finally {
      setPatchUploading(false);
    }
  };

  const handleJoin = async () => {
    setActionError("");
    try {
      await joinTeam(user.uid, profile, team.id, team.name);
    } catch (err) {
      setActionError("Couldn't join — try again.");
    }
  };

  const handleLeave = async () => {
    setActionError("");
    try {
      await leaveTeam(user.uid, team.id);
      onBack();
    } catch (err) {
      setActionError("Couldn't leave — try again.");
    }
  };

  const handleRequestOfficer = async () => {
    setActionError("");
    setOfficerRequestBusy(true);
    try {
      await requestOfficer(team.id, user.uid, profile);
    } catch (err) {
      setActionError("Couldn't send request — try again.");
    } finally {
      setOfficerRequestBusy(false);
    }
  };

  const handleCancelOfficerRequest = async () => {
    setActionError("");
    setOfficerRequestBusy(true);
    try {
      await deleteOfficerRequest(team.id, user.uid);
    } catch (err) {
      setActionError("Couldn't cancel your request — try again.");
    } finally {
      setOfficerRequestBusy(false);
    }
  };

  // Shared by every officer acting on someone else's request — approve
  // (promotes + clears the request) and deny (just clears it) both read
  // as "resolve this request," so one busy/error path covers both.
  const handleApproveOfficerRequest = async (uid) => {
    setActionError("");
    try {
      await approveOfficerRequest(team.id, uid);
    } catch (err) {
      setActionError("Couldn't approve — try again.");
    }
  };

  const handleDenyOfficerRequest = async (uid) => {
    setActionError("");
    try {
      await deleteOfficerRequest(team.id, uid);
    } catch (err) {
      setActionError("Couldn't deny — try again.");
    }
  };

  if (teamLoading) {
    return (
      <div className="h-full flex items-center justify-center" style={{ backgroundColor: T.void }}>
        <p className="text-[13px]" style={{ ...body, color: T.ashDim }}>Loading…</p>
      </div>
    );
  }
  if (!team) {
    return (
      <div className="h-full flex flex-col items-center justify-center" style={{ backgroundColor: T.void }}>
        <p className="text-[13px]" style={{ ...body, color: T.ashDim }}>Team not found.</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto pb-6" style={{ backgroundColor: T.void }}>
      <div className="px-6 pt-2 pb-4 flex items-center" style={{ borderBottom: `1px solid ${T.line}` }}>
        <button onClick={onBack} className="w-9 h-9 -ml-2 flex items-center justify-center">
          <ChevronLeft size={20} color={T.ash} />
        </button>
        <h1 className="flex-1 text-center text-[18px] font-semibold mr-9" style={{ ...display, color: T.ash }}>{team.name}</h1>
      </div>

      <div className="px-6 pt-5 flex flex-col items-center text-center">
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePatchSelected} className="hidden" />
        <button
          onClick={isOfficer ? handlePatchPick : undefined}
          disabled={!isOfficer || patchUploading}
          className="relative w-24 h-24 mb-3 flex items-center justify-center"
          style={{ background: T.panelAlt, borderRadius: 8 }}
        >
          {team.patchUrl ? (
            <img src={team.patchUrl} alt={team.name} className="w-full h-full" style={{ objectFit: "contain" }} />
          ) : (
            <Shield size={32} color={T.ashDim} />
          )}
          {isOfficer && (
            <div className="absolute -bottom-1 -right-1 w-7 h-7 flex items-center justify-center" style={{ background: T.cta, borderRadius: 14, border: `2px solid ${T.void}` }}>
              {patchUploading ? <span className="text-[9px]" style={{ ...mono, color: T.inverse }}>…</span> : <Camera size={13} color={T.inverse} strokeWidth={2.5} />}
            </div>
          )}
        </button>

        {!editing ? (
          <>
            {team.description && <p className="text-[13px] max-w-xs mb-3" style={{ ...body, color: T.ashDim }}>{team.description}</p>}
            {isOfficer && (
              <button onClick={startEdit} className="text-[12px] font-medium mb-2" style={{ ...body, color: T.accent }}>
                Edit team info
              </button>
            )}
          </>
        ) : (
          <div className="w-full px-0 mb-3">
            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full px-3 py-2.5 text-[14px] bg-transparent outline-none mb-2"
              style={{ ...body, background: T.panel, border: `1px solid ${T.line}`, borderRadius: 4, color: T.ash }}
            />
            <textarea
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              rows={2}
              className="w-full px-3 py-2.5 text-[13px] bg-transparent outline-none mb-2"
              style={{ ...body, background: T.panel, border: `1px solid ${T.line}`, borderRadius: 4, color: T.ash, resize: "none" }}
            />
            <div className="flex gap-2">
              <button onClick={() => setEditing(false)} className="flex-1 py-2 text-[12px] font-medium" style={{ ...body, border: `1px solid ${T.line}`, color: T.ashDim, borderRadius: T.rPill }}>
                Cancel
              </button>
              <button
                onClick={handleSaveInfo}
                disabled={saving}
                className="flex-1 py-2 text-[12px] font-semibold"
                style={{ ...display, background: T.cta, color: T.inverse, borderRadius: T.rPill, boxShadow: T.shadowMd, opacity: saving ? 0.6 : 1 }}
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="px-6 pt-2">
        {actionError && <p className="text-[12px] mb-3 text-center" style={{ ...body, color: T.alert }}>{actionError}</p>}

        {!isMember && !alreadyOnAnotherTeam && (
          <button
            onClick={handleJoin}
            className="w-full py-3 font-semibold text-[14px] mb-5"
            style={{ ...display, background: T.cta, color: T.inverse, borderRadius: T.rPill, boxShadow: T.shadowMd }}
          >
            Join Team
          </button>
        )}
        {alreadyOnAnotherTeam && (
          <p className="text-[12px] text-center mb-5" style={{ ...body, color: T.ashFaint }}>
            You're already on {profile.teamName} — leave that team first to join this one.
          </p>
        )}

        <Eyebrow>Home Field</Eyebrow>
        {team.homeFieldName ? (
          <div className="mb-4 p-3 flex items-center justify-between" style={{ background: T.panel, borderRadius: T.rCard, boxShadow: T.shadowMd }}>
            <div className="flex items-center gap-2">
              <MapPin size={14} color={T.ashFaint} />
              <span className="text-[13px] font-medium" style={{ ...body, color: T.ash }}>{team.homeFieldName}</span>
            </div>
            {isOfficer && (
              <button onClick={() => setShowFieldPicker(true)} className="text-[11px] font-semibold" style={{ ...body, color: T.accent }}>Change</button>
            )}
          </div>
        ) : isOfficer ? (
          <button
            onClick={() => setShowFieldPicker(true)}
            className="w-full mb-4 p-3 text-left text-[13px] font-medium"
            style={{ ...body, color: T.accent, border: `1px dashed ${T.line}`, borderRadius: T.rPill }}
          >
            + Set a home field
          </button>
        ) : (
          <p className="text-[12px] mb-4" style={{ ...body, color: T.ashFaint }}>No home field set yet.</p>
        )}

        {showFieldPicker && (
          <div className="mb-4 p-3" style={{ background: T.panel, borderRadius: T.rCard, boxShadow: T.shadowMd }}>
            <input
              value={fieldSearch}
              onChange={(e) => setFieldSearch(e.target.value)}
              placeholder="Search fields…"
              className="w-full mb-2 px-3 py-2 text-[13px] bg-transparent outline-none"
              style={{ ...body, background: T.panelAlt, border: `1px solid ${T.line}`, borderRadius: 4, color: T.ash }}
            />
            <div style={{ maxHeight: 200, overflowY: "auto" }}>
              {fields
                .filter((f) => !["relocated", "closed", "no-airsoft"].includes(f.status))
                .filter((f) => f.name.toLowerCase().includes(fieldSearch.toLowerCase()))
                .map((f) => (
                <button
                  key={f.id}
                  onClick={async () => { await setHomeField(team.id, f.id, f.name); setShowFieldPicker(false); setFieldSearch(""); }}
                  className="w-full py-2 text-left text-[13px]"
                  style={{ ...body, color: T.ash }}
                >
                  {f.name} <span style={{ color: T.ashFaint }}>· {f.city}</span>
                </button>
              ))}
            </div>
            <button onClick={() => setShowFieldPicker(false)} className="text-[11px] font-medium mt-1" style={{ ...body, color: T.ashFaint }}>Cancel</button>
          </div>
        )}

        {isOfficer && officerRequests.length > 0 && (
          <>
            <Eyebrow>Pending Officer Requests ({officerRequests.length})</Eyebrow>
            <div className="flex flex-col gap-2 mb-5">
              {officerRequests.map((r) => (
                <div key={r.uid} className="p-3 flex items-center gap-3" style={{ background: T.panel, borderRadius: T.rCard, boxShadow: T.shadowMd }}>
                  {r.avatarUrl ? (
                    <div className="w-10 h-10 flex-shrink-0" style={{ backgroundImage: `url("${r.avatarUrl}")`, backgroundSize: "cover", backgroundPosition: "center", borderRadius: 999, border: `1px solid ${T.line}` }} />
                  ) : (
                    <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center text-[13px] font-semibold" style={{ ...display, background: T.panelAlt, borderRadius: 999, color: T.ash }}>
                      {r.callsign.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="text-[13px] font-semibold" style={{ ...display, color: T.ash }}>{r.callsign}</div>
                    <div className="text-[11px]" style={{ ...body, color: T.ashFaint }}>Requesting Officer</div>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => handleApproveOfficerRequest(r.uid)}
                      className="px-2 py-1 text-[10px] font-semibold"
                      style={{ ...body, background: T.cta, color: T.inverse, borderRadius: T.rPill }}
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleDenyOfficerRequest(r.uid)}
                      className="px-2 py-1 text-[10px] font-semibold"
                      style={{ ...body, border: `1px solid ${T.alert}`, color: T.alert, borderRadius: T.rPill }}
                    >
                      Deny
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <Eyebrow>Roster ({members.length})</Eyebrow>
        <div className="flex flex-col gap-2 mb-5">
          {members.map((m) => (
            <div key={m.uid} className="p-3 flex items-center gap-3" style={{ background: T.panel, borderRadius: T.rCard, boxShadow: T.shadowMd }}>
              <button onClick={() => onOpenPlayer(m.uid)} className="flex-1 flex items-center gap-3 text-left">
                {m.avatarUrl ? (
                  <div className="w-10 h-10 flex-shrink-0" style={{ backgroundImage: `url("${m.avatarUrl}")`, backgroundSize: "cover", backgroundPosition: "center", borderRadius: 999, border: `1px solid ${T.line}` }} />
                ) : (
                  <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center text-[13px] font-semibold" style={{ ...display, background: T.panelAlt, borderRadius: 999, color: T.ash }}>
                    {m.callsign.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1">
                  <div className="text-[13px] font-semibold" style={{ ...display, color: T.ash }}>{m.callsign}</div>
                </div>
              </button>
              {m.role === "officer" && <Tag tone="accent">OFFICER</Tag>}
              {isOfficer && m.uid !== user?.uid && (
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setMemberRole(team.id, m.uid, m.role === "officer" ? "member" : "officer")}
                    className="px-2 py-1 text-[10px] font-semibold"
                    style={{ ...body, border: `1px solid ${T.line}`, color: T.ashDim, borderRadius: T.rPill }}
                  >
                    {m.role === "officer" ? "Demote" : "Promote"}
                  </button>
                  <button
                    onClick={() => removeMember(team.id, m.uid)}
                    className="px-2 py-1 text-[10px] font-semibold"
                    style={{ ...body, border: `1px solid ${T.alert}`, color: T.alert, borderRadius: T.rPill }}
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {isMember && !isOfficer && (
          <button
            onClick={myOfficerRequest ? handleCancelOfficerRequest : handleRequestOfficer}
            disabled={officerRequestBusy}
            className="w-full py-3 font-medium text-[14px] mb-3"
            style={{
              ...body,
              border: `1px solid ${T.line}`,
              color: myOfficerRequest ? T.ashFaint : T.accent,
              borderRadius: T.rPill,
              opacity: officerRequestBusy ? 0.6 : 1,
            }}
          >
            {officerRequestBusy ? "…" : myOfficerRequest ? "Officer Request Pending — Cancel" : "Request Officer"}
          </button>
        )}

        {isMember && (
          <button
            onClick={handleLeave}
            className="w-full py-3 font-medium text-[14px] mb-4"
            style={{ ...body, border: `1px solid ${T.line}`, color: T.alert, borderRadius: T.rPill }}
          >
            Leave Team
          </button>
        )}
      </div>
    </div>
  );
}

function ProfileRow({ label, value, static: isStatic, href }) {
  const { T, display, body, mono } = useTheme();
  const content = (
    <>
      <span className="text-[14px] font-medium" style={{ ...body, color: T.ash }}>{label}</span>
      <div className="flex items-center gap-2">
        {value && <span className="text-[12px]" style={{ ...mono, color: T.ashDim }}>{value}</span>}
        {!isStatic && <ChevronRight size={15} color={T.ashFaint} />}
      </div>
    </>
  );
  if (href) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className="w-full flex items-center justify-between py-3.5">
        {content}
      </a>
    );
  }
  return <div className="w-full flex items-center justify-between py-3.5">{content}</div>;
}

// A patch's achievement text can come from two different places: the
// achievement catalog stores name/details as separate fields, while an
// owner's check-in patch has the whole thing baked into one "Name: What
// earns it" string (matching the format they were guided to type). This
// normalizes both into the same {title, subtitle} shape for display,
// without needing to touch how either is actually stored.
function splitPatchDisplay(patch) {
  if (patch.details) return { title: patch.name, subtitle: patch.details };
  const colonIndex = patch.name.indexOf(":");
  if (colonIndex > -1) {
    return { title: patch.name.slice(0, colonIndex).trim(), subtitle: patch.name.slice(colonIndex + 1).trim() };
  }
  return { title: patch.name, subtitle: null };
}

// Only ever shown to the one hardcoded owner UID — see ATLAS_OWNER_UID in
// App(). Currently generates a QR for "secret-agent" specifically since
// that's the only owner-redeemable patch that exists; if more get added
// later, this is the spot to turn into a picker rather than a hardcoded id.
function SecretPatchScreen({ onBack }) {
  const { T, display, body, mono } = useTheme();
  const [qrDataUrl, setQrDataUrl] = useState(null);

  useEffect(() => {
    QRCode.toDataURL(`atlas:redeem:secret-agent`, {
      width: 280,
      margin: 4, // real quiet zone (ISO/IEC 18004 standard is 4 modules) — 1 was under-spec and slows real scanning
      color: { dark: "#002C48", light: "#FFFFFF" } /* fixed — always scannable regardless of theme */,
    }).then(setQrDataUrl);
  }, []);

  return (
    <div className="h-full overflow-y-auto flex flex-col items-center justify-center px-6" style={{ backgroundColor: T.void }}>
      <button onClick={onBack} className="absolute top-4 left-4 w-9 h-9 flex items-center justify-center">
        <ChevronLeft size={20} color={T.ash} />
      </button>
      <div className="text-[13px] font-semibold uppercase mb-1" style={{ ...mono, color: T.ashFaint, letterSpacing: "0.06em" }}>Owner Only</div>
      <div className="text-[20px] font-semibold mb-6" style={{ ...display, color: T.ash }}>Secret Agent Patch</div>
      {qrDataUrl ? (
        <img src={qrDataUrl} alt="Secret Agent redemption code" className="w-64 h-64" style={{ borderRadius: 8, border: `1px solid ${T.line}` }} />
      ) : (
        <div className="w-64 h-64 flex items-center justify-center" style={{ background: T.panel, borderRadius: T.rCard, boxShadow: T.shadowMd }}>
          <span className="text-[13px]" style={{ ...body, color: T.ashFaint }}>Generating…</span>
        </div>
      )}
      <p className="text-[13px] text-center mt-6 max-w-xs" style={{ ...body, color: T.ashDim }}>
        Have a player scan this from their own Profile → Scan a Patch Code. Same idempotent grant as everything
        else — showing it to the same person twice is harmless, it won't duplicate.
      </p>
    </div>
  );
}

// Available to any signed-in player — reads "atlas:redeem:{patchId}" from
// any owner-issued QR (like Secret Agent's) and grants that catalog entry.
// Not scoped to a specific patch; whatever the code points to is what gets
// granted, so this scanner doesn't need updating if more redeemable
// patches get added later.
function RedeemScannerScreen({ onBack, user, grantPatch }) {
  const { T, display, body, mono } = useTheme();
  const containerRef = useRef(null);
  const scannerRef = useRef(null);
  const [status, setStatus] = useState(null);
  const busyRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    import("html5-qrcode").then(({ Html5Qrcode }) => {
      if (cancelled || !containerRef.current) return;
      const scanner = new Html5Qrcode(containerRef.current.id);
      scannerRef.current = scanner;
      scanner
        .start(
          { facingMode: "environment" },
          {
            fps: 10,
            // A function, not a fixed size — the library's own recommended
            // pattern specifically because a fixed pixel box can get
            // unevenly constrained on a different camera aspect ratio than
            // expected (a tablet vs. a phone, for example). Computing it
            // from the real viewfinder size at runtime guarantees a true
            // square everywhere, on every device shape.
            qrbox: (viewfinderWidth, viewfinderHeight) => {
              const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
              const size = Math.floor(minEdge * 0.7);
              return { width: size, height: size };
            },
          },
          async (decodedText) => {
            if (busyRef.current) return;
            busyRef.current = true;
            const result = await redeemPatchCode(decodedText, user.uid, grantPatch);
            if (result.ok) {
              setStatus({ ok: true, message: `${result.name} unlocked!` });
            } else if (result.reason === "already-owned") {
              setStatus({ ok: false, message: `You already have ${result.name}` });
            } else if (result.reason === "not-found") {
              setStatus({ ok: false, message: "That code doesn't match a real patch" });
            } else {
              setStatus({ ok: false, message: "Not a valid Atlas redemption code" });
            }
            setTimeout(() => {
              setStatus(null);
              busyRef.current = false;
            }, 2200);
          },
          () => {}
        )
        .catch((err) => {
          console.error("scanner start failed:", err);
          setStatus({ ok: false, message: "Couldn't access the camera — check permissions and try again." });
        });
    });
    return () => {
      cancelled = true;
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {}).finally(() => scannerRef.current?.clear());
      }
    };
  }, [user.uid]);

  return (
    <div className="h-full flex flex-col" style={{ background: "#000" }}>
      <div className="px-6 pt-2 pb-4 flex items-center" style={{ background: T.panel, borderBottom: `1px solid ${T.line}` }}>
        <button onClick={onBack} className="w-9 h-9 -ml-2 flex items-center justify-center">
          <ChevronLeft size={20} color={T.ash} />
        </button>
        <h1 className="flex-1 text-center text-[16px] font-semibold mr-9" style={{ ...display, color: T.ash }}>Scan a Patch Code</h1>
      </div>

      <div id="atlas-redeem-reader" ref={containerRef} className="flex-1 min-h-0" />

      <div className="px-6 py-4" style={{ background: T.panel, borderTop: `1px solid ${T.line}` }}>
        {status ? (
          <div className="py-3 text-center font-semibold text-[14px]" style={{ ...display, color: status.ok ? T.good : T.alert }}>
            {status.message}
          </div>
        ) : (
          <div className="py-3 text-center text-[13px]" style={{ ...body, color: T.ashFaint }}>
            Point the camera at a patch redemption code
          </div>
        )}
      </div>
    </div>
  );
}

function PatchesScreen({ profile, user, onBack, patches, patchesLoading, setFeaturedPatch }) {
  const { T, display, body, mono } = useTheme();
  const featuredImageUrl = profile?.featuredPatch?.imageUrl;
  const [viewerIndex, setViewerIndex] = useState(null);
  const openViewer = (index) => setViewerIndex(index);
  const closeViewer = () => setViewerIndex(null);
  const showPrev = () => setViewerIndex((i) => (i - 1 + patches.length) % patches.length);
  const showNext = () => setViewerIndex((i) => (i + 1) % patches.length);

  const handleSelectFeatured = (patch) => {
    const isCurrent = featuredImageUrl === patch.imageUrl;
    setFeaturedPatch(user.uid, isCurrent ? null : patch);
  };

  return (
    <div className="h-full overflow-y-auto pb-24" style={{ backgroundColor: T.void }}>
      <div className="px-6 pt-2 pb-4 flex items-center" style={{ borderBottom: `1px solid ${T.line}` }}>
        <button onClick={onBack} className="w-9 h-9 -ml-2 flex items-center justify-center">
          <ChevronLeft size={20} color={T.ash} />
        </button>
        <h1 className="flex-1 text-center text-[18px] font-semibold mr-9" style={{ ...display, color: T.ash }}>Patches</h1>
      </div>

      <div className="px-6 pt-4">
        <p className="text-[12px] mb-4" style={{ ...body, color: T.ashFaint }}>
          Earned by checking in to events. Tap one to feature it next to your callsign.
        </p>

        {patchesLoading ? (
          <div className="text-[13px] py-6 text-center" style={{ ...body, color: T.ashFaint }}>Loading…</div>
        ) : (
          <div className="grid grid-cols-2 gap-3 mb-4">
            {patches.map((patch, i) => {
              const isFeatured = featuredImageUrl === patch.imageUrl;
              const { title, subtitle } = splitPatchDisplay(patch);
              return (
                <button
                  key={patch.id}
                  onClick={() => handleSelectFeatured(patch)}
                  className="relative p-3 flex flex-col items-center text-center transition-transform duration-100 active:scale-[0.98]"
                  style={{ background: T.panel, borderRadius: T.rCard, boxShadow: T.shadowMd, outline: isFeatured ? `1.5px solid ${T.accent}` : "none", outlineOffset: -1 }}
                >
                  {isFeatured && (
                    <div className="absolute top-2 right-2 w-5 h-5 flex items-center justify-center" style={{ background: T.accent, borderRadius: 999 }}>
                      <Check size={12} color={T.inverse} strokeWidth={3} />
                    </div>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); openViewer(i); }}
                    className="absolute top-2 left-2 w-6 h-6 flex items-center justify-center"
                    style={{ background: T.panelAlt, borderRadius: 999 }}
                  >
                    <Maximize2 size={12} color={T.ashDim} />
                  </button>
                  <img src={patch.imageUrl} alt={patch.name} className="w-16 h-16 mb-2 mt-2" style={{ objectFit: "contain" }} />
                  <div className="text-[12px] font-semibold" style={{ ...display, color: T.ash }}>{title}</div>
                  {subtitle && <div className="text-[10px] mt-0.5 leading-snug" style={{ ...body, color: T.ashFaint }}>{subtitle}</div>}
                </button>
              );
            })}
          </div>
        )}

        {patches.length === 0 && !patchesLoading && (
          <p className="text-[13px] py-6 text-center" style={{ ...body, color: T.ashFaint }}>
            No patches yet — check in to an event that has one attached and it'll show up here.
          </p>
        )}
      </div>

      {viewerIndex !== null && patches[viewerIndex] && (
        <div
          onClick={closeViewer}
          className="fixed inset-0 flex flex-col items-center justify-center px-6"
          style={{ background: "rgba(0,0,0,0.88)", zIndex: 2000 }}
        >
          <button
            onClick={(e) => { e.stopPropagation(); closeViewer(); }}
            className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.15)", borderRadius: 999 }}
          >
            <X size={20} color="#FFFFFF" />
          </button>

          {patches.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); showPrev(); }}
              className="absolute left-3 w-11 h-11 flex items-center justify-center transition-transform duration-100 active:scale-90"
              style={{ background: "rgba(255,255,255,0.15)", borderRadius: 999, top: "50%", transform: "translateY(-50%)" }}
            >
              <ChevronLeft size={22} color="#FFFFFF" />
            </button>
          )}

          <img
            src={patches[viewerIndex].imageUrl}
            alt={patches[viewerIndex].name}
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "78%", maxHeight: "55vh", objectFit: "contain" }}
          />
          <div className="text-[17px] font-semibold mt-4 text-center px-6" style={{ ...display, color: "#FFFFFF" }}>
            {splitPatchDisplay(patches[viewerIndex]).title}
          </div>
          {splitPatchDisplay(patches[viewerIndex]).subtitle && (
            <div className="text-[13px] mt-1 text-center px-8" style={{ ...body, color: "rgba(255,255,255,0.75)" }}>
              {splitPatchDisplay(patches[viewerIndex]).subtitle}
            </div>
          )}
          {patches.length > 1 && (
            <div className="text-[12px] mt-1" style={{ ...mono, color: "rgba(255,255,255,0.6)" }}>
              {viewerIndex + 1} / {patches.length}
            </div>
          )}

          {patches.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); showNext(); }}
              className="absolute right-3 w-11 h-11 flex items-center justify-center transition-transform duration-100 active:scale-90"
              style={{ background: "rgba(255,255,255,0.15)", borderRadius: 999, top: "50%", transform: "translateY(-50%)" }}
            >
              <ChevronRight size={22} color="#FFFFFF" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function MyAccountScreen({ profile, user, onBack, updateProfileFields, uploadAvatar, deleteAccount }) {
  const { T, display, body, mono } = useTheme();
  const initial = (profile?.callsign || user?.email || "?").charAt(0).toUpperCase();
  const fileInputRef = useRef(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState("");

  const [callsign, setCallsign] = useState(profile?.callsign || "");
  const [firstName, setFirstName] = useState(profile?.firstName || "");
  const [lastName, setLastName] = useState(profile?.lastName || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [showDelete, setShowDelete] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const handleAvatarPick = () => fileInputRef.current?.click();
  const handleFileSelected = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setAvatarError("Please choose an image file.");
      return;
    }
    setAvatarError("");
    setAvatarUploading(true);
    try {
      const resized = await resizeImageFile(file);
      await uploadAvatar(resized);
    } catch (err) {
      setAvatarError(err.message || "Upload failed — try again.");
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleSave = async () => {
    if (!callsign.trim()) {
      setSaveError("Callsign can't be empty.");
      return;
    }
    setSaving(true);
    setSaveError("");
    setSaveSuccess(false);
    try {
      await updateProfileFields({
        callsign: callsign.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
      });
      setSaveSuccess(true);
    } catch (err) {
      console.error("My Account save failed:", err);
      setSaveError(`Couldn't save: ${err.code || err.message || "unknown error"}`);
    } finally {
      setSaving(false);
    }
  };

  const friendlyDeleteError = (code) => {
    if (code === "auth/invalid-credential" || code === "auth/wrong-password") return "Password is incorrect.";
    if (code === "auth/too-many-requests") return "Too many attempts — wait a bit and try again.";
    return "Something went wrong — try again.";
  };

  const handleDelete = async () => {
    if (!deletePassword) return;
    setDeleting(true);
    setDeleteError("");
    try {
      await deleteAccount(deletePassword);
      // onAuthStateChanged picks up the sign-out automatically once the
      // account is actually gone — no manual navigation needed here.
    } catch (err) {
      setDeleteError(friendlyDeleteError(err.code));
      setDeleting(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto pb-24" style={{ backgroundColor: T.void }}>
      <div className="px-6 pt-2 pb-4 flex items-center" style={{ borderBottom: `1px solid ${T.line}` }}>
        <button onClick={onBack} className="w-9 h-9 -ml-2 flex items-center justify-center">
          <ChevronLeft size={20} color={T.ash} />
        </button>
        <h1 className="flex-1 text-center text-[18px] font-semibold mr-9" style={{ ...display, color: T.ash }}>My Account</h1>
      </div>

      <div className="px-6 pt-6 flex flex-col items-center">
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelected} className="hidden" />
        <button onClick={handleAvatarPick} className="relative w-20 h-20 mb-2" disabled={avatarUploading}>
          {profile?.avatarUrl ? (
            <div className="w-20 h-20" style={{ backgroundImage: `url("${profile.avatarUrl}")`, backgroundSize: "cover", backgroundPosition: "center", borderRadius: 40 }} />
          ) : (
            <div className="w-20 h-20 flex items-center justify-center text-[26px] font-semibold" style={{ ...display, background: T.panelAlt, borderRadius: 40, color: T.ash }}>
              {initial}
            </div>
          )}
          <div className="absolute -bottom-1 -right-1 w-7 h-7 flex items-center justify-center" style={{ background: T.cta, borderRadius: 14, border: `2px solid ${T.void}` }}>
            {avatarUploading ? (
              <span className="text-[9px]" style={{ ...mono, color: T.inverse }}>…</span>
            ) : (
              <Camera size={13} color={T.inverse} strokeWidth={2.5} />
            )}
          </div>
        </button>
        <button onClick={handleAvatarPick} className="text-[13px] font-medium mb-1" style={{ ...body, color: T.accent }}>
          Change Profile Photo
        </button>
        {avatarError && <p className="text-[11px] mb-2" style={{ ...body, color: T.alert }}>{avatarError}</p>}
      </div>

      <div className="px-6 pt-4 flex flex-col gap-3">
        {[
          { label: "Callsign / Username", value: callsign, setter: setCallsign },
          { label: "First Name", value: firstName, setter: setFirstName },
          { label: "Last Name", value: lastName, setter: setLastName },
        ].map((f) => (
          <div key={f.label}>
            <label className="text-[10px] font-semibold uppercase block mb-1" style={{ ...mono, color: T.ashFaint, letterSpacing: "0.04em" }}>{f.label}</label>
            <input
              value={f.value}
              onChange={(e) => f.setter(e.target.value)}
              className="w-full px-3 py-2.5 text-[14px] bg-transparent outline-none"
              style={{ ...body, background: T.panel, border: `1px solid ${T.line}`, borderRadius: 4, color: T.ash }}
            />
          </div>
        ))}

        <div>
          <label className="text-[10px] font-semibold uppercase block mb-1" style={{ ...mono, color: T.ashFaint, letterSpacing: "0.04em" }}>Email</label>
          <div className="w-full px-3 py-2.5 text-[14px]" style={{ ...body, background: T.panelAlt, border: `1px solid ${T.line}`, borderRadius: 4, color: T.ashDim }}>
            {user?.email}
          </div>
        </div>

        <div>
          <label className="text-[10px] font-semibold uppercase block mb-1" style={{ ...mono, color: T.ashFaint, letterSpacing: "0.04em" }}>Phone Number</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            type="tel"
            placeholder="+1 (555) 000-0000"
            className="w-full px-3 py-2.5 text-[14px] bg-transparent outline-none"
            style={{ ...body, background: T.panel, border: `1px solid ${T.line}`, borderRadius: 4, color: T.ash }}
          />
        </div>

        {saveError && <p className="text-[12px]" style={{ ...body, color: T.alert }}>{saveError}</p>}
        {saveSuccess && <p className="text-[12px]" style={{ ...body, color: T.good }}>Saved.</p>}

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3 font-semibold text-[14px] mt-1"
          style={{ ...display, background: T.cta, color: T.inverse, borderRadius: T.rPill, boxShadow: T.shadowMd, opacity: saving ? 0.6 : 1 }}
        >
          {saving ? "Saving…" : "Save Changes"}
        </button>

        <div className="mt-4">
          {!showDelete ? (
            <button onClick={() => setShowDelete(true)} className="w-full text-center text-[13px] font-medium py-2" style={{ ...body, color: T.alert }}>
              Delete Account
            </button>
          ) : (
            <div className="p-4" style={{ background: "rgba(188,51,39,0.08)", border: `1px solid ${T.alert}`, borderRadius: 6 }}>
              <div className="text-[13px] font-semibold mb-1" style={{ ...display, color: T.ash }}>Delete your account?</div>
              <p className="text-[12px] mb-3" style={{ ...body, color: T.ashDim }}>
                This permanently deletes your profile, favorites, and photo. This can't be undone. Enter your password to confirm.
              </p>
              <input
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                type="password"
                autoComplete="current-password"
                placeholder="Current password"
                className="w-full px-3 py-2.5 text-[14px] bg-transparent outline-none mb-3"
                style={{ ...body, background: T.panel, border: `1px solid ${T.line}`, borderRadius: 4, color: T.ash }}
              />
              {deleteError && <p className="text-[11px] mb-2" style={{ ...body, color: T.alert }}>{deleteError}</p>}
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowDelete(false); setDeletePassword(""); setDeleteError(""); }}
                  className="flex-1 py-2.5 text-[12px] font-medium"
                  style={{ ...body, border: `1px solid ${T.line}`, color: T.ashDim, borderRadius: T.rPill }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={!deletePassword || deleting}
                  className="flex-1 py-2.5 text-[12px] font-semibold"
                  style={{ ...display, background: T.alert, color: T.inverse, borderRadius: T.rPill, boxShadow: T.shadowSm, opacity: !deletePassword || deleting ? 0.5 : 1 }}
                >
                  {deleting ? "Deleting…" : "Permanently Delete"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ProfileScreen({ profile, user, onNavigate, onOpenAccount, onOpenPatches, onOpenSecretPatchQR, onOpenScanRedeem, onLogout, changePassword, uploadAvatar, updateLanguage, favorites, events, patches, vouchers }) {
  const { T, display, body, mono, theme, setTheme } = useTheme();
  const initial = (profile?.callsign || user?.email || "?").charAt(0).toUpperCase();
  const fileInputRef = useRef(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState("");

  const referralUrl = user ? `${window.location.origin}${import.meta.env.BASE_URL}?ref=${user.uid}` : "";

  // "Past Events," not "attended" — this counts favorited events that have
  // already happened, which isn't the same as confirmed attendance. That
  // distinction gets to change once real check-in/RSVP data exists.
  const today = localDateStr();
  const savedEventIds = (favorites || []).filter((f) => f.type === "event").map((f) => f.refId);
  const pastEventsCount = (events || []).filter((e) => savedEventIds.includes(e.id) && (e.endDate || e.date) < today).length;
  const [referralQr, setReferralQr] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!referralUrl) return;
    QRCode.toDataURL(referralUrl, { width: 280, margin: 4, color: { dark: "#002C48", light: "#FFFFFF" } /* fixed — always scannable regardless of theme */ }).then(setReferralQr);
  }, [referralUrl]);

  const handleCopyReferral = async () => {
    try {
      await navigator.clipboard.writeText(referralUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can be blocked in some contexts — the link is
      // still visible/shareable via the QR code either way.
    }
  };

  const handleAvatarPick = () => fileInputRef.current?.click();

  const handleFileSelected = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // let picking the same file again still fire onChange
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setAvatarError("Please choose an image file.");
      return;
    }
    setAvatarError("");
    setAvatarUploading(true);
    try {
      const resized = await resizeImageFile(file);
      await uploadAvatar(resized);
    } catch (err) {
      setAvatarError(err.message || "Upload failed — try again.");
    } finally {
      setAvatarUploading(false);
    }
  };

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
  const [showAppearancePicker, setShowAppearancePicker] = useState(false);
  const LANGUAGES = ["English", "Spanish", "French"]; // covers major US + Canadian languages relevant here
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const friendlyPasswordError = (code) => {
    if (code === "auth/invalid-credential" || code === "auth/wrong-password") return "Current password is incorrect.";
    if (code === "auth/weak-password") return "New password needs to be at least 6 characters.";
    if (code === "auth/too-many-requests") return "Too many attempts — wait a bit and try again.";
    return "Something went wrong — try again.";
  };

  const submitPasswordChange = async (e) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess(false);
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords don't match.");
      return;
    }
    setPasswordSaving(true);
    try {
      await changePassword(currentPassword, newPassword);
      setPasswordSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPasswordError(friendlyPasswordError(err.code));
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto pb-24" style={{ backgroundColor: T.void }}>
      <ScreenHeader title="Profile" />
      <div className="px-6 pt-4">
        <div className="p-4 flex items-center gap-3 mb-2" style={{ background: T.panel, borderRadius: T.rCard, boxShadow: T.shadowMd }}>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelected} className="hidden" />
          <button onClick={handleAvatarPick} className="relative w-14 h-14 flex-shrink-0" disabled={avatarUploading}>
            {profile?.avatarUrl ? (
              <div
                className="w-14 h-14"
                style={{ backgroundImage: `url("${profile.avatarUrl}")`, backgroundSize: "cover", backgroundPosition: "center", borderRadius: 4 }}
              />
            ) : (
              <div
                className="w-14 h-14 flex items-center justify-center text-[18px] font-semibold"
                style={{ ...display, background: T.panelAlt, borderRadius: 4, color: T.ash }}
              >
                {initial}
              </div>
            )}
            <div
              className="absolute -bottom-1 -right-1 w-5 h-5 flex items-center justify-center"
              style={{ background: T.cta, borderRadius: 3, border: `2px solid ${T.panel}` }}
            >
              {avatarUploading ? (
                <span className="text-[8px]" style={{ ...mono, color: T.inverse }}>…</span>
              ) : (
                <Camera size={10} color={T.inverse} strokeWidth={2.5} />
              )}
            </div>
          </button>
          <div>
            <span className="text-[16px] font-semibold inline-flex items-center gap-1.5" style={{ ...display, color: T.ash }}>
              {profile?.callsign || "Loading…"}
              {profile?.verified && <BadgeCheck size={15} color={T.inverse} fill={T.accent} />}
              {profile?.featuredPatch && (
                <img
                  src={profile.featuredPatch.imageUrl}
                  alt={`${profile.featuredPatch.name} patch`}
                  className="w-5 h-5"
                  style={{ objectFit: "contain" }}
                />
              )}
            </span>
            <div className="text-[12px]" style={{ ...body, color: T.ashDim }}>{user?.email}</div>
          </div>
        </div>
        {avatarError && <p className="text-[11px] mb-3" style={{ ...body, color: T.alert }}>{avatarError}</p>}
        {!avatarError && <div className="mb-3" />}

        <Eyebrow>Your Stats</Eyebrow>
        <div className="grid grid-cols-3 gap-2 mb-5">
          <div className="p-3 text-center" style={{ background: T.panel, borderRadius: T.rCard, boxShadow: T.shadowMd }}>
            <div className="text-[18px] font-semibold" style={{ ...display, color: T.ash }}>
              {profile?.createdAt?.toDate ? profile.createdAt.toDate().getFullYear() : "—"}
            </div>
            <div className="text-[10px]" style={{ ...body, color: T.ashFaint }}>Member Since</div>
          </div>
          <div className="p-3 text-center" style={{ background: T.panel, borderRadius: T.rCard, boxShadow: T.shadowMd }}>
            <div className="text-[18px] font-semibold" style={{ ...display, color: T.ash }}>{pastEventsCount}</div>
            <div className="text-[10px]" style={{ ...body, color: T.ashFaint }}>Past Events</div>
          </div>
          <button onClick={onOpenPatches} className="p-3 text-center transition-transform duration-100 active:scale-[0.97]" style={{ background: T.panel, borderRadius: T.rCard, boxShadow: T.shadowMd }}>
            <div className="text-[18px] font-semibold" style={{ ...display, color: T.ash }}>{patches?.length || 0}</div>
            <div className="text-[10px]" style={{ ...body, color: T.ashFaint }}>Patches</div>
          </button>
        </div>

        <Eyebrow>Invite Friends</Eyebrow>
        <div className="p-4 mb-5 flex flex-col items-center text-center" style={{ background: T.panel, borderRadius: T.rCard, boxShadow: T.shadowMd }}>
          {referralQr && <img src={referralQr} alt="Referral QR code" className="mb-3" style={{ width: 140, height: 140 }} />}
          <p className="text-[12px] mb-3" style={{ ...body, color: T.ashDim }}>
            Share this code or let someone scan it to invite them to Atlas.
          </p>
          <button
            onClick={handleCopyReferral}
            className="w-full py-2.5 text-[13px] font-semibold"
            style={{ ...display, background: copied ? T.good : T.cta, color: T.inverse, borderRadius: T.rPill, boxShadow: T.shadowSm }}
          >
            {copied ? "Copied!" : "Copy Invite Link"}
          </button>
        </div>

        {vouchers && vouchers.length > 0 && (
          <>
            <Eyebrow>Vouchers</Eyebrow>
            <div className="mb-5 divide-y" style={{ background: T.panel, borderRadius: T.rCard, boxShadow: T.shadowMd }}>
              {vouchers.map((v) => {
                // No sweep job flips status to "expired" in Firestore —
                // this is purely a time comparison for display. The real
                // enforcement (rejecting an expired voucher at
                // redemption) happens server-side in bookEventWithVoucher.
                const isExpired = v.expiresAt && v.expiresAt.toDate() < new Date();
                return (
                <div key={v.id} className="px-4 py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Ticket size={16} color={isExpired ? T.ashFaint : T.good} className="flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <div className="text-[13px] font-medium truncate" style={{ ...body, color: T.ash }}>{v.fieldName || "Unknown field"}</div>
                        {isExpired && (
                          <span className="text-[9px] font-semibold px-1.5 py-0.5" style={{ ...mono, color: T.ashFaint, border: `1px solid ${T.line}`, borderRadius: T.rPill }}>
                            EXPIRED
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] truncate" style={{ ...body, color: T.ashFaint }}>From "{v.sourceEventTitle || "a canceled event"}"</div>
                    </div>
                  </div>
                  <div className="text-[14px] font-semibold flex-shrink-0" style={{ ...mono, color: isExpired ? T.ashFaint : T.good }}>
                    {v.amountCents % 100 === 0 ? `$${v.amountCents / 100}` : `$${(v.amountCents / 100).toFixed(2)}`}
                  </div>
                </div>
                );
              })}
            </div>
          </>
        )}

        <Eyebrow>Account Settings</Eyebrow>
        <div className="px-4 mb-2 divide-y" style={{ background: T.panel, borderRadius: T.rCard, boxShadow: T.shadowMd }}>
          <ProfileRow label="Email" value={user?.email} static />
          <button onClick={onOpenAccount} className="w-full flex items-center justify-between py-3.5">
            <span className="text-[14px] font-medium" style={{ ...body, color: T.ash }}>My Account</span>
            <div className="flex items-center gap-2">
              <span className="text-[12px]" style={{ ...mono, color: T.ashDim }}>{profile?.callsign}</span>
              <ChevronRight size={15} color={T.ashFaint} />
            </div>
          </button>
          <button onClick={onOpenPatches} className="w-full flex items-center justify-between py-3.5">
            <span className="text-[14px] font-medium" style={{ ...body, color: T.ash }}>Patches</span>
            <ChevronRight size={15} color={T.ashFaint} />
          </button>
          <button onClick={onOpenScanRedeem} className="w-full flex items-center justify-between py-3.5 border-t" style={{ borderColor: T.line }}>
            <span className="text-[14px] font-medium" style={{ ...body, color: T.ash }}>Scan a Patch Code</span>
            <ChevronRight size={15} color={T.ashFaint} />
          </button>
          {user?.uid === ATLAS_OWNER_UID && (
            <button onClick={onOpenSecretPatchQR} className="w-full flex items-center justify-between py-3.5 border-t" style={{ borderColor: T.line }}>
              <span className="text-[14px] font-medium" style={{ ...body, color: T.ash }}>Secret Agent QR</span>
              <ChevronRight size={15} color={T.ashFaint} />
            </button>
          )}
        </div>

        <button
          onClick={() => { setShowPasswordForm(!showPasswordForm); setPasswordError(""); setPasswordSuccess(false); }}
          className="w-full flex items-center justify-between py-3 px-4 mb-6"
          style={{ background: T.panel, borderRadius: T.rCard, boxShadow: T.shadowMd }}
        >
          <span className="text-[14px] font-medium" style={{ ...body, color: T.ash }}>Change Password</span>
          <ChevronRight size={15} color={T.ashFaint} style={{ transform: showPasswordForm ? "rotate(90deg)" : "none" }} />
        </button>

        {showPasswordForm && (
          <form onSubmit={submitPasswordChange} className="flex flex-col gap-2.5 mb-6 -mt-4">
            <input
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              type="password"
              autoComplete="current-password"
              placeholder="Current password"
              className="px-4 py-3 text-[14px] bg-transparent outline-none"
              style={{ ...body, background: T.panel, border: `1px solid ${T.line}`, borderRadius: 4, color: T.ash }}
            />
            <input
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              type="password"
              autoComplete="new-password"
              placeholder="New password"
              className="px-4 py-3 text-[14px] bg-transparent outline-none"
              style={{ ...body, background: T.panel, border: `1px solid ${T.line}`, borderRadius: 4, color: T.ash }}
            />
            <input
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              type="password"
              autoComplete="new-password"
              placeholder="Confirm new password"
              className="px-4 py-3 text-[14px] bg-transparent outline-none"
              style={{ ...body, background: T.panel, border: `1px solid ${T.line}`, borderRadius: 4, color: T.ash }}
            />
            {passwordError && <p className="text-[12px]" style={{ ...body, color: T.alert }}>{passwordError}</p>}
            {passwordSuccess && <p className="text-[12px]" style={{ ...body, color: T.good }}>Password updated.</p>}
            <button
              type="submit"
              disabled={passwordSaving}
              className="w-full py-3 font-semibold text-[13px]"
              style={{ ...display, background: T.cta, color: T.inverse, borderRadius: T.rPill, boxShadow: T.shadowMd, opacity: passwordSaving ? 0.6 : 1 }}
            >
              {passwordSaving ? "Updating…" : "Update Password"}
            </button>
          </form>
        )}

        <Eyebrow>Support & Preferences</Eyebrow>
        <div className="px-4 mb-2 divide-y" style={{ background: T.panel, borderRadius: T.rCard, boxShadow: T.shadowMd }}>
          <button onClick={() => setShowAppearancePicker(!showAppearancePicker)} className="w-full flex items-center justify-between py-3.5">
            <span className="text-[14px] font-medium" style={{ ...body, color: T.ash }}>Appearance</span>
            <div className="flex items-center gap-2">
              <span className="text-[12px]" style={{ ...mono, color: T.ashDim }}>{theme === "dark" ? "Dark" : "Light"}</span>
              <ChevronRight size={15} color={T.ashFaint} style={{ transform: showAppearancePicker ? "rotate(90deg)" : "none" }} />
            </div>
          </button>
          <button onClick={() => setShowLanguagePicker(!showLanguagePicker)} className="w-full flex items-center justify-between py-3.5">
            <span className="text-[14px] font-medium" style={{ ...body, color: T.ash }}>Language</span>
            <div className="flex items-center gap-2">
              <span className="text-[12px]" style={{ ...mono, color: T.ashDim }}>{profile?.language || "English"}</span>
              <ChevronRight size={15} color={T.ashFaint} style={{ transform: showLanguagePicker ? "rotate(90deg)" : "none" }} />
            </div>
          </button>
          <ProfileRow label="FAQs" />
          <ProfileRow label="Report a concern" value="Join our Discord" href="https://discord.gg/hR8EntGsq" />
        </div>

        {showAppearancePicker && (
          <div className="mb-6 p-4" style={{ background: T.panel, borderRadius: T.rCard, boxShadow: T.shadowMd }}>
            <div className="flex gap-2 mb-2">
              {[
                { key: "light", label: "Light" },
                { key: "dark", label: "Dark" },
              ].map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setTheme(opt.key)}
                  className="px-3 py-1.5 text-[12px] font-medium"
                  style={{
                    ...body,
                    border: `1px solid ${theme === opt.key ? T.accent : T.line}`,
                    background: theme === opt.key ? T.accent : "transparent",
                    color: theme === opt.key ? T.inverse : T.ashDim,
                    borderRadius: T.rPill,
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <p className="text-[11px]" style={{ ...body, color: T.ashFaint }}>
              Dark uses the "Night Ops" look — dark liquid-glass panels, night-vision green and blaze-orange accents.
            </p>
          </div>
        )}

        {showLanguagePicker && (
          <div className="mb-6 p-4" style={{ background: T.panel, borderRadius: T.rCard, boxShadow: T.shadowMd }}>
            <div className="flex gap-2 mb-2">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang}
                  onClick={() => updateLanguage(lang)}
                  className="px-3 py-1.5 text-[12px] font-medium"
                  style={{
                    ...body,
                    border: `1px solid ${(profile?.language || "English") === lang ? T.accent : T.line}`,
                    background: (profile?.language || "English") === lang ? T.accent : "transparent",
                    color: (profile?.language || "English") === lang ? T.inverse : T.ashDim,
                    borderRadius: T.rPill,
                  }}
                >
                  {lang}
                </button>
              ))}
            </div>
            <p className="text-[11px]" style={{ ...body, color: T.ashFaint }}>
              This saves your preference for later — the app doesn't translate its text yet, that's coming.
            </p>
          </div>
        )}

        <button
          onClick={onLogout}
          className="w-full py-3 font-medium text-[14px] flex items-center justify-center gap-2"
          style={{ ...body, border: `1px solid ${T.line}`, color: T.alert, borderRadius: T.rPill }}
        >
          <LogOut size={15} /> Log out
        </button>
      </div>
      <BottomNav active="profile" onNavigate={onNavigate} />
    </div>
  );
}

/* ---------- app shell ---------- */
// iOS Safari has no programmatic install prompt — Add to Home Screen is a
// manual, user-driven action reachable only through the Share sheet.
// Android/Chrome does support triggering it programmatically via
// beforeinstallprompt, so that path is used when available; otherwise the
// instructions fall back to the same manual style.
function InstallGateScreen({ platform, deferredPrompt }) {
  const { T, display, body, mono } = useTheme();
  const [installing, setInstalling] = useState(false);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    setInstalling(true);
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setInstalling(false);
  };

  return (
    <div className="h-screen flex flex-col items-center justify-center px-8 text-center" style={{ backgroundColor: T.void }}>
      <style>{FONTS}</style>
      <div className="w-16 h-16 flex items-center justify-center mb-4 overflow-hidden" style={{ borderRadius: 12 }}>
        <img src={`${import.meta.env.BASE_URL}logo.jpg`} alt="Atlas" className="w-full h-full" style={{ objectFit: "cover" }} />
      </div>
      <h1 className="text-[20px] font-semibold mb-2" style={{ ...display, color: T.ash }}>Add Atlas to your Home Screen</h1>
      <p className="text-[14px] mb-6" style={{ ...body, color: T.ashDim, maxWidth: 320 }}>
        Atlas works best installed as an app — full screen, faster, and built for outdoor use. Install it to continue.
      </p>

      {platform === "ios" ? (
        <div className="w-full text-left" style={{ maxWidth: 320 }}>
          <div className="flex items-center gap-3 mb-3 p-3" style={{ background: T.panel, borderRadius: T.rCard, boxShadow: T.shadowMd }}>
            <span className="text-[16px] font-semibold" style={{ ...display, color: T.accent }}>1</span>
            <span className="text-[13px]" style={{ ...body, color: T.ash }}>Tap the Share button <Share2 size={14} style={{ display: "inline", verticalAlign: "middle" }} /> in Safari's toolbar</span>
          </div>
          <div className="flex items-center gap-3 p-3" style={{ background: T.panel, borderRadius: T.rCard, boxShadow: T.shadowMd }}>
            <span className="text-[16px] font-semibold" style={{ ...display, color: T.accent }}>2</span>
            <span className="text-[13px]" style={{ ...body, color: T.ash }}>Scroll down and tap "Add to Home Screen"</span>
          </div>
        </div>
      ) : deferredPrompt ? (
        <button
          onClick={handleInstallClick}
          disabled={installing}
          className="w-full py-3.5 font-semibold text-[14px]"
          style={{ ...display, background: T.cta, color: T.inverse, borderRadius: T.rPill, boxShadow: T.shadowMd, maxWidth: 320, opacity: installing ? 0.6 : 1 }}
        >
          {installing ? "Opening…" : "Install Atlas"}
        </button>
      ) : (
        <div className="w-full text-left" style={{ maxWidth: 320 }}>
          <div className="flex items-center gap-3 p-3" style={{ background: T.panel, borderRadius: T.rCard, boxShadow: T.shadowMd }}>
            <span className="text-[16px] font-semibold" style={{ ...display, color: T.accent }}>1</span>
            <span className="text-[13px]" style={{ ...body, color: T.ash }}>Open your browser's menu and tap "Add to Home Screen" or "Install App"</span>
          </div>
        </div>
      )}

      <p className="text-[11px] mt-6" style={{ ...body, color: T.ashFaint }}>Already installed? Open Atlas from your Home Screen instead of this browser tab.</p>
    </div>
  );
}

const ONBOARDING_EVENT_TYPES = [
  { key: "OUTDOOR", label: "Outdoor", icon: TreePine },
  { key: "MILSIM", label: "MilSim", icon: ChevronsUp },
  { key: "INDOOR", label: "Indoor", icon: Home },
  { key: "TOURNAMENT", label: "Tournament", icon: Trophy },
];

const ONBOARDING_FREQUENCIES = ["This is my first time", "A few times a year", "Monthly", "Weekly"];

// Shown once, right after a brand-new signup, gated on completedOnboarding
// being explicitly false — see the note on that field in useAuth.js for
// why an existing, already-established account can never accidentally
// see this. Real name and callsign save immediately as each step is
// confirmed, so nothing is lost if someone closes the app partway through;
// only the final "finish" call needs to succeed for the gate to lift.
function OnboardingWizardScreen({ profile, user, updateProfileFields, uploadAvatar, completeOnboarding }) {
  const { T, display, body, mono } = useTheme();
  const STEPS = ["name", "callsign", "photo", "eventTypes", "frequency"];
  const [step, setStep] = useState(0);
  const [firstName, setFirstName] = useState(profile?.firstName || "");
  const [lastName, setLastName] = useState(profile?.lastName || "");
  const [callsign, setCallsign] = useState(profile?.callsign || "");
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatarUrl || null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const [eventTypes, setEventTypes] = useState([]);
  const [frequency, setFrequency] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  const current = STEPS[step];

  const toggleEventType = (key) => {
    setEventTypes((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  };

  const handleFileSelected = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setAvatarError("Please choose an image file.");
      return;
    }
    setAvatarError("");
    setAvatarUploading(true);
    try {
      const resized = await resizeImageFile(file);
      const url = await uploadAvatar(resized);
      setAvatarUrl(url);
    } catch (err) {
      console.error("onboarding avatar upload failed:", err);
      setAvatarError("Upload failed — try again, or skip for now.");
    } finally {
      setAvatarUploading(false);
    }
  };

  const canContinue =
    current === "name" ? firstName.trim() && lastName.trim() :
    current === "callsign" ? callsign.trim() :
    true; // photo, event types, and frequency are all optional

  const handleNext = async () => {
    setError("");
    if (current === "callsign") {
      setSaving(true);
      try {
        await updateProfileFields({ callsign: callsign.trim(), firstName: firstName.trim(), lastName: lastName.trim(), phone: profile?.phone || "" });
      } catch (err) {
        console.error("onboarding name/callsign save failed:", err);
        setError("Couldn't save — try again.");
        setSaving(false);
        return;
      }
      setSaving(false);
    }
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      handleFinish();
    }
  };

  const handleFinish = async () => {
    setSaving(true);
    setError("");
    try {
      await completeOnboarding({ preferredEventTypes: eventTypes, playFrequency: frequency });
    } catch (err) {
      console.error("completeOnboarding failed:", err);
      setError("Couldn't finish setup — try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="h-screen flex flex-col" style={{ backgroundColor: T.void }}>
      <style>{FONTS}</style>
      <div className="px-6 pt-8 pb-4">
        <div className="flex gap-1 mb-5">
          {STEPS.map((s, i) => (
            <div key={s} className="flex-1" style={{ height: 3, borderRadius: 999, background: i <= step ? T.ash : T.line }} />
          ))}
        </div>

        {current === "name" && (
          <>
            <h1 className="text-[18px] font-semibold mb-1" style={{ ...display, color: T.ash }}>What's your real name?</h1>
            <p className="text-[12px] mb-5" style={{ ...body, color: T.ashDim }}>
              Used for waiver signatures and bookings only — other players only ever see your callsign, never this.
            </p>
            <div className="mb-3">
              <label className="text-[10px] font-semibold uppercase block mb-1" style={{ ...mono, color: T.ashFaint, letterSpacing: "0.04em" }}>First Name</label>
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-3 py-2.5 text-[14px] bg-transparent outline-none"
                style={{ ...body, background: T.panel, border: `1px solid ${T.line}`, borderRadius: 4, color: T.ash }}
              />
            </div>
            <div className="mb-3">
              <label className="text-[10px] font-semibold uppercase block mb-1" style={{ ...mono, color: T.ashFaint, letterSpacing: "0.04em" }}>Last Name</label>
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-3 py-2.5 text-[14px] bg-transparent outline-none"
                style={{ ...body, background: T.panel, border: `1px solid ${T.line}`, borderRadius: 4, color: T.ash }}
              />
            </div>
          </>
        )}

        {current === "callsign" && (
          <>
            <h1 className="text-[18px] font-semibold mb-1" style={{ ...display, color: T.ash }}>Pick your callsign</h1>
            <p className="text-[12px] mb-5" style={{ ...body, color: T.ashDim }}>
              This is what other players see — on rosters, teams, and anywhere your name shows up in the app.
            </p>
            <div className="mb-3">
              <label className="text-[10px] font-semibold uppercase block mb-1" style={{ ...mono, color: T.ashFaint, letterSpacing: "0.04em" }}>Callsign</label>
              <input
                value={callsign}
                onChange={(e) => setCallsign(e.target.value)}
                className="w-full px-3 py-2.5 text-[14px] bg-transparent outline-none"
                style={{ ...body, background: T.panel, border: `1px solid ${T.line}`, borderRadius: 4, color: T.ash }}
              />
            </div>
          </>
        )}

        {current === "photo" && (
          <>
            <h1 className="text-[18px] font-semibold mb-1" style={{ ...display, color: T.ash }}>Add a profile photo</h1>
            <p className="text-[12px] mb-5" style={{ ...body, color: T.ashDim }}>Optional — you can always add one later from your profile.</p>
            <div className="flex flex-col items-center py-4">
              <button onClick={() => fileInputRef.current?.click()} className="relative mb-3">
                {avatarUrl ? (
                  <div className="w-24 h-24" style={{ backgroundImage: `url("${avatarUrl}")`, backgroundSize: "cover", backgroundPosition: "center", borderRadius: 999, border: `1px solid ${T.line}` }} />
                ) : (
                  <div className="w-24 h-24 flex items-center justify-center" style={{ background: T.panelAlt, borderRadius: 999, border: `1px solid ${T.line}` }}>
                    <Camera size={26} color={T.ashFaint} />
                  </div>
                )}
                {avatarUploading && (
                  <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(255,255,255,0.7)", borderRadius: 999 }}>
                    <span className="text-[10px]" style={{ ...body, color: T.ashDim }}>Uploading…</span>
                  </div>
                )}
              </button>
              <button onClick={() => fileInputRef.current?.click()} className="text-[12px] font-semibold" style={{ ...body, color: T.accent }}>
                {avatarUrl ? "Change Photo" : "Choose Photo"}
              </button>
              {avatarError && <p className="text-[11px] mt-2" style={{ ...body, color: T.alert }}>{avatarError}</p>}
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelected} className="hidden" />
            </div>
          </>
        )}

        {current === "eventTypes" && (
          <>
            <h1 className="text-[18px] font-semibold mb-1" style={{ ...display, color: T.ash }}>What do you usually play?</h1>
            <p className="text-[12px] mb-5" style={{ ...body, color: T.ashDim }}>Pick as many as apply — optional, helps us understand what our players are into.</p>
            <div className="grid grid-cols-2 gap-2">
              {ONBOARDING_EVENT_TYPES.map(({ key, label, icon: Icon }) => {
                const selected = eventTypes.includes(key);
                return (
                  <button
                    key={key}
                    onClick={() => toggleEventType(key)}
                    className="p-4 flex flex-col items-center gap-2 transition-transform duration-100 active:scale-[0.97]"
                    style={{ background: selected ? T.cta : T.panel, borderRadius: 8, border: `1px solid ${selected ? T.cta : T.line}` }}
                  >
                    <Icon size={20} color={selected ? T.inverse : T.ashDim} />
                    <span className="text-[12px] font-semibold" style={{ ...body, color: selected ? T.inverse : T.ash }}>{label}</span>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {current === "frequency" && (
          <>
            <h1 className="text-[18px] font-semibold mb-1" style={{ ...display, color: T.ash }}>How often do you play?</h1>
            <p className="text-[12px] mb-5" style={{ ...body, color: T.ashDim }}>Optional — just helps us get a sense of our community.</p>
            <div className="flex flex-col gap-2">
              {ONBOARDING_FREQUENCIES.map((f) => (
                <button
                  key={f}
                  onClick={() => setFrequency(f)}
                  className="p-3.5 text-left text-[13px] font-medium transition-transform duration-100 active:scale-[0.98]"
                  style={{ ...body, background: frequency === f ? T.cta : T.panel, color: frequency === f ? T.inverse : T.ash, borderRadius: T.rPill, border: `1px solid ${frequency === f ? T.cta : T.line}` }}
                >
                  {f}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="flex-1" />

      <div className="px-6 pb-8">
        {error && <p className="text-[12px] mb-2 text-center" style={{ ...body, color: T.alert }}>{error}</p>}
        <button
          onClick={handleNext}
          disabled={!canContinue || saving}
          className="w-full py-3.5 font-semibold text-[14px]"
          style={{ ...display, background: T.cta, color: T.inverse, borderRadius: T.rPill, boxShadow: T.shadowMd, opacity: !canContinue || saving ? 0.5 : 1 }}
        >
          {saving ? "Saving…" : step < STEPS.length - 1 ? "Continue" : "Finish"}
        </button>
      </div>
    </div>
  );
}

function LegalAgreementScreen({ onAccept }) {
  const { T, display, body, mono } = useTheme();
  const [tab, setTab] = useState("terms");
  const [checked, setChecked] = useState(false);
  const [saving, setSaving] = useState(false);

  const TABS = [
    { key: "terms", label: "Terms of Use", text: TERMS_OF_USE },
    { key: "privacy", label: "Privacy Policy", text: PRIVACY_POLICY },
    { key: "eula", label: "EULA", text: EULA },
  ];
  const activeText = TABS.find((t) => t.key === tab).text;

  const handleAccept = async () => {
    setSaving(true);
    await onAccept();
    setSaving(false);
  };

  return (
    <div className="h-screen flex flex-col" style={{ backgroundColor: T.void }}>
      <style>{FONTS}</style>
      <div className="px-6 pt-8 pb-3">
        <h1 className="text-[18px] font-semibold mb-1" style={{ ...display, color: T.ash }}>Before you continue</h1>
        <p className="text-[12px]" style={{ ...body, color: T.ashDim }}>Please read and agree to the following.</p>
      </div>
      <div className="px-6 flex gap-1" style={{ borderBottom: `1px solid ${T.line}` }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="px-2 py-2 text-[12px] font-semibold"
            style={{ ...body, color: tab === t.key ? T.ash : T.ashFaint, borderBottom: tab === t.key ? `2px solid ${T.ash}` : "2px solid transparent" }}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4">
        <p className="text-[12px] whitespace-pre-wrap" style={{ ...body, color: T.ashDim, lineHeight: 1.6 }}>{activeText}</p>
      </div>
      <div className="px-6 pt-3 pb-6" style={{ borderTop: `1px solid ${T.line}`, background: T.void }}>
        <button onClick={() => setChecked(!checked)} className="w-full flex items-center gap-2 mb-3 text-left">
          <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center" style={{ border: `1.5px solid ${checked ? T.cta : T.line}`, background: checked ? T.cta : "transparent", borderRadius: 4 }}>
            {checked && <Check size={13} color={T.inverse} strokeWidth={3} />}
          </div>
          <span className="text-[12px]" style={{ ...body, color: T.ashDim }}>I've read and agree to the Terms of Use, Privacy Policy, and EULA.</span>
        </button>
        <button
          onClick={handleAccept}
          disabled={!checked || saving}
          className="w-full py-3.5 font-semibold text-[14px]"
          style={{ ...display, background: T.cta, color: T.inverse, borderRadius: T.rPill, boxShadow: T.shadowMd, opacity: !checked || saving ? 0.5 : 1 }}
        >
          {saving ? "Continuing…" : "Agree & Continue"}
        </button>
      </div>
    </div>
  );
}

const LOADING_KEYFRAMES = `
@keyframes loadingPulse {
  0%, 80%, 100% { transform: scale(0.6); opacity: 0.35; }
  40% { transform: scale(1); opacity: 1; }
}
`;

// Shared across every "waiting on auth/profile to resolve" gate in the App
// shell — same spots that used to just say "Loading…" as plain text.
//
// Real report, 2026-09-20: a brand-new player (Android) installed the app,
// opened it, and it sat on these dots forever — no crash, no error, just an
// async subscription (Firebase Auth's onAuthStateChanged, or the profile
// doc's onSnapshot) that apparently never fired on that device. Whatever
// the underlying cause turns out to be, a silent infinite wait with zero
// recovery path is the real bug here — this adds a timeout so a stuck
// loader turns into something a player can actually get themselves out of,
// regardless of what caused the hang.
function LoadingScreen() {
  const { T, display, body, mono } = useTheme();
  const [showRetry, setShowRetry] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShowRetry(true), 8000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="h-full flex flex-col items-center justify-center gap-5 px-8" style={{ backgroundColor: T.void }}>
      <style>{LOADING_KEYFRAMES}</style>
      <div className="flex gap-2">
        {[0, 0.15, 0.3].map((delay) => (
          <div
            key={delay}
            style={{
              width: 9,
              height: 9,
              borderRadius: 999,
              background: T.accent,
              animation: "loadingPulse 1.4s ease-in-out infinite",
              animationDelay: `${delay}s`,
            }}
          />
        ))}
      </div>
      {showRetry && (
        <div className="flex flex-col items-center gap-3 text-center">
          <p className="text-[13px] leading-relaxed" style={{ ...body, color: T.ashDim }}>
            This is taking longer than expected.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 text-[13px] font-semibold"
            style={{ ...display, background: T.panel, color: T.ash, borderRadius: T.rPill, border: `1px solid ${T.line}` }}
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );
}

const PATCH_UNLOCK_KEYFRAMES = `
@keyframes patchPop {
  0% { transform: scale(0.3); opacity: 0; }
  60% { transform: scale(1.12); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}
@keyframes patchGlow {
  0%, 100% { filter: drop-shadow(0 0 24px rgba(255,255,255,0.35)); }
  50% { filter: drop-shadow(0 0 48px rgba(255,255,255,0.65)); }
}
@keyframes patchOverlayIn {
  0% { opacity: 0; }
  100% { opacity: 1; }
}
`;

// Shown once, right after a brand-new account accepts the legal agreement
// and before the onboarding wizard's name/callsign/photo steps — the same
// full-bleed blue treatment as the patch-unlock moment above (reuses its
// keyframes) so a first-time player's very first screen in the app feels
// like an event, not a form. Purely local UI state, not persisted: it
// naturally never reappears because completedOnboarding flips true once
// the wizard finishes, and this only ever renders while that's still
// false.
function WelcomeSplashScreen({ onContinue }) {
  const { T, display, body, mono } = useTheme();
  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center px-8"
      style={{ background: "rgba(0,44,72,0.97)", zIndex: 3000, animation: "patchOverlayIn 0.3s ease-out" }}
    >
      <style>{PATCH_UNLOCK_KEYFRAMES}</style>

      <div className="relative mb-7" style={{ animation: "patchGlow 2.4s ease-in-out infinite" }}>
        <div style={{ position: "absolute", inset: -40, background: "radial-gradient(circle, rgba(255,255,255,0.22) 0%, transparent 70%)", borderRadius: "50%" }} />
        <div
          className="overflow-hidden"
          style={{ width: 120, height: 120, borderRadius: 16, position: "relative", animation: "patchPop 0.55s cubic-bezier(0.34,1.56,0.64,1)" }}
        >
          <img src={`${import.meta.env.BASE_URL}logo.jpg`} alt="Atlas" className="w-full h-full" style={{ objectFit: "cover" }} />
        </div>
      </div>

      <div className="text-[24px] font-bold text-center px-2 mb-2" style={{ ...display, color: "#FFFFFF", lineHeight: 1.3 }}>Welcome to Atlas!</div>
      <div className="text-[14px] text-center mb-9 px-6" style={{ ...body, color: "rgba(255,255,255,0.75)" }}>
        Real events, real players, right in your pocket. Let's get your profile set up.
      </div>

      <button
        onClick={onContinue}
        className="px-9 py-3.5 font-semibold text-[14px] transition-transform duration-100 active:scale-95"
        style={{ ...display, background: "#FFFFFF", color: T.ash, borderRadius: 999 }}
      >
        Let's get started
      </button>
    </div>
  );
}

// Grandiose, scalable — handles one unlocked patch or a whole stack of
// them the same way, revealing one at a time so a big multi-patch login
// never feels like a wall of clutter. Advances through the stack and
// marks each patch seen as it's dismissed; naturally disappears once
// there's nothing left unseen.
// Deliberately a small dismissable-by-ignoring floating bar, not a modal
// like CancellationNoticeModal below or a full takeover like
// PatchUnlockedOverlay — a new build being ready is never urgent enough
// to block whatever the player is doing (booking, checking in, mid a
// live Stripe redirect), so this never force-reloads on its own. It only
// reloads when the player themselves taps Refresh. Sits above BottomNav's
// own floating pill (zIndex 1000) on screens that have one, below the
// two full-screen overlays (zIndex 2500) so a cancellation notice or a
// patch unlock still takes priority if both happen to be showing.
function UpdateAvailableToast({ onRefresh }) {
  const { T, display, body } = useTheme();
  return (
    <div
      className="fixed left-4 right-4 flex items-center justify-between gap-3 px-4 py-3"
      style={{
        bottom: 84,
        background: T.glassFill,
        backdropFilter: T.glassBlur,
        WebkitBackdropFilter: T.glassBlur,
        border: T.glassBorder,
        borderRadius: T.rFloat,
        boxShadow: T.shadowFloat,
        zIndex: 1800,
      }}
    >
      <p className="text-[13px] font-medium" style={{ ...body, color: T.ash }}>
        A new version of Atlas is ready.
      </p>
      <button
        onClick={onRefresh}
        className="flex items-center gap-1.5 px-3.5 py-2 text-[12px] font-semibold flex-shrink-0"
        style={{ ...display, background: T.cta, color: T.inverse, borderRadius: T.rPill }}
      >
        <RefreshCw size={13} />
        Refresh
      </button>
    </div>
  );
}

// One-at-a-time popup for "an event you reserved was canceled" —
// useCancellationNotices already narrows this down to the single oldest
// unacknowledged notice, so this component just has to render it and
// clear it on dismiss. Deliberately a modal card (Ticket dialogs
// elsewhere in this app use the same dim-background + centered-panel
// idiom), not a full-screen takeover like PatchUnlockedOverlay below —
// this is a heads-up, not a celebration.
function CancellationNoticeModal({ notice, onDismiss }) {
  const { T, display, body } = useTheme();
  const [dismissing, setDismissing] = useState(false);

  const handleDismiss = async () => {
    setDismissing(true);
    try {
      await onDismiss();
    } catch (err) {
      console.error("acknowledgeNotice failed:", err);
      setDismissing(false);
    }
  };

  const amount = typeof notice.voucherAmountCents === "number" ? notice.voucherAmountCents / 100 : null;
  // A manually-granted voucher (owner gave it directly, event never got
  // canceled) reuses this exact same notice pipeline with a different
  // type, so it needs its own copy — no cancellation language at all,
  // and deliberately nothing about why it can't be redeemed on the same
  // event it came from.
  const isGrant = notice.type === "voucher_granted";

  return (
    <div className="fixed inset-0 flex items-center justify-center px-6" style={{ background: "rgba(0,0,0,0.55)", zIndex: 2500 }}>
      <div className="w-full p-5" style={{ background: T.panel, borderRadius: T.rCard, maxWidth: 340, boxShadow: T.shadowLg }}>
        <div className="w-10 h-10 mb-3 flex items-center justify-center" style={{ background: T.tint, borderRadius: T.rPill }}>
          <Ticket size={18} color={T.accent} />
        </div>
        {isGrant ? (
          <>
            <div className="text-[15px] font-semibold mb-1" style={{ ...display, color: T.ash }}>You've received a voucher</div>
            <p className="text-[13px] mb-4 px-3 py-2.5" style={{ ...body, color: T.ash, background: T.tintGood, borderRadius: T.rTight }}>
              You've received a <strong>${amount % 1 === 0 ? amount : amount.toFixed(2)} voucher</strong> for {notice.fieldName || "this field"} — good for a future event there.
            </p>
          </>
        ) : (
          <>
            <div className="text-[15px] font-semibold mb-1" style={{ ...display, color: T.ash }}>Event canceled</div>
            <p className="text-[13px] mb-3" style={{ ...body, color: T.ashDim }}>
              "{notice.eventTitle || "An event"}" at {notice.fieldName || "the field"} was canceled by the field owner.
            </p>
            {amount != null ? (
              <p className="text-[13px] mb-4 px-3 py-2.5" style={{ ...body, color: T.ash, background: T.tintGood, borderRadius: T.rTight }}>
                You've received a <strong>${amount % 1 === 0 ? amount : amount.toFixed(2)} voucher</strong>, good for a future event at {notice.fieldName || "this field"}.
              </p>
            ) : (
              <p className="text-[12px] mb-4" style={{ ...body, color: T.ashFaint }}>
                This was a free reservation, so there's nothing further to settle.
              </p>
            )}
          </>
        )}
        <button
          onClick={handleDismiss}
          disabled={dismissing}
          className="w-full py-2.5 text-[13px] font-semibold"
          style={{ ...display, background: T.cta, color: T.inverse, borderRadius: T.rPill, boxShadow: T.shadowSm, opacity: dismissing ? 0.6 : 1 }}
        >
          {dismissing ? "…" : "Got it"}
        </button>
      </div>
    </div>
  );
}

function PatchUnlockedOverlay({ unseenPatches, user, markPatchSeen }) {
  const { T, display, body, mono } = useTheme();
  const [index, setIndex] = useState(0);
  const [advancing, setAdvancing] = useState(false);

  if (unseenPatches.length === 0) return null;
  const safeIndex = Math.min(index, unseenPatches.length - 1);
  const current = unseenPatches[safeIndex];
  const isLast = safeIndex === unseenPatches.length - 1;

  const handleNext = async () => {
    setAdvancing(true);
    try {
      await markPatchSeen(user.uid, current.id);
      setIndex((i) => i + 1);
    } catch (err) {
      console.error("markPatchSeen failed:", err);
    } finally {
      setAdvancing(false);
    }
  };

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center px-8"
      style={{ background: "rgba(0,44,72,0.97)", zIndex: 3000, animation: "patchOverlayIn 0.3s ease-out" }}
    >
      <style>{PATCH_UNLOCK_KEYFRAMES}</style>

      {unseenPatches.length > 1 && (
        <div className="text-[12px] font-semibold mb-4" style={{ ...mono, color: "rgba(255,255,255,0.55)", letterSpacing: "0.1em" }}>
          {safeIndex + 1} OF {unseenPatches.length}
        </div>
      )}

      <div className="relative mb-7" style={{ animation: "patchGlow 2.4s ease-in-out infinite" }}>
        <div style={{ position: "absolute", inset: -40, background: "radial-gradient(circle, rgba(255,255,255,0.22) 0%, transparent 70%)", borderRadius: "50%" }} />
        <img
          key={current.id}
          src={current.imageUrl}
          alt={current.name}
          style={{ width: 180, height: 180, objectFit: "contain", position: "relative", animation: "patchPop 0.55s cubic-bezier(0.34,1.56,0.64,1)" }}
        />
      </div>

      <div className="text-[13px] font-bold mb-2" style={{ ...mono, color: "#F2C94C", letterSpacing: "0.14em" }}>✦ PATCH UNLOCKED ✦</div>
      <div className="text-[24px] font-bold text-center px-2" style={{ ...display, color: "#FFFFFF", lineHeight: 1.3 }}>{splitPatchDisplay(current).title}</div>
      {splitPatchDisplay(current).subtitle && (
        <div className="text-[14px] text-center mb-9 px-6 mt-2" style={{ ...body, color: "rgba(255,255,255,0.75)" }}>{splitPatchDisplay(current).subtitle}</div>
      )}
      {!splitPatchDisplay(current).subtitle && <div className="mb-9" />}

      <button
        onClick={handleNext}
        disabled={advancing}
        className="px-9 py-3.5 font-semibold text-[14px] transition-transform duration-100 active:scale-95"
        style={{ ...display, background: "#FFFFFF", color: T.ash, borderRadius: 999, opacity: advancing ? 0.7 : 1 }}
      >
        {advancing ? "…" : isLast ? "Awesome!" : "Next →"}
      </button>
    </div>
  );
}

function AppShell() {
  const { T, display, body, mono } = useTheme();
  const { needRefresh, refreshNow } = useSWUpdate();
  // The same proven fix from the owner app, ported over rather than
  // rediscovered — a real WebKit bug can corrupt this PWA's own
  // window.innerHeight/visualViewport.height after visiting an external
  // site (Stripe) and returning, even when this app's own tab never
  // navigates away itself (opening a sibling tab can still be enough to
  // trigger a milder version of the same corruption). This remembers the
  // largest height ever genuinely observed this session — from before any
  // redirect could corrupt anything — since the bug only ever shrinks the
  // reported value, never grows it.
  useEffect(() => {
    const setRealHeight = () => {
      const current = window.visualViewport ? window.visualViewport.height : window.innerHeight;
      const cached = parseInt(sessionStorage.getItem("atlas-known-good-height") || "0", 10);
      const real = Math.max(current, cached);
      sessionStorage.setItem("atlas-known-good-height", String(real));
      document.documentElement.style.setProperty("--real-screen-height", `${real}px`);
    };
    setRealHeight();
    window.visualViewport?.addEventListener("resize", setRealHeight);
    window.addEventListener("resize", setRealHeight);
    return () => {
      window.visualViewport?.removeEventListener("resize", setRealHeight);
      window.removeEventListener("resize", setRealHeight);
    };
  }, []);

  // Only gates on phones — desktop/tablet browsers don't have the same
  // "installed app vs. browser tab" distinction that matters here, and a
  // hard gate there would just block legitimate desktop access for no
  // reason. iOS/Android detection is a simple, standard user-agent check;
  // display-mode:standalone (and iOS's older navigator.standalone) is the
  // real signal for "already installed."
  const [installGate, setInstallGate] = useState(null); // null = checking, false = not needed, "ios" | "android" = needs install
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState(null);

  useEffect(() => {
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
    const ua = navigator.userAgent;
    const isIOS = /iPhone|iPad|iPod/i.test(ua);
    const isAndroid = /Android/i.test(ua);

    if (isStandalone || (!isIOS && !isAndroid)) {
      setInstallGate(false);
      return;
    }
    setInstallGate(isIOS ? "ios" : "android");

    const handler = (e) => {
      e.preventDefault();
      setDeferredInstallPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const { fields, loading: fieldsLoading } = useFields();
  const { events, loading: eventsLoading } = useEvents();
  const { user, profile, authLoading, signUp, signIn, signInWithGoogle, signOut, updateProfileFields, changePassword, uploadAvatar, updateLanguage, deleteAccount, acceptTerms, completeOnboarding } = useAuth();
  const { favorites, favoritesLoading, isFavorited, toggleFavorite } = useFavorites(user?.uid, profile);
  const { patches, patchesLoading, grantPatch, markPatchSeen, setFeaturedPatch } = usePatches(user?.uid);
  const { teams: allTeams, teamsLoading: allTeamsLoading } = useAllTeams();
  const {
    createTeam,
    joinTeam,
    leaveTeam,
    updateTeamInfo,
    setHomeField,
    updateTeamPatch,
    setMemberRole,
    removeMember,
    reconcileMembership,
    requestOfficer,
    deleteOfficerRequest,
    approveOfficerRequest,
  } = useTeamActions();
  const { profiles: allPublicProfiles } = useAllPublicProfiles();
  const { friends, friendsLoading } = useFriends(user?.uid);
  const { requests: incomingRequests } = useIncomingRequests(user?.uid);
  const outgoingRequestUids = useOutgoingRequestUids(user?.uid);
  const { sendRequest, acceptRequest, declineRequest, cancelOrUnfriend } = useFriendActions();

  // Referral capture — a real deployed app, not a sandboxed artifact, so
  // localStorage is appropriate here: it lets the ?ref= code survive a
  // page reload or a detour through the OAuth-less sign-up form before the
  // account actually gets created.
  const [referralCode] = useState(() => {
    const fromUrl = new URLSearchParams(window.location.search).get("ref");
    if (fromUrl) {
      localStorage.setItem("atlas_referral", fromUrl);
      return fromUrl;
    }
    return localStorage.getItem("atlas_referral") || null;
  });

  // Field deep link — a shared field URL (?field=<slug>) should open
  // straight to that field's detail screen. Read once on load, same as
  // referralCode above, and seed the nav stack with it directly so the
  // field screen is already queued up before auth/onboarding gates clear
  // (those gates render ahead of any screen check, so this just waits
  // quietly behind them rather than needing a separate redirect effect).
  const [fieldDeepLinkId] = useState(() => new URLSearchParams(window.location.search).get("field"));

  const [stack, setStack] = useState(() => (fieldDeepLinkId ? ["home", "field"] : ["home"]));
  const [activeEventId, setActiveEventId] = useState(null);
  const [activeFieldId, setActiveFieldId] = useState(() => fieldDeepLinkId || null);
  const [activeTeamId, setActiveTeamId] = useState(null);
  const [activePlayerId, setActivePlayerId] = useState(null);
  const screen = stack[stack.length - 1];

  // Explore (Home) screen filter/view state — owned here rather than
  // inside HomeScreen, because HomeScreen unmounts whenever the player
  // drills into a field or event (screen leaves "home") and remounts
  // fresh on the way back. Living here means category, view mode
  // (list/fields/map), state selector, nearby toggle, search text, and
  // the advanced filters all survive drill-down navigation exactly like
  // activeFieldId etc. already do above, instead of silently resetting.
  const [homeSearch, setHomeSearch] = useState("");
  const [homeActiveCat, setHomeActiveCat] = useState("Featured");
  const [homeViewMode, setHomeViewMode] = useState("list");
  const [homeActiveTodayOnly, setHomeActiveTodayOnly] = useState(false);
  const [homeNearbyOnly, setHomeNearbyOnly] = useState(false);
  const [homeUserLocation, setHomeUserLocation] = useState(null);
  const [homeLocationStatus, setHomeLocationStatus] = useState("idle");
  const [homeSelectedState, setHomeSelectedState] = useState(null);
  const [homeStateDetectAttempted, setHomeStateDetectAttempted] = useState(false);
  const [homeDateFrom, setHomeDateFrom] = useState("");
  const [homeDateTo, setHomeDateTo] = useState("");
  const [homeMaxPrice, setHomeMaxPrice] = useState(null);
  const [homeRadiusMiles, setHomeRadiusMiles] = useState(NEARBY_RADIUS_MILES);
  const [homeSortBy, setHomeSortBy] = useState("date");
  const [scheduleTab, setScheduleTab] = useState("interested"); // booked | interested | past — see ScheduleScreen
  const [socialTab, setSocialTab] = useState("friends"); // friends | teams — see SocialScreen

  const openPlayer = (uid) => {
    setActivePlayerId(uid);
    push("player");
  };

  const push = (s) => setStack((prev) => [...prev, s]);
  const pop = () => setStack((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
  const goTab = (tab) => setStack([tab]);

  const activeEvent = events.find((e) => e.id === activeEventId) || null;
  const { signature, signWaiver } = useWaiverSignature(user?.uid, activeEvent?.id);
  const { booking: myBooking, bookingLoading: myBookingLoading } = useMyBooking(user?.uid, activeEvent?.id);
  const { bookings: whosGoing, bookingsLoading: whosGoingLoading } = useEventBookings(activeEvent?.id);
  const { interested: whosInterested, interestedLoading: whosInterestedLoading } = useEventInterested(activeEvent?.id);
  const { bookings: myBookings, bookingsLoading: myBookingsLoading } = useMyBookings(user?.uid);
  const { bookEvent, cancelBooking, createBookingCheckout } = useBookingActions();
  const { vouchers: myVouchers } = useMyVouchers(user?.uid);
  const { noticeToShow, acknowledgeNotice } = useCancellationNotices(user?.uid);
  const { redeemVoucher } = useVoucherRedemption();

  // Closes the check-in patch loop: whenever a checked-in booking's event
  // has a reward patch attached, and this player doesn't already have a
  // patch with that exact name, grant it automatically. This has to run
  // from the PLAYER's own session, not the owner's — a player's patches
  // subcollection can only ever be written by that player themselves, so
  // the owner's scan can't push a patch in directly. Same self-healing
  // idiom used for the public-profile backfill: the grant just happens
  // quietly the next time this player's own data loads.
  //
  // The same "no single moment can push a patch into someone else's
  // collection" principle also applies to the "Squad Catalyst" achievement
  // (5+ registered teammates checking into the same event) — see the
  // achievement-catalog effect below, which uses the identical self-check
  // pattern for exactly that reason.
  const grantingPatchRef = useRef(new Set());
  useEffect(() => {
    if (!user || myBookingsLoading || patchesLoading) return;
    const ownedPatchNames = new Set(patches.map((p) => p.name));

    const tryGrant = async (name, imageUrl) => {
      if (ownedPatchNames.has(name) || grantingPatchRef.current.has(name)) return;
      grantingPatchRef.current.add(name);
      try {
        await grantPatch(user.uid, name, imageUrl);
      } catch (err) {
        console.error("patch grant failed:", err);
      } finally {
        grantingPatchRef.current.delete(name);
      }
    };

    myBookings.forEach((booking) => {
      if (!booking.checkedIn) return;
      const event = events.find((e) => e.id === booking.eventId);
      if (!event) return;

      if (event.checkInPatch?.imageUrl) {
        tryGrant(event.checkInPatch.name, event.checkInPatch.imageUrl);
      }
    });
  }, [user, myBookings, myBookingsLoading, events, patches, patchesLoading]);

  // The admin-defined achievement catalog — same self-healing grant idiom
  // as above, just evaluated against a much broader rule set (referral
  // counts, lifetime totals, distinct fields/states, weekend streaks,
  // etc.) instead of a single event's attached reward. Shares the same
  // grantingPatchRef so a patch never gets double-submitted regardless of
  // which of the two effects found it first.
  const { catalog: achievementCatalog, catalogLoading: achievementCatalogLoading } = useAchievementCatalog();
  useEffect(() => {
    if (!user || myBookingsLoading || patchesLoading || achievementCatalogLoading) return;
    const ownedPatchNames = new Set(patches.map((p) => p.name));
    evaluateAchievements({
      catalog: achievementCatalog,
      myBookings,
      events,
      fields,
      profile,
      US_STATES,
    }).then((earned) => {
      earned.forEach((patch) => {
        if (ownedPatchNames.has(patch.name) || grantingPatchRef.current.has(patch.name)) return;
        grantingPatchRef.current.add(patch.name);
        grantPatch(user.uid, patch.name, patch.imageUrl, patch.details || null)
          .catch((err) => console.error("achievement grant failed:", err))
          .finally(() => grantingPatchRef.current.delete(patch.name));
      });
    }).catch((err) => console.error("achievement evaluation failed:", err));
  }, [user, myBookings, myBookingsLoading, events, fields, patches, patchesLoading, profile, achievementCatalog, achievementCatalogLoading]);

  const activeField =
    fields.find((f) => f.id === activeFieldId) ||
    (activeEvent ? fields.find((f) => f.id === activeEvent.fieldId) : null);
  const activeFieldEvents = activeField
    ? events
        .filter((e) => e.fieldId === activeField.id && !e.canceled && (e.endDate || e.date) >= localDateStr())
        .sort((a, b) => a.date.localeCompare(b.date))
    : [];
  const activeFieldPastEvents = activeField
    ? events
        .filter((e) => e.fieldId === activeField.id && !e.canceled && (e.endDate || e.date) < localDateStr())
        .sort((a, b) => b.date.localeCompare(a.date)) // most recent first
    : [];

  const openEvent = (ev) => {
    setActiveEventId(ev.id);
    setActiveFieldId(null); // clear any leftover field selection from a prior visit
    push("event");
  };
  const openField = (fieldOrId) => {
    setActiveFieldId(typeof fieldOrId === "string" ? fieldOrId : fieldOrId?.id || activeEvent?.fieldId);
    push("field");
  };
  const openAccount = () => push("account");
  const openPatches = () => push("patches");
  const openSecretPatchQR = () => push("secretPatchQR");
  const openScanRedeem = () => push("scanRedeem");
  const openTeam = (teamId) => {
    setActiveTeamId(teamId);
    push("team");
  };
  const { team: activeTeam, members: activeTeamMembers, teamLoading: activeTeamLoading } = useTeam(activeTeamId);
  const { myOfficerRequest: activeTeamMyOfficerRequest } = useMyOfficerRequest(activeTeamId, user?.uid);
  const { officerRequests: activeTeamOfficerRequests } = useOfficerRequests(activeTeamId);

  // If an officer removed this player since their last visit, their own
  // profile still points at that team — correct it once, quietly, whenever
  // they land on Social. See reconcileMembership's own comment for why this
  // is the one place that can fix it.
  useEffect(() => {
    if (screen === "inbox" && profile?.teamId) {
      reconcileMembership(user?.uid, profile.teamId);
    }
  }, [screen, profile?.teamId, user?.uid]);

  const handleLogout = async () => {
    await signOut();
    setStack(["home"]); // reset navigation so the next sign-in starts clean
  };

  // Local only, not persisted — see WelcomeSplashScreen's own comment for
  // why that's the right call here.
  const [welcomeDismissed, setWelcomeDismissed] = useState(false);

  let content;
  if (installGate === null) {
    content = null; // brief instant while the install check resolves — nothing flashes before it
  } else if (installGate) {
    content = <InstallGateScreen platform={installGate} deferredPrompt={deferredInstallPrompt} />;
  } else if (authLoading) {
    content = <LoadingScreen />;
  } else if (!user) {
    content = <LoginScreen signIn={signIn} signUp={signUp} signInWithGoogle={signInWithGoogle} referralCode={referralCode} />;
  } else if (!profile) {
    content = <LoadingScreen />;
  } else if (profile.acceptedTermsVersion !== CURRENT_TERMS_VERSION) {
    content = <LegalAgreementScreen onAccept={() => acceptTerms(CURRENT_TERMS_VERSION)} />;
  } else if (profile.completedOnboarding === false && !welcomeDismissed) {
    content = <WelcomeSplashScreen onContinue={() => setWelcomeDismissed(true)} />;
  } else if (profile.completedOnboarding === false) {
    content = (
      <OnboardingWizardScreen
        profile={profile}
        user={user}
        updateProfileFields={updateProfileFields}
        uploadAvatar={uploadAvatar}
        completeOnboarding={completeOnboarding}
      />
    );
  } else if (screen === "home") {
    content = (
      <HomeScreen
        events={events}
        eventsLoading={eventsLoading}
        fields={fields}
        profile={profile}
        favorites={favorites}
        user={user}
        myBookings={myBookings}
        onOpenEvent={openEvent}
        onOpenField={openField}
        onNavigate={goTab}
        search={homeSearch} setSearch={setHomeSearch}
        activeCat={homeActiveCat} setActiveCat={setHomeActiveCat}
        viewMode={homeViewMode} setViewMode={setHomeViewMode}
        activeTodayOnly={homeActiveTodayOnly} setActiveTodayOnly={setHomeActiveTodayOnly}
        nearbyOnly={homeNearbyOnly} setNearbyOnly={setHomeNearbyOnly}
        userLocation={homeUserLocation} setUserLocation={setHomeUserLocation}
        locationStatus={homeLocationStatus} setLocationStatus={setHomeLocationStatus}
        selectedState={homeSelectedState} setSelectedState={setHomeSelectedState}
        stateDetectAttempted={homeStateDetectAttempted} setStateDetectAttempted={setHomeStateDetectAttempted}
        dateFrom={homeDateFrom} setDateFrom={setHomeDateFrom}
        dateTo={homeDateTo} setDateTo={setHomeDateTo}
        maxPrice={homeMaxPrice} setMaxPrice={setHomeMaxPrice}
        radiusMiles={homeRadiusMiles} setRadiusMiles={setHomeRadiusMiles}
        sortBy={homeSortBy} setSortBy={setHomeSortBy}
      />
    );
  } else if (screen === "event") {
    content = activeEvent ? (
      <EventDetailScreen
        ev={activeEvent}
        field={activeField}
        onBack={pop}
        onOpenField={() => openField(activeField)}
        favorited={isFavorited("event", activeEvent.id)}
        onToggleFavorite={() => toggleFavorite("event", activeEvent.id)}
        user={user}
        profile={profile}
        signature={signature}
        signWaiver={signWaiver}
        myBooking={myBooking}
        myBookingLoading={myBookingLoading}
        whosGoing={whosGoing}
        whosGoingLoading={whosGoingLoading}
        whosInterested={whosInterested}
        whosInterestedLoading={whosInterestedLoading}
        bookEvent={bookEvent}
        cancelBooking={cancelBooking}
        createBookingCheckout={createBookingCheckout}
        fieldVouchers={activeEvent ? myVouchers.filter((v) =>
          v.fieldId === activeEvent.fieldId &&
          !(v.expiresAt && v.expiresAt.toDate() < new Date()) &&
          v.excludedEventId !== activeEvent.id
        ) : []}
        redeemVoucher={redeemVoucher}
      />
    ) : (
      <div className="h-full flex items-center justify-center" style={{ backgroundColor: T.void }}>
        <p className="text-[13px]" style={{ ...body, color: T.ashDim }}>Loading event…</p>
      </div>
    );
  } else if (screen === "field") {
    const relocatedField = activeField?.relocatedTo ? fields.find((f) => f.id === activeField.relocatedTo) : null;
    content = (
      <FieldDetailScreen
        field={activeField}
        fieldsLoading={fieldsLoading}
        fieldEvents={activeFieldEvents}
        pastFieldEvents={activeFieldPastEvents}
        relocatedField={relocatedField}
        onBack={pop}
        onNavigate={goTab}
        onOpenEvent={openEvent}
        onOpenField={openField}
        favorited={activeField ? isFavorited("field", activeField.id) : false}
        onToggleFavorite={() => activeField && toggleFavorite("field", activeField.id)}
      />
    );
  } else if (screen === "favorites") {
    content = (
      <FavoritesScreen
        onNavigate={goTab}
        favorites={favorites}
        favoritesLoading={favoritesLoading}
        fields={fields}
        onOpenField={openField}
      />
    );
  } else if (screen === "schedule") {
    content = <ScheduleScreen onNavigate={goTab} favorites={favorites} events={events} onOpenEvent={openEvent} myBookings={myBookings} myBookingsLoading={myBookingsLoading} tab={scheduleTab} setTab={setScheduleTab} fields={fields} />;
  } else if (screen === "inbox") {
    content = (
      <SocialScreen
        onNavigate={goTab}
        onOpenTeam={openTeam}
        onOpenPlayer={openPlayer}
        profile={profile}
        user={user}
        teams={allTeams}
        teamsLoading={allTeamsLoading}
        createTeam={createTeam}
        allProfiles={allPublicProfiles}
        friends={friends}
        friendsLoading={friendsLoading}
        incomingRequests={incomingRequests}
        outgoingRequestUids={outgoingRequestUids}
        sendRequest={sendRequest}
        acceptRequest={acceptRequest}
        declineRequest={declineRequest}
        cancelOrUnfriend={cancelOrUnfriend}
        tab={socialTab}
        setTab={setSocialTab}
      />
    );
  } else if (screen === "player" && activePlayerId) {
    content = (
      <PlayerProfileScreen
        uid={activePlayerId}
        onBack={pop}
        currentUser={user}
        currentProfile={profile}
        currentUserFriendUids={new Set(friends.map((f) => f.uid))}
        outgoingRequestUids={outgoingRequestUids}
        sendRequest={sendRequest}
        cancelOrUnfriend={cancelOrUnfriend}
        events={events}
        onOpenEvent={openEvent}
      />
    );
  } else if (screen === "team") {
    content = (
      <TeamScreen
        team={activeTeam}
        members={activeTeamMembers}
        teamLoading={activeTeamLoading}
        myOfficerRequest={activeTeamMyOfficerRequest}
        officerRequests={activeTeamOfficerRequests}
        profile={profile}
        user={user}
        onBack={pop}
        onNavigate={goTab}
        fields={fields}
        onOpenPlayer={openPlayer}
        joinTeam={joinTeam}
        leaveTeam={leaveTeam}
        updateTeamInfo={updateTeamInfo}
        setHomeField={setHomeField}
        updateTeamPatch={updateTeamPatch}
        setMemberRole={setMemberRole}
        removeMember={removeMember}
        requestOfficer={requestOfficer}
        deleteOfficerRequest={deleteOfficerRequest}
        approveOfficerRequest={approveOfficerRequest}
      />
    );
  } else if (screen === "profile") {
    content = (
      <ProfileScreen
        profile={profile}
        user={user}
        onNavigate={goTab}
        onOpenAccount={openAccount}
        onOpenPatches={openPatches}
        onOpenSecretPatchQR={openSecretPatchQR}
        onOpenScanRedeem={openScanRedeem}
        onLogout={handleLogout}
        changePassword={changePassword}
        uploadAvatar={uploadAvatar}
        updateLanguage={updateLanguage}
        favorites={favorites}
        events={events}
        patches={patches}
        vouchers={myVouchers}
      />
    );
  } else if (screen === "account") {
    content = (
      <MyAccountScreen
        profile={profile}
        user={user}
        onBack={pop}
        updateProfileFields={updateProfileFields}
        uploadAvatar={uploadAvatar}
        deleteAccount={deleteAccount}
      />
    );
  } else if (screen === "patches") {
    content = (
      <PatchesScreen
        profile={profile}
        user={user}
        onBack={pop}
        patches={patches}
        patchesLoading={patchesLoading}
        setFeaturedPatch={setFeaturedPatch}
      />
    );
  } else if (screen === "secretPatchQR") {
    content = <SecretPatchScreen onBack={pop} />;
  } else if (screen === "scanRedeem") {
    content = <RedeemScannerScreen onBack={pop} user={user} grantPatch={grantPatch} />;
  }

  return (
    <div className="w-full flex flex-col app-shell-height" style={{ background: T.void }}>
      <style>{FONTS}</style>
      <div key={`${screen}:${activeEventId}:${activeFieldId}:${activeTeamId}:${activePlayerId}`} className="flex-1 min-h-0 relative screen-transition">
        {content}
      </div>
      {user && profile && !installGate && (
        <PatchUnlockedOverlay unseenPatches={patches.filter((p) => p.seen === false)} user={user} markPatchSeen={markPatchSeen} />
      )}
      {user && profile && !installGate && noticeToShow && (
        <CancellationNoticeModal notice={noticeToShow} onDismiss={() => acknowledgeNotice(noticeToShow.id)} />
      )}
      {needRefresh && <UpdateAvailableToast onRefresh={refreshNow} />}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppShell />
    </ThemeProvider>
  );
}
