# BLUEPRINT — Phase 5.4b → V2.0

> Master plan cho 3 phases còn lại của House Manager.
> Mỗi task có đủ chi tiết để code mà không cần hỏi lại.

---

## Tổng quan

| Phase | Mục tiêu | Estimate | Dependencies |
|-------|----------|----------|-------------|
| **5.4b** | Bills Enhancement (filter tháng, sort, bulk actions) | ~250 LOC | Không |
| **5.4c** | Polish + Export (CSV, error boundary, loading states) | ~300 LOC | 5.4b xong trước |
| **5.5** | Multi-Group Architecture (groups, invite, switcher) | ~800 LOC + SQL | 5.4c xong trước |

**Tổng estimate**: ~1350 LOC code + ~60 LOC SQL migration

---

## Phase 5.4b: Bills Enhancement

**Mục tiêu:** Nâng `/protected/bills` từ list → trung tâm quản lý hóa đơn.

**Files ảnh hưởng:**
- MODIFY `components/bills-list-client.tsx` (chính — hiện 462 dòng)
- NO new files (tất cả thay đổi nằm trong client component)

---

### Task 5.4b.1: Filter theo tháng

**File:** MODIFY `components/bills-list-client.tsx`

**State mới (thêm vào cạnh dòng 84-86 hiện tại):**
```ts
const [monthFilter, setMonthFilter] = useState<string>("all");
// "all" = tất cả, "2026-10" = chỉ tháng 10/2026
```

**Logic tính danh sách tháng (thêm useMemo mới, sau statusCounts):**
```ts
const availableMonths = useMemo(() => {
  const monthSet = new Set<string>();
  initialBills.forEach((b) => {
    const ym = b.due_date?.slice(0, 7);
    if (ym) monthSet.add(ym);
  });
  return Array.from(monthSet).sort((a, b) => b.localeCompare(a));
}, [initialBills]);
```

**Logic filter — thêm vào filteredBills useMemo (sau dòng 121 — sau type filter check):**
```ts
// 4. Month filter
if (monthFilter !== "all" && bill.due_date?.slice(0, 7) !== monthFilter) return false;
```

**Cập nhật hasActiveFilters (dòng 127-128):**
```ts
const hasActiveFilters =
  searchQuery.trim() !== "" || statusFilter !== "all" || typeFilter !== "all" || monthFilter !== "all";
```

**Cập nhật handleResetFilters (dòng 130-134):**
```ts
function handleResetFilters() {
  setSearchQuery("");
  setStatusFilter("all");
  setTypeFilter("all");
  setMonthFilter("all");
}
```

**UI — Thêm dropdown cạnh search input.**

Hiện tại search input ở dòng 141-160 nằm trong `<div className="relative">`. Wrap search + month dropdown vào flex row:

```tsx
{/* ROW 1: SEARCH + MONTH FILTER */}
<div className="flex gap-2.5 items-center">
  {/* Search input — giữ nguyên code hiện tại nhưng bọc trong div flex-1 */}
  <div className="relative flex-1">
    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
    <input ... /> {/* giữ nguyên */}
    {searchQuery && ( <button ...> )} {/* giữ nguyên */}
  </div>

  {/* Month filter dropdown — NEW */}
  <select
    value={monthFilter}
    onChange={(e) => setMonthFilter(e.target.value)}
    className="px-3 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all cursor-pointer min-w-[140px]"
  >
    <option value="all">Tất cả tháng</option>
    {availableMonths.map((ym) => {
      const [y, m] = ym.split("-");
      return (
        <option key={ym} value={ym}>
          Tháng {parseInt(m, 10)}/{y}
        </option>
      );
    })}
  </select>
</div>
```

**Edge cases:**
- 0 bills → `availableMonths` rỗng → dropdown chỉ hiển thị "Tất cả tháng"
- Chọn tháng không có bill phù hợp status/type filter → empty state (đã có ở dòng 317-347)
- Reset filter cũng reset monthFilter

**Estimate:** ~30 LOC thay đổi

---

### Task 5.4b.2: Sort options

**File:** MODIFY `components/bills-list-client.tsx`

**State mới (thêm cạnh monthFilter):**
```ts
type SortOption = "newest" | "oldest" | "amount-high" | "amount-low" | "due-soon";
const [sortBy, setSortBy] = useState<SortOption>("newest");
```

