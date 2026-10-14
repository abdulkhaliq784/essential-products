import Image from "next/image";

/** Square product image with a neutral placeholder when the product has no image. */
export function ProductImage({
  src,
  alt,
  sizes,
  priority = false,
  className = "",
}: {
  src: string | undefined;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  return (
    <div className={`relative aspect-square overflow-hidden rounded-xl bg-gray-50 ${className}`}>
      {src ? (
        <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className="object-cover" />
      ) : (
        <div className="flex h-full items-center justify-center text-sm text-gray-400">No image</div>
      )}
    </div>
  );
}
