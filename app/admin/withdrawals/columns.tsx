
"use client"

import { type ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { CheckCircle, MoreHorizontal, XCircle, Loader2 } from "lucide-react"
import { type WithdrawalRequest } from "@/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const statusVariantMap: Record<WithdrawalRequest['status'], "default" | "secondary" | "destructive"> = {
    pending: "secondary",
    completed: "default",
    rejected: "destructive",
}

export const getColumns = (
    onStatusChange: (withdrawalId: string, status: 'completed' | 'rejected') => void,
    isSubmitting: string | null
): ColumnDef<WithdrawalRequest>[] => [
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
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(row.original.amount)
  },
  {
    accessorKey: "upiId",
    header: "UPI ID",
  },
  {
    accessorKey: "requestDate",
    header: "Requested On",
    cell: ({ row }) => format(row.original.requestDate, "PPp")
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
        const status = row.original.status
        return <Badge variant={statusVariantMap[status]} className="capitalize">{status}</Badge>
    }
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const withdrawal = row.original
      const isCurrentSubmitting = isSubmitting === withdrawal.id

      if (withdrawal.status !== 'pending') {
        return (
            <div className="text-right text-muted-foreground text-sm">
                {withdrawal.processedDate ? `Processed on ${format(withdrawal.processedDate, "PP")}` : ''}
            </div>
        )
      }

      return (
        <div className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0" disabled={isCurrentSubmitting}>
                <span className="sr-only">Open menu</span>
                {isCurrentSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => onStatusChange(withdrawal.id, 'completed')} disabled={isCurrentSubmitting}>
                <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                Approve
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onStatusChange(withdrawal.id, 'rejected')} className="text-destructive focus:text-destructive" disabled={isCurrentSubmitting}>
                <XCircle className="mr-2 h-4 w-4" />
                Reject
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )
    },
  },
]
