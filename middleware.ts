import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const config = { matcher: ["/legendary/:path*"] };

export function middleware(req: NextRequest) {
  const mode = process.env.ABFI_AUTH_MODE || "soft"; // "soft" | "hard"
  if (mode === "soft") return NextResponse.next();

  // hard mode: require cookie
  const has = req.cookies.get("abfi_session")?.value;
  if (!has) return NextResponse.redirect(new URL("/login", req.url));
  return NextResponse.next();
}


