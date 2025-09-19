'use client';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import clsx from 'clsx';

interface NavTabProps {
  href: string;
  label: string;
  mode: string;
}

export default function NavTab({ href, label, mode }: NavTabProps) {
  const searchParams = useSearchParams();
  const currentMode = searchParams.get('mode') || 'analysis';
  const active = currentMode === mode;

  return (
    <Link
      href={href}
      className={clsx(
        'relative px-4 py-2 text-sm font-medium transition-all',
        active ? 'text-cyan-400' : 'text-gray-400 hover:text-white'
      )}
      aria-current={active ? 'page' : undefined}
    >
      <span>{label}</span>
      <span 
        className={clsx(
          'absolute left-0 right-0 bottom-0 h-[2px] rounded-full transition-all duration-300',
          active 
            ? 'bg-cyan-400 scale-x-100' 
            : 'bg-transparent scale-x-0'
        )}
        style={{ transformOrigin: 'center' }}
        aria-hidden 
      />
    </Link>
  );
}
