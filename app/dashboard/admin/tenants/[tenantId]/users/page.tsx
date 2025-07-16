"use client";

import { useState, useEffect, use } from "react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Plus, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  accessType: 'direct' | 'manager';
  homeTenant?: {
    name: string;
    slug: string;
  } | null;
}

interface Tenant {
  id: string;
  name: string;
}

export default function TenantUsersPage({
  params,
}: {
  params: Promise<{ tenantId: string }>;
}) {
  const resolvedParams = use(params);
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "SUPPORT_AGENT",
    sendInvitation: true,
  });

  // Redirect if not admin
  useEffect(() => {
    if (status === "loading") return;
    
    if (!session || session.user.role !== "ADMIN") {
      router.push("/dashboard");
    }
  }, [session, status, router]);

  // Fetch tenant details and users
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch tenant details
        const tenantResponse = await fetch(`/api/tenants/${resolvedParams.tenantId}`);
        if (!tenantResponse.ok) {
          toast.error("Failed to fetch tenant details");
          router.push("/dashboard/admin/tenants");
          return;
        }
        
        const tenantData = await tenantResponse.json();
        setTenant(tenantData);

        // Fetch users
        const usersResponse = await fetch(`/api/tenants/${resolvedParams.tenantId}/users`);
        if (usersResponse.ok) {
          const usersData = await usersResponse.json();
          setUsers(usersData);
        } else {
          toast.error("Failed to fetch users");
        }
      } catch (error) {
        toast.error("Something went wrong");
      } finally {
        setIsLoading(false);
      }
    };

    if (session?.user.role === "ADMIN") {
      fetchData();
    }
  }, [session, resolvedParams.tenantId, router]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch(`/api/tenants/${resolvedParams.tenantId}/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newUser),
      });

      if (response.ok) {
        const data = await response.json();
        setUsers([...users, data]);
        setNewUser({
          name: "",
          email: "",
          password: "",
          role: "SUPPORT_AGENT",
          sendInvitation: true,
        });
        setIsDialogOpen(false);
        toast.success("User created successfully");
      } else {
        const error = await response.text();
        toast.error(error || "Failed to create user");
      }
    } catch (error) {
      toast.error("Something went wrong");
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    
    try {
      const response = await fetch(`/api/tenants/${resolvedParams.tenantId}/users/${selectedUser.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setUsers(users.filter((user) => user.id !== selectedUser.id));
        setIsDeleteDialogOpen(false);
        setSelectedUser(null);
        toast.success("User deleted successfully");
      } else {
        const error = await response.text();
        toast.error(error || "Failed to delete user");
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
            <h1 className="text-2xl font-bold">{tenant.name} - Users</h1>
            <p className="text-gray-500">Manage users for this tenant</p>
          </div>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#E31937] hover:bg-[#c01730]">
              <Plus className="mr-2 h-4 w-4" /> Add User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
              <DialogDescription>
                Add a new user to {tenant.name}.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateUser}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={newUser.name}
                    onChange={(e) =>
                      setNewUser({ ...newUser, name: e.target.value })
                    }
                    placeholder="John Doe"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newUser.email}
                    onChange={(e) =>
                      setNewUser({ ...newUser, email: e.target.value })
                    }
                    placeholder="john.doe@example.com"
                    required
                  />
                </div>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="sendInvitation"
                      checked={newUser.sendInvitation}
                      onChange={(e) =>
                        setNewUser({ ...newUser, sendInvitation: e.target.checked })
                      }
                      className="h-4 w-4 rounded border-gray-300 text-[#E31937] focus:ring-[#E31937]"
                    />
                    <Label htmlFor="sendInvitation">
                      Send invitation email with temporary password
                    </Label>
                  </div>
                  
                  {!newUser.sendInvitation && (
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={newUser.password}
                        onChange={(e) =>
                          setNewUser({ ...newUser, password: e.target.value })
                        }
                        placeholder="••••••••"
                        required={!newUser.sendInvitation}
                      />
                    </div>
                  )}
                  
                  {newUser.sendInvitation && (
                    <div className="text-sm text-gray-500 italic">
                      A temporary password will be generated and sent to the user's email.
                      They will be required to change it on first login.
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={newUser.role}
                    onValueChange={(value) =>
                      setNewUser({ ...newUser, role: value })
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
                  Create User
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>
            <div className="space-y-1">
              <p>List of all users with access to {tenant.name}</p>
              <div className="flex gap-4 text-sm">
                <span className="text-gray-600">
                  Direct Users: <span className="font-medium text-gray-900">{users.filter(u => u.accessType === 'direct').length}</span>
                </span>
                <span className="text-gray-600">
                  Manager Access: <span className="font-medium text-gray-900">{users.filter(u => u.accessType === 'manager').length}</span>
                </span>
                <span className="text-gray-600">
                  Total: <span className="font-medium text-gray-900">{users.length}</span>
                </span>
              </div>
            </div>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-gray-500">No users found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Access Type</TableHead>
                  <TableHead>Home Tenant</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
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
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.accessType === 'direct'
                          ? "bg-gray-100 text-gray-800"
                          : "bg-orange-100 text-orange-800"
                      }`}>
                        {user.accessType === 'direct' ? 'Direct User' : 'Manager Access'}
                      </span>
                    </TableCell>
                    <TableCell>
                      {user.homeTenant ? (
                        <span className="text-sm text-gray-600">
                          {user.homeTenant.name}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {user.accessType === 'direct' ? (
                          <>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => router.push(`/dashboard/admin/tenants/${resolvedParams.tenantId}/users/${user.id}`)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => {
                                setSelectedUser(user);
                                setIsDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/dashboard/admin/tenants/${resolvedParams.tenantId}/users/${user.id}/tenant-access`)}
                          >
                            Manage Access
                          </Button>
                        )}
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
              Are you sure you want to delete the user "{selectedUser?.name}"? This action cannot be undone.
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
              onClick={handleDeleteUser}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}