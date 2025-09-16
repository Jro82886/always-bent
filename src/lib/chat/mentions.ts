import React from 'react';

export function highlightMentions(text: string, currentUser: string): React.ReactNode {
  // Split text on @ mentions
  const parts = text.split(/(@\w+)/g);
  
  return parts.map((part, idx) => {
    if (part.startsWith('@')) {
      const mentionedUser = part.slice(1);
      const isMe = mentionedUser.toLowerCase() === currentUser.toLowerCase();
      
      return (
        <span
          key={idx}
          className={
            isMe
              ? 'bg-yellow-500/30 text-yellow-300 px-1 rounded font-medium'
              : 'text-cyan-400 font-medium'
          }
        >
          {part}
        </span>
      );
    }
    return part;
  });
}