**Logic sort — thêm useMemo MỚI sau filteredBills (sau dòng 125):**
```ts
const sortedBills = useMemo(() => {
  const sorted = [...filteredBills];
  switch (sortBy) {
    case "newest":
      sorted.sort((a, b) => b.due_date.localeCompare(a.due_date));
      break;
    case "oldest":
      sorted.sort((a, b) => a.due_date.localeCompare(b.due_date));
      break;
    case "amount-high":
      sorted.sort((a, b) => b.amount - a.amount);
      break;
    case "amount-low":
      sorted.sort((a, b) => a.amount - b.amount);
      break;
    case "due-soon":
      sorted.sort((a, b) => {
        if (a.paid !== b.paid) return a.paid ? 1 : -1;
        return a.due_date.localeCompare(b.due_date);
      });
      break;
  }
  return sorted;
}, [filteredBills, sortBy]);
```

**QUAN TRỌNG:** Thay `filteredBills` → `sortedBills` trong:
- Result count display (dòng 299): `{filteredBills.length}` → `{sortedBills.length}`
- Bills list `.map()` (dòng 350): `{filteredBills.map(` → `{sortedBills.map(`

**UI — Thêm sort dropdown cạnh month filter (trong flex row từ Task 5.4b.1):**

```tsx
{/* Sort dropdown — NEW */}
<select
  value={sortBy}
  onChange={(e) => setSortBy(e.target.value as SortOption)}
  className="px-3 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all cursor-pointer min-w-[150px]"
>
  <option value="newest">Mới nhất</option>
  <option value="oldest">Cũ nhất</option>
  <option value="amount-high">Số tiền ↓</option>
  <option value="amount-low">Số tiền ↑</option>
  <option value="due-soon">Hạn đóng gần</option>
</select>
```

**Edge cases:**
- Reset filter: KHÔNG reset sort (sort là preference, không phải filter)
- 0 bills → sort vẫn chạy bình thường (result = [])

**Estimate:** ~35 LOC thay đổi

---

### Task 5.4b.3: Bulk actions — Checkbox + "Chọn tất cả" + Mark Paid / Delete

**File:** MODIFY `components/bills-list-client.tsx`

Đây là task lớn nhất — thêm state, UI, Supabase batch operations, confirm dialog.

**Import thêm (dòng 1-23 — thêm vào import block):**
```ts
// thêm vào lucide import:
import { ..., CheckSquare, Square, Trash2, AlertTriangle, Loader2 } from "lucide-react";
// import mới:
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
```

Lưu ý: `useRouter` và `createClient` hiện CHƯA CÓ trong file — cần thêm.

**State mới (thêm cạnh sortBy):**
```ts
const router = useRouter();
const supabase = createClient();

const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
const [bulkLoading, setBulkLoading] = useState(false);
const [showBulkConfirm, setShowBulkConfirm] = useState<"delete" | "paid" | null>(null);
```

**Effect: clear selection khi filter thay đổi (thêm sau state declarations):**
```ts
useEffect(() => {
  setSelectedIds(new Set());
}, [statusFilter, typeFilter, monthFilter, searchQuery]);
```

Thêm `useEffect` vào import React (dòng 3): `import React, { useState, useMemo, useEffect } from "react";`

**Helper functions (thêm sau handleResetFilters):**
```ts
function toggleSelect(id: string) {
  setSelectedIds((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  });
}

function toggleSelectAll() {
  if (selectedIds.size === sortedBills.length) {
    setSelectedIds(new Set());
  } else {
    setSelectedIds(new Set(sortedBills.map((b) => b.id)));
  }
}

const isAllSelected = sortedBills.length > 0 && selectedIds.size === sortedBills.length;
const hasSelection = selectedIds.size > 0;
```

**Bulk action handlers:**
```ts
async function handleBulkMarkPaid() {
  setBulkLoading(true);
  const ids = Array.from(selectedIds);
  const { error } = await supabase
    .from("bills")
    .update({ paid: true, paid_date: new Date().toISOString().split("T")[0] })
    .in("id", ids);

  setBulkLoading(false);
  setShowBulkConfirm(null);
  if (!error) {
    setSelectedIds(new Set());
    router.refresh();
  } else {
    alert("Lỗi: " + error.message);
  }
}

async function handleBulkDelete() {
  setBulkLoading(true);
  const ids = Array.from(selectedIds);
  // Delete splits first (foreign key), then bills
  await supabase.from("bill_splits").delete().in("bill_id", ids);
  const { error } = await supabase.from("bills").delete().in("id", ids);

  setBulkLoading(false);
  setShowBulkConfirm(null);
  if (!error) {
    setSelectedIds(new Set());
    router.refresh();
  } else {
    alert("Lỗi: " + error.message);
  }
}
```

