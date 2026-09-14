import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { cookies: { getAll: () => request.cookies.getAll(), setAll: (cookies) => {
      cookies.forEach(({ name, value }) => request.cookies.set(name, value));
      response = NextResponse.next({ request });
      cookies.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
    } } }
  );
  await supabase.auth.getClaims();
  const { data: { user } } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;
  const publicPath = path.startsWith('/auth') || path.startsWith('/api/health') || path === '/favicon.ico';
  if (!user && !publicPath) return NextResponse.redirect(new URL('/auth/login', request.url));
  if (user && path.startsWith('/auth/')) return NextResponse.redirect(new URL('/', request.url));
  return response;
}

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'] };
