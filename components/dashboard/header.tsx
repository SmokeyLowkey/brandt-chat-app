"use client"

import { useState, useEffect } from "react"
import { signOut, useSession } from "next-auth/react"
import { Bell, Search, Building, CheckCircle2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useTenant } from "@/providers/tenant-provider"
import { toast } from "sonner"

export function Header() {
  const [searchQuery, setSearchQuery] = useState("")
  const [tenants, setTenants] = useState<any[]>([])
  const [isLoadingTenants, setIsLoadingTenants] = useState(false)
  const { data: session } = useSession()
  const { tenantName, tenantId, isAdmin, setOverrideTenant, resetToUserTenant } = useTenant()
  
  // Fetch tenants for admin
  useEffect(() => {
    const fetchTenants = async () => {
      if (!isAdmin) return
      
      try {
        setIsLoadingTenants(true)
        const response = await fetch("/api/tenants")
        if (response.ok) {
          const data = await response.json()
          setTenants(data)
        }
      } catch (error) {
        console.error("Error fetching tenants:", error)
      } finally {
        setIsLoadingTenants(false)
      }
    }
    
    fetchTenants()
  }, [isAdmin])
  
  // Handle tenant selection
  const handleTenantSelect = (tenant: any) => {
    setOverrideTenant(tenant.id, tenant.name, tenant.slug)
    toast.success(`Switched to tenant: ${tenant.name}`)
  }
  
  // Reset to user's original tenant
  const handleResetTenant = () => {
    resetToUserTenant()
    toast.success("Switched back to your tenant")
  }

  const handleSignOut = async () => {
    await signOut({ redirect: false })
    toast.success("Signed out successfully")
    window.location.href = "/"
  }

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

  return (
    <header className="border-b border-gray-100 bg-white">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        <div className="hidden md:block text-xl font-semibold">
          {tenantName ? `${tenantName} - AI Assistant` : "Brandt AI Assistant"}
        </div>

        <div className="flex flex-1 items-center justify-end md:justify-center px-6">
          <div className="w-full max-w-md relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search knowledge base..."
              className="w-full bg-gray-50 border-gray-200 pl-9 rounded-lg"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Tenant Selector for Admins */}
          {isAdmin && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  <span className="max-w-[150px] truncate">{tenantName || "Select Tenant"}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Switch Tenant</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {isLoadingTenants ? (
                  <DropdownMenuItem disabled>Loading tenants...</DropdownMenuItem>
                ) : (
                  <>
                    {tenants.map((tenant) => (
                      <DropdownMenuItem
                        key={tenant.id}
                        onClick={() => handleTenantSelect(tenant)}
                        className="cursor-pointer flex items-center justify-between"
                      >
                        <span className="truncate">{tenant.name}</span>
                        {tenant.id === tenantId && (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        )}
                      </DropdownMenuItem>
                    ))}
                    {session?.user?.tenantId && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={handleResetTenant}
                          className="cursor-pointer text-[#E31937]"
                        >
                          Reset to my tenant
                        </DropdownMenuItem>
                      </>
                    )}
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-[#E31937] rounded-full"></span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer">
                <div className="flex flex-col gap-1">
                  <p className="font-medium">New document uploaded</p>
                  <p className="text-xs text-gray-500">2 minutes ago</p>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <div className="flex flex-col gap-1">
                  <p className="font-medium">System update completed</p>
                  <p className="text-xs text-gray-500">1 hour ago</p>
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer text-center text-sm text-[#E31937]">
                View all notifications
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-600">
                  {getInitials()}
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                {session?.user?.name || "User"}
                <p className="text-xs text-gray-500 mt-1">{session?.user?.email}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer">Profile</DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer" onClick={handleSignOut}>
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
