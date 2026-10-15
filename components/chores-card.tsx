"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckSquare,
  CheckCircle2,
  Circle,
  Plus,
  Users,
  Clock,
  TrendingUp,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { type Chore, type Member } from "@/types/database";
import { createClient } from "@/lib/supabase/client";
import { colorMap } from "@/lib/color-map";

interface ChoresCardProps {
  chores?: Chore[];
  members?: Pick<Member, "id" | "name" | "role" | "color">[];
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("vi-VN");
}

function getDueLabel(dateStr: string | null, done: boolean) {
  if (!dateStr || done) return null;
  const due = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return { text: `Quá hạn ${Math.abs(diffDays)} ngày`, isOverdue: true };
  if (diffDays === 0) return { text: "Hôm nay", isToday: true };
  if (diffDays === 1) return { text: "Ngày mai", isUpcoming: true };
  return { text: `Hạn ${formatDate(dateStr)}`, isUpcoming: true };
}

export function ChoresCard({ chores = [], members = [] }: ChoresCardProps) {
  const [choresList, setChoresList] = useState<Chore[]>(chores);
  const [filter, setFilter] = useState<"all" | "pending" | "done">("all");
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    setChoresList(chores);
  }, [chores]);

  const memberColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    members.forEach((m) => {
      map[m.name] = m.color;
    });
    return map;
  }, [members]);

  const completedCount = choresList.filter((c) => c.done).length;
  const totalCount = choresList.length;
  const pendingCount = totalCount - completedCount;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  async function toggleChore(id: string, currentDone: boolean) {
    setTogglingId(id);
    // Optimistic UI update
    setChoresList((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              done: !currentDone,
              done_at: !currentDone ? new Date().toISOString() : null,
            }
          : c
      )
    );

    const { error } = await supabase
      .from("chores")
      .update({
        done: !currentDone,
        done_at: !currentDone ? new Date().toISOString() : null,
      })
      .eq("id", id);

    setTogglingId(null);
    if (!error) {
      router.refresh();
    }
  }

  // Sorted list: priority high first, overdue first, pending before done
  const sortedChores = useMemo(() => {
    return [...choresList].sort((a, b) => {
      // 1. Pending comes before done
      if (a.done !== b.done) return a.done ? 1 : -1;

      // 2. Priority "high" comes first
      const priorityWeight: Record<string, number> = { high: 3, normal: 2, low: 1 };
      const pA = priorityWeight[a.priority] || 2;
      const pB = priorityWeight[b.priority] || 2;
      if (pA !== pB) return pB - pA;

      // 3. Next due ASC (closer due dates first)
      if (a.next_due && b.next_due) {
        return new Date(a.next_due).getTime() - new Date(b.next_due).getTime();
      }
      if (a.next_due) return -1;
      if (b.next_due) return 1;

      return 0;
    });
  }, [choresList]);

  const filteredChores = useMemo(() => {
    return sortedChores.filter((c) => {
      if (filter === "pending") return !c.done;
      if (filter === "done") return c.done;
      return true;
    });
  }, [sortedChores, filter]);

  // Limit to 6 items on dashboard
  const displayChores = filteredChores.slice(0, 6);

  return (
    <div
      id="chores"
      className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow-md transition-spring overflow-hidden"
    >
      {/* HEADER */}
      <div className="p-5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center shadow-xs">
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

          <div className="flex items-center gap-2">
            <Link
              href="/protected/chores"
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-spring btn-press"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm việc</span>
            </Link>
          </div>
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
          <div className="h-2 w-full bg-slate-200/80 dark:bg-slate-800 rounded-full overflow-hidden">
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
              { key: "all", label: "Tất cả", count: totalCount },
              { key: "pending", label: "Chưa xong", count: pendingCount },
              { key: "done", label: "Đã xong", count: completedCount },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-spring ${
                filter === tab.key
                  ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xs"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800"
              }`}
            >
              <span>{tab.label}</span>
              <span className="font-mono tabular-nums text-[10px] ml-1">
                ({tab.count})
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* CHORES LIST */}
      <div className="p-4 space-y-2">
        {displayChores.length === 0 ? (
          <div className="py-10 text-center text-slate-400 dark:text-slate-500 text-xs">
            {totalCount === 0 ? (
              <div className="space-y-2">
                <p>Chưa có công việc nhà nào được tạo.</p>
                <Link
                  href="/protected/chores"
                  className="inline-flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 hover:underline font-semibold text-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tạo công việc đầu tiên</span>
                </Link>
              </div>
            ) : (
              <p>Không có công việc nào trong danh mục này.</p>
            )}
          </div>
        ) : (
          displayChores.map((chore) => {
            const due = getDueLabel(chore.next_due, chore.done);
            const cs =
              colorMap[
                chore.assigned_to ? memberColorMap[chore.assigned_to] || "indigo" : "indigo"
              ] || colorMap.indigo;

            return (
              <div
                key={chore.id}
                onClick={() => toggleChore(chore.id, chore.done)}
                className={`group flex items-center justify-between p-3 rounded-xl border transition-spring cursor-pointer ${
                  chore.done
                    ? "bg-slate-50/60 dark:bg-slate-900/40 border-slate-200/50 dark:border-slate-800/50 opacity-70 hover:opacity-100"
                    : due?.isOverdue
                      ? "bg-rose-50/30 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50 hover:border-rose-300"
                      : "bg-white dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-xs"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1 mr-2">
                  <button
                    type="button"
                    disabled={togglingId === chore.id}
                    className="shrink-0 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors"
                  >
                    {togglingId === chore.id ? (
                      <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                    ) : chore.done ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-100 dark:fill-emerald-950" />
                    ) : (
                      <Circle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    )}
                  </button>

                  <div className="min-w-0 flex-1">
                    <div
                      className={`text-xs sm:text-sm font-semibold transition-all truncate ${
                        chore.done
                          ? "line-through text-slate-400 dark:text-slate-500"
                          : "text-slate-800 dark:text-slate-200"
                      }`}
                    >
                      {chore.title}
                    </div>

                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                      {due && (
                        <span
                          className={`flex items-center gap-1 font-mono tabular-nums ${
                            due.isOverdue
                              ? "text-rose-600 dark:text-rose-400 font-semibold"
                              : due.isToday
                                ? "text-amber-600 dark:text-amber-400 font-semibold"
                                : ""
                          }`}
                        >
                          <Clock className="w-3 h-3" />
                          {due.text}
                        </span>
                      )}
                      {chore.priority === "high" && !chore.done && (
                        <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 dark:bg-rose-950/50 px-1.5 py-0.2 rounded">
                          Ưu tiên
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* ASSIGNEE BADGE */}
                <div className="shrink-0 flex items-center gap-1.5">
                  {chore.assigned_to ? (
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${cs.bg} ${cs.text}`}
                    >
                      {chore.assigned_to}
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 italic">
                      Chưa giao
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* FOOTER: "XEM TẤT CẢ" IF MORE THAN 6 CHORES */}
      {filteredChores.length > 6 && (
        <div className="px-4 py-2.5 border-t border-slate-100 dark:border-slate-800 text-center bg-slate-50/40 dark:bg-slate-900/40">
          <Link
            href="/protected/chores"
            className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-spring"
          >
            <span>Xem tất cả ({filteredChores.length} việc)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* FAMILY MEMBERS SUMMARY */}
      {members && members.length > 0 && (
        <div
          id="members"
          className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60"
        >
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-indigo-500" />
              Thành viên gia đình
            </span>
            <Link
              href="/protected/members"
              className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-semibold font-mono tabular-nums"
            >
              {members.length} người phụ trách
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {members.slice(0, 3).map((m) => {
              const cs = colorMap[m.color] || colorMap.indigo;
              const memberChoresCount = choresList.filter(
                (c) => c.assigned_to === m.name && !c.done
              ).length;

              return (
                <div
                  key={m.id}
                  className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-800 card-hover"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className={`w-6 h-6 rounded-full ${cs.bg} ${cs.text} text-[10px] font-bold flex items-center justify-center uppercase`}
                    >
                      {m.name.charAt(0)}
                    </div>
                    <div className="font-semibold text-xs text-slate-800 dark:text-slate-200 truncate">
                      {m.name}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <span className="truncate mr-1">{m.role}</span>
                    <span className="font-semibold text-indigo-600 dark:text-indigo-400 font-mono tabular-nums shrink-0">
                      {memberChoresCount} việc
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
