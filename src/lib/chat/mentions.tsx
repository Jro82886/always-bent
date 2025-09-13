import React from 'react';

/**
 * Highlights @mentions in chat messages
 */
export function highlightMentions(text: string, currentUsername: string): React.ReactNode {
  if (!text) return text;
  
  // Find all @mentions in the text
  const mentionRegex = /@(\w+)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;
  
  while ((match = mentionRegex.exec(text)) !== null) {
    // Add text before the mention
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    
    const mentionedUser = match[1];
    const isCurrentUser = mentionedUser.toLowerCase() === currentUsername.toLowerCase();
    
    // Add the mention with styling
    parts.push(
      <span
        key={match.index}
        className={`${
          isCurrentUser 
            ? 'bg-cyan-500/30 text-cyan-300 px-1 rounded font-semibold' 
            : 'text-cyan-400 font-medium'
        }`}
      >
        @{mentionedUser}
      </span>
    );
    
    lastIndex = match.index + match[0].length;
  }
  
  // Add any remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  
  return <>{parts}</>;
}