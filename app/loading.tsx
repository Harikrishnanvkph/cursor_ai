export default function RootLoading() {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-gray-50">
      <div className="flex items-center gap-3 rounded-md bg-white px-5 py-3 shadow-lg border border-gray-200">
        <div className="h-6 w-6 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
        <span className="text-sm font-semibold text-gray-800">Loading…</span>
      </div>
    </div>
  )
}


