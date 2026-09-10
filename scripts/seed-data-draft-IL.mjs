// DRAFT — field-seeding candidates for Illinois, researched 2026-09-10.
//
// This is NOT wired into seed-data.mjs and does NOT touch the live database.
// Review each entry, then copy whichever ones you approve into the `fields`
// array in seed-data.mjs before running it.
//
// Every entry below was verified by fetching the field's own website —
// nothing here was fabricated or guessed. A few fields flagged in `notes`
// need a human gut-check before going live (e.g. a claim-verification quirk,
// or an ownership question). Several other candidates were researched and
// deliberately EXCLUDED as closed, unverifiable, or not actually an airsoft
// field — see the list at the bottom of this file.

// ---- ILLINOIS ---------------------------------------------------------------
export const illinoisFields = [
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
  {
    id: "kinetic-training-complex-kankakee",
    name: "Kinetic Training Complex (Kankakee Airsoft Factory)",
    city: "Kankakee, IL",
    address: "980 N Hobbie Ave, Kankakee, IL 60901",
    phone: "(800) 581-6620",
    website: "https://mirtactical.com/kinetic-training-complex-airsoft-chicago/",
    indoorOutdoor: "indoor",
    about:
      "A 2-building, 7-story former industrial complex in Kankakee where MiR Tactical runs recurring indoor open-play airsoft games on select Saturdays and Sundays, March through December (weather permitting in December).",
    status: "active",
    dataSource: "website",
    lastScraped: "2026-09-10",
    notes:
      "MiR Tactical (a Buffalo Grove, IL-based event coordinator/retailer, not a field owner — see the Atlas Major/event-coordinator scope in atlas-status.md) hosts events here, but neither of its own pages state who actually owns the property. No ownerEmailDomain set, since mirtactical.com is the host's domain, not necessarily the property owner's. MiR Tactical also markets this identical address under the name \"Kankakee Airsoft Factory Open Play\" on a separate page — treated as one field here, not two. Flag for a human check on the real ownership/claim situation before publishing; this may be a better fit for Atlas's event-coordinator model than a normal claimable field.",
  },
];

// Considered and excluded (Illinois) — do not add without re-verifying:
//   - CPX Sports (Joliet, IL): permanently closed — Yelp, a PBNation forum thread, and social media posts all confirm it "closed for good."
//   - Urban Warfare Paintball & Laser Tag (Bloomington, IL): confirmed via its own site that it does NOT offer airsoft — paintball and laser tag only.
//   - Ronin Airsoft Home Field (Cordova, IL): reads as a private team's home field (forum references to "Ronin Airsoft Team") rather than a public commercial venue; the team's own site did not resolve, and no independent field website was found.
//   - Airsoft Megastore "Chicago" (listed under Countryside, IL by one aggregator): the business's own site's contact info points to a Long Beach, CA area code with no evidence of a distinct Chicago-area physical field — reads as retail-only.
//   - MiR Tactical HQ (Buffalo Grove, IL): confirmed to be an event-coordinator/retail storefront, not a field with open play of its own — their actual play locations (Kankakee, Paintball Explosion) are captured separately above.
