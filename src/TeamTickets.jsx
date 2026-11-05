// Team Bookings (2026-11-05) — buy tickets for others, hand them out, claim
// one someone bought you, give one back, and give a leftover voucher away.
// Scope: project doc claude/atlas-team-bookings-scope.md. Server side lives
// in functions/index.js ("Team Bookings" section).
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Ticket, X, Search, Users, ChevronRight, Check } from "lucide-react";
import { useTheme } from "./hooks/useTheme";
import { currentPriceText, eventCloseMs, stateFromCity } from "./lib/eventClose";
import {
  MAX_TEAM_TICKETS, msOf, countdownLabel, callableMessage,
  createTeamTicketCheckout, assignTeamTicket, acceptTeamTicket, returnTeamTicket,
  searchTeamTicketRecipients, giveTeamTicketVoucher,
} from "./hooks/useTeamTickets";

const fmtUsd = (cents) => {
  const v = (cents || 0) / 100;
  return Number.isInteger(v) ? `$${v}` : `$${v.toFixed(2)}`;
};

function Label({ children }) {
  const { T, mono } = useTheme();
  return (
    <div className="text-[10px] font-semibold uppercase mb-1.5" style={{ ...mono, color: T.ashFaint, letterSpacing: "0.06em" }}>{children}</div>
  );
}

function Sheet({ title, subtitle, onClose, busy, children }) {
  const { T, display, body } = useTheme();
  return (
    <div onClick={() => !busy && onClose()} className="fixed inset-0 flex items-end" style={{ background: "rgba(0,0,0,0.5)", zIndex: 1600 }}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-h-[88vh] overflow-y-auto" style={{ background: T.void, borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
        <div className="sticky top-0 px-5 pt-4 pb-3 flex items-center justify-between" style={{ background: T.void, borderBottom: `1px solid ${T.line}`, zIndex: 1 }}>
          <div className="min-w-0">
            <h2 className="text-[16px] font-semibold" style={{ ...display, color: T.ash }}>{title}</h2>
            {subtitle && <p className="text-[11px] truncate" style={{ ...body, color: T.ashFaint }}>{subtitle}</p>}
          </div>
          <button onClick={() => !busy && onClose()} className="w-8 h-8 flex items-center justify-center flex-shrink-0">
            <X size={18} color={T.ashDim} />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

function PrimaryButton({ children, onClick, disabled, tone }) {
  const { T, display } = useTheme();
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full py-3 text-[13px] font-semibold"
      style={{ ...display, background: tone === "alert" ? T.alert : T.cta, color: T.inverse, borderRadius: T.rPill, boxShadow: T.shadowMd, opacity: disabled ? 0.5 : 1 }}
    >
      {children}
    </button>
  );
}

function SecondaryButton({ children, onClick, disabled, small }) {
  const { T, display } = useTheme();
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={small ? "px-3 py-1.5 text-[11px] font-semibold" : "w-full py-2.5 text-[13px] font-semibold"}
      style={{ ...display, background: T.panelAlt, color: T.ash, border: `1px solid ${T.line}`, borderRadius: T.rPill, opacity: disabled ? 0.5 : 1 }}
    >
      {children}
    </button>
  );
}

function Avatar({ url, name, size = 32 }) {
  const { T, display } = useTheme();
  if (url) return <div className="flex-shrink-0" style={{ width: size, height: size, backgroundImage: `url("${url}")`, backgroundSize: "cover", backgroundPosition: "center", borderRadius: 999, border: `1px solid ${T.line}` }} />;
  return (
    <div className="flex-shrink-0 flex items-center justify-center text-[12px] font-semibold" style={{ ...display, width: size, height: size, background: T.panelAlt, borderRadius: 999, color: T.ash }}>
      {String(name || "?").charAt(0).toUpperCase()}
    </div>
  );
}

// The "who's this for" search. Adults by callsign, the buyer's own children,
// and kids on the buyer's teams (server decides). includeChildren=false for
// vouchers. excludeKeys: people already picked in this sheet.
export function recipientKeyOf(r) {
  if (!r) return null;
  if (r.kind === "self") return "self";
  if (r.kind === "player") return `u:${r.uid}`;
  if (r.kind === "child") return `c:${r.publicId}`;
  return `d:${r.dependentId}`;
}

