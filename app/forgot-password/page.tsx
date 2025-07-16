"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import ForgotPasswordForm from "@/components/auth/forgot-password-form";

export default function ForgotPasswordPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-3xl font-bold text-[#E31937] mb-2">PartsIQ</div>
          <h1 className="text-2xl font-semibold text-gray-900">Reset Your Password</h1>
          <p className="text-gray-600">We'll send you instructions to reset your password</p>
        </div>

        <ForgotPasswordForm />

        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            Remember your password?{" "}
            <Link href="/login" className="text-[#E31937] hover:underline">
              Back to login
            </Link>
          </p>
        </div>

        <div className="text-center mt-6 text-sm text-gray-600">
          Need help? Contact{" "}
          <a href="#" className="text-[#E31937] hover:underline">
            PartsIQ Support
          </a>
          {" "} or call 1-800-PARTS-AI
        </div>
      </div>
    </div>
  );
}