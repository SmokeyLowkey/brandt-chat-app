-- CreateTable
CREATE TABLE "manager_tenant_access" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "managerId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,

    CONSTRAINT "manager_tenant_access_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "manager_tenant_access_managerId_idx" ON "manager_tenant_access"("managerId");

-- CreateIndex
CREATE INDEX "manager_tenant_access_tenantId_idx" ON "manager_tenant_access"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "manager_tenant_access_managerId_tenantId_key" ON "manager_tenant_access"("managerId", "tenantId");

-- AddForeignKey
ALTER TABLE "manager_tenant_access" ADD CONSTRAINT "manager_tenant_access_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manager_tenant_access" ADD CONSTRAINT "manager_tenant_access_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
