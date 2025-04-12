import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const middleware = (req: NextRequest) => {
  const url = req.nextUrl;
  const hostname = req.headers.get("host") || "";
  
  // Check for blog subdomain
  if (hostname.startsWith("blog.")) {
    // Rewrite the URL for blog subdomain
    url.pathname = `/blog${url.pathname}`;
    return NextResponse.rewrite(url);
  }
  
  // Continue with Clerk middleware for other routes
  return clerkMiddleware()(req);
};

export default middleware;

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};