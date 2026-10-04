"use client";

import { useCallback, useRef, useState } from "react";
import { photoImgStyle } from "@/lib/photo";

/**
 * Anteprima della foto profilo con i controlli per centrare la faccia:
 * trascina nel cerchio (o usa i due slider, su/giù e sinistra/destra) finché
 * il viso non è ben inquadrato. La posizione viene salvata per quel giocatore
 * e usata ovunque nell'app.
 */
export default function PhotoFocusPicker({
  photoUrl,
  valueY,
  valueX,
  onChange,
}: {
  photoUrl: string;
  valueY: number;
  valueX: number;
  onChange: (next: { x: number; y: number }) => void;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);

  const setFromPointer = useCallback(
    (clientX: number, clientY: number) => {
      const box = boxRef.current;
      if (!box) return;
      const rect = box.getBoundingClientRect();
      const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n * 100)));
      onChange({
        x: clamp((clientX - rect.left) / rect.width),
        y: clamp((clientY - rect.top) / rect.height),
      });
    },
    [onChange]
  );

  if (!photoUrl || photoUrl.trim() === "") return null;

  return (
    <div className="space-y-2">
      <p className="text-xs text-steel">
        Trascina nel cerchio (o usa gli slider) finché la faccia non è ben centrata.
      </p>
      <div
        ref={boxRef}
        onMouseDown={(e) => {
          setDragging(true);
          setFromPointer(e.clientX, e.clientY);
        }}
        onMouseMove={(e) => {
          if (dragging) setFromPointer(e.clientX, e.clientY);
        }}
        onMouseUp={() => setDragging(false)}
        onMouseLeave={() => setDragging(false)}
        onTouchStart={(e) => {
          setDragging(true);
          setFromPointer(e.touches[0].clientX, e.touches[0].clientY);
        }}
        onTouchMove={(e) => {
          setFromPointer(e.touches[0].clientX, e.touches[0].clientY);
        }}
        onTouchEnd={() => setDragging(false)}
        className="relative h-32 w-32 mx-auto overflow-hidden rounded-full border-2 border-gold cursor-move select-none"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photoUrl}
          alt="Anteprima"
          draggable={false}
          className="h-full w-full object-cover pointer-events-none"
          style={photoImgStyle(valueY, valueX)}
        />
        <div className="pointer-events-none absolute inset-x-0 top-1/2 h-px bg-gold/60" />
        <div className="pointer-events-none absolute inset-y-0 left-1/2 w-px bg-gold/60" />
      </div>
      <div>
        <input
          type="range"
          min={0}
          max={100}
          value={valueY}
          onChange={(e) => onChange({ x: valueX, y: Number(e.target.value) })}
          className="w-full accent-gold"
        />
        <div className="flex justify-between text-[10px] text-steel">
          <span>Su</span>
          <span>Giù</span>
        </div>
      </div>
      <div>
        <input
          type="range"
          min={0}
          max={100}
          value={valueX}
          onChange={(e) => onChange({ x: Number(e.target.value), y: valueY })}
          className="w-full accent-gold"
        />
        <div className="flex justify-between text-[10px] text-steel">
          <span>Sinistra</span>
          <span>Destra</span>
        </div>
      </div>
    </div>
  );
}
