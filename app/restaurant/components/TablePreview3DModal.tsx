"use client";

/**
 * TablePreview3DModal
 *
 * Flow: Map 2D (readOnly) → click bàn → fullscreen 360° viewer → đặt bàn.
 */

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import * as THREE from "three";
import type { CreateReservationResponse } from "@/lib/services/reservationService";
import type { TableData } from "@/app/admin/tables/components/DraggableTable";

const STATUS_LABEL: Record<string, string> = {
  AVAILABLE: "Còn trống",
  RESERVED: "Đã đặt",
  OCCUPIED: "Đang có khách",
  CLEANING: "Đang dọn",
  DISABLED: "Không hoạt động",
};

type CubemapData = NonNullable<TableData["cubemap"]>;

interface TablePreview3DModalProps {
  open: boolean;
  table: TableData | null;
  tableCubemap?: CubemapData;
  onClose: () => void;
  onBookNow: () => void;
  onSuccess?: (result: CreateReservationResponse) => void;
}

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

function Table360Viewer({
  open,
  cubemap,
  onReady,
  onError,
}: {
  open: boolean;
  cubemap?: CubemapData;
  onReady: () => void;
  onError?: (reason: "missing" | "load") => void;
}) {
  const mountRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    cleanup: () => void;
  } | null>(null);

  useEffect(() => {
    if (!open || !mountRef.current) return;

    const wrap = mountRef.current;
    const width = wrap.clientWidth || window.innerWidth;
    const height = wrap.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio || 1);
    renderer.setSize(width, height);
    wrap.appendChild(renderer.domElement);

    let isDragging = false;
    let lastPointer = { x: 0, y: 0 };
    let lon = 0;
    let lat = 0;
    let animId = 0;
    let disposed = false;

    const updateCamera = () => {
      const phi = THREE.MathUtils.degToRad(90 - lat);
      const theta = THREE.MathUtils.degToRad(lon);
      camera.lookAt(
        500 * Math.sin(phi) * Math.cos(theta),
        500 * Math.cos(phi),
        500 * Math.sin(phi) * Math.sin(theta),
      );
    };

    const onPointerDown = (event: PointerEvent) => {
      isDragging = true;
      lastPointer = { x: event.clientX, y: event.clientY };
      renderer.domElement.style.cursor = "grabbing";
    };

    const onPointerUp = () => {
      isDragging = false;
      renderer.domElement.style.cursor = "grab";
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!isDragging) return;
      lon -= (event.clientX - lastPointer.x) * 0.15;
      lat += (event.clientY - lastPointer.y) * 0.15;
      lat = clamp(lat, -85, 85);
      lastPointer = { x: event.clientX, y: event.clientY };
    };

    const activeTouches = new Map<number, { x: number; y: number }>();
    let startPinchDistance: number | null = null;
    let startFov = camera.fov;

    const getTouchDistance = () => {
      const points = Array.from(activeTouches.values());
      if (points.length < 2) return null;
      const [a, b] = points;
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      return Math.hypot(dx, dy);
    };

    const onTouchStart = (event: TouchEvent) => {
      if (event.touches.length < 2) return;
      for (const touch of Array.from(event.touches)) {
        activeTouches.set(touch.identifier, { x: touch.clientX, y: touch.clientY });
      }
      startPinchDistance = getTouchDistance();
      startFov = camera.fov;
    };

    const onTouchMove = (event: TouchEvent) => {
      if (event.touches.length < 2 || startPinchDistance === null) return;
      for (const touch of Array.from(event.touches)) {
        activeTouches.set(touch.identifier, { x: touch.clientX, y: touch.clientY });
      }
      const nextDistance = getTouchDistance();
      if (!nextDistance) return;
      const ratio = startPinchDistance / nextDistance;
      camera.fov = clamp(startFov * ratio, 30, 100);
      camera.updateProjectionMatrix();
      event.preventDefault();
    };

    const onTouchEnd = (event: TouchEvent) => {
      for (const touch of Array.from(event.changedTouches)) {
        activeTouches.delete(touch.identifier);
      }
      if (activeTouches.size < 2) {
        startPinchDistance = null;
        startFov = camera.fov;
      }
    };

    const onWheel = (event: WheelEvent) => {
      const nextFov = camera.fov + event.deltaY * 0.03;
      camera.fov = clamp(nextFov, 30, 100);
      camera.updateProjectionMatrix();
    };

    const onResize = () => {
      if (!wrap) return;
      const nextWidth = wrap.clientWidth || window.innerWidth;
      const nextHeight = wrap.clientHeight || window.innerHeight;
      camera.aspect = nextWidth / nextHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(nextWidth, nextHeight);
    };

    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin("anonymous");

    if (!cubemap) {
      onError?.("missing");
      onReady();
      return () => {
        viewerRef.current?.cleanup();
        viewerRef.current = null;
      };
    }

    const faceOrder: Array<keyof CubemapData> = ["px", "nx", "py", "ny", "pz", "nz"];

    Promise.all(
      faceOrder.map(
        (face) =>
          new Promise<THREE.Texture>((resolve, reject) => {
            loader.load(
              cubemap[face],
              (texture) => resolve(texture),
              undefined,
              reject,
            );
          }),
      ),
    )
      .then((textures) => {
        if (disposed) return;

        textures.forEach((texture) => {
          texture.colorSpace = THREE.SRGBColorSpace;
        });

        const materials = textures.map(
          (texture) =>
            new THREE.MeshBasicMaterial({
              map: texture,
              side: THREE.BackSide,
            }),
        );

        const box = new THREE.BoxGeometry(500, 500, 500);
        const skybox = new THREE.Mesh(box, materials);
        scene.add(skybox);
        onReady();
      })
      .catch(() => {
        onError?.("load");
        onReady();
      });

    renderer.domElement.style.cursor = "grab";
    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointermove", onPointerMove);
    renderer.domElement.addEventListener("wheel", onWheel, { passive: true });
    renderer.domElement.addEventListener("touchstart", onTouchStart, { passive: true });
    renderer.domElement.addEventListener("touchmove", onTouchMove, { passive: false });
    renderer.domElement.addEventListener("touchend", onTouchEnd, { passive: true });
    renderer.domElement.addEventListener("touchcancel", onTouchEnd, { passive: true });
    window.addEventListener("resize", onResize);

    const animate = () => {
      animId = requestAnimationFrame(animate);
      updateCamera();
      renderer.render(scene, camera);
    };
    animate();

    viewerRef.current = {
      renderer,
      scene,
      camera,
      cleanup: () => {
        disposed = true;
        cancelAnimationFrame(animId);
        renderer.domElement.removeEventListener("pointerdown", onPointerDown);
        window.removeEventListener("pointerup", onPointerUp);
        window.removeEventListener("pointermove", onPointerMove);
        renderer.domElement.removeEventListener("wheel", onWheel);
        renderer.domElement.removeEventListener("touchstart", onTouchStart);
        renderer.domElement.removeEventListener("touchmove", onTouchMove);
        renderer.domElement.removeEventListener("touchend", onTouchEnd);
        renderer.domElement.removeEventListener("touchcancel", onTouchEnd);
        window.removeEventListener("resize", onResize);
        renderer.dispose();
        if (wrap.contains(renderer.domElement)) wrap.removeChild(renderer.domElement);
      },
    };

    return () => {
      viewerRef.current?.cleanup();
      viewerRef.current = null;
    };
  }, [open, cubemap, onReady]);

  return <div ref={mountRef} style={{ width: "100%", height: "100%" }} />;
}

