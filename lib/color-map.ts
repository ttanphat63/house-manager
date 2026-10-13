/**
 * Shared color map for member avatars and badges.
 * Used by: member-card, member-form-modal, bill-split-section, bill-split-display
 */
export const colorMap: Record<
  string,
  { bg: string; text: string; border: string; ring: string }
> = {
  indigo: {
    bg: "bg-indigo-100 dark:bg-indigo-950/60",
    text: "text-indigo-700 dark:text-indigo-300",
    border: "border-indigo-200 dark:border-indigo-800",
    ring: "ring-indigo-500/20",
  },
  purple: {
    bg: "bg-purple-100 dark:bg-purple-950/60",
    text: "text-purple-700 dark:text-purple-300",
    border: "border-purple-200 dark:border-purple-800",
    ring: "ring-purple-500/20",
  },
  amber: {
    bg: "bg-amber-100 dark:bg-amber-950/60",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-200 dark:border-amber-800",
    ring: "ring-amber-500/20",
  },
  emerald: {
    bg: "bg-emerald-100 dark:bg-emerald-950/60",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-200 dark:border-emerald-800",
    ring: "ring-emerald-500/20",
  },
  rose: {
    bg: "bg-rose-100 dark:bg-rose-950/60",
    text: "text-rose-700 dark:text-rose-300",
    border: "border-rose-200 dark:border-rose-800",
    ring: "ring-rose-500/20",
  },
  sky: {
    bg: "bg-sky-100 dark:bg-sky-950/60",
    text: "text-sky-700 dark:text-sky-300",
    border: "border-sky-200 dark:border-sky-800",
    ring: "ring-sky-500/20",
  },
};

/** Available color keys for member color picker */
export const colorOptions = [
  { key: "indigo", label: "Indigo", swatch: "bg-indigo-500" },
  { key: "purple", label: "Tím", swatch: "bg-purple-500" },
  { key: "amber", label: "Vàng", swatch: "bg-amber-500" },
  { key: "emerald", label: "Xanh lá", swatch: "bg-emerald-500" },
  { key: "rose", label: "Hồng", swatch: "bg-rose-500" },
  { key: "sky", label: "Xanh dương", swatch: "bg-sky-500" },
] as const;
