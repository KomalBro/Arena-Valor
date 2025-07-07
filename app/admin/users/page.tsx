
"use client";

import { useState, useEffect } from "react";
import { UsersClient } from "./client";
import { getAllUsers } from "@/lib/firebase/firestore";
import { type UserProfile } from "@/types";
import { useAuth } from "@/context/auth-context";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";

export default function ManageUsersPage() {
    const { userProfile } = useAuth();
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (userProfile?.role === 'admin') {
            const fetchUsers = async () => {
                setLoading(true);
                const allUsers = await getAllUsers();
                setUsers(allUsers);
                setLoading(false);
            };
            fetchUsers();
        }
    }, [userProfile]);

    return (
        <div className="space-y-6">
            <Alert>
                <Terminal className="h-4 w-4" />
                <AlertTitle>Welcome to Admin Demo!</AlertTitle>
                <AlertDescription>
                   We have disabled update and delete function for default records in demo version. So don&apos;t worry. Everything will work fine in live version. If you want to test then you can add your own records.
                </AlertDescription>
            </Alert>
            <div className="space-y-2">
                <h1 className="font-headline text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                    Users
                </h1>
                <p className="text-lg text-muted-foreground">
                    View and manage all registered users on the platform.
                </p>
            </div>
            {loading ? <UsersPageSkeleton /> : <UsersClient users={users} />}
        </div>
    );
}

const UsersPageSkeleton = () => (
    <div className="space-y-4">
        <div className="rounded-md border">
            <div className="flex h-12 items-center px-4 border-b">
                <Skeleton className="h-5 w-1/5" />
                <Skeleton className="h-5 w-1/5" />
                <Skeleton className="h-5 w-2/5" />
                <Skeleton className="h-5 w-1/5" />
            </div>
            <div>
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-4 p-4 border-b">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-4 w-1/2" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
        <div className="flex items-center justify-end space-x-2 py-4">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-16" />
        </div>
    </div>
);
