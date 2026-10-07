import { AuthButton } from "@/components/auth-button";
import { hasEnvVars } from "@/lib/utils";
import { EnvVarWarning } from "@/components/env-var-warning";
import Link from "next/link";
import { Suspense } from "react";
import {
  Home,
  Receipt,
  CheckSquare,
  Wallet,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Heart,
} from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center bg-gradient-to-b from-indigo-50/60 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 transition-colors">
      <div className="flex-1 w-full flex flex-col items-center">
        {/* NAV */}
        <nav className="w-full flex justify-center border-b border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
          <div className="w-full max-w-6xl flex justify-between items-center p-4 px-6">
            <Link
              href="/"
              className="flex items-center gap-2.5 font-bold text-lg text-slate-900 dark:text-slate-100 group"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/25 group-hover:scale-105 transition-spring">
                <Home className="w-5 h-5" />
              </div>
              <span className="tracking-tight">House Manager</span>
            </Link>
            {!hasEnvVars ? (
              <EnvVarWarning />
            ) : (
              <Suspense>
                <AuthButton />
              </Suspense>
            )}
          </div>
        </nav>

        {/* HERO */}
        <div className="flex-1 flex flex-col items-center justify-center max-w-4xl w-full px-6 py-16 md:py-24 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-900 text-indigo-700 dark:text-indigo-300 text-xs font-semibold mb-8 animate-in fade-in duration-300">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Nền tảng quản lý gia đình hiện đại 2026</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight leading-tight mb-6">
            Quản lý nhà cửa{" "}
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              thông minh & gọn gàng
            </span>
          </h1>

          <p className="text-base md:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mb-10 leading-relaxed">
            Ứng dụng giúp gia đình bạn theo dõi hóa đơn điện, nước, internet,
            phân công việc nhà công bằng và kiểm soát chi tiêu sinh hoạt một cách dễ dàng.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mb-20 w-full sm:w-auto">
            <Link
              href="/auth/sign-up"
              className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-semibold py-3.5 px-8 rounded-xl transition-spring shadow-lg shadow-indigo-600/30 btn-press"
            >
              <span>Bắt đầu miễn phí</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/auth/login"
              className="inline-flex items-center justify-center bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold py-3.5 px-8 rounded-xl border border-slate-200 dark:border-slate-700 transition-spring shadow-sm btn-press"
            >
              Đăng nhập
            </Link>
          </div>

          {/* FEATURES */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm card-hover">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4">
                <Receipt className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg mb-2 text-slate-900 dark:text-slate-100">
                Quản lý hóa đơn
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Không bao giờ quên đóng tiền điện, nước, internet. Cảnh báo tự
                động trước hạn thanh toán.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm card-hover">
              <div className="w-12 h-12 rounded-xl bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center mb-4">
                <CheckSquare className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg mb-2 text-slate-900 dark:text-slate-100">
                Phân chia việc nhà
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Phân công việc rõ ràng cho từng thành viên trong gia đình. Theo dõi tiến độ hoàn thành theo thời gian thực.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm card-hover">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
                <Wallet className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg mb-2 text-slate-900 dark:text-slate-100">
                Kiểm soát ngân sách
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Tổng hợp chi phí sinh hoạt hàng tháng trực quan, minh bạch với thống kê từng danh mục chi tiết.
              </p>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <footer className="w-full flex items-center justify-center border-t border-slate-200/80 dark:border-slate-800 mt-16 text-center text-xs py-8 text-slate-400 dark:text-slate-500">
          <p className="flex items-center gap-1.5">
            © 2026 House Manager — Xây dựng với <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> tại Việt Nam
          </p>
        </footer>
      </div>
    </main>
  );
}
