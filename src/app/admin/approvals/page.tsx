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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// Mock data
const pendingUsers = [
    { id: 'user123', name: 'John Doe', email: 'john.d@example.com', office: "Mayor's Office", role: 'Clerk', date: '2023-10-26' },
    { id: 'user456', name: 'Jane Smith', email: 'jane.s@example.com', office: 'Human Resources', role: 'Officer', date: '2023-10-25' },
];

export default function ApprovalsPage() {
  return (
    <Tabs defaultValue="pending">
      <div className="flex items-center">
        <TabsList>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value="pending">
        <Card>
          <CardHeader>
            <CardTitle>Pending User Approvals</CardTitle>
            <CardDescription>
              Review and approve or reject new user registrations.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden md:table-cell">Requested Office</TableHead>
                  <TableHead className="hidden md:table-cell">Requested Role</TableHead>
                  <TableHead className="hidden sm:table-cell">Date Submitted</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingUsers.length > 0 ? pendingUsers.map(user => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="font-medium">{user.name}</div>
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{user.office}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant="outline">{user.role}</Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">{user.date}</TableCell>
                    <TableCell className="text-right">
                       <div className="flex gap-2 justify-end">
                            <Button variant="outline" size="sm">Reject</Button>
                            <Button size="sm">Approve</Button>
                       </div>
                    </TableCell>
                  </TableRow>
                )) : (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center h-24">
                            No pending approvals.
                        </TableCell>
                    </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
