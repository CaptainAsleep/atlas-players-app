// DRAFT — field-seeding candidates for Wisconsin, researched 2026-09-10.
//
// This is NOT wired into seed-data.mjs and does NOT touch the live database.
// Review each entry, then copy whichever ones you approve into the `fields`
// array in seed-data.mjs before running it.
//
// Every entry below was verified by fetching the field's own website, with
// one exception clearly flagged in its own notes (Airsoft Arena Milwaukee —
// no owned website exists, so it's corroborated across multiple independent
// third-party directories instead, same as the existing MI facebook_only
// entries already in seed-data.mjs). Several other candidates were
// researched and deliberately EXCLUDED as closed, unverifiable, out of
// state, or not actually offering airsoft — see the list at the bottom of
// this file. This is a smaller batch than Indiana/Ohio/Illinois — Wisconsin
// genuinely turned up fewer verifiable candidates, so this list wasn't
// padded to match their size.

// ---- WISCONSIN ---------------------------------------------------------------
export const wisconsinFields = [
  {
    id: "action-sports-wisconsin",
    name: "Action Sports Wisconsin",
    city: "Mauston, WI",
    address: "N6089 County Road G, Mauston, WI 53948",
    phone: "(608) 234-8323",
    website: "https://www.actionsportswisconsin.com",
    ownerEmailDomain: "actionsportswisconsin.com",
    facebook: "https://www.facebook.com/ActionSportsWisconsin",
    instagram: "https://www.instagram.com/ActionSportsWisconsin",
    indoorOutdoor: "outdoor",
    admission: "Walk-on admission $25; rental/admission package $50",
    about:
      "86-acre outdoor complex billed as the largest multi-story outdoor urban combat field in the Midwest, with a mock city built from 40 shipping containers. Open play weekends year-round (closed in severe weather or below 30°F), private groups by appointment on weekdays.",
    imageUrl:
      "https://static.wixstatic.com/media/0fec9d_657d456be3d74da8ba254e3b74e3e43d~mv2.png/v1/fill/w_1535,h_983,al_c/0fec9d_657d456be3d74da8ba254e3b74e3e43d~mv2.png",
    status: "active",
    dataSource: "website",
    lastScraped: "2026-09-10",
  },
  {
    id: "black-ops-airsoft",
    name: "Black Ops Airsoft",
    city: "Bristol, WI",
    address: "8025 128th Ave, Bristol, WI 53104",
    phone: "(847) 913-5216",
    website: "https://www.blackops-airsoft.com",
    ownerEmailDomain: "blackops-airsoft.com",
    discord: "https://discord.gg/xq4xNmrEWp",
    indoorOutdoor: "outdoor",
    about:
      "Billed on its own site as the Midwest's largest pay-to-play airsoft-only field (not a paintball crossover venue), near the Kenosha/Chicago border. Open Friday through Sunday, with an events calendar running through 2026.",
    imageUrl: "https://media.rainpos.com/8768/ss_8768_5464411_1.jpg",
    status: "active",
    dataSource: "website",
    lastScraped: "2026-09-10",
    notes:
      "No public admission pricing found on the homepage (rentals/pricing live in a separate shop section not fetched) — omitted rather than estimated.",
  },
  {
    id: "commando-paintball",
    name: "Commando Paintball Sports",
    city: "Little Suamico, WI",
    address: "2055 W Frontier Rd, Little Suamico, WI 54141",
    phone: "(920) 826-5554",
    website: "https://www.commandopaintballsports.com",
    ownerEmailDomain: "commandopaintballsports.com",
    facebook: "https://www.facebook.com/commandopaintballsports",
    indoorOutdoor: "outdoor",
    about:
      "Paintball-and-airsoft park about 20 miles north of Green Bay; airsoft is explicitly listed in its own pricing menu alongside named seasonal airsoft scenario events (Memorial Day, Labor Day). Open year-round: summer weekends 9am-5pm/4pm, weekdays by reservation.",
    imageUrl:
      "https://irp.cdn-website.com/090f05aa/dms3rep/multi/opt/wd-commando-paintball-9344-1920w.webp",
    status: "active",
    dataSource: "website",
    lastScraped: "2026-09-10",
    notes:
      "Specific admission pricing lives on separate activity pages not fetched; omitted rather than estimated.",
  },
  {
    id: "edge-paintball-airsoft",
    name: "Edge Paintball and Airsoft",
    city: "Janesville, WI",
    address: "5946 US-51, Janesville, WI 53546",
    phone: "(608) 931-3517",
    website: "https://www.608pb.com",
    ownerEmailDomain: "608pb.com",
    facebook: "https://www.facebook.com/608PB",
    instagram: "https://www.instagram.com/edge_paintball_airsoft",
    indoorOutdoor: "outdoor",
    about:
      "Paintball-and-airsoft field serving the Janesville/Beloit area, with airsoft named directly in the business's own name and a dedicated \"AirSoft Info\" section on its site. Open Saturday and Sunday 9am-4pm; weekdays are private-booking only.",
    imageUrl: "https://static.wixstatic.com/media/a0b6e9_b4f74a1f2ed24084ae9d5238ac1bc9cb~mv2.png",
    status: "active",
    dataSource: "website",
    lastScraped: "2026-09-10",
    notes:
      "No pricing published on the homepage — bookings and pricing both live through a third-party reservation system (vantora.com) not fetched; omitted rather than estimated.",
  },
  {
    id: "airsoft-arena-milwaukee",
    name: "Airsoft Arena",
    city: "Milwaukee, WI",
    address: "1020 W Historic Mitchell St, Milwaukee, WI 53204",
    facebook: "https://www.facebook.com/AirsoftArenaWi/",
    instagram: "https://www.instagram.com/airsoftarenamilwaukee/",
    indoorOutdoor: "indoor",
    about:
      "Described by third-party directories as Wisconsin's largest indoor airsoft facility at 40,000 sq ft, running year-round CQB gameplay in Milwaukee's Walker's Point neighborhood.",
    status: "facebook_only",
    dataSource: "Facebook + Yelp + Groupon + AirsoftC3 (no owned business website found)",
    lastScraped: "2026-09-10",
    notes:
      "The one exception to this batch's own-website rule: no dedicated business website was found for this facility, only social media and third-party directories. The exact same name, address, and description ('40,000 sq ft', 'largest indoor') appear consistently across Yelp, Groupon, and two separate AirsoftC3 listings, which is why it's included at all — but treated as status: facebook_only (same as several existing Michigan entries in this file) rather than active, since claim verification and up-to-date hours/pricing can't be confirmed from a primary source. A human should confirm this is still operating before publishing.",
  },
];

