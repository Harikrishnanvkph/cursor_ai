

export default function EditorLoading() {
  return (
    <>
      {/* Center Area minimal generic loader - App Shell Architecture */}
      <div className="flex-1 pr-4 pl-1 pt-2 pb-4 h-full overflow-hidden flex flex-col relative z-10 bg-white">
        <div className="flex flex-1 items-center justify-center h-full relative">
          <div className="flex flex-col items-center gap-3.5">
            <div className="w-10 h-10 rounded-full border-[3px] border-slate-200 border-t-violet-600 animate-spin" />
            <div className="flex flex-col items-center">
              <span className="text-sm font-semibold text-slate-800 tracking-tight">
                Preparing Editor
              </span>
              <span className="text-xs text-slate-500 mt-0.5">Loading workspace...</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right sidebar replica */}
      <div className="w-[280px] border-l border-gray-200 bg-white flex flex-col flex-shrink-0 shadow-sm">
        {/* Sidebar header (History and Profile with rotating sync) */}
        <div className="flex items-center p-2.5 border-b bg-gray-50/50 gap-2">
          <div className="h-8 w-8 bg-gray-100 rounded-md flex items-center justify-center"><div className="w-4 h-4 border-2 border-gray-300 border-t-gray-400 rounded-full animate-spin" /></div>
          <div className="h-8 w-10 bg-blue-100 rounded-md flex items-center justify-center"><div className="w-3 h-3 bg-blue-200 rounded-sm animate-pulse" /></div>
          <div className="h-8 w-10 bg-gray-100 rounded-md flex items-center justify-center"><div className="w-3 h-3 bg-gray-200 rounded-sm animate-pulse" /></div>
          <div className="flex-1" />
          {/* Profile skeleton */}
          <div className="h-8 w-8 bg-indigo-100 rounded-full flex items-center justify-center"><div className="w-4 h-4 border-2 border-indigo-300 border-t-indigo-500 rounded-full animate-spin" /></div>
        </div>
        {/* Sidebar content */}
        <div className="p-4 space-y-4 overflow-hidden">
          <div className="h-10 w-full bg-blue-50/50 border border-blue-100 rounded-lg flex items-center justify-center">
             <div className="h-2 w-24 bg-blue-200 rounded-full animate-pulse" />
          </div>
          
          <div className="space-y-3">
             <div className="h-11 w-full border border-slate-200 bg-white shadow-sm rounded-lg flex items-center px-3 justify-between">
               <div className="h-2 w-16 bg-slate-200 rounded-full animate-pulse" />
               <div className="w-4 h-4 bg-slate-200 rounded-full animate-pulse" />
             </div>
             <div className="h-11 w-full border border-slate-200 bg-white shadow-sm rounded-lg flex items-center px-3 justify-between">
               <div className="h-2 w-20 bg-slate-200 rounded-full animate-pulse" />
               <div className="w-4 h-4 bg-slate-200 rounded-full animate-pulse" />
             </div>
             <div className="h-11 w-full border border-slate-200 bg-white shadow-sm rounded-lg flex items-center px-3 justify-between">
               <div className="h-2 w-16 bg-slate-200 rounded-full animate-pulse" />
               <div className="w-4 h-4 bg-slate-200 rounded-full animate-pulse" />
             </div>
          </div>
        </div>
      </div>
    </>
  );
}
