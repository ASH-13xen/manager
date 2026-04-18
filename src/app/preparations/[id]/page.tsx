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

type Topic = {
  _id: string;
  title: string;
  isCompleted: boolean;
  createdAt: string;
  completedAt?: string;
  logs: WorkLog[];
};

type Question = {
  _id: string;
  questionText: string;
  tags: string[];
  answerText?: string;
  answerFileUrl?: string;
  answerFileName?: string;
  createdAt: string;
};

type Preparation = {
  _id: string;
  title: string;
  type: string;
  roadmap: Topic[];
  questions?: Question[];
};

export default function PreparationNodesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [prep, setPrep] = useState<Preparation | null>(null);
  const [loading, setLoading] = useState(true);
  
  // UI States
  const [activeTab, setActiveTab] = useState<'roadmap'|'questions'>('roadmap');
  
  // Roadmap States
  const [activeTopicId, setActiveTopicId] = useState<string | null>(null);
  const [isEditingRoadmap, setIsEditingRoadmap] = useState(false);
  const [editTopics, setEditTopics] = useState<Topic[]>([]);
  const [logText, setLogText] = useState("");
  const [logFile, setLogFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Question States
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [qText, setQText] = useState("");
  const [qTags, setQTags] = useState<string[]>([]);
  const [qAnswerText, setQAnswerText] = useState("");
  const [qFile, setQFile] = useState<File | null>(null);
  const [qSubmitting, setQSubmitting] = useState(false);
  const [expandedQId, setExpandedQId] = useState<string | null>(null);

  const fetchPrep = async () => {
    try {
      const res = await fetch(`/api/preparations/${id}`);
      const json = await res.json();
      if (json.success) {
        setPrep(json.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPrep(); }, [id]);

  const handleLogSubmit = async (e: React.FormEvent, topicId: string) => {
    e.preventDefault();
    if (!logText.trim()) return;
    
    setSubmitting(true);
    const formData = new FormData();
    formData.append("text", logText);
    if (logFile) formData.append("file", logFile);

    try {
      const res = await fetch(`/api/preparations/${id}/topics/${topicId}/logs`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setLogText("");
        setLogFile(null);
        fetchPrep();
      } else alert(data.error);
    } catch (err) {
      alert("Failed to add work log");
    } finally {
      setSubmitting(false);
    }
  };

  const markCompleted = async (topicId: string) => {
    try {
      const res = await fetch(`/api/preparations/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_completed", topicId }),
      });
      if (res.ok) fetchPrep();
    } catch (err) {}
  };

  const saveRoadmapEdits = async () => {
    try {
      const filtered = editTopics.filter(t => t.title.trim() !== "");
      if (filtered.length === 0) return alert("Must have at least 1 topic");
      
      await fetch(`/api/preparations/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update_roadmap", roadmap: filtered }),
      });
      setIsEditingRoadmap(false);
      fetchPrep();
    } catch (err) {}
  };

  const handleQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qText.trim()) return;
    setQSubmitting(true);
    const formData = new FormData();
    formData.append("questionText", qText);
    formData.append("tags", JSON.stringify(qTags));
    formData.append("answerText", qAnswerText);
    if (qFile) formData.append("file", qFile);

    const url = editingQuestionId 
      ? `/api/preparations/${id}/questions/${editingQuestionId}`
      : `/api/preparations/${id}/questions`;

    try {
      const res = await fetch(url, {
        method: editingQuestionId ? "PUT" : "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        resetQForm();
        fetchPrep();
      } else alert(data.error);
    } catch (err) {
      alert("Failed to save question");
    } finally {
      setQSubmitting(false);
    }
  };

  const deleteQuestion = async (qId: string) => {
    if (!confirm("Delete this question?")) return;
    try {
      const res = await fetch(`/api/preparations/${id}/questions/${qId}`, { method: "DELETE" });
      if (res.ok) fetchPrep();
    } catch (err) {}
  };

  const resetQForm = () => {
    setQText("");
    setQTags([]);
    setQAnswerText("");
    setQFile(null);
    setShowQuestionForm(false);
    setEditingQuestionId(null);
  };

  const openEditQForm = (q: Question) => {
    setQText(q.questionText);
    setQTags(q.tags || []);
    setQAnswerText(q.answerText || "");
    setQFile(null);
    setEditingQuestionId(q._id);
    setShowQuestionForm(true);
  };

  const toggleTag = (tag: string) => {
    setQTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  if (loading) return (
    <div className="min-h-screen bg-neutral-950 flex justify-center p-20">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
    </div>
  );
  if (!prep) return <div className="min-h-screen bg-neutral-950 text-white p-20">Not found</div>;

  const topics = prep.roadmap;
  const questions = prep.questions || [];

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-50 p-8 sm:p-12">
      <div className="max-w-4xl mx-auto space-y-8">
        <Link href="/preparations" className="text-neutral-500 hover:text-neutral-300 text-sm inline-flex items-center gap-2 transition-colors">
          ← Back to Subjects
        </Link>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-neutral-900 border border-neutral-800 rounded-3xl p-8 shadow-xl">
          <div>
            <span className="px-3 py-1 bg-neutral-800 text-neutral-300 text-xs font-mono uppercase tracking-widest rounded-lg mb-4 inline-block">
              {prep.type}
            </span>
            <h1 className="text-3xl sm:text-4xl font-bold">{prep.title}</h1>
          </div>
          {activeTab === 'roadmap' && !isEditingRoadmap && (
            <button 
              onClick={() => { setEditTopics([...topics]); setIsEditingRoadmap(true); }}
              className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-xl text-sm font-medium transition-colors border border-neutral-700"
            >
              Modify Roadmap
            </button>
          )}
          {activeTab === 'roadmap' && isEditingRoadmap && (
            <div className="flex gap-2">
              <button onClick={saveRoadmapEdits} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-medium transition-colors">Save Edits</button>
              <button onClick={() => setIsEditingRoadmap(false)} className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-xl text-sm font-medium transition-colors">Cancel</button>
            </div>
          )}
        </div>

        {/* Tab Switcher */}
        {!isEditingRoadmap && (
          <div className="flex bg-neutral-900 border border-neutral-800 rounded-xl p-1 w-full max-w-sm">
            <button onClick={() => setActiveTab('roadmap')} className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${activeTab === 'roadmap' ? 'bg-neutral-800 text-white shadow' : 'text-neutral-500 hover:text-white'}`}>
              Roadmap
            </button>
            <button onClick={() => setActiveTab('questions')} className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${activeTab === 'questions' ? 'bg-neutral-800 text-white shadow' : 'text-neutral-500 hover:text-white'}`}>
              Q&A Bank
            </button>
          </div>
        )}

        {/* QUESTIONS TAB */}
        {activeTab === 'questions' && (
          <div className="space-y-6">
            {!showQuestionForm && (
              <button 
                onClick={() => setShowQuestionForm(true)}
                className="w-full py-4 border-2 border-dashed border-neutral-800 hover:border-emerald-500/50 rounded-2xl text-emerald-500/70 hover:text-emerald-400 font-medium transition-colors"
              >
                + Log New Question
              </button>
            )}

            {showQuestionForm && (
              <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 md:p-8 relative shadow-2xl">
                <button onClick={resetQForm} className="absolute top-6 right-6 text-neutral-500 hover:text-white">✕</button>
                <h3 className="text-xl font-bold mb-6">{editingQuestionId ? 'Edit Question' : 'Log New Question'}</h3>
                <form onSubmit={handleQuestionSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-neutral-400">Question Topic/Tags</label>
                    <div className="flex flex-wrap gap-2">
                      {topics.map(t => {
                        const isSelected = qTags.includes(t.title);
                        return (
                          <button 
                            type="button" 
                            key={t._id} 
                            onClick={() => toggleTag(t.title)}
                            className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${isSelected ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-neutral-950 border-neutral-800 text-neutral-500 hover:border-neutral-600'}`}
                          >
                            {t.title}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-neutral-400">Question</label>
                    <textarea 
                      required value={qText} onChange={e => setQText(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500 resize-none min-h-[80px]"
                      placeholder="What is the time complexity of..."
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-neutral-400">Documented Answer (Optional)</label>
                    <textarea 
                      value={qAnswerText} onChange={e => setQAnswerText(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500 resize-none min-h-[120px]"
                      placeholder="Write your answer or explanation here..."
                    />
                  </div>
                  <div className="space-y-2 pt-2">
                    <label className="text-sm font-medium text-neutral-400">Attach supporting document/image</label>
                    <input 
                      type="file" onChange={e => setQFile(e.target.files?.[0] || null)}
                      className="w-full text-xs file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:font-semibold file:bg-neutral-800 file:text-neutral-300 hover:file:bg-neutral-700 cursor-pointer block"
                    />
                  </div>
                  <div className="pt-4 flex justify-end">
                    <button type="submit" disabled={qSubmitting} className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold disabled:opacity-50">
                      {qSubmitting ? 'Saving...' : 'Save Record'}
                    </button>
                  </div>
                </form>
              </div>
            )}

             <div className="space-y-4">
               {questions.map((q) => (
                 <div key={q._id} className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-md">
                   <div 
                     className="p-5 cursor-pointer hover:bg-neutral-800/50 transition-colors"
                     onClick={() => setExpandedQId(expandedQId === q._id ? null : q._id)}
                   >
                     <div className="flex flex-wrap gap-2 mb-3">
                       {q.tags.map(tag => (
                         <span key={tag} className="px-2 py-1 text-[10px] font-mono rounded bg-neutral-950 text-emerald-400/80 border border-emerald-500/10 uppercase">
                           {tag}
                         </span>
                       ))}
                     </div>
                     <h4 className="text-lg font-medium pr-10 relative">
                       {q.questionText}
                       <span className="absolute right-0 top-1/2 -translate-y-1/2 text-neutral-500 text-sm">
                         {expandedQId === q._id ? '▲' : '▼'}
                       </span>
                     </h4>
                   </div>
                   
                   {expandedQId === q._id && (
                     <div className="p-5 border-t border-neutral-800 bg-neutral-950/50">
                       <div className="prose prose-invert max-w-none text-sm text-neutral-300 mb-6 whitespace-pre-wrap">
                         {q.answerText || <span className="italic text-neutral-600">No textual answer provided.</span>}
                       </div>
                       
                       {q.answerFileUrl && (
                         <div className="mb-6">
                           <a href={q.answerFileUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-4 py-2 rounded-lg text-sm hover:bg-emerald-500/20 transition-colors">
                             <span>📄</span> View Attached File: {q.answerFileName}
                           </a>
                         </div>
                       )}

                       <div className="flex gap-3 pt-4 border-t border-neutral-800/50 justify-end">
                         <button onClick={() => openEditQForm(q)} className="text-xs px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded transition-colors">Edit</button>
                         <button onClick={() => deleteQuestion(q._id)} className="text-xs px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded transition-colors">Delete</button>
                       </div>
                     </div>
                   )}
                 </div>
               ))}
               {questions.length === 0 && !showQuestionForm && (
                 <p className="text-center text-neutral-500 py-12">No questions documented yet.</p>
               )}
             </div>
          </div>
        )}

        {/* ROADMAP TAB */}
        {activeTab === 'roadmap' && (
          <>
            {isEditingRoadmap && (
              <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 space-y-4 shadow-xl">
                <h3 className="font-semibold text-lg mb-4">Rearrange / Edit Topics</h3>
                {editTopics.map((t, idx) => (
                  <div key={t._id || idx} className="flex items-center gap-3 bg-neutral-950 p-3 rounded-xl border border-neutral-800">
                    <button onClick={() => { if (idx > 0) { const nt = [...editTopics]; [nt[idx-1], nt[idx]] = [nt[idx], nt[idx-1]]; setEditTopics(nt); } }} className="text-neutral-500 hover:text-white px-2">↑</button>
                    <button onClick={() => { if (idx < editTopics.length - 1) { const nt = [...editTopics]; [nt[idx+1], nt[idx]] = [nt[idx], nt[idx+1]]; setEditTopics(nt); } }} className="text-neutral-500 hover:text-white px-2">↓</button>
                    <input type="text" value={t.title} onChange={(e) => { const nt = [...editTopics]; nt[idx].title = e.target.value; setEditTopics(nt); }} className="flex-1 bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500" />
                    <button onClick={() => setEditTopics(editTopics.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-300 font-bold px-3">✕</button>
                  </div>
                ))}
                <button onClick={() => setEditTopics([...editTopics, { _id: "", title: "", isCompleted: false, createdAt: "", logs: [] }])} className="text-emerald-400 text-sm mt-4">+ Add Node</button>
              </div>
            )}

            {!isEditingRoadmap && (
              <div className="relative pl-6 sm:pl-10 space-y-8 mt-12 mb-20 before:absolute before:inset-0 before:ml-[39px] sm:before:ml-[55px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-neutral-800 before:via-neutral-800 before:to-transparent">
                {topics.map((t, idx) => {
                  const logsCount = t.logs?.length || 0;
                  const isInProgress = !t.isCompleted && logsCount > 0;
                  const isPending = !t.isCompleted && logsCount === 0;

                  let nodeColorClass = "bg-neutral-800 border-neutral-700 ring-neutral-900";
                  let glowEffect = "";

                  if (t.isCompleted) {
                    nodeColorClass = "bg-emerald-500 border-emerald-400 ring-emerald-500/20";
                  } else if (isInProgress) {
                    nodeColorClass = "bg-blue-500 border-blue-400 ring-blue-500/30";
                    glowEffect = "shadow-[0_0_15px_rgba(59,130,246,0.5)]";
                  }

                  const lastCommitDate = logsCount > 0 ? new Date(t.logs[t.logs.length - 1].createdAt).toLocaleString() : "Never";

                  return (
                    <div key={t._id} className="relative flex items-start justify-between md:justify-normal md:odd:flex-row-reverse group select-none">
                      <div className="absolute left-[-24px] sm:left-[-19px] md:left-1/2 md:-translate-x-1/2 flex items-center justify-center w-8 h-8 rounded-full border-4 ring-4 z-10 transition-colors duration-500 bg-neutral-950">
                        <div className={`w-3 h-3 rounded-full ${nodeColorClass} ${glowEffect}`}></div>
                      </div>

                      <div className={`w-full md:w-[calc(50%-2.5rem)] bg-neutral-900 border ${t.isCompleted ? 'border-emerald-500/30' : isInProgress ? 'border-blue-500/50' : 'border-neutral-800'} rounded-3xl p-6 shadow-xl transition-all cursor-pointer hover:bg-neutral-800/80`}
                           onClick={() => setActiveTopicId(activeTopicId === t._id ? null : t._id)}>
                        <div className="flex justify-between items-start">
                          <div>
                            {t.isCompleted ? (
                              <span className="text-[10px] uppercase tracking-widest font-bold text-emerald-500 mb-2 block">Conquered</span>
                            ) : isInProgress ? (
                              <span className="text-[10px] uppercase tracking-widest font-bold text-blue-400 mb-2 block animate-pulse">In Progress</span>
                            ) : (
                              <span className="text-[10px] uppercase tracking-widest font-bold text-neutral-500 mb-2 block">Pending Analysis</span>
                            )}
                            <h3 className="text-xl font-bold">{t.title}</h3>
                          </div>
                          <span className="text-5xl font-black text-neutral-800 opacity-30 select-none">
                            {String(idx + 1).padStart(2, '0')}
                          </span>
                        </div>

                        <div className="mt-4 flex flex-col gap-1 text-xs text-neutral-500">
                          <span>Last Update: {lastCommitDate}</span>
                          {t.completedAt && <span>Completed On: {new Date(t.completedAt).toLocaleString()}</span>}
                        </div>

                        {activeTopicId === t._id && (
                          <div className="mt-6 pt-6 border-t border-neutral-800 space-y-6" onClick={(e) => e.stopPropagation()}>
                            {!t.isCompleted && (
                              <form onSubmit={(e) => handleLogSubmit(e, t._id)} className="bg-neutral-950 p-4 rounded-2xl border border-neutral-800">
                                <textarea required value={logText} onChange={(e) => setLogText(e.target.value)} placeholder="Commit a text log or attach a resource..." className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 resize-none min-h-[80px] mb-3"></textarea>
                                <div className="flex flex-col sm:flex-row gap-3">
                                  <input type="file" onChange={(e) => setLogFile(e.target.files?.[0] || null)} className="w-full text-xs file:mr-4 file:py-1.5 file:px-4 file:rounded-full file:border-0 file:font-semibold file:bg-neutral-800 file:text-neutral-300 hover:file:bg-neutral-700 cursor-pointer" />
                                  <button type="submit" disabled={submitting} className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg disabled:opacity-50">Commit</button>
                                </div>
                              </form>
                            )}

                            <div className="space-y-3">
                              {t.logs?.map((log) => (
                                <div key={log._id} className="bg-neutral-950 border border-neutral-800 p-4 rounded-xl">
                                  <p className="text-[10px] text-neutral-500 font-mono mb-2">{new Date(log.createdAt).toLocaleString()}</p>
                                  <p className="text-sm text-neutral-300 whitespace-pre-wrap">{log.text}</p>
                                  {log.fileUrl && <a href={log.fileUrl} target="_blank" rel="noreferrer" className="inline-block mt-3 text-xs bg-blue-500/10 text-blue-400 px-3 py-1.5 rounded border border-blue-500/20 hover:bg-blue-500/20">📄 {log.fileName || 'Attached Doc'}</a>}
                                </div>
                              ))}
                              {t.logs?.length === 0 && <p className="text-xs text-neutral-500 text-center italic">No commits yet.</p>}
                            </div>

                            {!t.isCompleted && (
                              <div className="pt-2">
                                 <button onClick={(e) => { e.stopPropagation(); markCompleted(t._id); }} className="w-full py-3 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-xl font-bold text-sm transition-colors">✓ Mark Topic Conquered</button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
