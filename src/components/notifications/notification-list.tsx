
"use client";

import Link from "next/link";
import { formatDistanceToNow } from 'date-fns';
import { FileSignature, FileCheck, ArrowRight } from "lucide-react";
import type { Notification } from "@/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface NotificationListProps {
  notifications: Notification[];
}

export function NotificationList({ notifications }: NotificationListProps) {

  const getNotificationMessage = (notification: Notification): string => {
    switch (notification.type) {
      case 'document_received':
        return `Document "${notification.document.title}" has arrived and needs your signature.`;
      case 'document_signed':
        return `Document "${notification.document.title}" was signed by ${notification.actor?.name}.`;
      default:
        return "New notification.";
    }
  };

  const getNotificationIcon = (notification: Notification) => {
    switch (notification.type) {
      case 'document_received':
        return <FileSignature className="h-6 w-6 text-blue-500" />;
      case 'document_signed':
        return <FileCheck className="h-6 w-6 text-green-500" />;
      default:
        return null;
    }
  }

  if (notifications.length === 0) {
    return (
      <div className="text-center text-muted-foreground p-8">
        You have no new notifications.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={cn(
            "flex items-start gap-4 rounded-lg border p-4 transition-colors hover:bg-muted/50",
            !notification.read && "bg-muted/20"
          )}
        >
          <div className="flex-shrink-0">{getNotificationIcon(notification)}</div>
          <div className="flex-grow">
            <p className="font-medium text-sm">{getNotificationMessage(notification)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {notification.timestamp ? formatDistanceToNow(notification.timestamp.toDate(), { addSuffix: true }) : 'Just now'}
            </p>
          </div>
          <Button asChild variant="ghost" size="icon">
             <Link href={`/dashboard/documents/${notification.document.id}`}>
                <ArrowRight className="h-4 w-4" />
                <span className="sr-only">View Document</span>
            </Link>
          </Button>
        </div>
      ))}
    </div>
  );
}