export default function TablePreview3DModal({
  open,
  table,
  tableCubemap,
  onClose,
  onBookNow,
  onSuccess: _onSuccess,
}: TablePreview3DModalProps) {
  const [viewerReady, setViewerReady] = useState(false);
  const [viewerError, setViewerError] = useState<"missing" | "load" | null>(null);

  useEffect(() => {
    if (!open) {
      setViewerReady(false);
      setViewerError(null);
    }
  }, [open]);

  if (!open || !table || typeof document === "undefined") return null;

  const canBook = table.status === "AVAILABLE";

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1001,
            background: "#000",
          }}
        >
          <div style={{ position: "absolute", inset: 0 }}>
            <Table360Viewer
              open={open}
              cubemap={tableCubemap}
              onReady={() => setViewerReady(true)}
              onError={(reason) => setViewerError(reason)}
            />
          </div>

          {!viewerReady && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 14,
                background: "#000",
                zIndex: 5,
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  border: "3px solid rgba(255,255,255,.1)",
                  borderTopColor: "#6366f1",
                  animation: "spin .8s linear infinite",
                }}
              />
              <div style={{ fontSize: 13, color: "#555" }}>Đang tải ảnh 360°...</div>
            </div>
          )}

          {viewerReady && viewerError && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                color: "rgba(255,255,255,.7)",
                background: "rgba(0,0,0,.65)",
                zIndex: 6,
                textAlign: "center",
                padding: "0 24px",
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 600 }}>Ảnh 360° chưa sẵn sàng</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,.45)" }}>
                {viewerError === "missing" ? "Nhà hàng chưa cập nhật ảnh 360°" : "Không thể tải ảnh 360°. Vui lòng thử lại sau."}
              </div>
            </div>
          )}

          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              zIndex: 10,
              padding: "14px 20px",
              display: "flex",
              alignItems: "center",
              gap: 12,
              background: "linear-gradient(to bottom, rgba(0,0,0,.7), transparent)",
            }}
          >
            <button
              onClick={onClose}
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "rgba(255,255,255,.12)",
                border: "1px solid rgba(255,255,255,.15)",
                color: "#fff",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M19 12H5M12 5l-7 7 7 7" />
              </svg>
            </button>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, color: "#fff" }}>Bàn {table.name}</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,.55)", marginTop: 1 }}>
                {table.seats} chỗ · {table.shape} · {STATUS_LABEL[table.status] ?? table.status}
              </div>
            </div>
            <div
              style={{
                marginLeft: "auto",
                fontSize: 11,
                color: "rgba(255,255,255,.35)",
                background: "rgba(255,255,255,.06)",
                padding: "4px 10px",
                borderRadius: 20,
                border: "1px solid rgba(255,255,255,.08)",
              }}
            >
              360°
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              bottom: 20,
              left: "50%",
              transform: "translateX(-50%)",
              background: "rgba(0,0,0,.55)",
              border: "1px solid rgba(255,255,255,.1)",
              borderRadius: 20,
              padding: "7px 16px",
              fontSize: 12,
              color: "rgba(255,255,255,.6)",
              display: "flex",
              alignItems: "center",
              gap: 8,
              backdropFilter: "blur(8px)",
              pointerEvents: "none",
              transition: "opacity .5s",
              opacity: viewerReady ? 1 : 0,
            }}
          >
            Kéo để xoay · Scroll để zoom
          </div>

          {canBook && (
            <button
              onClick={onBookNow}
              style={{
                position: "absolute",
                bottom: 24,
                right: 24,
                background: "var(--primary)",
                border: "none",
                color: "var(--on-primary)",
                cursor: "pointer",
                padding: "13px 22px",
                borderRadius: 14,
                fontSize: 14,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                gap: 8,
                boxShadow: "0 4px 20px rgba(99,102,241,.45)",
              }}
            >
              Đặt bàn này
            </button>
          )}


          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
