import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Loader2, AlertCircle, Download } from 'lucide-react';
import { getViewerFetchPath, normalizeFileUrl, getFileName } from '../utils/fileUtils';
import axiosInstance from '../api/axios';

const STLViewer = ({ fileUrl, width = '100%', height = '400px', backgroundColor = '#f0f0f0' }) => {
  const mountRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const downloadUrl = normalizeFileUrl(fileUrl);
  const fileName = getFileName(fileUrl);
  const viewerHeight = `calc(${height} - 28px)`;

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
        setError(null);

        const fetchPath = getViewerFetchPath(fileUrl);
        const response = await axiosInstance.get(fetchPath, { responseType: 'arraybuffer' });

        if (!response.data || response.data.byteLength === 0) {
          throw new Error('Empty STL file');
        }

        const loader = new STLLoader();
        const geometry = loader.parse(response.data);
        geometry.computeVertexNormals();
        geometry.center();
        geometry.computeBoundingBox();

        if (disposed || !mountEl) return;

        scene = new THREE.Scene();
        scene.background = new THREE.Color(backgroundColor);

        const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 100000);
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        mountEl.innerHTML = '';
        mountEl.appendChild(renderer.domElement);

        scene.add(new THREE.AmbientLight(0xffffff, 0.75));
        const keyLight = new THREE.DirectionalLight(0xffffff, 1);
        keyLight.position.set(1, 2, 3);
        scene.add(keyLight);
        const fillLight = new THREE.DirectionalLight(0xffffff, 0.45);
        fillLight.position.set(-2, -1, -1);
        scene.add(fillLight);

        const material = new THREE.MeshPhongMaterial({
          color: 0x4881f8,
          specular: 0x444444,
          shininess: 80
        });

        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);

        const box = new THREE.Box3().setFromObject(mesh);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z, 0.001);

        camera.position.set(center.x + maxDim, center.y + maxDim * 0.5, center.z + maxDim * 1.5);
        controls = new OrbitControls(camera, renderer.domElement);
        controls.target.copy(center);
        controls.enableDamping = true;
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
      } catch (fetchError) {
        console.error('STL viewer error:', fetchError);
        if (!disposed) {
          setError('Failed to load STL file. Try downloading instead.');
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
      });
      cleanupInner?.then?.((fn) => fn?.());
    };
  }, [fileUrl, backgroundColor]);

  return (
    <div className="relative" style={{ width, height }}>
      <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 text-white text-xs relative z-10">
        <span className="truncate font-medium">{fileName}</span>
        <a href={downloadUrl} target="_blank" rel="noopener noreferrer" className="ml-auto flex items-center gap-1 hover:underline">
          <Download size={12} /> Download
        </a>
      </div>
      <div ref={mountRef} style={{ width: '100%', height: viewerHeight }} className="relative" />
      {loading && (
        <div className="absolute inset-0 top-7 flex items-center justify-center bg-gray-900/80 z-20">
          <div className="text-center">
            <Loader2 className="animate-spin text-[#4881F8] mx-auto mb-2" size={32} />
            <p className="text-sm text-gray-200">Loading 3D model...</p>
          </div>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 top-7 flex items-center justify-center bg-gray-900/90 z-20">
          <div className="text-center p-4">
            <AlertCircle className="text-red-400 mx-auto mb-2" size={32} />
            <p className="text-sm text-red-300 mb-3">{error}</p>
            <a href={downloadUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-[#4881F8] hover:underline">
              Download STL
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default STLViewer;
