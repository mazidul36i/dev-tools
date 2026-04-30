export default function BackgroundBlobs() {
  return (
    <>
      {/* Light mode background gradient blobs */}
      <div className="absolute inset-0 pointer-events-none dark:hidden">
        <div className="absolute -top-32 -left-32 w-175 h-175 rounded-full bg-[#fcd5c8]/60 blur-[120px]" />
        <div className="absolute top-0 right-0 w-150 h-150 rounded-full bg-[#c9d6f5]/50 blur-[120px]" />
        <div className="absolute top-1/3 left-1/3 w-125 h-125 rounded-full bg-[#e8d5f0]/40 blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-150 h-125 rounded-full bg-[#f0e0d0]/50 blur-[100px]" />
        <div className="absolute bottom-0 right-1/4 w-125 h-100 rounded-full bg-[#d5dff5]/40 blur-[100px]" />
      </div>
      {/* Dark mode background */}
      <div className="absolute inset-0 pointer-events-none hidden dark:block">
        <div className="absolute -top-32 -left-32 w-125 h-125 rounded-full bg-indigo-950/30 blur-[120px]" />
        <div className="absolute top-0 right-0 w-100 h-100 rounded-full bg-purple-950/20 blur-[120px]" />
      </div>
    </>
  );
}

