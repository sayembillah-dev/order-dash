"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { Order } from "@/lib/models/Order";

const imageUrlSchema = z.string().url();

const orderIdSchema = z.string().refine(
  (id) => /^[a-f\d]{24}$/i.test(id),
  "Invalid order id"
);

function parseImagesJson(json: string | undefined): string[] {
  if (!json?.trim()) return [];
  try {
    const arr = JSON.parse(json) as unknown;
    if (!Array.isArray(arr)) return [];
    return arr.filter((u) => typeof u === "string" && imageUrlSchema.safeParse(u).success);
  } catch {
    return [];
  }
}

const createOrderSchema = z.object({
  customerName: z.string().trim().min(1, "Customer name is required"),
  phone: z.string().trim().min(1, "Phone is required"),
  address: z.string().trim().min(1, "Address is required"),
  orderDetails: z.string().trim().min(1, "Order details are required"),
  price: z.coerce.number().nonnegative("Price must be zero or positive"),
});

export type CreateOrderState = {
  error?: string;
  success?: boolean;
};

export async function createOrder(
  _prev: CreateOrderState | undefined,
  formData: FormData
): Promise<CreateOrderState> {
  await requireAuth();

  const imagesJson = String(formData.get("imagesJson") ?? "");
  const parsed = createOrderSchema.safeParse({
    customerName: formData.get("customerName"),
    phone: formData.get("phone"),
    address: formData.get("address"),
    orderDetails: formData.get("orderDetails"),
    price: formData.get("price"),
  });

  if (!parsed.success) {
    const first = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0];
    return { error: first ?? "Invalid form data" };
  }

  const images = parseImagesJson(imagesJson);

  await connectDB();
  await Order.create({
    ...parsed.data,
    pathaoEntryDone: false,
    parcelCreationDone: false,
    images,
  });

  revalidatePath("/parcel");
  revalidatePath("/entry");

  return { success: true };
}

export async function completeParcelCreation(formData: FormData): Promise<void> {
  await requireAuth();
  const id = orderIdSchema.parse(String(formData.get("orderId") ?? ""));
  await connectDB();
  await Order.findByIdAndUpdate(id, { parcelCreationDone: true });
  revalidatePath("/parcel");
  revalidatePath("/archive");
}

export async function completePathaoEntry(formData: FormData): Promise<void> {
  await requireAuth();
  const id = orderIdSchema.parse(String(formData.get("orderId") ?? ""));
  await connectDB();
  await Order.findByIdAndUpdate(id, { pathaoEntryDone: true });
  revalidatePath("/entry");
  revalidatePath("/archive");
}

const updateArchiveSchema = z.object({
  orderId: orderIdSchema,
  customerName: z.string().trim().min(1),
  phone: z.string().trim().min(1),
  address: z.string().trim().min(1),
  orderDetails: z.string().trim().min(1),
  price: z.coerce.number().nonnegative(),
});

export type UpdateArchiveState = { error?: string; success?: boolean };

export async function updateArchivedOrder(
  _prev: UpdateArchiveState | undefined,
  formData: FormData
): Promise<UpdateArchiveState> {
  await requireAuth();

  const parsed = updateArchiveSchema.safeParse({
    orderId: formData.get("orderId"),
    customerName: formData.get("customerName"),
    phone: formData.get("phone"),
    address: formData.get("address"),
    orderDetails: formData.get("orderDetails"),
    price: formData.get("price"),
  });

  if (!parsed.success) {
    const first = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0];
    return { error: first ?? "Invalid data" };
  }

  await connectDB();
  const order = await Order.findById(parsed.data.orderId).exec();
  if (!order) return { error: "Order not found" };
  if (!order.pathaoEntryDone || !order.parcelCreationDone) {
    return { error: "Order is not fully completed / archived." };
  }

  await Order.findByIdAndUpdate(parsed.data.orderId, {
    customerName: parsed.data.customerName,
    phone: parsed.data.phone,
    address: parsed.data.address,
    orderDetails: parsed.data.orderDetails,
    price: parsed.data.price,
  });

  revalidatePath("/archive");
  return { success: true };
}

export async function deleteOrder(formData: FormData): Promise<void> {
  await requireAuth();
  const id = orderIdSchema.parse(String(formData.get("orderId") ?? ""));
  await connectDB();
  await Order.findByIdAndDelete(id);
  revalidatePath("/parcel");
  revalidatePath("/entry");
  revalidatePath("/archive");
}

export async function reopenParcelStep(formData: FormData): Promise<void> {
  await requireAuth();
  const id = orderIdSchema.parse(String(formData.get("orderId") ?? ""));
  await connectDB();
  await Order.findByIdAndUpdate(id, { parcelCreationDone: false });
  revalidatePath("/parcel");
  revalidatePath("/archive");
}

export async function reopenPathaoStep(formData: FormData): Promise<void> {
  await requireAuth();
  const id = orderIdSchema.parse(String(formData.get("orderId") ?? ""));
  await connectDB();
  await Order.findByIdAndUpdate(id, { pathaoEntryDone: false });
  revalidatePath("/entry");
  revalidatePath("/archive");
}

export async function reopenBothSteps(formData: FormData): Promise<void> {
  await requireAuth();
  const id = orderIdSchema.parse(String(formData.get("orderId") ?? ""));
  await connectDB();
  await Order.findByIdAndUpdate(id, {
    pathaoEntryDone: false,
    parcelCreationDone: false,
  });
  revalidatePath("/parcel");
  revalidatePath("/entry");
  revalidatePath("/archive");
}
