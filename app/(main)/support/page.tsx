"use client"

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/context/auth-context";
import { getUserSupportTickets } from "@/lib/firebase/firestore";
import type { SupportTicket } from "@/types";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PlusCircle, MessageSquare } from "lucide-react";

export default function MySupportTicketsPage() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      const fetchTickets = async () => {
        setLoading(true);
        const userTickets = await getUserSupportTickets(user.uid);
        setTickets(userTickets);
        setLoading(false);
      };
      fetchTickets();
    }
  }, [user]);

  if (loading) {
    return <TicketsSkeleton />;
  }

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="font-headline text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            My Support Tickets
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Track your conversations with our support team.
          </p>
        </div>
        <Button asChild>
          <Link href="/support/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Create New Ticket
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Issue</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.length > 0 ? (
                tickets.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell className="font-medium">{ticket.issueType}</TableCell>
                    <TableCell>
                      <Badge variant={ticket.status === 'solved' ? 'default' : 'secondary'} className="capitalize">
                        {ticket.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDistanceToNow(ticket.updatedAt, { addSuffix: true })}</TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/support/${ticket.id}`}>View Ticket</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-48 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <MessageSquare className="h-10 w-10"/>
                        <p className="font-semibold">No tickets found.</p>
                        <p className="text-sm">Click "Create New Ticket" to get started.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}


const TicketsSkeleton = () => (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
            <div className="space-y-2">
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-6 w-80" />
            </div>
            <Skeleton className="h-10 w-40" />
        </div>
        <Card>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead><Skeleton className="h-5 w-24" /></TableHead>
                            <TableHead><Skeleton className="h-5 w-24" /></TableHead>
                            <TableHead><Skeleton className="h-5 w-32" /></TableHead>
                            <TableHead className="text-right"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {[...Array(3)].map((_, i) => (
                            <TableRow key={i}>
                                <TableCell><Skeleton className="h-5 w-36" /></TableCell>
                                <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                                <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                                <TableCell className="text-right"><Skeleton className="h-8 w-24" /></TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
      </Card>
    </div>
);
