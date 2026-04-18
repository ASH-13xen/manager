"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type TopicSummary = {
  logs: any;
  _id: string;
  title: string;
  isCompleted: boolean;
};

type Preparation = {
  _id: string;
  title: string;
  type: string;
  roadmap: TopicSummary[];
};

export default function PreparationsPage() {
  const [preparations, setPreparations] = useState<Preparation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [type, setType] = useState("core cse");
  const [topics, setTopics] = useState<string[]>([""]);

  const fetchPreparations = async () => {
    try {
      const res = await fetch("/api/preparations");
      const json = await res.json();
      if (json.success) setPreparations(json.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPreparations();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    const filteredTopics = topics.filter((t) => t.trim() !== "");
    if (filteredTopics.length === 0) {
      alert("Please add at least one topic to the roadmap");
      return;
    }

    try {
      const res = await fetch("/api/preparations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, type, roadmap: filteredTopics }),
      });
      const data = await res.json();
      if (data.success) {
        setIsModalOpen(false);
        setTitle("");
        setTopics([""]);
        fetchPreparations();
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Delete this subject?")) return;
    await fetch(`/api/preparations/${id}`, { method: "DELETE" });
    fetchPreparations();
  };

  // Activity Heatmap Logic
  const activityMap: Record<string, number> = {};
  preparations.forEach((p) => {
    p.roadmap?.forEach((t) => {
      t.logs?.forEach((log: { createdAt: string | number | Date; }) => {
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
    if (count === 0) return "bg-neutral-900"; 
    if (count < 2) return "bg-[#0e4429]"; 
    if (count < 4) return "bg-[#006d32]";
    if (count < 6) return "bg-[#26a641]";
    return "bg-[#39d353]";
  };

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-50 p-8 sm:p-12 relative">
      <div className="max-w-6xl mx-auto space-y-8">
        <Link href="/" className="text-neutral-500 hover:text-neutral-300 text-sm inline-flex items-center gap-2 transition-colors">
          ← Back to Dashboard
        </Link>
        <div className="flex justify-between items-center bg-neutral-900 border border-neutral-800 p-6 rounded-2xl shadow-xl">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">Study Center</h1>
            <p className="text-neutral-400">Initialize and track your subject roadmaps</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 transition-colors rounded-xl font-semibold text-sm shadow-lg shadow-emerald-500/20"
          >
            + New Subject
          </button>
        </div>

        {!loading && preparations.length > 0 && (
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
                <p className="text-xs text-neutral-500 mt-1">Updates across all study branches</p>
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
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
          </div>
        ) : preparations.length === 0 ? (
          <div className="text-center py-20 bg-neutral-900/50 border border-neutral-800 rounded-2xl border-dashed">
            <p className="text-neutral-400 mb-4">No active subjects tracked.</p>
            <button onClick={() => setIsModalOpen(true)} className="text-emerald-400 hover:text-emerald-300 underline">Initialize one now</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {preparations.map((prep) => {
              const completedCount = prep.roadmap.filter(t => t.isCompleted).length;
              const totalCount = prep.roadmap.length;
              const progress = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

              return (
                <Link key={prep._id} href={`/preparations/${prep._id}`} className="group block">
                  <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 h-full flex flex-col hover:border-emerald-500/50 transition-colors relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-neutral-800">
                      <div className="h-full bg-emerald-500 transition-all" style={{ width: `${progress}%` }}></div>
                    </div>
                    
                    <div className="flex justify-between items-start mb-4 mt-2">
                      <h2 className="text-xl font-bold group-hover:text-emerald-400 transition-colors">{prep.title}</h2>
                      <span className="text-xs font-mono px-2 py-1 bg-neutral-800 text-neutral-400 rounded-md uppercase tracking-wider">{prep.type}</span>
                    </div>

                    <p className="text-sm text-neutral-400 mb-6 flex-1">
                      {completedCount} of {totalCount} topics conquered
                    </p>

                    <div className="flex justify-between items-center pt-4 border-t border-neutral-800">
                      <span className="text-emerald-500 text-sm font-medium">Enter Roadmap →</span>
                      <button
                        onClick={(e) => handleDelete(prep._id, e)}
                        className="text-red-400 hover:text-red-300 text-xs px-2 py-1 bg-red-500/10 hover:bg-red-500/20 rounded transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 w-full max-w-lg shadow-2xl relative my-8">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-6 right-6 text-neutral-400 hover:text-white"
            >
              ✕
            </button>
            <h2 className="text-2xl font-bold mb-6 text-white">Initialize Roadmap</h2>
            <form onSubmit={handleCreate} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-300">Subject Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="E.g. Computer Networks"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-300">Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 appearance-none"
                >
                  <option value="core cse">Core CSE</option>
                  <option value="skill-based">Skill-Based</option>
                </select>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium text-neutral-300 flex justify-between">
                  <span>Topics Roadmap (In Order)</span>
                </label>
                <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                  {topics.map((t, idx) => (
                    <div key={idx} className="flex gap-2">
                      <div className="flex items-center justify-center w-8 h-10 border border-neutral-800 rounded-lg bg-neutral-950 text-neutral-500 text-xs font-mono shrink-0">
                        {idx + 1}
                      </div>
                      <input
                        type="text"
                        value={t}
                        onChange={(e) => {
                          const newT = [...topics];
                          newT[idx] = e.target.value;
                          setTopics(newT);
                        }}
                        placeholder={`Topic ${idx + 1}`}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (topics.length > 1) {
                            setTopics(topics.filter((_, i) => i !== idx));
                          }
                        }}
                        className="text-red-400 hover:text-red-300 px-3 py-2 bg-red-500/10 rounded-lg text-sm shrink-0"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setTopics([...topics, ""])}
                  className="text-sm text-emerald-400 hover:text-emerald-300 font-medium"
                >
                  + Add Topic
                </button>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/25 transition-all"
              >
                Generate Subject
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
