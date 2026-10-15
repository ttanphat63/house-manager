"use client";

import React from "react";
import {
  CheckCircle2,
  Circle,
  Clock,
  Calendar,
  Pencil,
  Trash2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { type Chore } from "@/types/database";
import { colorMap } from "@/lib/color-map";

interface ChoreCardProps {
  chore: Chore;
  memberColor?: string;
  onEdit: (chore: Chore) => void;
  onDelete: (chore: Chore) => void;
  onToggleDone: (choreId: string, currentDone: boolean) => void;
  isToggling?: boolean;
}

const frequencyConfig: Record<
  string,
  { label: string; badge: string }
> = {
  daily: {
    label: "Hàng ngày",
    badge:
      "bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800",
  },
  weekly: {
    label: "Hàng tuần",
    badge:
      "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800",
  },
  monthly: {
    label: "Hàng tháng",
    badge:
      "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
  },
  once: {
    label: "Một lần",
    badge:
      "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700",
  },
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("vi-VN");
}

function getDueStatus(dateStr: string | null, done: boolean) {
  if (!dateStr || done) return null;
  const due = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return { label: `Quá hạn ${Math.abs(diffDays)} ngày`, isOverdue: true };
  if (diffDays === 0) return { label: "Hôm nay", isToday: true };
  return { label: `Còn ${diffDays} ngày`, isUpcoming: true };
}

export function ChoreCard({
  chore,
  memberColor = "indigo",
  onEdit,
  onDelete,
  onToggleDone,
  isToggling = false,
}: ChoreCardProps) {
  const freq = frequencyConfig[chore.frequency] || frequencyConfig.once;
  const dueStatus = getDueStatus(chore.next_due, chore.done);
  const colorStyle = colorMap[memberColor] || colorMap.indigo;

  return (
    <div
      className={`group p-4 rounded-xl border transition-spring card-hover flex flex-col justify-between gap-3 ${
        chore.done
          ? "bg-slate-50/60 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800/60 opacity-80"
          : dueStatus?.isOverdue
            ? "bg-rose-50/30 dark:bg-rose-950/20 border-rose-300 dark:border-rose-900/60"
            : "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
      }`}
    >
      {/* TOP: CHECKBOX + TITLE + BADGES */}
      <div className="space-y-2">
        <div className="flex items-start gap-2.5">
          <button
            type="button"
            onClick={() => onToggleDone(chore.id, chore.done)}
            disabled={isToggling}
            title={chore.done ? "Đánh dấu chưa hoàn thành" : "Đánh dấu đã hoàn thành"}
            className="shrink-0 mt-0.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors disabled:opacity-50"
          >
            {isToggling ? (
              <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
            ) : chore.done ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-100 dark:fill-emerald-950" />
            ) : (
              <Circle className="w-5 h-5 hover:scale-110 transition-transform" />
            )}
          </button>

          <div className="min-w-0 flex-1">
            <h3
              className={`text-sm font-semibold transition-all break-words ${
                chore.done
                  ? "line-through text-slate-400 dark:text-slate-500"
                  : "text-slate-900 dark:text-slate-100"
              }`}
            >
              {chore.title}
            </h3>

            {/* BADGES ROW */}
            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
              {/* Frequency */}
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${freq.badge}`}
              >
                {freq.label}
              </span>

              {/* Priority */}
              {chore.priority === "high" && !chore.done && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                  Ưu tiên cao
                </span>
              )}

              {/* Due status badge */}
              {dueStatus && (
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full font-mono tabular-nums border ${
                    dueStatus.isOverdue
                      ? "bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 border-rose-200 dark:border-rose-800"
                      : dueStatus.isToday
                        ? "bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                        : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                  }`}
                >
                  {dueStatus.label}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* DUE DATE & NOTE */}
        <div className="pl-7.5 space-y-1 text-xs text-slate-500 dark:text-slate-400">
          {chore.next_due && (
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="font-mono tabular-nums">
                Hạn: {formatDate(chore.next_due)}
              </span>
            </div>
          )}

          {chore.note && (
            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 bg-slate-50 dark:bg-slate-800/40 p-1.5 rounded-lg border border-slate-100 dark:border-slate-800/60">
              {chore.note}
            </p>
          )}
        </div>
      </div>

      {/* BOTTOM ROW: ASSIGNEE + ACTIONS */}
      <div className="flex items-center justify-between pt-2.5 mt-1 border-t border-slate-100 dark:border-slate-800 text-xs">
        {/* Assignee chip */}
        <div className="flex items-center gap-1.5 min-w-0">
          {chore.assigned_to ? (
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-medium max-w-[150px] truncate">
              <span
                className={`w-4 h-4 rounded-full ${colorStyle.bg} ${colorStyle.text} flex items-center justify-center text-[9px] font-bold shrink-0`}
              >
                {chore.assigned_to.charAt(0).toUpperCase()}
              </span>
              <span className="truncate">{chore.assigned_to}</span>
            </div>
          ) : (
            <span className="text-[11px] text-slate-400 italic">
              Chưa giao việc
            </span>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => onEdit(chore)}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 px-2 py-1 rounded-lg transition-spring"
            title="Chỉnh sửa việc nhà"
          >
            <Pencil className="w-3 h-3" />
            <span>Sửa</span>
          </button>
          <button
            type="button"
            onClick={() => onDelete(chore)}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 px-2 py-1 rounded-lg transition-spring"
            title="Xóa việc nhà"
          >
            <Trash2 className="w-3 h-3" />
            <span>Xóa</span>
          </button>
        </div>
      </div>
    </div>
  );
}
