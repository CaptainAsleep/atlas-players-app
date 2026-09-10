// DRAFT — field-seeding candidates for Missouri, researched 2026-09-10.
//
// This is NOT wired into seed-data.mjs and does NOT touch the live database.
// Review each entry, then copy whichever ones you approve into the `fields`
// array in seed-data.mjs before running it.
//
// Every entry below was verified by fetching the field's own website, with
// two exceptions clearly flagged in their own notes (Huckleberry Ridge
// Airsoft's own site is under construction; KDK Airsoft has no owned
// website at all) — both corroborated instead across multiple independent
// third-party sources, the same treatment Airsoft Arena Milwaukee got in
// the Wisconsin batch. Several other candidates were researched and
// deliberately EXCLUDED as out of state, unverifiable, or not real fields
// — see the list at the bottom of this file.

// ---- MISSOURI ---------------------------------------------------------------
export const missouriFields = [
  {
    id: "so-go-airsoft",
    name: "So Go Airsoft",
    city: "Ozark, MO",
    address: "2012 W Garton Rd, Ozark, MO 65721",
    phone: "(417) 485-2579",
    website: "https://www.sogoairsoft.com",
    ownerEmailDomain: "sogoairsoft.com",
    facebook: "https://www.facebook.com/pages/So-Go-Airsoft/291342706293",
    indoorOutdoor: "indoor",
    admission: "Block Play Thursdays $20 (6-9pm); Block Play Saturdays $25 (5-9pm); ages 12+",
    about:
      "Indoor CQB airsoft facility in Ozark (two 4,000 sq ft warehouse spaces; also runs separate Nerf/gel-blaster play), all airsoft guns capped at 340 FPS. Its own site also describes a newer outdoor sister field in Bolivar it calls \"The Rock\" — see the-rock-airsoft below, listed separately.",
    imageUrl: "https://www.sogoairsoft.com/images/gamePlay350.png",
    status: "active",
    dataSource: "website",
    lastScraped: "2026-09-10",
    notes:
      "Site lists a separate mailing address (3801 N 20th Street, Ozark, MO 65721) distinct from the operational field address above — used the operational address.",
  },
  {
    id: "the-rock-airsoft",
    name: "The Rock Airsoft",
    city: "Bolivar, MO",
    phone: "(417) 485-2579",
    website: "https://www.therockairsoft.com",
    indoorOutdoor: "outdoor",
    about:
      "Outdoor field at a rock quarry in Bolivar, running named MilSim-style events (10 Year Rockaversary, Op Bad Moon, Operation War Path) rather than regular weekly open play.",
    imageUrl: "https://therockairsoft.com/images/theRock900.jpg",
    status: "active",
    dataSource: "website",
    lastScraped: "2026-09-10",
    notes:
      "No numbered street address found anywhere, including the business's own site — only described as \"a Rock Quarry\" in Bolivar, MO; left address unset rather than guessed. Shares a phone number with So Go Airsoft in Ozark, and So Go's own site describes running \"a new outdoor field\" it calls The Rock — treated here as a sister location, though The Rock's own site doesn't independently confirm the relationship back.",
  },
  {
    id: "mass-airsoft",
    name: "Missouri Airsoft & Simulation Site (MASS)",
    city: "Lawson, MO",
    address: "3233 W 180th St, Lawson, MO 64062",
    website: "https://www.massairsoft.com",
    ownerEmailDomain: "massairsoft.com",
    facebook: "https://www.facebook.com/MASSAIRSOFT",
    instagram: "https://www.instagram.com/missouriairsoftsimulationsite",
    tiktok: "https://www.tiktok.com/@mass.airsoft",
    discord: "https://discord.gg/97Z4S3FMk6",
    indoorOutdoor: "outdoor",
    about:
      "MilSim-focused outdoor field on a 30-acre decommissioned Cold War Nike missile base just southeast of Lawson, serving the Kansas City area. Open every weekend, summer hours 9am-5pm, winter 9am-4pm; on-site pro shop and rentals.",
    imageUrl:
      "https://static.wixstatic.com/media/c8afca_e175ca9df0dd44f096201734a949f90c~mv2.jpg/v1/fit/w_2500,h_1330,al_c/c8afca_e175ca9df0dd44f096201734a949f90c~mv2.jpg",
    status: "active",
    dataSource: "website",
    lastScraped: "2026-09-10",
    notes: "No admission pricing published on the site; omitted rather than estimated.",
  },
  {
    id: "huckleberry-ridge-airsoft",
    name: "Huckleberry Ridge Airsoft",
    city: "Pineville, MO",
    address: "1158 Packet Hollow Road, Pineville, MO 64856",
    facebook: "https://www.facebook.com/HuckleberryRidgeAirsoft/",
    indoorOutdoor: "outdoor",
    about:
      "Outdoor airsoft field in the Ozarks near the Arkansas border, hosting a recurring named MilSim event series (\"Mechanized\").",
    status: "active",
    dataSource: "AllEvents.in + KOAM local news + McDonald County Chamber of Commerce (the business's own website is under construction)",
    lastScraped: "2026-09-10",
    notes:
      "The business's own website (a Weebly site) is explicitly marked \"Website Under Construction\" with no address, contact, or schedule info. Address and operating status instead corroborated by a local TV news article (koamnewsnow.com), the county chamber of commerce's own event listing, and AllEvents.in — all three independently agree on the address and describe an active, ongoing event series (most recently \"Mechanized IV\", Dec 2026).",
  },
  {
    id: "kdk-airsoft",
    name: "KDK Airsoft",
    city: "Joplin, MO",
    address: "14600 Highway FF, Joplin, MO",
    facebook: "https://www.facebook.com/KDKAIRSOFT/",
    indoorOutdoor: "indoor + outdoor",
    about:
      "Locally-owned airsoft venue in Joplin running Capture the Flag, Team Death Match, Domination, and Oddball game modes with both indoor and outdoor play; rental gear available or bring your own.",
    status: "facebook_only",
    dataSource: "Facebook + Yelp + Visit Joplin tourism directory + OpenCorporates (no owned business website found)",
    lastScraped: "2026-09-10",
    notes:
      "No dedicated business website was found, only social media and directories — but it's independently confirmed as a real, currently-registered Missouri LLC via OpenCorporates, and listed in the official Visit Joplin tourism directory, which is why it's included at all. Treated as status: facebook_only (same as Airsoft Arena Milwaukee in the Wisconsin batch) rather than active, since claim verification and current hours/pricing can't be confirmed from a primary source.",
  },
];

