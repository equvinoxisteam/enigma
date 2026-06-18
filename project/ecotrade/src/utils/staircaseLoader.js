const base = import.meta.env.BASE_URL || '/';
const STAIRCASE_BASE = `${base.endsWith('/') ? base : `${base}/`}staircase`;

let loadPromise = null;

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

export const loadStaircaseModule = () => {
  if (window.Staircase?.initialized) {
    return Promise.resolve(window.Staircase);
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

export const getStaircaseBaseUrl = () => STAIRCASE_BASE;
