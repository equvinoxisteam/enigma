const base = import.meta.env.BASE_URL || '/';
const OCCT_WASM_URL = `${base.endsWith('/') ? base : `${base}/`}occt/occt-import-js.wasm`;

let occtPromise = null;

export const getOcctWasmUrl = () => OCCT_WASM_URL;

export const loadOcct = async () => {
  if (occtPromise) return occtPromise;

  occtPromise = (async () => {
    const occtimportjs = (await import('occt-import-js')).default;
    return occtimportjs({
      locateFile: (path) => {
        if (path.endsWith('.wasm')) {
          return OCCT_WASM_URL;
        }
        return path;
      },
    });
  })();

  return occtPromise;
};
