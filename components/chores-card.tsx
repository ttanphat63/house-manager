"use client";

import { useState } from "react";
import {
  CheckSquare,
  CheckCircle2,
  Circle,
  Plus,
  Users,
  Clock,
  Sparkles,
  TrendingUp,
  User,
} from "lucide-react";

interface Chore {
  id: string;
  title: string;
  assignee: string;
  assigneeColor: string;
  dueTime: string;
  completed: boolean;
  priority: "high" | "normal" | "low";
}

const INITIAL_CHORES: Chore[] = [
  {
    id: "1",
    title: "Đổ rác & thay túi rác nhà bếp",
    assignee: "Nam",
    assigneeColor: "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300",
    dueTime: "Trước 19:00",
    completed: true,
    priority: "high",
  },
  {
    id: "2",
    title: "Rửa bát & lau dọn bồn rửa",
    assignee: "Linh",
    assigneeColor: "bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300",
    dueTime: "Trưa nay",
    completed: true,
    priority: "normal",
  },
  {
    id: "3",
    title: "Tưới cây ban công & lau lá cây cảnh",
    assignee: "Nam",
    assigneeColor: "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300",
    dueTime: "17:30",
    completed: false,
    priority: "normal",
  },
  {
    id: "4",
    title: "Hút bụi & lau sàn phòng khách",
    assignee: "Minh",
    assigneeColor: "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300",
    dueTime: "Tối nay",
    completed: false,
    priority: "high",
  },
  {
    id: "5",
    title: "Giặt và phơi quần áo",
    assignee: "Linh",
    assigneeColor: "bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300",
    dueTime: "Sáng mai",
    completed: true,
    priority: "low",
  },
];