**UI 1 — "Chọn tất cả" + count (modify RESULT COUNT section dòng 294-314):**

Replace entire result count div:
```tsx
<div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
  <div className="flex items-center gap-3">
    {/* Select All toggle */}
    <button
      type="button"
      onClick={toggleSelectAll}
      className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all"
    >
      {isAllSelected ? (
        <CheckSquare className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
      ) : (
        <Square className="w-3.5 h-3.5" />
      )}
      <span>{isAllSelected ? "Bỏ chọn" : "Chọn tất cả"}</span>
    </button>

    <span>
      Hiển thị{" "}
      <strong className="text-slate-900 dark:text-slate-100 font-mono tabular-nums">
        {sortedBills.length}
      </strong>{" "}
      / <span className="font-mono tabular-nums">{initialBills.length}</span> hóa đơn
    </span>
  </div>

  {hasActiveFilters && (
    <button type="button" onClick={handleResetFilters}
      className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:underline font-medium transition-all">
      <RotateCcw className="w-3 h-3" />
      <span>Đặt lại bộ lọc</span>
    </button>
  )}
</div>
```

**UI 2 — Bulk action bar (thêm SAU result count div, TRƯỚC bills list):**
```tsx
{hasSelection && (
  <div className="flex items-center justify-between gap-3 px-4 py-3 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/60 rounded-xl animate-in slide-in-from-top-2 duration-200">
    <div className="flex items-center gap-2 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
      <CheckSquare className="w-4 h-4" />
      <span className="font-mono tabular-nums">{selectedIds.size}</span>
      <span>hóa đơn đã chọn</span>
    </div>
    <div className="flex items-center gap-2">
      <button type="button" onClick={() => setShowBulkConfirm("paid")}
        className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-sm">
        <CheckCircle2 className="w-3.5 h-3.5" />
        <span>Đánh dấu đã đóng</span>
      </button>
      <button type="button" onClick={() => setShowBulkConfirm("delete")}
        className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white transition-all shadow-sm">
        <Trash2 className="w-3.5 h-3.5" />
        <span>Xóa</span>
      </button>
      <button type="button" onClick={() => setSelectedIds(new Set())}
        className="text-xs font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 px-2 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
        Bỏ chọn
      </button>
    </div>
  </div>
)}
```

**UI 3 — Checkbox trên mỗi bill card (thêm VÀO ĐẦU flex row dòng 368):**

Trước `<div className={`w-9 h-9 rounded-xl ...`}>` icon, thêm:
```tsx
<button
  type="button"
  onClick={(e) => { e.stopPropagation(); toggleSelect(bill.id); }}
  className="shrink-0 p-0.5 rounded transition-all"
>
  {selectedIds.has(bill.id) ? (
    <CheckSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
  ) : (
    <Square className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-slate-400" />
  )}
</button>
```

**UI 4 — Confirm dialog (thêm VÀO CUỐI component, trước closing `</div>`):**

Reuse pattern 1:1 từ `delete-bill-button.tsx` (dòng 41-91):

