import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Compass, Heart, Calendar, Inbox, User, ChevronLeft, Share2, Users, Shield,
  Search, SlidersHorizontal, MapPin, Star, Check, Plus, Crosshair,
  ArrowRight, ChevronRight, LogOut, MessageCircle, Ticket, Radio, Camera, Phone, BadgeCheck, FileSignature, RefreshCw, Maximize2, X, TreePine, ChevronsUp, Home, Trophy
} from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import QRCode from "qrcode";
import { useFields } from "./hooks/useFields";
import { useEvents } from "./hooks/useEvents";
import { useAuth } from "./hooks/useAuth";
import { useFavorites } from "./hooks/useFavorites";
import { usePatches } from "./hooks/usePatches";
import { useAllTeams, useTeam, useTeamActions } from "./hooks/useTeams";
import { useWaiverSignature } from "./hooks/useWaiverSignature";

/* ---------- design tokens ---------- */
const FONTS = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@500;600&display=swap');
`;
const display = { fontFamily: "'Space Grotesk', sans-serif" };
const mono = { fontFamily: "'IBM Plex Mono', monospace" };
const body = { fontFamily: "'Inter', sans-serif" };

const T = {
  // Light, high-contrast palette — chosen for outdoor sunlight readability
  // over aesthetic preference. Text-bearing tokens (ash/ashDim/ashFaint,
  // accent, good, alert) are deliberately on the darker/more-saturated end
  // of their range for real contrast against the light backgrounds, not
  // just "looks fine indoors."
  void: "#F2F2ED", // page background
  panel: "#FFFFFF", // card surfaces — clear separation from the page
  panelAlt: "#E7E7E1", // nested surfaces: chip fills, placeholder thumbnails
  line: "#D2D2CB", // borders/dividers
  ash: "#002C48", // primary text AND primary solid-button fill (deep navy ink)
  ashDim: "#4E5257", // secondary text
  ashFaint: "#686C72", // tertiary text/labels — still meant to stay legible, not decorative-faint
  accent: "#1554B8", // links/interactive — deep blue for real contrast on white
  good: "#0F7A52", // success/positive
  alert: "#BC3327", // warnings/live badges
};

const flatBg = { backgroundColor: T.void };

/* ---------- helpers ---------- */
// Deterministic placeholder gradient per field/event until real photos exist.
const GRADIENTS = [
  "linear-gradient(160deg,#E4E4DD,#CDCDC4)",
  "linear-gradient(160deg,#E0E0DE,#C8C8C4)",
  "linear-gradient(160deg,#E2E4DE,#CACDC4)",
  "linear-gradient(160deg,#E1E0DE,#C9C8C4)",
  "linear-gradient(160deg,#DFE1E2,#C6C9CA)",
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
  DC: "District of Columbia",
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
  relocated: "RELOCATED",
  rebranded: "REBRANDED",
  unscrapable: null,
  facebook_only: null,
};

/* ---------- primitives ---------- */
function Tag({ children, tone = "neutral" }) {
  const map = {
    neutral: { border: "transparent", color: "#FFFFFF", bg: "rgba(10,10,11,0.72)" },
    accent: { border: "transparent", color: "#FFFFFF", bg: T.ash },
    good: { border: "transparent", color: "#FFFFFF", bg: T.good },
    live: { border: "transparent", color: "#fff", bg: T.alert },
  };
  const s = map[tone];
  return (
    <span
      className="text-[10px] font-semibold px-2 py-1 inline-flex items-center"
      style={{
        ...mono,
        letterSpacing: "0.04em",
        border: s.bg ? "none" : `1px solid ${s.border}`,
        background: s.bg || "transparent",
        color: s.color,
        borderRadius: 2,
      }}
    >
      {children}
    </span>
  );
}

function ScreenHeader({ title }) {
  return (
    <div className="px-6 pt-2 pb-4 text-center border-b" style={{ borderColor: T.line }}>
      <h1 className="text-[18px] font-semibold" style={{ ...display, color: T.ash, letterSpacing: "-0.01em" }}>
        {title}
      </h1>
    </div>
  );
}

function Eyebrow({ children }) {
  return (
    <div className="text-[10px] font-semibold uppercase mb-2" style={{ ...mono, color: T.ashFaint, letterSpacing: "0.08em" }}>
      {children}
    </div>
  );
}

function BottomNav({ active, onNavigate }) {
  const tabs = [
    { key: "home", label: "Explore", icon: Compass },
    { key: "favorites", label: "Favorites", icon: Heart },
    { key: "schedule", label: "Schedule", icon: Calendar },
    { key: "inbox", label: "Social", icon: Users },
    { key: "profile", label: "Profile", icon: User },
  ];
  return (
    <div className="absolute bottom-0 left-0 right-0 border-t" style={{ background: T.panel, borderColor: T.line, zIndex: 1000 }}>
      <div className="flex justify-between px-5 pt-2.5" style={{ paddingBottom: "max(14px, env(safe-area-inset-bottom))" }}>
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = active === t.key;
          return (
            <button key={t.key} onClick={() => onNavigate(t.key)} className="flex flex-col items-center gap-1 flex-1 transition-transform duration-100 active:scale-90">
              <Icon size={19} strokeWidth={isActive ? 2.1 : 1.6} color={isActive ? T.ash : T.ashFaint} />
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
function LoginScreen({ signIn, signUp, referralCode }) {
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

  return (
    <div className="h-full flex flex-col px-6 overflow-y-auto" style={flatBg}>
      <div className="flex flex-col items-center mt-12 mb-8">
        <div className="w-14 h-14 flex items-center justify-center mb-3" style={{ background: T.panelAlt, border: `1px solid ${T.line}`, borderRadius: 4 }}>
          <Crosshair color={T.ash} size={24} strokeWidth={1.6} />
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
          style={{ ...display, background: T.ash, color: "#FFFFFF", borderRadius: 4, opacity: busy ? 0.6 : 1 }}
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
        {["Continue with Google", "Continue with Apple", "Continue with Facebook"].map((label) => (
          <button
            key={label}
            disabled
            className="w-full py-3 font-medium text-[13px] flex items-center justify-center gap-2"
            style={{ ...body, border: `1px solid ${T.line}`, color: T.ashFaint, borderRadius: 4, opacity: 0.5, cursor: "not-allowed" }}
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
  const isToday = ev.date === localDateStr();
  return (
    <button
      onClick={onClick}
      className="text-left w-full mb-4 p-3 transition-transform duration-100 active:scale-[0.98]"
      style={{ background: T.panel, borderRadius: 6, border: `1px solid ${T.line}` }}
    >
      <div className="h-36 relative mb-2" style={{ ...heroStyle(ev.imageUrl || fallbackImageUrl, ev.id || ev.title), borderRadius: 4 }}>
        <div className="absolute top-3 left-3 flex gap-2">
          {ev.type && <Tag>{ev.type}</Tag>}
          {isToday && <Tag tone="live">TODAY</Tag>}
        </div>
      </div>
      <div className="text-[11px] font-medium" style={{ ...body, color: T.ashFaint }}>{ev.fieldName}</div>
      <div className="text-[16px] font-semibold" style={{ ...display, color: T.ash }}>{ev.title}</div>
      <div className="text-[12px]" style={{ ...mono, color: T.ashDim }}>{formatDate(ev.date, ev.endDate)}{ev.startTime ? ` · ${ev.startTime}` : ""}</div>
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
        {ev.price && (
          <div className="text-[13px] font-semibold" style={{ ...mono, color: T.accent }}>{displayPrice(ev.price)}</div>
        )}
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
const fieldPinIcon = makePinIcon(T.alert);

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
  const pins = fields.filter((f) => typeof f.lat === "number" && typeof f.lng === "number");
  const center = pins.length
    ? [pins[0].lat, pins[0].lng]
    : userLocation
    ? [userLocation.lat, userLocation.lng] // no pins for this filter, but at least center on where the player actually is
    : [43.3, -84.5]; // last resort only — no pins and no known location

  if (pins.length === 0) {
    return (
      <div className="mx-6 mb-4 h-72 flex items-center justify-center" style={{ background: T.panel, border: `1px solid ${T.line}`, borderRadius: 6 }}>
        <p className="text-[12px] text-center px-6" style={{ ...body, color: T.ashFaint }}>
          None of the fields matching your current filter have map coordinates yet.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-6 mb-4 h-72 overflow-hidden" style={{ borderRadius: 6, border: `1px solid ${T.line}` }}>
      <MapContainer center={center} zoom={9} style={{ width: "100%", height: "100%", background: T.void }} zoomControl={false}>
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/attributions">CARTO</a> &copy; OpenStreetMap contributors'
        />
        <FitToPins points={pins} />
        {pins.map((f) => (
          <Marker key={f.id} position={[f.lat, f.lng]} icon={fieldPinIcon} eventHandlers={{ click: () => onOpenField(f) }}>
            <Popup>
              <div style={{ ...body, fontSize: 12, fontWeight: 600 }}>{f.name}</div>
              <div style={{ ...body, fontSize: 11, color: "#666" }}>{f.city}</div>
            </Popup>
          </Marker>
        ))}
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
  const hasRealAmenities = Array.isArray(field?.amenities) && field.amenities.length > 0;
  const hasRealRules = Array.isArray(field?.rules) && field.rules.length > 0;
  const hasRealChrono = !!field?.chrono;

  const demoAmenities = ["Pro Shop", "HPA Fill Station", "Rentals Available", "Food & Drinks", "Restrooms"];
  const demoRules = [
    "Full-seal eye protection required at all times on the field.",
    "Barrel bags/plugs required in all staging areas.",
    "Blind fire and physical contact are not permitted.",
    "Minimum engagement distances enforced per game mode.",
  ];

  return (
    <>
      <div className="p-4" style={{ background: T.panel, borderRadius: 6, border: `1px solid ${T.line}` }}>
        <div className="flex items-center justify-between mb-2">
          <Eyebrow>Amenities</Eyebrow>
          {!hasRealAmenities && (
            <span className="text-[9px] font-semibold px-1.5 py-0.5" style={{ ...mono, color: T.ashFaint, border: `1px solid ${T.line}`, borderRadius: 2 }}>DEMO DATA</span>
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

      <div className="p-4" style={{ background: T.panel, borderRadius: 6, border: `1px solid ${T.line}` }}>
        <div className="flex items-center justify-between mb-2">
          <Eyebrow>Field Rules</Eyebrow>
          {!hasRealRules && (
            <span className="text-[9px] font-semibold px-1.5 py-0.5" style={{ ...mono, color: T.ashFaint, border: `1px solid ${T.line}`, borderRadius: 2 }}>DEMO DATA</span>
          )}
        </div>
        <ul className="text-[12px] leading-relaxed pl-4" style={{ ...body, color: T.ashDim, listStyle: "disc" }}>
          {(hasRealRules ? field.rules : demoRules).map((r) => <li key={r}>{r}</li>)}
        </ul>
      </div>

      <div className="p-4" style={{ background: T.panel, borderRadius: 6, border: `1px solid ${T.line}` }}>
        <div className="flex items-center justify-between mb-2">
          <Eyebrow>Chrono Limits</Eyebrow>
          {!hasRealChrono && (
            <span className="text-[9px] font-semibold px-1.5 py-0.5" style={{ ...mono, color: T.ashFaint, border: `1px solid ${T.line}`, borderRadius: 2 }}>DEMO DATA</span>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3 text-[12px]" style={{ ...body, color: T.ashDim }}>
          <div>
            <div style={{ color: T.ashFaint }}>AEG</div>
            <div style={{ ...mono, color: T.ash }}>{hasRealChrono ? field.chrono.aeg : "400 FPS max (0.20g)"}</div>
          </div>
          <div>
            <div style={{ color: T.ashFaint }}>Sniper</div>
            <div style={{ ...mono, color: T.ash }}>{hasRealChrono ? field.chrono.sniper : "500 FPS max (0.20g)"}</div>
          </div>
          {hasRealChrono && field.chrono.dmr && (
            <div className="col-span-2">
              <div style={{ color: T.ashFaint }}>DMR</div>
              <div style={{ ...mono, color: T.ash }}>{field.chrono.dmr}</div>
            </div>
          )}
        </div>
      </div>

      {Array.isArray(field?.rentals) && field.rentals.length > 0 && (
        <div className="p-4" style={{ background: T.panel, borderRadius: 6, border: `1px solid ${T.line}` }}>
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
            Shown for reference — selecting and paying for rentals happens at checkout, once booking is available.
          </p>
        </div>
      )}
    </>
  );
}

function LocationCard({ label, name, address, lat, lng, phone }) {
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
      style={{ background: T.panel, borderRadius: 6, border: `1px solid ${T.line}` }}
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
            <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" attribution="" />
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

function HomeScreen({ onOpenEvent, onNavigate, events, eventsLoading, fields, profile, onOpenField, favorites, user }) {
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState("Featured");
  const [viewMode, setViewMode] = useState("list");
  const [activeTodayOnly, setActiveTodayOnly] = useState(false);
  const [nearbyOnly, setNearbyOnly] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState("idle"); // idle | loading | error

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
  const [selectedState, setSelectedState] = useState(null);
  const [stateDetectAttempted, setStateDetectAttempted] = useState(false);

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

  // The player's real next game: their soonest favorited event that hasn't
  // ended yet. There's no booking/RSVP system yet — favorites are the only
  // honest "games I'm going to" signal that actually exists right now.
  const savedEventIds = favorites.filter((f) => f.type === "event").map((f) => f.refId);
  const nextGame = events
    .filter((e) => savedEventIds.includes(e.id) && (e.endDate || e.date) >= today)
    .sort((a, b) => a.date.localeCompare(b.date))[0] || null;
  const nextGameIsToday = nextGame ? isLiveToday(nextGame) : false;

  const [showCheckIn, setShowCheckIn] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const handleCheckIn = async () => {
    if (!nextGame || !user) return;
    // Minimal payload by design — just enough for a future field-owner
    // scanner to look up the event and player in Firestore. No callsign,
    // email, or other personal info gets embedded in a scannable code.
    const payload = `atlas:checkin:${nextGame.id}:${user.uid}`;
    const dataUrl = await QRCode.toDataURL(payload, {
      width: 240,
      margin: 1,
      color: { dark: T.ash, light: "#FFFFFF" }, // standard dark-on-white — most reliably scannable, and correct for the light theme (this was inverted, a leftover from before the palette flip)
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

  // Advanced filters (behind the sliders icon)
  const [showFilters, setShowFilters] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [maxPrice, setMaxPrice] = useState(null); // null = no cap
  const [radiusMiles, setRadiusMiles] = useState(NEARBY_RADIUS_MILES);
  const [sortBy, setSortBy] = useState("date"); // "date" | "price" | "distance"
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
      if (f.status === "relocated") return false;
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
      if (selectedState && stateNameFromCity(f.city) !== selectedState) return false;
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
      style={flatBg}
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
        <div className="mx-6 p-4 mb-4" style={{ background: T.panel, border: `1px solid ${T.line}`, borderRadius: 6 }}>
          <div className="flex items-center justify-between mb-3">
            <Tag tone="live">UPCOMING GAME</Tag>
            {nextGameIsToday && (
              <span className="text-[11px] font-medium flex items-center gap-1" style={{ ...body, color: T.good }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: T.good, display: "inline-block" }} /> Check-in available
              </span>
            )}
          </div>
          <div className="font-semibold text-[17px]" style={{ ...display, color: T.ash }}>{nextGame.title}</div>
          <div className="text-[12px] mb-4" style={{ ...body, color: T.ashDim }}>
            {nextGame.fieldName} — {formatDate(nextGame.date, nextGame.endDate)}{nextGame.startTime ? ` · ${nextGame.startTime}` : ""}
          </div>

          {nextGameIsToday ? (
            showCheckIn ? (
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
                  style={{ ...display, background: T.ash, color: "#FFFFFF", borderRadius: 4 }}
                >
                  Check In Now
                </button>
              </div>
            )
          ) : (
            <button
              onClick={() => onOpenEvent(nextGame)}
              className="w-full py-2.5 text-[12px] font-semibold"
              style={{ ...body, border: `1px solid ${T.line}`, color: T.ash, borderRadius: 4 }}
            >
              View Details
            </button>
          )}
        </div>
      ) : (
        <div className="mx-6 p-4 mb-4" style={{ background: T.panel, border: `1px solid ${T.line}`, borderRadius: 6 }}>
          <div className="text-[13px] font-semibold mb-1" style={{ ...display, color: T.ash }}>No upcoming games saved</div>
          <p className="text-[12px]" style={{ ...body, color: T.ashDim }}>
            Tap the heart on any event's page and it'll show up here as your next game.
          </p>
        </div>
      )}

      <div className="mx-6 mb-4 flex items-center gap-2 px-3 py-3" style={{ border: `1px solid ${T.line}`, background: T.panel, borderRadius: 4 }}>
        <Search size={16} color={T.ashFaint} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Where would you like to pew?"
          className="flex-1 text-[13px] bg-transparent outline-none"
          style={{ ...body, color: T.ash }}
        />
        <button onClick={() => setShowFilters(!showFilters)} className="relative">
          <SlidersHorizontal size={16} color={advancedFiltersActive ? T.accent : T.ashDim} />
          {advancedFiltersActive && (
            <span style={{ position: "absolute", top: -3, right: -3, width: 6, height: 6, borderRadius: "50%", background: T.accent }} />
          )}
        </button>
      </div>

      {showFilters && (
        <div className="mx-6 mb-4 p-4 flex flex-col gap-4 overflow-hidden" style={{ background: T.panel, border: `1px solid ${T.line}`, borderRadius: 6 }}>
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
                  style={{ ...body, background: T.panelAlt, border: `1px solid ${T.line}`, borderRadius: 4, color: T.ash, colorScheme: "light", boxSizing: "border-box", minWidth: 0, maxWidth: "100%", display: "block" }}
                />
              </div>
              <div>
                <label className="text-[10px] block mb-1" style={{ ...body, color: T.ashFaint }}>End Date</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full px-3 py-2 text-[13px] bg-transparent outline-none"
                  style={{ ...body, background: T.panelAlt, border: `1px solid ${T.line}`, borderRadius: 4, color: T.ash, colorScheme: "light", boxSizing: "border-box", minWidth: 0, maxWidth: "100%", display: "block" }}
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
                    color: maxPrice === opt.value ? "#fff" : T.ashDim,
                    borderRadius: 4,
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
                    color: opt.disabled ? T.ashFaint : sortBy === opt.key ? "#fff" : T.ashDim,
                    borderRadius: 4,
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
              style={{ ...body, border: `1px solid ${T.line}`, color: T.ash, borderRadius: 4 }}
            >
              Close
            </button>
            <button
              onClick={() => setShowFilters(false)}
              className="flex-1 py-2.5 text-[13px] font-semibold"
              style={{ ...display, background: T.ash, color: "#FFFFFF", borderRadius: 4 }}
            >
              Run Search
            </button>
          </div>
        </div>
      )}

      <div className="mx-6 mb-2 flex items-center gap-2">
        <button
          onClick={() => setActiveTodayOnly(!activeTodayOnly)}
          className="px-3 py-1.5 text-[12px] font-medium"
          style={{
            ...body,
            border: `1px solid ${activeTodayOnly ? T.alert : T.line}`,
            background: activeTodayOnly ? T.alert : "transparent",
            color: activeTodayOnly ? "#fff" : T.ashDim,
            borderRadius: 4,
          }}
        >
          Active Today
        </button>
        <div className="flex-1" />
        <div className="flex" style={{ border: `1px solid ${T.line}`, borderRadius: 4, overflow: "hidden" }}>
          <button
            onClick={() => setViewMode("list")}
            className="px-3 py-1.5 text-[12px] font-semibold transition-transform duration-100 active:scale-95"
            style={{ ...body, background: viewMode === "list" ? T.ash : "transparent", color: viewMode === "list" ? "#FFFFFF" : T.ashDim }}
          >
            Events
          </button>
          <button
            onClick={() => setViewMode("fields")}
            className="px-3 py-1.5 text-[12px] font-medium transition-transform duration-100 active:scale-95"
            style={{ ...body, background: viewMode === "fields" ? T.ash : "transparent", color: viewMode === "fields" ? "#FFFFFF" : T.ashDim }}
          >
            Fields
          </button>
          <button
            onClick={() => setViewMode("map")}
            className="px-3 py-1.5 text-[12px] font-medium transition-transform duration-100 active:scale-95"
            style={{ ...body, background: viewMode === "map" ? T.ash : "transparent", color: viewMode === "map" ? "#FFFFFF" : T.ashDim }}
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

      <div className="flex gap-3 px-6 mb-5 overflow-x-auto">
        {cats.map((cat) => {
          const Icon = cat.icon;
          const active = activeCat === cat.key;
          return (
            <button key={cat.key} onClick={() => setActiveCat(cat.key)} className="flex flex-col items-center gap-1.5 transition-transform duration-100 active:scale-90">
              <div
                className="w-14 h-14 flex items-center justify-center"
                style={{ background: active ? T.ash : T.panel, border: `1px solid ${T.line}`, borderRadius: 4 }}
              >
                <Icon size={19} color={active ? "#FFFFFF" : T.ashDim} strokeWidth={1.7} />
              </div>
              <span className="text-[11px] font-medium" style={{ ...body, color: active ? T.ash : T.ashDim }}>{cat.key}</span>
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
                  style={{ background: T.panel, borderRadius: 6, border: `1px solid ${T.line}` }}
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

function EventDetailScreen({ ev, field, onBack, onOpenField, favorited, onToggleFavorite, user, profile, signature, signWaiver }) {
  const statusLabel = field ? STATUS_LABEL[field.status] : null;
  const isPast = (ev.endDate || ev.date) < localDateStr();

  const [showWaiver, setShowWaiver] = useState(false);
  const [scrolledToEnd, setScrolledToEnd] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [signing, setSigning] = useState(false);
  const [signError, setSignError] = useState("");

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
    } catch (err) {
      setSignError("Couldn't save your signature — try again.");
    } finally {
      setSigning(false);
    }
  };

  return (
    <div className="h-full flex flex-col" style={flatBg}>
      <div className="flex-1 overflow-y-auto pb-24">
        <div className="h-60 relative" style={heroStyle(ev.imageUrl || field?.imageUrl, ev.id || ev.title)}>
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-5 pt-3">
            <button onClick={onBack} className="w-9 h-9 flex items-center justify-center" style={{ background: "rgba(255,255,255,0.85)", borderRadius: 4 }}>
              <ChevronLeft color={T.ash} size={19} />
            </button>
            <button onClick={onToggleFavorite} className="w-9 h-9 flex items-center justify-center transition-transform duration-100 active:scale-90" style={{ background: "rgba(255,255,255,0.85)", borderRadius: 4 }}>
              <Heart size={17} color={favorited ? T.alert : T.ash} fill={favorited ? T.alert : "none"} />
            </button>
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
          {statusLabel && field?.notes && (
            <div className="p-4" style={{ background: "rgba(240,85,74,0.1)", border: `1px solid ${T.alert}`, borderRadius: 6 }}>
              <div className="text-[12px] font-semibold mb-1" style={{ ...display, color: T.alert }}>{statusLabel}</div>
              <p className="text-[12px] leading-relaxed" style={{ ...body, color: T.ashDim }}>{field.notes}</p>
            </div>
          )}

          <div className="p-4 flex flex-col gap-3" style={{ background: T.panel, borderRadius: 6, border: `1px solid ${T.line}` }}>
            <div className="flex gap-3 items-start">
              <Calendar size={17} color={T.ashDim} className="mt-0.5" />
              <div>
                <div className="text-[14px] font-medium" style={{ ...body, color: T.ash }}>{formatDate(ev.date, ev.endDate)}</div>
                {(ev.startTime || ev.endTime) && (
                  <div className="text-[12px]" style={{ ...mono, color: T.ashDim }}>
                    {ev.startTime}{ev.endTime ? ` – ${ev.endTime}` : ""}
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
                <div className="flex gap-3 items-center">
                  <Heart size={17} color={T.ashDim} />
                  <div className="text-[14px] font-medium" style={{ ...body, color: T.ash }}>
                    {ev.interestCount} {ev.interestCount === 1 ? "player" : "players"} interested
                  </div>
                </div>
              </>
            )}
          </div>

          <LocationCard
            label="Event Location"
            name={ev.venueName || field?.name}
            address={ev.address || field?.address}
            lat={typeof ev.lat === "number" ? ev.lat : field?.lat}
            lng={typeof ev.lng === "number" ? ev.lng : field?.lng}
          />

          {ev.waiver && (
            signature ? (
              <div className="p-4 flex items-center gap-3" style={{ background: "rgba(52,211,153,0.08)", border: `1px solid ${T.good}`, borderRadius: 6 }}>
                <Check size={18} color={T.good} />
                <div>
                  <div className="text-[13px] font-semibold" style={{ ...display, color: T.ash }}>Waiver signed</div>
                  <div className="text-[11px]" style={{ ...body, color: T.ashFaint }}>Signed as {signature.signedName}</div>
                </div>
              </div>
            ) : isPast ? null : !showWaiver ? (
              <button
                onClick={() => setShowWaiver(true)}
                className="p-4 flex items-center justify-between w-full transition-transform duration-100 active:scale-[0.98]"
                style={{ background: T.panel, borderRadius: 6, border: `1px solid ${T.alert}` }}
              >
                <div className="flex items-center gap-3">
                  <FileSignature size={18} color={T.alert} />
                  <div className="text-left">
                    <div className="text-[13px] font-semibold" style={{ ...display, color: T.ash }}>Waiver required</div>
                    <div className="text-[11px]" style={{ ...body, color: T.ashFaint }}>Read and sign before this event</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {ev.waiver.isDemo !== false && (
                    <span className="text-[9px] font-semibold px-1.5 py-0.5" style={{ ...mono, color: T.ashFaint, border: `1px solid ${T.line}`, borderRadius: 2 }}>DEMO DATA</span>
                  )}
                  <ChevronRight size={16} color={T.ashFaint} />
                </div>
              </button>
            ) : (
              <div className="p-4" style={{ background: T.panel, borderRadius: 6, border: `1px solid ${T.line}` }}>
                <div className="flex items-center justify-between mb-2">
                  <Eyebrow>{field?.name || ev.fieldName} Waiver</Eyebrow>
                  {ev.waiver.isDemo !== false && (
                    <span className="text-[9px] font-semibold px-1.5 py-0.5" style={{ ...mono, color: T.ashFaint, border: `1px solid ${T.line}`, borderRadius: 2 }}>DEMO DATA</span>
                  )}
                </div>
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
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowWaiver(false)}
                        className="flex-1 py-2.5 text-[12px] font-medium"
                        style={{ ...body, border: `1px solid ${T.line}`, color: T.ashDim, borderRadius: 4 }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSign}
                        disabled={!agreed || !legalName.trim() || signing}
                        className="flex-1 py-2.5 text-[12px] font-semibold"
                        style={{ ...display, background: T.ash, color: "#FFFFFF", borderRadius: 4, opacity: !agreed || !legalName.trim() || signing ? 0.5 : 1 }}
                      >
                        {signing ? "Signing…" : "Sign Waiver"}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )
          )}

          {ev.description && (
            <div className="p-4" style={{ background: T.panel, borderRadius: 6, border: `1px solid ${T.line}` }}>
              <Eyebrow>Event Details</Eyebrow>
              <p className="text-[13px] leading-relaxed" style={{ ...body, color: T.ashDim }}>{ev.description}</p>
            </div>
          )}

          {field?.about && (
            <div className="p-4" style={{ background: T.panel, borderRadius: 6, border: `1px solid ${T.line}` }}>
              <Eyebrow>About {field.name}</Eyebrow>
              <p className="text-[13px] leading-relaxed" style={{ ...body, color: T.ashDim }}>{field.about}</p>
            </div>
          )}

          {/* DEMO/PLACEHOLDER DATA — not scraped or owner-provided yet.
              Kept here for showcase purposes per explicit request; swap for
              real field-owner-entered data once that flow exists. */}
          <FieldFacts field={field} />

          <a
            href={ev.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="p-4 flex items-center justify-between"
            style={{ background: T.panel, borderRadius: 6, border: `1px solid ${T.line}` }}
          >
            <span className="text-[13px] font-medium" style={{ ...body, color: T.ash }}>View original listing</span>
            <ArrowRight size={16} color={T.ashDim} />
          </a>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 border-t px-5 py-3 flex items-center justify-between" style={{ background: T.panel, borderColor: T.line, zIndex: 1000 }}>
        <div>
          <div className="text-[10px]" style={{ ...body, color: T.ashFaint }}>Entry Cost</div>
          <div className="text-[18px] font-semibold" style={{ ...mono, color: T.ash }}>
            {ev.price || field?.admission || "See listing"}
          </div>
        </div>
        {isPast ? (
          <span className="px-6 py-3 font-semibold text-[13px]" style={{ ...display, color: T.ashFaint, border: `1px solid ${T.line}`, borderRadius: 4 }}>
            Event Ended
          </span>
        ) : (
          <a
            href={ev.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="px-6 py-3 font-semibold text-[13px] inline-block transition-transform duration-100 active:scale-95"
            style={{ ...display, background: T.ash, color: "#FFFFFF", borderRadius: 4 }}
          >
            Book / RSVP
          </a>
        )}
      </div>
    </div>
  );
}

function FieldDetailScreen({ field, fieldEvents, pastFieldEvents, relocatedField, onBack, onNavigate, onOpenEvent, onOpenField, favorited, onToggleFavorite }) {
  const [showPastEvents, setShowPastEvents] = useState(false);
  if (!field) {
    return (
      <div className="h-full flex flex-col items-center justify-center" style={flatBg}>
        <p className="text-[13px]" style={{ ...body, color: T.ashDim }}>Field not found.</p>
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
    <div className="h-full flex flex-col" style={flatBg}>
      <div className="flex-1 overflow-y-auto pb-24">
        <div className="h-60 relative" style={heroStyle(field.imageUrl, field.id)}>
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-5 pt-3">
            <button onClick={onBack} className="w-9 h-9 flex items-center justify-center" style={{ background: "rgba(255,255,255,0.85)", borderRadius: 4 }}>
              <ChevronLeft color={T.ash} size={19} />
            </button>
            <button onClick={onToggleFavorite} className="w-9 h-9 flex items-center justify-center transition-transform duration-100 active:scale-90" style={{ background: "rgba(255,255,255,0.85)", borderRadius: 4 }}>
              <Heart size={17} color={favorited ? T.alert : T.ash} fill={favorited ? T.alert : "none"} />
            </button>
          </div>
          <div className="absolute bottom-4 left-5 right-5">
            <div className="flex gap-2 mb-2">
              {field.indoorOutdoor && <Tag>{field.indoorOutdoor.toUpperCase()}</Tag>}
              {statusLabel && <Tag tone="live">{statusLabel}</Tag>}
              {!statusLabel && field.status === "active" && <Tag tone="good">ACTIVE</Tag>}
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
                  style={{ background: T.panelAlt, borderRadius: 4 }}
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
            <div className="p-4 flex items-center gap-3" style={{ background: T.panel, borderRadius: 6, border: `1px solid ${T.line}` }}>
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
            <div className="p-4" style={{ background: T.panel, borderRadius: 6, border: `1px solid ${T.line}` }}>
              <Eyebrow>About the Field</Eyebrow>
              <p className="text-[13px] leading-relaxed" style={{ ...body, color: T.ashDim }}>{field.about}</p>
            </div>
          )}

          <FieldFacts field={field} />

          {field.hours && (
            <div className="p-4" style={{ background: T.panel, borderRadius: 6, border: `1px solid ${T.line}` }}>
              <div className="flex justify-between text-[13px] gap-4">
                <span style={{ ...body, color: T.ashFaint }}>Hours</span>
                <span className="text-right" style={{ ...mono, color: T.ash }}>{field.hours}</span>
              </div>
            </div>
          )}

          <div className="p-4" style={{ background: T.panel, borderRadius: 6, border: `1px solid ${T.line}` }}>
            <Eyebrow>Scheduled Events</Eyebrow>
            {fieldEvents.length === 0 ? (
              <p className="text-[12px]" style={{ ...body, color: T.ashFaint }}>No upcoming events loaded for this field yet.</p>
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
                    {s.price && <div className="text-[13px] font-semibold" style={{ ...mono, color: T.accent }}>{displayPrice(s.price)}</div>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {pastFieldEvents.length > 0 && (
            <div style={{ background: T.panel, borderRadius: 6, border: `1px solid ${T.line}`, overflow: "hidden" }}>
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

          <LocationCard label="Field Location" address={field.address} lat={field.lat} lng={field.lng} />

          {field.phone && (
            <a
              href={`tel:${field.phone.replace(/[^\d+]/g, "")}`}
              className="p-4 flex items-center justify-between"
              style={{ background: T.panel, borderRadius: 6, border: `1px solid ${T.line}` }}
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
                  style={{ ...body, border: `1px solid ${T.line}`, color: T.ash, borderRadius: 4 }}
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

function FavoritesScreen({ onNavigate, favorites, favoritesLoading, fields, events, onOpenField, onOpenEvent }) {
  const today = localDateStr();

  const savedFieldIds = favorites.filter((f) => f.type === "field").map((f) => f.refId);
  const savedFields = fields.filter((f) => savedFieldIds.includes(f.id));

  const savedEventIds = favorites.filter((f) => f.type === "event").map((f) => f.refId);
  const savedEvents = events
    .filter((e) => savedEventIds.includes(e.id) && (e.endDate || e.date) >= today)
    .sort((a, b) => a.date.localeCompare(b.date));
  const pastEvents = events
    .filter((e) => savedEventIds.includes(e.id) && (e.endDate || e.date) < today)
    .sort((a, b) => b.date.localeCompare(a.date)); // most recently attended first

  return (
    <div className="h-full overflow-y-auto pb-24" style={flatBg}>
      <ScreenHeader title="Favorites" />
      <div className="px-6 pt-5">
        {favoritesLoading ? (
          <div className="text-[13px] py-6 text-center" style={{ ...body, color: T.ashFaint }}>Loading favorites…</div>
        ) : (
          <>
            <Eyebrow>Saved Fields</Eyebrow>
            {savedFields.length === 0 ? (
              <p className="text-[13px] mb-6" style={{ ...body, color: T.ashFaint }}>
                No fields saved yet — tap the heart on any field's page to save it here.
              </p>
            ) : (
              <div className="flex flex-col gap-3 mb-6">
                {savedFields.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => onOpenField(f)}
                    className="p-3 flex items-center gap-3 text-left"
                    style={{ background: T.panel, borderRadius: 6, border: `1px solid ${T.line}` }}
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

            <Eyebrow>Saved Events</Eyebrow>
            {savedEvents.length === 0 ? (
              <p className="text-[13px] mb-6" style={{ ...body, color: T.ashFaint }}>
                No upcoming saved events — tap the heart on any event's page to save it here. Past events drop off automatically.
              </p>
            ) : (
              <div className="flex flex-col gap-3 mb-6">
                {savedEvents.map((ev) => (
                  <button
                    key={ev.id}
                    onClick={() => onOpenEvent(ev)}
                    className="p-3 flex items-center gap-3 text-left"
                    style={{ background: T.panel, borderRadius: 6, border: `1px solid ${T.line}` }}
                  >
                    <div className="w-14 h-14" style={{ ...heroStyle(ev.imageUrl, ev.id || ev.title), borderRadius: 4 }} />
                    <div className="flex-1">
                      <div className="text-[14px] font-semibold" style={{ ...display, color: T.ash }}>{ev.title}</div>
                      <div className="text-[12px]" style={{ ...body, color: T.ashFaint }}>{ev.fieldName}</div>
                      <div className="text-[11px] font-medium" style={{ ...mono, color: T.accent }}>{formatDate(ev.date, ev.endDate)}</div>
                    </div>
                    <ChevronRight size={16} color={T.ashFaint} />
                  </button>
                ))}
              </div>
            )}

            <Eyebrow>Past Events</Eyebrow>
            {pastEvents.length === 0 ? (
              <p className="text-[13px]" style={{ ...body, color: T.ashFaint }}>
                Events you've favorited will move here once they're over — right now this just tracks what you were interested in, not confirmed attendance. That'll change once booking is built.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {pastEvents.map((ev) => (
                  <button
                    key={ev.id}
                    onClick={() => onOpenEvent(ev)}
                    className="p-3 flex items-center gap-3 text-left"
                    style={{ background: T.panel, borderRadius: 6, border: `1px solid ${T.line}`, opacity: 0.65 }}
                  >
                    <div className="w-14 h-14" style={{ ...heroStyle(ev.imageUrl, ev.id || ev.title), borderRadius: 4 }} />
                    <div className="flex-1">
                      <div className="text-[14px] font-semibold" style={{ ...display, color: T.ash }}>{ev.title}</div>
                      <div className="text-[12px]" style={{ ...body, color: T.ashFaint }}>{ev.fieldName}</div>
                      <div className="text-[11px] font-medium" style={{ ...mono, color: T.ashFaint }}>{formatDate(ev.date, ev.endDate)}</div>
                    </div>
                    <Tag tone="good">PAST</Tag>
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

function ScheduleScreen({ onNavigate, favorites, events, onOpenEvent }) {
  const today = localDateStr();
  const savedEventIds = favorites.filter((f) => f.type === "event").map((f) => f.refId);

  const upcoming = events
    .filter((e) => savedEventIds.includes(e.id) && (e.endDate || e.date) >= today)
    .sort((a, b) => a.date.localeCompare(b.date));
  const past = events
    .filter((e) => savedEventIds.includes(e.id) && (e.endDate || e.date) < today)
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="h-full overflow-y-auto pb-24" style={flatBg}>
      <ScreenHeader title="Schedule" />

      {upcoming.length === 0 ? (
        <div className="px-6 pt-3">
          <div className="p-6 flex flex-col items-center text-center mb-6" style={{ background: T.panel, borderRadius: 6, border: `1px solid ${T.line}` }}>
            <div className="w-14 h-14 flex items-center justify-center mb-3" style={{ background: T.panelAlt, borderRadius: 4 }}>
              <Calendar size={22} color={T.ashDim} strokeWidth={1.7} />
            </div>
            <div className="text-[16px] font-semibold mb-1" style={{ ...display, color: T.ash }}>Nothing scheduled yet</div>
            <p className="text-[13px] mb-4" style={{ ...body, color: T.ashDim }}>
              Save an event's heart on its detail page and it'll show up here.
            </p>
            <button
              onClick={() => onNavigate("home")}
              className="w-full py-3 font-semibold text-[13px]"
              style={{ ...display, background: T.ash, color: "#FFFFFF", borderRadius: 4 }}
            >
              Start your search
            </button>
          </div>
        </div>
      ) : (
        <div className="px-6 pt-4">
          <Eyebrow>Upcoming</Eyebrow>
          <div className="flex flex-col gap-3 mb-6">
            {upcoming.map((ev) => (
              <button
                key={ev.id}
                onClick={() => onOpenEvent(ev)}
                className="p-3 flex items-center gap-3 text-left w-full"
                style={{ background: T.panel, borderRadius: 6, border: `1px solid ${T.line}` }}
              >
                <div className="w-12 h-12" style={{ ...heroStyle(ev.imageUrl, ev.id || ev.title), borderRadius: 4 }} />
                <div className="flex-1">
                  <div className="text-[13px] font-medium" style={{ ...body, color: T.ash }}>{ev.title}</div>
                  <div className="text-[11px]" style={{ ...body, color: T.ashFaint }}>{ev.fieldName}</div>
                  <div className="text-[11px] font-medium" style={{ ...mono, color: T.accent }}>{formatDate(ev.date, ev.endDate)}</div>
                </div>
                <ChevronRight size={16} color={T.ashFaint} />
              </button>
            ))}
          </div>
        </div>
      )}

      {past.length > 0 && (
        <div className="px-6">
          <Eyebrow>Past</Eyebrow>
          <div className="flex flex-col gap-3">
            {past.map((ev) => (
              <button
                key={ev.id}
                onClick={() => onOpenEvent(ev)}
                className="p-3 flex items-center gap-3 text-left w-full"
                style={{ background: T.panel, borderRadius: 6, border: `1px solid ${T.line}`, opacity: 0.65 }}
              >
                <div className="w-12 h-12" style={{ ...heroStyle(ev.imageUrl, ev.id || ev.title), borderRadius: 4 }} />
                <div className="flex-1">
                  <div className="text-[13px] font-medium" style={{ ...body, color: T.ash }}>{ev.title}</div>
                  <div className="text-[11px]" style={{ ...body, color: T.ashFaint }}>{ev.fieldName}</div>
                  <div className="text-[11px] font-medium" style={{ ...mono, color: T.ashFaint }}>{formatDate(ev.date, ev.endDate)}</div>
                </div>
                <Tag tone="good">PAST</Tag>
              </button>
            ))}
          </div>
        </div>
      )}
      <BottomNav active="schedule" onNavigate={onNavigate} />
    </div>
  );
}

function SocialScreen({ onNavigate, onOpenTeam, profile, user, teams, teamsLoading, createTeam }) {
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
    <div className="h-full overflow-y-auto pb-24" style={flatBg}>
      <ScreenHeader title="Social" />
      <div className="px-6 pt-4">
        {myTeam && (
          <>
            <Eyebrow>My Team</Eyebrow>
            <button
              onClick={() => onOpenTeam(myTeam.id)}
              className="w-full mb-5 p-3 flex items-center gap-3 text-left transition-transform duration-100 active:scale-[0.98]"
              style={{ background: T.panel, borderRadius: 6, border: `1.5px solid ${T.accent}` }}
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
          <div className="mb-4 p-4" style={{ background: T.panel, borderRadius: 6, border: `1px solid ${T.line}` }}>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelected} className="hidden" />
            <div className="flex items-center gap-3 mb-3">
              <button onClick={handlePick} className="w-14 h-14 flex-shrink-0 flex items-center justify-center" style={{ background: T.panelAlt, borderRadius: 4 }}>
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
              style={{ ...display, background: T.ash, color: "#FFFFFF", borderRadius: 4, opacity: !teamName.trim() || creating ? 0.5 : 1 }}
            >
              {creating ? "Creating…" : "Create Team"}
            </button>
          </div>
        )}

        <div className="mb-4 flex items-center gap-2 px-3 py-2.5" style={{ border: `1px solid ${T.line}`, background: T.panel, borderRadius: 4 }}>
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
              style={{ background: T.panel, borderRadius: 6, border: `1px solid ${T.line}` }}
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
      <BottomNav active="inbox" onNavigate={onNavigate} />
    </div>
  );
}

function TeamScreen({ team, members, teamLoading, profile, user, onBack, onNavigate,
  joinTeam, leaveTeam, updateTeamInfo, updateTeamPatch, setMemberRole, removeMember }) {
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState("");
  const fileInputRef = useRef(null);
  const [patchUploading, setPatchUploading] = useState(false);

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

  if (teamLoading) {
    return (
      <div className="h-full flex items-center justify-center" style={flatBg}>
        <p className="text-[13px]" style={{ ...body, color: T.ashDim }}>Loading…</p>
      </div>
    );
  }
  if (!team) {
    return (
      <div className="h-full flex flex-col items-center justify-center" style={flatBg}>
        <p className="text-[13px]" style={{ ...body, color: T.ashDim }}>Team not found.</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto pb-6" style={flatBg}>
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
            <div className="absolute -bottom-1 -right-1 w-7 h-7 flex items-center justify-center" style={{ background: T.ash, borderRadius: 14, border: `2px solid ${T.void}` }}>
              {patchUploading ? <span className="text-[9px]" style={{ ...mono, color: "#FFFFFF" }}>…</span> : <Camera size={13} color="#FFFFFF" strokeWidth={2.5} />}
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
              <button onClick={() => setEditing(false)} className="flex-1 py-2 text-[12px] font-medium" style={{ ...body, border: `1px solid ${T.line}`, color: T.ashDim, borderRadius: 4 }}>
                Cancel
              </button>
              <button
                onClick={handleSaveInfo}
                disabled={saving}
                className="flex-1 py-2 text-[12px] font-semibold"
                style={{ ...display, background: T.ash, color: "#FFFFFF", borderRadius: 4, opacity: saving ? 0.6 : 1 }}
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
            style={{ ...display, background: T.ash, color: "#FFFFFF", borderRadius: 4 }}
          >
            Join Team
          </button>
        )}
        {alreadyOnAnotherTeam && (
          <p className="text-[12px] text-center mb-5" style={{ ...body, color: T.ashFaint }}>
            You're already on {profile.teamName} — leave that team first to join this one.
          </p>
        )}

        <Eyebrow>Roster ({members.length})</Eyebrow>
        <div className="flex flex-col gap-2 mb-5">
          {members.map((m) => (
            <div key={m.uid} className="p-3 flex items-center gap-3" style={{ background: T.panel, borderRadius: 6, border: `1px solid ${T.line}` }}>
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
              {m.role === "officer" && <Tag tone="accent">OFFICER</Tag>}
              {isOfficer && m.uid !== user?.uid && (
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setMemberRole(team.id, m.uid, m.role === "officer" ? "member" : "officer")}
                    className="px-2 py-1 text-[10px] font-semibold"
                    style={{ ...body, border: `1px solid ${T.line}`, color: T.ashDim, borderRadius: 4 }}
                  >
                    {m.role === "officer" ? "Demote" : "Promote"}
                  </button>
                  <button
                    onClick={() => removeMember(team.id, m.uid)}
                    className="px-2 py-1 text-[10px] font-semibold"
                    style={{ ...body, border: `1px solid ${T.alert}`, color: T.alert, borderRadius: 4 }}
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {isMember && (
          <button
            onClick={handleLeave}
            className="w-full py-3 font-medium text-[14px] mb-4"
            style={{ ...body, border: `1px solid ${T.line}`, color: T.alert, borderRadius: 4 }}
          >
            Leave Team
          </button>
        )}
      </div>
    </div>
  );
}

function ProfileRow({ label, value, static: isStatic }) {
  return (
    <div className="w-full flex items-center justify-between py-3.5">
      <span className="text-[14px] font-medium" style={{ ...body, color: T.ash }}>{label}</span>
      <div className="flex items-center gap-2">
        {value && <span className="text-[12px]" style={{ ...mono, color: T.ashDim }}>{value}</span>}
        {!isStatic && <ChevronRight size={15} color={T.ashFaint} />}
      </div>
    </div>
  );
}

function PatchesScreen({ profile, user, onBack, patches, patchesLoading, addPatch, removePatch, setFeaturedPatch }) {
  const fileInputRef = useRef(null);
  const [pickedFile, setPickedFile] = useState(null);
  const [pickedPreview, setPickedPreview] = useState(null);
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");

  const featuredImageUrl = profile?.featuredPatch?.imageUrl;
  const [viewerIndex, setViewerIndex] = useState(null);
  const openViewer = (index) => setViewerIndex(index);
  const closeViewer = () => setViewerIndex(null);
  const showPrev = () => setViewerIndex((i) => (i - 1 + patches.length) % patches.length);
  const showNext = () => setViewerIndex((i) => (i + 1) % patches.length);

  const handlePick = () => fileInputRef.current?.click();
  const handleFileSelected = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setAddError("Please choose an image file.");
      return;
    }
    setAddError("");
    setPickedFile(file);
    setPickedPreview(URL.createObjectURL(file));
  };

  const cancelAdd = () => {
    setPickedFile(null);
    setPickedPreview(null);
    setNewName("");
    setAddError("");
  };

  const handleAdd = async () => {
    if (!pickedFile || !newName.trim()) return;
    setAdding(true);
    setAddError("");
    try {
      const resized = await resizeImageFile(pickedFile, 300, 0.9);
      const patch = await addPatch(user.uid, newName.trim(), resized);
      // A freshly-added patch with nothing else featured yet becomes the
      // default — otherwise your first patch would just sit unselected.
      if (!featuredImageUrl) await setFeaturedPatch(user.uid, patch);
      cancelAdd();
    } catch (err) {
      setAddError(err.message || "Couldn't add that patch — try again.");
    } finally {
      setAdding(false);
    }
  };

  const handleSelectFeatured = (patch) => {
    const isCurrent = featuredImageUrl === patch.imageUrl;
    setFeaturedPatch(user.uid, isCurrent ? null : patch);
  };

  const handleRemove = (e, patch) => {
    e.stopPropagation();
    removePatch(user.uid, patch.id);
    if (featuredImageUrl === patch.imageUrl) setFeaturedPatch(user.uid, null);
  };

  return (
    <div className="h-full overflow-y-auto pb-24" style={flatBg}>
      <div className="px-6 pt-2 pb-4 flex items-center" style={{ borderBottom: `1px solid ${T.line}` }}>
        <button onClick={onBack} className="w-9 h-9 -ml-2 flex items-center justify-center">
          <ChevronLeft size={20} color={T.ash} />
        </button>
        <h1 className="flex-1 text-center text-[18px] font-semibold mr-9" style={{ ...display, color: T.ash }}>Patches</h1>
      </div>

      <div className="px-6 pt-4">
        <p className="text-[12px] mb-4" style={{ ...body, color: T.ashFaint }}>
          Add patches you actually own — tap one to feature it next to your callsign.
        </p>

        {patchesLoading ? (
          <div className="text-[13px] py-6 text-center" style={{ ...body, color: T.ashFaint }}>Loading…</div>
        ) : (
          <div className="grid grid-cols-2 gap-3 mb-4">
            {patches.map((patch, i) => {
              const isFeatured = featuredImageUrl === patch.imageUrl;
              return (
                <button
                  key={patch.id}
                  onClick={() => handleSelectFeatured(patch)}
                  className="relative p-3 flex flex-col items-center text-center transition-transform duration-100 active:scale-[0.98]"
                  style={{ background: T.panel, borderRadius: 6, border: `1.5px solid ${isFeatured ? T.accent : T.line}` }}
                >
                  {isFeatured && (
                    <div className="absolute top-2 right-2 w-5 h-5 flex items-center justify-center" style={{ background: T.accent, borderRadius: 999 }}>
                      <Check size={12} color="#FFFFFF" strokeWidth={3} />
                    </div>
                  )}
                  <button
                    onClick={(e) => handleRemove(e, patch)}
                    className="absolute top-2 left-2 w-5 h-5 flex items-center justify-center"
                    style={{ background: T.panelAlt, borderRadius: 999 }}
                  >
                    <span style={{ color: T.ashFaint, fontSize: 12, lineHeight: 1 }}>×</span>
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); openViewer(i); }}
                    className="absolute bottom-2 right-2 w-6 h-6 flex items-center justify-center"
                    style={{ background: T.panelAlt, borderRadius: 999 }}
                  >
                    <Maximize2 size={12} color={T.ashDim} />
                  </button>
                  <img src={patch.imageUrl} alt={patch.name} className="w-16 h-16 mb-2 mt-2" style={{ objectFit: "contain" }} />
                  <div className="text-[12px] font-medium" style={{ ...body, color: T.ash }}>{patch.name}</div>
                </button>
              );
            })}
          </div>
        )}

        {!pickedFile ? (
          <button
            onClick={handlePick}
            className="w-full py-4 flex flex-col items-center gap-1 transition-transform duration-100 active:scale-[0.98]"
            style={{ background: T.panelAlt, borderRadius: 6, border: `1px dashed ${T.line}` }}
          >
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelected} className="hidden" />
            <Plus size={18} color={T.ashDim} />
            <span className="text-[12px] font-medium" style={{ ...body, color: T.ashDim }}>Add Patch</span>
          </button>
        ) : (
          <div className="p-4" style={{ background: T.panel, borderRadius: 6, border: `1px solid ${T.line}` }}>
            <div className="flex items-center gap-3 mb-3">
              <img src={pickedPreview} alt="Preview" className="w-14 h-14" style={{ objectFit: "contain", background: T.panelAlt, borderRadius: 4 }} />
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Patch name"
                autoFocus
                className="flex-1 px-3 py-2.5 text-[14px] bg-transparent outline-none"
                style={{ ...body, background: T.panelAlt, border: `1px solid ${T.line}`, borderRadius: 4, color: T.ash }}
              />
            </div>
            {addError && <p className="text-[11px] mb-2" style={{ ...body, color: T.alert }}>{addError}</p>}
            <div className="flex gap-2">
              <button onClick={cancelAdd} className="flex-1 py-2.5 text-[12px] font-medium" style={{ ...body, border: `1px solid ${T.line}`, color: T.ashDim, borderRadius: 4 }}>
                Cancel
              </button>
              <button
                onClick={handleAdd}
                disabled={!newName.trim() || adding}
                className="flex-1 py-2.5 text-[12px] font-semibold"
                style={{ ...display, background: T.ash, color: "#FFFFFF", borderRadius: 4, opacity: !newName.trim() || adding ? 0.5 : 1 }}
              >
                {adding ? "Adding…" : "Add"}
              </button>
            </div>
          </div>
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
          <div className="text-[17px] font-semibold mt-4" style={{ ...display, color: "#FFFFFF" }}>
            {patches[viewerIndex].name}
          </div>
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
    <div className="h-full overflow-y-auto pb-24" style={flatBg}>
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
          <div className="absolute -bottom-1 -right-1 w-7 h-7 flex items-center justify-center" style={{ background: T.ash, borderRadius: 14, border: `2px solid ${T.void}` }}>
            {avatarUploading ? (
              <span className="text-[9px]" style={{ ...mono, color: "#FFFFFF" }}>…</span>
            ) : (
              <Camera size={13} color="#FFFFFF" strokeWidth={2.5} />
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
          style={{ ...display, background: T.ash, color: "#FFFFFF", borderRadius: 4, opacity: saving ? 0.6 : 1 }}
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
                  style={{ ...body, border: `1px solid ${T.line}`, color: T.ashDim, borderRadius: 4 }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={!deletePassword || deleting}
                  className="flex-1 py-2.5 text-[12px] font-semibold"
                  style={{ ...display, background: T.alert, color: "#FFFFFF", borderRadius: 4, opacity: !deletePassword || deleting ? 0.5 : 1 }}
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

function ProfileScreen({ profile, user, onNavigate, onOpenAccount, onOpenPatches, onLogout, changePassword, uploadAvatar, updateLanguage }) {
  const initial = (profile?.callsign || user?.email || "?").charAt(0).toUpperCase();
  const fileInputRef = useRef(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState("");

  const referralUrl = user ? `${window.location.origin}${import.meta.env.BASE_URL}?ref=${user.uid}` : "";
  const [referralQr, setReferralQr] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!referralUrl) return;
    QRCode.toDataURL(referralUrl, { width: 280, margin: 1, color: { dark: T.ash, light: "#FFFFFF" } }).then(setReferralQr);
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
    <div className="h-full overflow-y-auto pb-24" style={flatBg}>
      <ScreenHeader title="Profile" />
      <div className="px-6 pt-4">
        <div className="p-4 flex items-center gap-3 mb-2" style={{ background: T.panel, borderRadius: 6, border: `1px solid ${T.line}` }}>
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
              style={{ background: T.ash, borderRadius: 3, border: `2px solid ${T.panel}` }}
            >
              {avatarUploading ? (
                <span className="text-[8px]" style={{ ...mono, color: "#FFFFFF" }}>…</span>
              ) : (
                <Camera size={10} color="#FFFFFF" strokeWidth={2.5} />
              )}
            </div>
          </button>
          <div>
            <span className="text-[16px] font-semibold inline-flex items-center gap-1.5" style={{ ...display, color: T.ash }}>
              {profile?.callsign || "Loading…"}
              {profile?.verified && <BadgeCheck size={15} color="#fff" fill={T.accent} />}
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

        <Eyebrow>Invite Friends</Eyebrow>
        <div className="p-4 mb-5 flex flex-col items-center text-center" style={{ background: T.panel, borderRadius: 6, border: `1px solid ${T.line}` }}>
          {referralQr && <img src={referralQr} alt="Referral QR code" className="mb-3" style={{ width: 140, height: 140 }} />}
          <p className="text-[12px] mb-3" style={{ ...body, color: T.ashDim }}>
            Share this code or let someone scan it to invite them to Atlas.
          </p>
          <button
            onClick={handleCopyReferral}
            className="w-full py-2.5 text-[13px] font-semibold"
            style={{ ...display, background: copied ? T.good : T.ash, color: "#FFFFFF", borderRadius: 4 }}
          >
            {copied ? "Copied!" : "Copy Invite Link"}
          </button>
        </div>

        <Eyebrow>Account Settings</Eyebrow>
        <div className="px-4 mb-2 divide-y" style={{ background: T.panel, borderRadius: 6, border: `1px solid ${T.line}`, borderColor: T.line }}>
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
        </div>

        <button
          onClick={() => { setShowPasswordForm(!showPasswordForm); setPasswordError(""); setPasswordSuccess(false); }}
          className="w-full flex items-center justify-between py-3 px-4 mb-6"
          style={{ background: T.panel, borderRadius: 6, border: `1px solid ${T.line}` }}
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
              style={{ ...display, background: T.ash, color: "#FFFFFF", borderRadius: 4, opacity: passwordSaving ? 0.6 : 1 }}
            >
              {passwordSaving ? "Updating…" : "Update Password"}
            </button>
          </form>
        )}

        <Eyebrow>Support & Preferences</Eyebrow>
        <div className="px-4 mb-2 divide-y" style={{ background: T.panel, borderRadius: 6, border: `1px solid ${T.line}`, borderColor: T.line }}>
          <button onClick={() => setShowLanguagePicker(!showLanguagePicker)} className="w-full flex items-center justify-between py-3.5">
            <span className="text-[14px] font-medium" style={{ ...body, color: T.ash }}>Language</span>
            <div className="flex items-center gap-2">
              <span className="text-[12px]" style={{ ...mono, color: T.ashDim }}>{profile?.language || "English"}</span>
              <ChevronRight size={15} color={T.ashFaint} style={{ transform: showLanguagePicker ? "rotate(90deg)" : "none" }} />
            </div>
          </button>
          <ProfileRow label="FAQs" />
          <ProfileRow label="Report a concern" />
        </div>

        {showLanguagePicker && (
          <div className="mb-6 p-4" style={{ background: T.panel, borderRadius: 6, border: `1px solid ${T.line}` }}>
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
                    color: (profile?.language || "English") === lang ? "#fff" : T.ashDim,
                    borderRadius: 4,
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
          style={{ ...body, border: `1px solid ${T.line}`, color: T.alert, borderRadius: 4 }}
        >
          <LogOut size={15} /> Log out
        </button>
      </div>
      <BottomNav active="profile" onNavigate={onNavigate} />
    </div>
  );
}

/* ---------- app shell ---------- */
export default function App() {
  const { fields, loading: fieldsLoading } = useFields();
  const { events, loading: eventsLoading } = useEvents();
  const { user, profile, authLoading, signUp, signIn, signOut, updateProfileFields, changePassword, uploadAvatar, updateLanguage, deleteAccount } = useAuth();
  const { favorites, favoritesLoading, isFavorited, toggleFavorite } = useFavorites(user?.uid);
  const { patches, patchesLoading, addPatch, removePatch, setFeaturedPatch } = usePatches(user?.uid);
  const { teams: allTeams, teamsLoading: allTeamsLoading } = useAllTeams();
  const { createTeam, joinTeam, leaveTeam, updateTeamInfo, updateTeamPatch, setMemberRole, removeMember, reconcileMembership } = useTeamActions();

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

  const [stack, setStack] = useState(["home"]);
  const [activeEventId, setActiveEventId] = useState(null);
  const [activeFieldId, setActiveFieldId] = useState(null);
  const [activeTeamId, setActiveTeamId] = useState(null);
  const screen = stack[stack.length - 1];

  const push = (s) => setStack((prev) => [...prev, s]);
  const pop = () => setStack((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
  const goTab = (tab) => setStack([tab]);

  const activeEvent = events.find((e) => e.id === activeEventId) || null;
  const { signature, signWaiver } = useWaiverSignature(user?.uid, activeEvent?.id);
  const activeField =
    fields.find((f) => f.id === activeFieldId) ||
    (activeEvent ? fields.find((f) => f.id === activeEvent.fieldId) : null);
  const activeFieldEvents = activeField
    ? events
        .filter((e) => e.fieldId === activeField.id && (e.endDate || e.date) >= localDateStr())
        .sort((a, b) => a.date.localeCompare(b.date))
    : [];
  const activeFieldPastEvents = activeField
    ? events
        .filter((e) => e.fieldId === activeField.id && (e.endDate || e.date) < localDateStr())
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
  const openTeam = (teamId) => {
    setActiveTeamId(teamId);
    push("team");
  };
  const { team: activeTeam, members: activeTeamMembers, teamLoading: activeTeamLoading } = useTeam(activeTeamId);

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

  let content;
  if (authLoading) {
    content = (
      <div className="h-full flex items-center justify-center" style={flatBg}>
        <p className="text-[13px]" style={{ ...body, color: T.ashDim }}>Loading…</p>
      </div>
    );
  } else if (!user) {
    content = <LoginScreen signIn={signIn} signUp={signUp} referralCode={referralCode} />;
  } else if (screen === "home") {
    content = (
      <HomeScreen
        events={events}
        eventsLoading={eventsLoading}
        fields={fields}
        profile={profile}
        favorites={favorites}
        user={user}
        onOpenEvent={openEvent}
        onOpenField={openField}
        onNavigate={goTab}
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
      />
    ) : (
      <div className="h-full flex items-center justify-center" style={flatBg}>
        <p className="text-[13px]" style={{ ...body, color: T.ashDim }}>Loading event…</p>
      </div>
    );
  } else if (screen === "field") {
    const relocatedField = activeField?.relocatedTo ? fields.find((f) => f.id === activeField.relocatedTo) : null;
    content = (
      <FieldDetailScreen
        field={activeField}
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
        events={events}
        onOpenField={openField}
        onOpenEvent={openEvent}
      />
    );
  } else if (screen === "schedule") {
    content = <ScheduleScreen onNavigate={goTab} favorites={favorites} events={events} onOpenEvent={openEvent} />;
  } else if (screen === "inbox") {
    content = (
      <SocialScreen
        onNavigate={goTab}
        onOpenTeam={openTeam}
        profile={profile}
        user={user}
        teams={allTeams}
        teamsLoading={allTeamsLoading}
        createTeam={createTeam}
      />
    );
  } else if (screen === "team") {
    content = (
      <TeamScreen
        team={activeTeam}
        members={activeTeamMembers}
        teamLoading={activeTeamLoading}
        profile={profile}
        user={user}
        onBack={pop}
        onNavigate={goTab}
        joinTeam={joinTeam}
        leaveTeam={leaveTeam}
        updateTeamInfo={updateTeamInfo}
        updateTeamPatch={updateTeamPatch}
        setMemberRole={setMemberRole}
        removeMember={removeMember}
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
        onLogout={handleLogout}
        changePassword={changePassword}
        uploadAvatar={uploadAvatar}
        updateLanguage={updateLanguage}
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
        addPatch={addPatch}
        removePatch={removePatch}
        setFeaturedPatch={setFeaturedPatch}
      />
    );
  }

  return (
    <div className="w-full h-screen flex flex-col" style={{ background: T.void }}>
      <style>{FONTS}</style>
      <div key={screen} className="flex-1 min-h-0 relative screen-transition">
        {content}
      </div>
    </div>
  );
}
