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
  ShieldCheck,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface DashboardSidebarProps {
  userEmail?: string;
  onNavigate?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function DashboardSidebar({
  userEmail,
  onNavigate,
  isCollapsed = false,
  onToggleCollapse,
}: DashboardSidebarProps) {
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
    <aside
      className={`h-full flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-[width] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] select-none ${
        isCollapsed ? "w-16" : "w-60"
      }`}
    >
      {/* BRAND / LOGO HEADER (56px = h-14) */}
      <div
        className={`h-14 flex items-center border-b border-slate-200 dark:border-slate-800 ${
          isCollapsed ? "justify-center px-2" : "justify-between px-4"
        }`}
      >
        {isCollapsed ? (
          <button
            onClick={onToggleCollapse}
            title="Mở rộng thanh bên (Click để mở)"
            aria-label="Mở rộng thanh bên"
            className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/25 hover:scale-105 transition-spring group"
          >
            <Home className="w-4 h-4 group-hover:hidden" />
            <PanelLeftOpen className="w-4 h-4 hidden group-hover:block" />
          </button>
        ) : (
          <>
            <Link
              href="/protected"
              onClick={onNavigate}
              className="flex items-center gap-2.5 min-w-0 group"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/25 group-hover:scale-105 transition-spring shrink-0">
                <Home className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="font-bold text-slate-900 dark:text-slate-100 text-xs tracking-tight flex items-center gap-1.5 truncate">
                  House Manager
                  <span className="text-[9px] font-semibold uppercase px-1 py-0.2 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900">
                    PRO
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                  Quản lý tổ ấm thông minh
                </p>
              </div>
            </Link>

            {onToggleCollapse && (
              <button
                onClick={onToggleCollapse}
                title="Thu gọn thanh bên"
                aria-label="Thu gọn thanh bên"
                className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-spring"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            )}
          </>
        )}
      </div>

      {/* NAVIGATION */}
      <div className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {!isCollapsed && (
          <div className="px-2.5 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Menu chính
          </div>
        )}

        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.title}
              href={item.href}
              onClick={onNavigate}
              title={item.title}
              className={`flex items-center rounded-xl text-xs font-medium transition-spring group ${
                isCollapsed
                  ? "justify-center p-2.5"
                  : "justify-between px-3 py-2"
              } ${
                item.active
                  ? "bg-indigo-50/80 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border-l-2 border-indigo-600 dark:border-indigo-500 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100/70 dark:hover:bg-slate-800/60"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`p-1 rounded-lg transition-spring shrink-0 ${
                    item.active
                      ? "text-indigo-600 dark:text-indigo-400"
                      : "text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                {!isCollapsed && <span className="truncate">{item.title}</span>}
              </div>

              {!isCollapsed && item.badge && (
                <span
                  className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0 font-mono tabular-nums ${
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

        {/* HOUSE STATUS MINI CARD (EXPANDED ONLY) */}
        {!isCollapsed && (
          <div className="pt-4 px-1">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent border border-indigo-100/80 dark:border-indigo-950/60">
              <div className="flex items-center gap-2 mb-1 text-xs font-semibold text-indigo-900 dark:text-indigo-300">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                <span>Gia đình hạnh phúc</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed mb-2">
                Mọi công việc nhà và hóa đơn đều đang được kiểm soát tốt!
              </p>
              <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                <ShieldCheck className="w-3 h-3" />
                <span>Nhà cửa gọn gàng 100%</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* USER PROFILE & LOGOUT FOOTER */}
      <div className="p-2 border-t border-slate-200 dark:border-slate-800">
        {isCollapsed ? (
          <div className="flex flex-col items-center gap-2">
            <div
              title={`${displayName} (Chủ hộ)`}
              className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-semibold text-xs flex items-center justify-center uppercase shadow-sm cursor-default"
            >
              {displayName.charAt(0)}
            </div>
            <button
              onClick={handleLogout}
              title="Đăng xuất"
              aria-label="Đăng xuất"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-spring btn-press"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-semibold text-xs flex items-center justify-center shrink-0 uppercase shadow-sm">
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
              aria-label="Đăng xuất"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-spring btn-press"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
