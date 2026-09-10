// DRAFT — field-seeding candidates for Indiana, researched 2026-09-10.
//
// This is NOT wired into seed-data.mjs and does NOT touch the live database.
// Review each entry, then copy whichever ones you approve into the `fields`
// array in seed-data.mjs before running it.
//
// Every entry below was verified by fetching the field's own website —
// nothing here was fabricated or guessed. A few fields flagged in `notes`
// need a human gut-check before going live (e.g. two locations sharing one
// business, or a claim-verification quirk). Several other candidates were
// researched and deliberately EXCLUDED as closed, unverifiable, or not
// actually an airsoft field — see the list at the bottom of this file.

// ---- INDIANA ---------------------------------------------------------------
export const indianaFields = [
  {
    id: "htk-airsoft-jasper",
    name: "HTK Airsoft (Jasper Indoor Arena)",
    city: "Jasper, IN",
    address: "1355 Vine St, Jasper, IN 47546",
    phone: "(812) 296-2266",
    website: "https://www.htkairsoft.com",
    ownerEmailDomain: "htkairsoft.com",
    facebook: "https://www.facebook.com/htkairsoft",
    instagram: "https://www.instagram.com/htkairsoft/",
    youtube: "https://www.youtube.com/@htkairsoft",
    indoorOutdoor: "indoor",
    about:
      "Southern Indiana Airsoft's indoor arena in Jasper, sister facility to HTK's outdoor field in Loogootee (see separate listing). Currently running on an event-based schedule rather than fixed weekly hours — the site directs players to its events calendar and social media for play times.",
    imageUrl: "https://static.wixstatic.com/media/6ab267_fce20b0fba574e3c8dbd87dc5f5a5b07~mv2.jpg",
    status: "active",
    dataSource: "website",
    lastScraped: "2026-09-10",
    notes:
      "Same business, phone number, and social accounts as htk-airsoft-loogootee below — two physical locations under one brand, same as the Awaken Arena San Antonio/Austin pattern already in the Texas draft. Site states \"weekly operations paused\"; treat as active-but-irregular rather than closed.",
  },
  {
    id: "htk-airsoft-loogootee",
    name: "HTK Airsoft (Loogootee Outdoor Field)",
    city: "Loogootee, IN",
    address: "13706 E 550 S, Loogootee, IN 47553",
    phone: "(812) 296-2266",
    website: "https://www.htkairsoft.com",
    ownerEmailDomain: "htkairsoft.com",
    facebook: "https://www.facebook.com/htkairsoft",
    instagram: "https://www.instagram.com/htkairsoft/",
    youtube: "https://www.youtube.com/@htkairsoft",
    indoorOutdoor: "outdoor",
    about:
      "Southern Indiana Airsoft's outdoor field in Loogootee, sister facility to HTK's indoor arena in Jasper (see separate listing). Currently running on an event-based schedule rather than fixed weekly hours — the site directs players to its events calendar and social media for play times.",
    status: "active",
    dataSource: "website",
    lastScraped: "2026-09-10",
    notes:
      "Same business, phone number, and social accounts as htk-airsoft-jasper above. No separate hero image found for this location specifically.",
  },
  {
    id: "coyote-force",
    name: "Coyote Airsoft & Paintball",
    city: "Ladoga, IN",
    address: "8001 County Rd 550 E, Ladoga, IN 47954",
    phone: "(765) 401-1122",
    website: "https://www.coyoteforce.com",
    ownerEmailDomain: "coyoteforce.com",
    facebook: "https://www.facebook.com/coyoteairsoftpaintball",
    instagram: "https://www.instagram.com/coyoteairsoftpaintball",
    youtube: "https://www.youtube.com/@Coyote-Force",
    indoorOutdoor: "outdoor",
    admission:
      "Open play Sat/Sun, pricing varies by activity (airsoft/paintball/gellyball); private parties $30-40/player with a $50 deposit; scenario events $25-55",
    about:
      "Marketed as the Indianapolis area's premiere airsoft & paintball facility (the site also runs Lafayette/Purdue-targeted landing pages for the same single field), open for gameplay with events scheduled through the end of 2026.",
    imageUrl: "https://coyoteforce.com/og/default.jpg",
    status: "active",
    dataSource: "website",
    lastScraped: "2026-09-10",
    notes:
      "The site's /airsoft-lafayette-indiana and /airsoft pages both describe this same Ladoga field marketed to different regional audiences, not separate locations — confirmed one physical address only.",
  },
  {
    id: "battleground-indy",
    name: "Battleground Indy",
    city: "Greenwood, IN",
    address: "2350 South State Road 37, Greenwood, IN 46143",
    phone: "(317) 727-5202",
    website: "https://battlegroundindy.com",
    ownerEmailDomain: "battlegroundindy.com",
    facebook: "https://www.facebook.com/indybattlegroundpaintball",
    instagram: "https://www.instagram.com/indybattlegroundspb/",
    indoorOutdoor: "outdoor",
    about:
      "Primarily an outdoor paintball park (seven named fields: Airstrip, The City, Bootleg, Hyper-pipe Field, Speedball, The Brig, The Village) that also explicitly runs airsoft: the site states \"we offer traditional paintball, as well as low impact paintball and Airsoft,\" with airsoft open play usually twice a month alongside private group bookings.",
    imageUrl: "https://battlegroundindy.com/wp-content/uploads/2020/10/featured-image1.jpg",
    status: "active",
    dataSource: "website",
    lastScraped: "2026-09-10",
    notes:
      "Paintball-primary venue, not airsoft-primary — including it because airsoft is an explicit, named offering (twice-monthly open play) rather than an incidental mention. Michael should gut-check whether a mostly-paintball field belongs in Atlas before publishing.",
  },
  {
    id: "blast-camp",
    name: "Blastcamp Paintball & Airsoft",
    city: "Hobart, IN",
    address: "563 W 600 N, Hobart, IN 46342",
    phone: "(219) 759-7733",
    website: "https://blastcamp.com",
    ownerEmailDomain: "blastcamp.com",
    facebook: "https://www.facebook.com/blastcamppaintballandairsoft/",
    indoorOutdoor: "outdoor",
    admission:
      "Walk-on play $30/player; airsoft events $40-45/player depending on event; rentals $30/day",
    about:
      "Outdoor paintball-and-airsoft park in Hobart running open play most Sundays (except event weekends) with a dedicated airsoft events calendar through 2026.",
    imageUrl: "https://blastcamp.com/wp-content/uploads/2026/04/friday-night-lightsweb.jpg",
    status: "active",
    dataSource: "website",
    lastScraped: "2026-09-10",
  },
  {
    id: "paintball-airsoft-indiana",
    name: "Paintball & Airsoft Indiana",
    city: "Franklin, IN",
    address: "6109 S US Hwy 31, Franklin, IN 46143",
    phone: "(317) 743-7251",
    website: "https://paintballindianapolis.com",
    ownerEmailDomain: "paintballindianapolis.com",
    facebook: "https://www.facebook.com/PaintballIndiana",
    indoorOutdoor: "outdoor",
    about:
      "Outdoor paintball-and-airsoft facility about 20 minutes south of Indianapolis, open Fri-Sun (Mon-Thu by reservation only) with open play, party bundles, and scenario events; site confirms current airsoft offering.",
    imageUrl: "https://assets.cdn.filesafe.space/xFt74CxUQcgC8K4HXUHa/media/698d250a7f6dcf4f652fe812.webp",
    status: "active",
    dataSource: "website",
    lastScraped: "2026-09-10",
    notes:
      "Specific admission pricing lives on a separate Plans & Pricing page not fetched; omitted rather than estimated.",
  },
];

