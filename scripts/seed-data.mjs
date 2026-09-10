// Run locally once (or whenever you want to re-seed) with:
//   node scripts/seed-data.mjs
//
// Requires a Firebase service account key saved as scripts/serviceAccountKey.json
// (Firebase Console -> Project Settings -> Service Accounts -> Generate new private key).
// That file is gitignored — never commit it.

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "fs";

const serviceAccount = JSON.parse(
  readFileSync(new URL("./serviceAccountKey.json", import.meta.url))
);

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

// ---- FIELDS -------------------------------------------------------------
// Compiled from the Michigan sheet plus a live pass over each field's own
// website on 2026-08-23. `status` flags how reliable future automated
// updates will be for that field.
const fields = [
  {
    id: "cedar-airsoft-field",
    name: "Cedar Airsoft Field",
    city: "Cedar Springs, MI",
    address: "17370 Trenton Ave NE, Cedar Springs, MI 49319",
    phone: "(616) 520-3212",
    website: "https://www.cedarairsoftfield.com",
    ownerEmailDomain: "cedarairsoftfield.com", // for owner-app claim verification — must match the claiming email's domain
    facebook: "https://www.facebook.com/CedarAirsoftField",
    instagram: "https://www.instagram.com/cedarairsoft/",
    youtube: "https://www.youtube.com/channel/UCL5Nqz78FYM2UR3WV9ELx0w",
    indoorOutdoor: "outdoor",
    admission: "$20/player/day",
    about:
      "10-acre outdoor field north of Grand Rapids running an event-style schedule of rec days and larger events.",
    imageUrl:
      "https://images.squarespace-cdn.com/content/v1/6262f3f5e4f2770c486b0829/4c8e4e03-2dfb-4c5f-a445-ff70d4613b84/539384491_1254797379773738_374968517996269722_n.jpg",
    status: "active",
    dataSource: "website",
    lastScraped: "2026-08-23",
  },
  {
    id: "darkfire-airsoft",
    name: "Darkfire Airsoft",
    city: "Hillsdale, MI",
    address: "1609 S Lake Wilson Rd, Hillsdale, MI 49242",
    website: "https://www.darkfireairsoft.com",
    ownerEmailDomain: "darkfireairsoft.com", // for owner-app claim verification — must match the claiming email's domain
    facebook: "https://www.facebook.com/DarkFireAirsoft/",
    instagram: "https://www.instagram.com/darkfireairsoft/",
    youtube: "https://www.youtube.com/channel/UC7oCGVg8g_1T2bv4bgv16RQ",
    discord: "https://discord.gg/6FwQZaH7fg",
    indoorOutdoor: "outdoor",
    about:
      "38-acre outdoor field running open plays and larger milsim-style operations; standard open-play schedule is gates at 9am, briefing 10am, games 10:30am-5pm.",
    imageUrl:
      "https://static.wixstatic.com/media/6282e125651246cf8362f57d8d5a9b67.jpg/v1/fill/w_1920,h_1280,al_c,q_90,enc_avif,quality_auto/6282e125651246cf8362f57d8d5a9b67.jpg",
    status: "active",
    dataSource: "website",
    lastScraped: "2026-08-23",
    notes:
      "As of 2026 also hosts events for two fields that lost their own properties: WASTE and Sektor7.",
  },
  {
    id: "futureball",
    name: "Futureball",
    city: "Whitmore Lake, MI",
    address: "10799 Hi Tech Dr, Whitmore Lake, MI 48189",
    phone: "(248) 446-0772",
    website: "https://www.futureball.com",
    ownerEmailDomain: "futureball.com", // for owner-app claim verification — must match the claiming email's domain
    facebook: "https://www.facebook.com/FutureballParks",
    instagram: "https://www.instagram.com/futureballparks/",
    tiktok: "https://www.tiktok.com/@futureballparks",
    indoorOutdoor: "outdoor",
    about:
      "Large outdoor paintball and airsoft park with regular weekend public-play sessions plus named big-game events through the season.",
    imageUrl: "https://www.futureball.com/wp-content/uploads/2025/02/472333646_122128428062561121_6556266903748369289_n-256x300.jpg",
    status: "active",
    dataSource: "website",
    lastScraped: "2026-08-23",
  },
  {
    id: "the-compound",
    name: "The Compound",
    city: "Auburn, MI",
    address: "1154 W Seidlers Rd, Auburn, MI 48611",
    website: "https://www.thecompoundairsoft.com",
    ownerEmailDomain: "thecompoundairsoft.com", // for owner-app claim verification — must match the claiming email's domain
    facebook: "https://www.facebook.com/profile.php?id=100090353510201",
    discord: "https://www.discord.com/users/240571",
    youtube: "https://www.youtube.com/channel/UCJ8rxC9oaGJY5Qmetr72Ycw",
    indoorOutdoor: "outdoor",
    admission: "$20/person",
    about:
      "Outdoor field running capped open-play events (50 players) with custom scenario rounds, roughly quarterly.",
    imageUrl: "https://img1.wsimg.com/isteam/ip/ec5d8dd8-d89f-4c7e-90be-3eaf25e1aa35/2.0.jpg",
    status: "active",
    dataSource: "website",
    lastScraped: "2026-08-23",
    // Showcase field for the eventual Teams feature — DTB is the local team
    // that calls this field home. Schema is generic (name + patchUrl) so any
    // field/team pairing works the same way once real Teams data exists.
    homeTeam: {
      name: "DTB",
      patchUrl: "https://img1.wsimg.com/isteam/ip/ec5d8dd8-d89f-4c7e-90be-3eaf25e1aa35/DTB_Patch.png/:/rs=w:365,h:365,cg:true,m/cr=w:365,h:365",
    },
    // Real, from the field's own website "Rental Kits" section. Kit 2's
    // pricing was ambiguous on the source page (shown as three stacked $5
    // line items rather than one clear total) — represented honestly as
    // "$5 per add-on" rather than guessing a bundled price that might be wrong.
    rentals: [
      {
        name: "Rental Kit",
        price: "$30",
        includes: "AEG rifle, 1 high-cap magazine, mask",
        availability: "12 available per event — must pre-pay to hold",
      },
      {
        name: "Chest Rig + Mags",
        price: "$5 per add-on",
        includes: "Chest rig (size/type may vary), 3 mid-cap magazines",
        availability: "6 available per event — must pre-pay to hold",
      },
    ],
    // Real, from the field's own Field Rules / Disclaimer page.
    rules: [
      "No real firearms or weapons of any kind allowed on the property at any time. No drugs or alcohol.",
      "Players must be at least 8 years old. Under age 10 must have a parent playing with them; under age 12 must have a parent or guardian on site.",
      "A signed waiver is required for every event — online in advance, or in person at the check-in kiosk.",
      "All guns must be chrono tested every visit, using field-provided BBs (bring an empty mag). Max rate of fire is 20 RPS.",
      "Pistols must be safetied and holstered; all guns safetied with mags removed and barrel bags on except when actively on the playing field.",
      "No deliberate overshooting — repeatedly shooting a player after they've called \"hit\" draws a verbal warning, then removal from the field.",
      "No physical contact or threats between players, beyond a light tap to call a \"bang.\" Bring disputes to a referee or admin rather than arguing on the field.",
      "Stay within field boundaries. No altering field props or climbing structures/trees. No blind fire.",
      "Full face protection required at all times on the field — a paintball mask or full-seal goggles with strap plus a lower mesh face protector. Mesh goggles and plain safety glasses are not allowed.",
      "Zero tolerance for adjusting an HPA gun to a higher FPS/RPS after passing chrono — you'll be re-chronoed on the spot and escorted off if caught.",
    ],
    chrono: {
      aeg: "400 FPS max (0.20g), 1.49 J max, 20 RPS max",
      sniper: "518 FPS max (0.20g), 2.49 J max, semi-auto only",
      dmr: "1.86 J max, semi-auto only",
    },
  },
  {
    id: "tc-paintball-north",
    name: "TC Paintball North",
    city: "Traverse City, MI",
    address: "1825 M-37 S, Traverse City, MI 49685",
    phone: "(231) 943-0248",
    website: "https://www.tcpaintballnorth.com",
    ownerEmailDomain: "tcpaintballnorth.com", // for owner-app claim verification — must match the claiming email's domain
    facebook: "https://www.facebook.com/tcpaintball/",
    indoorOutdoor: "outdoor",
    hours: "Open play Sundays 12-5pm at the Copemish field, no reservation needed",
    about: "Paintball and airsoft park with a Traverse City retail shop and a Copemish playing field.",
    imageUrl:
      "https://static.wixstatic.com/media/274f48_2d410502d70b48019e12ff14f3ffa8b5~mv2.jpg/v1/fill/w_1920,h_932,al_c,q_85,enc_avif,quality_auto/store%20field.jpg",
    status: "active",
    dataSource: "website",
    lastScraped: "2026-08-23",
  },
  {
    id: "cru-paintball",
    name: "CRU Paintball",
    city: "Mt Morris, MI",
    address: "1395 Mount Morris Rd, Mt Morris, MI 48458",
    phone: "(810) 785-2278",
    website: "https://crupaintball.com",
    ownerEmailDomain: "crupaintball.com", // for owner-app claim verification — must match the claiming email's domain
    facebook: "https://www.facebook.com/CRU-Paintball-LLC-192654563335/",
    indoorOutdoor: "outdoor",
    hours: "Saturday 10am-dark, Sunday 11am-5pm",
    about: "100-acre woodsball field offering open play and group/party bookings.",
    status: "no-airsoft",
    notes: "Site makes no mention of airsoft anywhere — \"woodsball\" (paintball) only, dedicated events calendar is empty. Confirmed 2026-09-08, per Michael.",
    dataSource: "website",
    lastScraped: "2026-09-08",
  },
  {
    id: "tc-paintball-grand-rapids",
    name: "TC Paintball Grand Rapids",
    city: "Walker, MI",
    address: "2070 Waldorf St NW, Walker, MI 49544",
    phone: "(616) 249-8227",
    website: "https://www.tcpaintballgr.com",
    ownerEmailDomain: "tcpaintballgr.com", // for owner-app claim verification — must match the claiming email's domain
    facebook: "https://www.facebook.com/p/TC-Paintball-GR-100035350042217/",
    instagram: "https://www.instagram.com/explore/locations/18328887/tc-paintball-gr",
    indoorOutdoor: "indoor + outdoor",
    hours: "Random Draw League Nights Fridays 6pm; open year-round, reservations required",
    about: "Indoor paintball arena open year-round, with a new outdoor field added in 2026.",
    status: "no-airsoft",
    notes: "Does not host airsoft events — indoor paintball arena plus youth/teen paintball leagues only. Confirmed 2026-09-08, per Michael.",
    dataSource: "website",
    lastScraped: "2026-09-08",
  },
  {
    id: "capital-city-paintball",
    name: "Capital City Paintball",
    aka: "formerly TC Paintball Lansing",
    city: "Charlotte, MI",
    address: "3262 McConnell Hwy, Charlotte, MI 48813",
    phone: "(517) 224-9034",
    website: "https://www.capitalcitypaintball.com",
    ownerEmailDomain: "capitalcitypaintball.com", // for owner-app claim verification — must match the claiming email's domain
    facebook: "https://www.facebook.com/share/1HQPwRgWcQ/",
    instagram: "https://www.instagram.com/paintballcapitalcity",
    discord: "https://discord.gg/VBTApvwdwS",
    indoorOutdoor: "outdoor",
    status: "no-airsoft",
    notes: "TC Paintball Lansing rebranded to Capital City Paintball at the same address. Site shows no active airsoft program — one stray \"AIRSOFT DATES 7/26/2026, Entry $25\" line and nothing since. Confirmed 2026-09-08, per Michael.",
    dataSource: "website",
    lastScraped: "2026-09-08",
  },
  {
    id: "hell-survivors",
    name: "Hell Survivors",
    city: "Pinckney, MI",
    address: "619 Pearl St (D-19), Pinckney, MI 48169",
    phone: "(734) 878-5656",
    website: "https://www.hellsurvivors.com",
    ownerEmailDomain: "hellsurvivors.com", // for owner-app claim verification — must match the claiming email's domain
    facebook: "https://www.facebook.com/HellSurvivors",
    instagram: "https://www.instagram.com/hellsurvivors/",
    tiktok: "https://www.tiktok.com/@hellsurvivorspaintball",
    youtube: "https://www.youtube.com/channel/UCA06NW8H1VyyIOszXZH9H9A",
    indoorOutdoor: "outdoor",
    about: "Themed outdoor paintball field with multiple battle zones; booking runs through an embedded FareHarbor calendar.",
    imageUrl:
      "https://static.wixstatic.com/media/78a56e_97bd927a2b284e82bbd82f882e0d3788~mv2.jpg/v1/fill/w_642,h_492,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/440957598_999534732178694_6331911926097574916_n.jpg",
    status: "active",
    dataSource: "website",
    lastScraped: "2026-08-23",
    notes: "Live event dates are inside a FareHarbor booking widget, not static HTML — needs a targeted follow-up pass.",
  },
  {
    id: "total-control",
    name: "Total Control Paintball & Airsoft",
    city: "Niles, MI",
    address: "2726 S 11th St Suite 20, Niles, MI 49120",
    phone: "(574) 277-4493",
    website: "https://www.totalcontrolpaintball.net",
    ownerEmailDomain: "totalcontrolpaintball.net", // for owner-app claim verification — must match the claiming email's domain
    facebook: "https://www.facebook.com/Totalcontrolpb",
    indoorOutdoor: "outdoor",
    hours: "Pro shop: Tue-Fri 11am-7pm, Sat 12-5pm, closed Sun/Mon",
    imageUrl:
      "https://images.squarespace-cdn.com/content/v1/61d7b2bfa282352059b4cd24/251e9c3e-9870-485e-b4c2-d992d51e2690/TCP+Field+Sign.jpg",
    status: "closed",
    notes: "Playing field closed (site itself lists it CLOSED); per Michael, appears to have sold the property. Confirmed 2026-09-08.",
    dataSource: "website",
    lastScraped: "2026-09-08",
  },
  {
    id: "nest-of-vipers",
    name: "Nest of Vipers",
    city: "Coopersville, MI",
    address: "15074 104th Ave, Coopersville, MI 49404",
    website: "https://nestofvipersairsoft.com",
    ownerEmailDomain: "nestofvipersairsoft.com", // for owner-app claim verification — must match the claiming email's domain
    facebook: "https://www.facebook.com/nestofvipersairsoft",
    indoorOutdoor: "outdoor",
    status: "closed",
    notes: "Field closed — July 14, 2026 event was confirmed as the final event at this location, per Michael. Confirmed 2026-09-08.",
    dataSource: "website",
    lastScraped: "2026-09-08",
  },
  {
    id: "motorcity-airsoft",
    name: "Motorcity Airsoft",
    city: "Clinton Township, MI",
    address: "37555 South Gratiot, Clinton Township, MI 48036",
    website: "https://www.motorcityairsoft.com/",
    ownerEmailDomain: "motorcityairsoft.com", // for owner-app claim verification — must match the claiming email's domain
    facebook: "https://www.facebook.com/motorcityairsoft",
    instagram: "https://www.instagram.com/motorcityairsoft/",
    indoorOutdoor: "indoor",
    status: "unscrapable",
    notes: "Site renders via JavaScript (Square Online) — homepage fetch returns no content. Use Facebook/Places data instead.",
    dataSource: "sheet",
  },
  {
    id: "hole-in-the-wall",
    name: "Hole in the Wall Paintball",
    city: "Bangor, MI",
    address: "24262 66th Street, Bangor, MI 49013",
    website: "https://holeinthewallpaintballmi.com",
    ownerEmailDomain: "holeinthewallpaintballmi.com", // for owner-app claim verification — must match the claiming email's domain
    facebook: "https://www.facebook.com/holeinthewallpaintball",
    indoorOutdoor: "outdoor",
    status: "unscrapable",
    notes: "Site returns an empty shell on fetch — likely JS-rendered.",
    dataSource: "sheet",
  },
  {
    id: "black-river-forest",
    name: "Black River Forest",
    city: "Croswell, MI",
    address: "3703 Black River Rd, Croswell, MI 48422",
    facebook: "https://www.facebook.com/profile.php?id=100076064678587",
    indoorOutdoor: "outdoor",
    status: "facebook_only",
    dataSource: "sheet",
  },
  {
    id: "bloomingdale-airsoft-paintball",
    name: "Bloomingdale Airsoft and Paintball (B.A.P.)",
    city: "Bloomingdale, MI",
    facebook: "https://www.facebook.com/profile.php?id=61551039470868",
    indoorOutdoor: "outdoor",
    status: "facebook_only",
    dataSource: "sheet",
  },
  {
    id: "creekside",
    name: "Creekside",
    city: "Hope, MI",
    address: "5590 N Stark Rd, Hope, MI 48628",
    facebook: "https://www.facebook.com/groups/1240569739967208",
    indoorOutdoor: "outdoor",
    status: "facebook_only",
    dataSource: "sheet",
  },
  {
    id: "kizzy-field",
    name: "Kizzy Field",
    city: "Webberville, MI",
    address: "2020 Elm Rd, Webberville, MI 48892",
    facebook: "https://www.facebook.com/KizzyField",
    indoorOutdoor: "outdoor",
    status: "closed",
    notes: "Shut down in 2024, per Michael. Confirmed 2026-09-08.",
    dataSource: "sheet",
  },
  {
    id: "sfod-hq",
    name: "SFOD_HQ",
    city: "Montrose, MI",
    address: "7163 Wilson Rd, Montrose, MI 48457",
    facebook: "https://www.facebook.com/sfodairsoft04",
    indoorOutdoor: "outdoor",
    status: "closed",
    notes: "Per Michael (2026-09-08): field may be selling the property. Not independently confirmed (Facebook is unreachable for automated verification) — treated as inactive for now; revisit if this firms up or turns out wrong.",
    dataSource: "sheet",
  },
  {
    id: "tc-extreme-park",
    name: "TC Extreme Park",
    city: "Copemish, MI",
    address: "8257 N 1 Rd, Copemish, MI 49625",
    indoorOutdoor: "outdoor",
    status: "facebook_only",
    notes: "No website or Facebook link found in source sheet.",
    dataSource: "sheet",
  },
  {
    id: "waste",
    name: "WASTE",
    city: "Six Lakes, MI",
    address: "5954 N Hillman Rd, Six Lakes, MI 48886",
    facebook: "https://www.facebook.com/WasteAirsoftLARP",
    indoorOutdoor: "outdoor",
    status: "relocated",
    relocatedTo: "darkfire-airsoft",
    notes: "Per Darkfire Airsoft's site, WASTE lost this property in 2026 and now runs events out of Darkfire's Hillsdale field.",
    dataSource: "sheet + darkfireairsoft.com",
  },
  {
    id: "mission-airsoft",
    name: "Mission Airsoft",
    city: "Mount Pleasant, MI",
    // No confirmed street address found — missionairsoft.com's homepage is
    // just a closure announcement, and their Facebook page wasn't
    // independently accessible via search. City comes from that Facebook
    // page's title only.
    facebook: "https://www.facebook.com/p/Mission-Airsoft-61558591616098/",
    website: "https://www.missionairsoft.com/",
    ownerEmailDomain: "missionairsoft.com", // for owner-app claim verification — must match the claiming email's domain
    indoorOutdoor: "outdoor",
    status: "closing",
    notes: "Field's own website shows only a permanent closure announcement, but per a recent Facebook post the field was still hosting games as of ~21 hours before this was added. Status is genuinely unclear — confirm directly before planning a visit.",
    dataSource: "user report + missionairsoft.com",
  },
  {
    // Internal test fixture — not a real business. Deliberately has no
    // website/ownerEmailDomain, so claiming it exercises the pending-review
    // path (the fallback every website-less field also uses), safely
    // separate from any real field owner's actual data.
    id: "atlas-field",
    name: "Atlas Field",
    city: "Test City, MI",
    indoorOutdoor: "outdoor",
    about: "Internal test field used to verify the field-owner claim flow. Not a real airsoft field.",
    status: "active",
    dataSource: "test fixture",
  },
  {
    id: "great-lakes-airsoft",
    name: "Great Lakes Airsoft",
    city: "Romulus, MI",
    address: "6680 Inkster Rd, Romulus, MI 48174",
    website: "https://greatlakesairsoft.com",
    ownerEmailDomain: "greatlakesairsoft.com", // for owner-app claim verification — must match the claiming email's domain
    facebook: "https://www.facebook.com/greatlakesairsoft.official",
    instagram: "https://www.instagram.com/greatlakes.airsoft",
    youtube: "https://www.youtube.com/@greatlakesairsoft",
    tiktok: "https://www.tiktok.com/@greatlakesairsoft",
    about:
      "Private-booking venue — exclusive 4-hour tactical sessions for groups of up to 20 players, Friday through Sunday. No public drop-in event calendar; sessions are booked directly through their site rather than browsed/joined the way a typical field's open events are.",
    imageUrl: "https://greatlakesairsoft.com/wp-content/uploads/2026/04/GLAS-1-scaled.png",
    status: "private-booking",
    dataSource: "website",
    lastScraped: "2026-08-28",
    notes:
      "Private-session model only, no public dated events found to seed — inventing fake dates for their rotating session-type menu (Friday Night Battle, Saturday Strike, etc.) would be fabricated data, not real scraped info. indoorOutdoor and admission price also weren't stated anywhere on the site, so left unset rather than guessed. If they ever start running real public open-play events, revisit and add those as real events separately. Per Michael (2026-09-08): stays visible on the map/browse list even though there's nothing to book through Atlas — a real, active business, just not one that fits Atlas's open-event model. See the 'Private-Booking Venues' scope in atlas-status.md for the full plan if they ever want real Atlas bookings.",
  },

  // ---- Indiana (added 2026-09-10, from seed-data-draft-IN.mjs) ------------
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
      "Same business, phone number, and social accounts as htk-airsoft-loogootee below — two physical locations under one brand, same as the Awaken Arena San Antonio/Austin pattern. Site states \"weekly operations paused\"; treat as active-but-irregular rather than closed.",
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
      "Paintball-primary venue, not airsoft-primary — included because airsoft is an explicit, named offering (twice-monthly open play) rather than an incidental mention.",
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

  // ---- Ohio (added 2026-09-10, from seed-data-draft-OH-TX.mjs) -----------
  {
    id: "g2-tactical",
    name: "G2 Tactical",
    city: "Springfield, OH",
    address: "4624 Dayton Springfield Rd, Springfield, OH 45502",
    phone: "(937) 638-6781",
    website: "https://www.g2tact.com",
    ownerEmailDomain: "g2tact.com",
    facebook: "https://www.facebook.com/g2tact/",
    instagram: "https://www.instagram.com/g2tact/",
    indoorOutdoor: "outdoor",
    about:
      "Large outdoor field in Springfield billed on its own site as the largest airsoft/paintball field in Ohio, running airsoft, paintball, and gel blaster play alongside an on-site pro shop and cerakote/tech services.",
    imageUrl:
      "https://137011431.cdn6.editmysite.com/uploads/1/3/7/0/137011431/VL4TU7K5Y745HYGS5MIIS55K.jpeg",
    status: "active",
    dataSource: "website",
    lastScraped: "2026-09-02",
    notes:
      "g2tact.com is JS-rendered and didn't expose address/phone to automated fetch; address and phone were corroborated by two independent business directories (ohiobiz.com and airsoftc3.com) that agree exactly. Recommend a human confirm by phone before publishing.",
  },
  {
    id: "patriots-ridge-airsoft",
    name: "Patriots Ridge Airsoft",
    city: "Bellefontaine, OH",
    address: "2056 US-68, Bellefontaine, OH 43311",
    phone: "(937) 210-6078",
    website: "https://patriotsridgeairso.wixsite.com/my-site",
    ownerEmailDomain: "gmail.com",
    discord: "https://discord.gg/JkTWtUKQc2",
    indoorOutdoor: "outdoor",
    admission: "$20/player/day (rentals also $20)",
    about:
      "Non-profit, volunteer-run outdoor airsoft field at the Logan County Fish and Game property, open to the public Saturdays 10am-3pm and Sundays 12pm-5pm, with proceeds reinvested into field upkeep.",
    imageUrl:
      "https://static.wixstatic.com/media/1208e4_8923763e07734a95942ec98af05421c0~mv2.jpg",
    status: "active",
    dataSource: "website",
    lastScraped: "2026-09-02",
    notes:
      "Business only publishes a free Gmail address and a Wix subdomain (no custom domain), so ownerEmailDomain (gmail.com) will NOT uniquely match the website host — standard domain-match claim verification won't work here; flag for manual owner verification.",
  },
  {
    id: "lvl-up-sports",
    name: "LVL UP Sports",
    city: "Grove City, OH",
    address: "5390 Harrisburg Pike, Grove City, OH 43123",
    phone: "(614) 313-1382",
    website: "https://lvlupsports.com",
    ownerEmailDomain: "lvlupsports.com",
    facebook: "https://www.facebook.com/LVLUPSPORTS",
    instagram: "https://www.instagram.com/lvlupsports/",
    youtube: "https://www.youtube.com/lvlupsports",
    indoorOutdoor: "outdoor",
    admission: "$35/player self-equipped, $55/player rental package",
    about:
      "36-acre outdoor paintball-and-airsoft complex near Columbus with 10+ themed battlefields; hosts private airsoft parties year-round and public airsoft games on the last Sunday of every month.",
    imageUrl: "https://lvlupsports.com/wp-content/uploads/2024/08/airsoft-lvlup.jpg",
    status: "active",
    dataSource: "website",
    lastScraped: "2026-09-02",
  },
  {
    id: "i70-paintball-airsoft",
    name: "i70 Paintball & Airsoft",
    city: "Huber Heights, OH",
    address: "7750 Wildcat Rd, Huber Heights, OH 45424",
    phone: "(937) 237-7070",
    website: "https://www.i70paintball.com",
    ownerEmailDomain: "i70paintball.com",
    facebook: "http://www.facebook.com/i70paintball",
    instagram: "https://www.instagram.com/i70airsoftofficial/",
    indoorOutdoor: "outdoor",
    about:
      "Combined paintball-and-airsoft park in the Dayton area with a full pro shop; runs outdoor open play most weekends year-round plus weekday private events by appointment (10+ people).",
    imageUrl: "https://static.wixstatic.com/media/397e23_be3dc3d1e3ee42caaee77b6f1e3470b1.png",
    status: "active",
    dataSource: "website",
    lastScraped: "2026-09-02",
    notes:
      "Primarily a paintball park that also runs a dedicated airsoft program under a separate Instagram handle (i70airsoftofficial); shares site, address, and staff with the paintball side.",
  },
  {
    id: "splatterpark",
    name: "SplatterPark",
    city: "Mount Gilead, OH",
    address: "5560 County Road 109, Mount Gilead, OH 43338",
    phone: "(419) 946-4964",
    website: "https://www.splatterpark.com",
    ownerEmailDomain: "splatterpark.com",
    facebook: "http://www.facebook.com/SplatterPark",
    instagram: "http://www.instagram.com/splatterparkohio/",
    youtube: "https://www.youtube.com/@Splatterparkpaintball",
    indoorOutdoor: "outdoor",
    admission:
      "$30/player/day airsoft open play; $45.99/$69.99 all-inclusive rental packages",
    about:
      "Outdoor paintball-and-airsoft park operating since 1983 (at its current Mount Gilead site since 2000) with 13 themed battle zones; runs dedicated airsoft open play on Sundays, 10am-5pm.",
    imageUrl: "https://www.splatterpark.com/uploads/5/0/4/7/50471065/img-3531.jpg",
    status: "active",
    dataSource: "website",
    lastScraped: "2026-09-02",
  },
  {
    id: "parkers-airsoft-field",
    name: "Parker's Airsoft Field",
    city: "Bethel, OH",
    address: "3450 Clover Rd, Bethel, OH 45106",
    phone: "(859) 308-7255",
    website: "https://parkersairsoft.com",
    ownerEmailDomain: "parkersairsoft.com",
    indoorOutdoor: "outdoor",
    admission:
      "No flat entry fee published; gun rentals $25/day (membership may be required — see notes)",
    about:
      "25-acre outdoor field in Bethel, OH running MILSIM, Live Action Novel, Modern Conquest, and Open Play game modes on alternating Saturdays, 11am-5pm, with a class-based fps system (AEG 400/LMG-SMG 400+25ft MED/DMR 450+75ft MED/Sniper 500+100ft MED) and an on-site pro shop for rentals, BBs, and gear. Sister field to Action Acres (below).",
    imageUrl:
      "https://img1.wsimg.com/isteam/ip/7da5bb7f-8bfc-4af5-a87b-1443a9307bfd/PARKERS%20AIRSOFT%20FIELD.png/:/cr=t:0%25,l:0%25,w:100%25,h:100%25/rs=w:600,cg:true",
    status: "active",
    dataSource: "website",
    lastScraped: "2026-09-02",
    notes:
      "Previously excluded from this list as 'no owned website' — that was wrong; parkersairsoft.com is their own GoDaddy-built site with a live schedule and shop. No public email or social links found on-site (only a call/text number), so claim verification will need the phone number or a human check rather than an email-domain match. Admission/membership terms aren't fully spelled out on the site — confirm before publishing pricing.",
  },
  {
    id: "action-acres",
    name: "Action Acres",
    city: "New Richmond, OH",
    address: "1757 State Route 232, New Richmond, OH 45157",
    phone: "(859) 308-7255",
    website: "https://parkersairsoft.com/action-acres",
    ownerEmailDomain: "parkersairsoft.com",
    indoorOutdoor: "outdoor",
    admission: "Membership required to play; gun rentals $25/day",
    about:
      "1.5-acre sister field to Parker's Airsoft Field, in New Richmond, OH. Smaller CQB-style farm layout with dug-in fighting positions, overhead cover, and a barn staging area; the site says the layout changes rapidly through the year. Parking is limited — advance sign-up required for events.",
    imageUrl:
      "https://img1.wsimg.com/isteam/ip/7da5bb7f-8bfc-4af5-a87b-1443a9307bfd/ACTION%20ACRES.png/:/cr=t:0%25,l:0%25,w:100%25,h:100%25/rs=w:600,cg:true",
    status: "active",
    dataSource: "website",
    lastScraped: "2026-09-02",
    notes:
      "Shares phone number, owner, and parent website (parkersairsoft.com) with Parker's Airsoft Field above — same claim-verification caveat applies (no public email/social links found).",
  },
  {
    id: "sektor7",
    name: "Sektor7",
    city: "Cleveland, OH",
    website: "https://www.sektor7airsoft.com",
    indoorOutdoor: "outdoor",
    status: "closed",
    relocatedTo: "darkfire-airsoft",
    about:
      "Formerly served the North East Ohio airsoft community. Its own site confirms it's currently closed (\"We are currently closed as we search for our next adventure\"); per Darkfire Airsoft's Michigan profile, Sektor7 lost its property in 2026 and now runs its events out of Darkfire's Hillsdale, MI field.",
    dataSource: "sektor7airsoft.com + darkfireairsoft.com",
    lastScraped: "2026-09-02",
    notes:
      "No precise street address or phone confirmed — site's /about page 404s and Facebook blocks automated fetch; Facebook page title (\"SEKTOR7 | Cleveland OH\") and the site's 216 area-code phone number both point to Cleveland specifically. Kept status: closed (matches the relocated/waste pattern already in this file) rather than active, since the field itself no longer operates at this location.",
  },
  {
    id: "the-den-airsoft",
    name: "The Den Airsoft",
    city: "New Philadelphia, OH",
    address: "2699 Pleasant Valley Rd NE, New Philadelphia, OH 44663",
    phone: "(330) 556-0121",
    website: "https://www.thedenairsoft.com",
    ownerEmailDomain: "thedenairsoft.com",
    facebook: "https://www.facebook.com/theairsoftden",
    indoorOutdoor: "outdoor",
    admission: "2026 season pass $449 (covers all open play events, plus discounts on DenOps); per-event pricing on the site's own booking system",
    about:
      "Self-described \"Ohio's Premier Airsoft-only Field,\" a 35-40+ acre outdoor facility with 30+ structures across urban CQB, open mid-range, and wooded zones. Runs regular \"DenPlay\" open-play Saturdays plus story-driven \"DenOp\" MilSim events.",
    status: "active",
    dataSource: "boisegunclub.com + airsoftc3.com directories + confirmed Facebook page (own site is a JS-rendered Square Online storefront that couldn't be scraped directly for text content)",
    lastScraped: "2026-09-10",
    notes:
      "Own domain (thedenairsoft.com) is confirmed real and active with live event/product listings, but is built on Square Online and renders its contact/about text client-side, so address/phone were corroborated instead from two independent directories that agree on the address; one gave a different phone number ((330) 440-5471) than the other ((330) 556-0121) — went with the airsoftc3.com number since it came paired with a matching contact email, but this should be double-checked directly with the field if it ever needs to be contacted. Site branding says \"Strasburg, Ohio\" in its title tag, but every corroborating source gives the actual mailing address as New Philadelphia, OH — the two towns are a few miles apart in Tuscarawas County, so used the address's city.",
  },

  // ---- Illinois (added 2026-09-10, from seed-data-draft-IL.mjs) ----------
  // Note: kinetic-training-complex-kankakee was deliberately left out of
  // this batch pending the Atlas Major/event-coordinator design — see
  // seed-data-draft-IL.mjs for that entry and why.
  {
    id: "bing-field",
    name: "Bing Field Airsoft & Paintball Park",
    city: "Alton, IL",
    address: "500 Bing Field Road, Alton, IL 62002",
    phone: "(618) 692-8271",
    website: "https://bingfield.com",
    ownerEmailDomain: "bingfield.com",
    facebook: "https://www.facebook.com/bingfield/",
    instagram: "https://www.instagram.com/bingstl/",
    discord: "http://discord.io/bing",
    indoorOutdoor: "outdoor",
    admission:
      "Airsoft open play $15/all day; rental package $35/all day; reservation play (10+ group) $35/7 hours",
    about:
      "60+ acre outdoor paintball-and-airsoft park just across the river from St. Louis, with 10,000 sq ft of covered pavilion staging. Airsoft open play Saturdays and Sundays, 10am-5pm, plus daily reservation play for groups of 10+.",
    imageUrl: "https://bingfield.com/wp-content/uploads/2019/09/CityField.jpg",
    status: "active",
    dataSource: "website",
    lastScraped: "2026-09-10",
  },
  {
    id: "legacy-adventure-park",
    name: "Legacy Adventure Park",
    city: "Lockport, IL",
    address: "2807 Canal St, Lockport, IL 60441",
    phone: "(779) 279-9838",
    website: "https://www.legacyadventurepark.com",
    ownerEmailDomain: "legacyadventurepark.com",
    facebook: "https://www.facebook.com/legacyadventurepark",
    instagram: "https://www.instagram.com/legacyadventurepark",
    tiktok: "https://www.tiktok.com/@legacyadventurepark",
    indoorOutdoor: "outdoor",
    about:
      "Chicagoland paintball-and-airsoft park about 30 miles southwest of Chicago near historic downtown Lockport; open play Saturdays and Sundays 10am-5pm, private bookings available every day.",
    imageUrl: "https://www.legacyadventurepark.com/img/homeSlides2/Legacy-Adventure-Park_19.jpg",
    status: "active",
    dataSource: "website",
    lastScraped: "2026-09-10",
    notes:
      "Admission pricing not published on the site (directs to an online booking system instead) — omitted rather than estimated.",
  },
  {
    id: "saltfork-paintball",
    name: "Saltfork Paintball",
    city: "Rantoul, IL",
    address: "1400 S Century Blvd, Rantoul, IL 61866",
    phone: "(217) 778-7743",
    website: "https://www.saltforkpaintball.com",
    ownerEmailDomain: "saltforkpaintball.com",
    facebook: "https://facebook.com/saltforkpaintball",
    instagram: "https://instagram.com/saltforkpaintball",
    discord: "https://discord.gg/spNDH8nVRx",
    indoorOutdoor: "outdoor",
    admission:
      "Field entry only $15 (unlimited air); rental packages $40-75 depending on gear/paintball count; CO2 fills $10",
    about:
      "Outdoor paintball-and-airsoft park just south of the old Chanute Air Force Base runway in Rantoul, operating since 2005. Airsoft is one of four ways to play (alongside paintball, low-impact paintball, and gel blasters); open play Saturdays 11am-5pm.",
    imageUrl:
      "https://irp.cdn-website.com/3162e7cf/dms3rep/multi/opt/20250824-59-6c7891f1-1920w.png",
    status: "active",
    dataSource: "website",
    lastScraped: "2026-09-10",
    notes:
      "The business's own site gives its location only as a cross-street description (\"Century Blvd & Coon Ave\"); the numbered street address above is corroborated by Yelp and a local chamber-of-commerce listing, not stated verbatim on the business's own site.",
  },
  {
    id: "paintball-explosion",
    name: "Paintball Explosion (PBX)",
    city: "East Dundee, IL",
    address: "601 Dundee Ave, East Dundee, IL 60118",
    phone: "(847) 426-2662",
    website: "https://www.pbbomb.com",
    ownerEmailDomain: "pbbomb.com",
    facebook: "https://www.facebook.com/PBexplosion",
    instagram: "https://www.instagram.com/paintball_explosion/",
    youtube: "https://www.youtube.com/user/paintballbomb",
    indoorOutdoor: "outdoor",
    about:
      "Paintball-primary outdoor park in the Chicago suburbs that added Airsoft, Laser Tag, and walk-on play as its own site puts it; open Saturdays and Sundays, with private group bookings available 7 days a week. Also periodically hosts separate MiR Tactical-run airsoft open-play events on select dates.",
    imageUrl:
      "https://irp.cdn-website.com//779c14ec/dms3rep/multi/opt/Paintball+Explosion+Social+Icon-1920w.jpg",
    status: "active",
    dataSource: "website",
    lastScraped: "2026-09-10",
    notes:
      "Specific admission pricing lives on separate pages not fetched; omitted rather than estimated.",
  },
  {
    id: "badlandz-paintball",
    name: "Badlandz Paintball Field",
    city: "Crete, IL",
    address: "306 W Elms Ct Ln, Crete, IL 60417",
    phone: "(708) 418-3335",
    website: "https://www.thebadlandz.com",
    ownerEmailDomain: "thebadlandz.com",
    facebook: "https://www.facebook.com/BadlandzPaintballField",
    instagram: "https://www.instagram.com/badlandzpaintball",
    indoorOutdoor: "outdoor",
    about:
      "Paintball-primary outdoor field about 25-35 minutes from downtown Chicago that also runs airsoft battles; private games bookable by phone, open Wednesday-Thursday 9am-3pm and Saturday-Sunday 8am-5pm.",
    imageUrl:
      "http://static1.squarespace.com/static/65cabc6eae8e7e67655ec3cb/t/65dd2d6b9bbdfa1eb55dbfb3/1708993901643/bzlogoshock.jpg?format=1500w",
    status: "active",
    dataSource: "website",
    lastScraped: "2026-09-10",
    notes:
      "Paintball-primary venue; included because its own site explicitly advertises \"exciting airsoft battles\" as a real offering, not an incidental mention.",
  },
  {
    id: "sinnissippi-airsoft",
    name: "Sinnissippi Rod & Gun Club (Sinnissippi Airsoft)",
    city: "Sterling, IL",
    address: "23181 Moline Rd, Sterling, IL 61081",
    phone: "(815) 626-4867",
    website: "https://sinnissippirodandgunclub.weebly.com",
    facebook: "https://www.facebook.com/sinnissippirodandgunclub",
    indoorOutdoor: "outdoor",
    about:
      "Member gun club running a dedicated airsoft range, expanded in 2019 with more obstacles and defensive positions; airsoft competitions are scheduled through the club's calendar and Facebook page.",
    status: "active",
    dataSource: "website",
    lastScraped: "2026-09-10",
    notes:
      "Site is a free Weebly subdomain, not a custom business domain — no ownerEmailDomain set, since there's nothing for a claiming email to match; claim verification here will need a phone or manual check, same situation as Patriots Ridge Airsoft in the Ohio batch. No specific airsoft hours published on the homepage — real schedule lives on the club's calendar/Facebook instead. No usable hero image found on the Weebly site, so imageUrl is left unset.",
  },

  // ---- Wisconsin (added 2026-09-10, from seed-data-draft-WI.mjs) ---------
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
      "No dedicated business website was found for this facility, only social media and third-party directories. The exact same name, address, and description ('40,000 sq ft', 'largest indoor') appear consistently across Yelp, Groupon, and two separate AirsoftC3 listings, which is why it's included at all — but treated as status: facebook_only (same as several existing Michigan entries in this file) rather than active, since claim verification and up-to-date hours/pricing can't be confirmed from a primary source. A human should confirm this is still operating before publishing.",
  },

  // ---- Missouri (added 2026-09-10, from seed-data-draft-MO.mjs) ----------
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

  // ---- Minnesota (added 2026-09-10, from seed-data-draft-MN.mjs) --------
  {
    id: "crossfire-airsoft",
    name: "Crossfire Airsoft",
    city: "Clearwater, MN",
    address: "1601 195th St E, Clearwater, MN 55320",
    phone: "(320) 253-5630",
    website: "https://crossfire-airsoft.com",
    facebook: "https://facebook.com/CrossfireAirsoftMN",
    instagram: "https://instagram.com/CrossfireAirsoftMN",
    indoorOutdoor: "outdoor",
    about:
      "Self-described \"oldest & best Airsoft Field in Minnesota,\" with over 10 years running open plays, private parties, and team training; on-site equipment rental, HPA air fills, and battery charging. Open weekends, 10am-4:30pm.",
    imageUrl:
      "https://static.wixstatic.com/media/f52958_9ad729c42217461f901e3374116e8daf~mv2_d_2000_1333_s_2.jpg",
    status: "active",
    dataSource: "website",
    lastScraped: "2026-09-10",
    notes:
      "Site is next to AJ Acres Campground. Also runs a sister location in Sioux Falls, SD (605-361-5200, facebook.com/AirsoftSiouxFalls) — not seeded here since it's out of state. Admission pricing sold through an online ticket shop rather than published flat rates; omitted rather than estimated.",
  },
  {
    id: "champion-valley-park",
    name: "Champion Valley Park",
    city: "Lakeville, MN",
    address: "22554 Texas Ave, Lakeville, MN 55044",
    phone: "(952) 892-1540",
    website: "https://championvalleypark.com",
    ownerEmailDomain: "championvalleypark.com",
    facebook: "https://facebook.com/championvalley",
    instagram: "https://instagram.com/championvalley",
    indoorOutdoor: "outdoor",
    admission: "$29/person, 2-hour sessions, 2-80 participants",
    about:
      "Multi-activity outdoor entertainment park (formerly/also marketed as \"MN Pro Paintball\") whose airsoft offering is billed as \"Hunt your competition... This is your BATTLE GROUND\" on their largest outdoor field. Open 9am-8pm.",
    imageUrl:
      "https://championvalleypark.com/wp-content/uploads/2019/10/Copy-of-TINY8272-2.jpg",
    status: "active",
    dataSource: "website",
    lastScraped: "2026-09-10",
    notes:
      "mnpropaintball.com now redirects to championvalleypark.com — the business appears to have rebranded/consolidated under the Champion Valley Park name, which is used here.",
  },
  {
    id: "big-lake-tactical",
    name: "Big Lake Tactical Wargames",
    city: "Big Lake, MN",
    address: "22615 County Rd 75 NW, Big Lake, MN 55309",
    phone: "(763) 257-5792",
    facebook: "https://www.facebook.com/p/Big-Lake-Tactical-Wargames-100057697440391/",
    indoorOutdoor: "outdoor",
    admission: "$30 standard play; $40 monthly competition series; $50 special events; $40 rental package",
    about:
      "Billed as \"Minnesota's largest airsoft field,\" a 100-acre outdoor venue with capacity for 150+ players, running regular weekend open play plus themed monthly games. Open weekends, March-December, 10am-4:30pm.",
    status: "facebook_only",
    dataSource:
      "Facebook + Yelp + Airsoft Society forum showcase + independent business directories (own website, a Zoho-hosted site, is currently broken — see notes)",
    lastScraped: "2026-09-10",
    notes:
      "Own website (biglaketactical.zohosites.com) is unreachable — every attempt to load it redirects back to itself rather than returning content, suggesting the Zoho site is dead or misconfigured. Address, phone, hours, and pricing above are corroborated instead across multiple independent third-party sources that all agree (Yelp listing at the same address, an Airsoft Society forum showcase page, and general business directories). Treated as status: facebook_only, same as Airsoft Arena Milwaukee (WI) and KDK Airsoft (MO), since current details can't be confirmed from a primary source.",
  },

  // Iowa (added 2026-09-10)
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

  // Kansas (added 2026-09-10)
  {
    id: "top-city-airsoft",
    name: "Top City Airsoft",
    city: "Topeka, KS",
    address: "4898 SW Burlingame Rd, Topeka, KS 66609",
    website: "https://www.topcityairsoft.com",
    ownerEmailDomain: "topcityairsoft.com",
    facebook: "https://www.facebook.com/profile.php?id=61553565069342",
    indoorOutdoor: "outdoor",
    admission: "$25/player",
    about:
      "13-acre outdoor airsoft field off 49th and Burlingame Road featuring tall grass, trees, hills, and flatlands, with man-made bunkers built from pallets and tires. Running since September 2023, with regular Saturday games and periodic night events. 400 fps velocity limit enforced.",
    status: "active",
    dataSource: "website",
    lastScraped: "2026-09-10",
    notes: "Hours listed as Saturdays 8am-5pm, weather permitting; no phone or email published on the site.",
  },
  {
    id: "foxhole-paintball-airsoft",
    name: "Foxhole Paintball & Airsoft",
    city: "Junction City, KS",
    address: "2311 Upham Rd, Junction City, KS 66441",
    phone: "(785) 410-1709",
    facebook: "https://www.facebook.com/foxholepba/",
    indoorOutdoor: "outdoor",
    about:
      "Veteran and family-owned paintball-and-airsoft field near the Upham Road/County Road 121 intersection outside Junction City (Fort Riley area), offering walk-on games, rentals, and private parties. Weekend hours only.",
    status: "facebook_only",
    dataSource:
      "Facebook + Yelp + TripAdvisor + local business directories (Yahoo Local, findglocal, chamberofcommerce.com) — no owned business website found",
    lastScraped: "2026-09-10",
    notes:
      "No dedicated business website found. Address is corroborated across multiple independent sources, though a few directories disagree on the house number (2311 vs. 3211 vs. 8000 Upham Rd) — went with 2311, the value that recurs most consistently including on the freshest-looking listing (a Yelp page showing a September 2026 update). Hours: Saturday-Sunday 10am-5pm per Yahoo Local; Monday-Friday closed. Treated as facebook_only, same as Center Mass Airsoft below and the existing MI/WI/MO/MN entries, since current details can't be confirmed from a primary source.",
  },
  {
    id: "center-mass-airsoft",
    name: "Center Mass Airsoft",
    city: "Kansas City, KS",
    address: "921 N 55th St, Kansas City, KS 66102",
    phone: "(913) 730-7148",
    facebook: "https://www.facebook.com/CenterMassAirsoft/",
    indoorOutdoor: "outdoor",
    about:
      "Woodland airsoft field in Kansas City, KS (Wyandotte County) running all-day public Open Plays, MilSim events, and private parties.",
    status: "facebook_only",
    dataSource:
      "Facebook + do816.com event listings + Placedigger + Datanyze + Snapchat/Waze place listings — no owned business website found",
    lastScraped: "2026-09-10",
    notes:
      "This is the same 'Center Mass Airsoft' flagged as excluded from both the Indiana and Missouri batches over a Kansas-vs-Missouri location conflict — its street address (921 N 55th St, ZIP 66102) definitively places it in Kansas City, KANSAS, not Missouri, so it belongs here instead. One directory listed an 816 (Missouri) phone number, but 66102 is unambiguously a Wyandotte County, KS ZIP code; used the 913 (Kansas) number found elsewhere for the same business. No owned website found, so treated as facebook_only.",
  },

  // Arkansas (added 2026-09-10)
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

  // Texas (added 2026-09-10, researched 2026-09-02 — see seed-data-draft-OH-TX.mjs)
  {
    id: "878-airsoft",
    name: "878 Airsoft",
    city: "Waxahachie, TX",
    address: "4020 Farm To Market Rd, Waxahachie, TX 75165",
    phone: "(972) 247-7638",
    website: "https://878airsoft.com",
    ownerEmailDomain: "878airsoft.com",
    facebook: "https://www.facebook.com/878Airsoft",
    youtube: "https://www.youtube.com/c/878Airsoft",
    tiktok: "https://www.tiktok.com/@878airsoft",
    indoorOutdoor: "outdoor",
    admission: "$30/player/day (all-day open play); $50 weekend pass",
    about:
      "170+ acre outdoor field south of Dallas running open-play weekends alongside private events and tournaments, with realistic terrain and tactical game modes; operating for over 10 years.",
    imageUrl: "https://878airsoft.com/wp-content/uploads/2026/02/Logo_878_Header-1.webp",
    status: "active",
    dataSource: "website",
    lastScraped: "2026-09-02",
  },
  {
    id: "d14-airsoft",
    name: "D14 Airsoft",
    city: "Sanger, TX",
    address: "3433 Cowling Road, Sanger, TX 76266",
    website: "https://d14airsoft.com",
    ownerEmailDomain: "d14airsoft.com",
    facebook: "https://www.facebook.com/d14airsoft",
    instagram: "https://www.instagram.com/d14airsoft",
    youtube: "https://www.youtube.com/d14airsoft",
    indoorOutdoor: "outdoor",
    admission: "$35/player/day (open play); $25 for night games",
    about:
      "37-acre outdoor field north of Dallas-Fort Worth featuring a mock city, wooded trails, trenches, and a two-story 'Citadel' structure, open every Saturday and Sunday for both casual and MILSIM-style play.",
    imageUrl:
      "https://d14airsoft.com/uploads/3/5/4/4/35447448/published/4311065.png?1649115417",
    status: "active",
    dataSource: "website",
    lastScraped: "2026-09-02",
    notes:
      "Own site had no phone number listed (page says to look it up via Google/Facebook), so phone was omitted rather than guessed.",
  },
  {
    id: "cavtac-airsoft",
    name: "CavTac Airsoft",
    city: "Haltom City, TX",
    address: "4105 Denton Highway, Haltom City, TX 76117",
    phone: "(817) 751-3955",
    website: "https://cavtacairsoft.com",
    ownerEmailDomain: "cavtacairsoft.com",
    facebook: "https://www.facebook.com/p/CavTac-Airsoft-Arena-100090937456479/",
    instagram: "https://www.instagram.com/cavtacairsoft/",
    indoorOutdoor: "indoor",
    admission: "$35/player weekdays, $40/player weekends (open play)",
    about:
      "34,000 sq ft climate-controlled indoor arena in the Fort Worth area offering supervised open-play skirmishes, milsim-lite operations, and private bookings for players ages 10+.",
    imageUrl:
      "https://www.cavtacairsoft.com/cdn/shop/files/8E1E0ABB-50D7-4918-A513-978E27083038_1920x1080.jpg?v=1755574002",
    status: "active",
    dataSource: "website",
    lastScraped: "2026-09-02",
  },
  {
    id: "high-ground-airsoft",
    name: "High Ground Airsoft",
    city: "Cypress, TX",
    address: "13742 N Eldridge Pkwy, Cypress, TX 77429",
    phone: "(281) 547-8367",
    website: "https://www.highgroundairsoft.com",
    ownerEmailDomain: "highgroundairsoft.com",
    facebook: "https://www.facebook.com/EvikeOutpost.HighGround/",
    instagram: "https://www.instagram.com/evikeoutpost.highground/",
    youtube: "https://www.youtube.com/channel/UCGjYal-nro9S5T1z6In2vrA",
    indoorOutdoor: "indoor",
    about:
      "27,000 sq ft climate-controlled indoor arena northwest of Houston built around a 'Main Street' urban-combat theme, with tight interconnected rooms and hallways designed for close-quarters battle.",
    imageUrl: "https://highgroundairsoft.com/wp-content/uploads/2020/10/Featured-Image.jpg",
    status: "active",
    dataSource: "website",
    lastScraped: "2026-09-02",
    notes:
      "No published admission price found on the homepage (pricing lives on a separate Prices page not fetched); omitted rather than estimated.",
  },
  {
    id: "awaken-arena-san-antonio",
    name: "Awaken Arena (San Antonio)",
    city: "San Antonio, TX",
    address: "1228 Cornerway Blvd, San Antonio, TX 78219",
    phone: "(830) 328-2820",
    website: "https://www.awakenarena.com",
    ownerEmailDomain: "awakenarena.com",
    facebook: "https://www.facebook.com/AwakenArenaEntertainment",
    instagram: "https://www.instagram.com/awakenarena/",
    youtube: "https://www.youtube.com/@awakenarenaHQ",
    tiktok: "https://www.tiktok.com/@awakenarena",
    discord: "https://discord.com/invite/vEFBKTVXVW",
    indoorOutdoor: "indoor",
    admission: "$30/player day pass, $25/player night pass",
    about:
      "Air-conditioned indoor tactical combat arena running Team Deathmatch, Capture the Flag, and custom scenario game modes, with day/night open-play sessions and a weekday military discount.",
    status: "active",
    dataSource: "website",
    lastScraped: "2026-09-02",
    notes: "Operator also runs a sister location in Austin (below) — shared website/socials/phone.",
  },
  {
    id: "awaken-arena-austin",
    name: "Awaken Arena (Austin)",
    city: "Austin, TX",
    address: "8119 Exchange Drive STE. 200, Austin, TX 78754",
    phone: "(830) 328-2820",
    website: "https://www.awakenarena.com",
    ownerEmailDomain: "awakenarena.com",
    facebook: "https://www.facebook.com/AwakenArenaEntertainment",
    instagram: "https://www.instagram.com/awakenarena/",
    youtube: "https://www.youtube.com/@awakenarenaHQ",
    tiktok: "https://www.tiktok.com/@awakenarena",
    discord: "https://discord.com/invite/vEFBKTVXVW",
    indoorOutdoor: "indoor",
    admission: "$30/player day pass, $25/player night pass",
    about:
      "Air-conditioned indoor tactical combat arena running Team Deathmatch, Capture the Flag, and custom scenario game modes, with day/night open-play sessions and a weekday military discount.",
    status: "active",
    dataSource: "website",
    lastScraped: "2026-09-02",
    notes: "Sister location to the San Antonio Awaken Arena above — shares the same website, phone, and social accounts.",
  },

  // Tennessee (added 2026-09-10)
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
  {
    id: "acs-airsoft",
    name: "ACS Airsoft",
    city: "West Paducah, KY",
    address: "7400 Old Hwy 60, West Paducah, KY 42086",
    phone: "(270) 564-4126",
    website: "https://acsairsoft.net",
    ownerEmailDomain: "acsairsoft.net",
    facebook: "https://www.facebook.com/acsairsoft/",
    indoorOutdoor: "outdoor",
    about:
      "Billed as Kentucky's #1 airsoft destination: an 8-acre outdoor battlefield covered in cars, bunkers, and a two-story building, plus a retail gear/rental store and repair services. Runs weekly games and monthly open-play days, along with an annual \"NOOBDAY\" newcomer event. In business since 2018.",
    status: "active",
    dataSource: "website + BBB business profile + Yelp (updated July 2026)",
    lastScraped: "2026-09-10",
    notes: "Hours: Wed-Fri 12pm-6pm, Sat 10am-5pm, closed Sun-Tue per BBB/directory listings; not stated on the site itself. No pricing published on the site.",
  },
  {
    id: "conders-paintball-field",
    name: "Conder's Paintball Field",
    city: "Elizabethtown, KY",
    address: "193 Ford Hwy, Elizabethtown, KY 42701",
    phone: "270-765-4517",
    website: "https://conderspaintball.com",
    ownerEmailDomain: "conderspaintball.com",
    facebook: "https://www.facebook.com/profile.php?id=100063587886837",
    instagram: "https://www.instagram.com/conderspaintball/",
    indoorOutdoor: "outdoor",
    about:
      "Kentucky's oldest and largest paintball field (established 1990), an 80-acre facility near I-65 with a speedball course, an urban city course of 50+ buildings and towers, and two wooded ball courses with forts and towers. Offers regular (68 cal) and low-impact (50 cal) paintball alongside airsoft, plus scenario games, birthday parties, corporate events, and military outings.",
    status: "active",
    dataSource: "website",
    lastScraped: "2026-09-10",
    notes: "Hours: Sat 10am-6pm, Sun 11am-6pm, weekdays by appointment only. No admission pricing published on the site.",
  },
  {
    id: "paintball-asylum",
    name: "Paintball Asylum (Asylum Xtreme)",
    city: "Louisville, KY",
    address: "3101 Pond Station Rd, Louisville, KY 40272",
    phone: "(502) 937-9370",
    website: "https://www.asylumxtreme.com",
    facebook: "https://www.facebook.com/PBAsylum/",
    youtube: "https://www.youtube.com/channel/UCpVyYIJLk-ZtbUOGknsr0gQ",
    indoorOutdoor: "outdoor",
    admission: "Weekday group play by reservation: minimum 10 players, 24-hour advance notice, $45 deposit required",
    about:
      "Long-running paintball park (also operating as Asylum Xtreme, a paintball/RC/skateboard/airsoft retail store with a second location in Clarksville, IN) on over 40 acres in south Louisville. Runs a recurring airsoft open-play schedule alongside its paintball operations. In business over 20 years per its BBB profile.",
    status: "active",
    dataSource: "website + Facebook (airsoft open-play schedule posts) + BBB business profile",
    lastScraped: "2026-09-10",
    notes:
      "Business is legally registered as Asylum Extreme Sports, LLC (BBB), operating under the Paintball Asylum / Asylum Xtreme branding. The park's own site was mid-relaunch (\"a new more Xtreme experience coming\") at time of research; address/phone confirmed via the Asylum Xtreme retail site instead. Weekday hours listed as reservation-only; weekend walk-in hours not published.",
  },
  {
    id: "point6-airsoft-field",
    name: "Point 6 Airsoft Field",
    city: "Foster, KY",
    address: "4584 New Zion Rd, Foster, KY 41043",
    website: "https://point6airsoft.com",
    facebook: "https://www.facebook.com/p/Point-6-Airsoft-Field-100090959545576/",
    indoorOutdoor: "outdoor",
    admission: "Pay for entry, or donate field-building materials in lieu of payment",
    about:
      "Small, grassroots outdoor airsoft field in Bracken County (near the Cincinnati/Northern Kentucky area). Its own site describes the field as still under active development, with players able to pay standard entry or contribute materials toward building it out instead.",
    status: "active",
    dataSource: "website + Facebook",
    lastScraped: "2026-09-10",
    notes:
      "The business's own site describes the field as still \"in development\" rather than a finished, fully-built facility — included as active/operating since it explicitly accepts players now, but flagging that this is an informal, evolving setup rather than a polished commercial field. Its Facebook page is titled \"Falmouth KY\" (a neighboring town) while the street address given on-site and via a location-tagged Instagram post resolves to Foster, KY 41043 — likely just an imprecise city tag on Facebook for the same rural property; no phone number found on either.",
  },
  {
    id: "jaegers-subsurface-paintball",
    name: "Jaegers Subsurface Paintball",
    city: "Kansas City, MO",
    address: "9300 NE Underground Dr, Kansas City, MO 64161",
    phone: "(816) 452-6600",
    website: "https://www.jaegers.com",
    ownerEmailDomain: "jaegers.com",
    facebook: "https://www.facebook.com/jaegerspaintball",
    instagram: "https://www.instagram.com/jaegerspaintball/",
    youtube: "https://www.youtube.com/channel/UC_lhL-1kMVLiLqKazztGWBg",
    indoorOutdoor: "indoor",
    about:
      "Billed as \"the world's only underground cave paintball park\" — a paintball, laser tag, and airsoft facility built into a former limestone mine, continuously operating since December 1994. Airsoft rentals (mask, neck guard, gun, 1000 BBs) run in 10-15 minute rounds with rotation between fields. Walk-ons welcome weekends; private group bookings (8+ players) need 48 hours notice.",
    status: "active",
    dataSource: "website",
    lastScraped: "2026-09-10",
    notes: "Hours: Mon-Thu 1pm-8pm, Fri 1pm-10pm, Sat 10am-10pm, Sun 10am-6pm (shifts seasonally per the site). No airsoft-specific pricing published; general paintball/laser tag pricing is on separate site pages.",
  },
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

