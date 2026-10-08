import { useEffect, useState } from "react";
import type { Order, OrderStatus, OrdersResponse } from "../contract/orders";
import { DataTable, type Column } from "../components/data-table";
import { StatusBadge } from "../components/status-badge";

const tabs: { value: OrderStatus | "all"; label: string }[] = [
  { value: "all", label: "Tất cả" },
  { value: "pending", label: "Chờ gói" },
  { value: "packed", label: "Đã gói" },
  { value: "handed_over", label: "Đã bàn giao" },
  { value: "cancelled", label: "Huỷ" },
];

const vnd = new Intl.NumberFormat("vi-VN");
const time = (iso: string) => new Date(iso).toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" });

const columns: Column<Order>[] = [
  { key: "id", header: "Mã đơn", cell: (o) => <span className="font-mono">{o.id}</span> },
  { key: "createdAt", header: "Ngày đặt", cell: (o) => time(o.createdAt) },
  { key: "customer", header: "Khách hàng", cell: (o) => o.customerName },
  { key: "phone", header: "SĐT", cell: (o) => o.customerPhone },
  { key: "items", header: "Số món", cell: (o) => o.itemCount, align: "right" },
  { key: "total", header: "Tổng tiền", cell: (o) => vnd.format(o.total), align: "right" },
  { key: "carrier", header: "Hãng VC", cell: (o) => (o.express ? `${o.carrier} · Hoả tốc` : o.carrier) },
  { key: "deadline", header: "Hạn bàn giao", cell: (o) => time(o.handoffDeadline) },
  { key: "status", header: "Trạng thái", cell: (o) => <StatusBadge status={o.status} /> },
];

export default function OrdersRoute() {
  const [tab, setTab] = useState<OrderStatus | "all">("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<OrdersResponse | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    setData(null);
    setError(false);
    fetch(`/api/orders?status=${tab}&q=${encodeURIComponent(query)}&page=${page}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => setError(true));
  }, [tab, query, page]);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold text-ink">Đơn hàng</h1>

      <div className="flex items-center gap-2">
        {tabs.map((t) => (
          <button
            key={t.value}
            onClick={() => { setTab(t.value); setPage(1); }}
            className={`rounded-control px-3 py-1.5 text-sm ${tab === t.value ? "bg-primary text-on-primary" : "text-muted"}`}
          >
            {t.label}
            {data && t.value !== "all" ? ` (${data.countsByStatus[t.value]})` : ""}
          </button>
        ))}
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tìm mã đơn, tên, SĐT"
          className="ml-auto w-64 rounded-control border border-hairline bg-surface-card px-3 py-1.5 text-sm"
        />
      </div>

      {error && <div className="text-sm text-error">Có lỗi xảy ra</div>}
      {!data && !error && <div className="text-sm text-muted">Đang tải...</div>}
      {data && data.orders.length === 0 && <div className="text-sm text-muted">Không có dữ liệu</div>}
      {data && data.orders.length > 0 && (
        <div className="rounded-card border border-hairline bg-surface-card">
          <DataTable columns={columns} rows={data.orders} rowKey={(o) => o.id} />
        </div>
      )}

      {data && (
        <div className="flex items-center justify-end gap-2 text-sm text-muted">
          <button disabled={page === 1} onClick={() => setPage(page - 1)}>Trước</button>
          <span>Trang {page} / {Math.max(1, Math.ceil(data.total / data.pageSize))}</span>
          <button disabled={page * data.pageSize >= data.total} onClick={() => setPage(page + 1)}>Sau</button>
        </div>
      )}
    </div>
  );
}
