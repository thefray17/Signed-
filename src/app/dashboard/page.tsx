import Link from "next/link";
import { PlusCircle, ArrowUpRight, FileText, CheckCircle2, XCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
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

const recentDocuments = [
  { id: "DOC-001", title: "Budget Proposal 2024", status: "In Transit", office: "Mayor's Office", lastUpdate: "2 hours ago" },
  { id: "DOC-002", title: "HR Policy Update", status: "Signed", office: "HR Department", lastUpdate: "1 day ago" },
  { id: "DOC-003", title: "IT Infrastructure Plan", status: "Rejected", office: "Accounting", lastUpdate: "3 days ago" },
  { id: "DOC-004", title: "Community Event Permit", status: "Completed", office: "Clerk's Office", lastUpdate: "5 days ago" },
  { id: "DOC-005", title: "Annual Financial Report", status: "Draft", office: "My Drafts", lastUpdate: "1 week ago" },
];

export default function DashboardPage() {
  return (
    <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2">
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>New Document</CardTitle>
            <CardDescription>Start a new document routing process.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button size="sm" className="w-full">
              <PlusCircle className="h-4 w-4 mr-2" />
              Create Document
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl">12</CardTitle>
            <CardDescription>Documents In-Transit</CardDescription>
          </CardHeader>
          <CardContent>
             <div className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>Awaiting signature</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl">45</CardTitle>
            <CardDescription>Documents Completed</CardDescription>
          </CardHeader>
          <CardContent>
             <div className="text-xs text-muted-foreground flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-green-500" />
                <span>In the last 30 days</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl">3</CardTitle>
            <CardDescription>Documents Rejected</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
                <XCircle className="h-3 w-3 text-red-500" />
                <span>Requires your attention</span>
            </div>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader className="px-7">
          <CardTitle>Recent Documents</CardTitle>
          <CardDescription>
            An overview of your most recent document activities.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document Title</TableHead>
                <TableHead className="hidden sm:table-cell">Status</TableHead>
                <TableHead className="hidden md:table-cell">Current Office</TableHead>
                <TableHead className="text-right">Last Update</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentDocuments.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell>
                    <div className="font-medium">{doc.title}</div>
                    <div className="hidden text-sm text-muted-foreground md:inline">
                      {doc.id}
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge className="text-xs" variant={
                      doc.status === "Signed" || doc.status === "Completed" ? "default" :
                      doc.status === "Rejected" ? "destructive" : "secondary"
                    }>
                      {doc.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{doc.office}</TableCell>
                  <TableCell className="text-right">{doc.lastUpdate}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
         <CardFooter>
            <div className="text-xs text-muted-foreground">
                Showing <strong>1-5</strong> of <strong>23</strong> documents
            </div>
        </CardFooter>
      </Card>
    </div>
  );
}
