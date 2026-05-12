export default function LandingLoading() {
  return (
    <div className="flex h-screen w-screen bg-gradient-to-b from-indigo-50/50 via-white to-slate-50 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-24 -left-24 w-[420px] h-[420px] rounded-full bg-indigo-500/10 blur-[100px]" />
        <div className="absolute top-1/3 right-0 w-[350px] h-[350px] rounded-full bg-purple-500/10 blur-[100px]" />
      </div>

      {/* Left sidebar skeleton */}
      <div className="w-[320px] bg-white border-r border-gray-200 shadow-xl flex flex-col z-10 flex-shrink-0">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4">
          <div className="h-4 w-36 bg-white/30 rounded mx-auto mb-3 animate-pulse" />
          <div className="flex gap-2">
            <div className="h-8 w-16 bg-white/20 rounded-lg animate-pulse" />
            <div className="h-8 w-16 bg-white/20 rounded-lg animate-pulse" />
            <div className="flex-1" />
            <div className="h-8 w-8 bg-white/20 rounded-lg animate-pulse" />
          </div>
        </div>
        {/* Chat input skeleton */}
        <div className="p-3 border-b">
          <div className="h-10 w-full bg-gray-100 rounded-xl animate-pulse" />
        </div>
        {/* Message skeletons */}
        <div className="flex-1 p-3 space-y-3">
          <div className="flex items-start gap-2">
            <div className="h-7 w-7 bg-gray-200/60 rounded-full animate-pulse flex-shrink-0" />
            <div className="space-y-1.5 flex-1">
              <div className="h-3 w-full bg-gray-200/50 rounded animate-pulse" />
              <div className="h-3 w-3/4 bg-gray-200/40 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      {/* Main area skeleton */}
      <div className="flex-1 flex items-center justify-center z-10 p-12">
        <div className="w-full max-w-2xl space-y-6">
          <div className="h-6 w-48 bg-gray-200/50 rounded mx-auto animate-pulse" />
          <div className="h-4 w-72 bg-gray-200/40 rounded mx-auto animate-pulse" />
          <div className="grid grid-cols-2 gap-3 mt-8">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-24 bg-white rounded-xl border border-gray-200/60 shadow-sm animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
