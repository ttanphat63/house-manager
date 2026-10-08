"use client";

import React, { useState } from "react";
import { type Member } from "@/types/database";
import { MemberCard } from "./member-card";
import { Users, Plus, UserPlus } from "lucide-react";

interface MembersClientProps {
  initialMembers: Member[];
  userId: string;
}

export function MembersClient({ initialMembers, userId }: MembersClientProps) {
  const [members] = useState<Member[]>(initialMembers);

  function handleEdit(member: Member) {
    // Will be wired to MemberFormModal in Step 2
    console.log("Edit member:", member);
  }

  function handleDelete(member: Member) {
    // Will be wired to DeleteMemberDialog in Step 3
    console.log("Delete member:", member);
  }

  function handleAddNew() {
    // Will be wired to MemberFormModal in Step 2
    console.log("Add new member");
  }

  return (
    <div className="space-y-6">
      {/* SECTION HEADER & QUICK ACTION */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>Danh sách thành viên</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono tabular-nums">
              {members.length}
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Thành viên tham gia chia sẻ hóa đơn và sinh hoạt trong gia đình
          </p>
        </div>

        <button
          type="button"
          onClick={handleAddNew}
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-semibold text-xs sm:text-sm px-4 py-2.5 rounded-xl transition-spring shadow-sm shadow-indigo-600/25 btn-press self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm thành viên</span>
        </button>
      </div>

      {/* MEMBER GRID OR EMPTY STATE */}
      {members.length === 0 ? (
        <div className="py-16 px-4 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-3.5 shadow-sm">
            <UserPlus className="w-7 h-7" />
          </div>
          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base mb-1">
            Chưa có thành viên nào
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-5 leading-relaxed">
            Thêm các thành viên trong tổ ấm để bắt đầu chia tiền hóa đơn và phân chia công việc nhà tiện lợi.
          </p>
          <button
            type="button"
            onClick={handleAddNew}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-spring shadow-sm shadow-indigo-600/25 btn-press"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm thành viên đầu tiên</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map((member) => (
            <MemberCard
              key={member.id}
              member={member}
              onEdit={handleEdit}
              onDelete={handleDelete}
              choresCount={0}
            />
          ))}
        </div>
      )}
    </div>
  );
}
