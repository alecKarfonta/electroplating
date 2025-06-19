import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Box, Paper, Typography, CircularProgress } from '@mui/material';
import { getSTLData } from '../services/api';

interface STLViewerProps {
  sessionId: string | null;
  currentScale: number;
  width?: number;
  height?: number;
}

const STLViewer: React.FC<STLViewerProps> = ({ sessionId, currentScale, width = 600, height = 400 }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // Initialize Three.js scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(0, 0, 5);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controlsRef.current = controls;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    const pointLight = new THREE.PointLight(0xffffff, 0.5);
    pointLight.position.set(-10, -10, -5);
    scene.add(pointLight);

    // Grid helper
    const gridHelper = new THREE.GridHelper(10, 10);
    scene.add(gridHelper);

    // Axes helper
    const axesHelper = new THREE.AxesHelper(2);
    scene.add(axesHelper);

    mountRef.current.appendChild(renderer.domElement);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Cleanup
    return () => {
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [width, height]);

  useEffect(() => {
    if (!sessionId || !sceneRef.current) return;

    setLoading(true);
    setError(null);

    // Clear existing mesh
    const existingMesh = sceneRef.current.getObjectByName('stlMesh');
    if (existingMesh) {
      sceneRef.current.remove(existingMesh);
    }

    const loadSTLData = async () => {
      try {
        const stlData = await getSTLData(sessionId);
        
        const loader = new STLLoader();
        const geometry = loader.parse(stlData);
        
        // Center the geometry
        geometry.computeBoundingBox();
        const center = new THREE.Vector3();
        geometry.boundingBox?.getCenter(center);
        geometry.translate(-center.x, -center.y, -center.z);

        // Scale to fit in view
        const size = new THREE.Vector3();
        geometry.boundingBox?.getSize(size);
        const maxDim = Math.max(size.x, size.y, size.z);
        const fitScale = 4 / maxDim;
        geometry.scale(fitScale, fitScale, fitScale);

        // Apply user-defined scale
        geometry.scale(currentScale, currentScale, currentScale);

        // Create material
        const material = new THREE.MeshPhongMaterial({
          color: 0x156289,
          emissive: 0x072534,
          side: THREE.DoubleSide,
          flatShading: true,
        });

        // Create mesh
        const mesh = new THREE.Mesh(geometry, material);
        mesh.name = 'stlMesh';
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        sceneRef.current?.add(mesh);

        // Update camera position
        if (rendererRef.current && controlsRef.current) {
          const camera = controlsRef.current.object;
          camera.position.set(5, 5, 5);
          camera.lookAt(0, 0, 0);
          controlsRef.current.update();
        }

        setLoading(false);
      } catch (err) {
        setError('Failed to load STL data');
        setLoading(false);
        console.error('STL loading error:', err);
      }
    };

    loadSTLData();
  }, [sessionId, currentScale]);

  return (
    <Paper elevation={3} sx={{ p: 2, textAlign: 'center' }}>
      <Typography variant="h6" gutterBottom>
        3D Model Viewer
      </Typography>
      <Box
        ref={mountRef}
        sx={{
          width: width,
          height: height,
          border: '1px solid #ccc',
          borderRadius: 1,
          position: 'relative',
        }}
      >
        {loading && (
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 1,
            }}
          >
            <CircularProgress />
            <Typography sx={{ mt: 1 }}>Loading...</Typography>
          </Box>
        )}
        {error && (
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 1,
              color: 'error.main',
            }}
          >
            <Typography color="error">{error}</Typography>
          </Box>
        )}
      </Box>
      <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
        Use mouse to rotate, scroll to zoom, right-click to pan
      </Typography>
    </Paper>
  );
};

export default STLViewer; 