"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, Label } from "recharts";

type Expense = {
  _id: string;
  amount: number;
  date: string;
  type: string;
  description: string;
  createdAt: string;
};

export default function MoneyTrackerPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [expenseTypes, setExpenseTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [type, setType] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Analytics state
  const [chartFilter, setChartFilter] = useState("Overall");

  // Chart data calculation
  const generateChartData = () => {
    if (chartFilter === "Overall") {
      const agg = expenses.reduce((acc: any, exp) => {
        const existing = acc.find((i: any) => i.name === exp.type);
        if (existing) existing.value += exp.amount;
        else acc.push({ name: exp.type, value: exp.amount });
        return acc;
      }, []);
      return agg;
    } else {
      const agg = expenses
        .filter(exp => exp.type === chartFilter)
        .reduce((acc: any, exp) => {
          const dStr = new Date(exp.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
          const existing = acc.find((i: any) => i.date === dStr);
          if (existing) existing.amount += exp.amount;
          else acc.push({ date: dStr, amount: exp.amount });
          return acc;
        }, []).reverse();
      return agg;
    }
  };

  const chartData = generateChartData();
  const COLORS = ['#eab308', '#3b82f6', '#10b981', '#f43f5e', '#a855f7', '#f97316', '#0ea5e9'];

  // Modal states

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editTypes, setEditTypes] = useState<string[]>([]);

  const fetchTypes = async () => {
    try {
      const res = await fetch("/api/user/expense-types");
      const json = await res.json();
      if (json.success) {
        setExpenseTypes(json.data);
        if (json.data.length > 0 && !type) setType(json.data[0]);
      }
    } catch (e) {}
  };

  const fetchExpenses = async () => {
    try {
      const res = await fetch("/api/expenses");
      const json = await res.json();
      if (json.success) setExpenses(json.data);
    } catch (e) {} finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTypes();
    fetchExpenses();
  }, []);

  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !date || !type) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, date, type, description }),
      });
      if (res.ok) {
        setAmount("");
        setDescription("");
        fetchExpenses();
      }
    } catch (err) {} finally {
      setSubmitting(false);
    }
  };

  const deleteExpense = async (id: string) => {
    if (!confirm("Delete this transaction?")) return;
    try {
      const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
      if (res.ok) fetchExpenses();
    } catch (err) {}
  };

  const saveTypes = async () => {
    const filtered = editTypes.filter(t => t.trim() !== "");
    try {
      const res = await fetch("/api/user/expense-types", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expenseTypes: filtered }),
      });
      if (res.ok) {
        setIsModalOpen(false);
        fetchTypes();
        if (filtered.length > 0 && !filtered.includes(type)) setType(filtered[0]);
      }
    } catch (e) {}
  };

  if (loading) return (
    <div className="min-h-screen bg-neutral-950 flex justify-center p-20">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
    </div>
  );

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-50 p-8 sm:p-12 relative">
      <div className="max-w-4xl mx-auto space-y-8">
        <Link href="/" className="text-neutral-500 hover:text-neutral-300 text-sm inline-flex items-center gap-2 transition-colors">
          ← Back to Dashboard
        </Link>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-neutral-900 border border-neutral-800 rounded-3xl p-8 shadow-xl">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent">Money Logger</h1>
            <p className="text-neutral-400 mt-2">Track spending and manage expense categories</p>
          </div>
          <button 
            onClick={() => { setEditTypes([...expenseTypes]); setIsModalOpen(true); }}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-xl text-sm font-medium transition-colors border border-neutral-700"
          >
            Manage Types
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Add Expense Form */}
          <div className="md:col-span-1 bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-xl h-fit">
            <h3 className="text-lg font-bold mb-4 text-white">Log Transaction</h3>
            <form onSubmit={handleExpenseSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-neutral-400 ml-1">Amount</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">₹</span>
                  <input
                    required type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-8 pr-4 py-3 text-sm text-white focus:outline-none focus:border-yellow-500 transition-colors"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-neutral-400 ml-1">Date</label>
                <input
                  required type="date" value={date} onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-yellow-500 transition-colors [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-neutral-400 ml-1">Category / Type</label>
                <select
                  required value={type} onChange={(e) => setType(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-yellow-500 transition-colors appearance-none"
                >
                  <option value="" disabled>Select Type</option>
                  {expenseTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-neutral-400 ml-1">Description (Optional)</label>
                <input
                  type="text" value={description} onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-yellow-500 transition-colors"
                  placeholder="Dinner, headphones..."
                />
              </div>

              <button type="submit" disabled={submitting} className="w-full py-3 bg-yellow-600 hover:bg-yellow-500 text-white font-bold rounded-xl shadow-lg shadow-yellow-500/20 transition-all disabled:opacity-50 mt-2">
                {submitting ? "Logging..." : "Log Expense"}
              </button>
            </form>
          </div>

          {/* Transaction History */}
          <div className="md:col-span-2 space-y-4">
            <h3 className="text-lg font-bold mb-4 text-white pl-1">Recent Transactions</h3>
            {expenses.length === 0 ? (
              <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-12 text-center text-neutral-500">
                No money logged yet. Add your first transaction!
              </div>
            ) : (
              <div className="space-y-3">
                {expenses.map((exp) => (
                  <div key={exp._id} className="group flex justify-between items-center bg-neutral-900 border border-neutral-800 p-4 rounded-2xl hover:border-neutral-700 transition-colors">
                    <div className="flex gap-4 items-center">
                      <div className="w-12 h-12 bg-neutral-950 rounded-xl flex items-center justify-center border border-neutral-800">
                        <span className="text-lg">💸</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-white capitalize">{exp.type}</h4>
                        <div className="text-xs text-neutral-500 flex gap-2">
                          <span>{new Date(exp.date).toLocaleDateString()}</span>
                          {exp.description && <span>• {exp.description}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-bold text-lg text-red-400">-₹{exp.amount.toFixed(2)}</span>
                      <button 
                        onClick={() => deleteExpense(exp._id)}
                        className="opacity-0 group-hover:opacity-100 text-red-500 hover:bg-red-500/20 p-2 rounded-lg transition-all"
                      >✕</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Analytics Section */}
        {expenses.length > 0 && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 shadow-xl mt-8">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
              <h3 className="text-xl font-bold text-white pl-1">Financial Analytics</h3>
              <select
                value={chartFilter}
                onChange={(e) => setChartFilter(e.target.value)}
                className="bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-yellow-500 transition-colors"
              >
                <option value="Overall">Overall (Pie Chart)</option>
                {expenseTypes.map(t => <option key={`filter-${t}`} value={t}>{t} (Trend)</option>)}
              </select>
            </div>
            
            <div className="h-80 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                {chartFilter === "Overall" ? (
                  <PieChart>
                    <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={70} outerRadius={110} label={{ fill: '#e5e5e5', fontSize: 12 }}>
                      {chartData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                      <Label 
                        content={({ viewBox }: any) => {
                          const { cx, cy } = viewBox;
                          const totalSpent = chartData.reduce((sum: number, item: any) => sum + item.value, 0);
                          return (
                            <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central">
                              <tspan x={cx} dy="-0.2em" fill="#fff" fontSize="22" fontWeight="bold">₹{totalSpent.toFixed(0)}</tspan>
                              <tspan x={cx} dy="1.4em" fill="#737373" fontSize="12">Total Spent</tspan>
                            </text>
                          );
                        }}
                      />
                    </Pie>
                      <RechartsTooltip 
                        formatter={(value: number) => [`₹${value.toFixed(2)}`, 'Amount']}
                        contentStyle={{ backgroundColor: '#171717', borderColor: '#262626', borderRadius: '12px' }}
                        itemStyle={{ color: '#eab308' }}
                      />
                      <Legend wrapperStyle={{ fontSize: '14px', paddingTop: '10px' }} />
                    </PieChart>
                ) : (
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                    <XAxis dataKey="date" stroke="#737373" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#737373" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val}`} />
                    <RechartsTooltip 
                      formatter={(value: number) => [`₹${value.toFixed(2)}`, 'Amount']}
                      contentStyle={{ backgroundColor: '#171717', borderColor: '#262626', borderRadius: '12px' }}
                      cursor={{ fill: '#262626' }}
                    />
                    <Bar dataKey="amount" fill="#eab308" radius={[4, 4, 0, 0]} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Modal overlays */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-md p-6 shadow-2xl relative">
            <h2 className="text-xl font-bold mb-4">Manage Expense Types</h2>
            <div className="space-y-3 mb-6 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
              {editTypes.map((t, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <input
                    type="text" value={t} onChange={(e) => {
                      const nt = [...editTypes]; nt[idx] = e.target.value; setEditTypes(nt);
                    }}
                    className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-500"
                  />
                  <button onClick={() => setEditTypes(editTypes.filter((_, i) => i !== idx))} className="text-red-400 px-3 hover:text-red-300">✕</button>
                </div>
              ))}
              <button onClick={() => setEditTypes([...editTypes, ""])} className="text-yellow-400 text-sm mt-2 hover:text-yellow-300 transition-colors">+ Add Type</button>
            </div>
            <div className="flex gap-3 justify-end pt-4 border-t border-neutral-800">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-xl text-sm font-medium transition-colors">Cancel</button>
              <button onClick={saveTypes} className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded-xl text-sm font-medium transition-colors shadow-lg shadow-yellow-500/20">Save List</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
