
"use client"

import { useState } from "react"
import { type WithdrawalRequest, type WithdrawalStatus } from "@/types"
import { DataTable } from "@/components/ui/data-table"
import { getColumns } from "./columns"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { updateWithdrawalStatus } from "@/lib/firebase/firestore"

interface WithdrawalsClientProps {
  initialWithdrawals: WithdrawalRequest[]
}

export function WithdrawalsClient({ initialWithdrawals }: WithdrawalsClientProps) {
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>(initialWithdrawals)
  const [isSubmitting, setIsSubmitting] = useState<string | null>(null); // Track which item is submitting
  const { toast } = useToast()

  const handleStatusChange = async (withdrawalId: string, status: 'completed' | 'rejected') => {
    setIsSubmitting(withdrawalId);
    const withdrawal = withdrawals.find(w => w.id === withdrawalId);
    if (!withdrawal) {
        setIsSubmitting(null);
        return;
    }

    try {
      await updateWithdrawalStatus(withdrawalId, status, withdrawal.userId, withdrawal.amount);
      
      setWithdrawals(withdrawals.map(w => 
        w.id === withdrawalId ? { ...w, status, processedDate: new Date() } : w
      ));

      toast({
        title: `Request ${status}`,
        description: `The withdrawal request has been marked as ${status}.`
      })
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.message || "An unexpected error occurred."
      })
    } finally {
      setIsSubmitting(null);
    }
  }
  
  const columns = getColumns(handleStatusChange, isSubmitting);

  const filterWithdrawals = (status: WithdrawalStatus) => {
    return withdrawals.filter(w => w.status === status);
  }

  return (
    <Tabs defaultValue="pending" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="pending">Pending ({filterWithdrawals('pending').length})</TabsTrigger>
        <TabsTrigger value="completed">Completed ({filterWithdrawals('completed').length})</TabsTrigger>
        <TabsTrigger value="rejected">Rejected ({filterWithdrawals('rejected').length})</TabsTrigger>
      </TabsList>
      <TabsContent value="pending" className="mt-4">
        <DataTable columns={columns} data={filterWithdrawals('pending')} />
      </TabsContent>
       <TabsContent value="completed" className="mt-4">
        <DataTable columns={columns} data={filterWithdrawals('completed')} />
      </TabsContent>
       <TabsContent value="rejected" className="mt-4">
        <DataTable columns={columns} data={filterWithdrawals('rejected')} />
      </TabsContent>
    </Tabs>
  )
}
