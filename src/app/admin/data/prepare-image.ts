/**
 * Shrinks an image in the browser before upload: at most `maxSide` pixels on the longer side,
 * re-encoded as WebP. Phone photos (5–10 MB) end up at a few hundred KB.
 * Falls back to the original file when the browser can't decode or encode it.
 */
export async function prepareImage(file: File, maxSide = 2400, quality = 0.85): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const webp = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/webp', quality),
    );
    // Some browsers fall back to PNG when WebP encoding isn't supported.
    return webp && webp.type === 'image/webp' && webp.size < file.size ? webp : file;
  } catch {
    return file;
  }
}
