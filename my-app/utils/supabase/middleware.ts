import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export const updateSession = async (request: NextRequest) => {
  try {
    // Create an unmodified response
    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value),
            );
            response = NextResponse.next({
              request,
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options),
            );
          },
        },
      },
    );

    // This will refresh session if expired
    await supabase.auth.getUser();

    // Handle root path redirection based on auth status
    if (request.nextUrl.pathname === "/") {
      const { data } = await supabase.auth.getSession();
      if (data?.session) {
        return NextResponse.redirect(new URL("/app/dashboard", request.url));
      }
    }

    return response;
  } catch (e) {
    console.error("Error in updateSession middleware:", e);
    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    });
  }
};
