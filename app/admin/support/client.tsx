
"use client"

import { useState, useEffect } from "react"
import { type SupportTicket } from "@/types"
import { DataTable } from "@/components/ui/data-table"
import { getColumns } from "./columns"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useRouter } from "next/navigation"
import { getAllSupportTickets } from "@/lib/firebase/firestore"
import { Skeleton } from "@/components/ui/skeleton"

export function SupportClient() {
  const router = useRouter();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTickets = async () => {
      setLoading(true);
      const allTickets = await getAllSupportTickets();
      setTickets(allTickets);
      setLoading(false);
    };
    fetchTickets();
  }, []);
  
  const columns = getColumns({
      onView: (ticketId: string) => router.push(`/admin/support/${ticketId}`),
  });

  const filterTickets = (status: 'open' | 'solved') => {
    return tickets.filter(t => t.status === status);
  }

  if (loading) {
    return <SupportSkeleton />;
  }

  return (
    <Tabs defaultValue="open" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="open">Open ({filterTickets('open').length})</TabsTrigger>
        <TabsTrigger value="solved">Solved ({filterTickets('solved').length})</TabsTrigger>
      </TabsList>
      <TabsContent value="open" className="mt-4">
        <DataTable columns={columns} data={filterTickets('open')} />
      </TabsContent>
       <TabsContent value="solved" className="mt-4">
        <DataTable columns={columns} data={filterTickets('solved')} />
      </TabsContent>
    </Tabs>
  )
}

const SupportSkeleton = () => (
  <div className="space-y-4">
    <Skeleton className="h-10 w-full" />
    <div className="mt-4 space-y-2 rounded-md border p-4">
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-16 w-full" />
    </div>
  </div>
);