```tsx
{showBulkConfirm && (
  <div
    className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
    onClick={() => !bulkLoading && setShowBulkConfirm(null)}
  >
    <div
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="text-center mb-5">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 ${
          showBulkConfirm === "delete"
            ? "bg-rose-100 dark:bg-rose-950/50 text-rose-600"
            : "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600"
        }`}>
          {showBulkConfirm === "delete" ? (
            <AlertTriangle className="w-6 h-6" />
          ) : (
            <CheckCircle2 className="w-6 h-6" />
          )}
        </div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">
          {showBulkConfirm === "delete"
            ? `Xóa ${selectedIds.size} hóa đơn?`
            : `Đánh dấu ${selectedIds.size} hóa đơn đã đóng?`}
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {showBulkConfirm === "delete"
            ? "Hành động này không thể hoàn tác. Tất cả dữ liệu đã chọn sẽ bị xóa vĩnh viễn."
            : "Các hóa đơn đã chọn sẽ được đánh dấu đã thanh toán với ngày hôm nay."}
        </p>
      </div>
      <div className="flex gap-3">
        <button onClick={() => setShowBulkConfirm(null)} disabled={bulkLoading}
          className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium py-2.5 rounded-xl transition-all">
          Hủy
        </button>
        <button
          onClick={showBulkConfirm === "delete" ? handleBulkDelete : handleBulkMarkPaid}
          disabled={bulkLoading}
          className={`flex-1 inline-flex items-center justify-center gap-2 text-white font-medium py-2.5 rounded-xl transition-all shadow-sm ${
            showBulkConfirm === "delete"
              ? "bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400"
              : "bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400"
          }`}>
          {bulkLoading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /><span>Đang xử lý...</span></>
          ) : showBulkConfirm === "delete" ? (
            <><Trash2 className="w-4 h-4" /><span>Xóa luôn</span></>
          ) : (
            <><CheckCircle2 className="w-4 h-4" /><span>Xác nhận</span></>
          )}
        </button>
      </div>
    </div>
  </div>
)}
```

**Edge cases:**
- Chọn bill đã paid → vẫn cho "Đánh dấu đã đóng" (Supabase update idempotent)
- Chuyển filter sau khi chọn → `useEffect` tự clear `selectedIds`
- `bulkLoading = true` → disable tất cả nút trong dialog + backdrop click
- Xóa bills có splits → xóa splits trước (foreign key constraint)

**Estimate:** ~170 LOC thay đổi

---

### Phase 5.4b — Manual Test Checklist

- [ ] Filter tháng: chọn tháng cụ thể → chỉ hiện bills tháng đó
- [ ] Filter tháng: chọn "Tất cả tháng" → hiện tất cả
- [ ] Sort: "Số tiền ↓" → bill nhiều tiền nhất ở trên
- [ ] Sort: "Hạn đóng gần" → unpaid bills ở trên, sorted by due_date ASC
- [ ] Sort + Filter kết hợp: filter "Chưa đóng" + sort "Số tiền ↓"
- [ ] Checkbox: click checkbox → bill selected, bulk bar hiện
- [ ] "Chọn tất cả" → tất cả bills trong filtered list được chọn
- [ ] Bulk "Đánh dấu đã đóng" → dialog → xác nhận → bills update → refresh
- [ ] Bulk "Xóa" → dialog → xác nhận → bills xóa → refresh
- [ ] Chọn rồi đổi filter → selection bị clear
- [ ] Dark mode: tất cả UI elements mới đều có dark variant
- [ ] Mobile: dropdowns và bulk bar responsive

---

## Phase 5.4c: Polish + Export

---

### Task 5.4c.1: Export CSV utility

**File:** NEW `lib/export-csv.ts`

```ts
/**
 * Generic CSV export utility.
 * Supports UTF-8 BOM for Excel compatibility with Vietnamese.
 */
