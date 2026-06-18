const base = import.meta.env.BASE_URL || '/';
const STAIRCASE_BASE = `${base.endsWith('/') ? base : `${base}/`}staircase`;

let loadPromise = null;
let availabilityPromise = null;

const appendScript = (src) =>
  new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.body.appendChild(script);
  });

const waitForInit = (timeoutMs = 30000) =>
  new Promise((resolve, reject) => {
    const started = Date.now();
    const tick = () => {
      if (window.Staircase?.initialized) {
        resolve(window.Staircase);
        return;
      }
      if (Date.now() - started > timeoutMs) {
        reject(new Error('Staircase module initialization timed out'));
        return;
      }
      requestAnimationFrame(tick);
    };
    tick();
  });

export const getStaircaseBaseUrl = () => STAIRCASE_BASE;

export const isStaircaseAvailable = async () => {
  if (availabilityPromise) return availabilityPromise;

  availabilityPromise = (async () => {
    try {
      const manifestRes = await fetch(`${STAIRCASE_BASE}/manifest.json`, { cache: 'no-store' });
      if (manifestRes.ok) {
        const manifest = await manifestRes.json();
        return Boolean(manifest.available);
      }
    } catch {
      /* fall through to direct probe */
    }

    try {
      const res = await fetch(`${STAIRCASE_BASE}/staircase.js`, { method: 'GET', cache: 'no-store' });
      const contentType = res.headers.get('content-type') || '';
      if (!res.ok) return false;
      if (contentType.includes('text/html')) return false;
      const snippet = await res.clone().text();
      return snippet.trimStart().startsWith('var ') || snippet.includes('createStaircaseModule');
    } catch {
      return false;
    }
  })();

  return availabilityPromise;
};

export const loadStaircaseModule = async () => {
  if (window.Staircase?.initialized) {
    return window.Staircase;
  }

  const available = await isStaircaseAvailable();
  if (!available) {
    throw new Error('Staircase viewer assets are not installed');
  }

  if (loadPromise) return loadPromise;

  loadPromise = appendScript(`${STAIRCASE_BASE}/staircase.js`)
    .then(() => appendScript(`${STAIRCASE_BASE}/staircase-module-post.js`))
    .then(() => waitForInit())
    .catch((err) => {
      loadPromise = null;
      throw err;
    });

  return loadPromise;
};
