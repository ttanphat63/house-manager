"use client";

import Link from "next/link";
import {
  Menu,
  X,
  Bell,
  Plus,
  Calendar,
  Sparkles,
  Search,
} from "lucide-react";
import { ThemeSwitcher } from "./theme-switcher";

interface DashboardTopbarProps {
  userEmail?: string;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
}

export function DashboardTopbar({
  userEmail,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
}: DashboardTopbarProps) {
  const todayFormatted = new Intl.DateTimeFormat("vi-VN", {
    weekday: "long",
    day: "numeric",
    month: "numeric",
    year: "numeric",
  }).format(new Date());

  const displayName = userEmail ? userEmail.split("@")[0] : "Bạn";

  return (
    <header className="sticky top-0 z-30 h-16 w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors">
      <div className="h-full px-4 sm:px-6 md:px-8 flex items-center justify-between gap-4">
        {/* LEFT: MOBILE TOGGLE & BREADCRUMB / DATE */}
        <div className="flex items-center gap-3 md:gap-4">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-spring btn-press"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                Bảng điều khiển
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Trực tuyến
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span className="capitalize">{todayFormatted}</span>
            </div>
          </div>
        </div>

        {/* RIGHT: ACTIONS & USER */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* QUICK ADD BILL */}
          <Link
            href="/protected/bills/new"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white shadow-sm shadow-indigo-600/30 transition-spring btn-press"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Thêm hóa đơn</span>
            <span className="sm:hidden">Thêm</span>
          </Link>

          {/* NOTIFICATION */}
          <button
            title="Thông báo"
            className="relative p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-spring btn-press"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900"></span>
          </button>

          {/* THEME SWITCHER */}
          <div className="hidden sm:block">
            <ThemeSwitcher />
          </div>

          {/* USER AVATAR BADGE */}
          <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center justify-center uppercase">
              {displayName.charAt(0)}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
