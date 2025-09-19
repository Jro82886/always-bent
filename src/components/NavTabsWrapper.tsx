import { ClientBoundary } from './ClientBoundary';
import NavTabs from './NavTabs';

/**
 * NavTabsWrapper - Wraps the original NavTabs in a ClientBoundary
 * This allows us to keep using NavTabs everywhere without breaking SSR
 */
export default function NavTabsWrapper() {
  return (
    <ClientBoundary fallback={
      <div className="absolute z-40 top-3 left-3 md:top-4 md:left-4">
        <div className="flex items-center gap-2">
          <nav className="flex flex-wrap items-center gap-2 rounded-xl bg-black/35 backdrop-blur-md px-2 py-2 shadow-lg ring-1 ring-white/10">
            <div className="h-8 w-[300px] animate-pulse bg-white/10 rounded-lg" />
          </nav>
        </div>
      </div>
    }>
      <NavTabs />
    </ClientBoundary>
  );
}
