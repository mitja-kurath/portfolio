/** Collects field errors while reading an untrusted JSON body. */
export class Validator {
  readonly errors: Record<string, string> = {};
  private readonly input: Record<string, unknown>;

  constructor(body: unknown) {
    this.input = typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : {};
  }

  get ok(): boolean {
    return Object.keys(this.errors).length === 0;
  }

  text(key: string, max: number, required = true): string {
    const raw = this.input[key];
    const value = typeof raw === 'string' ? raw.trim() : '';
    if (raw !== undefined && raw !== null && typeof raw !== 'string') this.errors[key] = 'Must be text.';
    else if (required && !value) this.errors[key] = 'Required.';
    else if (value.length > max) this.errors[key] = `At most ${max} characters.`;
    return value;
  }

  /** URL-safe id such as `alpine-signal`. */
  slug(key: string): string {
    const value = this.text(key, 64);
    if (value && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) {
      this.errors[key] = 'Use lowercase letters, digits and dashes (e.g. my-project).';
    }
    return value;
  }

  optionalUrl(key: string): string | null {
    const value = this.text(key, 500, false);
    if (!value) return null;
    try {
      const url = new URL(value);
      if (url.protocol === 'https:' || url.protocol === 'http:') return value;
    } catch {
      // handled below
    }
    this.errors[key] = 'Must be an http(s) URL.';
    return null;
  }

  bool(key: string): boolean {
    const raw = this.input[key];
    if (typeof raw !== 'boolean') this.errors[key] = 'Must be true or false.';
    return raw === true;
  }

  int(key: string, min: number, max: number): number {
    const raw = this.input[key];
    if (typeof raw !== 'number' || !Number.isInteger(raw) || raw < min || raw > max) {
      this.errors[key] = `Must be a whole number from ${min} to ${max}.`;
      return min;
    }
    return raw;
  }

  textList(key: string, maxItems: number, maxLength: number, minItems = 0): string[] {
    const raw = this.input[key];
    if (!Array.isArray(raw) || raw.some((item) => typeof item !== 'string')) {
      this.errors[key] = 'Must be a list of texts.';
      return [];
    }
    const items = (raw as string[]).map((item) => item.trim()).filter(Boolean);
    if (items.length < minItems) this.errors[key] = `At least ${minItems} required.`;
    else if (items.length > maxItems) this.errors[key] = `At most ${maxItems} entries.`;
    else if (items.some((item) => item.length > maxLength)) {
      this.errors[key] = `Each entry at most ${maxLength} characters.`;
    }
    return items;
  }
}
