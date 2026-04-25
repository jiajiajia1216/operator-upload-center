import { getGPSPosition } from './device';

export interface WatermarkOptions {
  operatorName: string;
  storeName?: string;
  label?: string;
  gps?: { latitude: number; longitude: number } | null;
  forceGPS?: boolean;
}

export function generateWatermarkedImage(
  imageData: string,
  options: WatermarkOptions
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      // Draw original image
      ctx.drawImage(img, 0, 0);

      // Calculate watermark size based on image dimensions
      const fontSize = Math.max(12, Math.floor(img.width / 30));
      const smallFontSize = Math.max(10, Math.floor(img.width / 40));
      const padding = Math.max(8, Math.floor(img.width / 50));

      // Build watermark lines
      const now = new Date();
      const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

      const lines: string[] = [];
      lines.push(options.operatorName);
      if (options.storeName) {
        lines.push(options.storeName);
      }
      if (options.label) {
        lines.push(options.label);
      }
      lines.push(timeStr);
      if (options.gps) {
        const lat = options.gps.latitude.toFixed(6);
        const lng = options.gps.longitude.toFixed(6);
        lines.push(`GPS: ${lat}, ${lng}`);
      } else if (options.forceGPS) {
        lines.push('GPS: 未获取');
      }
      lines.push('[实时拍摄]');

      // Calculate watermark block dimensions
      const lineHeight = fontSize + 4;
      const blockHeight = lines.length * lineHeight + padding * 2;
      const maxLineWidth = Math.max(...lines.map((l) => l.length * (fontSize * 0.6))) + padding * 2;
      const blockWidth = maxLineWidth;

      // Position: bottom-right corner
      const x = canvas.width - blockWidth - padding;
      const y = canvas.height - blockHeight - padding;

      // Semi-transparent background
      ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
      const radius = Math.max(4, Math.floor(fontSize / 4));
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + blockWidth - radius, y);
      ctx.quadraticCurveTo(x + blockWidth, y, x + blockWidth, y + radius);
      ctx.lineTo(x + blockWidth, y + blockHeight - radius);
      ctx.quadraticCurveTo(x + blockWidth, y + blockHeight, x + blockWidth - radius, y + blockHeight);
      ctx.lineTo(x + radius, y + blockHeight);
      ctx.quadraticCurveTo(x, y + blockHeight, x, y + blockHeight - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
      ctx.fill();

      // Draw text
      ctx.textBaseline = 'top';
      lines.forEach((line, index) => {
        const lineY = y + padding + index * lineHeight;
        if (index === lines.length - 1) {
          ctx.fillStyle = '#FFD700';
          ctx.font = `bold ${smallFontSize}px -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif`;
        } else {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
          ctx.font = `${fontSize}px -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif`;
        }
        ctx.fillText(line, x + padding, lineY);
      });

      // Top-left badge
      const badgeText = '实时拍摄';
      const badgeFontSize = Math.max(10, Math.floor(img.width / 35));
      const badgePadding = Math.max(4, Math.floor(badgeFontSize / 3));
      ctx.font = `bold ${badgeFontSize}px -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif`;
      const badgeWidth = ctx.measureText(badgeText).width + badgePadding * 2;
      const badgeHeight = badgeFontSize + badgePadding * 2;
      const badgeX = padding;
      const badgeY = padding;

      ctx.fillStyle = 'rgba(239, 68, 68, 0.85)';
      const badgeRadius = Math.max(3, Math.floor(badgeFontSize / 5));
      ctx.beginPath();
      ctx.moveTo(badgeX + badgeRadius, badgeY);
      ctx.lineTo(badgeX + badgeWidth - badgeRadius, badgeY);
      ctx.quadraticCurveTo(badgeX + badgeWidth, badgeY, badgeX + badgeWidth, badgeY + badgeRadius);
      ctx.lineTo(badgeX + badgeWidth, badgeY + badgeHeight - badgeRadius);
      ctx.quadraticCurveTo(badgeX + badgeWidth, badgeY + badgeHeight, badgeX + badgeWidth - badgeRadius, badgeY + badgeHeight);
      ctx.lineTo(badgeX + badgeRadius, badgeY + badgeHeight);
      ctx.quadraticCurveTo(badgeX, badgeY + badgeHeight, badgeX, badgeY + badgeHeight - badgeRadius);
      ctx.lineTo(badgeX, badgeY + badgeRadius);
      ctx.quadraticCurveTo(badgeX, badgeY, badgeX + badgeRadius, badgeY);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.textBaseline = 'middle';
      ctx.fillText(badgeText, badgeX + badgePadding, badgeY + badgeHeight / 2);

      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = imageData;
  });
}

export async function processImageWithWatermark(
  file: File,
  options: WatermarkOptions
): Promise<{ data: string; gps: { latitude: number; longitude: number; accuracy: number } | null }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const imageData = reader.result as string;

      // Start GPS in background (non-blocking, 5s timeout)
      let gps: { latitude: number; longitude: number; accuracy: number } | null = null;
      const gpsPromise = getGPSPosition()
        .then((result) => { gps = result; })
        .catch(() => { /* GPS not available */ });

      // Process image immediately, don't wait for GPS
      generateWatermarkedImage(imageData, options)
        .then((watermarked) => {
          resolve({ data: watermarked, gps });
        })
        .catch(() => {
          // Fallback: simple compression without watermark
          const canvas = document.createElement('canvas');
          const img = new Image();
          img.onload = () => {
            const maxW = 1200;
            let w = img.width;
            let h = img.height;
            if (w > maxW) {
              h = (h * maxW) / w;
              w = maxW;
            }
            canvas.width = w;
            canvas.height = h;
            const ctx2 = canvas.getContext('2d');
            if (ctx2) ctx2.drawImage(img, 0, 0, w, h);
            resolve({ data: canvas.toDataURL('image/jpeg', 0.7), gps });
          };
          img.onerror = () => resolve({ data: imageData, gps });
          img.src = imageData;
        });

      // Fire GPS request but don't block
      gpsPromise;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}
