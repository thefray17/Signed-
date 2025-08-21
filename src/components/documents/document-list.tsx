
"use client";

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
import { MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface DocumentListProps {
  documents: DocumentType[];
  type: 'sent' | 'received';
}

export function DocumentList({ documents, type }: DocumentListProps) {

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
    if (doc.history && doc.history.length > 0) {
        const lastLog = doc.history[doc.history.length - 1];
        if (lastLog.timestamp && lastLog.timestamp.toDate) {
             return formatDistanceToNow(lastLog.timestamp.toDate(), { addSuffix: true });
        }
    }
    if (doc.createdAt && doc.createdAt.toDate) {
        return formatDistanceToNow(doc.createdAt.toDate(), { addSuffix: true });
    }
    return 'N/A';
  }
  
  const getCurrentOffice = (doc: DocumentType) => {
    const currentLog = doc.history.find(log => log.officeId === doc.currentOfficeId);
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
                {type === 'sent' ? getCurrentOffice(doc) : doc.history[0]?.officeName}
            </TableCell>
            <TableCell className="text-right">{getLastUpdate(doc)}</TableCell>
             <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button aria-label="Open document actions menu" size="icon" variant="ghost">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Toggle menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuItem>View Details</DropdownMenuItem>
                  {type === 'received' && <DropdownMenuItem>Sign Document</DropdownMenuItem>}
                  {type === 'received' && <DropdownMenuItem className="text-destructive">Reject Document</DropdownMenuItem>}
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
