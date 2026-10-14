"use client";

import Image from "next/image";
import { useState } from "react";
import { ProductImage } from "./ProductImage";

export function ProductGallery({ images, name }: { images: string[]; name: string }) {
  const [active, setActive] = useState(0);

  return (
    <div>
      <ProductImage src={images[active]} alt={name} priority sizes="(min-width: 768px) 50vw, 100vw" />
      {images.length > 1 && (
        <div className="mt-3 flex gap-3 overflow-x-auto">
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setActive(i)}
              className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 ${
                i === active ? "border-red-600" : "border-transparent"
              }`}
              aria-label={`Show image ${i + 1}`}
              aria-current={i === active}
            >
              <Image src={src} alt="" fill sizes="64px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