// ---- EVENTS ---------------------------------------------------------------
// A representative sample of real, dated upcoming events pulled from each
// scrapable field's own site. Not exhaustive — meant to prove the pipeline
// and seed the app with genuine near-term content.
const events = [
  {
    id: "cedar-airsoft-field-2026-08-22-tdm-day",
    fieldId: "cedar-airsoft-field",
    fieldName: "Cedar Airsoft Field",
    title: "Cedar Airsoft TDM Day",
    date: "2026-08-22",
    startTime: "10:00 AM",
    endTime: "5:00 PM",
    price: "$20",
    type: "OUTDOOR",
    description: "Team-vs-team scenario rounds, standard chrono limits and safety rules apply.",
    sourceUrl: "https://www.cedarairsoftfield.com/events/0mu1a2w3s1wy9aa1wc95v8ld3q1yzi",
    imageUrl:
      "https://images.squarespace-cdn.com/content/v1/6262f3f5e4f2770c486b0829/1787081148035-DI8LMN19X9E7AZCTI073/587583723_1330918685494940_5519340731808511556_n.jpg",
    // DEMO DATA — placeholder waiver text for showcase purposes, not
    // Cedar's actual legal document. Real waiver text needs to come from
    // the field owner once that upload flow exists.
    waiver: {
      version: "2026-08-01",
      text: `LIABILITY WAIVER AND RELEASE OF CLAIMS

By signing below, I acknowledge that airsoft is a physical activity carrying inherent risks of injury, including but not limited to impact injuries, eye injury, and physical exertion.

I certify that:
- I am voluntarily participating and am physically able to do so.
- I will wear full-seal eye protection at all times while on the field.
- I will follow all posted field rules and staff instructions.
- I understand that replicas will be chronographed and must meet posted FPS limits.
- I release the field, its owners, staff, and event organizers from liability for injuries sustained during normal gameplay, except in cases of gross negligence.
- I am at least 18 years of age, or have a parent/guardian's consent on file.

This is placeholder demo text for showcase purposes and is not a legally binding document.`,
    },
  },
  {
    id: "cedar-airsoft-field-2026-09-05-rampage-2026",
    fieldId: "cedar-airsoft-field",
    fieldName: "Cedar Airsoft Field",
    title: "Rampage 2026",
    date: "2026-09-05",
    endDate: "2026-09-06",
    startTime: "10:00 AM",
    price: "varies",
    type: "MILSIM",
    description: "Two-day flagship event, no player cap or pre-registration, large-team objective gameplay.",
    sourceUrl: "https://www.cedarairsoftfield.com/events/rampage-2026",
    imageUrl:
      "https://images.squarespace-cdn.com/content/v1/6262f3f5e4f2770c486b0829/1777410862219-UE008B5Z3ZBMH33QLF42/541426977_1261001485819994_308724288471227800_n.jpg",
    waiver: {
      version: "2026-08-01",
      text: `LIABILITY WAIVER AND RELEASE OF CLAIMS

By signing below, I acknowledge that airsoft is a physical activity carrying inherent risks of injury, including but not limited to impact injuries, eye injury, and physical exertion.

I certify that:
- I am voluntarily participating and am physically able to do so.
- I will wear full-seal eye protection at all times while on the field.
- I will follow all posted field rules and staff instructions.
- I understand that replicas will be chronographed and must meet posted FPS limits.
- I release the field, its owners, staff, and event organizers from liability for injuries sustained during normal gameplay, except in cases of gross negligence.
- I am at least 18 years of age, or have a parent/guardian's consent on file.

This is placeholder demo text for showcase purposes and is not a legally binding document.`,
    },
  },
  {
    id: "cedar-airsoft-field-2026-09-20-gas-blow-back-day",
    fieldId: "cedar-airsoft-field",
    fieldName: "Cedar Airsoft Field",
    title: "Gas Blow Back Day!",
    date: "2026-09-20",
    startTime: "10:00 AM",
    endTime: "5:00 PM",
    price: "$20",
    type: "OUTDOOR",
    description: "Gas blowback replicas only day — pistols, rifles, SMGs and lever actions, mags capped at 30 rounds.",
    sourceUrl: "https://www.cedarairsoftfield.com/events/gas-blow-back-day",
    imageUrl:
      "https://images.squarespace-cdn.com/content/v1/6262f3f5e4f2770c486b0829/1787081338302-LHSFRN2NPMHH3NNJPAQO/505702524_1195631062357037_6038482170686851167_n.jpg",
    waiver: {
      version: "2026-08-01",
      text: `LIABILITY WAIVER AND RELEASE OF CLAIMS

By signing below, I acknowledge that airsoft is a physical activity carrying inherent risks of injury, including but not limited to impact injuries, eye injury, and physical exertion.

I certify that:
- I am voluntarily participating and am physically able to do so.
- I will wear full-seal eye protection at all times while on the field.
- I will follow all posted field rules and staff instructions.
- I understand that replicas will be chronographed and must meet posted FPS limits.
- I release the field, its owners, staff, and event organizers from liability for injuries sustained during normal gameplay, except in cases of gross negligence.
- I am at least 18 years of age, or have a parent/guardian's consent on file.

This is placeholder demo text for showcase purposes and is not a legally binding document.`,
    },
  },
  {
    id: "darkfire-airsoft-2026-08-22-summers-end-11",
    fieldId: "darkfire-airsoft",
    fieldName: "Darkfire Airsoft",
    title: "Summers End 11 (Hosted by WASTE)",
    date: "2026-08-22",
    endDate: "2026-08-23",
    startTime: "9:00 AM",
    type: "MILSIM",
    description: "Free-form, player-driven event where alliances, trade, and faction play shape the outcome.",
    sourceUrl: "https://www.darkfireairsoft.com/events/summers-end-11-hosted-by-waste",
    waiver: {
      version: "2026-08-01",
      text: `LIABILITY WAIVER AND RELEASE OF CLAIMS

By signing below, I acknowledge that airsoft is a physical activity carrying inherent risks of injury, including but not limited to impact injuries, eye injury, and physical exertion.

I certify that:
- I am voluntarily participating and am physically able to do so.
- I will wear full-seal eye protection at all times while on the field.
- I will follow all posted field rules and staff instructions.
- I understand that replicas will be chronographed and must meet posted FPS limits.
- I release the field, its owners, staff, and event organizers from liability for injuries sustained during normal gameplay, except in cases of gross negligence.
- I am at least 18 years of age, or have a parent/guardian's consent on file.

This is placeholder demo text for showcase purposes and is not a legally binding document.`,
    },
  },
  {
    id: "darkfire-airsoft-2026-09-05-minisim-nato-vs-rusfor-v",
    fieldId: "darkfire-airsoft",
    fieldName: "Darkfire Airsoft",
    title: "Minisim - NATO vs RUSFOR V (Hosted by VBH)",
    date: "2026-09-05",
    startTime: "9:00 AM",
    type: "MILSIM",
    description:
      "NATO and RUSFOR forces clash across the forested countryside around the field for control of key resources and territory. NATO plays a disciplined, precision-focused defense while RUSFOR pushes aggressive, numbers-based assaults — expect skirmishes through abandoned farmhouses, creek flanks, and open fields. Briefing starts promptly at 10am; pre-register for better pricing and to reserve rentals.",
    sourceUrl: "https://www.darkfireairsoft.com/events/minisim-nato-vs-rusfor-v-hosted-by-vbh",
    waiver: {
      version: "2026-08-01",
      text: `LIABILITY WAIVER AND RELEASE OF CLAIMS

By signing below, I acknowledge that airsoft is a physical activity carrying inherent risks of injury, including but not limited to impact injuries, eye injury, and physical exertion.

I certify that:
- I am voluntarily participating and am physically able to do so.
- I will wear full-seal eye protection at all times while on the field.
- I will follow all posted field rules and staff instructions.
- I understand that replicas will be chronographed and must meet posted FPS limits.
- I release the field, its owners, staff, and event organizers from liability for injuries sustained during normal gameplay, except in cases of gross negligence.
- I am at least 18 years of age, or have a parent/guardian's consent on file.

This is placeholder demo text for showcase purposes and is not a legally binding document.`,
    },
  },
  {
    id: "darkfire-airsoft-2026-10-03-operation-cerberus-viii",
    fieldId: "darkfire-airsoft",
    fieldName: "Darkfire Airsoft",
    title: "Operation Cerberus VIII",
    date: "2026-10-03",
    endDate: "2026-10-04",
    startTime: "8:00 AM",
    type: "MILSIM",
    description: "Seventh annual flagship two-day story-driven milsim between two factions.",
    sourceUrl: "https://www.darkfireairsoft.com/events/operation-cerberus-viii",
    waiver: {
      version: "2026-08-01",
      text: `LIABILITY WAIVER AND RELEASE OF CLAIMS

By signing below, I acknowledge that airsoft is a physical activity carrying inherent risks of injury, including but not limited to impact injuries, eye injury, and physical exertion.

I certify that:
- I am voluntarily participating and am physically able to do so.
- I will wear full-seal eye protection at all times while on the field.
- I will follow all posted field rules and staff instructions.
- I understand that replicas will be chronographed and must meet posted FPS limits.
- I release the field, its owners, staff, and event organizers from liability for injuries sustained during normal gameplay, except in cases of gross negligence.
- I am at least 18 years of age, or have a parent/guardian's consent on file.

This is placeholder demo text for showcase purposes and is not a legally binding document.`,
    },
  },
  {
    id: "futureball-2026-09-19-armageddon",
    fieldId: "futureball",
    fieldName: "Futureball",
    title: "Armageddon",
    date: "2026-09-19",
    type: "OUTDOOR",
    description: "Large-scale airsoft big game.",
    sourceUrl: "https://www.futureball.com/armageddon-4/",
    waiver: {
      version: "2026-08-01",
      text: `LIABILITY WAIVER AND RELEASE OF CLAIMS

By signing below, I acknowledge that airsoft is a physical activity carrying inherent risks of injury, including but not limited to impact injuries, eye injury, and physical exertion.

I certify that:
- I am voluntarily participating and am physically able to do so.
- I will wear full-seal eye protection at all times while on the field.
- I will follow all posted field rules and staff instructions.
- I understand that replicas will be chronographed and must meet posted FPS limits.
- I release the field, its owners, staff, and event organizers from liability for injuries sustained during normal gameplay, except in cases of gross negligence.
- I am at least 18 years of age, or have a parent/guardian's consent on file.

This is placeholder demo text for showcase purposes and is not a legally binding document.`,
    },
  },
  {
    id: "futureball-2026-10-17-zombie-apocalypse",
    fieldId: "futureball",
    fieldName: "Futureball",
    title: "Zombie Apocalypse",
    date: "2026-10-17",
    type: "OUTDOOR",
    description: "Themed airsoft big game.",
    sourceUrl: "https://www.futureball.com/zombie-apocalypse/",
    waiver: {
      version: "2026-08-01",
      text: `LIABILITY WAIVER AND RELEASE OF CLAIMS

By signing below, I acknowledge that airsoft is a physical activity carrying inherent risks of injury, including but not limited to impact injuries, eye injury, and physical exertion.

I certify that:
- I am voluntarily participating and am physically able to do so.
- I will wear full-seal eye protection at all times while on the field.
- I will follow all posted field rules and staff instructions.
- I understand that replicas will be chronographed and must meet posted FPS limits.
- I release the field, its owners, staff, and event organizers from liability for injuries sustained during normal gameplay, except in cases of gross negligence.
- I am at least 18 years of age, or have a parent/guardian's consent on file.

This is placeholder demo text for showcase purposes and is not a legally binding document.`,
    },
  },
  {
    id: "futureball-2026-11-08-customer-day",
    fieldId: "futureball",
    fieldName: "Futureball",
    title: "Customer Day",
    date: "2026-11-08",
    type: "OUTDOOR",
    description: "Combined paintball and airsoft open-play event.",
    sourceUrl: "https://www.futureball.com/",
    imageUrl: "https://www.futureball.com/wp-content/uploads/2025/02/Customer-day-2025.jpg",
    waiver: {
      version: "2026-08-01",
      text: `LIABILITY WAIVER AND RELEASE OF CLAIMS

By signing below, I acknowledge that airsoft is a physical activity carrying inherent risks of injury, including but not limited to impact injuries, eye injury, and physical exertion.

I certify that:
- I am voluntarily participating and am physically able to do so.
- I will wear full-seal eye protection at all times while on the field.
- I will follow all posted field rules and staff instructions.
- I understand that replicas will be chronographed and must meet posted FPS limits.
- I release the field, its owners, staff, and event organizers from liability for injuries sustained during normal gameplay, except in cases of gross negligence.
- I am at least 18 years of age, or have a parent/guardian's consent on file.

This is placeholder demo text for showcase purposes and is not a legally binding document.`,
    },
  },
  {
    id: "the-compound-2026-06-13-arcade-open-play",
    fieldId: "the-compound",
    fieldName: "The Compound",
    title: "Arcade Open Play",
    date: "2026-06-13",
    startTime: "9:00 AM (gates), 11:00 AM start",
    price: "$20/person",
    type: "OUTDOOR",
    description:
      "Capped at 50 players, prepay to guarantee a spot. Four rounds: Slap Stick City (unlimited respawns, fight for slap sticks), Large Scale Barrel Run (score by tossing bottles into enemy barrels), Caravan Run (escort a caravan down a fixed path), and The Shootout (balloon and can elimination). Arrive 30 minutes early for check-in and chrono.",
    sourceUrl: "https://www.thecompoundairsoft.com/",
    imageUrl: "https://img1.wsimg.com/isteam/ip/ec5d8dd8-d89f-4c7e-90be-3eaf25e1aa35/2.0.jpg",
    waiver: {
      version: "2026-08-01",
      isDemo: false, // real waiver text, sourced from the field's own Field Rules / Disclaimer page
      text: `RELEASE AND WAIVER OF LIABILITY, ASSUMPTION OF RISK, AND INDEMNITY AGREEMENT

READ BEFORE SIGNING

In consideration of participating in the sport of airsoft, I represent that I understand the nature of this activity and that I am qualified, in good health, and in proper physical condition to participate.

I acknowledge that if I believe event conditions are unsafe, I will immediately discontinue participating.

I fully understand that this activity involves risks of serious bodily injury, including permanent disability, paralysis, and death, which may be caused by my own actions, the actions of other participants, the conditions in which the event takes place, or the negligence of the releasees named below — and that there may be other risks not known to me or not readily foreseeable at this time. I fully accept and assume all such risks and all responsibility for losses, costs, and damages I incur as a result of my participation.

I hereby release, discharge, and covenant not to sue Matthew W. Shorkey, and his respective administrators, directors, agents, officers, volunteers, employees, other participants, sponsors, advertisers, and — if applicable — owners and lessors of the premises on which the activity takes place (each considered a "releasee" herein), from all liability, claims, demands, losses, or damages on my account caused or alleged to be caused in whole or in part by the negligence of the releasees or otherwise, including negligent rescue operations.

I further agree that if, despite this release, I or anyone on my behalf makes a claim against any releasee, I will indemnify, defend, and hold harmless each releasee from any loss, liability, damage, or cost incurred as a result of that claim.

I have read this release, understand that I have given up substantial rights by signing it, and have signed it freely and without inducement, intending it to be a complete and unconditional release to the greatest extent allowed by law. If any portion of this agreement is held invalid, the balance shall continue in full force and effect.

PARENTAL CONSENT (required for participants under 18)

I, the minor's parent and/or legal guardian, understand the nature of this activity and the minor's experience and capabilities, and believe the minor is qualified to participate. I hereby release, discharge, and covenant not to sue, and agree to indemnify and hold harmless, each releasee from all liability, claims, demands, losses, or damages to the minor's account caused or alleged to have been caused in whole or in part by the negligence of the releasees or otherwise, including negligent rescue operations. I further agree that if, despite this release, I, the minor, or anyone on the minor's behalf makes a claim against any releasee, I will indemnify and hold harmless each releasee from any litigation expenses, attorney fees, loss, liability, damage, or cost incurred as a result of that claim.

FIELD RULES SUMMARY

- Airsoft is an honor-system game — play fair, call your hits, and work with your teammates.
- No real firearms or weapons of any kind allowed on the property at any time. No drugs or alcohol.
- Age requirements: players must be at least 8. Under age 10 must have a parent playing with them; under age 12 must have a parent or guardian on site.
- All guns must be chrono tested every visit, using field-provided BBs (bring an empty mag). Max rate of fire is 20 RPS.
- Pistols must be safetied and holstered; all guns safetied with mags removed and barrel bags on except when actively on the playing field.
- No deliberate overshooting, no physical contact or threats beyond a light tap to call "bang," and no arguing with referees — bring disputes to a referee or admin instead.
- Full face protection required at all times on the field — a paintball mask or full-seal goggles with strap plus a lower mesh face protector. Mesh goggles and plain safety glasses are not allowed.
- Zero tolerance for adjusting an HPA gun to a higher FPS/RPS after passing chrono.
`,
    },
  },
  {
    id: "the-compound-2026-09-19-open-play",
    fieldId: "the-compound",
    fieldName: "The Compound",
    title: "Open Play",
    date: "2026-09-19",
    startTime: "9:00 AM (gates), 11:00 AM start",
    price: "$20/person",
    type: "OUTDOOR",
    description:
      "Capped at 50 players, prepay to guarantee a spot. Four rounds: Team Elimination, Zombie President (protect the president or convert to the zombie team), Fury Battle Line (defend the trench, attackers can't flank), and Compound Conquest (multi-flag capture assault). Arrive 30 minutes early for check-in and chrono.",
    sourceUrl: "https://www.thecompoundairsoft.com/",
    imageUrl: "https://img1.wsimg.com/isteam/ip/ec5d8dd8-d89f-4c7e-90be-3eaf25e1aa35/2.0.jpg",
    waiver: {
      version: "2026-08-01",
      isDemo: false, // real waiver text, sourced from the field's own Field Rules / Disclaimer page
      text: `RELEASE AND WAIVER OF LIABILITY, ASSUMPTION OF RISK, AND INDEMNITY AGREEMENT

READ BEFORE SIGNING

In consideration of participating in the sport of airsoft, I represent that I understand the nature of this activity and that I am qualified, in good health, and in proper physical condition to participate.

I acknowledge that if I believe event conditions are unsafe, I will immediately discontinue participating.

I fully understand that this activity involves risks of serious bodily injury, including permanent disability, paralysis, and death, which may be caused by my own actions, the actions of other participants, the conditions in which the event takes place, or the negligence of the releasees named below — and that there may be other risks not known to me or not readily foreseeable at this time. I fully accept and assume all such risks and all responsibility for losses, costs, and damages I incur as a result of my participation.

I hereby release, discharge, and covenant not to sue Matthew W. Shorkey, and his respective administrators, directors, agents, officers, volunteers, employees, other participants, sponsors, advertisers, and — if applicable — owners and lessors of the premises on which the activity takes place (each considered a "releasee" herein), from all liability, claims, demands, losses, or damages on my account caused or alleged to be caused in whole or in part by the negligence of the releasees or otherwise, including negligent rescue operations.

I further agree that if, despite this release, I or anyone on my behalf makes a claim against any releasee, I will indemnify, defend, and hold harmless each releasee from any loss, liability, damage, or cost incurred as a result of that claim.

I have read this release, understand that I have given up substantial rights by signing it, and have signed it freely and without inducement, intending it to be a complete and unconditional release to the greatest extent allowed by law. If any portion of this agreement is held invalid, the balance shall continue in full force and effect.

PARENTAL CONSENT (required for participants under 18)

I, the minor's parent and/or legal guardian, understand the nature of this activity and the minor's experience and capabilities, and believe the minor is qualified to participate. I hereby release, discharge, and covenant not to sue, and agree to indemnify and hold harmless, each releasee from all liability, claims, demands, losses, or damages to the minor's account caused or alleged to have been caused in whole or in part by the negligence of the releasees or otherwise, including negligent rescue operations. I further agree that if, despite this release, I, the minor, or anyone on the minor's behalf makes a claim against any releasee, I will indemnify and hold harmless each releasee from any litigation expenses, attorney fees, loss, liability, damage, or cost incurred as a result of that claim.

FIELD RULES SUMMARY

- Airsoft is an honor-system game — play fair, call your hits, and work with your teammates.
- No real firearms or weapons of any kind allowed on the property at any time. No drugs or alcohol.
- Age requirements: players must be at least 8. Under age 10 must have a parent playing with them; under age 12 must have a parent or guardian on site.
- All guns must be chrono tested every visit, using field-provided BBs (bring an empty mag). Max rate of fire is 20 RPS.
- Pistols must be safetied and holstered; all guns safetied with mags removed and barrel bags on except when actively on the playing field.
- No deliberate overshooting, no physical contact or threats beyond a light tap to call "bang," and no arguing with referees — bring disputes to a referee or admin instead.
- Full face protection required at all times on the field — a paintball mask or full-seal goggles with strap plus a lower mesh face protector. Mesh goggles and plain safety glasses are not allowed.
- Zero tolerance for adjusting an HPA gun to a higher FPS/RPS after passing chrono.
`,
    },
  },
  {
    id: "the-compound-2026-10-24-open-play",
    fieldId: "the-compound",
    fieldName: "The Compound",
    title: "Open Play",
    date: "2026-10-24",
    startTime: "9:00 AM (gates), 11:00 AM start",
    price: "$20/person",
    type: "OUTDOOR",
    description:
      "Capped at 50 players, prepay to guarantee a spot. Four rounds: Team Elimination, Tug of War - Mule War (push the mule to your zone), Tug of War - Pole War (multi-pole objective), and Compound War - Flag War (4-team flag capture — lose your flag, join the team that took it). Arrive 30 minutes early for check-in and chrono.",
    sourceUrl: "https://www.thecompoundairsoft.com/",
    imageUrl: "https://img1.wsimg.com/isteam/ip/ec5d8dd8-d89f-4c7e-90be-3eaf25e1aa35/2.0.jpg",
    waiver: {
      version: "2026-08-01",
      isDemo: false, // real waiver text, sourced from the field's own Field Rules / Disclaimer page
      text: `RELEASE AND WAIVER OF LIABILITY, ASSUMPTION OF RISK, AND INDEMNITY AGREEMENT

READ BEFORE SIGNING

In consideration of participating in the sport of airsoft, I represent that I understand the nature of this activity and that I am qualified, in good health, and in proper physical condition to participate.

I acknowledge that if I believe event conditions are unsafe, I will immediately discontinue participating.

I fully understand that this activity involves risks of serious bodily injury, including permanent disability, paralysis, and death, which may be caused by my own actions, the actions of other participants, the conditions in which the event takes place, or the negligence of the releasees named below — and that there may be other risks not known to me or not readily foreseeable at this time. I fully accept and assume all such risks and all responsibility for losses, costs, and damages I incur as a result of my participation.

I hereby release, discharge, and covenant not to sue Matthew W. Shorkey, and his respective administrators, directors, agents, officers, volunteers, employees, other participants, sponsors, advertisers, and — if applicable — owners and lessors of the premises on which the activity takes place (each considered a "releasee" herein), from all liability, claims, demands, losses, or damages on my account caused or alleged to be caused in whole or in part by the negligence of the releasees or otherwise, including negligent rescue operations.

I further agree that if, despite this release, I or anyone on my behalf makes a claim against any releasee, I will indemnify, defend, and hold harmless each releasee from any loss, liability, damage, or cost incurred as a result of that claim.

I have read this release, understand that I have given up substantial rights by signing it, and have signed it freely and without inducement, intending it to be a complete and unconditional release to the greatest extent allowed by law. If any portion of this agreement is held invalid, the balance shall continue in full force and effect.

PARENTAL CONSENT (required for participants under 18)

I, the minor's parent and/or legal guardian, understand the nature of this activity and the minor's experience and capabilities, and believe the minor is qualified to participate. I hereby release, discharge, and covenant not to sue, and agree to indemnify and hold harmless, each releasee from all liability, claims, demands, losses, or damages to the minor's account caused or alleged to have been caused in whole or in part by the negligence of the releasees or otherwise, including negligent rescue operations. I further agree that if, despite this release, I, the minor, or anyone on the minor's behalf makes a claim against any releasee, I will indemnify and hold harmless each releasee from any litigation expenses, attorney fees, loss, liability, damage, or cost incurred as a result of that claim.

FIELD RULES SUMMARY

- Airsoft is an honor-system game — play fair, call your hits, and work with your teammates.
- No real firearms or weapons of any kind allowed on the property at any time. No drugs or alcohol.
- Age requirements: players must be at least 8. Under age 10 must have a parent playing with them; under age 12 must have a parent or guardian on site.
- All guns must be chrono tested every visit, using field-provided BBs (bring an empty mag). Max rate of fire is 20 RPS.
- Pistols must be safetied and holstered; all guns safetied with mags removed and barrel bags on except when actively on the playing field.
- No deliberate overshooting, no physical contact or threats beyond a light tap to call "bang," and no arguing with referees — bring disputes to a referee or admin instead.
- Full face protection required at all times on the field — a paintball mask or full-seal goggles with strap plus a lower mesh face protector. Mesh goggles and plain safety glasses are not allowed.
- Zero tolerance for adjusting an HPA gun to a higher FPS/RPS after passing chrono.
`,
    },
  },
];

