"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type WorkLog = {
  _id: string;
  text: string;
  fileUrl?: string;
  fileName?: string;
  createdAt: string;
};

type Version = {
  _id: string;
  version: string;
  isCompleted: boolean;
  createdAt: string;
  completedAt?: string;
  logs?: WorkLog[];
};

type Project = {
  _id: string;
  title: string;
  description: string;
  type: string;
  imageUrl?: string;
  versions: Version[];
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [newVersionInput, setNewVersionInput] = useState<{ [key: string]: string }>({});
  const [showNewVersionInput, setShowNewVersionInput] = useState<{ [key: string]: boolean }>({});

  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/projects");
      const json = await res.json();
      if (json.success) setProjects(json.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this project?")) return;
    await fetch(`/api/projects/${id}`, { method: "DELETE" });
    fetchProjects();
  };

  const markComplete = async (projectId: string, versionId: string) => {
    await fetch(`/api/projects/${projectId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "mark_completed", versionId }),
    });
    fetchProjects();
  };

  const createNewVersion = async (projectId: string) => {
    const version = newVersionInput[projectId];
    if (!version) return alert("Please enter a version name");

    await fetch(`/api/projects/${projectId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "new_version", newVersionName: version }),
    });
    setNewVersionInput((prev) => ({ ...prev, [projectId]: "" }));
    setShowNewVersionInput((prev) => ({ ...prev, [projectId]: false }));
    fetchProjects();
  };

  // Activity Heatmap Logic
  const activityMap: Record<string, number> = {};
  projects.forEach((p) => {
    p.versions?.forEach((v) => {
      v.logs?.forEach((log) => {
        if (!log.createdAt) return;
        const dateString = new Date(log.createdAt).toISOString().split("T")[0];
        activityMap[dateString] = (activityMap[dateString] || 0) + 1;
      });
    });
  });

  const daysToShow = 365;
  const daysArray = [];
  const today = new Date();
  for (let i = daysToShow - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    daysArray.push(d.toISOString().split("T")[0]);
  }

  const [hoveredCell, setHoveredCell] = useState<string | null>(null);

  const getHeatmapColor = (count: number) => {
    if (count === 0) return "bg-neutral-900"; // Lighter contrast against neutral-950/900
    if (count < 2) return "bg-[#0e4429]"; // GitHub shades
    if (count < 4) return "bg-[#006d32]";
    if (count < 6) return "bg-[#26a641]";
    return "bg-[#39d353]";
  };

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-50 p-8 sm:p-12">
      <div className="max-w-6xl mx-auto space-y-8">
        <Link href="/" className="text-neutral-500 hover:text-neutral-300 text-sm inline-flex items-center gap-2 transition-colors">
          ← Back to Dashboard
        </Link>
        
        <div className="flex justify-between items-center bg-neutral-900 border border-neutral-800 p-6 rounded-2xl shadow-xl">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">Project Matrix</h1>
            <p className="text-neutral-400">Manage your deployments and iterations</p>
          </div>
          <Link
            href="/projects/create"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 transition-colors rounded-xl font-semibold text-sm shadow-lg shadow-blue-500/20"
          >
            + Deploy Project
          </Link>
        </div>

        {!loading && projects.length > 0 && (
          <div className="bg-neutral-900/50 border border-neutral-800 p-6 rounded-2xl shadow-xl">
            <div className="flex justify-between items-start mb-6">
              <div>
                <div className="flex items-center gap-4">
                  <h3 className="font-semibold text-lg">Contribution Activity</h3>
                  <div className="h-5 flex items-center">
                    {hoveredCell && (
                      <span className="text-sm font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                        {hoveredCell}
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-xs text-neutral-500 mt-1">Updates across all matrix branches</p>
              </div>
            </div>
            
            <div className="overflow-x-auto pb-4 custom-scrollbar" onMouseLeave={() => setHoveredCell(null)}>
              <div className="grid grid-rows-7 grid-flow-col gap-[3px] min-w-max">
                {daysArray.map((dateStr) => {
                  const count = activityMap[dateStr] || 0;
                  return (
                    <div 
                      key={dateStr}
                      onMouseEnter={() => setHoveredCell(`${count === 0 ? "No" : count} commits on ${dateStr}`)}
                      className={`w-[11px] h-[11px] rounded-[2px] ${getHeatmapColor(count)} hover:ring-1 hover:ring-neutral-400 transition-all cursor-crosshair`}
                    />
                  );
                })}
              </div>
            </div>
            <div className="flex items-center gap-2 mt-2 text-xs text-neutral-500 justify-end w-full">
              <span>Less</span>
              <div className="w-[11px] h-[11px] rounded-[2px] bg-neutral-900"></div>
              <div className="w-[11px] h-[11px] rounded-[2px] bg-[#0e4429]"></div>
              <div className="w-[11px] h-[11px] rounded-[2px] bg-[#006d32]"></div>
              <div className="w-[11px] h-[11px] rounded-[2px] bg-[#26a641]"></div>
              <div className="w-[11px] h-[11px] rounded-[2px] bg-[#39d353]"></div>
              <span>More</span>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center p-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-20 bg-neutral-900/50 border border-neutral-800 rounded-2xl border-dashed">
            <p className="text-neutral-400 mb-4">No active projects found.</p>
            <Link href="/projects/create" className="text-blue-400 hover:text-blue-300 underline">Initialize one now</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((p) => {
              const currentVersion = p.versions[p.versions.length - 1];
              const isShowingInput = showNewVersionInput[p._id];

              return (
                <div key={p._id} className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden flex flex-col group">
                  {p.imageUrl ? (
                    <div className="h-40 w-full relative border-b border-neutral-800 bg-neutral-800 flex items-center justify-center overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.imageUrl} alt={p.title} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500" />
                    </div>
                  ) : (
                    <div className="h-40 w-full bg-neutral-800 border-b border-neutral-800 flex items-center justify-center">
                      <span className="text-neutral-600 font-mono text-sm">&lt;No Header Image /&gt;</span>
                    </div>
                  )}

                  <div className="p-6 flex-1 flex flex-col space-y-4">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <Link href={`/projects/${p._id}`} className="text-xl font-bold line-clamp-1 hover:text-blue-400 transition-colors">
                          {p.title}
                        </Link>
                        <span className="text-xs font-mono px-2 py-1 bg-neutral-800 text-neutral-400 rounded-md uppercase tracking-wider">{p.type}</span>
                      </div>
                      <p className="text-sm text-neutral-400 line-clamp-2">{p.description}</p>
                    </div>

                    <div className="mt-auto space-y-4">
                      {/* Version Control Area */}
                      <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-neutral-500 uppercase font-bold tracking-wider">Current Branch</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${currentVersion?.isCompleted ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"}`}>
                            v{currentVersion?.version} {currentVersion?.isCompleted && "(Completed)"}
                          </span>
                        </div>

                        {currentVersion && !currentVersion.isCompleted ? (
                          <button
                            onClick={() => markComplete(p._id, currentVersion._id)}
                            className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 text-sm font-medium rounded-lg transition-colors border border-neutral-700 hover:border-neutral-600"
                          >
                            Mark Completed
                          </button>
                        ) : (
                          <div className="space-y-2">
                            {!isShowingInput ? (
                              <button
                                onClick={() => setShowNewVersionInput((prev) => ({ ...prev, [p._id]: true }))}
                                className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 text-sm font-medium rounded-lg transition-colors border border-neutral-700 hover:border-neutral-600 text-neutral-300"
                              >
                                + Add New Version
                              </button>
                            ) : (
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={newVersionInput[p._id] || ""}
                                  onChange={(e) => setNewVersionInput({ ...newVersionInput, [p._id]: e.target.value })}
                                  placeholder="E.g. 2.0"
                                  className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                />
                                <button
                                  onClick={() => createNewVersion(p._id)}
                                  className="px-3 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors"
                                >
                                  Deploy
                                </button>
                                <button
                                  onClick={() => setShowNewVersionInput((prev) => ({ ...prev, [p._id]: false }))}
                                  className="px-2 text-neutral-400 hover:text-white"
                                >
                                  ✕
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 pt-2 border-t border-neutral-800">
                        <Link
                          href={`/projects/${p._id}`}
                          className="flex-[2] flex items-center justify-center py-2 text-sm font-medium text-blue-400 hover:text-white bg-blue-500/10 hover:bg-blue-500/20 rounded-lg transition-colors"
                        >
                          View Timeline
                        </Link>
                        <button
                          onClick={() => handleDelete(p._id)}
                          className="flex-[1] py-2 text-sm font-medium text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors"
                        >
                          Destroy
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