export function exportToCsv<T extends Record<string, unknown>>(
  rows: T[],
  columns: { key: keyof T; header: string }[],
  filename: string
): void {
  const BOM = "\uFEFF";
  const headerRow = columns.map((c) => `"${c.header}"`).join(",");
  const dataRows = rows.map((row) =>
    columns
      .map((col) => {
        const val = row[col.key];
        if (val === null || val === undefined) return '""';
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      })
      .join(",")
  );
  const csv = BOM + [headerRow, ...dataRows].join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
```

**Estimate:** ~30 LOC

---

### Task 5.4c.2: Export button — Bills List

**File:** MODIFY `components/bills-list-client.tsx`

**Import thêm:**
```ts
import { Download } from "lucide-react";
import { exportToCsv } from "@/lib/export-csv";
```

**Handler (thêm sau bulk action handlers):**
```ts
function handleExportCsv() {
  const label = monthFilter !== "all" ? monthFilter : `all-${new Date().getFullYear()}`;
  exportToCsv(
    sortedBills,
    [
      { key: "title", header: "Tên hóa đơn" },
      { key: "type", header: "Loại" },
      { key: "amount", header: "Số tiền (VNĐ)" },
      { key: "due_date", header: "Hạn đóng" },
      { key: "paid", header: "Đã đóng" },
      { key: "paid_date", header: "Ngày đóng" },
      { key: "note", header: "Ghi chú" },
    ],
    `hoa-don-${label}.csv`
  );
}
```

**UI — Thêm nút cạnh "Đặt lại bộ lọc" trong result count row:**
```tsx
<button type="button" onClick={handleExportCsv} disabled={sortedBills.length === 0}
  className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
  title="Xuất CSV">
  <Download className="w-3.5 h-3.5" />
  <span>Xuất CSV</span>
</button>
```

**Estimate:** ~25 LOC

---

### Task 5.4c.3: Export button — Reports

**File:** MODIFY `components/reports-client.tsx`

**Import thêm (dòng 1-27):**
```ts
import { Download } from "lucide-react";
import { exportToCsv } from "@/lib/export-csv";
```

**Handler (thêm trong component, sau `mounted` effect):**
```ts
function handleExportMonthly() {
  exportToCsv(
    monthlyChartData,
    [
      { key: "month", header: "Tháng" },
      { key: "total", header: "Tổng chi (VNĐ)" },
      { key: "count", header: "Số hóa đơn" },
    ],
    `bao-cao-6-thang.csv`
  );
}
```

**UI — Thêm nút bên trên charts (sau dòng 139 `<div className="space-y-6">`):**
```tsx
<div className="flex justify-end">
  <button type="button" onClick={handleExportMonthly}
    className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
    <Download className="w-3.5 h-3.5" />
    <span>Xuất báo cáo CSV</span>
  </button>
</div>
```

**Estimate:** ~20 LOC

---

### Task 5.4c.4: Error Boundary

**File:** NEW `app/protected/error.tsx`

```tsx
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
          <button onClick={reset}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-all shadow-sm">
            <RotateCcw className="w-4 h-4" />
            <span>Thử lại</span>
          </button>
          <Link href="/protected"
            className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-sm px-5 py-2.5 rounded-xl transition-all">
            <Home className="w-4 h-4" />
            <span>Trang chủ</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
```

**Estimate:** ~50 LOC

---

### Phase 5.4c — Manual Test Checklist

- [ ] Bills: "Xuất CSV" → file CSV tải về, mở Excel hiển thị tiếng Việt đúng
- [ ] Bills: filter tháng 10 → export → chỉ có bills tháng 10
- [ ] Bills: 0 bills → nút export bị disabled
- [ ] Reports: "Xuất báo cáo CSV" → file CSV tải về với 6 dòng (6 tháng)
- [ ] Error boundary: throw error giả → trang error hiện, click "Thử lại" reload
- [ ] Dark mode: error page, export buttons hiện đúng

---

## Phase 5.5: Multi-Group Architecture (V2.0)

> ⚠️ **CẢNH BÁO**: Phase này thay đổi toàn bộ data model. PHẢI backup database trước.

**Mục tiêu:** "1 user = 1 nhà" → "1 user thuộc nhiều groups, mỗi group là 1 nhà".

---

### Task 5.5a: Database Migration

> ⚠️ CRITICAL — Migration sai = mất data. Test trên staging trước.

**File:** NEW `supabase/migrations/20261019_multi_group.sql`

#### Bước 1: Backup

```bash
# CHẠY TRƯỚC KHI LÀM GÌ KHÁC
pg_dump -Fc $DATABASE_URL > backup_pre_v2.dump
# Hoặc: Supabase Dashboard → Project Settings → Database → Download backup
```

#### Bước 2: SQL Migration

```sql
-- =============================================
-- PHASE 5.5a: Multi-Group Architecture
-- ⚠️ BACKUP DATABASE TRƯỚC KHI CHẠY
-- =============================================

-- 1. Create groups table
CREATE TABLE IF NOT EXISTS public.groups (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invite_code text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(4), 'hex'),
  avatar_emoji text DEFAULT '🏠',
  created_at timestamptz DEFAULT now() NOT NULL
);

-- 2. Create group_members junction table
CREATE TABLE IF NOT EXISTS public.group_members (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(group_id, user_id)
);

-- 3. Add group_id to existing tables (nullable first)
ALTER TABLE public.bills ADD COLUMN IF NOT EXISTS group_id uuid
  REFERENCES public.groups(id) ON DELETE CASCADE;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS group_id uuid
  REFERENCES public.groups(id) ON DELETE CASCADE;
ALTER TABLE public.chores ADD COLUMN IF NOT EXISTS group_id uuid
  REFERENCES public.groups(id) ON DELETE CASCADE;
ALTER TABLE public.bill_splits ADD COLUMN IF NOT EXISTS group_id uuid
  REFERENCES public.groups(id) ON DELETE CASCADE;

-- 4. Migrate existing data: 1 group per existing user
DO $$
DECLARE
  r RECORD;
  new_group_id uuid;
BEGIN
  FOR r IN (
    SELECT DISTINCT user_id FROM public.bills
    UNION SELECT DISTINCT user_id FROM public.members
    UNION SELECT DISTINCT user_id FROM public.chores
  ) LOOP
    INSERT INTO public.groups (name, owner_id)
    VALUES ('Gia đình', r.user_id)
    RETURNING id INTO new_group_id;

    INSERT INTO public.group_members (group_id, user_id, role)
    VALUES (new_group_id, r.user_id, 'owner')
    ON CONFLICT DO NOTHING;

    UPDATE public.bills SET group_id = new_group_id
      WHERE user_id = r.user_id AND group_id IS NULL;
    UPDATE public.members SET group_id = new_group_id
      WHERE user_id = r.user_id AND group_id IS NULL;
    UPDATE public.chores SET group_id = new_group_id
      WHERE user_id = r.user_id AND group_id IS NULL;
    UPDATE public.bill_splits SET group_id = new_group_id
      WHERE user_id = r.user_id AND group_id IS NULL;
  END LOOP;
