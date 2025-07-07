
"use client"

import { useState } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

import { type UserProfile, type Transaction } from "@/types"
import { updateUserProfile, adjustUserWallet } from "@/lib/firebase/firestore"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Loader2, DollarSign, Gamepad2, Trophy, WalletIcon } from "lucide-react"

interface UserDetailsClientProps {
  initialUser: UserProfile;
  initialTransactions: Transaction[];
}

const profileFormSchema = z.object({
  firstName: z.string().min(2, "Required"),
  lastName: z.string().min(2, "Required"),
  email: z.string().email(),
  mobileNumber: z.string().length(10),
  profilePhotoUrl: z.string().url().or(z.literal("")),
  status: z.enum(['active', 'banned']),
});

const walletFormSchema = z.object({
    amount: z.coerce.number().min(1, "Amount must be at least 1."),
    walletType: z.enum(['deposit', 'winnings']),
    reason: z.string().min(5, "Reason is required."),
})

type ProfileFormValues = z.infer<typeof profileFormSchema>;
type WalletFormValues = z.infer<typeof walletFormSchema>;

export function UserDetailsClient({ initialUser, initialTransactions }: UserDetailsClientProps) {
  const [user, setUser] = useState<UserProfile>(initialUser);
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);
  const [isSubmittingWallet, setIsSubmittingWallet] = useState(false);
  const { toast } = useToast();

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      mobileNumber: user.mobileNumber,
      profilePhotoUrl: user.profilePhotoUrl,
      status: user.status,
    },
  });

  const walletForm = useForm<WalletFormValues>({
      resolver: zodResolver(walletFormSchema),
      defaultValues: { amount: 0, walletType: 'deposit', reason: '' }
  })

  const onProfileSubmit = async (data: ProfileFormValues) => {
    setIsSubmittingProfile(true);
    try {
      await updateUserProfile(user.id, data);
      setUser(prev => ({ ...prev, ...data, name: `${data.firstName} ${data.lastName}` }));
      toast({ title: "Success", description: "User profile updated." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setIsSubmittingProfile(false);
    }
  };
  
  const onWalletSubmit = async (data: WalletFormValues) => {
      setIsSubmittingWallet(true);
      try {
        await adjustUserWallet(user.id, data.amount, data.walletType, data.reason);
        const updatedUser = {
            ...user,
            [data.walletType === 'deposit' ? 'depositBalance' : 'winningsBalance']: 
            user[data.walletType === 'deposit' ? 'depositBalance' : 'winningsBalance'] + data.amount
        };
        const newTransaction = {
            id: new Date().toISOString(),
            type: data.amount > 0 ? 'admin_credit' : 'admin_debit',
            amount: data.amount,
            description: data.reason,
            date: new Date()
        } as Transaction;

        setUser(updatedUser);
        setTransactions(prev => [newTransaction, ...prev]);
        walletForm.reset();
        toast({ title: "Success", description: "User wallet adjusted." });
      } catch (error: any) {
        toast({ variant: "destructive", title: "Error", description: error.message });
      } finally {
          setIsSubmittingWallet(false);
      }
  }

  const stats = [
    { title: "Tournaments Played", value: user.tournamentsPlayed, icon: <Gamepad2 className="h-6 w-6 text-muted-foreground" /> },
    { title: "Total Wins", value: user.wins, icon: <Trophy className="h-6 w-6 text-muted-foreground" /> },
    { title: "Winnings Balance", value: user.winningsBalance, icon: <DollarSign className="h-6 w-6 text-muted-foreground" />, currency: true },
    { title: "Deposit Balance", value: user.depositBalance, icon: <WalletIcon className="h-6 w-6 text-muted-foreground" />, currency: true },
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Member Details</CardTitle>
                </CardHeader>
                <CardContent>
                    <Form {...profileForm}>
                        <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField control={profileForm.control} name="firstName" render={({ field }) => (
                                    <FormItem><FormLabel>First Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={profileForm.control} name="lastName" render={({ field }) => (
                                    <FormItem><FormLabel>Last Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                 <FormField control={profileForm.control} name="email" render={({ field }) => (
                                    <FormItem><FormLabel>Email</FormLabel><FormControl><Input {...field} readOnly /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={profileForm.control} name="mobileNumber" render={({ field }) => (
                                    <FormItem><FormLabel>Mobile Number</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                 <FormField control={profileForm.control} name="profilePhotoUrl" render={({ field }) => (
                                    <FormItem className="md:col-span-2"><FormLabel>Profile Photo URL</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                 <FormField control={profileForm.control} name="status" render={({ field }) => (
                                    <FormItem><FormLabel>Status</FormLabel>
                                     <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            <SelectItem value="active">Active</SelectItem>
                                            <SelectItem value="banned">Banned</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage /></FormItem>
                                )} />
                             </div>
                            <Button type="submit" disabled={isSubmittingProfile}>
                                {isSubmittingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Update Profile
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle>Adjust Wallet</CardTitle>
                </CardHeader>
                <CardContent>
                    <Form {...walletForm}>
                        <form onSubmit={walletForm.handleSubmit(onWalletSubmit)} className="space-y-4">
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField control={walletForm.control} name="amount" render={({ field }) => (
                                    <FormItem><FormLabel>Amount (use negative for debit)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={walletForm.control} name="walletType" render={({ field }) => (
                                    <FormItem><FormLabel>Wallet</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Select wallet" /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            <SelectItem value="deposit">Deposit</SelectItem>
                                            <SelectItem value="winnings">Winnings</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage /></FormItem>
                                )} />
                             </div>
                             <FormField control={walletForm.control} name="reason" render={({ field }) => (
                                <FormItem><FormLabel>Reason / Comment</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <Button type="submit" disabled={isSubmittingWallet}>
                                {isSubmittingWallet && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Submit Adjustment
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Wallet History</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {transactions.length > 0 ? transactions.map(tx => (
                                <TableRow key={tx.id}>
                                    <TableCell>{format(tx.date instanceof Date ? tx.date : tx.date.toDate(), 'PP')}</TableCell>
                                    <TableCell><Badge variant="outline" className="capitalize">{tx.type.replace('_', ' ')}</Badge></TableCell>
                                    <TableCell>{tx.description}</TableCell>
                                    <TableCell className={cn("text-right font-semibold", tx.amount > 0 ? 'text-green-500' : 'text-red-500')}>
                                        {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(tx.amount)}
                                    </TableCell>
                                </TableRow>
                            )) : <TableRow><TableCell colSpan={4} className="text-center h-24">No transactions found.</TableCell></TableRow>}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

        </div>
        <div className="lg:col-span-1 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>{user.name}</CardTitle>
                    <CardDescription>{user.username}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     {stats.map(stat => (
                        <div key={stat.title} className="flex items-center justify-between border-b pb-2">
                             <div className="flex items-center gap-3">
                                {stat.icon}
                                <span className="text-sm font-medium text-muted-foreground">{stat.title}</span>
                             </div>
                             <span className="font-bold">
                                {stat.currency ? new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(stat.value) : stat.value}
                             </span>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    </div>
  )
}
