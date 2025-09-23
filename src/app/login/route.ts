export const runtime = "nodejs";

export async function GET() {
  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Sign in</title>
  <style>
    body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial; margin: 0; padding: 48px; background:#0b0d14; color:#e6e9f2; }
    .wrap { max-width: 560px; margin: 0 auto; }
    h1 { font-size: 28px; margin: 0 0 12px; }
    p { opacity: .85; line-height: 1.5; }
    .hint { font-size: 12px; opacity: .6; margin-top: 16px; }
    .btn { display:inline-block; padding:10px 14px; border-radius:10px; background:#141a2a; color:#e6e9f2; text-decoration:none; margin-top:16px; }
  </style>
  </head>
<body>
  <div class="wrap">
    <h1>Sign in</h1>
    <p>If you came from Webflow/Memberstack, you’re in the right place. After verification we’ll set your session and return you to the app.</p>
    <p class="hint">(This is a minimal server-rendered page to keep the build stable. Commit B turns auth fully live.)</p>
    <a class="btn" href="/legendary/analysis">Back to app</a>
  </div>
</body>
</html>`;
  return new Response(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}


