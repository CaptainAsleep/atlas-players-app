import React, { useState } from "react";
import {
  Compass, Heart, Calendar, Inbox, User, ChevronLeft, Share2,
  Search, SlidersHorizontal, MapPin, Star, Check, Plus, Crosshair,
  ArrowRight, ChevronRight, LogOut, MessageCircle, Ticket, Radio
} from "lucide-react";

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

/* ---------- mock data (same content as your screens) ---------- */
const events = [
  {
    id: "rec",
    title: "Cedar Airsoft Rec Game",
    type: "OUTDOOR",
    live: true,
    city: "Cedar Rapids, MI",
    date: "Saturday, May 11 — Staging opens 0900",
    dateShort: "Saturday, May 11, 2024",
    time: "0900 Check-in — 1000 Safety Briefing",
    rating: "4.8",
    price: "$25",
    priceValue: "25.00",
    grad: "linear-gradient(160deg,#1c1e18,#0a0a09)",
    venue: "Cedar Airsoft Field",
    host: "Cedar Airsoft Arena",
    badges: ["TOP 10% FIELD", "POPULAR"],
  },
  {
    id: "iron",
    title: "Operation Iron Forge",
    type: "MILSIM",
    live: false,
    city: "MTC Camp, MI",
    date: "Saturday, June 13 — Staging opens 0800",
    dateShort: "Saturday, June 13, 2024",
    time: "0800 Check-in — 0900 Safety Briefing",
    rating: "4.9",
    price: "$75",
    priceValue: "75.00",
    grad: "linear-gradient(160deg,#1a1a1c,#08080a)",
    venue: "MTC Camp",
    host: "MTC Camp Staff",
    badges: ["MILSIM"],
  },
];

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

function StatusBar() {
  return (
    <div className="flex items-center justify-between px-6 pt-3 pb-1 text-[13px] font-semibold" style={{ ...mono, color: T.ash }}>
      <span>12:30</span>
      <div className="flex items-center gap-1">
        <div className="flex items-end gap-[2px] h-2.5">
          {[3, 5, 7, 9].map((h, i) => (
            <div key={i} style={{ width: 3, height: h, background: T.ash, borderRadius: 1 }} />
          ))}
        </div>
        <div style={{ width: 22, height: 11, border: `1.4px solid ${T.ash}`, borderRadius: 2, padding: 1.5 }}>
          <div style={{ width: "80%", height: "100%", background: T.ash }} />
        </div>
      </div>
    </div>
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
  return (
    <button onClick={onClick} className="text-left w-full mb-4">
      <div className="h-36 relative mb-2" style={{ background: ev.grad, borderRadius: 4 }}>
        <div className="absolute top-3 left-3 flex gap-2">
          <Tag>{ev.type}</Tag>
          {ev.live && <Tag tone="live">LIVE</Tag>}
        </div>
      </div>
      <div className="text-[11px] font-medium" style={{ ...body, color: T.ashFaint }}>{ev.city}</div>
      <div className="text-[16px] font-semibold" style={{ ...display, color: T.ash }}>{ev.title}</div>
      <div className="text-[12px]" style={{ ...body, color: T.ashDim }}>{ev.date}</div>
      <div className="flex items-center justify-between mt-1.5">
        <div className="flex items-center gap-1 text-[13px] font-semibold" style={{ ...mono, color: T.ash }}>
          <Star size={13} fill={T.ash} color={T.ash} /> {ev.rating}
        </div>
        <div className="text-[13px] font-semibold" style={{ ...mono, color: T.accent }}>{ev.price} / person</div>
      </div>
    </button>
  );
}

function HomeScreen({ onOpenEvent, onNavigate }) {
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
        {events.map((ev) => (
          <EventCard key={ev.id} ev={ev} onClick={() => onOpenEvent(ev)} />
        ))}
      </div>
      <BottomNav active="home" onNavigate={onNavigate} />
    </div>
  );
}

