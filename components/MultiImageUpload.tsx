"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

interface ImageItem {
  uid: string;
  url?: string;
  file?: File;
  preview?: string;
  isMain: boolean;
}

type ImagePosition = { x: number; y: number };

function DraggableImagePreview({
  src,
  alt,
  position,
  onPositionChange,
  hintText,
}: {
  src: string;
  alt: string;
  position: ImagePosition;
  onPositionChange: (next: ImagePosition) => void;
  hintText: string;
}) {
  const dragRef = useRef<{ dragging: boolean; lastX: number; lastY: number }>({
    dragging: false,
    lastX: 0,
    lastY: 0,
  });
  const clamp = (v: number) => Math.max(0, Math.min(100, v));

  return (
    <div
      className="absolute inset-0 touch-none select-none cursor-grab active:cursor-grabbing"
      onPointerDown={(e) => {
        dragRef.current.dragging = true;
        dragRef.current.lastX = e.clientX;
        dragRef.current.lastY = e.clientY;
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (!dragRef.current.dragging) return;
        const dx = e.clientX - dragRef.current.lastX;
        const dy = e.clientY - dragRef.current.lastY;
        dragRef.current.lastX = e.clientX;
        dragRef.current.lastY = e.clientY;
        onPositionChange({
          x: clamp(position.x + dx * 0.2),
          y: clamp(position.y + dy * 0.2),
        });
      }}
      onPointerUp={() => { dragRef.current.dragging = false; }}
      onPointerCancel={() => { dragRef.current.dragging = false; }}
    >
      <img
        src={src}
        alt={alt}
        className="w-full h-full pointer-events-none"
        style={{ objectFit: "cover", objectPosition: `${position.x}% ${position.y}%` }}
      />
      <div
        className="absolute bottom-1.5 right-1.5 rounded px-1.5 py-0.5 text-[9px] font-medium pointer-events-none"
        style={{ color: "#fff", background: "rgba(0,0,0,0.55)" }}
      >
        {hintText}
      </div>
    </div>
  );
}

interface MultiImageUploadProps {
  value?: ImageItem[];
  onChange?: (images: ImageItem[]) => void;
  maxCount?: number;
}

