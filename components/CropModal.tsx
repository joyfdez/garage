"use client";

import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import { X, RotateCw, Check } from "lucide-react";
import { getCroppedImg } from "@/lib/cropImage";

interface CropModalProps {
  imageSrc: string;
  aspect: number;      // 1 = square avatar, 3 = wide cover
  onSave: (blob: Blob) => Promise<void>;
  onClose: () => void;
}

export function CropModal({ imageSrc, aspect, onSave, onClose }: CropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [saving, setSaving] = useState(false);

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  async function handleSave() {
    if (!croppedAreaPixels) return;
    setSaving(true);
    try {
      const blob = await getCroppedImg(imageSrc, croppedAreaPixels, rotation);
      await onSave(blob);
    } catch {
      // ignore crop errors — modal stays open
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0">
        <button
          type="button"
          onClick={onClose}
          className="text-white/50 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>
        <span className="text-white/70 text-sm font-medium">Crop photo</span>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !croppedAreaPixels}
          className="flex items-center gap-1.5 text-green-bright font-bold text-sm disabled:opacity-40 transition-opacity"
        >
          {saving ? "Saving…" : <><Check size={16} />Save</>}
        </button>
      </div>

      {/* Cropper area */}
      <div className="relative flex-1">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          rotation={rotation}
          aspect={aspect}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
          cropShape={aspect === 1 ? "round" : "rect"}
          showGrid={false}
          style={{
            containerStyle: { background: "#000" },
            cropAreaStyle: { border: "2px solid rgba(45,106,74,0.8)" },
          }}
        />
      </div>

      {/* Controls */}
      <div className="shrink-0 bg-black px-4 pb-8 pt-4 space-y-3">
        <div className="flex items-center gap-3">
          <span className="text-white/30 text-xs w-8">Zoom</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1 accent-racing-green"
          />
        </div>
        <button
          type="button"
          onClick={() => setRotation((r) => (r + 90) % 360)}
          className="flex items-center gap-1.5 text-white/50 hover:text-white text-sm transition-colors"
        >
          <RotateCw size={14} />
          Rotate 90°
        </button>
      </div>
    </div>
  );
}
