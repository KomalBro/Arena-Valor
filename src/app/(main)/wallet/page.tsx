
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { appSettings } from "@/lib/mock-data";
import { type Transaction } from "@/types";
import {
  ArrowDown,
  ArrowUp,
  Banknote,
  Loader2,
  Plus,
  Trophy,
  WalletIcon,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/auth-context";
import { getUserTransactions, addFundsToWallet, createWithdrawalRequest } from "@/lib/firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";

const transactionTypeMap: Record<
  Transaction["type"],
  { icon: React.ReactNode; color: string }
> = {
  deposit: { icon: <ArrowUp className="h-4 w-4" />, color: "text-green-500" },
  withdrawal: {
    icon: <ArrowDown className="h-4 w-4" />,
    color: "text-red-500",
  },
  join_fee: {
    icon: <ArrowDown className="h-4 w-4" />,
    color: "text-red-500",
  },
  prize: { icon: <ArrowUp className="h-4 w-4" />, color: "text-green-500" },
  refund: {
    icon: <ArrowUp className="h-4 w-4" />,
    color: "text-yellow-500",
  },
  admin_credit: { icon: <ArrowUp className="h-4 w-4" />, color: "text-green-500" },
  admin_debit: { icon: <ArrowDown className="h-4 w-4" />, color: "text-red-500" },
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
}

export default function WalletPage() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog states
  const [isWithdrawDialogOpen, setIsWithdrawDialogOpen] = useState(false);
  const [isAddMoneyDialogOpen, setIsAddMoneyDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form states
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [addAmount, setAddAmount] = useState("");
  const [upiId, setUpiId] = useState("");

  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      const fetchTransactions = async () => {
        setLoading(true);
        const userTransactions = await getUserTransactions(user.uid);
        setTransactions(userTransactions);
        setLoading(false);
      };
      fetchTransactions();
    }
  }, [user]);

  const handleAddMoney = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(addAmount);

    if (!user || !userProfile) return;

    if (isNaN(amount) || amount <= 0) {
      toast({
        variant: "destructive",
        title: "Invalid Amount",
        description: "Please enter a valid amount to add.",
      });
      return;
    }
    
    setIsSubmitting(true);
    try {
      await addFundsToWallet(user.uid, amount);
      toast({
        title: "Funds Added",
        description: `${formatCurrency(amount)} has been added to your deposit balance.`,
      });
      setIsAddMoneyDialogOpen(false);
      setAddAmount("");
    } catch (error: any) {
       toast({
        variant: "destructive",
        title: "Failed to Add Funds",
        description: error.message || "An unexpected error occurred.",
      });
    } finally {
        setIsSubmitting(false);
    }
  };
  
  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !userProfile) return;
    
    const amount = parseFloat(withdrawAmount);

    if (isNaN(amount) || amount <= 0) {
      toast({
        variant: "destructive",
        title: "Invalid Amount",
        description: "Please enter a valid withdrawal amount.",
      });
      return;
    }
    if (amount < appSettings.minWithdrawal) {
      toast({
        variant: "destructive",
        title: "Amount Too Low",
        description: `Minimum withdrawal amount is ${formatCurrency(appSettings.minWithdrawal)}.`,
      });
      return;
    }
    if (amount > userProfile.winningsBalance) {
      toast({
        variant: "destructive",
        title: "Insufficient Winnings",
        description: "You can only withdraw from your winnings balance.",
      });
      return;
    }
    if (!upiId) {
        toast({
            variant: "destructive",
            title: "UPI ID Required",
            description: "Please enter your UPI ID or PhonePe number.",
        });
        return;
    }

    setIsSubmitting(true);
    try {
        await createWithdrawalRequest(user, userProfile, amount, upiId);
        toast({
            title: "Withdrawal Request Submitted",
            description: `Your request to withdraw ${formatCurrency(amount)} has been submitted for review.`,
        });
        setIsWithdrawDialogOpen(false);
        setWithdrawAmount("");
        setUpiId("");
    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Request Failed",
            description: error.message || "An unexpected error occurred.",
        });
    } finally {
        setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return <WalletSkeleton />;
  }

  if (!userProfile) {
    return (
      <div className="container mx-auto flex h-[60vh] flex-col items-center justify-center text-center">
        <Card className="max-w-md p-8">
            <CardHeader>
                <CardTitle className="text-2xl font-bold">Profile Not Found</CardTitle>
                <CardDescription>
                We couldn't load your user profile. This can happen if account creation was interrupted. Please try logging out and signing up again.
                </CardDescription>
            </CardHeader>
        </Card>
      </div>
    );
  }


  return (
    <>
      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="font-headline text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          My Wallet
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Manage your funds and view your transaction history.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Deposit Balance
              </CardTitle>
              <WalletIcon className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(userProfile.depositBalance)}
              </div>
              <p className="text-xs text-muted-foreground">
                Funds you've added. Non-withdrawable.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Winnings Balance
              </CardTitle>
              <Trophy className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(userProfile.winningsBalance)}
              </div>
              <p className="text-xs text-muted-foreground">
                Prizes you've won. Withdrawable.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 flex items-center gap-4">
          <Button className="w-full" onClick={() => setIsAddMoneyDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Money
          </Button>
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => setIsWithdrawDialogOpen(true)}
          >
            <Banknote className="mr-2 h-4 w-4" /> Withdraw Money
          </Button>
        </div>

        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={3} className="h-24 text-center">
                        <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                      </TableCell>
                    </TableRow>
                  ) : transactions.length > 0 ? (
                    transactions
                      .sort((a, b) => b.date.getTime() - a.date.getTime())
                      .map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell>{format(tx.date, "PP")}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div
                              className={cn(
                                "flex items-center gap-1",
                                transactionTypeMap[tx.type].color
                              )}
                            >
                              {transactionTypeMap[tx.type].icon}
                              <span className="capitalize font-medium">
                                {tx.type.replace("_", " ")}
                              </span>
                            </div>
                            <span className="text-muted-foreground">
                              - {tx.description}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell
                          className={cn(
                            "text-right font-semibold",
                            transactionTypeMap[tx.type].color
                          )}
                        >
                          {formatCurrency(Math.abs(tx.amount))}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                     <TableRow>
                      <TableCell colSpan={3} className="h-24 text-center">
                        No transactions yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Money Dialog */}
      <Dialog open={isAddMoneyDialogOpen} onOpenChange={setIsAddMoneyDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleAddMoney}>
            <DialogHeader>
              <DialogTitle>Add Money to Wallet</DialogTitle>
              <DialogDescription>
                Enter the amount you wish to add. This is a simulation and no real payment is required.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="add-amount" className="text-right">
                  Amount
                </Label>
                <Input
                  id="add-amount"
                  type="number"
                  value={addAmount}
                  onChange={(e) => setAddAmount(e.target.value)}
                  className="col-span-3"
                  placeholder="e.g., 500"
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={isSubmitting}>
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Add Funds
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Withdraw Dialog */}
      <Dialog
        open={isWithdrawDialogOpen}
        onOpenChange={setIsWithdrawDialogOpen}
      >
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleWithdraw}>
            <DialogHeader>
              <DialogTitle>Request Withdrawal</DialogTitle>
              <DialogDescription>
                Enter the amount you wish to withdraw from your winnings. Minimum withdrawal is {formatCurrency(appSettings.minWithdrawal)}.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="amount" className="text-right">
                  Amount
                </Label>
                <Input
                  id="amount"
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="col-span-3"
                  placeholder={`e.g. ${formatCurrency(userProfile.winningsBalance)}`}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="upiId" className="text-right">
                  UPI / PhonePe
                </Label>
                <Input
                  id="upiId"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="col-span-3"
                  placeholder="yourname@upi"
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={isSubmitting}>
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit Request
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

const WalletSkeleton = () => (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-6 w-1/2 mt-2" />
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
        </div>
        <div className="mt-6 flex items-center gap-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
        </div>
        <div className="mt-8">
            <Card>
                <CardHeader>
                    <Skeleton className="h-7 w-48" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                </CardContent>
            </Card>
        </div>
    </div>
)

    
    

    