'use client';

import React, { useState, KeyboardEvent } from 'react';

interface ChatInputProps {
  inletName: string;
  inletColor: string;
  onSend: (text: string) => Promise<void>;
  disabled?: boolean;
}

export default function ChatInput({ inletName, inletColor, onSend, disabled }: ChatInputProps) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  
  const handleSend = async () => {
    if (!text.trim() || sending || disabled) return;
    
    setSending(true);
    try {
      await onSend(text.trim());
      setText('');
    } finally {
      setSending(false);
    }
  };
  
  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  return (
    <footer 
      className="chat-input" 
      style={{ ['--inlet-color' as any]: inletColor }}
    >
      <input 
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder={`Message ${inletName}…`}
        disabled={disabled || sending}
      />
      <button 
        onClick={handleSend} 
        disabled={!text.trim() || sending || disabled}
      >
        {sending ? '...' : 'Send'}
      </button>
    </footer>
  );
}
