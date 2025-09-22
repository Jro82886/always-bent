'use client';

import React from 'react';

interface ChatHeaderProps {
  inletName: string;
  inletColor: string;
  boatsOnline: number;
}

export default function ChatHeader({ inletName, inletColor, boatsOnline }: ChatHeaderProps) {
  return (
    <header 
      className="chat-header" 
      style={{ ['--inlet-color' as any]: inletColor }}
    >
      <div className="chat-title">
        <span className="chat-inlet-dot" />
        <span className="chat-inlet-name">{inletName}</span>
      </div>
      <div className="chat-stats">
        <span className="dot-online" /> {boatsOnline} online
      </div>
    </header>
  );
}
