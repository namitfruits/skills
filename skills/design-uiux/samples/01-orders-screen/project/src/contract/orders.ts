export type OrderStatus = "pending" | "packed" | "handed_over" | "cancelled";

export type Carrier = "GHN" | "GHTK" | "J&T" | "Viettel Post";

export type Order = {
  id: string; // "KN-240812"
  createdAt: string; // ISO
  customerName: string;
  customerPhone: string;
  itemCount: number;
  total: number; // VND
  carrier: Carrier;
  express: boolean; // đơn hoả tốc, hãng lấy trong 2 giờ
  handoffDeadline: string; // ISO, giờ hãng tới lấy hàng; quá giờ thì đơn lỡ chuyến, sang chuyến hôm sau
  status: OrderStatus;
};

export type OrdersResponse = {
  orders: Order[];
  page: number;
  pageSize: number; // 20
  total: number;
  countsByStatus: Record<OrderStatus, number>;
};
