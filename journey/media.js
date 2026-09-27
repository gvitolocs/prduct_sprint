/**
 * Media manifest access. The app reasons about branch → stage → anchor /
 * transition; file names, sizes and codecs live only here and in manifest.json.
 */

const BASE = new URL("./", import.meta.url);

export async function loadManifest() {
  const res = await fetch(new URL("manifest.json", BASE), { cache: "no-cache" });
  if (!res.ok) throw new Error(`manifest ${res.status}`);
  return res.json();
}

let avif = null;
/** Resolves once; AVIF decode support (Safari < 16 and older Edge lack it). */
export function detectAvif() {
  if (avif) return avif;
  avif = new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img.width > 0);
    img.onerror = () => resolve(false);
    img.src =
      "data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAAD5bWV0YQAAAAAAAAAvaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAFBpY3R1cmVIYW5kbGVyAAAAAA5waXRtAAAAAAABAAAAHmlsb2MAAAAARAAAAQABAAAAAQAAASEAAAAWAAAAKGlpbmYAAAAAAAEAAAAaaW5mZQIAAAAAAQAAYXYwMUNvbG9yAAAAAGppcHJwAAAAS2lwY28AAAAUaXNwZQAAAAAAAAACAAAAAgAAABBwaXhpAAAAAAMICAgAAAAMYXYxQ4EADAAAAAATY29scm5jbHgAAgACAAIAAAAAF2lwbWEAAAAAAAAAAQABBAECgwQAAAAebWRhdAoFGAA2wCAyDRgAAABQAAAAALASmcg=";
  });
  return avif;
}

/** Device pixels the stage covers (it is always 16:9 cover-cropped). */
function stagePixels() {
  return Math.max(window.innerWidth, window.innerHeight * (16 / 9)) * Math.min(window.devicePixelRatio || 1, 2);
}

/** Target still width for the current viewport (never ship 1920 to a phone, 2560 to large or dense screens). */
export function stillWidth() {
  const px = stagePixels();
  return px > 2100 ? 2560 : px > 1100 ? 1920 : 960;
}

/** Video variant: AV1 where the browser decodes it, H.264 otherwise; 540p on small or data-saving screens,
 * 1440p where the stage covers more than ~2100 device pixels (retina laptops, 1440p/4K monitors). */
export function videoVariant() {
  const probe = document.createElement("video");
  const av1 = probe.canPlayType('video/mp4; codecs="av01.0.08M.08"') === "probably";
  const saveData = navigator.connection && navigator.connection.saveData;
  const small = Math.min(window.innerWidth, 1400) * Math.min(window.devicePixelRatio || 1, 2) < 1100;
  const size = saveData || small ? "540" : stagePixels() > 2100 ? "1440" : "1080";
  return { codec: av1 ? "av1" : "h264", size };
}

/** The best available size at or below the wanted one (lists are largest first), else the smallest. */
function pick(list, want) {
  const sorted = [...list].sort((a, b) => Number(b) - Number(a));
  return sorted.find((v) => Number(v) <= Number(want)) ?? sorted[sorted.length - 1];
}

export async function anchorUrl(anchor, width = stillWidth()) {
  if (!anchor) return null; // not generated yet: callers keep the current frame
  const ext = (await detectAvif()) ? "avif" : "webp";
  const w = pick(anchor.widths, width);
  return new URL(`${anchor.base}-${w}.${ext}${anchor.rev ? `?v=${anchor.rev}` : ""}`, BASE).href;
}

export function transitionUrl(transition, variant = videoVariant()) {
  const size = pick(transition.sizes, variant.size);
  const codec = transition.codecs.includes(variant.codec) ? variant.codec : "h264";
  return new URL(`${transition.base}-${size}-${codec}.mp4${transition.rev ? `?v=${transition.rev}` : ""}`, BASE).href;
}

const decoded = new Map();
/**
 * Fetch + decode an image once; resolves when it can be painted without a blank frame.
 * Bounded: browsers defer decode() for documents that are not rendering, and a
 * loaded-but-undecoded image is still better than a stalled journey.
 */
export function warmImage(url) {
  if (!url) return Promise.resolve(null);
  if (!decoded.has(url)) {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    const loaded = new Promise((r) => {
      if (img.complete) r();
      img.addEventListener("load", r, { once: true });
      img.addEventListener("error", r, { once: true });
    });
    const decode = img.decode().catch(() => {});
    decoded.set(url, loaded.then(() => Promise.race([decode, new Promise((r) => setTimeout(r, 1200))])).then(() => img));
  }
  return decoded.get(url);
}

/** Decode an <img> that is about to be shown, without ever blocking on it for long. */
export function settle(img) {
  if (!img.decode) return Promise.resolve();
  return Promise.race([img.decode().catch(() => {}), new Promise((r) => setTimeout(r, 600))]);
}
