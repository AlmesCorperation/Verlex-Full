import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { AvatarConfig } from '../types';
import { AvatarRig } from '../game/avatarRig';

interface AvatarPreviewProps {
  config: AvatarConfig;
  name?: string;
  width?: number | string;
  height?: number | string;
  interactive?: boolean;
  autoRotate?: boolean;
  className?: string;
}

export const AvatarPreview: React.FC<AvatarPreviewProps> = ({
  config,
  name = 'Verlexian',
  width = '100%',
  height = '100%',
  interactive = true,
  autoRotate = true,
  className = '',
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const rigRef = useRef<AvatarRig | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const isDraggingRef = useRef<boolean>(false);
  const prevMouseXRef = useRef<number>(0);
  const rotYRef = useRef<number>(0.2);

  // Initialize Three.js scene
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const w = container.clientWidth || 200;
    const h = container.clientHeight || 240;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Ambient & Directional Lighting matching  plastic shine
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.95);
    dirLight.position.set(5, 10, 7);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const backLight = new THREE.DirectionalLight(0xa0c4ff, 0.4);
    backLight.position.set(-5, 6, -5);
    scene.add(backLight);

    // Subtle checkered round pedestal
    const pedestal = new THREE.Mesh(
      new THREE.CylinderGeometry(2.2, 2.4, 0.3, 32),
      new THREE.MeshStandardMaterial({
        color: 0xdddddd,
        roughness: 0.5,
      })
    );
    pedestal.position.y = -0.15;
    scene.add(pedestal);

    // Create Avatar Rig
    const rig = new AvatarRig(name, config);
    rigRef.current = rig;
    // Hide in-game name tag for mini avatar preview
    if (rig.nameTagSprite) {
      rig.nameTagSprite.visible = false;
    }
    scene.add(rig.rootGroup);

    // Camera setup
    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 50);
    camera.position.set(0, 2.2, 6.2);
    camera.lookAt(0, 1.9, 0);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    rendererRef.current = renderer;

    container.replaceChildren(renderer.domElement);

    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      if (autoRotate && !isDraggingRef.current) {
        rotYRef.current += delta * 0.4;
      }

      if (rigRef.current) {
        rigRef.current.rootGroup.rotation.y = rotYRef.current;
        rigRef.current.updateAnimation(delta, 'idle', 0);
      }

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const nw = container.clientWidth;
      const nh = container.clientHeight;
      if (nw === 0 || nh === 0) return;
      cameraRef.current.aspect = nw / nh;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(nw, nh);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, []);

  // Update avatar config dynamically
  useEffect(() => {
    if (rigRef.current) {
      rigRef.current.updateConfig(config);
      if (rigRef.current.nameTagSprite) {
        rigRef.current.nameTagSprite.visible = false;
      }
    }
  }, [config]);

  // Mouse drag rotation handling
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!interactive) return;
    isDraggingRef.current = true;
    prevMouseXRef.current = e.clientX;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current || !interactive) return;
    const deltaX = e.clientX - prevMouseXRef.current;
    rotYRef.current += deltaX * 0.015;
    prevMouseXRef.current = e.clientX;
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  return (
    <div
      id="-avatar-preview-container"
      ref={mountRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{ width, height }}
      className={`relative cursor-grab active:cursor-grabbing select-none ${className}`}
      title="Click and drag to rotate your Verlexian"
    />
  );
};
