import * as THREE from 'three';

const createAxisLabel = (text, color, position, scale) => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = 64;
  canvas.height = 40;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = color;
  ctx.font = 'bold 28px Inter, Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  const material = new THREE.SpriteMaterial({
    map: texture,
    depthTest: false,
    transparent: true
  });
  const sprite = new THREE.Sprite(material);
  sprite.position.copy(position);
  sprite.scale.set(scale, scale * 0.5, 1);
  sprite.renderOrder = 999;
  return sprite;
};

/**
 * Adds RGB axes with X/Y/Z labels sized relative to the model bounding box.
 */
export const addLabeledAxes = (scene, maxDim) => {
  const axisLength = Math.max(maxDim * 0.35, 1);
  const axes = new THREE.AxesHelper(axisLength);
  axes.renderOrder = 998;
  scene.add(axes);

  const labelScale = axisLength * 0.18;
  scene.add(createAxisLabel('X', '#ef4444', new THREE.Vector3(axisLength * 1.15, 0, 0), labelScale));
  scene.add(createAxisLabel('Y', '#22c55e', new THREE.Vector3(0, axisLength * 1.15, 0), labelScale));
  scene.add(createAxisLabel('Z', '#3b82f6', new THREE.Vector3(0, 0, axisLength * 1.15), labelScale));
};
