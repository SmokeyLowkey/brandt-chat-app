"use client";

import { createContext, useContext, ReactNode, useState, useEffect } from "react";
import { useSession } from "next-auth/react";

interface TenantContextType {
  tenantId: string | null;
  tenantName: string | null;
  tenantSlug: string | null;
  tenantSettings: any | null;
  isLoading: boolean;
  isAdmin: boolean;
  isManager: boolean;
  accessibleTenants: any[];
  isLoadingAccessibleTenants: boolean;
  setOverrideTenant: (tenantId: string, tenantName: string, tenantSlug: string) => void;
  resetToUserTenant: () => void;
  refreshAccessibleTenants: () => Promise<void>;
}

const TenantContext = createContext<TenantContextType>({
  tenantId: null,
  tenantName: null,
  tenantSlug: null,
  tenantSettings: null,
  isLoading: true,
  isAdmin: false,
  isManager: false,
  accessibleTenants: [],
  isLoadingAccessibleTenants: false,
  setOverrideTenant: () => {},
  resetToUserTenant: () => {},
  refreshAccessibleTenants: async () => {},
});

export function TenantProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const [overrideTenantId, setOverrideTenantId] = useState<string | null>(null);
  const [overrideTenantName, setOverrideTenantName] = useState<string | null>(null);
  const [overrideTenantSlug, setOverrideTenantSlug] = useState<string | null>(null);
  const [overrideTenantSettings, setOverrideTenantSettings] = useState<any | null>(null);
  const [accessibleTenants, setAccessibleTenants] = useState<any[]>([]);
  const [isLoadingAccessibleTenants, setIsLoadingAccessibleTenants] = useState(false);

  // Check user roles
  const isAdmin = session?.user?.role === "ADMIN";
  const isManager = session?.user?.role === "MANAGER";
  const canSwitchTenants = isAdmin || isManager;

  // Reset override when session changes
  useEffect(() => {
    if (status !== "loading") {
      setOverrideTenantId(null);
      setOverrideTenantName(null);
      setOverrideTenantSlug(null);
    }
  }, [session?.user?.id, status]);

  // Set override tenant (for admins and managers)
  const setOverrideTenant = (tenantId: string, tenantName: string, tenantSlug: string) => {
    if (canSwitchTenants) {
      setOverrideTenantId(tenantId);
      setOverrideTenantName(tenantName);
      setOverrideTenantSlug(tenantSlug);
      
      // Store in localStorage for persistence
      localStorage.setItem('overrideTenantId', tenantId);
      localStorage.setItem('overrideTenantName', tenantName);
      localStorage.setItem('overrideTenantSlug', tenantSlug);
      
      // Fetch tenant settings when switching tenants
      fetchTenantSettings(tenantId);
    }
  };
  
  // Fetch tenant settings
  const fetchTenantSettings = async (tenantId: string) => {
    try {
      const response = await fetch(`/api/tenants/${tenantId}`);
      if (response.ok) {
        const tenantData = await response.json();
        setOverrideTenantSettings(tenantData.settings);
        
        // Store settings in localStorage for persistence
        localStorage.setItem('overrideTenantSettings', JSON.stringify(tenantData.settings));
      } else {
        console.error("Failed to fetch tenant settings");
      }
    } catch (error) {
      console.error("Error fetching tenant settings:", error);
    }
  };

  // Reset to user's original tenant
  const resetToUserTenant = () => {
    setOverrideTenantId(null);
    setOverrideTenantName(null);
    setOverrideTenantSlug(null);
    setOverrideTenantSettings(null);
    
    // Clear from localStorage
    localStorage.removeItem('overrideTenantId');
    localStorage.removeItem('overrideTenantName');
    localStorage.removeItem('overrideTenantSlug');
    localStorage.removeItem('overrideTenantSettings');
  };

  // Fetch accessible tenants for managers
  const refreshAccessibleTenants = async () => {
    if (!isManager || !session?.user?.id) return;
    
    try {
      setIsLoadingAccessibleTenants(true);
      
      // Fetch additional tenants the manager has access to
      const response = await fetch(`/api/managers/${session.user.id}/tenant-access`);
      
      if (response.ok) {
        const additionalTenants = await response.json();
        
        // Get the home tenant info from the session
        const homeTenant = session.user.tenantId ? {
          id: session.user.tenantId,
          name: session.user.tenantName || "Home Tenant",
          slug: session.user.tenantSlug || "home",
          domain: null,
          isHomeTenant: true
        } : null;
        
        // Combine home tenant with additional tenants
        const allAccessibleTenants = homeTenant
          ? [homeTenant, ...additionalTenants]
          : additionalTenants;
          
        setAccessibleTenants(allAccessibleTenants);
      } else {
        console.error("Failed to fetch accessible tenants");
        
        // If API fails, at least show home tenant
        if (session.user.tenantId) {
          setAccessibleTenants([{
            id: session.user.tenantId,
            name: session.user.tenantName || "Home Tenant",
            slug: session.user.tenantSlug || "home",
            domain: null,
            isHomeTenant: true
          }]);
        }
      }
    } catch (error) {
      console.error("Error fetching accessible tenants:", error);
      
      // If error occurs, at least show home tenant
      if (session.user.tenantId) {
        setAccessibleTenants([{
          id: session.user.tenantId,
          name: session.user.tenantName || "Home Tenant",
          slug: session.user.tenantSlug || "home",
          domain: null,
          isHomeTenant: true
        }]);
      }
    } finally {
      setIsLoadingAccessibleTenants(false);
    }
  };
  
  // Fetch accessible tenants when session changes
  useEffect(() => {
    if (isManager && session?.user?.id) {
      refreshAccessibleTenants();
    }
  }, [isManager, session?.user?.id]);

  // Load override from localStorage on initial render
  useEffect(() => {
    if (canSwitchTenants && typeof window !== 'undefined') {
      const savedTenantId = localStorage.getItem('overrideTenantId');
      const savedTenantName = localStorage.getItem('overrideTenantName');
      const savedTenantSlug = localStorage.getItem('overrideTenantSlug');
      const savedTenantSettings = localStorage.getItem('overrideTenantSettings');
      
      if (savedTenantId && savedTenantName && savedTenantSlug) {
        setOverrideTenantId(savedTenantId);
        setOverrideTenantName(savedTenantName);
        setOverrideTenantSlug(savedTenantSlug);
        
        if (savedTenantSettings) {
          try {
            setOverrideTenantSettings(JSON.parse(savedTenantSettings));
          } catch (e) {
            console.error("Error parsing saved tenant settings:", e);
            // If there's an error parsing, fetch fresh settings
            fetchTenantSettings(savedTenantId);
          }
        } else {
          // If no settings in localStorage, fetch them
          fetchTenantSettings(savedTenantId);
        }
      }
    }
  }, [canSwitchTenants]);

  const value = {
    tenantId: overrideTenantId || session?.user?.tenantId || null,
    tenantName: overrideTenantName || session?.user?.tenantName || null,
    tenantSlug: overrideTenantSlug || session?.user?.tenantSlug || null,
    tenantSettings: overrideTenantSettings || null,
    isLoading: status === "loading",
    isAdmin,
    isManager,
    accessibleTenants,
    isLoadingAccessibleTenants,
    setOverrideTenant,
    resetToUserTenant,
    refreshAccessibleTenants,
  };

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
}

export const useTenant = () => useContext(TenantContext);