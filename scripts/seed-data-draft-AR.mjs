// DRAFT — field-seeding candidates for Arkansas, researched 2026-09-10.
//
// This is NOT wired into seed-data.mjs and does NOT touch the live database.
// Review each entry, then copy whichever ones you approve into the `fields`
// array in seed-data.mjs before running it.
//
// All three entries below were verified against the field's own website —
// a stronger batch than Iowa/Kansas in that respect, though still a small
// state overall. Several other leads turned out closed, unbuilt, or
// unverifiable — see the excluded list at the bottom.

// ---- ARKANSAS ---------------------------------------------------------------
export const arkansasFields = [
  {
    id: "smt-airsoft",
    name: "SMT Airsoft",
    city: "Siloam Springs, AR",
    address: "16838 Chambers Springs Road, Siloam Springs, AR 72761",
    phone: "(479) 396-4327",
    website: "https://smtairsoft.com",
    ownerEmailDomain: "smtairsoft.com",
    facebook: "https://www.facebook.com/profile.php?id=100091427100319",
    instagram: "https://www.instagram.com/survivalmodetacticalnwa",
    youtube: "https://www.youtube.com/@survivalmodetactical",
    indoorOutdoor: "outdoor",
    admission: "Day pass with rental gear: $40; day pass bring-your-own-gear: $20",
    about:
      "Family-owned outdoor airsoft field in Northwest Arkansas (rolling hills and thick woodlands terrain) with a warm-up/chronograph shooting range and a mobile field store for rentals and supplies. Day games Saturday-Sunday 12pm-5pm, night games Friday 6pm-10pm. Associated with The Survival Mode tactical gear retailer.",
    status: "active",
    dataSource: "website",
    lastScraped: "2026-09-10",
    notes:
      "Two secondary sources gave slightly different house numbers (17023 / 16931 Chamber Springs Rd) — went with 16838 Chambers Springs Road since that's what the business's own site (smtairsoft.com) states directly.",
  },
  {
    id: "modern-mission-airsoft",
    name: "Modern Mission",
    city: "Fayetteville, AR",
    address: "3484 E. Joyce Blvd., Fayetteville, AR 72703",
    phone: "479-595-0055",
    website: "https://www.modernmission.com/airsoft",
    ownerEmailDomain: "modernmission.com",
    facebook: "https://facebook.com/ModernMission",
    instagram: "https://instagram.com/modernmission",
    youtube: "https://www.youtube.com/user/ModernMission1",
    indoorOutdoor: "outdoor",
    admission:
      "Open session with rental gear: $30.06/player; open session with own gear: $15/player; group events (10+ players): $300.60+; birthday packages $330-$440; corporate events from $380",
    about:
      "Outdoor airsoft \"missions\" venue in Fayetteville for ages 10+, running structured 90-minute sessions (minimum 4 missions, 6-player minimum) using plastic-BB scenarios. Also runs group, birthday, and corporate events.",
    status: "active",
    dataSource: "website",
    lastScraped: "2026-09-10",
    notes: "Sessions run Friday 6pm and Saturday/Sunday 12pm & 2pm per the site's booking schedule.",
  },
  {
    id: "xtreme-paintball-laser-tag-ar",
    name: "Xtreme Paintball and Laser Tag",
    city: "Dover, AR",
    address: "90 Tucker Mountain Road, Dover, AR 72837",
    phone: "479-280-4009",
    website: "https://sites.google.com/view/xtreme-paintball-and-laser-tag/home",
    indoorOutdoor: "outdoor",
    about:
      "Private, reservation-only outdoor venue in the Ozarks offering paintball, laser tag, airsoft, and GelBall side by side. Available by reservation seven days a week; no public walk-on hours.",
    status: "active",
    dataSource: "website",
    lastScraped: "2026-09-10",
    notes:
      "Site is a Google Sites page rather than a dedicated domain, and lists a personal-looking contact email (twiley411@centurylink.net) rather than a business one — flagging as a smaller/informal operation, but airsoft is explicitly named as one of its offerings and the address/phone are given directly.",
  },
];

// Considered and excluded (Arkansas) — do not add without re-verifying:
//   - Bennett's Airsoft Corps (Little Rock, AR): only a bare Facebook page name turned up in searches — no address, city detail beyond "Little Rock," or any corroborating source found to confirm it's a real, locatable field.
//   - NWAairsoft (nwaairsoft.com): describes itself as having "plans to develop an indoor airsoft field and retail shop" — future-tense/aspirational language, no address or phone published anywhere — no evidence this is a built, operating field yet rather than a project still in planning.
//   - BattleBorne Airsoft (Jonesboro, AR): a Yelp listing explicitly marks it "CLOSED - Updated June 2025" at 3361 AR-163, Jonesboro — closed.
//   - Crackins airsoft place (Bentonville, AR): only a bare Facebook page name turned up — no address or any corroborating source found.
//   - Action Town Park (Mayflower, AR): a real, well-documented 50-acre facility with its own site, but it's paintball-only — no airsoft mentioned anywhere on the site (a separate "Gel Blaster Conway" location is referenced but that's a different game, not airsoft).
//   - Final Shot Paintball (Arkansas landing page): same multi-state SEO-template pattern already excluded for Iowa and Kansas — the real contact info on the page points to the company's actual Connecticut location, not a genuine Arkansas facility.
