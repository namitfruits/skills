import type { OrderStatus } from "../contract/orders";

const label: Record<OrderStatus, string> = {
  pending: "Chờ gói",
  packed: "Đã gói",
  handed_over: "Đã bàn giao",
  cancelled: "Huỷ",
};

const tone: Record<OrderStatus, string> = {
  pending: "bg-surface-soft text-ink",
  packed: "bg-surface-soft text-primary",
  handed_over: "bg-surface-soft text-success",
  cancelled: "bg-surface-soft text-muted line-through",
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return <span className={`rounded-control px-2 py-0.5 text-xs ${tone[status]}`}>{label[status]}</span>;
}
