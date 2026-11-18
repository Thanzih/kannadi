import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ZoomIn, ZoomOut, RotateCcw, Check, X, Crop } from 'lucide-react';

interface ImageCropModalProps {
  imageSrc: string | null;
  isOpen: boolean;
  onClose: () => void;
  onCropComplete: (croppedBlob: Blob, previewUrl: string) => void;
}

export function ImageCropModal({
  imageSrc,
  isOpen,
  onClose,
  onCropComplete,
}: ImageCropModalProps) {
  const [zoom, setZoom] = useState<number>(1);
  const [minZoom, setMinZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [naturalDimensions, setNaturalDimensions] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });

  // Window/crop frame size within container (1:1 square)
  const [cropBox, setCropBox] = useState<{ width: number; height: number }>({
    width: 280,
    height: 280,
  });

  // Reset zoom & pan when image changes or modal opens
  useEffect(() => {
    if (!isOpen || !imageSrc) return;

    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      const nw = img.naturalWidth || 600;
      const nh = img.naturalHeight || 600;
      setNaturalDimensions({ width: nw, height: nh });

      // Compute suitable square crop box size based on viewport
      const boxSize = Math.min(window.innerWidth - 64, window.innerHeight - 260, 310);

      setCropBox({ width: boxSize, height: boxSize });

      // Initial zoom: fill the square crop box completely
      const scaleW = boxSize / nw;
      const scaleH = boxSize / nh;
      const initialScale = Math.max(scaleW, scaleH);

      setMinZoom(initialScale);
      setZoom(initialScale);
      setPan({ x: 0, y: 0 });
    };
  }, [isOpen, imageSrc]);

  // Pointer dragging
  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    panStartRef.current = { ...pan };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;

    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;

    const newX = panStartRef.current.x + dx;
    const newY = panStartRef.current.y + dy;

    // Bounds check to ensure image always covers the crop box
    const currentW = naturalDimensions.width * zoom;
    const currentH = naturalDimensions.height * zoom;

    const maxX = Math.max(0, (currentW - cropBox.width) / 2);
    const maxY = Math.max(0, (currentH - cropBox.height) / 2);

    setPan({
      x: Math.min(maxX, Math.max(-maxX, newX)),
      y: Math.min(maxY, Math.max(-maxY, newY)),
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Ignore pointer capture errors
    }
  };

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.08 : 0.92;
    setZoom((prev) => {
      const next = Math.max(minZoom, Math.min(minZoom * 4, prev * factor));
      return next;
    });
  };

  const handleApplyCrop = useCallback(() => {
    if (!imageSrc || !naturalDimensions.width) return;

    const canvas = document.createElement('canvas');
    // Output standard high-res square (1000 x 1000)
    const outputWidth = 1000;
    const outputHeight = 1000;
    canvas.width = outputWidth;
    canvas.height = outputHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = imgRef.current;
    if (!img) return;

    // Source rect calculations:
    // Scale between displayed pixels and natural pixels
    const displayedWidth = naturalDimensions.width * zoom;
    const displayedHeight = naturalDimensions.height * zoom;

    // Center of image in displayed pixels relative to crop box center
    // pan.x is offset from center
    const displayedCropLeft = (displayedWidth - cropBox.width) / 2 - pan.x;
    const displayedCropTop = (displayedHeight - cropBox.height) / 2 - pan.y;

    const srcScale = naturalDimensions.width / displayedWidth;
    const srcX = Math.max(0, displayedCropLeft * srcScale);
    const srcY = Math.max(0, displayedCropTop * srcScale);
    const srcW = Math.min(naturalDimensions.width - srcX, cropBox.width * srcScale);
    const srcH = Math.min(naturalDimensions.height - srcY, cropBox.height * srcScale);

    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, outputWidth, outputHeight);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          const previewUrl = URL.createObjectURL(blob);
          onCropComplete(blob, previewUrl);
          onClose();
        }
      },
      'image/jpeg',
      0.9
    );
  }, [imageSrc, naturalDimensions, zoom, pan, cropBox, onCropComplete, onClose]);

  if (!isOpen || !imageSrc) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-md bg-white border border-slate-200 rounded-[28px] p-5 sm:p-6 shadow-2xl flex flex-col space-y-4 select-none"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-200 text-[#ff5864] flex items-center justify-center">
                <Crop className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-sm sm:text-base">Adjust Photo Crop</h3>
                <p className="text-[11px] text-slate-400">Position your face inside the 1:1 square guide</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Interactive Crop Viewport */}
          <div
            ref={containerRef}
            onWheel={handleWheel}
            className="relative w-full h-[380px] bg-slate-950 rounded-2xl overflow-hidden flex items-center justify-center cursor-grab active:cursor-grabbing touch-none"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          >
            {/* The Image */}
            <img
              ref={imgRef}
              src={imageSrc}
              alt="Crop target"
              draggable={false}
              style={{
                width: naturalDimensions.width * zoom,
                height: naturalDimensions.height * zoom,
                transform: `translate(${pan.x}px, ${pan.y}px)`,
                maxWidth: 'none',
              }}
              className="pointer-events-none transition-transform duration-75"
            />

            {/* Dark Mask Overlay with 1:1 Square Cutout */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              {/* Semi-transparent dark backdrop */}
              <div
                style={{
                  width: cropBox.width,
                  height: cropBox.height,
                  boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.65)',
                }}
                className="relative border-2 border-white/90 rounded-2xl overflow-hidden shadow-2xl pointer-events-none"
              >
                {/* 3x3 Grid Overlay */}
                <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-30">
                  <div className="border-r border-b border-white" />
                  <div className="border-r border-b border-white" />
                  <div className="border-b border-white" />
                  <div className="border-r border-b border-white" />
                  <div className="border-r border-b border-white" />
                  <div className="border-b border-white" />
                  <div className="border-r border-white" />
                  <div className="border-r border-white" />
                  <div />
                </div>

                {/* Aspect Badge */}
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/60 text-white font-mono text-[9px] font-bold backdrop-blur-xs">
                  1:1 Square
                </div>
              </div>
            </div>
          </div>

          {/* Zoom Slider Controls */}
          <div className="space-y-1.5 px-1">
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
              <span className="flex items-center space-x-1">
                <ZoomOut className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[11px]">Zoom</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setZoom(minZoom);
                  setPan({ x: 0, y: 0 });
                }}
                className="text-[11px] text-[#ff5864] hover:underline flex items-center space-x-1 cursor-pointer font-bold"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>

            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => setZoom((prev) => Math.max(minZoom, prev * 0.9))}
                className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>

              <input
                type="range"
                min={minZoom}
                max={minZoom * 3.5}
                step={(minZoom * 2.5) / 100}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="flex-1 accent-[#ff5864] h-1.5 bg-slate-200 rounded-lg cursor-pointer"
              />

              <button
                type="button"
                onClick={() => setZoom((prev) => Math.min(minZoom * 3.5, prev * 1.1))}
                className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleApplyCrop}
              className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#fd297b] via-[#ff5864] to-[#ff655b] hover:opacity-95 text-white font-black text-xs transition shadow-md shadow-rose-500/20 flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Apply Square Crop</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
