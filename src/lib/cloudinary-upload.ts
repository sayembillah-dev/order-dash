/** Client-side direct upload to Cloudinary (unsigned preset). */

export async function uploadToCloudinary(
  file: File,
  options?: { folder?: string }
): Promise<string> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  if (!cloudName || !preset) {
    throw new Error(
      "Cloudinary is not configured. Set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET.",
    );
  }
  const folder = options?.folder ?? "order-dash";

  const body = new FormData();
  body.append("file", file);
  body.append("upload_preset", preset);
  body.append("folder", folder);

  let res: Response;
  try {
    res = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: "POST",
        body,
        mode: "cors",
        credentials: "omit",
      },
    );
  } catch (e) {
    if (e instanceof TypeError) {
      throw new Error(
        "Could not reach Cloudinary — check your connection or try another network.",
      );
    }
    throw e;
  }

  if (!res.ok) {
    const text = await res.text();
    let msg = text.slice(0, 220);
    try {
      const json = JSON.parse(text) as { error?: { message?: string } };
      if (json?.error?.message) msg = json.error.message;
    } catch {
      /* not JSON */
    }
    throw new Error(msg || `Upload failed (${res.status})`);
  }

  const data = (await res.json()) as { secure_url?: string };
  if (!data.secure_url) throw new Error("Invalid Cloudinary response");
  return data.secure_url;
}
