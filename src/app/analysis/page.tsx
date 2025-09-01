'use client';
import Link from "next/link";

export default function Home() {
  return (
    <main style={{ padding: 24 }}>
      <h1>Welcome to ABFI</h1>
      <ul style={{ marginTop: 16, lineHeight: '2em' }}>
        <li>
          <Link href="/imagery" prefetch={false}>
            Go to Imagery
          </Link>
        </li>
        <li>
          <Link href="/analysis" prefetch={false}>
            Go to Analysis
          </Link>
        </li>
      </ul>
    </main>
  );
}
