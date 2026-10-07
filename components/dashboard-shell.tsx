"use client";

import { useState } from "react";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { DashboardTopbar } from "@/components/dashboard-topbar";

interface DashboardShellProps {
  userEmail?: string;
  children: React.ReactNode;
}

export function DashboardShell({ userEmail, children }: DashboardShellProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-slate-50/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased selection:bg-indigo-500 selection:text-white">
      {/* DESKTOP SIDEBAR (FIXED) */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-40">
        <DashboardSidebar userEmail={userEmail} />
      </div>

      {/* MOBILE SIDEBAR OVERLAY & DRAWER */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden animate-in fade-in duration-200">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Drawer */}
          <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-white dark:bg-slate-900 shadow-2xl z-50 animate-in slide-in-from-left duration-250">
            <DashboardSidebar
              userEmail={userEmail}
              onNavigate={() => setIsMobileMenuOpen(false)}
            />
          </div>
        </div>
      )}

      {/* MAIN CONTAINER (OFFSET BY SIDEBAR WIDTH ON MD) */}
      <div className="flex-1 md:pl-64 flex flex-col min-w-0 min-h-screen">
        {/* TOPBAR */}
        <DashboardTopbar
          userEmail={userEmail}
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
        />

        {/* CONTENT */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>

        {/* SUBTLE FOOTER */}
        <footer className="w-full border-t border-slate-200/60 dark:border-slate-800/80 py-6 px-6 text-center text-xs text-slate-400 dark:text-slate-500">
          <p>© 2026 House Manager — Hệ thống quản lý gia đình thông minh</p>
        </footer>
      </div>
    </div>
  );
}
