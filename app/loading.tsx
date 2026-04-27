export default function RootLoading() {
  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-[#FAFAFA]">
      <div className="flex flex-col items-center gap-6">
        <div className="relative h-10 w-10">
          <div className="absolute inset-0 rounded-full border-[3px] border-gray-100" />
          <div className="absolute inset-0 rounded-full border-[3px] border-blue-600 border-r-transparent border-t-transparent animate-spin" />
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <h3 className="text-base font-semibold text-gray-900 tracking-tight">Starting Platform</h3>
          <p className="text-sm font-medium text-gray-500 animate-pulse">Authenticating...</p>
        </div>
      </div>
    </div>
  );
}
