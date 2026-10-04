"use client";

import { useCallback, useRef, useState } from "react";
import { photoObjectPosition } from "@/lib/photo";

/**
 * Anteprima della foto profilo con un controllo per centrare la faccia:
 * l'utente trascina (o usa lo slider) finché il viso non è ben inquadrato
 * nel cerchio, e quel punto viene salvato per quel giocatore. Da quel
 * momento la foto verrà mostrata sempre centrata così, ovunque nell'app.
 */
export default function PhotoFocusPicker({
  photoUrl,
  value,
  onChange,
}: {
  photoUrl: string;
  value: number;
  onChange: (v: number) => void;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);

  const setFromClientY = useCallback(
    (clientY: number) => {
      const box = boxRef.current;
      if (!box) return;
      const rect = box.getBoundingClientRect();
      const ratio = (clientY - rect.top) / rect.height;
      const pct = Math.max(0, Math.min(100, Math.round(ratio * 100)));
      onChange(pct);
    },
    [onChange]
  );

  if (!photoUrl || photoUrl.trim() === "") return null;

  return (
    <div className="space-y-2">
      <p className="text-xs text-steel">
        Trascina l'immagine (o usa lo slider) finché la faccia non è ben centrata nel cerchio.
      </p>
      <div
        ref={boxRef}
        onMouseDown={(e) => {
          setDragging(true);
          setFromClientY(e.clientY);
        }}
        onMouseMove={(e) => {
          if (dragging) setFromClientY(e.clientY);
        }}
        onMouseUp={() => setDragging(false)}
        onMouseLeave={() => setDragging(false)}
        onTouchStart={(e) => {
          setDragging(true);
          setFromClientY(e.touches[0].clientY);
        }}
        onTouchMove={(e) => {
          setFromClientY(e.touches[0].clientY);
        }}
        onTouchEnd={() => setDragging(false)}
        className="relative h-32 w-32 mx-auto overflow-hidden rounded-full border-2 border-gold cursor-ns-resize select-none"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photoUrl}
          alt="Anteprima"
          draggable={false}
          className="h-full w-full object-cover scale-125 origin-top pointer-events-none"
          style={{ objectPosition: photoObjectPosition(value) }}
        />
        <div className="pointer-events-none absolute inset-x-0 top-1/2 h-px bg-gold/60" />
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-gold"
      />
      <div className="flex justify-between text-[10px] text-steel">
        <span>Su</span>
        <span>Giù</span>
      </div>
    </div>
  );
}
