// Run locally once (or whenever the catalog changes) with:
//   node scripts/seed-achievement-patches.mjs
//
// Requires the same scripts/serviceAccountKey.json as seed-data.mjs, plus
// a local "patches" folder (sitting next to this project, one level above
// the repo — adjust PATCHES_DIR below if yours lives somewhere else)
// containing every image file referenced below by filename.
//
// This uploads each image to Storage AND writes the Firestore catalog
// entry in the same run — no separate manual upload-then-copy-URL step.

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { readFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const serviceAccount = JSON.parse(
  readFileSync(new URL("./serviceAccountKey.json", import.meta.url))
);

// Same bucket name already saved in your player app's GitHub secret
// VITE_FIREBASE_STORAGE_BUCKET — or find it in the Firebase console under
// Storage (shown at the top of the Files tab, e.g. "your-project.appspot.com"
// or "your-project.firebasestorage.app").
const STORAGE_BUCKET = "atlas-players-app.firebasestorage.app";

initializeApp({ credential: cert(serviceAccount), storageBucket: STORAGE_BUCKET });
const db = getFirestore();
const bucket = getStorage().bucket();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// A "patches" folder living directly inside the project root — a sibling
// of scripts/ and src/, not somewhere outside the project.
const PATCHES_DIR = path.join(__dirname, "..", "patches");

// ---- CATALOG --------------------------------------------------------------
// All 36 are cataloged (real name/image/details) even though only 28 have
// a working trigger right now — the other 8 are genuinely blocked (no
// review system, no weather API, no country data, etc.) or need a human,
// not a rule (Bug Hunter, Ambassador, Secret Agent). Their artwork is
// ready; trigger: null just means nothing auto-grants them yet.
const achievementPatches = [
  { id: "almost-famous", name: "Almost Famous", imageFile: "almostfamous.png",
    details: "Attend an event a YouTuber attended", trigger: null },

  { id: "touring-operator", name: "Touring Operator", imageFile: "touringoperator.png",
    details: "Check-in to 5 different airsoft fields",
    trigger: { type: "distinct_fields_count", count: 5 } },

  { id: "home-ground-loyalty", name: "Home Ground Loyalty", imageFile: "homegroundloyalty.png",
    details: "Attend 10 games at a single field",
    trigger: { type: "single_field_checkin_count", count: 10 } },

  { id: "night-ops", name: "Night Ops", imageFile: "nightops.png",
    details: "Check in to a game scheduled after 8:00 PM",
    trigger: { type: "filtered_checkin_count", count: 1, filter: { timeAfterHour: 20 } } },

  { id: "marathon-runner", name: "Marathon Runner", imageFile: "marathonrunner.png",
    details: "Check in to games back-to-back days (Saturday & Sunday)",
    trigger: { type: "consecutive_calendar_days", days: 2 } },

  { id: "intel-officer", name: "Intel Officer", imageFile: "intelofficer.png",
    details: "Leave 10 detailed field or event reviews", trigger: null },

  { id: "squad-leader", name: "Squad Leader", imageFile: "squadleader.png",
    details: "Invite 3 friends to create an Atlas profile using a referral link",
    trigger: { type: "referral_count", count: 3 } },

  { id: "early-adopter", name: "Early Adopter", imageFile: "earlyadopter.png",
    details: "Join Atlas during the first calendar year of release",
    trigger: { type: "signup_window", start: "2026-08-27", end: "2027-08-27" } },

  { id: "frostbite", name: "Frostbite", imageFile: "frostbite.png",
    details: "Complete a check in at an outdoor field during winter months (December-February)",
    trigger: { type: "filtered_checkin_count", count: 1, filter: { indoorOutdoor: "outdoor", monthIn: [12, 1, 2] } } },

  { id: "heatwave", name: "Heatwave", imageFile: "heatwave.png",
    details: "Complete a check in when temperatures cross 90F", trigger: null },

  { id: "milsim-veteran", name: "MilSim Veteran", imageFile: "milsimveteran.png",
    details: "Check in for a multi-day or continuous scenario event",
    trigger: { type: "filtered_checkin_count", count: 1, filter: { multiDayOrMilsim: true } } },

  { id: "cqb-specialist", name: "CQB Specialist", imageFile: "cqbspecialist.png",
    details: "Check into 5 indoor or close-quarters arenas",
    trigger: { type: "distinct_fields_count", count: 5, filter: { indoorOutdoor: "indoor" } } },

  { id: "wasteland-warrior", name: "Wasteland Warrior", imageFile: "wastelandwarrior.png",
    details: "Complete 5 check-ins at outdoor woodsball fields",
    trigger: { type: "filtered_checkin_count", count: 5, filter: { indoorOutdoor: "outdoor" } } },

  { id: "first-blood", name: "First Blood", imageFile: "firstblood.png",
    details: "Complete your very first game check in on Atlas",
    trigger: { type: "total_checkin_count", count: 1 } },

  { id: "centurion", name: "Centurion", imageFile: "centurion.png",
    details: "Reach 100 total lifetime game check ins across all fields",
    trigger: { type: "total_checkin_count", count: 100 } },

  { id: "quinquagenarian", name: "Quinquagenarian", imageFile: "quinquagenarian.png",
    details: "Reach 50 total lifetime game check ins on Atlas",
    trigger: { type: "total_checkin_count", count: 50 } },

  { id: "quadranscentennial", name: "Quadranscentennial", imageFile: "quadranscentennial.png",
    details: "Reach 25 total lifetime game check ins at Atlas",
    trigger: { type: "total_checkin_count", count: 25 } },

  { id: "early-bird", name: "Early Bird", imageFile: "earlybird.png",
    details: "Scan your QR check in pass at least 30 minutes before the field's morning safety briefing",
    trigger: { type: "early_checkin", minutesBefore: 30 } },

  { id: "weekend-warrior", name: "Weekend Warrior", imageFile: "weekendwarrior.png",
    details: "Play games 4 weekends in a row",
    trigger: { type: "consecutive_weekends", weekends: 4 } },

  { id: "bug-hunter", name: "Bug Hunter", imageFile: "bughunter.png",
    details: "Report a software bug during beta testing that gets resolved by the dev team", trigger: null },

  { id: "pioneer", name: "Pioneer", imageFile: "pioneer.png",
    details: "Awarded exclusively to players who checked in at The Compound during the original pilot phase",
    trigger: { type: "filtered_checkin_count", count: 1, filter: { fieldId: "the-compound", dateRange: { start: "2026-08-27", end: "2026-11-01" } } } },

  { id: "motorcity-regular", name: "Motorcity Regular", imageFile: "motorcityregular.png",
    details: "Unlocked after checking into 5 games at MotorCity Airsoft",
    trigger: { type: "field_checkin_count", fieldId: "motorcity-airsoft", count: 5 } },

  { id: "creature-of-the-night", name: "Creature of The Night", imageFile: "creatureofthenight.png",
    details: "Attend 3 night games",
    trigger: { type: "filtered_checkin_count", count: 3, filter: { timeAfterHour: 20 } } },

  { id: "dtb", name: "DTB", imageFile: "dtb.jpg",
    details: "Awarded for attending 3 events at The Compound",
    trigger: { type: "field_checkin_count", fieldId: "the-compound", count: 3 } },

  { id: "one-of-us", name: "One of Us", imageFile: "oneofus.png",
    details: "Join a Team", trigger: { type: "team_joined" } },

  { id: "new-operator", name: "New Operator", imageFile: "newoperator.png",
    details: "Create a Profile", trigger: { type: "account_created" } },

  { id: "secret-agent", name: "Secret Agent", imageFile: "secretagent.png",
    details: "Only given out by the owner of Atlas", trigger: null },

  { id: "globetrotter", name: "Globetrotter", imageFile: "globetrotter.png",
    details: "Check into airsoft fields located in 3 different states or provinces",
    trigger: { type: "distinct_states_count", count: 3 } },

  { id: "world-traveler", name: "World Traveler", imageFile: "worldtraveler.png",
    details: "Complete game check ins in 2 different countries", trigger: null },

  { id: "recruit-master", name: "Recruit Master", imageFile: "recruitmaster.png",
    details: "Successfully refer 10 new players to Atlas",
    trigger: { type: "referral_count", count: 10 } },

  { id: "squad-catalyst", name: "Squad Catalyst", imageFile: "squadcatalyst.png",
    details: "Be part of a registered team that checks in together with 5 or more members at the same event",
    trigger: { type: "team_threshold_any_event", count: 5 } },

  { id: "speedqb-royalty", name: "SpeedQB Royalty", imageFile: "speedqbroyalty.png",
    details: "Check into 5 tournaments",
    trigger: { type: "filtered_checkin_count", count: 5, filter: { eventType: "TOURNAMENT" } } },

  { id: "zombieland", name: "Zombieland", imageFile: "zombieland.png",
    details: "Check in to a special Halloween, infected or zombie themed airsoft event",
    trigger: { type: "filtered_checkin_count", count: 1, filter: { titleKeywords: ["zombie", "infected", "halloween"] } } },

  { id: "stuffed", name: "Stuffed", imageFile: "stuffed.png",
    details: "Check in to a Thanksgiving themed airsoft event",
    trigger: { type: "filtered_checkin_count", count: 1, filter: { titleKeywords: ["thanksgiving"] } } },

  { id: "ho-ho-ho", name: "Ho Ho Ho", imageFile: "hohoho.png",
    details: "Check in to a game on or around Christmas",
    trigger: { type: "filtered_checkin_count", count: 1, filter: { dateWindow: { startMonth: 12, startDay: 20, endMonth: 12, endDay: 28 } } } },

  { id: "ambassador", name: "Ambassador", imageFile: "ambassador.png",
    details: "Given to influencers who promote the Atlas app", trigger: null },
];

async function uploadAndSeed() {
  let uploaded = 0, skipped = 0, failed = 0;

  for (const patch of achievementPatches) {
    const localPath = path.join(PATCHES_DIR, patch.imageFile);
    if (!existsSync(localPath)) {
      console.warn(`Skipping "${patch.name}" — couldn't find ${patch.imageFile} in ${PATCHES_DIR}`);
      skipped++;
      continue;
    }
    // Derived from each patch's own file extension rather than assumed —
    // most are .png now (for transparent backgrounds), DTB stays .jpg.
    const ext = path.extname(patch.imageFile).toLowerCase();
    const contentType = ext === ".png" ? "image/png" : "image/jpeg";
    const destPath = `achievementPatches/${patch.id}${ext}`;

    // "Socket hang up" on roughly every other request is a known,
    // well-documented class of issue — Node's HTTP client keeps
    // connections alive for reuse, and if the server closes its end right
    // as this script tries to reuse one, that's exactly this error. Not a
    // real failure, just a stale connection — a fresh retry almost always
    // succeeds immediately, so this retries up to 3 times before actually
    // giving up on a given patch.
    let attempt = 0;
    let succeeded = false;
    let lastErr = null;
    while (attempt < 3 && !succeeded) {
      attempt++;
      try {
        await bucket.upload(localPath, {
          destination: destPath,
          resumable: false,
          metadata: { contentType },
        });
        const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(destPath)}?alt=media`;

        // Written immediately, not batched to the end — so if a LATER
        // patch fails, everything up to this point is already safely
        // saved rather than lost.
        await db.collection("achievementPatches").doc(patch.id).set({
          name: patch.name,
          imageUrl,
          details: patch.details,
          trigger: patch.trigger,
        });
        succeeded = true;
      } catch (err) {
        lastErr = err;
        if (attempt < 3) {
          console.log(`  (retrying ${patch.name}, attempt ${attempt} hit: ${err.message})`);
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      }
    }

    if (succeeded) {
      uploaded++;
      console.log(`✓ ${patch.name}`);
    } else {
      console.error(`✗ ${patch.name} failed after 3 attempts: ${lastErr.message}`);
      failed++;
    }
  }

  console.log(`\nSeeded ${uploaded} achievement patches (${skipped} skipped — image not found, ${failed} failed — see errors above).`);
  if (failed > 0) {
    console.log("Just run this script again — anything already saved above will simply be re-uploaded (harmless), and it'll pick up wherever it left off.");
  }
}

uploadAndSeed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
