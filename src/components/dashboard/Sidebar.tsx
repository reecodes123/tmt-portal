"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import {
  Award,
  BarChart3,
  ClipboardList,
  FileClock,
  FileText,
  Images,
  FolderTree,
  IdCard,
  Info,
  LayoutDashboard,
  LogOut,
  Menu as MenuIcon,
  MessageSquare,
  PenSquare,
  ScrollText,
  Settings,
  UserCircle,
  Users,
  X,
} from "lucide-react";
import type { UserRole } from "@/types/domain";

const logo = "/images/logo.png";

/**
 * Dashboard navigation.
 *
 * ARCHITECTURE DECISION — one dashboard, role-gated.
 * Editors and Admins share this shell; `adminOnly` items are filtered out for
 * editors. A separate Editor dashboard would have doubled the surface area of
 * every article/media/category screen for a 3-person team, with no user
 * benefit: the role gap is feature-level, not application-level.
 *
 * This filtering is UX ONLY. Every admin route is independently guarded in
 * middleware.ts, in the route's own layout, and in the API handler. Never
 * treat a hidden link as an access control.
 */
const navItems: {
  name: string;
  path: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
  adminOnly?: boolean;
}[] = [
  { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard, exact: true },
  { name: "Articles", path: "/dashboard/articles", icon: FileText },
  { name: "Create Article", path: "/dashboard/articles/new", icon: PenSquare },
  { name: "Drafts", path: "/dashboard/drafts", icon: FileClock },
  { name: "Categories", path: "/dashboard/categories", icon: FolderTree },
  { name: "Editorial Board", path: "/dashboard/board", icon: Award },
  { name: "Positions", path: "/dashboard/positions", icon: IdCard },
  { name: "Media Library", path: "/dashboard/media", icon: Images },
  { name: "Feedback", path: "/dashboard/feedback", icon: MessageSquare },
  { name: "Analytics", path: "/dashboard/analytics", icon: BarChart3, adminOnly: true },
  { name: "Users", path: "/dashboard/users", icon: Users, adminOnly: true },
  {
    name: "Activity Logs",
    path: "/dashboard/activity-logs",
    icon: ClipboardList,
    adminOnly: true,
  },
  { name: "About Us Page", path: "/dashboard/pages/about", icon: Info, adminOnly: true },
  { name: "Terms & Conditions", path: "/dashboard/pages/terms", icon: ScrollText, adminOnly: true },
  { name: "Settings", path: "/dashboard/settings", icon: Settings, adminOnly: true },
  { name: "Profile", path: "/dashboard/profile", icon: UserCircle },
];

interface SidebarProps {
  role: UserRole;
  displayName: string;
}

export function Sidebar({ role, displayName }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  // Prevent the page behind the mobile drawer from scrolling while it's open —
  // otherwise a touch-scroll on the dimmed backdrop area scrolls dashboard
  // content the user can't see, which feels broken on a phone.
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);

  const visible = navItems.filter((i) => !i.adminOnly || role === "admin");

  const isActive = (path: string, exact?: boolean) =>
    exact ? pathname === path : pathname.startsWith(path);

  const handleLogout = async () => {
    // Clears the session cookie, then sends the user back to the public site.
    // refresh() re-runs the server layouts so the dashboard can't be seen via
    // a cached render after sign-out.
    await signOut({ redirect: false });
    router.push("/");
    router.refresh();
  };

  return (
    <>
      <header className="lg:hidden sticky top-0 z-20 w-full bg-tmt-navy text-white flex items-center justify-between px-4 py-3">
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 hover:bg-white/10 rounded-lg"
          aria-label="Open navigation"
        >
          <MenuIcon size={20} />
        </button>
        <span className="font-bold">Editorial CMS</span>
        <div className="w-9" />
      </header>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed lg:sticky top-0 h-screen w-72 bg-tmt-navy text-white flex flex-col z-40 transition-transform duration-300 shrink-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex items-center gap-3 p-5 border-b border-white/10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logo} alt="" className="w-9 h-9 object-contain" />
          <div>
            <p className="font-bold leading-tight">The Matrix Today</p>
            <p className="text-xs text-gray-400 leading-tight">Editorial CMS</p>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="ml-auto p-1.5 hover:bg-white/10 rounded-lg lg:hidden"
            aria-label="Close navigation"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {visible.map(({ name, path, icon: Icon, exact }) => (
            <Link
              key={path}
              href={path}
              onClick={() => setIsOpen(false)}
              aria-current={isActive(path, exact) ? "page" : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive(path, exact)
                  ? "bg-tmt-orange text-white"
                  : "text-gray-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon size={18} />
              {name}
            </Link>
          ))}
        </nav>

        <div className="p-3 border-t border-white/10">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-9 h-9 rounded-full bg-tmt-orange flex items-center justify-center font-bold text-sm shrink-0">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{displayName}</p>
              <p className="text-xs text-gray-400 capitalize">{role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
