'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface PanoramaViewerProps {
  src: string;
  height?: number;
}

export default function PanoramaViewer({ src, height = 320 }: PanoramaViewerProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const w = mount.clientWidth || 600;
    const h = height;

    // Scene
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(90, w / h, 0.1, 1000);
    camera.position.set(0, 0, 0.01);

    const renderer = new THREE.WebGLRenderer({ antialias: true, precision: 'highp' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio * 2, 4));
    renderer.setSize(w, h);
    mount.appendChild(renderer.domElement);

    // Sphere geometry — inside-out, high segment count for sharpness
    const geometry = new THREE.SphereGeometry(500, 128, 64);
    geometry.scale(-1, 1, 1);

    const texture = new THREE.TextureLoader().load(src);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;
    const material = new THREE.MeshBasicMaterial({ map: texture });
    const sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);

    // Auto-rotate state
    let lon = 0;
    let lat = 0;
    let isDragging = false;
    let prevX = 0;
    let prevY = 0;
    let autoRotate = true;
    let animId: number;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      autoRotate = false;
      prevX = e.clientX;
      prevY = e.clientY;
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      lon -= (e.clientX - prevX) * 0.3;
      lat += (e.clientY - prevY) * 0.15;
      lat = Math.max(-85, Math.min(85, lat));
      prevX = e.clientX;
      prevY = e.clientY;
    };
    const onMouseUp = () => { isDragging = false; };

    const onTouchStart = (e: TouchEvent) => {
      isDragging = true;
      autoRotate = false;
      prevX = e.touches[0].clientX;
      prevY = e.touches[0].clientY;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!isDragging) return;
      lon -= (e.touches[0].clientX - prevX) * 0.3;
      lat += (e.touches[0].clientY - prevY) * 0.15;
      lat = Math.max(-85, Math.min(85, lat));
      prevX = e.touches[0].clientX;
      prevY = e.touches[0].clientY;
    };
    const onTouchEnd = () => { isDragging = false; };

    renderer.domElement.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    renderer.domElement.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);

    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (autoRotate) lon += 0.06;
      const phi = THREE.MathUtils.degToRad(90 - lat);
      const theta = THREE.MathUtils.degToRad(lon);
      camera.lookAt(
        Math.sin(phi) * Math.cos(theta),
        Math.cos(phi),
        Math.sin(phi) * Math.sin(theta),
      );
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      const nw = mount.clientWidth;
      renderer.setSize(nw, h);
      camera.aspect = nw / h;
      camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      renderer.domElement.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      renderer.domElement.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, [src, height]);

  return (
    <div
      ref={mountRef}
      style={{ width: '100%', height, cursor: 'grab', borderRadius: 'inherit' }}
    />
  );
}
