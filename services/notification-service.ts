import { prisma } from "@/lib/prisma";

export interface NotificationData {
  type: string;
  title: string;
  message: string;
  metadata?: Record<string, any>;
  tenantId: string;
  userId: string;
}

export async function createNotification(data: NotificationData) {
  try {
    const notification = await prisma.notification.create({
      data: {
        type: data.type,
        title: data.title,
        message: data.message,
        metadata: data.metadata || {},
        tenantId: data.tenantId,
        userId: data.userId,
      },
    });
    
    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
}

export async function getRecentNotifications(tenantId: string, limit = 10, since?: Date) {
  try {
    const query: any = {
      where: {
        tenantId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    };
    
    if (since) {
      query.where.createdAt = {
        gt: since,
      };
    }
    
    const notifications = await prisma.notification.findMany(query);
    
    return notifications;
  } catch (error) {
    console.error("Error fetching notifications:", error);
    throw error;
  }
}

export async function markNotificationAsRead(id: string) {
  try {
    const notification = await prisma.notification.update({
      where: { id },
      data: { read: true },
    });
    
    return notification;
  } catch (error) {
    console.error("Error marking notification as read:", error);
    throw error;
  }
}