// Photo crop math shared by the crop tool (PhotoCropper.jsx) and the trading
// card. A crop is { x, y, zoom }: the point of the photo at the frame's center
// (0..1 across / down the photo) and a zoom (1 = the photo just covers the
// frame). Stored as numbers, not baked into a new image, so the card crop can
// be changed any time and the same upload serves every shape.

export const DEFAULT_CROP = { x: 0.5, y: 0.5, zoom: 1 };
export const MIN_ZOOM = 1;
export const MAX_ZOOM = 4;
export const CARD_ASPECT = 5 / 7; // width / height of a trading card

// The part of the photo the frame shows, in photo pixels.
// iw/ih: photo size (any units, only the ratio matters with aspect-only math).
export function cropRect(iw, ih, frameAspect, crop = DEFAULT_CROP) {
  const zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Number(crop?.zoom) || 1));
  let sw, sh;
  if (iw / ih > frameAspect) { sh = ih; sw = ih * frameAspect; } else { sw = iw; sh = iw / frameAspect; }
  sw /= zoom; sh /= zoom;
  const cx = (Number.isFinite(crop?.x) ? crop.x : 0.5) * iw;
  const cy = (Number.isFinite(crop?.y) ? crop.y : 0.5) * ih;
  const sx = Math.min(iw - sw, Math.max(0, cx - sw / 2));
  const sy = Math.min(ih - sh, Math.max(0, cy - sh / 2));
  return { sx, sy, sw, sh };
}

// Keeps the center inside the range where the frame stays on the photo.
export function clampCrop(aspect, frameAspect, crop) {
  const { sx, sy, sw, sh } = cropRect(aspect, 1, frameAspect, crop);
  return {
    x: (sx + sw / 2) / aspect,
    y: sy + sh / 2,
    zoom: Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Number(crop?.zoom) || 1)),
  };
}

// CSS background that shows exactly cropRect() inside a frame of frameAspect.
// aspect = photo width / height (1 if unknown → treated as square).
export function cropBackground(url, aspect, frameAspect, crop) {
  const a = Number(aspect) > 0 ? Number(aspect) : 1;
  const { sx, sy, sw, sh } = cropRect(a, 1, frameAspect, crop);
  const sizeX = (a / sw) * 100;
  const sizeY = (1 / sh) * 100;
  const posX = a - sw > 1e-6 ? (sx / (a - sw)) * 100 : 50;
  const posY = 1 - sh > 1e-6 ? (sy / (1 - sh)) * 100 : 50;
  return {
    backgroundImage: url ? `url("${url}")` : undefined,
    backgroundSize: `${sizeX}% ${sizeY}%`,
    backgroundPosition: `${posX}% ${posY}%`,
    backgroundRepeat: "no-repeat",
  };
}

// Draws the crop onto a canvas and returns a JPEG blob (used for the round
// profile photo, which other screens and apps show with plain "cover").
export function renderCrop(img, frameAspect, crop, outW, quality = 0.88) {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const { sx, sy, sw, sh } = cropRect(iw, ih, frameAspect, crop);
  const outH = Math.round(outW / frameAspect);
  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, outW, outH);
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Couldn't process that image."))), "image/jpeg", quality));
}

// The whole photo scaled so its long side is at most maxSize (1,200px per
// Michael, 2026-11-08). Returns { blob, width, height }.
export function renderScaled(img, maxSize = 1200, quality = 0.88) {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const s = Math.min(1, maxSize / Math.max(iw, ih));
  const w = Math.round(iw * s), h = Math.round(ih * s);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, w, h);
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve({ blob: b, width: w, height: h }) : reject(new Error("Couldn't process that image."))), "image/jpeg", quality));
}

export function loadImageFile(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve({ img, url });
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("That doesn't look like a valid image.")); };
    img.src = url;
  });
}
