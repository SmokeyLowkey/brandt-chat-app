"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import PasswordChangeForm from "@/components/auth/password-change-form";

export default function ChangePasswordPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      // Redirect to login if not authenticated
      router.push("/login");
      return;
    }

    // Check if user needs to change password
    if (!session.user.mustChangePassword) {
      // Redirect to dashboard if password change is not required
      router.push("/dashboard");
      return;
    }

    setIsLoading(false);
  }, [session, status, router]);

  const handlePasswordChangeSuccess = async () => {
    try {
      // console.log("Password change successful, updating session...");
      
      // Update the session to reflect that the password has been changed
      await update({
        ...session,
        user: {
          ...session?.user,
          mustChangePassword: false,
        },
      });
      
      // console.log("Session updated, setting cookie and redirecting to dashboard...");
      
      // Set a cookie to indicate password has been changed
      document.cookie = "password_changed=true; path=/; max-age=86400"; // 24 hours
      
      // Add a special parameter to indicate we're coming from password change
      const dashboardUrl = new URL("/dashboard", window.location.origin);
      dashboardUrl.searchParams.set("from", "password-change");
      
      // Force redirect to dashboard with replace to prevent back navigation
      window.location.replace(dashboardUrl.toString());
    } catch (error) {
      console.error("Error updating session:", error);
      
      // Set cookie even in case of error
      document.cookie = "password_changed=true; path=/; max-age=86400"; // 24 hours
      
      // Redirect anyway in case of error
      window.location.replace("/dashboard?from=password-change-error");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E31937]"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Change Your Password</h1>
          <p className="text-gray-600 mt-2">
            You need to change your password before continuing to use the application.
          </p>
        </div>

        <PasswordChangeForm 
          userId={session?.user.id || ""} 
          onSuccess={handlePasswordChangeSuccess} 
        />
      </div>
    </div>
  );
}