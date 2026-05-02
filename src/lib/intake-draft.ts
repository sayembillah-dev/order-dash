/** Browser draft persistence so intake fields survive remounts and soft refreshes. */

export const INTAKE_DRAFT_STORAGE_KEY = "order-dash-intake-draft-v1";

export type IntakeDraft = {
  customerName: string;
  phone: string;
  address: string;
  orderDetails: string;
  note: string;
  /** String so the price input stays controlled without NaN flicker */
  price: string;
  images: string[];
};

export function emptyIntakeDraft(): IntakeDraft {
  return {
    customerName: "",
    phone: "",
    address: "",
    orderDetails: "",
    note: "",
    price: "",
    images: [],
  };
}

export function loadIntakeDraft(): IntakeDraft {
  if (typeof window === "undefined") return emptyIntakeDraft();
  try {
    const raw = sessionStorage.getItem(INTAKE_DRAFT_STORAGE_KEY);
    if (!raw) return emptyIntakeDraft();
    const p = JSON.parse(raw) as Partial<IntakeDraft>;
    return {
      customerName: typeof p.customerName === "string" ? p.customerName : "",
      phone: typeof p.phone === "string" ? p.phone : "",
      address: typeof p.address === "string" ? p.address : "",
      orderDetails:
        typeof p.orderDetails === "string" ? p.orderDetails : "",
      note: typeof p.note === "string" ? p.note : "",
      price: typeof p.price === "string" ? p.price : "",
      images: Array.isArray(p.images)
        ? p.images.filter((u): u is string => typeof u === "string")
        : [],
    };
  } catch {
    return emptyIntakeDraft();
  }
}

export function persistIntakeDraft(draft: IntakeDraft): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(INTAKE_DRAFT_STORAGE_KEY, JSON.stringify(draft));
  } catch {
    /* quota / private mode */
  }
}

export function clearIntakeDraftStorage(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(INTAKE_DRAFT_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
