import React from "react";
import { type Member } from "@/types/database";
import { colorMap } from "@/lib/color-map";
import { Pencil, Trash2, Mail, CheckCircle2 } from "lucide-react";

interface MemberCardProps {
  member: Member;
  onEdit?: (member: Member) => void;
  onDelete?: (member: Member) => void;
  choresCount?: number;
}


export function MemberCard({
  member,
  onEdit,
  onDelete,
  choresCount = 0,
}: MemberCardProps) {
  const colorStyle = colorMap[member.color] || colorMap.indigo;
  const initial = member.name ? member.name.trim().charAt(0).toUpperCase() : "?";

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:shadow-md transition-spring card-hover flex flex-col justify-between gap-4 group">
      {/* TOP: AVATAR & INFO */}
      <div className="flex items-start gap-3.5">
        {/* AVATAR CIRCLE */}
        <div
          className={`w-12 h-12 rounded-2xl ${colorStyle.bg} ${colorStyle.text} border ${colorStyle.border} flex items-center justify-center font-bold text-lg shrink-0 shadow-xs ring-2 ${colorStyle.ring}`}
        >
          {initial}
        </div>

        {/* DETAILS */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 truncate">
              {member.name}
            </h3>
            <span
              className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border ${colorStyle.bg} ${colorStyle.text} ${colorStyle.border} shrink-0`}
            >
              {member.role}
            </span>
          </div>

          {/* CHORES COUNT BADGE */}
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600"></span>
            <span>
              <span className="font-mono tabular-nums font-semibold">{choresCount}</span> việc phụ trách
            </span>
          </div>

          {/* EMAIL (IF EXISTS) */}
          {member.email && (
            <div className="text-xs text-slate-400 dark:text-slate-500 truncate flex items-center gap-1.5 mt-1.5">
              <Mail className="w-3.5 h-3.5 shrink-0 text-slate-400 dark:text-slate-500" />
              <span className="truncate">{member.email}</span>
            </div>
          )}
        </div>
      </div>

      {/* BOTTOM: ACTIONS ROW */}
      <div className="flex items-center justify-end gap-1.5 pt-3 border-t border-slate-100 dark:border-slate-800/80">
        <button
          type="button"
          onClick={() => onEdit?.(member)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-spring btn-press"
          title={`Sửa thông tin ${member.name}`}
        >
          <Pencil className="w-3.5 h-3.5" />
          <span>Sửa</span>
        </button>

        <button
          type="button"
          onClick={() => onDelete?.(member)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-spring btn-press"
          title={`Xóa thành viên ${member.name}`}
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Xóa</span>
        </button>
      </div>
    </div>
  );
}
