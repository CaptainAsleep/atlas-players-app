// DRAFT — field-seeding candidates for Oklahoma, researched 2026-09-10.
//
// This is NOT wired into seed-data.mjs and does NOT touch the live database.
// Review each entry, then copy whichever ones you approve into the `fields`
// array in seed-data.mjs before running it.
//
// A solid batch — all 4 entries verified against the field's own website.
// One directory-listed field (Stockyard Airsoft) turned out to be closed;
// a couple of paintball parks were confirmed paintball-only with no
// airsoft; and a same-named field turned up in Minnesota/South Dakota with
// no relation to Oklahoma's — see the excluded list at the bottom.

// ---- OKLAHOMA ---------------------------------------------------------------
export const oklahomaFields = [
  {
    id: "airsoft-tulsa",
    name: "Airsoft Tulsa",
    city: "Tulsa, OK",
    address: "6323 E. 41st Street, Unit B, Tulsa, OK 74135",
    phone: "(539) 525-0821",
    website: "https://www.airsofttulsa.com",
    ownerEmailDomain: "airsofttulsa.com",
    facebook: "https://www.facebook.com/TulsaAirsoft",
    twitter: "https://twitter.com/AirsoftTulsa",
    youtube: "https://www.youtube.com/channel/UCrntNOlzvDTNwLuteiJ2guA",
    indoorOutdoor: "indoor",
    about:
      "Self-described as the Midwest's largest and finest airsoft, tactical gear, and firearm accessories retailer, with both an indoor and an outdoor airsoft field on-site alongside its retail showroom (300+ airsoft rifle/pistol styles in stock).",
    status: "active",
    dataSource: "website",
    lastScraped: "2026-09-10",
    notes: "Two phone lines published: (539) 525-0883 for the retail store/showroom, (539) 525-0821 for the indoor field — used the field number here. No hours or pricing published on the site.",
  },
  {
    id: "t1-airsoft",
    name: "T1 Airsoft Outdoor Field",
    city: "Oklahoma City, OK",
    address: "8000 N I-35 Service Rd, Oklahoma City, OK 73131",
    phone: "(405) 600-4631",
    website: "https://t1airsoft.com",
    ownerEmailDomain: "t1airsoft.com",
    facebook: "https://www.facebook.com/t1airsoft/",
    indoorOutdoor: "outdoor",
    about:
      "Outdoor airsoft field in north Oklahoma City, home field of the \"Grayzone\" milsim event concept. Offers private rentals and group discounts.",
    status: "active",
    dataSource: "website + Yelp (updated September 2026)",
    lastScraped: "2026-09-10",
    notes:
      "Hours: daily 10am-5pm per Yelp; not stated on the site itself. A separate Yelp listing for \"T1 Airsoft\" at 1002 SW 104th St (a different part of the city) also exists, updated April 2026 — likely a retail/pro-shop location rather than the field itself; used the field's own address instead. No admission pricing published on the site.",
  },
  {
    id: "jtc-tactical",
    name: "JTC Tactical",
    city: "Beggs, OK",
    address: "8455 US-75, Beggs, OK 74421",
    phone: "918-752-4168",
    website: "https://www.jtctactical.com",
    ownerEmailDomain: "jtctactical.com",
    facebook: "https://www.facebook.com/jtctactical",
    instagram: "https://www.instagram.com/jtc_tactical/",
    indoorOutdoor: "outdoor",
    admission: "Day pass: $25; equipment rental: $20",
    about:
      "70-acre outdoor airsoft/milsim field billed as one of the most realistic and immersive in Oklahoma, with a town-style arena (4 buildings, vehicles, a pool, boats) plus lightly wooded flat terrain and heavily wooded, sloping, rocky terrain. Open Saturdays 9am-5pm for open play; private party rentals by appointment weekdays and Sundays.",
    status: "active",
    dataSource: "website",
    lastScraped: "2026-09-10",
  },
  {
    id: "misfit-tactical-airsoft",
    name: "Misfit Tactical Airsoft",
    city: "Ninnekah, OK",
    address: "867 County Road 1453, Ninnekah, OK 73067",
    phone: "308-241-1018",
    website: "https://misfittacticalairsoft.com",
    ownerEmailDomain: "misfittacticalairsoft.com",
    facebook: "https://www.facebook.com/Misfittacticalairsoftllc/",
    instagram: "https://www.instagram.com/misfittacticalairsoftllc/",
    indoorOutdoor: "outdoor",
    admission: "Field fee (summer hours, per block): $15; face pro rental $10; full rental package (gun, mag, face pro, 1000 BBs, sling, barrel cover, battery, plus field fee) $35",
    about:
      "Veteran-owned outdoor airsoft field just outside the OKC metro, operating since 2022. Summer open-play blocks run 9am-2pm and 4pm-9pm. Also runs birthday party packages (Nerf, airsoft, and full-service tiers) and has a separate pro shop address in nearby Chickasha.",
    status: "active",
    dataSource: "website",
    lastScraped: "2026-09-10",
    notes: "Pro shop (retail only, not the field) is a separate address: 1427 S 4th Street, Chickasha, OK 73018.",
  },
];

// Considered and excluded (Oklahoma) — do not add without re-verifying:
//   - Stockyard Airsoft (Oklahoma City, formerly 2801 SW 15th St): a 200,000 sq ft indoor field that turns up on several directories, but Yelp explicitly marks it "CLOSED - Updated June 2025" — closed.
//   - Epic Paintball Park (Oklahoma City): real, active, own website — but paintball only, no mention of airsoft anywhere on the site.
//   - AES / Avid Extreme Sports Parks (Guthrie and Newcastle, OK locations): real, active paintball parks — but explicitly "everything paintball" per their own site, no airsoft mentioned.
//   - Cross Fire / CrossFire Armory LLC (Altus, OK): a real venue (former rail-car storage building, 3 playing fields) used at least once by the SOL Airsoft roaming-field group, but its own branding (Facebook/Instagram: "Altus Crossfire Paintball," "Cross Fire Paintball") and every direct source found describe it as a paintball venue — no independent confirmation it regularly offers airsoft rather than having hosted a one-off group booking. NOTE: a same-named "Crossfire Airsoft" is a real, unrelated business in Clearwater, MN and Sioux Falls, SD — do not confuse the two in future MN/SD batches.
//   - SOL Sector (Cache, OK) and West Lawtonka (Medicine Park, OK): both appear only on the SOL Airsoft group's own roaming-field list as a "Private Field" and "Public Lands" site respectively — no business name, address, or public booking info found for either; not verifiable as bookable venues.
