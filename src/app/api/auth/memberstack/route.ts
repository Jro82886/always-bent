import { NextResponse } from "next/server";

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
  return NextResponse.redirect("https://always-bent.vercel.app/legendary/analysis");
}


