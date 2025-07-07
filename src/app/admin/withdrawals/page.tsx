
"use client";

import { useState, useEffect } from "react";
import { WithdrawalsClient } from "./client";
import { getAllWithdrawalRequests } from "@/lib/firebase/firestore";
import { type WithdrawalRequest } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";

export default function ManageWithdrawalsPage() {
    const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchWithdrawals = async () => {
            setLoading(true);
            const allWithdrawals = await getAllWithdrawalRequests();
            // Sort by requestDate descending
            const sortedWithdrawals = allWithdrawals.sort((a, b) => (b.requestDate as Date).getTime() - (a.requestDate as Date).getTime());
            setWithdrawals(sortedWithdrawals);
            setLoading(false);
        };
        fetchWithdrawals();
    }, []);

    return (
        <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
            <h1 className="font-headline text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Manage Withdrawals
            </h1>
            <p className="mt-2 text-lg text-muted-foreground">
                Review, approve, or reject user withdrawal requests.
            </p>
            <div className="mt-8">
                {loading ? (
                    <WithdrawalsSkeleton />
                ) : (
                    <WithdrawalsClient initialWithdrawals={withdrawals} />
                )}
            </div>
        </div>
    );
}

const WithdrawalsSkeleton = () => (
    <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <div className="mt-4 space-y-2 rounded-md border p-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
        </div>
    </div>
);
