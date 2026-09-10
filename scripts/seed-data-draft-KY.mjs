// DRAFT — field-seeding candidates for Kentucky, researched 2026-09-10.
//
// This is NOT wired into seed-data.mjs and does NOT touch the live database.
// Review each entry, then copy whichever ones you approve into the `fields`
// array in seed-data.mjs before running it.
//
// A small batch. Three of four entries verified against the field's own
// website; the fourth (Point 6 Airsoft Field) has an own website too but
// describes itself as still "in development" with an informal donation/pay
// entry model — included but flagged. Several directory-only listings
// (BattleFront, NarrowGate Battle Grounds, Rockcastle Airsoft) had no
// address, phone, or website anywhere and were excluded — see the bottom.

// ---- KENTUCKY ---------------------------------------------------------------
export const kentuckyFields = [
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
];

// Considered and excluded (Kentucky) — do not add without re-verifying:
//   - BattleFront (Franklin, KY): listed on AirsoftC3 as active since 2008 running blank-fire WWII/Vietnam events, but no address, phone, website, or social media presence could be found anywhere beyond that single directory listing — impossible to verify it's a real, locatable, currently-operating field.
//   - NarrowGate Battle Grounds (Lexington, KY): an indoor CQB field with an Instagram handle (@narrowgateairsoftfield) and an AirsoftC3 directory listing, but no address, phone, website, or any other corroborating source found — can't confirm a real location.
//   - Rockcastle Airsoft (Park City, KY): AirsoftC3 lists this name/city, but the only real business at a matching Park City, KY location is Rockcastle Shooting Center (22850 Louisville Road) — a gun range with no mention of airsoft or paintball anywhere in its own materials or third-party listings. Likely a mislabeled or stale directory entry; excluded rather than guessing.
//   - Black Ops Paintball & Airsoft: surfaced in searches but is actually located in Fayetteville, North Carolina, not Kentucky — a false lead.
//   - "Battlefront-Reloaded" (Hubbard, OH) and "BattleFront Memphis" (Memphis, TN): same-name businesses that turned up while searching for Kentucky's BattleFront — confirmed to be unrelated, separate businesses in other states.
