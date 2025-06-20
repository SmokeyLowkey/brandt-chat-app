"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Sidebar } from "@/components/dashboard/sidebar"
import { Header } from "@/components/dashboard/header"
import { TenantProvider } from "@/providers/tenant-provider"
import { Toaster } from "@/components/ui/toaster"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  // Check localStorage for sidebar state on component mount
  useEffect(() => {
    const savedState = localStorage.getItem('sidebarCollapsed');
    if (savedState !== null) {
      setIsSidebarCollapsed(savedState === 'true');
    }
  }, []);
  
  // Listen for custom event from sidebar component
  useEffect(() => {
    const handleSidebarStateChange = () => {
      const savedState = localStorage.getItem('sidebarCollapsed');
      if (savedState !== null) {
        setIsSidebarCollapsed(savedState === 'true');
      }
    };
    
    // Listen for both storage events and our custom event
    window.addEventListener('storage', handleSidebarStateChange);
    window.addEventListener('sidebarStateChange', handleSidebarStateChange);
    
    return () => {
      window.removeEventListener('storage', handleSidebarStateChange);
      window.removeEventListener('sidebarStateChange', handleSidebarStateChange);
    };
  }, []);
  
  return (
    <TenantProvider>
      <div className="h-screen flex flex-col md:flex-row bg-gray-50">
        {/* Sidebar is now self-positioned as fixed */}
        <Sidebar />
        
        {/* Main content area with dynamic margin */}
        <div
          className="flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out w-full"
          style={{
            marginLeft: isSidebarCollapsed ? '4rem' : '16rem' // 4rem = 64px, 16rem = 256px
          }}
          data-sidebar-collapsed={isSidebarCollapsed}
        >
          <Header />
          <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
        </div>
        <Toaster />
      </div>
    </TenantProvider>
  )
}
