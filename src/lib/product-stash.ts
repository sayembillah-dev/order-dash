/** Reusable product photos stored locally (HTTPS URLs from Cloudinary). */

export const PRODUCT_STASH_STORAGE_KEY = "order-dash-product-stash-v1";

export type ProductStashItem = {
  id: string;
  url: string;
  addedAt: number;
};

export function loadProductStash(): ProductStashItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PRODUCT_STASH_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (x): x is ProductStashItem =>
          typeof x === "object" &&
          x !== null &&
          typeof (x as ProductStashItem).id === "string" &&
          typeof (x as ProductStashItem).url === "string",
      )
      .map((x) => ({
        id: x.id,
        url: x.url,
        addedAt: typeof x.addedAt === "number" ? x.addedAt : Date.now(),
      }));
  } catch {
    return [];
  }
}

export function saveProductStash(items: ProductStashItem[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PRODUCT_STASH_STORAGE_KEY, JSON.stringify(items));
  } catch {
    /* quota / private mode */
  }
  window.dispatchEvent(new Event("order-dash-product-stash-change"));
}
