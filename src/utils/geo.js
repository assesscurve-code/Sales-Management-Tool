// src/utils/geo.js
// Collect readings for up to maxWaitMs and keep the best (lowest accuracy).
// Stop early if accuracy gets "goodEnough" (in meters).
export function waitBestLocation({ maxWaitMs = 60000, goodEnough = 50 } = {}) {
  if (!('geolocation' in navigator)) return Promise.resolve(null);

  return new Promise((resolve) => {
    let best = null;
    let done = false;
    let watchId = null;

    const finish = () => {
      if (done) return;
      done = true;
      if (watchId != null) {
        try { navigator.geolocation.clearWatch(watchId) } catch {}
      }
      resolve(best);
    };

    const consider = (pos) => {
      const { latitude, longitude, accuracy } = pos?.coords || {};
      if (typeof latitude !== 'number' || typeof longitude !== 'number') return;
      const fix = { lat: latitude, lng: longitude, accuracy: accuracy ?? Infinity, ts: Date.now() };
      if (!best || fix.accuracy < best.accuracy) best = fix;
      if (best.accuracy <= goodEnough) finish(); // early stop when it's precise enough
    };

    try {
      navigator.geolocation.getCurrentPosition(
        consider,
        () => {}, // ignore individual errors; we'll still keep trying
        { enableHighAccuracy: true, maximumAge: 0, timeout: Math.min(10000, maxWaitMs) }
      );
    } catch {}

    try {
      watchId = navigator.geolocation.watchPosition(
        consider,
        () => {},
        { enableHighAccuracy: true, maximumAge: 0 }
      );
    } catch {}

    setTimeout(finish, maxWaitMs);
  });
}
