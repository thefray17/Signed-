
"use client";

import { useTransition } from "react";
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { Document as DocumentType } from "@/types";
import { formatDistanceToNow } from 'date-fns';
import { Button } from "../ui/button";
import { Loader2, MoreHorizontal, Eye } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { updateDocumentStatusAction } from "@/app/dashboard/documents/actions";

interface DocumentListProps {
  documents: DocumentType[];
  type: 'sent' | 'received';
}

export function DocumentList({ documents, type }: DocumentListProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const handleAction = (docId: string, status: 'signed' | 'rejected') => {
    if (!user || !user.office) {
      toast({ variant: 'destructive', title: 'Error', description: 'User or office information is missing.' });
      return;
    }

    startTransition(async () => {
      const result = await updateDocumentStatusAction({
        docId,
        newStatus: status,
        userId: user.uid,
        userDisplayName: user.displayName || 'Anonymous',
        userOfficeId: user.office as string,
      });

      if (result.error) {
        toast({ variant: 'destructive', title: `Action Failed`, description: result.error });
      } else {
        toast({ title: `Document ${status}`, description: `The document has been successfully ${status}.` });
      }
    });
  };


  const getStatusVariant = (status: string) => {
    switch(status) {
        case 'signed':
        case 'completed':
            return 'default';
        case 'rejected':
            return 'destructive';
        case 'in_transit':
        case 'pending_transit':
            return 'secondary';
        default:
            return 'outline';
    }
  }

  const getLastUpdate = (doc: DocumentType) => {
    // Find the latest timestamp in the history
    if (doc.history && doc.history.length > 0) {
      const latestLog = doc.history.reduce((latest, current) => {
        if (!latest.timestamp) return current;
        if (!current.timestamp) return latest;
        return current.timestamp.toMillis() > latest.timestamp.toMillis() ? current : latest;
      });
      if (latestLog.timestamp && latestLog.timestamp.toDate) {
           return formatDistanceToNow(latestLog.timestamp.toDate(), { addSuffix: true });
      }
    }
    if (doc.createdAt && doc.createdAt.toDate) {
        return formatDistanceToNow(doc.createdAt.toDate(), { addSuffix: true });
    }
    return 'N/A';
  }
  
  const getCurrentOffice = (doc: DocumentType) => {
    if (doc.currentStatus === 'completed') return 'Completed';
    const currentLog = doc.history.find(log => log.officeId === doc.currentOfficeId && (log.status === 'in_transit' || log.status === 'pending_transit'));
    return currentLog?.officeName || 'Unknown Office';
  }

  if (documents.length === 0) {
    return (
      <div className="text-center text-muted-foreground p-8">
        No documents to display.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Title</TableHead>
          <TableHead className="hidden sm:table-cell">Status</TableHead>
          <TableHead className="hidden md:table-cell">{type === 'sent' ? 'Current Office' : 'Originating Office'}</TableHead>
          <TableHead className="text-right">Last Update</TableHead>
           <TableHead>
                <span className="sr-only">Actions</span>
           </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {documents.map((doc) => (
          <TableRow key={doc.id}>
            <TableCell>
              <div className="font-medium">{doc.title}</div>
              <div className="hidden text-sm text-muted-foreground md:inline">
                {doc.id}
              </div>
            </TableCell>
            <TableCell className="hidden sm:table-cell">
              <Badge variant={getStatusVariant(doc.currentStatus)}>
                {doc.currentStatus.replace(/_/g, ' ')}
              </Badge>
            </TableCell>
            <TableCell className="hidden md:table-cell">
                {type === 'sent' ? getCurrentOffice(doc) : doc.history[0]?.officeName || 'N/A'}
            </TableCell>
            <TableCell className="text-right">{getLastUpdate(doc)}</TableCell>
             <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button aria-label="Open document actions menu" size="icon" variant="ghost" disabled={isPending}>
                    {isPending ? <Loader2 className="h-4 w-4 animate-spin"/> : <MoreHorizontal className="h-4 w-4" />}
                    <span className="sr-only">Toggle menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuItem asChild>
                    <Link href={`/dashboard/documents/${doc.id}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                    </Link>
                  </DropdownMenuItem>
                  {type === 'received' && (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleAction(doc.id, 'signed')}>Sign Document</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => handleAction(doc.id, 'rejected')}>Reject Document</DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
