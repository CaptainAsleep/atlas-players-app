// DRAFT — field-seeding candidates for Ohio and Texas, researched 2026-09-02.
//
// This is NOT wired into seed-data.mjs and does NOT touch the live database.
// Review each entry, then copy whichever ones you approve into the `fields`
// array in seed-data.mjs before running it.
//
// Every entry below was verified by fetching the field's own website (see
// the notes/verification writeup delivered alongside this file) — nothing
// here was fabricated or guessed. A few fields flagged in `notes` need a
// human gut-check before going live (e.g. an address only corroborated by
// third-party directories rather than the business's own site, or a claim-
// verification quirk). Several other candidates were researched and
// deliberately EXCLUDED as no longer operating or unverifiable — see the
// full research writeup for the reasoning per state.

// ---- OHIO ----------------------------------------------------------------
export const ohioFields = [
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
      "Michael confirmed this is a Cleveland, OH field (not Michigan — corrected 2026-09-02; an earlier placeholder entry mistakenly listed it under Michigan and has been removed from seed-data.mjs). No precise street address or phone confirmed — site's /about page 404s and Facebook blocks automated fetch; Facebook page title (\"SEKTOR7 | Cleveland OH\") and the site's 216 area-code phone number both point to Cleveland specifically. Fill in the exact address before publishing if you have it firsthand.",
  },
];

// Considered and excluded (Ohio) — do not add without re-verifying:
//   - The Den Airsoft (Strasburg, OH): active, but couldn't pin down a fully verified street address (directories disagree / field appears to have relocated).
//   - Fallen Warrior Airsoft (Chillicothe, OH): directories disagree on phone number; a review describes an unexpected closure despite posted hours.
//   - Cleveland Airsoft (Lorain, OH): site's Contact/About pages are unedited WordPress placeholder content — not trustworthy.

// ---- TEXAS -----------------------------------------------------------------
export const texasFields = [
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
];

// Considered and excluded (Texas) — do not add without re-verifying:
//   - Mission Airsoft (San Antonio): own site displays a "PERMANENT closure" notice after ~14 years.
//   - DFW Adventure Park (Northlake, TX): root site fine, but airsoft-specific page 500-errored every attempt — couldn't verify from source.
//   - Airsoft Revolution 15 (Leon Valley, TX): site blocks automated fetches via robots.txt — couldn't independently verify.
//   - Texas Paintball (Jonestown, TX): active and runs airsoft Sundays, but fundamentally a paintball park; left out in favor of airsoft-primary venues.
//   - AGR Sports Adventure Park (Katy, TX): active, but a general family/laser-tag venue with airsoft as one of several activities.
