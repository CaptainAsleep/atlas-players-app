// DRAFT — field-seeding candidates for Kansas, researched 2026-09-10.
//
// This is NOT wired into seed-data.mjs and does NOT touch the live database.
// Review each entry, then copy whichever ones you approve into the `fields`
// array in seed-data.mjs before running it.
//
// Another small batch, similar in size to Iowg�s. Two of the three entries
// below have no owned business website and are corroborated instead across
// several independent sources — same treatment as the existing MI/WI/MO/MN
// facebook_only entries already in seed-data.mjs.

// ---- KANSAS ---------------------------------------------------------------
export const kansasFields = [
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
];

// Considered and excluded (Kansas) — do not add without re-verifying:
//   - The Master's Field (Cherryvale, KS): the business's own website explicitly states "The Master's Field Is Currently Closed" — closed.
//   - Alexandria Air-Soft Adventures: turned up via a Wichita TV station's video page, but the story itself is about Alexandria, LOUISIANA (an indoor field at the Alexandria Mall) — syndicated video content, not a Kansas field at all.
//   - Final Shot Paintball (Kansas landing page): same multi-state SEO-template pattern already excluded for Iowa — the address/contact info on the page actually points to the company's real Connecticut location, not a genuine Kansas facility.
