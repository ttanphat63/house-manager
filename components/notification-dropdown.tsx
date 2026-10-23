"use client";

import { useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Receipt,
  UserPlus,
  UserMinus,
  Info,
  CheckCheck,
  ExternalLink,
} from "lucide-react";
import type { Notification, NotificationType } from "@/types/database";
import {
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "@/app/protected/actions";

interface NotificationDropdownProps {
  notifications: Notification[];
  onClose: () => void;
}

export function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffInSeconds = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 1000));

  if (diffInSeconds < 60) {
    return "vừa xong";
  }
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} phút trước`;
  }
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} giờ trước`;
  }
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) {
    return "Hôm qua";
  }
  if (diffInDays < 30) {
    return `${diffInDays} ngày trước`;
  }
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case "bill_due":
      return (
        <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
          <Receipt className="w-4 h-4" />
        </div>
      );
    case "member_joined":
      return (
        <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
          <UserPlus className="w-4 h-4" />
        </div>
      );
    case "member_kicked":
      return (
        <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
          <UserMinus className="w-4 h-4" />
        </div>
      );
    case "system":
    default:
      return (
        <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
          <Info className="w-4 h-4" />
        </div>
      );
  }
}

export function NotificationDropdown({
  notifications,
  onClose,
}: NotificationDropdownProps) {
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isPending, startTransition] = useTransition();

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Handle click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  const handleItemClick = (notification: Notification) => {
    startTransition(async () => {
      if (!notification.read) {
        try {
          await markNotificationAsRead(notification.id);
        } catch (err) {
          console.error("Failed to mark notification as read", err);
        }
      }

      if (notification.link) {
        router.push(notification.link);
      }
      onClose();
    });
  };

  const handleMarkAllRead = () => {
    if (unreadCount === 0 || isPending) return;
    startTransition(async () => {
      try {
        await markAllNotificationsAsRead();
      } catch (err) {
        console.error("Failed to mark all notifications as read", err);
      }
    });
  };

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-full mt-2 w-80 sm:w-96 max-w-[calc(100vw-2rem)] bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200/70 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">
            Thông báo
          </span>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
              {unreadCount} mới
            </span>
          )}
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            disabled={isPending}
            className="flex items-center gap-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 disabled:opacity-50 transition-colors"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Đọc tất cả</span>
          </button>
        )}
      </div>

      {/* List */}
      <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
        {notifications.length === 0 ? (
          <div className="py-10 px-4 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3 text-slate-400">
              <Bell className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Không có thông báo nào
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              Bạn đã cập nhật hết mọi tin tức trong nhà!
            </p>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => handleItemClick(n)}
              className={`p-3.5 flex items-start gap-3 cursor-pointer transition-colors relative hover:bg-slate-50/80 dark:hover:bg-slate-800/50 ${
                !n.read
                  ? "bg-indigo-50/40 dark:bg-indigo-950/20"
                  : ""
              }`}
            >
              {/* Type Icon */}
              {getNotificationIcon(n.type)}

              {/* Text Body */}
              <div className="flex-1 min-w-0 pr-2">
                <div className="flex items-center justify-between gap-2">
                  <p
                    className={`text-xs truncate ${
                      !n.read
                        ? "font-semibold text-slate-900 dark:text-slate-100"
                        : "font-medium text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {n.title}
                  </p>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 shrink-0 tabular-nums">
                    {formatTimeAgo(n.created_at)}
                  </span>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                  {n.message}
                </p>

                {n.link && (
                  <div className="mt-1 flex items-center gap-1 text-[11px] font-medium text-indigo-600 dark:text-indigo-400">
                    <span>Xem chi tiết</span>
                    <ExternalLink className="w-3 h-3" />
                  </div>
                )}
              </div>

              {/* Unread Indicator Dot */}
              {!n.read && (
                <div className="w-2 h-2 rounded-full bg-indigo-500 dark:bg-indigo-400 shrink-0 self-center" />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
