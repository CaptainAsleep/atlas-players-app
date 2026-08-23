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
    facebook: "https://www.facebook.com/CedarAirsoftField",
    instagram: "https://www.instagram.com/cedarairsoft/",
    youtube: "https://www.youtube.com/channel/UCL5Nqz78FYM2UR3WV9ELx0w",
    indoorOutdoor: "outdoor",
    admission: "$20/player/day",
    about:
      "10-acre outdoor field north of Grand Rapids running an event-style schedule of rec days and larger events.",
    imageURL: "https://images.squarespace-cdn.com/content/v1/6262f3f5e4f2770c486b0829/4c8e4e03-2dfb-4c5f-a445-ff70d4613b84/539384491_1254797379773738_374968517996269722_n.jpg",
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
    facebook: "https://www.facebook.com/DarkFireAirsoft/",
    instagram: "https://www.instagram.com/darkfireairsoft/",
    youtube: "https://www.youtube.com/channel/UC7oCGVg8g_1T2bv4bgv16RQ",
    discord: "https://discord.gg/6FwQZaH7fg",
    indoorOutdoor: "outdoor",
    about:
      "38-acre outdoor field running open plays and larger milsim-style operations; standard open-play schedule is gates at 9am, briefing 10am, games 10:30am-5pm.",
    imageURL: "https://static.wixstatic.com/media/6282e125651246cf8362f57d8d5a9b67.jpg/v1/fill/w_1920,h_1280,al_c,q_90,enc_avif,quality_auto/6282e125651246cf8362f57d8d5a9b67.jpg",
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
    facebook: "https://www.facebook.com/FutureballParks",
    instagram: "https://www.instagram.com/futureballparks/",
    tiktok: "https://www.tiktok.com/@futureballparks",
    indoorOutdoor: "outdoor",
    about:
      "Large outdoor paintball and airsoft park with regular weekend public-play sessions plus named big-game events through the season.",
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
    facebook: "https://www.facebook.com/profile.php?id=100090353510201",
    discord: "https://www.discord.com/users/240571",
    youtube: "https://www.youtube.com/channel/UCJ8rxC9oaGJY5Qmetr72Ycw",
    indoorOutdoor: "outdoor",
    admission: "$20/person",
    about:
      "Outdoor field running capped open-play events (50 players) with custom scenario rounds, roughly quarterly.",
    imageURL: "https://img1.wsimg.com/isteam/ip/ec5d8dd8-d89f-4c7e-90be-3eaf25e1aa35/2.0.jpg",
    status: "active",
    dataSource: "website",
    lastScraped: "2026-08-23",
  },
  {
    id: "tc-paintball-north",
    name: "TC Paintball North",
    city: "Traverse City, MI",
    address: "1825 M-37 S, Traverse City, MI 49685",
    phone: "(231) 943-0248",
    website: "https://www.tcpaintballnorth.com",
    facebook: "https://www.facebook.com/tcpaintball/",
    indoorOutdoor: "outdoor",
    hours: "Open play Sundays 12-5pm at the Copemish field, no reservation needed",
    about: "Paintball and airsoft park with a Traverse City retail shop and a Copemish playing field.",
    imageURL: "https://static.wixstatic.com/media/274f48_2d410502d70b48019e12ff14f3ffa8b5~mv2.jpg/v1/fill/w_1920,h_932,al_c,q_85,enc_avif,quality_auto/store%20field.jpg",
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
    facebook: "https://www.facebook.com/CRU-Paintball-LLC-192654563335/",
    indoorOutdoor: "outdoor",
    hours: "Saturday 10am-dark, Sunday 11am-5pm",
    about: "100-acre woodsball field offering open play and group/party bookings.",
    status: "active",
    dataSource: "website",
    lastScraped: "2026-08-23",
  },
  {
    id: "tc-paintball-grand-rapids",
    name: "TC Paintball Grand Rapids",
    city: "Walker, MI",
    address: "2070 Waldorf St NW, Walker, MI 49544",
    phone: "(616) 249-8227",
    website: "https://www.tcpaintballgr.com",
    facebook: "https://www.facebook.com/p/TC-Paintball-GR-100035350042217/",
    instagram: "https://www.instagram.com/explore/locations/18328887/tc-paintball-gr",
    indoorOutdoor: "indoor + outdoor",
    hours: "Random Draw League Nights Fridays 6pm; open year-round, reservations required",
    about: "Indoor paintball arena open year-round, with a new outdoor field added in 2026.",
    status: "active",
    dataSource: "website",
    lastScraped: "2026-08-23",
  },
  {
    id: "capital-city-paintball",
    name: "Capital City Paintball",
    aka: "formerly TC Paintball Lansing",
    city: "Charlotte, MI",
    address: "3262 McConnell Hwy, Charlotte, MI 48813",
    phone: "(517) 224-9034",
    website: "https://www.capitalcitypaintball.com",
    facebook: "https://www.facebook.com/share/1HQPwRgWcQ/",
    instagram: "https://www.instagram.com/paintballcapitalcity",
    discord: "https://discord.gg/VBTApvwdwS",
    indoorOutdoor: "outdoor",
    status: "rebranded",
    notes: "TC Paintball Lansing rebranded to Capital City Paintball at the same address; sheet still lists old branding.",
    dataSource: "website",
    lastScraped: "2026-08-23",
  },
  {
    id: "hell-survivors",
    name: "Hell Survivors",
    city: "Pinckney, MI",
    address: "619 Pearl St (D-19), Pinckney, MI 48169",
    phone: "(734) 878-5656",
    website: "https://www.hellsurvivors.com",
    facebook: "https://www.facebook.com/HellSurvivors",
    instagram: "https://www.instagram.com/hellsurvivors/",
    tiktok: "https://www.tiktok.com/@hellsurvivorspaintball",
    youtube: "https://www.youtube.com/channel/UCA06NW8H1VyyIOszXZH9H9A",
    indoorOutdoor: "outdoor",
    about: "Themed outdoor paintball field with multiple battle zones; booking runs through an embedded FareHarbor calendar.",
    imageURL: "https://static.wixstatic.com/media/78a56e_97bd927a2b284e82bbd82f882e0d3788~mv2.jpg/v1/fill/w_642,h_492,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/440957598_999534732178694_6331911926097574916_n.jpg",
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
    facebook: "https://www.facebook.com/Totalcontrolpb",
    indoorOutdoor: "outdoor",
    hours: "Pro shop: Tue-Fri 11am-7pm, Sat 12-5pm, closed Sun/Mon",
    imageURL: "https://images.squarespace-cdn.com/content/v1/61d7b2bfa282352059b4cd24/251e9c3e-9870-485e-b4c2-d992d51e2690/TCP+Field+Sign.jpg",
    status: "active",
    notes: "Playing field listed as CLOSED as of last scrape — confirm before listing as bookable.",
    dataSource: "website",
    lastScraped: "2026-08-23",
  },
  {
    id: "nest-of-vipers",
    name: "Nest of Vipers",
    city: "Coopersville, MI",
    address: "15074 104th Ave, Coopersville, MI 49404",
    website: "https://nestofvipersairsoft.com",
    facebook: "https://www.facebook.com/nestofvipersairsoft",
    indoorOutdoor: "outdoor",
    status: "closing",
    notes: "Field posted its July 14, 2026 event as the final event at this location — likely closed or relocated.",
    dataSource: "website",
    lastScraped: "2026-08-23",
  },
  {
    id: "motorcity-airsoft",
    name: "Motorcity Airsoft",
    city: "Clinton Township, MI",
    address: "37555 South Gratiot, Clinton Township, MI 48036",
    website: "https://www.motorcityairsoft.com/",
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
    status: "facebook_only",
    dataSource: "sheet",
  },
  {
    id: "sfod-hq",
    name: "SFOD_HQ",
    city: "Montrose, MI",
    address: "7163 Wilson Rd, Montrose, MI 48457",
    facebook: "https://www.facebook.com/sfodairsoft04",
    indoorOutdoor: "outdoor",
    status: "facebook_only",
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
    notes: "Per Darkfire Airsoft's site, WASTE lost this property in 2026 and now runs events out of Darkfire's Hillsdale field.",
    dataSource: "sheet + darkfireairsoft.com",
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
  },
  {
    id: "darkfire-airsoft-2026-09-05-minisim-nato-vs-rusfor-v",
    fieldId: "darkfire-airsoft",
    fieldName: "Darkfire Airsoft",
    title: "Minisim - NATO vs RUSFOR V (Hosted by VBH)",
    date: "2026-09-05",
    startTime: "9:00 AM",
    type: "MILSIM",
    description: "Faction minisim, briefing starts promptly at 10am.",
    sourceUrl: "https://www.darkfireairsoft.com/events/minisim-nato-vs-rusfor-v-hosted-by-vbh",
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
    description: "Capped at 50 players, four custom scenario rounds run through the day.",
    sourceUrl: "https://www.thecompoundairsoft.com/",
    imageUrl: "https://img1.wsimg.com/isteam/ip/ec5d8dd8-d89f-4c7e-90be-3eaf25e1aa35/2.0.jpg",
  },
];

async function seed() {
  const batch = db.batch();

  for (const field of fields) {
    const { id, ...data } = field;
    batch.set(db.collection("fields").doc(id), data, { merge: true });
  }

  for (const ev of events) {
    const { id, ...data } = ev;
    batch.set(db.collection("events").doc(id), data, { merge: true });
  }

  await batch.commit();
  console.log(`Seeded ${fields.length} fields and ${events.length} events.`);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
