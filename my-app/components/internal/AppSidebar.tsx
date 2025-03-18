"use client";

import Link from "next/link";
import { LayoutDashboard, CalendarCheck } from "lucide-react";
import { cn } from "@/styles/shared";
import { usePathname } from "next/navigation";
import { UserAccountSwitcher } from "./UserAccountSwitcher";

interface SidebarLinkProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
}

function SidebarLink({ href, icon, label, isActive }: SidebarLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        "hover:translate-y-[-1px] hover:shadow-md transition-all duration-200",
        isActive 
          ? "bg-accent/60 text-accent-foreground shadow-sm backdrop-blur-lg" 
          : "hover:bg-accent/40 hover:text-accent-foreground backdrop-blur-lg"
      )}
    >
      {icon}
      {label}
    </Link>
  );
}

export default function AppSidebar() {
  const pathname = usePathname();
  
  const links = [
    {
      href: "/app/dashboard",
      icon: <LayoutDashboard size={18} />,
      label: "Dashboard"
    },
    {
      href: "/app/today",
      icon: <CalendarCheck size={18} />,
      label: "Today"
    }
  ];

  return (
    <div className="w-64 h-screen border-r border-r-border/30 bg-background/50 backdrop-blur-xl bg-gradient-to-b from-background/60 to-background/40 shadow-[0_0_15px_rgba(0,0,0,0.1)] flex flex-col z-10">
      <div className="p-4 border-b border-border/30 bg-gradient-to-r from-background/60 to-background/40 backdrop-blur-xl">
        <h2 className="text-lg font-medium text-foreground/90 drop-shadow-sm">Habit Tracker</h2>
      </div>
      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {links.map(link => (
            <SidebarLink
              key={link.href}
              href={link.href}
              icon={link.icon}
              label={link.label}
              isActive={pathname === link.href}
            />
          ))}
        </div>
      </nav>
      <div className="mt-auto border-t border-border/30 bg-gradient-to-r from-background/60 to-background/40 backdrop-blur-xl shadow-[0_-2px_5px_rgba(0,0,0,0.05)]">
        <UserAccountSwitcher />
      </div>
    </div>
  );
} 