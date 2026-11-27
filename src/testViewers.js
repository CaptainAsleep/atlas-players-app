// Accounts that can see test organizer events (events with testEvent: true,
// created by an owners/{uid}.testAccount organizer). Everyone else never
// sees them anywhere in the app. Michael + Rogue (the old card-beta pair).
export const TEST_VIEWER_UIDS = new Set([
  "lg4HMLTJvsPfSEN1pvNhMV4fbct1", // Atlas (Michael)
  "4gaohQb6ddMvdSNdhlDp75eMZke2", // Rogue
]);
export const isTestViewer = (uid) => !!uid && TEST_VIEWER_UIDS.has(uid);
