// DRAFT — field-seeding candidates for Louisiana, researched 2026-09-10.
//
// This is NOT wired into seed-data.mjs and does NOT touch the live database.
// Review each entry, then copy whichever ones you approve into the `fields`
// array in seed-data.mjs before running it.
//
// A good batch of 6. Four entries verified against the field's own
// website; two (T's Extreme Airsoft & Nerf Wars, SPLAT EM) have no owned
// website found but are corroborated across several independent sources —
// same treatment as prior facebook_only entries. Also resolves a loose
// end from the Kansas batch: "Alexandria Air-Soft Adventures," excluded
// there as a Louisiana false lead via a syndicated news video, is the real
// Alexandria Airsoft Adventures seeded here.

// ---- LOUISIANA ---------------------------------------------------------------
export const louisianaFields = [
  {
    id: "alexandria-airsoft-adventures",
    name: "Alexandria Airsoft Adventures",
    city: "Alexandria, LA",
    address: "3437 Masonic Drive, Alexandria, LA 71301",
    phone: "(844) 224-7763",
    website: "https://alexandriaairsoftadventures.com",
    ownerEmailDomain: "alexandriaairsoftadventures.com",
    indoorOutdoor: "indoor",
    admission:
      "Weekday (Mon-Thu) rental: $52/player; weekend (Fri-Sun) rental: $62/player; weekend bring-your-own-gun: $52/player (loyalty discounts for repeat visits); rentals include full-face mask, tactical vest w/ armor, AEG + mag with ~300 BBs",
    about:
      "Louisiana's only indoor airsoft field, opened April 2024 inside the Alexandria Mall (next to Michael's). Owner Jeremy Morrow built it as a fast-paced, high-intensity alternative to outdoor airsoft/paintball. Sessions require a 10-player cumulative minimum for some time slots.",
    status: "active",
    dataSource: "website + local news (KALB) + Yelp (updated July 2026) + business directories",
    lastScraped: "2026-09-10",
    notes: "This is the real field behind the 'Alexandria Air-Soft Adventures' lead that surfaced (and was excluded) during the Kansas research batch via a syndicated Wichita TV video — confirmed here as a genuine, currently-operating Louisiana field.",
  },
  {
    id: "bayou-games-usa",
    name: "Bayou Games Paintball Complex",
    city: "Sulphur, LA",
    address: "681 Kim Street, Sulphur, LA 70663",
    phone: "(337) 214-5001",
    website: "https://www.bayougames.com",
    ownerEmailDomain: "bayougames.com",
    facebook: "https://facebook.com/bayougamesinc/",
    instagram: "https://instagram.com/bayougames",
    indoorOutdoor: "outdoor",
    admission: "Airsoft rental (all-day, incl. marker + mask): $40/player; field fee only (bring your own gear): $20/player; 5,000 BBs: $19",
    about:
      "Multi-activity outdoor adventure park offering airsoft (ages 10+) alongside paintball, low-impact paintball, gellyball, laser tag, and a mobile video-game trailer. Also runs birthday parties, team-building, and church/group events.",
    status: "active",
    dataSource: "website",
    lastScraped: "2026-09-10",
    notes: "Hours: Sat 10am-6pm, Sun 11am-6pm (check-in by 4pm both days), weekdays by appointment only.",
  },
  {
    id: "ironsight-airsoft",
    name: "IronSight Airsoft",
    city: "Lake Charles, LA",
    address: "8380 Elliott Rd, Lake Charles, LA 70605",
    phone: "(337) 802-7280",
    website: "https://www.ironsightairsoft.com",
    facebook: "https://www.facebook.com/IronsightAirsoft/",
    instagram: "https://www.instagram.com/ironsightairsoft/",
    indoorOutdoor: "outdoor",
    about:
      "Airsoft field founded by two friends in Lake Charles, also known for organizing off-site airsoft events at military training grounds and other venues around the country.",
    status: "active",
    dataSource: "AirsoftC3 + Facebook + Instagram + Yahoo Local (its own site's robots.txt blocked automated verification, but address/phone/hours corroborate across all of these)",
    lastScraped: "2026-09-10",
    notes: "Hours: Mon-Fri 9am-5pm, Sat-Sun 9:30am-3:30pm per AirsoftC3. No pricing found published anywhere.",
  },
  {
    id: "paintball-command",
    name: "Paintball Command",
    city: "Mandeville, LA",
    address: "21268 Emile Strain Road, Mandeville, LA 70471",
    phone: "985-809-7668",
    website: "https://www.paintball-command.com",
    facebook: "https://www.facebook.com/paintballcommand",
    twitter: "https://twitter.com/pballcommand",
    indoorOutdoor: "outdoor",
    about:
      "Self-described 'Southeast Louisiana's premier paintball field since 2001,' a 40-acre facility that also runs open airsoft play, usually the 1st and 3rd Sundays of every month.",
    status: "active",
    dataSource: "website",
    lastScraped: "2026-09-10",
    notes: "Hours: Sat-Sun 8:30am-4:30pm, weekdays by appointment. Airsoft is a scheduled sub-offering (1st/3rd Sundays), not daily like the paintball side — flagging so expectations are set correctly.",
  },
  {
    id: "ts-extreme-airsoft-wars",
    name: "T's Extreme Airsoft & Nerf Wars",
    city: "Houma, LA",
    address: "Bayou Blue Road, Houma, LA 70364",
    phone: "(985) 665-5446",
    indoorOutdoor: "outdoor",
    about: "Airsoft field in Houma operating 7 days a week. Registered as an LLC ('T's extreme airsoft & nerf wars llc').",
    status: "facebook_only",
    dataSource: "AirsoftC3 + Facebook business page — no owned website found",
    lastScraped: "2026-09-10",
    notes: "Hours: daily 9am-5pm per AirsoftC3. No exact street number found for the Bayou Blue Road address; no pricing published anywhere found.",
  },
  {
    id: "splat-em",
    name: "SPLAT EM",
    city: "Loranger, LA",
    address: "50056 LA-443, Loranger, LA 70446",
    phone: "(985) 247-5693",
    indoorOutdoor: "outdoor",
    about: "Paintball, airsoft, speedball, and woodball field in Loranger, offering both day and night games.",
    status: "facebook_only",
    dataSource: "AirsoftC3 + Yelp (updated January 2026) + a recent Facebook event post — no owned website found",
    lastScraped: "2026-09-10",
    notes:
      "Hours per AirsoftC3: Mon-Fri 9am-5pm, Sat-Sun 9am-4pm. Also known informally as 'Mr. & Mrs. Splat' on its Facebook page. Airsoft Board lists this field as 'unclaimed' (operator hasn't set up an account there) and recommends confirming directly before visiting — noting that caveat rather than treating pricing/hours as fully current.",
  },
];

// Considered and excluded (Louisiana) — do not add without re-verifying:
//   - Cajun Airsoft (Bossier City, formerly 8070 E Texas St): turns up on several directories with a real address, but Yelp explicitly marks it "CLOSED - Updated May 2026" — closed.
//   - LA Extreme (Slidell, 37000 Receiving Station Rd): only a single AirsoftC3 directory listing found, with no phone, website, or Facebook page anywhere to corroborate it — and its address is suspiciously close to LAX Paintball's (37000 Dr. T.J. Smith Sr. Expressway, same zip 70460), raising the possibility of a stale/duplicate listing rather than a distinct active business. Not verifiable enough to include.
//   - LAX Paintball (Slidell): real, active, own website with full pricing/hours — but paintball only, no airsoft mentioned anywhere on the site.
//   - FRC Range / Firearms Range & Clothing (Baton Rouge): a real, active firearms range and clothing retailer with strong review presence — but it's a gun range, not an airsoft field; likely a miscategorized directory listing.
//   - "Ramone Scott" (New Orleans): appears on the AirsoftC3 Louisiana fields list, but every search result points to it being a personal name rather than a real business or field — not a genuine listing.
