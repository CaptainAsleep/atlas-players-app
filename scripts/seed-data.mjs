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
    notes: "This field has closed; the property has reportedly been sold.",
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
    notes: "This field has closed. Its final event was held July 14, 2026.",
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
    notes: "This field closed in 2024.",
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
    notes: "This field is no longer active.",
    dataSource: "sheet",
  },
  {
    id: "tc-extreme-park",
    name: "TC Extreme Park",
    city: "Copemish, MI",
    address: "8257 N 1 Rd, Copemish, MI 49625",
    indoorOutdoor: "outdoor",
    status: "facebook_only",
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
    notes: "This field has relocated and now runs events out of Darkfire Airsoft's Hillsdale, MI location.",
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
  },

  {
    id: "sherwood-paintball",
    name: "Sherwood Paintball",
    city: "LaPorte, IN",
    address: "3497 North US Hwy 35, LaPorte, IN 46350",
    phone: "(219) 325-8060",
    website: "https://sherwoodpaintball.com",
    ownerEmailDomain: "sherwoodpaintball.com",
    facebook: "https://www.facebook.com/SherwoodPaintball",
    indoorOutdoor: "outdoor",
    admission:
      "All-day rental (marker, mask, field fee) $35; own equipment $25 (includes unlimited air for one tank); paintball case (2,000 rds) $45-75 depending on grade; kids birthday package $40.75/player (ages 10-16); private weekend parties $100 flat fee + per-player cost (10-player minimum, 3-hour sessions); weekday private parties $53.75/player plus $350 deposit and $100 private fee (10-player minimum).",
    about:
      "Family-run, 80+ acre outdoor paintball-and-airsoft field operating for over 36 years, built around a large castle-themed play area (marketed as \"the largest castle in the Midwest\") split into five named zones: City of Nottingham, Dreckmore/Dread Valley, Black Tower, Black Oak Keep/Battledale, and a dedicated Speedball/Airball field. Open Saturdays and Sundays 9am-4pm (weather permitting; site states play stops below 30°F).",
    status: "active",
    dataSource: "website (sherwoodpaintball.com: home, /prices) + Facebook + Yelp/Tripadvisor/BBB/Yahoo Local (legacy name)",
    lastScraped: "2026-09-13",
  },

  {
    id: "action-park-paintball",
    name: "Action Park Paintball",
    city: "Mishawaka, IN",
    address: "11951 Harrison Road, Mishawaka, IN 46544",
    phone: "(574) 674-4263",
    website: "https://actionparkpaintball.com",
    ownerEmailDomain: "actionparkpaintball.com",
    facebook: "https://www.facebook.com/actionparkpbl/",
    instagram: "https://www.instagram.com/actionparkpaintball/",
    indoorOutdoor: "outdoor",
    admission:
      "Airsoft: $20 all-day admission (own equipment) / $40 with rental (marker, air, mask, 3 clips, vest); Paintball: $15 field-fee-only (own equipment) / $40 standard rental package (mask, marker, 500 paintballs) / $50 upgraded package; group rate (10+ players) $35/player with 24-hr advance reservation; annual memberships $50-$250.",
    about:
      "Paintball-primary outdoor park operating 25+ years in the Michiana region (South Bend/Mishawaka), with themed game areas including a castle to storm or defend; also runs Airsoft as a separate, priced open-play admission option. Open Tuesday 4-8pm, Saturday 10am-5pm, Sunday 1-5pm; Monday/Wednesday/Thursday/Friday by appointment only.",
    status: "active",
    dataSource: "website (actionparkpaintball.com: home, /pricing, /hours) + Facebook + Instagram + WNIT/PBS Michiana feature",
    lastScraped: "2026-09-13",
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
  },
  {
    id: "semo-airsoft-blodgett-field-sikeston",
    name: "SEMO Airsoft -- Blodgett Field",
    city: "Sikeston, MO",
    address: "59 Cooper Lane, Sikeston, MO 63801",
    phone: "(573) 382-7761",
    website: "https://www.semoairsoft.com/airsoft-facilities",
    indoorOutdoor: "outdoor",
    about:
      "Primary 55-acre outdoor venue of SEMO Airsoft (SEMO Airsoft LLC), a Southeast Missouri airsoft club/operator running games across three area facilities. Blodgett Field features woods, open field, forts, buildings, and several bunkers, designed for scenario and mission-based gameplay.",
    status: "active",
    dataSource:
      "own website (semoairsoft.com/airsoft-facilities) + Boise Gun Club directory mirror (independently corroborates address/phone) + Facebook group posts referencing this specific location by name (e.g. a March game-day post) + SEMO Airsoft LLC business registration",
    lastScraped: "2026-09-17",
  },
  {
    id: "semo-airsoft-morley-high-school",
    name: "SEMO Airsoft -- Old Morley High School",
    city: "Morley, MO",
    address: "370 County Highway 430, Morley, MO 63767",
    phone: "(573) 382-7761",
    website: "https://www.semoairsoft.com/airsoft-facilities",
    indoorOutdoor: "indoor",
    about:
      "Indoor SEMO Airsoft venue inside a 1940s-era former school building (gymnasium, stage, long hallways, basement, and classrooms), suited to close-quarters breaching play; airsoft grenades permitted.",
    status: "active",
    dataSource:
      "own website (semoairsoft.com/airsoft-facilities) + Boise Gun Club directory mirror + Facebook group posts referencing night games at Morley High School specifically",
    lastScraped: "2026-09-17",
  },
  {
    id: "semo-airsoft-benton-speedway",
    name: "SEMO Airsoft -- Benton Speedway",
    city: "Benton, MO",
    address: "817 County Highway 505, Benton, MO 63736",
    phone: "(573) 382-7761",
    website: "https://www.semoairsoft.com/airsoft-facilities",
    indoorOutdoor: "outdoor",
    about:
      "20-acre outdoor SEMO Airsoft venue with woods, sand dunes, hills, and open play area; hosts occasional night games during summer months.",
    status: "active",
    dataSource:
      "own website (semoairsoft.com/airsoft-facilities) + Boise Gun Club directory mirror",
    lastScraped: "2026-09-17",
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
  },

  {
    id: "graffiti-paintball",
    name: "Graffiti Paintball",
    city: "Belle Plaine, KS",
    address: "1127 North Seneca Road, Belle Plaine, KS 67013",
    phone: "(316) 640-5161",
    website: "https://www.graffitiks.com",
    ownerEmailDomain: "graffitiks.com",
    facebook: "https://www.facebook.com/GraffitiPaintballKS/",
    indoorOutdoor: "outdoor",
    admission:
      "Paintball: $10 field-fee-only (own equipment) / $15 with rental gear (all-day); Airsoft: $20 all-day; private parties (half-day, 10+ players) $50 plus rental/field fees.",
    about:
      "Outdoor paintball-and-airsoft park in Belle Plaine, south of Wichita, open Saturdays and Sundays 9am-5pm (weekdays by reservation for groups of 15+). Airsoft runs on a scheduled basis -- the 2nd Saturday and 1st/4th Sundays of each month -- alongside paintball's more frequent regular schedule.",
    status: "active",
    dataSource: "website (graffitiks.com) + Facebook",
    lastScraped: "2026-09-13",
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
    lastScraped: "2026-09-13",
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
  },

  {
    id: "diamond-state-airsoft",
    name: "Diamond State Airsoft",
    city: "Malvern, AR",
    address: "339 S Grant Cutoff, Malvern, AR 72104",
    phone: "(479) 579-8724",
    website: "https://diamondstatervpark.com/airsoft",
    ownerEmailDomain: "diamondstatervpark.com",
    facebook: "https://www.facebook.com/diamondstateairsoft/",
    instagram: "https://www.instagram.com/diamondsstateairsoft/",
    indoorOutdoor: "outdoor",
    admission:
      "All-day open play $20/person; monthly membership $39 (unlimited access); private group bookings (10+ players) by custom quote.",
    about:
      "101-acre outdoor airsoft field in Malvern built on a former professional motocross complex, run alongside the property's Diamond State RV & Recreation Park. Terrain includes a 4.5-mile motocross track with natural berms and elevation changes, dense forest, creeks, ponds, and wetlands. Open Saturday-Sunday 9am-5pm public open play (walk-ins welcome); Monday-Friday by reservation only for private groups (10+ minimum). MilSim events planned for 2026.",
    status: "active",
    dataSource: "website (diamondstatervpark.com/airsoft) + Facebook + Instagram",
    lastScraped: "2026-09-13",
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
  },
  {
    id: "arnies-army-airsoft-dandridge",
    name: "Arnie's Army Airsoft",
    city: "Dandridge, TN",
    address: "1791 SR-139, Dandridge, TN 37725",
    phone: "865-582-5532",
    email: "armyairsoft83@gmail.com",
    website: "https://www.airsoftarnie.com",
    facebook: "https://www.facebook.com/profile.php?id=61585753484163",
    instagram: "https://www.instagram.com/arniesarmyairsoft",
    indoorOutdoor: "outdoor",
    about:
      "East Tennessee outdoor airsoft field in the Smoky Mountains region, serving the Dandridge, Sevierville, Pigeon Forge, Gatlinburg, and Knoxville area. Diverse terrain including woodland, urban structures, and bunkers. Offers weekend open play, weekday private bookings, rental packages, and safety training, plus birthday parties, bachelor parties, and corporate team-building events.",
    status: "active",
    dataSource:
      "own website (airsoftarnie.com) — live Rates, Connect, Upcoming Events (an August 15, 2026 event listed), Safety Regulations, and Waiver pages all currently reachable — + Instagram + Facebook + exact address supplied directly by Michael",
    lastScraped: "2026-09-20",
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
  },
  {
    id: "airsoft-atlanta",
    name: "Airsoft Atlanta",
    city: "Atlanta, GA",
    address: "3529 Church St Ste G, Atlanta, GA 30021",
    phone: "(470) 605-6186",
    website: "https://airsoftatlanta.com",
    facebook: "https://www.facebook.com/airsoftatlanta",
    instagram: "https://www.instagram.com/airsoftatl",
    youtube: "https://www.youtube.com/@Airsoftatlantatv",
    indoorOutdoor: "indoor",
    admission:
      "1 hour (own gear) $15 / all-day (own gear) $30; 1 hour (rental) $35 / all-day (rental) $65 -- rental package includes M4 AEG rifle, full-face mask, magazine, 1000 BBs; add-ons: tracer unit $10, upgraded M4 $25, air $10, protective gear $5-$20. Fri 4-8pm, Sat 12-6pm, Sun 12-5pm.",
    about:
      "Large airsoft retailer with an attached indoor arena serving the Atlanta metro area.",
    status: "active",
    dataSource: "website (airsoftatlanta.com/pages/field-1) + Yelp (updated September 2026) + Facebook + Instagram + YouTube",
    lastScraped: "2026-09-13",
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
      "Not separately published for Manassas; its sister Rockville, MD location (see tactical-airsoft-arena-rockville, added 2026-09-18) confirms $28 admission / $25 rental / $47 all-weekend pass, likely comparable",
    about:
      "7,800-sq-ft indoor airsoft arena with reconfigurable modular plywood walls, forming the second location (opened 2018) of a chain whose first arena opened in Rockville, MD in 2008. Combined, the two locations offer 10,000+ sq ft of playable space.",
    status: "active",
    dataSource: "website (shared chain site) + Facebook + Instagram + YouTube + Yelp/Tripadvisor (4.7 stars, 273 reviews) + industry press (RGK Airsoft)",
    lastScraped: "2026-09-11",
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
  },
  // ---- Alaska (added 2026-09-14) -------------------------------------
  {
    id: "alaskan-airsoft-battlegrounds",
    name: "Alaskan Airsoft Battlegrounds",
    city: "Fairbanks, AK",
    address: "399 Helmericks Ave, Fairbanks, AK 99703",
    phone: "(907) 378-4677",
    website: "https://907airsoft.com",
    indoorOutdoor: "indoor",
    admission:
      "Sessions $15-20/hour (bring-your-own-gear $20/hr; rental $15/hr plus equipment); memberships from $70/month; birthday parties from $300 for 10 people.",
    about:
      "Self-described \"Fairbanks' only indoor airsoft arena,\" a 5,000+ sq ft indoor facility founded in 2024 (some directories also mention Orbeez/gel-blaster play alongside airsoft). Open Wednesday-Saturday 3-10pm and Sunday evening (a discounted bring-your-own-gear night); closed Monday-Tuesday. Also books private events and birthday parties.",
    status: "active",
    dataSource: "website (907airsoft.com: home, /faq) + Yahoo Local + Facebook + Yelp + AirsoftC3",
    lastScraped: "2026-09-14",
  },
  {
    id: "interior-alaska-airsoft",
    name: "Interior Alaska Airsoft",
    city: "Fairbanks, AK",
    facebook: "https://www.facebook.com/InteriorAlaskaAirsoftLLC/",
    instagram: "https://www.instagram.com/interiorakairsoft/",
    indoorOutdoor: "outdoor",
    about:
      "Community-run outdoor airsoft course off Repp Road, between Fairbanks and North Pole, describing itself as \"the premiere destination for airsoft combat in the Fairbanks, North Pole and surrounding area.\" Hosts regular organized gameplay plus SMASH tournaments and exhibits at Alaska ComiCon.",
    status: "facebook_only",
    dataSource:
      "Facebook + Instagram + AirsoftC3 + Airsoft Goat directory + Alaska ComiCon exhibitor page + OpenCorporates / Alaska Company Directory (LLC registration)",
    lastScraped: "2026-09-14",
  },
  {
    id: "alaska-family-airsoft",
    name: "Alaska Family Airsoft",
    city: "North Pole, AK",
    facebook: "https://www.facebook.com/AlaskaFamilyAirsoftNP/",
    indoorOutdoor: "outdoor",
    admission: "Free field use; rental gear available for purchase (no rental price published).",
    about:
      "Small, community-oriented airsoft field near North Pole, AK, described as \"a fun and affordable way to experience the joys of airsoft,\" with free field access and optional gear rental.",
    status: "facebook_only",
    dataSource: "Facebook + AirsoftC3 + Airsoft Goat directory",
    lastScraped: "2026-09-14",
  },
  // ---- Arizona (added 2026-09-14) ------------------------------------
  {
    id: "freedom-airsoft",
    name: "Freedom Airsoft",
    city: "Tucson, AZ",
    address: "7850 E Valencia Rd, Tucson, AZ 85747",
    phone: "(520) 704-5798",
    website: "https://freedomairsofttucson.com",
    ownerEmailDomain: "freedomairsofttucson.com",
    facebook: "https://www.facebook.com/FreedomAirsoft/",
    instagram: "https://www.instagram.com/freedomairsoft520/",
    indoorOutdoor: "outdoor",
    admission:
      "Rental package (M4 rifle, magazine, face protection, 500 BBs) available; specific walk-on/session pricing not published on the main site -- see the site's own Hours & Pricing page or contact directly.",
    about:
      "Tucson's largest airsoft field, an 8-acre outdoor venue with varied terrain including helicopter wrecks, boats, cars, shipping containers, and several multi-room buildings and bunkers. Runs an on-site pro shop. Open weekends; ages 7+ welcome, electronic waiver required for all players.",
    status: "active",
    dataSource: "website (freedomairsofttucson.com) + Facebook + Instagram + Yelp (updated June 2026)",
    lastScraped: "2026-09-14",
  },
  {
    id: "vipairsoft-gilbert",
    name: "VIPAirsoft Arena & Pro-Shop -- Gilbert",
    city: "Gilbert, AZ",
    address: "3841 E Baseline Rd, Gilbert, AZ 85234",
    phone: "(480) 507-9420",
    website: "https://vipairsoft.net",
    facebook: "https://www.facebook.com/VIPAirsoft/",
    instagram: "https://www.instagram.com/vipairsoft/",
    indoorOutdoor: "indoor",
    admission:
      "Session entry (4hr, BBs included): online prepaid $29.40 weekdays / $34.30 weekends (standard), $34.40 / $39.30 (tracer); walk-in $37 plus tax. Rental package (M4, mask, chest protector): $15.20 prepaid / $18 walk-in. $21 Tuesdays online-only special.",
    about:
      "Family-owned indoor airsoft arena with an on-site pro shop and technicians; sister location to VIPAirsoft's Phoenix arena. Arena hours vary by day (evenings on weekdays, midday plus evening on weekends); pro shop keeps longer hours.",
    status: "active",
    dataSource: "website (vipairsoft.net) + Yelp + Facebook + Instagram + Chamber of Commerce directory",
    lastScraped: "2026-09-14",
  },
  {
    id: "vipairsoft-phoenix",
    name: "VIPAirsoft Arena & Pro-Shop -- Phoenix",
    city: "Phoenix, AZ",
    address: "10870 N 32nd St, Phoenix, AZ 85028",
    phone: "(602) 491-9149",
    website: "https://vipairsoft.net",
    facebook: "https://www.facebook.com/VIPAirsoft/",
    instagram: "https://www.instagram.com/vipairsoft/",
    indoorOutdoor: "indoor",
    admission:
      "Same pricing structure as the Gilbert location -- session entry (4hr, BBs included): online prepaid $29.40 weekdays / $34.30 weekends (standard), $34.40 / $39.30 (tracer); walk-in $37 plus tax. Rental package: $15.20 prepaid / $18 walk-in.",
    about:
      "Second VIPAirsoft indoor arena location, supporting recreational, MilSim, and tactical training play.",
    status: "active",
    dataSource: "website (vipairsoft.net) + Yelp + AirsoftC3 + business directories",
    lastScraped: "2026-09-14",
  },
  {
    id: "american-paintball-coliseum-phoenix",
    name: "American Paintball Coliseum",
    city: "Phoenix, AZ",
    website: "https://www.americanpaintballcoliseum.com",
    facebook: "https://www.facebook.com/people/American-Paintball-Coliseum/",
    instagram: "https://www.instagram.com/americanpaintballcoliseum",
    indoorOutdoor: "indoor",
    admission:
      "Field pass (4hr, walk-on or online) $20; rifle rental $35; equipment swap $15; ammo $15/5,000 standard BBs or $17/5,000 tracer BBs; birthday party package $62.29/player (2hr pass, rental, 250 BBs, pizza, soda, cupcake).",
    about:
      "Indoor, climate-controlled airsoft arena themed around planes, boats, and buildings, running fast-paced (~5 minute) respawn-style CQB games. Open 7 days a week. Includes spectator seating with televised game viewing and an on-site snack bar.",
    status: "active",
    dataSource: "website (americanpaintballcoliseum.com/phoenix-arizona-airsoft-field) + Facebook + Instagram + YouTube",
    lastScraped: "2026-09-14",
  },
  {
    id: "fightertown-paintball-airsoft",
    name: "Fightertown Paintball and Airsoft",
    city: "El Mirage, AZ",
    address: "9825 N 121st Ave, El Mirage, AZ 85335",
    phone: "(602) 421-7039",
    website: "https://www.fightertownpaintballpark.com",
    indoorOutdoor: "outdoor",
    admission:
      "Specific rates published on a dedicated Airsoft Info/Rates subpage rather than the homepage -- not independently captured; contact directly for current pricing.",
    about:
      "Combined paintball-and-airsoft park with multiple fields, more planned. Summer hours Saturday-Sunday 6am-noon; winter hours (from Oct 3) Saturday-Sunday 8am-5pm.",
    status: "active",
    dataSource: "website (fightertownpaintballpark.com) + AirsoftC3",
    lastScraped: "2026-09-14",
  },
  {
    id: "az-battle-zone",
    name: "Battle Zone Paintball Field (AZ Battle Zone)",
    city: "Phoenix, AZ",
    address: "2215 S 39th Ave, Phoenix, AZ 85009",
    phone: "(602) 686-1808",
    website: "https://www.azbattlezone.com",
    facebook: "https://www.facebook.com/azbattlezone",
    instagram: "https://www.instagram.com/azbattlezone",
    indoorOutdoor: "outdoor",
    admission:
      "Airsoft-only night games: entry $20-25 depending on time/day; air fills $5; Basic rental (gun + 1,000 rounds + mask) $45; Elite rental (tracer-upgrade gun + 1,000 tracer rounds + mask) $60.",
    about:
      "Paintball-primary field that also runs dedicated \"airsoft only\" night games (Friday evenings, Saturday afternoon-to-night) for ages 10+, semi-auto only for public games, full face protection required under 18. Private party bookings available.",
    status: "active",
    dataSource: "website (azbattlezone.com, /airsoft) + Facebook + Instagram + Boise Gun Club directory",
    lastScraped: "2026-09-14",
  },
  {
    id: "tactical-fun-house-phoenix",
    name: "Tactical Fun House",
    city: "Phoenix, AZ",
    address: "13601 N 19th Ave, Phoenix, AZ 85023",
    phone: "(602) 993-5787",
    website: "https://www.tacticalfunhouse.com",
    indoorOutdoor: "indoor",
    admission:
      "$30/person for a 90-minute private game (airsoft gun, face mask, 1,000 rounds included); additional ammo $5 per 1,000 rounds.",
    about:
      "Self-described \"the only private party airsoft arena in the valley,\" a 1,400 sq ft indoor CQB arena with movable bunkers, adjustable layouts, and atmospheric lighting/sound effects. Ages 10+. Open Saturday 11am-7pm and Sunday noon-5pm, plus weekday private bookings with 3 business days' notice.",
    status: "active",
    dataSource: "website (tacticalfunhouse.com) + Boise Gun Club directory",
    lastScraped: "2026-09-14",
  },
  {
    id: "disruptive-paintball-airsoft",
    name: "Disruptive Paintball and Airsoft",
    city: "Marana, AZ",
    address: "10218 W Tangerine Rd, Marana, AZ 85658",
    phone: "(520) 444-2351",
    facebook: "https://www.facebook.com/DisruptivePaintball/",
    indoorOutdoor: "outdoor",
    admission:
      "Rental equipment available; first-come-first-served for rentals and capacity, reservations suggested but not required. Specific pricing not independently found.",
    about:
      "Paintball-and-airsoft field under new ownership/management since June 2021; operates alongside a related retail store (Disruptive Products Inc.) and training business (Adaptive Training Institute LLC) on a separate Grant Road location.",
    status: "facebook_only",
    dataSource:
      "Facebook + Yelp (updated February 2026, 32 reviews) + Discover Marana chamber directory + Tucson Weekly community listing",
    lastScraped: "2026-09-14",
  },
  {
    id: "argonauts-arena",
    name: "Argonauts Arena (Ichor Airsoft)",
    city: "Chino Valley, AZ",
    address: "2125 N Old Home Manor Dr, Chino Valley, AZ 86323",
    website: "http://www.ichorairsoft.com",
    facebook: "https://www.facebook.com/IchorAirsoft/",
    indoorOutdoor: "outdoor",
    about:
      "Billed as \"the largest airsoft field in Arizona\" when it opened (Halloween weekend 2021) as Yavapai County's first dedicated airsoft field, run by Ichor Airsoft LLC. Multiple named play areas (Nemesis Field for hourly games, Tartarus for 24-hour matches, plus a separate Nerf-only field).",
    status: "facebook_only",
    dataSource:
      "Facebook + Chino Valley Area Chamber of Commerce directory + AirsoftC3 + business review aggregators (updated as recently as July 2025)",
    lastScraped: "2026-09-14",
  },
  {
    id: "cordes-junction-private-field",
    name: "Cordes Junction 1v1/2v2 Private Field",
    city: "Mayer, AZ",
    phone: "(928) 458-8692",
    indoorOutdoor: "outdoor",
    admission: "Free; reservation-only -- call ahead to schedule. No equipment provided (bring your own gear).",
    about:
      "Small private airsoft field near Cordes Junction, north of Mayer, AZ, run on a call-ahead reservation basis for 1v1/2v2 matches.",
    status: "active",
    dataSource: "AirsoftC3 only -- could not independently corroborate via Facebook, Yelp, Instagram, or other directories in this pass",
    lastScraped: "2026-09-14",
  },
  // ---- California (added 2026-09-14) ---------------------------------
  {
    id: "gamepod-combat-zone",
    name: "Gamepod Combat Zone",
    city: "Antioch, CA",
    address: "1400 W 4th St, Antioch, CA 94509",
    phone: "(925) 784-5550",
    website: "https://www.combatzonecqc.com",
    ownerEmailDomain: "combatzonecqc.com",
    facebook: "https://www.facebook.com/GPCombatZone",
    instagram: "https://www.instagram.com/gamepodcombatzoneinc",
    indoorOutdoor: "indoor",
    admission:
      "$35 public event entry; +$35 for full equipment rental (vest, red dot, tracer unit, gun upgrades).",
    about:
      "Self-described \"the world's largest indoor CQC airsoft arena,\" a 25,000+ sq ft converted warehouse in Antioch running scenario-based night ops (Wed-Fri evenings, Sat night) and weekend day games (Sat-Sun 9am-4pm), plus law-enforcement/military training and an on-site Evike Outpost retail store.",
    status: "active",
    dataSource: "website (combatzonecqc.com) + Yelp (104 reviews, updated July 2026) + Evike ticketing pages + Boise Gun Club directory",
    lastScraped: "2026-09-14",
  },
  {
    id: "airsoft-extreme-santa-clara",
    name: "Airsoft Extreme -- Santa Clara",
    city: "Santa Clara, CA",
    address: "3390-B Keller St, Santa Clara, CA 95054",
    phone: "(408) 492-9282",
    website: "https://www.airsoftextreme.com/service/santa-clara/",
    ownerEmailDomain: "airsoftextreme.com",
    facebook: "https://www.facebook.com/profile.php?id=61576842481278",
    instagram: "https://www.instagram.com/aexairsoftextreme/",
    youtube: "https://www.youtube.com/user/o0AirsoftExtreme0o",
    indoorOutdoor: "outdoor",
    admission:
      "$20/session with own gear; rental equipment available. Two sessions/day (12-2pm, 2:30-4:30pm), Tuesday-Saturday.",
    about:
      "A 9,000 sq ft outdoor CQB-style arena with reconfigurable obstacles and barricades, semi-auto only, ages 10+, aimed at newcomers as well as regulars.",
    status: "active",
    dataSource: "website (airsoftextreme.com)",
    lastScraped: "2026-09-14",
  },
  {
    id: "playland-707-petaluma",
    name: "Playland 707",
    city: "Petaluma, CA",
    address: "471 Kenilworth Dr, Petaluma, CA 94952",
    website: "https://www.playland707.com/airsoft",
    ownerEmailDomain: "playland707.com",
    indoorOutdoor: "outdoor",
    admission:
      "Self-equipped $10 (1hr) / $20 (3hr) / $30 (all day); rental $20 (1hr) / $40 (3hr) / $50 (all day, includes 1,000 BBs); extra BBs $6.",
    about:
      "Combined paintball/airsoft park at the Petaluma fairgrounds, pairing a simulated post-apocalyptic CQB \"town\" with an open-air outdoor field; runs daily beginner and advanced games.",
    status: "active",
    dataSource: "website (playland707.com/airsoft) + AirsoftC3",
    lastScraped: "2026-09-14",
  },
  {
    id: "tag-adventure-park-hollister",
    name: "TAG Adventure Park (Airsoft / AO13)",
    city: "Hollister, CA",
    address: "2120 San Benito St, Hollister, CA 95023",
    phone: "(831) 244-0950",
    website: "https://tagadventurepark.com",
    ownerEmailDomain: "tagadventurepark.com",
    facebook: "https://www.facebook.com/TAGAdventurePark",
    instagram: "https://www.instagram.com/tagadventurepark",
    indoorOutdoor: "outdoor",
    admission:
      "Not itemized for airsoft specifically on the main site; paintball/gellyball/airsoft all offered with rentals and referees included.",
    about:
      "Large multi-activity combat park (paintball, gellyball, airsoft) south of the Bay Area near Hollister, with bunker fields, trenches, concrete structures, and a turf arena. Open Sat-Sun 9am-4pm; weekdays private-booking only.",
    status: "active",
    dataSource: "website (tagadventurepark.com, incl. /faq-airsoft) + Yelp (176 reviews, updated June 2026) + Instagram",
    lastScraped: "2026-09-14",
  },
  {
    id: "west-coast-adventure-park-hollister",
    name: "West Coast Adventure Park",
    city: "Hollister, CA",
    address: "1533 Shore Rd, Hollister, CA 95023",
    phone: "(800) 665-4219",
    website: "https://westcoastadventurepark.com",
    ownerEmailDomain: "westcoastadventurepark.com",
    facebook: "https://www.facebook.com/WCAP916",
    indoorOutdoor: "outdoor",
    admission:
      "Airsoft rental $50 (mask, gun, mag, charged battery) / self-equip $30; add-on gear $5-$20/item; paintball priced separately. Sat-Sun 9am-4pm, weekdays by appointment.",
    about:
      "Described on its own site as \"California's largest paintball and airsoft facility,\" about 45 minutes south of San Jose, with multiple distinct fields across both sports; night games listed as \"coming soon.\"",
    status: "active",
    dataSource: "website (westcoastadventurepark.com, current 2025 copyright, live booking system) + Facebook (WCAP916)",
    lastScraped: "2026-09-14",
  },
  {
    id: "airsoft-arena-rancho-cordova",
    name: "The Airsoft Arena @ AEX Rancho Cordova (Airsoft Extreme)",
    city: "Rancho Cordova, CA",
    address: "11395 Folsom Blvd, Suite 150, Rancho Cordova, CA 95742",
    phone: "(916) 822-4790",
    website: "https://www.airsoftarenarc.com",
    ownerEmailDomain: "airsoftarenarc.com",
    facebook: "https://www.facebook.com/AirsoftArenaRC",
    instagram: "https://www.instagram.com/theairsoftarena/",
    youtube: "https://www.youtube.com/@AirsoftArenaRC",
    indoorOutdoor: "indoor",
    admission:
      "Field fee only $30; rental package $60; individual rentals $5-$40. Alpha session (Sat/Sun 10am-1pm), Bravo (Sat/Sun 2-5pm), Omega (Thu-Sat 6-9pm).",
    about:
      "A 20,000 sq ft climate-controlled indoor arena with 14 buildings and reconfigurable walls/lighting, billed as \"the newest indoor airsoft battleground in California,\" ages 10+; hosts open play, private events, and LE/military training.",
    status: "active",
    dataSource: "own website (airsoftarenarc.com) + co-branded airsoftextreme.com/service/sacramento-arena listing",
    lastScraped: "2026-09-14",
  },
  {
    id: "capital-edge-paintball-sacramento",
    name: "Capital Edge Paintball Park",
    city: "Sacramento, CA",
    address: "9391 Florin Rd, Sacramento, CA",
    website: "https://www.capitaledgepaintball.com",
    ownerEmailDomain: "capitaledgepaintball.com",
    facebook: "https://www.facebook.com/capitaledgepaintball",
    instagram: "https://www.instagram.com/capitaledgepaintballpark",
    indoorOutdoor: "outdoor",
    admission:
      "Paintball self-equip special $72 (plus tax), all-day entry, air, and paint included; no current airsoft-specific pricing found.",
    about:
      "\"The premier paintball field in Northern California,\" with turf and scenario fields. A separately-branded \"Capital Edge Airsoft\" presence also exists (own domain, Facebook page, and a YouTube video showing a Call of Duty-inspired airsoft field on the property), but could not be confirmed as a live, currently-priced offering.",
    status: "facebook_only",
    dataSource: "website (capitaledgepaintball.com, paintball confirmed active) + Facebook + one dated YouTube video (airsoft component only)",
    lastScraped: "2026-09-14",
  },
  {
    id: "sac-county-airsoft-training",
    name: "Sac County Airsoft & Training",
    city: "Elk Grove, CA",
    address: "9752 Kent St #300, Elk Grove, CA 95624",
    website: "https://www.saccountyairsoft.com",
    ownerEmailDomain: "saccountyairsoft.com",
    facebook: "https://www.facebook.com/SacCountyAirsoft",
    instagram: "https://www.instagram.com/official.saccountyairsoft/",
    indoorOutdoor: "indoor",
    admission:
      "General play $20/player; both indoor fields $30; Speed Night $20; equipment rental from $45/player. Fri 5-9pm, Sat 10am-5pm & 5-10pm, Sun 10am-5pm.",
    about:
      "Indoor airsoft facility in Elk Grove with separate CQB and \"Speed\" fields, a retail shop, and party-room rentals; an outdoor field is currently listed offline on their own site.",
    status: "active",
    dataSource: "own website (saccountyairsoft.com, live current hours/pricing) + Facebook + Instagram",
    lastScraped: "2026-09-14",
  },
  {
    id: "all-patriot-airsoft-galt",
    name: "All Patriot Airsoft",
    city: "Galt, CA",
    address: "12395 E Stockton Blvd, Galt, CA 95632",
    phone: "(916) 544-0777",
    website: "https://allpatriotairsoft.com",
    ownerEmailDomain: "allpatriotairsoft.com",
    facebook: "https://www.facebook.com/allpatriotairsoft",
    instagram: "https://www.instagram.com/allpatriotairsoft",
    indoorOutdoor: "outdoor",
    about:
      "Outdoor airsoft park just south of Sacramento hosting milsim events, night games, and team competitions.",
    status: "active",
    dataSource: "own website (allpatriotairsoft.com, thin content but confirms name/description) + Yelp cross-check across three historical business names at the identical address",
    lastScraped: "2026-09-14",
  },
  {
    id: "airsoft-ministry-roseville",
    name: "Airsoft Ministry",
    city: "Roseville, CA",
    address: "4555 Pfe Rd, Roseville, CA",
    website: "https://www.airsoftministry.com",
    ownerEmailDomain: "airsoftministry.com",
    facebook: "https://www.facebook.com/AirsoftMinistry",
    instagram: "https://www.instagram.com/airsoftministry/",
    youtube: "https://www.youtube.com/@AirsoftMinistryCom",
    indoorOutdoor: "outdoor",
    admission:
      "Field fee $20 all day; standard rental combo $25 (M4, mag, mask, 1,000 BBs); premium gun/mask upgrades +$10-15; HPA air $1/PSI.",
    about:
      "Faith-based outdoor airsoft operation (\"Airsoft and Jesus Christ together\") associated with Antelope Springs Church, running structured games Sundays 9am-2pm (gates 8:30am), with occasional Friday/Saturday play per social media. Church volunteers play free.",
    status: "active",
    dataSource: "own website (airsoftministry.com, incl. /sunday-play)",
    lastScraped: "2026-09-14",
  },
  {
    id: "us-airsoft-world-anderson",
    name: "US Airsoft World",
    city: "Anderson, CA",
    address: "4506 Panorama Point Rd, Anderson, CA 96007",
    phone: "(530) 365-1000",
    website: "https://www.usairsoftfield.com",
    ownerEmailDomain: "usairsoftfield.com",
    indoorOutdoor: "outdoor",
    about:
      "A large combined indoor/outdoor airsoft complex near Redding -- 50,000+ sq ft of indoor space plus 10 acres of outdoor field -- in operation 13+ years per its own listing, with a superstore, birthday-party packages, team-building events, and player barracks/charging stations.",
    status: "active",
    dataSource: "Yellowpages business listing (address/phone/hours match) + Airsoft Society forum references + Tripadvisor -- own domain (usairsoftfield.com) exists but returned mostly JS shell content on direct fetch",
    lastScraped: "2026-09-14",
  },
  {
    id: "gorilla-airsoft-bakersfield",
    name: "Gorilla Airsoft",
    city: "Bakersfield, CA",
    address: "608 18th St, Bakersfield, CA",
    phone: "(661) 323-1066",
    website: "https://gorillaairsoft.com",
    ownerEmailDomain: "gorillaairsoft.com",
    facebook: "https://www.facebook.com/140850939306394",
    instagram: "https://www.instagram.com/gorilla.airsoft",
    youtube: "https://www.youtube.com/channel/UCw19D7NMz11fCu2VwbsagUw",
    indoorOutdoor: "outdoor",
    admission: "$35/person entry; $25 rental gear.",
    about:
      "Bakersfield airsoft retailer that runs organized outdoor games every Sunday at the nearby Poso Creek Paintball Field, offering rental guns for newcomers and enforcing velocity limits.",
    status: "active",
    dataSource: "own website (gorillaairsoft.com)",
    lastScraped: "2026-09-14",
  },
  {
    id: "cqb-city-stockton",
    name: "CQB City",
    city: "Stockton, CA",
    address: "3200 E Mile Rd, Stockton, CA 95212",
    phone: "(925) 457-4832",
    website: "https://cqbcity.com",
    ownerEmailDomain: "cqbcity.com",
    indoorOutdoor: "indoor",
    admission: "Not itemized in verified sources.",
    about:
      "Self-described \"Law Enforcement Training Center and the World's Largest Indoor Airsoft Arena\" in Stockton. Open Fri 6-11:30pm, Sat-Sun 1-7pm.",
    status: "facebook_only",
    dataSource: "Yelp (102 reviews, updated July 2026) + Giftly + Roadtrippers -- own domain exists but returned only a robots.txt block on direct fetch",
    lastScraped: "2026-09-14",
  },
  {
    id: "hill-559-clovis",
    name: "Hill 559",
    city: "Clovis, CA",
    address: "11504 Millerton Rd, Clovis, CA",
    facebook: "https://www.facebook.com/Hill559",
    indoorOutdoor: "outdoor",
    about: "Outdoor airsoft field in Clovis, in the Fresno metro area, with an active Facebook presence.",
    status: "facebook_only",
    dataSource: "Facebook + Yelp (28 photos, updated June 2026) + Boise Gun Club directory + bstairsoft.com field listing",
    lastScraped: "2026-09-14",
  },
  {
    id: "fresno-airsoft-kerman",
    name: "Fresno Airsoft",
    city: "Kerman, CA",
    address: "13250 W Annadale Ave, Kerman, CA 93630",
    facebook: "https://www.facebook.com/FresnoAirsoft",
    instagram: "https://www.instagram.com/fresnoairsoft",
    indoorOutdoor: "outdoor",
    about: "Airsoft supply store and field west of Fresno, functioning as both a retail shop and a playable arena.",
    status: "facebook_only",
    dataSource: "Yelp (as 'Fresno Airsoft Arena,' 10 reviews, updated June 2026) + Facebook + Instagram + highspeedbbs store directory + AirsoftC3",
    lastScraped: "2026-09-14",
  },
  {
    id: "specops-live-play-oakdale",
    name: "SpecOps Live Play",
    city: "Oakdale, CA",
    facebook: "https://www.facebook.com/SpecOpsLivePlayAirSoft",
    instagram: "https://www.instagram.com/specopsliveplay",
    indoorOutdoor: "outdoor",
    about: "Airsoft (and apparent laser-tag/live-play) operation in Oakdale, in the northern Central Valley near Modesto/Stockton.",
    status: "facebook_only",
    dataSource: "Facebook + Instagram + LinkedIn + AirsoftC3 -- own site (specopsliveplay.com) exists but could not be directly verified for pricing/hours",
    lastScraped: "2026-09-14",
  },
  {
    id: "mike-force-airsoft-salinas",
    name: "Mike Force Airsoft",
    city: "Salinas, CA",
    address: "7020 Valle Pacifico Rd, Salinas, CA 93907",
    website: "https://www.mikeforceairsoft.org",
    ownerEmailDomain: "mikeforceairsoft.org",
    facebook: "https://www.facebook.com/mikeforceairsoft",
    indoorOutdoor: "outdoor",
    admission:
      "Game fee $30; annual membership $100 (free renewal after 6+ games/year); gun rental $30/day (weapon, ammo, face protection included).",
    about:
      "Established 1998, a mission-oriented/milsim-style tactical airsoft club near Salinas named after the Vietnam-era Mobile Strike Force unit. Games run every 2nd Sunday, 9am-2:30pm, ages 9+, no uniform requirement.",
    status: "active",
    dataSource: "own website (mikeforceairsoft.org)",
    lastScraped: "2026-09-14",
  },
  {
    id: "fort-ord-airsoft-field-marina",
    name: "Fort Ord Airsoft Field",
    city: "Marina, CA",
    facebook: "https://www.facebook.com/fortordairsoft",
    indoorOutdoor: "outdoor",
    about:
      "Long-running, historically prominent airsoft playing area on the grounds of the former Fort Ord military base, referenced in airsoft community media coverage; operated by Roundhouse Productions.",
    status: "facebook_only",
    dataSource: "Facebook + Instagram location tag + Popular Airsoft article reference + AirsoftC3 + business directory listings",
    lastScraped: "2026-09-14",
  },
  {
    id: "gladiator-paintball-park-slo",
    name: "Gladiator Paintball Park",
    city: "San Luis Obispo, CA",
    address: "1 Sutter Ave, San Luis Obispo, CA 93405",
    phone: "(805) 602-8629",
    website: "https://www.gladiatorpb.com/venue/gladiator-paintball-park/",
    ownerEmailDomain: "gladiatorpb.com",
    facebook: "https://www.facebook.com/slopaintball/",
    instagram: "https://www.instagram.com/gladiator_paintball_park_/",
    indoorOutdoor: "outdoor",
    admission:
      "\"Night Airsoft\" event admission $21.20, 6:30-11:30pm; general park hours Sat-Sun 9am-5pm. Paintball/gellyball/Nerf also offered.",
    about:
      "\"The premier family fun center on the Central Coast,\" primarily a paintball park (Bunker Hill, Colosseum, Junkyard, Speedball fields) that runs distinct, separately-ticketed night airsoft events.",
    status: "active",
    dataSource: "own website (gladiatorpb.com)",
    lastScraped: "2026-09-14",
  },
  {
    id: "warped-ops-castaic",
    name: "Warped Ops Airsoft Park",
    city: "Castaic, CA",
    address: "34481 Ridge Route Rd, Castaic, CA 91384",
    phone: "(661) 450-9401",
    website: "https://warpedops.com",
    ownerEmailDomain: "warpedops.com",
    facebook: "https://www.facebook.com/pages/Warped-Ops-Airsoft-Castaic-CA/117304648328166",
    instagram: "https://www.instagram.com/warpedops/",
    indoorOutdoor: "outdoor",
    admission:
      "Roughly $25/day entry per one directory; full pricing lives on the site's own pricing menu, not itemized on the homepage.",
    about:
      "Outdoor-only airsoft park in Castaic serving LA/San Fernando Valley/Ventura County players, with referee-led games, rental gear, and corporate/birthday events. Open Sat-Sun 9am-4pm.",
    status: "active",
    dataSource: "own website (warpedops.com) + AirsoftC3 + Airsoft Gateway + airsoftnmore + RedWolf blog",
    lastScraped: "2026-09-14",
  },
  {
    id: "combat-paintball-park-castaic",
    name: "Combat Paintball Park",
    city: "Castaic, CA",
    address: "31050 Charlie Canyon Rd, Castaic, CA 91384",
    phone: "(800) 289-3199",
    website: "https://playcpp.com/airsoft",
    ownerEmailDomain: "playcpp.com",
    facebook: "https://www.facebook.com/playcpp/",
    instagram: "https://www.instagram.com/playcpp/",
    indoorOutdoor: "outdoor",
    admission:
      "$35/person all-day self-equipped entry for airsoft, currently offered Sundays for walk-ons; private parties bookable other days.",
    about:
      "Primarily a paintball park with multiple themed fields (Firebase Alpha, Castle, and others) that explicitly and separately sells airsoft as its own priced offering.",
    status: "active",
    dataSource: "own website (playcpp.com/airsoft)",
    lastScraped: "2026-09-14",
  },
  {
    id: "hollywood-sports-bellflower",
    name: "Hollywood Sports Airsoft Park",
    city: "Bellflower, CA",
    address: "9030 Somerset Blvd, Bellflower, CA 90706",
    phone: "(562) 867-9600",
    website: "https://hollywoodsports.com/pages/airsoft",
    ownerEmailDomain: "hollywoodsports.com",
    facebook: "https://www.facebook.com/HollywoodSports/",
    instagram: "https://www.instagram.com/hollywoodsports/",
    youtube: "https://www.youtube.com/channel/UCUP7Q3KbPlc2x5q5nUr9TFQ",
    indoorOutdoor: "outdoor",
    admission:
      "Self-Equipped Package $500 / 3hrs / 10 admissions; Silver rental package $650 / 3hrs / 10 admissions (includes gun/mask rentals) -- group-oriented pricing.",
    about:
      "One of the largest outdoor airsoft parks in LA County, with movie-prop-themed fields, ages 10+. Open Fri 1-6pm, Sat-Sun 10am-5pm; private groups bookable 7 days/week.",
    status: "active",
    dataSource: "own website (hollywoodsports.com/pages/airsoft)",
    lastScraped: "2026-09-14",
  },
  {
    id: "project-n1-el-monte",
    name: "Project N1",
    city: "El Monte, CA",
    address: "12440 Exline St, El Monte, CA 91732",
    phone: "(626) 542-3404",
    website: "https://www.n1airsoft.com",
    facebook: "https://www.facebook.com/projectn1.coi",
    indoorOutdoor: "indoor",
    admission:
      "Roughly $30 all-day, $20 after 7pm per a third-party pricing page; no minimum-engagement play.",
    about:
      "Indoor CQB airsoft arena in the San Gabriel Valley, open 7 days a week (Mon-Thu 5-10pm, Fri 5-11pm, Sat 1-11pm, Sun 1-10pm), hosting special events.",
    status: "facebook_only",
    dataSource: "Yelp (122 reviews, not closed) + airsoftnmore.com pricing page + Battleonix directory",
    lastScraped: "2026-09-14",
  },
  {
    id: "true-edge-airsoft-simi-valley",
    name: "True Edge Airsoft",
    city: "Simi Valley, CA",
    address: "1555 Simi Town Center Way, Simi Valley, CA 93063",
    phone: "(805) 520-6488",
    indoorOutdoor: "indoor",
    about: "Indoor airsoft venue operating out of the Simi Valley Town Center mall.",
    status: "facebook_only",
    dataSource: "Yelp (44 reviews, updated June 2026, not closed) + Yellow Pages + mallscenters.com + opengovus",
    lastScraped: "2026-09-14",
  },
  {
    id: "tac-city-airsoft-fullerton",
    name: "Tac City Airsoft",
    city: "Fullerton, CA",
    address: "2430 Artesia Ave, Fullerton, CA 92833",
    phone: "(657) 888-6111",
    website: "https://taccityairsoft.com",
    ownerEmailDomain: "taccityairsoft.com",
    facebook: "https://www.facebook.com/TacCity/",
    instagram: "https://www.instagram.com/taccityairsoft/",
    youtube: "https://www.youtube.com/user/taccityairsoft",
    indoorOutdoor: "indoor",
    admission:
      "Online ticketing; roughly $15 weekdays / $20 weekends per a third-party pricing summary -- confirm current pricing on the site directly.",
    about:
      "LA and Orange County's dedicated indoor-only airsoft field -- 30,000+ sq ft of CQB play area, with a pro shop and rental/tech services.",
    status: "active",
    dataSource: "own website (taccityairsoft.com)",
    lastScraped: "2026-09-14",
  },
  {
    id: "sc-village-chino",
    name: "SC Village Paintball & Airsoft Park",
    city: "Chino, CA",
    address: "8900 McCarty Rd, Chino, CA 91710",
    phone: "(949) 489-9000",
    website: "https://www.scvillage.com",
    ownerEmailDomain: "scvillage.com",
    facebook: "https://www.facebook.com/scvillage/",
    instagram: "https://www.instagram.com/scvillage",
    indoorOutdoor: "outdoor",
    admission: "Entry-only $30; memberships available for unlimited play; group party packages.",
    about:
      "100-acre, 25+ map outdoor park spanning paintball, airsoft (ages 10+), low-impact paintball, and gel blasters (ages 5+), with movie-prop-themed sets.",
    status: "active",
    dataSource: "own website (scvillage.com)",
    lastScraped: "2026-09-14",
  },
  {
    id: "code-red-airsoft-park-perris",
    name: "Code Red Airsoft Park",
    city: "Perris, CA",
    address: "681 E Ellis Ave, Perris, CA 92570",
    phone: "(760) 241-9097",
    website: "https://coderedairsoftpark.com",
    ownerEmailDomain: "coderedairsoftpark.com",
    facebook: "https://www.facebook.com/coderedairsoft/",
    instagram: "https://www.instagram.com/coderedairsoftparkdotcom/",
    indoorOutdoor: "outdoor",
    admission:
      "Roughly $30 all-day per a third-party pricing summary; MILSIM tactical training classes and rentals also offered.",
    about: "Self-described \"largest airsoft-only park in California.\" Players must be 10+. Open Sat-Sun 9am-4pm.",
    status: "active",
    dataSource: "Yelp (58 reviews, updated through June 2026, not closed) + Tripadvisor + airsoftnmore.com + Instagram",
    lastScraped: "2026-09-14",
  },
  {
    id: "wildlands-airsoft-lake-elsinore",
    name: "Wildlands Airsoft Park",
    city: "Lake Elsinore, CA",
    address: "14881 Temescal Canyon Rd, Lake Elsinore, CA 92530",
    phone: "(951) 775-9316",
    website: "https://www.wildlandsairsoft.com",
    ownerEmailDomain: "wildlandsairsoft.com",
    facebook: "https://www.facebook.com/wildlandsairsoftpark/",
    instagram: "https://www.instagram.com/wildlandsairsoftpark",
    indoorOutdoor: "outdoor",
    admission:
      "Private bay rentals $50/day (small groups) or $100/day (larger groups); walk-in weekend rates not itemized on the site.",
    about:
      "Dedicated airsoft brand operating at the \"Jungle Island\" recreational complex, with multiple named fields (Outback, Recon, and others). Open Sat-Sun 8am-4pm, weekdays by reservation.",
    status: "active",
    dataSource: "own website (wildlandsairsoft.com)",
    lastScraped: "2026-09-14",
  },
  {
    id: "661-airsoft-palmdale",
    name: "661 Airsoft",
    city: "Palmdale, CA",
    address: "41612 102nd St E, Palmdale, CA 93591",
    facebook: "https://www.facebook.com/661AIRSOFT/",
    instagram: "https://www.instagram.com/661airsoft/",
    indoorOutdoor: "outdoor",
    about:
      "Relatively new outdoor airsoft field in Palmdale (Antelope Valley/High Desert) running weekly programming like \"Sunday Fundays\" and \"Friday Night Fits,\" plus rentals and special events.",
    status: "facebook_only",
    dataSource: "RedWolf Airsoft blog + Yelp (18 photos, updated September 2026, not closed) + Visit Palmdale tourism directory + Giftly + Roadtrippers",
    lastScraped: "2026-09-14",
  },
  {
    id: "rampant-lion-field-victorville",
    name: "Rampant Lion Field (Desert Rats Airsoft)",
    city: "Victorville, CA",
    website: "https://www.desertratsairsoft.com/pages/rampant-lion-field.php",
    ownerEmailDomain: "desertratsairsoft.com",
    facebook: "https://www.facebook.com/desertratsairsoftsocal/",
    indoorOutdoor: "outdoor",
    admission: "Roughly $15 for standard pickup games; variable and higher for larger organized ops events.",
    about:
      "Informal, privately-owned desert field on unincorporated land north of Victorville, used for organized \"pickup games\" and larger ops. Requires high-clearance vehicle access, bio-BBs only, and strict gear rules; scheduling posted via forum/social media rather than fixed hours.",
    status: "active",
    dataSource: "own page (desertratsairsoft.com/pages/rampant-lion-field.php) + Facebook",
    lastScraped: "2026-09-14",
  },
  {
    id: "san-diego-airsoft-arena-el-cajon",
    name: "San Diego Airsoft & Gelball Arena",
    city: "El Cajon, CA",
    address: "415 Parkway Plaza, Unit 467, El Cajon, CA 92020",
    phone: "(619) 212-5416",
    website: "https://www.airsoftx.net",
    instagram: "https://www.instagram.com/sandiego.airsoftarena/",
    indoorOutdoor: "indoor",
    admission:
      "Standard admission $30; airsoft rental bundle + admission $60; gelball rental bundle + admission $45; private parties from $150.",
    about:
      "Mall-based indoor arena inside Parkway Plaza Mall offering airsoft, gel ball, laser tag, and Nerf play, plus a pro shop. Airsoft sessions Fri-Sun 12-5pm and 6-10pm.",
    status: "active",
    dataSource: "own website (airsoftx.net)",
    lastScraped: "2026-09-14",
  },
  {
    id: "sc-village-lakeside",
    name: "SC Village -- Lakeside (fka Giant San Diego Paintball and Airsoft Park)",
    city: "Lakeside, CA",
    address: "1800 Wildcat Canyon Rd, Lakeside, CA 92040",
    phone: "(562) 867-9600",
    website: "https://www.scvillage.com/pages/lakeside",
    ownerEmailDomain: "scvillage.com",
    facebook: "https://www.facebook.com/GiantSanDiego/",
    instagram: "https://www.instagram.com/giantsandiego/",
    indoorOutdoor: "outdoor",
    admission:
      "Entry only $30; rental package (entry + marker + mask) $50; party package for 10 guests $600 ($50/additional guest).",
    about:
      "San Diego County outdoor park with Concrete, Western, Castle, and a dedicated \"Airsoft City\" field. Open Sat-Sun 9am-4pm.",
    status: "active",
    dataSource: "own website (scvillage.com/pages/lakeside) + Yelp (not closed) + Facebook/Instagram under the legacy 'Giant San Diego' name",
    lastScraped: "2026-09-14",
  },
  {
    id: "paintball-park-camp-pendleton",
    name: "The Paintball Park at Camp Pendleton (Modern Airsoft Park)",
    city: "Oceanside, CA",
    address: "1700 Vandegrift Blvd, Oceanside, CA 92055",
    phone: "(866) 985-4932",
    website: "http://camppendleton.thepaintballpark.com",
    facebook: "https://www.facebook.com/CampPendletonAirsoftPark/",
    indoorOutdoor: "outdoor",
    admission:
      "Airsoft all-day access $50/person; self-equipped $25/person. Paintball priced separately ($20-69 depending on package and civilian vs. military status).",
    about:
      "Over 10 fields on Marine Corps Base Camp Pendleton offering both paintball and a dedicated \"Modern Airsoft Park\" airsoft arena. Airsoft open Sat-Sun 9am-4pm.",
    status: "active",
    dataSource: "mybaseguide.com + a Patch.com news article on the airsoft arena's opening + Facebook",
    lastScraped: "2026-09-14",
  },
  {
    id: "ambush-paintball-airsoft-moorpark",
    name: "Ambush Paintball & Airsoft Park",
    city: "Moorpark, CA",
    address: "8643 Shekell Rd, Moorpark, CA 93021",
    phone: "(805) 259-3200",
    website: "https://ambushpaintballpark.com",
    ownerEmailDomain: "ambushpaintballpark.com",
    facebook: "https://www.facebook.com/Ambushpaintballpark",
    instagram: "https://www.instagram.com/ambushpaintballpark/",
    youtube: "https://www.youtube.com/user/ambushpaintballpark",
    indoorOutdoor: "outdoor",
    admission:
      "Individual and group airsoft packages advertised on-site; specific rates on a separate pricing subpage, not itemized on the main page.",
    about:
      "Family-friendly, paintball-primary park in Moorpark (Ventura County) that also separately offers airsoft; hosts private groups, birthday/bachelor parties, and church/corporate events.",
    status: "active",
    dataSource: "own website (ambushpaintballpark.com)",
    lastScraped: "2026-09-14",
  },
  {
    id: "stryker-paintball-airsoft-santa-paula",
    name: "Stryker Paintball & Airsoft",
    city: "Santa Paula, CA",
    address: "17081 S Mountain Rd, Santa Paula, CA 93060",
    phone: "(805) 217-4029",
    website: "https://strykerpa.com",
    ownerEmailDomain: "strykerpa.com",
    facebook: "https://www.facebook.com/StrykerPaintballAirsoft/",
    instagram: "https://www.instagram.com/strykerpaintballandairsoft/",
    indoorOutdoor: "outdoor",
    admission:
      "Private party rate $55/person (or $30/person self-equipped) -- includes M4 rental, mask, 4 hours of play, and a dedicated host/referee; 10-player minimum.",
    about:
      "Paintball-primary Ventura County venue with an explicit, separately-priced airsoft offering. Open weekends 9am-4pm; also runs summer camps.",
    status: "active",
    dataSource: "own website (strykerpa.com)",
    lastScraped: "2026-09-14",
  },
  // ---- Colorado (added 2026-09-15) -----------------------------------
  {
    id: "fox-airsoft-parker",
    name: "Fox Airsoft (FAF Airsoft Field)",
    city: "Parker, CO",
    address: "11321 Dransfeldt Rd, Parker, CO 80134",
    phone: "1-888-316-7816",
    website: "https://foxairsoft.com",
    ownerEmailDomain: "foxairsoft.com",
    facebook: "https://www.facebook.com/DenverAirsoftField",
    instagram: "https://www.instagram.com/foxairsoft",
    indoorOutdoor: "outdoor",
    admission:
      "General admission $35; with equipment rental $65; birthday party package $325; annual pass $500.",
    about:
      "Colorado's largest branded airsoft operation, marketing itself as \"20 minutes from Denver.\" Runs the FAF (Flat Acres Farm) field -- a CQB area plus the \"Prison Field\" -- with Friday night games under lights and weekend open play, alongside an attached pro shop/retail arm and a gunsmithing brand (Fox Custom).",
    status: "active",
    dataSource: "own website (foxairsoft.com) + Tripadvisor 2026 reviews + active Instagram/Facebook accounts",
    lastScraped: "2026-09-15",
  },
  {
    id: "goairheads-erie",
    name: "GoAirheads",
    city: "Erie, CO",
    address: "4471 County Road 7, Erie, CO 80516",
    phone: "(303) 495-3233",
    website: "https://www.goairheads.com",
    ownerEmailDomain: "goairheads.com",
    facebook: "https://www.facebook.com/GoAirheads",
    instagram: "https://www.instagram.com/goairheads_co",
    youtube: "https://www.youtube.com/@goairheads_co",
    indoorOutdoor: "outdoor",
    about:
      "Outdoor airsoft field and pro shop over 10 acres serving the Denver metro area (physically in Erie, CO, though marketed in copy as a \"Denver\" field). Features walls, hideouts, barns, sniper positions and tactical terrain; hosts night games, tournaments, birthday parties and themed events.",
    status: "active",
    dataSource: "own website (goairheads.com), confirming a live Sept-Oct 2026 event schedule",
    lastScraped: "2026-09-15",
  },
  {
    id: "republic-shooting-range-avondale",
    name: "Republic Shooting Range",
    city: "Avondale, CO",
    address: "4960 44th Ln, Avondale, CO 81022",
    phone: "(719) 283-2010",
    website: "https://republicshootingrange.com",
    ownerEmailDomain: "republicshootingrange.com",
    facebook: "https://www.facebook.com/RepublicShootingRange",
    instagram: "https://www.instagram.com/republicshootingrange",
    indoorOutdoor: "indoor",
    admission:
      "All-day and half-day passes; equipment rentals; group/private booking rates available (exact figures not itemized on site).",
    about:
      "A large multi-discipline firearms range near Pueblo (pistol/rifle bays, steel range, clay courses) that also operates a dedicated \"Tactical Airsoft Shoothouse\" structure for team-building, training-scenario and recreational airsoft play, with rentals and private bookings.",
    status: "active",
    dataSource: "own website (republicshootingrange.com) + Yelp (updated December 2025) + Google/Facebook presence",
    lastScraped: "2026-09-15",
  },
  {
    id: "rocky-mountain-combat-parachute",
    name: "Rocky Mountain Combat",
    city: "Parachute, CO",
    address: "68 Cardinal Way, Parachute, CO 81635",
    phone: "(970) 989-4867",
    website: "https://rockymountaincombat.com",
    ownerEmailDomain: "rockymountaincombat.com",
    facebook: "https://www.facebook.com/1633242820259598",
    indoorOutdoor: "outdoor",
    admission:
      "Event/group-dependent (e.g. roughly $30/team for tournaments); reservation-only, 6-person group minimum.",
    about:
      "Multi-activity outdoor combat-sports venue serving the corridor from Grand Junction to Glenwood Springs. Offers airsoft (field guns/bio BBs only), paintball, laser tag and archery battles by reservation Monday-Saturday, catering to military, youth, corporate and private groups.",
    status: "active",
    dataSource: "own website (rockymountaincombat.com), confirmed live with a 2026 tournament listing, + Yelp",
    lastScraped: "2026-09-15",
  },
  {
    id: "dynamic-paintball-airsoft-aurora",
    name: "Dynamic Paintball and Airsoft",
    city: "Aurora, CO",
    address: "29701 E. Jewell Ave, Aurora, CO 80018",
    phone: "(303) 799-9911",
    website: "https://www.dynamicpaintball.com/airsoft",
    facebook: "https://www.facebook.com/DynamicPaintballCO",
    indoorOutdoor: "outdoor",
    admission:
      "Field fee $20/player all-day play; air fills $8; BB bag $15; $5 military discount on entry + BBs.",
    about:
      "Primarily a paintball park that runs a dedicated, separately priced airsoft program (own /airsoft page) historically on a monthly recurring schedule. Confirmed still operating via fresh 2026 reviews.",
    status: "active",
    dataSource: "own website (dynamicpaintball.com/airsoft) + Yelp (updated August 2026, 36 photos) + Tripadvisor 2026 reviews",
    lastScraped: "2026-09-15",
  },
  {
    id: "american-paintball-coliseum-aurora",
    name: "American Paintball Coliseum",
    city: "Aurora, CO",
    address: "27301 E Quincy Ave, Aurora, CO 80018",
    phone: "(303) 298-8573",
    website: "https://americanpaintballcoliseum.com/aurora-paintball-airsoft-fields/",
    ownerEmailDomain: "americanpaintballcoliseum.com",
    facebook: "https://www.facebook.com/people/American-Paintball-Coliseum/100063620077530/",
    instagram: "https://www.instagram.com/americanpaintballcoliseum",
    youtube: "https://www.youtube.com/c/AmericanPaintballColiseum",
    indoorOutdoor: "outdoor",
    about:
      "Large paintball-primary operator on a 10-acre outdoor site with an explicit, separately marketed airsoft offering, plus laser tag and axe throwing. Open 7 days a week. A same-named but unrelated location of this chain also operates in Phoenix, AZ (seeded separately).",
    status: "active",
    dataSource: "own website (americanpaintballcoliseum.com), confirmed live, + active Yelp/Instagram",
    lastScraped: "2026-09-15",
  },
  {
    id: "american-paintball-coliseum-colorado-springs",
    name: "American Paintball Coliseum",
    city: "Colorado Springs, CO",
    address: "834 Emory Cir, Colorado Springs, CO 80915",
    phone: "(719) 597-4796",
    website: "https://americanpaintballcoliseum.com/colorado-springs-indoor-paintball-airsoft-fields/",
    ownerEmailDomain: "americanpaintballcoliseum.com",
    facebook: "https://www.facebook.com/people/American-Paintball-Coliseum/100063620077530/",
    instagram: "https://www.instagram.com/americanpaintballcoliseum",
    youtube: "https://www.youtube.com/c/AmericanPaintballColiseum",
    indoorOutdoor: "indoor",
    about:
      "Second Colorado location of American Paintball Coliseum, run as an indoor paintball & airsoft facility distinct from the outdoor Aurora site, also offering axe throwing and laser tag. Open 7 days a week.",
    status: "active",
    dataSource: "own website (americanpaintballcoliseum.com), confirmed live, + Yelp",
    lastScraped: "2026-09-15",
  },
  {
    id: "blitz-paintball-airsoft-dacono",
    name: "Blitz Paintball and Airsoft",
    city: "Dacono, CO",
    address: "5340 Summit Blvd, Dacono, CO 80514",
    phone: "(303) 337-7109",
    website: "https://www.blitzpaintball.net",
    ownerEmailDomain: "blitzpaintball.net",
    facebook: "https://www.facebook.com/BLITZPAINTBALL",
    instagram: "https://www.instagram.com/blitzpaintballdenver",
    indoorOutdoor: "outdoor",
    admission:
      "All-inclusive (field access + rental gear + BBs): walk-on (1-4 players) $49.95; group (5-9) $44.95; group (10+) $42.95.",
    about:
      "Paintball-primary park near Denver (physically in Dacono, CO) that added a dedicated, purpose-built airsoft field called \"Fallujah\" (opened 2024) -- a 60,000 sq ft turfed close-urban-combat field with its own all-inclusive pricing tier, separate from paintball pricing.",
    status: "active",
    dataSource: "own website (blitzpaintball.net), confirmed live with dedicated airsoft pages, + Yelp (updated August 2026, 47 reviews)",
    lastScraped: "2026-09-15",
  },
  // ---- Connecticut (added 2026-09-16) ---------------------------------
  {
    id: "ground-zero-airsoft-usa-terryville",
    name: "Ground Zero Airsoft USA",
    city: "Terryville, CT",
    address: "243 Wolcott Rd, Terryville, CT 06786",
    phone: "(203) 879-7766",
    website: "https://groundzeroairsoftusa.com",
    ownerEmailDomain: "groundzeroairsoftusa.com",
    facebook: "https://www.facebook.com/Groundzeroairsoftusa",
    indoorOutdoor: "outdoor",
    admission:
      "Tiered player pricing ($19 / $39 / $59 per own site -- tiers appear to share near-identical inclusions, possibly stale copy, verify directly); special event scenario days $35 all day.",
    about:
      "Connecticut's largest outdoor airsoft field (roughly 50-65 acres), founded in 2002 with retail roots dating to 1999. Mixed terrain including a Vietnam-era-style firebase with trenches/bunkers and a built village area, plus a separate retail/service storefront in Waterbury. Runs regular open play plus scenario/event days.",
    status: "active",
    dataSource:
      "own website (groundzeroairsoftusa.com, incl. /contact/ and /pricing/) + AirsoftC3 + Tripadvisor + Facebook + connecticutexplorer.com",
    lastScraped: "2026-09-16",
  },
  {
    id: "final-shot-paintball-voluntown",
    name: "Final Shot Paintball (Airsoft Sunday)",
    city: "Voluntown, CT",
    address: "96 Ekonk Hill Rd, Voluntown, CT 06384",
    phone: "(860) 884-1682",
    website: "https://www.finalshotpaintball.com",
    ownerEmailDomain: "finalshotpaintball.com",
    facebook: "https://www.facebook.com/finalshotairsoft/",
    instagram: "https://www.instagram.com/finalshotpaintball/",
    indoorOutdoor: "outdoor",
    admission:
      "Open-play package roughly $58/person (500 paintballs, marker, air, mask, up to 6 hrs) for paintball; airsoft runs as its own scheduled \"Airsoft Sunday,\" 12pm-5pm.",
    about:
      "Primarily a paintball park near Foxwoods/Mohegan Sun that explicitly and separately schedules airsoft as its own weekly offering (\"Airsoft Sunday\"), with a dedicated Facebook page distinct from the paintball page. Offers private party/group packages for both sports.",
    status: "active",
    dataSource:
      "own website (finalshotpaintball.com) + Yelp (updated June 2026) + dedicated Facebook (finalshotairsoft) + Instagram",
    lastScraped: "2026-09-16",
  },
  // ---- Delaware (added 2026-09-17) -------------------------------------
  {
    id: "chaos-corps-airsoft-georgetown",
    name: "Chaos Corps Airsoft",
    city: "Georgetown, DE",
    address: "18181 Asketum Branch Rd, Georgetown, DE 19947",
    phone: "(302) 500-2027",
    website: "https://www.chaoscorpsairsoft.com",
    ownerEmailDomain: "chaoscorpsairsoft.com",
    facebook: "https://www.facebook.com/chaoscorpsairsoft",
    instagram: "https://www.instagram.com/chaos_corps_airsoft/",
    indoorOutdoor: "outdoor",
    admission:
      "No flat general-admission price published -- runs on a scheduled \"Day of Play\"/walk-on calendar. M4 platform rental $30 (includes 1,000 BBs + full-face eye protection); onsite tech service free for basic fixes, $25+ for advanced gearbox work; concessions $1-$6.50.",
    about:
      "Outdoor airsoft operation hosted on the Precision Paintball grounds in Georgetown, running scheduled Day-of-Play and walk-on game dates roughly every two weeks. Publishes a full field rulebook (FPS/MED limits, semi-auto-only defaults, engagement rules), offers rental gear and an onsite weapons technician. Direct successor to Sussex County's longtime field, 911 Airsoft, which closed and pointed its community toward Precision Paintball starting April 12, 2026.",
    status: "active",
    dataSource:
      "own website (chaoscorpsairsoft.com -- home, calendar, services, field-rules, team pages) + corroborating 911airsoft.com closure notice pointing to the same location/date + Facebook/Instagram presence",
    lastScraped: "2026-09-17",
  },
  {
    id: "airsoft-action-field-georgetown",
    name: "Airsoft Action Field",
    city: "Georgetown, DE",
    address: "23735 French Rd, Georgetown, DE 19947",
    phone: "(626) 698-2246",
    indoorOutdoor: "outdoor",
    about:
      "A roughly 4-acre outdoor airsoft field in Georgetown advertised with reconfigurable field layouts and \"inter-active vehicles,\" plus an on-site supply shop.",
    status: "active",
    dataSource:
      "AirsoftC3 field listing (self-reported, last updated 2023-08-30, still listed on AirsoftC3's current DE fields page) + Chamber of Commerce/Cylex/HighSpeedBBs directory mirrors (appear to derive from the same underlying data, not independent confirmations) + a standalone SBA/PPP business registration record",
    lastScraped: "2026-09-17",
  },
  {
    id: "consurgent-airsoft-field-laurel",
    name: "Consurgent Airsoft Field",
    city: "Laurel, DE",
    indoorOutdoor: "outdoor",
    about:
      "A team-run airsoft field near Laurel maintained by the Consurgent airsoft team, hosting free games roughly every other weekend and coordinating scheduling with other local Delaware fields.",
    status: "active",
    dataSource:
      "AirsoftC3 field listing only -- still listed on AirsoftC3's current Delaware fields page; no independent website, address, phone, or social presence found anywhere else",
    lastScraped: "2026-09-17",
  },
  // ---- Hawaii (added 2026-09-18) ---------------------------------------
  {
    id: "aloha-paintball-airsoft-kapolei",
    name: "Aloha Paintball & Airsoft",
    city: "Kapolei, HI",
    address: "194 Mumba Street, Kapolei, HI 96707",
    phone: "(808) 855-7388",
    website: "https://alohapaintball.com",
    facebook: "https://www.facebook.com/p/Aloha-Paintball-and-Airsoft-61582794597366/",
    instagram: "https://www.instagram.com/aloha_paintball",
    indoorOutdoor: "outdoor",
    admission:
      "Airsoft: own equipment $35/player; rental package $75/player (all-day play, air, protective gear, rifle, magazines, chest protection). Group minimums roughly $800 for airsoft. Public sessions Sat-Sun 10am-4pm (check-in 9:45am); private events any day by request.",
    about:
      "Outdoor multi-field paintball and airsoft park in Kapolei, Oahu, recently rebuilt with an online booking system. Airsoft is explicitly sold as a distinct, separately priced offering from paintball, marketed for tactical-movement/team-coordination games with realistic replica rifles. Also hosts birthday parties, bachelor/bachelorette events, and corporate team-building.",
    status: "active",
    dataSource:
      "own website (alohapaintball.com, live, current pricing/hours) + Yelp under predecessor brand \"Extreme Sports Complex\" (updated July 2026, 58 reviews, not marked closed) + Facebook activity",
    lastScraped: "2026-09-18",
  },
  {
    id: "k1-airsoft-kailua",
    name: "K1 Airsoft",
    city: "Kailua, HI",
    address: "905 Kalanianaole Hwy, Kailua, HI 96734",
    phone: "(808) 348-5913",
    website: "https://k1airsoft.com",
    ownerEmailDomain: "k1airsoft.com",
    facebook: "https://www.facebook.com/p/K1-Airsoft-61554745231074/",
    instagram: "https://www.instagram.com/k1airsoft",
    indoorOutdoor: "outdoor",
    admission:
      "Standard field fee roughly $30; M4 AEG rental $40. Regular play Saturday 10am-4pm; scheduled \"AFTERDARK\" night games Saturday 5pm-10pm.",
    about:
      "Self-described \"Hawaii's Premier Urban and Outdoor Airsoft Field\" in Kailua, Oahu, combining a playable outdoor/urban-terrain field with an on-site retail shop and equipment rentals (also sells used airsoft guns). Offers regular Saturday open play plus scheduled after-dark night games.",
    status: "active",
    dataSource:
      "own website (k1airsoft.com, live, current pricing/hours) + Yelp (updated July 2026, not marked closed) + Instagram (active)",
    lastScraped: "2026-09-18",
  },
  {
    id: "epowersports-battlezone-honolulu",
    name: "Epowersports BATTLEZONE",
    city: "Honolulu, HI",
    address: "1320 Kalani St, Unit 105, Honolulu, HI 96817",
    phone: "(808) 369-7700",
    website: "https://epowersports.square.site",
    facebook: "https://www.facebook.com/epowersports/",
    instagram: "https://www.instagram.com/epowersports_battlezone",
    indoorOutdoor: "indoor",
    about:
      "Self-described \"Hawaii's only indoor airsoft CQB arena,\" run by longtime Oahu airsoft/tactical retailer Epowersports Inc. Combines a retail airsoft gun shop with an indoor close-quarters-battle arena offering scheduled matches, beginner-friendly events, and private party bookings. Hours per third-party listing: Tue-Sun 10am-6pm (Wed & Sat until 8pm), closed Monday.",
    status: "active",
    dataSource:
      "own website (epowersports.square.site, reachable) + Yelp (updated August 2026, 32 reviews, current address, not marked closed) + Yahoo Local/Wheree directory corroboration",
    lastScraped: "2026-09-18",
  },
  {
    id: "garden-isle-airsoft-kalaheo",
    name: "Garden Isle Airsoft",
    city: "Kalaheo, HI",
    indoorOutdoor: "outdoor",
    about:
      "The only airsoft venue identified on Kauai -- a woodland outdoor field reportedly located next to Kekaha Small Boat Harbor. Referenced in the AirsoftC3 field directory and discussed on an Airsoft Society forum thread as Kauai's known field.",
    status: "active",
    dataSource:
      "AirsoftC3 field directory (still listed on the current Hawaii fields page) + Facebook page existence (facebook.com/KauaiAirsoft) + Airsoft Society forum thread",
    lastScraped: "2026-09-18",
  },
  // ---- Idaho (added 2026-09-19) ----------------------------------------
  {
    id: "cqb-underground-bonners-ferry",
    name: "CQB Underground",
    city: "Bonners Ferry, ID",
    address: "6426 Kootenai St, Unit B, Bonners Ferry, ID 83805",
    phone: "(208) 267-8887",
    website: "https://www.cqbunderground.com",
    ownerEmailDomain: "cqbunderground.com",
    facebook: "https://www.facebook.com/CQBunderground",
    instagram: "https://www.instagram.com/cqbunderground",
    indoorOutdoor: "indoor",
    admission:
      "Roughly $25 play + $15 gear rental (per 2021 opening figures); own site also lists membership and private-rental options.",
    about:
      "Indoor CQB airsoft arena (~9,000 sq ft) in downtown Bonners Ferry, opened August 2021. Combines a playing arena with a retail counter selling guns, gear, BBs, and accessories; offers open play, private event rentals, and a membership program.",
    status: "active",
    dataSource:
      "own website (cqbunderground.com, live) + Bonners Ferry Herald 2021 feature + Yelp (updated July 2026, no closed tag) + AirsoftC3",
    lastScraped: "2026-09-19",
  },
  {
    id: "homestead-airsoft-bonners-ferry",
    name: "Homestead Airsoft (Bonner's Airsoft)",
    city: "Bonners Ferry, ID",
    address: "828 Pywell Rd, Bonners Ferry, ID 83805",
    phone: "(704) 315-5831",
    facebook: "https://www.facebook.com/groups/bonnersairsoft/",
    indoorOutdoor: "outdoor",
    admission: "Free / donation-based; 30-player cap, RSVP required; free rental gear sometimes available.",
    about:
      "A free, community-run outdoor airsoft field in Bonners Ferry operating on a donation model rather than as a commercial storefront. Distinct from CQB Underground (different address/operators), though both serve the same small North Idaho community.",
    status: "active",
    dataSource:
      "AirsoftC3 listing (last updated 2023-08-30) + an independent yolasite.com site describing the same free/RSVP model at the same address + the group's own Facebook group",
    lastScraped: "2026-09-19",
  },
  {
    id: "advantage-airsoft-rigby",
    name: "Advantage Airsoft (Advantage Professional Training)",
    city: "Rigby, ID",
    address: "418 N 4014 E, Suite 6, Rigby, ID 83442",
    phone: "(208) 419-7960",
    website: "https://advprotraining.com",
    ownerEmailDomain: "advprotraining.com",
    facebook: "https://www.facebook.com/AdvantageAirsoftLLC",
    instagram: "https://www.instagram.com/advantageairsoft",
    indoorOutdoor: "indoor",
    about:
      "East Idaho's largest indoor airsoft venue (a 4,500 sq ft CQB arena called \"The Factory\"), originally opened in Menan in Feb 2019 before relocating to Rigby's old sugar factory/mill building. Also runs a secondary/outdoor field called \"Midway.\" Owners also run a Halloween haunted-house attraction and law-enforcement active-shooter training in the same space.",
    status: "active",
    dataSource:
      "own website (advprotraining.com, live product pages) + East Idaho News feature (Sept 2024) + a confirmed Aug 2025 event listing (AllEvents.in) + Boise Gun Club directory mirror (58 reviews, 5.0 stars)",
    lastScraped: "2026-09-19",
  },
  {
    id: "reapers-den-airsoft-pocatello",
    name: "Reaper's Den Airsoft (at LS Armory)",
    city: "Pocatello, ID",
    address: "7804 W Katsilometes Rd, Pocatello, ID 83204",
    phone: "(208) 530-5503",
    facebook: "https://www.facebook.com/reaperdenairsoft",
    instagram: "https://www.instagram.com/reapersden_airsoft_arena",
    indoorOutdoor: "indoor",
    about:
      "Airsoft arena and retail shop built out from an existing firearms training/gun range business (LS Armory), opened January 2025. Has both a 10,000 sq ft outdoor area and a 3,600 sq ft indoor arena, with the indoor side the more heavily promoted current offering. Retail shop hours Tue-Sat noon-7pm (till midnight Fri/Sat); arena open play Wed/Thu 6pm-midnight (including free pizza nights).",
    status: "facebook_only",
    dataSource:
      "Idaho State Journal news article (2025-01-27) + Pocatello-Chubbuck Chamber of Commerce (listed under LS Armory) + TikTok/Instagram + Boise Gun Club directory mirror",
    lastScraped: "2026-09-19",
  },
  {
    id: "air-combat-battlefield-burley",
    name: "Air Combat Battlefield",
    city: "Burley, ID",
    address: "1050 E 5th Street, Burley, ID 83318",
    phone: "(208) 650-3678",
    website: "https://www.aircombatbattlefield.com",
    ownerEmailDomain: "aircombatbattlefield.com",
    facebook: "https://www.facebook.com/aircombatbattlefield",
    indoorOutdoor: "outdoor",
    admission: "$20 newcomer rental package (M4, goggles, mask, vest, 2 mags); $2 magazine refills.",
    about:
      "Outdoor airsoft battlefield (also offers laser tag) in Burley, south-central Idaho, serving the East Idaho Airsoft community. Open for general gameplay most Saturday afternoons, plus scheduled events.",
    status: "active",
    dataSource:
      "own website (aircombatbattlefield.com, live) + East Idaho Airsoft's own \"Fields\" page + YouTube gameplay footage + Boise Gun Club/Vymaps directory entries agreeing on address and phone",
    lastScraped: "2026-09-19",
  },
  {
    id: "pyrrhic-tactical-sports-nampa",
    name: "Pyrrhic Tactical Sports",
    city: "Nampa, ID",
    address: "2104 Caldwell Blvd, Nampa, ID 83651",
    phone: "(208) 629-6229",
    website: "https://www.pyrrhicpaintball.com",
    ownerEmailDomain: "pyrrhicpaintball.com",
    instagram: "https://www.instagram.com/pyrrhicpaintball",
    indoorOutdoor: "indoor",
    admission: "Booked via strideevents.com; walk-on and party packages.",
    about:
      "The indoor half of the Pyrrhic Tactical Sports brand, billed as \"Idaho's first dedicated indoor Airsoft arena\" -- 4 themed arenas with tracer-tagged guns, alongside laser tag, Nerf, gel-blaster, and VR games in a Nampa storefront. Formally welcomed via a Nampa Chamber of Commerce ribbon-cutting.",
    status: "active",
    dataSource:
      "own website (pyrrhicpaintball.com / lasertagidaho.com) + Nampa Chamber of Commerce ribbon-cutting listing + strideevents.com booking integration",
    lastScraped: "2026-09-19",
  },
  {
    id: "pyrrhic-paintball-caldwell",
    name: "Pyrrhic Paintball",
    city: "Caldwell, ID",
    address: "11809 Ustick Rd, Caldwell, ID 83605",
    phone: "(208) 629-6229",
    website: "https://www.paintballboise.com",
    ownerEmailDomain: "pyrrhicpaintball.com",
    instagram: "https://www.instagram.com/pyrrhicpaintball",
    indoorOutdoor: "outdoor",
    admission: "Airsoft \"Birthday Party\" packages and \"Airsoft Walk-Ons\" (2-3 hr sessions), booked via strideevents.com.",
    about:
      "Self-described \"Idaho's #1 Paintball & Airsoft Park\" -- a multi-field outdoor recreation site outside Caldwell offering both paintball and dedicated, separately-priced airsoft sessions and parties. Hours: Sat 10am-8pm, Sun 12-6pm, weekdays by reservation.",
    status: "active",
    dataSource:
      "own website (paintballboise.com / pyrrhicpaintball.com) + Yelp (updated September 2026, not marked closed) + Yellow Pages",
    lastScraped: "2026-09-19",
  },
  // ---- Maine (added 2026-09-19) -----------------------------------------
  {
    id: "harris-farm-airsoft-dayton",
    name: "Harris Farm Airsoft Field",
    city: "Dayton, ME",
    address: "271 Buzzell Road, Dayton, ME",
    website: "https://www.harrisairsoft.com",
    facebook: "https://www.facebook.com/HarrisAirsoft/",
    indoorOutdoor: "outdoor",
    about:
      "Well-known 55-acre outdoor Maine field known as \"the SugarHouse,\" across from Harris Farm Store. Mature trees, hills, gullies, brooks, swamps, a 200-ft firing range, and high-walled CQB buildings. Seasonal (closed for winter).",
    status: "active",
    dataSource:
      "own website (harrisairsoft.com, reachable, active dated 2026 events calendar through Sep 26, 2026) + Facebook",
    lastScraped: "2026-09-19",
  },
  {
    id: "coles-farm-airsoft-dayton",
    name: "Coles Airsoft (Coles Family Farm)",
    city: "Dayton, ME",
    address: "492 River Road, Dayton, ME",
    website: "https://www.colesairsoft.com",
    facebook: "https://www.facebook.com/colesairsoft/",
    indoorOutdoor: "outdoor",
    about:
      "58-acre outdoor airsoft operation run on Coles Family Farm property. Mature and new-growth trees, hills, gullies, brooks, a pond, trenches, forts, trails, bridges, and a 200-ft firing range. Distinct address and ownership from Harris Farm Airsoft, despite both being small airsoft operations in the same town of Dayton, ME.",
    status: "active",
    dataSource:
      "own website (colesairsoft.com, reachable) + a dated \"D-Day 2025\" event page (June 6-7, 2025) + active Events list (Fall Swap Meet, ProLeague 05, and others) + Facebook",
    lastScraped: "2026-09-19",
  },
  {
    id: "sass-linneus",
    name: "Southern Aroostook Action Sports (SASS)",
    city: "Linneus, ME",
    address: "133 Codfish Ridge Rd, Linneus, ME 04730",
    phone: "(207) 694-8409",
    website: "https://www.saasmaine.com",
    facebook: "https://www.facebook.com/SAASMAINE/",
    indoorOutdoor: "outdoor",
    about:
      "Multi-activity outdoor sports park in Aroostook County spanning roughly 26-30 acres of woodland, marshes, open fields, and CQB areas. Branded \"Airsoft | Paintball | NERF\" -- airsoft is a genuine, actively-marketed core offering here, not an afterthought to paintball. Operates every Sunday between Memorial Day weekend and early November, plus occasional Saturday private/special events.",
    status: "active",
    dataSource:
      "own website (saasmaine.com, reachable) + Bangor Daily News feature (Jun 30, 2024, on the field expanding) + The County newspaper feature (Jul 1, 2024) + Facebook",
    lastScraped: "2026-09-19",
  },
  // ---- Michigan (additional field added 2026-09-19) --------------------
  {
    id: "fortify-ranch-airsoft-white-lake",
    name: "Fortify Ranch Airsoft",
    city: "White Lake, MI",
    address: "7600 Hitchcock Rd, White Lake, MI 48383",
    facebook: "https://www.facebook.com/p/Fortify-Ranch-Airsoft-61576696365156/",
    instagram: "https://www.instagram.com/fortifyranch/",
    tiktok: "https://www.tiktok.com/@fortify.ranch",
    indoorOutdoor: "outdoor",
    admission: "$40/player per documented 2025 fundraiser event (includes 1,000 BBs and lunch); reconfirm before treating as standard/current pricing",
    about:
      "Airsoft program run on the grounds of Fortify Ranch, a horse rescue and equestrian facility (rescues, rehabilitates, and rehomes horses). Airsoft events have included fundraisers for the ranch's rescue work, held on a western-style village field noted as under construction as of mid-2025.",
    status: "active",
    dataSource:
      "Michael (project owner) confirmed field is currently active as of 2026-09-19 + a documented June 29, 2025 fundraiser event (AllEvents.in) + the ranch's own Weebly site (confirms address, no airsoft program mentioned there -- airsoft appears to be a separately-branded program/Facebook page at the same physical property)",
    lastScraped: "2026-09-19",
  },
  {
    id: "weekend-warriors-paintball-alpine",
    name: "Weekend Warriors Paintball",
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
      "Long-running San Diego-area outdoor field offering paintball, airsoft, and Paintball Lite (a modified format for younger players). Not the same venue as Atlas's Camp Pendleton entry, despite Combat Field Finder listing this address under the name \"Modern Airsoft Park\" -- that name belongs to a real, separately-sourced on-base arena at Camp Pendleton (Oceanside), about 50 miles from here. Named plainly here to avoid confusion between the two.",
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
      "Outdoor tactical scenario park near Spokane offering both paintball and airsoft. Atlas's first Washington field. Yelp lists this business as \"CLOSED\" -- that's stale; the site itself is live and current, including an active fire-season pyro restriction notice and live event ticket pages.",
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
    indoorOutdoor: "outdoor",
    admission: "See site /openplay for current schedule/pricing",
    about:
      "Active airsoft field with its own site (schedule + contact pages live), plus active Facebook, Instagram, and TikTok. Address sourced from independent directory mirrors (find-open.com, nnacademy.com) since the site's own /contact page was blocked by robots.txt during research -- worth a quick manual glance against the live site.",
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
      "Atlas's first New Jersey field. 110-acre facility with 9 fields, operating since 1993 under recently new ownership (\"Family Owned Family Operated Family Friendly Airsoft and Paintball\"). Some third-party listings tag this as \"Berlin, NJ\" (an adjacent town) -- resolved via the business's own site, which gives Winslow Township.",
    status: "active",
    dataSource: "website",
    lastScraped: "2026-09-16",
  },
  // ---- Kentucky (additional field added 2026-09-17) ---------------------
  {
    id: "black-mountain-airsoft-milton",
    name: "Black Mountain Airsoft",
    city: "Milton, KY",
    address: "234 Campbell Hill Rd, Milton, KY 40045",
    phone: "(502) 269-5422",
    facebook: "https://www.facebook.com/groups/blackmountainairsoft/",
    indoorOutdoor: "outdoor",
    admission: "Free/donation-based -- explicitly run as a not-for-profit \"free place to play for the community\" per the field's own GoFundMe campaign",
    about:
      "Veteran-owned, not-for-profit community airsoft field with wooded sections, open fields, buildings, and a village area, built and maintained largely through volunteer community workdays. Hosts organized milsim events, including a multi-day NATO vs. Soviet campaign (\"Operation Crimson Relic\") scheduled May 22-24, 2026.",
    status: "active",
    dataSource:
      "GoFundMe campaign (field improvement fundraiser, confirms address/phone/mission) + AllEvents.in listings for a dated 2025 community build day and a dated May 2026 milsim event + Facebook group",
    lastScraped: "2026-09-17",
  },
  // ---- Maryland (added 2026-09-18) ---------------------------------------
  {
    id: "replay-airsoft-baltimore",
    name: "Replay Airsoft",
    city: "Baltimore, MD",
    address: "6801 Eastern Ave, Suite 118, Baltimore, MD 21224",
    website: "https://www.replayairsoft.com",
    facebook: "https://www.facebook.com/ReplayAirsoft/",
    instagram: "https://www.instagram.com/replayairsoft/",
    indoorOutdoor: "indoor",
    admission:
      "Not independently confirmed (own site rate-limited automated fetches during research); markets itself as \"Maryland's BIGGEST indoor arena\" with free protective gear included and a half-price Thursday military/first-responder promo",
    about:
      "Indoor CQB airsoft arena, recently relocated to this Eastern Ave, Baltimore address per Michael. Protective gear included free with admission; runs military/first-responder discount promotions.",
    status: "active",
    dataSource:
      "supplied directly by Michael (address, hours, website) + Facebook/X/Instagram corroboration",
    lastScraped: "2026-09-18",
  },
  {
    id: "robinhood-adventure-park-havre-de-grace",
    name: "Robinhood Adventure Park",
    city: "Havre de Grace, MD",
    address: "2429 Old Robinhood Rd, Havre de Grace, MD 21078",
    phone: "(410) 838-6856",
    website: "https://www.robinhoodadventurepark.com",
    indoorOutdoor: "outdoor",
    admission: "Airsoft walk-on ~$25 online / $30 at door; rental package +$30",
    about:
      "Combined paintball/airsoft/gel blaster/Nerf/laser tag outdoor adventure park -- 10 acres of themed fields plus 35 additional acres for larger airsoft operations. Successor business to the now-closed East Coast Airsoft Arena (Bel Air/Forest Hill), under the same ownership.",
    status: "active",
    dataSource:
      "own website (robinhoodadventurepark.com) + VisitMaryland listing + Patch news coverage of its opening + Facebook",
    lastScraped: "2026-09-18",
  },
  {
    id: "southern-maryland-paintball-newburg",
    name: "Southern Maryland Paintball (SMP)",
    city: "Newburg, MD",
    address: "11272 Edge Hill Rd, Newburg, MD 20664",
    phone: "(240) 419-9626",
    website: "https://www.southernmdpaintball.com/airsoft-at-smp/",
    indoorOutdoor: "outdoor",
    about:
      "Paintball-primary outdoor venue (also offers axe throwing) with a genuine, dedicated separate airsoft program and field, confirmed via its own site's dedicated airsoft page. Sister location to North East Adventure Paintball & Airsoft (below); both cross-promote a shared 2026 event calendar.",
    status: "active",
    dataSource:
      "own website (dedicated /airsoft-at-smp/ page) + a 2026 summer camp/event listing (sportscarnival.com) + an Axcitement feature (May 2026)",
    lastScraped: "2026-09-18",
  },
  {
    id: "nr-adventure-park-taneytown",
    name: "NR Adventure Park",
    city: "Taneytown, MD",
    address: "3939 Old Taneytown Rd, Taneytown, MD 21787",
    phone: "(410) 756-4200",
    website: "https://www.nradventurepark.com",
    indoorOutdoor: "outdoor",
    about:
      "26+ acre outdoor paintball and airsoft park with woodsball, military, urban, and turf fields. This address previously operated as \"Paintball Adventure Park\" (now shown closed on Yelp) and separately absorbed the customer base of the now-closed Route 40 Paintball Park (White Marsh) -- NR's own site runs a page titled \"Route 40 Paintball Closed? Play at NR Adventure Park!\" Genuine, separate airsoft offering alongside paintball.",
    status: "active",
    dataSource:
      "own website (nradventurepark.com) + Yelp (updated May 2026) + Tripadvisor (active 2026 reviews) + Facebook",
    lastScraped: "2026-09-18",
  },
  {
    id: "north-east-adventure-paintball-airsoft",
    name: "North East Adventure Paintball & Airsoft (NEA)",
    city: "North East, MD",
    address: "2235 Pulaski Hwy, North East, MD 21901",
    phone: "(667) 365-0351",
    website: "https://www.neapaintball.com",
    indoorOutdoor: "outdoor",
    about:
      "Outdoor venue in Cecil County offering paintball, airsoft, and GellyBall as distinct activities across 5 dedicated field configurations. Sister location to Southern Maryland Paintball (above); the two cross-promote a shared 2026 event calendar.",
    status: "active",
    dataSource: "own website (neapaintball.com) + Facebook",
    lastScraped: "2026-09-18",
  },
  {
    id: "tactical-airsoft-arena-rockville",
    name: "Tactical Airsoft Arena (Rockville)",
    city: "Rockville, MD",
    address: "20B Southlawn Court, Rockville, MD 20850",
    phone: "(301) 838-7474",
    website: "https://www.tacticalairsoftarena.com",
    facebook: "https://www.facebook.com/tacticalairsoftarena/",
    instagram: "https://www.instagram.com/tacticalairsoftarena/",
    indoorOutdoor: "indoor",
    admission:
      "$28 admission / $25 rental / $47 all-weekend pass; 20% military/first-responder discount",
    about:
      "The original/flagship location (opened 2008) of a two-location Maryland/Virginia indoor CQB airsoft arena chain -- the sister Manassas, VA location (opened 2018, see tactical-airsoft-arena-manassas) shares this same website and social accounts. Private parties and organized play; a CBS Baltimore feature named it among the \"Best Paintball Arenas Near Baltimore.\"",
    status: "active",
    dataSource:
      "own website (tacticalairsoftarena.com, shared chain site) + Yelp (updated August 2026, 75 reviews) + CBS Baltimore feature + Facebook/Instagram",
    lastScraped: "2026-09-18",
  },
  {
    id: "outdoor-xtreme-chesapeake-city",
    name: "Outdoor Xtreme Chesapeake City Paintball & Airsoft (OXCC)",
    city: "Chesapeake City, MD",
    address: "2941 Old Telegraph Rd, Chesapeake City, MD 21915",
    phone: "(410) 885-5555",
    website: "https://www.oxcc.com",
    indoorOutdoor: "outdoor",
    admission: "Airsoft walk-ons Saturday and Sunday; private parties available weekdays by arrangement",
    about:
      "Outdoor venue in Cecil County offering paintball, airsoft, and GellyBall as genuinely separate activities, with rental equipment available. Part of the multi-state \"Outdoor Xtreme\" chain (see also Outdoor Xtreme Hatfield & Linglestown, PA, and the other Outdoor Xtreme locations added below).",
    status: "active",
    dataSource:
      "own website (oxcc.com, confirmed reachable) + Yelp (updated June 2026) + Tripadvisor (active 2026 listing) + YouTube",
    lastScraped: "2026-09-18",
  },

  // ---- Outdoor Xtreme chain, remaining locations (added 2026-09-20) -------
  // Michael flagged outdoorxtreme.com directly; PA (Hatfield, Linglestown) and
  // MD (Chesapeake City) were already seeded above from earlier state batches.
  {
    id: "outdoor-xtreme-angelica",
    name: "Outdoor Xtreme Angelica",
    city: "Angelica, NY",
    address: "5907 Van Allen Rd, Angelica, NY 14709",
    phone: "585-808-3496",
    email: "info@oxparks.com",
    website: "https://www.oxangelica.com",
    indoorOutdoor: "outdoor",
    admission:
      "$55 walk-on airsoft package (all-day admission, rental rifle/mask/red rag, 1,500 BBs), airsoft weekends are the 1st and 3rd of each month; private parties $400 weekend / $450 weekday for up to 10 players (2 hrs), additional players $40 + tax",
    about:
      "New York location of the multi-state Outdoor Xtreme paintball/airsoft chain (also operating in MD, PA x2, FL x2, SC, and TX). 30 acres with outdoor/woodsball and indoor fields.",
    status: "active",
    dataSource: "own website (oxangelica.com) + Yelp + Tripadvisor + Facebook",
    lastScraped: "2026-09-20",
  },
  {
    id: "outdoor-xtreme-orlando",
    name: "Outdoor Xtreme Orlando",
    city: "Orlando, FL",
    address: "1251 S Co Rd 13, Orlando, FL 32833",
    phone: "(772) 643-5498",
    email: "info@oxparks.com",
    website: "https://www.oxorlando.com",
    indoorOutdoor: "outdoor",
    admission:
      "Airsoft walk-on play Saturday-Sunday 10am-5pm (walk-on price not published on-site); private parties $400 weekend / $450 weekday for up to 10 players (2 hrs), additional players $40 + tax",
    about:
      "Florida location of the multi-state Outdoor Xtreme paintball/airsoft chain (also operating in NY, MD, PA x2, FL/Hudson, SC, and TX). 28-acre outdoor park.",
    status: "active",
    dataSource: "own website (oxorlando.com) + Yelp + Tripadvisor",
    lastScraped: "2026-09-20",
  },
  {
    id: "outdoor-xtreme-hudson",
    name: "Outdoor Xtreme Hudson",
    city: "Hudson, FL",
    address: "11122 Houston Ave, Hudson, FL",
    phone: "(727) 862-2222",
    email: "info@oxparks.com",
    website: "https://www.oxhudson.com",
    indoorOutdoor: "outdoor",
    admission:
      "Airsoft walk-ons every Saturday and Sunday (walk-on price not published on-site); private parties Sat/Sun (10am, 12:30pm, 3pm slots) $400 weekend / $450 weekday for up to 10 players (2 hrs, includes rental gun, mask, 600 BBs/player), additional players $40 + tax, ages 10+",
    about:
      "Second Florida location of the Outdoor Xtreme chain (also operating in NY, MD, PA x2, FL/Orlando, SC, and TX). 19 acres with a mounds field, woodsball, and hyper pipe.",
    status: "active",
    dataSource: "own website (oxhudson.com) + Yelp + Battleonix",
    lastScraped: "2026-09-20",
  },
  {
    id: "outdoor-xtreme-seven-points",
    name: "Outdoor Xtreme Seven Points",
    city: "Seven Points, TX",
    address: "700 E Cedar Creek Pkwy, Seven Points, TX 75143",
    phone: "(903) 284-2541",
    email: "info@oxparks.com",
    website: "https://www.oxsevenpoints.com",
    indoorOutdoor: "outdoor",
    admission:
      "$25 all-day walk-on with own equipment / $55 with rental (rifle, mask, red rag, 1,500 BBs), walk-ons every Saturday and Sunday 10am-5pm; private parties $400 weekend / $450 weekday (+$50 weekday staffing surcharge) for up to 10 players (2 hrs), additional players $40 + tax, ages 10+",
    about:
      "Texas location of the multi-state Outdoor Xtreme chain (also operating in NY, MD, PA x2, FL x2, and SC), formerly known as Whatz-Up Paintball. 40+ acres; airsoft was newly added to this location.",
    status: "active",
    dataSource: "own website (oxsevenpoints.com) + Facebook (formerly Whatz-Up Paintball) + Trip.com",
    lastScraped: "2026-09-20",
  },
  {
    id: "outdoor-xtreme-charleston",
    name: "Outdoor Xtreme Charleston",
    city: "Moncks Corner, SC",
    address: "239 Cypress Gardens Rd, Moncks Corner, SC 29461",
    phone: "(843) 552-1115",
    email: "info@oxparks.com",
    website: "https://www.oxcharleston.com",
    indoorOutdoor: "outdoor",
    admission:
      "Airsoft walk-ons Saturday or Sunday 9am-4pm (walk-on price not published on-site); an \"Airsoft VIP\" pass offers 12 admissions for $225, valid weekends; weekday private parties by reservation",
    about:
      "South Carolina location of the multi-state Outdoor Xtreme chain (also operating in NY, MD, PA x2, FL x2, and TX), formerly known as Paintball Charleston -- marketed as \"Charleston\" but physically located in Moncks Corner, SC. 20+ acres with 9 playing fields; a newly-acquired location per the chain's own site.",
    status: "active",
    dataSource: "own website (oxcharleston.com) + Facebook (formerly Paintball Charleston)",
    lastScraped: "2026-09-20",
  },
  {
    id: "paintball-sportsland-frederick",
    name: "Paintball Sportsland, Inc.",
    city: "Frederick, MD",
    address: "10418 Old Liberty Rd, Frederick, MD 21701",
    facebook: "https://www.facebook.com/PBSLINC",
    indoorOutdoor: "outdoor",
    about:
      "\"Paintball and Airsoft games every weekend, year round\" per the business's own description. Operates rain or shine.",
    status: "facebook_only",
    dataSource:
      "Yelp (updated May 2026) + Tripadvisor (active 2026 reviews) + Nextdoor + Facebook -- own website (paintball-sportsland.com) returned a 503 server error on every fetch attempt across multiple retries during this research",
    lastScraped: "2026-09-18",
  },
  {
    id: "elite-gaming-delmarva-salisbury",
    name: "Elite Gaming Delmarva",
    city: "Salisbury, MD",
    address: "337 Civic Ave, Salisbury, MD 21804",
    facebook: "https://www.facebook.com/Elitegamingdelmarva/",
    indoorOutdoor: "indoor",
    admission: "Party packages from $350/2hrs for 12 people, ages 12+",
    about:
      "Indoor airsoft CQB arena on the Eastern Shore/Delmarva Peninsula, marketed as new to the Salisbury area. Books via an online Square scheduling page rather than its own site directly.",
    status: "facebook_only",
    dataSource:
      "live Square booking page (square.site/book/CJT148QDYXXR4/elite-gaming-delmarva-salisbury-md, shows current hours: Thu 6-10pm, Fri/Sat until midnight, Sun 12-10pm, closed Mon-Wed) + Facebook/X/YouTube -- own domain (elitegamingdelmarva.com) failed to resolve on every fetch attempt during this research",
    lastScraped: "2026-09-18",
  },

  // ---- Montana (added 2026-09-20) -----------------------------------------
  {
    id: "montana-action-paintball-kalispell",
    name: "Montana Action Paintball",
    city: "Kalispell, MT",
    address: "1717 Smith Lake Rd, Kalispell, MT 59901",
    phone: "(406) 531-3607",
    email: "MontanaActionPaintball@gmail.com",
    website: "https://montanaactionpaintball.com",
    facebook: "https://www.facebook.com/groups/982657759085591",
    instagram: "https://www.instagram.com/montana_action_paintball",
    indoorOutdoor: "outdoor",
    admission:
      "$20 self-equipped pass (field access, unlimited games, unlimited air fills) or $45 rental package (unlimited games, gun/mask rental, 900 BBs); optional $5 tactical vest/chest rig add-on",
    about:
      "Paintball-primary field in the Flathead Valley with a genuine, separately-scheduled airsoft offering (\"Tactical Mil-Sim Battle Arena\"): community walk-on games the 1st and 3rd Sunday of every month (times vary by season), plus occasional Saturday and night games. Accommodates private parties and casual drop-ins.",
    status: "active",
    dataSource:
      "own website (montanaactionpaintball.com, dedicated /pages/airsoft page with schedule and pricing) + Facebook group + Instagram + Yelp/Tripadvisor",
    lastScraped: "2026-09-20",
  },
  {
    id: "wild-rose-paintball-airsoft-billings",
    name: "Wild Rose Paintball & Airsoft",
    city: "Billings, MT",
    address: "6601 Mainwaring Rd, Billings, MT",
    phone: "(406) 200-8955",
    email: "Play@WildRosePaintball.com",
    website:
      "https://wildroseactioncenter.com/billings-mt-outdoor-wild-rose-paintball-airsoft/",
    facebook: "https://www.facebook.com/wildrosepaintball/",
    indoorOutdoor: "outdoor",
    admission:
      "$15 entry with own gear (plus ammo purchase) or $35 rental & entry package (includes 500 rounds, plus additional ammo purchase); party packages from $229",
    about:
      "The outdoor location of the larger Wild Rose Action Center family-entertainment complex, about ten minutes west of Billings off Zimmerman Trail (also referred to as the Acton, MT area in some directories). Genuine airsoft is offered alongside .50/.68 cal paintball across four fields, with over 100 rental sets available. Seasonal hours: Fri 4-8pm, Sat 10am-6pm, Sun 12-5pm, weather permitting, open through the end of October.",
    status: "active",
    dataSource:
      "own website (wildroseactioncenter.com) + Yelp + Tripadvisor + Facebook",
    lastScraped: "2026-09-20",
  },
  {
    id: "electric-city-airsoft-great-falls",
    name: "Electric City Airsoft, LLC",
    city: "Great Falls, MT",
    address: "1441 NW Bypass, Great Falls, MT 59404",
    phone: "(406) 771-6666",
    email: "electriccityairsoft@yahoo.com",
    facebook: "https://www.facebook.com/Electric-City-Airsoft-LLC-619204551429010/",
    indoorOutdoor: "indoor",
    about:
      "Indoor airsoft arena with weekend-only hours (Sat-Sun 2pm-6pm per the most recently updated directory listing).",
    status: "facebook_only",
    dataSource:
      "AirsoftC3 (listing last updated 04/26/2025, provides hours and email) + a long-standing, consistent phone/address record across many independent directory aggregators (Yellowpages, Superpages, Manta, CMac.ws, and others, spanning several years) + a Facebook page exists but is login-walled, so recent activity could not be independently confirmed -- no working own website found",
    lastScraped: "2026-09-20",
  },
  {
    id: "21-mile-airsoft-billings",
    name: "21 Mile Airsoft",
    city: "Billings, MT",
    address: "21 Mile Rd, Billings, MT",
    indoorOutdoor: "outdoor",
    about:
      "Outdoor airsoft field on 21 Mile Rd, supplied directly by Michael -- this is the field he originally asked about by the name \"21 Mile Field,\" which an earlier research pass could not locate under that name.",
    status: "active",
    dataSource: "supplied directly by Michael -- no independent website, Facebook page, phone number, directory listing, or any other corroborating source could be found for this field anywhere in this research",
    lastScraped: "2026-09-20",
  },
  {
    id: "allout-airsoft-belgrade",
    name: "Allout Airsoft",
    city: "Belgrade, MT",
    address: "2845 Amsterdam Rd, Belgrade, MT 59714",
    facebook: "https://www.facebook.com/joulecreep.customgbbr.games",
    indoorOutdoor: "outdoor",
    about:
      "Airsoft field in the Bozeman/Belgrade, MT area (Gallatin County) -- its Facebook page brands the location \"Bozeman, MT\" even though the listed address is in nearby Belgrade, consistent with how several other fields in this dataset straddle two close towns. The Facebook handle references custom GBBR (gas blowback rifle) builds, suggesting an enthusiast-run field or informal club that also hosts organized games.",
    status: "facebook_only",
    dataSource:
      "supplied directly by Michael + Facebook (page + events) + third-party local-business directories (vymaps.com, findglocal.com) corroborating the Bozeman/Belgrade branding -- no own website found",
    lastScraped: "2026-09-20",
  },
  {
    id: "trail-of-air-great-falls",
    name: "Trail of Air (T.O.A.)",
    city: "Great Falls, MT",
    address: "4800 13th Ave S, Great Falls, MT",
    facebook: "https://www.facebook.com/trailofair/",
    indoorOutdoor: "outdoor",
    about:
      "Outdoor airsoft field/team in Great Falls, MT, also known by the abbreviation \"T.O.A.\" or \"toa.\"",
    status: "facebook_only",
    dataSource: "supplied directly by Michael + Facebook (page + events)",
    lastScraped: "2026-09-20",
  },
  {
    id: "magic-city-airsoft-billings",
    name: "Magic City Airsoft & Action Sports",
    city: "Billings, MT",
    address: "2839 Drury Lane, Billings, MT 59105",
    facebook: "https://www.facebook.com/mcaasmontana/",
    indoorOutdoor: "outdoor",
    about:
      "Outdoor airsoft field and action-sports business in Billings, MT. The address happens to also correspond to a self-storage facility (A All Purpose Storage) in public records, but Michael confirmed the field itself is outdoor -- the address is correct.",
    status: "facebook_only",
    dataSource:
      "Facebook (page + events) -- confirmed by Michael as very active -- + TikTok (@magiccityairsoftsports) + YouTube + Montana LLC registration (Magic City Airsoft and Action Sports, LLC)",
    lastScraped: "2026-09-20",
  },

  // ---- Nevada (added 2026-09-22) ------------------------------------------
  {
    id: "battle-lab-henderson",
    name: "Battle Lab Las Vegas (Evike Outpost)",
    city: "Henderson, NV",
    address: "2893 N Green Valley Pkwy, Henderson, NV 89014",
    phone: "(702) 433-3733",
    website: "https://www.evike.com/store-locations/outpost-lasvegas/",
    instagram: "https://www.instagram.com/battlelab.lasvegas",
    indoorOutdoor: "indoor",
    admission:
      "Retail store + playable indoor airsoft arena combo; hosts ticketed events (e.g. Airsoft Royale)",
    about:
      "Indoor airsoft arena and retail store in the Las Vegas metro area, operated jointly by Evike and Battle Lab. Also marketed as \"Airsoft Las Vegas.\" Open Wed-Fri 5-10pm, Sat 11am-8pm, Sun 11am-6pm, closed Mon-Tue.",
    status: "active",
    dataSource:
      "Evike.com store-locations page + Yelp (updated June 2026) + a forward-dated July 11, 2026 ticketed event listing (Airsoft Royale) confirming ongoing operation",
    lastScraped: "2026-09-22",
  },
  {
    id: "sin-city-smash-las-vegas",
    name: "Sin City Smash",
    city: "Las Vegas, NV",
    address: "6623 S Las Vegas Blvd, Suite 139, Las Vegas, NV 89119",
    phone: "(702) 912-1344",
    email: "contact@sincitysmash.com",
    website: "https://www.sincitysmash.com/airsoft-range/",
    instagram: "https://www.instagram.com/sincitysmash",
    indoorOutdoor: "indoor",
    admission: "3 games for $25",
    about:
      "Multi-activity entertainment venue (also offers axe throwing and splatter paint) with a genuine indoor 6mm airsoft \"Run-N-Gun\" timed course -- a solo/team timed-course format rather than a traditional open-field team skirmish. Open Mon-Thu 12-9pm, Fri-Sat 12-10pm, Sun 12-8pm.",
    status: "active",
    dataSource: "own website (sincitysmash.com) + Yelp (317 reviews, updated July 2026) + Instagram",
    lastScraped: "2026-09-22",
  },
  {
    id: "ace-airsoft-boulder-city",
    name: "ACE Airsoft (Adaptive Combat Experience)",
    city: "Boulder City, NV",
    address: "12801 US-95, Boulder City, NV 89005",
    email: "infoacelv@gmail.com",
    facebook: "https://www.facebook.com/AdaptiveCombatExp",
    instagram: "https://www.instagram.com/aceairsoft/",
    indoorOutdoor: "outdoor",
    about:
      "Outdoor milsim-oriented airsoft field along US-95 outside Boulder City, marketed as an airsoft-exclusive field for Southern Nevada.",
    status: "facebook_only",
    dataSource:
      "Facebook, Instagram (@aceairsoft), and a Twitter/X account (@aceairsoftlv1) all currently exist for this business, though this project's tools cannot read Facebook/Instagram content directly -- own domain (aceairsoft.com) would not resolve during this research, and third-party directory data on this field traces back to 2023, with no independently confirmed 2024-2026 activity found via web search",
    lastScraped: "2026-09-22",
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
    id: "cedar-airsoft-field-2026-09-13-rec-game",
    fieldId: "cedar-airsoft-field",
    fieldName: "Cedar Airsoft Field",
    title: "Rec Game",
    date: "2026-09-13",
    startTime: "10:00 AM",
    endTime: "5:00 PM",
    price: "$20",
    type: "OUTDOOR",
    description:
      "Standard rec day — gates open 10am. Game modes per the field's usual rotation: Team Death Match, Chaos, Attack & Defend, Kill Confirmed, Infected, Duos/Squads, Search & Destroy, Juggernaut, Hostage, Trouble in Terrorist Town (TTT), Hunter & Hunted, Pilots Down, etc.",
    sourceUrl: "https://www.facebook.com/CedarAirsoftField/events/",
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
    id: "cedar-airsoft-field-2026-09-27-rec-game",
    fieldId: "cedar-airsoft-field",
    fieldName: "Cedar Airsoft Field",
    title: "Rec Game",
    date: "2026-09-27",
    startTime: "10:00 AM",
    endTime: "5:00 PM",
    price: "$20",
    type: "OUTDOOR",
    description:
      "Standard rec day — gates open 10am. Game modes per the field's usual rotation: Team Death Match, Chaos, Attack & Defend, Kill Confirmed, Infected, Duos/Squads, Search & Destroy, Juggernaut, Hostage, Trouble in Terrorist Town (TTT), Hunter & Hunted, Pilots Down, etc.",
    sourceUrl: "https://www.facebook.com/CedarAirsoftField/events/",
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
    id: "cedar-airsoft-field-2026-10-03-rec-game",
    fieldId: "cedar-airsoft-field",
    fieldName: "Cedar Airsoft Field",
    title: "Rec Game",
    date: "2026-10-03",
    startTime: "10:00 AM",
    endTime: "5:00 PM",
    price: "$20",
    type: "OUTDOOR",
    description:
      "Standard rec day — gates open 10am. Game modes per the field's usual rotation: Team Death Match, Chaos, Attack & Defend, Kill Confirmed, Infected, Duos/Squads, Search & Destroy, Juggernaut, Hostage, Trouble in Terrorist Town (TTT), Hunter & Hunted, Pilots Down, etc.",
    sourceUrl: "https://www.facebook.com/CedarAirsoftField/events/",
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
    id: "cedar-airsoft-field-2026-10-08-thursday-night-game",
    fieldId: "cedar-airsoft-field",
    fieldName: "Cedar Airsoft Field",
    title: "Thursday Night Game",
    date: "2026-10-08",
    startTime: "4:00 PM",
    price: "$20",
    type: "OUTDOOR",
    description:
      "Weeknight game, gates open at 4pm — earlier than Cedar's usual weekend night games (which typically run 7pm-11:45pm). Exact end time and game modes weren't specified in the announcement.",
    sourceUrl: "https://www.facebook.com/CedarAirsoftField/events/",
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
    id: "cedar-airsoft-field-2026-10-18-late-rec-game",
    fieldId: "cedar-airsoft-field",
    fieldName: "Cedar Airsoft Field",
    title: "Late Rec Game",
    date: "2026-10-18",
    startTime: "1:00 PM",
    endTime: "8:00 PM",
    price: "$20",
    type: "OUTDOOR",
    description:
      "Extended-hours rec day — gates open at 1pm with games running until 8pm, later than Cedar's usual 10am-5pm rec day. Standard rec-day game modes (Team Death Match, Chaos, Attack & Defend, Kill Confirmed, Infected, Duos/Squads, Search & Destroy, Juggernaut, Hostage, Trouble in Terrorist Town (TTT), Hunter & Hunted, Pilots Down, etc.) per the field's usual format.",
    sourceUrl: "https://www.facebook.com/CedarAirsoftField/events/",
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
    id: "cedar-airsoft-field-2026-10-24-rec-game",
    fieldId: "cedar-airsoft-field",
    fieldName: "Cedar Airsoft Field",
    title: "Rec Game",
    date: "2026-10-24",
    startTime: "10:00 AM",
    endTime: "5:00 PM",
    price: "$20",
    type: "OUTDOOR",
    description:
      "Standard rec day — gates open 10am. Game modes per the field's usual rotation: Team Death Match, Chaos, Attack & Defend, Kill Confirmed, Infected, Duos/Squads, Search & Destroy, Juggernaut, Hostage, Trouble in Terrorist Town (TTT), Hunter & Hunted, Pilots Down, etc.",
    sourceUrl: "https://www.facebook.com/CedarAirsoftField/events/",
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
    id: "cedar-airsoft-field-2026-10-31-zombies",
    fieldId: "cedar-airsoft-field",
    fieldName: "Cedar Airsoft Field",
    title: "ZOMBIES!!",
    date: "2026-10-31",
    startTime: "5:00 PM",
    type: "OUTDOOR",
    description:
      "Cedar's Halloween-themed zombies big-game event, starting at 5pm. Further details weren't specified in the announcement.",
    sourceUrl: "https://www.facebook.com/CedarAirsoftField/events/",
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
    id: "cedar-airsoft-field-2026-11-01-rec-game",
    fieldId: "cedar-airsoft-field",
    fieldName: "Cedar Airsoft Field",
    title: "Rec Game",
    date: "2026-11-01",
    startTime: "10:00 AM",
    endTime: "5:00 PM",
    price: "$20",
    type: "OUTDOOR",
    description:
      "Standard rec day — gates open 10am. Game modes per the field's usual rotation: Team Death Match, Chaos, Attack & Defend, Kill Confirmed, Infected, Duos/Squads, Search & Destroy, Juggernaut, Hostage, Trouble in Terrorist Town (TTT), Hunter & Hunted, Pilots Down, etc.",
    sourceUrl: "https://www.facebook.com/CedarAirsoftField/events/",
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
    id: "darkfire-airsoft-2026-09-26-open-play",
    fieldId: "darkfire-airsoft",
    fieldName: "Darkfire Airsoft",
    title: "Open Play",
    date: "2026-09-26",
    startTime: "9:00 AM",
    price: "$25",
    type: "OUTDOOR",
    description:
      "Standard open-play day per the field's usual format: gates at 9am, briefing at 10am, games running 10:30am-5pm.",
    sourceUrl: "https://www.darkfireairsoft.com",
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
