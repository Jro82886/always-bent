import * as React from "react";
import { nearestInlet, INLETS, DEFAULT_INLET } from "@/lib/inlets";

const MENTION_REGEX = /@([a-z0-9_\.]+)/gi;

export function normalizeUser(u: string): string {
  return (u || "").trim().toLowerCase();
}

export function parseMentions(text: string): string[] {
  const found = new Set<string>();
  let match: RegExpExecArray | null;
  const regex = new RegExp(MENTION_REGEX);
  while ((match = regex.exec(text)) !== null) {
    const user = normalizeUser(match[1]);
    if (user) found.add(user);
  }
  return Array.from(found);
}

export function highlightMentions(text: string, currentUser: string): React.ReactNode {
  const me = normalizeUser(currentUser);
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  const regex = new RegExp(MENTION_REGEX);
  while ((match = regex.exec(text)) !== null) {
    const start = match.index;
    const end = start + match[0].length;
    if (start > lastIndex) {
      parts.push(text.slice(lastIndex, start));
    }
    const mentioned = normalizeUser(match[1]);
    const isMe = mentioned === me;
    parts.push(
      <span key={`${mentioned}-${start}`} className={isMe ? "text-cyan-600 font-semibold" : "text-cyan-500"}>
        {match[0]}
      </span>
    );
    lastIndex = end;
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  return <>{parts}</>;
}


