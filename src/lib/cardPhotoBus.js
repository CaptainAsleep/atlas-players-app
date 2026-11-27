// Card photo flow trigger (2026-11-26). Anything can ask the app-level
// <CardPhotoChooser> (src/CardPhotoFlow.jsx) to open, without passing props
// through every screen:
//   offerCardPhoto({ blob, aspect })            after a profile upload: "use this for your card?"
//   offerCardPhoto({ dependentId, callsign })   pick a card photo for one of your kids
//   offerCardPhoto({})                           pick a new card photo for yourself
let listener = null;

export function offerCardPhoto(offer = {}) {
  if (listener) listener(offer);
}

export function onCardPhotoOffer(fn) {
  listener = fn;
  return () => { if (listener === fn) listener = null; };
}
