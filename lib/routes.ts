// Deliberately dependency-free: proxy.ts imports it.

// The only paths a visitor without a superadmin session may load. Everything
// else — every page, every Server Action POST, every route handler — is
// refused by proxy.ts and again by requireAdmin() (lib/dal.ts).
export const PUBLIC_PATHS = ["/login", "/auth/callback"];

export function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

// Same-origin paths only. Without the `//` check, `?next=//evil.com` would be
// a path to us and a host to the browser — an open redirect carrying the OAuth
// code.
export function safeNext(value: string | string[] | null | undefined): string {
  const candidate = Array.isArray(value) ? value[0] : value;
  if (!candidate || !candidate.startsWith("/") || candidate.startsWith("//")) return "/";
  return candidate;
}