END $$;

-- 5. Make group_id NOT NULL
ALTER TABLE public.bills ALTER COLUMN group_id SET NOT NULL;
ALTER TABLE public.members ALTER COLUMN group_id SET NOT NULL;
ALTER TABLE public.chores ALTER COLUMN group_id SET NOT NULL;
ALTER TABLE public.bill_splits ALTER COLUMN group_id SET NOT NULL;

-- 6. Indexes
CREATE INDEX IF NOT EXISTS idx_bills_group_id ON public.bills(group_id);
CREATE INDEX IF NOT EXISTS idx_members_group_id ON public.members(group_id);
CREATE INDEX IF NOT EXISTS idx_chores_group_id ON public.chores(group_id);
CREATE INDEX IF NOT EXISTS idx_bill_splits_group_id ON public.bill_splits(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user ON public.group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_groups_invite ON public.groups(invite_code);

-- 7. RLS for new tables
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members see their groups" ON public.groups
  FOR SELECT USING (
    id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid())
  );
CREATE POLICY "Owner manages group" ON public.groups
  FOR ALL USING (owner_id = auth.uid());
CREATE POLICY "Users create groups" ON public.groups
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Members see group members" ON public.group_members
  FOR SELECT USING (
    group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid())
  );
CREATE POLICY "Users join groups" ON public.group_members
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Owner/self can delete membership" ON public.group_members
  FOR DELETE USING (
    user_id = auth.uid()
    OR group_id IN (SELECT id FROM public.groups WHERE owner_id = auth.uid())
  );

-- 8. Update RLS for existing tables (group-based)
-- ⚠️ DROP existing user_id policies first!
-- Check exact names: Supabase Dashboard → Authentication → Policies
-- Pattern for each table (bills, members, chores, bill_splits):
--   DROP POLICY IF EXISTS "<exact_policy_name>" ON public.<table>;
--   CREATE POLICY "Group access" ON public.<table>
--     FOR ALL USING (
--       group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid())
--     );
```

> ⚠️ **Step 8 requires manual check:** Go to Supabase Dashboard → Auth → Policies, note exact policy names for bills/members/chores/bill_splits, then write exact DROP statements.

**Estimate:** ~60 LOC SQL

---

### Task 5.5b: TypeScript Types Update

**File:** MODIFY `types/database.ts`

Add new types:
```ts
export type Group = {
  id: string;
  name: string;
  owner_id: string;
  invite_code: string;
  avatar_emoji: string;
  created_at: string;
};

export type GroupMember = {
  id: string;
  group_id: string;
  user_id: string;
  role: "owner" | "admin" | "member";
  joined_at: string;
};
```

Add `group_id: string;` to existing types: `Bill`, `Member`, `Chore`, `BillSplit`.

**Estimate:** ~25 LOC

---

### Task 5.5c: Active Group Context

**File:** NEW `lib/group-context.ts`

```ts
import { cookies } from "next/headers";

const COOKIE_KEY = "active_group_id";

export async function getActiveGroupId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_KEY)?.value || null;
}

export async function setActiveGroupId(groupId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_KEY, groupId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });
}
```

Why cookie instead of localStorage? Server Components need to read active group for Supabase queries. Cookies are accessible from Server Components via `cookies()`.

**Estimate:** ~20 LOC

---

### Task 5.5d: Onboarding Page

**File:** NEW `app/protected/onboarding/page.tsx`

**Purpose:** User mới (chưa có group) → redirect đến đây. 2 options: "Tạo nhóm mới" hoặc "Tham gia qua mã mời".

**Component type:** `"use client"` (form interactions).

**UI Structure:**
```
┌─────────────────────────────────────────────┐
│  🏠 Chào mừng đến House Manager!           │
│  Bạn muốn bắt đầu như thế nào?             │
│                                              │
│  ┌──────────────┐  ┌──────────────┐         │
│  │ 🏡           │  │ 🔗           │         │
│  │ Tạo nhóm     │  │ Tham gia     │         │
│  │ mới          │  │ nhóm         │         │
│  │              │  │              │         │
│  │ [Input tên]  │  │ [Input code] │         │
│  │ [Tạo]        │  │ [Tham gia]   │         │
│  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────┘
```

**Tailwind classes:**
```
page container: "min-h-[80vh] flex items-center justify-center p-6"
grid: "grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl w-full"
card: "bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 text-center hover:shadow-lg transition-all"
input: "w-full px-4 py-3 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20"
```

**Logic:**
1. "Tạo nhóm": insert into `groups` + insert into `group_members` (owner) → setActiveGroupId → redirect `/protected`
2. "Tham gia": query `groups` by `invite_code` → if found, insert `group_members` → setActiveGroupId → redirect `/protected`
3. Error: "Mã mời không hợp lệ" hoặc "Bạn đã ở trong nhóm này"

**Estimate:** ~120 LOC

---

### Task 5.5e: Onboarding Guard

**File:** MODIFY `app/protected/layout.tsx` (hoặc wherever the layout auth check is)

After auth check, add:
```ts
const { data: userGroups } = await supabase
  .from("group_members")
  .select("group_id")
  .eq("user_id", userId)
  .limit(1);

