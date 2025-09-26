'use client';

interface ChatTabsProps {
  selectedTab: 'inlet' | 'offshore' | 'inshore';
  onSelectTab: (tab: 'inlet' | 'offshore' | 'inshore') => void;
  counts: Record<string, number>;
}

export default function ChatTabs({ selectedTab, onSelectTab, counts }: ChatTabsProps) {
  const Tab = ({ k, label }: { k: 'inlet' | 'offshore' | 'inshore'; label: string }) => (
    <button
      onClick={() => onSelectTab(k)}
      className={`px-4 py-2 rounded-full text-sm font-medium transition-all
        ${selectedTab === k 
          ? 'text-cyan-100 shadow-[0_0_0_1px_rgba(0,255,255,.35)]' 
          : 'text-cyan-300/70 hover:text-cyan-100'}
      `}
    >
      {label}
      <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-white/10">
        {counts[k] ?? 0}
      </span>
    </button>
  );

  return (
    <div className="flex items-center gap-2">
      <Tab k="inlet" label="Inlet" />
      <Tab k="offshore" label="Tuna (Offshore)" />
      <Tab k="inshore" label="Inshore" />
    </div>
  );
}