export default function MultiImageUpload({ value = [], onChange, maxCount = 5 }: MultiImageUploadProps) {
  const { t } = useTranslation("common");
  const [images, setImages] = useState<ImageItem[]>(value);
  const [positions, setPositions] = useState<Record<string, ImagePosition>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setImages(value);
  }, [value]);

  const readFileAsDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    if (!files.length) return;

    if (images.length + files.length > maxCount) {
      alert(t("dashboard.menu.images.max_count", { defaultValue: `Maximum ${maxCount} images allowed`, maxCount }));
      e.target.value = "";
      return;
    }

    const newImages: ImageItem[] = [];
    const newPositions: Record<string, ImagePosition> = {};

    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        alert(t("dashboard.menu.images.file_too_large", { defaultValue: `${file.name}: File size must be less than 5MB`, name: file.name }));
        continue;
      }
      const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
      if (!validTypes.includes(file.type)) {
        alert(t("dashboard.menu.images.invalid_type", { defaultValue: `${file.name}: Only PNG, JPG, JPEG, and WEBP are allowed`, name: file.name }));
        continue;
      }

      const preview = await readFileAsDataURL(file);
      const uid = `${Date.now()}-${file.name}`;
      newImages.push({
        uid,
        file,
        preview,
        isMain: images.length === 0 && newImages.length === 0,
      });
      newPositions[uid] = { x: 50, y: 50 };
    }

    const updatedImages = [...images, ...newImages];
    const updatedPositions = { ...positions, ...newPositions };
    setImages(updatedImages);
    setPositions(updatedPositions);
    onChange?.(updatedImages);
    e.target.value = "";
  };

  const handleSetMain = (uid: string) => {
    const updatedImages = images.map((img) => ({ ...img, isMain: img.uid === uid }));
    setImages(updatedImages);
    onChange?.(updatedImages);
  };

  const handleRemove = (uid: string) => {
    const updatedImages = images.filter((img) => img.uid !== uid);
    if (updatedImages.length > 0 && !updatedImages.some((img) => img.isMain)) {
      updatedImages[0].isMain = true;
    }
    const updatedPositions = { ...positions };
    delete updatedPositions[uid];
    setImages(updatedImages);
    setPositions(updatedPositions);
    onChange?.(updatedImages);
  };

  const setPosition = (uid: string, pos: ImagePosition) => {
    setPositions((prev) => ({ ...prev, [uid]: pos }));
  };

  const dragHint = t("dashboard.settings.appearance.drag_to_adjust", { defaultValue: "Drag to adjust" });

  return (
    <div className="space-y-4">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Image Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {images.map((img) => {
            const pos = positions[img.uid] || { x: 50, y: 50 };
            const src = img.preview || img.url || "";
            return (
              <div
                key={img.uid}
                className="relative group rounded-xl overflow-hidden border-2 transition-all"
                style={{
                  borderColor: img.isMain ? "var(--primary)" : "var(--border)",
                  aspectRatio: "4/3",
                  background: "var(--surface)",
                  boxShadow: img.isMain ? "0 0 0 3px var(--primary)22" : "none",
                }}
              >
                {src ? (
                  <DraggableImagePreview
                    src={src}
                    alt={img.file?.name || "Image"}
                    position={pos}
                    onPositionChange={(next) => setPosition(img.uid, next)}
                    hintText={dragHint}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg className="w-8 h-8 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: "var(--text-muted)" }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}

                {/* Main badge */}
                {img.isMain && (
                  <div
                    className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold shadow pointer-events-none z-10"
                    style={{ background: "var(--primary)", color: "#fff" }}
                  >
                    {t("dashboard.menu.images.main_image", { defaultValue: "Main" })}
                  </div>
                )}

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 z-20 pointer-events-none">
                  {!img.isMain && (
                    <button
                      type="button"
                      onClick={() => handleSetMain(img.uid)}
                      className="p-2 rounded-lg bg-white/90 hover:bg-white transition-all hover:scale-110 active:scale-95 pointer-events-auto"
                      title={t("dashboard.menu.images.set_main", { defaultValue: "Set as main image" })}
                    >
                      <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    </button>
                  )}
                  {img.isMain && (
                    <div
                      className="p-2 rounded-lg opacity-60 cursor-default pointer-events-auto"
                      style={{ background: "rgba(255,255,255,0.9)" }}
                      title={t("dashboard.menu.images.is_main", { defaultValue: "Main image" })}
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" style={{ color: "var(--primary)" }}>
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemove(img.uid)}
                    className="p-2 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-all hover:scale-110 active:scale-95 pointer-events-auto"
                    title={t("dashboard.menu.images.remove", { defaultValue: "Remove image" })}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}

          {/* Add more slot */}
          {images.length < maxCount && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="relative rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all group hover:border-[var(--primary)] hover:bg-[var(--primary)]/5"
              style={{
                borderColor: "var(--border)",
                aspectRatio: "4/3",
                background: "var(--surface)",
              }}
            >
              <svg
                className="w-7 h-7 transition-colors group-hover:text-[var(--primary)]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                style={{ color: "var(--text-muted)" }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
              </svg>
              <span
                className="text-xs font-medium transition-colors group-hover:text-[var(--primary)]"
                style={{ color: "var(--text-muted)" }}
              >
                {t("dashboard.menu.images.add_photo", { defaultValue: "Add photo" })}
              </span>
            </button>
          )}
        </div>
      )}

      {/* Empty state — full upload button */}
      {images.length === 0 && (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-full rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-3 py-10 transition-all group hover:border-[var(--primary)] hover:bg-[var(--primary)]/5"
          style={{ borderColor: "var(--border)", background: "var(--surface)" }}
        >
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center transition-colors group-hover:bg-[var(--primary)]/10"
            style={{ background: "var(--bg-base)" }}
          >
            <svg
              className="w-6 h-6 transition-colors group-hover:text-[var(--primary)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              style={{ color: "var(--text-muted)" }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="text-center">
            <p className="text-sm font-medium transition-colors group-hover:text-[var(--primary)]" style={{ color: "var(--text)" }}>
              {t("dashboard.menu.images.click_to_upload", { defaultValue: "Click to upload images" })}
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
              {t("dashboard.menu.images.format_hint", { defaultValue: "PNG, JPG, WEBP up to 5MB each" })}
            </p>
          </div>
        </button>
      )}

      {/* Footer hint */}
      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
        {t("dashboard.menu.images.helper_text", {
          defaultValue: "Upload up to {{maxCount}} images. Star button sets the main image shown on the menu card. Drag images to reposition.",
          maxCount,
        })}
        {" "}{images.length}/{maxCount}
      </p>
    </div>
  );
}
