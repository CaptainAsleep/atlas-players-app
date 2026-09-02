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
    ownerEmailDomain: "tcpaintballgr.com", // for owner-app claim verification — must match the claiming email's domain
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
    ownerEmailDomain: "capitalcitypaintball.com", // for owner-app claim verification — must match the claiming email's domain
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
    ownerEmailDomain: "nestofvipersairsoft.com", // for owner-app claim verification — must match the claiming email's domain
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
    relocatedTo: "darkfire-airsoft",
    notes: "Per Darkfire Airsoft's site, WASTE lost this property in 2026 and now runs events out of Darkfire's Hillsdale field.",
    dataSource: "sheet + darkfireairsoft.com",
  },
  {
    id: "sektor7",
    name: "Sektor7",
    city: "Michigan",
    indoorOutdoor: "outdoor",
    status: "relocated",
    relocatedTo: "darkfire-airsoft",
    notes: "Per Darkfire Airsoft's site, Sektor7 lost their property in 2026 and now runs events out of Darkfire's Hillsdale field. No address or independent web presence found — was not in the original field sheet.",
    dataSource: "darkfireairsoft.com",
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
    status: "active",
    dataSource: "website",
    lastScraped: "2026-08-28",
    notes:
      "Private-session model only, no public dated events found to seed — inventing fake dates for their rotating session-type menu (Friday Night Battle, Saturday Strike, etc.) would be fabricated data, not real scraped info. indoorOutdoor and admission price also weren't stated anywhere on the site, so left unset rather than guessed. If they ever start running real public open-play events, revisit and add those as real events separately.",
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
  const batch = db.batch();

  for (const field of fields) {
    const { id, ...data } = field;
    batch.set(db.collection("fields").doc(id), data, { merge: true });
  }

  for (const ev of events) {
    const { id, ...data } = ev;
    batch.set(db.collection("events").doc(id), data, { merge: true });
  }

  for (const team of teams) {
    const { id, ...data } = team;
    batch.set(db.collection("teams").doc(id), data, { merge: true });
  }

  await batch.commit();
  console.log(`Seeded ${fields.length} fields, ${events.length} events, and ${teams.length} team(s).`);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
