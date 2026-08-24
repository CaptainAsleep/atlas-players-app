import React, { useState, useMemo, useRef } from "react";
import {
  Compass, Heart, Calendar, Inbox, User, ChevronLeft, Share2,
  Search, SlidersHorizontal, MapPin, Star, Check, Plus, Crosshair,
  ArrowRight, ChevronRight, LogOut, MessageCircle, Ticket, Radio, Camera
} from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { useFields } from "./hooks/useFields";
import { useEvents } from "./hooks/useEvents";
import { useAuth } from "./hooks/useAuth";
import { useFavorites } from "./hooks/useFavorites";

/* ---------- design tokens ---------- */
const FONTS = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@500;600&display=swap');
`;
const display = { fontFamily: "'Space Grotesk', sans-serif" };
const mono = { fontFamily: "'IBM Plex Mono', monospace" };
const body = { fontFamily: "'Inter', sans-serif" };

const T = {
  void: "#0A0A0B",
  panel: "#141517",
  panelAlt: "#1B1C1F",
  line: "#2A2C30",
  ash: "#F2F1EE",
  ashDim: "#8A8C92",
  ashFaint: "#57595E",
  accent: "#5B8DFF",
  good: "#34D399",
  alert: "#F0554A",
};

const flatBg = { backgroundColor: T.void };

/* ---------- helpers ---------- */
// Deterministic placeholder gradient per field/event until real photos exist.
const GRADIENTS = [
  "linear-gradient(160deg,#1c1e18,#0a0a09)",
  "linear-gradient(160deg,#1a1a1c,#08080a)",
  "linear-gradient(160deg,#191c17,#08090a)",
  "linear-gradient(160deg,#1b1a1c,#09080a)",
  "linear-gradient(160deg,#17191c,#07080a)",
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
const NEARBY_RADIUS_MILES = 50;
// Haversine formula — straight-line distance between two lat/lng points,
// accurate enough for "how far is this field" without needing a routing API.
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

const scheduleUpcomingSuggested = [
  { title: "Rec Day: Chaos at the Fort", venue: "Cedar Airsoft Field", date: "May 18, 2024" },
  { title: "Milsim: Operation Nightfall", venue: "MTC Camp, MI", date: "Jun 01, 2024" },
  { title: "CQB Night Championship", venue: "Atlas Indoor Arena", date: "Jun 15, 2024" },
];
const schedulePrevious = [
  { title: "Spring Opener Rec Skirmish", venue: "Cedar Airsoft Field", date: "Apr 20, 2024" },
];
const schedulePreviousFilled = [
  { title: "Speedsoft Showdown Local", venue: "Atlas Indoor Arena", date: "Mar 12, 2024" },
  { title: "Icebreaker Winter MilSim", venue: "Cedar Airsoft Field", date: "Jan 15, 2024" },
  { title: "Operation Red Shield", venue: "Stryker Milsim Site", date: "Nov 10, 2023" },
];

/* ---------- primitives ---------- */
function Tag({ children, tone = "neutral" }) {
  const map = {
    neutral: { border: "transparent", color: T.ash, bg: "rgba(10,10,11,0.72)" },
    accent: { border: "transparent", color: "#0A0A0B", bg: T.ash },
    good: { border: "transparent", color: "#06231A", bg: T.good },
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
    { key: "inbox", label: "Inbox", icon: Inbox },
    { key: "profile", label: "Profile", icon: User },
  ];
  return (
    <div className="absolute bottom-0 left-0 right-0 border-t" style={{ background: T.panel, borderColor: T.line }}>
      <div className="flex justify-between px-5 pt-2.5 pb-1.5">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = active === t.key;
          return (
            <button key={t.key} onClick={() => onNavigate(t.key)} className="flex flex-col items-center gap-1 flex-1">
              <Icon size={19} strokeWidth={isActive ? 2.1 : 1.6} color={isActive ? T.ash : T.ashFaint} />
              <span className="text-[9px] font-medium" style={{ ...body, color: isActive ? T.ash : T.ashFaint }}>
                {t.label}
              </span>
            </button>
          );
        })}
      </div>
      <div className="flex justify-center pb-1.5 pt-1">
        <div style={{ width: 120, height: 4, borderRadius: 2, background: T.line }} />
      </div>
    </div>
  );
}

/* ---------- screens ---------- */
function LoginScreen({ signIn, signUp }) {
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
        await signUp(email.trim(), password, callsign.trim());
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
          className="w-full py-3.5 font-semibold text-[14px] flex items-center justify-center gap-2 mt-2"
          style={{ ...display, background: T.ash, color: "#0A0A0B", borderRadius: 4, opacity: busy ? 0.6 : 1 }}
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
  const isToday = ev.date === new Date().toISOString().slice(0, 10);
  return (
    <button onClick={onClick} className="text-left w-full mb-4">
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
        ) : <div />}
        {ev.price && (
          <div className="text-[13px] font-semibold" style={{ ...mono, color: T.accent }}>{ev.price}</div>
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

function FieldsMap({ fields, onOpenField }) {
  const pins = fields.filter((f) => typeof f.lat === "number" && typeof f.lng === "number");
  const center = pins.length ? [pins[0].lat, pins[0].lng] : [43.3, -84.5]; // Michigan fallback

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
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
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

function HomeScreen({ onOpenEvent, onNavigate, events, eventsLoading, fields, profile, onOpenField }) {
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState("Featured");
  const [viewMode, setViewMode] = useState("list");
  const [activeTodayOnly, setActiveTodayOnly] = useState(false);
  const [nearbyOnly, setNearbyOnly] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState("idle"); // idle | loading | error
  const today = new Date().toISOString().slice(0, 10);
  const isLiveToday = (ev) => ev.date <= today && (ev.endDate || ev.date) >= today;

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

  const cats = [
    { key: "Featured", icon: Star },
    { key: "Outdoor", icon: Compass, type: "OUTDOOR", fieldProp: "outdoor" },
    { key: "MilSim", icon: Crosshair, type: "MILSIM" },
    { key: "Indoor", icon: MapPin, type: "INDOOR", fieldProp: "indoor" },
    { key: "Tournament", icon: Ticket, type: "TOURNAMENT" },
  ];

  let filteredEvents = events.filter((ev) => {
    const cat = cats.find((c) => c.key === activeCat);
    if (cat?.type && ev.type !== cat.type) return false;
    if (activeTodayOnly && !isLiveToday(ev)) return false;
    if (nearbyOnly) {
      const dist = fieldDistance(fields.find((f) => f.id === ev.fieldId));
      if (dist === null || dist > NEARBY_RADIUS_MILES) return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      const haystack = `${ev.title} ${ev.fieldName}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
  if (nearbyOnly) {
    filteredEvents = [...filteredEvents].sort(
      (a, b) => (fieldDistance(fields.find((f) => f.id === a.fieldId)) ?? Infinity) -
                (fieldDistance(fields.find((f) => f.id === b.fieldId)) ?? Infinity)
    );
  }

  return (
    <div className="h-full overflow-y-auto pb-24" style={flatBg}>
      <div className="px-6 pt-2 pb-4 flex items-center justify-between">
        <div>
          <div className="text-[12px]" style={{ ...body, color: T.ashDim }}>{timeBasedGreeting()},</div>
          <div className="text-[20px] font-semibold" style={{ ...display, color: T.ash }}>{profile?.callsign || "Player"}</div>
        </div>
        {profile?.avatarUrl ? (
          <div
            className="w-10 h-10"
            style={{ backgroundImage: `url("${profile.avatarUrl}")`, backgroundSize: "cover", backgroundPosition: "center", borderRadius: 4 }}
          />
        ) : (
          <div className="w-10 h-10" style={{ background: T.panelAlt, borderRadius: 4 }} />
        )}
      </div>

      <div className="mx-6 p-4 mb-4" style={{ background: T.panel, border: `1px solid ${T.line}`, borderRadius: 6 }}>
        <div className="flex items-center justify-between mb-3">
          <Tag tone="live">UPCOMING GAME</Tag>
          <span className="text-[11px] font-medium flex items-center gap-1" style={{ ...body, color: T.good }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: T.good, display: "inline-block" }} /> Check-in available
          </span>
        </div>
        <div className="font-semibold text-[17px]" style={{ ...display, color: T.ash }}>Cedar Airsoft Rec Game</div>
        <div className="text-[12px] mb-4" style={{ ...body, color: T.ashDim }}>Saturday, May 11 — Staging opens at 9:00 AM</div>
        <div className="flex items-center justify-between">
          <span className="text-[11px]" style={{ ...body, color: T.ashFaint }}>Barcode ready on device</span>
          <button className="px-4 py-2 text-[11px] font-semibold" style={{ ...display, background: T.ash, color: "#0A0A0B", borderRadius: 4 }}>
            Check In Now
          </button>
        </div>
      </div>

      <div className="mx-6 mb-4 flex items-center gap-2 px-3 py-3" style={{ border: `1px solid ${T.line}`, background: T.panel, borderRadius: 4 }}>
        <Search size={16} color={T.ashFaint} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Where would you like to pew?"
          className="flex-1 text-[13px] bg-transparent outline-none"
          style={{ ...body, color: T.ash }}
        />
        <SlidersHorizontal size={16} color={T.ashDim} />
      </div>

      <div className="mx-6 mb-2 flex items-center gap-2">
        <button
          onClick={handleNearbyToggle}
          className="flex items-center gap-1 px-3 py-1.5 text-[12px] font-medium"
          style={{
            ...body,
            border: `1px solid ${nearbyOnly ? T.alert : T.line}`,
            background: nearbyOnly ? T.alert : "transparent",
            color: nearbyOnly ? "#fff" : T.ash,
            borderRadius: 4,
          }}
        >
          <MapPin size={12} /> {locationStatus === "loading" ? "Locating…" : "Nearby"}
        </button>
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
            className="px-3 py-1.5 text-[12px] font-semibold"
            style={{ ...body, background: viewMode === "list" ? T.ash : "transparent", color: viewMode === "list" ? "#0A0A0B" : T.ashDim }}
          >
            List
          </button>
          <button
            onClick={() => setViewMode("map")}
            className="px-3 py-1.5 text-[12px] font-medium"
            style={{ ...body, background: viewMode === "map" ? T.ash : "transparent", color: viewMode === "map" ? "#0A0A0B" : T.ashDim }}
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
            <button key={cat.key} onClick={() => setActiveCat(cat.key)} className="flex flex-col items-center gap-1.5">
              <div
                className="w-14 h-14 flex items-center justify-center"
                style={{ background: active ? T.ash : T.panel, border: `1px solid ${T.line}`, borderRadius: 4 }}
              >
                <Icon size={19} color={active ? "#0A0A0B" : T.ashDim} strokeWidth={1.7} />
              </div>
              <span className="text-[11px] font-medium" style={{ ...body, color: active ? T.ash : T.ashDim }}>{cat.key}</span>
            </button>
          );
        })}
      </div>

      <div className="px-6 flex items-center justify-between mb-3">
        <span className="text-[15px] font-semibold" style={{ ...display, color: T.ash }}>
          {viewMode === "map" ? "Fields on Map" : "Events Feed"}
        </span>
      </div>

      {viewMode === "map" ? (
        <FieldsMap
          fields={fields.filter((f) => {
            // Category: Outdoor/Indoor are real properties every field has,
            // so filter on the field itself — reliable regardless of how
            // much event data exists. MilSim/Tournament are event-only
            // concepts with no field-level equivalent, so those check
            // whether this field has ANY matching event on record (not
            // limited to the currently filtered event list, which could be
            // empty for unrelated reasons like date or search text).
            const cat = cats.find((c) => c.key === activeCat);
            if (cat?.fieldProp && !(f.indoorOutdoor || "").toLowerCase().includes(cat.fieldProp)) return false;
            if (cat?.type && !cat.fieldProp && !events.some((ev) => ev.fieldId === f.id && ev.type === cat.type)) return false;
            if (activeTodayOnly && !events.some((ev) => ev.fieldId === f.id && isLiveToday(ev))) return false;
            if (nearbyOnly) {
              const dist = fieldDistance(f);
              if (dist === null || dist > NEARBY_RADIUS_MILES) return false;
            }

            if (search.trim()) {
              const q = search.toLowerCase();
              if (!`${f.name} ${f.city || ""}`.toLowerCase().includes(q)) return false;
            }
            return true;
          })}
          onOpenField={onOpenField}
        />
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

function EventDetailScreen({ ev, field, onBack, onOpenField, favorited, onToggleFavorite }) {
  const statusLabel = field ? STATUS_LABEL[field.status] : null;
  return (
    <div className="h-full flex flex-col" style={flatBg}>
      <div className="flex-1 overflow-y-auto pb-24">
        <div className="h-60 relative" style={heroStyle(ev.imageUrl || field?.imageUrl, ev.id || ev.title)}>
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-5 pt-3">
            <button onClick={onBack} className="w-9 h-9 flex items-center justify-center" style={{ background: "rgba(10,10,11,0.6)", borderRadius: 4 }}>
              <ChevronLeft color={T.ash} size={19} />
            </button>
            <button onClick={onToggleFavorite} className="w-9 h-9 flex items-center justify-center" style={{ background: "rgba(10,10,11,0.6)", borderRadius: 4 }}>
              <Heart size={17} color={favorited ? T.alert : T.ash} fill={favorited ? T.alert : "none"} />
            </button>
          </div>
          <div className="absolute bottom-4 left-5 right-5">
            <div className="flex gap-2 mb-2">
              {ev.type && <Tag>{ev.type}</Tag>}
              {statusLabel && <Tag tone="live">{statusLabel}</Tag>}
            </div>
            <div className="text-[24px] font-semibold" style={{ ...display, color: T.ash }}>{ev.title}</div>
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
          </div>

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

      <div className="absolute bottom-0 left-0 right-0 border-t px-5 py-3 flex items-center justify-between" style={{ background: T.panel, borderColor: T.line }}>
        <div>
          <div className="text-[10px]" style={{ ...body, color: T.ashFaint }}>Entry Cost</div>
          <div className="text-[18px] font-semibold" style={{ ...mono, color: T.ash }}>
            {ev.price || field?.admission || "See listing"}
          </div>
        </div>
        <a
          href={ev.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="px-6 py-3 font-semibold text-[13px] inline-block"
          style={{ ...display, background: T.ash, color: "#0A0A0B", borderRadius: 4 }}
        >
          Book / RSVP
        </a>
      </div>
    </div>
  );
}

function FieldDetailScreen({ field, fieldEvents, relocatedField, onBack, onNavigate, onOpenEvent, onOpenField, favorited, onToggleFavorite }) {
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
            <button onClick={onBack} className="w-9 h-9 flex items-center justify-center" style={{ background: "rgba(10,10,11,0.6)", borderRadius: 4 }}>
              <ChevronLeft color={T.ash} size={19} />
            </button>
            <button onClick={onToggleFavorite} className="w-9 h-9 flex items-center justify-center" style={{ background: "rgba(10,10,11,0.6)", borderRadius: 4 }}>
              <Heart size={17} color={favorited ? T.alert : T.ash} fill={favorited ? T.alert : "none"} />
            </button>
          </div>
          <div className="absolute bottom-4 left-5 right-5">
            <div className="flex gap-2 mb-2">
              {field.indoorOutdoor && <Tag>{field.indoorOutdoor.toUpperCase()}</Tag>}
              {statusLabel && <Tag tone="live">{statusLabel}</Tag>}
              {!statusLabel && field.status === "active" && <Tag tone="good">ACTIVE</Tag>}
            </div>
            <div className="text-[24px] font-semibold" style={{ ...display, color: T.ash }}>{field.name}</div>
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

          {field.about && (
            <div className="p-4" style={{ background: T.panel, borderRadius: 6, border: `1px solid ${T.line}` }}>
              <Eyebrow>About the Field</Eyebrow>
              <p className="text-[13px] leading-relaxed" style={{ ...body, color: T.ashDim }}>{field.about}</p>
            </div>
          )}

          {(field.admission || field.hours) && (
            <div className="p-4 flex flex-col gap-2" style={{ background: T.panel, borderRadius: 6, border: `1px solid ${T.line}` }}>
              {field.admission && (
                <div className="flex justify-between text-[13px]">
                  <span style={{ ...body, color: T.ashFaint }}>Admission</span>
                  <span style={{ ...mono, color: T.ash }}>{field.admission}</span>
                </div>
              )}
              {field.hours && (
                <div className="flex justify-between text-[13px] gap-4">
                  <span style={{ ...body, color: T.ashFaint }}>Hours</span>
                  <span className="text-right" style={{ ...mono, color: T.ash }}>{field.hours}</span>
                </div>
              )}
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
                    <div className="w-11 h-11" style={{ background: T.panelAlt, borderRadius: 4 }} />
                    <div className="flex-1">
                      <div className="text-[13px] font-medium" style={{ ...body, color: T.ash }}>{s.title}</div>
                      <div className="text-[11px]" style={{ ...mono, color: T.ashFaint }}>{formatDate(s.date, s.endDate)}</div>
                    </div>
                    {s.price && <div className="text-[13px] font-semibold" style={{ ...mono, color: T.accent }}>{s.price}</div>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {field.address && (
            <a
              href={
                /iPad|iPhone|iPod/.test(navigator.userAgent)
                  ? `https://maps.apple.com/?daddr=${
                      typeof field.lat === "number" ? `${field.lat},${field.lng}` : encodeURIComponent(field.address)
                    }`
                  : `https://www.google.com/maps/dir/?api=1&destination=${
                      typeof field.lat === "number" ? `${field.lat},${field.lng}` : encodeURIComponent(field.address)
                    }`
              }
              target="_blank"
              rel="noreferrer"
              className="block overflow-hidden"
              style={{ background: T.panel, borderRadius: 6, border: `1px solid ${T.line}` }}
            >
              <div className="p-4 pb-3">
                <Eyebrow>Field Location</Eyebrow>
                <div className="flex items-center gap-2 text-[12px] mb-1" style={{ ...body, color: T.ashDim }}>
                  <MapPin size={13} color={T.ashFaint} /> {field.address}
                </div>
                {field.phone && (
                  <div className="text-[12px]" style={{ ...mono, color: T.ashFaint }}>{field.phone}</div>
                )}
              </div>

              {typeof field.lat === "number" && typeof field.lng === "number" ? (
                <div className="h-36 pointer-events-none">
                  <MapContainer
                    center={[field.lat, field.lng]}
                    zoom={13}
                    style={{ width: "100%", height: "100%" }}
                    zoomControl={false}
                    dragging={false}
                    scrollWheelZoom={false}
                    doubleClickZoom={false}
                    touchZoom={false}
                  >
                    <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution="" />
                    <Marker position={[field.lat, field.lng]} icon={fieldPinIcon} />
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
  const today = new Date().toISOString().slice(0, 10);

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
                Events you've saved will move here after they're over — a record of what you've attended.
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
                    <Tag tone="good">ATTENDED</Tag>
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

function ScheduleScreen({ onNavigate, filled, setFilled }) {
  return (
    <div className="h-full overflow-y-auto pb-24" style={flatBg}>
      <ScreenHeader title="Schedule" />
      <div className="px-6 pt-2 pb-1 flex justify-end">
        <button
          onClick={() => setFilled(!filled)}
          className="text-[10px] font-medium px-3 py-1"
          style={{ ...body, border: `1px solid ${T.line}`, color: T.ashDim, borderRadius: 4 }}
        >
          Demo: show {filled ? "empty" : "filled"}
        </button>
      </div>

      {!filled ? (
        <div className="px-6 pt-3">
          <div className="p-6 flex flex-col items-center text-center mb-6" style={{ background: T.panel, borderRadius: 6, border: `1px solid ${T.line}` }}>
            <div className="w-14 h-14 flex items-center justify-center mb-3" style={{ background: T.panelAlt, borderRadius: 4 }}>
              <Calendar size={22} color={T.ashDim} strokeWidth={1.7} />
            </div>
            <div className="text-[16px] font-semibold mb-1" style={{ ...display, color: T.ash }}>Nothing scheduled yet</div>
            <p className="text-[13px] mb-4" style={{ ...body, color: T.ashDim }}>
              Time to dust off your gear and start planning your next airsoft adventure.
            </p>
            <button
              onClick={() => onNavigate("home")}
              className="w-full py-3 font-semibold text-[13px]"
              style={{ ...display, background: T.ash, color: "#0A0A0B", borderRadius: 4 }}
            >
              Start your search
            </button>
          </div>

          <Eyebrow>Upcoming Near You</Eyebrow>
          <div className="flex flex-col gap-3 mb-6">
            {scheduleUpcomingSuggested.map((e) => (
              <div key={e.title} className="p-3 flex items-center gap-3" style={{ background: T.panel, borderRadius: 6, border: `1px solid ${T.line}` }}>
                <div className="w-12 h-12" style={{ background: T.panelAlt, borderRadius: 4 }} />
                <div className="flex-1">
                  <div className="text-[13px] font-medium" style={{ ...body, color: T.ash }}>{e.title}</div>
                  <div className="text-[11px]" style={{ ...body, color: T.ashFaint }}>{e.venue}</div>
                  <div className="text-[11px] font-medium" style={{ ...mono, color: T.accent }}>{e.date}</div>
                </div>
                <button className="w-8 h-8 flex items-center justify-center" style={{ background: T.panelAlt, borderRadius: 4 }}>
                  <Plus size={15} color={T.ash} />
                </button>
              </div>
            ))}
          </div>

          <Eyebrow>Previous Events</Eyebrow>
          <div className="flex flex-col gap-3">
            {schedulePrevious.map((e) => (
              <div key={e.title} className="p-3 flex items-center gap-3" style={{ background: T.panel, borderRadius: 6, border: `1px solid ${T.line}` }}>
                <div className="w-12 h-12" style={{ background: T.panelAlt, borderRadius: 4 }} />
                <div className="flex-1">
                  <div className="text-[13px] font-medium" style={{ ...body, color: T.ash }}>{e.title}</div>
                  <div className="text-[11px]" style={{ ...body, color: T.ashFaint }}>{e.venue}</div>
                  <div className="text-[11px] font-medium" style={{ ...mono, color: T.accent }}>{e.date}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="px-6 pt-3">
          <Eyebrow>Upcoming Events</Eyebrow>
          <div className="mb-6" style={{ background: T.panel, borderRadius: 6, border: `1px solid ${T.line}`, overflow: "hidden" }}>
            <div className="h-36" style={{ background: "linear-gradient(160deg,#1c1a12,#08080a)" }} />
            <div className="p-4">
              <div className="flex items-center justify-between mb-1">
                <Tag>NATIONAL EVENT</Tag>
                <span className="text-[13px] font-semibold" style={{ ...mono, color: T.accent }}>$50 / person</span>
              </div>
              <div className="text-[16px] font-semibold" style={{ ...display, color: T.ash }}>Battle @ 6 Flags</div>
              <div className="text-[12px]" style={{ ...body, color: T.ashDim }}>Airsoft Event in New Orleans, LA</div>
              <div className="text-[11px] font-medium" style={{ ...mono, color: T.ashFaint }}>Sep 20–22, 2024</div>
            </div>
          </div>

          <Eyebrow>Previous Events</Eyebrow>
          <div className="flex flex-col gap-3">
            {schedulePreviousFilled.map((e) => (
              <div key={e.title} className="p-3 flex items-center gap-3" style={{ background: T.panel, borderRadius: 6, border: `1px solid ${T.line}` }}>
                <div className="w-12 h-12" style={{ background: T.panelAlt, borderRadius: 4 }} />
                <div className="flex-1">
                  <div className="text-[13px] font-medium" style={{ ...body, color: T.ash }}>{e.title}</div>
                  <div className="text-[11px]" style={{ ...body, color: T.ashFaint }}>{e.venue}</div>
                  <div className="text-[11px] font-medium" style={{ ...mono, color: T.accent }}>{e.date}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      <BottomNav active="schedule" onNavigate={onNavigate} />
    </div>
  );
}

function InboxScreen({ onNavigate }) {
  return (
    <div className="h-full overflow-y-auto pb-24" style={flatBg}>
      <ScreenHeader title="Inbox" />
      <div className="px-6 pt-16 flex flex-col items-center text-center">
        <div className="w-14 h-14 flex items-center justify-center mb-3" style={{ background: T.panelAlt, borderRadius: 4 }}>
          <Radio size={22} color={T.ashDim} strokeWidth={1.7} />
        </div>
        <div className="text-[16px] font-semibold mb-1" style={{ ...display, color: T.ash }}>No comms yet</div>
        <p className="text-[13px]" style={{ ...body, color: T.ashDim }}>Messages from hosts and venues will show up here.</p>
      </div>
      <BottomNav active="inbox" onNavigate={onNavigate} />
    </div>
  );
}

function ProfileRow({ label, value }) {
  return (
    <button className="w-full flex items-center justify-between py-3.5">
      <span className="text-[14px] font-medium" style={{ ...body, color: T.ash }}>{label}</span>
      <div className="flex items-center gap-2">
        {value && <span className="text-[12px]" style={{ ...mono, color: T.ashDim }}>{value}</span>}
        <ChevronRight size={15} color={T.ashFaint} />
      </div>
    </button>
  );
}

function ProfileScreen({ profile, user, onNavigate, onLogout, updateCallsign, changePassword, uploadAvatar }) {
  const initial = (profile?.callsign || user?.email || "?").charAt(0).toUpperCase();
  const fileInputRef = useRef(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState("");

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

  const [editingCallsign, setEditingCallsign] = useState(false);
  const [callsignInput, setCallsignInput] = useState("");
  const [callsignSaving, setCallsignSaving] = useState(false);
  const [callsignError, setCallsignError] = useState("");

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const openCallsignEdit = () => {
    setCallsignInput(profile?.callsign || "");
    setCallsignError("");
    setEditingCallsign(true);
  };

  const saveCallsign = async () => {
    const trimmed = callsignInput.trim();
    if (!trimmed) {
      setCallsignError("Callsign can't be empty.");
      return;
    }
    setCallsignSaving(true);
    setCallsignError("");
    try {
      await updateCallsign(trimmed);
      setEditingCallsign(false);
    } catch (err) {
      setCallsignError("Couldn't save — try again.");
    } finally {
      setCallsignSaving(false);
    }
  };

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
                <span className="text-[8px]" style={{ ...mono, color: "#0A0A0B" }}>…</span>
              ) : (
                <Camera size={10} color="#0A0A0B" strokeWidth={2.5} />
              )}
            </div>
          </button>
          <div>
            <span className="text-[16px] font-semibold" style={{ ...display, color: T.ash }}>
              {profile?.callsign || "Loading…"}
            </span>
            <div className="text-[12px]" style={{ ...body, color: T.ashDim }}>{user?.email}</div>
          </div>
        </div>
        {avatarError && <p className="text-[11px] mb-3" style={{ ...body, color: T.alert }}>{avatarError}</p>}
        {!avatarError && <div className="mb-3" />}

        <Eyebrow>Account Settings</Eyebrow>
        <div className="px-4 mb-2 divide-y" style={{ background: T.panel, borderRadius: 6, border: `1px solid ${T.line}`, borderColor: T.line }}>
          <ProfileRow label="Email" value={user?.email} />
          {!editingCallsign ? (
            <button onClick={openCallsignEdit} className="w-full flex items-center justify-between py-3.5">
              <span className="text-[14px] font-medium" style={{ ...body, color: T.ash }}>Callsign</span>
              <div className="flex items-center gap-2">
                <span className="text-[12px]" style={{ ...mono, color: T.ashDim }}>{profile?.callsign}</span>
                <ChevronRight size={15} color={T.ashFaint} />
              </div>
            </button>
          ) : (
            <div className="py-3.5">
              <div className="flex gap-2">
                <input
                  value={callsignInput}
                  onChange={(e) => setCallsignInput(e.target.value)}
                  autoFocus
                  className="flex-1 px-3 py-2 text-[14px] bg-transparent outline-none"
                  style={{ ...body, background: T.panelAlt, border: `1px solid ${T.line}`, borderRadius: 4, color: T.ash }}
                />
                <button
                  onClick={saveCallsign}
                  disabled={callsignSaving}
                  className="px-4 py-2 text-[12px] font-semibold"
                  style={{ ...display, background: T.ash, color: "#0A0A0B", borderRadius: 4, opacity: callsignSaving ? 0.6 : 1 }}
                >
                  {callsignSaving ? "…" : "Save"}
                </button>
                <button
                  onClick={() => setEditingCallsign(false)}
                  className="px-3 py-2 text-[12px] font-medium"
                  style={{ ...body, color: T.ashFaint }}
                >
                  Cancel
                </button>
              </div>
              {callsignError && <p className="text-[11px] mt-2" style={{ ...body, color: T.alert }}>{callsignError}</p>}
            </div>
          )}
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
              style={{ ...display, background: T.ash, color: "#0A0A0B", borderRadius: 4, opacity: passwordSaving ? 0.6 : 1 }}
            >
              {passwordSaving ? "Updating…" : "Update Password"}
            </button>
          </form>
        )}

        <Eyebrow>Support & Preferences</Eyebrow>
        <div className="px-4 mb-6 divide-y" style={{ background: T.panel, borderRadius: 6, border: `1px solid ${T.line}`, borderColor: T.line }}>
          <ProfileRow label="Language" value="English" />
          <ProfileRow label="Currency" value="USD ($)" />
          <ProfileRow label="FAQs" />
          <ProfileRow label="Report a concern" />
        </div>

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
  const { user, profile, authLoading, signUp, signIn, signOut, updateCallsign, changePassword, uploadAvatar } = useAuth();
  const { favorites, favoritesLoading, isFavorited, toggleFavorite } = useFavorites(user?.uid);

  const [stack, setStack] = useState(["home"]);
  const [activeEventId, setActiveEventId] = useState(null);
  const [activeFieldId, setActiveFieldId] = useState(null);
  const [scheduleFilled, setScheduleFilled] = useState(true);
  const screen = stack[stack.length - 1];

  const push = (s) => setStack((prev) => [...prev, s]);
  const pop = () => setStack((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
  const goTab = (tab) => setStack([tab]);

  const activeEvent = events.find((e) => e.id === activeEventId) || null;
  const activeField =
    fields.find((f) => f.id === activeFieldId) ||
    (activeEvent ? fields.find((f) => f.id === activeEvent.fieldId) : null);
  const activeFieldEvents = activeField ? events.filter((e) => e.fieldId === activeField.id) : [];

  const openEvent = (ev) => {
    setActiveEventId(ev.id);
    setActiveFieldId(null); // clear any leftover field selection from a prior visit
    push("event");
  };
  const openField = (fieldOrId) => {
    setActiveFieldId(typeof fieldOrId === "string" ? fieldOrId : fieldOrId?.id || activeEvent?.fieldId);
    push("field");
  };
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
    content = <LoginScreen signIn={signIn} signUp={signUp} />;
  } else if (screen === "home") {
    content = (
      <HomeScreen
        events={events}
        eventsLoading={eventsLoading}
        fields={fields}
        profile={profile}
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
    content = <ScheduleScreen onNavigate={goTab} filled={scheduleFilled} setFilled={setScheduleFilled} />;
  } else if (screen === "inbox") {
    content = <InboxScreen onNavigate={goTab} />;
  } else if (screen === "profile") {
    content = (
      <ProfileScreen
        profile={profile}
        user={user}
        onNavigate={goTab}
        onLogout={handleLogout}
        updateCallsign={updateCallsign}
        changePassword={changePassword}
        uploadAvatar={uploadAvatar}
      />
    );
  }

  return (
    <div className="w-full h-screen flex flex-col" style={{ background: T.void }}>
      <style>{FONTS}</style>
      <div className="flex-1 min-h-0 relative">
        {content}
      </div>
    </div>
  );
}
