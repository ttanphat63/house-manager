import { AuthButton } from "@/components/auth-button";
import { hasEnvVars } from "@/lib/utils";
import { EnvVarWarning } from "@/components/env-var-warning";
import Link from "next/link";
import { Suspense } from "react";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center bg-gradient-to-b from-blue-50 to-white">
      <div className="flex-1 w-full flex flex-col items-center">
        {/* NAV */}
        <nav className="w-full flex justify-center border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="w-full max-w-5xl flex justify-between items-center p-4 px-6">
            <Link
              href={"/"}
              className="flex items-center gap-2 font-bold text-lg text-gray-900"
            >
              <span className="text-2xl">🏠</span>
              <span>House Manager</span>
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
        <div className="flex-1 flex flex-col items-center justify-center max-w-5xl w-full p-6 text-center mt-20">
          <div className="text-7xl mb-6">🏠</div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Quản lý nhà cửa <span className="text-blue-600">gọn gàng</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mb-8">
            Ứng dụng giúp gia đình bạn theo dõi hóa đơn điện, nước, internet,
            phân công việc nhà và chia sẻ chi tiêu một cách dễ dàng.
          </p>
          <div className="flex gap-4 mb-16">
            <Link
              href="/auth/sign-up"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition"
            >
              Bắt đầu miễn phí
            </Link>
            <Link
              href="/auth/login"
              className="bg-white hover:bg-gray-50 text-gray-800 font-semibold py-3 px-8 rounded-lg border border-gray-300 transition"
            >
              Đăng nhập
            </Link>
          </div>

          {/* FEATURES */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <div className="text-4xl mb-3">📋</div>
              <h3 className="font-bold text-lg mb-2 text-gray-900">
                Quản lý hóa đơn
              </h3>
              <p className="text-sm text-gray-600">
                Không bao giờ quên đóng tiền điện, nước, internet. Nhắc nhở tự
                động trước hạn.
              </p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <div className="text-4xl mb-3">✅</div>
              <h3 className="font-bold text-lg mb-2 text-gray-900">Việc nhà</h3>
              <p className="text-sm text-gray-600">
                Phân công việc rõ ràng cho từng thành viên. Theo dõi tiến độ
                hoàn thành.
              </p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <div className="text-4xl mb-3">💰</div>
              <h3 className="font-bold text-lg mb-2 text-gray-900">
                Chia tiền
              </h3>
              <p className="text-sm text-gray-600">
                Tự động chia đều chi phí cho các thành viên. Biết ai còn nợ bao
                nhiêu.
              </p>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <footer className="w-full flex items-center justify-center border-t mt-20 text-center text-xs gap-8 py-8 text-gray-500">
          <p>© 2026 House Manager — Made with ❤️ in Vietnam</p>
        </footer>
      </div>
    </main>
  );
}
