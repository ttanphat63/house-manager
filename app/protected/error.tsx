"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";

export default function ProtectedError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Protected area error:", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-500 flex items-center justify-center mx-auto mb-4 shadow-sm">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
          Đã xảy ra lỗi
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          Có lỗi không mong muốn. Vui lòng thử lại hoặc quay về trang chủ.
        </p>
        {error.digest && (
          <p className="text-[10px] font-mono tabular-nums text-slate-400 mb-4">
            Error ID: {error.digest}
          </p>
        )}
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-all shadow-sm"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Thử lại</span>
          </button>
          <Link
            href="/protected"
            className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-sm px-5 py-2.5 rounded-xl transition-all"
          >
            <Home className="w-4 h-4" />
            <span>Trang chủ</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
