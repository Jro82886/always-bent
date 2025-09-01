// src/components/TopBar.tsx
"use client";

import { useEffect, useState } from "react";
import { useAppState } from "@/store/appState";

export default function TopBar() {
  const { username, setUsername } = useAppState();
  const [localName, setLocalName] = useState(username ?? "");

  // load from localStorage once
  useEffect(() => {
    const stored = localStorage.getItem("username");
    if (stored && !username) {
      setUsername(stored);
      setLocalName(stored);
    }
  }, [username, setUsername]);

  // sync to store + localStorage
  const handleSave = () => {
    const clean = localName.trim();
    if (clean) {
      setUsername(clean);
      localStorage.setItem("username", clean);
    }
  };

  return (
    <div className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2">
      <span className="font-semibold">User:</span>
      <input
        type="text"
        className="bg-slate-700 px-2 py-1 rounded text-black"
        placeholder="enter name"
        value={localName}
        onChange={(e) => setLocalName(e.target.value)}
      />
      <button
        onClick={handleSave}
        className="bg-cyan-600 hover:bg-cyan-700 text-white px-3 py-1 rounded"
      >
        Save
      </button>
    </div>
  );
}


