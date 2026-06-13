import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// These prefixes are accessible without an account
const PUBLIC_PREFIXES = [
  "/auth",
  "/car",  // public car pages
  "/u",    // public user profiles
  "/api/car-models", // read-only catalog — no auth needed
];

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const { pathname } = request.nextUrl;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Always refresh session — required by @supabase/ssr
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isPublicPath =
    pathname === "/" ||
    PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));

  // Logged-in users don't need the landing or login pages
  if (user && (pathname === "/" || pathname === "/auth/login")) {
    return NextResponse.redirect(new URL("/garage", request.url));
  }

  // Protected routes require authentication
  if (!user && !isPublicPath) {
    const url = new URL("/auth/login", request.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Authenticated users without a profile must complete onboarding first
  if (user && !isPublicPath && pathname !== "/onboarding") {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.redirect(new URL("/onboarding", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