// Considered and excluded (Indiana) — do not add without re-verifying:
//   - ShotZone (Martinsville, IN): own site confirms it's closed to the public — "Due to low demand we have transitioned to online retail only."
//   - The Boneyard Airsoft (Bloomington, IN): own domain (boneyardairsoft.com) does not resolve; a 2026 post in the Indiana airsoft Facebook community asks "what happened to" this field, suggesting it may no longer be operating. Could not independently verify current status.
//   - Surge Strike Airsoft / Surgestrike Shooting Sports (Auburn, IN): own domain (surgestrikeshootingsports.com) 404s; address/phone only corroborated via a USCCA partner directory and third-party listings, not the business's own site. Couldn't verify current airsoft-specific operating status from a primary source.
//   - Silver Spur Splat (Princeton, IN): appears to be a paintball-primary facility per tourism/coupon directories; no owned website found and no confirmed dedicated airsoft program.
//   - Joker's Circus Airsoft Field (Bloomington, IN): only a Facebook page found, no independent website — couldn't verify from a primary source.
//   - Paintball Plex (LaOtto, IN): own site (paintball-plex.com) blocks automated fetches via robots.txt; the only airsoft-specific evidence found was in old (pre-2020) forum threads — appears to be a paintball-primary facility today.
//   - Mccordsville Training Grounds (McCordsville, IN): only a 2016 Facebook event found — appears defunct.
//   - ASOC PIT (Delphi, IN): a community Facebook post asks whether it's still active; no independent website found — status unconfirmed.
//   - Claypool Airsoft (Muncie, IN): no evidence found beyond one aggregator listing, which appears to have confused it with the unrelated Claypool Flea Market — likely a data error, not a real field.
//   - Butler Indiana Airsoft (Butler, IN): only a Facebook group and an old forum link found — reads as an informal community group rather than an operating commercial field.
//   - Center Mass Airsoft: one aggregator lists it under Greenwood, IN, but the business's own Facebook page identifies it as based in Kansas City, KS — conflicting location data, excluded.
