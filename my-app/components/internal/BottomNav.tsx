"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import { 
  Home, 
  Calendar, 
  Settings, 
  User 
} from "lucide-react"

export function BottomNav() {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)

  // Fix hydration issues
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const navItems = [
    {
      name: "Dashboard",
      href: "/app/dashboard",
      icon: <Home size={20} />,
      active: pathname === "/app/dashboard"
    },
    {
      name: "Today",
      href: "/app/today",
      icon: <Calendar size={20} />,
      active: pathname === "/app/today"
    },
    {
      name: "Settings",
      href: "/app/settings",
      icon: <Settings size={20} />,
      active: pathname === "/app/settings"
    },
    {
      name: "Account",
      href: "/app/account",
      icon: <User size={20} />,
      active: pathname === "/app/account"
    }
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 border-t bg-background z-10 shadow-lg">
      <div className="flex justify-around items-center h-16 px-1 max-w-md mx-auto">
        {navItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={`flex flex-col items-center justify-center py-2 w-full rounded transition-all ${
              item.active 
                ? "text-primary font-medium" 
                : "text-muted-foreground hover:text-foreground/80"
            }`}
          >
            <div className="flex items-center justify-center">
              {item.icon}
            </div>
            <span className="text-[10px] mt-1 font-medium">{item.name}</span>
          </Link>
        ))}
      </div>
    </div>
  )
} 