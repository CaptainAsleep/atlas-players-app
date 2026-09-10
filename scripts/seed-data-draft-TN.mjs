// DRAFT — field-seeding candidates for Tennessee, researched 2026-09-10.
//
// This is NOT wired into seed-data.mjs and does NOT touch the live database.
// Review each entry, then copy whichever ones you approve into the `fields`
// array in seed-data.mjs before running it.
//
// A solid batch — 4 of 5 entries verified against the field's own website;
// the fifth (TennTak Airsoft) has no owned website or Facebook page found,
// but is well corroborated across several independent sources including a
// freshly-updated (September 2026) Yelp listing and a registered trademark.

// ---- TENNESSEE ---------------------------------------------------------------
export const tennesseeFields = [
  {
    id: "nashville-airsoft",
    name: "Nashville Airsoft",
    city: "Nashville, TN",
    address: "406 Davidson Street, Nashville, TN 37213",
    phone: "(615) 988-6024",
    website: "https://nashvilleairsoft.com",
    ownerEmailDomain: "nashvilleairsoft.com",
    facebook: "https://facebook.com/NashvilleAirsoft",
    instagram: "https://instagram.com/nashvilleairsoft",
    twitter: "https://twitter.com/nashairsoft",
    youtube: "https://youtube.com/channel/UCWD45oRl59ZwaY_qKz1b16w",
    tiktok: "https://tiktok.com/@nashville.airsoft",
    indoorOutdoor: "indoor",
    admission: "Roughly $20-$65/person depending on package (field fee, rentals, and BBs)",
    about:
      "30,000 sq ft indoor airsoft facility with a full retail gear/gun store and repair services. Field hours Friday 3pm-8pm, Saturday 10am-8pm, Sunday 1pm-6pm; store keeps separate, wider hours.",
    status: "active",
    dataSource: "website",
    lastScraped: "2026-09-10",
  },
  {
    id: "xtreme-airsoft-memphis",
    name: "XTREME Airsoft Park & Store",
    city: "Memphis, TN",
    address: "4010 Jackson Ave, Memphis, TN 38128",
    phone: "(901) 762-1117",
    website: "https://xtremeairsoft.net",
    ownerEmailDomain: "xtremeairsoft.net",
    facebook: "https://facebook.com/XTREMEAIRSOFTPARK/",
    instagram: "https://instagram.com/xtremeairsoftmemphis",
    discord: "https://discord.gg/h5XXuVsFnH",
    indoorOutdoor: "outdoor",
    admission: "$25-$55/player full-day access, includes 1,000 BBs with rentals; $5 BB refills",
    about:
      "Family-owned airsoft and gel-blaster park in Memphis running public games in 20-minute rounds with 10-minute breaks and first-aid-certified staff on site. Open Thursday-Sunday from 4pm; ages 13+ for airsoft (8+ for gel blasters), with parental waiver/attendance rules for minors.",
    status: "active",
    dataSource: "website",
    lastScraped: "2026-09-10",
  },
  {
    id: "blackwater-marsh-airsoft",
    name: "Blackwater Marsh Airsoft",
    city: "Munford, TN",
    address: "1139 Appleberry Rd., Munford, TN 38011",
    phone: "901-520-6210",
    website: "https://blackwatermarsh.com",
    indoorOutdoor: "outdoor",
    about:
      "18+ acre outdoor woodland-and-structure airsoft field just outside Memphis (Munford), with gear rentals and indoor rest areas. Game days every Saturday and Sunday. Family-owned, serving the Mid-South for over a decade; also runs a separate hobby/game shop location in town.",
    status: "active",
    dataSource: "website",
    lastScraped: "2026-09-10",
    notes: "No admission pricing or social media links published on the site; omitted rather than estimated.",
  },
  {
    id: "battle-ridge-airsoft",
    name: "Battle Ridge Airsoft",
    city: "College Grove, TN",
    address: "8425 Horton Hwy, College Grove, TN 37046",
    phone: "(615) 368-2888",
    website: "https://battleridgeairsoft.com",
    ownerEmailDomain: "battleridgeairsoft.com",
    facebook: "https://www.facebook.com/battleridgeairsoft/",
    indoorOutdoor: "outdoor",
    admission: "Special/themed events around $50/player; party packages starting at $440 for a 2-hour session",
    about:
      "10-acre outdoor field (buildings, woods, and open sections) between Nashville and Shelbyville, formerly known as CartCon1 Airsoft — same address and phone, rebranded under new/continued ownership. In business since 2012 per its BBB profile (BBB rating A+, not accredited). Runs themed events (e.g. a Halloween night-game weekend) plus birthday/team-building party packages.",
    status: "active",
    dataSource: "website + BBB business profile",
    lastScraped: "2026-09-10",
    notes:
      "Formerly listed online as 'CartCon1 Airsoft' at the same address — several directories still reference the old name (BBB lists it as an alternate name). Using the current branding (Battle Ridge Airsoft) throughout.",
  },
  {
    id: "tenntak-airsoft",
    name: "TennTak Airsoft",
    city: "Knoxville, TN",
    address: "8919 Valgro Rd, Knoxville, TN 37920",
    phone: "(865) 789-6000",
    indoorOutdoor: "indoor",
    about:
      "Billed as Knoxville's largest indoor airsoft and CQB facility, for players ages 10+, with a pro shop and multiple themed structures for milsim-style play. Hours: Friday 5pm-10pm, Saturday 10am-3pm and 5pm-10pm, Sunday 1pm-6pm.",
    status: "facebook_only",
    dataSource:
      "Yelp (updated September 2026) + Yahoo Local + AirsoftC3 + Womply (30 reviews) + AirsoftSociety forum + a registered TENNTAK / TENN TAK trademark (Justia) under TennTak Airsoft LLC — no owned website or Facebook page found",
    lastScraped: "2026-09-10",
    notes:
      "No dedicated business website or Facebook page turned up despite an unusually large number of independent corroborating sources (including a live federal trademark registration confirming the LLC is real) — treated as facebook_only per the usual convention for fields without a confirmable primary source, even though 'Facebook' isn't actually one of the sources here.",
  },
];

// Considered and excluded (Tennessee) — do not add without re-verifying:
//   - Southern Assault Airsoft (southernassault.com): has a live, professional-looking website, but no address, phone, city, or any location detail is published anywhere on it, and no third-party directory, review site, or social media presence could be found to corroborate a physical location — impossible to verify this is a real, locatable field rather than a team/brand name.
//   - Vortex Fields Airsoft (Knox County, near Knoxville): a real, community-run, free-to-play field, but it deliberately keeps its exact address private — shared only by email to subscribers/members rather than published anywhere — so there's no publishable address for it.
