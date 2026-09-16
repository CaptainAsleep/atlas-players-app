// MERGED into seed-data.mjs on 2026-09-16 -- kept here as a record of the
// research/sourcing behind each entry. No longer a live draft.

// Draft candidates researched 2026-09-16 from the CFF lead list
// (../../cff-candidate-fields.md). NOT merged into seed-data.mjs yet —
// awaiting Michael's review. Each entry verified against its own
// website/social media, not just taken from Combat Field Finder's listing.
// imageUrl left as TODO — grab a real hosted photo from each site before
// merging, same as every other field entry.

const cffDraftFields = [
  {
    id: "weekend-warriors-paintball-alpine",
    name: "Weekend Warriors Paintball (Modern Airsoft Park)",
    city: "Alpine, CA",
    address: "25 Browns Rd, Alpine, CA 91901",
    phone: "(866) 985-4932",
    website: "https://weekendwarriorspaintball.com",
    ownerEmailDomain: "weekendwarriorspaintball.com",
    facebook: "https://facebook.com/thepaintballpark",
    instagram: "https://instagram.com/thepbpark/",
    youtube: "https://youtube.com/user/ThePaintballPark",
    indoorOutdoor: "outdoor",
    admission: "Walk-on Sat-Sun 9:30am-4pm; private groups (15+) available 7 days/week",
    about:
      "Long-running San Diego-area outdoor field offering paintball, airsoft, and Paintball Lite (a modified format for younger players). NOTE: this is a different physical venue from Atlas's existing Camp Pendleton entry (paintball-park-camp-pendleton, Oceanside) even though CFF's listing for THAT entry is titled \"Modern Airsoft Park\" — the real Modern Airsoft Park / Weekend Warriors Paintball is at 25 Browns Rd, Alpine, CA, about 50 miles from Oceanside. Worth checking whether the Camp Pendleton entry's \"(Modern Airsoft Park)\" alias is a mistaken conflation of two different places before merging this.",
    imageUrl: "TODO",
    status: "active",
    dataSource: "website",
    lastScraped: "2026-09-16",
  },
  {
    id: "nitehawk-airsoft-paintball-ford",
    name: "NiteHawk Paintball & Airsoft",
    city: "Ford, WA",
    address: "39490 WA-231, Ford, WA 99013",
    phone: "(509) 919-4569",
    website: "https://nitehawkpaintball.com",
    ownerEmailDomain: "nitehawkpaintball.com",
    facebook: "https://www.facebook.com/NitehawkAirsoft/",
    indoorOutdoor: "outdoor",
    admission: "See site for current airsoft/paintball event tickets",
    about:
      "Outdoor tactical scenario park near Spokane offering both paintball and airsoft. First field seeded in Washington state for Atlas. NOTE: Yelp shows this listing as \"CLOSED\" (a stale-directory error) — the business's own site is current and active, with a live fire-season pyro restriction notice and active event ticket pages, confirming real ongoing operation.",
    imageUrl: "TODO",
    status: "active",
    dataSource: "website",
    lastScraped: "2026-09-16",
  },
  {
    id: "sector-9-airsoft",
    name: "Sector 9 Airsoft",
    city: "Hornsby, TN",
    address: "12380 Powell Chapel Rd, Hornsby, TN 38044",
    phone: "(901) 239-2708",
    website: "https://www.sector-9-airsoft.com",
    ownerEmailDomain: "sector-9-airsoft.com",
    facebook: "https://www.facebook.com/thesector901/",
    instagram: "https://www.instagram.com/explore/locations/1558828330912750/sector-9-airsoft/",
    indoorOutdoor: "outdoor",
    admission: "See site /openplay for current schedule/pricing",
    about:
      "Well-documented active airsoft field with its own site (schedule + contact pages confirmed live), Facebook, Instagram, and TikTok presence. Address sourced from independent directory mirrors (find-open.com, nnacademy.com) since the sector-9-airsoft.com contact page itself couldn't be fetched directly (robots.txt) — worth a manual double-check of the address against the site before merging.",
    imageUrl: "TODO",
    status: "active",
    dataSource: "directory-corroborated",
    lastScraped: "2026-09-16",
  },
  {
    id: "picasso-lake-airsoft-paintball-winslow",
    name: "Picasso Lake Airsoft and Paintball",
    city: "Winslow Township, NJ",
    address: "64 Norcross Road, Winslow Township, NJ 08009",
    phone: "(856) 281-8402",
    website: "https://www.picassolakeap.com",
    ownerEmailDomain: "picassolakeap.com",
    facebook: "https://www.facebook.com/Picassolakepaintball",
    instagram: "https://instagram.com/plpaintball",
    discord: "https://discord.gg/bdBStEaxDr",
    indoorOutdoor: "outdoor",
    admission: "Open fields Sat-Sun 9am-4pm, open rain or shine; weekdays by reservation",
    about:
      "First field seeded in New Jersey for Atlas. 110-acre facility with 9 fields, operating since 1993 under recently new ownership (\"Family Owned Family Operated Family Friendly Airsoft and Paintball\"). Some third-party listings tag this as \"Berlin, NJ\" — resolved via the business's own site, which gives Winslow Township as the real address (Berlin is an adjacent town, likely an imprecise Facebook geotag).",
    imageUrl: "TODO",
    status: "active",
    dataSource: "website",
    lastScraped: "2026-09-16",
  },
];

