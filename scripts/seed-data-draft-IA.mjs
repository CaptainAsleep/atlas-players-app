// DRAFT — field-seeding candidates for Iowa, researched 2026-09-10.
//
// This is NOT wired into seed-data.mjs and does NOT touch the live database.
// Review each entry, then copy whichever ones you approve into the `fields`
// array in seed-data.mjs before running it.
//
// Iowa turned up a genuinely small pool — smaller even than Wisconsin's
// batch. Several promising-looking leads from directory sites turned out to
// be dead ends on closer verification (see the excluded list at the bottom).
// Two of the three entries below were verified against the field's own
// website; the third (Central City Airsoft) has no owned website but is
// corroborated across several independent sources, same treatment as the
// existing MI facebook_only entries already in seed-data.mjs.

// ---- IOWA ---------------------------------------------------------------
export const iowaFields = [
  {
    id: "doa-paintball-airsoft",
    name: "DOA Paintball and Airsoft Field",
    city: "Saint Charles, IA",
    address: "2444 Quail Ridge Ave, Saint Charles, IA 50240",
    phone: "515-901-9988",
    website: "https://www.doapaintballfield.com",
    ownerEmailDomain: "doapaintballfield.com",
    facebook: "https://www.facebook.com/p/DOA-Paintball-and-Airsoft-Field-100057377322843/",
    indoorOutdoor: "outdoor",
    admission:
      "Paintball: $60/person (field fee + marker + mask + 500 rounds), $25 field-fee-only; Airsoft: $50/person (field fee + marker + mask + 1000 BBs), $25 field-fee-only",
    about:
      "Paintball-and-airsoft field south of Des Moines near Indianola, with airsoft explicitly offered alongside paintball at its own dedicated pricing tier. Open to walk-ins Saturday and Sunday 10am-5pm; weekdays by reservation only. Cash only.",
    status: "active",
    dataSource: "website",
    lastScraped: "2026-09-10",
    notes:
      "The business's own site doesn't explicitly say indoor vs. outdoor — marked outdoor based on the rural acreage address and weekend-walk-in/weekday-reservation pattern shared with every other outdoor field seeded so far; flagging the inference rather than treating it as confirmed.",
  },
  {
    id: "rapid-fire-airsoft",
    name: "Rapid Fire Airsoft",
    city: "Le Mars, IA",
    address: "35508 200th St, Le Mars, IA 51031",
    phone: "712-318-2213",
    website: "https://rapidfireairsoft.us",
    ownerEmailDomain: "rapidfireairsoft.com",
    facebook: "https://www.facebook.com/profile.php?id=61573296947263",
    instagram: "https://www.instagram.com/rapidfireairsoft.us",
    youtube: "https://www.youtube.com/@Rapidfireairsoftus",
    indoorOutdoor: "outdoor",
    admission:
      "Bring your own gear: $25; Standard package (field rifle, thermal gear, 500 BBs): $45; Full package (custom rifle, vest, helmet, gloves, 2 mags, 1,500 BBs): $60",
    about:
      "CQB-style airsoft field on a rural property near Le Mars (northwest Iowa), built around a modified hog barn and a grid of IBC-tote bastions plus a custom \"Gulag\" arena. Open-play skirmishes every Saturday 10am-2:30pm (gates 9:30am), with private weekday bookings available for groups.",
    status: "active",
    dataSource: "website",
    lastScraped: "2026-09-10",
    notes:
      "Site calls this a \"60,000 sq ft CQB Field\" built inside/around a converted barn and tote structures — treated as outdoor given the rural farm address and total absence of any climate-controlled/indoor-facility language, but noting it in case the layout turns out to be more enclosed than a typical open field.",
  },
  {
    id: "central-city-airsoft",
    name: "Central City Airsoft",
    city: "Central City, IA",
    address: "5117 Hill's Mill Rd, Central City, IA 52214",
    indoorOutdoor: "outdoor",
    about:
      "Airsoft field near Cedar Rapids/Marion running a recurring seasonal schedule (a \"2025 Season Schedule\" post is its most recent confirmed activity found). No owned business website found.",
    status: "facebook_only",
    dataSource:
      "Facebook (Centralcityairsoft) + Instagram (@centralcityairsoft) + X/Twitter (@CCA_Events_LLC) + AirsoftSociety forum showcase + AirsoftC3 directory (no owned website found)",
    lastScraped: "2026-09-10",
    notes:
      "Same treatment as Airsoft Arena Milwaukee (WI batch) and KDK Airsoft (MO batch): no dedicated business website, but independently corroborated across enough separate sources — including an active-looking 2025 season-schedule post — to be worth including as facebook_only rather than excluding outright. Claim verification and current hours/pricing can't be confirmed from a primary source.",
  },
];

// Considered and excluded (Iowa) — do not add without re-verifying:
//   - Cedar Airsoft Field: turns up prominently for "Cedar Rapids airsoft field" searches, but its own site (cedarairsoftfield.com) gives its actual address as Cedar Springs, MICHIGAN, not Iowa — a name-similarity false lead, not an Iowa field at all. (Worth checking it's not already duplicated in the MI list, but not seeded here.)
//   - CQB Airsoft / Live Action Games (Davenport, IA): its own domain (lagqc.com) now 302-redirects to an unrelated parked site, and a third-party listing (Wanderlog) explicitly marks it "Temporarily Closed" — too stale/uncertain to include as active.
//   - 1 Shot Airsoft Arena (Sioux City, IA): the LLC (712 Market St, Sioux City) was administratively dissolved by the state in 2021 per its own Iowa business-registration record — closed.
//   - Archery Field & Sports (Altoona, IA): the "Archey Field" lead from an airsoft directory turned out to be an archery pro shop that also runs paintball events — no airsoft offered at all per its own site.
//   - Cornell Airsoft / Adkison Field (Newton, IA): only a stale AirsoftC3 directory entry (last updated 2023) and a years-old, explicitly-flagged-as-old AirsoftSociety forum thread with no address or working contact info — no evidence of current operation found.
//   - AKA Combat Entertainment (Des Moines, IA): appears to be an infrared laser-tag franchise location, not an airsoft field with real BBs; the only source found is a 2014 news article with no confirmation it's still operating.
//   - Combat Mayhem Airsoft (Facebook page "AirsofCQBfieldIowa"): only the bare Facebook page name turned up — no address, city, or any corroborating source found to confirm it's a real, locatable field.
