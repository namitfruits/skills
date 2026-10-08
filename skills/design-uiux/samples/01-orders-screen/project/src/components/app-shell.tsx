import { NavLink, Outlet } from "react-router";

const nav = [
  { to: "/orders", label: "Đơn hàng" },
  { to: "/inventory", label: "Tồn kho" },
  { to: "/carriers", label: "Hãng vận chuyển" },
];

export function AppShell() {
  return (
    <div className="flex min-h-screen bg-canvas text-body font-sans">
      <aside className="w-56 shrink-0 border-r border-hairline p-4">
        <div className="mb-6 text-sm font-semibold text-ink">Kho Nhanh</div>
        <nav className="flex flex-col gap-1">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `rounded-control px-3 py-2 text-sm ${isActive ? "bg-surface-soft text-ink" : "text-muted hover:text-ink"}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="mx-auto w-full max-w-content px-6 py-6">
        <Outlet />
      </main>
    </div>
  );
}
