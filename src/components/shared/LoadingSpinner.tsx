export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="relative w-20 h-20">
        <div className="absolute top-0 left-0 w-full h-full border-4 border-[#FF7D00] border-t-transparent rounded-full animate-spin"></div>
        <div className="absolute top-2 left-2 right-2 bottom-2 border-4 border-[#FA9721] border-b-transparent rounded-full animate-spin animation-delay-150"></div>
        <div className="absolute top-4 left-4 right-4 bottom-4 border-4 border-[#062F3D] border-l-transparent rounded-full animate-spin animation-delay-300"></div>
      </div>
    </div>
  );
}
