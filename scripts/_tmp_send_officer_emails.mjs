// One-off backfill: team-officer welcome email to every current officer.
// Same template/subjects as sendTeamOfficerWelcomeEmail; writes the same
// emailSends doc so the live trigger can never re-send to these people.
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { readFileSync } from "fs";
import { Resend } from "resend";
initializeApp({ credential: cert(JSON.parse(readFileSync(new URL("./serviceAccountKey.json", import.meta.url)))) });
const db = getFirestore();
const key = readFileSync(new URL("../../atlas-email-sender/.env", import.meta.url), "utf-8").match(/RESEND_API_KEY=(\S+)/)[1];
const resend = new Resend(key);
const tpl = readFileSync(new URL("../functions/templates/team-officer-welcome.html", import.meta.url), "utf-8");
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const fill = (h, r) => Object.entries(r).reduce((o, [k, v]) => o.split(k).join(v), h);

for (const t of (await db.collection("teams").get()).docs) {
  for (const m of (await t.ref.collection("members").get()).docs) {
    const d = m.data();
    if (d.role !== "officer") continue;
    const uid = m.id, team = t.data(), name = team.name || "your team";
    const email = (await db.collection("users").doc(uid).get()).data()?.email;
    if (!email) { console.log(`SKIP no email: ${name}/${d.callsign}`); continue; }
    try {
      await db.collection("emailSends").doc(`teamOfficerWelcome_${t.id}_${uid}`).create({ type: "teamOfficerWelcome", teamId: t.id, uid, backfill: true, createdAt: FieldValue.serverTimestamp() });
    } catch (e) { if (e?.code === 6) { console.log(`SKIP already sent: ${name}/${d.callsign}`); continue; } throw e; }
    const founder = team.createdBy === uid, st = esc(name);
    const html = fill(tpl, {
      "[CALLSIGN]": esc(d.callsign || "Operator"),
      "[HEADLINE]": founder ? `${st} is yours to run.` : `You&rsquo;re an officer of ${st}.`,
      "[INTRO LINE]": founder
        ? `You just set up <b>${st}</b> on Atlas. As an officer, you run it &mdash; here&rsquo;s everything you can set up on your team page, so you can get it working the way your team actually operates.`
        : `You&rsquo;ve been made an officer of <b>${st}</b> on Atlas, which means you can help run it. Here&rsquo;s everything officers can set up on the team page.`,
    });
    const { data, error } = await resend.emails.send({
      from: "Atlas Teams <teams@airsoftatlas.app>", to: email,
      subject: founder ? `${name} is yours to run — here's what you can set up` : `You're an officer of ${name} — here's what you can set up`,
      html,
    });
    console.log(error ? `ERROR ${name}/${d.callsign}: ${JSON.stringify(error)}` : `SENT ${name}/${d.callsign} (${founder ? "founder" : "promoted"}) id=${data.id}`);
    await new Promise((r) => setTimeout(r, 400));
  }
}
