import React from 'react';

/**
 * Highlights @mentions in chat messages
 */
export function highlightMentions(text: string, currentUsername: string): React.ReactNode {
  // Handle null, undefined, or empty text
  if (!text || typeof text !== 'string') return text || '';
  
  // Handle empty username gracefully
  const safeUsername = currentUsername || '';
  
  // Find all @mentions in the text
  // Matches @ followed by alphanumeric characters and underscores
  const mentionRegex = /@(\w+)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;
  let keyIndex = 0; // Use a separate key index for React keys
  
  while ((match = mentionRegex.exec(text)) !== null) {
    // Add text before the mention
    if (match.index > lastIndex) {
      parts.push(
        <span key={`text-${keyIndex++}`}>
          {text.slice(lastIndex, match.index)}
        </span>
      );
    }
    
    const mentionedUser = match[1];
    const isCurrentUser = safeUsername && 
      mentionedUser.toLowerCase() === safeUsername.toLowerCase();
    
    // Add the mention with styling
    parts.push(
      <span
        key={`mention-${keyIndex++}`}
        className={`inline-block ${
          isCurrentUser 
            ? 'bg-cyan-500/30 text-cyan-300 px-1 rounded font-semibold animate-pulse-subtle' 
            : 'text-cyan-400 font-medium hover:text-cyan-300 transition-colors cursor-pointer'
        }`}
        title={isCurrentUser ? 'You were mentioned' : `@${mentionedUser}`}
      >
        @{mentionedUser}
      </span>
    );
    
    lastIndex = match.index + match[0].length;
  }
  
  // Add any remaining text
  if (lastIndex < text.length) {
    parts.push(
      <span key={`text-${keyIndex++}`}>
        {text.slice(lastIndex)}
      </span>
    );
  }
  
  // If no mentions were found, return the original text
  if (parts.length === 0) {
    return text;
  }
  
  return <>{parts}</>;
}