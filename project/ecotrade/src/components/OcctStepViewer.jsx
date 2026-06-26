import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Loader2 } from 'lucide-react';
import { getViewerFetchPath } from '../utils/fileUtils';
import { buildStepMesh } from '../utils/stepMeshBuilder';
import { addLabeledAxes } from '../utils/threeAxisHelper';
import { loadOcct } from '../utils/occtLoader';
import axiosInstance from '../api/axios';
import FileViewerFrame from './FileViewerFrame';
import ViewerErrorState from './ViewerErrorState';

const VIEWER_BG = '#f1f5f9';

const OcctStepViewer = ({ fileUrl, fileName, height = '420px' }) => {
  const mountRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

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
        setError(false);

        const fetchPath = getViewerFetchPath(fileUrl);
        const response = await axiosInstance.get(fetchPath, { responseType: 'arraybuffer' });

        if (!response.data || response.data.byteLength === 0) {
          throw new Error('EMPTY_FILE');
        }

        const occt = await loadOcct();
        const result = occt.ReadStepFile(new Uint8Array(response.data), null);

        if (!result?.meshes?.length) {
          throw new Error('NO_GEOMETRY');
        }

        if (disposed || !mountEl) return;

        scene = new THREE.Scene();
        scene.background = new THREE.Color(VIEWER_BG);

        const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100000);
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
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

        scene.add(new THREE.AmbientLight(0xffffff, 0.75));
        const keyLight = new THREE.DirectionalLight(0xffffff, 0.9);
        keyLight.position.set(4, 6, 5);
        scene.add(keyLight);
        const fillLight = new THREE.DirectionalLight(0xffffff, 0.35);
        fillLight.position.set(-3, -2, -4);
        scene.add(fillLight);

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
        addLabeledAxes(scene, maxDim * 0.85);

        const distance = maxDim * 1.65;
        camera.position.set(distance * 0.7, distance * 0.45, distance);
        controls = new OrbitControls(camera, renderer.domElement);
        controls.target.set(0, 0, 0);
        controls.enableDamping = true;
        controls.dampingFactor = 0.08;
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
      } catch {
        if (!disposed) {
          setError(true);
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
  }, [fileUrl, retryKey]);

  return (
    <FileViewerFrame fileName={fileName} height={height}>
      <div ref={mountRef} className="absolute inset-0 w-full h-full" />
      {loading && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-50 z-20">
          <div className="text-center">
            <Loader2 className="animate-spin text-[#4881F8] mx-auto mb-2" size={32} />
            <p className="text-sm text-gray-600">Loading 3D preview...</p>
          </div>
        </div>
      )}
      {error && (
        <ViewerErrorState
          hint="Try re-uploading your STEP file, or export as STL for the most reliable 3D preview."
          onRetry={() => setRetryKey((k) => k + 1)}
        />
      )}
    </FileViewerFrame>
  );
};

export default OcctStepViewer;
