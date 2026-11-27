import { test } from "node:test";
import assert from "node:assert/strict";
import { cardPhotoPayment, cleanAspect, cleanCardCrop, reportCaseId, parseCaseId, applyReport, storagePathFromUrl, cardPhotoFields, CARD_PHOTO_PRICE_CENTS } from "./cardPhotos.js";

test("price", () => assert.equal(CARD_PHOTO_PRICE_CENTS, 399));

test("first card photo is free, then a credit is needed", () => {
  assert.equal(cardPhotoPayment(0, false), "free");
  assert.equal(cardPhotoPayment(undefined, false), "free");
  assert.equal(cardPhotoPayment(1, false), null);
  assert.equal(cardPhotoPayment(1, true), "credit");
  assert.equal(cardPhotoPayment(7, true), "credit");
});

test("aspect + crop cleaning", () => {
  assert.equal(cleanAspect("x"), 1);
  assert.equal(cleanAspect(0.75), 0.75);
  assert.equal(cleanAspect(99), 5);
  assert.deepEqual(cleanCardCrop(null), { x: 0.5, y: 0.5, zoom: 1 });
  assert.deepEqual(cleanCardCrop({ x: 2, y: -1, zoom: 9 }), { x: 1, y: 0, zoom: 4 });
});

test("case ids", () => {
  const uid = "lg4HMLTJvsPfSEN1pvNhMV4fbct1";
  assert.equal(reportCaseId({ ownerKind: "adult", ownerId: uid, target: "card" }), `adult_${uid}_card`);
  assert.equal(reportCaseId({ ownerKind: "child", ownerId: "c" + "a".repeat(24), target: "profile" }), `child_c${"a".repeat(24)}_profile`);
  assert.equal(reportCaseId({ ownerKind: "child", ownerId: uid, target: "card" }), null);
  assert.equal(reportCaseId({ ownerKind: "adult", ownerId: uid, target: "banner" }), null);
  assert.equal(reportCaseId({ ownerKind: "adult", ownerId: "../x", target: "card" }), null);
  assert.deepEqual(parseCaseId(`adult_${uid}_card`), { ownerKind: "adult", ownerId: uid, target: "card" });
  assert.equal(parseCaseId("nope"), null);
});

test("three different reporters hide a photo", () => {
  let c = null;
  let r = applyReport(c, "u1", "a"); assert.equal(r.status, "counted"); assert.equal(r.hide, false);
  c = { photoUrl: "u1", reporters: r.reporters, status: "open" };
  r = applyReport(c, "u1", "a"); assert.equal(r.status, "duplicate");
  r = applyReport(c, "u1", "b"); c.reporters = r.reporters; assert.equal(r.hide, false);
  r = applyReport(c, "u1", "c"); assert.equal(r.hide, true); assert.equal(r.reporters.length, 3);
});

test("a new photo starts the count over; restored reporters don't count again", () => {
  const c = { photoUrl: "old", reporters: ["a", "b"], status: "open" };
  const r = applyReport(c, "new", "c");
  assert.deepEqual(r.reporters, ["c"]);
  const restored = { photoUrl: "back", reporters: [], ignoredReporters: ["a", "b", "c"], status: "cleared" };
  assert.equal(applyReport(restored, "back", "a").status, "ignored");
  assert.equal(applyReport(restored, "back", "d").status, "counted");
  const hidden = { photoUrl: "u", reporters: ["a", "b", "c"], status: "hidden" };
  assert.equal(applyReport(hidden, "u", "d").hide, false);
});

test("storage path from a download URL", () => {
  const url = "https://firebasestorage.googleapis.com/v0/b/b.appspot.com/o/avatars%2Fabc%2Fprofile.jpg?alt=media&token=t";
  assert.equal(storagePathFromUrl(url), "avatars/abc/profile.jpg");
  assert.equal(storagePathFromUrl("https://example.com/x.jpg"), null);
  assert.equal(storagePathFromUrl(null), null);
});

test("card photo fields bump the change count", () => {
  const f = cardPhotoFields({ url: "u", path: "cardPhotos/x.jpg", aspect: 0.8, changes: 0 });
  assert.equal(f.cardPhotoChanges, 1);
  assert.equal(f.cardPhotoHiRes, true);
  assert.equal(cardPhotoFields({ url: "u", path: "p", aspect: 1, changes: 2, hiRes: false }).cardPhotoChanges, 3);
});
