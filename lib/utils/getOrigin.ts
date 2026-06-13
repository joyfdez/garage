/**
 * Returns the true public origin for the current request.
 *
 * On Vercel (and behind any standard reverse proxy), `request.url` may carry
 * `http://localhost:3000` as the host while the real hostname is in the
 * `x-forwarded-host` / `x-forwarded-proto` headers. We prefer those headers
 * so that `redirectTo` / callback URLs are always production-safe.
 */
export function getOrigin(request: Request): string {
  const host = request.headers.get("x-forwarded-host");
  if (host) {
    // x-forwarded-proto can be a comma-separated list; take the first value.
    const proto = (request.headers.get("x-forwarded-proto") ?? "https")
      .split(",")[0]
      .trim();
    return `${proto}://${host}`;
  }
  return new URL(request.url).origin;
}
