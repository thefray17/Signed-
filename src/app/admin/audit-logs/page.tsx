
"use client";

import { useState, useEffect } from "react";
import { collection, query, where, getDocs, orderBy, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase-app";
import type { AuditLog } from "@/types";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from 'date-fns';

export default function AuditLogsPage() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        const fetchLogs = async () => {
            setLoading(true);
            try {
                const logsCollection = collection(db, "auditLogs");
                const q = query(
                    logsCollection, 
                    where("status", "==", "failure"), 
                    orderBy("timestamp", "desc")
                );

                const logSnapshot = await getDocs(q);
                const logList = logSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as AuditLog));
                setLogs(logList);
            } catch (error) {
                console.error("Error fetching audit logs: ", error);
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: "Could not load audit logs.",
                });
            } finally {
                setLoading(false);
            }
        };

        fetchLogs();
    }, [toast]);

    const formatTimestamp = (timestamp: Timestamp | Date | undefined) => {
        if (!timestamp) return "N/A";
        const date = timestamp instanceof Timestamp ? timestamp.toDate() : timestamp;
        return formatDistanceToNow(date, { addSuffix: true });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Audit Logs: Failed Actions</CardTitle>
                <CardDescription>
                    A stream of recent failed administrative actions in the system.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Timestamp</TableHead>
                            <TableHead>Actor</TableHead>
                            <TableHead>Action</TableHead>
                            <TableHead>Error Details</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell colSpan={4}>
                                        <Skeleton className="h-10 w-full" />
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : logs.length > 0 ? logs.map(log => (
                            <TableRow key={log.id}>
                                <TableCell>{formatTimestamp(log.timestamp)}</TableCell>
                                <TableCell>{log.actorEmail}</TableCell>
                                <TableCell>
                                    <Badge variant="secondary">{log.action}</Badge>
                                </TableCell>
                                <TableCell className="text-destructive text-xs font-mono">
                                    {log.details?.error || "No details provided."}
                                </TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center h-24">
                                    No failed actions recorded.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