export function ChoresCard() {
  const [chores, setChores] = useState<Chore[]>(INITIAL_CHORES);
  const [filter, setFilter] = useState<"all" | "pending" | "done">("all");
  const [newTitle, setNewTitle] = useState("");
  const [newAssignee, setNewAssignee] = useState("Nam");
  const [showAddForm, setShowAddForm] = useState(false);

  const completedCount = chores.filter((c) => c.completed).length;
  const totalCount = chores.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  function toggleChore(id: string) {
    setChores((prev) =>
      prev.map((c) => (c.id === id ? { ...c, completed: !c.completed } : c))
    );
  }

  function handleAddChore(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const colors: Record<string, string> = {
      Nam: "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300",
      Linh: "bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300",
      Minh: "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300",
    };

    const newChore: Chore = {
      id: Date.now().toString(),
      title: newTitle.trim(),
      assignee: newAssignee,
      assigneeColor: colors[newAssignee] || "bg-slate-100 text-slate-700",
      dueTime: "Hôm nay",
      completed: false,
      priority: "normal",
    };

    setChores([newChore, ...chores]);
    setNewTitle("");
    setShowAddForm(false);
  }

  const filteredChores = chores.filter((c) => {
    if (filter === "pending") return !c.completed;
    if (filter === "done") return c.completed;
    return true;
  });

  return (
    <div id="chores" className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow-md transition-spring overflow-hidden">
      {/* HEADER */}
      <div className="p-5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center shadow-sm">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 dark:text-slate-100 text-base flex items-center gap-2">
                Việc nhà hôm nay
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Phân chia trách nhiệm & theo dõi tiến độ
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-spring btn-press"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm việc</span>
          </button>
        </div>

        {/* PROGRESS BAR */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              Tiến độ hoàn thành
            </span>
            <span className="font-bold text-slate-900 dark:text-slate-100 font-mono tabular-nums">
              {completedCount}/{totalCount} việc ({progressPercent}%)
            </span>
          </div>
          <div className="h-2.5 w-full bg-slate-200/80 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* TABS FILTER */}
        <div className="flex items-center gap-1.5 mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800">
          {(
            [
              { key: "all", label: "Tất cả", count: null },
              { key: "pending", label: "Chưa xong", count: totalCount - completedCount },
              { key: "done", label: "Đã xong", count: completedCount },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`text-xs font-medium px-2.5 py-1 rounded-lg transition-spring ${
                filter === tab.key
                  ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800"
              }`}
            >
              {tab.label}
              {tab.count !== null && (
                <span className="font-mono tabular-nums"> ({tab.count})</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* QUICK ADD FORM */}
      {showAddForm && (
        <form
          onSubmit={handleAddChore}
          className="p-4 bg-indigo-50/50 dark:bg-indigo-950/20 border-b border-indigo-100 dark:border-indigo-950/50 animate-in fade-in duration-200"
        >
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Nhập tên việc cần làm (VD: Quét sân, thay ga giường...)"
              className="flex-1 px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
              autoFocus
            />
            <select
              value={newAssignee}
              onChange={(e) => setNewAssignee(e.target.value)}
              className="px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="Nam">Nam (Bố)</option>
              <option value="Linh">Linh (Mẹ)</option>
              <option value="Minh">Minh (Con)</option>
            </select>
            <button
              type="submit"
              className="px-3.5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-spring btn-press"
            >
              Lưu việc
            </button>
          </div>
        </form>
      )}

      {/* CHORES LIST */}
      <div className="p-4 space-y-2">
        {filteredChores.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            Không có công việc nào trong danh mục này.
          </div>
        ) : (
          filteredChores.map((chore) => (
            <div
              key={chore.id}
              onClick={() => toggleChore(chore.id)}
              className={`group flex items-center justify-between p-3 rounded-xl border transition-spring cursor-pointer ${
                chore.completed
                  ? "bg-slate-50/60 dark:bg-slate-900/40 border-slate-200/50 dark:border-slate-800/50 opacity-70 hover:opacity-100"
                  : "bg-white dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-sm"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  className="shrink-0 text-slate-400 group-hover:text-indigo-600 transition-colors"
                >
                  {chore.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-100 dark:fill-emerald-950" />
                  ) : (
                    <Circle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  )}
                </button>

                <div className="min-w-0">
                  <div
                    className={`text-sm font-medium transition-all ${
                      chore.completed
                        ? "line-through text-slate-400 dark:text-slate-500"
                        : "text-slate-800 dark:text-slate-200"
                    }`}
                  >
                    {chore.title}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1 font-mono tabular-nums">
                      <Clock className="w-3 h-3" />
                      {chore.dueTime}
                    </span>
                    {chore.priority === "high" && !chore.completed && (
                      <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 dark:bg-rose-950/50 px-1.5 py-0.2 rounded">
                        Ưu tiên
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-1.5">
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full ${chore.assigneeColor}`}
                >
                  {chore.assignee}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* FAMILY MEMBERS QUICK SUMMARY */}
      <div id="members" className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-indigo-500" />
            Thành viên gia đình
          </span>
          <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium font-mono tabular-nums">
            3 người phụ trách
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[
            { name: "Nam", role: "Chủ hộ", count: "2 việc", color: "from-blue-500 to-indigo-600" },
            { name: "Linh", role: "Vợ", count: "2 việc", color: "from-purple-500 to-pink-600" },
            { name: "Minh", role: "Con", count: "1 việc", color: "from-amber-500 to-orange-600" },
          ].map((m) => (
            <div
              key={m.name}
              className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-800 card-hover"
            >
              <div className="flex items-center gap-2 mb-1">
                <div
                  className={`w-6 h-6 rounded-full bg-gradient-to-tr ${m.color} text-white text-[10px] font-bold flex items-center justify-center uppercase`}
                >
                  {m.name.charAt(0)}
                </div>
                <div className="font-semibold text-xs text-slate-800 dark:text-slate-200 truncate">
                  {m.name}
                </div>
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-500">
                <span>{m.role}</span>
                <span className="font-semibold text-indigo-600 dark:text-indigo-400 font-mono tabular-nums">
                  {m.count}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
