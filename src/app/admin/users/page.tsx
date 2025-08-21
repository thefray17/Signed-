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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react"

// Mock data
const users = [
    { id: 'admin01', name: 'Admin User', email: 'eballeskaye@gmail.com', office: 'IT Department', role: 'admin', status: 'approved' },
    { id: 'user123', name: 'John Doe', email: 'john.d@example.com', office: "Mayor's Office", role: 'user', status: 'approved' },
    { id: 'user456', name: 'Jane Smith', email: 'jane.s@example.com', office: 'Human Resources', role: 'co-admin', status: 'approved' },
    { id: 'user789', name: 'Peter Jones', email: 'peter.j@example.com', office: 'Accounting Office', role: 'user', status: 'pending_approval' },
    { id: 'user101', name: 'Mary Johnson', email: 'mary.j@example.com', office: 'IT Department', role: 'user', status: 'rejected' },
];

export default function UsersPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage Users</CardTitle>
        <CardDescription>
          View and manage all user accounts in the system.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead className="hidden md:table-cell">Office</TableHead>
              <TableHead className="hidden sm:table-cell">Role</TableHead>
              <TableHead className="hidden sm:table-cell">Status</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map(user => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="font-medium">{user.name}</div>
                  <div className="text-sm text-muted-foreground">{user.email}</div>
                </TableCell>
                <TableCell className="hidden md:table-cell">{user.office}</TableCell>
                <TableCell className="hidden sm:table-cell">
                    <Badge variant={user.role === 'admin' ? "default" : "secondary"}>{user.role}</Badge>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                    <Badge variant={user.status === 'approved' ? 'default' : user.status === 'rejected' ? 'destructive' : 'secondary'}>{user.status}</Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button aria-haspopup="true" size="icon" variant="ghost">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Toggle menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem>Edit</DropdownMenuItem>
                      <DropdownMenuItem>Change Role</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">Disable User</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
