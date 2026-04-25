import { useRef, useState } from 'react';
import { processImageWithWatermark } from '../../utils/watermark';
import type { WatermarkOptions } from '../../utils/watermark';
import type { GPSData } from '../../types';

interface ImageUploaderProps {
  label: string;
  value: string | null;
  onChange: (data: string, gps: GPSData | null) => void;
  required?: boolean;
  hint?: string;
  forceCamera?: boolean;
  watermarkOptions?: WatermarkOptions;
  placeholder?: string;
}

export default function ImageUploader({
  label,
  value,
  onChange,
  required,
  hint,
  forceCamera = false,
  watermarkOptions,
  placeholder,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [processing, setProcessing] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      return;
    }

    setProcessing(true);

    // Safety timeout: prevent infinite spinner if processing hangs
    const safetyTimer = setTimeout(() => {
      setProcessing(false);
    }, 30000);

    try {
      if (watermarkOptions) {
        const result = await processImageWithWatermark(file, watermarkOptions);
        clearTimeout(safetyTimer);
        onChange(result.data, result.gps);
      } else {
        // Simple compress without watermark
        const reader = new FileReader();
        reader.onload = () => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            let w = img.width;
            let h = img.height;
            const maxW = 1200;
            if (w > maxW) {
              h = (h * maxW) / w;
              w = maxW;
            }
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');
            if (ctx) ctx.drawImage(img, 0, 0, w, h);
            onChange(canvas.toDataURL('image/jpeg', 0.7), null);
            setProcessing(false);
          };
          img.onerror = () => {
            onChange(reader.result as string, null);
            setProcessing(false);
          };
          img.src = reader.result as string;
        };
        reader.readAsDataURL(file);
        return;
      }
    } catch {
      // Fallback
      const reader = new FileReader();
      reader.onload = () => onChange(reader.result as string, null);
      reader.readAsDataURL(file);
    }

    setProcessing(false);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null, null);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1">
        <span className="text-sm font-medium text-slate-700">
          {label}
        </span>
        {required && <span className="text-red-500 text-sm">*</span>}
        {forceCamera && (
          <span className="text-[10px] bg-red-50 text-red-500 px-1.5 py-0.5 rounded font-medium">必须拍摄</span>
        )}
      </div>
      <div
        className="relative rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 overflow-hidden cursor-pointer transition-all active:scale-[0.98]"
        style={{ minHeight: 140 }}
        onClick={() => !processing && inputRef.current?.click()}
      >
        {processing ? (
          <div className="flex flex-col items-center justify-center h-[140px] gap-2 text-slate-400">
            <svg className="w-6 h-6 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="text-sm">处理中...</span>
          </div>
        ) : value ? (
          <div className="relative animate-fade-in">
            <img
              src={value}
              alt={label}
              className="w-full h-[180px] object-cover"
              loading="lazy"
            />
            {watermarkOptions && (
              <div className="absolute top-2 left-2 bg-red-500/90 text-white text-[10px] px-1.5 py-0.5 rounded font-medium">
                已加水印
              </div>
            )}
            <button
              onClick={handleRemove}
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center text-lg leading-none"
            >
              x
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[140px] gap-2 text-slate-400">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={forceCamera
                ? "M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z M18.75 10.5h.008v.008h-.008V10.5z"
                : "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              } />
            </svg>
            <span className="text-sm">{forceCamera ? '点击拍摄' : (placeholder || '点击上传')}</span>
          </div>
        )}
      </div>
      {hint && (
        <p className="text-xs text-slate-400">{hint}</p>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture={forceCamera ? 'environment' : undefined}
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}