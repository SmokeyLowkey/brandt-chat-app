"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { MessageSquare, FileUp, Settings, BarChart2, Users, HelpCircle, Menu, X, Building } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useTenant } from "@/providers/tenant-provider"

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const { data: session } = useSession()
  const { tenantName } = useTenant()

  // Get user initials for avatar
  const getInitials = () => {
    if (!session?.user?.name) return "U"
    return session.user.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  // Get user role display name
  const getUserRole = () => {
    if (!session?.user?.role) return "User"
    
    const role = session.user.role
    switch (role) {
      case "ADMIN":
        return "Administrator"
      case "MANAGER":
        return "Manager"
      case "SUPPORT_AGENT":
        return "Support Agent"
      default:
        return role
    }
  }

  // Base routes available to all users
  const baseRoutes = [
    {
      label: "Chat",
      icon: MessageSquare,
      href: "/dashboard",
      active: pathname === "/dashboard",
    },
    {
      label: "Documents",
      icon: FileUp,
      href: "/dashboard/documents",
      active: pathname === "/dashboard/documents",
    },
    {
      label: "Analytics",
      icon: BarChart2,
      href: "/dashboard/analytics",
      active: pathname === "/dashboard/analytics",
    },
    {
      label: "Team",
      icon: Users,
      href: "/dashboard/team",
      active: pathname === "/dashboard/team",
    },
    {
      label: "Settings",
      icon: Settings,
      href: "/dashboard/settings",
      active: pathname === "/dashboard/settings",
    },
    {
      label: "Help",
      icon: HelpCircle,
      href: "/dashboard/help",
      active: pathname === "/dashboard/help",
    },
  ]

  // Admin-only routes
  const adminRoutes = [
    {
      label: "Tenant Management",
      icon: Building,
      href: "/dashboard/admin/tenants",
      active: pathname.startsWith("/dashboard/admin/tenants"),
    },
  ]

  // Combine routes based on user role
  const routes = session?.user?.role === "ADMIN" 
    ? [...baseRoutes, ...adminRoutes] 
    : baseRoutes

  return (
    <>
      <div className="md:hidden flex items-center p-4">
        <Button variant="ghost" size="icon" onClick={() => setIsOpen(!isOpen)} className="mr-2">
          <Menu className="h-6 w-6" />
          <span className="sr-only">Toggle menu</span>
        </Button>
        <div className="text-xl font-bold text-[#E31937]">BRANDT</div>
      </div>

      {/* Mobile sidebar */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50" onClick={() => setIsOpen(false)}>
          <div className="fixed inset-y-0 left-0 w-64 bg-white p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-8">
              <div className="text-xl font-bold text-[#E31937]">BRANDT</div>
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="space-y-1">
              {routes.map((route) => (
                <Link
                  key={route.href}
                  href={route.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:text-[#E31937]",
                    route.active ? "bg-[#E31937] bg-opacity-10 text-[#E31937] font-medium" : "text-gray-700",
                  )}
                >
                  <route.icon className="h-4 w-4" />
                  {route.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className={cn("hidden md:flex h-full w-64 flex-col bg-white border-r border-gray-100", className)}>
        <div className="p-6">
          <div className="text-2xl font-bold text-[#E31937]">BRANDT</div>
          <div className="text-xs text-gray-500 mt-1">{tenantName || "Internal Chatbot"}</div>
        </div>
        <div className="flex-1 overflow-auto py-2 px-4">
          <nav className="flex flex-col gap-1">
            {routes.map((route) => (
              <Link
                key={route.href}
                href={route.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:text-[#E31937]",
                  route.active ? "bg-[#E31937] bg-opacity-10 text-[#E31937] font-medium" : "text-gray-700",
                )}
              >
                <route.icon className="h-4 w-4" />
                {route.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="p-4 mt-auto border-t border-gray-100">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-600">
              {getInitials()}
            </div>
            <div>
              <p className="text-sm font-medium">{session?.user?.name || "User"}</p>
              <p className="text-xs text-gray-500">{getUserRole()}</p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
