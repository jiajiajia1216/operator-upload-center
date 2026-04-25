import React from 'react';

interface AihuishouLogoProps {
  height?: number;
  showText?: boolean;
  className?: string;
}

export default function AihuishouLogo({ height = 28, showText = true, className = '' }: AihuishouLogoProps) {
  return (
    <svg
      viewBox="0 0 200 48"
      height={height}
      className={className}
      style={{ display: 'block' }}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Heart/recycle icon - 爱心形状 */}
      <path
        d="M24 42 C24 42 2 28 2 14 C2 6.27 8.27 0 16 0 C20.5 0 24 3 24 3 C24 3 27.5 0 32 0 C39.73 0 46 6.27 46 14 C46 28 24 42 24 42 Z"
        fill="#F9E72C"
        stroke="#3D3A39"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {/* Recycle arrows inside heart */}
      <path
        d="M16 16 L24 12 L24 16 M24 12 L32 16 L28 18"
        fill="none"
        stroke="#3D3A39"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14 24 L20 20 L20 24 M20 20 L26 18"
        fill="none"
        stroke="#3D3A39"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* 爱回收文字 */}
      {showText && (
        <>
          <text
            x="56"
            y="34"
            fontFamily="-apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', sans-serif"
            fontSize="28"
            fontWeight="700"
            fill="#3D3A39"
          >
            爱回收
          </text>
        </>
      )}
    </svg>
  );
}
