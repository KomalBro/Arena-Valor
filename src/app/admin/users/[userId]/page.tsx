
"use client";

import { useState, useEffect } from "react";
import { notFound, useParams } from "next/navigation";
import Link from "next/link";
import { UserDetailsClient } from "./client";
import { getUserProfile, getUserTransactions } from "@/lib/firebase/firestore";
import { type UserProfile, type Transaction } from "@/types";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function UserDetailsPage() {
    const params = useParams();
    const userId = params.userId as string;

    const [user, setUser] = useState<UserProfile | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (userId) {
            const fetchData = async () => {
                setLoading(true);
                const [userProfile, userTransactions] = await Promise.all([
                    getUserProfile(userId),
                    getUserTransactions(userId)
                ]);

                if (!userProfile) {
                    notFound();
                    return;
                }

                setUser(userProfile);
                setTransactions(userTransactions);
                setLoading(false);
            };
            fetchData();
        }
    }, [userId]);

    if (loading) {
        return <UserDetailsSkeleton />;
    }
    
    if (!user) {
        // This case is handled by notFound(), but as a fallback.
        return <div>User not found.</div>
    }

    return (
        <div className="space-y-6">
             <Button asChild variant="outline" size="sm">
                <Link href="/admin/users">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to All Users
                </Link>
            </Button>
            <UserDetailsClient initialUser={user} initialTransactions={transactions} />
        </div>
    );
}


const UserDetailsSkeleton = () => (
    <div className="space-y-6">
        <Skeleton className="h-9 w-44" />
        <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-56 w-full" />
                <Skeleton className="h-80 w-full" />
            </div>
            <div className="lg:col-span-1 space-y-6">
                <Skeleton className="h-48 w-full" />
            </div>
        </div>
    </div>
);
