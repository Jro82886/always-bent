// src/components/TopBar.tsx
"use client";

import { useEffect, useState } from "react";
import { useAppState } from "@/lib/store";

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
      {username ? (
        <>
          <span className="font-semibold">Nickname: {username}</span>
          <button
            onClick={() => {
              setUsername(null);
              setLocalName("");
              localStorage.removeItem("username");
            }}
            className="bg-slate-600 hover:bg-slate-700 text-white px-3 py-1 rounded text-sm"
          >
            Change
          </button>
        </>
      ) : (
        <>
          <span className="font-semibold">Nickname:</span>
          <input
            type="text"
            className="bg-slate-700 px-2 py-1 rounded text-white"
            placeholder="enter nickname"
            value={localName}
            onChange={(e) => setLocalName(e.target.value)}
          />
          <button
            onClick={handleSave}
            className="bg-cyan-600 hover:bg-cyan-700 text-white px-3 py-1 rounded"
          >
            Save
          </button>
        </>
      )}
    </div>
  );
}




