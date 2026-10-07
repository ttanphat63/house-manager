"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Receipt,
  CheckSquare,
  Users,
  Home,
  LogOut,
  Sparkles,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface DashboardSidebarProps {
  userEmail?: string;
  onNavigate?: () => void;
}

export function DashboardSidebar({ userEmail, onNavigate }: DashboardSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const displayName = userEmail ? userEmail.split("@")[0] : "Chủ hộ";

  const navItems = [
    {
      title: "Dashboard",
      href: "/protected",
      icon: LayoutDashboard,
      badge: "Tổng quan",
      active: pathname === "/protected",
    },
    {
      title: "Hóa đơn",
      href: "/protected#bills",
      icon: Receipt,
      active: false,
    },
    {
      title: "Việc nhà",
      href: "/protected#chores",
      icon: CheckSquare,
      active: false,
    },
    {
      title: "Thành viên gia đình",
      href: "/protected#members",
      icon: Users,
      badge: "4 người",
      active: false,
    },
  ];

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
  }

  return (
    <aside className="w-64 h-full flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 transition-colors">
      {/* BRAND LOGO */}
      <div className="h-16 px-6 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80">
        <Link
          href="/protected"
          onClick={onNavigate}
          className="flex items-center gap-3 group"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/25 group-hover:scale-105 transition-spring">
            <Home className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-slate-900 dark:text-slate-100 text-sm tracking-tight flex items-center gap-1.5">
              House Manager
              <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900">
                PRO
              </span>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              Quản lý tổ ấm thông minh
            </p>
          </div>
        </Link>
      </div>

      {/* NAVIGATION */}
      <div className="flex-1 py-6 px-3 space-y-1.5 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Menu chính
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.title}
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-spring group ${
                item.active
                  ? "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100/70 dark:hover:bg-slate-800/60"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`p-1.5 rounded-lg transition-spring ${
                    item.active
                      ? "text-indigo-600 dark:text-indigo-400"
                      : "text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <span>{item.title}</span>
              </div>

              {item.badge && (
                <span
                  className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                    item.active
                      ? "bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}

        {/* HOUSE STATUS MINI CARD */}
        <div className="pt-6 px-1">
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent border border-indigo-100/80 dark:border-indigo-950/60">
            <div className="flex items-center gap-2 mb-1.5 text-xs font-semibold text-indigo-900 dark:text-indigo-300">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>Gia đình hạnh phúc</span>
            </div>
            <p className="text-[12px] text-slate-600 dark:text-slate-400 leading-relaxed mb-3">
              Mọi công việc nhà và hóa đơn đều đang được kiểm soát tốt!
            </p>
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Nhà cửa gọn gàng 100%</span>
            </div>
          </div>
        </div>
      </div>

      {/* USER PROFILE & LOGOUT */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-semibold text-xs flex items-center justify-center shrink-0 uppercase shadow-sm">
              {displayName.charAt(0)}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                {displayName}
              </div>
              <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                Chủ hộ
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Đăng xuất"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-spring btn-press"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