function EventDetailScreen({ ev, onBack, onOpenField }) {
  const [showMore, setShowMore] = useState(false);
  const amenities = ["Pro Shop on site", "Chrono Verification", "HPA Air Refills", "Gear Rentals", "Accepts Credit Cards"];
  const rules = [
    "Full-seal eye protection required at all times.",
    "No blind firing over barriers; must look down sights.",
    "Call your hits clearly. Integrity is absolute.",
    "Chrono testing required for all replica tags on entry.",
    "Muzzle bags required on replicas in all staging areas.",
  ];
  return (
    <div className="h-full flex flex-col" style={flatBg}>
      <div className="flex-1 overflow-y-auto pb-24">
        <div className="h-60 relative" style={{ background: ev.grad }}>
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-5 pt-3">
            <button onClick={onBack} className="w-9 h-9 flex items-center justify-center" style={{ background: "rgba(10,10,11,0.6)", borderRadius: 4 }}>
              <ChevronLeft color={T.ash} size={19} />
            </button>
            <div className="flex gap-2">
              <button className="w-9 h-9 flex items-center justify-center" style={{ background: "rgba(10,10,11,0.6)", borderRadius: 4 }}>
                <Share2 color={T.ash} size={15} />
              </button>
              <button className="w-9 h-9 flex items-center justify-center" style={{ background: "rgba(10,10,11,0.6)", borderRadius: 4 }}>
                <Heart color={T.ash} size={15} />
              </button>
            </div>
          </div>
          <div className="absolute bottom-4 left-5 right-5">
            <div className="flex gap-2 mb-2">
              {ev.badges.map((b) => (
                <Tag key={b}>{b}</Tag>
              ))}
            </div>
            <div className="text-[24px] font-semibold" style={{ ...display, color: T.ash }}>{ev.title}</div>
          </div>
        </div>

        <div className="px-5 mt-4 flex flex-col gap-3">
          <div className="p-4 flex flex-col gap-3" style={{ background: T.panel, borderRadius: 6, border: `1px solid ${T.line}` }}>
            <div className="flex gap-3 items-start">
              <Calendar size={17} color={T.ashDim} className="mt-0.5" />
              <div>
                <div className="text-[14px] font-medium" style={{ ...body, color: T.ash }}>{ev.dateShort}</div>
                <div className="text-[12px]" style={{ ...mono, color: T.ashDim }}>{ev.time}</div>
              </div>
            </div>
            <div className="h-px" style={{ background: T.line }} />
            <button onClick={onOpenField} className="flex gap-3 items-start text-left">
              <MapPin size={17} color={T.ashDim} className="mt-0.5" />
              <div>
                <div className="text-[14px] font-medium" style={{ ...body, color: T.ash }}>{ev.venue}</div>
                <div className="text-[12px]" style={{ ...body, color: T.ashFaint }}>Cedar Rapids, Michigan — Verified Venue</div>
              </div>
            </button>
          </div>

          <div className="p-4 flex items-center gap-3" style={{ background: T.panel, borderRadius: 6, border: `1px solid ${T.line}` }}>
            <div className="w-10 h-10 flex items-center justify-center text-[13px] font-semibold" style={{ ...mono, background: T.panelAlt, color: T.ash, borderRadius: 4 }}>
              CA
            </div>
            <div className="flex-1">
              <div className="text-[14px] font-semibold" style={{ ...display, color: T.ash }}>{ev.host}</div>
              <div className="text-[11px]" style={{ ...body, color: T.ashFaint }}>Owner / Event Moderator</div>
            </div>
            <button className="px-4 py-1.5 text-[12px] font-medium flex items-center gap-1" style={{ ...body, border: `1px solid ${T.line}`, color: T.ash, borderRadius: 4 }}>
              <MessageCircle size={13} /> Message
            </button>
          </div>

          <div className="p-4" style={{ background: T.panel, borderRadius: 6, border: `1px solid ${T.line}` }}>
            <Eyebrow>Event Details</Eyebrow>
            <p className="text-[13px] leading-relaxed" style={{ ...body, color: T.ashDim }}>
              Join us for our signature Saturday Open Play. Recommended for players of all experience levels.
              {showMore && " We will coordinate a rotation of Team Deathmatch, Capture the Flag, and Attack & Defend scenarios across our forest facility. Rentals and BB purchases are fully available at the main field registration deck."}
            </p>
            <button onClick={() => setShowMore(!showMore)} className="text-[12px] font-medium mt-1" style={{ ...body, color: T.accent }}>
              {showMore ? "Show less" : "Show more"}
            </button>
          </div>

          <div className="p-4" style={{ background: T.panel, borderRadius: 6, border: `1px solid ${T.line}` }}>
            <Eyebrow>Field Amenities</Eyebrow>
            <div className="flex flex-col gap-2">
              {amenities.map((a) => (
                <div key={a} className="flex items-center gap-2 text-[13px]" style={{ ...body, color: T.ashDim }}>
                  <Check size={13} color={T.good} /> {a}
                </div>
              ))}
            </div>
          </div>

          <div className="p-4" style={{ background: T.panel, borderRadius: 6, border: `1px solid ${T.line}` }}>
            <Eyebrow>Safety Rules & Policies</Eyebrow>
            <div className="flex flex-col gap-2">
              {rules.map((r, i) => (
                <div key={r} className="flex gap-2 text-[13px]" style={{ ...body, color: T.ashDim }}>
                  <span className="font-semibold" style={{ ...mono, color: T.ashFaint }}>{String(i + 1).padStart(2, "0")}</span> {r}
                </div>
              ))}
            </div>
          </div>

          <div className="p-4" style={{ background: T.panel, borderRadius: 6, border: `1px solid ${T.line}` }}>
            <Eyebrow>Chrono & Velocity Limits</Eyebrow>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3" style={{ background: T.panelAlt, borderRadius: 4 }}>
                <div className="text-[10px] font-medium" style={{ ...body, color: T.ashFaint }}>AEG / GBB</div>
                <div className="text-[16px] font-semibold" style={{ ...mono, color: T.ash }}>400 FPS max</div>
                <div className="text-[10px]" style={{ ...body, color: T.ashFaint }}>0.20g BBs</div>
              </div>
              <div className="p-3" style={{ background: T.panelAlt, borderRadius: 4 }}>
                <div className="text-[10px] font-medium" style={{ ...body, color: T.ashFaint }}>HPA</div>
                <div className="text-[16px] font-semibold" style={{ ...mono, color: T.ash }}>1.5 J max</div>
                <div className="text-[10px]" style={{ ...body, color: T.ashFaint }}>Tournament BBs</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 border-t px-5 py-3 flex items-center justify-between" style={{ background: T.panel, borderColor: T.line }}>
        <div>
          <div className="text-[10px]" style={{ ...body, color: T.ashFaint }}>Total Entry Cost</div>
          <div className="text-[18px] font-semibold" style={{ ...mono, color: T.ash }}>
            ${ev.priceValue} <span className="text-[11px]" style={{ color: T.ashDim }}>/ person</span>
          </div>
        </div>
        <button className="px-6 py-3 font-semibold text-[13px]" style={{ ...display, background: T.ash, color: "#0A0A0B", borderRadius: 4 }}>
          Confirm RSVP
        </button>
      </div>
    </div>
  );
}

