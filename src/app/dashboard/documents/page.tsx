
"use client";

import { useState, useEffect } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase-app";
import { useAuth } from "@/hooks/use-auth";
import type { Document as DocumentType } from "@/types";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { DocumentList } from "@/components/documents/document-list";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

export default function MyDocumentsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sentDocuments, setSentDocuments] = useState<DocumentType[]>([]);
  const [receivedDocuments, setReceivedDocuments] = useState<DocumentType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchDocuments = async () => {
      setLoading(true);
      try {
        // Fetch sent documents
        const sentQuery = query(collection(db, "documents"), where("ownerId", "==", user.uid));
        const sentSnapshot = await getDocs(sentQuery);
        const sentList = sentSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DocumentType));
        setSentDocuments(sentList);

        // Fetch received documents (in_transit at user's office)
        if(user.office) {
            const receivedQuery = query(
                collection(db, "documents"), 
                where("currentOfficeId", "==", user.office),
                where("currentStatus", "==", "in_transit")
            );
            const receivedSnapshot = await getDocs(receivedQuery);
            const receivedList = receivedSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DocumentType));
            setReceivedDocuments(receivedList);
        }

      } catch (error) {
        console.error("Error fetching documents: ", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not fetch your documents.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [user, toast]);
  
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-4 w-3/4" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
             <Skeleton className="h-10 w-48" />
             <Skeleton className="h-40 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Tabs defaultValue="received">
        <div className="flex items-center">
            <TabsList>
                <TabsTrigger value="received">Received ({receivedDocuments.length})</TabsTrigger>
                <TabsTrigger value="sent">Sent ({sentDocuments.length})</TabsTrigger>
            </TabsList>
        </div>
        <TabsContent value="received">
            <Card>
                <CardHeader>
                    <CardTitle>Received Documents</CardTitle>
                    <CardDescription>
                        Documents that are currently at your office and require action.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <DocumentList documents={receivedDocuments} type="received" />
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="sent">
            <Card>
                <CardHeader>
                    <CardTitle>Sent Documents</CardTitle>
                    <CardDescription>
                        Documents that you have created and routed for signature.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <DocumentList documents={sentDocuments} type="sent" />
                </CardContent>
            </Card>
        </TabsContent>
    </Tabs>
  );
}
