import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Loader2, AlertCircle, Download } from 'lucide-react';
import { getViewerFetchPath, normalizeFileUrl, getFileName } from '../utils/fileUtils';
import axiosInstance from '../api/axios';

const STLViewer = ({ fileUrl, width = '100%', height = '400px', backgroundColor = '#f0f0f0' }) => {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const cameraRef = useRef(null);
  const animateRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const downloadUrl = normalizeFileUrl(fileUrl);
  const fileName = getFileName(fileUrl);

  useEffect(() => {
    if (!mountRef.current || !fileUrl) return;
    const fetchPath = getViewerFetchPath(fileUrl);
    const blobUrlRef = { current: null };

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(backgroundColor);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 100);
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight1.position.set(1, 1, 1);
    scene.add(directionalLight1);

    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.4);
    directionalLight2.position.set(-1, -1, -1);
    scene.add(directionalLight2);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = true;
    controls.enablePan = true;
    controlsRef.current = controls;

    const loader = new STLLoader();

    const processGeometry = (geometry) => {
      // Calculate center and scale
      geometry.computeVertexNormals();
      geometry.center();

      // Calculate bounding box for proper scaling
      const box = new THREE.Box3().setFromObject(new THREE.Mesh(geometry));
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = 50 / maxDim; // Scale to fit in view

      // Create material
      const material = new THREE.MeshPhongMaterial({
        color: 0x4881F8,
        specular: 0x111111,
        shininess: 200,
        flatShading: false
      });

      // Create mesh
      const mesh = new THREE.Mesh(geometry, material);
      mesh.scale.set(scale, scale, scale);
      scene.add(mesh);

      // Adjust camera to view the model
      const center = box.getCenter(new THREE.Vector3());
      const distance = maxDim * 2;
      camera.position.set(center.x, center.y, center.z + distance);
      camera.lookAt(center);
      controls.target.copy(center);
      controls.update();

      setLoading(false);
    };
    
    const loadStl = async () => {
      try {
        const response = await axiosInstance.get(fetchPath, { responseType: 'arraybuffer' });
        blobUrlRef.current = URL.createObjectURL(new Blob([response.data]));
        loader.load(
          blobUrlRef.current,
          (geometry) => processGeometry(geometry),
          undefined,
          (loadError) => {
            console.error('STL loader error:', loadError);
            setError('Failed to render STL file.');
            setLoading(false);
          }
        );
      } catch (fetchError) {
        console.error('STL fetch error:', fetchError);
        setError('Failed to load STL file. Try downloading instead.');
        setLoading(false);
      }
    };

    loadStl();

    // Animation loop
    animateRef.current = () => {
      const animate = () => {
        requestAnimationFrame(animate);
        if (controlsRef.current && rendererRef.current && sceneRef.current && cameraRef.current) {
          controlsRef.current.update();
          rendererRef.current.render(sceneRef.current, cameraRef.current);
        }
      };
      animate();
    };
    animateRef.current();

    // Handle resize
    const handleResize = () => {
      if (!mountRef.current || !cameraRef.current || !rendererRef.current) return;
      cameraRef.current.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
      window.removeEventListener('resize', handleResize);
      animateRef.current = null; // Stop animation loop
      if (mountRef.current && rendererRef.current?.domElement) {
        try {
          mountRef.current.removeChild(rendererRef.current.domElement);
        } catch (e) {
          // Element might already be removed
        }
      }
      if (controlsRef.current) {
        controlsRef.current.dispose();
        controlsRef.current = null;
      }
      if (rendererRef.current) {
        rendererRef.current.dispose();
        rendererRef.current = null;
      }
      // Dispose geometries and materials
      if (sceneRef.current) {
        sceneRef.current.traverse((object) => {
          if (object instanceof THREE.Mesh) {
            object.geometry.dispose();
            if (object.material) {
              if (Array.isArray(object.material)) {
                object.material.forEach((mat) => mat.dispose());
              } else {
                object.material.dispose();
              }
            }
          }
        });
        sceneRef.current = null;
      }
      cameraRef.current = null;
    };
  }, [fileUrl, backgroundColor]);

  return (
    <div className="relative" style={{ width, height }}>
      <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 text-white text-xs">
        <span className="truncate font-medium">{fileName}</span>
        <a href={downloadUrl} target="_blank" rel="noopener noreferrer" className="ml-auto flex items-center gap-1 hover:underline">
          <Download size={12} /> Download
        </a>
      </div>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
          <div className="text-center">
            <Loader2 className="animate-spin text-[#4881F8] mx-auto mb-2" size={32} />
            <p className="text-sm text-gray-600">Loading 3D model...</p>
          </div>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 top-7 flex items-center justify-center bg-gray-100 rounded-lg">
          <div className="text-center p-4">
            <AlertCircle className="text-red-500 mx-auto mb-2" size={32} />
            <p className="text-sm text-red-600 mb-3">{error}</p>
            <a href={downloadUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-[#4881F8] hover:underline">
              Download STL
            </a>
          </div>
        </div>
      )}
      <div
        ref={mountRef}
        style={{ width: '100%', height: `calc(${height} - 28px)` }}
        className={loading || error ? 'hidden' : ''}
      />
    </div>
  );
};

export default STLViewer;

