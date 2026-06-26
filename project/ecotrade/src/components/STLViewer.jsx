import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Loader2 } from 'lucide-react';
import { getViewerFetchPath, getFileName } from '../utils/fileUtils';
import { addLabeledAxes } from '../utils/threeAxisHelper';
import axiosInstance from '../api/axios';
import FileViewerFrame from './FileViewerFrame';
import ViewerErrorState from './ViewerErrorState';

const VIEWER_BG = '#f1f5f9';

const STLViewer = ({
  fileUrl,
  fileName,
  width = '100%',
  height = '420px'
}) => {
  const mountRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const displayName = fileName || getFileName(fileUrl);

  useEffect(() => {
    if (!mountRef.current || !fileUrl) return;

    let disposed = false;
    let renderer = null;
    let controls = null;
    let animationId = null;
    let scene = null;
    const mountEl = mountRef.current;

    const resizeRenderer = (camera) => {
      if (!mountEl || !renderer || !camera) return;
      const w = mountEl.clientWidth || mountEl.offsetWidth || 640;
      const h = mountEl.clientHeight || mountEl.offsetHeight || 360;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    };

    const loadStl = async () => {
      try {
        setLoading(true);
        setError(false);

        const fetchPath = getViewerFetchPath(fileUrl);
        const response = await axiosInstance.get(fetchPath, { responseType: 'arraybuffer' });

        if (!response.data || response.data.byteLength === 0) {
          throw new Error('EMPTY_FILE');
        }

        const loader = new STLLoader();
        const geometry = loader.parse(response.data);
        geometry.computeVertexNormals();
        geometry.center();
        geometry.computeBoundingBox();

        if (disposed || !mountEl) return;

        scene = new THREE.Scene();
        scene.background = new THREE.Color(VIEWER_BG);

        const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100000);
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        mountEl.innerHTML = '';
        mountEl.appendChild(renderer.domElement);

        scene.add(new THREE.AmbientLight(0xffffff, 0.75));
        const keyLight = new THREE.DirectionalLight(0xffffff, 1);
        keyLight.position.set(4, 6, 5);
        scene.add(keyLight);
        const fillLight = new THREE.DirectionalLight(0xffffff, 0.4);
        fillLight.position.set(-3, -2, -4);
        scene.add(fillLight);

        const material = new THREE.MeshPhongMaterial({
          color: 0x4881f8,
          specular: 0x334155,
          shininess: 70
        });

        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);

        const box = new THREE.Box3().setFromObject(mesh);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z, 0.001);

        addLabeledAxes(scene, maxDim * 0.85);

        const distance = maxDim * 1.65;
        camera.position.set(center.x + distance * 0.7, center.y + distance * 0.45, center.z + distance);
        controls = new OrbitControls(camera, renderer.domElement);
        controls.target.copy(center);
        controls.enableDamping = true;
        controls.dampingFactor = 0.08;
        controls.update();

        resizeRenderer(camera);

        const animate = () => {
          animationId = requestAnimationFrame(animate);
          controls?.update();
          renderer?.render(scene, camera);
        };
        animate();

        const handleResize = () => resizeRenderer(camera);
        window.addEventListener('resize', handleResize);

        setLoading(false);

        return () => {
          window.removeEventListener('resize', handleResize);
        };
      } catch {
        if (!disposed) {
          setError(true);
          setLoading(false);
        }
      }
    };

    const cleanupInner = loadStl();

    return () => {
      disposed = true;
      if (animationId) cancelAnimationFrame(animationId);
      controls?.dispose();
      if (renderer) {
        renderer.dispose();
        if (mountEl?.contains(renderer.domElement)) {
          mountEl.removeChild(renderer.domElement);
        }
      }
      scene?.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry?.dispose();
          const mat = object.material;
          if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
          else mat?.dispose();
        }
        if (object instanceof THREE.Sprite) {
          object.material?.map?.dispose();
          object.material?.dispose();
        }
      });
      cleanupInner?.then?.((fn) => fn?.());
    };
  }, [fileUrl, retryKey]);

  return (
    <FileViewerFrame fileName={displayName} height={height} className={width !== '100%' ? '' : ''}>
      <div ref={mountRef} className="absolute inset-0 w-full h-full" style={{ width }} />
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
          fileName={displayName}
          uploaded
          title="3D preview unavailable"
          hint="Your STL file is saved. Try re-uploading or check the file is a valid mesh under 150 MB."
          onRetry={() => setRetryKey((k) => k + 1)}
        />
      )}
    </FileViewerFrame>
  );
};

export default STLViewer;
