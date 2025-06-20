"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

interface PasswordChangeFormProps {
  userId: string;
  onSuccess?: () => void;
}

export default function PasswordChangeForm({ userId, onSuccess }: PasswordChangeFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate passwords
    if (formData.newPassword.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }
    
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/users/${userId}/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          newPassword: formData.newPassword,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || "Failed to change password");
      }
      
      const data = await response.json();
      
      toast.success("Password changed successfully");
      
      // Clear form
      setFormData({
        newPassword: "",
        confirmPassword: "",
      });
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      } else {
        // console.log("Password change successful, setting cookie and redirecting to dashboard...");
        
        // Set a cookie to indicate password has been changed
        document.cookie = "password_changed=true; path=/; max-age=86400"; // 24 hours
        
        // Add a special parameter to indicate we're coming from password change
        const redirectUrl = new URL(data.redirectUrl || "/dashboard", window.location.origin);
        redirectUrl.searchParams.set("from", "password-change");
        
        // Force redirect using window.location.replace for more reliable navigation
        window.location.replace(redirectUrl.toString());
      }
    } catch (error) {
      console.error("Error changing password:", error);
      toast.error(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Change Your Password</CardTitle>
        <CardDescription>
          You need to change your password before continuing.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <Input
              id="newPassword"
              type="password"
              value={formData.newPassword}
              onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
              placeholder="Enter your new password"
              required
              autoComplete="new-password"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              placeholder="Confirm your new password"
              required
              autoComplete="new-password"
            />
          </div>
          
          <div className="text-sm">
            <p className="font-medium">Your password must:</p>
            <ul className="list-disc pl-5 text-gray-500">
              <li>Be at least 8 characters long</li>
              <li>Include a mix of letters, numbers, and symbols</li>
              <li>Not be the same as your previous password</li>
            </ul>
          </div>
        </CardContent>
        
        <CardFooter>
          <Button 
            type="submit" 
            className="w-full bg-[#E31937] hover:bg-[#c01730]"
            disabled={isLoading}
          >
            {isLoading ? "Changing Password..." : "Change Password"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}