"use server";

import { redirect } from "next/navigation";
import {
  clearSessionCookie,
  createSessionToken,
  getExpectedCredentials,
  setSessionCookie,
} from "@/lib/auth";

export async function loginAction(
  _prevState: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string }> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  let expected: { username: string; password: string };
  try {
    expected = getExpectedCredentials();
  } catch {
    return { error: "Server auth is not configured." };
  }

  if (username !== expected.username || password !== expected.password) {
    return { error: "Invalid username or password." };
  }

  try {
    const token = await createSessionToken();
    await setSessionCookie(token);
  } catch {
    return { error: "Could not create session. Check AUTH_SECRET." };
  }

  const from = String(formData.get("redirect") ?? "").trim();
  if (from.startsWith("/") && !from.startsWith("//")) {
    redirect(from);
  }
  redirect("/intake");
}

export async function logoutAction(): Promise<void> {
  await clearSessionCookie();
  redirect("/login");
}
