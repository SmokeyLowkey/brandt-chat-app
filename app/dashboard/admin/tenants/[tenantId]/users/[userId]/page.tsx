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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

interface Tenant {
  id: string;
  name: string;
}

interface UpdateUserData {
  name: string;
  email: string;
  role: string;
  password?: string;
}

export default function UserDetailsPage({
  params,
}: {
  params: { tenantId: string; userId: string };
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<UpdateUserData>({
    name: "",
    email: "",
    role: "",
    password: "",
  });

  // Redirect if not admin
  useEffect(() => {
    if (status === "loading") return;
    
    if (!session || session.user.role !== "ADMIN") {
      router.push("/dashboard");
    }
  }, [session, status, router]);

  // Fetch tenant and user details
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch tenant details
        const tenantResponse = await fetch(`/api/tenants/${params.tenantId}`);
        if (!tenantResponse.ok) {
          toast.error("Failed to fetch tenant details");
          router.push("/dashboard/admin/tenants");
          return;
        }
        
        const tenantData = await tenantResponse.json();
        setTenant(tenantData);

        // Fetch user details
        const userResponse = await fetch(`/api/tenants/${params.tenantId}/users/${params.userId}`);
        if (userResponse.ok) {
          const userData = await userResponse.json();
          setUser(userData);
          
          // Initialize form data with user data
          setFormData({
            name: userData.name,
            email: userData.email,
            role: userData.role,
            password: "",
          });
        } else {
          toast.error("Failed to fetch user details");
          router.push(`/dashboard/admin/tenants/${params.tenantId}/users`);
        }
      } catch (error) {
        toast.error("Something went wrong");
        router.push(`/dashboard/admin/tenants/${params.tenantId}/users`);
      } finally {
        setIsLoading(false);
      }
    };

    if (session?.user.role === "ADMIN") {
      fetchData();
    }
  }, [session, params.tenantId, params.userId, router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      // Only include password in the update if it's not empty
      const updateData: UpdateUserData = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
      };
      
      if (formData.password && formData.password.trim() !== "") {
        updateData.password = formData.password;
      }

      const response = await fetch(`/api/tenants/${params.tenantId}/users/${params.userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data);
        setFormData({
          ...formData,
          password: "", // Clear password field after successful update
        });
        toast.success("User updated successfully");
      } else {
        const error = await response.text();
        toast.error(error || "Failed to update user");
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

  if (!session || session.user.role !== "ADMIN" || !user || !tenant) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
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
            <h1 className="text-2xl font-bold">Edit User</h1>
            <p className="text-gray-500">{tenant.name} - User Management</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>User Information</CardTitle>
              <CardDescription>
                Edit user details and permissions
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSave}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) =>
                      setFormData({ ...formData, role: value })
                    }
                  >
                    <SelectTrigger id="role">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ADMIN">Administrator</SelectItem>
                      <SelectItem value="MANAGER">Manager</SelectItem>
                      <SelectItem value="SUPPORT_AGENT">Support Agent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">New Password (leave blank to keep current)</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    placeholder="••••••••"
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  type="submit"
                  className="bg-[#E31937] hover:bg-[#c01730]"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Save Changes
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>User Details</CardTitle>
              <CardDescription>
                Account information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">User ID</span>
                  <span className="font-medium text-sm">{user.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Created</span>
                  <span className="font-medium">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Last Updated</span>
                  <span className="font-medium">
                    {new Date(user.updatedAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Tenant</span>
                  <span className="font-medium">{tenant.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Current Role</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    user.role === "ADMIN" 
                      ? "bg-purple-100 text-purple-800" 
                      : user.role === "MANAGER" 
                      ? "bg-blue-100 text-blue-800" 
                      : "bg-green-100 text-green-800"
                  }`}>
                    {user.role === "ADMIN" 
                      ? "Administrator" 
                      : user.role === "MANAGER" 
                      ? "Manager" 
                      : "Support Agent"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}