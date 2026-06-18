import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Loader2, AlertCircle } from 'lucide-react';
import { getViewerFetchPath } from '../utils/fileUtils';
import { buildStepMesh } from '../utils/stepMeshBuilder';
import { addLabeledAxes } from '../utils/threeAxisHelper';
import { loadOcct } from '../utils/occtLoader';
import axiosInstance from '../api/axios';
import FileViewerFrame from './FileViewerFrame';

const OcctStepViewer = ({ fileUrl, fileName, height = '400px', backgroundColor = '#111827' }) => {
  const mountRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!mountRef.current || !fileUrl) return;

    let disposed = false;
    let renderer = null;
    let controls = null;
    let animationId = null;
    let scene = null;
    const mountEl = mountRef.current;

    const loadModel = async () => {
      try {
        setLoading(true);
        setError(null);

        const fetchPath = getViewerFetchPath(fileUrl);
        const response = await axiosInstance.get(fetchPath, { responseType: 'arraybuffer' });
        const occt = await loadOcct();
        const result = occt.ReadStepFile(new Uint8Array(response.data), null);

        if (!result?.meshes?.length) {
          throw new Error('No geometry found in STEP file');
        }

        if (disposed || !mountEl) return;

        scene = new THREE.Scene();
        scene.background = new THREE.Color(backgroundColor);

        const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 100000);
        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        mountEl.innerHTML = '';
        mountEl.appendChild(renderer.domElement);

        const resizeRenderer = () => {
          if (!mountEl || !renderer || !camera) return;
          const w = mountEl.clientWidth || 640;
          const h = mountEl.clientHeight || 360;
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h, false);
        };
        resizeRenderer();

        scene.add(new THREE.AmbientLight(0xffffff, 0.65));
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.85);
        dirLight.position.set(2, 3, 4);
        scene.add(dirLight);

        const group = new THREE.Group();
        for (const resultMesh of result.meshes) {
          const { mesh } = buildStepMesh(resultMesh, false);
          group.add(mesh);
        }
        scene.add(group);

        const box = new THREE.Box3().setFromObject(group);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z, 0.001);

        group.position.sub(center);
        addLabeledAxes(scene, maxDim);

        camera.position.set(maxDim, maxDim * 0.6, maxDim * 1.8);
        controls = new OrbitControls(camera, renderer.domElement);
        controls.target.set(0, 0, 0);
        controls.enableDamping = true;
        controls.update();

        const animate = () => {
          animationId = requestAnimationFrame(animate);
          controls?.update();
          renderer?.render(scene, camera);
        };
        animate();

        setLoading(false);

        const handleResize = () => resizeRenderer();
        window.addEventListener('resize', handleResize);

        return () => {
          window.removeEventListener('resize', handleResize);
          scene?.traverse((obj) => {
            if (obj instanceof THREE.Mesh) {
              obj.geometry?.dispose();
              const mat = obj.material;
              if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
              else mat?.dispose();
            }
            if (obj instanceof THREE.Sprite) {
              obj.material?.map?.dispose();
              obj.material?.dispose();
            }
          });
        };
      } catch (err) {
        console.error('OCCT STEP viewer error:', err);
        if (!disposed) {
          setError('Failed to load STEP preview.');
          setLoading(false);
        }
      }
    };

    const cleanupPromise = loadModel();

    return () => {
      disposed = true;
      if (animationId) cancelAnimationFrame(animationId);
      controls?.dispose();
      if (renderer) {
        if (mountEl?.contains(renderer.domElement)) {
          mountEl.removeChild(renderer.domElement);
        }
        renderer.dispose();
      }
      cleanupPromise?.then?.((fn) => fn?.());
    };
  }, [fileUrl, backgroundColor]);

  return (
    <FileViewerFrame fileName={fileName} height={height}>
      <div ref={mountRef} className="w-full h-full" />
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/90 z-20">
          <div className="text-center">
            <Loader2 className="animate-spin text-[#4881F8] mx-auto mb-2" size={32} />
            <p className="text-sm text-gray-200">Loading STEP model...</p>
          </div>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/95 z-20">
          <div className="text-center p-4">
            <AlertCircle className="text-red-400 mx-auto mb-2" size={32} />
            <p className="text-sm text-red-300">{error}</p>
          </div>
        </div>
      )}
    </FileViewerFrame>
  );
};

export default OcctStepViewer;
