"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { ArrowLeft, Save, X, Edit, Users } from "lucide-react";
import { toast } from "sonner";

interface TenantSettings {
  theme: string;
  features: {
    documentUpload: boolean;
    analytics: boolean;
  };
  documentNamespaces: string[];
}

interface Tenant {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
  settings: TenantSettings;
  createdAt: string;
  updatedAt: string;
  _count: {
    users: number;
    documents: number;
    conversations: number;
  };
}

export default function TenantDetailsPage({
  params,
}: {
  params: { tenantId: string };
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [newNamespace, setNewNamespace] = useState("");
  const [formData, setFormData] = useState<{
    name: string;
    domain: string;
    settings: TenantSettings;
  }>({
    name: "",
    domain: "",
    settings: {
      theme: "light",
      features: {
        documentUpload: true,
        analytics: true,
      },
      documentNamespaces: [],
    },
  });

  // Redirect if not admin
  useEffect(() => {
    if (status === "loading") return;
    
    if (!session || session.user.role !== "ADMIN") {
      router.push("/dashboard");
    }
  }, [session, status, router]);

  // Fetch tenant details
  useEffect(() => {
    const fetchTenant = async () => {
      try {
        const response = await fetch(`/api/tenants/${params.tenantId}`);
        if (response.ok) {
          const data = await response.json();
          setTenant(data);
          
          // Ensure settings has the correct structure with defaults
          const settings = data.settings || {};
          
          setFormData({
            name: data.name,
            domain: data.domain || "",
            settings: {
              theme: settings.theme || "light",
              features: {
                documentUpload: settings.features?.documentUpload !== undefined ? settings.features.documentUpload : true,
                analytics: settings.features?.analytics !== undefined ? settings.features.analytics : true,
              },
              documentNamespaces: Array.isArray(settings.documentNamespaces) ? settings.documentNamespaces : [],
            },
          });
        } else {
          toast.error("Failed to fetch tenant details");
          router.push("/dashboard/admin/tenants");
        }
      } catch (error) {
        toast.error("Something went wrong");
        router.push("/dashboard/admin/tenants");
      } finally {
        setIsLoading(false);
      }
    };

    if (session?.user.role === "ADMIN") {
      fetchTenant();
    }
  }, [session, params.tenantId, router]);

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      const response = await fetch(`/api/tenants/${params.tenantId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        setTenant(data);
        toast.success("Tenant updated successfully");
      } else {
        const error = await response.text();
        toast.error(error || "Failed to update tenant");
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setIsSaving(false);
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E31937]"></div>
      </div>
    );
  }

  if (!session || session.user.role !== "ADMIN" || !tenant) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/dashboard/admin/tenants")}
            className="mr-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{tenant.name}</h1>
            <p className="text-gray-500">Manage tenant details and settings</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/dashboard/admin/tenants/${tenant.id}/users`)}
          >
            <Users className="mr-2 h-4 w-4" />
            Manage Users
          </Button>
          <Button
            className="bg-[#E31937] hover:bg-[#c01730]"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save Changes
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Tabs defaultValue="general">
            <TabsList className="mb-4">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="features">Features</TabsTrigger>
              <TabsTrigger value="documents">Document Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>General Information</CardTitle>
                  <CardDescription>
                    Basic information about the tenant
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Tenant Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="slug">Slug</Label>
                    <Input id="slug" value={tenant.slug} disabled />
                    <p className="text-xs text-gray-500">
                      The slug cannot be changed after creation.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="domain">Domain</Label>
                    <Input
                      id="domain"
                      value={formData.domain}
                      onChange={(e) =>
                        setFormData({ ...formData, domain: e.target.value })
                      }
                      placeholder="example.com"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="features" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Feature Settings</CardTitle>
                  <CardDescription>
                    Enable or disable features for this tenant
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="document-upload">Document Upload</Label>
                      <p className="text-sm text-gray-500">
                        Allow users to upload documents for AI processing
                      </p>
                    </div>
                    <Switch
                      id="document-upload"
                      checked={formData.settings.features.documentUpload}
                      onCheckedChange={(checked) =>
                        setFormData({
                          ...formData,
                          settings: {
                            ...formData.settings,
                            features: {
                              ...formData.settings.features,
                              documentUpload: checked,
                            },
                          },
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="analytics">Analytics</Label>
                      <p className="text-sm text-gray-500">
                        Enable analytics and reporting features
                      </p>
                    </div>
                    <Switch
                      id="analytics"
                      checked={formData.settings.features.analytics}
                      onCheckedChange={(checked) =>
                        setFormData({
                          ...formData,
                          settings: {
                            ...formData.settings,
                            features: {
                              ...formData.settings.features,
                              analytics: checked,
                            },
                          },
                        })
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="documents" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Document Namespaces</CardTitle>
                  <CardDescription>
                    Configure namespaces for document organization
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex flex-col gap-2">
                      <Label>Namespaces</Label>
                      <p className="text-sm text-gray-500">
                        Define namespaces to categorize documents during upload
                      </p>
                      
                      <div className="border rounded-md p-4">
                        {formData.settings.documentNamespaces.length === 0 ? (
                          <p className="text-sm text-gray-500 italic">No namespaces defined yet. Add your first namespace below.</p>
                        ) : (
                          <div className="space-y-2 max-h-60 overflow-y-auto">
                            {formData.settings.documentNamespaces.map((namespace, index) => (
                              <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                                <span>{namespace}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    const updatedNamespaces = [...formData.settings.documentNamespaces];
                                    updatedNamespaces.splice(index, 1);
                                    setFormData({
                                      ...formData,
                                      settings: {
                                        ...formData.settings,
                                        documentNamespaces: updatedNamespaces,
                                      },
                                    });
                                  }}
                                >
                                  <X className="h-4 w-4 text-gray-500" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-2 mt-2">
                        <Input
                          id="new-namespace"
                          placeholder="Enter new namespace"
                          value={newNamespace || ""}
                          onChange={(e) => setNewNamespace(e.target.value)}
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          onClick={() => {
                            if (newNamespace && newNamespace.trim() !== "") {
                              // Check if namespace already exists
                              if (!formData.settings.documentNamespaces.includes(newNamespace.trim())) {
                                setFormData({
                                  ...formData,
                                  settings: {
                                    ...formData.settings,
                                    documentNamespaces: [...formData.settings.documentNamespaces, newNamespace.trim()],
                                  },
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
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Tenant Statistics</CardTitle>
              <CardDescription>
                Usage statistics for this tenant
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Users</span>
                  <span className="font-medium">{tenant._count.users}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Documents</span>
                  <span className="font-medium">{tenant._count.documents}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Conversations</span>
                  <span className="font-medium">{tenant._count.conversations}</span>
                </div>
              </div>
              <div className="pt-4 border-t">
                <div className="flex justify-between">
                  <span className="text-gray-500">Created</span>
                  <span className="font-medium">
                    {new Date(tenant.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Last Updated</span>
                  <span className="font-medium">
                    {new Date(tenant.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push(`/dashboard/admin/tenants/${tenant.id}/users`)}
              >
                <Users className="mr-2 h-4 w-4" />
                Manage Users
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  try {
                    // Focus on the general tab
                    const generalTab = document.querySelector('[value="general"]') as HTMLElement;
                    if (generalTab) {
                      generalTab.click();
                    }
                    // Scroll to the top of the form
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    // Show a toast to indicate the action
                    toast.info("Edit tenant details in the form above");
                  } catch (error) {
                    console.error("Error focusing on general tab:", error);
                    // Fallback - just scroll to top
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit Tenant
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}