'use client';

export default function ReportCatchButton({ disabled = true }: { disabled?: boolean }) {
  return (
    <button
      disabled={disabled}
      title={disabled ? 'Coming soon' : 'Report a Catch'}
      className={[
        'px-3 py-2 rounded text-sm',
        disabled
          ? 'bg-zinc-700 text-zinc-400 cursor-not-allowed'
          : 'bg-cyan-600 hover:bg-cyan-700 text-white'
      ].join(' ')}
    >
      🎣 Report a Catch
    </button>
  );
}


