import React, { useState, useMemo } from "react";
import {
  Compass, Heart, Calendar, Inbox, User, ChevronLeft, Share2,
  Search, SlidersHorizontal, MapPin, Star, Check, Plus, Crosshair,
  ArrowRight, ChevronRight, LogOut, MessageCircle, Ticket, Radio
} from "lucide-react";
import { useFields } from "./hooks/useFields";
import { useEvents } from "./hooks/useEvents";

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
function formatDate(dateStr, endDateStr) {
  if (!dateStr) return "";
  const opts = { weekday: "short", month: "short", day: "numeric" };
  const start = new Date(dateStr + "T00:00:00");
  const startFmt = start.toLocaleDateString("en-US", opts);
  if (!endDateStr) return startFmt;
  const end = new Date(endDateStr + "T00:00:00");
  return `${startFmt} – ${end.toLocaleDateString("en-US", opts)}`;
}
const STATUS_LABEL = {
  active: null,
  closing: "FIELD CLOSING",
  relocated: "RELOCATED",
  rebranded: "REBRANDED",
  unscrapable: null,
  facebook_only: null,
};

const favoritesData = [
  { name: "Outdoor Fields", count: "3 saved", grad: "linear-gradient(160deg,#1a2018,#090b08)" },
  { name: "Tournaments", count: "2 saved", grad: "linear-gradient(160deg,#1c1c1a,#09090a)" },
  { name: "Indoor Fields", count: "3 saved", grad: "linear-gradient(160deg,#191b1e,#08090b)" },
  { name: "MilSim", count: "2 saved", grad: "linear-gradient(160deg,#191c15,#08090a)" },
];

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
    neutral: { border: T.line, color: T.ashDim },
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
function LoginScreen({ onContinue }) {
  return (
    <div className="h-full flex flex-col px-6" style={flatBg}>
      <div className="flex flex-col items-center mt-12 mb-10">
        <div className="w-14 h-14 flex items-center justify-center mb-3" style={{ background: T.panelAlt, border: `1px solid ${T.line}`, borderRadius: 4 }}>
          <Crosshair color={T.ash} size={24} strokeWidth={1.6} />
        </div>
        <span className="text-lg font-semibold" style={{ ...display, color: T.ash, letterSpacing: "0.14em" }}>ATLAS</span>
      </div>

      <h1 className="text-[23px] font-semibold mb-2" style={{ ...display, color: T.ash, letterSpacing: "-0.01em" }}>
        Welcome to Atlas
      </h1>
      <p className="text-[14px] leading-relaxed mb-6" style={{ ...body, color: T.ashDim }}>
        Discover local fields, RSVP to upcoming rec games or milsim events, and track your gameplay roster profile.
      </p>

      <div className="px-4 py-3.5 flex items-center gap-2 mb-2" style={{ background: T.panel, border: `1px solid ${T.line}`, borderRadius: 4 }}>
        <span className="font-semibold text-[15px]" style={{ ...mono, color: T.ash }}>+1</span>
        <span className="w-px h-5" style={{ background: T.line }} />
        <span className="text-[15px]" style={{ ...body, color: T.ashFaint }}>Mobile Phone Number</span>
      </div>
      <p className="text-[12px] mb-5" style={{ ...body, color: T.ashFaint }}>
        We'll send a secure SMS verification code to verify your profile. Standard carrier message rates apply.
      </p>

      <button
        onClick={onContinue}
        className="w-full py-3.5 font-semibold text-[14px] flex items-center justify-center gap-2 mb-5"
        style={{ ...display, background: T.ash, color: "#0A0A0B", borderRadius: 4 }}
      >
        Continue <ArrowRight size={16} />
      </button>

      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 h-px" style={{ background: T.line }} />
        <span className="text-[11px]" style={{ ...body, color: T.ashFaint }}>or</span>
        <div className="flex-1 h-px" style={{ background: T.line }} />
      </div>

      <div className="flex flex-col gap-2.5">
        {["Continue with Google", "Continue with Apple", "Continue with Facebook"].map((label) => (
          <button
            key={label}
            className="w-full py-3 font-medium text-[13px]"
            style={{ ...body, border: `1px solid ${T.line}`, color: T.ash, borderRadius: 4 }}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1" />
      <button className="text-center text-[12px] font-medium underline pb-2" style={{ ...body, color: T.ashDim }}>
        Need help?
      </button>
      <div className="flex justify-center pb-2">
        <div style={{ width: 120, height: 4, borderRadius: 2, background: T.line }} />
      </div>
    </div>
  );
}

function EventCard({ ev, onClick }) {
  const isToday = ev.date === new Date().toISOString().slice(0, 10);
  return (
    <button onClick={onClick} className="text-left w-full mb-4">
      <div className="h-36 relative mb-2" style={{ background: gradFor(ev.id || ev.title), borderRadius: 4 }}>
        <div className="absolute top-3 left-3 flex gap-2">
          {ev.type && <Tag>{ev.type}</Tag>}
          {isToday && <Tag tone="live">TODAY</Tag>}
        </div>
      </div>
      <div className="text-[11px] font-medium" style={{ ...body, color: T.ashFaint }}>{ev.fieldName}</div>
      <div className="text-[16px] font-semibold" style={{ ...display, color: T.ash }}>{ev.title}</div>
      <div className="text-[12px]" style={{ ...mono, color: T.ashDim }}>{formatDate(ev.date, ev.endDate)}{ev.startTime ? ` · ${ev.startTime}` : ""}</div>
      {ev.price && (
        <div className="flex items-center justify-end mt-1.5">
          <div className="text-[13px] font-semibold" style={{ ...mono, color: T.accent }}>{ev.price}</div>
        </div>
      )}
    </button>
  );
}

function HomeScreen({ onOpenEvent, onNavigate, events, eventsLoading }) {
  const cats = [
    { key: "Featured", icon: Star, active: true },
    { key: "Outdoor", icon: Compass },
    { key: "Indoor", icon: MapPin },
    { key: "Tournament", icon: Ticket },
    { key: "MilSim", icon: Crosshair },
  ];
  return (
    <div className="h-full overflow-y-auto pb-24" style={flatBg}>
      <div className="px-6 pt-2 pb-4 flex items-center justify-between">
        <div>
          <div className="text-[12px]" style={{ ...body, color: T.ashDim }}>Good morning,</div>
          <div className="text-[20px] font-semibold" style={{ ...display, color: T.ash }}>Wingman</div>
        </div>
        <div className="w-10 h-10" style={{ background: T.panelAlt, borderRadius: 4 }} />
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
        <span className="flex-1 text-[13px]" style={{ ...body, color: T.ashFaint }}>Where would you like to pew?</span>
        <SlidersHorizontal size={16} color={T.ashDim} />
      </div>

      <div className="mx-6 mb-4 flex items-center gap-2">
        <div className="flex items-center gap-1 px-3 py-1.5 text-[12px] font-medium" style={{ ...body, border: `1px solid ${T.line}`, color: T.ash, borderRadius: 4 }}>
          <MapPin size={12} /> Nearby
        </div>
        <div className="px-3 py-1.5 text-[12px] font-medium" style={{ ...body, border: `1px solid ${T.line}`, color: T.ashDim, borderRadius: 4 }}>
          Active Today
        </div>
        <div className="flex-1" />
        <div className="flex" style={{ border: `1px solid ${T.line}`, borderRadius: 4, overflow: "hidden" }}>
          <span className="px-3 py-1.5 text-[12px] font-semibold" style={{ ...body, background: T.ash, color: "#0A0A0B" }}>List</span>
          <span className="px-3 py-1.5 text-[12px] font-medium" style={{ ...body, color: T.ashDim }}>Map</span>
        </div>
      </div>

      <div className="flex gap-3 px-6 mb-5 overflow-x-auto">
        {cats.map((cat) => {
          const Icon = cat.icon;
          return (
            <div key={cat.key} className="flex flex-col items-center gap-1.5">
              <div
                className="w-14 h-14 flex items-center justify-center"
                style={{ background: cat.active ? T.ash : T.panel, border: `1px solid ${T.line}`, borderRadius: 4 }}
              >
                <Icon size={19} color={cat.active ? "#0A0A0B" : T.ashDim} strokeWidth={1.7} />
              </div>
              <span className="text-[11px] font-medium" style={{ ...body, color: T.ashDim }}>{cat.key}</span>
            </div>
          );
        })}
      </div>

      <div className="px-6 flex items-center justify-between mb-3">
        <span className="text-[15px] font-semibold" style={{ ...display, color: T.ash }}>Events Feed</span>
        <span className="text-[12px] font-medium" style={{ ...body, color: T.accent }}>Filter Map</span>
      </div>

      <div className="px-6">
        {eventsLoading ? (
          <div className="text-[13px] py-6 text-center" style={{ ...body, color: T.ashFaint }}>Loading events…</div>
        ) : events.length === 0 ? (
          <div className="text-[13px] py-6 text-center" style={{ ...body, color: T.ashFaint }}>
            No events loaded yet — check the Firestore connection.
          </div>
        ) : (
          events.map((ev) => (
            <EventCard key={ev.id} ev={ev} onClick={() => onOpenEvent(ev)} />
          ))
        )}
      </div>
      <BottomNav active="home" onNavigate={onNavigate} />
    </div>
  );
}

function EventDetailScreen({ ev, field, onBack, onOpenField }) {
  const statusLabel = field ? STATUS_LABEL[field.status] : null;
  return (
    <div className="h-full flex flex-col" style={flatBg}>
      <div className="flex-1 overflow-y-auto pb-24">
        <div className="h-60 relative" style={{ background: gradFor(ev.id || ev.title) }}>
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-5 pt-3">
            <button onClick={onBack} className="w-9 h-9 flex items-center justify-center" style={{ background: "rgba(10,10,11,0.6)", borderRadius: 4 }}>
              <ChevronLeft color={T.ash} size={19} />
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

function FieldDetailScreen({ field, fieldEvents, onBack, onNavigate, onOpenEvent }) {
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
        <div className="h-60 relative" style={{ background: gradFor(field.id) }}>
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-5 pt-3">
            <button onClick={onBack} className="w-9 h-9 flex items-center justify-center" style={{ background: "rgba(10,10,11,0.6)", borderRadius: 4 }}>
              <ChevronLeft color={T.ash} size={19} />
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
              <p className="text-[12px] leading-relaxed" style={{ ...body, color: statusLabel ? T.ashDim : T.ashDim }}>{field.notes}</p>
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
            <div className="p-4" style={{ background: T.panel, borderRadius: 6, border: `1px solid ${T.line}` }}>
              <Eyebrow>Field Location</Eyebrow>
              <div className="flex items-center gap-2 text-[12px] mb-1" style={{ ...body, color: T.ashDim }}>
                <MapPin size={13} color={T.ashFaint} /> {field.address}
              </div>
              {field.phone && (
                <div className="text-[12px]" style={{ ...mono, color: T.ashFaint }}>{field.phone}</div>
              )}
            </div>
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

function FavoritesScreen({ onNavigate }) {
  return (
    <div className="h-full overflow-y-auto pb-24" style={flatBg}>
      <ScreenHeader title="Favorites" />
      <div className="px-6 pt-5">
        <Eyebrow>Saved Categories</Eyebrow>
        <div className="grid grid-cols-2 gap-3">
          {favoritesData.map((f) => (
            <div key={f.name} className="h-32 relative p-3 flex flex-col justify-end" style={{ background: f.grad, borderRadius: 6, border: `1px solid ${T.line}` }}>
              <div className="font-semibold text-[14px]" style={{ ...display, color: T.ash }}>{f.name}</div>
              <div className="text-[11px]" style={{ ...body, color: T.ashDim }}>{f.count}</div>
            </div>
          ))}
        </div>
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

function ProfileScreen({ onNavigate, onLogout }) {
  return (
    <div className="h-full overflow-y-auto pb-24" style={flatBg}>
      <ScreenHeader title="Profile" />
      <div className="px-6 pt-4">
        <div className="p-4 flex items-center gap-3 mb-5" style={{ background: T.panel, borderRadius: 6, border: `1px solid ${T.line}` }}>
          <div className="w-14 h-14" style={{ background: T.panelAlt, borderRadius: 4 }} />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[16px] font-semibold" style={{ ...display, color: T.ash }}>Wingman</span>
              <Tag tone="accent">PRO</Tag>
            </div>
            <span className="text-[12px] font-medium underline" style={{ ...body, color: T.accent }}>Show profile</span>
          </div>
        </div>

        <Eyebrow>Account Settings</Eyebrow>
        <div className="px-4 mb-5 divide-y" style={{ background: T.panel, borderRadius: 6, border: `1px solid ${T.line}`, borderColor: T.line }}>
          <ProfileRow label="Personal Info" />
          <ProfileRow label="Account Settings" />
          <ProfileRow label="One-Click Register" value="Enabled" />
          <ProfileRow label="Payment Info" value="Visa •••• 1234" />
        </div>

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

  const [stack, setStack] = useState(["login"]);
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

  let content;
  if (screen === "login") {
    content = <LoginScreen onContinue={() => goTab("home")} />;
  } else if (screen === "home") {
    content = (
      <HomeScreen
        events={events}
        eventsLoading={eventsLoading}
        onOpenEvent={openEvent}
        onNavigate={goTab}
      />
    );
  } else if (screen === "event") {
    content = activeEvent ? (
      <EventDetailScreen ev={activeEvent} field={activeField} onBack={pop} onOpenField={() => openField(activeField)} />
    ) : (
      <div className="h-full flex items-center justify-center" style={flatBg}>
        <p className="text-[13px]" style={{ ...body, color: T.ashDim }}>Loading event…</p>
      </div>
    );
  } else if (screen === "field") {
    content = (
      <FieldDetailScreen
        field={activeField}
        fieldEvents={activeFieldEvents}
        onBack={pop}
        onNavigate={goTab}
        onOpenEvent={openEvent}
      />
    );
  } else if (screen === "favorites") {
    content = <FavoritesScreen onNavigate={goTab} />;
  } else if (screen === "schedule") {
    content = <ScheduleScreen onNavigate={goTab} filled={scheduleFilled} setFilled={setScheduleFilled} />;
  } else if (screen === "inbox") {
    content = <InboxScreen onNavigate={goTab} />;
  } else if (screen === "profile") {
    content = <ProfileScreen onNavigate={goTab} onLogout={() => goTab("login")} />;
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
