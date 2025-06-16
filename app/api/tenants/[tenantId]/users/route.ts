import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { hash } from "bcryptjs";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { sendInvitationEmail, generateTemporaryPassword } from "@/utils/email";

// GET /api/tenants/[tenantId]/users - List users for a tenant
export async function GET(
  req: Request,
  { params }: { params: { tenantId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Only admins or users from the same tenant can list users
    if (session.user.role !== "ADMIN" && session.user.tenantId !== params.tenantId) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const users = await prisma.user.findMany({
      where: {
        tenantId: params.tenantId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("[TENANT_USERS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// POST /api/tenants/[tenantId]/users - Create a new user for a tenant
export async function POST(
  req: Request,
  { params }: { params: { tenantId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Only admins or tenant admins can create users
    if (
      session.user.role !== "ADMIN" &&
      (session.user.tenantId !== params.tenantId || session.user.role !== "ADMIN")
    ) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const body = await req.json();
    const { name, email, password, role, sendInvitation } = body;

    if (!name || !email || (!password && !sendInvitation)) {
      return new NextResponse("Name, email, and either password or invitation option are required", { status: 400 });
    }

    // Check if user with email already exists
    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existingUser) {
      return new NextResponse("User with this email already exists", { status: 400 });
    }

    // Validate role
    const validRoles = ["ADMIN", "MANAGER", "SUPPORT_AGENT"];
    if (role && !validRoles.includes(role)) {
      return new NextResponse("Invalid role", { status: 400 });
    }

    // Get tenant details for email
    const tenant = await prisma.tenant.findUnique({
      where: { id: params.tenantId },
      select: { name: true }
    });

    if (!tenant) {
      return new NextResponse("Tenant not found", { status: 404 });
    }

    let userPassword = password;
    let shouldChangePassword = false;

    // If sending invitation, generate a temporary password
    if (sendInvitation) {
      userPassword = generateTemporaryPassword();
      shouldChangePassword = true;
    }

    // Hash password
    const hashedPassword = await hash(userPassword, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role || "SUPPORT_AGENT",
        tenantId: params.tenantId,
        mustChangePassword: shouldChangePassword,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        mustChangePassword: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Send invitation email if requested
    if (sendInvitation) {
      try {
        await sendInvitationEmail(
          email,
          name,
          tenant.name,
          userPassword
        );
      } catch (emailError) {
        console.error("[EMAIL_SEND_ERROR]", emailError);
        // We don't want to fail the user creation if email sending fails
        // But we log the error and could implement a retry mechanism
      }
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("[TENANT_USERS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}