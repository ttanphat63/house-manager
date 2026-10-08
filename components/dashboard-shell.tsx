"use client";

import { useState, useEffect } from "react";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { DashboardTopbar } from "@/components/dashboard-topbar";

interface DashboardShellProps {
  userEmail?: string;
  children: React.ReactNode;
}

export function DashboardShell({ userEmail, children }: DashboardShellProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Read localStorage in useEffect to prevent SSR hydration mismatch
  useEffect(() => {
    try {
      const saved = localStorage.getItem("house_manager_sidebar_collapsed");
      if (saved !== null) {
        setIsCollapsed(saved === "true");
      }
    } catch {
      // Fallback gracefully if localStorage is unavailable
    }
  }, []);

  const handleToggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("house_manager_sidebar_collapsed", String(next));
      } catch {
        // Ignore write errors
      }
      return next;
    });
  };

  return (
    <div
      className={`min-h-screen bg-slate-50/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased selection:bg-indigo-500 selection:text-white flex flex-col md:grid md:grid-rows-[56px_1fr] transition-[grid-template-columns] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        isCollapsed
          ? "md:grid-cols-[64px_1fr]"
          : "md:grid-cols-[240px_1fr]"
      }`}
    >
      {/* DESKTOP SIDEBAR: Grid column 1, spans rows 1 & 2 */}
      <div className="hidden md:flex md:col-start-1 md:row-start-1 md:row-span-2 md:h-screen md:sticky md:top-0 z-40 overflow-hidden">
        <DashboardSidebar
          userEmail={userEmail}
          isCollapsed={isCollapsed}
          onToggleCollapse={handleToggleCollapse}
        />
      </div>

      {/* MOBILE SIDEBAR OVERLAY & DRAWER (< 768px) */}
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
              isCollapsed={false}
            />
          </div>
        </div>
      )}

      {/* TOPBAR: Grid column 2, row 1 */}
      <div className="md:col-start-2 md:row-start-1 z-30">
        <DashboardTopbar
          userEmail={userEmail}
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
        />
      </div>

      {/* MAIN CONTENT WRAPPER: Grid column 2, row 2 */}
      <div className="md:col-start-2 md:row-start-2 flex flex-col min-w-0 flex-1">
        {/* INNER CONTENT CONTAINER: p-6 padding & max-w-[1600px] */}
        <main className="flex-1 p-4 sm:p-6 max-w-[1600px] w-full mx-auto">
          {children}
        </main>

        {/* SUBTLE FOOTER */}
        <footer className="w-full border-t border-slate-200/60 dark:border-slate-800/80 py-4 px-6 text-center text-xs text-slate-400 dark:text-slate-500">
          <p>© 2026 House Manager — Hệ thống quản lý gia đình thông minh</p>
        </footer>
      </div>
    </div>
  );
}
