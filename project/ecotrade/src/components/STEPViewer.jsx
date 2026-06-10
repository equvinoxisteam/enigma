import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Loader2, AlertCircle, Download, Box } from 'lucide-react';
import { getViewerFetchPath, normalizeFileUrl, getFileName } from '../utils/fileUtils';
import { buildStepMesh } from '../utils/stepMeshBuilder';
import axiosInstance from '../api/axios';

const STEPViewer = ({ fileUrl, width = '100%', height = '400px', backgroundColor = '#f0f0f0' }) => {
  const mountRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const fetchPath = getViewerFetchPath(fileUrl);
  const downloadUrl = normalizeFileUrl(fileUrl);
  const fileName = getFileName(fileUrl);

  useEffect(() => {
    if (!mountRef.current || !fileUrl) return;

    let disposed = false;
    let renderer = null;
    let controls = null;
    let animationId = null;
    let scene = null;

    const loadModel = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await axiosInstance.get(fetchPath, { responseType: 'arraybuffer' });
        const occtimportjs = (await import('occt-import-js')).default;
        const occt = await occtimportjs();
        const result = occt.ReadStepFile(new Uint8Array(response.data), null);

        if (!result?.meshes?.length) {
          throw new Error('No geometry found in STEP file');
        }

        if (disposed || !mountRef.current) return;

        const mountEl = mountRef.current;
        scene = new THREE.Scene();
        scene.background = new THREE.Color(backgroundColor);

        const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 100000);

        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        mountEl.innerHTML = '';
        mountEl.appendChild(renderer.domElement);

        const resizeRenderer = () => {
          if (!mountEl || !renderer || !camera) return;
          const w = mountEl.clientWidth || mountEl.offsetWidth || 640;
          const h = mountEl.clientHeight || mountEl.offsetHeight || 360;
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h, false);
        };
        resizeRenderer();

        scene.add(new THREE.AmbientLight(0xffffff, 0.6));
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(1, 1, 1);
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
        const maxDim = Math.max(size.x, size.y, size.z) || 1;

        camera.position.set(center.x, center.y, center.z + maxDim * 2);
        controls = new OrbitControls(camera, renderer.domElement);
        controls.target.copy(center);
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
          });
        };
      } catch (err) {
        console.error('STEP viewer error:', err);
        if (!disposed) {
          setError('Failed to load STEP file. Download to view in your CAD software.');
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
        if (mountRef.current?.contains(renderer.domElement)) {
          mountRef.current.removeChild(renderer.domElement);
        }
        renderer.dispose();
      }
      cleanupPromise?.then?.((fn) => fn?.());
    };
  }, [fileUrl, backgroundColor, fetchPath]);

  return (
    <div className="relative" style={{ width, height }}>
      <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 text-white text-xs">
        <Box size={14} />
        <span className="truncate font-medium">{fileName}</span>
        <a href={downloadUrl} target="_blank" rel="noopener noreferrer" className="ml-auto flex items-center gap-1 hover:underline">
          <Download size={12} /> Download
        </a>
      </div>
      {loading && (
        <div className="absolute inset-0 top-7 flex items-center justify-center bg-gray-900/80 z-20">
          <div className="text-center">
            <Loader2 className="animate-spin text-[#4881F8] mx-auto mb-2" size={32} />
            <p className="text-sm text-gray-600">Loading STEP model...</p>
          </div>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 top-7 flex items-center justify-center bg-gray-100">
          <div className="text-center p-6">
            <AlertCircle className="text-amber-500 mx-auto mb-2" size={32} />
            <p className="text-sm text-gray-600 mb-3">{error}</p>
            <a
              href={downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#4881F8] text-white rounded-lg text-sm"
            >
              <Download size={16} /> Download STEP
            </a>
          </div>
        </div>
      )}
      <div ref={mountRef} style={{ width: '100%', height: `calc(${height} - 28px)` }} className="relative" />
    </div>
  );
};

export default STEPViewer;