// ---- Include-with-caution — real businesses, but weaker confirmation on
// either current airsoft offering or address freshness. Flagged for
// Michael's call rather than drafted as ready entries.
//
// Wildfire Paintball — Madison, GA (2641 Hestertown Rd, Madison, GA 30650):
//   real multi-location business (indoor shop in Snellville, outdoor field +
//   airsoft specifically at this Madison address). Site's copyright footer
//   reads 2015, so "operating status cannot be confirmed" from the site
//   alone — phone/email are live and the site itself is reachable, but this
//   needs an activity spot-check (recent Facebook/event posts) before
//   trusting it the way the drafted fields above can be.
//
// P3 Airsoft — Curtis Bay Industrial Area, Baltimore, MD (7360 Carbide Rd):
//   no independent website found, only two Facebook pages and a directions
//   aggregator. The same aggregator also separately lists "P3 Paintball" at
//   the identical address, suggesting this may be primarily a paintball
//   venue with airsoft as a secondary/uncertain offering. Thin, single-type
//   sourcing — same caution level as prior batches' AirsoftC3-only entries.
//
// Preston County Paintball — Masontown/Mount Nebo, WV: real, established
//   business (2021 local newspaper profile of the owner), but branded and
//   known everywhere as a PAINTBALL business, not airsoft — the only airsoft
//   signal is a single old Facebook photo captioned "New stuff at PCPB today
//   Airsoft...". Direct Facebook/site fetch was blocked by robots.txt, so
//   this couldn't be confirmed either way. Genuinely unclear whether airsoft
//   is a real ongoing offering there or a one-off equipment purchase.

// ---- Excluded — not fields (retail stores / no fixed venue)
//
// JF Paintball & Airsoft — Grass Valley, CA: 25+ year retail store selling
//   and servicing paintball/airsoft/air-rifle gear. No field/venue described
//   anywhere on its own site — this is a shop, not a place to play.
//
// AIRSOFT 99 — Fairfield, CA: confirmed via multiple independent sources
//   (highspeedbbs.com explicitly: "Airsoft Supply Store and Gun Shop";
//   MallsCenters lists it as a retail tenant of the Solano Town Center mall).
//   CFF's own listing calls it "an outdoor airsoft facility," which appears
//   to be simply wrong — another data-quality strike against trusting CFF's
//   listings at face value.
//
// AirsoftMaster — City of Industry, CA: pure online e-commerce retailer,
//   no physical venue at all.
//
// TAAGS Airsoft — Kent, WA area: appears to be an event-based airsoft group
//   that plays games at rented/borrowed sites around Kent rather than
//   operating one fixed venue of its own — no address ever surfaced across
//   its Square site, Meetup page, or forum posts. Same "no fixed venue, out
//   of scope for the current fields schema" call already made for Desert Fox
//   Airsoft Events during the California batch.

export default cffDraftFields;
