"use client";

import { useEffect, useState, use } from "react";
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
  logs: WorkLog[];
};

type Project = {
  _id: string;
  title: string;
  description: string;
  type: string;
  imageUrl?: string;
  versions: Version[];
};

export default function ProjectDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("");

  // Form states
  const [logText, setLogText] = useState("");
  const [logFile, setLogFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchProject = async () => {
    try {
      const res = await fetch(`/api/projects/${id}`);
      const json = await res.json();
      if (json.success) {
        setProject(json.data);
        if (!activeTab && json.data.versions.length > 0) {
          // Default to the latest (active) version
          setActiveTab(json.data.versions[json.data.versions.length - 1]._id);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProject();
  }, [id]);

  const handleLogSubmit = async (e: React.FormEvent, versionId: string) => {
    e.preventDefault();
    if (!logText.trim()) return;
    
    setSubmitting(true);
    const formData = new FormData();
    formData.append("versionId", versionId);
    formData.append("text", logText);
    if (logFile) formData.append("file", logFile);

    try {
      const res = await fetch(`/api/projects/${id}/logs`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setLogText("");
        setLogFile(null);
        fetchProject(); // refresh data
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to add work log");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-neutral-950 flex justify-center p-20">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
    </div>
  );

  if (!project) return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50 flex items-center justify-center">
      Project not found.
    </div>
  );

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-50 p-8 sm:p-12">
      <div className="max-w-5xl mx-auto">
        <Link href="/projects" className="text-neutral-500 hover:text-neutral-300 text-sm inline-flex items-center gap-2 mb-6 transition-colors">
          ← Back to Matrix
        </Link>
        
        {/* Header Block */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 mb-8 relative overflow-hidden">
          {project.imageUrl && (
            <div className="absolute inset-0 opacity-10 blur-xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={project.imageUrl} alt="" className="w-full h-full object-cover" />
            </div>
          )}
          <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-4">
              <span className="px-3 py-1 bg-neutral-800 text-neutral-300 text-xs font-mono uppercase tracking-widest rounded-lg border border-neutral-700">
                {project.type}
              </span>
              <h1 className="text-4xl md:text-5xl font-bold">{project.title}</h1>
              {project.description && <p className="text-neutral-400 max-w-2xl">{project.description}</p>}
            </div>
            {project.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={project.imageUrl} alt={project.title} className="w-32 h-32 rounded-2xl object-cover border-4 border-neutral-800" />
            )}
          </div>
        </div>

        {/* Versions Timeline Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1 space-y-2">
            <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-widest mb-4">Branches</h3>
            {[...project.versions].reverse().map((v) => (
              <button
                key={v._id}
                onClick={() => setActiveTab(v._id)}
                className={`w-full text-left px-4 py-3 rounded-xl border flex flex-col items-start transition-all ${
                  activeTab === v._id 
                  ? "bg-blue-500/10 border-blue-500/30 text-blue-400" 
                  : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:bg-neutral-800"
                }`}
              >
                <div className="flex justify-between w-full items-center">
                  <span className="font-bold">v{v.version}</span>
                  {v.isCompleted && <span className="w-2 h-2 rounded-full bg-emerald-500"></span>}
                </div>
                <span className="text-xs opacity-60 mt-1">
                  {v.isCompleted ? "Completed" : "Active"}
                </span>
              </button>
            ))}
          </div>

          <div className="md:col-span-3">
            {project.versions.map((v) => {
              if (v._id !== activeTab) return null;
              
              const logs = v.logs || [];
              const sortedLogs = [...logs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

              return (
                <div key={v._id} className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8">
                  <div className="flex items-center justify-between mb-8 pb-4 border-b border-neutral-800">
                    <div>
                      <h2 className="text-2xl font-bold flex items-center gap-3">
                        Version {v.version} Timeline
                        {v.isCompleted && (
                          <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs px-2 py-1 rounded-full uppercase tracking-wider font-semibold">
                            Merged
                          </span>
                        )}
                      </h2>
                      <p className="text-neutral-500 text-sm mt-1">
                        Initiated on {new Date(v.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {!v.isCompleted && (
                    <div className="mb-10 bg-neutral-950 p-6 rounded-2xl border border-neutral-800 shadow-inner">
                      <h3 className="text-sm font-semibold text-neutral-300 mb-4 flex items-center gap-2">
                        <span className="text-blue-500">+</span> Add Work Update
                      </h3>
                      <form onSubmit={(e) => handleLogSubmit(e, v._id)} className="space-y-4">
                        <textarea
                          required
                          value={logText}
                          onChange={(e) => setLogText(e.target.value)}
                          placeholder="What did you implement or study today?"
                          className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-none min-h-[100px]"
                        ></textarea>
                        
                        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                          <input
                            type="file"
                            onChange={(e) => setLogFile(e.target.files?.[0] || null)}
                            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                            className="w-full md:w-auto bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-blue-500 file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-500/10 file:text-blue-400 hover:file:bg-blue-500/20 file:transition-colors file:cursor-pointer"
                          />
                          <button
                            type="submit"
                            disabled={submitting}
                            className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-lg shadow-blue-500/25 transition-all outline-none disabled:opacity-50"
                          >
                            {submitting ? "Pushing..." : "Commit Update"}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  <div className="space-y-6">
                    {sortedLogs.length === 0 ? (
                      <p className="text-center text-neutral-500 py-10 bg-neutral-950/50 rounded-2xl border border-neutral-800 border-dashed">
                        No work logs committed to this branch yet.
                      </p>
                    ) : (
                      sortedLogs.map((log) => (
                        <div key={log._id} className="flex gap-4 relative">
                          <div className="w-12 h-12 shrink-0 bg-neutral-950 rounded-full border border-neutral-800 flex items-center justify-center text-neutral-500 font-mono text-xs z-10">
                            {new Date(log.createdAt).getDate()}
                          </div>
                          
                          <div className="absolute top-12 left-6 bottom-[-24px] w-[1px] bg-neutral-800 last-of-type:hidden"></div>

                          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-5 flex-1 space-y-3 shadow-sm">
                            <div className="flex justify-between items-start">
                              <p className="text-xs text-neutral-500 font-mono">
                                {new Date(log.createdAt).toLocaleString()}
                              </p>
                            </div>
                            <p className="text-neutral-300 text-sm whitespace-pre-wrap leading-relaxed">
                              {log.text}
                            </p>
                            {log.fileUrl && (
                              <a
                                href={log.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-3 py-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-lg text-sm transition-colors border border-blue-500/20"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
                                {log.fileName || 'Attached Document'}
                              </a>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}
