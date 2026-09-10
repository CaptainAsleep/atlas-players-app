// DRAFT — field-seeding candidates for Minnesota, researched 2026-09-10.
//
// This is NOT wired into seed-data.mjs and does NOT touch the live database.
// Review each entry, then copy whichever ones you approve into the `fields`
// array in seed-data.mjs before running it.
//
// This is a smaller batch than some previous states — Minnesota's airsoft
// scene turned out to be thin on independently-verifiable fields. Two
// entries were verified directly via the field's own website; the third
// (Big Lake Tactical) has no working owned website (see its notes) and is
// corroborated instead across several independent third-party sources, the
// same treatment Airsoft Arena Milwaukee (WI) and KDK Airsoft (MO) got.
// Several other candidates were researched and deliberately EXCLUDED —
// including one, Twin Cities Airsoft, that markets itself heavily as a
// Minnesota field but whose own website places its actual physical
// location in Wisconsin — see the list at the bottom of this file.

// ---- MINNESOTA ---------------------------------------------------------------
export const minnesotaFields = [
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
];

// Considered and excluded (Minnesota) — do not add without re-verifying:
//   - Twin Cities Airsoft: markets itself heavily as Minnesota's "premier scenario field" and its homepage footer says "Saint Paul, Minnesota" — but its own Directions/Location page gives its actual physical address as 2261 130th Ave, Baldwin, WI 54013, describing itself as "~25 minutes from Woodbury and Stillwater, MN." A separate third-party aggregator (airsoftic.com) independently agrees, listing it under Wisconsin/Baldwin, not Minnesota. Its real location is Wisconsin despite the Minnesota-facing branding — it was also considered (and excluded, for a different reason — unverifiable state at the time) during the Wisconsin batch. Worth revisiting as a Wisconsin candidate in a future update, not seeded here.
//   - Special Forces Paintball (Buffalo, MN): confirmed via its own site (sfpgames.com) to be paintball-only — no airsoft offering.
//   - W&C Airsoft Fields (Cannon Falls, MN): appears only in aggregator listings (AirsoftC3, Airsoftic) with no address, phone, or working website found anywhere — too thin to verify as a real, currently-operating field.
//   - Ace Airsoft LLC (Ottertail, MN): appears only in one aggregator listing; its own site (a GoDaddy-hosted page) could not be fetched, and no independent corroboration (reviews, directories, social media tied to that location) was found.
//   - Minnesota Airsoft / shopmnairsoft.com: confirmed via its own site to be an online-only retail store (custom guns and upgrades), not a physical field.
//   - "MK Airsoft" (Medina): a location-matching search surfaced this name, but it's actually in Medina, OH, not Minnesota — an unrelated field already covered in the Ohio batch.
