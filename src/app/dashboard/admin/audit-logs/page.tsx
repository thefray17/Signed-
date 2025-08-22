
"use client";

import { useState, useEffect } from "react";
import { collection, query, getDocs, orderBy, Timestamp } from "firebase/firestore";
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

    const renderDetails = (log: AuditLog) => {
        const details = log.details;
        if (log.action === 'assignUserRole' && log.status === 'success') {
            return `Changed role from "${details.oldRole}" to "${details.requestedRole}" for user ${details.targetUserId?.substring(0,5)}...`
        }
        if (log.action === 'updateUserStatus' && log.status === 'success') {
             return `Changed status from "${details.oldStatus}" to "${details.requestedStatus}" for user ${details.targetUserId?.substring(0,5)}...`
        }
        if (log.status === 'failure') {
            return <span className="text-destructive text-xs font-mono">{details.error || "No details provided."}</span>
        }
        return <span className="text-xs font-mono">{JSON.stringify(details)}</span>
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>System Audit Logs</CardTitle>
                <CardDescription>
                    A stream of all administrative actions in the system.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Timestamp</TableHead>
                            <TableHead>Actor</TableHead>
                            <TableHead>Action</TableHead>
                             <TableHead>Status</TableHead>
                            <TableHead>Details</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell colSpan={5}>
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
                                <TableCell>
                                     <Badge variant={log.status === 'success' ? 'default' : 'destructive'}>
                                        {log.status}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    {renderDetails(log)}
                                </TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-24">
                                    No actions have been recorded yet.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
