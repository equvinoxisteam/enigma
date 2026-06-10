import * as THREE from 'three';

/**
 * Build a Three.js mesh from occt-import-js geometry data.
 * Based on the official occt-import-js three_viewer example.
 */
export const buildStepMesh = (geometryMesh, showEdges = false) => {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(geometryMesh.attributes.position.array, 3));

  if (geometryMesh.attributes.normal) {
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(geometryMesh.attributes.normal.array, 3));
  }

  geometry.name = geometryMesh.name;
  const index = Uint32Array.from(geometryMesh.index.array);
  geometry.setIndex(new THREE.BufferAttribute(index, 1));

  const defaultMaterial = new THREE.MeshPhongMaterial({
    color: geometryMesh.color
      ? new THREE.Color(geometryMesh.color[0], geometryMesh.color[1], geometryMesh.color[2])
      : 0x4881f8,
    specular: 0,
  });

  const materials = [defaultMaterial];
  const edges = showEdges ? new THREE.Group() : null;

  if (geometryMesh.brep_faces?.length > 0) {
    for (const faceColor of geometryMesh.brep_faces) {
      const color = faceColor.color
        ? new THREE.Color(faceColor.color[0], faceColor.color[1], faceColor.color[2])
        : defaultMaterial.color;
      materials.push(new THREE.MeshPhongMaterial({ color, specular: 0 }));
    }

    const triangleCount = geometryMesh.index.array.length / 3;
    let triangleIndex = 0;
    let faceColorGroupIndex = 0;

    while (triangleIndex < triangleCount) {
      const firstIndex = triangleIndex;
      let lastIndex;
      let materialIndex;

      if (faceColorGroupIndex >= geometryMesh.brep_faces.length) {
        lastIndex = triangleCount;
        materialIndex = 0;
      } else if (triangleIndex < geometryMesh.brep_faces[faceColorGroupIndex].first) {
        lastIndex = geometryMesh.brep_faces[faceColorGroupIndex].first;
        materialIndex = 0;
      } else {
        lastIndex = geometryMesh.brep_faces[faceColorGroupIndex].last + 1;
        materialIndex = faceColorGroupIndex + 1;
        faceColorGroupIndex += 1;
      }

      geometry.addGroup(firstIndex * 3, (lastIndex - firstIndex) * 3, materialIndex);
      triangleIndex = lastIndex;
    }
  }

  const mesh = new THREE.Mesh(geometry, materials.length > 1 ? materials : materials[0]);
  mesh.name = geometryMesh.name;

  return { mesh, edges };
};
