import { prisma } from "@/lib/prisma";

/**
 * Mapping of tenant slugs to technical domains
 * This helps the AI know which knowledge bases to search based on tenant business unit
 */
export const TENANT_SLUG_TO_TECHNICAL_DOMAIN: Record<string, string[]> = {
  'brandt-cf': ['Construction', 'Forestry'],
  'brandt-ag': ['Agriculture'],
  // Default fallback if tenant slug is not found
  'default': ['General']
};

/**
 * Technical domain formats for different chat modes
 */
interface TechnicalDomainFormats {
  aftermarket: (domains: string[]) => string[];
  catalog: (domains: string[]) => string[];
}

/**
 * Format technical domains based on chat mode
 */
const TECHNICAL_DOMAIN_FORMATS: TechnicalDomainFormats = {
  aftermarket: (domains: string[]) => domains.map(domain => domain.toLowerCase()),
  catalog: (domains: string[]) => domains
};

/**
 * Get the technical domains for a specific tenant and chat mode
 * @param tenantId The tenant ID
 * @param chatMode The chat mode ('aftermarket' or 'catalog')
 * @returns Array of technical domain strings
 */
export async function getTechnicalDomains(
  tenantId: string,
  chatMode: 'aftermarket' | 'catalog'
): Promise<string[]> {
  try {
    // Look up the tenant to get its slug
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { slug: true }
    });
    
    // Get the technical domains based on the tenant slug
    const technicalDomains = tenant?.slug
      ? (TENANT_SLUG_TO_TECHNICAL_DOMAIN[tenant.slug] || TENANT_SLUG_TO_TECHNICAL_DOMAIN['default'])
      : TENANT_SLUG_TO_TECHNICAL_DOMAIN['default'];
    
    // Format the technical domains based on the chat mode
    return TECHNICAL_DOMAIN_FORMATS[chatMode](technicalDomains);
  } catch (error) {
    console.error(`Error getting technical domains for tenant ${tenantId}:`, error);
    // Return default domains in case of error
    return TECHNICAL_DOMAIN_FORMATS[chatMode](TENANT_SLUG_TO_TECHNICAL_DOMAIN['default']);
  }
}