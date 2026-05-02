/** Browser-side normalization to JPEG before Cloudinary upload (HEIC, PNG, WebP, etc.). */

const JPEG_QUALITY = 0.92;
/** Avoid huge canvases on very large photos from modern phone cameras */
const MAX_EDGE_PX = 4096;
/** Reject absurd inputs before decode (memory / abuse). Raw HEIC can exceed final JPEG size. */
const MAX_INPUT_BYTES = 40 * 1024 * 1024;

function isHeicLike(file: File): boolean {
  const t = file.type.toLowerCase();
  if (t === "image/heic" || t === "image/heif") return true;
  return /\.(heic|heif)$/i.test(file.name);
}

function stripExtension(name: string): string {
  return name.replace(/\.[^.]+$/, "") || "photo";
}

async function heicToJpegFile(file: File): Promise<File> {
  const heic2any = (await import("heic2any")).default;
  const result = await heic2any({
    blob: file,
    toType: "image/jpeg",
    quality: JPEG_QUALITY,
  });
  const blob = Array.isArray(result) ? result[0] : result;
  if (!blob || blob.size === 0) {
    throw new Error("Could not convert HEIC/HEIF to JPEG.");
  }
  return new File([blob], `${stripExtension(file.name)}.jpg`, {
    type: "image/jpeg",
    lastModified: Date.now(),
  });
}

async function rasterToJpegFile(file: File): Promise<File> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error(
      "Could not read this image. Try another format or re-save the photo.",
    );
  }
  try {
    let w = bitmap.width;
    let h = bitmap.height;
    const max = MAX_EDGE_PX;
    if (w > max || h > max) {
      const scale = Math.min(max / w, max / h);
      w = Math.round(w * scale);
      h = Math.round(h * scale);
    }

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not prepare image canvas.");

    ctx.drawImage(bitmap, 0, 0, w, h);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY);
    });
    if (!blob) throw new Error("JPEG encoding failed.");

    return new File([blob], `${stripExtension(file.name)}.jpg`, {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  } finally {
    bitmap.close();
  }
}

/**
 * Converts HEIC/HEIF, PNG, WebP, GIF (first frame), etc. to JPEG.
 * Existing JPEG files are returned unchanged.
 */
export async function convertImageFileToJpeg(file: File): Promise<File> {
  if (file.size > MAX_INPUT_BYTES) {
    throw new Error(
      `Each image must be ${MAX_INPUT_BYTES / 1024 / 1024}MB or smaller before conversion.`,
    );
  }

  const type = file.type.toLowerCase();
  if (type === "image/jpeg" || type === "image/jpg") {
    return file;
  }

  if (isHeicLike(file)) {
    return heicToJpegFile(file);
  }

  return rasterToJpegFile(file);
}
