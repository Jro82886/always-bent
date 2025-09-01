'use client';
import Link from "next/link";

export default function LeftRail() {
  return (
    <aside style={{ padding: 16, borderRight: "1px solid #333", minWidth: 160 }}>
      <nav>
        <ul style={{ listStyle: "none", padding: 0, margin: 0, lineHeight: "2em" }}>
          <li>
            <Link href="/imagery" prefetch={false}>
              Imagery
            </Link>
          </li>
          <li>
            <Link href="/analysis" prefetch={false}>
              Analysis
            </Link>
          </li>
        </ul>
      </nav>
    </aside>
  );
}
