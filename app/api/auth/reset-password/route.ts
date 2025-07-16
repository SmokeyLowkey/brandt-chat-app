import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";

// POST /api/auth/reset-password - Reset password using token
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { token, newPassword } = body;
    
    if (!token || typeof token !== "string") {
      return new NextResponse("Invalid token", { status: 400 });
    }
    
    if (!newPassword || typeof newPassword !== "string" || newPassword.length < 8) {
      return new NextResponse("Password must be at least 8 characters long", { status: 400 });
    }
    
    // Find the reset token
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: {
        token,
      },
    });
    
    // Check if token exists and is not expired
    if (!resetToken || resetToken.expires < new Date()) {
      return new NextResponse("Invalid or expired token", { status: 400 });
    }
    
    // Find the user by email
    const user = await prisma.user.findUnique({
      where: {
        email: resetToken.email,
      },
    });
    
    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }
    
    // Hash the new password
    const hashedPassword = await hash(newPassword, 12);
    
    // Update the user's password
    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        password: hashedPassword,
        mustChangePassword: false,
      },
    });
    
    // Delete the reset token
    await prisma.passwordResetToken.delete({
      where: {
        id: resetToken.id,
      },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[RESET_PASSWORD]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}