import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Simple middleware for handling blog subdomain
export default function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const hostname = req.headers.get("host") || "";
  
  // Handle blog subdomain routing
  if (hostname.startsWith("blog.")) {
    // Check if accessing admin area
    const isAdminRoute = url.pathname.startsWith("/blog/admin");
    
    if (isAdminRoute) {
      // For a real implementation, you would check cookies or session
      // For now, we'll leave admin access open but in production
      // you'd want to implement proper authentication here
      // e.g., checking a token in cookies to verify user is aryangupta4feb@gmail.com
    }
    
    // Rewrite the URL for blog subdomain
    const newPath = url.pathname.startsWith("/blog") ? url.pathname : `/blog${url.pathname}`;
    return NextResponse.rewrite(new URL(newPath, req.url));
  }
  
  return NextResponse.next();
}

// Simple matcher that avoids static files
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files (.png, .jpg, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$).*)',
  ],
};