// Redirect to onboarding if no groups (and not already on onboarding page)
// Need to check current pathname — use headers or a wrapper component
if ((!userGroups || userGroups.length === 0) && !isOnboardingPage) {
  redirect("/protected/onboarding");
}
```

⚠️ Must avoid redirect loop — onboarding page must be exempted from this check.

**Estimate:** ~15 LOC

---

### Task 5.5f: Group Switcher in Sidebar

**File:** MODIFY `components/dashboard-sidebar.tsx`

**Props to add (interface at dòng 21-26):**
```ts
interface DashboardSidebarProps {
  userEmail?: string;
  onNavigate?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  // NEW:
  activeGroup?: { id: string; name: string; avatar_emoji: string } | null;
  userGroups?: { id: string; name: string; avatar_emoji: string }[];
}
```

**UI — Add between brand header (dòng 90-140) and navigation (dòng 142):**

When expanded:
```tsx
{!isCollapsed && activeGroup && userGroups && userGroups.length > 0 && (
  <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-800">
    <select
      value={activeGroup.id}
      onChange={(e) => handleSwitchGroup(e.target.value)}
      className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 cursor-pointer"
    >
      {userGroups.map((g) => (
        <option key={g.id} value={g.id}>
          {g.avatar_emoji} {g.name}
        </option>
      ))}
    </select>
  </div>
)}
```

When collapsed: show emoji only with tooltip.

`handleSwitchGroup` → Server Action that calls `setActiveGroupId(groupId)` + `router.refresh()`.

**Estimate:** ~60 LOC

---

### Task 5.5g: Update ALL Supabase Queries

**Pattern for EVERY server page:**

```ts
// IMPORT
import { getActiveGroupId } from "@/lib/group-context";

// IN async function (before queries):
const groupId = await getActiveGroupId();
if (!groupId) redirect("/protected/onboarding");

// CHANGE each query: add .eq("group_id", groupId)
const { data: bills } = await supabase
  .from("bills")
  .select("*")
  .eq("group_id", groupId)       // ← ADD THIS
  .order("due_date", { ascending: false });
