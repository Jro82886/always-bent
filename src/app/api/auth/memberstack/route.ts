import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import * as jose from "jose";

const SECRET = process.env.MEMBERSTACK_SECRET_KEY;
const APP_SECRET = process.env.ABFI_APP_SECRET;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const msToken = url.searchParams.get("msToken");

  // Soft guard: if not ready, don't throw—just bounce to login
  if (!SECRET || !APP_SECRET || !msToken) {
    return NextResponse.redirect("https://always-bent.vercel.app/login?e=auth-not-ready");
  }

  // Placeholder; Commit B will do real verification + cookie
  return NextResponse.json({ ok: true, message: "memberstack auth skeleton" });
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const token: string | undefined = body?.token;

    const PUBLIC_KEY = process.env.MEMBERSTACK_PUBLIC_KEY;
    const APP_SECRET = process.env.ABFI_APP_SECRET;

    if (!PUBLIC_KEY || !APP_SECRET || !token) {
      return NextResponse.json({ ok: false, error: "auth-not-ready" }, { status: 400 });
    }

    // Verify Memberstack token (signed JWT) using public key
    const { payload } = await jose.jwtVerify(token, await jose.importSPKI(PUBLIC_KEY, "RS256"));

    // Create session JWT signed with our app secret
    const session = await new jose.SignJWT({
      sub: String(payload.sub || payload.memberId || ""),
      email: (payload as any).email,
      plans: (payload as any).plans || (payload as any).permissions || [],
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("7d")
      .sign(new TextEncoder().encode(APP_SECRET));

    const res = NextResponse.json({ ok: true, next: "/legendary/analysis" });
    res.cookies.set("abfi_session", session, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return res;
  } catch (err) {
    return NextResponse.json({ ok: false, error: "invalid-token" }, { status: 401 });
  }
}


