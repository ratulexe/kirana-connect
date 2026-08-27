import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  BadgeCheck,
  Boxes,
  Building2,
  FolderTree,
  Image as ImageIcon,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Store,
  Tags,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import Button from "../components/Button.jsx";
import Logo from "../components/Logo.jsx";
import { cn } from "../lib/cn.js";
import { useAuth } from "../auth/useAuth.js";
import { useAdminMe } from "../features/admin/useAdmin.js";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/stores/pending", label: "Store Approvals", icon: BadgeCheck },
  { to: "/stores", label: "Stores", icon: Building2 },
  { to: "/sellers", label: "Sellers", icon: Users },
  { to: "/products", label: "Products", icon: Package },
  { to: "/categories", label: "Categories", icon: FolderTree },
  { to: "/homepage-moments", label: "Homepage Moments", icon: ImageIcon },
  { to: "/business-categories", label: "Business Categories", icon: Store },
  { to: "/brands", label: "Brands", icon: Tags },
];

function isActivePath(pathname, item) {
  if (item.to === "/") return pathname === "/";
  if (item.to === "/stores/pending") return pathname === "/stores/pending";
  if (item.to === "/stores") {
    return (
      pathname === "/stores" ||
      (pathname.startsWith("/stores/") && pathname !== "/stores/pending")
    );
  }
  return pathname === item.to || pathname.startsWith(`${item.to}/`);
}

function NavItems({ onNavigate }) {
  const location = useLocation();

  return (
    <nav aria-label="Admin navigation" className="flex flex-col gap-1">
      {NAV.map((item) => {
        const Icon = item.icon;
        const active = isActivePath(location.pathname, item);

        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-2 rounded-control px-3 py-2 text-meta font-semibold transition-colors",
              active
                ? "bg-[#ffd45e] text-[#302069] shadow-sm"
                : "text-white/70 hover:bg-white/10 hover:text-white",
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export default function AdminLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const me = useAdminMe();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  return (
    <div className="relative isolate min-h-dvh overflow-x-clip bg-canvas">
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <span className="admin-float absolute -right-24 top-[26rem] size-72 rounded-full bg-[#ffd45e]/25 blur-3xl" />
        <span className="admin-float absolute -left-24 top-[43rem] size-72 rounded-full bg-[#e93483]/12 blur-3xl" />
      </div>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-control focus:bg-primary focus:px-4 focus:py-2 focus:text-meta focus:font-semibold focus:text-primary-fg"
      >
        Skip to content
      </a>

      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-white/10 bg-[#21165e] px-4 py-5 text-white lg:block">
        <div className="mb-8 rounded-card bg-white/8 p-3 [&_.border-line]:border-white/20 [&_.text-ink]:text-white [&_.text-ink-muted]:text-white/55">
          <Logo />
        </div>
        <NavItems />
      </aside>

      <header className="sticky top-0 z-40 border-b border-white/40 bg-canvas/80 backdrop-blur-md lg:ml-64">
        <div className="flex min-h-14 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="rounded-control p-2 text-ink-soft hover:bg-surface-sunken hover:text-ink lg:hidden"
              aria-label="Open admin navigation"
            >
              <Menu className="size-5" aria-hidden="true" />
            </button>
            <div className="lg:hidden">
              <Logo />
            </div>
            <div className="hidden min-w-0 items-center gap-2 lg:flex">
              <Boxes className="size-4 text-primary" aria-hidden="true" />
              <span className="text-meta font-semibold text-ink-muted">
                Marketplace command centre
              </span>
            </div>
          </div>

          <div className="flex min-w-0 items-center gap-2">
            <span className="hidden max-w-[16rem] truncate text-meta text-ink-muted sm:inline">
              {me.data?.profile?.full_name || user?.email}
            </span>
            <Button variant="secondary" size="sm" onClick={handleSignOut}>
              <LogOut className="size-4" aria-hidden="true" />
              Sign out
            </Button>
          </div>
        </div>
      </header>

      {menuOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-ink/30"
            aria-label="Close admin navigation"
            onClick={() => setMenuOpen(false)}
          />
          <div className="relative h-full w-72 max-w-[85vw] border-r border-white/10 bg-[#21165e] p-4 text-white shadow-float">
            <div className="mb-6 flex items-center justify-between gap-3">
              <div className="rounded-card bg-white/8 p-3 [&_.border-line]:border-white/20 [&_.text-ink]:text-white [&_.text-ink-muted]:text-white/55">
                <Logo />
              </div>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="rounded-control p-2 text-white/70 hover:bg-white/10 hover:text-white"
                aria-label="Close admin navigation"
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>
            <NavItems onNavigate={() => setMenuOpen(false)} />
          </div>
        </div>
      ) : null}

      <main id="main" className="lg:ml-64">
        <div className="px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