```

**Files to update:**

| File | Queries to change |
|------|------------------|
| `app/protected/page.tsx` (dòng 74-83) | 4 queries: bills, bill_splits, chores, members |
| `app/protected/bills/page.tsx` (dòng 36-44) | 2 queries: bills, bill_splits |
| `app/protected/bills/new/page.tsx` (dòng 61-67) | 1 query: members. Plus insert must include `group_id` |
| `app/protected/bills/[id]/edit/page.tsx` | Fetch + update must use `group_id` |
| `app/protected/chores/page.tsx` (dòng 29-38) | 2 queries: chores, members |
| `app/protected/members/page.tsx` (dòng 38-47) | 2 queries: members, bills |
| `app/protected/reports/page.tsx` (dòng 28-31) | 1 query: bills |

**Also update Client Components that do writes:**
- `components/mark-paid-button.tsx` — update doesn't need group_id (RLS handles it)
- `components/bills-list-client.tsx` — bulk delete/paid — RLS handles it
- `components/chores-card.tsx` — toggle chore — RLS handles it
- Client inserts (new bill, new chore, new member) — MUST include `group_id` in the insert payload

**How to get `group_id` in Client Components:**
- Pass as prop from Server Component parent
- Or read from cookie via a helper (but `cookies()` is server-only)
- **Recommendation:** Pass `groupId` as prop from each server page to its client component.

**Estimate:** ~80 LOC (many files, few changes each)

---

### Task 5.5h: Settings Page

**File:** NEW `app/protected/settings/page.tsx`

**UI Structure:**
```
┌──────────────────────────────────────┐
│ ← Cài đặt nhóm                      │
│                                       │
│ ┌── Thông tin nhóm ──┐               │
│ │ Tên: [Gia đình   ] [Lưu]          │
│ │ Mã mời: ABC123DE  [📋 Copy]       │
│ └────────────────────┘                │
│                                       │
│ ┌── Thành viên (3) ──┐               │
│ │ 👤 admin    owner                  │
│ │ 👤 wife     member  [Kick]         │
│ │ 👤 son      member  [Kick]         │
│ └────────────────────┘                │
│                                       │
│ ⚠️ Vùng nguy hiểm                    │
│ [Rời nhóm]  [Xóa nhóm]              │
└──────────────────────────────────────┘
```

**Logic:**
- Owner sees "Kick" buttons + "Xóa nhóm"
- Members see "Rời nhóm" only
- Copy invite: `navigator.clipboard.writeText(code)` + visual feedback
- Rename: `supabase.from("groups").update({ name }).eq("id", groupId)`
- Delete group: cascade deletes everything

**Sidebar nav update** (`dashboard-sidebar.tsx`): Add settings nav item:
```ts
{
  title: "Cài đặt",
  href: "/protected/settings",
  icon: Settings, // import from lucide-react
  active: pathname === "/protected/settings",
}
```

**Estimate:** ~200 LOC

---

### Phase 5.5 — Manual Test Checklist

**Migration:**
- [ ] Backup database before migration
- [ ] Run SQL — no errors
- [ ] Verify: each user has 1 auto-created group "Gia đình"
- [ ] Verify: all bills/members/chores/bill_splits have group_id filled
- [ ] Verify: `group_id` is NOT NULL on all tables
- [ ] RLS: user A cannot see user B's data

**Onboarding:**
- [ ] New user signup → redirected to `/protected/onboarding`
- [ ] Create group → redirect to dashboard, data shows correctly
- [ ] Join via invite code → success, see group's data
- [ ] Invalid invite code → error message
- [ ] Already in group → error message

**Group Switcher:**
- [ ] Sidebar shows current group + dropdown
- [ ] Switch group → dashboard data changes immediately
- [ ] Cookie persists → page reload stays on correct group
- [ ] New bill/chore/member → inserted with correct group_id

**Settings:**
- [ ] Rename group → save successful
- [ ] Copy invite code → clipboard works
- [ ] Owner kicks member → member removed
- [ ] Member leaves → redirected to group switcher/onboarding
- [ ] Owner deletes group → cascade delete → redirect

---

## Rollback Plan

### Phase 5.4b/5.4c — Low risk
- `git revert` the commit
- No database changes

### Phase 5.5 — High risk ⚠️

**Before migration:**
1. `pg_dump -Fc $DATABASE_URL > backup_pre_v2.dump`
2. Note all RLS policy names: `\dp bills`, `\dp members`, `\dp chores`, `\dp bill_splits`

**If migration fails mid-way:**
1. Restore: `pg_restore -d $DATABASE_URL backup_pre_v2.dump`
2. `git revert` code changes

**If migration OK but app breaks:**
1. Keep database (data migrated correctly)
2. `git revert` code → app uses old code
3. Old code still works because:
   - Old queries use `user_id` filter (RLS still active)
   - `group_id` column exists but old code ignores it
   - No breaking change to old code

---

## Execution Order

```
5.4b.1  Filter tháng          ~30 LOC   → test
5.4b.2  Sort options           ~35 LOC   → test
5.4b.3  Bulk actions           ~170 LOC  → test ← heaviest
─── 5.4b DONE ───
5.4c.1  Export CSV utility     ~30 LOC
5.4c.2  Export Bills button    ~25 LOC   → test
5.4c.3  Export Reports button  ~20 LOC   → test
5.4c.4  Error boundary         ~50 LOC   → test
─── 5.4c DONE ───
5.5a    SQL migration          ~60 SQL   → test CRITICAL
5.5b    TypeScript types       ~25 LOC
5.5c    Group context (cookie) ~20 LOC
5.5d    Onboarding page        ~120 LOC  → test
5.5e    Onboarding guard       ~15 LOC   → test
5.5f    Group Switcher UI      ~60 LOC   → test
5.5g    Update ALL queries     ~80 LOC   → test CRITICAL
5.5h    Settings page          ~200 LOC  → test
─── 5.5 DONE → V2.0 ───
```
