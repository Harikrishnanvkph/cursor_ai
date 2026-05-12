export default function RootLoading() {
  return (
    <div className="flex h-screen w-screen bg-[#FAFAFA] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="relative h-8 w-8">
          <div className="absolute inset-0 rounded-full border-[2.5px] border-gray-100" />
          <div className="absolute inset-0 rounded-full border-[2.5px] border-blue-500/50 border-r-transparent border-t-transparent animate-spin" />
        </div>
      </div>
    </div>
  );
}
