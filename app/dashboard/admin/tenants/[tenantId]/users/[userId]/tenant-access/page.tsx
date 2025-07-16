"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Tenant {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  tenantId: string;
}

export default function ManagerTenantAccessPage({
  params,
}: {
  params: { tenantId: string; userId: string };
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [accessibleTenants, setAccessibleTenants] = useState<Tenant[]>([]);
  const [availableTenants, setAvailableTenants] = useState<Tenant[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingAccess, setIsAddingAccess] = useState(false);

  // Redirect if not admin
  useEffect(() => {
    if (status === "loading") return;

    if (!session || session.user.role !== "ADMIN") {
      router.push("/dashboard");
    }
  }, [session, status, router]);

  // Fetch user details
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch(`/api/tenants/${params.tenantId}/users/${params.userId}`);
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
          
          // Only proceed if the user is a manager
          if (userData.role !== "MANAGER") {
            toast.error("This user is not a manager");
            router.push(`/dashboard/admin/tenants/${params.tenantId}/users`);
          }
        } else {
          toast.error("Failed to fetch user details");
          router.push(`/dashboard/admin/tenants/${params.tenantId}/users`);
        }
      } catch (error) {
        console.error("Error fetching user:", error);
        toast.error("Something went wrong");
      }
    };

    if (session?.user.role === "ADMIN") {
      fetchUser();
    }
  }, [session, params.tenantId, params.userId, router]);

  // Fetch accessible tenants
  useEffect(() => {
    const fetchAccessibleTenants = async () => {
      if (!user) return;

      try {
        const response = await fetch(`/api/managers/${params.userId}/tenant-access`);
        if (response.ok) {
          const data = await response.json();
          setAccessibleTenants(data);
        } else {
          toast.error("Failed to fetch accessible tenants");
        }
      } catch (error) {
        console.error("Error fetching accessible tenants:", error);
        toast.error("Something went wrong");
      } finally {
        setIsLoading(false);
      }
    };

    if (user && user.role === "MANAGER") {
      fetchAccessibleTenants();
    }
  }, [user, params.userId]);

  // Fetch all tenants for the dropdown
  useEffect(() => {
    const fetchAllTenants = async () => {
      try {
        const response = await fetch("/api/tenants");
        if (response.ok) {
          const allTenants = await response.json();
          
          // Filter out tenants that the manager already has access to
          const filteredTenants = allTenants.filter(
            (tenant: Tenant) => 
              !accessibleTenants.some(accessTenant => accessTenant.id === tenant.id) &&
              tenant.id !== user?.tenantId // Also filter out the manager's home tenant
          );
          
          setAvailableTenants(filteredTenants);
        } else {
          toast.error("Failed to fetch tenants");
        }
      } catch (error) {
        console.error("Error fetching tenants:", error);
        toast.error("Something went wrong");
      }
    };

    if (user && accessibleTenants.length >= 0) {
      fetchAllTenants();
    }
  }, [user, accessibleTenants]);

  const handleGrantAccess = async () => {
    if (!selectedTenantId) {
      toast.error("Please select a tenant");
      return;
    }

    setIsAddingAccess(true);

    try {
      const response = await fetch(`/api/managers/${params.userId}/tenant-access`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tenantId: selectedTenantId }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Add the new tenant to the accessible tenants list
        const newTenant = availableTenants.find(t => t.id === selectedTenantId);
        if (newTenant) {
          setAccessibleTenants([...accessibleTenants, newTenant]);
          
          // Remove the tenant from available tenants
          setAvailableTenants(availableTenants.filter(t => t.id !== selectedTenantId));
          
          // Reset the selected tenant
          setSelectedTenantId("");
          
          toast.success(`Access granted to ${newTenant.name}`);
        }
      } else {
        const error = await response.text();
        toast.error(error || "Failed to grant access");
      }
    } catch (error) {
      console.error("Error granting access:", error);
      toast.error("Something went wrong");
    } finally {
      setIsAddingAccess(false);
    }
  };

  const handleRevokeAccess = async (tenantId: string) => {
    try {
      const response = await fetch(`/api/managers/${params.userId}/tenant-access?tenantId=${tenantId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        // Remove the tenant from accessible tenants
        const removedTenant = accessibleTenants.find(t => t.id === tenantId);
        setAccessibleTenants(accessibleTenants.filter(t => t.id !== tenantId));
        
        // Add the tenant back to available tenants
        if (removedTenant) {
          setAvailableTenants([...availableTenants, removedTenant]);
          toast.success(`Access revoked from ${removedTenant.name}`);
        }
      } else {
        const error = await response.text();
        toast.error(error || "Failed to revoke access");
      }
    } catch (error) {
      console.error("Error revoking access:", error);
      toast.error("Something went wrong");
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E31937]"></div>
      </div>
    );
  }

  if (!session || session.user.role !== "ADMIN" || !user) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push(`/dashboard/admin/tenants/${params.tenantId}/users`)}
          className="mr-2"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Manage Tenant Access</h1>
          <p className="text-gray-500">
            {user.name} ({user.email}) - {user.role}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Grant Tenant Access</CardTitle>
          <CardDescription>
            Allow this manager to access additional tenants
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <Select
                value={selectedTenantId}
                onValueChange={setSelectedTenantId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a tenant" />
                </SelectTrigger>
                <SelectContent>
                  {availableTenants.length === 0 ? (
                    <SelectItem value="none" disabled>
                      No available tenants
                    </SelectItem>
                  ) : (
                    availableTenants.map((tenant) => (
                      <SelectItem key={tenant.id} value={tenant.id}>
                        {tenant.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleGrantAccess}
              disabled={!selectedTenantId || isAddingAccess}
              className="bg-[#E31937] hover:bg-[#c01730]"
            >
              <Plus className="mr-2 h-4 w-4" />
              Grant Access
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Accessible Tenants</CardTitle>
          <CardDescription>
            Tenants this manager can access
          </CardDescription>
        </CardHeader>
        <CardContent>
          {accessibleTenants.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-gray-500">
                This manager doesn't have access to any additional tenants
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Domain</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accessibleTenants.map((tenant) => (
                  <TableRow key={tenant.id}>
                    <TableCell className="font-medium">{tenant.name}</TableCell>
                    <TableCell>{tenant.slug}</TableCell>
                    <TableCell>{tenant.domain || "-"}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleRevokeAccess(tenant.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}