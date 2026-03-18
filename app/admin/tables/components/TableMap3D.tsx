"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import type { Floor } from "./TableMap2D";
import type { TableData } from "./DraggableTable";

export interface TableMap3DProps {
  floor: Floor;
  onTableClick: (table: TableData) => void;
  selectedTableIds?: string[];
}

const STATUS_COLORS: Record<TableData["status"], string> = {
  AVAILABLE: "#52c41a",
  RESERVED: "#1890ff",
  OCCUPIED: "#ff4d4f",
  CLEANING: "#faad14",
  DISABLED: "#d9d9d9",
  SELECTED: "#52c41a",
};

const STATUS_EMISSIVE: Partial<Record<TableData["status"], string>> = {
  AVAILABLE: "#0a2000",
  RESERVED: "#001830",
  OCCUPIED: "#200000",
  CLEANING: "#2b1b00",
};

const STATUS_LABELS: Record<TableData["status"], string> = {
  AVAILABLE: "Available",
  RESERVED: "Reserved",
  OCCUPIED: "Occupied",
  CLEANING: "Cleaning",
  DISABLED: "Disabled",
  SELECTED: "Selected",
};

const SELECTED_COLOR = "#5b8cff";

const createLabelCanvas = (text: string, color: string) => {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) return canvas;

  const fontSize = 32;
  context.font = `600 ${fontSize}px "Plus Jakarta Sans", "Inter", sans-serif`;
  const metrics = context.measureText(text);
  const paddingX = 24;
  const paddingY = 18;
  const width = Math.ceil(metrics.width + paddingX * 2);
  const height = fontSize + paddingY * 2;

  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  ctx.fillStyle = "rgba(10,10,16,0.75)";
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  const radius = 16;
  ctx.moveTo(radius, 0);
  ctx.lineTo(width - radius, 0);
  ctx.quadraticCurveTo(width, 0, width, radius);
  ctx.lineTo(width, height - radius);
  ctx.quadraticCurveTo(width, height, width - radius, height);
  ctx.lineTo(radius, height);
  ctx.quadraticCurveTo(0, height, 0, height - radius);
  ctx.lineTo(0, radius);
  ctx.quadraticCurveTo(0, 0, radius, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#f5f4f2";
  ctx.font = `600 ${fontSize}px "Plus Jakarta Sans", "Inter", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, width / 2, height / 2 + 1);

  return canvas;
};

const buildTableMesh = (table: TableData, selected: boolean) => {
  const scale = 0.01;
  const height = 0.08;
  const width = Math.max(table.width ?? 80, 20) * scale;
  const depth = Math.max(table.height ?? 80, 20) * scale;

  let geometry: THREE.BufferGeometry;
  const isRound = table.shape === "Circle" || table.shape === "Oval";
  if (isRound) {
    geometry = new THREE.CylinderGeometry(width / 2, width / 2, height, 48);
  } else {
    geometry = new THREE.BoxGeometry(width, height, depth);
  }

  const statusColor = selected ? SELECTED_COLOR : STATUS_COLORS[table.status];
  const material = new THREE.MeshStandardMaterial({
    color: statusColor,
    emissive: STATUS_EMISSIVE[table.status] || "#000000",
    roughness: 0.5,
    metalness: 0.1,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(0, height / 2, 0);
  mesh.rotation.y = THREE.MathUtils.degToRad(table.rotation || 0);
  mesh.userData = { table };
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  return mesh;
};

const addTableLegs = (group: THREE.Group, table: TableData) => {
  const scale = 0.01;
  const legHeight = 0.06;
  const legRadius = 0.01;
  const legMaterial = new THREE.MeshStandardMaterial({
    color: "#3a3227",
    roughness: 0.7,
    metalness: 0.05,
  });

  const isRound = table.shape === "Circle" || table.shape === "Oval";
  if (isRound) {
    const legGeometry = new THREE.CylinderGeometry(legRadius, legRadius, legHeight, 12);
    const leg = new THREE.Mesh(legGeometry, legMaterial);
    leg.position.set(0, -legHeight / 2, 0);
    group.add(leg);
    return;
  }

  const width = (table.width ?? 80) * scale;
  const depth = (table.height ?? 80) * scale;
  const offsets = [
    [width / 2 - 0.02, depth / 2 - 0.02],
    [-width / 2 + 0.02, depth / 2 - 0.02],
    [width / 2 - 0.02, -depth / 2 + 0.02],
    [-width / 2 + 0.02, -depth / 2 + 0.02],
  ];

  const legGeometry = new THREE.CylinderGeometry(legRadius, legRadius, legHeight, 12);
  offsets.forEach(([x, z]) => {
    const leg = new THREE.Mesh(legGeometry, legMaterial);
    leg.position.set(x, -legHeight / 2, z);
    group.add(leg);
  });
};

const buildTableGroup = (table: TableData, selected: boolean) => {
  const group = new THREE.Group();
  const tableMesh = buildTableMesh(table, selected);
  group.add(tableMesh);
  addTableLegs(group, table);

  const scale = 0.01;
  const width = (table.width ?? 80) * scale;
  const depth = (table.height ?? 80) * scale;
  group.position.set(
    table.position.x * scale + width / 2,
    0,
    table.position.y * scale + depth / 2,
  );
  group.rotation.y = THREE.MathUtils.degToRad(table.rotation || 0);
  tableMesh.rotation.set(0, 0, 0);

  group.userData = { table, tableMesh };
  return group;
};

const buildLabelSprite = (table: TableData, selected: boolean) => {
  const color = selected ? SELECTED_COLOR : STATUS_COLORS[table.status];
  const canvas = createLabelCanvas(`${table.name} · ${table.seats}`, color);
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(0.8, 0.3, 1);
  sprite.position.set(0, 0.25, 0);
  return sprite;
};

const updateLabelSprite = (sprite: THREE.Sprite, table: TableData, selected: boolean) => {
  const color = selected ? SELECTED_COLOR : STATUS_COLORS[table.status];
  const canvas = createLabelCanvas(`${table.name} · ${table.seats}`, color);
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  const material = sprite.material as THREE.SpriteMaterial;
  material.map = texture;
  material.needsUpdate = true;
};

const buildWalls = (
  scene: THREE.Scene,
  minX: number,
  maxX: number,
  minZ: number,
  maxZ: number,
) => {
  const wallMaterial = new THREE.MeshStandardMaterial({
    color: "#e8e0d0",
    transparent: true,
    opacity: 0.85,
  });
  const wallHeight = 1.2;
  const thickness = 0.05;

  const width = Math.max(maxX - minX, 0.1);
  const height = Math.max(maxZ - minZ, 0.1);
  const centerX = (minX + maxX) / 2;
  const centerZ = (minZ + maxZ) / 2;

  const horizontalGeometry = new THREE.BoxGeometry(width, wallHeight, thickness);
  const verticalGeometry = new THREE.BoxGeometry(thickness, wallHeight, height);

  const north = new THREE.Mesh(horizontalGeometry, wallMaterial);
  north.position.set(centerX, wallHeight / 2, minZ - thickness / 2);
  const south = new THREE.Mesh(horizontalGeometry, wallMaterial);
  south.position.set(centerX, wallHeight / 2, maxZ + thickness / 2);
  const west = new THREE.Mesh(verticalGeometry, wallMaterial);
  west.position.set(minX - thickness / 2, wallHeight / 2, centerZ);
  const east = new THREE.Mesh(verticalGeometry, wallMaterial);
  east.position.set(maxX + thickness / 2, wallHeight / 2, centerZ);

  const walls = [north, south, west, east];
  walls.forEach((wall) => {
    wall.receiveShadow = true;
    scene.add(wall);
  });

  return walls;
};

export const TableMap3D: React.FC<TableMap3DProps> = ({
  floor,
  onTableClick,
  selectedTableIds = [],
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const animationRef = useRef<number | null>(null);
  const tableGroupsRef = useRef<THREE.Group[]>([]);
  const labelsRef = useRef<THREE.Sprite[]>([]);
  const floorMeshRef = useRef<THREE.Mesh | null>(null);
  const floorImageRef = useRef<THREE.Mesh | null>(null);
  const wallMeshesRef = useRef<THREE.Mesh[]>([]);
  const raycasterRef = useRef(new THREE.Raycaster());
  const pointerRef = useRef(new THREE.Vector2());

  const [hoveredTable, setHoveredTable] = useState<TableData | null>(null);
  const [hoverClientPos, setHoverClientPos] = useState<{ x: number; y: number } | null>(null);

  const selectedSet = useMemo(() => new Set(selectedTableIds), [selectedTableIds]);

  const orbitRef = useRef({
    radius: 6,
    theta: Math.PI / 4,
    phi: Math.PI / 4,
  });

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth || 1;
    const height = container.clientHeight || 1;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#0f0f14");
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio || 1);
    renderer.shadowMap.enabled = true;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0xffffff, 0.75);
    scene.add(ambient);

    const directional = new THREE.DirectionalLight(0xffffff, 1.1);
    directional.position.set(2.5, 5, 3.5);
    directional.castShadow = true;
    scene.add(directional);

    const point = new THREE.PointLight(0xffe2b8, 0.9, 14, 2);
    point.position.set(0.5, 1.8, 0.5);
    scene.add(point);

    const resizeObserver = new ResizeObserver(() => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const nextWidth = containerRef.current.clientWidth || 1;
      const nextHeight = containerRef.current.clientHeight || 1;
      rendererRef.current.setSize(nextWidth, nextHeight);
      cameraRef.current.aspect = nextWidth / nextHeight;
      cameraRef.current.updateProjectionMatrix();
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      renderer.dispose();
      renderer.domElement.remove();
      tableGroupsRef.current = [];
      labelsRef.current = [];
      scene.clear();
    };
  }, [floor.id]);

  useEffect(() => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;

    const scale = 0.01;
    const floorWidth = floor.width * scale;
    const floorHeight = floor.height * scale;

    if (floorMeshRef.current) {
      scene.remove(floorMeshRef.current);
      const oldMaterial = floorMeshRef.current.material as THREE.Material;
      const oldGeometry = floorMeshRef.current.geometry as THREE.BufferGeometry;
      oldMaterial.dispose();
      oldGeometry.dispose();
    }

    if (floorImageRef.current) {
      scene.remove(floorImageRef.current);
      const oldMaterial = floorImageRef.current.material as THREE.Material;
      const oldGeometry = floorImageRef.current.geometry as THREE.BufferGeometry;
      oldMaterial.dispose();
      oldGeometry.dispose();
    }

    const floorGeometry = new THREE.PlaneGeometry(floorWidth, floorHeight);
    floorGeometry.rotateX(-Math.PI / 2);
    floorGeometry.translate(floorWidth / 2, 0, floorHeight / 2);

    const material = new THREE.MeshStandardMaterial({
      color: "#1a1a22",
      roughness: 0.9,
      metalness: 0.05,
    });

    const floorMesh = new THREE.Mesh(floorGeometry, material);
    floorMesh.receiveShadow = true;
    floorMesh.position.set(0, 0, 0);
    scene.add(floorMesh);
    floorMeshRef.current = floorMesh;

    if (floor.backgroundImage && typeof window !== "undefined") {
      new THREE.TextureLoader().load(floor.backgroundImage, (texture) => {
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        texture.colorSpace = THREE.SRGBColorSpace;

        const imageWidth = (texture.image as HTMLImageElement | undefined)?.width ?? 1;
        const imageHeight = (texture.image as HTMLImageElement | undefined)?.height ?? 1;
        const imageAspect = imageWidth / imageHeight;
        const floorAspect = floorWidth / floorHeight;

        let imageWidthWorld = floorWidth;
        let imageHeightWorld = floorHeight;

        if (floorAspect > imageAspect) {
          imageWidthWorld = floorHeight * imageAspect;
        } else {
          imageHeightWorld = floorWidth / imageAspect;
        }

        const imageGeometry = new THREE.PlaneGeometry(imageWidthWorld, imageHeightWorld);
        imageGeometry.rotateX(-Math.PI / 2);
        imageGeometry.translate(floorWidth / 2, 0, floorHeight / 2);

        const imageMaterial = new THREE.MeshStandardMaterial({
          map: texture,
          transparent: true,
          color: "#ffffff",
          roughness: 0.9,
          metalness: 0.05,
        });

        const imageMesh = new THREE.Mesh(imageGeometry, imageMaterial);
        imageMesh.receiveShadow = true;
        imageMesh.position.set(0, 0.001, 0);
        scene.add(imageMesh);
        floorImageRef.current = imageMesh;

        const bounds = {
          minX: floorWidth / 2 - imageWidthWorld / 2,
          maxX: floorWidth / 2 + imageWidthWorld / 2,
          minZ: floorHeight / 2 - imageHeightWorld / 2,
          maxZ: floorHeight / 2 + imageHeightWorld / 2,
        };

        applyWalls(bounds);
      });
    }

    const imageWidth = floorImageRef.current
      ? (floorImageRef.current.geometry as THREE.PlaneGeometry).parameters.width
      : floorWidth;
    const imageHeight = floorImageRef.current
      ? (floorImageRef.current.geometry as THREE.PlaneGeometry).parameters.height
      : floorHeight;

    const minX = floorWidth / 2 - imageWidth / 2;
    const maxX = floorWidth / 2 + imageWidth / 2;
    const minZ = floorHeight / 2 - imageHeight / 2;
    const maxZ = floorHeight / 2 + imageHeight / 2;

    const applyWalls = (bounds: { minX: number; maxX: number; minZ: number; maxZ: number }) => {
      wallMeshesRef.current.forEach((wall) => scene.remove(wall));
      wallMeshesRef.current = buildWalls(scene, bounds.minX, bounds.maxX, bounds.minZ, bounds.maxZ);
    };

    applyWalls({ minX, maxX, minZ, maxZ });

    return () => {
      wallMeshesRef.current.forEach((wall) => scene.remove(wall));
      wallMeshesRef.current = [];
      if (floorImageRef.current) {
        scene.remove(floorImageRef.current);
        const oldMaterial = floorImageRef.current.material as THREE.Material;
        const oldGeometry = floorImageRef.current.geometry as THREE.BufferGeometry;
        oldMaterial.dispose();
        oldGeometry.dispose();
        floorImageRef.current = null;
      }
      if (floorMeshRef.current) {
        scene.remove(floorMeshRef.current);
        const oldMaterial = floorMeshRef.current.material as THREE.Material;
        const oldGeometry = floorMeshRef.current.geometry as THREE.BufferGeometry;
        oldMaterial.dispose();
        oldGeometry.dispose();
        floorMeshRef.current = null;
      }
    };
  }, [floor.id, floor.backgroundImage]);

  useEffect(() => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;
    tableGroupsRef.current.forEach((group) => scene.remove(group));
    labelsRef.current.forEach((label) => scene.remove(label));
    tableGroupsRef.current = [];
    labelsRef.current = [];

    floor.tables.forEach((table) => {
      const selected = selectedSet.has(table.id);
      const group = buildTableGroup(table, selected);
      const label = buildLabelSprite(table, selected);
      group.add(label);
      scene.add(group);
      tableGroupsRef.current.push(group);
      labelsRef.current.push(label);
    });

    const camera = cameraRef.current;
    if (camera) {
      const scale = 0.01;
      const floorWidth = floor.width * scale;
      const floorHeight = floor.height * scale;
      orbitRef.current.radius = Math.max(floorWidth, floorHeight) * 1.4;
      orbitRef.current.theta = Math.PI / 4;
      orbitRef.current.phi = Math.PI / 3;
      const target = new THREE.Vector3(floorWidth / 2, 0, floorHeight / 2);
      camera.position.set(
        target.x + orbitRef.current.radius * Math.sin(orbitRef.current.phi) * Math.sin(orbitRef.current.theta),
        target.y + orbitRef.current.radius * Math.cos(orbitRef.current.phi),
        target.z + orbitRef.current.radius * Math.sin(orbitRef.current.phi) * Math.cos(orbitRef.current.theta),
      );
      camera.lookAt(target);
    }
  }, [floor.id, floor.tables, selectedSet]);

  useEffect(() => {
    tableGroupsRef.current.forEach((group) => {
      const table = group.userData.table as TableData;
      const isSelected = selectedSet.has(table.id);
      const tableMesh = group.userData.tableMesh as THREE.Mesh;
      const material = tableMesh.material as THREE.MeshStandardMaterial;
      material.color.set(isSelected ? SELECTED_COLOR : STATUS_COLORS[table.status]);
      material.emissive.set(STATUS_EMISSIVE[table.status] || "#000000");

      const label = group.children.find((child) => child instanceof THREE.Sprite) as
        | THREE.Sprite
        | undefined;
      if (label) {
        updateLabelSprite(label, table, isSelected);
      }
    });
  }, [floor.tables, selectedSet]);

  useEffect(() => {
    if (!rendererRef.current || !cameraRef.current) return;
    const renderer = rendererRef.current;
    const camera = cameraRef.current;

    let isDragging = false;
    let moved = false;
    let lastX = 0;
    let lastY = 0;

    const handlePointerDown = (event: PointerEvent) => {
      isDragging = true;
      moved = false;
      lastX = event.clientX;
      lastY = event.clientY;
    };

    const handlePointerMove = (event: PointerEvent) => {
      const deltaX = event.clientX - lastX;
      const deltaY = event.clientY - lastY;
      if (Math.abs(deltaX) > 1 || Math.abs(deltaY) > 1) moved = true;

      if (isDragging) {
        orbitRef.current.theta -= deltaX * 0.005;
        orbitRef.current.phi = Math.min(
          Math.PI / 2.2,
          Math.max(0.2, orbitRef.current.phi - deltaY * 0.005),
        );
      }

      lastX = event.clientX;
      lastY = event.clientY;

      const rect = renderer.domElement.getBoundingClientRect();
      pointerRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointerRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycasterRef.current.setFromCamera(pointerRef.current, camera);
      const intersects = raycasterRef.current.intersectObjects(tableGroupsRef.current, true);
      if (intersects.length > 0) {
        let target = intersects[0].object as THREE.Object3D | null;
        while (target && !(target as THREE.Group).userData?.table) {
          target = target.parent;
        }
        const targetGroup = target as THREE.Group | null;
        const table = targetGroup?.userData?.table as TableData | undefined;
        if (table) {
          setHoveredTable(table);
          setHoverClientPos({ x: event.clientX, y: event.clientY });
          return;
        }
      }
      setHoveredTable(null);
      setHoverClientPos(null);
    };

    const handlePointerUp = (event: PointerEvent) => {
      isDragging = false;
      if (moved) return;

      const rect = renderer.domElement.getBoundingClientRect();
      const dx = event.clientX - lastX;
      const dy = event.clientY - lastY;
      if (Math.sqrt(dx * dx + dy * dy) > 5) return;

      pointerRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointerRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycasterRef.current.setFromCamera(pointerRef.current, camera);
      const intersects = raycasterRef.current.intersectObjects(tableGroupsRef.current, true);
      if (intersects.length === 0) return;
      let target = intersects[0].object as THREE.Object3D | null;
      while (target && !(target as THREE.Group).userData?.table) {
        target = target.parent;
      }
      const targetGroup = target as THREE.Group | null;
      const table = targetGroup?.userData?.table as TableData | undefined;
      if (table?.status === "AVAILABLE") {
        onTableClick(table);
      }
    };

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      const delta = event.deltaY * 0.001;
      orbitRef.current.radius = Math.min(20, Math.max(2.5, orbitRef.current.radius + delta));
    };

    renderer.domElement.addEventListener("pointerdown", handlePointerDown);
    renderer.domElement.addEventListener("pointermove", handlePointerMove);
    renderer.domElement.addEventListener("pointerup", handlePointerUp);
    renderer.domElement.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      renderer.domElement.removeEventListener("pointerdown", handlePointerDown);
      renderer.domElement.removeEventListener("pointermove", handlePointerMove);
      renderer.domElement.removeEventListener("pointerup", handlePointerUp);
      renderer.domElement.removeEventListener("wheel", handleWheel);
    };
  }, [onTableClick]);

  useEffect(() => {
    if (!cameraRef.current || !sceneRef.current || !rendererRef.current) return;
    const camera = cameraRef.current;
    const renderer = rendererRef.current;

    const animate = (time: number) => {
      const scale = 0.01;
      const target = new THREE.Vector3(floor.width * scale / 2, 0, floor.height * scale / 2);
      camera.position.set(
        target.x + orbitRef.current.radius * Math.sin(orbitRef.current.phi) * Math.sin(orbitRef.current.theta),
        target.y + orbitRef.current.radius * Math.cos(orbitRef.current.phi),
        target.z + orbitRef.current.radius * Math.sin(orbitRef.current.phi) * Math.cos(orbitRef.current.theta),
      );
      camera.lookAt(target);

      tableGroupsRef.current.forEach((group) => {
        const table = group.userData.table as TableData;
        const tableMesh = group.userData.tableMesh as THREE.Mesh;
        const material = tableMesh.material as THREE.MeshStandardMaterial;
        if (table.status === "AVAILABLE") {
          const pulse = 0.12 + Math.sin(time * 0.003 + group.id) * 0.08;
          material.emissiveIntensity = pulse;
        } else {
          material.emissiveIntensity = 0.2;
        }
      });

      if (sceneRef.current) {
        renderer.render(sceneRef.current, camera);
      }
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [floor]);

  useEffect(() => {
    if (!rendererRef.current) return;
    const canvas = rendererRef.current.domElement;
    if (!hoveredTable) {
      canvas.style.cursor = "grab";
      return;
    }
    canvas.style.cursor = hoveredTable.status === "AVAILABLE" ? "pointer" : "not-allowed";
  }, [hoveredTable]);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        borderRadius: 24,
        border: "1px solid var(--border)",
        background: "var(--surface)",
        overflow: "hidden",
      }}
    >
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
      {hoveredTable && hoverClientPos && (
        <div
          style={{
            position: "fixed",
            left: hoverClientPos.x + 12,
            top: hoverClientPos.y + 12,
            padding: "10px 14px",
            background: "rgba(15, 15, 20, 0.9)",
            color: "#f5f4f2",
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.1)",
            fontSize: 12,
            pointerEvents: "none",
            zIndex: 20,
            minWidth: 140,
            boxShadow: "0 12px 30px rgba(0,0,0,0.35)",
          }}
        >
          <div style={{ fontWeight: 600, fontSize: 13 }}>{hoveredTable.name}</div>
          <div style={{ opacity: 0.8, marginTop: 4 }}>
            {hoveredTable.seats} seats · {STATUS_LABELS[hoveredTable.status]}
          </div>
        </div>
      )}
    </div>
  );
};
