/**
 * Landing Loading — App Shell Architecture
 * 
 * This loading.tsx ONLY renders the content area loader.
 * The sidebar is rendered by layout.tsx and stays interactive
 * while this loading state is shown.
 * 
 * On desktop: layout.tsx provides the sidebar shell, this fills the content slot.
 * On tablet/mobile: this renders a full-screen loader (no sidebar).
 */
export default function LandingLoading() {
  return (
    <div className="flex flex-1 items-center justify-center h-full w-full relative bg-white dark:bg-slate-950">
      <div className="flex flex-col items-center gap-3.5">
        <div className="w-10 h-10 rounded-full border-[3px] border-slate-200 dark:border-slate-800 border-t-violet-600 dark:border-t-violet-400 animate-spin" />
        <div className="flex flex-col items-center">
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 tracking-tight">
            Preparing Workspace
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Loading your context...</span>
        </div>
      </div>
    </div>
  );
}
