/** Image storage in R2: allowed formats, key format, public URLs. */

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/** Allowed types with their file extension and magic-byte check. */
const FORMATS: Record<string, { ext: string; matches: (b: Uint8Array) => boolean }> = {
  'image/webp': {
    ext: 'webp',
    matches: (b) => ascii(b, 0, 4) === 'RIFF' && ascii(b, 8, 12) === 'WEBP',
  },
  'image/jpeg': { ext: 'jpg', matches: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  'image/png': { ext: 'png', matches: (b) => ascii(b, 1, 4) === 'PNG' && b[0] === 0x89 },
  'image/avif': { ext: 'avif', matches: (b) => ascii(b, 4, 8) === 'ftyp' && ascii(b, 8, 12).startsWith('avi') },
};

const CONTENT_TYPES: Record<string, string> = Object.fromEntries(
  Object.entries(FORMATS).map(([type, f]) => [f.ext, type]),
);

/** `3f2b…-….webp`: a UUID plus one of the allowed extensions. */
export const IMAGE_KEY = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(webp|jpg|png|avif)$/;

function ascii(bytes: Uint8Array, from: number, to: number): string {
  return String.fromCharCode(...bytes.subarray(from, to));
}

/** Checks the declared type against the file's first bytes; returns the extension or null. */
export function detectImage(contentType: string | undefined, bytes: Uint8Array): string | null {
  const format = FORMATS[(contentType ?? '').split(';')[0].trim().toLowerCase()];
  return format && format.matches(bytes) ? format.ext : null;
}

export function contentTypeForKey(key: string): string {
  return CONTENT_TYPES[key.split('.').pop() ?? ''] ?? 'application/octet-stream';
}

/** Absolute URL under which `GET /api/v1/images/:key` serves an image. */
export function imageUrl(requestUrl: string, key: string): string {
  return `${new URL(requestUrl).origin}/api/v1/images/${key}`;
}
