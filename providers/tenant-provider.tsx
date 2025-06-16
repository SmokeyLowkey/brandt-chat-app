"use client";

import { createContext, useContext, ReactNode } from "react";
import { useSession } from "next-auth/react";

interface TenantContextType {
  tenantId: string | null;
  tenantName: string | null;
  tenantSlug: string | null;
  isLoading: boolean;
}

const TenantContext = createContext<TenantContextType>({
  tenantId: null,
  tenantName: null,
  tenantSlug: null,
  isLoading: true,
});

export function TenantProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();

  const value = {
    tenantId: session?.user?.tenantId || null,
    tenantName: session?.user?.tenantName || null,
    tenantSlug: session?.user?.tenantSlug || null,
    isLoading: status === "loading",
  };

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
}

export const useTenant = () => useContext(TenantContext);