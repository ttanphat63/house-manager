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
