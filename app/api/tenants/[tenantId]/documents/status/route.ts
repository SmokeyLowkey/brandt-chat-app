import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  context: { params: { tenantId: string } }
) {
  try {
    // Get the session to verify authentication
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get tenant ID from params - make sure to await it
    const params = await context.params;
    const tenantId = params.tenantId;

    // Check if user has access to this tenant
    if (session.user.role !== "ADMIN" && session.user.tenantId !== tenantId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const { documentIds } = body;

    if (!Array.isArray(documentIds) || documentIds.length === 0) {
      return NextResponse.json(
        { error: "Invalid document IDs" },
        { status: 400 }
      );
    }

    // Get status for the requested documents
    const documents = await prisma.document.findMany({
      where: {
        id: { in: documentIds },
        tenantId: tenantId,
      },
      select: {
        id: true,
        status: true,
        metadata: true,
      },
    });

    // Format the response
    const statusUpdates = documents.map((doc) => {
      const metadata = doc.metadata as any || {};
      return {
        id: doc.id,
        status: doc.status,
        error: metadata.error || null,
      };
    });

    return NextResponse.json(statusUpdates);
  } catch (error: any) {
    console.error("Error fetching document status:", error);
    return NextResponse.json(
      { error: `Error fetching document status: ${error.message}` },
      { status: 500 }
    );
  }
}