"use client";

import React, { useRef } from "react";

export type ImagePosition = { x: number; y: number };

interface DraggableImagePreviewProps {
  src: string;
  alt: string;
  className?: string;
  position: ImagePosition;
  onPositionChange: (next: ImagePosition) => void;
  objectFit?: "cover" | "contain";
  onError?: React.ReactEventHandler<HTMLImageElement>;
  hintText?: string;
  hintClassName?: string;
  showHint?: boolean;
}

export default function DraggableImagePreview({
  src,
  alt,
  className,
  position,
  onPositionChange,
  objectFit = "cover",
  onError,
  hintText = "Drag to adjust",
  hintClassName,
  showHint = true,
}: DraggableImagePreviewProps) {
  const dragRef = useRef<{ dragging: boolean; lastX: number; lastY: number }>({
    dragging: false,
    lastX: 0,
    lastY: 0,
  });

  const clamp = (v: number) => Math.max(0, Math.min(100, v));

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    dragRef.current.dragging = true;
    dragRef.current.lastX = e.clientX;
    dragRef.current.lastY = e.clientY;
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.dragging) return;

    const dx = e.clientX - dragRef.current.lastX;
    const dy = e.clientY - dragRef.current.lastY;

    dragRef.current.lastX = e.clientX;
    dragRef.current.lastY = e.clientY;

    onPositionChange({
      x: clamp(position.x + dx * 0.2),
      y: clamp(position.y + dy * 0.2),
    });
  };

  const handlePointerUp = () => {
    dragRef.current.dragging = false;
  };

  return (
    <div
      className={`${className ?? ""} relative touch-none select-none cursor-grab active:cursor-grabbing`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <img
        src={src}
        alt={alt}
        className="w-full h-full"
        style={{
          objectFit,
          objectPosition: `${position.x}% ${position.y}%`,
          pointerEvents: "none",
        }}
        onError={onError}
      />

      {showHint && (
        <div
          className={
            hintClassName ||
            "absolute bottom-2 right-2 rounded-md px-2 py-1 text-[10px] font-medium pointer-events-none"
          }
          style={!hintClassName ? { color: "#fff", background: "rgba(0,0,0,0.55)" } : undefined}
        >
          {hintText}
        </div>
      )}
    </div>
  );
}
