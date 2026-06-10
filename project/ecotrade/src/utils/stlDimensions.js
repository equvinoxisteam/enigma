import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';

export const getStlDimensionsFromBuffer = (arrayBuffer) => {
  try {
    const loader = new STLLoader();
    const geometry = loader.parse(arrayBuffer);
    geometry.computeBoundingBox();
    const box = geometry.getBoundingBox();
    if (!box) return null;

    const round = (v) => Math.round(v * 100) / 100;
    const length = round(box.max.x - box.min.x);
    const width = round(box.max.y - box.min.y);
    const height = round(box.max.z - box.min.z);

    return {
      length: length || 0,
      width: width || 0,
      height: height || 0,
      diameter: round(Math.max(length, width))
    };
  } catch {
    return null;
  }
};

export const getStlDimensionsFromFile = async (file) => {
  if (!file) return null;
  const buffer = await file.arrayBuffer();
  return getStlDimensionsFromBuffer(buffer);
};
