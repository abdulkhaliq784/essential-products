"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition, type ChangeEvent, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { rupeesToPaise } from "@/lib/format";
import type { Category, Product } from "@/lib/types";
import { Alert, buttonClass, inputClass, labelClass, Spinner } from "@/components/ui";
import { saveProduct } from "./actions";

const toRupees = (paise: number | null | undefined) => (paise == null ? "" : (paise / 100).toFixed(2));
const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);

export function ProductForm({ product, categories }: { product?: Product; categories: Category[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [images, setImages] = useState<string[]>(product?.images ?? []);
  const [uploading, setUploading] = useState(false);
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(product));
  const [newImagePath, setNewImagePath] = useState("");

  async function onUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return setError("Image must be smaller than 5 MB.");
    setError(null);
    setUploading(true);
    const supabase = createClient();
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${slug || "product"}-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("product-images").upload(path, file, {
      cacheControl: "31536000",
      contentType: file.type,
    });
    setUploading(false);
    if (upErr) return setError(`Upload failed: ${upErr.message}. Did you run supabase/005_storage.sql?`);
    const { data } = supabase.storage.from("product-images").getPublicUrl(path);
    setImages((list) => [...list, data.publicUrl]);
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const price = rupeesToPaise(String(form.get("price")));
    const mrpRaw = String(form.get("mrp")).trim();
    const mrp = mrpRaw ? rupeesToPaise(mrpRaw) : null;
    if (Number.isNaN(price)) return setError("Enter a valid price, e.g. 299 or 299.50.");
    if (mrp !== null && Number.isNaN(mrp)) return setError("Enter a valid MRP, or leave it empty.");

    const input = {
      name: String(form.get("name")),
      slug,
      category_id: String(form.get("category_id")),
      description: String(form.get("description")),
      price_paise: price,
      mrp_paise: mrp,
      stock: Number(form.get("stock")),
      images,
      is_active: form.get("is_active") === "on",
      is_featured: form.get("is_featured") === "on",
    };

    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await saveProduct(product?.id ?? null, input);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      if (product) {
        setSaved(true);
        router.refresh();
      } else {
        router.push(`/admin/products/${result.id}?created=1`);
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="max-w-3xl space-y-6">
      {error && <Alert>{error}</Alert>}
      {saved && <Alert kind="success">Product saved.</Alert>}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="name" className={labelClass}>
            Product name
          </label>
          <input
            id="name"
            name="name"
            required
            defaultValue={product?.name}
            onChange={(e) => !slugTouched && setSlug(slugify(e.target.value))}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="slug" className={labelClass}>
            URL slug
          </label>
          <input
            id="slug"
            value={slug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(e.target.value);
            }}
            required
            className={inputClass}
          />
          <p className="mt-1 text-xs text-gray-500">/product/{slug || "…"}</p>
        </div>
        <div>
          <label htmlFor="category_id" className={labelClass}>
            Category
          </label>
          <select id="category_id" name="category_id" required defaultValue={product?.category_id ?? ""} className={inputClass}>
            <option value="" disabled>
              Choose a category
            </option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="price" className={labelClass}>
            Selling price (₹)
          </label>
          <input
            id="price"
            name="price"
            inputMode="decimal"
            required
            defaultValue={toRupees(product?.price_paise)}
            placeholder="299.00"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="mrp" className={labelClass}>
            MRP (₹) <span className="font-normal text-gray-400">(optional, shown crossed out)</span>
          </label>
          <input
            id="mrp"
            name="mrp"
            inputMode="decimal"
            defaultValue={toRupees(product?.mrp_paise)}
            placeholder="399.00"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="stock" className={labelClass}>
            Stock quantity
          </label>
          <input
            id="stock"
            name="stock"
            type="number"
            min={0}
            step={1}
            required
            defaultValue={product?.stock ?? 0}
            className={inputClass}
          />
        </div>
        <div className="flex flex-col justify-end gap-2 pb-1">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              name="is_active"
              defaultChecked={product?.is_active ?? true}
              className="h-4 w-4 accent-red-600"
            />
            Active (visible in the shop)
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              name="is_featured"
              defaultChecked={product?.is_featured ?? false}
              className="h-4 w-4 accent-red-600"
            />
            Featured on home page
          </label>
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="description" className={labelClass}>
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={7}
            defaultValue={product?.description}
            className={inputClass}
            placeholder={"Short intro.\n\n• Feature one\n• Feature two"}
          />
        </div>
      </div>

      <fieldset>
        <legend className={labelClass}>Images (first image is the main one)</legend>
        {images.length > 0 && (
          <ul className="mb-3 flex flex-wrap gap-3">
            {images.map((src, i) => (
              <li key={src} className="relative">
                <div className="relative h-24 w-24 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                  <Image src={src} alt="" fill sizes="96px" className="object-cover" />
                </div>
                <div className="mt-1 flex justify-between text-xs">
                  {i > 0 ? (
                    <button
                      type="button"
                      className="text-gray-600 hover:text-red-600"
                      onClick={() => setImages((l) => [l[i], ...l.filter((_, j) => j !== i)])}
                    >
                      Make main
                    </button>
                  ) : (
                    <span className="font-semibold text-red-600">Main</span>
                  )}
                  <button
                    type="button"
                    className="text-gray-600 hover:text-red-600"
                    onClick={() => setImages((l) => l.filter((_, j) => j !== i))}
                    aria-label={`Remove image ${i + 1}`}
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <label className={buttonClass("secondary", "cursor-pointer")}>
            {uploading ? <Spinner /> : null}
            {uploading ? "Uploading…" : "Upload image"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              className="sr-only"
              onChange={onUpload}
              disabled={uploading}
            />
          </label>
          <span className="text-xs text-gray-500">or add an existing path:</span>
          <input
            value={newImagePath}
            onChange={(e) => setNewImagePath(e.target.value)}
            placeholder="/images/garbage-bags/garbage-bag-1.avif"
            className={`${inputClass} max-w-xs`}
          />
          <button
            type="button"
            className={buttonClass("ghost")}
            onClick={() => {
              const p = newImagePath.trim();
              if (p.startsWith("/images/") || p.includes(".supabase.co/storage/")) {
                setImages((l) => (l.includes(p) ? l : [...l, p]));
                setNewImagePath("");
                setError(null);
              } else {
                setError("Image path must start with /images/ or be a Supabase Storage URL.");
              }
            }}
          >
            Add
          </button>
        </div>
      </fieldset>

      <div className="flex gap-3 border-t border-gray-200 pt-6">
        <button type="submit" disabled={isPending || uploading} className={buttonClass("primary")}>
          {isPending && <Spinner />}
          {isPending ? "Saving…" : product ? "Save changes" : "Create product"}
        </button>
        <button type="button" onClick={() => router.push("/admin/products")} className={buttonClass("secondary")}>
          Cancel
        </button>
      </div>
    </form>
  );
}
