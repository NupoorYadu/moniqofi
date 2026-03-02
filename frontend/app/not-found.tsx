import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <h1 className="text-8xl font-black text-[#E50914] mb-2">404</h1>
        <h2 className="text-2xl font-bold text-white mb-3">Page Not Found</h2>
        <p className="text-gray-500 text-sm mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/dashboard"
          className="inline-block px-8 py-3.5 rounded-xl font-semibold text-white bg-gradient-to-r from-[#E50914] to-[#B20710] hover:from-[#ff1a25] hover:to-[#E50914] transition-all shadow-lg shadow-[#E50914]/20"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
