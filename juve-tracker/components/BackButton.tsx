"use client";

import { useRouter } from "next/navigation";

export default function BackButton({ color }: { color?: string }) {
  const router = useRouter();
  return (
    <button
      onClick={() => router.back()}
      className="mb-4 inline-flex items-center gap-1 text-sm hover:opacity-80"
      style={{ color: color ?? "#3A3D42" }}
    >
      ← Indietro
    </button>
  );
}
