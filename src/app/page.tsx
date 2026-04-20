"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FolderKanban, BookOpenCheck, Wallet } from "lucide-react";

export default function Home() {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-50 flex flex-col items-center justify-center p-8">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-900 via-neutral-950 to-neutral-950 -z-10"></div>
      
      <div className="absolute top-8 right-8">
        <button onClick={handleLogout} className="text-xs px-4 py-2 bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white rounded-lg transition-colors">
          Sign Out
        </button>
      </div>

      <div className="max-w-4xl w-full text-center mb-16 space-y-4">
        <h1 className="text-5xl md:text-7xl font-bold tracking-tighter bg-gradient-to-br from-white to-neutral-500 bg-clip-text text-transparent">
          Command Center
        </h1>
        <p className="text-neutral-400 text-lg md:text-xl max-w-2xl mx-auto">
          Track your personal projects, collaborate on client work, and manage your study materials all in one dynamic workspace.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl">
        <Link href="/projects" className="group relative block">
          <div className="absolute -inset-[1px] bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative h-full bg-neutral-900 border border-neutral-800 rounded-2xl p-8 flex flex-col items-center justify-center space-y-6 hover:bg-neutral-800/80 transition-colors">
            <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <FolderKanban className="w-8 h-8 text-blue-500" />
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold tracking-tight">Projects</h2>
              <p className="text-neutral-400 text-sm">
                Deploy, manage, and iterate on your personal, client, and hackathon projects.
              </p>
            </div>
          </div>
        </Link>

        <Link href="/preparations" className="group relative block">
          <div className="absolute -inset-[1px] bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative h-full bg-neutral-900 border border-neutral-800 rounded-2xl p-8 flex flex-col items-center justify-center space-y-6 hover:bg-neutral-800/80 transition-colors">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <BookOpenCheck className="w-8 h-8 text-emerald-500" />
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold tracking-tight">Preparations</h2>
              <p className="text-neutral-400 text-sm">
                Organize study materials, notes, and progress for college or internship preparation.
              </p>
            </div>
          </div>
        </Link>

        <Link href="/money" className="group relative block">
          <div className="absolute -inset-[1px] bg-gradient-to-r from-yellow-500 to-amber-500 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative h-full bg-neutral-900 border border-neutral-800 rounded-2xl p-8 flex flex-col items-center justify-center space-y-6 hover:bg-neutral-800/80 transition-colors">
            <div className="w-16 h-16 rounded-full bg-yellow-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Wallet className="w-8 h-8 text-yellow-500" />
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold tracking-tight">Money</h2>
              <p className="text-neutral-400 text-sm">
                Track personal expenses, manage spending categories, and log transactions dynamically.
              </p>
            </div>
          </div>
        </Link>
      </div>
    </main>
  );
}
