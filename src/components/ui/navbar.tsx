import { auth } from "@/auth";
import Link from "next/link";
import SignOutButton from "./sign-out-button";

export default async function Navbar() {
  const session = await auth();
  const user = session?.user;

  return (
    <nav className="bg-gray-900 border-b border-gray-800 px-6 py-3 flex items-center justify-between">
      <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
        <span className="text-lg">⚽</span>
        <span className="text-white font-semibold text-sm">World Cup 2026</span>
      </Link>
      <div className="flex items-center gap-4">
        {user && (
          <>
            <Link href="/leaderboard" className="text-sm text-gray-400 hover:text-white transition-colors">
              Leaderboard
            </Link>
            <span className="text-sm text-gray-300">{user.name}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              user.role === "admin"
                ? "bg-yellow-500/20 text-yellow-400"
                : "bg-green-500/20 text-green-400"
            }`}>
              {user.role}
            </span>
            <SignOutButton />
          </>
        )}
      </div>
    </nav>
  );
}
