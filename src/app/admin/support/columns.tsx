
"use client"

import { type ColumnDef } from "@tanstack/react-table"
import { formatDistanceToNow } from "date-fns"
import { ArrowRight } from "lucide-react"
import { type SupportTicket } from "@/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

type ActionsCallbacks = {
    onView: (ticketId: string) => void;
};

export const getColumns = (callbacks: ActionsCallbacks): ColumnDef<SupportTicket>[] => [
  {
    accessorKey: "userName",
    header: "User",
     cell: ({ row }) => (
        <div>
            <div className="font-medium">{row.original.userName}</div>
            <div className="text-xs text-muted-foreground">{row.original.userEmail}</div>
        </div>
    )
  },
  {
    accessorKey: "issueType",
    header: "Issue",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
        const status = row.original.status
        return <Badge variant={status === 'open' ? 'secondary' : 'default'} className="capitalize">{status}</Badge>
    }
  },
  {
    accessorKey: "updatedAt",
    header: "Last Updated",
    cell: ({ row }) => formatDistanceToNow(row.original.updatedAt, { addSuffix: true })
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const ticket = row.original

      return (
        <div className="text-right">
            <Button variant="outline" size="sm" onClick={() => callbacks.onView(ticket.id)}>
                View <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
        </div>
      )
    },
  },
]
