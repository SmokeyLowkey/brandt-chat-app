"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Edit, Trash2, Users } from "lucide-react";
import { toast } from "sonner";

interface Tenant {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
  createdAt: string;
  _count: {
    users: number;
  };
}

export default function TenantsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [newTenant, setNewTenant] = useState({
    name: "",
    slug: "",
    domain: "",
    namespaces: ["General"] // Default namespace
  });
  const [newNamespace, setNewNamespace] = useState("");

  // Redirect if not admin
  useEffect(() => {
    if (status === "loading") return;
    
    if (!session || session.user.role !== "ADMIN") {
      router.push("/dashboard");
    }
  }, [session, status, router]);

  // Fetch tenants
  useEffect(() => {
    const fetchTenants = async () => {
      try {
        const response = await fetch("/api/tenants");
        if (response.ok) {
          const data = await response.json();
          setTenants(data);
        } else {
          toast.error("Failed to fetch tenants");
        }
      } catch (error) {
        toast.error("Something went wrong");
      } finally {
        setIsLoading(false);
      }
    };

    if (session?.user.role === "ADMIN") {
      fetchTenants();
    }
  }, [session]);

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate that at least one namespace is provided
    if (newTenant.namespaces.length === 0) {
      toast.error("At least one namespace is required");
      return;
    }

    // Prepare tenant data - ensure domain is null if empty
    const tenantData = {
      name: newTenant.name,
      slug: newTenant.slug,
      domain: newTenant.domain.trim() === "" ? null : newTenant.domain,
      settings: {
        documentNamespaces: newTenant.namespaces
      }
    };
    
    // console.log("Creating tenant with data:", tenantData);
    
    try {
      toast.info("Submitting tenant creation request...");
      
      const response = await fetch("/api/tenants", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(tenantData),
      });

      // console.log("Response status:", response.status);
      
      if (response.ok) {
        const data = await response.json();
        // console.log("Tenant created successfully:", data);
        
        // Add _count property to the new tenant if it doesn't exist
        const newTenantWithCount = {
          ...data,
          _count: data._count || { users: 0 }
        };
        
        setTenants([...tenants, newTenantWithCount]);
        setNewTenant({ name: "", slug: "", domain: "", namespaces: ["General"] });
        setNewNamespace("");
        setIsDialogOpen(false);
        toast.success("Tenant created successfully");
        
        // Refresh the tenant list to get the complete data
        setTimeout(() => {
          router.refresh();
        }, 1000);
      } else {
        const errorText = await response.text();
        console.error("Failed to create tenant:", errorText);
        
        // Handle specific errors
        if (errorText.includes("Unique constraint failed on the fields: (`slug`)")) {
          toast.error("A tenant with this slug already exists. Please use a different slug.");
        } else {
          toast.error(errorText || "Failed to create tenant");
        }
      }
    } catch (error) {
      console.error("Exception during tenant creation:", error);
      toast.error("Something went wrong: " + (error instanceof Error ? error.message : String(error)));
    }
  };

  const handleDeleteTenant = async () => {
    if (!selectedTenant) return;
    
    try {
      const response = await fetch(`/api/tenants/${selectedTenant.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setTenants(tenants.filter((tenant) => tenant.id !== selectedTenant.id));
        setIsDeleteDialogOpen(false);
        setSelectedTenant(null);
        toast.success("Tenant deleted successfully");
      } else {
        const error = await response.text();
        toast.error(error || "Failed to delete tenant");
      }
    } catch (error) {
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

  if (!session || session.user.role !== "ADMIN") {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tenant Management</h1>
          <p className="text-gray-500">Manage your organization's tenants</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#E31937] hover:bg-[#c01730]">
              <Plus className="mr-2 h-4 w-4" /> Add Tenant
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Tenant</DialogTitle>
              <DialogDescription>
                Add a new tenant to your organization.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateTenant}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Tenant Name</Label>
                  <Input
                    id="name"
                    value={newTenant.name}
                    onChange={(e) =>
                      setNewTenant({ ...newTenant, name: e.target.value })
                    }
                    placeholder="Acme Corporation"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug</Label>
                  <Input
                    id="slug"
                    value={newTenant.slug}
                    onChange={(e) =>
                      setNewTenant({ ...newTenant, slug: e.target.value })
                    }
                    placeholder="acme"
                    required
                  />
                  <p className="text-xs text-gray-500">
                    Used for unique identification. No spaces or special characters.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="domain">Domain (Optional)</Label>
                  <Input
                    id="domain"
                    value={newTenant.domain}
                    onChange={(e) =>
                      setNewTenant({ ...newTenant, domain: e.target.value })
                    }
                    placeholder="acme.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="namespaces">Document Namespaces (Required)</Label>
                  <div className="border rounded-md p-3 mb-2">
                    {newTenant.namespaces.length === 0 ? (
                      <p className="text-sm text-gray-500 italic">No namespaces defined yet. Add at least one namespace below.</p>
                    ) : (
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {newTenant.namespaces.map((namespace, index) => (
                          <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                            <span>{namespace}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              type="button"
                              onClick={() => {
                                const updatedNamespaces = [...newTenant.namespaces];
                                updatedNamespaces.splice(index, 1);
                                setNewTenant({ ...newTenant, namespaces: updatedNamespaces });
                              }}
                            >
                              <Trash2 className="h-3 w-3 text-gray-500" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      id="new-namespace"
                      placeholder="Enter namespace"
                      value={newNamespace}
                      onChange={(e) => setNewNamespace(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      onClick={() => {
                        if (newNamespace && newNamespace.trim() !== "") {
                          // Check if namespace already exists
                          if (!newTenant.namespaces.includes(newNamespace.trim())) {
                            setNewTenant({
                              ...newTenant,
                              namespaces: [...newTenant.namespaces, newNamespace.trim()]
                            });
                            setNewNamespace("");
                          } else {
                            toast.error("This namespace already exists");
                          }
                        }
                      }}
                      disabled={!newNamespace || newNamespace.trim() === ""}
                    >
                      Add
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Namespaces are used to categorize documents during upload. At least one namespace is required.
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" className="bg-[#E31937] hover:bg-[#c01730]">
                  Create Tenant
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tenants</CardTitle>
          <CardDescription>
            List of all tenants in your organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tenants.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-gray-500">No tenants found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Domain</TableHead>
                  <TableHead>Users</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenants.map((tenant) => (
                  <TableRow key={tenant.id}>
                    <TableCell className="font-medium">{tenant.name}</TableCell>
                    <TableCell>{tenant.slug}</TableCell>
                    <TableCell>{tenant.domain || "-"}</TableCell>
                    <TableCell>{tenant._count.users}</TableCell>
                    <TableCell>
                      {new Date(tenant.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => router.push(`/dashboard/admin/tenants/${tenant.id}/users`)}
                        >
                          <Users className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => router.push(`/dashboard/admin/tenants/${tenant.id}`)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            setSelectedTenant(tenant);
                            setIsDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the tenant "{selectedTenant?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteTenant}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}