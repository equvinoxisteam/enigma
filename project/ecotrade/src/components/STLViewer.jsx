import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Loader2, AlertCircle } from 'lucide-react';

const STLViewer = ({ fileUrl, width = '100%', height = '400px', backgroundColor = '#f0f0f0' }) => {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const cameraRef = useRef(null);
  const animateRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!mountRef.current || !fileUrl) return;
    const backendBaseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5005';
    const normalizedFileUrl = (() => {
      try {
        const parsed = new URL(fileUrl, window.location.origin);
        if ((parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') && parsed.port === '5000') {
          return `${backendBaseUrl}${parsed.pathname}`;
        }
        return parsed.toString();
      } catch {
        return fileUrl;
      }
    })();

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

    // Load STL file - use loader directly (handles CORS better than fetch)
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
    
    // Use STL loader directly (it handles CORS better)
    console.log('🔧 Loading STL from:', normalizedFileUrl);
    
    // Check if URL is from CloudFront (CORS issue in development)
    const isCloudFront = normalizedFileUrl.includes('cloudfront.net');
    
    if (isCloudFront && process.env.NODE_ENV === 'development') {
      console.warn('⚠️ CloudFront URL detected. CORS may block this in development.');
      console.log('💡 Tip: Configure CloudFront CORS or use local files for testing.');
    }
    
    loader.load(
      normalizedFileUrl,
      (geometry) => {
        console.log('✅ STL loaded successfully');
        processGeometry(geometry);
      },
      (progress) => {
        // Loading progress
        if (progress.total > 0) {
          const percent = (progress.loaded / progress.total) * 100;
          console.log(`Loading STL: ${percent.toFixed(2)}%`);
        }
      },
      (error) => {
        console.error('❌ STL loader error:', error);
        setError('Failed to load STL file. This is likely a CORS issue with CloudFront in development mode. The file will be available in production.');
        setLoading(false);
        
        // Show a sample geometry instead
        console.log('📦 Showing placeholder geometry instead...');
        const placeholderGeometry = new THREE.BoxGeometry(1, 1, 1);
        processGeometry(placeholderGeometry);
      }
    );

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

    // Cleanup
    return () => {
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
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
          <div className="text-center">
            <Loader2 className="animate-spin text-[#4881F8] mx-auto mb-2" size={32} />
            <p className="text-sm text-gray-600">Loading 3D model...</p>
          </div>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
          <div className="text-center">
            <AlertCircle className="text-red-500 mx-auto mb-2" size={32} />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </div>
      )}
      <div
        ref={mountRef}
        style={{ width: '100%', height: '100%' }}
        className={loading || error ? 'hidden' : ''}
      />
    </div>
  );
};

export default STLViewer;

