/** Minimal in-memory R2 bucket: put / get / delete, as used by the API. */
export class MemoryR2 {
  readonly objects = new Map<string, { bytes: Uint8Array; contentType?: string }>();

  async put(key: string, value: Uint8Array, options?: { httpMetadata?: { contentType?: string } }) {
    this.objects.set(key, { bytes: value, contentType: options?.httpMetadata?.contentType });
    return { key };
  }

  async get(key: string) {
    const object = this.objects.get(key);
    if (!object) return null;
    return {
      body: new Response(object.bytes).body,
      httpEtag: `"${key}-${object.bytes.length}"`,
      httpMetadata: { contentType: object.contentType },
    };
  }

  async delete(keys: string | string[]) {
    for (const key of Array.isArray(keys) ? keys : [keys]) this.objects.delete(key);
  }

  asBinding(): R2Bucket {
    return this as unknown as R2Bucket;
  }
}
