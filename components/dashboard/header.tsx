"use client"

import { useState, useEffect } from "react"
import { signOut, useSession } from "next-auth/react"
import { Bell, Search, Building, CheckCircle2, User, Home } from "lucide-react"
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
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { toast } from "sonner"
import { NotificationCenter } from "@/components/notification/notification-center"
import { ProcessingStatusIndicator } from "@/components/document/processing-status-indicator"

export function Header() {
  const [searchQuery, setSearchQuery] = useState("")
  const [tenants, setTenants] = useState<any[]>([])
  const [isLoadingTenants, setIsLoadingTenants] = useState(false)
  const { data: session } = useSession()
  const {
    tenantName,
    tenantId,
    isAdmin,
    isManager,
    accessibleTenants,
    isLoadingAccessibleTenants,
    setOverrideTenant,
    resetToUserTenant
  } = useTenant()
  
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
        {/* Search bar to the left */}
        <div className="flex items-center gap-4 flex-1">
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
          {/* Tenant Selector for Admins and Managers */}
          {(isAdmin || isManager) && (
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
                {/* Show loading state */}
                {(isLoadingTenants || isLoadingAccessibleTenants) ? (
                  <DropdownMenuItem disabled>Loading tenants...</DropdownMenuItem>
                ) : (
                  <>
                    {/* Show appropriate tenants based on role */}
                    {(isAdmin ? tenants : accessibleTenants).map((tenant) => (
                      <DropdownMenuItem
                        key={tenant.id}
                        onClick={() => handleTenantSelect(tenant)}
                        className="cursor-pointer flex items-center justify-between"
                      >
                        <div className="flex items-center">
                          {/* Show home icon for home tenant */}
                          {!isAdmin && tenant.isHomeTenant && (
                            <Home className="h-4 w-4 mr-2 text-gray-500" />
                          )}
                          <span className={`truncate ${!isAdmin && tenant.isHomeTenant ? 'font-medium' : ''}`}>
                            {tenant.name}
                            {!isAdmin && tenant.isHomeTenant && " (Home)"}
                          </span>
                        </div>
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
          
          {/* Document Processing Status Indicator */}
          <ProcessingStatusIndicator />
          
          {/* Notification Center */}
          <NotificationCenter />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full p-0 overflow-hidden">
                <Avatar className="h-8 w-8">
                  {session?.user?.image ? (
                    <AvatarImage src={session.user.image} alt={session.user.name || "User"} />
                  ) : null}
                  <AvatarFallback className="bg-gray-200 text-gray-600 text-sm font-medium">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
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