function FieldDetailScreen({ onBack, onNavigate, onOpenEvent }) {
  const scheduled = [
    { title: "Saturday Open Rec Play", date: "May 11 · 10:00 AM", price: "$25" },
    { title: "Operation Iron Forge (Milsim)", date: "May 18 · 8:00 AM", price: "$75" },
    { title: "Tactical CQB Speedsoft Bracket", date: "May 25 · 12:00 PM", price: "$35" },
  ];
  return (
    <div className="h-full flex flex-col" style={flatBg}>
      <div className="flex-1 overflow-y-auto pb-24">
        <div className="h-60 relative" style={{ background: "linear-gradient(160deg,#191c17,#08090a)" }}>
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-5 pt-3">
            <button onClick={onBack} className="w-9 h-9 flex items-center justify-center" style={{ background: "rgba(10,10,11,0.6)", borderRadius: 4 }}>
              <ChevronLeft color={T.ash} size={19} />
            </button>
            <button className="w-9 h-9 flex items-center justify-center" style={{ background: "rgba(10,10,11,0.6)", borderRadius: 4 }}>
              <SlidersHorizontal color={T.ash} size={14} />
            </button>
          </div>
          <div className="absolute bottom-4 left-5 right-5">
            <div className="flex gap-2 mb-2">
              <Tag>TOP 10% FIELD</Tag>
              <Tag tone="good">VERIFIED HOST</Tag>
            </div>
            <div className="text-[24px] font-semibold" style={{ ...display, color: T.ash }}>Cedar Airsoft Arena</div>
          </div>
        </div>

        <div className="px-5 mt-4 flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3" style={{ background: T.panel, borderRadius: 6, border: `1px solid ${T.line}` }}>
              <div className="text-[10px] font-medium" style={{ ...body, color: T.ashFaint }}>Trust Rating</div>
              <div className="text-[18px] font-semibold flex items-center gap-1" style={{ ...mono, color: T.ash }}>
                4.8 <Star size={13} fill={T.ash} color={T.ash} />
              </div>
              <div className="text-[11px]" style={{ ...body, color: T.good }}>128 active reviews</div>
            </div>
            <div className="p-3" style={{ background: T.panel, borderRadius: 6, border: `1px solid ${T.line}` }}>
              <div className="text-[10px] font-medium" style={{ ...body, color: T.ashFaint }}>Capacity</div>
              <div className="text-[18px] font-semibold" style={{ ...mono, color: T.ash }}>150 Players</div>
              <div className="text-[11px]" style={{ ...body, color: T.ashDim }}>Main staging area</div>
            </div>
          </div>

          <div className="p-4" style={{ background: T.panel, borderRadius: 6, border: `1px solid ${T.line}` }}>
            <Eyebrow>About the Field</Eyebrow>
            <p className="text-[13px] leading-relaxed" style={{ ...body, color: T.ashDim }}>
              Cedar Airsoft is Michigan's premier tactical simulated skirmish field. Spanning over 25 acres of lush woodlands, custom built outpost bases, trench systems, and close quarter urban environments.
            </p>
          </div>

          <div className="p-4" style={{ background: T.panel, borderRadius: 6, border: `1px solid ${T.line}` }}>
            <Eyebrow>Scheduled Events</Eyebrow>
            <div className="flex flex-col">
              {scheduled.map((s, i) => (
                <button
                  key={s.title}
                  onClick={onOpenEvent}
                  className="flex items-center gap-3 py-2.5 text-left"
                  style={{ borderTop: i > 0 ? `1px solid ${T.line}` : "none" }}
                >
                  <div className="w-11 h-11" style={{ background: T.panelAlt, borderRadius: 4 }} />
                  <div className="flex-1">
                    <div className="text-[13px] font-medium" style={{ ...body, color: T.ash }}>{s.title}</div>
                    <div className="text-[11px]" style={{ ...body, color: T.ashFaint }}>{s.date}</div>
                  </div>
                  <div className="text-[13px] font-semibold" style={{ ...mono, color: T.accent }}>{s.price}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="p-4" style={{ background: T.panel, borderRadius: 6, border: `1px solid ${T.line}` }}>
            <Eyebrow>Field Location</Eyebrow>
            <div className="flex items-center gap-2 text-[12px] mb-3" style={{ ...body, color: T.ashDim }}>
              <MapPin size={13} color={T.ashFaint} /> 4900 Cedar Rapids Road, MI 49301
            </div>
            <div className="h-32" style={{ background: "linear-gradient(160deg,#15170f,#08090a)", borderRadius: 4 }} />
          </div>

          <button className="w-full py-3 font-medium text-[13px]" style={{ ...body, border: `1px solid ${T.line}`, color: T.ash, borderRadius: 4 }}>
            Message Venue
          </button>
          <button className="w-full text-center py-2 font-medium text-[12px]" style={{ ...body, color: T.alert }}>
            Report Venue Profile
          </button>
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
  const [stack, setStack] = useState(["login"]);
  const [activeEvent, setActiveEvent] = useState(events[0]);
  const [scheduleFilled, setScheduleFilled] = useState(true);
  const screen = stack[stack.length - 1];

  const push = (s) => setStack((prev) => [...prev, s]);
  const pop = () => setStack((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
  const goTab = (tab) => setStack([tab]);

  let content;
  if (screen === "login") {
    content = <LoginScreen onContinue={() => goTab("home")} />;
  } else if (screen === "home") {
    content = (
      <HomeScreen
        onOpenEvent={(ev) => {
          setActiveEvent(ev);
          push("event");
        }}
        onNavigate={goTab}
      />
    );
  } else if (screen === "event") {
    content = <EventDetailScreen ev={activeEvent} onBack={pop} onOpenField={() => push("field")} />;
  } else if (screen === "field") {
    content = <FieldDetailScreen onBack={pop} onNavigate={goTab} onOpenEvent={() => push("event")} />;
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
      {screen !== "login" && <StatusBar />}
      <div className="flex-1 min-h-0 relative">
        {content}
      </div>
    </div>
  );
}
