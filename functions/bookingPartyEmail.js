// Booking confirmation for a PARTY booking: a guardian who booked an event
// for themselves AND one or more of their child profiles in one booking —
// or (child-only, 2026-10-21) for their child profile(s) only, with no
// ticket for themselves (no "adult" entry in attendees).
// Solo bookings never come through here (they keep the first/repeat
// templates). Kept in its own module so the preview script renders the
// exact same output the live trigger sends.
//
// Privacy: this email goes only to the guardian and shows callsigns only —
// never a child's legal name or date of birth (those stay in the private
// attendeeDetails subcollection).
import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const template = readFileSync(
  path.join(path.dirname(fileURLToPath(import.meta.url)), "templates", "booking-confirmation-party.html"),
  "utf-8"
);

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
const fill = (html, map) => Object.entries(map).reduce((out, [token, value]) => out.split(token).join(value ?? ""), html);
const joinNames = (names) => (names.length <= 1 ? names.join("") : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`);

// booking.attendees as written by attendeePublicFields() in index.js:
// [{ kind: "adult", callsign }, { kind: "minor", callsign }, ...]
export function isPartyBooking(booking) {
  return Array.isArray(booking?.attendees) && booking.attendees.some((a) => a?.kind === "minor");
}

export function renderPartyBookingEmail({ guardianCallsign, attendees, fieldName, eventTitle, eventDateTime, isPaid, amountPaidCents }) {
  const adult = attendees.find((a) => a.kind === "adult");
  const minors = attendees.filter((a) => a.kind === "minor");
  const you = guardianCallsign || adult?.callsign || "Player";
  const childNames = minors.map((m) => m.callsign || "Child");
  if (!adult) {
    return renderChildOnly({ you, childNames, fieldName, eventTitle, eventDateTime, isPaid, amountPaidCents });
  }
  const total = 1 + minors.length;
  const countLabel = `Party of ${total}`;

  const rowStyle = "padding:11px 0; border-top:1px solid #E4E4DC;";
  const pill = (text, bg, fg) => `<span style="display:inline-block; font-family:'IBM Plex Mono','Courier New',monospace; font-size:10px; font-weight:600; letter-spacing:0.08em; text-transform:uppercase; background:${bg}; color:${fg}; border-radius:20px; padding:4px 10px;">${text}</span>`;
  const row = (name, tagHtml) => `<tr>
              <td style="${rowStyle} font-family:'Space Grotesk',Helvetica,Arial,sans-serif; font-weight:700; font-size:15px; color:#002C48;">${esc(name)}</td>
              <td style="${rowStyle} text-align:right;">${tagHtml}</td>
            </tr>`;
  const attendeeRows = [
    row(you, pill("You &middot; Booked for yourself", "#E3EEFC", "#1554B8")),
    ...childNames.map((n) => row(n, pill("Your child profile", "#EEEEE6", "#4A4E54"))),
  ].join("\n            ");

  const headline = minors.length === 1
    ? `You and ${esc(childNames[0])} are booked at ${esc(fieldName)}.`
    : `You and your ${minors.length} child profiles are booked at ${esc(fieldName)}.`;
  const subject = minors.length === 1
    ? `You and ${childNames[0]} are booked at ${fieldName}`
    : `Your party of ${total} is booked at ${fieldName}`;

  const introLine = `Hey ${esc(you)} &mdash; ${isPaid ? "this confirms your payment and" : "this confirms"} a spot for you <b>and</b> ${esc(joinNames(childNames))}, all on this one booking. Your waiver&rsquo;s signed, including your guardian waiver for ${minors.length === 1 ? "your child profile" : "each child profile"}. Nothing else to do before game day.`;

  const amountRow = isPaid && typeof amountPaidCents === "number"
    ? `<tr>
              <td style="padding:6px 0; font-family:Helvetica,Arial,sans-serif; font-size:13px; color:#686C72; width:90px; vertical-align:top;">Total paid</td>
              <td style="padding:6px 0; font-family:'Space Grotesk',Helvetica,Arial,sans-serif; font-weight:700; font-size:14px; color:#002C48;">$${(amountPaidCents / 100).toFixed(2)} <span style="font-family:Helvetica,Arial,sans-serif; font-weight:400; font-size:12px; color:#686C72;">for all ${total} players</span></td>
            </tr>`
    : "";
  const stripeNote = isPaid
    ? `<p style="margin:12px 0 0; font-size:12px; line-height:1.6; color:#9A9D9F;">
        One charge covers the whole group. A separate receipt comes from Stripe, our payment processor &mdash; this email is your Atlas booking confirmation.
      </p>`
    : "";

  const html = fill(template, {
    "[PARTY_COUNT_LABEL]": countLabel,
    "[HEADLINE]": headline,
    "[INTRO_LINE]": introLine,
    "[ATTENDEE_ROWS]": attendeeRows,
    "[FIELD NAME]": esc(fieldName),
    "[EVENT NAME]": esc(eventTitle),
    "[EVENT DATE], [START TIME]": esc(eventDateTime),
    "[AMOUNT_ROW]": amountRow,
    "[STRIPE_NOTE]": stripeNote,
    "[GATE_LINE]": "Open Atlas &rarr; Home tab &rarr; tap <b>Check In</b> from <b>your</b> account. One code checks in the whole group &mdash; your child profiles don&rsquo;t need their own phones or logins.",
  });
  return { html, subject };
}

const rowStyle = "padding:11px 0; border-top:1px solid #E4E4DC;";
const pillHtml = (text, bg, fg) => `<span style="display:inline-block; font-family:'IBM Plex Mono','Courier New',monospace; font-size:10px; font-weight:600; letter-spacing:0.08em; text-transform:uppercase; background:${bg}; color:${fg}; border-radius:20px; padding:4px 10px;">${text}</span>`;
const nameRow = (name, tagHtml) => `<tr>
              <td style="${rowStyle} font-family:'Space Grotesk',Helvetica,Arial,sans-serif; font-weight:700; font-size:15px; color:#002C48;">${esc(name)}</td>
              <td style="${rowStyle} text-align:right;">${tagHtml}</td>
            </tr>`;

// Parent booked their child profile(s) only — they aren't playing.
function renderChildOnly({ you, childNames, fieldName, eventTitle, eventDateTime, isPaid, amountPaidCents }) {
  const n = childNames.length;
  const names = joinNames(childNames);
  const countLabel = n === 1 ? "1 player" : `${n} players`;
  const attendeeRows = childNames.map((c) => nameRow(c, pillHtml("Your child profile", "#EEEEE6", "#4A4E54"))).join("\n            ");
  const verb = n === 1 ? "is" : "are";
  const headline = `${esc(names)} ${verb} booked at ${esc(fieldName)}.`;
  const subject = `${names} ${verb} booked at ${fieldName}`;
  const introLine = `Hey ${esc(you)} &mdash; ${isPaid ? "this confirms your payment and" : "this confirms"} a spot for ${esc(names)}. You&rsquo;re not playing in this one, so there&rsquo;s no ticket for you. Your waiver&rsquo;s signed, including your guardian waiver for ${n === 1 ? "your child profile" : "each child profile"} and your acknowledgement that you won&rsquo;t be playing. Keep your phone on during the event &mdash; the field has your number on file.`;
  const amountRow = isPaid && typeof amountPaidCents === "number"
    ? `<tr>
              <td style="padding:6px 0; font-family:Helvetica,Arial,sans-serif; font-size:13px; color:#686C72; width:90px; vertical-align:top;">Total paid</td>
              <td style="padding:6px 0; font-family:'Space Grotesk',Helvetica,Arial,sans-serif; font-weight:700; font-size:14px; color:#002C48;">$${(amountPaidCents / 100).toFixed(2)} <span style="font-family:Helvetica,Arial,sans-serif; font-weight:400; font-size:12px; color:#686C72;">for ${n === 1 ? "1 player" : `all ${n} players`}</span></td>
            </tr>`
    : "";
  const stripeNote = isPaid
    ? `<p style="margin:12px 0 0; font-size:12px; line-height:1.6; color:#9A9D9F;">
        A separate receipt comes from Stripe, our payment processor &mdash; this email is your Atlas booking confirmation.
      </p>`
    : "";
  const gateLine = `Check ${n === 1 ? esc(names) : "them"} in before you head out: open Atlas &rarr; Home tab &rarr; tap <b>Check In</b> from <b>your</b> account and show the code at the gate. Not staying? The field can also check them in by name.`;
  const html = fill(template, {
    "[PARTY_COUNT_LABEL]": countLabel,
    "[HEADLINE]": headline,
    "[INTRO_LINE]": introLine,
    "[ATTENDEE_ROWS]": attendeeRows,
    "[FIELD NAME]": esc(fieldName),
    "[EVENT NAME]": esc(eventTitle),
    "[EVENT DATE], [START TIME]": esc(eventDateTime),
    "[AMOUNT_ROW]": amountRow,
    "[STRIPE_NOTE]": stripeNote,
    "[GATE_LINE]": gateLine,
  });
  return { html, subject };
}
