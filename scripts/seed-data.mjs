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
    address: "6109 S US Hwy 31, Ste 100, Franklin, IN 46131",
    phone: "(317) 743-7251",
    website: "https://paintballindianapolis.com",
    ownerEmailDomain: "paintballindianapolis.com",
    facebook: "https://www.facebook.com/PaintballIndiana",
    instagram: "https://www.instagram.com/paintballairsoftindiana/",
    indoorOutdoor: "outdoor",
    admission:
      "Open play $25/day ($35 with rental gear, ammo not included); 10-person party bundles: Airsoft $350 (2,000 BBs included) / Paintball $400 (2,500 paintballs included); additional players $30 each; private play with referee +$50 (24-hr advance booking, $50 non-refundable deposit); ammo a la carte: 2,000 airsoft BBs $20, paintballs $20-60 depending on quantity.",
    about:
      "Outdoor paintball-and-airsoft facility about 20 minutes south of Indianapolis with 15+ game fields (including a Call of Duty-inspired 'kill house'), open Fri-Sun (Mon-Thu by reservation only) with open play, party bundles, corporate events, a youth Little League program, and competitive 'Immortals' airsoft/paintball teams with periodic public tryouts.",
    imageUrl: "https://assets.cdn.filesafe.space/xFt74CxUQcgC8K4HXUHa/media/698d250a7f6dcf4f652fe812.webp",
    status: "active",
    dataSource: "website (paintballindianapolis.com: home, /plan-price, /about, /news-updates) + Facebook + Instagram + Yelp (Franklin listing updated May 2026)",
    lastScraped: "2026-09-11",
    notes:
      "Re-verified and enriched 2026-09-11 at Michael's request. Business has a documented name/location history: operated previously as 'Spec Ops Group' and 'Paintball Indianapolis' at two different Martinsville, IN addresses (both now confirmed CLOSED on Yelp) before relocating to the current Franklin address. Corrected zip from 46143 to 46131 (46143 is Greenwood, IN's zip, not Franklin's) and added the Ste 100 suite number, per Yahoo Local, Redfin, and Boise Gun Club directory cross-checks. Phone number has conflicting reports across directories ((317) 743-7251 per the site itself, used here; (317) 480-4139 per two regional directories; (765) 516-4854 per Yahoo Local) -- worth confirming by phone if it ever goes stale. Not currently listed on AirsoftC3 under any of its names.",
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
    id: "woodland-park-airsoft",
    name: "Woodland Park Airsoft",
    city: "Nunnelly, TN",
    address: "6634 Woodland Park Circle, Nunnelly, TN 37137",
    phone: "615-913-0354",
    facebook: "https://www.facebook.com/p/Woodland-Park-Airsoft-61551415616331/",
    indoorOutdoor: "outdoor",
    about: "Outdoor airsoft field in rural Hickman County, supplied directly by Michael.",
    status: "facebook_only",
    dataSource: "Facebook business page + bushwookieairsoft.com's TN community field list (matching address and phone) + BST Airsoft field directory — no owned website found",
    lastScraped: "2026-09-11",
    notes: "Thin verification beyond the Facebook page and two directory listings — no hours or pricing published anywhere found. Confirm directly before relying on this one.",
  },
  {
    id: "sweetwater-airsoft",
    name: "Sweetwater Airsoft",
    city: "Niota, TN",
    address: "544 County Road 275, Niota, TN 37826",
    website: "https://sweetwaterairsoft.com",
    ownerEmailDomain: "sweetwaterairsoft.com",
    facebook: "https://www.facebook.com/p/Sweetwater-AirSoft-The-Body-Farm-100063503894994/",
    instagram: "https://www.instagram.com/sweetwaterairsoft/",
    indoorOutdoor: "outdoor",
    admission: "$20 field fee; $30 rental package (gun, mask, 1000 BBs) — rental is in addition to the field fee",
    about:
      "East Tennessee outdoor airsoft field also known as \"The Body Farm,\" describing itself as aiming for a family-friendly environment that still satisfies dedicated players. Offers birthday parties and equipment rentals.",
    status: "active",
    dataSource: "website (sweetwaterairsoft.com) + Facebook + Instagram + Discord + AirsoftC3",
    lastScraped: "2026-09-11",
    notes: "Supplied directly by Michael. Hours not published on the site (shown as \"closed\" with no schedule listed) — check its event calendar/socials for open-play dates.",
  },
  {
    id: "the-battlegrounds",
    name: "The Battlegrounds",
    city: "Munhall, PA",
    address: "530 E 8th Ave, Munhall, PA 15120",
    phone: "(412) 530-2192",
    website: "https://thebgpittsburgh.com",
    facebook: "https://facebook.com/battlegroundspittsburgh",
    instagram: "https://instagram.com/thebgpittsburgh",
    youtube: "https://youtube.com/c/TheBattlegroundsPA",
    indoorOutdoor: "indoor",
    about:
      "Indoor entertainment venue in the Pittsburgh area featuring themed airsoft arenas alongside NERF play areas and RC crawling courses. Specializes in birthday and private parties plus corporate group events.",
    status: "active",
    dataSource: "website + Facebook + Instagram + YouTube + Yelp + Nextdoor",
    lastScraped: "2026-09-11",
    notes: "Pricing not published on the homepage — check its booking page. Contact email (info@bgrounds.com) is on a different domain than the site itself, so no ownerEmailDomain is set.",
  },
  {
    id: "mercer-airsoft-center",
    name: "Mercer Airsoft Center",
    city: "Mercer, PA",
    address: "1917 Mercer West Middlesex Rd, Mercer, PA 16137",
    phone: "(724) 979-6600",
    website: "https://mercerairsoftcenter.com",
    facebook: "https://facebook.com/mercerairsoftcenter",
    instagram: "https://www.instagram.com/mercerairsoftcenter",
    indoorOutdoor: "outdoor",
    admission: "$30 for a private group reservation; special-event pricing varies (e.g. $40 for a \"Sunarian Front II\" event)",
    about:
      "24-acre purpose-built outdoor airsoft field, \"created by airsoft players for airsoft players,\" operating since 2010 with a full-service pro shop. Hosts weekly open skirmish and MilSim games plus special events.",
    status: "active",
    dataSource: "website + Facebook + Instagram + Discord + Yelp",
    lastScraped: "2026-09-11",
    notes: "Contact email is a personal verizon.net address, not domain-matched, so no ownerEmailDomain is set. Hours: Wed-Fri 4pm-8pm, Sat-Sun 9am-5pm.",
  },
  {
    id: "steeltown-event-park",
    name: "Steeltown Event Park",
    city: "Oakdale, PA",
    address: "2 Willow Ave, Oakdale, PA 15071",
    phone: "(412) 443-9287",
    website: "https://steeltownpaintball.com",
    indoorOutdoor: "indoor + outdoor",
    about:
      "Multi-activity paintball, airsoft, and events park (also runs golf simulators and other entertainment offerings) offering both indoor and outdoor airsoft alongside its long-running paintball operation. Previously operated under addresses in New Kensington and Emsworth, PA before relocating to its current Oakdale site.",
    status: "active",
    dataSource: "website + Yelp (updated June 2026) + Facebook + AirsoftC3 + Tripadvisor",
    lastScraped: "2026-09-11",
    notes: "Pricing not itemized in what could be fetched — check steeltownpaintball.com/pricing directly.",
  },
  {
    id: "three-rivers-paintball-airsoft",
    name: "Three Rivers Paintball Park",
    city: "Freedom, PA",
    address: "282 Rochester Road, Freedom, PA 15042",
    phone: "(724) 775-6232",
    website: "https://www.trpaintball.com",
    ownerEmailDomain: "trpaintball.com",
    facebook: "https://facebook.com/threeriverspaintball",
    twitter: "https://twitter.com/trpaintball",
    indoorOutdoor: "indoor",
    about:
      "\"Western Pennsylvania's largest and longest running paintball facility,\" family-owned since 1983, offering airsoft (ages 10+, 13+ for standard play) alongside paintball. Currently indoor-only while an outdoor field is under development (\"coming soon\" per the site).",
    status: "active",
    dataSource: "website + Facebook + Twitter + Yelp + Tripadvisor + Nextdoor",
    lastScraped: "2026-09-11",
    notes: "AirsoftC3 lists this under the fuller name \"Three Rivers Paintball and Airsoft Park\" — same business; current site branding is \"Three Rivers Paintball Park.\"",
  },
  {
    id: "poco-loco-paintball",
    name: "PocoLoco Paintball",
    city: "Schwenksville, PA",
    address: "134 Kurtz Rd, Schwenksville, PA 19473",
    phone: "(610) 630-4793",
    website: "https://www.pocolocopaintball.com",
    indoorOutdoor: "outdoor",
    about:
      "Outdoor action park operating since June 1992, offering \"Paintball and Airsoft for individuals, groups, and parties\" across natural wooded terrain with a CQB map, mock-town environment, castle, and mock military vehicles.",
    status: "active",
    dataSource: "website + Yelp + AirsoftC3",
    lastScraped: "2026-09-11",
    notes: "Pricing not published in what could be fetched.",
  },
  {
    id: "ambush-airsoft-paintball",
    name: "Ambush Airsoft & Paintball",
    city: "Conestoga, PA",
    address: "91 Hilltop Drive, Conestoga, PA 17516",
    phone: "717-989-4519",
    website: "https://ambushairsoftandpaintball.com",
    indoorOutdoor: "outdoor",
    about:
      "35+ acre outdoor combat sports facility established in 1984, featuring multiple themed zones (a Lego castle, a sprawling city, small villages, and a two-story castle) for airsoft and paintball play.",
    status: "active",
    dataSource: "website + Facebook + Yelp",
    lastScraped: "2026-09-11",
    notes: "Pricing is on the site's own pricing page but wasn't itemized in what could be fetched.",
  },
  {
    id: "combative-sports-pennsylvania",
    name: "Combative Sports Pennsylvania",
    city: "Newport, PA",
    address: "526 Oak Hall Road, Newport, PA 17074",
    facebook: "https://www.facebook.com/p/Combative-Sports-PA-100063577057590/",
    twitter: "https://twitter.com/combativep",
    indoorOutdoor: "outdoor",
    admission: "$25 all-day entry; $5/hour hourly entry; $20/person group rate (4+ people); overnight camping available",
    about:
      "14-acre mixed wooded/wetland-terrain outdoor airsoft field, open weekends day and night, with the tagline \"No one fights alone.\"",
    status: "facebook_only",
    dataSource: "AirsoftC3 + Facebook + X/Twitter — no owned website found",
    lastScraped: "2026-09-11",
    notes: "AirsoftC3's listing was last updated in 2023. Contact email on file is a personal gmail, not domain-matched, so no ownerEmailDomain is set.",
  },
  {
    id: "outdoor-xtreme-hatfield",
    name: "Outdoor Xtreme Hatfield",
    city: "Hatfield, PA",
    address: "307 Swartley Rd, Hatfield, PA 19440",
    phone: "215-997-7877",
    website: "https://www.oxhatfield.com",
    indoorOutdoor: "outdoor",
    admission:
      "$25 all-day admission with own equipment; $55 rental package (rifle, mask, red rag, 1,500 BBs); private parties $400 (weekend) or $450 (weekday) for up to 10 players / 2 hours, additional players $40 + tax each",
    about:
      "Pennsylvania location of the multi-state Outdoor Xtreme paintball/airsoft chain (also operating in NY, MD, FL, SC, and TX). Airsoft walk-on play runs Saturdays and Sundays, 9am-4pm.",
    status: "active",
    dataSource: "website (chain site + PA-specific subsite) + Facebook + Yelp + Tripadvisor + Macaroni Kid",
    lastScraped: "2026-09-11",
    notes: "",
  },
  {
    id: "outdoor-xtreme-linglestown",
    name: "Outdoor Xtreme Linglestown",
    city: "Harrisburg, PA",
    address: "1 Iru Lane, Harrisburg, PA 17112",
    phone: "(717) 541-8323",
    website: "https://oxlinglestown.com",
    indoorOutdoor: "outdoor",
    admission:
      "$25 all-day admission with own equipment; $55 rental package (rifle, full-face mask, red rag, 1,500 BBs); private parties $400 (weekend) or $450 (weekday) for up to 10 players / 2 hours, including rental gear",
    about:
      "Second Pennsylvania location of the Outdoor Xtreme chain, serving the Harrisburg/Linglestown area. Airsoft walk-on play runs Saturdays and Sundays, 9am-4pm.",
    status: "active",
    dataSource: "website (chain site + subsite) + Facebook + Tripadvisor + Groupon + AirsoftC3",
    lastScraped: "2026-09-11",
    notes: "AirsoftC3 lists this under the older name \"Linglestown Paintball and Airsoft\" — same field, current branding is \"Outdoor Xtreme Linglestown.\"",
  },
  {
    id: "steel-city-airsoft",
    name: "Steel City Airsoft",
    city: "McKees Rocks, PA",
    address: "24 Furnace Street Ext, McKees Rocks, PA 15136",
    phone: "(412) 437-8305",
    website: "http://www.steelcityairsoft.com",
    indoorOutdoor: "indoor",
    about:
      "16,000-sq-ft indoor airsoft facility near Pittsburgh, \"newly reopened\" per its own site after a hiatus. Open Fridays 6pm-11pm and weekends noon-10pm.",
    status: "active",
    dataSource: "website + Yelp (updated June 2026) + Facebook + Instagram + Nextdoor + AirsoftC3",
    lastScraped: "2026-09-11",
    notes:
      "Several older directories (Groupon, Yellow Pages, Manta) still list a prior address in Oakdale, PA (1 Willow Ave) — that appears to be a former location, distinct from the unrelated Steeltown Event Park now at the very similar-looking 2 Willow Ave in the same town. Current sources (Yelp June 2026, its own site, Facebook, Instagram) consistently point to the McKees Rocks address used here.",
  },
  {
    id: "urban-assault-paintball",
    name: "Urban Assault Paintball",
    city: "McDonald, PA",
    address: "201 Cecil Sturgeon Rd, McDonald, PA 15057",
    phone: "724-926-9000",
    website: "https://www.urbanassaultpb.com",
    indoorOutdoor: "outdoor",
    admission: "Airsoft entry $35/player (Sundays only, 11am-6pm); players must bring their own equipment — rentals are not available for airsoft",
    about:
      "\"Pittsburgh's original paintball park,\" offering a dedicated Sunday airsoft open-play day alongside its primary paintball operation, plus axe throwing and overnight camping.",
    status: "active",
    dataSource: "website + Facebook",
    lastScraped: "2026-09-11",
    notes:
      "Airsoft is a once-a-week (Sunday only) sub-offering here, not a daily activity — flagging so expectations are set correctly, same pattern as other paintball-primary venues in this dataset (Louisiana's Paintball Command, Virginia's Bethel Battlefield).",
  },
  {
    id: "cjs-paintball-airsoft-park",
    name: "CJ's Paintball & Airsoft Park",
    city: "Martell, NE",
    address: "16500 SW 14th Street, Martell, NE 68404",
    phone: "(402) 464-2769",
    website: "https://cjspaintballpark.com",
    facebook: "https://www.facebook.com/CJSPAINTBALLPARK/",
    instagram: "https://www.instagram.com/cjspaintball/",
    twitter: "https://x.com/cjspaintballprk",
    indoorOutdoor: "outdoor",
    admission:
      "Airsoft open play held every 1st and 3rd Sunday of the month, 11am-4pm: $25 entry with own gear, $45 rental package (gun, mask, vest, dead rag, 2 mags); mid-cap mag refills $2, high-cap $5. No private airsoft parties — airsoft is scheduled open-play days only.",
    about:
      "Long-running outdoor paintball park near Lincoln, NE with wooded/fortified terrain across multiple fields, running dedicated recurring airsoft open-play days twice a month with rental gear available. Documented airsoft posts going back to at least 2019.",
    status: "active",
    dataSource:
      "website (cjspaintballpark.com, including dedicated /airsoft/ page) + Facebook + Instagram + X + YouTube (third-party gameplay video) + Tripadvisor",
    lastScraped: "2026-09-11",
    notes:
      "Facebook auto-tags the location as 'Centerville NE,' an unincorporated place adjacent to Martell — same business, not a second location. A 2025 Instagram post about a price increase confirms current, active operation.",
  },
  {
    id: "warped-sportz",
    name: "Warped Sportz",
    city: "Wood River, NE",
    address: "19387 W. Rainforth Road, Wood River, NE 68883",
    phone: "(308) 440-5102",
    website: "https://warpedsportz.com",
    facebook: "https://www.facebook.com/Warpedsportzadventurepark/",
    indoorOutdoor: "outdoor",
    admission:
      "Annual membership listed at $150; day-pass/rental pricing not itemized on the public site (call to ask). Hours: Mon-Fri reservation-only, Sat 10am-5pm, Sun 11am-5pm.",
    about:
      "Paintball business founded in 1994 that expanded into central Nebraska around 2010, offering multiple field types (woods, airball, hyperball, a custom scenario field). Its own site and contact page explicitly advertise 'paintball and airsoft action,' though airsoft is secondary to its core paintball business.",
    status: "active",
    dataSource:
      "website (warpedsportz.com: home, contact, events, about-us) + local news (theindependent.com, 2017) + Facebook + Groupon + Nextdoor",
    lastScraped: "2026-09-11",
    notes:
      "Address has moved: older directories (Groupon, Manta, Yahoo Local, airsoftboard.com) still list a prior Kearney/Amherst-area address (e.g. '15728 Odessa Road, Amherst, NE' or 'Kearney, NE 68847'); the address here is the current one per the business's own site. A separate, unrelated business also called 'Warped Sportz' (a skate/paintball shop in Crown Point, Indiana) shows up in searches — do not confuse its reviews/socials with this Nebraska field. Worth confirming current pricing by phone since it isn't itemized online.",
  },
  {
    id: "airsoft-sioux-falls",
    name: "Airsoft Sioux Falls",
    city: "Sioux Falls, SD",
    address: "201 N Harlem Ave, Sioux Falls, SD 57104",
    phone: "(605) 361-5200",
    website: "https://www.crossfire-airsoft.com",
    facebook: "https://www.facebook.com/AirsoftSiouxFalls/",
    instagram: "https://www.instagram.com/AirsoftSiouxFalls",
    indoorOutdoor: "outdoor",
    admission:
      "$25/player bring-your-own-gear; $55/player full rental (gear + unlimited BBs); barrel bag $8, dead rag $4. Bio-BBs required. Ages 10+ (10-13 requires a parent present; under-18 needs an annual digital waiver).",
    about:
      "Outdoor, woods-only airsoft field (~8 acres) run by Crossfire Paintball behind their Sioux Falls building, hosting organized walk-on games on the 2nd and 4th Sunday of the month during a May-October season. The only dedicated airsoft field listed for South Dakota on AirsoftC3.",
    status: "active",
    dataSource:
      "AirsoftC3 + website (crossfire-airsoft.com: home, /airsoft-sioux-falls, /schedule, /rates) + crossfire-paintball.com + Tripadvisor + Experience Sioux Falls tourism listing + CommunityVotes Sioux Falls 2025 (Gold, Paintball) + YouTube gameplay videos",
    lastScraped: "2026-09-11",
    notes:
      "Caution: as of this research (Sept 2026), the operator's own site still said it was 'hoping to open in July' for the 2026 season and needed volunteers to rebuild field bunkers first — no 2026-dated post/review/schedule entry was found confirming games actually ran this year. Not confirmed closed, but worth a phone/Facebook check before treating as fully active this season. Same corporate operator (Crossfire) also runs a paintball+airsoft field under the Crossfire brand in Clearwater, MN.",
  },
  {
    id: "black-hills-paintball",
    name: "Black Hills Paintball",
    city: "Rapid City, SD",
    address: "2472 Forest Place, Rapid City, SD 57701",
    phone: "(605) 484-0777",
    website: "https://blackhillspaintball.com",
    facebook: "https://www.facebook.com/blackhillspaintball/",
    instagram: "https://www.instagram.com/blackhillspaintball.1/",
    indoorOutdoor: "outdoor",
    admission:
      "Airsoft group rental party (8 players): $250 base, +$31.25/extra player, includes 8 masks, 8 guns, 4,000 BBs, a referee, all-day entry. Walk-on individual: $37 full rental, or $30 BBs+entry if bringing own gun. Hours Sat-Sun 9am-5pm, other times by appointment (reservation by phone only); $100 non-refundable no-show fee.",
    about:
      "Long-running Rapid City paintball facility with four game fields (woodsball/speedball/scenario), which also explicitly rents and runs semi/full-auto-selectable airsoft rifles as a parallel activity to its core paintball business.",
    status: "active",
    dataSource:
      "website (blackhillspaintball.com: home, /airsoft, /contact) + Facebook + Instagram + Threads + YouTube + local directories (paintballfieldfinder.com, localblackhills.com, Roadtrippers) + blackhillsstore.com gift-certificate listing",
    lastScraped: "2026-09-11",
    notes:
      "A directory (paintballfieldfinder.com) tacks 'and Airsoft' onto the business's name, but every independent source (own site, Facebook, Instagram) uses just 'Black Hills Paintball' — used that as the name here. Airsoft is a secondary product line to paintball and could be de-emphasized without a website update, so worth confirming current availability by phone before relying on the pricing above.",
  },
  {
    id: "black-rhino-airsoft",
    name: "Black Rhino Airsoft",
    city: "Baldwin, ND",
    address: "15819 Cattle Drive, Baldwin, ND 58521",
    phone: "(701) 404-9690",
    website: "https://blackrhinoairsoft.square.site/home",
    facebook: "https://www.facebook.com/BlackRhinoAirsoftLLC/",
    youtube: "https://www.youtube.com/@blackrhinoairsoft93",
    indoorOutdoor: "indoor + outdoor",
    about:
      "Locally owned airsoft company just north of Bismarck offering public open play and private events, founded by Taylor Kindseth in 2017 under a special-use permit. Expanded after a 2021 Bismarck city ordinance change explicitly legalized recreational airsoft/paintball arenas within city limits.",
    status: "active",
    dataSource:
      "AirsoftC3 + Bismarck Tribune ('Airsoft field to open Saturday', 2017) + KFYR-TV (2021-07-15, ordinance-change story naming the business and owner) + North Dakota business registry (Entity #158912, domestic LLC, registered 2017-02-07, active/good standing) + Boise Gun Club directory (secondary)",
    lastScraped: "2026-09-11",
    notes:
      "Strongest-verified of the two ND entries: active/good-standing LLC registration plus two independent local news stories naming the business and owner directly. Gap: no independently confirmed 2024-2026 activity (reviews/posts) turned up in search — Facebook itself is robots-blocked from direct fetch, so recent activity may simply not be search-indexed rather than the field being inactive. A secondary phone number, (701) 255-5757, appears on one third-party directory; treated the AirsoftC3-listed number as primary.",
  },
  {
    id: "legacy-field",
    name: "Legacy Field",
    city: "Wilton, ND",
    address: "27600 ND-1804, Wilton, ND 58579",
    facebook: "https://www.facebook.com/Legacyfield/",
    indoorOutdoor: "outdoor",
    about:
      "13-acre outdoor paintball/airsoft venue north of Bismarck with three distinct play zones (open, wooded, and urban/trench terrain near a large airstrip), run by mobile paintball-supply operator 'Legacy Paintball.'",
    status: "active",
    dataSource: "AirsoftC3 (field + business listings) + Facebook (title/metadata only — page blocked from direct fetch by robots.txt)",
    lastScraped: "2026-09-11",
    notes:
      "Weakest-verified entry in this batch — include with caution. No phone number, no independent website, and no matching North Dakota business registry entry were found (may operate as a sole proprietorship/DBA rather than a registered LLC). AirsoftC3 lists two slightly different addresses for the field vs. the business (27600 vs 27550 ND-1804) and Facebook's page title says 'Baldwin, ND' rather than Wilton — Wilton and Baldwin are neighboring small communities on the same highway, so this is likely one property near the boundary rather than two locations, but it could not be fully resolved. AirsoftC3's own listing was last updated 08/30/2023 — worth a phone/Facebook-Messenger check before relying on this as fully current. A same-name-different-state business, 'Legacy Paintball & Airsoft Park' in New York/Vermont, is unrelated — do not confuse its info with this ND field.",
  },
  {
    id: "command-decisions-wargames-center",
    name: "Command Decisions Wargames Center",
    city: "Taylorsville, NC",
    address: "84 Reaganswood Dr, Taylorsville, NC 28681",
    website: "https://cdwargames.com",
    facebook: "https://www.facebook.com/CommandDecisions",
    indoorOutdoor: "outdoor",
    about:
      "Long-running combined paintball/airsoft wargames park in the NC foothills (70+ acres, 15+ bases), hosting large-scale scenario events such as 'Fulda Gap' and 'Carolina Outposts.'",
    status: "active",
    dataSource:
      "website (cdwargames.com) + Yelp + Facebook + paintballevents.net (Fulda Gap, Nov 2025) + AllEvents (Carolina Outposts, Nov 2025)",
    lastScraped: "2026-09-11",
    notes: "No public phone number found; contact appears to run through the website.",
  },
  {
    id: "gunnys-warfare-center",
    name: "Gunny's Warfare Center",
    city: "Marshville, NC",
    address: "2407 Ansonville Rd, Marshville, NC 28103",
    phone: "(704) 352-5656",
    website: "https://gunnyswarfarecenter.com",
    facebook: "https://www.facebook.com/GunnysWarfareCenter",
    indoorOutdoor: "outdoor",
    about:
      "Self-described 'Charlotte's First Dedicated Airsoft Field' — a 30+ acre outdoor site about 30 minutes southeast of Charlotte with rental equipment and weekend open play.",
    status: "active",
    dataSource: "website + Yelp + Tripadvisor + Nextdoor + Facebook",
    lastScraped: "2026-09-11",
    notes:
      "Some directories cross-reference nearby Waxhaw addressing for this rural Union County site — same location, not a second field.",
  },
  {
    id: "battle-on-bell-airsoft",
    name: "Battle on Bell Airsoft",
    city: "Otto, NC",
    address: "1688 Bell Rd, Otto, NC 28763",
    website: "https://battleonbellairsoft.com",
    facebook: "https://www.facebook.com/battleonbellairsoft",
    indoorOutdoor: "outdoor",
    about:
      "Outdoor airsoft field in far-western NC (Macon County) with wooded terrain and a dedicated speedball area.",
    status: "active",
    dataSource:
      "website + Yelp (92 photos, updated Nov 2024) + YouTube + Nextdoor + Yahoo Local",
    lastScraped: "2026-09-11",
    notes:
      "A phone number is listed on a local Chamber of Commerce directory, but the full digits couldn't be independently confirmed — omitted rather than guessed.",
  },
  {
    id: "southfield-airsoft",
    name: "Southfield Airsoft",
    city: "Jacksonville, NC",
    address: "2586 Wilmington Hwy, Jacksonville, NC 28540",
    website: "https://southfieldairsoft.com",
    facebook: "https://www.facebook.com/southfieldairsoft",
    indoorOutdoor: "outdoor",
    about:
      "Outdoor field near Jacksonville/Camp Lejeune offering weekend day play, night games with tracers and flashlights, and private scenario building.",
    status: "active",
    dataSource: "website + Facebook + Superpages (address) + Nextdoor",
    lastScraped: "2026-09-11",
    notes: "No phone number found published.",
  },
  {
    id: "jacksonville-paintball-airsoft-park",
    name: "Jacksonville Paintball & Airsoft Park",
    city: "Jacksonville, NC",
    address: "130 Imperial Lane, Jacksonville, NC 28540",
    phone: "(910) 353-7529",
    website: "https://jacksonvillepaintballpark.com",
    indoorOutdoor: "outdoor",
    about:
      "Paintball-and-airsoft park with Woods, Urban Combat, Action Town, and Speedball courses plus a dedicated airsoft page; Sat/Sun walk-in hours with weekday reservations.",
    status: "active",
    dataSource: "website + Yelp + Nextdoor + Onlyinonslow.com + Kidvoyage",
    lastScraped: "2026-09-11",
  },
  {
    id: "xtreme-park-adventures",
    name: "Xtreme Park Adventures",
    city: "Durham, NC",
    address: "7460 NC Highway 98, Durham, NC 27703",
    phone: "(919) 596-6100",
    website: "https://xtremeparkadventures.com",
    indoorOutdoor: "outdoor",
    about:
      "50-acre multi-activity outdoor park including 'Xtreme Airsoft' alongside paintball, laser tag, and ziplines; current hours Mon-Fri 10am-4pm, Sat-Sun 10am-6pm.",
    status: "active",
    dataSource:
      "website + Nextdoor + old Facebook page (xtremekombatpark) + YouTube + AirsoftC3",
    lastScraped: "2026-09-11",
    notes:
      "Rebrand: AirsoftC3 and some directories still list this under its old name 'Xtreme Kombat' — same physical location, now operating as Xtreme Park Adventures.",
  },
  {
    id: "rats-airsoft",
    name: "RATS Airsoft",
    city: "Reidsville, NC",
    address: "1404 Mizpah Ch. Rd, Reidsville, NC 27320",
    phone: "(336) 520-7079",
    website: "https://ratsairsoft.com",
    youtube: "https://www.youtube.com/@ratsairsoft3944",
    indoorOutdoor: "outdoor",
    about:
      "Outdoor airsoft field ('Rockingham Airsoft & Tactical Support') open Saturdays 9am-5pm, serving the Rockingham County/Piedmont area.",
    status: "active",
    dataSource:
      "website contact page + Facebook + YouTube (video dated March 2025) + Eventbrite + AirsoftC3",
    lastScraped: "2026-09-11",
  },
  {
    id: "airsoft-battle-park",
    name: "Airsoft Battle Park",
    city: "Graham, NC",
    address: "4031 Mineral Springs Rd, Graham, NC 27253",
    facebook: "https://www.facebook.com/airsoftbattlepark",
    instagram: "https://www.instagram.com/airsoftbattlepark",
    indoorOutdoor: "outdoor",
    admission: "$15 all-day play; $40 with rental gear; group rates available",
    about:
      "34-acre outdoor field with open play games every Saturday of the year.",
    status: "active",
    dataSource:
      "Macaroni Kid Burlington-Hillsborough directory + Facebook + Instagram + Nextdoor + AirsoftC3",
    lastScraped: "2026-09-11",
  },
  {
    id: "chickens-tactical",
    name: "Chicken's Tactical",
    city: "Newland, NC",
    address: "2930 Cow Camp Rd, Newland, NC 28657",
    phone: "(828) 260-3177",
    website: "https://jeffthom83.wixsite.com/chickens",
    indoorOutdoor: "outdoor",
    about:
      "Small, owner-operated 'High Country' (Avery County, near Boone) airsoft field and pro-shop offering field rental, repairs, and organized events; open Saturdays 10:30am-5pm.",
    status: "active",
    dataSource: "own Wix site + AirsoftC3",
    lastScraped: "2026-09-11",
    notes:
      "Smallest/lowest-traffic operator in this batch — day-to-day activity is referenced on Facebook, but independently corroborating reviews were limited. Worth a confirmation call before treating as fully verified.",
  },
  {
    id: "paintball-central-greensboro",
    name: "Paintball Central - Greensboro",
    city: "Gibsonville, NC",
    address: "6106 Burlington Road, Gibsonville, NC 27249",
    phone: "(336) 449-4406",
    website: "https://pballcentral.com/greensboro",
    indoorOutdoor: "outdoor",
    admission:
      "$25/player (self-equipped) plus tax; ages 10+ (13+ recommended); weekdays private groups only, Sat-Sun 10am-6pm",
    about:
      "Paintball facility near Greensboro with a dedicated 'Play Airsoft' program alongside its core paintball offering.",
    status: "active",
    dataSource: "website (dedicated 'Play Airsoft' page) + Eventseeker + Airsoft Nut + AirsoftC3",
    lastScraped: "2026-09-11",
    notes:
      "AirsoftC3 lists this under 'PBC Sports Park - Greensboro'; the operating business's actual current branding is 'Paintball Central' (Greensboro location) — same facility, used current branding here.",
  },
  {
    id: "black-ops-paintball-airsoft",
    name: "Black Ops Paintball & Airsoft",
    city: "Fayetteville, NC",
    address: "2112 River Rd, Fayetteville, NC",
    website: "https://blackopspaintball.org/fayetteville",
    facebook: "https://www.facebook.com/BlackOpsAir",
    indoorOutdoor: "outdoor",
    about:
      "Paintball-and-airsoft facility serving the Fayetteville/Fort Liberty area, in the unincorporated Eastover community within Cumberland County.",
    status: "active",
    dataSource:
      "Yelp (updated July 2026) + Tripadvisor + Trip.com + Fayetteville Chamber of Commerce + Facebook + YouTube",
    lastScraped: "2026-09-11",
    notes:
      "Zip code not independently confirmed and omitted rather than guessed; some directories reference 'Eastover, NC' as the community name for this Fayetteville-mailing-address location.",
  },
  {
    id: "adventure-beach-paintball-airsoft",
    name: "Adventure Beach Paintball and Airsoft",
    city: "Tabor City, NC",
    address: "305 Lays Lake Dr, Tabor City, NC 28463",
    facebook: "https://www.facebook.com/abpaintballsc",
    indoorOutdoor: "outdoor",
    about:
      "Paintball facility near the NC/SC coastal border (close to Myrtle Beach) with historical evidence of airsoft offerings via AirsoftC3's listing and a YouTube video, though branded primarily around paintball today.",
    status: "active",
    dataSource:
      "Tripadvisor + Yelp + YouTube + AirsoftC3 + Columbus County Chamber of Commerce",
    lastScraped: "2026-09-11",
    notes:
      "Include-with-caution: could not confirm airsoft is still a currently-offered activity versus paintball-only today — branding is primarily paintball, with airsoft evidenced historically (AirsoftC3's listing name and an older YouTube gameplay video). Worth confirming by phone before relying on this as an active airsoft option.",
  },
  {
    id: "airsoft-charleston",
    name: "Airsoft Charleston",
    city: "North Charleston, SC",
    address: "6658 Dorchester Rd, North Charleston, SC 29418",
    phone: "(843) 952-9384",
    website: "https://airsoftcharleston.com",
    facebook: "https://www.facebook.com/airsoftCHS/",
    indoorOutdoor: "outdoor",
    about:
      "A 7-8.5 acre outdoor airsoft field 'by enthusiasts, for enthusiasts,' with a formal waiver/safety-briefing process for newcomers and experienced players alike.",
    status: "active",
    dataSource:
      "AirsoftC3 + Chamber of Commerce business directory + own site (home, directions, FAQ) + Battleonix directory",
    lastScraped: "2026-09-11",
    notes:
      "Confirmed hosting 'Operation Shadowlands' milsim events with Team Shadow Airsoft in both 2024 and 2025 — strong recent evidence of continuous operation. One automated extraction of the homepage showed '6714 Dorchester Rd' instead of 6658 — used 6658 since it's cross-referenced by AirsoftC3 and the Chamber of Commerce directory.",
  },
  {
    id: "black-ops-airsoft-south",
    name: "Black Ops Airsoft South",
    city: "Ravenel, SC",
    address: "SC-165 & Hyde Park Rd, Ravenel, SC 29470",
    phone: "315-871-8697",
    website: "https://boa-s.com",
    facebook: "https://www.facebook.com/BOASouth",
    instagram: "https://www.instagram.com/blackopssouth",
    indoorOutdoor: "outdoor",
    about:
      "Family-oriented airsoft and gel-blaster field established 2012, emphasizing sportsmanship and safety.",
    status: "active",
    dataSource:
      "own site (home, contact-us, game-play-rules) + Yelp + Nextdoor + YellowPages + Facebook (title only) + 843area.com + Wheree.com",
    lastScraped: "2026-09-11",
    notes:
      "Recently relocated: older directories (Yelp, Nextdoor, YellowPages, localgymsandfitness, 843area.com) still list a stale prior address, 1040 W Richardson Ave, Summerville, SC — the business's own site says it 'recently relocated' with new-field info posted to Facebook. Used the current Ravenel location per the operator's own site and Facebook page title; recommend confirming the exact street address/hours directly since the move appeared still being finalized. A separate, unrelated business, 'Black Ops Paintball & Airsoft' (Conway/Myrtle Beach, seeded separately below), has a similar name but is a different company.",
  },
  {
    id: "black-ops-paintball-airsoft-myrtle-beach",
    name: "Black Ops Paintball & Airsoft",
    city: "Conway, SC",
    address: "4324 US-501 W, Conway, SC 29526",
    phone: "(843) 489-2174",
    website: "https://blackopspaintball.org/myrtle-beach",
    facebook: "https://www.facebook.com/BlackOpsPaintballConway",
    indoorOutdoor: "outdoor",
    admission:
      "Offers an 'Airsoft Birthday Party Package' and 'Airsoft Entry & Rental Packages' on Saturdays and Sundays (exact pricing not published on site).",
    about:
      "Multi-state paintball/airsoft chain (also operating in Fayetteville, NC and Lacey, WA) running airsoft alongside paintball on weekends and for private events near Myrtle Beach.",
    status: "active",
    dataSource:
      "own site (contact, myrtle-beach, myrtle-beach/airsoft) + Apple Maps + Yelp + Nextdoor + Conway SC Chamber of Commerce + Tripadvisor",
    lastScraped: "2026-09-11",
    notes:
      "A related retail location, 'Black Ops Paintball and Airsoft Store' at 6650 SC-707, Myrtle Beach, SC, appears to be a satellite pro-shop rather than a second field. Not to be confused with the unrelated, similarly-named 'Black Ops Airsoft South' in Ravenel, SC (seeded separately above) — verified via separate websites, phone numbers, and addresses.",
  },
  {
    id: "sqairsoft",
    name: "SQAirsoft",
    city: "Lexington, SC",
    address: "1205 Founders Road, Lexington, SC 29073",
    website: "https://www.sqairsoft.com",
    indoorOutdoor: "outdoor",
    admission:
      "Standard skirmish games $20-25; half-day events $20; multi-day $35; $5 military/first-responder discount; field rental gun $25, mask rental $5.",
    about:
      "Active outdoor field/pro-shop (legally Escue Airsoft, LLC) in the Columbia/Lexington Midlands area hosting monthly public skirmishes plus named large-scale events.",
    status: "active",
    dataSource: "own site (game-information page, live event calendar) + AirsoftC3 + Airsoft Nut + localgymsandfitness",
    lastScraped: "2026-09-11",
    notes:
      "Best-documented field in the state: its own site lists a full 2026 event calendar (monthly skirmishes Jan-Sept, 'Wasteland V' in May, 'Patch Wars' in Aug, and 'AOSC's 17th Anniversary Game' Sept 19-20, 2026) — a long-running, 17-year community anchor. AirsoftC3 double-lists this business under two name variants ('SQA (Escue Airsoft)' and 'Escue Airsoft (SQA)') — same business, not two fields. No phone number found published.",
  },
  {
    id: "battlecat-sports",
    name: "BattleCat Sports",
    city: "Anderson, SC",
    address: "102 N Manning St, Anderson, SC 29621",
    phone: "(864) 964-0167",
    website: "https://battlecatsports.com",
    facebook: "https://www.facebook.com/p/BattleCat-Sports-61581259475889/",
    indoorOutdoor: "indoor",
    about:
      "Described as the first fully dedicated military/law-enforcement/public tactical training center in South Carolina, offering urban airsoft combat plus a retail gun shop, Youth Night, birthday parties, and 'Bazooka Ball' foam-ball games.",
    status: "active",
    dataSource:
      "own site (home, contact-us) + Yelp (updated August 2026) + YellowPages + Chamber of Commerce directory + Nextdoor + AirsoftC3 + Airsoft Nut",
    lastScraped: "2026-09-11",
    notes:
      "Hours: store Wed-Fri 10am-6pm, Sat 10am-10pm, Sun 12pm-6pm (closed Mon/Tue); public arena Sat 2pm-6pm, Sun 1pm-6pm; Youth Night Sat 6pm-10pm.",
  },
  {
    id: "red-fox-games",
    name: "Red Fox Games",
    city: "Woodruff, SC",
    address: "Fowler Road, Woodruff, SC 29388",
    phone: "(864) 386-7304",
    website: "https://redfoxgames.com",
    facebook: "https://www.facebook.com/RedFoxGamesPaintball/",
    indoorOutdoor: "outdoor",
    about:
      "One of the largest paintball/airsoft complexes in the country by acreage (160+ acres, 13 distinct playing fields) — Tripadvisor calls it the '10th largest paintball and airsoft facility in the world.' Woman-owned, offers paintball, airsoft, gel-blaster play, night games, and birthday parties on a conservation-designated property.",
    status: "active",
    dataSource:
      "Tripadvisor + Yelp + Chamber of Commerce directory + YellowPages + Manta + visitgreenvillesc.com (Greenville tourism board) + The Woodruff Times (Aug 9, 2025 news article)",
    lastScraped: "2026-09-11",
    notes:
      "Strongly reaffirmed by local news: The Woodruff Times reported (Aug 9, 2025) that new operator Bethany Hauf took over under a long-term lease from 96-year-old original owner Vaughn Smith, explicitly 'leveling up' the paintball/airsoft/family offerings. Exact street number not published in any source found; Manta lists the city as 'Spartanburg, SC 29388,' but Woodruff is the consistently-used town name across Tripadvisor, Yelp, and news coverage. Requires a 25-player minimum for organized public game days per a partner-booking service (Airsoft X Greenville) that exclusively books this field — that service is not a separate venue.",
  },
  {
    id: "westminster-airsoft",
    name: "Westminster Airsoft",
    city: "Rock Hill, SC",
    address: "4000 India Hook Rd, Rock Hill, SC 29732",
    phone: "(803) 325-6771",
    indoorOutdoor: "outdoor",
    about:
      "A small, community-run airsoft field/league in Rock Hill, SC operating via the BlueSombrero youth/adult sports-league platform rather than its own commercial website.",
    status: "active",
    dataSource: "Google Maps + AirsoftC3 + eListing.us business directory + BlueSombrero + X/Twitter (@WestminsterAir1) + YouTube",
    lastScraped: "2026-09-11",
    notes:
      "Include with caution — moderate confidence. Both its BlueSombrero page and X profile returned access-blocked errors on direct fetch, so recent (2024-2026) activity could not be independently confirmed, though no closure signal was found either. Has real, consistent contact info across multiple sources. Recommend a direct phone call before treating as fully confirmed-active.",
  },
  {
    id: "airsoft-columbia",
    name: "Airsoft Columbia",
    city: "Columbia, SC",
    address: "7216 Middle St, Columbia, SC 29223",
    website: "http://www.airsoftcolumbia.net",
    indoorOutdoor: "outdoor",
    about:
      "A small, apparently informally-run Columbia-area airsoft field/community, likely operated more as a hobbyist club than a commercial venue.",
    status: "active",
    dataSource: "AirsoftC3 + Yelp + Nextdoor + LinkedIn + X + n49.com business directory",
    lastScraped: "2026-09-11",
    notes:
      "Lower confidence — include with caution. The listed website domain does not currently resolve (DNS failure), suggesting it may be dead even if the group still runs informally via social media. No phone number found. The street address also independently appears in real-estate/MLS listings, suggesting this may be a private residential property used as a field (not unusual for small rural fields, but worth a direct confidence check) rather than a commercial venue. Yelp shows no 'CLOSED' banner (unlike a confirmed-closed comparison field found during this research), which is a mild positive signal. Recommend direct outreach via LinkedIn or social handles before treating as a fully bookable venue.",
  },
  {
    id: "miami-airsoft",
    name: "Miami Airsoft",
    city: "Miami Lakes, FL",
    address: "7810 NW 98th St, Miami Lakes, FL 33016",
    website: "https://miamiairsoft.com",
    facebook: "https://www.facebook.com/MiamiAirSoft",
    instagram: "https://www.instagram.com/miamiairsoft",
    youtube: "https://www.youtube.com/user/MiamiAirsoft",
    indoorOutdoor: "indoor",
    about:
      "Indoor airsoft game arena in Miami Lakes with regular open play, parties, and events.",
    status: "active",
    dataSource: "Yelp (43 reviews, updated Aug 2026) + Facebook + Instagram + official site",
    lastScraped: "2026-09-11",
  },
  {
    id: "battletown-miami",
    name: "Battletown Miami",
    city: "Miami, FL",
    address: "18225 SW 188th St, Miami, FL 33187",
    phone: "(305) 878-1731",
    website: "https://battletown305.com",
    facebook: "https://www.facebook.com/BattleTown305",
    indoorOutdoor: "indoor + outdoor",
    about:
      "Paintball and airsoft field/store with a wooded field, a speedball field, and an indoor airsoft CQB arena.",
    status: "active",
    dataSource: "AirsoftC3 + Facebook (multiple related pages confirm activity)",
    lastScraped: "2026-09-11",
  },
  {
    id: "matrix-tactical",
    name: "Matrix Tactical",
    city: "Miami, FL",
    address: "20800 SW 134th Ave, Miami, FL 33177",
    phone: "(786) 458-3130",
    website: "https://matrixtactical.com",
    indoorOutdoor: "outdoor",
    about:
      "Family-owned outdoor paintball/airsoft field billed as 'the ONLY true outdoor battlefield in South Florida.' Open every weekend (Fri 1-6pm, Sat/Sun 10am-5pm).",
    status: "active",
    dataSource: "AirsoftC3 + official website (active pricing page) + Airsoft Society forum + multiple directories",
    lastScraped: "2026-09-11",
    notes:
      "Sources vary slightly on the exact street address in this immediate area (also seen as ~20750 Talbot Rd) — used the address most consistently corroborated.",
  },
  {
    id: "simple-airsoft-bb-ranch",
    name: "Simple Airsoft - The BB Ranch",
    city: "Homestead, FL",
    address: "Colonial Rd & SW 336th St, Homestead, FL 33033",
    phone: "(786) 724-1190",
    website: "https://simpleairsoft.com",
    indoorOutdoor: "outdoor",
    about:
      "Outdoor field ('The BB Ranch') operated by South Florida airsoft retailer/operator Simple Airsoft, alongside their indoor arena in Ft Lauderdale.",
    status: "active",
    dataSource: "official site + Tripadvisor + Groupon + Ft Lauderdale Chamber of Commerce directory",
    lastScraped: "2026-09-11",
    notes:
      "Simple Airsoft also runs a retail shop at 7967 W 28th Ave, Hialeah, FL 33016 (same phone) and a separate indoor arena in Ft Lauderdale, seeded as its own entry (simple-airsoft-ftlauderdale) since it's a distinct bookable location.",
  },
  {
    id: "simple-airsoft-ftlauderdale",
    name: "Simple Airsoft Indoor Arena",
    city: "Fort Lauderdale, FL",
    address: "5320 Powerline Rd Unit 130, Fort Lauderdale, FL 33309",
    phone: "(754) 200-4576",
    website: "https://simpleairsoft.com",
    indoorOutdoor: "indoor",
    about:
      "Indoor airsoft arena run by Simple Airsoft for parties and walk-on play, a separate bookable location from the operator's outdoor 'BB Ranch' field in Homestead.",
    status: "active",
    dataSource: "official site + Tripadvisor + Groupon + Ft Lauderdale Chamber of Commerce directory",
    lastScraped: "2026-09-11",
  },
  {
    id: "palm-beach-airsoft",
    name: "Palm Beach Airsoft",
    city: "Lake Worth, FL",
    address: "6275 Old Congress Rd, Lake Worth, FL 33462",
    phone: "(561) 429-5277",
    website: "https://palmbeachairsoft.com",
    facebook: "https://www.facebook.com/PalmBeachAirSoft",
    instagram: "https://www.instagram.com/PalmBeachAirSoft",
    youtube: "https://www.youtube.com/user/MiamiAirsoft",
    indoorOutdoor: "indoor",
    about:
      "Large (33,000 sq ft) indoor airsoft arena for birthdays, group events, camps, and walk-on play, ages 10+.",
    status: "active",
    dataSource: "official website + Facebook + Instagram",
    lastScraped: "2026-09-11",
    notes:
      "Shares a YouTube channel with Miami Airsoft — likely the same ownership group operating both venues.",
  },
  {
    id: "invincibles-paintball-park",
    name: "Invincibles Paintball Park",
    city: "Port St. Lucie, FL",
    address: "2221 SW Del Rio Blvd, Port St. Lucie, FL 34953",
    phone: "(772) 812-0000",
    website: "https://invinciblespaintball.com",
    facebook: "https://www.facebook.com/InVINCiblesAirSoft",
    instagram: "https://www.instagram.com/invinciblespaintball",
    indoorOutdoor: "outdoor",
    admission: "$20/person entry",
    about:
      "35-acre paintball and airsoft park off I-95/Crosstown Parkway.",
    status: "active",
    dataSource: "AirsoftC3 + Visit St. Lucie tourism listing + Facebook + Airsoft Nut",
    lastScraped: "2026-09-11",
    notes:
      "Markets primarily as a 'paintball park' today but its own materials explicitly still list airsoft as an offering.",
  },
  {
    id: "palm-bay-paintball-park",
    name: "Palm Bay Paintball Park",
    city: "Palm Bay, FL",
    address: "770 Hurricane St, Palm Bay, FL 32908",
    phone: "(772) 380-4949",
    website: "https://palmbaypaintballpark.com",
    indoorOutdoor: "outdoor",
    about:
      "Paintball park with dedicated airsoft rental equipment and airsoft party packages.",
    status: "active",
    dataSource: "official website",
    lastScraped: "2026-09-11",
  },
  {
    id: "war-zone-airsoft",
    name: "War Zone Airsoft",
    city: "Ocala, FL",
    address: "4841 S Pine Ave, Ocala, FL 34480",
    website: "https://warzoneairsoft.com",
    facebook: "https://www.facebook.com/WarZoneAirsoft",
    indoorOutdoor: "outdoor",
    about:
      "Airsoft field in Ocala, FL, registered as War Zone Airsoft, LLC per business registries.",
    status: "active",
    dataSource: "Yelp (updated May 2026) + AirsoftC3 + business registry",
    lastScraped: "2026-09-11",
    notes: "A phone number is listed on a Chamber of Commerce directory but the full digits weren't independently confirmed.",
  },
  {
    id: "wasteland-ops-airsoft",
    name: "Wasteland Ops Airsoft",
    city: "Belleview, FL",
    address: "12888 SE US Hwy 441, Belleview, FL 34420",
    phone: "(352) 419-8957",
    facebook: "https://www.facebook.com/wastelandops",
    instagram: "https://www.instagram.com/wastelandops",
    indoorOutdoor: "outdoor",
    admission: "$20 all-day entry",
    about:
      "Multi-elevation outdoor field with buildings and bunkers, operating every-other-weekend.",
    status: "active",
    dataSource: "Yelp (updated Oct 2025) + Instagram + YouTube + AirsoftC3 + Airsoft Society forum",
    lastScraped: "2026-09-11",
    notes:
      "A separate AirsoftC3 listing, 'The Compound,' resolves to this identical address and phone number — an old/duplicate name for this same field, not a second venue. A duplicate entry under 'Reddick, FL' on a mirror directory also appears to be a geocoding error for this same field.",
  },
  {
    id: "raptor-airsoft-field-and-shop",
    name: "Raptor Airsoft Field and Shop",
    city: "DeLand, FL",
    address: "29540 Fullerville Rd, DeLand, FL",
    website: "https://raptorairsoft.com",
    facebook: "https://www.facebook.com/raptorairsoftfieldandshop",
    instagram: "https://www.instagram.com/raptorairsoftfield",
    indoorOutdoor: "outdoor",
    about:
      "Airsoft field and retail shop in DeLand that also runs 'Central Florida Expeditions'-branded milsim events.",
    status: "active",
    dataSource: "Yelp (824 photos, 20 reviews, updated June 2026) + Nextdoor + Facebook + Instagram",
    lastScraped: "2026-09-11",
  },
  {
    id: "xplex-paintball-and-airsoft",
    name: "Xplex Paintball and Airsoft",
    city: "DeLand, FL",
    address: "1155 Lakeview Dr, DeLand, FL",
    phone: "(386) 214-1939",
    website: "https://xplexpaintball.com",
    indoorOutdoor: "outdoor",
    about:
      "Paintball/airsoft/gellyball field offering rentals, retail, and event nights ('Friday Night Lights,' zombie games).",
    status: "active",
    dataSource: "official site + Yelp (updated Feb 2026) + Tripadvisor + Sunbiz LLC registration",
    lastScraped: "2026-09-11",
    notes:
      "Recently relocated from a prior New Smyrna Beach address (190 Genesis Way) to this DeLand location, per the operator's own site — older directories (AirsoftC3, Nextdoor) may still show the old address.",
  },
  {
    id: "tactical-airsoft-compound",
    name: "Tactical Airsoft Compound",
    city: "Lakeland, FL",
    address: "2600 Saluda Rd, Lakeland, FL 33801",
    phone: "863-535-5080",
    website: "https://taclakeland.com",
    facebook: "https://www.facebook.com/tacairsoftcompound",
    indoorOutdoor: "outdoor",
    about: "Long-running Lakeland-area airsoft compound.",
    status: "active",
    dataSource: "AirsoftC3 + Airsoft Nut + multiple directories + Facebook page",
    lastScraped: "2026-09-11",
    notes:
      "Uncertain/possibly reduced activity — no review, post, or event confirmed in 2024-2026 was found, only older directory data. Include with caution; recommend a direct verification call before treating as fully bookable.",
  },
  {
    id: "black-tiger-airsoft",
    name: "Black Tiger Airsoft",
    city: "Lakeland, FL",
    address: "9365 US Highway 98 N, Lakeland, FL 33809",
    phone: "(813) 955-9632",
    website: "https://blacktigerairsoft.com",
    indoorOutdoor: "outdoor",
    about:
      "Airsoft field that closed and relocated; reopened in 2026 with a soft-opening event dated 7/25/2026 at this new address ('Black Tiger Is Back!!!!').",
    status: "active",
    dataSource: "official website + Hotfrog/Businessyab (old address record) + AirsoftC3",
    lastScraped: "2026-09-11",
    notes:
      "Relocated: the old address (3399 Gina Trail, Lithia, FL — same shared address as DV8 Airsoft Field, seeded separately below) is stale in most directories. Used the new Lakeland address here.",
  },
  {
    id: "dv8-airsoft-field",
    name: "DV8 Airsoft Field",
    city: "Lithia, FL",
    address: "3399 Gina Trail, Lithia, FL 33547",
    website: "https://dv8airsoftfield.com",
    facebook: "https://www.facebook.com/p/DV8-Airsoft-Field-61556131124977",
    indoorOutdoor: "outdoor",
    about:
      "Outdoor field running games every weekend; also hosts larger organized milsim events (e.g. MindGame Productions' 'Amerika 10,' 'Crystal Razor 3').",
    status: "active",
    dataSource: "official site (active events calendar) + MindGame Productions event pages + AirsoftC3 + Waze/Apple Maps",
    lastScraped: "2026-09-11",
    notes:
      "Shares an address with the prior location of Black Tiger Airsoft (now relocated to Lakeland, seeded separately above) — DV8 remains at this Lithia address.",
  },
  {
    id: "warfare-airsoft",
    name: "Warfare Airsoft",
    city: "Sarasota, FL",
    address: "1816 57th St, Sarasota, FL 34243",
    phone: "(941) 356-8105",
    website: "https://warfareairsoft.com",
    facebook: "https://www.facebook.com/warfareairsoft941",
    instagram: "https://www.instagram.com/warfareairsoft941",
    youtube: "https://www.youtube.com/@Warfareairsoft",
    indoorOutdoor: "indoor",
    about:
      "New indoor CQB tactical arena, 'Where Airsoft Becomes Real Combat,' with 12+ game modes.",
    status: "active",
    dataSource: "official site + Macaroni Kid Bradenton (grand-opening article, 2025) + Facebook",
    lastScraped: "2026-09-11",
    notes: "Newly opened in 2025.",
  },
  {
    id: "domination-airsoft-park",
    name: "Domination Airsoft Park",
    city: "Ona, FL",
    address: "670 Co Rd 665, Ona, FL 33865",
    facebook: "https://www.facebook.com/Domination-Airsoft-Park-145550902263337",
    indoorOutdoor: "outdoor",
    about: "Airsoft field in rural Hardee County.",
    status: "active",
    dataSource: "AirsoftC3 (address) + Facebook pages",
    lastScraped: "2026-09-11",
    notes:
      "Uncertain — no confirmed reviews/posts found from 2023-2026, only a stale 2020 directory listing. Include with caution; recommend a verification call before treating as bookable.",
  },
  {
    id: "clearwater-paintball",
    name: "Clearwater Paintball",
    city: "Clearwater, FL",
    address: "2987 N McMullen Booth Rd, Clearwater, FL",
    website: "https://clearwaterpaintball.com",
    facebook: "https://www.facebook.com/p/Clearwater-Paintball-100063546221877",
    indoorOutdoor: "outdoor",
    about:
      "Paintball field that explicitly also offers airsoft, plus jellyball, per its own site's activity comparison page.",
    status: "active",
    dataSource: "official website + Yelp + Tripadvisor + Yellowpages + pbnation",
    lastScraped: "2026-09-11",
  },
  {
    id: "holy-cowz-airsoft",
    name: "Holy Cowz Airsoft",
    city: "New Port Richey, FL",
    address: "8620 De Cubellis Rd, New Port Richey, FL 34654",
    phone: "727-807-3390",
    indoorOutdoor: "outdoor",
    about: "Airsoft field with an attached 'Stampede Airsoft' retail store.",
    status: "active",
    dataSource: "Yelp (updated May 2026) + Tripadvisor + Foursquare + Nextdoor",
    lastScraped: "2026-09-11",
  },
  {
    id: "gator-paintball-airsoft-xtreme",
    name: "Gator Paintball & Airsoft Xtreme",
    city: "Hudson, FL",
    address: "11122 Houston Ave, Hudson, FL 34667",
    instagram: "https://www.instagram.com/gatorpaintballxtreme",
    indoorOutdoor: "outdoor",
    about: "Combined paintball/airsoft outdoor extreme sports park.",
    status: "active",
    dataSource: "Yelp (updated Sept 2026) + Tripadvisor + Nextdoor + Groupon + Instagram",
    lastScraped: "2026-09-11",
    notes:
      "A 'GPXTREME' listing found in the same city (Hudson, FL) appears to be a duplicate/alternate directory entry for this same property, not a second venue.",
  },
  {
    id: "dead-end-outfitters",
    name: "Dead End Outfitters (DEO Action Sports Center)",
    city: "North Fort Myers, FL",
    address: "13761 N Cleveland Ave, North Fort Myers, FL 33903",
    phone: "(941) 564-9530",
    website: "https://deoairsoft.com",
    facebook: "https://www.facebook.com/DeadEndOutfitter",
    instagram: "https://www.instagram.com/deadendoutfitters",
    indoorOutdoor: "indoor",
    about:
      "'Southwest Florida's Biggest Indoor Airsoft Arena' — 18,000 sq ft, two-level arena for up to 40 players, opened September 2025.",
    status: "active",
    dataSource: "local news (96krock.com, B1039 radio, Sept 2025) + Yelp + Yahoo Local + official site",
    lastScraped: "2026-09-11",
    notes: "Strongest-verified new field in this batch — newly opened, dated local news coverage.",
  },
  {
    id: "combat-zone-sports",
    name: "Combat Zone Sports",
    city: "Cocoa, FL",
    address: "2210 W King St, Cocoa, FL",
    website: "https://combatzonesports.com",
    facebook: "https://www.facebook.com/combatzonesports",
    indoorOutdoor: "indoor + outdoor",
    about:
      "Long-running Brevard County combined action-sports park (paintball/airsoft/skate/BMX) with both indoor and outdoor components; also referenced under 'Merritt Island' branding.",
    status: "active",
    dataSource: "Yelp (218 photos, updated Sept 2026) + ProvenExpert reviews + YouTube channel",
    lastScraped: "2026-09-11",
  },
  {
    id: "tallahassee-paintball-sports",
    name: "Tallahassee Paintball Sports",
    city: "Havana, FL",
    address: "210 Salem Rd, Havana, FL",
    phone: "850-354-2397",
    website: "https://tallahasseepaintballsports.com",
    facebook: "https://www.facebook.com/northfloridasbestpaintballfield",
    indoorOutdoor: "outdoor",
    about:
      "Paintball and airsoft field near Tallahassee with multiple caliber/gear options and group packages for 6-40 players.",
    status: "active",
    dataSource: "official site + Visit Tallahassee + Yelp + Fun4TallyKids",
    lastScraped: "2026-09-11",
  },
  {
    id: "battalion-airsoft-arena",
    name: "Battalion Airsoft Arena",
    city: "Jacksonville, FL",
    address: "2253 Dennis St, Jacksonville, FL",
    facebook: "https://www.facebook.com/BattalionAirsoftArena",
    indoorOutdoor: "indoor",
    about: "Jacksonville CQB airsoft arena.",
    status: "active",
    dataSource: "Yelp (23 photos, 37 reviews, updated July 2026) + Nextdoor + Visit Jacksonville tourism site + Chamber of Commerce",
    lastScraped: "2026-09-11",
  },
  {
    id: "904-tactical",
    name: "904 Tactical Outdoors",
    city: "Jacksonville, FL",
    address: "9160 Taylor Field Rd, Jacksonville, FL 32222",
    website: "https://904tactical.wixsite.com/offical904tactical",
    facebook: "https://www.facebook.com/100066826710279",
    indoorOutdoor: "outdoor",
    about:
      "Varied-terrain field with hills, bunkers, a compound, and a life-size helicopter prop.",
    status: "active",
    dataSource: "AirsoftC3 + Nextdoor + Facebook",
    lastScraped: "2026-09-11",
    notes:
      "Uncertain — the website is an old Wix subdomain and no 2023-2026 review/post activity was found. Include with caution; recommend verification.",
  },
  {
    id: "beaver-bayou-battleground",
    name: "Beaver Bayou Battleground",
    city: "Pensacola, FL",
    address: "2170 Longleaf Dr, Pensacola, FL 32505",
    instagram: "https://www.instagram.com/b3milsim",
    indoorOutdoor: "outdoor",
    about:
      "70+ acre field ('Beaver Bayou Battleground LLC') mixing woods, open 'desert' terrain, and cement barricades — described by its own operators as 'a field in progress.'",
    status: "active",
    dataSource: "AirsoftC3 + Instagram + YouTube (aerial overview video) + Gulf Coast Airsoft Community forum + business registries",
    lastScraped: "2026-09-11",
  },
  {
    id: "panhandle-paintball",
    name: "Panhandle Paintball",
    city: "Holt, FL",
    address: "4428 Cooper Lane, Holt, FL 32564",
    phone: "(850) 889-1035",
    website: "https://panhandlepaintball.com/airsoft",
    indoorOutdoor: "outdoor",
    admission: "$20 all-day entry plus $20 rental",
    about:
      "'The Largest Paintball and Airsoft Facility in Northwest Florida,' about 30 minutes from Pensacola. Airsoft games scheduled roughly 2 months out; night games in summer.",
    status: "active",
    dataSource: "official website",
    lastScraped: "2026-09-11",
    notes:
      "Partners with Leviathan Tactical (1014 Underwood Ave, Pensacola) for retail — a partner shop, not a second field.",
  },
  {
    id: "evolution-airsoft-field",
    name: "Evolution Airsoft Field",
    city: "Laurel Hill, FL",
    address: "8400 Robbins Rd, Laurel Hill, FL 32567",
    facebook: "https://www.facebook.com/EvolutionAirsoftField",
    instagram: "https://www.instagram.com/evolutionairsoftfield",
    indoorOutdoor: "outdoor",
    status: "active",
    dataSource: "AirsoftC3 + Facebook + Instagram + Trip.com + Chamber of Commerce + YouTube review video",
    lastScraped: "2026-09-11",
  },
  {
    id: "emerald-coast-airsoft",
    name: "Emerald Coast Airsoft",
    city: "Alford, FL",
    address: "Alford, FL 32420",
    facebook: "https://www.facebook.com/EmeraldCoastAirsoft",
    instagram: "https://www.instagram.com/emeraldcoastas",
    indoorOutdoor: "outdoor",
    status: "active",
    dataSource: "AirsoftC3 (last updated 08/30/2023) + Facebook + Instagram",
    lastScraped: "2026-09-11",
    notes:
      "Uncertain/possibly dormant — no confirmed activity found in 2024-2026 and AirsoftC3's own listing is stale (2023). No exact street address published; the Facebook page is geotagged 'Fountain, FL,' a neighboring community. Include with a clear verify-before-listing flag.",
  },
  {
    id: "pandemic-airsoft",
    name: "Pandemic Airsoft",
    city: "Bonifay, FL",
    address: "1061 Helms Rd, Bonifay, FL 32425",
    website: "https://pandemicairsoftfield.com",
    facebook: "https://www.facebook.com/pandemicairsoft",
    instagram: "https://www.instagram.com/pandemicairsoftofficial",
    indoorOutdoor: "outdoor",
    about: "Airsoft field registered as Pandemic Airsoft Field Inc.",
    status: "active",
    dataSource: "official site + Yelp (updated Sept 2025) + Sunbiz corporate registry + other operators' Facebook posts referencing its grand opening",
    lastScraped: "2026-09-11",
  },
  {
    id: "tropic-airsoft",
    name: "Tropic Airsoft",
    city: "Niceville, FL",
    address: "290 Yacht Club Dr, Niceville, FL 32578",
    indoorOutdoor: "outdoor",
    about:
      "Offers themed game nights (Vietnam, Wasteland, non-themed); Saturday games at 11:30am.",
    status: "active",
    dataSource: "AirsoftC3 only — could not independently corroborate via Facebook/Yelp/Instagram in this pass",
    lastScraped: "2026-09-11",
    notes:
      "Unconfirmed recent activity — single-source verification only. Include with caution; recommend a phone/social check before treating as fully bookable.",
  },
  {
    id: "op31-airsoft",
    name: "OP31 Airsoft",
    city: "Punta Gorda, FL",
    address: "42630 Neal Rd, Punta Gorda, FL 33982",
    phone: "(731) 326-0852",
    website: "https://operation31airsoft.wixsite.com/op31",
    instagram: "https://www.instagram.com/op31airsoft",
    indoorOutdoor: "outdoor",
    about:
      "Airsoft wargame/training facility operating since 2008 per its own listing; also offers firearms-training applications.",
    status: "active",
    dataSource: "AirsoftC3 + Instagram + Facebook (video posted by southern.airsoft.media showing the field) + Sunbiz (OP31, LLC)",
    lastScraped: "2026-09-11",
    notes:
      "Phone number's area code (731) is Tennessee-based, likely an owner's personal/business cell rather than an error — not unusual for small operators, but worth double-checking during onboarding.",
  },
  {
    id: "ge-airsoft",
    name: "GE Airsoft",
    city: "Lawrenceville, GA",
    address: "5900 Sugarloaf Pkwy, Lawrenceville, GA 30043",
    website: "https://geairsoft.com",
    facebook: "https://www.facebook.com/geairsoftofficial",
    indoorOutdoor: "indoor",
    about:
      "Metro Atlanta's most prominent indoor airsoft field and pro shop, located inside the Sugarloaf Mills mall.",
    status: "active",
    dataSource: "own site + Yelp (updated July 2026, 19 reviews) + Facebook + Instagram + BBB",
    lastScraped: "2026-09-11",
    notes:
      "Rebrand: formerly 'Goldeagle Airsoft Battlefield' — same address (5900 Sugarloaf Pkwy) confirms this is one field under a new name, not two. No phone number found published; contact runs through the site.",
  },
  {
    id: "power-ops-airsoft-conyers",
    name: "Power Ops Airsoft",
    city: "Conyers, GA",
    address: "2051 GA-138, Conyers, GA",
    website: "https://poweropsairsoft.com",
    facebook: "https://www.facebook.com/poweropsairsoft",
    instagram: "https://www.instagram.com/powerops",
    indoorOutdoor: "outdoor",
    about:
      "Outdoor CQB-style airsoft field near Conyers, the original of two locations run by the same Atlanta-area operator.",
    status: "active",
    dataSource: "own site + Yelp (updated April 2026, 37 reviews) + Facebook + Instagram",
    lastScraped: "2026-09-11",
    notes:
      "Same operator also runs a second, larger field near Madison, GA (seeded separately as 'power-ops-airsoft-madison') — treated as two bookable locations of one business, similar to Simple Airsoft's two Florida locations. No phone number found published.",
  },
  {
    id: "power-ops-airsoft-madison",
    name: "Power Ops Airsoft - Madison",
    city: "Madison, GA",
    address: "2641 Hester Town Rd, Madison, GA 30650",
    website: "https://poweropsairsoft.com",
    facebook: "https://www.facebook.com/poweropsairsoft",
    instagram: "https://www.instagram.com/powerops",
    indoorOutdoor: "outdoor",
    admission: "Sat 11am-6pm, Sun 1pm-6pm (weather permitting)",
    about:
      "Larger MILSIM-style outdoor field (2-story structures, vehicles) opened around 2022, the second of two locations run by Power Ops Airsoft.",
    status: "active",
    dataSource: "own site + Facebook + Instagram",
    lastScraped: "2026-09-11",
    notes:
      "A Yelp listing for 'Wildfire Paintball' shows the same 2641 Hester Town Rd address — could not resolve whether that's shared land, a data-merge error, or a defunct secondary brand; excluded Wildfire as a separate entry pending direct verification. No phone number found published.",
  },
  {
    id: "fort-13-airsoft",
    name: "Fort 13 Airsoft & Training Center",
    city: "Alto, GA",
    address: "475 Wilbanks Rd, Alto, GA 30510",
    phone: "(706) 778-0022",
    website: "https://fort13.com",
    facebook: "https://www.facebook.com/Fortthirteen",
    instagram: "https://www.instagram.com/fort13airsoft",
    indoorOutdoor: "outdoor",
    admission: "Sat 10am-7pm, Sun 12pm-7pm",
    about:
      "Veteran-owned MILSIM-focused outdoor field near Cornelia in northeast Georgia — 9 acres with roughly 30 mock-city buildings and night-play capability.",
    status: "active",
    dataSource: "own site + Facebook + Instagram + Snapchat",
    lastScraped: "2026-09-11",
    notes:
      "Some directories reference this location as 'Mount Airy, GA' — same property, Alto and Mount Airy are neighboring small communities.",
  },
  {
    id: "georgia-airsoft",
    name: "Georgia Airsoft Inc.",
    city: "Winterville, GA",
    address: "305 Lakeview Dr, Winterville, GA 30683",
    website: "https://georgiaairsoft.com",
    indoorOutdoor: "outdoor",
    admission:
      "Field fee only $15; AEG rental package $60 (rifle, goggles, vest, cap, magazine, 1000 BBs); group/military/LE discounts",
    about:
      "Georgia's longest-running airsoft operation (since 1999) — an outdoor field and retail store about 10 minutes from downtown Athens/UGA, open Saturdays.",
    status: "active",
    dataSource: "own site + AirsoftC3",
    lastScraped: "2026-09-11",
    notes: "No phone number published; contact via info@georgiaairsoft.com.",
  },
  {
    id: "ss-airsoft",
    name: "SS Airsoft",
    city: "Flowery Branch, GA",
    address: "3584 Atlanta Hwy, Flowery Branch, GA 30542",
    phone: "(678) 714-6001",
    website: "https://ssairsoft.com",
    indoorOutdoor: "indoor",
    admission: "Wed-Thu 12-6pm, Fri 12-7pm, Sat 11am-4pm; closed Mon/Tue/Sun",
    about:
      "Combined retail store and indoor CQB arena serving Gwinnett/Hall County.",
    status: "active",
    dataSource: "own site (store.ssairsoft.com) + directories",
    lastScraped: "2026-09-11",
    notes:
      "Directories are split between this Flowery Branch address and an older 'Sugar Hill, GA' address (4729 Nelson Brogdon Blvd), about 10 miles apart — used the current address per the business's own site. Worth confirming directly before onboarding.",
  },
  {
    id: "airsoft-atlanta",
    name: "Airsoft Atlanta",
    city: "Atlanta, GA",
    phone: "(470) 605-6186",
    website: "https://airsoftatlanta.com",
    facebook: "https://www.facebook.com/airsoftatlanta",
    instagram: "https://www.instagram.com/airsoftatl",
    youtube: "https://www.youtube.com/@Airsoftatlantatv",
    indoorOutdoor: "indoor",
    admission: "$15-$65 depending on rental/duration; Fri 4-8pm, Sat 12-6pm, Sun 12-5pm",
    about:
      "Large airsoft retailer with an attached indoor arena serving the Atlanta metro area.",
    status: "active",
    dataSource: "Yelp (updated September 2026) + Facebook + Instagram + YouTube",
    lastScraped: "2026-09-11",
    notes:
      "Address intentionally omitted — directories show conflicting addresses (a Church St, Atlanta listing and a Peachtree Rd, Doraville listing, roughly 10 miles apart), and the business's own site does not publish one. Recommend confirming the current address by phone before this field is treated as fully bookable.",
  },
  {
    id: "elite-ops-airsoft",
    name: "Elite Ops Airsoft",
    city: "Ball Ground, GA",
    address: "1374 Airport Dr, Ball Ground, GA 30107",
    phone: "(470) 863-5736",
    website: "https://myeliteops.com",
    facebook: "https://www.facebook.com/EliteOpsAirsoftGA",
    instagram: "https://www.instagram.com/eliteopsairsoftfield",
    indoorOutdoor: "indoor",
    about:
      "Indoor airsoft arena in a 20,000+ sq ft insulated warehouse, serving the Canton/Cherokee County area.",
    status: "active",
    dataSource: "Yelp (updated July 2026, 15 reviews) + Facebook + Instagram + X",
    lastScraped: "2026-09-11",
    notes:
      "Relocated from an older Canton, GA address (857 Hickory Flat Hwy) to this Ball Ground address — same business, not two fields. A similarly generic 'Elite Ops' style name could exist elsewhere; no exact-name match found in our other seeded states as of this batch.",
  },
  {
    id: "allstar-airsoft",
    name: "AllStar Airsoft LLC",
    city: "Covington, GA",
    address: "4191 West St NW, Covington, GA 30014",
    phone: "(678) 658-6861",
    website: "https://allstarairsoft.com",
    instagram: "https://www.instagram.com/allstarairsoft",
    indoorOutdoor: "outdoor",
    about: "Outdoor paintball/airsoft park in Newton County.",
    status: "active",
    dataSource: "own site + X (@AllStarAirSoft) + Instagram + local Facebook group activity",
    lastScraped: "2026-09-11",
  },
  {
    id: "arkenstone-paintball-airsoft",
    name: "Arkenstone Paintball & Airsoft",
    city: "Acworth, GA",
    address: "3198 Cedarcrest Rd, Acworth, GA 30101",
    phone: "(770) 974-2535",
    website: "https://georgiapaintball.com",
    instagram: "https://www.instagram.com/arkenstone_paintball_airsoft",
    indoorOutdoor: "outdoor",
    admission: "Open Sat-Sun",
    about:
      "Outdoor paintball park that also runs airsoft games under the 'Georgia Airsoft at Arkenstone' branding.",
    status: "active",
    dataSource: "Yelp (updated May 2026) + own site + Instagram",
    lastScraped: "2026-09-11",
    notes:
      "A second location under the same brand, 'Arkenstone 2' in Dallas, GA, is confirmed CLOSED per Yelp — not a duplicate of this still-open Acworth field. 'Georgia Paintball Store' in Kennesaw is the retail arm only, with no play field on site — not seeded as a separate venue.",
  },
  {
    id: "hoppers-paintball-airsoft",
    name: "Hopper's Paintball & Airsoft",
    city: "Savannah, GA",
    address: "1579 Grove Point Rd, Savannah, GA",
    phone: "(912) 572-7565",
    website: "https://hoppersga.com",
    facebook: "https://www.facebook.com/hoppers2012",
    youtube: "https://www.youtube.com/@HoppersPaintball",
    indoorOutdoor: "outdoor",
    admission: "Sat-Sun 9am-5pm; weekdays by reservation",
    about: "Long-running Savannah-area paintball facility with themed fields that also explicitly offers airsoft.",
    status: "active",
    dataSource: "Yelp + Roadtrippers + Facebook + YouTube",
    lastScraped: "2026-09-11",
    notes: "Address not published on the business's own site; used the Yelp/Roadtrippers-listed address.",
  },
  {
    id: "team-airsoft-georgetown",
    name: "Team Airsoft",
    city: "Dawsonville, GA",
    address: "33 Old Towne Rd, Dawsonville, GA 30534",
    website: "https://teamairsoft.com",
    facebook: "https://www.facebook.com/TeamAirsoftGeorgeTown",
    instagram: "https://www.instagram.com/teamairsoft_georgetown",
    indoorOutdoor: "outdoor",
    admission: "$20 day pass, cash only",
    about:
      "One of Georgia's oldest airsoft fields, open since April 2001 — 30+ acres with weekly games and regional events.",
    status: "active",
    dataSource: "own site + Facebook + Instagram",
    lastScraped: "2026-09-11",
    notes:
      "Despite the generic name 'Team Airsoft,' this is confirmed to be a physical bookable venue (the 'Georgetown' field), not a competitive team — used a more specific id to avoid confusion. No phone number found published.",
  },
  {
    id: "big-indian-paintball-airsoft",
    name: "Big Indian Paintball & Airsoft",
    city: "Perry, GA",
    address: "301 Valley Drive, Perry, GA 31008",
    phone: "(478) 224-2441",
    website: "https://bigindianpaintball.com",
    indoorOutdoor: "outdoor",
    about:
      "Paintball/airsoft venue just south of Macon with a dedicated airsoft schedule and MILSIM ruleset page — the best-verified field serving the middle-Georgia region.",
    status: "active",
    dataSource: "own site",
    lastScraped: "2026-09-11",
    notes:
      "A vague 'Middle Georgia Airsoft' listing (Toomsboro, GA) turned up in some directories but could not be independently verified as a real, separate business — likely a directory artifact; this field is the real, verifiable venue for that region.",
  },
  {
    id: "the-combat-zone",
    name: "The Combat Zone",
    city: "Bloomingdale, GA",
    address: "108 Godley Rd, Bloomingdale, GA 31302",
    facebook: "https://www.facebook.com/thecombatzonesavannah",
    indoorOutdoor: "outdoor",
    about:
      "Savannah-metro paintball-and-airsoft venue with 5 outdoor fields, hosting named MILSIM events.",
    status: "active",
    dataSource: "HopUpAirsoft event calendar ('Homefront 2024' and 'Homefront 2025' hosted here) + Groupon (4.7 stars, 15 reviews) + Facebook + LinkedIn",
    lastScraped: "2026-09-11",
    notes:
      "Stale-directory trap: Yelp shows a 'CLOSED' tag, but independent airsoft-event-calendar corroboration (two named MILSIM events hosted here in 2024 and 2025) plus an active Groupon listing indicate it is still operating — included as active despite the Yelp tag. No phone number found published. Not to be confused with the unrelated 'Combat Zone Sports' already seeded in Florida, or with an unrelated California business called 'Gamepod Combat Zone.'",
  },
  {
    id: "fort-benning-airsoft-field",
    name: "Fort Benning Airsoft Field",
    city: "Fort Benning (Fort Moore), GA",
    address: "Dubinsky St, Fort Benning, GA 31905",
    facebook: "https://www.facebook.com/fortbenningairsoft",
    indoorOutdoor: "outdoor",
    admission: "Free to play; Fri 5-9pm, Sat-Sun 8am-9pm",
    about:
      "Community-run outdoor airsoft field on/near the Fort Benning (Fort Moore) Army installation, stated to be open to military and non-military players.",
    status: "active",
    dataSource: "Facebook + informal Wix site",
    lastScraped: "2026-09-11",
    notes:
      "Include with caution: this field is on an active-duty Army installation. Even though it advertises civilian access, actually getting on post typically requires an escort/sponsor or a visitor-center background check — this may not be realistically bookable the way the app expects. Recommend confirming base-access logistics directly before treating as a normal listing. This is the only currently-evidenced option for the Columbus, GA region — a separate 'Airsoft Columbus' business appears defunct (only stale references found).",
  },
  {
    id: "insane-paintball-airsoft-arena",
    name: "Insane Paintball + Airsoft Arena",
    city: "Rossville, GA",
    address: "1833 McFarland Ave, Rossville, GA 30741",
    phone: "(423) 624-2121",
    website: "https://playinsane.com",
    facebook: "https://www.facebook.com/insanepaintball",
    instagram: "https://www.instagram.com/playinsane_com",
    youtube: "https://www.youtube.com/@playinsane",
    indoorOutdoor: "outdoor",
    about:
      "Long-running (since 2000) 24-acre paintball/airsoft/gel-ball facility just across the state line from Chattanooga, TN, in far northwest Georgia.",
    status: "active",
    dataSource: "own site + Facebook + Instagram + YouTube",
    lastScraped: "2026-09-11",
  },
  {
    id: "dforce1-airsoft",
    name: "Dforce1airsoft",
    city: "Norman Park, GA",
    address: "Son Norman Rd, Norman Park, GA 31771",
    indoorOutdoor: "outdoor",
    about:
      "Self-described 156-acre MILSIM field near Tifton in south-central Georgia, with games reportedly held about every two weeks.",
    status: "active",
    dataSource: "AirsoftC3",
    lastScraped: "2026-09-11",
    notes:
      "Low confidence — include with caution. AirsoftC3's listing was last updated 08/30/2023, and no 2024-2026 social media activity, reviews, or event listings could be found; its domain may be inactive. No phone number found published; contact via email (robert@dforce1airsoft.com per AirsoftC3). Recommend a direct check before relying on this as fully current.",
  },
  {
    id: "spartan-airsoft",
    name: "Spartan Airsoft",
    city: "Valdosta, GA",
    address: "418 Dale Dr, Valdosta, GA 31601",
    phone: "(229) 242-4274",
    indoorOutdoor: "indoor",
    admission: "Day pass $35, weekend pass $55 at launch (may be outdated)",
    about:
      "Indoor 'Call of Duty'-style urban airsoft arena in Valdosta, founded 2015 per local newspaper coverage.",
    status: "active",
    dataSource: "Valdosta Daily Times coverage (2015 launch) + Instagram (@thisisspartanairsoft)",
    lastScraped: "2026-09-11",
    notes:
      "Low confidence — include with caution. No Yelp, Tripadvisor, or Yellow Pages listing found, and no confirmed social-media activity more recent than the original 2015 launch coverage — this is the only lead found for the Valdosta area. Recommend a direct call to the listed phone number before relying on this as fully current.",
  },
  {
    id: "southern-tactical-airsoft-games",
    name: "Southern Tactical Airsoft Games",
    city: "Theodore, AL",
    address: "4901 Montee Road, Theodore, AL 36582",
    phone: "(251) 257-8616",
    website: "https://southerntacticalairsoftgames.com",
    facebook: "https://www.facebook.com/SouthernTacticalAirsoft",
    indoorOutdoor: "outdoor",
    admission: "Sundays, 9am-5pm",
    about:
      "Self-described largest airsoft facility in the Gulf Coast area, part of a multi-activity complex near Mobile also offering paintball and laser tag.",
    status: "active",
    dataSource: "own site + AirsoftC3 + chamberofcommerce.com + Alignable + Facebook + YouTube",
    lastScraped: "2026-09-11",
    notes:
      "Operates on the same property as 'Southern Alabama Paintball' and 'Battle City Laser Tag' — same business/operator, one physical venue under multiple activity-specific brand names; not seeded as a separate listing.",
  },
  {
    id: "ohatchee-airsoft-field",
    name: "Ohatchee Airsoft Field",
    city: "Ohatchee, AL",
    address: "4044 Gilberts Ferry Rd, Ohatchee, AL 36270",
    phone: "(256) 490-5110",
    website: "https://www.ohatcheeairsoft.com",
    facebook: "https://www.facebook.com/Ohatchee-airsoft-field-103810721293969",
    indoorOutdoor: "outdoor",
    admission: "Sat-Sun 10am-5pm; cash or PayPal only, no card processing; group reservations for 10+",
    about:
      "Outdoor wooded airsoft field in northeast Alabama (Gadsden/Calhoun County area), recently expanded by 4 acres.",
    status: "active",
    dataSource: "own site + Yelp (updated March 2026) + YellowPages + AirsoftC3 + Facebook + Yahoo Local + Battleonix",
    lastScraped: "2026-09-11",
    notes:
      "Street-number discrepancy across sources: own site says 4044 Gilberts Ferry Rd, while Yelp and the original grand-opening Facebook post say 4070 — zip also varies 36270/36271. Used the own-site address; recommend confirming directly.",
  },
  {
    id: "ridgeline-airsoft",
    name: "Ridgeline Airsoft",
    city: "Springville, AL",
    address: "8745 Pine Mountain Rd, Springville, AL 35146",
    phone: "(205) 467-7433",
    website: "https://www.ridgelineairsoft.com",
    facebook: "https://www.facebook.com/RidgelineAL",
    indoorOutdoor: "outdoor",
    admission: "Sat 9am-5pm only (closed all other days); full day $20 field-only, half day (after 2pm) $15, rentals extra",
    about:
      "Outdoor field with two themed areas ('Jungle Fever' and a 'Junkyard' with derelict vehicles) plus a lake/BBQ area, serving the Birmingham/Trussville/Gadsden corridor.",
    status: "active",
    dataSource: "own site + Facebook + Battleonix + Roadtrippers + AirsoftSociety forum",
    lastScraped: "2026-09-11",
    notes:
      "Also listed on GunRanges.org, which could cause confusion with a firearms range — confirmed via the operator's own site and airsoft-specific sources that this is a genuine airsoft field, not a gun range. Full seal goggles mandatory.",
  },
  {
    id: "mt-doom-paintball-airsoft",
    name: "Mt. Doom Paintball & Airsoft",
    city: "Hanceville, AL",
    address: "3071 Co Rd 515, Hanceville, AL 35077",
    phone: "(256) 339-1601",
    website: "https://wixmtdoom66.wixsite.com/mtdoom",
    facebook: "https://www.facebook.com/MtDoomPaintballField",
    indoorOutdoor: "outdoor",
    admission: "Sat-Sun 10am-6pm",
    about:
      "One of the longer-running airsoft/paintball fields in the Southeast (history dating to around 2010), with dozens of distinct playing areas in Cullman County between Birmingham and Huntsville.",
    status: "active",
    dataSource: "own site + Yelp (updated March 2026) + AirsoftC3 + Trip.com + Roadtrippers + D&B business directory",
    lastScraped: "2026-09-11",
    notes:
      "Runs under two Facebook pages (paintball- and airsoft-branded) for one physical venue — treated as a single listing, not two. Genuinely dual-sport, not a paintball-only mislabel.",
  },
  {
    id: "doomsday-paintball-airsoft-park",
    name: "Doomsday Paintball and Airsoft Park",
    city: "Athens, AL",
    address: "24952 US-72, Athens, AL 35613",
    phone: "(256) 606-0141",
    website: "https://www.doomsdaypark.com",
    instagram: "https://www.instagram.com/doomsdayairsoft",
    indoorOutdoor: "outdoor",
    admission:
      "Field entry $28/block, both blocks $47; rental package $59.95 (gun, mask, 1000 BBs); tracer +$10; riot shield rental $19.95",
    about:
      "Multi-activity outdoor adventure park in Limestone County (serving Decatur/Shoals and Huntsville) offering airsoft scenario games, paintball, and glow-in-the-dark UV gel-blaster play, with an active online store and membership program.",
    status: "active",
    dataSource: "own site (last-updated 05/08/2025) + AirsoftC3 + YouTube gameplay video + local news (Rocket City Now)",
    lastScraped: "2026-09-11",
    notes:
      "Also runs a seasonal Halloween haunted-house attraction under the same brand — a separate offering, not to be confused with the year-round airsoft/paintball operation.",
  },
  {
    id: "the-drop-zone-airsoft-paintball",
    name: "The Drop Zone Airsoft and Paintball",
    city: "Opelika, AL",
    address: "6025 W Point Pkwy, Opelika, AL 36804",
    phone: "(334) 444-0112",
    website: "https://www.thedropzoneairsoftandpaintball.com",
    youtube: "https://www.youtube.com/@TheDropZoneAirsoft",
    indoorOutdoor: "outdoor",
    admission:
      "Sat 8:30am-3:30pm; airsoft $25-$50 (day pass to full rental); private airsoft parties $500 minimum for 10 people, +$50/additional",
    about:
      "Large 100-acre dual-sport outdoor complex serving the Auburn/Opelika area, with woods courses plus shipping-container structures and separate airsoft and paintball booking lines.",
    status: "active",
    dataSource: "own site + YellowPages + LocalGymsAndFitness directory",
    lastScraped: "2026-09-11",
    notes: "Strongest, most fully-documented listing found for the Auburn/Opelika region.",
  },
  {
    id: "apache-tactical-airsoft",
    name: "Apache Tactical Airsoft",
    city: "Madison, AL",
    address: "487 Capshaw Rd, Madison, AL 35757",
    phone: "(256) 886-0386",
    facebook: "https://www.facebook.com/ApacheTacticalAirsoft",
    indoorOutdoor: "outdoor",
    about:
      "Custom-built, fully insured 4-acre outdoor airsoft venue in the Huntsville area with an on-site pro shop, supporting CQB through larger-scale skirmishes.",
    status: "active",
    dataSource: "AirsoftC3 + YellowPages (Huntsville) + Facebook + Instagram + X + AirsoftSociety forum",
    lastScraped: "2026-09-11",
    notes:
      "Include with caution — moderate confidence. Facebook/Instagram content couldn't be directly checked for recent (2025-2026) activity, though no closure signal was found either. A separate 'Apache Airsoft Team/Squad' Instagram surfaced is a playing team, not this venue — not conflated. A nearby, unrelated Madison, AL business ('Last Resort Guns,' a real firearms range) is sometimes miscategorized by directories as an airsoft field — do not merge the two.",
  },
  {
    id: "dirt-planet-airsoft",
    name: "Dirt Planet Airsoft",
    city: "Foley, AL",
    address: "13390 Norris Lane, Foley, AL 36535",
    phone: "(251) 504-3785",
    website: "https://dirtplanetairsoft.godaddysites.com",
    facebook: "https://www.facebook.com/DirtPlanetAirsoft",
    instagram: "https://www.instagram.com/dirtplanetairsoft",
    indoorOutdoor: "outdoor",
    admission:
      "Sat 11am-6pm; all-day pass $20, all-day pass + rental $35; birthday party $250 (3 hrs, up to 15); full facility rental $900/day",
    about:
      "Recreational outdoor airsoft venue in Baldwin County (south of Mobile) on 10 acres of mixed terrain, with rentals, birthday-party packages, and a full-facility buyout option.",
    status: "active",
    dataSource: "own site + Facebook + Instagram",
    lastScraped: "2026-09-11",
    notes:
      "Low confidence — include with caution. Own site is live with a documented grand-opening history, but recent (2025-2026) social activity could not be independently confirmed. Recommend a live phone/booking check before onboarding.",
  },
  {
    id: "alabama-paintball-quest-airsoft",
    name: "Alabama Paintball Quest & Airsoft",
    city: "McCalla, AL",
    address: "8651 Serene Dr, McCalla, AL 35111",
    phone: "(205) 477-6067",
    website: "https://www.alabamapaintballquest.com/airsoft",
    facebook: "https://www.facebook.com/p/Alabama-Paintball-Quest-Airsoft-61560461703340",
    indoorOutdoor: "outdoor",
    admission: "Airsoft open play every other Sunday; rental about $10; private group bookings available 7 days/week",
    about:
      "Primarily a paintball park (part of the 3-location 'Alabama Paintball' network in the Birmingham metro) that recently added a formal biweekly airsoft open-play program.",
    status: "active",
    dataSource:
      "own site + alabamapaintball.com (parent network) + sportscarnival.com schedule page + PaintballFieldFinder.com + AllEvents.in",
    lastScraped: "2026-09-11",
    notes:
      "Airsoft is a newer, less-frequent offering layered onto a paintball-first business — flagged as lower-priority/lower-frequency than the dedicated airsoft fields in this batch. The network's other two locations (Central Alabama Paintball, Calera; Alabama Paintball 280, Chelsea) are paintball-only per all sources checked and are not seeded as airsoft venues.",
  },
  {
    id: "eagle-action-sportz-paintball-airsoft",
    name: "Eagle Action Sportz Paintball & Airsoft",
    city: "Hattiesburg, MS",
    address: "70 Ryner Road, Hattiesburg, MS 39402",
    phone: "(601) 447-2876",
    website: "https://www.eagleactionsportz.com",
    facebook: "https://www.facebook.com/eagleasportz",
    instagram: "https://www.instagram.com/eagleactionsportz",
    indoorOutdoor: "outdoor",
    admission:
      "Paintball rentals from $35; airsoft $20 (own gear) / $40 (booked rental) / $45 (walk-in rental); field passes $100-$300; age 10+",
    about:
      "Hattiesburg's long-running combination paintball/airsoft/Gellyball park and pro shop, with six distinct fields including a wild-west town and a tournament-grade field, hosting public play, private events, and birthday parties.",
    status: "active",
    dataSource:
      "own site + Yelp + TripAdvisor + Facebook + Instagram + Visit Hattiesburg (official CVB directory) + Visit Mississippi (state tourism site) + Nextdoor",
    lastScraped: "2026-09-11",
    notes:
      "TripAdvisor and some directories describe this as a paintball-only field — that's stale/incomplete copy; the operator's own current site is unambiguous that airsoft is a live, separately-priced offering today.",
  },
  {
    id: "action-pursuit-games-brandon",
    name: "Action Pursuit Games of Brandon",
    city: "Canton, MS",
    address: "928 Old Natchez Trace, Canton, MS 39046",
    phone: "(601) 825-1052",
    website: "https://www.apgob.com",
    facebook: "https://www.facebook.com/apgob",
    instagram: "https://www.instagram.com/apgob",
    indoorOutdoor: "outdoor",
    admission:
      "Paintball packages $45/$60/$75-80 (paintballs+air+gun+tax); separate scheduled airsoft days; private group bookings require a 20-player minimum",
    about:
      "Long-standing outdoor paintball/airsoft park near the Ross Barnett Reservoir in the Jackson metro area, offering public open play, private group bookings, night/glow games, and a pro shop.",
    status: "active",
    dataSource:
      "own site + Yelp (updated Feb 2026, two listings under Canton and Brandon at the same address) + Instagram + Airsoft Society forum + Mississippi Crappie Trail directory",
    lastScraped: "2026-09-11",
    notes:
      "Business name is legally 'Action Pursuit Games of Brandon LLC,' but the physical field is in Canton, MS — an apparent relocation-with-retained-name (or founder/operator association with Brandon) situation, not two separate venues. Best-documented Jackson-metro option found.",
  },
  {
    id: "blac-panther-airsoft",
    name: "Blac Panther Airsoft",
    city: "Union, MS",
    indoorOutdoor: "outdoor",
    about:
      "Small wooded close-range-combat field in Newton County reportedly running 7-hour games every Saturday of the month.",
    status: "active",
    dataSource: "AirsoftC3 (sole source)",
    lastScraped: "2026-09-11",
    notes:
      "Low confidence — include with caution. Single-source listing (AirsoftC3 only, contact by email only) with no Yelp, Facebook, Instagram, reviews, or press found anywhere. Recommend a phone/email verification pass before treating as bookable.",
  },
  {
    id: "camp-liberty-mccool",
    name: "Camp Liberty",
    city: "McCool, MS",
    indoorOutdoor: "outdoor",
    about:
      "Small milsim-oriented private field on a 10-acre parcel in Attala County, with man-made structures including a zip-line tower over a pond, trails, and a creek; by appointment only.",
    status: "active",
    dataSource: "AirsoftC3 (sole source)",
    lastScraped: "2026-09-11",
    notes:
      "Low confidence — include with caution. No independent web presence found beyond the AirsoftC3 listing (which is specific to McCool, MS coordinates, so appears genuine rather than a data-entry error). Two unrelated same-named 'Camp Liberty' venues exist elsewhere — a veteran/youth camp in Battleground, Alabama, and one in Brooklyn, Michigan — do not conflate with either. Recommend contacting the operator directly before onboarding.",
  },
  {
    id: "mississippi-airsoft-development-center",
    name: "Mississippi Airsoft Development Center",
    city: "Belden, MS",
    address: "3384 Longview Road, Belden, MS 38826",
    indoorOutdoor: "outdoor",
    about:
      "Field listing serving the Tupelo metro area (Lee County), with no description beyond a generic directory entry.",
    status: "active",
    dataSource: "AirsoftC3 (sole source)",
    lastScraped: "2026-09-11",
    notes:
      "Low confidence — include with caution. AirsoftC3's own 'last updated' stamp reads August 30, 2023, three years stale, with zero corroboration found anywhere else. This is the only lead found for the Tupelo metro area proper — a separate 'Tupelo Airsoft Club' Facebook group is a player community, not a venue, and was not seeded.",
  },
  {
    id: "odins-paradise-airsoft",
    name: "Odin's Paradise",
    city: "Norwalk, OH",
    address: "56 St. Marys Street, Norwalk, OH 44857",
    phone: "(567) 424-6280",
    website: "https://www.odinsparadise.com",
    facebook: "https://www.facebook.com/odinsparadise",
    instagram: "https://www.instagram.com/odins_paradise",
    indoorOutdoor: "indoor",
    admission:
      "Open play $25; speedsoft $20; AEG rental $25; HPA rental $40; $5 discount for military/first responders",
    about:
      "42,000-square-foot indoor airsoft facility (~35,000 sq ft of play space) in Norwalk, OH, supporting both long-range and close-quarters battle styles plus dedicated Saturday-night speedsoft events.",
    status: "active",
    dataSource: "own site + Yelp (listing updated May 2026) + Facebook + Instagram",
    lastScraped: "2026-09-12",
    notes:
      "Added directly per Michael's request. Airsoft-only — no paintball offering found. Hours per own site: Saturdays 9am-7pm (lunch break 1-2pm) plus 7-11pm for speedsoft events, Sundays 10am-5pm.",
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
  {
    id: "mk-airsoft-clarksburg",
    name: "MK Airsoft Clarksburg",
    city: "Clarksburg, WV",
    address: "624 Armory Rd, Clarksburg, WV 26301",
    phone: "(304) 566-7055",
    website: "https://mkairsoft.com",
    ownerEmailDomain: "mkairsoft.com",
    facebook: "https://www.facebook.com/p/MK-Airsoft-Clarksburg-61568826869416/",
    instagram: "https://www.instagram.com/mkairsoftclarksburg/",
    indoorOutdoor: "indoor",
    admission:
      "Memberships start at $99/month chain-wide; single-visit tickets are sold online via mkairsoft.com with per-visit pricing not itemized on the public site",
    about:
      "72,000-sq-ft indoor airsoft arena built into a former National Guard armory just off US-19, opened February 1, 2025 as MKAirsoft's first out-of-state location alongside its two Ohio arenas (Brunswick/Medina and Middletown). Local news (WBOY, WDTV) billed it as the second-largest airsoft facility in the US at opening.",
    status: "active",
    dataSource: "website (mkairsoft.com) + Facebook + Instagram + local news (WBOY, WDTV, Connect-Bridgeport)",
    lastScraped: "2026-09-11",
    notes:
      "Hours: Tue-Fri 5pm-10pm, Sat-Sun 10am-6pm per the chain site (may shift seasonally). Runs under the same MKAirsoft brand/YouTube/Discord as the Ohio locations.",
  },
  {
    id: "tri-state-airsoft-club",
    name: "Tri-State Airsoft Club",
    city: "Martinsburg, WV",
    address: "2259 Butlers Chapel Rd, Martinsburg, WV 25403",
    phone: "(304) 240-7581",
    website: "https://www.tristateasc.com",
    indoorOutdoor: "outdoor",
    about:
      "Outdoor airsoft club in the Eastern Panhandle billing itself as a family-friendly, affordable recreational alternative to paintball. Has a multi-year presence on AirsoftC3, an Airsoft Society forum thread, and a couple of YouTube videos from the field.",
    status: "active",
    dataSource:
      "AirsoftC3 + Airsoft Society forum thread + YouTube videos — the club's own site (tristateasc.com) exists but could not be independently fetched/verified (robots.txt error)",
    lastScraped: "2026-09-11",
    notes:
      "AirsoftC3's listing was last updated in 2023 and no more recent independent confirmation of hours/pricing was found — the weakest-verified of the two WV entries; worth confirming directly before treating hours/pricing as current. Contact email on file is a personal gmail (tristateasc@gmail.com), not a domain-matched address, so no ownerEmailDomain is set.",
  },
  {
    id: "ballahack-airsoft",
    name: "Ballahack Airsoft",
    city: "Chesapeake, VA",
    address: "2900 Ballahack Rd, Chesapeake, VA 23322",
    phone: "(757) 685-3356",
    website: "https://ballahackairsoft.com",
    ownerEmailDomain: "ballahackairsoft.com",
    facebook: "https://facebook.com/ballahackairsoft",
    instagram: "https://instagram.com/ballahackairsoft",
    youtube: "https://www.youtube.com/@ballahackairsoft",
    indoorOutdoor: "outdoor",
    admission: "$35 all-day weekend play (Sat/Sun); rentals available",
    about:
      "Billed as Virginia's largest airsoft field and one of the largest on the East Coast — a 99-acre site combining wooded areas, micro-terrain, swamps, and urban MOUT that hosts events of over 1,200 players. Includes an on-site pro shop.",
    status: "active",
    dataSource: "website + Facebook + Instagram + YouTube",
    lastScraped: "2026-09-11",
    notes: "Hours: closed Mon-Thu, Fri 11am-7pm, Sat-Sun 9am-5pm.",
  },
  {
    id: "north-40-airsoft",
    name: "North 40 Airsoft, LLC",
    city: "Norton, VA",
    address: "4418 Flanary Cove Road, Norton, VA",
    phone: "276-326-2640",
    website: "https://north40airsoft.com",
    indoorOutdoor: "outdoor",
    admission:
      "$15 walk-on entry; $25 rental (M4 + 1 hi-cap magazine + 1,000 BBs); private group rental $300 (1-4 hrs) or $550 (4-8 hrs) covering 5 rental sets + 5,000 BBs, additional sets $15 each up to 12 total",
    about:
      "Outdoor airsoft field (established 2012) in far Southwest Virginia's coalfield region, featuring buildings, bunkers, and a trench system across 10 acres, plus a downtown Norton pro shop. Currently mid-renovation (drainage, structures, playable areas) through 2026.",
    status: "active",
    dataSource: "website + Facebook + Yelp/Tripadvisor + Visit Southwest Virginia tourism listing",
    lastScraped: "2026-09-11",
    notes: "Contact is a personal gmail (north40airsoft@gmail.com), not a domain-matched address, so no ownerEmailDomain is set. Hours not published; check Facebook for open-play dates.",
  },
  {
    id: "new-kent-paintball-airsoft",
    name: "New Kent Paint Ball/Airsoft Games",
    city: "Lanexa, VA",
    address: "14375 Marine Corps Dr, Lanexa, VA 23089",
    phone: "(804) 966-5104",
    website: "https://newkentpaintballgames.com",
    ownerEmailDomain: "newkentpaintballgames.com",
    indoorOutdoor: "outdoor",
    admission: "Airsoft walk-on games: $25/person; paintball private groups require 25+ players and a $300 non-refundable deposit; rentals available",
    about:
      "Outdoor paintball and airsoft park between Richmond and Williamsburg, with 3 wooded fields featuring 7 bases, bunkers, and towers. Runs public airsoft walk-on games on the 2nd, 3rd, and 4th Saturdays of the month, plus private airsoft bookings by reservation.",
    status: "active",
    dataSource: "website",
    lastScraped: "2026-09-11",
    notes: "Standard walk-on hours 9am-5pm; times vary by season. Players must bring their own airsoft gear for the public walk-on games.",
  },
  {
    id: "augusta-airsoft",
    name: "Augusta Airsoft LLC",
    city: "Stuarts Draft, VA",
    address: "152 Johnson Avenue, Stuarts Draft, VA",
    phone: "540-470-8713",
    website: "https://augustaairsoft.com",
    ownerEmailDomain: "augustaairsoft.com",
    facebook: "https://www.facebook.com/AugustaAirsoftSV",
    instagram: "https://www.instagram.com/augustaairsoftllc/",
    indoorOutdoor: "outdoor",
    about:
      "Family-run (a father and three sons) public outdoor airsoft field in the Shenandoah Valley, welcoming players of all skill levels and operating year-round regardless of weather. Emphasizes community building, safety, and inclusive play.",
    status: "active",
    dataSource: "website + Facebook + Instagram",
    lastScraped: "2026-09-11",
    notes: "Hours: Sat-Sun, 12:30pm staging / 1-5pm play. No pricing published on the site.",
  },
  {
    id: "swamp-fun-park",
    name: "The Swamp Fun Park",
    city: "Hayes, VA",
    address: "2735 George Washington Memorial Highway, Hayes, VA 23072",
    phone: "(804) 642-8778",
    website: "https://theswampfunpark.com",
    indoorOutdoor: "outdoor",
    admission:
      "No airsoft-specific pricing published; paintball rental tiers run $50-$75/person with add-on rentals (masks, tanks, gear) at $5 each — airsoft pricing is under its own \"Airsoft 101 & Pricing\" page but wasn't itemized in what could be fetched",
    about:
      "Family fun park in Gloucester County offering paintball, airsoft, gellyball, and Nerf wars with rental equipment and organized events, including a dedicated \"Airsoft Alley\" venue and \"Airsoft 101\" programming.",
    status: "active",
    dataSource: "website + Facebook + Instagram + YouTube + Yelp",
    lastScraped: "2026-09-11",
    notes: "AirsoftC3 lists the city as Gloucester Point, but the business's own site, Yelp, and Yellow Pages listings all use Hayes, VA — same general Gloucester County area, flagging the discrepancy rather than guessing which is more precise.",
  },
  {
    id: "roanoke-airsoft-battlefield",
    name: "Roanoke Airsoft & Battlefield",
    city: "Moneta, VA",
    address: "4715 Rucker Road, Moneta, VA 24121",
    website: "https://www.roanokeairsoft.com",
    ownerEmailDomain: "roanokeairsoft.com",
    instagram: "https://www.instagram.com/roanoke_airsoft/",
    indoorOutdoor: "outdoor",
    admission:
      "Battlefield access: $25 Saturday (10am-5pm), $20 Sunday (1pm-5pm); basic rental $30 (rifle, mask, 1000 BBs); specialty rifle rentals (LMG/HPA/upgrade) $40-$60",
    about:
      "Outdoor airsoft field near Smith Mountain Lake serving the Roanoke area, with an attached retail shop selling gear and accessories. Runs regular open-play weekends plus themed events (e.g. a \"Santa vs. Grinch\" holiday battle).",
    status: "active",
    dataSource: "website + Facebook + Instagram + Discord + AllEvents",
    lastScraped: "2026-09-11",
    notes: "Listed on AirsoftC3 under an older name, \"RATAC Battlefield\" — same field/organization at the same address; current branding is \"Roanoke Airsoft & Battlefield.\" Retail shop hours: Sat 10am-5pm, Sun 1pm-5pm.",
  },
  {
    id: "pevs-paintball-airsoft",
    name: "Pev's Paintball & Airsoft Park",
    city: "Aldie, VA",
    address: "39835 New Rd, Aldie, VA 20105",
    phone: "703-327-7640",
    website: "https://www.pevs.com",
    ownerEmailDomain: "pevs.com",
    facebook: "https://www.facebook.com/Pevs.Paintball/",
    instagram: "https://www.instagram.com/pevspaintball/",
    twitter: "https://twitter.com/pevspaintball",
    indoorOutdoor: "indoor + outdoor",
    about:
      "Large, long-running paintball park in Loudoun County (40+ acres, 14 playing fields/10 courses) that also runs dedicated \"Airsoft Mission Games\" for ages 13+, alongside an indoor party room and covered picnic areas.",
    status: "active",
    dataSource: "website + Facebook + Instagram + Tripadvisor + Yelp",
    lastScraped: "2026-09-11",
    notes: "Hours (spring through June 30): Sat-Sun check-in 9:30am-3pm, park open 10am-5pm; weekdays reservation-only. No airsoft-specific pricing found published.",
  },
  {
    id: "cz-airsoft",
    name: "CZ Airsoft",
    city: "Rhoadesville, VA",
    address: "30067 Constitution Hwy, Rhoadesville, VA 22542",
    phone: "(540) 842-8054",
    website: "https://czairsoft.com",
    facebook: "https://www.facebook.com/groups/czministries/",
    twitter: "https://twitter.com/czairsoft",
    instagram: "https://www.instagram.com/the_real_czairsoft/",
    youtube: "https://www.youtube.com/@czairsoft4820",
    indoorOutdoor: "outdoor",
    about:
      "Family-friendly, MilSim-focused outdoor airsoft field in Orange County (\"Reaching communities to bring Principles, Discipline, Teamwork and Camaraderie\"). Runs game days/nights, night operations, memberships, and private event bookings.",
    status: "active",
    dataSource: "website (czairsoft.com + a parallel czairsoft.wixsite.com site) + Facebook group + Twitter + Instagram + YouTube + Yelp",
    lastScraped: "2026-09-11",
    notes:
      "AirsoftC3 lists the city as Fredericksburg, but the field's actual town is Rhoadesville, VA (~25 miles southwest, in Orange County) — corrected here. Contact email on file is a personal comcast.net address, not domain-matched, so no ownerEmailDomain is set. Hours: Sat 8:30am-3:30pm, Sun 12pm-4pm on scheduled dates — check its event calendar.",
  },
  {
    id: "falling-river-airsoft",
    name: "Falling River Airsoft",
    city: "Brookneal, VA",
    address: "12610 Red House Road, Brookneal, VA",
    facebook: "https://facebook.com/FallingRiverAirsoft",
    instagram: "https://instagram.com/FRairsoft",
    indoorOutdoor: "indoor + outdoor",
    about:
      "Airsoft field (founded 2018) combining an indoor CQB facility with 10 acres of outdoor woods, fields, and structures in rural south-central Virginia.",
    status: "facebook_only",
    dataSource: "AirsoftC3 + Facebook + Instagram — no dedicated website found beyond a bare, contentless Wix placeholder page",
    lastScraped: "2026-09-11",
    notes: "The field's own materials describe it as \"open for sporadic weekend engagements\" — check its Facebook events before visiting. No phone number or pricing published anywhere found.",
  },
  {
    id: "bethel-battlefield",
    name: "Bethel Battlefield",
    city: "Hampton, VA",
    address: "123 Saunders Road, Hampton, VA 23666",
    phone: "(757) 488-2501",
    website: "https://www.letsplaypaintball.com/bethel-paintball-park",
    indoorOutdoor: "outdoor",
    about:
      "Primarily a multi-format paintball park (Woodsball, Hyperball, and a MOUT site) inside Big Bethel Park, operated by the regional \"Let's Play Paintball\" chain — but it also runs scheduled Friday night airsoft game nights as a distinct offering.",
    status: "active",
    dataSource: "website (chain) + AirsoftC3 + AllEvents (Friday Night Airsoft Game listing) + Visit Hampton tourism listing",
    lastScraped: "2026-09-11",
    notes:
      "General admission hours: Sat-Sun 9:30am-4pm, weekdays by reservation only. Airsoft is a scheduled evening sub-offering here, not the park's primary daily activity — flagging so expectations are set correctly, same as Louisiana's Paintball Command entry.",
  },
  {
    id: "tactical-airsoft-arena-manassas",
    name: "Tactical Airsoft Arena (Manassas)",
    city: "Manassas, VA",
    address: "9508 Center St, Manassas, VA 20110",
    phone: "(703) 330-0333",
    website: "https://www.tacticalairsoftarena.com",
    facebook: "https://www.facebook.com/tacticalairsoftarena/",
    instagram: "https://www.instagram.com/tacticalairsoftarena/",
    indoorOutdoor: "indoor",
    admission:
      "Not separately published for Manassas; its sister Rockville, MD location charges $28 admission / $25 rental / $47 all-weekend pass, likely comparable",
    about:
      "7,800-sq-ft indoor airsoft arena with reconfigurable modular plywood walls, forming the second location (opened 2018) of a chain whose first arena opened in Rockville, MD in 2008. Combined, the two locations offer 10,000+ sq ft of playable space.",
    status: "active",
    dataSource: "website (shared chain site) + Facebook + Instagram + YouTube + Yelp/Tripadvisor (4.7 stars, 273 reviews) + industry press (RGK Airsoft)",
    lastScraped: "2026-09-11",
    notes: "Hours: Wed & Fri 6pm-11pm, Sat 2pm-10pm, Sun 11am-7pm. The shared website (tacticalairsoftarena.com) primarily surfaces the Rockville, MD address — Manassas-specific pricing wasn't independently found.",
  },
  {
    id: "valhalla-tactical-airsoft",
    name: "Valhalla Tactical",
    city: "Richmond, VA",
    address: "1727 Rhoadmiller St, Richmond, VA 23220",
    website: "https://valhallatacticalrva.com",
    instagram: "https://www.instagram.com/valhallatacticalrva/",
    indoorOutdoor: "indoor",
    about:
      "Indoor airsoft arena in Richmond's Scott's Addition/Shockoe Valley area — one of the few dedicated indoor airsoft venues in the region.",
    status: "active",
    dataSource:
      "AirsoftC3 + Instagram (@valhallatacticalrva) + Nextdoor + a commercial real-estate lease record (Valhalla Tactical Training LLC, 16,036 sq ft at this address) — the site itself (valhallatacticalrva.com) could not be fetched directly due to a persistent robots.txt/DNS error, despite many of its subpages (waiver, rules, schedule, FAQ, pricing) being independently indexed",
    lastScraped: "2026-09-11",
    notes:
      "Richmond's indoor-airsoft scene has a confusing history worth knowing before relying on this entry: the original Valhalla Tactical (owned by the late Anders Smith) closed after his death; his shop manager, Alicia Clift, reopened the community's field under a new name, River City Airsoft, in July 2023 at a different nearby address (711 Hospital St). That operation's own site/event calendar has been stale since April 2024, while current listings (AirsoftC3, Instagram, and this 2020s-era commercial lease) point back to the \"Valhalla Tactical\" name and brand at 1727 Rhoadmiller St — treating that as the current operating entity here, but a direct call/visit is worth doing before relying on hours or pricing. Note: a same-named \"River City Airsoft\" at 832 Moscow Rd, Hamlin, NY is a completely unrelated, same-name-different-state business that surfaced during this research — not Richmond's.",
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
