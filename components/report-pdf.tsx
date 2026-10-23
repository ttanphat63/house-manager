import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

// Đăng ký font Roboto hỗ trợ đầy đủ ký tự tiếng Việt Unicode từ public/fonts
Font.register({
  family: "Roboto",
  fonts: [
    {
      src: "/fonts/Roboto-Regular.ttf",
      fontWeight: "normal",
    },
    {
      src: "/fonts/Roboto-Bold.ttf",
      fontWeight: "bold",
    },
  ],
});

export interface ReportBillItem {
  id: string;
  title: string;
  type: string;
  amount: number;
  due_date: string;
  paid: boolean;
}

export interface ReportTypeBreakdown {
  name: string;
  value: number;
  percent: number;
}

export interface ReportPDFData {
  groupName: string;
  month: number;
  year: number;
  exportDate: string;
  bills: ReportBillItem[];
  totalMonth: number;
  paidCount: number;
  unpaidCount: number;
  typeBreakdown: ReportTypeBreakdown[];
}

const styles = StyleSheet.create({
  page: {
    padding: 32,
    fontFamily: "Roboto",
    fontSize: 9,
    color: "#1e293b",
    backgroundColor: "#ffffff",
  },
  header: {
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    paddingBottom: 12,
  },
  brand: {
    fontSize: 9,
    color: "#6366f1",
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8.5,
    color: "#64748b",
  },
  kpiGrid: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: "#f8fafc",
    padding: 9,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  kpiLabel: {
    fontSize: 7.5,
    color: "#64748b",
    textTransform: "uppercase",
    marginBottom: 3,
    fontWeight: "bold",
  },
  kpiValue: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#0f172a",
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 6,
    marginTop: 4,
  },
  breakdownGrid: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 14,
  },
  breakdownCard: {
    flex: 1,
    padding: 8,
    backgroundColor: "#f8fafc",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  breakdownName: {
    fontSize: 8,
    color: "#475569",
    fontWeight: "bold",
    marginBottom: 2,
  },
  breakdownValue: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#0f172a",
  },
  breakdownPercent: {
    fontSize: 7.5,
    color: "#64748b",
    marginTop: 2,
  },
  table: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 6,
    overflow: "hidden",
    marginBottom: 24,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    borderBottomWidth: 1,
    borderBottomColor: "#cbd5e1",
    paddingVertical: 6,
    paddingHorizontal: 8,
    fontWeight: "bold",
    fontSize: 7.5,
    color: "#334155",
    textTransform: "uppercase",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    paddingVertical: 5.5,
    paddingHorizontal: 8,
    alignItems: "center",
    fontSize: 8,
  },
  tableRowEven: {
    backgroundColor: "#fafafa",
  },
  colIndex: {
    width: 25,
    color: "#64748b",
  },
  colTitle: {
    flex: 1,
    paddingRight: 6,
    fontWeight: "bold",
    color: "#0f172a",
  },
  colType: {
    width: 65,
    color: "#475569",
  },
  colAmount: {
    width: 85,
    textAlign: "right",
    fontWeight: "bold",
    color: "#0f172a",
    paddingRight: 6,
  },
  colDueDate: {
    width: 70,
    textAlign: "center",
    color: "#64748b",
  },
  colStatus: {
    width: 75,
    textAlign: "center",
  },
  badgePaid: {
    backgroundColor: "#dcfce7",
    color: "#15803d",
    paddingVertical: 1.5,
    paddingHorizontal: 5,
    borderRadius: 8,
    fontSize: 7,
    fontWeight: "bold",
  },
  badgeUnpaid: {
    backgroundColor: "#fee2e2",
    color: "#b91c1c",
    paddingVertical: 1.5,
    paddingHorizontal: 5,
    borderRadius: 8,
    fontSize: 7,
    fontWeight: "bold",
  },
  emptyState: {
    padding: 20,
    textAlign: "center",
    color: "#94a3b8",
    fontSize: 8.5,
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 32,
    right: 32,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingTop: 8,
    fontSize: 7.5,
    color: "#94a3b8",
  },
});

function formatMoney(amount: number): string {
  return Number(amount || 0).toLocaleString("vi-VN") + " ₫";
}

