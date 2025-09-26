'use client';

interface ChatTabsProps {
  selectedTab: 'inlet' | 'offshore' | 'inshore';
  onSelectTab: (tab: 'inlet' | 'offshore' | 'inshore') => void;
  hasInlet: boolean;
}

export default function ChatTabs({ selectedTab, onSelectTab, hasInlet }: ChatTabsProps) {
  const tabs = [
    { id: 'inlet' as const, label: 'Inlet', disabled: false },
    { id: 'offshore' as const, label: 'Tuna (Offshore)', disabled: false },
    { id: 'inshore' as const, label: 'Inshore', disabled: false },
  ];

  return (
    <div className="flex border-b border-white/10 bg-slate-900/50">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onSelectTab(tab.id)}
          disabled={tab.disabled}
          className={`
            px-6 py-3 text-sm font-medium transition-all duration-200
            ${selectedTab === tab.id
              ? 'text-cyan-300 border-b-2 border-cyan-400 bg-slate-800/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/20'
            }
            ${tab.disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