// A showcase team, real per your request — same DTB patch already used on
// The Compound's field page. createdBy is left as "seed-script" since this
// wasn't created through the normal in-app flow; that also means nobody
// currently satisfies the "founding officer" rule for it, which is why
// you'll need to manually flip your own membership doc to role: "officer"
// in the Firestore console the first time — same pattern as the earlier
// verified-badge workaround, for the same reason (no admin panel yet).
const teams = [
  {
    id: "dtb",
    name: "DTB",
    description: "Local team based out of The Compound in Auburn, MI.",
    patchUrl: "https://img1.wsimg.com/isteam/ip/ec5d8dd8-d89f-4c7e-90be-3eaf25e1aa35/DTB_Patch.png/:/rs=w:365,h:365,cg:true,m/cr=w:365,h:365",
    createdBy: "seed-script",
  },
];

async function seed() {
  // A claimed field is a real owner's live listing now, not seed data
  // anymore. `merge: true` only protects keys this script's own object
  // never mentions — any key it DOES set (imageUrl, about, etc.) still
  // overwrites whatever's live, seed or not. That's exactly what erased
  // The Compound's own banner image on 2026-09-08 (Michael had set a real
  // one; re-running this script silently put the old seeded one back).
  // Fix: read each field's current `claimed` flag first, and skip both
  // the field doc AND its events entirely once claimed — from that point
  // on, the owner is the source of truth, not this script. (Note: this
  // only prevents future clobbers. It doesn't restore anything this
  // script already overwrote before today — that has to be re-entered by
  // whoever owns the field, same as any other edit via FieldManageScreen.)
  const fieldRefs = fields.map((f) => db.collection("fields").doc(f.id));
  const fieldSnaps = await db.getAll(...fieldRefs);
  const claimedFieldIds = new Set(
    fieldSnaps.filter((snap) => snap.exists && snap.data().claimed === true).map((snap) => snap.id)
  );

  const batch = db.batch();
  let skippedFields = 0;
  let skippedEvents = 0;

  for (const field of fields) {
    if (claimedFieldIds.has(field.id)) {
      skippedFields++;
      continue;
    }
    const { id, ...data } = field;
    batch.set(db.collection("fields").doc(id), data, { merge: true });
  }

  for (const ev of events) {
    if (claimedFieldIds.has(ev.fieldId)) {
      skippedEvents++;
      continue;
    }
    const { id, ...data } = ev;
    batch.set(db.collection("events").doc(id), data, { merge: true });
  }

  for (const team of teams) {
    const { id, ...data } = team;
    batch.set(db.collection("teams").doc(id), data, { merge: true });
  }

  await batch.commit();
  console.log(
    `Seeded ${fields.length - skippedFields}/${fields.length} fields and ` +
    `${events.length - skippedEvents}/${events.length} events (plus ${teams.length} team(s)). ` +
    `Skipped ${skippedFields} already-claimed field(s) and ${skippedEvents} of their event(s) to avoid overwriting owner edits.`
  );
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