function formatDueDate(dateStr: string): string {
  if (!dateStr) return "—";
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

function getTypeLabel(type: string): string {
  switch (type) {
    case "electric":
      return "Tiền điện";
    case "water":
      return "Tiền nước";
    case "net":
      return "Internet";
    default:
      return "Khác";
  }
}

export function ReportPDF({ data }: { data: ReportPDFData }) {
  const {
    groupName,
    month,
    year,
    exportDate,
    bills,
    totalMonth,
    paidCount,
    unpaidCount,
    typeBreakdown,
  } = data;

  return (
    <Document>
      <Page size="A4" style={styles.page} wrap>
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.brand}>House Manager — Quản lý gia đình</Text>
          <Text style={styles.title}>
            Báo cáo chi tiêu tháng {month}/{year}
          </Text>
          <View style={styles.metaRow}>
            <Text>Nhóm: {groupName}</Text>
            <Text>Ngày xuất: {exportDate}</Text>
          </View>
        </View>

        {/* KPI METRIC CARDS */}
        <View style={styles.kpiGrid}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Tổng chi tiêu</Text>
            <Text style={styles.kpiValue}>{formatMoney(totalMonth)}</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Tổng số hóa đơn</Text>
            <Text style={styles.kpiValue}>{bills.length} hóa đơn</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Đã thanh toán</Text>
            <Text style={[styles.kpiValue, { color: "#16a34a" }]}>
              {paidCount} hóa đơn
            </Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Chưa thanh toán</Text>
            <Text style={[styles.kpiValue, { color: "#dc2626" }]}>
              {unpaidCount} hóa đơn
            </Text>
          </View>
        </View>

        {/* CATEGORY BREAKDOWN */}
        <Text style={styles.sectionTitle}>Cơ cấu chi phí theo danh mục</Text>
        <View style={styles.breakdownGrid}>
          {typeBreakdown.map((item, idx) => (
            <View key={idx} style={styles.breakdownCard}>
              <Text style={styles.breakdownName}>{item.name}</Text>
              <Text style={styles.breakdownValue}>{formatMoney(item.value)}</Text>
              <Text style={styles.breakdownPercent}>{item.percent.toFixed(1)}% tổng chi</Text>
            </View>
          ))}
        </View>

        {/* BILLS TABLE */}
        <Text style={styles.sectionTitle}>Danh sách hóa đơn chi tiết</Text>
        <View style={styles.table}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={styles.colIndex}>STT</Text>
            <Text style={styles.colTitle}>Tên hóa đơn</Text>
            <Text style={styles.colType}>Loại</Text>
            <Text style={styles.colAmount}>Số tiền</Text>
            <Text style={styles.colDueDate}>Hạn đóng</Text>
            <Text style={styles.colStatus}>Trạng thái</Text>
          </View>

          {/* Table Rows */}
          {bills.length === 0 ? (
            <View style={styles.emptyState}>
              <Text>Không có hóa đơn nào phát sinh trong tháng này.</Text>
            </View>
          ) : (
            bills.map((bill, index) => (
              <View
                key={bill.id}
                style={[
                  styles.tableRow,
                  index % 2 === 1 ? styles.tableRowEven : {},
                ]}
                wrap={false}
              >
                <Text style={styles.colIndex}>{index + 1}</Text>
                <Text style={styles.colTitle}>{bill.title}</Text>
                <Text style={styles.colType}>{getTypeLabel(bill.type)}</Text>
                <Text style={styles.colAmount}>{formatMoney(bill.amount)}</Text>
                <Text style={styles.colDueDate}>
                  {formatDueDate(bill.due_date)}
                </Text>
                <View style={styles.colStatus}>
                  <Text style={bill.paid ? styles.badgePaid : styles.badgeUnpaid}>
                    {bill.paid ? "Đã đóng" : "Chưa đóng"}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* FOOTER */}
        <View style={styles.footer} fixed>
          <Text>Được tạo bởi House Manager — Quản lý nhà cửa gọn gàng</Text>
          <Text
            render={({ pageNumber, totalPages }) =>
              `Trang ${pageNumber} / ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}
