export default function EditorLoading() {
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Left sidebar skeleton */}
      <div className="w-[280px] bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
        <div className="p-3 border-b flex items-center gap-2">
          <div className="h-8 w-24 bg-blue-100/60 rounded-lg animate-pulse" />
          <div className="flex-1" />
          <div className="h-8 w-8 bg-gray-200/60 rounded-full animate-pulse" />
        </div>
        <div className="p-2 space-y-1">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="h-9 w-full bg-gray-100/70 rounded-md animate-pulse" style={{ animationDelay: `${i * 60}ms` }} />
          ))}
        </div>
        <div className="flex-1" />
      </div>

      {/* Center chart area */}
      <div className="flex-1 p-4 flex flex-col min-w-0">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-8 w-28 bg-gray-200/60 rounded-lg animate-pulse" />
          <div className="h-8 w-20 bg-gray-200/50 rounded-lg animate-pulse" />
          <div className="flex-1" />
          <div className="h-8 w-8 bg-gray-200/50 rounded animate-pulse" />
          <div className="h-8 w-8 bg-gray-200/50 rounded animate-pulse" />
        </div>
        <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col">
          <div className="h-5 w-36 bg-gray-200/50 rounded mx-auto mb-6 animate-pulse" />
          <div className="flex-1 flex items-end justify-center gap-3 px-6 pb-6">
            {[60, 80, 40, 65, 50, 85, 35].map((h, i) => (
              <div
                key={i}
                className="bg-gradient-to-t from-gray-200/70 to-gray-100/50 rounded-t-md animate-pulse"
                style={{ width: '10%', height: `${h}%`, animationDelay: `${i * 80}ms` }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Right panel skeleton */}
      <div className="w-[280px] bg-white border-l border-gray-200 flex flex-col flex-shrink-0">
        <div className="p-2.5 border-b bg-gray-50/50 flex items-center gap-2">
          <div className="h-8 w-8 bg-gray-200/60 rounded animate-pulse" />
          <div className="h-8 w-10 bg-blue-200/50 rounded animate-pulse" />
          <div className="h-8 w-10 bg-gray-200/50 rounded animate-pulse" />
          <div className="flex-1" />
          <div className="h-8 w-8 bg-gray-200/50 rounded-full animate-pulse" />
        </div>
        <div className="p-3 space-y-3">
          <div className="h-9 w-full bg-blue-100/50 rounded-lg animate-pulse" />
          <div className="h-9 w-full bg-purple-100/40 rounded-lg animate-pulse" />
          <div className="flex gap-1">
            <div className="h-8 flex-1 bg-gray-200/60 rounded-md animate-pulse" />
            <div className="h-8 flex-1 bg-gray-200/40 rounded-md animate-pulse" />
            <div className="h-8 flex-1 bg-gray-200/40 rounded-md animate-pulse" />
          </div>
          <div className="h-32 w-full bg-gray-100/60 rounded-lg border border-gray-200/50 animate-pulse" />
          <div className="h-32 w-full bg-gray-100/40 rounded-lg border border-gray-200/40 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