function RecipientSearch({ onPick, includeChildren = true, excludeKeys = [], placeholder }) {
  const { T, body, mono } = useTheme();
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const seq = useRef(0);
  useEffect(() => {
    const term = q.trim();
    if (term.length < (includeChildren ? 1 : 2)) {
      setResults([]);
      setLoading(false);
      return undefined;
    }
    const mine = ++seq.current;
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await searchTeamTicketRecipients({ query: term, includeChildren });
        if (mine === seq.current) {
          setResults(res?.results || []);
          setError("");
        }
      } catch (err) {
        if (mine === seq.current) setError(callableMessage(err, "Search isn't working right now — try again."));
      } finally {
        if (mine === seq.current) setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [q, includeChildren]);
  const shown = results.filter((r) => !excludeKeys.includes(recipientKeyOf(r)));
  return (
    <div>
      <div className="flex items-center gap-2 px-3 py-2.5 mb-2" style={{ background: T.panelAlt, border: `1px solid ${T.line}`, borderRadius: T.rTight }}>
        <Search size={15} color={T.ashFaint} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={placeholder || "Search by callsign"}
          className="flex-1 bg-transparent outline-none text-[14px]"
          style={{ ...body, color: T.ash }}
          autoFocus
        />
      </div>
      {error && <p className="text-[11px] mb-2" style={{ ...body, color: T.alert }}>{error}</p>}
      {loading && <p className="text-[12px] py-2" style={{ ...body, color: T.ashFaint }}>Searching…</p>}
      {!loading && q.trim().length >= 2 && shown.length === 0 && !error && (
        <p className="text-[12px] py-2" style={{ ...body, color: T.ashFaint }}>No players found.{includeChildren ? " Kids only show up if they're on one of your teams." : ""}</p>
      )}
      <div className="flex flex-col">
        {shown.map((r) => (
          <button key={recipientKeyOf(r)} onClick={() => onPick(r)} className="flex items-center gap-3 py-2 text-left" style={{ borderTop: `1px solid ${T.line}` }}>
            <Avatar url={r.avatarUrl} name={r.callsign} />
            <div className="flex-1 min-w-0">
              <div className="text-[14px] font-medium truncate" style={{ ...body, color: T.ash }}>{r.callsign}</div>
              {(r.yourChild || r.kind === "child" || r.teamName) && (
                <div className="text-[10px] uppercase" style={{ ...mono, color: T.ashFaint, letterSpacing: "0.04em" }}>
                  {r.yourChild ? "Your child profile" : r.kind === "child" ? "On your team" : r.teamName}
                </div>
              )}
            </div>
            <ChevronRight size={15} color={T.ashFaint} />
          </button>
        ))}
      </div>
    </div>
  );
}

function priceState(ev, field) {
  return ev.isMajor ? ev.venueState : stateFromCity(field?.city);
}
function basePriceCents(ev, field) {
  const text = currentPriceText(ev, priceState(ev, field));
  return Math.round(parseFloat(String(text || "").replace(/[^0-9.]/g, "")) * 100) || 0;
}

// Whether this event can be bought for others: paid, field event (not a
// Major, no team/role selection groups), claimed field, still open.
export function canBuyForOthers(ev, field) {
  if (!ev || ev.canceled || ev.isMajor) return false;
  if (Array.isArray(ev.selectionGroups) && ev.selectionGroups.length > 0) return false;
  if (!field?.ownerId) return false;
  const close = eventCloseMs(ev, priceState(ev, field));
  if (close != null && Date.now() >= close) return false;
  return basePriceCents(ev, field) > 0;
}

// --- Buy -----------------------------------------------------------------------
function BuyTeamTicketsSheet({ ev, field, profile, myBooking, onClose }) {
  const { T, display, body, mono } = useTheme();
  const priceOptions = ev.priceOptions && Array.isArray(ev.priceOptions.choices) && ev.priceOptions.choices.length > 0 ? ev.priceOptions : null;
  const [quantity, setQuantity] = useState(2);
  const [choiceId, setChoiceId] = useState(null);
  const [includeMe, setIncludeMe] = useState(!myBooking);
  const [picks, setPicks] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [checkoutUrl, setCheckoutUrl] = useState(null);
  const [opened, setOpened] = useState(false);

  const choice = priceOptions?.choices.find((c) => c.id === choiceId) || null;
  const unitCents = basePriceCents(ev, field) + (choice?.priceCents || 0);
  const choiceMissing = !!priceOptions?.required && !choice;
  const slotsForOthers = quantity - (includeMe ? 1 : 0);
  const recipients = [...(includeMe ? [{ kind: "self" }] : []), ...picks];

  useEffect(() => {
    if (picks.length > slotsForOthers) setPicks((p) => p.slice(0, Math.max(0, slotsForOthers)));
  }, [slotsForOthers, picks.length]);

  const start = async () => {
    setBusy(true);
    setError("");
    try {
      const res = await createTeamTicketCheckout({
        eventId: ev.id,
        quantity,
        selectedChoiceId: choiceId,
        recipients: recipients.map((r) => (r.kind === "self" ? { kind: "self" } : r.kind === "player" ? { kind: "player", uid: r.uid } : r.kind === "child" ? { kind: "child", publicId: r.publicId } : { kind: "ownChild", dependentId: r.dependentId })),
      });
      setCheckoutUrl(res.url);
    } catch (err) {
      console.error("createTeamTicketCheckout failed:", err);
      setError(callableMessage(err, "Couldn't start checkout — try again."));
    } finally {
      setBusy(false);
    }
  };

  if (checkoutUrl) {
    return (
      <Sheet title="Almost done" subtitle={`${quantity} ticket${quantity === 1 ? "" : "s"} · ${ev.title}`} onClose={onClose}>
        <p className="text-[13px] mb-4" style={{ ...body, color: T.ashDim }}>
          Payment opens in a new tab. Once it goes through, your tickets show up on this event page, and everyone you picked gets an email to claim theirs.
        </p>
        <a
          href={checkoutUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => setOpened(true)}
          className="block w-full py-3 text-[13px] font-semibold text-center mb-2"
          style={{ ...display, background: T.cta, color: T.inverse, borderRadius: T.rPill, boxShadow: T.shadowMd }}
        >
          Continue to Payment
        </a>
        {opened && <SecondaryButton onClick={onClose}>Done</SecondaryButton>}
      </Sheet>
    );
  }

  return (
    <Sheet title="Buy tickets for others" subtitle={`${ev.title} · ${ev.fieldName || field?.name || ""}`} onClose={onClose} busy={busy}>
      {priceOptions && (
        <div className="mb-4">
          <Label>{priceOptions.label}{priceOptions.required ? "" : " (optional)"} — applies to every ticket</Label>
          <div className="flex flex-col gap-1.5">
            {priceOptions.choices.map((c) => (
              <button key={c.id} onClick={() => setChoiceId(choiceId === c.id ? null : c.id)} className="flex items-center justify-between px-3 py-2.5 text-left" style={{ background: choiceId === c.id ? T.tint : T.panel, border: `1px solid ${choiceId === c.id ? T.accent : T.line}`, borderRadius: T.rTight }}>
                <span className="text-[13px]" style={{ ...body, color: T.ash }}>{c.label}</span>
                <span className="text-[12px]" style={{ ...mono, color: T.ashDim }}>{c.priceCents ? `+${fmtUsd(c.priceCents)}` : ""}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <Label>How many tickets</Label>
      <div className="flex items-center justify-between p-3 mb-4" style={{ background: T.panel, borderRadius: T.rCard, boxShadow: T.shadowSm }}>
        <button onClick={() => setQuantity((n) => Math.max(1, n - 1))} className="w-9 h-9 text-[18px] font-semibold" style={{ ...display, background: T.panelAlt, borderRadius: T.rPill, color: T.ash }}>−</button>
        <div className="text-center">
          <div className="text-[22px] font-semibold" style={{ ...display, color: T.ash }}>{quantity}</div>
          <div className="text-[11px]" style={{ ...body, color: T.ashFaint }}>{fmtUsd(unitCents)} each + Atlas fee per ticket</div>
        </div>
        <button onClick={() => setQuantity((n) => Math.min(MAX_TEAM_TICKETS, n + 1))} className="w-9 h-9 text-[18px] font-semibold" style={{ ...display, background: T.panelAlt, borderRadius: T.rPill, color: T.ash }}>+</button>
      </div>

      <Label>Who they're for</Label>
      <div className="mb-2" style={{ background: T.panel, borderRadius: T.rCard, boxShadow: T.shadowSm }}>
        {!myBooking && (
          <label className="flex items-center gap-3 px-3 py-2.5">
            <input type="checkbox" checked={includeMe} onChange={(e) => setIncludeMe(e.target.checked)} />
            <span className="text-[13px]" style={{ ...body, color: T.ash }}>One of them is for me ({profile?.callsign || "you"})</span>
          </label>
        )}
        {picks.map((p) => (
          <div key={recipientKeyOf(p)} className="flex items-center gap-3 px-3 py-2" style={{ borderTop: `1px solid ${T.line}` }}>
            <Avatar url={p.avatarUrl} name={p.callsign} size={28} />
            <div className="flex-1 text-[13px]" style={{ ...body, color: T.ash }}>{p.callsign}</div>
            <button onClick={() => setPicks((list) => list.filter((x) => recipientKeyOf(x) !== recipientKeyOf(p)))}><X size={15} color={T.ashFaint} /></button>
          </div>
        ))}
        {picks.length < slotsForOthers && (
          <button onClick={() => setShowSearch(true)} className="w-full flex items-center gap-2 px-3 py-2.5 text-left" style={{ borderTop: `1px solid ${T.line}` }}>
            <Users size={15} color={T.accent} />
            <span className="text-[13px] font-medium" style={{ ...body, color: T.accent }}>Add a player</span>
          </button>
        )}
      </div>
      <p className="text-[11px] mb-4" style={{ ...body, color: T.ashFaint }}>
        {slotsForOthers - picks.length > 0
          ? `${slotsForOthers - picks.length} ticket${slotsForOthers - picks.length === 1 ? "" : "s"} left unassigned — you can hand ${slotsForOthers - picks.length === 1 ? "it" : "them"} out after paying.`
          : "Everyone's picked."}
      </p>

      <div className="p-3 mb-4 text-[12px] leading-relaxed" style={{ ...body, color: T.ashDim, background: T.panelAlt, borderRadius: T.rTight, border: `1px solid ${T.line}` }}>
        Each person claims their ticket by signing the field's waiver within 5 days (or by game day, if that's sooner). Tickets aren't refundable: one that's declined, given back, or still unclaimed when the event ends becomes a <strong>{fmtUsd(unitCents)} voucher for you</strong> at {ev.fieldName || field?.name || "this field"}, which you can use or give to another player.
      </div>

      {error && <p className="text-[12px] mb-2" style={{ ...body, color: T.alert }}>{error}</p>}
      <PrimaryButton onClick={start} disabled={busy || choiceMissing}>
        {busy ? "Starting checkout…" : choiceMissing ? `Pick a ${priceOptions.label}` : `Buy ${quantity} ticket${quantity === 1 ? "" : "s"} — ${fmtUsd(unitCents * quantity)} + fees`}
      </PrimaryButton>

      {showSearch && (
        <Sheet title="Add a player" subtitle="Search by callsign" onClose={() => setShowSearch(false)}>
          <RecipientSearch
            excludeKeys={picks.map(recipientKeyOf)}
            onPick={(r) => {
              setPicks((list) => [...list, r]);
              setShowSearch(false);
            }}
          />
        </Sheet>
      )}
    </Sheet>
  );
}

// --- Claim -----------------------------------------------------------------------
function ClaimTicketSheet({ ev, field, holding, profile, user, myBooking, dependents, signature, signedDependentIds, signedAbsentDependentIds, signWaiver, guardianNoticeText, guardianAbsentNoticeText, onClose }) {
  const { T, display, body, mono } = useTheme();
  const isChild = holding.kind === "child";
  const dep = isChild ? (dependents || []).find((d) => d.id === holding.dependentId) : null;
  const guardianPlaying = !!myBooking && myBooking.guardianPlaying !== false;
  const needsSignature = !!ev.waiver && (
    isChild
      ? !signedDependentIds.includes(holding.dependentId) || (!guardianPlaying && !signedAbsentDependentIds.includes(holding.dependentId))
      : !signature
  );
  const [scrolledToEnd, setScrolledToEnd] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const legalName = profile?.firstName && profile?.lastName ? `${profile.firstName} ${profile.lastName}` : profile?.callsign || "";

  const claim = async () => {
    setBusy(true);
    setError("");
    try {
      if (needsSignature) {
        await signWaiver({
          uid: user.uid,
          eventId: ev.id,
          fieldId: ev.fieldId ?? null,
          hostOwnerId: ev.hostOwnerId ?? null,
          signedName: legalName.trim(),
          waiverVersion: ev.waiver.version,
          dependents: isChild && dep ? [{ id: dep.id, fullName: dep.fullName }] : [],
          guardianAbsent: isChild && !guardianPlaying,
        });
      }
      await acceptTeamTicket({ ticketId: holding.ticketId });
      onClose(true);
    } catch (err) {
      console.error("claim team ticket failed:", err);
      setError(callableMessage(err, "Couldn't claim the ticket — try again."));
      setBusy(false);
    }
  };

  const who = isChild ? holding.assigneeCallsign : "you";
  return (
    <Sheet title={isChild ? `Claim ${holding.assigneeCallsign}'s ticket` : "Claim your ticket"} subtitle={`${holding.buyerCallsign} bought ${who} a ticket · ${ev.title}`} onClose={() => onClose(false)} busy={busy}>
      {isChild && !dep && (
        <p className="text-[12px] mb-3" style={{ ...body, color: T.alert }}>This child profile isn't on your account anymore.</p>
      )}
      {needsSignature ? (
        <>
          <div onScroll={(e) => { const el = e.target; if (el.scrollHeight - el.scrollTop - el.clientHeight < 20) setScrolledToEnd(true); }} className="text-[12px] leading-relaxed p-3 mb-3" style={{ ...body, color: T.ashDim, background: T.panelAlt, borderRadius: 4, maxHeight: 220, overflowY: "auto", whiteSpace: "pre-wrap" }}>
            {ev.waiver.text}
          </div>
          {!scrolledToEnd && <p className="text-[11px] mb-3" style={{ ...body, color: T.ashFaint }}>Scroll to the bottom to continue.</p>}
          {scrolledToEnd && (
            <>
              {isChild && (
                <div className="p-3 mb-3 text-[12px] leading-relaxed" style={{ ...body, color: T.ashDim, background: T.panelAlt, borderRadius: 4, border: `1px solid ${T.line}` }}>
                  <div className="text-[10px] font-semibold uppercase mb-1" style={{ ...mono, color: T.ashFaint, letterSpacing: "0.04em" }}>Signing for {holding.assigneeCallsign}</div>
                  {guardianNoticeText}
                  {!guardianPlaying && (
                    <div className="mt-2 pt-2" style={{ borderTop: `1px solid ${T.line}` }}>
                      <div className="text-[10px] font-semibold uppercase mb-1" style={{ ...mono, color: T.ashFaint, letterSpacing: "0.04em" }}>You are not playing</div>
                      {guardianAbsentNoticeText(ev.fieldName || field?.name)}
                    </div>
                  )}
                </div>
              )}
              <label className="flex items-start gap-2 mb-3 text-[12px]" style={{ ...body, color: T.ashDim }}>
                <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5" />
                {isChild ? (guardianPlaying ? "I have read and agree to the terms above, and to the guardian notice." : "I have read and agree to the terms above, the guardian notice, and the not-playing section.") : "I have read and agree to the terms above."}
              </label>
              <Label>Signing as</Label>
              <div className="px-3 py-2.5 mb-3 text-[14px] font-medium" style={{ ...display, background: T.panelAlt, border: `1px solid ${T.line}`, borderRadius: 4, color: legalName ? T.ash : T.alert }}>
                {legalName || "Add your name in My Account to sign"}
              </div>
              {error && <p className="text-[12px] mb-2" style={{ ...body, color: T.alert }}>{error}</p>}
              <PrimaryButton onClick={claim} disabled={!agreed || !legalName.trim() || busy || (isChild && !dep)}>
                {busy ? "Signing & claiming…" : "Sign & Claim Ticket"}
              </PrimaryButton>
            </>
          )}
        </>
      ) : (
        <>
          <p className="text-[13px] mb-4" style={{ ...body, color: T.ashDim }}>
            {ev.waiver ? "Your waiver's already signed." : "This event has no waiver to sign."} Claim the ticket to lock in {isChild ? `${holding.assigneeCallsign}'s` : "your"} spot.
          </p>
          {error && <p className="text-[12px] mb-2" style={{ ...body, color: T.alert }}>{error}</p>}
          <PrimaryButton onClick={claim} disabled={busy || (isChild && !dep)}>{busy ? "Claiming…" : "Claim Ticket"}</PrimaryButton>
        </>
      )}
    </Sheet>
  );
}

function ConfirmSheet({ title, message, confirmLabel, onConfirm, onClose }) {
  const { T, body } = useTheme();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const go = async () => {
    setBusy(true);
    setError("");
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      console.error(title, err);
      setError(callableMessage(err, "That didn't work — try again."));
      setBusy(false);
    }
  };
  return (
    <Sheet title={title} onClose={onClose} busy={busy}>
      <p className="text-[13px] mb-4" style={{ ...body, color: T.ashDim }}>{message}</p>
      {error && <p className="text-[12px] mb-2" style={{ ...body, color: T.alert }}>{error}</p>}
      <div className="flex flex-col gap-2">
        <PrimaryButton onClick={go} disabled={busy} tone="alert">{busy ? "…" : confirmLabel}</PrimaryButton>
        <SecondaryButton onClick={onClose} disabled={busy}>Never mind</SecondaryButton>
      </div>
    </Sheet>
  );
}

const STATUS_LABEL = { unassigned: "Not assigned", pending: "Waiting", accepted: "Claimed", vouchered: "Voucher" };

// --- Event page block --------------------------------------------------------------
// Rendered inside EventDetailScreen. Shows (a) any ticket waiting for / held
// by this player for this event, and (b) the buyer's own tickets plus the
// "Buy tickets for others" entry point.
export function EventTeamTickets({ ev, field, user, profile, myBooking, holdings = [], myTickets = [], dependents = [], signature, signedDependentIds = [], signedAbsentDependentIds = [], signWaiver, guardianNoticeText, guardianAbsentNoticeText }) {
  const { T, display, body, mono } = useTheme();
  const [buyOpen, setBuyOpen] = useState(false);
  const [claimFor, setClaimFor] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [assignFor, setAssignFor] = useState(null);
  const [rowError, setRowError] = useState("");
  const mine = holdings.filter((h) => h.eventId === ev.id);
  const buyable = !!user && canBuyForOthers(ev, field);
  const closed = (() => { const c = eventCloseMs(ev, priceState(ev, field)); return c != null && Date.now() >= c; })();
  if (!user || (mine.length === 0 && myTickets.length === 0 && !buyable)) return null;

  const counts = myTickets.reduce((acc, t) => ({ ...acc, [t.status]: (acc[t.status] || 0) + 1 }), {});

  return (
    <>
      {mine.map((h) => {
        const pending = h.status === "pending";
        const forChild = h.kind === "child";
        const deadlineMs = msOf(h.deadlineAt);
        return (
          <div key={h.id} className="p-4" style={{ background: pending ? T.tint : T.panel, borderRadius: T.rCard, boxShadow: T.shadowMd, border: pending ? `1px solid ${T.accent}` : "none" }}>
            <div className="flex items-center gap-2 mb-1">
              <Ticket size={16} color={T.accent} />
              <div className="text-[14px] font-semibold" style={{ ...display, color: T.ash }}>
                {h.selfPurchase
                  ? (forChild ? `${h.assigneeCallsign}'s ticket` : "Your ticket")
                  : `${h.buyerCallsign} bought ${forChild ? h.assigneeCallsign : "you"} a ticket`}
              </div>
            </div>
            {pending ? (
              <>
                <p className="text-[12px] mb-3" style={{ ...body, color: T.ashDim }}>
                  {ev.waiver ? `Sign the waiver${forChild ? ` for ${h.assigneeCallsign}` : ""} to claim it.` : "Claim it to lock in the spot."}{" "}
                  <strong style={{ color: T.alert }}>{countdownLabel(deadlineMs)}</strong>
                </p>
                <div className="flex gap-2">
                  <div className="flex-1"><PrimaryButton onClick={() => setClaimFor(h)}>Claim Ticket</PrimaryButton></div>
                  {!h.selfPurchase && (
                    <div className="flex-1">
                      <SecondaryButton onClick={() => setConfirm({
                        title: "Decline this ticket?",
                        message: `${h.buyerCallsign} gets it back as a voucher. You can't undo this.`,
                        label: "Decline",
                        run: () => returnTeamTicket({ ticketId: h.ticketId }),
                      })}>Decline</SecondaryButton>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <p className="text-[12px] mb-3" style={{ ...body, color: T.ashDim }}>
                  {forChild ? `${h.assigneeCallsign} is booked` : "You're booked"}{h.selfPurchase ? "." : ` — ${h.buyerCallsign} covered it.`}
                </p>
                {!closed && (
                  <SecondaryButton small onClick={() => setConfirm({
                    title: "Can't make it?",
                    message: h.selfPurchase
                      ? `This gives up ${forChild ? `${h.assigneeCallsign}'s` : "your"} spot. The ticket becomes a voucher for you at ${h.fieldName || "this field"}.`
                      : `This gives up ${forChild ? `${h.assigneeCallsign}'s` : "your"} spot, and ${h.buyerCallsign} gets the ticket back as a voucher. You can't undo this.`,
                    label: "Give up the spot",
                    run: () => returnTeamTicket({ ticketId: h.ticketId }),
                  })}>Can't make it?</SecondaryButton>
                )}
              </>
            )}
          </div>
        );
      })}

      {(myTickets.length > 0 || buyable) && (
        <div className="p-4" style={{ background: T.panel, borderRadius: T.rCard, boxShadow: T.shadowMd }}>
          <div className="flex items-center justify-between mb-1">
            <Label>Tickets you bought for others{myTickets.length ? ` (${myTickets.length})` : ""}</Label>
          </div>
          {myTickets.length === 0 ? (
            <p className="text-[12px] mb-3" style={{ ...body, color: T.ashDim }}>Buying for your team? Get up to {MAX_TEAM_TICKETS} tickets in one checkout and hand them out.</p>
          ) : (
            <>
              <p className="text-[11px] mb-2" style={{ ...mono, color: T.ashFaint }}>
                {["accepted", "pending", "unassigned", "vouchered"].filter((s) => counts[s]).map((s) => `${counts[s]} ${STATUS_LABEL[s].toLowerCase()}`).join(" · ")}
              </p>
              <div className="flex flex-col mb-3">
                {myTickets.map((t, i) => {
                  const canEdit = !closed && !ev.canceled && (t.status === "unassigned" || t.status === "pending");
                  return (
                    <div key={t.id} className="flex items-center gap-3 py-2" style={{ borderTop: i ? `1px solid ${T.line}` : "none" }}>
                      <Avatar url={t.assigneeAvatarUrl} name={t.assigneeCallsign || "#"} size={28} />
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-medium truncate" style={{ ...body, color: t.assigneeCallsign ? T.ash : T.ashFaint }}>
                          {t.assigneeCallsign || `Ticket ${i + 1} — not assigned`}
                        </div>
                        <div className="text-[10px] uppercase" style={{ ...mono, color: t.status === "accepted" ? T.good : t.status === "pending" ? T.accent : T.ashFaint, letterSpacing: "0.04em" }}>
                          {t.status === "pending" ? `Waiting · ${countdownLabel(msOf(t.deadlineAt))}` : t.status === "vouchered" ? `Voucher ${fmtUsd(t.entryPriceCents)}` : STATUS_LABEL[t.status]}
                        </div>
                      </div>
                      {t.status === "accepted" && <Check size={15} color={T.good} />}
                      {canEdit && (
                        <SecondaryButton small onClick={() => { setRowError(""); setAssignFor(t); }}>{t.status === "unassigned" ? "Assign" : "Change"}</SecondaryButton>
                      )}
                    </div>
                  );
                })}
              </div>
              {rowError && <p className="text-[12px] mb-2" style={{ ...body, color: T.alert }}>{rowError}</p>}
            </>
          )}
          {buyable && <SecondaryButton onClick={() => setBuyOpen(true)}>{myTickets.length ? "Buy more tickets" : "Buy tickets for others"}</SecondaryButton>}
        </div>
      )}

      {buyOpen && <BuyTeamTicketsSheet ev={ev} field={field} profile={profile} myBooking={myBooking} onClose={() => setBuyOpen(false)} />}
      {claimFor && (
        <ClaimTicketSheet
          ev={ev} field={field} holding={claimFor} profile={profile} user={user} myBooking={myBooking}
          dependents={dependents} signature={signature} signedDependentIds={signedDependentIds} signedAbsentDependentIds={signedAbsentDependentIds}
          signWaiver={signWaiver} guardianNoticeText={guardianNoticeText} guardianAbsentNoticeText={guardianAbsentNoticeText}
          onClose={() => setClaimFor(null)}
        />
      )}
      {confirm && (
        <ConfirmSheet title={confirm.title} message={confirm.message} confirmLabel={confirm.label} onConfirm={confirm.run} onClose={() => setConfirm(null)} />
      )}
      {assignFor && (
        <AssignSheet ticket={assignFor} myTickets={myTickets} onClose={() => setAssignFor(null)} onError={setRowError} />
      )}
    </>
  );
}

function AssignSheet({ ticket, myTickets, onClose }) {
  const { T, body } = useTheme();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const taken = myTickets
    .filter((t) => t.id !== ticket.id && (t.status === "pending" || t.status === "accepted"))
    .map((t) => (t.assigneeUid ? `u:${t.assigneeUid}` : t.assigneePublicId ? `c:${t.assigneePublicId}` : null))
    .filter(Boolean);
  const run = async (recipient) => {
    setBusy(true);
    setError("");
    try {
      await assignTeamTicket({ ticketId: ticket.id, recipient });
      onClose();
    } catch (err) {
      console.error("assignTeamTicket failed:", err);
      setError(callableMessage(err, "Couldn't update that ticket — try again."));
      setBusy(false);
    }
  };
  return (
    <Sheet title={ticket.status === "pending" ? `Change who this ticket is for` : "Who's this ticket for?"} subtitle={ticket.status === "pending" ? `Currently waiting on ${ticket.assigneeCallsign}` : ticket.eventTitle} onClose={onClose} busy={busy}>
      {error && <p className="text-[12px] mb-2" style={{ ...body, color: T.alert }}>{error}</p>}
      {busy && <p className="text-[12px] mb-2" style={{ ...body, color: T.ashFaint }}>Saving…</p>}
      <div className="flex gap-2 mb-3">
        {!taken.includes("self") && <SecondaryButton small onClick={() => run({ kind: "self" })} disabled={busy}>It's for me</SecondaryButton>}
        {ticket.status === "pending" && <SecondaryButton small onClick={() => run(null)} disabled={busy}>Take it back</SecondaryButton>}
      </div>
      <RecipientSearch
        excludeKeys={taken}
        onPick={(r) => run(r.kind === "player" ? { kind: "player", uid: r.uid } : r.kind === "child" ? { kind: "child", publicId: r.publicId } : { kind: "ownChild", dependentId: r.dependentId })}
      />
    </Sheet>
  );
}

// --- Home screen card ---------------------------------------------------------------
// Prominent countdown for every ticket waiting to be claimed (decided
// 2026-10-30). Tapping opens the event, where the claim block lives.
export function TicketOffersCard({ holdings = [], onOpenEvent }) {
  const { T, display, body, mono } = useTheme();
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 60000);
    return () => clearInterval(id);
  }, []);
  const waiting = useMemo(
    () => holdings.filter((h) => h.status === "pending").sort((a, b) => (msOf(a.deadlineAt) || 0) - (msOf(b.deadlineAt) || 0)),
    [holdings]
  );
  if (waiting.length === 0) return null;
  return (
    <div className="mx-6 mb-4 p-4" style={{ background: T.panel, borderRadius: T.rCard, boxShadow: T.shadowLg, border: `1px solid ${T.accent}` }}>
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 flex items-center justify-center" style={{ background: T.tint, borderRadius: T.rPill }}>
          <Ticket size={16} color={T.accent} />
        </div>
        <div className="text-[14px] font-semibold" style={{ ...display, color: T.ash }}>
          {waiting.length === 1 ? "A ticket is waiting for you" : `${waiting.length} tickets are waiting for you`}
        </div>
      </div>
      <div className="flex flex-col">
        {waiting.map((h, i) => (
          <button key={h.id} onClick={() => onOpenEvent(h.eventId)} className="flex items-center gap-3 py-2.5 text-left" style={{ borderTop: i ? `1px solid ${T.line}` : "none" }}>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-medium truncate" style={{ ...body, color: T.ash }}>
                {h.selfPurchase
                  ? `${h.kind === "child" ? `${h.assigneeCallsign}'s` : "Your"} ticket — ${h.eventTitle || "event"}`
                  : `${h.buyerCallsign} bought ${h.kind === "child" ? h.assigneeCallsign : "you"} a ticket — ${h.eventTitle || "event"}`}
              </div>
              <div className="text-[11px] truncate" style={{ ...body, color: T.ashFaint }}>{h.fieldName || ""}</div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-[11px] font-semibold uppercase" style={{ ...mono, color: T.alert, letterSpacing: "0.04em" }}>{countdownLabel(msOf(h.deadlineAt))}</div>
              <div className="text-[11px] font-semibold" style={{ ...display, color: T.accent }}>Claim →</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// --- Give a voucher ---------------------------------------------------------------------
// Only unused team-ticket vouchers, given whole (decided 2026-10-30).
export function canGiveVoucher(v) {
  return v?.source === "teamTicket" && v.status === "active" && v.amountCents === v.originalAmountCents && !(v.expiresAt?.toDate && v.expiresAt.toDate() < new Date());
}

export function GiveVoucherSheet({ voucher, onClose }) {
  const { T, body } = useTheme();
  const [to, setTo] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(null);
  const give = async () => {
    setBusy(true);
    setError("");
    try {
      const res = await giveTeamTicketVoucher({ voucherId: voucher.id, toUid: to.uid });
      setDone(res?.toCallsign || to.callsign);
    } catch (err) {
      console.error("giveTeamTicketVoucher failed:", err);
      setError(callableMessage(err, "Couldn't give the voucher — try again."));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Sheet title="Give this voucher" subtitle={`${fmtUsd(voucher.amountCents)} · ${voucher.fieldName || "field"}`} onClose={onClose} busy={busy}>
      {done ? (
        <>
          <p className="text-[13px] mb-4" style={{ ...body, color: T.ashDim }}>Done — {done} has the voucher now.</p>
          <PrimaryButton onClick={onClose}>Close</PrimaryButton>
        </>
      ) : to ? (
        <>
          <p className="text-[13px] mb-4" style={{ ...body, color: T.ashDim }}>
            Give your {fmtUsd(voucher.amountCents)} voucher for {voucher.fieldName || "this field"} to <strong style={{ color: T.ash }}>{to.callsign}</strong>? It moves to their account and you can't take it back.
          </p>
          {error && <p className="text-[12px] mb-2" style={{ ...body, color: T.alert }}>{error}</p>}
          <div className="flex flex-col gap-2">
            <PrimaryButton onClick={give} disabled={busy}>{busy ? "Giving…" : `Give to ${to.callsign}`}</PrimaryButton>
            <SecondaryButton onClick={() => setTo(null)} disabled={busy}>Pick someone else</SecondaryButton>
          </div>
        </>
      ) : (
        <RecipientSearch includeChildren={false} onPick={setTo} placeholder="Search players by callsign" />
      )}
    </Sheet>
  );
}
