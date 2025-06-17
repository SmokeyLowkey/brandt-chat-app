"use client";

import { createContext, useContext, ReactNode, useState, useEffect } from "react";
import { useSession } from "next-auth/react";

interface TenantContextType {
  tenantId: string | null;
  tenantName: string | null;
  tenantSlug: string | null;
  isLoading: boolean;
  isAdmin: boolean;
  setOverrideTenant: (tenantId: string, tenantName: string, tenantSlug: string) => void;
  resetToUserTenant: () => void;
}

const TenantContext = createContext<TenantContextType>({
  tenantId: null,
  tenantName: null,
  tenantSlug: null,
  isLoading: true,
  isAdmin: false,
  setOverrideTenant: () => {},
  resetToUserTenant: () => {},
});

export function TenantProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const [overrideTenantId, setOverrideTenantId] = useState<string | null>(null);
  const [overrideTenantName, setOverrideTenantName] = useState<string | null>(null);
  const [overrideTenantSlug, setOverrideTenantSlug] = useState<string | null>(null);

  // Check if user is admin
  const isAdmin = session?.user?.role === "ADMIN";

  // Reset override when session changes
  useEffect(() => {
    if (status !== "loading") {
      setOverrideTenantId(null);
      setOverrideTenantName(null);
      setOverrideTenantSlug(null);
    }
  }, [session?.user?.id, status]);

  // Set override tenant (for admins only)
  const setOverrideTenant = (tenantId: string, tenantName: string, tenantSlug: string) => {
    if (isAdmin) {
      setOverrideTenantId(tenantId);
      setOverrideTenantName(tenantName);
      setOverrideTenantSlug(tenantSlug);
      
      // Store in localStorage for persistence
      localStorage.setItem('overrideTenantId', tenantId);
      localStorage.setItem('overrideTenantName', tenantName);
      localStorage.setItem('overrideTenantSlug', tenantSlug);
    }
  };

  // Reset to user's original tenant
  const resetToUserTenant = () => {
    setOverrideTenantId(null);
    setOverrideTenantName(null);
    setOverrideTenantSlug(null);
    
    // Clear from localStorage
    localStorage.removeItem('overrideTenantId');
    localStorage.removeItem('overrideTenantName');
    localStorage.removeItem('overrideTenantSlug');
  };

  // Load override from localStorage on initial render
  useEffect(() => {
    if (isAdmin && typeof window !== 'undefined') {
      const savedTenantId = localStorage.getItem('overrideTenantId');
      const savedTenantName = localStorage.getItem('overrideTenantName');
      const savedTenantSlug = localStorage.getItem('overrideTenantSlug');
      
      if (savedTenantId && savedTenantName && savedTenantSlug) {
        setOverrideTenantId(savedTenantId);
        setOverrideTenantName(savedTenantName);
        setOverrideTenantSlug(savedTenantSlug);
      }
    }
  }, [isAdmin]);

  const value = {
    tenantId: overrideTenantId || session?.user?.tenantId || null,
    tenantName: overrideTenantName || session?.user?.tenantName || null,
    tenantSlug: overrideTenantSlug || session?.user?.tenantSlug || null,
    isLoading: status === "loading",
    isAdmin,
    setOverrideTenant,
    resetToUserTenant,
  };

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
}

export const useTenant = () => useContext(TenantContext);