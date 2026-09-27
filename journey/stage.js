/**
 * The cinematic viewport. Generated video does the camera travel; this class
 * only swaps between identical frames:
 *   still (anchor N) → video frame 0 (= anchor N) → … → last frame (= anchor N+1) → still (anchor N+1)
 * Two <video> elements double-buffer so the next transition is already loading
 * while the respondent reads the current question. Two stills allow a calm
 * cross-fade for back navigation and reduced motion (never for forward travel).
 */

import { settle, warmImage } from "./media.js";

const READY_TIMEOUT = 9000;

export class Stage {
  constructor(root, { reducedMotion = false } = {}) {
    this.root = root;
    this.videos = [...root.querySelectorAll("video")];
    this.stills = [...root.querySelectorAll(".jr-still")];
    this.front = 0; // visible still index
    this.reducedMotion = reducedMotion;
    this.current = null; // url of the anchor on screen
    for (const v of this.videos) {
      v.muted = true;
      v.playsInline = true;
      v.setAttribute("muted", "");
      v.setAttribute("playsinline", "");
      v.disablePictureInPicture = true;
    }
  }

  setFocus(position) {
    this.root.style.setProperty("--jr-focus", position || "50% 50%");
  }

  /** Put an anchor on screen. `fade` only for back navigation / reduced motion. */
  async showStill(url, { fade = false } = {}) {
    if (!url) return;
    await warmImage(url);
    const cur = this.stills[this.front];
    if (this.current === url && cur.classList.contains("is-on")) return;
    const next = this.stills[1 - this.front];
    next.src = url;
    await settle(next);
    next.classList.toggle("is-fading", fade);
    cur.classList.toggle("is-fading", fade);
    next.style.zIndex = "3";
    cur.style.zIndex = "2";
    next.classList.add("is-on");
    if (fade) await wait(440);
    cur.classList.remove("is-on");
    next.style.zIndex = "";
    cur.style.zIndex = "";
    this.front = 1 - this.front;
    this.current = url;
  }

  hideStills() {
    for (const s of this.stills) s.classList.remove("is-on", "is-fading");
  }

  /** Start loading a transition into the idle video element (next likely move only). */
  preload(url) {
    if (!url || this.reducedMotion) return;
    if (this.videos.some((v) => v.dataset.src === url)) return;
    const idle = this.videos.find((v) => !v.classList.contains("is-on")) || this.videos[0];
    idle.dataset.src = url;
    idle.preload = "auto";
    idle.src = url;
    idle.load();
  }

  videoFor(url) {
    let v = this.videos.find((x) => x.dataset.src === url);
    if (!v) {
      this.preload(url);
      v = this.videos.find((x) => x.dataset.src === url);
    }
    return v;
  }

  /**
   * Play one transition. Resolves after the destination anchor is on screen.
   * onProgress(p in 0..1) drives the rail bead; onCue fires once at `cue`.
   * onWaiting(bool) lets the UI show that media is still buffering.
   */
  async travel({ url, toStill, cue = 0.8, onProgress, onCue, onWaiting }) {
    if (!toStill) {
      // Destination not available: hold the current frame, never blank the viewport.
      onProgress?.(1);
      onCue?.();
      return;
    }
    await warmImage(toStill);
    if (this.reducedMotion || !url) {
      onProgress?.(1);
      await this.showStill(toStill, { fade: true });
      onCue?.();
      return;
    }
    const v = this.videoFor(url);
    const ok = await this.ready(v, onWaiting);
    if (!ok) {
      // Media failed: never show a blank frame — calm cut to the destination anchor.
      onProgress?.(1);
      await this.showStill(toStill, { fade: true });
      onCue?.();
      return;
    }
    try {
      v.currentTime = 0;
    } catch {}
    v.classList.add("is-on");
    try {
      await v.play();
    } catch {
      v.classList.remove("is-on");
      onProgress?.(1);
      await this.showStill(toStill, { fade: true });
      onCue?.();
      return;
    }
    await firstFrame(v);
    this.hideStills(); // frame 0 of the clip is the anchor that was on screen
    this.current = null;
    let cued = false;
    await new Promise((resolve) => {
      let raf = 0;
      let last = -1;
      let still = 0;
      const finish = () => {
        cancelAnimationFrame(raf);
        clearInterval(guard);
        resolve();
      };
      const tick = () => {
        const d = v.duration || 4;
        const p = Math.min(1, v.currentTime / d);
        onProgress?.(p);
        if (!cued && p >= cue) {
          cued = true;
          onCue?.();
        }
        if (!v.ended) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
      v.addEventListener("ended", finish, { once: true });
      // Stall guard: nudge a paused/throttled clip, then land on the destination rather than hang.
      const guard = setInterval(() => {
        if (v.currentTime !== last) {
          last = v.currentTime;
          still = 0;
          return;
        }
        still += 1;
        if (still === 2) v.play().catch(() => {});
        if (still >= 6) finish();
      }, 500);
    });
    onProgress?.(1);
    if (!cued) onCue?.();
    // The clip's last frame is the destination anchor: swap without a jump.
    const next = this.stills[this.front];
    next.src = toStill;
    await settle(next);
    next.classList.remove("is-fading");
    next.classList.add("is-on");
    this.current = toStill;
    await nextPaint();
    v.classList.remove("is-on");
    v.pause();
  }

  ready(v, onWaiting) {
    return new Promise((resolve) => {
      if (!v) return resolve(false);
      if (v.readyState >= 3) return resolve(true);
      onWaiting?.(true);
      const done = (ok) => {
        clearTimeout(t);
        v.removeEventListener("canplay", yes);
        v.removeEventListener("error", no);
        onWaiting?.(false);
        resolve(ok);
      };
      const yes = () => done(true);
      const no = () => done(false);
      const t = setTimeout(() => done(v.readyState >= 2), READY_TIMEOUT);
      v.addEventListener("canplay", yes);
      v.addEventListener("error", no);
      if (v.networkState === HTMLMediaElement.NETWORK_EMPTY) v.load();
    });
  }
}

function firstFrame(v) {
  const frame = new Promise((resolve) => {
    if ("requestVideoFrameCallback" in v) v.requestVideoFrameCallback(() => resolve());
    else v.addEventListener("playing", () => requestAnimationFrame(() => resolve()), { once: true });
  });
  return Promise.race([frame, wait(400)]);
}

function nextPaint() {
  // Two frames so the swap is composited; bounded so a background tab cannot stall the journey.
  return Promise.race([
    new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))),
    wait(120)
  ]);
}

function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
