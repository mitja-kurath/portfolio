const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

/** Checks a Cloudflare Turnstile token server-side. */
export async function verifyTurnstile(
  token: string,
  secret: string,
  remoteIp: string | undefined,
): Promise<boolean> {
  const form = new FormData();
  form.append('secret', secret);
  form.append('response', token);
  if (remoteIp) form.append('remoteip', remoteIp);

  const res = await fetch(SITEVERIFY_URL, { method: 'POST', body: form });
  if (!res.ok) return false;
  const outcome = (await res.json()) as { success?: boolean };
  return outcome.success === true;
}
