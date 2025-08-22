
"use client";

import { useState, useEffect } from "react";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase-app";
import { useAuth } from "@/hooks/use-auth";
import type { Document as DocumentType, Notification } from "@/types";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { NotificationList } from "@/components/notifications/notification-list";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

export default function NotificationsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !user.office) return;

    const fetchNotifications = async () => {
      setLoading(true);
      try {
        const collectedNotifications: Notification[] = [];

        // 1. Get notifications for documents user has received
        const receivedQuery = query(
          collection(db, "documents"),
          where("currentOfficeId", "==", user.office),
          where("currentStatus", "==", "in_transit")
        );
        const receivedSnapshot = await getDocs(receivedQuery);
        receivedSnapshot.forEach((doc) => {
          const docData = doc.data() as DocumentType;
          const relevantHistory = docData.history.find(h => h.officeId === user.office && h.status === 'in_transit');
          if (relevantHistory) {
              collectedNotifications.push({
                id: `${doc.id}-received`,
                type: 'document_received',
                document: { id: doc.id, title: docData.title },
                timestamp: relevantHistory.timestamp,
                read: false, // In a real app, you'd track this
              });
          }
        });

        // 2. Get notifications for documents user sent that were signed
        const sentQuery = query(collection(db, "documents"), where("ownerId", "==", user.uid));
        const sentSnapshot = await getDocs(sentQuery);
        sentSnapshot.forEach((doc) => {
          const docData = doc.data() as DocumentType;
          docData.history.forEach((log, index) => {
            if (log.status === 'signed' && log.signedBy) {
              collectedNotifications.push({
                id: `${doc.id}-signed-${index}`,
                type: 'document_signed',
                document: { id: doc.id, title: docData.title },
                actor: { name: log.signedBy.name },
                timestamp: log.timestamp,
                read: false,
              });
            }
          });
        });

        // Sort notifications by timestamp, most recent first
        const sortedNotifications = collectedNotifications.sort((a, b) => {
             if (!a.timestamp) return 1;
             if (!b.timestamp) return -1;
             return b.timestamp.toMillis() - a.timestamp.toMillis();
        });

        setNotifications(sortedNotifications);

      } catch (error) {
        console.error("Error fetching notifications: ", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not fetch your notifications.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [user, toast]);
  
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-4 w-3/4" />
        </CardHeader>
        <CardContent className="space-y-4">
             <Skeleton className="h-16 w-full" />
             <Skeleton className="h-16 w-full" />
             <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
     <Card>
        <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>
                Recent updates about your documents.
            </CardDescription>
        </Header>
        <CardContent>
           <NotificationList notifications={notifications} />
        </CardContent>
    </Card>
  );
}
