import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { hash } from "bcryptjs";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

// POST /api/users/[userId]/change-password - Change a user's password
export async function POST(
  req: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = params.userId;

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Users can only change their own password unless they are an admin
    if (session.user.id !== userId && session.user.role !== "ADMIN") {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const body = await req.json();
    const { newPassword } = body;

    if (!newPassword || newPassword.length < 8) {
      return new NextResponse("Password must be at least 8 characters long", { status: 400 });
    }

    // Get the user
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    // Hash the new password
    const hashedPassword = await hash(newPassword, 12);

    // Update the user's password and reset the mustChangePassword flag
    const updatedUser = await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        password: hashedPassword,
        mustChangePassword: false,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        tenantId: true,
        mustChangePassword: false
      }
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
      redirectUrl: "/dashboard"
    });
  } catch (error) {
    console.error("[CHANGE_PASSWORD]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}