"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Mic2, FileText, LayoutDashboard, Settings, LogOut, ShieldCheck, Users
} from "lucide-react";
import { useAuthStore } from "@/lib/store/authStore";
import { useRouter } from "next/navigation";

const navItems = [
  { href: "/scribe",    icon: Mic2,            label: "Scribe",     role: null },
  { href: "/dashboard", icon: LayoutDashboard,  label: "Dashboard",  role: null },
  { href: "/patients",  icon: Users,           label: "Patients",   role: null },
  { href: "/templates", icon: FileText,         label: "Templates",  role: null },
  { href: "/settings",  icon: Settings,         label: "Settings",   role: null },
  { href: "/admin/doctors", icon: ShieldCheck,  label: "Admin",      role: "SUPER_ADMIN" },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <aside className="w-16 md:w-56 h-screen bg-black text-white flex flex-col shrink-0">
      {/* Logo */}
      <div className="h-14 flex items-center px-4 border-b border-white/10">
        <div className="w-7 h-7 bg-white rounded flex items-center justify-center font-bold text-xs text-black mr-3 shrink-0">
          S
        </div>
        <span className="hidden md:block font-semibold text-base tracking-tight">ScribeDesk</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 space-y-0.5 px-2">
        {navItems.filter(item => !item.role || user?.role === item.role).map(({ href, icon: Icon, label }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-2 py-2.5 rounded-lg text-sm transition-colors",
                active
                  ? "bg-white text-black font-medium"
                  : "text-white/50 hover:bg-white/10 hover:text-white"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="hidden md:block">{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User + Logout */}
      <div className="border-t border-white/10 p-2">
        {user && (
          <div className="hidden md:block px-2 py-1.5 text-xs text-white/40 truncate">
            {user.name}
          </div>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-2 py-2.5 w-full rounded-lg text-sm text-white/50 hover:bg-white/10 hover:text-white transition-colors"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span className="hidden md:block">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
