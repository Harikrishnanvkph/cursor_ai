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
    <div className="flex flex-1 items-center justify-center h-full w-full relative bg-transparent">
      <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-500">
        <div className="relative">
          {/* Outer spinning ring */}
          <div className="w-16 h-16 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin shadow-lg"></div>
          {/* Inner pulsing core */}
          <div className="absolute inset-0 m-auto w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 animate-pulse"></div>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-sm font-semibold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 animate-pulse">
            Preparing Workspace
          </span>
          <span className="text-xs text-gray-400 mt-1">Loading your context...</span>
        </div>
      </div>
    </div>
  );
}
