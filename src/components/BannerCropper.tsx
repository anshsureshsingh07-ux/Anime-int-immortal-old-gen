import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import type { Area, Point } from 'react-easy-crop';
import { Crop, ZoomIn, ZoomOut, Check, X } from 'lucide-react';

interface BannerCropperProps {
  imageSrc: string;
  onCropComplete: (croppedBlob: Blob, croppedImageUrl: string) => void;
  onCancel: () => void;
}

export const BannerCropper: React.FC<BannerCropperProps> = ({
  imageSrc,
  onCropComplete,
  onCancel,
}) => {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [processing, setProcessing] = useState(false);

  const onCropAreaComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.setAttribute('crossOrigin', 'anonymous'); // Prevent CORS taint issues
      image.src = url;
    });

  const getCroppedImg = async (
    imageSrc: string,
    pixelCrop: Area
  ): Promise<{ blob: Blob; url: string }> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Could not achieve Canvas 2D render context.');
    }

    // Explicit dimensions matching selected cropped bounds
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    // Draw source bounds mapped exactly onto destination boundaries
    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Canvas rasterization output was null.'));
            return;
          }
          const croppedUrl = URL.createObjectURL(blob);
          resolve({ blob, url: croppedUrl });
        },
        'image/jpeg',
        0.95
      );
    });
  };

  const handleGenerateCrop = async () => {
    if (!croppedAreaPixels) return;
    setProcessing(true);
    try {
      const { blob, url } = await getCroppedImg(imageSrc, croppedAreaPixels);
      onCropComplete(blob, url);
    } catch (err) {
      console.error('[CROP_ERROR] Failed performing canvas transformation:', err);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div id="banner-cropper-container" className="flex flex-col h-full min-h-[450px] bg-[#0c0c0e] border border-white/5 rounded-xl overflow-hidden shadow-2xl relative">
      {/* Aspect Ratio Box */}
      <div className="relative flex-1 w-full min-h-[300px] bg-black">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={16 / 9}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropAreaComplete}
          style={{
            containerStyle: {
              width: '100%',
              height: '100%',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            },
          }}
        />
      </div>

      {/* Controls & Metrics Panel */}
      <div className="p-4 bg-[#111115] border-t border-white/10 flex flex-col gap-3">
        {/* Zoom adjustment row */}
        <div className="flex items-center gap-3">
          <ZoomOut className="text-gray-500 hover:text-white cursor-pointer w-4 h-4 transition-colors" onClick={() => setZoom(Math.max(1, zoom - 0.2))} />
          <input
            id="cropper-zoom-slider"
            type="range"
            min={1}
            max={3}
            step={0.1}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1 accent-red-600 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
          />
          <ZoomIn className="text-gray-500 hover:text-white cursor-pointer w-4 h-4 transition-colors" onClick={() => setZoom(Math.min(3, zoom + 0.2))} />
          <span className="text-[10px] font-mono text-gray-400 w-8 text-right font-semibold">
            {zoom.toFixed(1)}x
          </span>
        </div>

        {/* Action row */}
        <div className="flex justify-between items-center mt-2">
          <button
            type="button"
            id="cropper-btn-cancel"
            onClick={onCancel}
            className="flex items-center gap-1 px-3 py-1.5 text-[10px] font-black uppercase text-gray-400 hover:text-white border border-white/10 hover:border-white/30 rounded-lg transition-all"
          >
            <X size={12} />
            [ABORT]
          </button>

          <span className="text-[8px] font-mono text-[#D4AF37] px-2 py-0.5 rounded border border-[#D4AF37]/30 bg-[#D4AF37]/5 tracking-widest uppercase">
            16:9 Aspect Target
          </span>

          <button
            type="button"
            id="cropper-btn-confirm"
            disabled={processing}
            onClick={handleGenerateCrop}
            className="flex items-center gap-1.5 px-4 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg text-white bg-faction-primary hover:opacity-90 shadow-faction-glow transition-all disabled:opacity-50"
          >
            {processing ? (
              <span className="animate-pulse">RASTERIZING...</span>
            ) : (
              <>
                <Check size={12} />
                [EXEC_CROP]
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
