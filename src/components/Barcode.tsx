"use client";

import { useMemo } from "react";
import { encodeCode128B, patternToRects } from "@/lib/barcode";

interface BarcodeProps {
  value: string;
  moduleWidth?: number;
  height?: number;
  showText?: boolean;
  className?: string;
  fill?: string;
  textColor?: string;
}

export default function Barcode({ value, moduleWidth = 2, height = 60, showText = true, className, fill = "#0b1326", textColor = "#0b1326" }: BarcodeProps) {
  const { pattern, rects, totalWidth, totalHeight, textSize } = useMemo(() => {
    const enc = encodeCode128B(value);
    const r = patternToRects(enc.pattern, moduleWidth);
    const tSize = 12;
    const margin = 6;
    return {
      pattern: enc.pattern,
      rects: r,
      totalWidth: enc.modules * moduleWidth + margin * 2,
      totalHeight: height + (showText ? tSize + 4 : 0) + margin * 2,
      textSize: tSize,
    };
  }, [value, moduleWidth, height, showText]);

  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width={totalWidth} height={totalHeight} viewBox={`0 0 ${totalWidth} ${totalHeight}`} aria-label={`Barcode for ${value}`} role="img">
      {rects.map((r, i) => (
        <rect key={i} x={r.x + 6} y={6} width={r.w} height={height} fill={fill} />
      ))}
      {showText && (
        <text x={totalWidth / 2} y={6 + height + textSize + 2} textAnchor="middle" fontFamily="monospace" fontSize={textSize} fill={textColor} letterSpacing="2">
          {value}
        </text>
      )}
      {/* hidden modules count for testing */}
      <desc>{pattern.length} modules</desc>
    </svg>
  );
}
