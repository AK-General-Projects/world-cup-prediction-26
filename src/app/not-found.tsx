import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center px-6">
        <div className="text-4xl mb-4">🔍</div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Page not found</h2>
        <p className="text-sm text-gray-500 mb-6">
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link
          href="/dashboard"
          className="text-sm text-green-600 hover:text-green-700 font-medium transition-colors"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
