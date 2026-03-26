"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Users,
  Truck,
  ClipboardList,
  Fuel,
  TrendingUp,
  Wallet,
  CheckSquare,
  Settings,
  LogOut,
  Menu,
  X,
  Banknote,
  Route,
  CreditCard,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const navItems = [
  {
    href: "/panel",
    icon: LayoutDashboard,
    label: "Dashboard",
    exact: true,
  },
  {
    href: "/panel/soforler",
    icon: Users,
    label: "Şöförler",
  },
  {
    href: "/panel/araclar",
    icon: Truck,
    label: "Araçlar",
  },
  {
    href: "/panel/isler",
    icon: ClipboardList,
    label: "İşler / Seferler",
  },
  {
    href: "/panel/guzergahlar",
    icon: Route,
    label: "Güzergahlar",
  },
  {
    href: "/panel/yakit",
    icon: Fuel,
    label: "Yakıt Takibi",
  },
  {
    href: "/panel/finans",
    icon: TrendingUp,
    label: "Finans",
  },
  {
    href: "/panel/maaslar",
    icon: Banknote,
    label: "Maaşlar",
  },
  {
    href: "/panel/odeme",
    icon: Wallet,
    label: "Ödemeler / Cari",
  },
  {
    href: "/panel/kredikartlari",
    icon: CreditCard,
    label: "Kredi Kartları",
  },
  {
    href: "/panel/gorevler",
    icon: CheckSquare,
    label: "Görevlerim",
  },
  {
    href: "/panel/ayarlar",
    icon: Settings,
    label: "Ayarlar",
  },
];

interface SidebarProps {
  userName: string;
}

export default function Sidebar({ userName }: SidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  function isActive(item: (typeof navItems)[0]) {
    if (item.exact) return pathname === item.href;
    return pathname.startsWith(item.href);
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-5 border-b border-white/10">
        <Link href="/panel" className="flex items-center gap-3" onClick={() => setMobileOpen(false)}>
          <Image
            src="/logo.png"
            alt="Mert Tur"
            width={40}
            height={40}
            className="rounded-xl"
          />
          <div>
            <div className="text-white font-black text-lg leading-tight">
              MERT <span className="font-light">TUR</span>
            </div>
            <div className="text-slate-400 text-xs">Yönetim Paneli</div>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto sidebar-scroll">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
              isActive(item)
                ? "bg-[#DC2626] text-white shadow-lg shadow-red-500/20"
                : "text-slate-400 hover:text-white hover:bg-white/10"
            )}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Alt: Kullanıcı + Çıkış */}
      <div className="p-4 border-t border-white/10 space-y-2">
        <div className="px-4 py-2 rounded-xl bg-white/5">
          <div className="text-white text-sm font-medium truncate">{userName}</div>
          <div className="text-slate-400 text-xs">Admin</div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-white/10 transition-all"
        >
          <LogOut className="w-5 h-5" />
          Çıkış Yap
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 bg-[#1B2437] flex-col flex-shrink-0 h-screen sticky top-0">
        <SidebarContent />
      </aside>

      {/* Mobile: Hamburger */}
      <div className="lg:hidden">
        <button
          onClick={() => setMobileOpen(true)}
          className="fixed top-4 left-4 z-50 p-2 bg-[#1B2437] text-white rounded-xl shadow-lg"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Mobile Drawer */}
        {mobileOpen && (
          <>
            <div
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setMobileOpen(false)}
            />
            <div className="fixed left-0 top-0 bottom-0 w-72 bg-[#1B2437] z-50 shadow-2xl">
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
              <SidebarContent />
            </div>
          </>
        )}
      </div>
    </>
  );
}
