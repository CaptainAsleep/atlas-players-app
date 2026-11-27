// One-off (2026-11-24): add Futureball's 2027 event lineup, from the flyer
// Michael supplied. Futureball is CLAIMED, so seed-data.mjs skips it; this
// writes straight to Firestore instead. Per Michael: published (no draft),
// listing-only until Futureball sets up payouts. Paintball-only "Cartoon
// Warz: Anime" (Apr 16-18) deliberately left out.
// CREATE-ONLY: any event id that already exists is skipped, never overwritten.
// No price set on any event (flyer gives none) -- Futureball must set prices
// before turning on payouts, or these book as free.
// Waiver: Futureball's real waiver (same object as the 2026 events); its own
// text says it's good through 3/26/27.
// Dry run by default. Apply with:  node scripts/add-futureball-2027-events.mjs --write
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "fs";
const sa = JSON.parse(readFileSync(new URL("./serviceAccountKey.json", import.meta.url)));
initializeApp({ credential: cert(sa) });
const db = getFirestore();
const WRITE = process.argv.includes("--write");

const events = [
  {
    id: "futureball-2027-01-10-winter-airsoft",
    title: "Winter Airsoft",
    date: "2027-01-10",
    startTime: "11:00 AM",
    endTime: "3:00 PM",
    type: "OUTDOOR",
    description: "Winter airsoft session, 11am-3pm, weather permitting. Own gear only: no rentals and no HPA fills.",
    sourceUrl: "https://www.futureball.com/",
    waiver: {
      version: "2026-10-26",
      isDemo: false, // swapped 2026-10-26 from the generic placeholder to Futureball's real waiver text (supplied by Michael); per its own text, good through 3/26/27
      text: `LIABILITY WAIVER AND RELEASE OF CLAIMS

IN CONSIDERATION of being permitted to participate in any Paintball, Airsoft, and/or Gellyball activities including, but not limited to, playing, using the premises of, renting and operating equipment leased, sanctioned and/or operated by the above named vendor, I acknowledge and agree that:

I fully understand and acknowledge that; (a) risks and dangers exist in my use of Paintball, Airsoft, and/or Gellyball equipment and my participation in Paintball, Airsoft, and/or Gellyball activities; (b) my participation in such activities and/or use of such equipment may result in my injury or illness including but not limited to bodily injury, disease strains, fractures, partial and/or total paralysis, eye injury, blindness, heat stroke, heart attack, death or other ailments that could cause serious disability; (c) these risks and dangers may be caused by the negligence of the owners, employees, officers or agents of FP; the negligence of the participants, the negligence of others, accidents, breaches of contract, the forces of nature or other causes. These risks and dangers may arise from foreseeable or unforeseeable causes; and (d) by my participation in these activities and/or use of equipment, I hereby assume all risks and dangers and all responsibility for any losses and/or damages, whether caused in whole or in part by the negligence or other conduct of the owners, agents, officers, employees of FP, or by any other person.

I, on behalf of myself, my personal representatives and my heirs, hereby voluntarily agree to release, waive, discharge, hold harmless, defend and indemnify FP and it's owners, agents, officers and employees from any and all claims, actions or losses for bodily injury, property damage (including, but not limited to, arising out of the actual or alleged transmission of a communicable disease), wrongful death, loss of services or otherwise which may arise out of my use of Paintball, Airsoft, and/or Gellyball equipment or my participation in Paintball, Airsoft, and/or Gellyball activities. I specifically understand that I am releasing, discharging and waiving any claims or actions that I may have presently or in the future for the negligent acts or other conduct by the owners, agents, officers or employees of FP. This Waiver is good through 3/26/27.

MEDICAL PERMISSION AUTHORIZATION

If the participant is of minority age, the undersigned parent or guardian hereby gives permission for FP to authorize emergency medical treatment as may be deemed necessary for the child named below while participating in Paintball, Airsoft, and/or Gellyball games.

I HAVE READ THE ABOVE WAIVER AND RELEASE AND BY SIGNING IT AGREE IT IS MY INTENTION TO EXEMPT AND RELIEVE FP FROM LIABILITY FOR PERSONAL INJURY, PROPERTY DAMAGE OR WRONGFUL DEATH CAUSED BY NEGLIGENCE OR ANY OTHER CAUSE.`,
    },
  },
  {
    id: "futureball-2027-01-24-winter-airsoft",
    title: "Winter Airsoft",
    date: "2027-01-24",
    startTime: "11:00 AM",
    endTime: "3:00 PM",
    type: "OUTDOOR",
    description: "Winter airsoft session, 11am-3pm, weather permitting. Own gear only: no rentals and no HPA fills.",
    sourceUrl: "https://www.futureball.com/",
    waiver: {
      version: "2026-10-26",
      isDemo: false, // swapped 2026-10-26 from the generic placeholder to Futureball's real waiver text (supplied by Michael); per its own text, good through 3/26/27
      text: `LIABILITY WAIVER AND RELEASE OF CLAIMS

IN CONSIDERATION of being permitted to participate in any Paintball, Airsoft, and/or Gellyball activities including, but not limited to, playing, using the premises of, renting and operating equipment leased, sanctioned and/or operated by the above named vendor, I acknowledge and agree that:

I fully understand and acknowledge that; (a) risks and dangers exist in my use of Paintball, Airsoft, and/or Gellyball equipment and my participation in Paintball, Airsoft, and/or Gellyball activities; (b) my participation in such activities and/or use of such equipment may result in my injury or illness including but not limited to bodily injury, disease strains, fractures, partial and/or total paralysis, eye injury, blindness, heat stroke, heart attack, death or other ailments that could cause serious disability; (c) these risks and dangers may be caused by the negligence of the owners, employees, officers or agents of FP; the negligence of the participants, the negligence of others, accidents, breaches of contract, the forces of nature or other causes. These risks and dangers may arise from foreseeable or unforeseeable causes; and (d) by my participation in these activities and/or use of equipment, I hereby assume all risks and dangers and all responsibility for any losses and/or damages, whether caused in whole or in part by the negligence or other conduct of the owners, agents, officers, employees of FP, or by any other person.

I, on behalf of myself, my personal representatives and my heirs, hereby voluntarily agree to release, waive, discharge, hold harmless, defend and indemnify FP and it's owners, agents, officers and employees from any and all claims, actions or losses for bodily injury, property damage (including, but not limited to, arising out of the actual or alleged transmission of a communicable disease), wrongful death, loss of services or otherwise which may arise out of my use of Paintball, Airsoft, and/or Gellyball equipment or my participation in Paintball, Airsoft, and/or Gellyball activities. I specifically understand that I am releasing, discharging and waiving any claims or actions that I may have presently or in the future for the negligent acts or other conduct by the owners, agents, officers or employees of FP. This Waiver is good through 3/26/27.

MEDICAL PERMISSION AUTHORIZATION

If the participant is of minority age, the undersigned parent or guardian hereby gives permission for FP to authorize emergency medical treatment as may be deemed necessary for the child named below while participating in Paintball, Airsoft, and/or Gellyball games.

I HAVE READ THE ABOVE WAIVER AND RELEASE AND BY SIGNING IT AGREE IT IS MY INTENTION TO EXEMPT AND RELIEVE FP FROM LIABILITY FOR PERSONAL INJURY, PROPERTY DAMAGE OR WRONGFUL DEATH CAUSED BY NEGLIGENCE OR ANY OTHER CAUSE.`,
    },
  },
  {
    id: "futureball-2027-02-07-winter-airsoft",
    title: "Winter Airsoft",
    date: "2027-02-07",
    startTime: "11:00 AM",
    endTime: "3:00 PM",
    type: "OUTDOOR",
    description: "Winter airsoft session, 11am-3pm, weather permitting. Own gear only: no rentals and no HPA fills.",
    sourceUrl: "https://www.futureball.com/",
    waiver: {
      version: "2026-10-26",
      isDemo: false, // swapped 2026-10-26 from the generic placeholder to Futureball's real waiver text (supplied by Michael); per its own text, good through 3/26/27
      text: `LIABILITY WAIVER AND RELEASE OF CLAIMS

IN CONSIDERATION of being permitted to participate in any Paintball, Airsoft, and/or Gellyball activities including, but not limited to, playing, using the premises of, renting and operating equipment leased, sanctioned and/or operated by the above named vendor, I acknowledge and agree that:

I fully understand and acknowledge that; (a) risks and dangers exist in my use of Paintball, Airsoft, and/or Gellyball equipment and my participation in Paintball, Airsoft, and/or Gellyball activities; (b) my participation in such activities and/or use of such equipment may result in my injury or illness including but not limited to bodily injury, disease strains, fractures, partial and/or total paralysis, eye injury, blindness, heat stroke, heart attack, death or other ailments that could cause serious disability; (c) these risks and dangers may be caused by the negligence of the owners, employees, officers or agents of FP; the negligence of the participants, the negligence of others, accidents, breaches of contract, the forces of nature or other causes. These risks and dangers may arise from foreseeable or unforeseeable causes; and (d) by my participation in these activities and/or use of equipment, I hereby assume all risks and dangers and all responsibility for any losses and/or damages, whether caused in whole or in part by the negligence or other conduct of the owners, agents, officers, employees of FP, or by any other person.

I, on behalf of myself, my personal representatives and my heirs, hereby voluntarily agree to release, waive, discharge, hold harmless, defend and indemnify FP and it's owners, agents, officers and employees from any and all claims, actions or losses for bodily injury, property damage (including, but not limited to, arising out of the actual or alleged transmission of a communicable disease), wrongful death, loss of services or otherwise which may arise out of my use of Paintball, Airsoft, and/or Gellyball equipment or my participation in Paintball, Airsoft, and/or Gellyball activities. I specifically understand that I am releasing, discharging and waiving any claims or actions that I may have presently or in the future for the negligent acts or other conduct by the owners, agents, officers or employees of FP. This Waiver is good through 3/26/27.

MEDICAL PERMISSION AUTHORIZATION

If the participant is of minority age, the undersigned parent or guardian hereby gives permission for FP to authorize emergency medical treatment as may be deemed necessary for the child named below while participating in Paintball, Airsoft, and/or Gellyball games.

I HAVE READ THE ABOVE WAIVER AND RELEASE AND BY SIGNING IT AGREE IT IS MY INTENTION TO EXEMPT AND RELIEVE FP FROM LIABILITY FOR PERSONAL INJURY, PROPERTY DAMAGE OR WRONGFUL DEATH CAUSED BY NEGLIGENCE OR ANY OTHER CAUSE.`,
    },
  },
  {
    id: "futureball-2027-02-21-winter-airsoft",
    title: "Winter Airsoft",
    date: "2027-02-21",
    startTime: "11:00 AM",
    endTime: "3:00 PM",
    type: "OUTDOOR",
    description: "Winter airsoft session, 11am-3pm, weather permitting. Own gear only: no rentals and no HPA fills.",
    sourceUrl: "https://www.futureball.com/",
    waiver: {
      version: "2026-10-26",
      isDemo: false, // swapped 2026-10-26 from the generic placeholder to Futureball's real waiver text (supplied by Michael); per its own text, good through 3/26/27
      text: `LIABILITY WAIVER AND RELEASE OF CLAIMS

IN CONSIDERATION of being permitted to participate in any Paintball, Airsoft, and/or Gellyball activities including, but not limited to, playing, using the premises of, renting and operating equipment leased, sanctioned and/or operated by the above named vendor, I acknowledge and agree that:

I fully understand and acknowledge that; (a) risks and dangers exist in my use of Paintball, Airsoft, and/or Gellyball equipment and my participation in Paintball, Airsoft, and/or Gellyball activities; (b) my participation in such activities and/or use of such equipment may result in my injury or illness including but not limited to bodily injury, disease strains, fractures, partial and/or total paralysis, eye injury, blindness, heat stroke, heart attack, death or other ailments that could cause serious disability; (c) these risks and dangers may be caused by the negligence of the owners, employees, officers or agents of FP; the negligence of the participants, the negligence of others, accidents, breaches of contract, the forces of nature or other causes. These risks and dangers may arise from foreseeable or unforeseeable causes; and (d) by my participation in these activities and/or use of equipment, I hereby assume all risks and dangers and all responsibility for any losses and/or damages, whether caused in whole or in part by the negligence or other conduct of the owners, agents, officers, employees of FP, or by any other person.

I, on behalf of myself, my personal representatives and my heirs, hereby voluntarily agree to release, waive, discharge, hold harmless, defend and indemnify FP and it's owners, agents, officers and employees from any and all claims, actions or losses for bodily injury, property damage (including, but not limited to, arising out of the actual or alleged transmission of a communicable disease), wrongful death, loss of services or otherwise which may arise out of my use of Paintball, Airsoft, and/or Gellyball equipment or my participation in Paintball, Airsoft, and/or Gellyball activities. I specifically understand that I am releasing, discharging and waiving any claims or actions that I may have presently or in the future for the negligent acts or other conduct by the owners, agents, officers or employees of FP. This Waiver is good through 3/26/27.

MEDICAL PERMISSION AUTHORIZATION

If the participant is of minority age, the undersigned parent or guardian hereby gives permission for FP to authorize emergency medical treatment as may be deemed necessary for the child named below while participating in Paintball, Airsoft, and/or Gellyball games.

I HAVE READ THE ABOVE WAIVER AND RELEASE AND BY SIGNING IT AGREE IT IS MY INTENTION TO EXEMPT AND RELIEVE FP FROM LIABILITY FOR PERSONAL INJURY, PROPERTY DAMAGE OR WRONGFUL DEATH CAUSED BY NEGLIGENCE OR ANY OTHER CAUSE.`,
    },
  },
  {
    id: "futureball-2027-03-07-winter-airsoft",
    title: "Winter Airsoft",
    date: "2027-03-07",
    startTime: "11:00 AM",
    endTime: "3:00 PM",
    type: "OUTDOOR",
    description: "Winter airsoft session, 11am-3pm, weather permitting. Own gear only: no rentals and no HPA fills.",
    sourceUrl: "https://www.futureball.com/",
    waiver: {
      version: "2026-10-26",
      isDemo: false, // swapped 2026-10-26 from the generic placeholder to Futureball's real waiver text (supplied by Michael); per its own text, good through 3/26/27
      text: `LIABILITY WAIVER AND RELEASE OF CLAIMS

IN CONSIDERATION of being permitted to participate in any Paintball, Airsoft, and/or Gellyball activities including, but not limited to, playing, using the premises of, renting and operating equipment leased, sanctioned and/or operated by the above named vendor, I acknowledge and agree that:

I fully understand and acknowledge that; (a) risks and dangers exist in my use of Paintball, Airsoft, and/or Gellyball equipment and my participation in Paintball, Airsoft, and/or Gellyball activities; (b) my participation in such activities and/or use of such equipment may result in my injury or illness including but not limited to bodily injury, disease strains, fractures, partial and/or total paralysis, eye injury, blindness, heat stroke, heart attack, death or other ailments that could cause serious disability; (c) these risks and dangers may be caused by the negligence of the owners, employees, officers or agents of FP; the negligence of the participants, the negligence of others, accidents, breaches of contract, the forces of nature or other causes. These risks and dangers may arise from foreseeable or unforeseeable causes; and (d) by my participation in these activities and/or use of equipment, I hereby assume all risks and dangers and all responsibility for any losses and/or damages, whether caused in whole or in part by the negligence or other conduct of the owners, agents, officers, employees of FP, or by any other person.

I, on behalf of myself, my personal representatives and my heirs, hereby voluntarily agree to release, waive, discharge, hold harmless, defend and indemnify FP and it's owners, agents, officers and employees from any and all claims, actions or losses for bodily injury, property damage (including, but not limited to, arising out of the actual or alleged transmission of a communicable disease), wrongful death, loss of services or otherwise which may arise out of my use of Paintball, Airsoft, and/or Gellyball equipment or my participation in Paintball, Airsoft, and/or Gellyball activities. I specifically understand that I am releasing, discharging and waiving any claims or actions that I may have presently or in the future for the negligent acts or other conduct by the owners, agents, officers or employees of FP. This Waiver is good through 3/26/27.

MEDICAL PERMISSION AUTHORIZATION

If the participant is of minority age, the undersigned parent or guardian hereby gives permission for FP to authorize emergency medical treatment as may be deemed necessary for the child named below while participating in Paintball, Airsoft, and/or Gellyball games.

I HAVE READ THE ABOVE WAIVER AND RELEASE AND BY SIGNING IT AGREE IT IS MY INTENTION TO EXEMPT AND RELIEVE FP FROM LIABILITY FOR PERSONAL INJURY, PROPERTY DAMAGE OR WRONGFUL DEATH CAUSED BY NEGLIGENCE OR ANY OTHER CAUSE.`,
    },
  },
  {
    id: "futureball-2027-03-21-winter-airsoft",
    title: "Winter Airsoft",
    date: "2027-03-21",
    startTime: "11:00 AM",
    endTime: "3:00 PM",
    type: "OUTDOOR",
    description: "Winter airsoft session, 11am-3pm, weather permitting. Own gear only: no rentals and no HPA fills.",
    sourceUrl: "https://www.futureball.com/",
    waiver: {
      version: "2026-10-26",
      isDemo: false, // swapped 2026-10-26 from the generic placeholder to Futureball's real waiver text (supplied by Michael); per its own text, good through 3/26/27
      text: `LIABILITY WAIVER AND RELEASE OF CLAIMS

IN CONSIDERATION of being permitted to participate in any Paintball, Airsoft, and/or Gellyball activities including, but not limited to, playing, using the premises of, renting and operating equipment leased, sanctioned and/or operated by the above named vendor, I acknowledge and agree that:

I fully understand and acknowledge that; (a) risks and dangers exist in my use of Paintball, Airsoft, and/or Gellyball equipment and my participation in Paintball, Airsoft, and/or Gellyball activities; (b) my participation in such activities and/or use of such equipment may result in my injury or illness including but not limited to bodily injury, disease strains, fractures, partial and/or total paralysis, eye injury, blindness, heat stroke, heart attack, death or other ailments that could cause serious disability; (c) these risks and dangers may be caused by the negligence of the owners, employees, officers or agents of FP; the negligence of the participants, the negligence of others, accidents, breaches of contract, the forces of nature or other causes. These risks and dangers may arise from foreseeable or unforeseeable causes; and (d) by my participation in these activities and/or use of equipment, I hereby assume all risks and dangers and all responsibility for any losses and/or damages, whether caused in whole or in part by the negligence or other conduct of the owners, agents, officers, employees of FP, or by any other person.

I, on behalf of myself, my personal representatives and my heirs, hereby voluntarily agree to release, waive, discharge, hold harmless, defend and indemnify FP and it's owners, agents, officers and employees from any and all claims, actions or losses for bodily injury, property damage (including, but not limited to, arising out of the actual or alleged transmission of a communicable disease), wrongful death, loss of services or otherwise which may arise out of my use of Paintball, Airsoft, and/or Gellyball equipment or my participation in Paintball, Airsoft, and/or Gellyball activities. I specifically understand that I am releasing, discharging and waiving any claims or actions that I may have presently or in the future for the negligent acts or other conduct by the owners, agents, officers or employees of FP. This Waiver is good through 3/26/27.

MEDICAL PERMISSION AUTHORIZATION

If the participant is of minority age, the undersigned parent or guardian hereby gives permission for FP to authorize emergency medical treatment as may be deemed necessary for the child named below while participating in Paintball, Airsoft, and/or Gellyball games.

I HAVE READ THE ABOVE WAIVER AND RELEASE AND BY SIGNING IT AGREE IT IS MY INTENTION TO EXEMPT AND RELIEVE FP FROM LIABILITY FOR PERSONAL INJURY, PROPERTY DAMAGE OR WRONGFUL DEATH CAUSED BY NEGLIGENCE OR ANY OTHER CAUSE.`,
    },
  },
  {
    id: "futureball-2027-04-03-season-opener",
    title: "Season Opener",
    date: "2027-04-03",
    type: "OUTDOOR",
    description: "Futureball's 2027 season opener.",
    sourceUrl: "https://www.futureball.com/",
    waiver: {
      version: "2026-10-26",
      isDemo: false, // swapped 2026-10-26 from the generic placeholder to Futureball's real waiver text (supplied by Michael); per its own text, good through 3/26/27
      text: `LIABILITY WAIVER AND RELEASE OF CLAIMS

IN CONSIDERATION of being permitted to participate in any Paintball, Airsoft, and/or Gellyball activities including, but not limited to, playing, using the premises of, renting and operating equipment leased, sanctioned and/or operated by the above named vendor, I acknowledge and agree that:

I fully understand and acknowledge that; (a) risks and dangers exist in my use of Paintball, Airsoft, and/or Gellyball equipment and my participation in Paintball, Airsoft, and/or Gellyball activities; (b) my participation in such activities and/or use of such equipment may result in my injury or illness including but not limited to bodily injury, disease strains, fractures, partial and/or total paralysis, eye injury, blindness, heat stroke, heart attack, death or other ailments that could cause serious disability; (c) these risks and dangers may be caused by the negligence of the owners, employees, officers or agents of FP; the negligence of the participants, the negligence of others, accidents, breaches of contract, the forces of nature or other causes. These risks and dangers may arise from foreseeable or unforeseeable causes; and (d) by my participation in these activities and/or use of equipment, I hereby assume all risks and dangers and all responsibility for any losses and/or damages, whether caused in whole or in part by the negligence or other conduct of the owners, agents, officers, employees of FP, or by any other person.

I, on behalf of myself, my personal representatives and my heirs, hereby voluntarily agree to release, waive, discharge, hold harmless, defend and indemnify FP and it's owners, agents, officers and employees from any and all claims, actions or losses for bodily injury, property damage (including, but not limited to, arising out of the actual or alleged transmission of a communicable disease), wrongful death, loss of services or otherwise which may arise out of my use of Paintball, Airsoft, and/or Gellyball equipment or my participation in Paintball, Airsoft, and/or Gellyball activities. I specifically understand that I am releasing, discharging and waiving any claims or actions that I may have presently or in the future for the negligent acts or other conduct by the owners, agents, officers or employees of FP. This Waiver is good through 3/26/27.

MEDICAL PERMISSION AUTHORIZATION

If the participant is of minority age, the undersigned parent or guardian hereby gives permission for FP to authorize emergency medical treatment as may be deemed necessary for the child named below while participating in Paintball, Airsoft, and/or Gellyball games.

I HAVE READ THE ABOVE WAIVER AND RELEASE AND BY SIGNING IT AGREE IT IS MY INTENTION TO EXEMPT AND RELIEVE FP FROM LIABILITY FOR PERSONAL INJURY, PROPERTY DAMAGE OR WRONGFUL DEATH CAUSED BY NEGLIGENCE OR ANY OTHER CAUSE.`,
    },
  },
  {
    id: "futureball-2027-04-25-customer-appreciation-day",
    title: "Customer Appreciation Day",
    date: "2027-04-25",
    type: "OUTDOOR",
    description: "Customer Appreciation Day. Paintball and airsoft.",
    sourceUrl: "https://www.futureball.com/",
    waiver: {
      version: "2026-10-26",
      isDemo: false, // swapped 2026-10-26 from the generic placeholder to Futureball's real waiver text (supplied by Michael); per its own text, good through 3/26/27
      text: `LIABILITY WAIVER AND RELEASE OF CLAIMS

IN CONSIDERATION of being permitted to participate in any Paintball, Airsoft, and/or Gellyball activities including, but not limited to, playing, using the premises of, renting and operating equipment leased, sanctioned and/or operated by the above named vendor, I acknowledge and agree that:

I fully understand and acknowledge that; (a) risks and dangers exist in my use of Paintball, Airsoft, and/or Gellyball equipment and my participation in Paintball, Airsoft, and/or Gellyball activities; (b) my participation in such activities and/or use of such equipment may result in my injury or illness including but not limited to bodily injury, disease strains, fractures, partial and/or total paralysis, eye injury, blindness, heat stroke, heart attack, death or other ailments that could cause serious disability; (c) these risks and dangers may be caused by the negligence of the owners, employees, officers or agents of FP; the negligence of the participants, the negligence of others, accidents, breaches of contract, the forces of nature or other causes. These risks and dangers may arise from foreseeable or unforeseeable causes; and (d) by my participation in these activities and/or use of equipment, I hereby assume all risks and dangers and all responsibility for any losses and/or damages, whether caused in whole or in part by the negligence or other conduct of the owners, agents, officers, employees of FP, or by any other person.

I, on behalf of myself, my personal representatives and my heirs, hereby voluntarily agree to release, waive, discharge, hold harmless, defend and indemnify FP and it's owners, agents, officers and employees from any and all claims, actions or losses for bodily injury, property damage (including, but not limited to, arising out of the actual or alleged transmission of a communicable disease), wrongful death, loss of services or otherwise which may arise out of my use of Paintball, Airsoft, and/or Gellyball equipment or my participation in Paintball, Airsoft, and/or Gellyball activities. I specifically understand that I am releasing, discharging and waiving any claims or actions that I may have presently or in the future for the negligent acts or other conduct by the owners, agents, officers or employees of FP. This Waiver is good through 3/26/27.

MEDICAL PERMISSION AUTHORIZATION

If the participant is of minority age, the undersigned parent or guardian hereby gives permission for FP to authorize emergency medical treatment as may be deemed necessary for the child named below while participating in Paintball, Airsoft, and/or Gellyball games.

I HAVE READ THE ABOVE WAIVER AND RELEASE AND BY SIGNING IT AGREE IT IS MY INTENTION TO EXEMPT AND RELIEVE FP FROM LIABILITY FOR PERSONAL INJURY, PROPERTY DAMAGE OR WRONGFUL DEATH CAUSED BY NEGLIGENCE OR ANY OTHER CAUSE.`,
    },
  },
  {
    id: "futureball-2027-05-08-bad-blood",
    title: "Bad Blood",
    date: "2027-05-08",
    type: "OUTDOOR",
    description: "Airsoft big game.",
    sourceUrl: "https://www.futureball.com/",
    waiver: {
      version: "2026-10-26",
      isDemo: false, // swapped 2026-10-26 from the generic placeholder to Futureball's real waiver text (supplied by Michael); per its own text, good through 3/26/27
      text: `LIABILITY WAIVER AND RELEASE OF CLAIMS

IN CONSIDERATION of being permitted to participate in any Paintball, Airsoft, and/or Gellyball activities including, but not limited to, playing, using the premises of, renting and operating equipment leased, sanctioned and/or operated by the above named vendor, I acknowledge and agree that:

I fully understand and acknowledge that; (a) risks and dangers exist in my use of Paintball, Airsoft, and/or Gellyball equipment and my participation in Paintball, Airsoft, and/or Gellyball activities; (b) my participation in such activities and/or use of such equipment may result in my injury or illness including but not limited to bodily injury, disease strains, fractures, partial and/or total paralysis, eye injury, blindness, heat stroke, heart attack, death or other ailments that could cause serious disability; (c) these risks and dangers may be caused by the negligence of the owners, employees, officers or agents of FP; the negligence of the participants, the negligence of others, accidents, breaches of contract, the forces of nature or other causes. These risks and dangers may arise from foreseeable or unforeseeable causes; and (d) by my participation in these activities and/or use of equipment, I hereby assume all risks and dangers and all responsibility for any losses and/or damages, whether caused in whole or in part by the negligence or other conduct of the owners, agents, officers, employees of FP, or by any other person.

I, on behalf of myself, my personal representatives and my heirs, hereby voluntarily agree to release, waive, discharge, hold harmless, defend and indemnify FP and it's owners, agents, officers and employees from any and all claims, actions or losses for bodily injury, property damage (including, but not limited to, arising out of the actual or alleged transmission of a communicable disease), wrongful death, loss of services or otherwise which may arise out of my use of Paintball, Airsoft, and/or Gellyball equipment or my participation in Paintball, Airsoft, and/or Gellyball activities. I specifically understand that I am releasing, discharging and waiving any claims or actions that I may have presently or in the future for the negligent acts or other conduct by the owners, agents, officers or employees of FP. This Waiver is good through 3/26/27.

MEDICAL PERMISSION AUTHORIZATION

If the participant is of minority age, the undersigned parent or guardian hereby gives permission for FP to authorize emergency medical treatment as may be deemed necessary for the child named below while participating in Paintball, Airsoft, and/or Gellyball games.

I HAVE READ THE ABOVE WAIVER AND RELEASE AND BY SIGNING IT AGREE IT IS MY INTENTION TO EXEMPT AND RELIEVE FP FROM LIABILITY FOR PERSONAL INJURY, PROPERTY DAMAGE OR WRONGFUL DEATH CAUSED BY NEGLIGENCE OR ANY OTHER CAUSE.`,
    },
  },
  {
    id: "futureball-2027-08-07-future-war",
    title: "Future War",
    date: "2027-08-07",
    type: "OUTDOOR",
    description: "Airsoft big game.",
    sourceUrl: "https://www.futureball.com/",
    waiver: {
      version: "2026-10-26",
      isDemo: false, // swapped 2026-10-26 from the generic placeholder to Futureball's real waiver text (supplied by Michael); per its own text, good through 3/26/27
      text: `LIABILITY WAIVER AND RELEASE OF CLAIMS

IN CONSIDERATION of being permitted to participate in any Paintball, Airsoft, and/or Gellyball activities including, but not limited to, playing, using the premises of, renting and operating equipment leased, sanctioned and/or operated by the above named vendor, I acknowledge and agree that:

I fully understand and acknowledge that; (a) risks and dangers exist in my use of Paintball, Airsoft, and/or Gellyball equipment and my participation in Paintball, Airsoft, and/or Gellyball activities; (b) my participation in such activities and/or use of such equipment may result in my injury or illness including but not limited to bodily injury, disease strains, fractures, partial and/or total paralysis, eye injury, blindness, heat stroke, heart attack, death or other ailments that could cause serious disability; (c) these risks and dangers may be caused by the negligence of the owners, employees, officers or agents of FP; the negligence of the participants, the negligence of others, accidents, breaches of contract, the forces of nature or other causes. These risks and dangers may arise from foreseeable or unforeseeable causes; and (d) by my participation in these activities and/or use of equipment, I hereby assume all risks and dangers and all responsibility for any losses and/or damages, whether caused in whole or in part by the negligence or other conduct of the owners, agents, officers, employees of FP, or by any other person.

I, on behalf of myself, my personal representatives and my heirs, hereby voluntarily agree to release, waive, discharge, hold harmless, defend and indemnify FP and it's owners, agents, officers and employees from any and all claims, actions or losses for bodily injury, property damage (including, but not limited to, arising out of the actual or alleged transmission of a communicable disease), wrongful death, loss of services or otherwise which may arise out of my use of Paintball, Airsoft, and/or Gellyball equipment or my participation in Paintball, Airsoft, and/or Gellyball activities. I specifically understand that I am releasing, discharging and waiving any claims or actions that I may have presently or in the future for the negligent acts or other conduct by the owners, agents, officers or employees of FP. This Waiver is good through 3/26/27.

MEDICAL PERMISSION AUTHORIZATION

If the participant is of minority age, the undersigned parent or guardian hereby gives permission for FP to authorize emergency medical treatment as may be deemed necessary for the child named below while participating in Paintball, Airsoft, and/or Gellyball games.

I HAVE READ THE ABOVE WAIVER AND RELEASE AND BY SIGNING IT AGREE IT IS MY INTENTION TO EXEMPT AND RELIEVE FP FROM LIABILITY FOR PERSONAL INJURY, PROPERTY DAMAGE OR WRONGFUL DEATH CAUSED BY NEGLIGENCE OR ANY OTHER CAUSE.`,
    },
  },
  {
    id: "futureball-2027-09-18-armageddon",
    title: "Armageddon",
    date: "2027-09-18",
    type: "OUTDOOR",
    description: "Airsoft big game.",
    sourceUrl: "https://www.futureball.com/",
    waiver: {
      version: "2026-10-26",
      isDemo: false, // swapped 2026-10-26 from the generic placeholder to Futureball's real waiver text (supplied by Michael); per its own text, good through 3/26/27
      text: `LIABILITY WAIVER AND RELEASE OF CLAIMS

IN CONSIDERATION of being permitted to participate in any Paintball, Airsoft, and/or Gellyball activities including, but not limited to, playing, using the premises of, renting and operating equipment leased, sanctioned and/or operated by the above named vendor, I acknowledge and agree that:

I fully understand and acknowledge that; (a) risks and dangers exist in my use of Paintball, Airsoft, and/or Gellyball equipment and my participation in Paintball, Airsoft, and/or Gellyball activities; (b) my participation in such activities and/or use of such equipment may result in my injury or illness including but not limited to bodily injury, disease strains, fractures, partial and/or total paralysis, eye injury, blindness, heat stroke, heart attack, death or other ailments that could cause serious disability; (c) these risks and dangers may be caused by the negligence of the owners, employees, officers or agents of FP; the negligence of the participants, the negligence of others, accidents, breaches of contract, the forces of nature or other causes. These risks and dangers may arise from foreseeable or unforeseeable causes; and (d) by my participation in these activities and/or use of equipment, I hereby assume all risks and dangers and all responsibility for any losses and/or damages, whether caused in whole or in part by the negligence or other conduct of the owners, agents, officers, employees of FP, or by any other person.

I, on behalf of myself, my personal representatives and my heirs, hereby voluntarily agree to release, waive, discharge, hold harmless, defend and indemnify FP and it's owners, agents, officers and employees from any and all claims, actions or losses for bodily injury, property damage (including, but not limited to, arising out of the actual or alleged transmission of a communicable disease), wrongful death, loss of services or otherwise which may arise out of my use of Paintball, Airsoft, and/or Gellyball equipment or my participation in Paintball, Airsoft, and/or Gellyball activities. I specifically understand that I am releasing, discharging and waiving any claims or actions that I may have presently or in the future for the negligent acts or other conduct by the owners, agents, officers or employees of FP. This Waiver is good through 3/26/27.

MEDICAL PERMISSION AUTHORIZATION

If the participant is of minority age, the undersigned parent or guardian hereby gives permission for FP to authorize emergency medical treatment as may be deemed necessary for the child named below while participating in Paintball, Airsoft, and/or Gellyball games.

I HAVE READ THE ABOVE WAIVER AND RELEASE AND BY SIGNING IT AGREE IT IS MY INTENTION TO EXEMPT AND RELIEVE FP FROM LIABILITY FOR PERSONAL INJURY, PROPERTY DAMAGE OR WRONGFUL DEATH CAUSED BY NEGLIGENCE OR ANY OTHER CAUSE.`,
    },
  },
  {
    id: "futureball-2027-10-15-zombie-apocalypse",
    title: "Zombie Apocalypse",
    date: "2027-10-15",
    endDate: "2027-10-17",
    type: "OUTDOOR",
    description: "Airsoft big game. Weekend event.",
    sourceUrl: "https://www.futureball.com/",
    waiver: {
      version: "2026-10-26",
      isDemo: false, // swapped 2026-10-26 from the generic placeholder to Futureball's real waiver text (supplied by Michael); per its own text, good through 3/26/27
      text: `LIABILITY WAIVER AND RELEASE OF CLAIMS

IN CONSIDERATION of being permitted to participate in any Paintball, Airsoft, and/or Gellyball activities including, but not limited to, playing, using the premises of, renting and operating equipment leased, sanctioned and/or operated by the above named vendor, I acknowledge and agree that:

I fully understand and acknowledge that; (a) risks and dangers exist in my use of Paintball, Airsoft, and/or Gellyball equipment and my participation in Paintball, Airsoft, and/or Gellyball activities; (b) my participation in such activities and/or use of such equipment may result in my injury or illness including but not limited to bodily injury, disease strains, fractures, partial and/or total paralysis, eye injury, blindness, heat stroke, heart attack, death or other ailments that could cause serious disability; (c) these risks and dangers may be caused by the negligence of the owners, employees, officers or agents of FP; the negligence of the participants, the negligence of others, accidents, breaches of contract, the forces of nature or other causes. These risks and dangers may arise from foreseeable or unforeseeable causes; and (d) by my participation in these activities and/or use of equipment, I hereby assume all risks and dangers and all responsibility for any losses and/or damages, whether caused in whole or in part by the negligence or other conduct of the owners, agents, officers, employees of FP, or by any other person.

I, on behalf of myself, my personal representatives and my heirs, hereby voluntarily agree to release, waive, discharge, hold harmless, defend and indemnify FP and it's owners, agents, officers and employees from any and all claims, actions or losses for bodily injury, property damage (including, but not limited to, arising out of the actual or alleged transmission of a communicable disease), wrongful death, loss of services or otherwise which may arise out of my use of Paintball, Airsoft, and/or Gellyball equipment or my participation in Paintball, Airsoft, and/or Gellyball activities. I specifically understand that I am releasing, discharging and waiving any claims or actions that I may have presently or in the future for the negligent acts or other conduct by the owners, agents, officers or employees of FP. This Waiver is good through 3/26/27.

MEDICAL PERMISSION AUTHORIZATION

If the participant is of minority age, the undersigned parent or guardian hereby gives permission for FP to authorize emergency medical treatment as may be deemed necessary for the child named below while participating in Paintball, Airsoft, and/or Gellyball games.

I HAVE READ THE ABOVE WAIVER AND RELEASE AND BY SIGNING IT AGREE IT IS MY INTENTION TO EXEMPT AND RELIEVE FP FROM LIABILITY FOR PERSONAL INJURY, PROPERTY DAMAGE OR WRONGFUL DEATH CAUSED BY NEGLIGENCE OR ANY OTHER CAUSE.`,
    },
  },
  {
    id: "futureball-2027-10-16-creepy-creatures",
    title: "Creepy Creatures",
    date: "2027-10-16",
    type: "OUTDOOR",
    description: "Airsoft night event.",
    sourceUrl: "https://www.futureball.com/",
    waiver: {
      version: "2026-10-26",
      isDemo: false, // swapped 2026-10-26 from the generic placeholder to Futureball's real waiver text (supplied by Michael); per its own text, good through 3/26/27
      text: `LIABILITY WAIVER AND RELEASE OF CLAIMS

IN CONSIDERATION of being permitted to participate in any Paintball, Airsoft, and/or Gellyball activities including, but not limited to, playing, using the premises of, renting and operating equipment leased, sanctioned and/or operated by the above named vendor, I acknowledge and agree that:

I fully understand and acknowledge that; (a) risks and dangers exist in my use of Paintball, Airsoft, and/or Gellyball equipment and my participation in Paintball, Airsoft, and/or Gellyball activities; (b) my participation in such activities and/or use of such equipment may result in my injury or illness including but not limited to bodily injury, disease strains, fractures, partial and/or total paralysis, eye injury, blindness, heat stroke, heart attack, death or other ailments that could cause serious disability; (c) these risks and dangers may be caused by the negligence of the owners, employees, officers or agents of FP; the negligence of the participants, the negligence of others, accidents, breaches of contract, the forces of nature or other causes. These risks and dangers may arise from foreseeable or unforeseeable causes; and (d) by my participation in these activities and/or use of equipment, I hereby assume all risks and dangers and all responsibility for any losses and/or damages, whether caused in whole or in part by the negligence or other conduct of the owners, agents, officers, employees of FP, or by any other person.

I, on behalf of myself, my personal representatives and my heirs, hereby voluntarily agree to release, waive, discharge, hold harmless, defend and indemnify FP and it's owners, agents, officers and employees from any and all claims, actions or losses for bodily injury, property damage (including, but not limited to, arising out of the actual or alleged transmission of a communicable disease), wrongful death, loss of services or otherwise which may arise out of my use of Paintball, Airsoft, and/or Gellyball equipment or my participation in Paintball, Airsoft, and/or Gellyball activities. I specifically understand that I am releasing, discharging and waiving any claims or actions that I may have presently or in the future for the negligent acts or other conduct by the owners, agents, officers or employees of FP. This Waiver is good through 3/26/27.

MEDICAL PERMISSION AUTHORIZATION

If the participant is of minority age, the undersigned parent or guardian hereby gives permission for FP to authorize emergency medical treatment as may be deemed necessary for the child named below while participating in Paintball, Airsoft, and/or Gellyball games.

I HAVE READ THE ABOVE WAIVER AND RELEASE AND BY SIGNING IT AGREE IT IS MY INTENTION TO EXEMPT AND RELIEVE FP FROM LIABILITY FOR PERSONAL INJURY, PROPERTY DAMAGE OR WRONGFUL DEATH CAUSED BY NEGLIGENCE OR ANY OTHER CAUSE.`,
    },
  },
  {
    id: "futureball-2027-11-14-customer-appreciation-deal-day",
    title: "Customer Appreciation & Deal Day",
    date: "2027-11-14",
    type: "OUTDOOR",
    description: "Customer appreciation and deal day. Paintball and airsoft.",
    sourceUrl: "https://www.futureball.com/",
    waiver: {
      version: "2026-10-26",
      isDemo: false, // swapped 2026-10-26 from the generic placeholder to Futureball's real waiver text (supplied by Michael); per its own text, good through 3/26/27
      text: `LIABILITY WAIVER AND RELEASE OF CLAIMS

IN CONSIDERATION of being permitted to participate in any Paintball, Airsoft, and/or Gellyball activities including, but not limited to, playing, using the premises of, renting and operating equipment leased, sanctioned and/or operated by the above named vendor, I acknowledge and agree that:

I fully understand and acknowledge that; (a) risks and dangers exist in my use of Paintball, Airsoft, and/or Gellyball equipment and my participation in Paintball, Airsoft, and/or Gellyball activities; (b) my participation in such activities and/or use of such equipment may result in my injury or illness including but not limited to bodily injury, disease strains, fractures, partial and/or total paralysis, eye injury, blindness, heat stroke, heart attack, death or other ailments that could cause serious disability; (c) these risks and dangers may be caused by the negligence of the owners, employees, officers or agents of FP; the negligence of the participants, the negligence of others, accidents, breaches of contract, the forces of nature or other causes. These risks and dangers may arise from foreseeable or unforeseeable causes; and (d) by my participation in these activities and/or use of equipment, I hereby assume all risks and dangers and all responsibility for any losses and/or damages, whether caused in whole or in part by the negligence or other conduct of the owners, agents, officers, employees of FP, or by any other person.

I, on behalf of myself, my personal representatives and my heirs, hereby voluntarily agree to release, waive, discharge, hold harmless, defend and indemnify FP and it's owners, agents, officers and employees from any and all claims, actions or losses for bodily injury, property damage (including, but not limited to, arising out of the actual or alleged transmission of a communicable disease), wrongful death, loss of services or otherwise which may arise out of my use of Paintball, Airsoft, and/or Gellyball equipment or my participation in Paintball, Airsoft, and/or Gellyball activities. I specifically understand that I am releasing, discharging and waiving any claims or actions that I may have presently or in the future for the negligent acts or other conduct by the owners, agents, officers or employees of FP. This Waiver is good through 3/26/27.

MEDICAL PERMISSION AUTHORIZATION

If the participant is of minority age, the undersigned parent or guardian hereby gives permission for FP to authorize emergency medical treatment as may be deemed necessary for the child named below while participating in Paintball, Airsoft, and/or Gellyball games.

I HAVE READ THE ABOVE WAIVER AND RELEASE AND BY SIGNING IT AGREE IT IS MY INTENTION TO EXEMPT AND RELIEVE FP FROM LIABILITY FOR PERSONAL INJURY, PROPERTY DAMAGE OR WRONGFUL DEATH CAUSED BY NEGLIGENCE OR ANY OTHER CAUSE.`,
    },
  },
];

const field = await db.collection("fields").doc("futureball").get();
if (!field.exists) { console.log("fields/futureball not found -- nothing changed."); process.exit(1); }
const f = field.data();
console.log(`Field: ${f.name} | claimed=${!!f.claimed} | bookingsLive=${!!f.bookingsLive}`);

const snaps = await db.getAll(...events.map((e) => db.collection("events").doc(e.id)));
const batch = db.batch();
let toWrite = 0;
events.forEach((e, i) => {
  if (snaps[i].exists) { console.log(`SKIP (exists)  ${e.id}`); return; }
  const { id, ...data } = e;
  console.log(`${WRITE ? "CREATE" : "would create"}  ${id}  ${data.title}`);
  batch.set(db.collection("events").doc(id), { ...data, fieldId: "futureball", fieldName: f.name || "Futureball" });
  toWrite++;
});
if (!WRITE) { console.log(`Dry run: ${toWrite} event(s) would be created. Re-run with --write to apply.`); process.exit(0); }
if (toWrite) await batch.commit();
console.log(`Created ${toWrite} event(s).`);
