import { Zap, Droplets, Wifi, Package } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type BillType = "electric" | "water" | "net" | "other";

export interface TypeConfig {
  label: string;
  icon: LucideIcon;
  /** Tailwind text color classes */
  color: string;
  /** Tailwind bg color classes */
  bg: string;
  /** Tailwind border color classes */
  border: string;
  /** Badge classes (bg + text + border combined) */
  badge: string;
  /** Hex color for charts */
  hex: string;
}

export const typeConfig: Record<BillType, TypeConfig> = {
  electric: {
    label: "Điện",
    icon: Zap,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-100 dark:bg-amber-950/50",
    border: "border-amber-200 dark:border-amber-800",
    badge:
      "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
    hex: "#f59e0b",
  },
  water: {
    label: "Nước",
    icon: Droplets,
    color: "text-sky-600 dark:text-sky-400",
    bg: "bg-sky-100 dark:bg-sky-950/50",
    border: "border-sky-200 dark:border-sky-800",
    badge:
      "bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800",
    hex: "#0ea5e9",
  },
  net: {
    label: "Internet",
    icon: Wifi,
    color: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-100 dark:bg-purple-950/50",
    border: "border-purple-200 dark:border-purple-800",
    badge:
      "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800",
    hex: "#a855f7",
  },
  other: {
    label: "Khác",
    icon: Package,
    color: "text-slate-600 dark:text-slate-400",
    bg: "bg-slate-100 dark:bg-slate-800",
    border: "border-slate-200 dark:border-slate-700",
    badge:
      "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700",
    hex: "#64748b",
  },
};
