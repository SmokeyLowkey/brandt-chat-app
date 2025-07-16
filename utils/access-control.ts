import { prisma } from "@/lib/prisma";

/**
 * Check if a manager has access to a specific tenant
 * @param userId The ID of the manager user
 * @param tenantId The ID of the tenant to check access for
 * @returns Promise<boolean> True if the manager has access, false otherwise
 */
export async function hasManagerTenantAccess(userId: string, tenantId: string): Promise<boolean> {
  const access = await prisma.managerTenantAccess.findUnique({
    where: {
      managerId_tenantId: {
        managerId: userId,
        tenantId: tenantId
      }
    }
  });
  
  return !!access;
}

/**
 * Check if a user has access to a specific tenant
 * This function handles all roles:
 * - Admins have access to all tenants
 * - Managers have access to their assigned tenant and any tenants they've been granted access to
 * - Support agents only have access to their assigned tenant
 * 
 * @param userId The ID of the user
 * @param tenantId The ID of the tenant to check access for
 * @param userRole The role of the user (ADMIN, MANAGER, SUPPORT_AGENT)
 * @param userTenantId The ID of the tenant the user is assigned to
 * @returns Promise<boolean> True if the user has access, false otherwise
 */
export async function hasUserTenantAccess(
  userId: string, 
  tenantId: string, 
  userRole: string,
  userTenantId: string
): Promise<boolean> {
  // Admins have access to all tenants
  if (userRole === "ADMIN") {
    return true;
  }
  
  // Users always have access to their assigned tenant
  if (userTenantId === tenantId) {
    return true;
  }
  
  // Managers may have access to additional tenants
  if (userRole === "MANAGER") {
    return await hasManagerTenantAccess(userId, tenantId);
  }
  
  // Support agents only have access to their assigned tenant
  return false;
}