// Considered and excluded (Missouri) — do not add without re-verifying:
//   - Xtreme Paintball Park: marketed as "Near St. Louis," but its own site gives its address as 3545 Douglas Road, Millstadt, IL 62260 — actually an Illinois field, not Missouri. Worth revisiting as an Illinois candidate later, not seeded here.
//   - Wacky Warriors East: same issue — its own site references "Wacky Warriors East in Millstadt," the same Illinois town as Xtreme Paintball Park above, not Missouri.
//   - Baileys Battlefield (Niangua, MO): no independent website found, only Facebook/Instagram and a dated PBNation review — too thin to verify current status.
//   - Southern Missouri Airsoft LLC (Willow Springs, MO): only a single AirsoftC3 directory listing found, no independent website or any other corroboration.
//   - Asgard (Stockton, MO): own site (asgardairsoft.com) contains no address, city, or state information at all — couldn't confirm this is even a real Missouri physical field rather than, e.g., a team/brand name used elsewhere.
//   - The Swimming Hole (Joplin, MO): appears to be an aggregator data error — searches turn up an actual swimming hole/water park, not a distinct airsoft facility.
//   - Center Mass Airsoft: one aggregator lists it near the MO/KS line, but the business's own Facebook page identifies it as based in Kansas City, KS specifically (same conflict already flagged when this came up in the Indiana batch) — not a Missouri field.