// Considered and excluded (Wisconsin) — do not add without re-verifying:
//   - Cedar Airsoft Field: one aggregator lists it as "Cedar, WI," but the field's own site confirms it's actually in Cedar Springs, MI (already correctly seeded as cedar-airsoft-field under Michigan) — an aggregator data error, not a real Wisconsin field.
//   - Siege Paintball (Big Bend, WI — several directories list it under nearby Mukwonago): paintball-primary; airsoft is only mentioned once in passing as a possible party activity, with no dedicated airsoft pricing, schedule, or program found — too thin to include as an airsoft field.
//   - Twin Cities Airsoft: own site never actually states which state it's physically in (serves "Minnesota and Wisconsin," 45 minutes from the Twin Cities), and its own Facebook presence is split between two different Wisconsin towns (Baldwin vs. Emerald) — couldn't verify a real Wisconsin location from a primary source.
//   - Apocalypse Paintball (Poynette, WI): confirmed via its own site to be paintball-only ("Wisconsin's Largest Paintball Field") with no airsoft offering at all.
//   - Airsoft Jungle Club (Milwaukee, WI): appears permanently closed (a French-language Foursquare listing marks it "Fermé maintenant" / closed).
//   - Promised Land Paintball (Trevor, WI): no owned website found, and the only community references (an Airsoft Forum post, a Nextdoor page) date back roughly a decade — couldn't confirm it's still operating.
//   - Coverfire Paintball & Airsoft (Warrens, WI): searches turned up essentially nothing usable — no owned website, no recent directory listings, no way to verify it still exists.
//   - Boneyard Paintball (Plymouth, WI): no owned website found (only Facebook, Nextdoor, Yelp, and an inactive-looking blogspot page) — couldn't independently verify current airsoft offering or status.
